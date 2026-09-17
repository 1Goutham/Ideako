"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ai, buildVoiceContext, toReferencePayload } from "@/lib/ai/client";
import type { AiError } from "@/lib/ai/contracts";
import { usePost, useWorkspace, useWorkspaceActions } from "@/lib/store";
import type { CreateBrief, RefineActionKey } from "@/lib/types";
import { REFINE_ACTIONS } from "@/lib/constants";
import { copyToClipboard, cx, hashContent, nowIso, uid } from "@/lib/utils";
import { Composer, type ComposerValue } from "./Composer";
import { HashtagPanel } from "./HashtagPanel";
import { InsightPanel } from "./InsightPanel";
import { PostEditor } from "./PostEditor";
import { ResultEmpty, ResultError, ResultLoading } from "./ResultPane";
import { newEntry } from "./TextEntryList";

const DRAFT_KEY = "ideako:v1:composer";
const ACTIVE_KEY = "ideako:v1:active-post";

const DEFAULT_VALUE: ComposerValue = {
  idea: "",
  contentType: "thought-leadership",
  tone: null,
  length: "medium",
  referenceIds: [],
  inlineEntries: [],
};

function readSession<T>(key: string, fallback: T): T {
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeSession(key: string, value: unknown) {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function CreateWorkspace() {
  const router = useRouter();
  const params = useSearchParams();
  const { profile, voice, references } = useWorkspace();
  const { createPost, updatePost } = useWorkspaceActions();

  const [value, setValue] = useState<ComposerValue>(DEFAULT_VALUE);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [refining, setRefining] = useState<RefineActionKey | null>(null);
  const [hashtagsLoading, setHashtagsLoading] = useState(false);
  const [insightLoading, setInsightLoading] = useState(false);
  const [error, setError] = useState<AiError | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const post = usePost(activeId);

  // Restore the composer + active post for this tab, or open a post from ?post=.
  useEffect(() => {
    const requested = params.get("post");
    const saved = readSession<ComposerValue>(DRAFT_KEY, DEFAULT_VALUE);
    setValue({ ...DEFAULT_VALUE, ...saved });
    setActiveId(requested ?? readSession<string | null>(ACTIVE_KEY, null));
    setHydrated(true);
  }, [params]);

  // When a post is opened from Saved, load its brief into the composer.
  const loadedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!post || loadedFor.current === post.id) return;
    loadedFor.current = post.id;
    if (params.get("post") === post.id) {
      setValue({
        idea: post.brief.idea,
        contentType: post.brief.contentType,
        tone: post.brief.tone,
        length: post.brief.length,
        referenceIds: post.brief.referenceIds.filter((id) => references.some((r) => r.id === id)),
        inlineEntries: post.brief.inlineReferences.map((content) => newEntry({ content })),
      });
      router.replace("/create", { scroll: false });
    }
  }, [post, params, references, router]);

  useEffect(() => {
    if (hydrated) writeSession(DRAFT_KEY, value);
  }, [value, hydrated]);
  useEffect(() => {
    if (hydrated) writeSession(ACTIVE_KEY, activeId);
  }, [activeId, hydrated]);

  const patch = useCallback((p: Partial<ComposerValue>) => setValue((v) => ({ ...v, ...p })), []);

  const context = useMemo(() => (profile ? buildVoiceContext(profile, voice) : null), [profile, voice]);

  const writingAs = profile
    ? profile.creatingFor === "myself"
      ? profile.name
      : profile.companyName || profile.name
    : "";
  const previewSubtitle = profile
    ? profile.creatingFor === "myself"
      ? [profile.role, profile.companyName].filter(Boolean).join(" · ")
      : profile.industry || profile.role
    : "";

  const buildBrief = useCallback((): CreateBrief => {
    const defaults = value.referenceIds.length || value.inlineEntries.some((e) => e.content.trim())
      ? value.referenceIds
      : references.filter((r) => r.useByDefault).map((r) => r.id);
    return {
      platform: "linkedin",
      idea: value.idea.trim(),
      contentType: value.contentType,
      tone: value.tone,
      length: value.length,
      referenceIds: defaults,
      inlineReferences: value.inlineEntries.map((e) => e.content.trim()).filter(Boolean),
    };
  }, [value, references]);

  const scrollToResult = () => {
    if (window.matchMedia("(max-width: 1023px)").matches) {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const runInsight = useCallback(
    async (postId: string, content: string) => {
      if (!context) return;
      setInsightLoading(true);
      const res = await ai.insights({ context, platform: "linkedin", post: content });
      setInsightLoading(false);
      if (res.ok) {
        updatePost(postId, { insight: { ...res.data, contentHash: hashContent(content), analysedAt: nowIso() } });
      }
    },
    [context, updatePost],
  );

  const generate = async (mode: "new" | "regenerate" = "new") => {
    if (!context || !profile) return;
    const brief = buildBrief();
    if (!brief.idea) return;
    setError(null);
    if (mode === "regenerate") setRegenerating(true);
    else setGenerating(true);
    scrollToResult();

    const refs = references.filter((r) => brief.referenceIds.includes(r.id));
    const res = await ai.generate({
      context,
      brief: { ...brief, references: toReferencePayload(refs, brief.inlineReferences) },
    });

    setGenerating(false);
    setRegenerating(false);

    if (!res.ok) {
      if (mode === "regenerate") toast.error(res.error.message);
      else setError(res.error);
      return;
    }

    if (mode === "regenerate" && post) {
      updatePost(post.id, (p) => ({
        content: res.data.post,
        title: res.data.title,
        versions: [...p.versions, { id: uid("ver"), content: res.data.post, origin: "regenerate", createdAt: nowIso() }],
      }));
      void runInsight(post.id, res.data.post);
      toast.success("Fresh version ready.");
      return;
    }

    const created = createPost({ title: res.data.title, content: res.data.post, brief });
    loadedFor.current = created.id;
    setActiveId(created.id);
    void runInsight(created.id, res.data.post);
  };

  const refine = async (action: RefineActionKey) => {
    if (!post || !context) return;
    setRefining(action);
    const res = await ai.refine({ context, platform: post.platform, post: post.content, action, idea: post.brief.idea });
    setRefining(null);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    updatePost(post.id, (p) => ({
      content: res.data.post,
      versions: [...p.versions, { id: uid("ver"), content: res.data.post, origin: action, createdAt: nowIso() }],
    }));
    const label = REFINE_ACTIONS.find((a) => a.key === action)?.label ?? "Refined";
    toast.success(`${label} · v${post.versions.length + 1}`, { description: "Undo is one click away if you preferred the last one." });
  };

  const undo = () => {
    if (!post || post.versions.length < 2) return;
    const versions = post.versions.slice(0, -1);
    updatePost(post.id, { content: versions[versions.length - 1].content, versions });
    toast.message("Restored the previous version.");
  };

  const copyPost = async () => {
    if (!post) return;
    if (await copyToClipboard(post.content)) toast.success("Post copied.");
    else toast.error("Couldn't access the clipboard.");
  };

  const toggleSave = () => {
    if (!post) return;
    const next = post.status === "saved" ? "draft" : "saved";
    updatePost(post.id, { status: next });
    if (next === "saved") {
      toast.success("Saved.", { action: { label: "View saved", onClick: () => router.push("/saved") } });
    } else {
      toast.message("Removed from saved. It stays in your history.");
    }
  };

  const suggestHashtags = async () => {
    if (!post || !context) return;
    setHashtagsLoading(true);
    const res = await ai.hashtags({ context, platform: post.platform, post: post.content });
    setHashtagsLoading(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    updatePost(post.id, {
      hashtags: { groups: res.data, selected: res.data.recommended.slice(0, 5).map((h) => h.tag), generatedAt: nowIso() },
    });
  };

  const toggleHashtag = (tag: string) => {
    if (!post) return;
    updatePost(post.id, (p) => ({
      hashtags: {
        ...p.hashtags,
        selected: p.hashtags.selected.includes(tag) ? p.hashtags.selected.filter((t) => t !== tag) : [...p.hashtags.selected, tag],
      },
    }));
  };

  const copyHashtags = async () => {
    if (!post) return;
    if (await copyToClipboard(post.hashtags.selected.map((t) => `#${t}`).join(" "))) toast.success("Hashtags copied.");
    else toast.error("Couldn't access the clipboard.");
  };

  const hashtagLine = post ? post.hashtags.selected.map((t) => `#${t}`).join(" ") : "";
  const hashtagsInPost = !!post && !!hashtagLine && post.content.includes(hashtagLine);

  const appendHashtags = () => {
    if (!post || !hashtagLine || hashtagsInPost) return;
    updatePost(post.id, { content: `${post.content.trimEnd()}\n\n${hashtagLine}` });
    toast.success("Hashtags added to the post.");
  };

  const insightStale = !!post?.insight && post.insight.contentHash !== hashContent(post.content);

  if (!profile) return null;

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,11fr)_minmax(0,13fr)] lg:gap-14 xl:gap-20">
      <div className="min-w-0">
        <Composer
          value={value}
          onChange={patch}
          onSubmit={() => generate("new")}
          generating={generating}
          hasResult={!!post}
          library={references}
          voiceTones={voice?.tones ?? []}
          writingAs={writingAs}
        />
      </div>

      <div ref={resultRef} className={cx("min-w-0 scroll-mt-20", !post && "lg:sticky lg:top-24 lg:self-start")}>
        <div className="flex flex-col gap-4">
          {generating ? (
            <ResultLoading />
          ) : error ? (
            <ResultError error={error} onRetry={() => generate("new")} />
          ) : post ? (
            <>
              <PostEditor
                post={post}
                onContentChange={(content) => updatePost(post.id, { content })}
                onRefine={refine}
                onUndo={undo}
                onCopy={copyPost}
                onSave={toggleSave}
                onRegenerate={() => generate("regenerate")}
                refining={refining}
                regenerating={regenerating}
                previewName={writingAs}
                previewSubtitle={previewSubtitle}
              />
              <InsightPanel
                insight={post.insight}
                loading={insightLoading}
                stale={insightStale}
                onRecheck={() => runInsight(post.id, post.content)}
                onImproveHook={() => refine("hook")}
              />
              <HashtagPanel
                state={post.hashtags}
                loading={hashtagsLoading}
                onGenerate={suggestHashtags}
                onToggle={toggleHashtag}
                onCopy={copyHashtags}
                onAppend={appendHashtags}
                alreadyInPost={hashtagsInPost}
              />
            </>
          ) : (
            <ResultEmpty hasVoice={!!voice && (voice.tones.length > 0 || references.length > 0)} />
          )}
        </div>
      </div>
    </div>
  );
}
