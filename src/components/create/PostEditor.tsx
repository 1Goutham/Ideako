"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PLATFORMS, REFINE_ACTIONS } from "@/lib/constants";
import type { GeneratedPost, RefineActionKey } from "@/lib/types";
import { cx, readingTime, wordCount } from "@/lib/utils";
import { IconCopy, IconRefresh, IconUndo, Spinner, TextAction, Textarea } from "@/components/ui";
import { PostPreview } from "./PostPreview";

interface Props {
  post: GeneratedPost;
  onContentChange: (content: string) => void;
  onRefine: (action: RefineActionKey) => void;
  onUndo: () => void;
  onCopy: () => void;
  onSave: () => void;
  onRegenerate: () => void;
  refining: RefineActionKey | null;
  regenerating: boolean;
  previewName: string;
  previewSubtitle: string;
}

export function PostEditor({
  post,
  onContentChange,
  onRefine,
  onUndo,
  onCopy,
  onSave,
  onRegenerate,
  refining,
  regenerating,
  previewName,
  previewSubtitle,
}: Props) {
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [local, setLocal] = useState(post.content);
  const commitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busy = !!refining || regenerating;

  // Adopt external changes (refine, undo, regenerate, opening another post).
  useEffect(() => {
    setLocal(post.content);
  }, [post.id, post.content]);

  useEffect(() => () => {
    if (commitTimer.current) clearTimeout(commitTimer.current);
  }, []);

  const handleChange = (value: string) => {
    setLocal(value);
    if (commitTimer.current) clearTimeout(commitTimer.current);
    commitTimer.current = setTimeout(() => onContentChange(value), 350);
  };

  const flush = () => {
    if (commitTimer.current) {
      clearTimeout(commitTimer.current);
      commitTimer.current = null;
    }
    if (local !== post.content) onContentChange(local);
  };

  const limit = PLATFORMS[post.platform].maxChars;
  const chars = local.length;
  const words = useMemo(() => wordCount(local), [local]);
  const canUndo = post.versions.length > 1;
  const versionLabel = `v${post.versions.length}`;

  return (
    <div className="animate-rise">
      <div className={cx("rounded-lg border border-line bg-surface transition-opacity", busy && "opacity-70")}>
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line px-4 py-2.5 sm:px-5">
          <div className="flex items-center gap-3 text-[12.5px] text-ink-3">
            <span className="font-medium text-ink">Generated post</span>
            <span className="text-ink-4">{versionLabel}</span>
            {post.status === "saved" && (
              <span className="rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-medium text-success">Saved</span>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            <div className="mr-2 inline-flex rounded-sm bg-surface-2 p-0.5" role="tablist" aria-label="View">
              {(["edit", "preview"] as const).map((m) => (
                <button
                  key={m}
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => {
                    flush();
                    setMode(m);
                  }}
                  className={cx(
                    "h-6 rounded-[3px] px-2.5 text-[12px] font-medium capitalize transition-colors",
                    mode === m ? "bg-surface text-ink shadow-[0_1px_2px_rgb(20_23_26/0.08)]" : "text-ink-3 hover:text-ink",
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
            <TextAction onClick={onCopy} title="Copy post">
              <IconCopy size={14} /> Copy
            </TextAction>
            <TextAction onClick={onSave} active={post.status === "saved"} title={post.status === "saved" ? "Remove from saved" : "Save post"}>
              {post.status === "saved" ? "Unsave" : "Save"}
            </TextAction>
            <TextAction onClick={onRegenerate} disabled={busy} title="Generate a fresh version from the same brief">
              {regenerating ? <Spinner className="size-3.5" /> : <IconRefresh size={14} />} Regenerate
            </TextAction>
          </div>
        </div>

        {/* Body */}
        {mode === "edit" ? (
          <Textarea
            bare
            autosize
            minRows={10}
            value={local}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={flush}
            disabled={busy}
            aria-label="Post content"
            spellCheck
            className="prose-post px-5 py-5 text-[15px] leading-[1.75] sm:px-6"
          />
        ) : (
          <PostPreview
            content={local}
            platform={post.platform}
            name={previewName}
            subtitle={previewSubtitle}
            hashtags={post.hashtags.selected}
          />
        )}

        {/* Meta */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-5 py-2 text-[11.5px] text-ink-4 sm:px-6">
          <span>
            {words} words · {readingTime(local)}
          </span>
          <span className={cx(chars > limit && "text-danger")}>
            {chars.toLocaleString()} / {limit.toLocaleString()}
          </span>
        </div>

        {/* Refine */}
        <div className="border-t border-line px-4 py-3.5 sm:px-5">
          <div className="mb-2.5 flex items-center justify-between">
            <p className="eyebrow">Refine</p>
            {canUndo && (
              <button
                type="button"
                onClick={onUndo}
                disabled={busy}
                className="inline-flex items-center gap-1 text-[12px] font-medium text-ink-3 hover:text-ink disabled:opacity-40"
              >
                <IconUndo size={13} /> Undo last change
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {REFINE_ACTIONS.map((a) => {
              const active = refining === a.key;
              return (
                <button
                  key={a.key}
                  type="button"
                  onClick={() => {
                    flush();
                    onRefine(a.key);
                  }}
                  disabled={busy}
                  title={a.instruction}
                  className={cx(
                    "inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-medium transition-colors disabled:opacity-50",
                    active ? "border-ink bg-ink text-white" : "border-line-2 bg-surface text-ink-2 hover:border-ink-4 hover:text-ink",
                  )}
                >
                  {active && <Spinner className="size-3 text-white" />}
                  {a.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
