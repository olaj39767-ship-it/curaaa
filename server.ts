import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import Fuse from 'fuse.js';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// ---------------------------------------------------------------------------
// Gemini client (only ever called when the local layer below doesn't match)
// ---------------------------------------------------------------------------
let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

const CURADECK_SYSTEM_INSTRUCTION = `You are Curadeck's AI Health Concierge, an automated healthcare logistics and platform navigation assistant for Curadeck (Nigeria PCN license #LA/8892).

CRITICAL MEDICAL, ETHICAL & REGULATORY MANDATES (STRICT NON-NEGOTIABLE SAFETY RULES):
1. ABSOLUTELY NO MEDICATION ADVISORY OR PRESCRIBING:
   - You MUST NOT provide clinical medical advice, diagnostic evaluations, medical treatment regimens, or individual medication advisory.
   - You MUST NOT compute, recommend, or prescribe drug dosages (e.g. NEVER state "take 2 tablets", "take 500mg every 8 hours", or "take this with food").
   - You MUST NOT instruct a user on what medicine they should take for their illness or symptoms.
   - If a user asks "What medicine should I take?", "What is the dosage of...?", or reports acute or chronic symptoms, clarify clearly and politely that Curadeck is an automated platform concierge and does not provide clinical medical advisories, diagnoses, or prescriptions.
2. NAVIGATION TO LICENSED HEALTHCARE PROFESSIONALS ONLY:
   - To get an accurate medical diagnosis, prescription, or clinical guidance: Guide the user to "Book a Consultation" with our licensed Nigerian General Practitioners, Pediatricians, or Specialists on Curadeck (live HD video starting from ₦2,500).
   - If the user has a doctor's prescription slip: Guide them to "Upload Prescription" so our PCN-licensed clinical pharmacist can review, verify authenticity, check interactions, and issue a quote.
   - If the user is looking to purchase authentic medications they have already been prescribed or OTC supplies: Direct them to the "Market Floor" (2,500+ NAFDAC-approved medications with cold-chain storage and 2-4h Lagos express delivery). Note that prescription-only drugs require a teleconference verification with a duty pharmacist for ₦500.
   - If the user seeks elderly care or home nursing: Direct them to "Hire a Care Nurse" (verified NMCN/PCN Registered Nurses from ₦12,000/day).
3. MANDATORY SAFETY DISCLAIMER:
   - Every response dealing with health inquiries, symptoms, or medications must include this explicit safety notice:
     "Notice: Curadeck Concierge provides platform navigation only and does not offer medical advice, clinical diagnoses, or medication advisories. Please consult a licensed doctor or pharmacist for medical decisions."
4. EMERGENCY PROTOCOL:
   - If the user describes severe emergencies (e.g., severe chest pain, inability to breathe, sudden paralysis, unconsciousness, profuse bleeding), immediately tell them to call emergency services or visit the nearest emergency room/hospital without delay.

Response format: You MUST respond in valid JSON with these exact fields:
{
  "reply": "Your polite, empathetic, and strictly non-prescriptive response in gentle markdown. Explain how Curadeck's licensed professionals and services can assist, without giving medical advice or dosages, and include the safety notice.",
  "recommendedAction": "BUY_MEDICINES" | "BOOK_CONSULTATION" | "UPLOAD_PRESCRIPTION" | "CARE_NURSES" | null,
  "actionLabel": "Short action button label (e.g. 'Consult a Licensed Doctor', 'Upload Slip for Pharmacist Review', 'Browse Market Floor') or null",
  "actionDetail": "Brief supporting note (e.g. 'Live video with Nigerian doctor from ₦2,500') or null",
  "suggestedPrompts": ["Short question 1", "Short question 2", "Short question 3"]
}`;

// ---------------------------------------------------------------------------
// Local deterministic layer — free, instant, always answers correctly against
// real inventory. This is the FIRST thing every message hits.
// ---------------------------------------------------------------------------

interface InventoryItem {
  name: string;
  genericName?: string;
  category?: string;
  price: number | string;
  unit?: string;
  inStock: boolean;
  stockCount?: number;
  prescriptionRequired?: boolean;
}

interface LocalReply {
  reply: string;
  recommendedAction: 'BUY_MEDICINES' | 'BOOK_CONSULTATION' | 'UPLOAD_PRESCRIPTION' | 'CARE_NURSES' | null;
  actionLabel: string | null;
  actionDetail: string | null;
  suggestedPrompts: string[];
  matched: boolean; // false = nothing confident matched here; caller decides whether to ask Gemini
}

const SAFETY_NOTICE =
  '*Notice: Curadeck Concierge provides platform navigation only and does not offer medical advice, clinical diagnoses, or medication advisories.*';

// Words to strip out of a message so what's left is (hopefully) just a product
// name. Deliberately generous — cheap to extend as you see real queries.
const FILLER = new RegExp(
  [
    'is there', 'do you have', 'do you sell', 'do you stock', 'got any', 'have any',
    'i need', 'i want', 'i am looking for', "i'm looking for", 'looking for',
    'where can i find', 'where can i get', 'can i get', 'can i buy', 'get me',
    'need to buy', 'want to buy', 'buy', 'find', 'need', 'want',
    'check', 'stock', 'available', 'availability',
    'how much', 'price of', 'cost of', 'price for', 'please',
  ].join('|'),
  'gi'
);

function extractQueryTerm(text: string): string {
  return text.replace(FILLER, ' ').replace(/\s+/g, ' ').trim();
}

function buildInventoryIndex(inventory: InventoryItem[]) {
  return new Fuse(inventory, {
    keys: ['name', 'genericName'],
    threshold: 0.35, // lower = stricter match
    ignoreLocation: true,
  });
}

// IMPORTANT: create a fresh RegExp every call. Reusing one `g`-flagged
// RegExp across .test() calls carries `lastIndex` state between calls and
// causes intermittent false negatives (works sometimes, silently fails
// other times, looks "random" from the outside).
function hasProductIntent(text: string): boolean {
  return new RegExp(FILLER.source, 'i').test(text);
}

// Words that mean "this is a symptom/clinical/logistics statement, not a
// product search" — these must always be free to reach the compliance
// branches in generateLocalReply below, even if the message also happens
// to contain an intent phrase like "i need" or "is there".
const SAFETY_KEYWORDS =
  /\b(malaria|coartem|lonart|amatem|fever|dosage|dose|prescription|\brx\b|slip|nurse|elderly|stroke|post-op|doctor|consult|sick|pain|diagnos|advice|child|delivery|lagos|shipping|hormonal|imbalance|symptom|infection|illness|disease|condition)\b/i;

function tryInventoryMatch(userMessage: string, inventory?: InventoryItem[]): LocalReply | null {
  if (!Array.isArray(inventory) || inventory.length === 0) return null;

  const intentSignal = hasProductIntent(userMessage);
  const safetySignal = SAFETY_KEYWORDS.test(userMessage);

  const term = extractQueryTerm(userMessage);
  if (term.length < 2) return null;

  const fuse = buildInventoryIndex(inventory);
  const results = fuse.search(term, { limit: 1 });

  if (results.length === 0) {
    // Only shortcut to a flat "not found" when the message is UNAMBIGUOUSLY
    // a product request: genuine intent phrasing present, AND no safety
    // keyword at all. "i need to see a doctor" has intent ("i need") but
    // also "doctor" — that must fall through to the doctor branch, not get
    // a catalog-miss message. A real product match (below) always wins
    // regardless of this, since that's a genuine, named item.
    if (!intentSignal || safetySignal) return null;
    const wordCount = term.split(' ').filter(Boolean).length;
    if (wordCount > 4) return null;

    return {
      reply: `I couldn't find "${term}" in the catalog right now, but our PCN-licensed pharmacists can try to source it for you. Upload a prescription slip or note with the details and we'll confirm availability and pricing within 30 minutes.\n\n${SAFETY_NOTICE}`,
      recommendedAction: 'UPLOAD_PRESCRIPTION',
      actionLabel: `Request "${term}"`,
      actionDetail: 'Pharmacists confirm sourcing within 30 mins',
      suggestedPrompts: ['Upload prescription slip', 'Browse medicine catalog', 'Book a doctor consultation'],
      matched: true,
    };
  }

  const med = results[0].item;
  const stock = med.stockCount !== undefined ? med.stockCount : med.inStock ? 50 : 0;
  const inStock = med.inStock && stock > 0;
  const priceStr = `₦${Number(med.price).toLocaleString()}`;

  if (inStock) {
    return {
      reply: `Yes! **${med.name}** is currently in stock. We have **${stock} units available** at **${priceStr}** per ${med.unit || 'pack'}.\n\nFast dispatch is available within 2-4 hours across Lagos Island and Mainland in cold-chain packaging.\n\n${SAFETY_NOTICE}`,
      recommendedAction: 'BUY_MEDICINES',
      actionLabel: `View ${med.name} in Market Floor`,
      actionDetail: `${priceStr} • ${stock} in stock`,
      suggestedPrompts: [`Add ${med.name} to cart`, 'Check other medicines in stock', 'How fast is Lagos delivery?'],
      matched: true,
    };
  }

  return {
    reply: `**${med.name}** is currently out of stock (0 units remaining in our central pharmacy inventory). However, our PCN-licensed clinical pharmacists can procure it for you if you upload your doctor's prescription slip.\n\n${SAFETY_NOTICE}`,
    recommendedAction: 'UPLOAD_PRESCRIPTION',
    actionLabel: 'Upload Prescription Slip to Procure',
    actionDetail: "Our duty pharmacists will source it within 30 mins",
    suggestedPrompts: ['Upload doctor prescription slip', 'Browse in-stock medications', 'Consult a doctor online'],
    matched: true,
  };
}

function generateLocalReply(userMessage: string, inventory?: InventoryItem[]): LocalReply {
  const lower = userMessage.toLowerCase();

  // 1. Only genuine product-seeking phrasing attempts a catalog match, and
  //    even then backs off for symptom/clinical statements (see the guard
  //    inside tryInventoryMatch above).
  const inventoryMatch = tryInventoryMatch(userMessage, inventory);
  if (inventoryMatch) return inventoryMatch;

  // 2. Dosage / "what should I take" — must never get a real dosage answer.
  if (lower.includes('dosage') || lower.includes('dose') || lower.includes('how many') || lower.includes('how much') || lower.includes('take')) {
    return {
      reply:
        "Curadeck Concierge is an automated platform guide and does not provide medication dosage instructions or clinical medical advisory. Medication dosing must be determined by a qualified physician or licensed pharmacist based on patient age, weight, and clinical history.\n\nTo receive safe, personalized guidance, please book a session with our on-duty licensed doctor or connect with our duty pharmacist.\n\n" +
        SAFETY_NOTICE,
      recommendedAction: 'BOOK_CONSULTATION',
      actionLabel: 'Consult a Licensed Doctor',
      actionDetail: 'Personalized evaluation & e-prescription from ₦2,500',
      suggestedPrompts: ['How do I book a doctor session?', 'Talk to a PCN duty pharmacist', 'Upload doctor prescription'],
      matched: true,
    };
  }

  // 3. Malaria / fever — steer to diagnosis, don't self-serve antimalarials.
  if (lower.includes('malaria') || lower.includes('coartem') || lower.includes('lonart') || lower.includes('amatem') || lower.includes('fever')) {
    return {
      reply:
        "Curadeck stocks authentic, NAFDAC-registered malaria medications on our Market Floor for patients with a verified prescription or clinical recommendation. Because malaria symptoms overlap with several other acute illnesses, we do not provide medical diagnosis or drug advisories.\n\nWe strongly recommend consulting a licensed medical practitioner to confirm your diagnosis before starting antimalarial therapy.\n\n" +
        SAFETY_NOTICE,
      recommendedAction: 'BOOK_CONSULTATION',
      actionLabel: 'Book Doctor Consultation',
      actionDetail: 'Live HD video • Starting from ₦2,500',
      suggestedPrompts: ['See available doctors now', 'Browse Market Floor catalog', 'How fast is Lagos delivery?'],
      matched: true,
    };
  }

  // 4. General symptoms / "see a doctor" intent — includes hormonal/other
  //    condition language so bare health complaints route to a doctor.
  if (
    lower.includes('doctor') || lower.includes('consult') || lower.includes('sick') ||
    lower.includes('pain') || lower.includes('diagnos') || lower.includes('advice') ||
    lower.includes('child') || lower.includes('hormonal') || lower.includes('imbalance') ||
    lower.includes('symptom') || lower.includes('infection') || lower.includes('illness') ||
    lower.includes('disease') || lower.includes('condition')
  ) {
    return {
      reply:
        "I understand you are seeking medical care. Curadeck does not provide automated clinical diagnosis or medical advisory. For your safety and peace of mind, our platform connects you with licensed Nigerian General Practitioners and Pediatricians for live HD video teleconsultations starting at ₦2,500.\n\nA licensed physician can review your symptoms, provide an official diagnosis, and issue an e-prescription.\n\n*Notice: In a medical emergency, please visit the nearest hospital immediately.*",
      recommendedAction: 'BOOK_CONSULTATION',
      actionLabel: 'Book Doctor Consultation',
      actionDetail: 'Licensed Nigerian Doctors • Starting from ₦2,500',
      suggestedPrompts: ['See available doctors today', 'How does a teleconference work?', 'Upload existing prescription'],
      matched: true,
    };
  }

  // 5. Prescription upload.
  if (lower.includes('rx') || lower.includes('prescription') || lower.includes('slip') || lower.includes('doctor paper') || lower.includes('whatsapp') || lower.includes('upload')) {
    return {
      reply:
        "You can securely upload your doctor's slip or photo of your prescription. In compliance with Nigerian PCN regulations, every prescription is manually reviewed by a licensed clinical pharmacist who verifies the dosage, checks for interactions, and provides an itemized quote via WhatsApp within 30 minutes.\n\n*Notice: Prescription medications require verification by a licensed PCN pharmacist.*",
      recommendedAction: 'UPLOAD_PRESCRIPTION',
      actionLabel: 'Upload Slip for Pharmacist Review',
      actionDetail: 'Verified by PCN Pharmacists within 30 mins',
      suggestedPrompts: ['How does the ₦500 teleconference work?', 'Can I order over-the-counter medicine?', 'How fast is Lagos delivery?'],
      matched: true,
    };
  }

  // 6. Home care / nurses.
  if (lower.includes('nurse') || lower.includes('elderly') || lower.includes('home care') || lower.includes('stroke') || lower.includes('post-op')) {
    return {
      reply:
        "Curadeck provides verified, PCN/NMCN-accredited Registered Nurses (RN) for in-home medical care across Lagos and major cities. Our nurses specialize in elderly companionship, post-operative care, stroke rehabilitation, and catheter management. Daily care shifts start at ₦12,000.\n\n*Notice: Curadeck nurses provide in-person clinical care under physician oversight.*",
      recommendedAction: 'CARE_NURSES',
      actionLabel: 'Request a Home Care Nurse',
      actionDetail: 'Vetted Registered Nurses • Daily shifts from ₦12,000',
      suggestedPrompts: ['What procedures do home nurses handle?', 'Can I book a nurse for overnight care?', 'Check nurse availability in Lagos'],
      matched: true,
    };
  }

  // 7. Delivery / logistics.
  if (lower.includes('delivery') || lower.includes('lagos') || lower.includes('speed') || lower.includes('shipping')) {
    return {
      reply:
        "Curadeck offers express same-day delivery (2 to 4 hours) across Lagos Island and Mainland for in-stock medications. All items are dispatched in temperature-controlled cold-chain packaging. Tracked nationwide delivery across all 36 Nigerian states arrives in 24 to 48 hours.\n\n*Notice: Prescription-required drugs require clinical verification before dispatch.*",
      recommendedAction: 'BUY_MEDICINES',
      actionLabel: 'Shop Market Floor with Fast Delivery',
      actionDetail: '2-4h dispatch across Lagos • 24-48h nationwide',
      suggestedPrompts: ['Browse medicine catalog', 'Book a doctor consultation', 'Upload prescription slip'],
      matched: true,
    };
  }

  // 8. Greeting.
  if (/^\s*(hi|hello|hey|good (morning|afternoon|evening))\s*[!.]?\s*$/i.test(userMessage)) {
    return {
      reply: "Hey! I can check medicine stock, book a doctor, or take a prescription upload. What do you need?",
      recommendedAction: null,
      actionLabel: null,
      actionDetail: null,
      suggestedPrompts: ['Is Coartem in stock?', 'Book a doctor teleconsultation', 'Upload doctor prescription'],
      matched: true,
    };
  }

  // Nothing local matched — genuinely open-ended. Caller may try Gemini.
  return {
    reply:
      "Welcome to Curadeck! I'm your healthcare platform concierge. We help you access authentic NAFDAC-approved medications, schedule virtual video consultations with licensed Nigerian doctors, or upload your doctor's slip for pharmacist review on WhatsApp.\n\n" +
      SAFETY_NOTICE,
    recommendedAction: 'BUY_MEDICINES',
    actionLabel: 'Browse Medicine Catalog',
    actionDetail: '2,500+ verified drugs • PCN Accredited',
    suggestedPrompts: ['How do I buy medicines?', 'Book a doctor consultation', 'Upload doctor prescription'],
    matched: false,
  };
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history, inventory } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    // --- 1. Local deterministic layer first: free, instant, zero quota use ---
    const local = generateLocalReply(message, inventory);
    console.log(
      `[chat v4] "${message}" -> matched=${local.matched} intent=${hasProductIntent(message)} safety=${SAFETY_KEYWORDS.test(message)} reply="${local.reply.slice(0, 50)}..."`
    );

    if (local.matched) {
      const { matched, ...payload } = local;
      res.json({ ...payload, source: 'local' });
      return;
    }

    // --- 2. Only genuinely unmatched queries reach Gemini ---
    const ai = getGeminiClient();

    if (ai) {
      try {
        const contents: Array<{ role: 'user' | 'model'; parts: [{ text: string }] }> = [];

        if (Array.isArray(history) && history.length > 0) {
          const recentHistory = history.slice(-6);
          for (const item of recentHistory) {
            if (item && item.text && (item.role === 'user' || item.role === 'model')) {
              contents.push({ role: item.role, parts: [{ text: item.text }] });
            }
          }
        }

        contents.push({ role: 'user', parts: [{ text: message.trim() }] });

        let dynamicInstruction = CURADECK_SYSTEM_INSTRUCTION;
        if (Array.isArray(inventory) && inventory.length > 0) {
          const inventorySummary = inventory
            .slice(0, 30)
            .map((m: any) => {
              const stock = m.stockCount !== undefined ? m.stockCount : m.inStock ? 50 : 0;
              const status = m.inStock && stock > 0 ? `IN STOCK (${stock} units available)` : 'OUT OF STOCK (0 units)';
              return `- ${m.name || 'Medication'} (${m.category || 'General'}): ${status} at ₦${Number(m.price || 0).toLocaleString()} per ${m.unit || 'unit'}${m.prescriptionRequired ? ' [Prescription Required]' : ' [OTC]'}`;
            })
            .join('\n');

          dynamicInstruction += `\n\nREAL-TIME LIVE PHARMACY INVENTORY & STOCK LEVELS:\n${inventorySummary}\n\nSTOCK CHECKING RULES:\n- When a user asks whether a medication or item is available, in stock, or what its price/stock quantity is, reference the real-time stock levels above.\n- If the item is IN STOCK, confirm availability, unit price in Naira (₦), available units, and mention fast Lagos express delivery.\n- If the item is OUT OF STOCK, clearly state that it is temporarily out of stock in our central warehouse, but our PCN-licensed pharmacists can procure it if they upload a doctor's prescription slip.\n- Always include the mandatory non-advisory safety disclaimer.`;
        }

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents,
          config: {
            systemInstruction: dynamicInstruction,
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        });

        const rawText = response.text?.trim();

        if (rawText) {
          try {
            const parsed = JSON.parse(rawText);
            res.json({
              reply: parsed.reply || rawText,
              recommendedAction: parsed.recommendedAction || null,
              actionLabel: parsed.actionLabel || null,
              actionDetail: parsed.actionDetail || null,
              suggestedPrompts: Array.isArray(parsed.suggestedPrompts) ? parsed.suggestedPrompts : [],
              source: 'gemini',
            });
            return;
          } catch {
            res.json({
              reply: rawText,
              recommendedAction: null,
              actionLabel: null,
              actionDetail: null,
              suggestedPrompts: ['Buy medicines', 'Book consultation', 'Upload prescription'],
              source: 'gemini-raw',
            });
            return;
          }
        }
      } catch (geminiError: any) {
        console.warn('Gemini API call returned an error, falling back gracefully:', geminiError?.message || geminiError);
        // fall through to the local "didn't match" response below
      }
    }

    // --- 3. Gemini unavailable, errored, or not configured: use the local
    //         unmatched response so the chat still says something sensible ---
    const { matched, ...payload } = local;
    res.json({ ...payload, source: 'fallback' });
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({
      reply: "I'm experiencing a brief connection delay. Please select one of our quick options below or browse our Market Floor directly.",
      recommendedAction: 'BUY_MEDICINES',
      actionLabel: 'Go to Market Floor',
      actionDetail: 'Browse all medications',
      suggestedPrompts: ['Buy medicines', 'Book a consultation', 'Upload prescription'],
      source: 'error-fallback',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Curadeck Health server running on port ${PORT} [server.ts v4 — request-to-source flow]`);
  });
}

startServer();