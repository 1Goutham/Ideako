"use client";

import Link from "next/link";
import { useState } from "react";
import { AUTHOR } from "@/lib/constants";
import { useWorkspace } from "@/lib/store";
import { cx } from "@/lib/utils";
import { BracketLink, IconArrowUpRight, LinkButton, Logo, PlusMinus } from "@/components/ui";

const HELP = [
  { n: "01", title: "Your voice", body: "Paste past posts, upload company material, tell it how your content should feel. Ideako learns the way you actually write." },
  { n: "02", title: "Create", body: "Describe an idea, pick a content type, tone and length, point it at a post you're proud of. It writes something original in that style." },
  { n: "03", title: "Refine", body: "Sharpen the hook, shorten, add a story, or edit by hand. Add hashtags that fit. Save what you like and come back tomorrow." },
];

const PROCESS = [
  { n: "01.", title: "Tell Ideako who you are", body: "Who you create for, your role, your industry. Two minutes." },
  { n: "02.", title: "Teach it your voice", body: "Tone chips, previous posts, background documents, and anything else it should know. Ideako reads them and tells you what it learned." },
  { n: "03.", title: "Create with references", body: "Every post is grounded in your profile and the references you choose. Never copied; written in your style." },
  { n: "04.", title: "Edit, refine, save", body: "A real editor with version history, eight refinements, hashtag suggestions and a short honest read on each draft." },
];

export function Landing() {
  const { ready, profile } = useWorkspace();
  const onboarded = ready && !!profile?.onboardingCompletedAt;
  const start = onboarded ? "/create" : "/onboarding";
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-6 md:px-10">
        <Logo />
        <nav className="hidden items-center gap-8 text-[13.5px] md:flex" aria-label="Landing">
          <a href="#help" className="link-underline text-ink-3 hover:text-ink">What it does</a>
          <a href="#process" className="link-underline text-ink-3 hover:text-ink">How it works</a>
          {!onboarded && <Link href="/signin" className="link-underline text-ink-3 hover:text-ink">Sign in</Link>}
        </nav>
        <LinkButton href={start} variant="primary" size="sm">
          {onboarded ? "Open workspace" : "Get started"} <IconArrowUpRight size={14} />
        </LinkButton>
      </header>

      <main className="mx-auto max-w-[1280px] px-6 md:px-10">
        {/* Hero */}
        <section className="grid gap-10 pb-20 pt-16 md:grid-cols-12 md:pb-28 md:pt-28">
          <div className="md:col-span-9">
            <h1 className="display animate-rise text-[64px] text-ink sm:text-[88px] md:text-[128px] lg:text-[152px]">
              Content
              <br />
              that sounds
              <br />
              like you.
            </h1>
          </div>
          <div className="animate-rise flex flex-col justify-end md:col-span-3" style={{ animationDelay: "120ms" }}>
            <p className="text-[13px] leading-relaxed text-ink-3">
              An AI creative partner that learns your tone, vocabulary and stories, and writes LinkedIn posts in your own voice.
            </p>
          </div>

          <div className="animate-rise mt-4 md:col-span-7" style={{ animationDelay: "200ms" }}>
            <p className="max-w-xl text-[20px] leading-snug text-ink md:text-[26px]">
              Not a prompt box. Ideako pays attention to how you communicate, so what it creates reads like you wrote it on a good day.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <LinkButton href={start} variant="primary" size="lg">
                {onboarded ? "Continue creating" : "Meet Ideako"} <IconArrowUpRight size={16} />
              </LinkButton>
              <BracketLink href="#process">How it works</BracketLink>
            </div>
          </div>
          <div className="animate-rise mt-4 md:col-span-5 md:col-start-10" style={{ animationDelay: "260ms" }}>
            <p className="label mb-3">Platforms</p>
            <ul className="space-y-1.5 text-[13px]">
              <li className="flex items-center gap-2 text-ink"><span className="size-1.5 rounded-full bg-accent" aria-hidden="true" /> LinkedIn</li>
              <li className="text-ink-4">X, soon</li>
              <li className="text-ink-4">Instagram, soon</li>
            </ul>
          </div>
        </section>

        {/* What it does */}
        <section id="help" className="scroll-mt-20 border-t border-line py-16 md:py-24">
          <h2 className="display text-[36px] text-ink md:text-[48px]">Ideako helps you with …</h2>
          <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-0">
            {HELP.map((h) => (
              <div key={h.n} className="md:border-l md:border-line md:px-8 first:md:pl-0 first:md:border-l-0">
                <p className="display text-[44px] text-ink/15">{h.n}</p>
                <h3 className="mt-8 text-[17px] text-ink">{h.title}</h3>
                <p className="mt-2 max-w-xs text-[13.5px] leading-relaxed text-ink-3">{h.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Process */}
        <section id="process" className="scroll-mt-20 grid gap-10 border-t border-line py-16 md:grid-cols-12 md:py-24">
          <div className="md:col-span-5">
            <h2 className="display text-[36px] text-ink md:text-[48px]">
              The way it
              <br />
              gets to your voice
            </h2>
            <p className="mt-6 max-w-sm text-[13.5px] leading-relaxed text-ink-3">
              Fast and transparent. From first visit to first post that sounds like you is about five minutes, and everything Ideako learns stays editable.
            </p>
          </div>
          <ul className="md:col-span-6 md:col-start-7">
            {PROCESS.map((p, i) => {
              const isOpen = open === i;
              return (
                <li key={p.n} className="border-t border-line last:border-b">
                  <button type="button" onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen} className="group flex w-full items-center justify-between gap-4 py-5 text-left">
                    <span className="flex items-baseline gap-4">
                      <span className="mono text-[13px] text-ink-3">{p.n}</span>
                      <span className="text-[17px] text-ink">{p.title}</span>
                    </span>
                    <PlusMinus open={isOpen} />
                  </button>
                  <div className={cx("grid transition-[grid-template-rows] duration-300", isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                    <div className="overflow-hidden">
                      <p className="max-w-md pb-6 pl-10 text-[13.5px] leading-relaxed text-ink-3">{p.body}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Closing CTA */}
        <section className="grid gap-8 border-t border-line py-20 md:grid-cols-12 md:items-end md:py-28">
          <h2 className="display text-[40px] text-ink sm:text-[56px] md:col-span-9 md:text-[72px]">
            Let&apos;s make something
            <br />
            in your voice.
          </h2>
          <div className="md:col-span-3 md:flex md:justify-end">
            <LinkButton href={start} variant="primary" size="lg">
              {onboarded ? "Open workspace" : "Set up your voice"} <IconArrowUpRight size={16} />
            </LinkButton>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-[1280px] flex-col gap-4 border-t border-line px-6 py-6 text-[12px] text-ink-3 md:flex-row md:items-center md:justify-between md:px-10">
        <p>
          © {new Date().getFullYear()} Ideako. A product of{" "}
          <a href={AUTHOR.site} target="_blank" rel="noreferrer" className="link-underline text-ink">
            {AUTHOR.handle} ↗
          </a>
        </p>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <a href={AUTHOR.linkedin} target="_blank" rel="noreferrer" className="link-underline hover:text-ink">LinkedIn</a>
          <a href={AUTHOR.github} target="_blank" rel="noreferrer" className="link-underline hover:text-ink">GitHub</a>
          <a href={AUTHOR.instagram} target="_blank" rel="noreferrer" className="link-underline hover:text-ink">Instagram</a>
          <a href={`mailto:${AUTHOR.email}`} className="link-underline hover:text-ink">Email</a>
          <a href="#" className="link-underline hover:text-ink">Back to top ↑</a>
        </div>
      </footer>
    </div>
  );
}
