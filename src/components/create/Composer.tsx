"use client";

import { CONTENT_TYPES, LENGTHS, PLATFORMS, TONES } from "@/lib/constants";
import type { ContentTypeKey, LengthKey, Reference, ToneKey } from "@/lib/types";
import { Button, Chip, ChipGroup, Field, IconArrowUpRight, Segmented, Textarea } from "@/components/ui";
import { ReferenceBlock } from "./ReferenceBlock";
import type { TextEntry } from "./TextEntryList";

export interface ComposerValue {
  idea: string;
  contentType: ContentTypeKey;
  tone: ToneKey | null;
  length: LengthKey;
  referenceIds: string[];
  inlineEntries: TextEntry[];
}

interface Props {
  value: ComposerValue;
  onChange: (patch: Partial<ComposerValue>) => void;
  onSubmit: () => void;
  generating: boolean;
  hasResult: boolean;
  library: Reference[];
  voiceTones: ToneKey[];
  writingAs: string;
}

export function Composer({ value, onChange, onSubmit, generating, hasResult, library, voiceTones, writingAs }: Props) {
  const canSubmit = value.idea.trim().length > 0 && !generating;
  const platform = PLATFORMS.linkedin;
  const voiceHint = voiceTones.length
    ? TONES.filter((t) => voiceTones.includes(t.key)).map((t) => t.label).join(", ")
    : "As you describe it in Voice";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) onSubmit();
      }}
      className="flex flex-col gap-8"
    >
      <div>
        <p className="eyebrow mb-2">Create</p>
        <h1 className="text-[26px] font-medium leading-tight tracking-tight text-ink md:text-[30px]">Create a post</h1>
        <p className="mt-2 text-[14px] text-ink-3">
          Writing as <span className="text-ink-2">{writingAs}</span> · {platform.label}
        </p>
      </div>

      <Field label="What do you want to talk about?" aside={value.idea.length > 0 ? `${value.idea.length}` : undefined}>
        {(id) => (
          <Textarea
            id={id}
            autosize
            minRows={5}
            value={value.idea}
            onChange={(e) => onChange({ idea: e.target.value })}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canSubmit) {
                e.preventDefault();
                onSubmit();
              }
            }}
            placeholder={
              "An idea, a rough draft, a few bullet points, a story from this week…\n\ne.g. We shipped our first AI feature last month. Three things I'd tell myself before starting: the model was the easy part."
            }
            className="text-[15px]"
          />
        )}
      </Field>

      <Field label="Content type">
        {() => (
          <ChipGroup>
            {CONTENT_TYPES.map((c) => (
              <Chip key={c.key} selected={value.contentType === c.key} onClick={() => onChange({ contentType: c.key })} title={c.guidance}>
                {c.label}
              </Chip>
            ))}
          </ChipGroup>
        )}
      </Field>

      <Field label="Tone" hint={value.tone === null ? `Your voice: ${voiceHint}.` : undefined}>
        {() => (
          <ChipGroup>
            <Chip selected={value.tone === null} onClick={() => onChange({ tone: null })} title="Use the voice profile you taught Ideako">
              Your voice
            </Chip>
            {TONES.map((t) => (
              <Chip key={t.key} selected={value.tone === t.key} onClick={() => onChange({ tone: t.key })} title={t.hint}>
                {t.label}
              </Chip>
            ))}
          </ChipGroup>
        )}
      </Field>

      <Field label="Length" aside={LENGTHS.find((l) => l.key === value.length)?.words}>
        {() => (
          <Segmented
            ariaLabel="Length"
            value={value.length}
            onChange={(length) => onChange({ length })}
            options={LENGTHS.map((l) => ({ value: l.key, label: l.label, hint: l.words }))}
          />
        )}
      </Field>

      <ReferenceBlock
        library={library}
        selectedIds={value.referenceIds}
        onSelectedChange={(referenceIds) => onChange({ referenceIds })}
        inline={value.inlineEntries}
        onInlineChange={(inlineEntries) => onChange({ inlineEntries })}
      />

      <div className="flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="hidden text-xs text-ink-4 sm:block">
          <kbd className="rounded border border-line-2 bg-surface px-1.5 py-0.5 font-sans text-[10.5px] text-ink-3">⌘</kbd>
          <span className="mx-1">+</span>
          <kbd className="rounded border border-line-2 bg-surface px-1.5 py-0.5 font-sans text-[10.5px] text-ink-3">Enter</kbd>
          <span className="ml-2">to generate</span>
        </p>
        <Button type="submit" variant="primary" size="lg" disabled={!canSubmit} loading={generating} className="sm:min-w-[180px]">
          {generating ? "Writing…" : hasResult ? "Generate again" : "Generate post"}
          {!generating && <IconArrowUpRight size={16} />}
        </Button>
      </div>
    </form>
  );
}
