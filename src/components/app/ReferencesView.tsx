"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useWorkspace, useWorkspaceActions } from "@/lib/store";
import type { Reference } from "@/lib/types";
import { cx, excerpt, formatDate, openingLine } from "@/lib/utils";
import { Button, IconTrash, IconX, Textarea, TextAction } from "@/components/ui";
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
    <div className="mx-auto max-w-[880px]">
      <PageHeader
        eyebrow="References"
        title="How you usually write"
        description="Posts Ideako studies for structure, vocabulary and personality. Ones marked “use by default” inform every generation; you can also pick specific ones per post."
        actions={
          !adding && (
            <Button variant="primary" size="sm" onClick={() => setAdding(true)}>
              + Add reference
            </Button>
          )
        }
      />

      {adding && (
        <section className="mb-8 rounded-lg border border-line bg-surface p-4 sm:p-5 animate-rise">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[14px] font-medium text-ink">New references</p>
            {references.length > 0 && (
              <button type="button" onClick={() => setAdding(false)} className="text-ink-4 hover:text-ink" aria-label="Close">
                <IconX size={16} />
              </button>
            )}
          </div>
          <TextEntryList entries={entries} onChange={setEntries} itemLabel="Reference" placeholder="Paste a previous post here…" addLabel="Add another reference" uploadLabel="Upload posts" />
          <div className="mt-4 flex justify-end gap-2 border-t border-line pt-4">
            <Button variant="primary" size="sm" onClick={commit}>
              Save to library
            </Button>
          </div>
        </section>
      )}

      {references.length === 0 ? (
        !adding && (
          <EmptyState
            title="No references yet"
            description="Add two or three posts you're proud of. Ideako learns the shape of your writing from them; it never copies the words."
            action={<Button variant="primary" onClick={() => setAdding(true)}>Add your first reference</Button>}
          />
        )
      ) : (
        <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
          {references.map((ref) => (
            <ReferenceRow
              key={ref.id}
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
      )}
    </div>
  );
}

function ReferenceRow({
  reference,
  open,
  onToggle,
  onUpdate,
  onDelete,
}: {
  reference: Reference;
  open: boolean;
  onToggle: () => void;
  onUpdate: (patch: Partial<Reference>) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState(reference.content);
  const dirty = draft !== reference.content;

  return (
    <li className="px-4 py-3.5 sm:px-5">
      <div className="flex items-start justify-between gap-4">
        <button type="button" onClick={onToggle} className="min-w-0 flex-1 text-left" aria-expanded={open}>
          <p className="truncate text-[14px] font-medium text-ink">{reference.title}</p>
          {!open && <p className="mt-0.5 text-[13px] leading-relaxed text-ink-3">{excerpt(reference.content, 160)}</p>}
          <p className="mt-1 text-[11.5px] text-ink-4">
            {reference.source === "upload" ? "Uploaded" : reference.source === "saved-post" ? "From saved" : "Pasted"} · {formatDate(reference.createdAt)}
          </p>
        </button>
        <label className="flex shrink-0 cursor-pointer items-center gap-2 text-[12px] text-ink-3">
          <span className="hidden sm:inline">Use by default</span>
          <span
            role="switch"
            aria-checked={reference.useByDefault}
            tabIndex={0}
            onClick={() => onUpdate({ useByDefault: !reference.useByDefault })}
            onKeyDown={(e) => (e.key === " " || e.key === "Enter") && (e.preventDefault(), onUpdate({ useByDefault: !reference.useByDefault }))}
            className={cx("relative h-5 w-9 rounded-full transition-colors", reference.useByDefault ? "bg-ink" : "bg-line-2")}
          >
            <span className={cx("absolute top-0.5 size-4 rounded-full bg-white transition-[left]", reference.useByDefault ? "left-[18px]" : "left-0.5")} />
          </span>
        </label>
      </div>

      {open && (
        <div className="mt-3 animate-fade">
          <Textarea autosize minRows={5} value={draft} onChange={(e) => setDraft(e.target.value)} className="text-[14px]" />
          <div className="mt-2 flex items-center justify-between">
            <TextAction onClick={onDelete} className="text-danger hover:bg-danger-soft hover:text-danger">
              <IconTrash size={14} /> Delete
            </TextAction>
            <div className="flex gap-1">
              {dirty && (
                <TextAction onClick={() => setDraft(reference.content)}>Discard</TextAction>
              )}
              <Button size="sm" variant="primary" disabled={!dirty || !draft.trim()} onClick={() => { onUpdate({ content: draft.trim(), title: openingLine(draft, 60) }); toast.success("Reference updated."); }}>
                Save changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </li>
  );
}
