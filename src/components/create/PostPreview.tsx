"use client";

import { useState } from "react";
import { PLATFORMS } from "@/lib/constants";
import type { Platform } from "@/lib/types";
import { initials } from "@/lib/utils";

/**
 * A quiet approximation of how the post reads in the feed, including the
 * "…see more" fold. Useful for judging the hook; not a pixel-perfect clone.
 */
export function PostPreview({
  content,
  platform,
  name,
  subtitle,
  hashtags,
}: {
  content: string;
  platform: Platform;
  name: string;
  subtitle: string;
  hashtags: string[];
}) {
  const [expanded, setExpanded] = useState(false);
  const fold = PLATFORMS[platform].foldChars;
  const full = hashtags.length ? `${content.trimEnd()}\n\n${hashtags.map((h) => `#${h}`).join(" ")}` : content;
  const needsFold = full.length > fold;
  const shown = expanded || !needsFold ? full : full.slice(0, fold).trimEnd();

  return (
    <div className="px-5 py-5 sm:px-6">
      <div className="mx-auto max-w-[560px] rounded-lg border border-line bg-surface px-4 py-4 shadow-[0_1px_2px_rgb(20_23_26/0.04)]">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-surface-3 text-[12px] font-semibold text-ink-2">
            {initials(name)}
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[14px] font-semibold text-ink">{name}</p>
            <p className="truncate text-[12px] text-ink-3">{subtitle}</p>
            <p className="text-[11px] text-ink-4">Now</p>
          </div>
        </div>
        <p className="prose-post mt-3 text-[14px] text-ink">
          {shown}
          {needsFold && !expanded && (
            <>
              {" "}
              <button type="button" onClick={() => setExpanded(true)} className="text-ink-3 hover:text-ink">
                …see more
              </button>
            </>
          )}
        </p>
        {needsFold && expanded && (
          <button type="button" onClick={() => setExpanded(false)} className="mt-2 text-[12px] text-ink-3 hover:text-ink">
            Show less
          </button>
        )}
      </div>
      <p className="mt-3 text-center text-[11.5px] text-ink-4">
        {PLATFORMS[platform].label} folds the post after about {fold} characters. What shows above the fold is your hook.
      </p>
    </div>
  );
}
