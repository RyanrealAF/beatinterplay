import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Real Server-Side Gemini API Route for Cadence & Flow Analysis
  app.post('/api/analyze-flow', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is missing.' });
      }

      const ai = new GoogleGenAI({ apiKey });
      const { trackName, bpm, metrics, lyrics } = req.body;

      const prompt = `
You are an expert Hip-Hop & Vocal DSP Timing Engineer & Flow Coach.
Analyze the following real vocal micro-timing and cadence telemetry data:

Track / Source: ${trackName} (${bpm} BPM)
Pocket Synchronicity Score: ${metrics?.syncScore?.toFixed(1)}%
Average Micro-Timing Drift: ${metrics?.avgDriftMs?.toFixed(1)} ms
Groove Classification: ${metrics?.grooveType}
16th-Note Subdivision Distribution:
- Downbeats (.0): ${metrics?.subdivisionCounts?.[0] || 0}
- 16th E (.1): ${metrics?.subdivisionCounts?.[1] || 0}
- 8th Offbeat (.2): ${metrics?.subdivisionCounts?.[2] || 0}
- 16th A (.3): ${metrics?.subdivisionCounts?.[3] || 0}

Lyric Cadence Timestamps & Offsets:
${(lyrics || [])
  .map(
    (l: any) =>
      `[${l.timestamp?.toFixed(1)}s] ${l.text?.replace(/<[^>]*>?/gm, '')} -> Pocket: ${l.pocket} (${l.offsetMs}ms)`
  )
  .join('\n')}

Provide a concise, 4-bullet point professional feedback report for the artist:
1. **Pocket & Groove Evaluation**: Assess micro-timing tightness, laid-back vs pushing tendencies.
2. **Subdivision Variety & Rhythmic Complexity**: Analyze the 16th-note usage (.0, .1, .2, .3).
3. **Standout Cadence Highlights**: Highlight the best-performing line/bar.
4. **Actionable Flow Optimization Tip**: Provide 1 specific coaching tip to improve micro-sync.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      res.json({ text: response.text });
    } catch (err: any) {
      console.error('API analyze-flow error:', err);
      res.status(500).json({ error: err.message || 'Error processing AI Flow Analysis' });
    }
  });

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
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
