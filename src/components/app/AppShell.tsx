"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AUTHOR } from "@/lib/constants";
import { useWorkspace } from "@/lib/store";
import { cx, initials } from "@/lib/utils";
import { Logo } from "@/components/ui";

const NAV = [
  { href: "/create", label: "Create", n: "01" },
  { href: "/references", label: "References", n: "02" },
  { href: "/voice", label: "Voice", n: "03" },
  { href: "/saved", label: "Saved", n: "04" },
  { href: "/settings", label: "Settings", n: "05" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { ready, profile } = useWorkspace();
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    if (ready && !profile?.onboardingCompletedAt) router.replace("/onboarding");
  }, [ready, profile, router]);

  // Close the overlay on navigation and lock scroll while it is open.
  useEffect(() => setMenu(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = menu ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menu]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const first = profile?.name.split(" ")[0] ?? "";

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-6 md:px-10">
          <Logo href="/create" />

          <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
            {NAV.map(({ href, label }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cx("link-underline text-[13.5px] transition-colors", active ? "text-ink after:scale-x-100" : "text-ink-3 hover:text-ink")}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-5">
            <Link
              href="/settings"
              className="mono hidden size-8 items-center justify-center rounded-full border border-line-2 text-[11px] text-ink hover:border-ink md:flex"
              aria-label="Your profile and settings"
              title={profile?.name}
            >
              {ready && profile ? initials(profile.name) : "·"}
            </Link>
            <button type="button" onClick={() => setMenu(true)} className="link-underline text-[14px] text-ink md:hidden" aria-haspopup="dialog" aria-expanded={menu}>
              Menu
            </button>
          </div>
        </div>
        <div className="mx-auto max-w-[1280px] px-6 md:px-10">
          <div className="h-px bg-line" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1280px] px-6 pb-24 pt-10 md:px-10 md:pt-14">
        {ready && profile?.onboardingCompletedAt ? children : <ShellSkeleton />}
      </main>

      <footer className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 border-t border-line px-6 py-6 text-[12px] text-ink-3 md:px-10">
        <p>
          © {new Date().getFullYear()} Ideako · A product of{" "}
          <a href={AUTHOR.site} target="_blank" rel="noreferrer" className="link-underline text-ink">
            {AUTHOR.handle} ↗
          </a>
        </p>
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="link-underline hover:text-ink">
          Back to top ↑
        </button>
      </footer>

      {/* Mobile menu: full-screen, type only. */}
      {menu && (
        <div className="fixed inset-0 z-50 flex flex-col bg-paper animate-fade md:hidden" role="dialog" aria-label="Menu">
          <div className="flex h-16 items-center justify-between px-6">
            <Logo href="/create" />
            <button type="button" onClick={() => setMenu(false)} className="link-underline text-[14px] text-ink">
              Close
            </button>
          </div>
          <nav className="flex flex-1 flex-col justify-center px-6" aria-label="Primary">
            <ul className="flex flex-col">
              {NAV.map(({ href, label, n }) => {
                const active = isActive(href);
                return (
                  <li key={href} className="border-t border-line last:border-b">
                    <Link href={href} className="flex items-baseline justify-between py-4" aria-current={active ? "page" : undefined}>
                      <span className={cx("display text-[40px]", active ? "text-ink" : "text-ink-2")}>{label}</span>
                      <span className="label">{n}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="flex items-center justify-between px-6 pb-8 text-[12.5px] text-ink-3">
            <span>{first ? `Signed in as ${first}` : ""}</span>
            <Link href="/" className="link-underline hover:text-ink">
              ideako.app
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function ShellSkeleton() {
  return (
    <div className="animate-fade space-y-4" aria-hidden="true">
      <div className="h-3 w-16 rounded animate-shimmer" />
      <div className="h-10 w-64 rounded animate-shimmer" />
      <div className="mt-8 h-40 rounded-md animate-shimmer" />
    </div>
  );
}
