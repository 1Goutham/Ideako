import "server-only";
import type { AiError, AiResponse } from "./contracts";

/**
 * Thin, defensive wrapper around the Gemini REST API.
 *
 * - The API key never leaves the server.
 * - Every failure mode (missing key, 429, 5xx, timeouts, safety blocks, empty or
 *   malformed output) is mapped to a typed `AiError` so the UI can react
 *   without ever losing the user's work.
 */

const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const BASE = (process.env.GEMINI_API_BASE || "https://generativelanguage.googleapis.com").replace(/\/$/, "");
const ENDPOINT = `${BASE}/v1beta/models/${MODEL}:generateContent`;
const TIMEOUT_MS = 45_000;

interface CallOptions {
  system: string;
  prompt: string;
  json?: boolean;
  temperature?: number;
  maxOutputTokens?: number;
}

function err(code: AiError["code"], message: string, retryable = false): AiResponse<never> {
  return { ok: false, error: { code, message, retryable } };
}

interface GeminiCandidate {
  content?: { parts?: { text?: string }[] };
  finishReason?: string;
}
interface GeminiPayload {
  candidates?: GeminiCandidate[];
  promptFeedback?: { blockReason?: string };
}

export async function callGemini(opts: CallOptions): Promise<AiResponse<string>> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return err(
      "not_configured",
      "Ideako isn't connected to Gemini yet. Add GEMINI_API_KEY to your environment and restart the server.",
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      signal: controller.signal,
      body: JSON.stringify({
        system_instruction: { parts: [{ text: opts.system }] },
        contents: [{ role: "user", parts: [{ text: opts.prompt }] }],
        generationConfig: {
          temperature: opts.temperature ?? 0.8,
          maxOutputTokens: opts.maxOutputTokens ?? 2048,
          ...(opts.json ? { responseMimeType: "application/json" } : {}),
        },
      }),
    });
  } catch (e) {
    clearTimeout(timer);
    if ((e as Error)?.name === "AbortError") {
      return err("timeout", "Ideako took too long to respond. Please try again.", true);
    }
    return err("network", "Couldn't reach Gemini. Check the server's network connection.", true);
  }
  clearTimeout(timer);

  if (res.status === 429) {
    return err("rate_limited", "Ideako is a little busy right now. Give it a few seconds and try again.", true);
  }
  if (res.status === 400 || res.status === 401 || res.status === 403) {
    const detail = await safeText(res);
    console.error("Gemini rejected the request:", res.status, detail);
    return err("upstream", "Gemini rejected the request. Check the API key and model configuration.");
  }
  if (!res.ok) {
    const detail = await safeText(res);
    console.error("Gemini error:", res.status, detail);
    return err("upstream", "Gemini had a problem processing this request. Please try again.", res.status >= 500);
  }

  let payload: GeminiPayload;
  try {
    payload = (await res.json()) as GeminiPayload;
  } catch {
    return err("malformed", "Gemini returned something Ideako couldn't read. Please try again.", true);
  }

  if (payload.promptFeedback?.blockReason) {
    return err("blocked", "Gemini declined this request. Try rephrasing your idea.");
  }

  const candidate = payload.candidates?.[0];
  const text = candidate?.content?.parts?.map((p) => p.text ?? "").join("").trim();

  if (!text) {
    if (candidate?.finishReason === "SAFETY") {
      return err("blocked", "Gemini declined this request. Try rephrasing your idea.");
    }
    return err("empty", "Ideako came back empty-handed. Please try again.", true);
  }

  return { ok: true, data: text };
}

async function safeText(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 500);
  } catch {
    return "";
  }
}

/**
 * Parse model output as JSON, tolerating code fences and stray prose around
 * the object. Returns `null` when nothing usable can be found.
 */
export function parseJson<T>(text: string): T | null {
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  const attempts = [cleaned];
  const first = cleaned.search(/[{[]/);
  const last = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
  if (first >= 0 && last > first) attempts.push(cleaned.slice(first, last + 1));
  for (const candidate of attempts) {
    try {
      return JSON.parse(candidate) as T;
    } catch {
      /* try next */
    }
  }
  return null;
}

export async function callGeminiJson<T>(
  opts: CallOptions,
  validate: (value: unknown) => T | null,
): Promise<AiResponse<T>> {
  const result = await callGemini({ ...opts, json: true });
  if (!result.ok) return result;
  const parsed = parseJson<unknown>(result.data);
  const value = parsed === null ? null : validate(parsed);
  if (value === null) {
    console.error("Gemini returned malformed JSON:", result.data.slice(0, 400));
    return err("malformed", "Ideako's response came back in an unexpected shape. Please try again.", true);
  }
  return { ok: true, data: value };
}
