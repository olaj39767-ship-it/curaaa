import Fuse from 'fuse.js';
import { GoogleGenAI } from '@google/genai';

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

export interface InventoryItem {
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

export interface ChatResponsePayload {
  reply: string;
  recommendedAction: 'BUY_MEDICINES' | 'BOOK_CONSULTATION' | 'UPLOAD_PRESCRIPTION' | 'CARE_NURSES' | null;
  actionLabel: string | null;
  actionDetail: string | null;
  suggestedPrompts: string[];
  source: 'local' | 'gemini' | 'gemini-raw' | 'fallback';
}

export interface HistoryItem {
  role: 'user' | 'model';
  text: string;
}

const SAFETY_NOTICE =
  '*Notice: Curadeck Concierge provides platform navigation only and does not offer medical advice, clinical diagnoses, or medication advisories.*';

// Individual stopwords to strip token-by-token — far more robust than
// matching exact phrases, since real messages vary ("do u have", "do you
// have", "got", "you guys have"...) in ways a fixed phrase list can't cover.
const STOPWORDS = new Set([
  'is', 'there', 'do', 'does', 'did', 'you', 'u', 'ur', 'guys', 'have', 'has',
  'any', 'are', 'can', 'i', 'im', "i'm", 'get', 'got', 'me', 'need', 'needs',
  'needed', 'want', 'wants', 'wanted', 'looking', 'look', 'for', 'a', 'an',
  'the', 'to', 'buy', 'purchase', 'sell', 'check', 'stock', 'available',
  'availability', 'please', 'pls', 'plz', 'abeg', 'how', 'much', 'price',
  'cost', 'of', 'on', 'mean', 'meant', 'about', 'also', 'too', 'sef',
]);

// Words that signal "this message is a product request" — checked as whole
// words, not exact phrases, so "do u have" and "do you have" both count.
const INTENT_WORDS = [
  'have', 'need', 'want', 'buy', 'get', 'check', 'stock', 'available',
  'price', 'cost', 'looking', 'find', 'purchase', 'order', 'sell', 'got',
];

function cleanTerm(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !STOPWORDS.has(w))
    .join(' ')
    .trim();
}

// Splits a message into separate product candidates on "or" / "and" /
// commas / slashes, so "panadol or panadol extra" is checked as TWO
// candidates instead of one garbled search term that matches nothing.
function splitCandidates(message: string): string[] {
  return message
    .split(/\b(?:or|and)\b|[,/]/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildInventoryIndex(inventory: InventoryItem[]) {
  return new Fuse(inventory, {
    keys: ['name', 'genericName'],
    threshold: 0.35, // lower = stricter match
    ignoreLocation: true,
  });
}

// IMPORTANT: create a fresh RegExp every call for any `g`-flagged pattern —
// reusing one across .test() calls carries `lastIndex` state between calls
// and causes intermittent false negatives (works sometimes, silently fails
// other times, looks "random" from the outside).
function hasProductIntent(text: string): boolean {
  const lower = text.toLowerCase();
  return INTENT_WORDS.some((w) => new RegExp(`\\b${w}\\b`, 'i').test(lower));
}

// Words that mean "this is a symptom/clinical/logistics statement, not a
// product search" — these must always be free to reach the compliance
// branches in generateLocalReply below, even if the message also happens
// to contain an intent phrase like "i need" or "is there".
const SAFETY_KEYWORDS =
  /\b(malaria|coartem|lonart|amatem|fever|dosage|doses?|prescription|rx|slip|nurse|elderly|stroke|post-op|doctor|consult\w*|pharmacist\w*|sick|pain\w*|headache\w*|migraine\w*|diagnos\w*|advice|child\w*|delivery|lagos|shipping|hormon\w*|imbalance\w*|symptom\w*|infect\w*|illness\w*|disease\w*|condition\w*|drugs?|medicat\w*|medicine\w*|blood\s*pressure|bp|hypertension\w*)\b/i;

function tryInventoryMatch(userMessage: string, inventory?: InventoryItem[]): LocalReply | null {
  if (!Array.isArray(inventory) || inventory.length === 0) return null;

  const intentSignal = hasProductIntent(userMessage);
  const safetySignal = SAFETY_KEYWORDS.test(userMessage);

  const candidates = splitCandidates(userMessage)
    .map(cleanTerm)
    .filter((t) => t.length >= 2);
  if (candidates.length === 0) return null;

  const fuse = buildInventoryIndex(inventory);
  const hitsByName = new Map<string, InventoryItem>();

  for (const term of candidates) {
    const results = fuse.search(term, { limit: 1 });
    if (results.length > 0) {
      hitsByName.set(results[0].item.name, results[0].item);
    }
  }

  if (hitsByName.size === 0) {
    if (!intentSignal || safetySignal) return null;
    const maxWords = Math.max(...candidates.map((c) => c.split(' ').filter(Boolean).length));
    if (maxWords > 5) return null;

    const displayTerm = candidates.join(' / ');
    return {
      reply: `I couldn't find "${displayTerm}" in the catalog right now, but our PCN-licensed pharmacists can try to source it for you. Upload a prescription slip or note with the details and we'll confirm availability and pricing within 30 minutes.\n\n${SAFETY_NOTICE}`,
      recommendedAction: 'UPLOAD_PRESCRIPTION',
      actionLabel: `Request "${displayTerm}"`,
      actionDetail: 'Pharmacists confirm sourcing within 30 mins',
      suggestedPrompts: ['Upload prescription slip', 'Browse medicine catalog', 'Book a doctor consultation'],
      matched: true,
    };
  }

  const matches = Array.from(hitsByName.values());

  if (matches.length === 1) {
    const med = matches[0];
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

  const lines = matches.map((med) => {
    const stock = med.stockCount !== undefined ? med.stockCount : med.inStock ? 50 : 0;
    const inStock = med.inStock && stock > 0;
    const priceStr = `₦${Number(med.price).toLocaleString()}`;
    return inStock
      ? `✅ **${med.name}** — in stock, ${stock} units at ${priceStr} per ${med.unit || 'pack'}`
      : `⛔ **${med.name}** — currently out of stock`;
  });

  return {
    reply: `Here's what I found:\n\n${lines.join('\n')}\n\nFast dispatch is available within 2-4 hours across Lagos Island and Mainland in cold-chain packaging.\n\n${SAFETY_NOTICE}`,
    recommendedAction: 'BUY_MEDICINES',
    actionLabel: 'View in Market Floor',
    actionDetail: `${matches.length} items found`,
    suggestedPrompts: ['Add these to cart', 'Check delivery time', 'Browse full catalog'],
    matched: true,
  };
}

function generateLocalReply(userMessage: string, inventory?: InventoryItem[]): LocalReply {
  const lower = userMessage.toLowerCase();

  const inventoryMatch = tryInventoryMatch(userMessage, inventory);
  if (inventoryMatch) return inventoryMatch;

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

  if (lower.includes('pharmacist')) {
    return {
      reply:
        "Our PCN-licensed duty pharmacists are available for a ₦500 teleconference to verify medications, check interactions, or answer questions about something in our catalog. Upload a prescription slip (or just note the medication name) and a pharmacist will follow up.\n\n" +
        SAFETY_NOTICE,
      recommendedAction: 'UPLOAD_PRESCRIPTION',
      actionLabel: 'Start Pharmacist Review',
      actionDetail: '₦500 duty pharmacist teleconference',
      suggestedPrompts: ['Upload prescription slip', 'Book a doctor instead', 'Browse medicine catalog'],
      matched: true,
    };
  }

  if (
    lower.includes('doctor') || lower.includes('consult') || lower.includes('sick') ||
    lower.includes('pain') || lower.includes('diagnos') || lower.includes('advice') ||
    lower.includes('child') || lower.includes('hormonal') || lower.includes('imbalance') ||
    lower.includes('symptom') || lower.includes('infection') || lower.includes('illness') ||
    lower.includes('disease') || lower.includes('condition') || lower.includes('headache') ||
    lower.includes('migraine') || lower.includes('blood pressure') || lower.includes('hypertension') ||
    /\bbp\b/i.test(lower) || lower.includes('drug')
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

export { hasProductIntent, SAFETY_KEYWORDS };

// ---------------------------------------------------------------------------
// Single entry point both the local dev Express server and the Vercel
// serverless function call — keeps behavior identical between the two.
// ---------------------------------------------------------------------------
export async function handleChatRequest(
  message: string,
  history: HistoryItem[] | undefined,
  inventory: InventoryItem[] | undefined
): Promise<ChatResponsePayload> {
  const local = generateLocalReply(message, inventory);
  console.log(
    `[chat] "${message}" -> matched=${local.matched} intent=${hasProductIntent(message)} safety=${SAFETY_KEYWORDS.test(message)} reply="${local.reply.slice(0, 50)}..."`
  );

  if (local.matched) {
    const { matched, ...payload } = local;
    return { ...payload, source: 'local' };
  }

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
          return {
            reply: parsed.reply || rawText,
            recommendedAction: parsed.recommendedAction || null,
            actionLabel: parsed.actionLabel || null,
            actionDetail: parsed.actionDetail || null,
            suggestedPrompts: Array.isArray(parsed.suggestedPrompts) ? parsed.suggestedPrompts : [],
            source: 'gemini',
          };
        } catch {
          return {
            reply: rawText,
            recommendedAction: null,
            actionLabel: null,
            actionDetail: null,
            suggestedPrompts: ['Buy medicines', 'Book consultation', 'Upload prescription'],
            source: 'gemini-raw',
          };
        }
      }
    } catch (geminiError: any) {
      console.warn('Gemini API call returned an error, falling back gracefully:', geminiError?.message || geminiError);
      // fall through to the local "didn't match" response below
    }
  }

  const { matched, ...payload } = local;
  return { ...payload, source: 'fallback' };
}