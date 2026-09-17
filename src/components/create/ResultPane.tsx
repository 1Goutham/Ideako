"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { AiError } from "@/lib/ai/contracts";
import { Button } from "@/components/ui";

const STAGES = ["Reading your voice", "Studying your references", "Finding the angle", "Writing the hook", "Shaping the post"];

export function ResultEmpty({ hasVoice }: { hasVoice: boolean }) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-lg border border-line bg-surface/60 px-6 py-14 text-center">
      <Image src="/logo.png" alt="" width={44} height={44} className="opacity-90" />
      <p className="mt-5 text-[15px] font-medium text-ink">Your post will appear here</p>
      <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed text-ink-3">
        {hasVoice
          ? "Ideako writes in your voice, then you refine. Edit any line by hand, sharpen the hook, or ask for a different angle."
          : "Describe your idea and Ideako writes a first draft. Then you refine it until it sounds like you."}
      </p>
      <ol className="mt-7 grid gap-2 text-left text-[12.5px] text-ink-3 sm:grid-cols-3 sm:gap-6">
        <li><span className="mr-1.5 font-semibold text-ink-4">01</span> Describe your idea</li>
        <li><span className="mr-1.5 font-semibold text-ink-4">02</span> Generate and refine</li>
        <li><span className="mr-1.5 font-semibold text-ink-4">03</span> Add hashtags, save, post</li>
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
    <div className="rounded-lg border border-line bg-surface animate-fade" aria-live="polite" aria-busy="true">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <span className="text-[13px] font-medium text-ink">Ideako is thinking</span>
        <span className="text-[12px] text-ink-3 transition-opacity">{STAGES[i]}…</span>
      </div>
      <div className="space-y-3 px-6 py-6">
        <div className="h-3.5 w-[82%] rounded animate-shimmer" />
        <div className="h-3.5 w-[64%] rounded animate-shimmer" />
        <div className="h-3 w-0" />
        <div className="h-3.5 w-[92%] rounded animate-shimmer" />
        <div className="h-3.5 w-[88%] rounded animate-shimmer" />
        <div className="h-3.5 w-[70%] rounded animate-shimmer" />
        <div className="h-3 w-0" />
        <div className="h-3.5 w-[76%] rounded animate-shimmer" />
        <div className="h-3.5 w-[40%] rounded animate-shimmer" />
      </div>
      <p className="border-t border-line px-5 py-2.5 text-[11.5px] text-ink-4">Your brief stays exactly as you wrote it.</p>
    </div>
  );
}

export function ResultError({ error, onRetry }: { error: AiError; onRetry: () => void }) {
  const notConfigured = error.code === "not_configured";
  return (
    <div className="rounded-lg border border-line bg-surface px-6 py-10 text-center animate-rise" role="alert">
      <p className="text-[15px] font-medium text-ink">{notConfigured ? "Ideako isn't connected yet" : "That didn't go through"}</p>
      <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-relaxed text-ink-3">{error.message}</p>
      {notConfigured && (
        <pre className="mx-auto mt-4 w-fit rounded-md bg-surface-2 px-3 py-2 text-left text-[12px] text-ink-2">GEMINI_API_KEY=your-key</pre>
      )}
      <p className="mt-3 text-[12px] text-ink-4">Nothing you wrote was lost.</p>
      {error.retryable && (
        <Button size="sm" className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
