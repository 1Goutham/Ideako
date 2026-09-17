"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ai, buildVoiceContext } from "@/lib/ai/client";
import { CREATING_FOR, INDUSTRIES, TONES } from "@/lib/constants";
import { useWorkspace, useWorkspaceActions } from "@/lib/store";
import type { CreatingFor, ToneKey } from "@/lib/types";
import { cx, nowIso, uid } from "@/lib/utils";
import { Button, Chip, ChipGroup, Field, IconArrowLeft, IconCheck, Input, Logo, Textarea } from "@/components/ui";
import { newEntry, TextEntryList, type TextEntry } from "@/components/create/TextEntryList";

const STEPS = ["Who", "About you", "Your voice"] as const;

export function Onboarding() {
  const router = useRouter();
  const { ready, user, profile, voice } = useWorkspace();
  const { createAccount, saveProfile, saveVoice, addReference } = useWorkspaceActions();

  const [step, setStep] = useState(0);
  const [creatingFor, setCreatingFor] = useState<CreatingFor>(profile?.creatingFor ?? "myself");
  const [name, setName] = useState(profile?.name ?? user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [companyName, setCompanyName] = useState(profile?.companyName ?? "");
  const [role, setRole] = useState(profile?.role ?? "");
  const [industry, setIndustry] = useState(profile?.industry ?? "");
  const [website, setWebsite] = useState(profile?.website ?? "");
  const [tones, setTones] = useState<ToneKey[]>(voice?.tones ?? []);
  const [posts, setPosts] = useState<TextEntry[]>([newEntry()]);
  const [docs, setDocs] = useState<TextEntry[]>([]);
  const [notes, setNotes] = useState(voice?.description ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [finishing, setFinishing] = useState(false);

  // Returning users who already finished go straight to the workspace.
  useEffect(() => {
    if (ready && profile?.onboardingCompletedAt) router.replace("/create");
  }, [ready, profile, router]);

  // Hydrate from any partial state saved earlier.
  useEffect(() => {
    if (!ready) return;
    if (profile) {
      setCreatingFor(profile.creatingFor);
      setName(profile.name);
      setCompanyName(profile.companyName);
      setRole(profile.role);
      setIndustry(profile.industry);
      setWebsite(profile.website);
    }
    if (user) {
      setEmail(user.email);
      if (!profile) setName(user.name);
    }
    if (voice) {
      setTones(voice.tones);
      setNotes(voice.description);
    }
  }, [ready, profile, user, voice]);

  const needsCompany = creatingFor !== "myself";

  const validateAbout = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Ideako needs a name to write as.";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = "Enter a valid email.";
    if (needsCompany && !companyName.trim()) next.companyName = "What's the company or brand called?";
    if (!role.trim()) next.role = "A role helps Ideako pitch the content correctly.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const next = () => {
    if (step === 1 && !validateAbout()) return;
    if (step === 1) {
      // Persist early so a refresh doesn't lose the form.
      createAccount({ email: email.trim().toLowerCase(), name: name.trim() });
      saveProfile({ creatingFor, name: name.trim(), companyName: companyName.trim(), role: role.trim(), industry: industry.trim(), website: website.trim() });
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const finish = async (skipVoice = false) => {
    setFinishing(true);
    const savedProfile = saveProfile({
      creatingFor,
      name: name.trim(),
      companyName: companyName.trim(),
      role: role.trim(),
      industry: industry.trim(),
      website: website.trim(),
      onboardingCompletedAt: nowIso(),
    });

    const usablePosts = skipVoice ? [] : posts.filter((p) => p.content.trim());
    const usableDocs = skipVoice ? [] : docs.filter((d) => d.content.trim());

    const savedVoice = saveVoice({
      tones: skipVoice ? [] : tones,
      description: skipVoice ? "" : notes.trim(),
      knowledge: usableDocs.map((d, i) => ({
        id: uid("doc"),
        name: d.title || `Document ${i + 1}`,
        content: d.content.trim(),
        source: d.source,
        addedAt: nowIso(),
      })),
    });

    const refs = usablePosts.map((p, i) =>
      addReference({
        title: p.title || `Previous post ${i + 1}`,
        content: p.content.trim(),
        source: p.source,
        platform: "linkedin",
        useByDefault: true,
      }),
    );

    router.push("/create");
    toast.success(`You're set up, ${savedProfile.name.split(" ")[0]}. Ideako is ready.`);

    // Learn the voice in the background; never block the user on it.
    if (refs.length || savedVoice.description || usableDocs.length) {
      const res = await ai.analyseVoice({
        context: buildVoiceContext(savedProfile, savedVoice),
        references: refs.map((r) => ({ title: r.title, content: r.content })),
      });
      if (res.ok) {
        saveVoice({ summary: { ...res.data, analysedAt: nowIso() } });
        toast.message("Ideako has read your references.", { description: "See what it learned under Voice." });
      }
    }
  };

  const progress = useMemo(() => ((step + 1) / STEPS.length) * 100, [step]);

  return (
    <div className="bg-ideako relative min-h-dvh">
      <div className="absolute inset-0 bg-white/45" aria-hidden="true" />

      <div className="relative flex min-h-dvh flex-col">
        <header className="mx-auto flex h-16 w-full max-w-[1240px] items-center justify-between px-5 md:px-8">
          <Logo />
          <p className="text-xs font-medium text-ink-3">
            Step {step + 1} of {STEPS.length}
            <span className="hidden sm:inline"> · {STEPS[step]}</span>
          </p>
        </header>
        <div className="mx-auto w-full max-w-[1240px] px-5 md:px-8">
          <div className="h-px w-full bg-ink/10">
            <div className="h-px bg-ink transition-[width] duration-500 ease-out" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <main className="mx-auto flex w-full max-w-[1240px] flex-1 flex-col items-center px-5 py-10 md:px-8 md:py-16">
          <div className="w-full max-w-[600px]">
            {step === 0 && (
              <StepFrame
                key="who"
                eyebrow="Let's begin"
                title="Who are you creating for?"
                description="This shapes the point of view Ideako writes from. You can change it any time."
              >
                <div className="flex flex-col gap-2.5">
                  {CREATING_FOR.map((opt) => {
                    const active = creatingFor === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setCreatingFor(opt.key)}
                        aria-pressed={active}
                        className={cx(
                          "flex items-center justify-between gap-4 rounded-lg border bg-surface px-5 py-4 text-left transition-[border-color,box-shadow] duration-150",
                          active ? "border-ink shadow-[0_0_0_1px_var(--color-ink)]" : "border-line-2 hover:border-ink-4",
                        )}
                      >
                        <span>
                          <span className="block text-[15px] font-medium text-ink">{opt.label}</span>
                          <span className="mt-0.5 block text-[13px] text-ink-3">{opt.hint}</span>
                        </span>
                        <span
                          className={cx(
                            "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                            active ? "border-ink bg-ink text-white" : "border-line-2",
                          )}
                          aria-hidden="true"
                        >
                          {active && <IconCheck size={12} strokeWidth={2.4} />}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <Footer>
                  <Button variant="primary" size="lg" onClick={next}>
                    Continue
                  </Button>
                </Footer>
              </StepFrame>
            )}

            {step === 1 && (
              <StepFrame
                key="about"
                eyebrow="About you"
                title={creatingFor === "myself" ? "Tell Ideako who you are" : "Tell Ideako who you're writing for"}
                description="A few details so every post is grounded in the right context."
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Your name" error={errors.name} className="sm:col-span-1">
                    {(id) => <Input id={id} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Priya Sharma" />}
                  </Field>
                  <Field label="Email" error={errors.email} hint="Used to sign back in on this device.">
                    {(id) => <Input id={id} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@company.com" />}
                  </Field>
                  <Field label={creatingFor === "brand" ? "Brand / team name" : "Company name"} optional={!needsCompany} error={errors.companyName}>
                    {(id) => <Input id={id} value={companyName} onChange={(e) => setCompanyName(e.target.value)} autoComplete="organization" placeholder={creatingFor === "brand" ? "Northwind Studio" : "Acme Inc."} />}
                  </Field>
                  <Field label="Your role" error={errors.role}>
                    {(id) => <Input id={id} value={role} onChange={(e) => setRole(e.target.value)} autoComplete="organization-title" placeholder="Head of Product" />}
                  </Field>
                  <Field label="Industry">
                    {(id) => (
                      <>
                        <Input id={id} value={industry} onChange={(e) => setIndustry(e.target.value)} list="ideako-industries" placeholder="Software & SaaS" />
                        <datalist id="ideako-industries">
                          {INDUSTRIES.map((i) => (
                            <option key={i} value={i} />
                          ))}
                        </datalist>
                      </>
                    )}
                  </Field>
                  <Field label="Website" optional>
                    {(id) => <Input id={id} value={website} onChange={(e) => setWebsite(e.target.value)} inputMode="url" placeholder="acme.com" />}
                  </Field>
                </div>
                <Footer onBack={back}>
                  <Button variant="primary" size="lg" onClick={next}>
                    Continue
                  </Button>
                </Footer>
              </StepFrame>
            )}

            {step === 2 && (
              <StepFrame
                key="voice"
                eyebrow="Your voice"
                title="Teach Ideako how you communicate"
                description="You're not configuring an AI. You're showing a partner how you write, so what it creates sounds like you. Everything here is optional."
              >
                <div className="flex flex-col gap-9">
                  <section>
                    <h3 className="text-[15px] font-medium text-ink">How should your content feel?</h3>
                    <p className="mt-1 text-[13px] text-ink-3">Pick as many as fit.</p>
                    <ChipGroup className="mt-3.5">
                      {TONES.map((t) => {
                        const selected = tones.includes(t.key);
                        return (
                          <Chip
                            key={t.key}
                            checkable
                            selected={selected}
                            title={t.hint}
                            onClick={() => setTones(selected ? tones.filter((k) => k !== t.key) : [...tones, t.key])}
                          >
                            {t.label}
                          </Chip>
                        );
                      })}
                    </ChipGroup>
                  </section>

                  <section>
                    <h3 className="text-[15px] font-medium text-ink">Show Ideako how you write</h3>
                    <p className="mt-1 text-[13px] text-ink-3">
                      Paste a few previous posts you&apos;re proud of, or upload them. Ideako studies the style, never the wording.
                    </p>
                    <TextEntryList
                      className="mt-3.5"
                      entries={posts}
                      onChange={setPosts}
                      itemLabel="Post"
                      placeholder="Paste a previous post here…"
                      addLabel="Add another post"
                      uploadLabel="Upload posts"
                    />
                  </section>

                  <section>
                    <h3 className="text-[15px] font-medium text-ink">
                      {creatingFor === "myself" ? "Background material" : "Company material"}
                    </h3>
                    <p className="mt-1 text-[13px] text-ink-3">
                      About pages, product notes, a bio. Ideako uses this as context, so it gets the facts right.
                    </p>
                    <TextEntryList
                      className="mt-3.5"
                      entries={docs}
                      onChange={setDocs}
                      itemLabel="Document"
                      placeholder="Paste company or background content here…"
                      addLabel="Add another document"
                      uploadLabel="Upload documents"
                      max={6}
                    />
                  </section>

                  <section>
                    <Field
                      label="Anything else Ideako should know?"
                      hint="Words you love or hate, how you open posts, what you never want to sound like."
                    >
                      {(id) => (
                        <Textarea
                          id={id}
                          autosize
                          minRows={3}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="e.g. I write in first person, short paragraphs, no emojis. I'd rather sound honest than impressive."
                        />
                      )}
                    </Field>
                  </section>
                </div>
                <Footer onBack={back}>
                  <button type="button" onClick={() => finish(true)} disabled={finishing} className="px-2 text-sm text-ink-3 hover:text-ink disabled:opacity-50">
                    Skip for now
                  </button>
                  <Button variant="primary" size="lg" onClick={() => finish(false)} loading={finishing}>
                    Finish setup
                  </Button>
                </Footer>
              </StepFrame>
            )}
          </div>
        </main>

        <div className="pointer-events-none fixed bottom-0 right-0 hidden w-[200px] opacity-90 xl:block" aria-hidden="true">
          <Image src="/bot.png" alt="" width={1870} height={1882} className="h-auto w-full translate-x-6 translate-y-6" />
        </div>
      </div>
    </div>
  );
}

function StepFrame({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass animate-rise rounded-xl p-6 sm:p-10">
      <p className="eyebrow mb-3">{eyebrow}</p>
      <h1 className="text-[26px] font-medium leading-tight tracking-tight text-ink sm:text-[32px]">{title}</h1>
      <p className="mt-3 max-w-lg text-[14.5px] leading-relaxed text-ink-2">{description}</p>
      <div className="mt-8">{children}</div>
    </div>
  );
}

function Footer({ onBack, children }: { onBack?: () => void; children: React.ReactNode }) {
  return (
    <div className="mt-10 flex items-center justify-between gap-3 border-t border-ink/10 pt-6">
      {onBack ? (
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-2 hover:text-ink">
          <IconArrowLeft size={16} /> Back
        </button>
      ) : (
        <Link href="/" className="text-sm text-ink-3 hover:text-ink">
          Cancel
        </Link>
      )}
      <div className="flex items-center gap-3">{children}</div>
    </div>
  );
}
