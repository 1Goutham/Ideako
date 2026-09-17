"use client";

import type { PostInsight } from "@/lib/types";
import { cx } from "@/lib/utils";
import { TextAction, ThinkingDots } from "@/components/ui";

const RATING_LABEL: Record<PostInsight["hookStrength"], string> = { strong: "Strong", moderate: "Could be sharper", weak: "Weak" };
const READ_LABEL: Record<PostInsight["readability"], string> = { easy: "Easy", moderate: "Moderate", dense: "Dense" };

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
    <section className="animate-rise">
      <div className="flex items-center justify-between border-b border-line pb-3">
        <p className="label">Ideako&apos;s take</p>
        {loading ? (
          <span className="mono flex items-center gap-2 text-[11px] text-ink-3">
            Reading <ThinkingDots className="text-ink-3" />
          </span>
        ) : stale || !insight ? (
          <TextAction onClick={onRecheck}>{insight ? "Re-check after edits" : "Get a read"}</TextAction>
        ) : null}
      </div>

      {insight ? (
        <div className={cx("transition-opacity", stale && "opacity-50")}>
          <dl className="grid grid-cols-1 divide-y divide-line border-b border-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {[
              { k: "Hook", v: RATING_LABEL[insight.hookStrength] },
              { k: "Tone", v: insight.tone },
              { k: "Readability", v: READ_LABEL[insight.readability] },
            ].map((item, i) => (
              <div key={item.k} className={cx("py-4", i > 0 && "sm:pl-5")}>
                <dt className="label">{item.k}</dt>
                <dd className="mt-2 text-[16px] text-ink">{item.v}</dd>
              </div>
            ))}
          </dl>
          <div className="py-4">
            <p className="label">Suggested improvement</p>
            <p className="mt-2 max-w-xl text-[14.5px] leading-relaxed text-ink-2">{insight.suggestion}</p>
            {insight.hookStrength !== "strong" && (
              <div className="mt-3">
                <TextAction onClick={onImproveHook}>Improve the hook</TextAction>
              </div>
            )}
          </div>
        </div>
      ) : (
        !loading && <p className="py-4 text-[13px] text-ink-3">A short, honest read on hook, tone and readability.</p>
      )}
    </section>
  );
}
