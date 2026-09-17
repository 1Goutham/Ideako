"use client";

import { useRef } from "react";
import { toast } from "sonner";
import { ACCEPTED_TEXT_FILES, MAX_UPLOAD_BYTES } from "@/lib/constants";
import { cx, isTextLike, readTextFile, uid } from "@/lib/utils";
import { Button, IconUpload, IconX, Textarea } from "@/components/ui";

export interface TextEntry {
  id: string;
  title: string;
  content: string;
  source: "paste" | "upload";
}

interface Props {
  entries: TextEntry[];
  onChange: (entries: TextEntry[]) => void;
  /** Label prefix for each entry, e.g. "Reference" → "Reference 01". */
  itemLabel: string;
  placeholder: string;
  addLabel?: string;
  uploadLabel?: string;
  max?: number;
  className?: string;
  /** Start with one empty entry so the user can paste immediately. */
  startWithOne?: boolean;
}

export function newEntry(partial: Partial<TextEntry> = {}): TextEntry {
  return { id: uid("ent"), title: "", content: "", source: "paste", ...partial };
}

export function TextEntryList({
  entries,
  onChange,
  itemLabel,
  placeholder,
  addLabel = "Add another",
  uploadLabel = "Upload file",
  max = 5,
  className,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const update = (id: string, patch: Partial<TextEntry>) =>
    onChange(entries.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const remove = (id: string) => onChange(entries.filter((e) => e.id !== id));
  const add = () => entries.length < max && onChange([...entries, newEntry()]);

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const next = [...entries];
    for (const file of Array.from(files)) {
      if (next.length >= max) {
        toast.message(`You can add up to ${max} here.`);
        break;
      }
      if (!isTextLike(file)) {
        toast.error(`${file.name} isn't a text file. Ideako reads .txt and .md for now; paste the content instead.`);
        continue;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        toast.error(`${file.name} is too large. Keep files under ${Math.round(MAX_UPLOAD_BYTES / 1024)} KB.`);
        continue;
      }
      try {
        const content = (await readTextFile(file)).trim();
        if (!content) {
          toast.error(`${file.name} looks empty.`);
          continue;
        }
        next.push(newEntry({ title: file.name.replace(/\.[^.]+$/, ""), content, source: "upload" }));
      } catch {
        toast.error(`Couldn't read ${file.name}.`);
      }
    }
    onChange(next);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className={cx("flex flex-col gap-3", className)}>
      {entries.map((entry, i) => (
        <div key={entry.id} className="rounded-md border border-line bg-surface animate-fade">
          <div className="flex items-center justify-between gap-3 border-b border-line px-3.5 py-2">
            <span className="flex min-w-0 items-center gap-2 text-xs text-ink-3">
              <span className="font-semibold tracking-wider">
                {itemLabel} {String(i + 1).padStart(2, "0")}
              </span>
              {entry.source === "upload" && entry.title && (
                <span className="truncate rounded-sm bg-surface-2 px-1.5 py-0.5 text-[11px] text-ink-2">{entry.title}</span>
              )}
            </span>
            <button
              type="button"
              onClick={() => remove(entry.id)}
              className="flex size-6 items-center justify-center rounded-sm text-ink-4 hover:bg-surface-2 hover:text-ink"
              aria-label={`Remove ${itemLabel.toLowerCase()} ${i + 1}`}
            >
              <IconX size={14} />
            </button>
          </div>
          <Textarea
            bare
            autosize
            minRows={4}
            value={entry.content}
            onChange={(e) => update(entry.id, { content: e.target.value })}
            placeholder={placeholder}
            className="px-3.5 py-3 text-[14px] leading-relaxed"
          />
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" onClick={add} disabled={entries.length >= max}>
          + {entries.length ? addLabel : `Paste ${itemLabel.toLowerCase()}`}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => fileRef.current?.click()} disabled={entries.length >= max}>
          <IconUpload size={15} /> {uploadLabel}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED_TEXT_FILES}
          multiple
          hidden
          onChange={(e) => onFiles(e.target.files)}
        />
        <span className="text-[11.5px] text-ink-4">.txt or .md</span>
      </div>
    </div>
  );
}
