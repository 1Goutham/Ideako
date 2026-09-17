"use client";

import { useState } from "react";
import type { HashtagGroups, HashtagState } from "@/lib/types";
import { cx } from "@/lib/utils";
import { Button, Chip, IconCheck, IconRefresh, TextAction, ThinkingDots } from "@/components/ui";

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
    <section className="rounded-lg border border-line bg-surface animate-rise">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
        <div>
          <p className="text-[14px] font-medium text-ink">Hashtags</p>
          <p className="mt-0.5 text-[13px] text-ink-3">
            {groups ? "Pick the ones that fit. Ideako read the post, your industry and audience." : "Find relevant hashtags for this post."}
          </p>
        </div>
        {!groups && !loading && (
          <Button size="sm" onClick={onGenerate}>
            Suggest hashtags
          </Button>
        )}
        {loading && (
          <span className="text-[12.5px] text-ink-3">
            Analysing <ThinkingDots className="ml-1 text-ink-3" />
          </span>
        )}
      </div>

      {groups && (
        <div className="border-t border-line px-4 py-4 sm:px-5">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar" role="tablist" aria-label="Hashtag groups">
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
                  className={cx(
                    "flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium transition-colors",
                    active ? "bg-surface-2 text-ink" : "text-ink-3 hover:text-ink",
                  )}
                >
                  {g.label}
                  {count > 0 && <span className="text-[11px] text-ink-4">{count}</span>}
                </button>
              );
            })}
          </div>

          <p className="mt-3 text-[12px] text-ink-4">{GROUPS.find((g) => g.key === group)?.hint}</p>

          <ul className="mt-3 flex flex-wrap gap-2">
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

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3.5">
            <p className="text-[12.5px] text-ink-3">
              {selected.length ? (
                <>
                  <span className="font-medium text-ink">{selected.length}</span> selected
                </>
              ) : (
                "Nothing selected"
              )}
            </p>
            <div className="flex items-center gap-0.5">
              <TextAction onClick={onGenerate} disabled={loading} title="Suggest a fresh set">
                <IconRefresh size={14} /> Regenerate
              </TextAction>
              <TextAction onClick={onCopy} disabled={!selected.length}>
                Copy selected
              </TextAction>
              <TextAction onClick={onAppend} disabled={!selected.length || alreadyInPost} title={alreadyInPost ? "Already added to the post" : "Add selected hashtags to the end of the post"}>
                {alreadyInPost ? (
                  <>
                    <IconCheck size={14} /> Added
                  </>
                ) : (
                  "Add to post"
                )}
              </TextAction>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
