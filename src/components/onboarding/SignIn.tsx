"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useWorkspace, useWorkspaceActions } from "@/lib/store";
import { Button, Field, Input, Logo } from "@/components/ui";

/**
 * Local sign-in. There is no server-side auth yet; this screen is the seam
 * where a real provider (email magic link, OAuth) will plug in.
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
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between px-6 md:px-10">
        <Logo />
        <Link href="/onboarding" className="link-underline text-[13.5px] text-ink-3 hover:text-ink">
          New here? Get started
        </Link>
      </header>
      <main className="mx-auto grid w-full max-w-[1280px] flex-1 gap-10 px-6 py-16 md:grid-cols-12 md:px-10 md:py-24">
        <div className="md:col-span-7">
          <p className="label mb-4">Welcome back</p>
          <h1 className="display text-[48px] text-ink md:text-[80px]">
            Sign in
            <br />
            to Ideako
          </h1>
          <p className="mt-6 max-w-sm text-[14px] leading-relaxed text-ink-3">
            {ready && user ? `This device has a workspace for ${user.name}.` : "Continue to your workspace."}
          </p>
        </div>
        <form onSubmit={submit} className="animate-rise self-end md:col-span-4 md:col-start-9">
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
          <Button type="submit" variant="primary" full className="mt-8" disabled={!ready}>
            Continue
          </Button>
          <p className="mt-4 text-[12px] text-ink-4">Ideako keeps your workspace on this device for now.</p>
        </form>
      </main>
    </div>
  );
}
