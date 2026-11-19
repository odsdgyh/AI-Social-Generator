import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import {
  SocialPlatform,
  DEFAULT_ANGLES,
  PLATFORM_FORMATS,
  buildPregeneratePrompt,
  buildSingleVariantPrompt,
  SectionStreamParser,
  buildContextualFallbackAdvice,
  buildSynthesizedVariantStreamText,
} from './prompts.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'generations.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

function resolveApiKey(reqKey?: string): string {
  const trimmed = (reqKey || process.env.GEMINI_API_KEY || '').trim();
  return trimmed;
}

function readServerHistory(): unknown[] {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const raw = fs.readFileSync(HISTORY_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return [];
}

function writeServerHistory(items: unknown[]) {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(items.slice(0, 100), null, 2), 'utf-8');
  } catch {
    // ignore
  }
}

app.get('/api/status', (_req, res) => {
  const hasServerKey = Boolean((process.env.GEMINI_API_KEY || '').trim());
  res.json({
    ok: true,
    model: 'gemini-2.5-flash',
    hasServerKey,
    timestamp: Date.now(),
  });
});

app.post('/api/pregenerate', async (req, res) => {
  const {
    topic = '',
    platform = 'telegram',
    formatId,
    apiKey,
  } = req.body as {
    topic?: string;
    platform?: SocialPlatform;
    formatId?: string;
    apiKey?: string;
  };

  const validPlatform: SocialPlatform = ['telegram', 'youtube', 'instagram', 'tiktok'].includes(
    platform
  )
    ? platform
    : 'telegram';

  const cleanTopic = topic.trim();
  if (!cleanTopic) {
    const fallback = buildContextualFallbackAdvice(cleanTopic, validPlatform, formatId);
    res.json({
      suggestedAngles: DEFAULT_ANGLES[validPlatform],
      detectedTone: fallback.detectedTone,
      formatAdvice: fallback.formatAdvice,
      suggestedFormatId: fallback.formatAdvice.recommendedFormatId,
    });
    return;
  }

  const key = resolveApiKey(apiKey);

  if (key) {
    try {
      const ai = new GoogleGenAI({ apiKey: key });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: buildPregeneratePrompt(cleanTopic, validPlatform, formatId),
        config: {
          temperature: 0.6,
          responseMimeType: 'application/json',
        },
      });

      const rawText = response.text || '';
      const parsed = JSON.parse(rawText);
      if (
        Array.isArray(parsed.suggestedAngles) &&
        parsed.suggestedAngles.length >= 2 &&
        typeof parsed.detectedTone === 'string'
      ) {
        res.json({
          suggestedAngles: parsed.suggestedAngles.slice(0, 3),
          detectedTone: parsed.detectedTone,
          formatAdvice: parsed.formatAdvice || buildContextualFallbackAdvice(cleanTopic, validPlatform, formatId).formatAdvice,
          suggestedFormatId: parsed.formatAdvice?.recommendedFormatId || formatId,
        });
        return;
      }
    } catch (err) {
      console.warn('[pregenerate] Falling back to contextual angles & advice:', (err as Error).message);
    }
  }

  // Быстрая имитация задержки ~360ms для плавной анимации индикатора сканирования
  await new Promise((r) => setTimeout(r, 360));
  const fallback = buildContextualFallbackAdvice(cleanTopic, validPlatform, formatId);
  res.json({
    suggestedAngles: fallback.suggestedAngles,
    detectedTone: fallback.detectedTone,
    formatAdvice: fallback.formatAdvice,
    suggestedFormatId: fallback.formatAdvice.recommendedFormatId,
  });
});

app.post('/api/generate-stream', async (req, res) => {
  const {
    topic = '',
    platform = 'telegram',
    formatId,
    variantsCount = 3,
    selectedAngles = [],
    apiKey,
    simulateError = false,
  } = req.body as {
    topic?: string;
    platform?: SocialPlatform;
    formatId?: string;
    variantsCount?: number;
    selectedAngles?: string[];
    apiKey?: string;
    simulateError?: boolean;
  };

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders?.();

  let clientClosed = false;
  res.on('close', () => {
    clientClosed = true;
  });

  const sendEvent = (event: string, data: unknown) => {
    if (clientClosed || res.writableEnded) return;
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  if (simulateError) {
    await new Promise((r) => setTimeout(r, 420));
    sendEvent('error', {
      code: 'ERR_STREAM_INTERRUPTED',
      message: 'Поток генерации прерван (ERR_STREAM_INTERRUPTED): превышен лимит ожидания узла или соединение сброшено.',
    });
    res.end();
    return;
  }

  const validPlatform: SocialPlatform = ['telegram', 'youtube', 'instagram', 'tiktok'].includes(
    platform
  )
    ? platform
    : 'telegram';
  const count = Math.min(Math.max(Number(variantsCount) || 3, 2), 3);
  const fallback = buildContextualFallbackAdvice(topic, validPlatform, formatId);
  const fallbackAngles = fallback.suggestedAngles;

  const currentFormatDef =
    PLATFORM_FORMATS[validPlatform].find((f) => f.id === formatId) ||
    PLATFORM_FORMATS[validPlatform].find((f) => f.id === fallback.formatAdvice.recommendedFormatId) ||
    PLATFORM_FORMATS[validPlatform][0];

  const effectiveFormatId = currentFormatDef.id;
  const effectiveFormatName = currentFormatDef.name;

  const anglesForVariants: string[] = [];
  for (let i = 0; i < count; i++) {
    anglesForVariants.push(
      selectedAngles[i] || fallbackAngles[i] || DEFAULT_ANGLES[validPlatform][i] || `Вариант 0${i + 1}`
    );
  }

  const key = resolveApiKey(apiKey);

  try {
    if (key) {
      const ai = new GoogleGenAI({ apiKey: key });

      await Promise.all(
        anglesForVariants.map(async (angle, variantIndex) => {
          const parser = new SectionStreamParser((section, text) => {
            sendEvent('chunk', {
              variantIndex,
              section,
              text,
              angleTitle: angle,
              formatName: effectiveFormatName,
            });
          });

          const prompt = buildSingleVariantPrompt(topic, validPlatform, angle, variantIndex, effectiveFormatId);
          const stream = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
              temperature: 0.75,
            },
          });

          for await (const chunk of stream) {
            if (clientClosed) break;
            const textChunk = chunk.text;
            if (textChunk) {
              parser.push(textChunk);
            }
          }
          parser.flush();
        })
      );
    } else {
      await Promise.all(
        anglesForVariants.map(async (angle, variantIndex) => {
          const fullText = buildSynthesizedVariantStreamText(
            topic,
            validPlatform,
            angle,
            variantIndex,
            effectiveFormatId
          );
          const parser = new SectionStreamParser((section, text) => {
            sendEvent('chunk', {
              variantIndex,
              section,
              text,
              angleTitle: angle,
              formatName: effectiveFormatName,
            });
          });

          const tokens = fullText.match(/(\[(?:TITLE|BODY|CTA|TAGS)\]|\S+\s*|\n+)/g) || [fullText];
          await new Promise((r) => setTimeout(r, variantIndex * 70));

          for (const token of tokens) {
            if (clientClosed) break;
            parser.push(token);
            const delay = 20 + ((variantIndex * 7 + token.length) % 16);
            await new Promise((r) => setTimeout(r, delay));
          }
          parser.flush();
        })
      );
    }

    sendEvent('done', {
      generationId: crypto.randomUUID(),
      timestamp: Date.now(),
      formatId: effectiveFormatId,
      formatName: effectiveFormatName,
    });
    res.end();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown streaming error';
    sendEvent('error', {
      code: 'ERR_STREAM_INTERRUPTED',
      message: `ERR_STREAM_INTERRUPTED // ${message}`,
    });
    res.end();
  }
});

app.get('/api/history', (_req, res) => {
  res.json(readServerHistory());
});

app.post('/api/history', (req, res) => {
  const record = req.body;
  if (!record || !record.id) {
    res.status(400).json({ error: 'Invalid record' });
    return;
  }
  const current = readServerHistory() as Array<{ id: string }>;
  const filtered = current.filter((item) => item.id !== record.id);
  const updated = [record, ...filtered].slice(0, 100);
  writeServerHistory(updated);
  res.json({ ok: true, count: updated.length });
});

app.delete('/api/history/:id', (req, res) => {
  const { id } = req.params;
  const current = readServerHistory() as Array<{ id: string }>;
  const updated = current.filter((item) => item.id !== id);
  writeServerHistory(updated);
  res.json({ ok: true, count: updated.length });
});

const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`[CONTENT_ENGINE // SERVER] Listening on http://localhost:${PORT}`);
});
