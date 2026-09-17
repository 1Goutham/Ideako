"use client";

import Link from "next/link";
import { useState } from "react";
import type { Reference } from "@/lib/types";
import { cx, excerpt } from "@/lib/utils";
import { Disclosure, IconCheck } from "@/components/ui";
import { TextEntryList, type TextEntry } from "./TextEntryList";

interface Props {
  library: Reference[];
  selectedIds: string[];
  onSelectedChange: (ids: string[]) => void;
  inline: TextEntry[];
  onInlineChange: (entries: TextEntry[]) => void;
}

/**
 * "Give Ideako a reference" — optional, collapsed by default so the composer
 * stays calm. Combines the saved library with one-off pasted posts.
 */
export function ReferenceBlock({ library, selectedIds, onSelectedChange, inline, onInlineChange }: Props) {
  const inlineCount = inline.filter((e) => e.content.trim()).length;
  const total = selectedIds.length + inlineCount;
  const [open, setOpen] = useState(false);

  const toggle = (id: string) =>
    onSelectedChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);

  return (
    <Disclosure
      title="Give Ideako a reference"
      description="Show Ideako how you usually write. Optional."
      meta={total > 0 ? <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11.5px] font-medium text-ink-2">{total} in use</span> : null}
      open={open}
      onOpenChange={setOpen}
    >
      <div className="flex flex-col gap-6">
        {library.length > 0 && (
          <div>
            <div className="mb-2.5 flex items-baseline justify-between">
              <p className="text-[13px] font-medium text-ink">From your library</p>
              <Link href="/references" className="text-xs text-ink-3 hover:text-ink">
                Manage
              </Link>
            </div>
            <ul className="flex flex-col gap-1.5">
              {library.map((ref) => {
                const active = selectedIds.includes(ref.id);
                return (
                  <li key={ref.id}>
                    <button
                      type="button"
                      onClick={() => toggle(ref.id)}
                      aria-pressed={active}
                      className={cx(
                        "flex w-full items-start gap-3 rounded-md border px-3.5 py-3 text-left transition-colors",
                        active ? "border-ink bg-surface" : "border-line bg-surface hover:border-ink-4",
                      )}
                    >
                      <span
                        className={cx(
                          "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-sm border",
                          active ? "border-ink bg-ink text-white" : "border-line-2",
                        )}
                        aria-hidden="true"
                      >
                        {active && <IconCheck size={11} strokeWidth={2.6} />}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[13.5px] font-medium text-ink">{ref.title}</span>
                        <span className="mt-0.5 block text-[12.5px] leading-relaxed text-ink-3">{excerpt(ref.content, 110)}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div>
          <p className="mb-2.5 text-[13px] font-medium text-ink">{library.length ? "Or paste one for this post" : "Paste a previous post"}</p>
          <TextEntryList
            entries={inline}
            onChange={onInlineChange}
            itemLabel="Reference"
            placeholder="Paste your previous post here…"
            addLabel="Add another reference"
            max={3}
          />
        </div>

        <p className="text-[12px] leading-relaxed text-ink-4">
          Ideako reads references for sentence structure, vocabulary, tone, formatting and personality. It writes something
          original in that style; it never copies.
        </p>
      </div>
    </Disclosure>
  );
}
