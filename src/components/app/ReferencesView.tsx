"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useWorkspace, useWorkspaceActions } from "@/lib/store";
import type { Reference } from "@/lib/types";
import { cx, excerpt, formatDate, openingLine } from "@/lib/utils";
import { Button, TextAction, Textarea } from "@/components/ui";
import { EmptyState } from "./EmptyState";
import { PageHeader } from "./PageHeader";
import { newEntry, TextEntryList, type TextEntry } from "@/components/create/TextEntryList";

export function ReferencesView() {
  const { references } = useWorkspace();
  const { addReference, updateReference, removeReference } = useWorkspaceActions();
  const [adding, setAdding] = useState(references.length === 0);
  const [entries, setEntries] = useState<TextEntry[]>([newEntry()]);
  const [openId, setOpenId] = useState<string | null>(null);

  const commit = () => {
    const usable = entries.filter((e) => e.content.trim());
    if (!usable.length) return toast.message("Paste or upload a post first.");
    usable.forEach((e) =>
      addReference({
        title: e.title || openingLine(e.content, 60),
        content: e.content.trim(),
        source: e.source,
        platform: "linkedin",
        useByDefault: true,
      }),
    );
    setEntries([newEntry()]);
    setAdding(false);
    toast.success(usable.length === 1 ? "Reference added." : `${usable.length} references added.`);
  };

  return (
    <div>
      <PageHeader
        index="02 · References"
        title="How you usually write"
        description="Posts Ideako studies for structure, vocabulary and personality. Ones marked “default” inform every generation; you can also pick specific ones per post."
        actions={
          !adding && (
            <Button variant="primary" size="sm" onClick={() => setAdding(true)}>
              + Add reference
            </Button>
          )
        }
      />

      {adding && (
        <section className="mb-14 grid gap-6 border-t border-line pt-6 animate-rise md:grid-cols-12">
          <div className="md:col-span-4">
            <p className="text-[17px] text-ink">New references</p>
            <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-ink-3">Paste or upload up to five posts. Ideako learns the shape of your writing, never the words.</p>
          </div>
          <div className="md:col-span-8">
            <TextEntryList entries={entries} onChange={setEntries} itemLabel="Reference" placeholder="Paste a previous post here…" addLabel="Add another reference" uploadLabel="Upload posts" />
            <div className="mt-6 flex items-center justify-end gap-5 border-t border-line pt-5">
              {references.length > 0 && <TextAction onClick={() => setAdding(false)}>Cancel</TextAction>}
              <Button variant="primary" size="sm" onClick={commit}>
                Save to library
              </Button>
            </div>
          </div>
        </section>
      )}

      {references.length === 0 ? (
        !adding && (
          <EmptyState
            title="No references yet."
            description="Add two or three posts you're proud of. Ideako learns the shape of your writing from them; it never copies the words."
            action={<Button variant="primary" onClick={() => setAdding(true)}>Add your first reference</Button>}
          />
        )
      ) : (
        <>
          <div className="flex items-baseline justify-between border-b border-line pb-3">
            <p className="label">Library <span className="text-ink-4">({references.length})</span></p>
            <p className="mono text-[11px] text-ink-4">Default · Added</p>
          </div>
          <ul>
            {references.map((ref, i) => (
              <ReferenceRow
                key={ref.id}
                index={String(i + 1).padStart(2, "0")}
                reference={ref}
                open={openId === ref.id}
                onToggle={() => setOpenId(openId === ref.id ? null : ref.id)}
                onUpdate={(patch) => updateReference(ref.id, patch)}
                onDelete={() => {
                  removeReference(ref.id);
                  toast.message("Reference removed.");
                }}
              />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function ReferenceRow({
  index,
  reference,
  open,
  onToggle,
  onUpdate,
  onDelete,
}: {
  index: string;
  reference: Reference;
  open: boolean;
  onToggle: () => void;
  onUpdate: (patch: Partial<Reference>) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState(reference.content);
  const dirty = draft !== reference.content;

  return (
    <li className="border-b border-line py-5">
      <div className="flex items-start justify-between gap-6">
        <button type="button" onClick={onToggle} className="group flex min-w-0 flex-1 items-baseline gap-5 text-left" aria-expanded={open}>
          <span className="label shrink-0">{index}</span>
          <span className="min-w-0">
            <span className="block truncate text-[20px] text-ink md:text-[24px]">{reference.title}</span>
            {!open && <span className="mt-1 block max-w-2xl text-[13.5px] leading-relaxed text-ink-3">{excerpt(reference.content, 160)}</span>}
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-5">
          <button
            type="button"
            role="switch"
            aria-checked={reference.useByDefault}
            aria-label="Use by default"
            onClick={() => onUpdate({ useByDefault: !reference.useByDefault })}
            className={cx("relative h-5 w-9 rounded-full border transition-colors", reference.useByDefault ? "border-ink bg-ink" : "border-line-2 bg-transparent")}
          >
            <span className={cx("absolute top-0.5 size-3.5 rounded-full transition-[left,background-color]", reference.useByDefault ? "left-[18px] bg-accent" : "left-0.5 bg-ink-4")} />
          </button>
          <span className="mono hidden text-[11.5px] text-ink-4 sm:block">{formatDate(reference.createdAt)}</span>
        </div>
      </div>

      {open && (
        <div className="mt-5 animate-fade md:pl-10">
          <Textarea autosize minRows={5} value={draft} onChange={(e) => setDraft(e.target.value)} className="text-[15px]" />
          <div className="mt-3 flex items-center justify-between">
            <TextAction onClick={onDelete} className="text-danger hover:text-danger">Delete</TextAction>
            <div className="flex items-center gap-4">
              {dirty && <TextAction onClick={() => setDraft(reference.content)}>Discard</TextAction>}
              <Button
                size="sm"
                variant="primary"
                disabled={!dirty || !draft.trim()}
                onClick={() => {
                  onUpdate({ content: draft.trim(), title: openingLine(draft, 60) });
                  toast.success("Reference updated.");
                }}
              >
                Save changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </li>
  );
}
