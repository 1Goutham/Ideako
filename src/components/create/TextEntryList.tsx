"use client";

import { useRef } from "react";
import { toast } from "sonner";
import { ACCEPTED_TEXT_FILES, MAX_UPLOAD_BYTES } from "@/lib/constants";
import { cx, isTextLike, readTextFile, uid } from "@/lib/utils";
import { TextAction, Textarea } from "@/components/ui";

export interface TextEntry {
  id: string;
  title: string;
  content: string;
  source: "paste" | "upload";
}

interface Props {
  entries: TextEntry[];
  onChange: (entries: TextEntry[]) => void;
  itemLabel: string;
  placeholder: string;
  addLabel?: string;
  uploadLabel?: string;
  max?: number;
  className?: string;
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

  const update = (id: string, patch: Partial<TextEntry>) => onChange(entries.map((e) => (e.id === id ? { ...e, ...patch } : e)));
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
    <div className={cx("flex flex-col gap-4", className)}>
      {entries.map((entry, i) => (
        <div key={entry.id} className="border-t border-line animate-fade">
          <div className="flex items-center justify-between gap-3 py-2.5">
            <span className="flex min-w-0 items-center gap-3">
              <span className="label">
                {itemLabel} {String(i + 1).padStart(2, "0")}
              </span>
              {entry.source === "upload" && entry.title && <span className="truncate text-[12px] text-ink-3">{entry.title}</span>}
            </span>
            <TextAction onClick={() => remove(entry.id)} aria-label={`Remove ${itemLabel.toLowerCase()} ${i + 1}`}>
              Remove
            </TextAction>
          </div>
          <Textarea
            bare
            autosize
            minRows={4}
            value={entry.content}
            onChange={(e) => update(entry.id, { content: e.target.value })}
            placeholder={placeholder}
            className="pb-3 text-[15px] leading-relaxed"
          />
        </div>
      ))}

      <div className={cx("flex flex-wrap items-center gap-x-5 gap-y-2", entries.length > 0 && "border-t border-line pt-3")}>
        <TextAction onClick={add} disabled={entries.length >= max}>
          + {entries.length ? addLabel : `Paste ${itemLabel.toLowerCase()}`}
        </TextAction>
        <TextAction onClick={() => fileRef.current?.click()} disabled={entries.length >= max}>
          ↑ {uploadLabel}
        </TextAction>
        <input ref={fileRef} type="file" accept={ACCEPTED_TEXT_FILES} multiple hidden onChange={(e) => onFiles(e.target.files)} />
        <span className="mono text-[11px] text-ink-4">.txt / .md</span>
      </div>
    </div>
  );
}
