"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PLATFORMS, REFINE_ACTIONS } from "@/lib/constants";
import type { GeneratedPost, RefineActionKey } from "@/lib/types";
import { cx, readingTime, wordCount } from "@/lib/utils";
import { Spinner, TextAction, Textarea } from "@/components/ui";
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

  return (
    <div className="animate-rise">
      <div className={cx("border border-line-2 bg-surface transition-opacity", busy && "opacity-60")}>
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line px-5 py-3">
          <div className="flex items-center gap-4">
            <span className="text-[13.5px] text-ink">Generated post</span>
            <span className="mono text-[11.5px] text-ink-4">v{post.versions.length}</span>
            {post.status === "saved" && (
              <span className="mono flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-ink-3">
                <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" /> Saved
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="mr-2 flex items-center gap-3" role="tablist" aria-label="View">
              {(["edit", "preview"] as const).map((m) => (
                <button
                  key={m}
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => {
                    flush();
                    setMode(m);
                  }}
                  className={cx("link-underline text-[12.5px] capitalize transition-colors", mode === m ? "text-ink after:scale-x-100" : "text-ink-3 hover:text-ink")}
                >
                  {m}
                </button>
              ))}
            </div>
            <TextAction onClick={onCopy} title="Copy post">Copy</TextAction>
            <TextAction onClick={onSave} active={post.status === "saved"} title={post.status === "saved" ? "Remove from saved" : "Save post"}>
              {post.status === "saved" ? "Unsave" : "Save"}
            </TextAction>
            <TextAction onClick={onRegenerate} disabled={busy} title="Generate a fresh version from the same brief">
              {regenerating && <Spinner className="size-3" />}Regenerate
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
            className="prose-post px-6 py-6 text-[16px] leading-[1.75]"
          />
        ) : (
          <PostPreview content={local} platform={post.platform} name={previewName} subtitle={previewSubtitle} hashtags={post.hashtags.selected} />
        )}

        {/* Meta */}
        <div className="mono flex flex-wrap items-center justify-between gap-2 border-t border-line px-6 py-2.5 text-[11px] text-ink-4">
          <span>
            {words} words · {readingTime(local)}
          </span>
          <span className={cx(chars > limit && "text-danger")}>
            {chars.toLocaleString()} / {limit.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Refine */}
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between border-b border-line pb-3">
          <p className="label">Refine</p>
          {canUndo && (
            <TextAction onClick={onUndo} disabled={busy}>
              Undo last change
            </TextAction>
          )}
        </div>
        <div className="flex flex-wrap gap-x-1 gap-y-2">
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
                  "inline-flex h-8 items-center gap-2 rounded-full border px-3.5 text-[13px] transition-colors disabled:opacity-40",
                  active ? "border-ink bg-ink text-[#f5f3ef]" : "border-line-2 text-ink-2 hover:border-ink hover:text-ink",
                )}
              >
                {active && <Spinner className="size-3 text-[#f5f3ef]" />}
                {a.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
