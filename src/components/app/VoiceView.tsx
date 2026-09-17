"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ai, buildVoiceContext } from "@/lib/ai/client";
import { TONES } from "@/lib/constants";
import { useWorkspace, useWorkspaceActions } from "@/lib/store";
import type { ToneKey } from "@/lib/types";
import { formatDate, nowIso, uid } from "@/lib/utils";
import { Button, Chip, ChipGroup, Field, IconX, Textarea, ThinkingDots } from "@/components/ui";
import { PageHeader } from "./PageHeader";
import { TextEntryList, type TextEntry } from "@/components/create/TextEntryList";

export function VoiceView() {
  const { profile, voice, references } = useWorkspace();
  const { saveVoice } = useWorkspaceActions();

  const [tones, setTones] = useState<ToneKey[]>(voice?.tones ?? []);
  const [description, setDescription] = useState(voice?.description ?? "");
  const [brandDescription, setBrandDescription] = useState(voice?.brandDescription ?? "");
  const [audience, setAudience] = useState(voice?.audience ?? "");
  const [writingPreferences, setWritingPreferences] = useState(voice?.writingPreferences ?? "");
  const [avoid, setAvoid] = useState(voice?.avoid ?? "");
  const [newDocs, setNewDocs] = useState<TextEntry[]>([]);
  const [analysing, setAnalysing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!voice) return;
    setTones(voice.tones);
    setDescription(voice.description);
    setBrandDescription(voice.brandDescription);
    setAudience(voice.audience);
    setWritingPreferences(voice.writingPreferences);
    setAvoid(voice.avoid);
  }, [voice]);

  const dirty =
    !!voice &&
    (tones.join() !== voice.tones.join() ||
      description !== voice.description ||
      brandDescription !== voice.brandDescription ||
      audience !== voice.audience ||
      writingPreferences !== voice.writingPreferences ||
      avoid !== voice.avoid ||
      newDocs.some((d) => d.content.trim()));

  const save = () => {
    setSaving(true);
    const knowledge = [
      ...(voice?.knowledge ?? []),
      ...newDocs
        .filter((d) => d.content.trim())
        .map((d, i) => ({ id: uid("doc"), name: d.title || `Document ${(voice?.knowledge.length ?? 0) + i + 1}`, content: d.content.trim(), source: d.source, addedAt: nowIso() })),
    ];
    saveVoice({ tones, description: description.trim(), brandDescription: brandDescription.trim(), audience: audience.trim(), writingPreferences: writingPreferences.trim(), avoid: avoid.trim(), knowledge });
    setNewDocs([]);
    setSaving(false);
    toast.success("Voice updated. Every new post uses it.");
  };

  const removeDoc = (id: string) => {
    saveVoice({ knowledge: (voice?.knowledge ?? []).filter((k) => k.id !== id) });
    toast.message("Document removed.");
  };

  const analyse = async () => {
    if (!profile) return;
    const current = saveVoice({ tones, description: description.trim(), brandDescription: brandDescription.trim(), audience: audience.trim(), writingPreferences: writingPreferences.trim(), avoid: avoid.trim() });
    setAnalysing(true);
    const res = await ai.analyseVoice({
      context: buildVoiceContext(profile, current),
      references: references.map((r) => ({ title: r.title, content: r.content })),
    });
    setAnalysing(false);
    if (!res.ok) return toast.error(res.error.message);
    saveVoice({ summary: { ...res.data, analysedAt: nowIso() } });
    toast.success("Ideako has re-read your voice.");
  };

  const canAnalyse = references.length > 0 || description.trim() || brandDescription.trim() || (voice?.knowledge.length ?? 0) > 0;
  const summary = voice?.summary ?? null;
  const subject = profile?.creatingFor === "myself" ? "you" : profile?.companyName || "the brand";

  return (
    <div className="mx-auto max-w-[880px]">
      <PageHeader eyebrow="Voice" title="Your voice" description={`What Ideako knows about how ${subject === "you" ? "you write" : `${subject} communicates`}. Update it any time; every new post is shaped by it.`} />

      {/* Understanding */}
      <section className="rounded-lg border border-line bg-surface px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] text-ink-3">
              {summary ? `Based on your references and notes, Ideako understands your style as` : `Ideako hasn't formed a read of your style yet.`}
            </p>
            {summary ? (
              <>
                <p className="mt-2 text-[22px] font-light leading-snug tracking-tight text-ink sm:text-[26px]">
                  {summary.traits.map((t, i) => (
                    <span key={t}>
                      <span className="font-medium">{t}</span>
                      {i < summary.traits.length - 1 && <span className="text-ink-4"> · </span>}
                    </span>
                  ))}
                </p>
                <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-ink-2">{summary.description}</p>
                <p className="mt-3 text-[11.5px] text-ink-4">Last read {formatDate(summary.analysedAt)}</p>
              </>
            ) : (
              <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-ink-2">
                Add a few references or describe your tone below, then ask Ideako to read them. You&apos;ll get a short, honest description of how you come across.
              </p>
            )}
          </div>
          <Button size="sm" onClick={analyse} disabled={!canAnalyse || analysing} className="shrink-0">
            {analysing ? (
              <>
                Reading <ThinkingDots className="text-ink-3" />
              </>
            ) : summary ? (
              "Read again"
            ) : (
              "Read my style"
            )}
          </Button>
        </div>
      </section>

      <div className="mt-10 flex flex-col gap-10">
        <Section title="How your content should feel" hint="Pick as many as fit. These guide every generation unless you override the tone for a post.">
          <ChipGroup>
            {TONES.map((t) => {
              const on = tones.includes(t.key);
              return (
                <Chip key={t.key} checkable selected={on} title={t.hint} onClick={() => setTones(on ? tones.filter((k) => k !== t.key) : [...tones, t.key])}>
                  {t.label}
                </Chip>
              );
            })}
          </ChipGroup>
        </Section>

        <Section title={profile?.creatingFor === "myself" ? "About you" : "About the brand"}>
          <div className="grid gap-5">
            <Field label={profile?.creatingFor === "myself" ? "Who you are and what you do" : "Brand / company description"} hint="A few sentences. Ideako uses this so posts are grounded in reality.">
              {(id) => <Textarea id={id} autosize minRows={3} value={brandDescription} onChange={(e) => setBrandDescription(e.target.value)} placeholder="e.g. We build scheduling software for independent clinics. Small team, ten years in, opinionated about simplicity." />}
            </Field>
            <Field label="Audience" hint="Who reads your posts, and what they care about.">
              {(id) => <Textarea id={id} autosize minRows={2} value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g. Product managers and founders at early-stage B2B companies." />}
            </Field>
          </div>
        </Section>

        <Section title="Writing preferences">
          <div className="grid gap-5">
            <Field label="How your tone feels, in your words">
              {(id) => <Textarea id={id} autosize minRows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Direct but warm. I'd rather be useful than clever." />}
            </Field>
            <Field label="Formatting and habits" hint="Openings, closings, paragraph length, emoji, first vs third person.">
              {(id) => <Textarea id={id} autosize minRows={2} value={writingPreferences} onChange={(e) => setWritingPreferences(e.target.value)} placeholder="e.g. Short paragraphs. Start with a specific moment. End with a question. No emojis." />}
            </Field>
            <Field label="Things to avoid" hint="Words, phrases or angles Ideako should never use.">
              {(id) => <Textarea id={id} autosize minRows={2} value={avoid} onChange={(e) => setAvoid(e.target.value)} placeholder="e.g. “game-changer”, “excited to announce”, rhetorical questions in the hook." />}
            </Field>
          </div>
        </Section>

        <Section title="Reference material" hint="Company documents, bios, product notes. Ideako uses these as background knowledge for facts, not for style.">
          {voice?.knowledge.length ? (
            <ul className="mb-4 divide-y divide-line rounded-md border border-line bg-surface">
              {voice.knowledge.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-medium text-ink">{doc.name}</p>
                    <p className="text-[11.5px] text-ink-4">
                      {doc.content.length.toLocaleString()} characters · {formatDate(doc.addedAt)}
                    </p>
                  </div>
                  <button type="button" onClick={() => removeDoc(doc.id)} className="flex size-7 items-center justify-center rounded-sm text-ink-4 hover:bg-surface-2 hover:text-ink" aria-label={`Remove ${doc.name}`}>
                    <IconX size={15} />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <TextEntryList entries={newDocs} onChange={setNewDocs} itemLabel="Document" placeholder="Paste company or background content here…" addLabel="Add another document" uploadLabel="Upload documents" max={6} />
          {references.length > 0 && (
            <p className="mt-4 text-[12.5px] text-ink-4">
              Style references ({references.length}) live under References.
            </p>
          )}
        </Section>
      </div>

      <div className="sticky bottom-[76px] z-10 mt-10 flex justify-end md:bottom-6">
        <div className="flex items-center gap-3 rounded-lg border border-line bg-surface/95 px-3 py-2 shadow-pop backdrop-blur">
          <span className="text-[12.5px] text-ink-3">{dirty ? "Unsaved changes" : "Everything saved"}</span>
          <Button variant="primary" size="sm" onClick={save} disabled={!dirty} loading={saving}>
            Save voice
          </Button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 md:grid-cols-[220px_1fr] md:gap-10">
      <div>
        <h2 className="text-[15px] font-medium text-ink">{title}</h2>
        {hint && <p className="mt-1 text-[12.5px] leading-relaxed text-ink-3">{hint}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
