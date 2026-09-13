// localAssistant.ts
// A free, deterministic replacement for the "ask an LLM every time" chatbot.
// Handles the ~90% of queries that are predictable: stock checks, booking,
// uploads, delivery, pricing, nurses. Falls back to suggested prompts
// instead of a paid model when nothing matches.
//
// npm install fuse.js   (tiny, free, no API, runs in the browser)

import Fuse from 'fuse.js';
import { Medicine } from '../src/types';

export type LocalAction =
  | 'BUY_MEDICINES'
  | 'BOOK_CONSULTATION'
  | 'UPLOAD_PRESCRIPTION'
  | 'CARE_NURSES'
  | null;

export interface LocalReply {
  reply: string;
  recommendedAction: LocalAction;
  actionLabel?: string;
  actionDetail?: string;
  suggestedPrompts?: string[];
  matched: boolean; // false = nothing confident matched, caller can decide to call an LLM or just show fallback
}

// ---- 1. Intent patterns -----------------------------------------------
// Only for things that are NOT a product lookup — booking, uploads, nurses,
// delivery, greetings, and an explicit price ask. Everything else falls
// through to the fuzzy product search below, which is the real default path.
// Order matters: more specific patterns first.
const INTENTS: { name: string; test: RegExp }[] = [
  { name: 'PRICE_CHECK', test: /\b(how much|price of|cost of|price for)\b/i },
  { name: 'BOOK_DOCTOR', test: /\b(book|see|talk to|speak (to|with))\b.*\b(doctor|consult(ation)?|physician)\b/i },
  { name: 'UPLOAD_PRESCRIPTION', test: /\b(upload|send|share)\b.*\b(prescription|slip|script)\b/i },
  { name: 'HIRE_NURSE', test: /\b(nurse|home care|elderly care|post[- ]op care)\b/i },
  { name: 'DELIVERY_TIME', test: /\b(how (fast|long|soon))\b.*\b(deliver|delivery|arrive|ship)\b/i },
  { name: 'GREETING', test: /^\s*(hi|hello|hey|good (morning|afternoon|evening))\s*[!.]?\s*$/i },
];

function detectIntent(text: string): string | null {
  for (const { name, test } of INTENTS) {
    if (test.test(text)) return name;
  }
  return null;
}

// ---- 2. Fuzzy medicine lookup ------------------------------------------
function buildMedicineIndex(medicines: Medicine[]) {
  return new Fuse(medicines, {
    keys: ['name', 'genericName'],
    threshold: 0.35, // lower = stricter match
    ignoreLocation: true,
  });
}

// Strip filler/intent words so we're left with (hopefully) just the product name.
// This list is deliberately generous — it's cheap to extend as you see real queries.
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

// ---- 3. Main entry point ------------------------------------------------
export function getLocalReply(rawText: string, medicines: Medicine[]): LocalReply {
  const text = rawText.trim();
  const intent = detectIntent(text);

  if (intent === 'GREETING') {
    return {
      reply: "Hey! I can check medicine stock, book a doctor, or take a prescription upload. What do you need?",
      recommendedAction: null,
      matched: true,
      suggestedPrompts: ['Is Coartem in stock?', 'Book a doctor teleconsultation', 'Upload doctor prescription'],
    };
  }

  if (intent === 'BOOK_DOCTOR') {
    return {
      reply: 'Video consultations with MDCN-registered doctors start at ₦2,500.',
      recommendedAction: 'BOOK_CONSULTATION',
      actionLabel: 'Book a doctor',
      actionDetail: 'Video call · from ₦2,500',
      matched: true,
    };
  }

  if (intent === 'UPLOAD_PRESCRIPTION') {
    return {
      reply: 'Upload a photo of the prescription slip and a licensed pharmacist reviews it, usually within 30 minutes.',
      recommendedAction: 'UPLOAD_PRESCRIPTION',
      actionLabel: 'Upload prescription',
      actionDetail: 'Pharmacist review · 30 min',
      matched: true,
    };
  }

  if (intent === 'HIRE_NURSE') {
    return {
      reply: 'Home-visit Registered Nurses for post-op and elderly care start at ₦12,000.',
      recommendedAction: 'CARE_NURSES',
      actionLabel: 'Hire a care nurse',
      actionDetail: 'Home visits · from ₦12,000',
      matched: true,
    };
  }

  if (intent === 'DELIVERY_TIME') {
    return {
      reply: 'Lagos deliveries typically arrive in 2–4 hours after order confirmation.',
      recommendedAction: 'BUY_MEDICINES',
      matched: true,
    };
  }

  // Default path: treat this as a product request, whether or not it used
  // an explicit "is there / stock / do you have" phrase. "i need vitamin c"
  // and "vitamin c" should behave the same way.
  const term = extractQueryTerm(text);

  if (term.length >= 2) {
    const fuse = buildMedicineIndex(medicines);
    const results = fuse.search(term, { limit: 1 });

    if (results.length > 0) {
      const med = results[0].item;

      if (intent === 'PRICE_CHECK') {
        return {
          reply: `${med.name} is ₦${med.price}${med.unit ? ` per ${med.unit}` : ''}.`,
          recommendedAction: med.prescriptionRequired ? 'UPLOAD_PRESCRIPTION' : 'BUY_MEDICINES',
          matched: true,
        };
      }

      const stockLine = med.inStock
        ? `Yes — ${med.name} is in stock${med.stockCount ? ` (${med.stockCount} units)` : ''}.`
        : `${med.name} is currently out of stock.`;
      const rxLine = med.prescriptionRequired
        ? " It's prescription-only, so you'll need a doctor's slip or pharmacist verification."
        : '';

      return {
        reply: stockLine + rxLine,
        recommendedAction: med.prescriptionRequired ? 'UPLOAD_PRESCRIPTION' : 'BUY_MEDICINES',
        actionLabel: med.inStock ? 'Buy now' : 'Browse alternatives',
        matched: true,
      };
    }

    // Term extracted fine, but nothing in the catalog matches it closely —
    // this is a genuine "we don't carry that" rather than a parsing failure.
    return {
      reply: `I couldn't find "${term}" in the catalog. Want to browse the full medicine list instead?`,
      recommendedAction: 'BUY_MEDICINES',
      actionLabel: 'Browse catalog',
      matched: true,
    };
  }

  // Nothing usable left after stripping filler (e.g. just "please" or empty) —
  // this is the only true "didn't understand" case.
  return {
    reply: "I'm not sure I caught that. Here's what I can help with directly:",
    recommendedAction: null,
    matched: false,
    suggestedPrompts: ['Is Coartem in stock?', 'Book a doctor teleconsultation', 'Upload doctor prescription', 'How fast is Lagos delivery?'],
  };
}