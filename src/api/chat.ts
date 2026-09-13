import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleChatRequest } from '../lib/chatEngine';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { message, history, inventory } = req.body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const payload = await handleChatRequest(message, history, inventory);
    res.status(200).json(payload);
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
}
