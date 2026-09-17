/**
 * Shared request/response contracts between the client and the API routes.
 * Keep this file free of server-only imports.
 */
import type {
  CreateBrief,
  HashtagGroups,
  Profile,
  Reference,
  RefineActionKey,
  Voice,
} from "../types";

export type AiErrorCode =
  | "not_configured"
  | "invalid_request"
  | "rate_limited"
  | "timeout"
  | "upstream"
  | "blocked"
  | "empty"
  | "malformed"
  | "network";

export interface AiError {
  code: AiErrorCode;
  message: string;
  retryable: boolean;
}

export type AiResponse<T> = { ok: true; data: T } | { ok: false; error: AiError };

/** Everything the model needs to know about who it is writing as. */
export interface VoiceContext {
  profile: Pick<Profile, "creatingFor" | "name" | "companyName" | "role" | "industry" | "website">;
  voice: Pick<
    Voice,
    "tones" | "description" | "brandDescription" | "audience" | "writingPreferences" | "avoid"
  > & { knowledge: { name: string; content: string }[]; summaryTraits: string[] };
}

export interface GenerateRequest {
  context: VoiceContext;
  brief: Omit<CreateBrief, "referenceIds"> & { references: Pick<Reference, "title" | "content">[] };
}
export interface GenerateResult {
  title: string;
  post: string;
}

export interface RefineRequest {
  context: VoiceContext;
  platform: CreateBrief["platform"];
  post: string;
  action: RefineActionKey;
  /** Optional: the original brief for grounding. */
  idea?: string;
}
export interface RefineResult {
  post: string;
}

export interface HashtagRequest {
  context: VoiceContext;
  platform: CreateBrief["platform"];
  post: string;
}
export type HashtagResult = HashtagGroups;

export interface InsightRequest {
  context: VoiceContext;
  platform: CreateBrief["platform"];
  post: string;
}
export interface InsightResult {
  hookStrength: "strong" | "moderate" | "weak";
  tone: string;
  readability: "easy" | "moderate" | "dense";
  suggestion: string;
}

export interface VoiceAnalysisRequest {
  context: VoiceContext;
  references: Pick<Reference, "title" | "content">[];
}
export interface VoiceAnalysisResult {
  traits: string[];
  description: string;
}
