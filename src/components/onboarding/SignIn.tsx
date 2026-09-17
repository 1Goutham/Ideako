"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useWorkspace, useWorkspaceActions } from "@/lib/store";
import { Button, Field, Input, Logo } from "@/components/ui";

/**
 * Local sign-in. There is no server-side auth yet; this screen is the seam
 * where a real provider (email magic link, OAuth) will plug in. Today it
 * matches the email against the workspace stored on this device.
 */
export function SignIn() {
  const router = useRouter();
  const { ready, user, profile } = useWorkspace();
  const { createAccount } = useWorkspaceActions();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!value) return setError("Enter the email you set up Ideako with.");
    if (!user || !profile?.onboardingCompletedAt) {
      return setError("No Ideako workspace on this device yet. Set one up to get started.");
    }
    if (user.email.toLowerCase() !== value) {
      return setError("That doesn't match the workspace on this device.");
    }
    createAccount({ email: value, name: user.name });
    router.push("/create");
  };

  return (
    <div className="bg-ideako flex min-h-dvh flex-col">
      <div className="absolute inset-0 bg-white/40" aria-hidden="true" />
      <header className="relative mx-auto flex h-16 w-full max-w-[1240px] items-center justify-between px-5 md:px-8">
        <Logo />
        <Link href="/onboarding" className="text-sm font-medium text-ink-2 hover:text-ink">
          New here? Get started
        </Link>
      </header>
      <main className="relative flex flex-1 items-center justify-center px-5 pb-20">
        <form onSubmit={submit} className="glass w-full max-w-[420px] rounded-xl p-6 sm:p-8 animate-rise">
          <p className="eyebrow mb-2">Welcome back</p>
          <h1 className="text-[26px] font-medium tracking-tight text-ink">Sign in to Ideako</h1>
          <p className="mt-2 text-sm text-ink-3">
            {ready && user ? `This device has a workspace for ${user.name}.` : "Continue to your workspace."}
          </p>
          <div className="mt-6">
            <Field label="Email" error={error ?? undefined}>
              {(id) => (
                <Input
                  id={id}
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                />
              )}
            </Field>
          </div>
          <Button type="submit" variant="primary" full className="mt-5" disabled={!ready}>
            Continue
          </Button>
          <p className="mt-4 text-center text-xs text-ink-3">
            Ideako keeps your workspace on this device for now.
          </p>
        </form>
      </main>
    </div>
  );
}
