import type { AiResponse } from "../contracts";

export interface CompletionOptions {
  system: string;
  prompt: string;
  /** Ask the provider for a JSON object; parsing is still tolerant. */
  json?: boolean;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface ProviderStatus {
  id: ProviderId;
  label: string;
  /** Where a free key comes from. */
  signupUrl: string;
  configured: boolean;
  /** Resolved model, when known. */
  model: string | null;
  note?: string;
}

export type ProviderId = "gemini" | "groq" | "openrouter" | "custom";

export interface Provider {
  id: ProviderId;
  label: string;
  signupUrl: string;
  configured(): boolean;
  complete(opts: CompletionOptions): Promise<AiResponse<string> & { model?: string }>;
  status(): Promise<ProviderStatus>;
}
