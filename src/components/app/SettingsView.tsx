"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CONTACT_URL, CREATING_FOR, INDUSTRIES, PLATFORMS } from "@/lib/constants";
import { useWorkspace, useWorkspaceActions } from "@/lib/store";
import type { CreatingFor, Platform } from "@/lib/types";
import { cx } from "@/lib/utils";
import { Button, Chip, ChipGroup, Field, Input } from "@/components/ui";
import { PageHeader } from "./PageHeader";

export function SettingsView() {
  const router = useRouter();
  const { user, profile, posts, references, voice } = useWorkspace();
  const { saveProfile, createAccount, exportSnapshot, resetWorkspace } = useWorkspaceActions();

  const [creatingFor, setCreatingFor] = useState<CreatingFor>(profile?.creatingFor ?? "myself");
  const [name, setName] = useState(profile?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [companyName, setCompanyName] = useState(profile?.companyName ?? "");
  const [role, setRole] = useState(profile?.role ?? "");
  const [industry, setIndustry] = useState(profile?.industry ?? "");
  const [website, setWebsite] = useState(profile?.website ?? "");
  const [platform, setPlatform] = useState<Platform>(profile?.defaultPlatform ?? "linkedin");
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setCreatingFor(profile.creatingFor);
    setName(profile.name);
    setCompanyName(profile.companyName);
    setRole(profile.role);
    setIndustry(profile.industry);
    setWebsite(profile.website);
    setPlatform(profile.defaultPlatform);
  }, [profile]);
  useEffect(() => {
    if (user) setEmail(user.email);
  }, [user]);

  const dirty =
    !!profile &&
    (creatingFor !== profile.creatingFor ||
      name !== profile.name ||
      companyName !== profile.companyName ||
      role !== profile.role ||
      industry !== profile.industry ||
      website !== profile.website ||
      platform !== profile.defaultPlatform ||
      email !== (user?.email ?? ""));

  const save = () => {
    if (!name.trim()) return toast.error("Ideako needs a name to write as.");
    saveProfile({ creatingFor, name: name.trim(), companyName: companyName.trim(), role: role.trim(), industry: industry.trim(), website: website.trim(), defaultPlatform: platform });
    createAccount({ email: email.trim().toLowerCase(), name: name.trim() });
    toast.success("Profile updated.");
  };

  const exportData = () => {
    const snapshot = exportSnapshot();
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ideako-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export downloaded.");
  };

  const clearAll = async () => {
    await resetWorkspace();
    toast.message("Workspace cleared.");
    router.replace("/");
  };

  return (
    <div className="mx-auto max-w-[880px]">
      <PageHeader eyebrow="Settings" title="Profile & workspace" description="Who Ideako writes as, and where your work lives." />

      <div className="flex flex-col gap-10">
        <Section title="Creating for">
          <ChipGroup>
            {CREATING_FOR.map((o) => (
              <Chip key={o.key} selected={creatingFor === o.key} onClick={() => setCreatingFor(o.key)} title={o.hint}>
                {o.label}
              </Chip>
            ))}
          </ChipGroup>
        </Section>

        <Section title="Profile">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Your name">{(id) => <Input id={id} value={name} onChange={(e) => setName(e.target.value)} />}</Field>
            <Field label="Email" hint="Used to sign back in on this device.">{(id) => <Input id={id} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />}</Field>
            <Field label={creatingFor === "brand" ? "Brand / team name" : "Company name"} optional={creatingFor === "myself"}>
              {(id) => <Input id={id} value={companyName} onChange={(e) => setCompanyName(e.target.value)} />}
            </Field>
            <Field label="Role">{(id) => <Input id={id} value={role} onChange={(e) => setRole(e.target.value)} />}</Field>
            <Field label="Industry">
              {(id) => (
                <>
                  <Input id={id} value={industry} onChange={(e) => setIndustry(e.target.value)} list="ideako-industries-settings" />
                  <datalist id="ideako-industries-settings">
                    {INDUSTRIES.map((i) => (
                      <option key={i} value={i} />
                    ))}
                  </datalist>
                </>
              )}
            </Field>
            <Field label="Website" optional>{(id) => <Input id={id} value={website} onChange={(e) => setWebsite(e.target.value)} inputMode="url" />}</Field>
          </div>
        </Section>

        <Section title="Platform" hint="Where your posts are headed. More platforms are on the way.">
          <ChipGroup>
            {(Object.keys(PLATFORMS) as Platform[]).map((p) => (
              <Chip key={p} selected={platform === p} disabled={!PLATFORMS[p].available} onClick={() => setPlatform(p)} title={PLATFORMS[p].available ? undefined : "Coming soon"} className={cx(!PLATFORMS[p].available && "opacity-50")}>
                {PLATFORMS[p].label}
                {!PLATFORMS[p].available && <span className="text-[10.5px] text-ink-4">soon</span>}
              </Chip>
            ))}
          </ChipGroup>
        </Section>

        <div className="flex justify-end border-t border-line pt-6">
          <Button variant="primary" onClick={save} disabled={!dirty}>
            Save changes
          </Button>
        </div>

        <Section title="Your data" hint="Ideako keeps your workspace in this browser. Nothing is sent anywhere except the text you generate with, which goes to Gemini through Ideako's server.">
          <div className="rounded-lg border border-line bg-surface">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
              <div>
                <p className="text-[14px] font-medium text-ink">Export workspace</p>
                <p className="text-[12.5px] text-ink-3">
                  {posts.length} posts · {references.length} references · {voice?.knowledge.length ?? 0} documents, as JSON.
                </p>
              </div>
              <Button size="sm" onClick={exportData}>
                Download
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3.5 sm:px-5">
              <div>
                <p className="text-[14px] font-medium text-ink">Clear workspace</p>
                <p className="text-[12.5px] text-ink-3">Removes your profile, voice, references and posts from this device.</p>
              </div>
              {confirmClear ? (
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => setConfirmClear(false)}>
                    Keep
                  </Button>
                  <Button size="sm" variant="danger" onClick={clearAll} className="border border-danger/30">
                    Yes, clear everything
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="danger" onClick={() => setConfirmClear(true)}>
                  Clear…
                </Button>
              )}
            </div>
          </div>
        </Section>

        <Section title="About">
          <p className="text-[13.5px] leading-relaxed text-ink-2">
            Ideako is an AI creative partner that learns how you communicate. Questions or ideas?{" "}
            <a href={CONTACT_URL} target="_blank" rel="noreferrer" className="font-medium text-ink underline-offset-4 hover:underline">
              Get in touch ↗
            </a>
          </p>
        </Section>
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
