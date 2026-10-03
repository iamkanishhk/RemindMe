import { env, geminiApiKeys } from '../config';
import { logger } from '../lib/logger';

const API_HOST = 'https://generativelanguage.googleapis.com/v1beta';
const TIMEOUT_MS = 4000;
const MAX_TOKENS = 60;

// A process-local cursor that round-robins across the configured keys so load
// is spread evenly and no single account is hammered.
let rotationCursor = 0;

// Pure helper so rotation is unit-testable. Returns the key for the given
// cursor (cycled) plus the next cursor.
export function rotateKeys(keys: string[], cursor: number): { key: string | null; nextCursor: number } {
  if (keys.length === 0) return { key: null, nextCursor: 0 };
  return { key: keys[cursor % keys.length] ?? null, nextCursor: (cursor + 1) % keys.length };
}

// Uses a deterministic, first-person→second-person rewrite so the text reads
// like an assistant talking to the user when spoken by TTS, e.g. "i have a
// flight tommorrow" → "You have a flight tomorrow."
const SYSTEM_PROMPT = [
  'You are the speaking voice of a personal reminder assistant. Rewrite the user\'s typed reminder note so it sounds natural and personal when read aloud over a phone call — as if you are personally telling the user something, not transcribing their note.',
  'Turn first-person wording into second-person ("i have..." → "you have..."), drop filler, fix wording, and keep it short.',
  'Rules: under 25 words; plain conversational English; no greeting, no closing, no quotes, no emoji, no markdown, no bullet list. Return only the rewritten sentence.'
].join(' ');

// Sends the message to Gemini with the given key. Resolves to the rewritten
// text, or null when the response contains no usable text. Throws on HTTP or
// network errors so the caller can fail over to another key. The key goes in
// the x-goog-api-key header (never in the URL) so it cannot leak into logs.
async function callGemini(apiKey: string, message: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${API_HOST}/models/${env.GEMINI_MODEL}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: message }] }],
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: MAX_TOKENS,
          // Disable multi-step reasoning so output tokens all go to the meant
          // sentence and latency stays low.
          thinkingConfig: { thinkingBudget: 0 }
        }
      })
    });
    if (!res.ok) {
      const err = new Error(`gemini HTTP ${res.status}`);
      (err as Error & { status: number }).status = res.status;
      throw err;
    }
    const json = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text === 'string' && text.trim()) return text.trim();
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Rewrites a reminder message into a natural, spoken reminder. Never blocks:
// on any key failure or timeout it tries the next key, and if every attempt
// fails it resolves null so the caller falls back to the original text. API
// keys and message content are never logged, so a single exhausted key cannot
// break reminder creation.
export async function enhanceReminderMessage(message: string): Promise<string | null> {
  const raw = message.trim();
  const keys = geminiApiKeys();
  if (!raw || keys.length === 0) return null;

  let cursor = rotationCursor;
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const { key, nextCursor } = rotateKeys(keys, cursor);
    cursor = nextCursor;
    if (!key) return null;
    try {
      const enhanced = await callGemini(key, raw);
      rotationCursor = cursor;
      if (enhanced) {
        logger.debug({ model: env.GEMINI_MODEL }, 'reminder message enhanced');
        return enhanced;
      }
      return null;
    } catch (err) {
      const status = err instanceof Error ? (err as Error & { status?: number }).status : undefined;
      logger.warn({ geminiStatus: status, attempt: attempt + 1 }, 'gemini request failed; trying next key');
    }
  }
  rotationCursor = cursor;
  return null;
}