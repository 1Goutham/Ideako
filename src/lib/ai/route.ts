import "server-only";
import { NextResponse } from "next/server";
import type { AiError, AiResponse, VoiceContext } from "./contracts";
import { checkRateLimit, clientKey } from "./rateLimit";

/**
 * Shared plumbing for the AI route handlers: body parsing, validation,
 * per-IP rate limiting and a uniform `{ ok, data | error }` envelope.
 */

const STATUS: Record<AiError["code"], number> = {
  not_configured: 503,
  invalid_request: 400,
  rate_limited: 429,
  timeout: 504,
  upstream: 502,
  blocked: 422,
  empty: 502,
  malformed: 502,
  network: 502,
};

export function respond<T>(result: AiResponse<T>, extraHeaders?: HeadersInit): NextResponse {
  if (result.ok) return NextResponse.json(result, { status: 200 });
  return NextResponse.json(result, { status: STATUS[result.error.code], headers: extraHeaders });
}

export function invalid(message: string): AiResponse<never> {
  return { ok: false, error: { code: "invalid_request", message, retryable: false } };
}

export async function withAiRoute<TBody, TData>(
  req: Request,
  validate: (body: unknown) => TBody | string,
  run: (body: TBody) => Promise<AiResponse<TData>>,
): Promise<NextResponse> {
  const limit = checkRateLimit(clientKey(req));
  if (!limit.allowed) {
    return respond(
      {
        ok: false,
        error: {
          code: "rate_limited",
          message: `You're creating quickly. Give Ideako ${limit.retryAfterSec}s to catch up.`,
          retryable: true,
        },
      },
      { "Retry-After": String(limit.retryAfterSec) },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return respond(invalid("Request body must be JSON."));
  }

  const parsed = validate(body);
  if (typeof parsed === "string") return respond(invalid(parsed));

  try {
    return respond(await run(parsed));
  } catch (e) {
    console.error("AI route failed:", e);
    return respond({
      ok: false,
      error: { code: "upstream", message: "Something went wrong on Ideako's side. Please try again.", retryable: true },
    });
  }
}

/* ---------- validation helpers (small on purpose; no extra deps) ---------- */

export const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
export const str = (v: unknown, max = 20_000): string => (typeof v === "string" ? v.slice(0, max) : "");
export const strArr = (v: unknown, max = 20): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, max) : [];

export function parseContext(v: unknown): VoiceContext | null {
  if (!isObj(v) || !isObj(v.profile) || !isObj(v.voice)) return null;
  const p = v.profile;
  const vo = v.voice;
  const creatingFor = p.creatingFor === "company" || p.creatingFor === "brand" ? p.creatingFor : "myself";
  const knowledge = Array.isArray(vo.knowledge)
    ? vo.knowledge
        .filter(isObj)
        .map((k) => ({ name: str(k.name, 200), content: str(k.content, 20_000) }))
        .slice(0, 10)
    : [];
  return {
    profile: {
      creatingFor,
      name: str(p.name, 120),
      companyName: str(p.companyName, 120),
      role: str(p.role, 120),
      industry: str(p.industry, 120),
      website: str(p.website, 200),
    },
    voice: {
      tones: strArr(vo.tones, 8) as VoiceContext["voice"]["tones"],
      description: str(vo.description, 2_000),
      brandDescription: str(vo.brandDescription, 4_000),
      audience: str(vo.audience, 2_000),
      writingPreferences: str(vo.writingPreferences, 2_000),
      avoid: str(vo.avoid, 2_000),
      knowledge,
      summaryTraits: strArr(vo.summaryTraits, 8),
    },
  };
}

export function parseReferences(v: unknown): { title: string; content: string }[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter(isObj)
    .map((r) => ({ title: str(r.title, 200), content: str(r.content, 20_000) }))
    .filter((r) => r.content.trim())
    .slice(0, 8);
}

export function parsePlatform(v: unknown): "linkedin" | "x" | "instagram" {
  return v === "x" || v === "instagram" ? v : "linkedin";
}
