"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PLATFORMS } from "@/lib/constants";
import { useWorkspace, useWorkspaceActions } from "@/lib/store";
import type { GeneratedPost } from "@/lib/types";
import { copyToClipboard, cx, excerpt, formatDate, openingLine } from "@/lib/utils";
import { IconMore, LinkButton } from "@/components/ui";
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
    { label: "Edit", run: () => open(post) },
    {
      label: "Copy",
      run: async () => {
        if (await copyToClipboard(post.content)) toast.success("Post copied.");
        else toast.error("Couldn't access the clipboard.");
      },
    },
    {
      label: post.status === "saved" ? "Unsave" : "Save",
      run: () => updatePost(post.id, { status: post.status === "saved" ? "draft" : "saved" }),
    },
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
    <div className="mx-auto max-w-[880px]">
      <PageHeader
        eyebrow="Saved"
        title="Recent creations"
        description="Everything Ideako has written with you. Save the ones you like; the rest stays here as history."
        actions={
          <div className="inline-flex rounded-md border border-line-2 bg-surface-2 p-0.5" role="tablist">
            {(
              [
                { key: "saved", label: `Saved${savedCount ? ` · ${savedCount}` : ""}` },
                { key: "all", label: `All history${posts.length ? ` · ${posts.length}` : ""}` },
              ] as { key: Filter; label: string }[]
            ).map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={filter === t.key}
                onClick={() => setFilter(t.key)}
                className={cx(
                  "h-8 rounded-[5px] px-3 text-[13px] font-medium transition-colors",
                  filter === t.key ? "bg-surface text-ink shadow-[0_1px_2px_rgb(20_23_26/0.08)]" : "text-ink-3 hover:text-ink",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        }
      />

      {list.length === 0 ? (
        <EmptyState
          title={filter === "saved" ? "Nothing saved yet" : "No posts yet"}
          description={
            filter === "saved"
              ? posts.length
                ? "Open a post from your history and hit Save to keep it here."
                : "When you save a post you like, it lives here so you can come back, reuse it, or turn it into a reference."
              : "Generate your first post and it will show up here automatically."
          }
          action={
            posts.length && filter === "saved" ? (
              <button type="button" onClick={() => setFilter("all")} className="text-sm font-medium text-ink underline-offset-4 hover:underline">
                See all history
              </button>
            ) : (
              <LinkButton href="/create" variant="primary">
                Create a post
              </LinkButton>
            )
          }
        />
      ) : (
        <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
          {list.map((post) => (
            <li key={post.id} className="group flex items-start gap-4 px-4 py-4 sm:px-5">
              <button type="button" onClick={() => open(post)} className="min-w-0 flex-1 text-left">
                <p className="text-[14.5px] font-medium leading-snug text-ink">{openingLine(post.content, 90)}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-3">{excerpt(post.content.split("\n").slice(1).join(" "), 120)}</p>
                <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-ink-4">
                  <span>{formatDate(post.updatedAt)}</span>
                  <span aria-hidden="true">·</span>
                  <span>{PLATFORMS[post.platform].label}</span>
                  <span aria-hidden="true">·</span>
                  <span className={post.status === "saved" ? "text-success" : ""}>{post.status === "saved" ? "Saved" : "Draft"}</span>
                  {post.versions.length > 1 && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>v{post.versions.length}</span>
                    </>
                  )}
                  {post.hashtags.selected.length > 0 && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{post.hashtags.selected.length} hashtags</span>
                    </>
                  )}
                </p>
              </button>
              <RowMenu items={actions(post)} />
            </li>
          ))}
        </ul>
      )}

      {posts.length > 0 && (
        <p className="mt-4 text-[12px] text-ink-4">
          Posts are kept on this device. <Link href="/settings" className="underline-offset-4 hover:text-ink hover:underline">Export or clear</Link> them under Settings.
        </p>
      )}
    </div>
  );
}

function RowMenu({ items }: { items: { label: string; run: () => void; danger?: boolean; disabled?: boolean }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Post actions"
        className={cx("flex size-8 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink", open && "bg-surface-2 text-ink")}
      >
        <IconMore size={18} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-20 mt-1 w-44 rounded-md border border-line bg-surface py-1 shadow-pop animate-fade">
          {items.map((it) => (
            <button
              key={it.label}
              role="menuitem"
              disabled={it.disabled}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setOpen(false);
                it.run();
              }}
              className={cx(
                "block w-full px-3 py-1.5 text-left text-[13px] transition-colors disabled:opacity-40",
                it.danger ? "text-danger hover:bg-danger-soft" : "text-ink-2 hover:bg-surface-2 hover:text-ink",
              )}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
