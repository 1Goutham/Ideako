import type {
  AiError,
  AiResponse,
  GenerateRequest,
  GenerateResult,
  HashtagRequest,
  HashtagResult,
  InsightRequest,
  InsightResult,
  RefineRequest,
  RefineResult,
  VoiceAnalysisRequest,
  VoiceAnalysisResult,
  VoiceContext,
} from "./contracts";
import type { Profile, Reference, Voice } from "../types";

/**
 * Browser-side client for Ideako's AI routes. Never touches the model or the
 * key directly; every call returns a typed `AiResponse` and never throws.
 */

async function post<TReq, TRes>(path: string, body: TReq, signal?: AbortSignal): Promise<AiResponse<TRes>> {
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
    const json = (await res.json().catch(() => null)) as AiResponse<TRes> | null;
    if (json && typeof json === "object" && "ok" in json) return json;
    return {
      ok: false,
      error: { code: "malformed", message: "Ideako returned an unexpected response. Please try again.", retryable: true },
    };
  } catch (e) {
    if ((e as Error)?.name === "AbortError") {
      return { ok: false, error: { code: "network", message: "Cancelled.", retryable: true } };
    }
    return {
      ok: false,
      error: { code: "network", message: "You appear to be offline. Your work is safe; try again when you're connected.", retryable: true },
    };
  }
}

export const ai = {
  generate: (body: GenerateRequest, signal?: AbortSignal) => post<GenerateRequest, GenerateResult>("/api/generate", body, signal),
  refine: (body: RefineRequest, signal?: AbortSignal) => post<RefineRequest, RefineResult>("/api/refine", body, signal),
  hashtags: (body: HashtagRequest, signal?: AbortSignal) => post<HashtagRequest, HashtagResult>("/api/hashtags", body, signal),
  insights: (body: InsightRequest, signal?: AbortSignal) => post<InsightRequest, InsightResult>("/api/insights", body, signal),
  analyseVoice: (body: VoiceAnalysisRequest, signal?: AbortSignal) =>
    post<VoiceAnalysisRequest, VoiceAnalysisResult>("/api/voice", body, signal),
};

export function buildVoiceContext(profile: Profile, voice: Voice | null): VoiceContext {
  return {
    profile: {
      creatingFor: profile.creatingFor,
      name: profile.name,
      companyName: profile.companyName,
      role: profile.role,
      industry: profile.industry,
      website: profile.website,
    },
    voice: {
      tones: voice?.tones ?? [],
      description: voice?.description ?? "",
      brandDescription: voice?.brandDescription ?? "",
      audience: voice?.audience ?? "",
      writingPreferences: voice?.writingPreferences ?? "",
      avoid: voice?.avoid ?? "",
      knowledge: (voice?.knowledge ?? []).map((k) => ({ name: k.name, content: k.content })),
      summaryTraits: voice?.summary?.traits ?? [],
    },
  };
}

export function toReferencePayload(refs: Reference[], inline: string[]): Pick<Reference, "title" | "content">[] {
  return [
    ...refs.map((r) => ({ title: r.title, content: r.content })),
    ...inline.filter((t) => t.trim()).map((content, i) => ({ title: `Pasted reference ${i + 1}`, content })),
  ];
}

export function describeError(error: AiError): string {
  return error.message;
}
