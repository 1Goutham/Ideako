import type { GeneratedPost, Profile, Reference, User, Voice, WorkspaceSnapshot } from "../types";

/**
 * Persistence boundary for Ideako.
 *
 * The UI only ever talks to this interface. `LocalRepository` implements it on
 * top of localStorage; a future `RemoteRepository` can implement it on top of a
 * database + auth session without touching components.
 */
export interface IdeakoRepository {
  load(): Promise<WorkspaceSnapshot>;

  saveUser(user: User): Promise<void>;
  saveProfile(profile: Profile): Promise<void>;
  saveVoice(voice: Voice): Promise<void>;

  upsertReference(reference: Reference): Promise<void>;
  deleteReference(id: string): Promise<void>;

  upsertPost(post: GeneratedPost): Promise<void>;
  deletePost(id: string): Promise<void>;

  clearAll(): Promise<void>;
}
