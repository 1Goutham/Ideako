"use client";

import { CONTENT_TYPES, LENGTHS, PLATFORMS, TONES } from "@/lib/constants";
import type { ContentTypeKey, LengthKey, Reference, ToneKey } from "@/lib/types";
import { Button, Chip, ChipGroup, IconArrowUpRight, Segmented, Textarea } from "@/components/ui";
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

function Row({ index, label, aside, children }: { index: string; label: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="border-t border-line pt-4">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <span className="flex items-baseline gap-4">
          <span className="label">{index}</span>
          <span className="text-[15px] text-ink">{label}</span>
        </span>
        {aside && <span className="mono text-[11.5px] text-ink-4">{aside}</span>}
      </div>
      {children}
    </div>
  );
}

export function Composer({ value, onChange, onSubmit, generating, hasResult, library, voiceTones, writingAs }: Props) {
  const canSubmit = value.idea.trim().length > 0 && !generating;
  const platform = PLATFORMS.linkedin;
  const voiceHint = voiceTones.length ? TONES.filter((t) => voiceTones.includes(t.key)).map((t) => t.label).join(", ") : "as described under Voice";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) onSubmit();
      }}
      className="flex flex-col gap-8"
    >
      <div>
        <p className="label mb-4">Create</p>
        <h1 className="display text-[40px] text-ink md:text-[56px]">Create a post</h1>
        <p className="mt-4 text-[13.5px] text-ink-3">
          Writing as <span className="text-ink">{writingAs}</span> · {platform.label}
        </p>
      </div>

      <Row index="01" label="What do you want to talk about?" aside={value.idea.length > 0 ? `${value.idea.length} chars` : undefined}>
        <Textarea
          bare
          autosize
          minRows={4}
          value={value.idea}
          onChange={(e) => onChange({ idea: e.target.value })}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canSubmit) {
              e.preventDefault();
              onSubmit();
            }
          }}
          placeholder="An idea, a rough draft, a few bullet points, a story from this week…"
          className="text-[20px] leading-snug placeholder:text-ink-4 md:text-[24px]"
        />
      </Row>

      <Row index="02" label="Content type">
        <ChipGroup>
          {CONTENT_TYPES.map((c) => (
            <Chip key={c.key} size="sm" selected={value.contentType === c.key} onClick={() => onChange({ contentType: c.key })} title={c.guidance}>
              {c.label}
            </Chip>
          ))}
        </ChipGroup>
      </Row>

      <Row index="03" label="Tone" aside={value.tone === null ? `Your voice: ${voiceHint}` : undefined}>
        <ChipGroup>
          <Chip size="sm" selected={value.tone === null} onClick={() => onChange({ tone: null })} title="Use the voice profile you taught Ideako">
            Your voice
          </Chip>
          {TONES.map((t) => (
            <Chip key={t.key} size="sm" selected={value.tone === t.key} onClick={() => onChange({ tone: t.key })} title={t.hint}>
              {t.label}
            </Chip>
          ))}
        </ChipGroup>
      </Row>

      <Row index="04" label="Length" aside={LENGTHS.find((l) => l.key === value.length)?.words}>
        <Segmented
          ariaLabel="Length"
          value={value.length}
          onChange={(length) => onChange({ length })}
          options={LENGTHS.map((l) => ({ value: l.key, label: l.label, hint: l.words }))}
        />
      </Row>

      <ReferenceBlock
        library={library}
        selectedIds={value.referenceIds}
        onSelectedChange={(referenceIds) => onChange({ referenceIds })}
        inline={value.inlineEntries}
        onInlineChange={(inlineEntries) => onChange({ inlineEntries })}
      />

      <div className="flex flex-col-reverse gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="mono hidden text-[11px] text-ink-4 sm:block">⌘ + Enter to generate</p>
        <Button type="submit" variant="primary" size="lg" disabled={!canSubmit} loading={generating} className="sm:min-w-[200px]">
          {generating ? "Writing…" : hasResult ? "Generate again" : "Generate post"}
          {!generating && <IconArrowUpRight size={16} />}
        </Button>
      </div>
    </form>
  );
}
