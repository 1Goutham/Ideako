"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useWorkspace } from "@/lib/store";
import { cx, initials } from "@/lib/utils";
import { IconArchive, IconBookmark, IconPen, IconSliders, IconWave, Logo } from "@/components/ui";

const NAV = [
  { href: "/create", label: "Create", icon: IconPen },
  { href: "/references", label: "References", icon: IconBookmark },
  { href: "/voice", label: "Voice", icon: IconWave },
  { href: "/saved", label: "Saved", icon: IconArchive },
  { href: "/settings", label: "Settings", icon: IconSliders },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { ready, profile } = useWorkspace();

  // Gate the workspace behind onboarding.
  useEffect(() => {
    if (ready && !profile?.onboardingCompletedAt) router.replace("/onboarding");
  }, [ready, profile, router]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="relative min-h-dvh">
      {/* A whisper of the original Ideako backdrop, kept far in the background. */}
      <div className="bg-ideako pointer-events-none fixed inset-0 -z-10 opacity-[0.22]" aria-hidden="true" />

      <header className="sticky top-0 z-30 border-b border-line/80 bg-paper/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1240px] items-center justify-between gap-6 px-5 md:px-8">
          <Logo href="/create" tagline />

          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {NAV.map(({ href, label }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cx(
                    "relative flex h-14 items-center px-3 text-[13.5px] font-medium transition-colors",
                    active ? "text-ink" : "text-ink-3 hover:text-ink",
                  )}
                >
                  {label}
                  {active && <span className="absolute inset-x-3 -bottom-px h-px bg-ink" aria-hidden="true" />}
                </Link>
              );
            })}
          </nav>

          <Link
            href="/settings"
            className="flex size-8 items-center justify-center rounded-full bg-ink text-[11px] font-semibold text-white"
            aria-label="Your profile and settings"
            title={profile?.name}
          >
            {ready && profile ? initials(profile.name) : "·"}
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1240px] px-5 pb-28 pt-8 md:px-8 md:pb-16 md:pt-12">
        {ready && profile?.onboardingCompletedAt ? children : <ShellSkeleton />}
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur-xl md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Primary"
      >
        <div className="grid h-[60px] grid-cols-5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex flex-col items-center justify-center gap-1 text-[10.5px] font-medium transition-colors",
                  active ? "text-ink" : "text-ink-3",
                )}
              >
                <Icon size={20} strokeWidth={active ? 2 : 1.6} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function ShellSkeleton() {
  return (
    <div className="animate-fade space-y-4" aria-hidden="true">
      <div className="h-3 w-16 rounded animate-shimmer" />
      <div className="h-7 w-56 rounded animate-shimmer" />
      <div className="mt-8 h-40 rounded-lg animate-shimmer" />
    </div>
  );
}
