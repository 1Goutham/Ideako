"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ai, buildVoiceContext } from "@/lib/ai/client";
import { TONES } from "@/lib/constants";
import { useWorkspace, useWorkspaceActions } from "@/lib/store";
import type { ToneKey } from "@/lib/types";
import { formatDate, nowIso, uid } from "@/lib/utils";
import { Button, Chip, ChipGroup, Field, TextAction, Textarea, ThinkingDots } from "@/components/ui";
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
  const subject = profile?.creatingFor === "myself" ? "you write" : `${profile?.companyName || "the brand"} communicates`;

  return (
    <div>
      <PageHeader index="03 · Voice" title="Your voice" description={`What Ideako knows about how ${subject}. Update it any time; every new post is shaped by it.`} />

      {/* Understanding */}
      <section className="grid gap-8 border-y border-line py-10 md:grid-cols-12 md:py-14">
        <div className="md:col-span-8">
          <p className="label">
            {summary ? "Based on your references and notes, Ideako understands your style as" : "Ideako hasn't formed a read of your style yet"}
          </p>
          {summary ? (
            <>
              <p className="display mt-6 text-[36px] text-ink sm:text-[48px] md:text-[64px]">
                {summary.traits.map((t, i) => (
                  <span key={t}>
                    {t}
                    {i < summary.traits.length - 1 && <span className="text-ink/25"> · </span>}
                  </span>
                ))}
              </p>
              <p className="mt-8 max-w-xl text-[15px] leading-relaxed text-ink-2">{summary.description}</p>
              <p className="mono mt-5 text-[11px] text-ink-4">Last read {formatDate(summary.analysedAt)}</p>
            </>
          ) : (
            <p className="mt-6 max-w-lg text-[20px] leading-snug text-ink md:text-[24px]">
              Add a few references or describe your tone below, then ask Ideako to read them. You&apos;ll get a short, honest description of how you come across.
            </p>
          )}
        </div>
        <div className="md:col-span-4 md:flex md:justify-end md:self-start">
          <Button size="md" onClick={analyse} disabled={!canAnalyse || analysing}>
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

      <div className="flex flex-col">
        <Section index="01" title="How your content should feel" hint="Pick as many as fit. These guide every generation unless you override the tone for a post.">
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

        <Section index="02" title={profile?.creatingFor === "myself" ? "About you" : "About the brand"}>
          <div className="grid gap-8">
            <Field label={profile?.creatingFor === "myself" ? "Who you are and what you do" : "Brand / company description"} hint="A few sentences. Ideako uses this so posts are grounded in reality.">
              {(id) => <Textarea id={id} autosize minRows={3} value={brandDescription} onChange={(e) => setBrandDescription(e.target.value)} placeholder="e.g. We build scheduling software for independent clinics. Small team, ten years in, opinionated about simplicity." />}
            </Field>
            <Field label="Audience" hint="Who reads your posts, and what they care about.">
              {(id) => <Textarea id={id} autosize minRows={2} value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g. Product managers and founders at early-stage B2B companies." />}
            </Field>
          </div>
        </Section>

        <Section index="03" title="Writing preferences">
          <div className="grid gap-8">
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

        <Section index="04" title="Reference material" hint="Company documents, bios, product notes. Background knowledge for facts, not style.">
          {voice?.knowledge.length ? (
            <ul className="mb-6 border-t border-line">
              {voice.knowledge.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between gap-4 border-b border-line py-3">
                  <div className="min-w-0">
                    <p className="truncate text-[14.5px] text-ink">{doc.name}</p>
                    <p className="mono mt-0.5 text-[11px] text-ink-4">
                      {doc.content.length.toLocaleString()} chars · {formatDate(doc.addedAt)}
                    </p>
                  </div>
                  <TextAction onClick={() => removeDoc(doc.id)} aria-label={`Remove ${doc.name}`}>Remove</TextAction>
                </li>
              ))}
            </ul>
          ) : null}
          <TextEntryList entries={newDocs} onChange={setNewDocs} itemLabel="Document" placeholder="Paste company or background content here…" addLabel="Add another document" uploadLabel="Upload documents" max={6} />
          {references.length > 0 && <p className="mt-5 text-[12.5px] text-ink-4">Style references ({references.length}) live under References.</p>}
        </Section>
      </div>

      <div className="sticky bottom-6 z-10 mt-10 flex justify-end">
        <div className="flex items-center gap-4 rounded-full border border-line-2 bg-paper/95 py-1.5 pl-5 pr-1.5 backdrop-blur">
          <span className="mono text-[11px] text-ink-3">{dirty ? "Unsaved changes" : "Everything saved"}</span>
          <Button variant="primary" size="sm" onClick={save} disabled={!dirty} loading={saving}>
            Save voice
          </Button>
        </div>
      </div>
    </div>
  );
}

function Section({ index, title, hint, children }: { index: string; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-6 border-b border-line py-10 md:grid-cols-12 md:gap-10">
      <div className="md:col-span-4">
        <p className="label">{index}</p>
        <h2 className="mt-3 text-[20px] text-ink">{title}</h2>
        {hint && <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-ink-3">{hint}</p>}
      </div>
      <div className="min-w-0 md:col-span-8">{children}</div>
    </section>
  );
}
