/**
 * KrishiSahyog AI - Assistant API
 *
 * Keeps GEMINI_API_KEY on the server. The browser gets either a single-use
 * ephemeral token for a Live voice session (config locked here), or proxied
 * text generation with the system instruction and tools fixed server-side.
 *
 * Mounted by the Vite dev/preview server (vite.config.ts) and by server/index.ts.
 */
import express from 'express';
import { Content, GoogleGenAI } from '@google/genai';
import {
  DEFAULT_LIVE_MODEL,
  DEFAULT_TEXT_MODEL,
  assistantFunctionDeclarations,
  buildLiveConnectConfig,
  buildSystemInstruction,
  isVoiceLanguage,
} from '../src/services/assistant/assistantConfig';

export interface AssistantApiOptions {
  apiKey?: string;
  liveModel?: string;
  textModel?: string;
}

const PLACEHOLDER_KEY = /^(|MY_.*|YOUR_.*|<.*>)$/i;

export const isConfiguredApiKey = (key: string | undefined): key is string =>
  typeof key === 'string' && !PLACEHOLDER_KEY.test(key.trim());

const MAX_CONTENTS = 40;
const MAX_BODY = '64kb';

export const createAssistantApi = (options: AssistantApiOptions) => {
  const liveModel = options.liveModel || DEFAULT_LIVE_MODEL;
  const textModel = options.textModel || DEFAULT_TEXT_MODEL;
  const configured = isConfiguredApiKey(options.apiKey);
  const ai = configured ? new GoogleGenAI({ apiKey: options.apiKey }) : null;

  const app = express();
  const router = express.Router();
  router.use(express.json({ limit: MAX_BODY }));

  // Checks the key and the Live model once, so the app can pick a working mode up front
  type Verification = { keyValid: boolean | null; liveModelFound: boolean | null };
  let verification: Promise<Verification> | null = null;
  const verify = (): Promise<Verification> => {
    if (!ai) return Promise.resolve({ keyValid: null, liveModelFound: null });
    verification ??= (async () => {
      try {
        await ai.models.get({ model: liveModel });
        return { keyValid: true, liveModelFound: true };
      } catch (err) {
        const status = (err as { status?: number }).status;
        if (status === 400 || status === 401 || status === 403) {
          console.warn('[assistant] GEMINI_API_KEY was rejected; using demo answers.');
          return { keyValid: false, liveModelFound: null };
        }
        if (status === 404) {
          console.warn(`[assistant] Live model "${liveModel}" not found; set GEMINI_LIVE_MODEL.`);
          return { keyValid: true, liveModelFound: false };
        }
        verification = null; // network problem: try again on the next status check
        return { keyValid: null, liveModelFound: null };
      }
    })();
    return verification;
  };

  router.get('/status', async (_req, res) => {
    const { keyValid, liveModelFound } = await verify();
    const usable = configured && keyValid !== false;
    res.json({
      configured: usable,
      liveAvailable: usable && liveModelFound !== false,
      reason: !configured ? 'no_key' : keyValid === false ? 'invalid_key' : undefined,
      liveModel,
      textModel,
    });
  });

  router.post('/live-token', async (req, res) => {
    if (!ai) return res.status(503).json({ error: 'not_configured' });
    const language = req.body?.language;
    if (!isVoiceLanguage(language)) return res.status(400).json({ error: 'invalid_language' });

    try {
      const now = Date.now();
      const token = await ai.authTokens.create({
        config: {
          uses: 1,
          expireTime: new Date(now + 30 * 60 * 1000).toISOString(),
          newSessionExpireTime: new Date(now + 60 * 1000).toISOString(),
          liveConnectConstraints: {
            model: liveModel,
            config: buildLiveConnectConfig(language),
          },
        },
      });
      res.json({ token: token.name, model: liveModel });
    } catch (err) {
      console.error('[assistant] live token failed:', err);
      res.status(502).json({ error: 'token_failed' });
    }
  });

  router.post('/generate', async (req, res) => {
    if (!ai) return res.status(503).json({ error: 'not_configured' });
    const { language, contents } = req.body ?? {};
    if (!isVoiceLanguage(language)) return res.status(400).json({ error: 'invalid_language' });
    if (!Array.isArray(contents) || contents.length === 0 || contents.length > MAX_CONTENTS) {
      return res.status(400).json({ error: 'invalid_contents' });
    }

    try {
      const response = await ai.models.generateContent({
        model: textModel,
        contents: contents as Content[],
        config: {
          systemInstruction: buildSystemInstruction(language),
          tools: [{ functionDeclarations: assistantFunctionDeclarations }],
        },
      });
      res.json({
        content: response.candidates?.[0]?.content ?? null,
        text: response.text ?? '',
        functionCalls: response.functionCalls ?? [],
      });
    } catch (err) {
      console.error('[assistant] generate failed:', err);
      res.status(502).json({ error: 'generate_failed' });
    }
  });

  app.use('/api/assistant', router);
  return app;
};
