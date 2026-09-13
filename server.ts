import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { handleChatRequest } from './src/lib/chatEngine';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// ---------------------------------------------------------------------------
// Routes — this is local-dev only. In production these paths are served by
// api/chat.ts and api/health.ts as Vercel serverless functions, which call
// the same lib/chatEngine.ts so behavior stays identical between the two.
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

    const payload = await handleChatRequest(message, history, inventory);
    res.json(payload);
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
    console.log(`Curadeck Health server running on port ${PORT} [server.ts — local dev only]`);
  });
}

startServer();