"use client";

import Link from "next/link";
import { useState } from "react";
import type { Reference } from "@/lib/types";
import { cx, excerpt } from "@/lib/utils";
import { Disclosure } from "@/components/ui";
import { TextEntryList, type TextEntry } from "./TextEntryList";

interface Props {
  library: Reference[];
  selectedIds: string[];
  onSelectedChange: (ids: string[]) => void;
  inline: TextEntry[];
  onInlineChange: (entries: TextEntry[]) => void;
}

export function ReferenceBlock({ library, selectedIds, onSelectedChange, inline, onInlineChange }: Props) {
  const inlineCount = inline.filter((e) => e.content.trim()).length;
  const total = selectedIds.length + inlineCount;
  const [open, setOpen] = useState(false);

  const toggle = (id: string) => onSelectedChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);

  return (
    <Disclosure
      index="05"
      title="Give Ideako a reference"
      description="Show Ideako how you usually write. Optional."
      meta={total > 0 ? `${total} in use` : undefined}
      open={open}
      onOpenChange={setOpen}
      className="border-b-0"
    >
      <div className="flex flex-col gap-8 pl-0 md:pl-10">
        {library.length > 0 && (
          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <p className="label">From your library</p>
              <Link href="/references" className="link-underline text-[12.5px] text-ink-3 hover:text-ink">
                Manage
              </Link>
            </div>
            <ul className="border-t border-line">
              {library.map((ref) => {
                const active = selectedIds.includes(ref.id);
                return (
                  <li key={ref.id} className="border-b border-line">
                    <button type="button" onClick={() => toggle(ref.id)} aria-pressed={active} className="group flex w-full items-start gap-4 py-3 text-left">
                      <span className={cx("mt-2 size-2 shrink-0 rounded-full border transition-colors", active ? "border-ink bg-ink" : "border-line-2 group-hover:border-ink")} aria-hidden="true" />
                      <span className="min-w-0">
                        <span className={cx("block truncate text-[14px]", active ? "text-ink" : "text-ink-2")}>{ref.title}</span>
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
          <p className="label mb-3">{library.length ? "Or paste one for this post" : "Paste a previous post"}</p>
          <TextEntryList entries={inline} onChange={onInlineChange} itemLabel="Reference" placeholder="Paste your previous post here…" addLabel="Add another reference" max={3} />
        </div>

        <p className="max-w-md text-[12px] leading-relaxed text-ink-4">
          Ideako reads references for sentence structure, vocabulary, tone, formatting and personality. It writes something original in that style; it never copies.
        </p>
      </div>
    </Disclosure>
  );
}
