"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PLATFORMS } from "@/lib/constants";
import { useWorkspace, useWorkspaceActions } from "@/lib/store";
import type { GeneratedPost } from "@/lib/types";
import { copyToClipboard, cx, excerpt, formatDate, openingLine } from "@/lib/utils";
import { LinkButton, Segmented, TextAction } from "@/components/ui";
import { EmptyState } from "./EmptyState";
import { PageHeader } from "./PageHeader";

type Filter = "saved" | "all";

export function SavedView() {
  const router = useRouter();
  const { posts, references } = useWorkspace();
  const { updatePost, duplicatePost, removePost, addReference } = useWorkspaceActions();
  const [filter, setFilter] = useState<Filter>("saved");

  const savedCount = posts.filter((p) => p.status === "saved").length;
  const list = useMemo(
    () => (filter === "saved" ? posts.filter((p) => p.status === "saved") : posts).slice().sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)),
    [posts, filter],
  );

  const open = (post: GeneratedPost) => router.push(`/create?post=${post.id}`);

  const actions = (post: GeneratedPost) => [
    { label: "Open", run: () => open(post) },
    {
      label: "Copy",
      run: async () => {
        if (await copyToClipboard(post.content)) toast.success("Post copied.");
        else toast.error("Couldn't access the clipboard.");
      },
    },
    { label: post.status === "saved" ? "Unsave" : "Save", run: () => updatePost(post.id, { status: post.status === "saved" ? "draft" : "saved" }) },
    {
      label: "Duplicate",
      run: () => {
        duplicatePost(post.id);
        toast.success("Duplicated. Find it under All history.");
      },
    },
    {
      label: "Use as reference",
      disabled: references.some((r) => r.source === "saved-post" && r.content === post.content),
      run: () => {
        addReference({ title: post.title || openingLine(post.content, 60), content: post.content, source: "saved-post", platform: post.platform, useByDefault: true });
        toast.success("Added to your references.");
      },
    },
    {
      label: "Delete",
      danger: true,
      run: () => {
        removePost(post.id);
        toast.message("Deleted.");
      },
    },
  ];

  return (
    <div>
      <PageHeader
        index="04 · Saved"
        title="Recent creations"
        description="Everything Ideako has written with you. Save the ones you like; the rest stays here as history."
        actions={
          <Segmented<Filter>
            ariaLabel="Filter"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "saved", label: `Saved${savedCount ? ` (${savedCount})` : ""}` },
              { value: "all", label: `All history${posts.length ? ` (${posts.length})` : ""}` },
            ]}
          />
        }
      />

      {list.length === 0 ? (
        <EmptyState
          title={filter === "saved" ? "Nothing saved yet." : "No posts yet."}
          description={
            filter === "saved"
              ? posts.length
                ? "Open a post from your history and hit Save to keep it here."
                : "When you save a post you like, it lives here so you can come back, reuse it, or turn it into a reference."
              : "Generate your first post and it will show up here automatically."
          }
          action={
            posts.length && filter === "saved" ? (
              <TextAction onClick={() => setFilter("all")}>See all history</TextAction>
            ) : (
              <LinkButton href="/create" variant="primary">
                Create a post
              </LinkButton>
            )
          }
        />
      ) : (
        <>
          <div className="flex items-baseline justify-between border-b border-line pb-3">
            <p className="label">{filter === "saved" ? "Saved" : "All history"} <span className="text-ink-4">({list.length})</span></p>
            <p className="mono text-[11px] text-ink-4">Updated</p>
          </div>
          <ul>
            {list.map((post) => (
              <li key={post.id} className="group border-b border-line py-6">
                <div className="flex items-start justify-between gap-6">
                  <button type="button" onClick={() => open(post)} className="min-w-0 flex-1 text-left">
                    <p className="display text-[24px] text-ink md:text-[32px]">{openingLine(post.content, 90)}</p>
                    <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-ink-3">{excerpt(post.content.split("\n").slice(1).join(" "), 140)}</p>
                  </button>
                  <span className="mono shrink-0 text-[12px] text-ink-3">{formatDate(post.updatedAt)}</span>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="mono flex flex-wrap items-center gap-x-3 text-[11px] uppercase tracking-wider text-ink-4">
                    <span>{PLATFORMS[post.platform].label}</span>
                    <span className={cx("flex items-center gap-1.5", post.status === "saved" && "text-ink-2")}>
                      {post.status === "saved" && <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />}
                      {post.status === "saved" ? "Saved" : "Draft"}
                    </span>
                    <span>v{post.versions.length}</span>
                    {post.hashtags.selected.length > 0 && <span>{post.hashtags.selected.length} hashtags</span>}
                  </p>
                  <RowMenu items={actions(post)} />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {posts.length > 0 && (
        <p className="mt-6 text-[12.5px] text-ink-4">
          Posts are kept on this device.{" "}
          <Link href="/settings" className="link-underline text-ink-3 hover:text-ink">
            Export or clear
          </Link>{" "}
          them under Settings.
        </p>
      )}
    </div>
  );
}

function RowMenu({ items }: { items: { label: string; run: () => void; danger?: boolean; disabled?: boolean }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <div className="hidden items-center gap-3 sm:flex">
        {items.slice(0, 3).map((it) => (
          <TextAction key={it.label} onClick={it.run} disabled={it.disabled}>
            {it.label}
          </TextAction>
        ))}
        <TextAction onClick={() => setOpen((o) => !o)} onBlur={() => setTimeout(() => setOpen(false), 120)} aria-haspopup="menu" aria-expanded={open} active={open}>
          More
        </TextAction>
      </div>
      <div className="sm:hidden">
        <TextAction onClick={() => setOpen((o) => !o)} onBlur={() => setTimeout(() => setOpen(false), 120)} aria-haspopup="menu" aria-expanded={open} active={open}>
          Actions
        </TextAction>
      </div>
      {open && (
        <div role="menu" className="absolute right-0 z-20 mt-2 w-48 border border-line-2 bg-paper py-1 animate-fade">
          {(typeof window !== "undefined" && window.matchMedia("(min-width: 640px)").matches ? items.slice(3) : items).map((it) => (
            <button
              key={it.label}
              role="menuitem"
              disabled={it.disabled}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setOpen(false);
                it.run();
              }}
              className={cx("block w-full px-4 py-2 text-left text-[13.5px] transition-colors disabled:opacity-40", it.danger ? "text-danger hover:bg-ink/5" : "text-ink-2 hover:bg-ink/5 hover:text-ink")}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
