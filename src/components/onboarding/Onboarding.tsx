"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ai, buildVoiceContext } from "@/lib/ai/client";
import { CREATING_FOR, INDUSTRIES, TONES } from "@/lib/constants";
import { useWorkspace, useWorkspaceActions } from "@/lib/store";
import type { CreatingFor, ToneKey } from "@/lib/types";
import { cx, nowIso, uid } from "@/lib/utils";
import { Button, Chip, ChipGroup, Field, Input, Logo, Textarea } from "@/components/ui";
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
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between px-6 md:px-10">
        <Logo />
        <p className="mono text-[12px] text-ink-3">
          {String(step + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
          <span className="hidden sm:inline"> · {STEPS[step]}</span>
        </p>
      </header>
      <div className="mx-auto w-full max-w-[1280px] px-6 md:px-10">
        <div className="h-px w-full bg-line">
          <div className="h-px bg-ink transition-[width] duration-700 ease-out" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-6 py-12 md:px-10 md:py-20">
        {step === 0 && (
          <StepFrame
            key="who"
            eyebrow="Let's begin"
            title={<>Who are you<br />creating for?</>}
            description="This shapes the point of view Ideako writes from. You can change it any time."
          >
            <ul className="border-t border-line">
              {CREATING_FOR.map((opt, i) => {
                const active = creatingFor === opt.key;
                return (
                  <li key={opt.key} className="border-b border-line">
                    <button
                      type="button"
                      onClick={() => setCreatingFor(opt.key)}
                      aria-pressed={active}
                      className="group flex w-full items-center justify-between gap-6 py-5 text-left"
                    >
                      <span className="flex items-baseline gap-5">
                        <span className="label">{String(i + 1).padStart(2, "0")}</span>
                        <span>
                          <span className={cx("block text-[20px] transition-colors md:text-[24px]", active ? "text-ink" : "text-ink-2 group-hover:text-ink")}>{opt.label}</span>
                          <span className="mt-1 block text-[13px] text-ink-3">{opt.hint}</span>
                        </span>
                      </span>
                      <span
                        className={cx("size-2.5 shrink-0 rounded-full border transition-colors", active ? "border-ink bg-ink" : "border-line-2 group-hover:border-ink")}
                        aria-hidden="true"
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
            <Footer rule={false}>
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
            title={creatingFor === "myself" ? <>Tell Ideako<br />who you are</> : <>Tell Ideako who<br />you write for</>}
            description="A few details so every post is grounded in the right context."
          >
            <div className="grid gap-8 sm:grid-cols-2 sm:gap-x-10">
              <Field label="Your name" error={errors.name}>
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
            title={<>Teach Ideako how<br />you communicate</>}
            description="You're not configuring an AI. You're showing a partner how you write, so what it creates sounds like you. Everything here is optional."
          >
            <div className="flex flex-col gap-12">
              <VoiceSection index="01" title="How should your content feel?" hint="Pick as many as fit.">
                <ChipGroup>
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
              </VoiceSection>

              <VoiceSection index="02" title="Show Ideako how you write" hint="Paste a few previous posts you're proud of, or upload them. Ideako studies the style, never the wording.">
                <TextEntryList
                  entries={posts}
                  onChange={setPosts}
                  itemLabel="Post"
                  placeholder="Paste a previous post here…"
                  addLabel="Add another post"
                  uploadLabel="Upload posts"
                />
              </VoiceSection>

              <VoiceSection
                index="03"
                title={creatingFor === "myself" ? "Background material" : "Company material"}
                hint="About pages, product notes, a bio. Ideako uses this as context, so it gets the facts right."
              >
                <TextEntryList
                  entries={docs}
                  onChange={setDocs}
                  itemLabel="Document"
                  placeholder="Paste company or background content here…"
                  addLabel="Add another document"
                  uploadLabel="Upload documents"
                  max={6}
                />
              </VoiceSection>

              <VoiceSection index="04" title="Anything else Ideako should know?" hint="Words you love or hate, how you open posts, what you never want to sound like.">
                <Textarea
                  autosize
                  minRows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. I write in first person, short paragraphs, no emojis. I'd rather sound honest than impressive."
                />
              </VoiceSection>
            </div>
            <Footer onBack={back}>
              <button type="button" onClick={() => finish(true)} disabled={finishing} className="link-underline text-[13.5px] text-ink-3 hover:text-ink disabled:opacity-50">
                Skip for now
              </button>
              <Button variant="primary" size="lg" onClick={() => finish(false)} loading={finishing}>
                Finish setup
              </Button>
            </Footer>
          </StepFrame>
        )}
      </main>
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
  title: React.ReactNode;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="animate-rise grid gap-10 md:grid-cols-12 md:gap-x-10">
      <div className="md:col-span-5">
        <p className="label mb-4">{eyebrow}</p>
        <h1 className="display text-[40px] text-ink sm:text-[52px] md:text-[64px]">{title}</h1>
        <p className="mt-6 max-w-sm text-[14px] leading-relaxed text-ink-3">{description}</p>
      </div>
      <div className="md:col-span-6 md:col-start-7">{children}</div>
    </div>
  );
}

function VoiceSection({ index, title, hint, children }: { index: string; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-baseline gap-4 border-b border-line pb-3">
        <span className="label">{index}</span>
        <h3 className="text-[17px] text-ink">{title}</h3>
      </div>
      {hint && <p className="mt-3 text-[13px] leading-relaxed text-ink-3">{hint}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Footer({ onBack, rule = true, children }: { onBack?: () => void; rule?: boolean; children: React.ReactNode }) {
  return (
    <div className={cx("mt-8 flex items-center justify-between gap-4", rule && "mt-12 border-t border-line pt-6")}>
      {onBack ? (
        <button type="button" onClick={onBack} className="bracket text-[13px] text-ink-2 hover:text-ink">
          <span className="bracket-l" aria-hidden="true">[</span>Back<span className="bracket-r" aria-hidden="true">]</span>
        </button>
      ) : (
        <Link href="/" className="bracket text-[13px] text-ink-2 hover:text-ink">
          <span className="bracket-l" aria-hidden="true">[</span>Cancel<span className="bracket-r" aria-hidden="true">]</span>
        </Link>
      )}
      <div className="flex items-center gap-5">{children}</div>
    </div>
  );
}
