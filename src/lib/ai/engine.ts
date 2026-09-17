import "server-only";
import type { AiError, AiResponse } from "./contracts";
import { activeProviders, allProviders } from "./providers";
import type { CompletionOptions, ProviderStatus } from "./providers/types";

/**
 * Ideako's AI engine.
 *
 * Runs a completion against the configured providers in order and falls
 * through to the next one on failures that another provider could plausibly
 * fix: rate limits, timeouts, outages, empty or unreadable output. Hard
 * failures (a blocked prompt, a bad request) stop the chain.
 *
 * Free tiers make this essential: Gemini's free quota being exhausted for a
 * minute should not mean the product stops working.
 */

const FALL_THROUGH: ReadonlySet<AiError["code"]> = new Set(["rate_limited", "timeout", "upstream", "network", "empty", "malformed", "not_configured"]);

function notConfigured(): AiResponse<never> {
  return {
    ok: false,
    error: {
      code: "not_configured",
      message:
        "Ideako isn't connected to an AI engine yet. Add a free GEMINI_API_KEY (aistudio.google.com) or GROQ_API_KEY (console.groq.com) to the environment and redeploy.",
      retryable: false,
    },
  };
}

export interface EngineResult<T> {
  result: AiResponse<T>;
  /** Which provider produced the result, for logging and the health panel. */
  provider?: string;
  model?: string;
}

export async function complete(opts: CompletionOptions): Promise<EngineResult<string>> {
  const chain = activeProviders();
  if (!chain.length) return { result: notConfigured() };

  let last: AiResponse<string> | null = null;
  for (const provider of chain) {
    const res = await provider.complete(opts);
    if (res.ok) return { result: { ok: true, data: res.data }, provider: provider.id, model: res.model };
    last = res;
    if (!FALL_THROUGH.has(res.error.code)) return { result: res, provider: provider.id, model: res.model };
    console.warn(`Ideako: ${provider.label} failed (${res.error.code}); ${chain.indexOf(provider) < chain.length - 1 ? "trying the next engine" : "no engines left"}.`);
  }
  // Every provider fell through; make the message honest about it.
  const error = last!.error;
  return {
    result: {
      ok: false,
      error: {
        ...error,
        message: chain.length > 1 ? `All ${chain.length} AI engines are unavailable right now. ${error.message} Give it a minute and try again.` : `${error.message} Give it a moment and try again.`,
      },
    },
  };
}

/** Parse model output as JSON, tolerating fences and stray prose. */
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

/**
 * Structured completion. If a provider returns unparseable JSON once, retry
 * the same provider chain a second time before giving up; small models
 * occasionally wrap JSON in prose.
 */
export async function completeJson<T>(opts: CompletionOptions, validate: (value: unknown) => T | null): Promise<AiResponse<T>> {
  let lastError: AiError | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const { result, provider, model } = await complete({ ...opts, json: true });
    if (!result.ok) return result;
    const parsed = parseJson<unknown>(result.data);
    const value = parsed === null ? null : validate(parsed);
    if (value !== null) return { ok: true, data: value };
    console.error(`Ideako: ${provider}/${model} returned malformed JSON:`, result.data.slice(0, 300));
    lastError = { code: "malformed", message: "The AI engine's response came back in an unexpected shape. Please try again.", retryable: true };
  }
  return { ok: false, error: lastError! };
}

/** Status of every known provider, for the Settings page. Never includes keys. */
export async function engineStatus(): Promise<{ providers: ProviderStatus[]; active: string[] }> {
  const providers = await Promise.all(allProviders().map((p) => p.status()));
  return { providers, active: activeProviders().map((p) => p.id) };
}
