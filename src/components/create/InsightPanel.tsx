"use client";

import type { PostInsight } from "@/lib/types";
import { cx } from "@/lib/utils";
import { ThinkingDots } from "@/components/ui";

const RATING_LABEL: Record<PostInsight["hookStrength"], string> = { strong: "Strong", moderate: "Could be sharper", weak: "Weak" };
const READ_LABEL: Record<PostInsight["readability"], string> = { easy: "Easy", moderate: "Moderate", dense: "Dense" };

function tone(v: "strong" | "moderate" | "weak" | "easy" | "dense") {
  if (v === "strong" || v === "easy") return "text-success";
  if (v === "weak" || v === "dense") return "text-danger";
  return "text-warn";
}

export function InsightPanel({
  insight,
  loading,
  stale,
  onRecheck,
  onImproveHook,
}: {
  insight: PostInsight | null;
  loading: boolean;
  stale: boolean;
  onRecheck: () => void;
  onImproveHook: () => void;
}) {
  return (
    <section className="rounded-lg border border-line bg-surface/70 px-4 py-4 sm:px-5 animate-rise">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-medium text-ink">Ideako&apos;s take</p>
        {loading ? (
          <span className="text-[12px] text-ink-3">
            Reading <ThinkingDots className="ml-1 text-ink-3" />
          </span>
        ) : stale || !insight ? (
          <button type="button" onClick={onRecheck} className="text-[12px] font-medium text-ink-3 hover:text-ink">
            {insight ? "Re-check after edits" : "Get a read"}
          </button>
        ) : null}
      </div>

      {insight ? (
        <div className={cx("mt-3 transition-opacity", stale && "opacity-60")}>
          <dl className="grid grid-cols-3 gap-3">
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-ink-4">Hook</dt>
              <dd className={cx("mt-0.5 text-[13.5px] font-medium", tone(insight.hookStrength))}>{RATING_LABEL[insight.hookStrength]}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-ink-4">Tone</dt>
              <dd className="mt-0.5 text-[13.5px] font-medium text-ink">{insight.tone}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-ink-4">Readability</dt>
              <dd className={cx("mt-0.5 text-[13.5px] font-medium", tone(insight.readability))}>{READ_LABEL[insight.readability]}</dd>
            </div>
          </dl>
          <div className="mt-3.5 border-t border-line pt-3">
            <p className="text-[11px] uppercase tracking-wider text-ink-4">Suggested improvement</p>
            <p className="mt-1 text-[13.5px] leading-relaxed text-ink-2">{insight.suggestion}</p>
            {insight.hookStrength !== "strong" && (
              <button type="button" onClick={onImproveHook} className="mt-2 text-[12.5px] font-medium text-ink underline-offset-4 hover:underline">
                Improve the hook
              </button>
            )}
          </div>
        </div>
      ) : (
        !loading && <p className="mt-2 text-[12.5px] text-ink-3">A short, honest read on hook, tone and readability.</p>
      )}
    </section>
  );
}
