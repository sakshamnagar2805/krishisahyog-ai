/**
 * Browser client for the assistant API plus the typed-question pipeline:
 * Gemini with tools when the server has a key, otherwise the demo keyword answers.
 */
import { Content, FunctionCall, Part } from '@google/genai';
// Public runtime does not read any demo provider.
import { AICitation, AIResponse } from '../../types';
import { VoiceLanguage } from './assistantConfig';
import { AssistantToolContext, executeAssistantTool } from './assistantTools';


export interface AssistantStatus {
  /** Gemini text answers can be used */
  configured: boolean;
  /** Gemini Live voice can be used */
  liveAvailable?: boolean;
  reason?: 'no_key' | 'invalid_key';
  liveModel?: string;
  textModel?: string;
}

export interface AssistantAnswer {
  text: string;
  source: 'gemini' | 'demo';
  citations?: AICitation[];
  suggestedRoute?: string;
  suggestedLabel?: string;
}

const API_BASE = '/api/assistant';

/** Keeps the latest turns, starting at a farmer question so no tool call is cut in half */
const trimHistory = (contents: Content[], max: number) => {
  const recent = contents.slice(-max);
  const start = recent.findIndex((c) => c.role === 'user' && c.parts?.some((p) => typeof p.text === 'string'));
  return start > 0 ? recent.slice(start) : recent;
};
const MAX_TOOL_ROUNDS = 5;
const MAX_HISTORY = 30;

export const fetchAssistantStatus = async (): Promise<AssistantStatus> => {
  try {
    const res = await fetch(`${API_BASE}/status`);
    if (!res.ok) return { configured: false };
    return (await res.json()) as AssistantStatus;
  } catch {
    return { configured: false };
  }
};

export const fetchLiveToken = async (language: VoiceLanguage): Promise<{ token: string; model: string }> => {
  const res = await fetch(`${API_BASE}/live-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language }),
  });
  if (!res.ok) throw new Error(`Live token request failed (${res.status})`);
  return res.json();
};

const generate = async (language: VoiceLanguage, contents: Content[]) => {
  const res = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language, contents }),
  });
  if (!res.ok) throw new Error(`Assistant request failed (${res.status})`);
  return (await res.json()) as { content: Content | null; text: string; functionCalls: FunctionCall[] };
};

/**
 * Keeps multi-turn history for the Gemini text pipeline. History is only kept
 * for Gemini answers; demo answers are stateless.
 */
export class TextAssistant {
  private history: Content[] = [];

  constructor(private readonly toolContext: AssistantToolContext) {}

  reset() {
    this.history = [];
  }

  async ask(question: string, language: VoiceLanguage, useGemini: boolean): Promise<AssistantAnswer> {
    if (useGemini) {
      try {
        return await this.askGemini(question, language);
      } catch (err) {
        console.warn('[assistant] Gemini unavailable, using demo answers:', err);
      }
    }
    return { text: 'Verified government sources are not yet available. Please refer to the official government portal.', source: 'gemini' };
  }

  private async askGemini(question: string, language: VoiceLanguage): Promise<AssistantAnswer> {
    const contents: Content[] = [...this.history, { role: 'user', parts: [{ text: question }] }];

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const result = await generate(language, trimHistory(contents, MAX_HISTORY));
      if (result.content) contents.push(result.content);

      if (!result.functionCalls.length) {
        this.history = trimHistory(contents, MAX_HISTORY);
        return { text: result.text.trim(), source: 'gemini' };
      }

      const responseParts: Part[] = await Promise.all(
        result.functionCalls.map(async (call) => ({
          functionResponse: {
            id: call.id,
            name: call.name,
            response: { output: await executeAssistantTool(call.name, call.args, this.toolContext) },
          },
        }))
      );
      contents.push({ role: 'user', parts: responseParts });
    }

    throw new Error('Too many tool rounds');
  }
}

export const askDemo = async (_question: string, _language: VoiceLanguage): Promise<AssistantAnswer> => ({
  text: 'This assistant is not available until official government sources are verified.',
  source: 'gemini',
});
