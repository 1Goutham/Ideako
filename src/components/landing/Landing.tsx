"use client";

import Image from "next/image";
import Link from "next/link";
import { CONTACT_URL } from "@/lib/constants";
import { useWorkspace } from "@/lib/store";
import { IconArrowUpRight, LinkButton, Logo } from "@/components/ui";

const STEPS = [
  {
    n: "01",
    title: "Teach Ideako your voice",
    body: "Paste past posts, upload company material, and tell it how your content should feel. Ideako learns the way you actually write.",
  },
  {
    n: "02",
    title: "Create with references",
    body: "Describe an idea, pick a content type and length, and point Ideako at a post you're proud of. It writes something original in that style.",
  },
  {
    n: "03",
    title: "Refine, don't rewrite",
    body: "Sharpen the hook, shorten, add a story, or edit by hand. Add hashtags that fit. Save what you like and come back tomorrow.",
  },
];

export function Landing() {
  const { ready, profile } = useWorkspace();
  const onboarded = ready && !!profile?.onboardingCompletedAt;

  return (
    <div className="bg-ideako relative min-h-dvh">
      <div className="absolute inset-0 bg-white/40" aria-hidden="true" />

      <div className="relative">
        <header className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-5 md:px-8">
          <Logo />
          <div className="flex items-center gap-2">
            {onboarded ? (
              <LinkButton href="/create" variant="primary" size="sm">
                Open workspace
              </LinkButton>
            ) : (
              <>
                <LinkButton href="/signin" variant="ghost" size="sm">
                  Sign in
                </LinkButton>
                <LinkButton href="/onboarding" variant="primary" size="sm">
                  Get started
                </LinkButton>
              </>
            )}
          </div>
        </header>

        <section className="mx-auto grid max-w-[1240px] items-center gap-10 px-5 pb-16 pt-10 md:grid-cols-[1.1fr_0.9fr] md:px-8 md:pb-24 md:pt-16">
          <div className="animate-rise max-w-xl">
            <p className="eyebrow mb-4">Your AI creative partner</p>
            <h1 className="text-[40px] font-light leading-[1.05] tracking-tight text-ink sm:text-[52px] md:text-[64px]">
              Content that
              <br />
              <span className="font-medium">sounds like you.</span>
            </h1>
            <p className="mt-6 max-w-md text-[16px] leading-relaxed text-ink-2 md:text-[17px]">
              Ideako learns how you communicate, your tone, your vocabulary, your stories, and helps you
              create LinkedIn posts in your own voice. Not a prompt box. A partner that pays attention.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <LinkButton href={onboarded ? "/create" : "/onboarding"} variant="primary" size="lg">
                {onboarded ? "Continue creating" : "Meet Ideako"} <IconArrowUpRight size={16} />
              </LinkButton>
              <a href="#how" className="px-2 text-sm font-medium text-ink-2 hover:text-ink">
                See how it works
              </a>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[420px] md:max-w-[520px]">
            <Image
              src="/bot.png"
              alt="Ideako, a friendly robot in a hoodie and headphones, typing on a laptop"
              width={1870}
              height={1882}
              priority
              sizes="(min-width: 768px) 520px, 80vw"
              className="h-auto w-full drop-shadow-[0_30px_50px_rgba(20,23,26,0.18)]"
            />
          </div>
        </section>

        <section id="how" className="mx-auto max-w-[1240px] px-5 pb-20 md:px-8 md:pb-28">
          <div className="glass rounded-xl p-6 sm:p-10">
            <div className="grid gap-8 md:grid-cols-3 md:gap-10">
              {STEPS.map((s) => (
                <div key={s.n}>
                  <p className="text-xs font-semibold tracking-widest text-ink-4">{s.n}</p>
                  <h2 className="mt-3 text-[17px] font-medium text-ink">{s.title}</h2>
                  <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{s.body}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 flex flex-col gap-3 border-t border-ink/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-ink-2">LinkedIn today. More platforms as Ideako grows.</p>
              <LinkButton href={onboarded ? "/create" : "/onboarding"} variant="primary">
                {onboarded ? "Open workspace" : "Set up your voice"}
              </LinkButton>
            </div>
          </div>
        </section>

        <footer className="mx-auto flex max-w-[1240px] flex-col gap-2 px-5 pb-10 text-xs text-ink-3 sm:flex-row sm:items-center sm:justify-between md:px-8">
          <p>© {new Date().getFullYear()} Ideako</p>
          <Link href={CONTACT_URL} target="_blank" rel="noreferrer" className="hover:text-ink">
            Contact ↗
          </Link>
        </footer>
      </div>
    </div>
  );
}
