"use client";

import { useState } from "react";
import type { HashtagGroups, HashtagState } from "@/lib/types";
import { cx } from "@/lib/utils";
import { Button, Chip, TextAction, ThinkingDots } from "@/components/ui";

type GroupKey = keyof HashtagGroups;
const GROUPS: { key: GroupKey; label: string; hint: string }[] = [
  { key: "recommended", label: "Recommended", hint: "Best balance of relevance and reach for this post." },
  { key: "broader", label: "Broader", hint: "Larger tags that widen distribution." },
  { key: "niche", label: "Niche", hint: "Specific communities who care about this." },
];

export function HashtagPanel({
  state,
  loading,
  onGenerate,
  onToggle,
  onCopy,
  onAppend,
  alreadyInPost,
}: {
  state: HashtagState;
  loading: boolean;
  onGenerate: () => void;
  onToggle: (tag: string) => void;
  onCopy: () => void;
  onAppend: () => void;
  alreadyInPost: boolean;
}) {
  const [group, setGroup] = useState<GroupKey>("recommended");
  const groups = state.groups;
  const selected = state.selected;

  return (
    <section className="animate-rise">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <p className="label">Hashtags</p>
        {!groups && !loading && (
          <Button size="sm" onClick={onGenerate}>
            Suggest hashtags
          </Button>
        )}
        {loading && (
          <span className="mono flex items-center gap-2 text-[11px] text-ink-3">
            Analysing <ThinkingDots className="text-ink-3" />
          </span>
        )}
      </div>

      {!groups && !loading && <p className="py-4 text-[13px] text-ink-3">Find relevant hashtags for this post, based on topic, industry, audience and intent.</p>}

      {groups && (
        <div className="pt-4">
          <div className="flex items-center gap-6" role="tablist" aria-label="Hashtag groups">
            {GROUPS.map((g) => {
              const count = groups[g.key].filter((h) => selected.includes(h.tag)).length;
              const active = group === g.key;
              return (
                <button
                  key={g.key}
                  role="tab"
                  aria-selected={active}
                  title={g.hint}
                  onClick={() => setGroup(g.key)}
                  className={cx("link-underline flex items-baseline gap-1.5 text-[14px] transition-colors", active ? "text-ink after:scale-x-100" : "text-ink-3 hover:text-ink")}
                >
                  {g.label}
                  {count > 0 && <span className="mono text-[10.5px] text-ink-4">{count}</span>}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-[12.5px] text-ink-4">{GROUPS.find((g) => g.key === group)?.hint}</p>

          <ul className="mt-4 flex flex-wrap gap-2">
            {groups[group].map((h) => {
              const on = selected.includes(h.tag);
              return (
                <li key={h.tag}>
                  <Chip checkable size="sm" selected={on} onClick={() => onToggle(h.tag)} title={h.reason}>
                    #{h.tag}
                  </Chip>
                </li>
              );
            })}
            {groups[group].length === 0 && <li className="text-[13px] text-ink-4">Nothing here for this post.</li>}
          </ul>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
            <p className="mono text-[11.5px] text-ink-3">{selected.length ? `${selected.length} selected` : "Nothing selected"}</p>
            <div className="flex items-center gap-3">
              <TextAction onClick={onGenerate} disabled={loading} title="Suggest a fresh set">Regenerate</TextAction>
              <TextAction onClick={onCopy} disabled={!selected.length}>Copy selected</TextAction>
              <TextAction onClick={onAppend} disabled={!selected.length || alreadyInPost} title={alreadyInPost ? "Already added to the post" : "Add selected hashtags to the end of the post"}>
                {alreadyInPost ? "Added" : "Add to post"}
              </TextAction>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
