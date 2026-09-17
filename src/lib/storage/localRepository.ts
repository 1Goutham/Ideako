import { MAX_HISTORY } from "../constants";
import type { GeneratedPost, Profile, Reference, User, Voice, WorkspaceSnapshot } from "../types";
import type { IdeakoRepository } from "./repository";

const NS = "ideako:v1";
const KEYS = {
  user: `${NS}:user`,
  profile: `${NS}:profile`,
  voice: `${NS}:voice`,
  references: `${NS}:references`,
  posts: `${NS}:posts`,
} as const;

function canUseStorage(): boolean {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

function read<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn("Ideako: could not persist", key, err);
  }
}

function remove(key: string): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** Browser-local persistence. Everything lives on this device. */
export class LocalRepository implements IdeakoRepository {
  async load(): Promise<WorkspaceSnapshot> {
    return {
      user: read<User | null>(KEYS.user, null),
      profile: read<Profile | null>(KEYS.profile, null),
      voice: read<Voice | null>(KEYS.voice, null),
      references: read<Reference[]>(KEYS.references, []),
      posts: read<GeneratedPost[]>(KEYS.posts, []),
    };
  }

  async saveUser(user: User) {
    write(KEYS.user, user);
  }
  async saveProfile(profile: Profile) {
    write(KEYS.profile, profile);
  }
  async saveVoice(voice: Voice) {
    write(KEYS.voice, voice);
  }

  async upsertReference(reference: Reference) {
    const list = read<Reference[]>(KEYS.references, []);
    const idx = list.findIndex((r) => r.id === reference.id);
    if (idx >= 0) list[idx] = reference;
    else list.unshift(reference);
    write(KEYS.references, list);
  }
  async deleteReference(id: string) {
    write(
      KEYS.references,
      read<Reference[]>(KEYS.references, []).filter((r) => r.id !== id),
    );
  }

  async upsertPost(post: GeneratedPost) {
    const list = read<GeneratedPost[]>(KEYS.posts, []);
    const idx = list.findIndex((p) => p.id === post.id);
    if (idx >= 0) list[idx] = post;
    else list.unshift(post);
    // Keep history bounded; never evict saved posts.
    const saved = list.filter((p) => p.status === "saved");
    const drafts = list.filter((p) => p.status !== "saved").slice(0, MAX_HISTORY);
    const merged = [...saved, ...drafts].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    write(KEYS.posts, merged);
  }
  async deletePost(id: string) {
    write(KEYS.posts, read<GeneratedPost[]>(KEYS.posts, []).filter((p) => p.id !== id));
  }

  async clearAll() {
    Object.values(KEYS).forEach(remove);
  }
}

export const repository: IdeakoRepository = new LocalRepository();
