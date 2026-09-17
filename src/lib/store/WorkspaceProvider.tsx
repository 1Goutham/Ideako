"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { repository } from "../storage";
import type {
  CreateBrief,
  GeneratedPost,
  Profile,
  Reference,
  User,
  Voice,
  WorkspaceSnapshot,
} from "../types";
import { nowIso, uid } from "../utils";

/**
 * Single source of truth for the signed-in workspace.
 *
 * Components read state from here and mutate it through the action helpers;
 * every mutation is written through to the repository so the UI never has to
 * know where data lives.
 */

interface WorkspaceState extends WorkspaceSnapshot {
  /** True once the repository has been read on the client. */
  ready: boolean;
}

export interface WorkspaceActions {
  createAccount(input: { email: string; name: string }): User;
  saveProfile(input: Partial<Profile> & Pick<Profile, "name">): Profile;
  saveVoice(input: Partial<Voice>): Voice;

  addReference(input: Omit<Reference, "id" | "profileId" | "createdAt">): Reference;
  updateReference(id: string, patch: Partial<Reference>): void;
  removeReference(id: string): void;

  createPost(input: {
    title: string;
    content: string;
    brief: CreateBrief;
  }): GeneratedPost;
  updatePost(id: string, patch: Partial<GeneratedPost> | ((post: GeneratedPost) => Partial<GeneratedPost>)): void;
  duplicatePost(id: string): GeneratedPost | null;
  removePost(id: string): void;

  exportSnapshot(): WorkspaceSnapshot;
  resetWorkspace(): Promise<void>;
}

const StateCtx = createContext<WorkspaceState | null>(null);
const ActionsCtx = createContext<WorkspaceActions | null>(null);

const EMPTY: WorkspaceState = { ready: false, user: null, profile: null, voice: null, references: [], posts: [] };

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WorkspaceState>(EMPTY);
  // Ref mirror so actions can read the latest state synchronously.
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    let cancelled = false;
    repository.load().then((snap) => {
      if (!cancelled) setState({ ...snap, ready: true });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const requireProfileId = () => stateRef.current.profile?.id ?? "anonymous";

  const actions = useMemo<WorkspaceActions>(() => {
    const createAccount: WorkspaceActions["createAccount"] = ({ email, name }) => {
      const existing = stateRef.current.user;
      const user: User = existing
        ? { ...existing, email: email || existing.email, name: name || existing.name }
        : { id: uid("usr"), email, name, createdAt: nowIso() };
      setState((s) => ({ ...s, user }));
      void repository.saveUser(user);
      return user;
    };

    const saveProfile: WorkspaceActions["saveProfile"] = (input) => {
      const prev = stateRef.current.profile;
      const profile: Profile = {
        id: prev?.id ?? uid("prf"),
        userId: prev?.userId ?? stateRef.current.user?.id ?? "local",
        creatingFor: prev?.creatingFor ?? "myself",
        companyName: "",
        role: "",
        industry: "",
        website: "",
        defaultPlatform: "linkedin",
        onboardingCompletedAt: prev?.onboardingCompletedAt ?? null,
        createdAt: prev?.createdAt ?? nowIso(),
        ...prev,
        ...input,
        updatedAt: nowIso(),
      };
      setState((s) => ({ ...s, profile }));
      void repository.saveProfile(profile);
      return profile;
    };

    const saveVoice: WorkspaceActions["saveVoice"] = (input) => {
      const prev = stateRef.current.voice;
      const voice: Voice = {
        id: prev?.id ?? uid("voc"),
        profileId: prev?.profileId ?? requireProfileId(),
        tones: [],
        description: "",
        brandDescription: "",
        audience: "",
        writingPreferences: "",
        avoid: "",
        knowledge: [],
        summary: null,
        ...prev,
        ...input,
        updatedAt: nowIso(),
      };
      setState((s) => ({ ...s, voice }));
      void repository.saveVoice(voice);
      return voice;
    };

    const addReference: WorkspaceActions["addReference"] = (input) => {
      const reference: Reference = { ...input, id: uid("ref"), profileId: requireProfileId(), createdAt: nowIso() };
      setState((s) => ({ ...s, references: [reference, ...s.references] }));
      void repository.upsertReference(reference);
      return reference;
    };

    const updateReference: WorkspaceActions["updateReference"] = (id, patch) => {
      const current = stateRef.current.references.find((r) => r.id === id);
      if (!current) return;
      const next = { ...current, ...patch };
      setState((s) => ({ ...s, references: s.references.map((r) => (r.id === id ? next : r)) }));
      void repository.upsertReference(next);
    };

    const removeReference: WorkspaceActions["removeReference"] = (id) => {
      setState((s) => ({ ...s, references: s.references.filter((r) => r.id !== id) }));
      void repository.deleteReference(id);
    };

    const createPost: WorkspaceActions["createPost"] = ({ title, content, brief }) => {
      const ts = nowIso();
      const post: GeneratedPost = {
        id: uid("pst"),
        profileId: requireProfileId(),
        platform: brief.platform,
        title,
        content,
        brief,
        versions: [{ id: uid("ver"), content, origin: "generate", createdAt: ts }],
        hashtags: { groups: null, selected: [], generatedAt: null },
        insight: null,
        status: "draft",
        createdAt: ts,
        updatedAt: ts,
      };
      setState((s) => ({ ...s, posts: [post, ...s.posts] }));
      void repository.upsertPost(post);
      return post;
    };

    const updatePost: WorkspaceActions["updatePost"] = (id, patch) => {
      const current = stateRef.current.posts.find((p) => p.id === id);
      if (!current) return;
      const resolved = typeof patch === "function" ? patch(current) : patch;
      const next: GeneratedPost = { ...current, ...resolved, updatedAt: nowIso() };
      setState((s) => ({ ...s, posts: s.posts.map((p) => (p.id === id ? next : p)) }));
      void repository.upsertPost(next);
    };

    const duplicatePost: WorkspaceActions["duplicatePost"] = (id) => {
      const current = stateRef.current.posts.find((p) => p.id === id);
      if (!current) return null;
      const ts = nowIso();
      const copy: GeneratedPost = {
        ...current,
        id: uid("pst"),
        title: `${current.title} (copy)`,
        status: "draft",
        versions: [{ id: uid("ver"), content: current.content, origin: "edit", createdAt: ts }],
        createdAt: ts,
        updatedAt: ts,
      };
      setState((s) => ({ ...s, posts: [copy, ...s.posts] }));
      void repository.upsertPost(copy);
      return copy;
    };

    const removePost: WorkspaceActions["removePost"] = (id) => {
      setState((s) => ({ ...s, posts: s.posts.filter((p) => p.id !== id) }));
      void repository.deletePost(id);
    };

    const exportSnapshot: WorkspaceActions["exportSnapshot"] = () => {
      const { user, profile, voice, references, posts } = stateRef.current;
      return { user, profile, voice, references, posts };
    };

    const resetWorkspace: WorkspaceActions["resetWorkspace"] = async () => {
      await repository.clearAll();
      setState({ ...EMPTY, ready: true });
    };

    return {
      createAccount,
      saveProfile,
      saveVoice,
      addReference,
      updateReference,
      removeReference,
      createPost,
      updatePost,
      duplicatePost,
      removePost,
      exportSnapshot,
      resetWorkspace,
    };
  }, []);

  return (
    <StateCtx.Provider value={state}>
      <ActionsCtx.Provider value={actions}>{children}</ActionsCtx.Provider>
    </StateCtx.Provider>
  );
}

export function useWorkspace(): WorkspaceState {
  const ctx = useContext(StateCtx);
  if (!ctx) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return ctx;
}

export function useWorkspaceActions(): WorkspaceActions {
  const ctx = useContext(ActionsCtx);
  if (!ctx) throw new Error("useWorkspaceActions must be used inside WorkspaceProvider");
  return ctx;
}

/** Convenience: is onboarding complete? */
export function useIsOnboarded(): boolean {
  const { profile } = useWorkspace();
  return !!profile?.onboardingCompletedAt;
}

export function usePost(id: string | null): GeneratedPost | null {
  const { posts } = useWorkspace();
  return useMemo(() => (id ? posts.find((p) => p.id === id) ?? null : null), [posts, id]);
}

export function useStableCallback<T extends (...args: never[]) => unknown>(fn: T): T {
  const ref = useRef(fn);
  ref.current = fn;
  return useCallback(((...args) => ref.current(...args)) as T, []);
}
