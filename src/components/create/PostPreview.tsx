"use client";

import { useState } from "react";
import { PLATFORMS } from "@/lib/constants";
import type { Platform } from "@/lib/types";
import { initials } from "@/lib/utils";

/** A quiet approximation of the feed, including the "…see more" fold. */
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
    <div className="px-6 py-8">
      <div className="mx-auto max-w-[540px]">
        <div className="flex items-center gap-3">
          <span className="mono flex size-10 items-center justify-center rounded-full border border-line-2 text-[12px] text-ink">{initials(name)}</span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[14px] text-ink">{name}</p>
            <p className="truncate text-[12px] text-ink-3">{subtitle}</p>
            <p className="mono text-[10.5px] text-ink-4">Now</p>
          </div>
        </div>
        <p className="prose-post mt-4 text-[15px] leading-relaxed text-ink">
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
          <button type="button" onClick={() => setExpanded(false)} className="link-underline mt-3 text-[12.5px] text-ink-3 hover:text-ink">
            Show less
          </button>
        )}
      </div>
      <p className="mono mt-8 text-center text-[11px] text-ink-4">
        {PLATFORMS[platform].label} folds after ~{fold} characters. Above the fold is your hook.
      </p>
    </div>
  );
}
