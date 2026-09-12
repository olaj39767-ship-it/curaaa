import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client with server-side environment variable
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

// Helper: Contextual fallback if Gemini API is offline or key is unconfigured
function generateFallbackResponse(userMessage: string, inventory?: any[]) {
  const lower = userMessage.toLowerCase();

  // 1. Check live inventory stock if user asks about a specific medication or stock inquiry
  if (Array.isArray(inventory) && inventory.length > 0) {
    const isAskingStockOrPrice = 
      lower.includes('stock') || 
      lower.includes('available') || 
      lower.includes('have') || 
      lower.includes('left') || 
      lower.includes('price') || 
      lower.includes('cost') ||
      lower.includes('buy') || 
      lower.includes('get') ||
      lower.includes('count') ||
      lower.includes('much') ||
      lower.includes('quantity');

    // Try matching by exact product name or first two keywords
    const matchedMed = inventory.find(m => {
      if (!m || !m.name) return false;
      const medLower = m.name.toLowerCase();
      const primaryWord = medLower.split(' ')[0];
      return lower.includes(medLower) || (primaryWord.length >= 3 && lower.includes(primaryWord));
    });

    if (matchedMed && (isAskingStockOrPrice || lower.includes(matchedMed.name.toLowerCase().split(' ')[0]))) {
      const stock = matchedMed.stockCount !== undefined ? matchedMed.stockCount : (matchedMed.inStock ? 50 : 0);
      const inStock = matchedMed.inStock && stock > 0;

      if (inStock) {
        return {
          reply: `Yes! **${matchedMed.name}** is currently in stock. We have **${stock} units available** at **₦${Number(matchedMed.price).toLocaleString()}** per ${matchedMed.unit || 'pack'}.\n\nFast dispatch is available within 2-4 hours across Lagos Island and Mainland in cold-chain packaging.\n\n*Notice: Curadeck Concierge provides platform navigation only and does not offer medical advice.*`,
          recommendedAction: 'BUY_MEDICINES',
          actionLabel: `View ${matchedMed.name} in Market Floor`,
          actionDetail: `₦${Number(matchedMed.price).toLocaleString()} • ${stock} in stock`,
          suggestedPrompts: [
            `Add ${matchedMed.name} to cart`,
            'Check other medicines in stock',
            'How fast is Lagos delivery?'
          ]
        };
      } else {
        return {
          reply: `**${matchedMed.name}** is currently out of stock (0 units remaining in our central pharmacy inventory). However, our PCN-licensed clinical pharmacists can procure it for you if you upload your doctor's prescription slip.\n\n*Notice: Curadeck Concierge provides platform navigation only.*`,
          recommendedAction: 'UPLOAD_PRESCRIPTION',
          actionLabel: 'Upload Prescription Slip to Procure',
          actionDetail: 'Our duty pharmacists will source it within 30 mins',
          suggestedPrompts: [
            'Upload doctor prescription slip',
            'Browse in-stock medications',
            'Consult a doctor online'
          ]
        };
      }
    }
  }

  if (lower.includes('dosage') || lower.includes('dose') || lower.includes('how many') || lower.includes('how much') || lower.includes('take')) {
    return {
      reply: "Curadeck Concierge is an automated platform guide and does not provide medication dosage instructions or clinical medical advisory. Medication dosing must be determined by a qualified physician or licensed pharmacist based on patient age, weight, and clinical history.\n\nTo receive safe, personalized guidance, please book a session with our on-duty licensed doctor or connect with our duty pharmacist.\n\n*Notice: Curadeck does not offer medical advice, diagnoses, or medication advisories.*",
      recommendedAction: 'BOOK_CONSULTATION',
      actionLabel: 'Consult a Licensed Doctor',
      actionDetail: 'Personalized evaluation & e-prescription from ₦2,500',
      suggestedPrompts: [
        'How do I book a doctor session?',
        'Talk to a PCN duty pharmacist',
        'Upload doctor prescription'
      ]
    };
  }

  if (lower.includes('malaria') || lower.includes('coartem') || lower.includes('lonart') || lower.includes('amatem') || lower.includes('fever')) {
    return {
      reply: "Curadeck stocks authentic, NAFDAC-registered malaria medications on our Market Floor for patients with a verified prescription or clinical recommendation. Because malaria symptoms overlap with several other acute illnesses, we do not provide medical diagnosis or drug advisories.\n\nWe strongly recommend consulting a licensed medical practitioner to confirm your diagnosis before starting antimalarial therapy.\n\n*Notice: Curadeck Concierge provides platform navigation only and does not offer medical advice.*",
      recommendedAction: 'BOOK_CONSULTATION',
      actionLabel: 'Book Doctor Consultation',
      actionDetail: 'Live HD video • Starting from ₦2,500',
      suggestedPrompts: [
        'See available doctors now',
        'Browse Market Floor catalog',
        'How fast is Lagos delivery?'
      ]
    };
  }

  if (lower.includes('doctor') || lower.includes('consult') || lower.includes('sick') || lower.includes('pain') || lower.includes('diagnos') || lower.includes('advice') || lower.includes('child')) {
    return {
      reply: "I understand you are seeking medical care. Curadeck does not provide automated clinical diagnosis or medical advisory. For your safety and peace of mind, our platform connects you with licensed Nigerian General Practitioners and Pediatricians for live HD video teleconsultations starting at ₦2,500.\n\nA licensed physician can review your symptoms, provide an official diagnosis, and issue an e-prescription.\n\n*Notice: In a medical emergency, please visit the nearest hospital immediately.*",
      recommendedAction: 'BOOK_CONSULTATION',
      actionLabel: 'Book Doctor Consultation',
      actionDetail: 'Licensed Nigerian Doctors • Starting from ₦2,500',
      suggestedPrompts: [
        'See available doctors today',
        'How does a teleconference work?',
        'Upload existing prescription'
      ]
    };
  }

  if (lower.includes('rx') || lower.includes('prescription') || lower.includes('slip') || lower.includes('doctor paper') || lower.includes('whatsapp') || lower.includes('upload')) {
    return {
      reply: "You can securely upload your doctor's slip or photo of your prescription. In compliance with Nigerian PCN regulations, every prescription is manually reviewed by a licensed clinical pharmacist who verifies the dosage, checks for interactions, and provides an itemized quote via WhatsApp within 30 minutes.\n\n*Notice: Prescription medications require verification by a licensed PCN pharmacist.*",
      recommendedAction: 'UPLOAD_PRESCRIPTION',
      actionLabel: 'Upload Slip for Pharmacist Review',
      actionDetail: 'Verified by PCN Pharmacists within 30 mins',
      suggestedPrompts: [
        'How does the ₦500 teleconference work?',
        'Can I order over-the-counter medicine?',
        'How fast is Lagos delivery?'
      ]
    };
  }

  if (lower.includes('nurse') || lower.includes('elderly') || lower.includes('home care') || lower.includes('stroke') || lower.includes('post-op')) {
    return {
      reply: "Curadeck provides verified, PCN/NMCN-accredited Registered Nurses (RN) for in-home medical care across Lagos and major cities. Our nurses specialize in elderly companionship, post-operative care, stroke rehabilitation, and catheter management. Daily care shifts start at ₦12,000.\n\n*Notice: Curadeck nurses provide in-person clinical care under physician oversight.*",
      recommendedAction: 'CARE_NURSES',
      actionLabel: 'Request a Home Care Nurse',
      actionDetail: 'Vetted Registered Nurses • Daily shifts from ₦12,000',
      suggestedPrompts: [
        'What procedures do home nurses handle?',
        'Can I book a nurse for overnight care?',
        'Check nurse availability in Lagos'
      ]
    };
  }

  if (lower.includes('delivery') || lower.includes('lagos') || lower.includes('speed') || lower.includes('shipping')) {
    return {
      reply: "Curadeck offers express same-day delivery (2 to 4 hours) across Lagos Island and Mainland for in-stock medications. All items are dispatched in temperature-controlled cold-chain packaging. Tracked nationwide delivery across all 36 Nigerian states arrives in 24 to 48 hours.\n\n*Notice: Prescription-required drugs require clinical verification before dispatch.*",
      recommendedAction: 'BUY_MEDICINES',
      actionLabel: 'Shop Market Floor with Fast Delivery',
      actionDetail: '2-4h dispatch across Lagos • 24-48h nationwide',
      suggestedPrompts: [
        'Browse medicine catalog',
        'Book a doctor consultation',
        'Upload prescription slip'
      ]
    };
  }

  return {
    reply: "Welcome to Curadeck! I'm your healthcare platform concierge. We help you access authentic NAFDAC-approved medications, schedule virtual video consultations with licensed Nigerian doctors, or upload your doctor's slip for pharmacist review on WhatsApp.\n\n*Notice: Curadeck Concierge provides platform navigation only and does not give medical advice, clinical diagnoses, or medication advisories.*",
    recommendedAction: 'BUY_MEDICINES',
    actionLabel: 'Browse Medicine Catalog',
    actionDetail: '2,500+ verified drugs • PCN Accredited',
    suggestedPrompts: [
      'How do I buy medicines?',
      'Book a doctor consultation',
      'Upload doctor prescription'
    ]
  };
}

// API Routes
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

    const ai = getGeminiClient();

    // If Gemini client is available, generate AI response
    if (ai) {
      try {
        // Build conversation contents
        const contents: Array<{ role: 'user' | 'model'; parts: [{ text: string }] }> = [];

        if (Array.isArray(history) && history.length > 0) {
          // Add up to last 6 messages for context
          const recentHistory = history.slice(-6);
          for (const item of recentHistory) {
            if (item && item.text && (item.role === 'user' || item.role === 'model')) {
              contents.push({
                role: item.role,
                parts: [{ text: item.text }],
              });
            }
          }
        }

        // Add current user prompt
        contents.push({
          role: 'user',
          parts: [{ text: message.trim() }],
        });

        // Dynamic system instruction incorporating live pharmacy inventory & stock levels
        let dynamicInstruction = CURADECK_SYSTEM_INSTRUCTION;
        if (Array.isArray(inventory) && inventory.length > 0) {
          const inventorySummary = inventory.slice(0, 30).map((m: any) => {
            const stock = m.stockCount !== undefined ? m.stockCount : (m.inStock ? 50 : 0);
            const status = (m.inStock && stock > 0) ? `IN STOCK (${stock} units available)` : 'OUT OF STOCK (0 units)';
            return `- ${m.name || 'Medication'} (${m.category || 'General'}): ${status} at ₦${Number(m.price || 0).toLocaleString()} per ${m.unit || 'unit'}${m.prescriptionRequired ? ' [Prescription Required]' : ' [OTC]'}`;
          }).join('\n');

          dynamicInstruction += `\n\nREAL-TIME LIVE PHARMACY INVENTORY & STOCK LEVELS:
${inventorySummary}

STOCK CHECKING RULES:
- When a user asks whether a medication or item is available, in stock, or what its price/stock quantity is, reference the real-time stock levels above.
- If the item is IN STOCK, confirm availability, unit price in Naira (₦), available units, and mention fast Lagos express delivery.
- If the item is OUT OF STOCK, clearly state that it is temporarily out of stock in our central warehouse, but our PCN-licensed pharmacists can procure it if they upload a doctor's prescription slip.
- Always include the mandatory non-advisory safety disclaimer.`;
        }

        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
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
          } catch (jsonErr) {
            // If model output wasn't strictly JSON, return text directly
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
        // Fall through to fallback handler
      }
    }

    // Fallback response if Gemini API is unconfigured or failed
    const fallback = generateFallbackResponse(message, inventory);
    res.json({
      ...fallback,
      source: 'fallback',
    });
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
  // Vite middleware for development
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
    console.log(`Curadeck Health server running on port ${PORT}`);
  });
}

startServer();
