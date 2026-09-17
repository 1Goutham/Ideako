"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AUTHOR, CREATING_FOR, INDUSTRIES, PLATFORMS } from "@/lib/constants";
import { useWorkspace, useWorkspaceActions } from "@/lib/store";
import type { CreatingFor, Platform } from "@/lib/types";
import { Button, Chip, ChipGroup, Field, Input, TextAction } from "@/components/ui";
import { EnginePanel } from "./EnginePanel";
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
    <div>
      <PageHeader index="05 · Settings" title="Profile & workspace" description="Who Ideako writes as, and where your work lives." />

      <div className="flex flex-col">
        <Section index="01" title="Creating for">
          <ChipGroup>
            {CREATING_FOR.map((o) => (
              <Chip key={o.key} selected={creatingFor === o.key} onClick={() => setCreatingFor(o.key)} title={o.hint}>
                {o.label}
              </Chip>
            ))}
          </ChipGroup>
        </Section>

        <Section index="02" title="Profile">
          <div className="grid gap-8 sm:grid-cols-2 sm:gap-x-10">
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

        <Section index="03" title="Platform" hint="Where your posts are headed. More platforms are on the way.">
          <ChipGroup>
            {(Object.keys(PLATFORMS) as Platform[]).map((p) => (
              <Chip key={p} selected={platform === p} disabled={!PLATFORMS[p].available} onClick={() => setPlatform(p)} title={PLATFORMS[p].available ? undefined : "Coming soon"}>
                {PLATFORMS[p].label}
                {!PLATFORMS[p].available && <span className="mono text-[10px] text-ink-4">soon</span>}
              </Chip>
            ))}
          </ChipGroup>
        </Section>

        <div className="flex justify-end py-6">
          <Button variant="primary" onClick={save} disabled={!dirty}>
            Save changes
          </Button>
        </div>

        <Section index="04" title="Your data" hint="Ideako keeps your workspace in this browser. Only the text you generate with goes to the AI engine, through Ideako's server.">
          <ul className="border-t border-line">
            <li className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-4">
              <div>
                <p className="text-[15px] text-ink">Export workspace</p>
                <p className="mono mt-1 text-[11px] text-ink-4">
                  {posts.length} posts · {references.length} references · {voice?.knowledge.length ?? 0} documents · JSON
                </p>
              </div>
              <TextAction onClick={exportData}>Download</TextAction>
            </li>
            <li className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-4">
              <div>
                <p className="text-[15px] text-ink">Clear workspace</p>
                <p className="mt-1 text-[12.5px] text-ink-3">Removes your profile, voice, references and posts from this device.</p>
              </div>
              {confirmClear ? (
                <div className="flex items-center gap-4">
                  <TextAction onClick={() => setConfirmClear(false)}>Keep</TextAction>
                  <TextAction onClick={clearAll} className="text-danger hover:text-danger">Yes, clear everything</TextAction>
                </div>
              ) : (
                <TextAction onClick={() => setConfirmClear(true)} className="text-danger hover:text-danger">Clear…</TextAction>
              )}
            </li>
          </ul>
        </Section>

        <Section index="05" title="AI engine" hint="Which model writes with you. Free tiers, with automatic fallback when one is rate-limited.">
          <EnginePanel />
        </Section>

        <Section index="06" title="About">
          <p className="max-w-lg text-[15px] leading-relaxed text-ink-2">
            Ideako is an AI creative partner that learns how you communicate. A product of{" "}
            <a href={AUTHOR.site} target="_blank" rel="noreferrer" className="link-underline text-ink">
              {AUTHOR.handle} ↗
            </a>
            , designed and built by {AUTHOR.name}.
          </p>
          <ul className="mt-6 border-t border-line">
            {[
              { label: "Portfolio", href: AUTHOR.site, value: "1goutham.space" },
              { label: "LinkedIn", href: AUTHOR.linkedin, value: "goutham-g" },
              { label: "GitHub", href: AUTHOR.github, value: AUTHOR.handle },
              { label: "Instagram", href: AUTHOR.instagram, value: "@tanger.ineee" },
              { label: "Email", href: `mailto:${AUTHOR.email}`, value: AUTHOR.email },
            ].map((l) => (
              <li key={l.label} className="flex items-center justify-between gap-4 border-b border-line py-3 text-[14px]">
                <span className="label">{l.label}</span>
                <a href={l.href} target={l.href.startsWith("mailto:") ? undefined : "_blank"} rel="noreferrer" className="link-underline text-ink">
                  {l.value} ↗
                </a>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}

function Section({ index, title, hint, children }: { index: string; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-6 border-t border-line py-10 md:grid-cols-12 md:gap-10">
      <div className="md:col-span-4">
        <p className="label">{index}</p>
        <h2 className="mt-3 text-[20px] text-ink">{title}</h2>
        {hint && <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-ink-3">{hint}</p>}
      </div>
      <div className="min-w-0 md:col-span-8">{children}</div>
    </section>
  );
}
