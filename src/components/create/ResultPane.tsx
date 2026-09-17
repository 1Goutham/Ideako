"use client";

import { useEffect, useState } from "react";
import type { AiError } from "@/lib/ai/contracts";
import { Button } from "@/components/ui";

const STAGES = ["Reading your voice", "Studying your references", "Finding the angle", "Writing the hook", "Shaping the post"];

export function ResultEmpty({ hasVoice }: { hasVoice: boolean }) {
  return (
    <div className="flex min-h-[420px] flex-col justify-between border border-line-2 px-6 py-6">
      <p className="label">Output</p>
      <div>
        <p className="display text-[32px] text-ink md:text-[40px]">
          Your post will
          <br />
          appear here.
        </p>
        <p className="mt-5 max-w-sm text-[14px] leading-relaxed text-ink-3">
          {hasVoice
            ? "Ideako writes in your voice, then you refine. Edit any line by hand, sharpen the hook, or ask for a different angle."
            : "Describe your idea and Ideako writes a first draft. Then you refine it until it sounds like you."}
        </p>
      </div>
      <ol className="mt-10 grid gap-3 border-t border-line pt-5 text-[13px] text-ink-3 sm:grid-cols-3">
        <li><span className="label mr-3">01</span>Describe your idea</li>
        <li><span className="label mr-3">02</span>Generate and refine</li>
        <li><span className="label mr-3">03</span>Hashtags, save, post</li>
      </ol>
    </div>
  );
}

export function ResultLoading() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => Math.min(n + 1, STAGES.length - 1)), 1800);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="border border-line-2 bg-surface animate-fade" aria-live="polite" aria-busy="true">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <span className="text-[13.5px] text-ink">Ideako is thinking</span>
        <span className="mono text-[11px] text-ink-3">{STAGES[i]}…</span>
      </div>
      <div className="space-y-3.5 px-6 py-7">
        <div className="h-3 w-[82%] animate-shimmer" />
        <div className="h-3 w-[64%] animate-shimmer" />
        <div className="h-2 w-0" />
        <div className="h-3 w-[92%] animate-shimmer" />
        <div className="h-3 w-[88%] animate-shimmer" />
        <div className="h-3 w-[70%] animate-shimmer" />
        <div className="h-2 w-0" />
        <div className="h-3 w-[76%] animate-shimmer" />
        <div className="h-3 w-[40%] animate-shimmer" />
      </div>
      <p className="mono border-t border-line px-5 py-2.5 text-[11px] text-ink-4">Your brief stays exactly as you wrote it.</p>
    </div>
  );
}

export function ResultError({ error, onRetry }: { error: AiError; onRetry: () => void }) {
  const notConfigured = error.code === "not_configured";
  return (
    <div className="border border-line-2 px-6 py-8 animate-rise" role="alert">
      <p className="label">Output</p>
      <p className="display mt-4 text-[32px] text-ink">{notConfigured ? "Ideako isn't connected yet." : "That didn't go through."}</p>
      <p className="mt-4 max-w-md text-[14px] leading-relaxed text-ink-3">{error.message}</p>
      {notConfigured && (
        <pre className="mono mt-4 w-fit border border-line px-3 py-2 text-[12px] leading-relaxed text-ink-2">{"GEMINI_API_KEY=…   # free at aistudio.google.com\nGROQ_API_KEY=…     # free at console.groq.com"}</pre>
      )}
      <p className="mono mt-4 text-[11px] text-ink-4">Nothing you wrote was lost.</p>
      {error.retryable && (
        <Button size="sm" className="mt-6" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
