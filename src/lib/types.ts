/**
 * Core domain model for Ideako.
 *
 * These types are intentionally storage-agnostic. Today they are persisted
 * locally (see `lib/storage`), but every entity carries an `id`, timestamps and
 * an owning `profileId` so a real database + auth layer can be introduced
 * without reshaping the UI.
 */

export type Platform = "linkedin" | "x" | "instagram";

export type CreatingFor = "myself" | "company" | "brand";

export type ToneKey =
  | "professional"
  | "friendly"
  | "bold"
  | "educational"
  | "conversational"
  | "storytelling"
  | "technical"
  | "minimal";

export type ContentTypeKey =
  | "thought-leadership"
  | "educational"
  | "personal-story"
  | "announcement"
  | "hiring"
  | "case-study"
  | "industry-insight";

export type LengthKey = "short" | "medium" | "long";

export type RefineActionKey =
  | "rewrite"
  | "shorten"
  | "expand"
  | "conversational"
  | "professional"
  | "hook"
  | "storytelling"
  | "simplify";

/** A person using Ideako. Local-only for now; maps 1:1 to an auth user later. */
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

/** Who the user is and who they create for. */
export interface Profile {
  id: string;
  userId: string;
  creatingFor: CreatingFor;
  name: string;
  companyName: string;
  role: string;
  industry: string;
  website: string;
  defaultPlatform: Platform;
  onboardingCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** A document the user has given Ideako as background knowledge. */
export interface KnowledgeDoc {
  id: string;
  name: string;
  content: string;
  source: "upload" | "paste";
  addedAt: string;
}

/** What Ideako has learned about how the user writes. */
export interface VoiceSummary {
  traits: string[];
  description: string;
  analysedAt: string;
}

/** The brand / personal voice profile. */
export interface Voice {
  id: string;
  profileId: string;
  tones: ToneKey[];
  description: string;
  brandDescription: string;
  audience: string;
  writingPreferences: string;
  avoid: string;
  knowledge: KnowledgeDoc[];
  summary: VoiceSummary | null;
  updatedAt: string;
}

/** A previous post used as a style reference. */
export interface Reference {
  id: string;
  profileId: string;
  title: string;
  content: string;
  source: "paste" | "upload" | "saved-post";
  platform: Platform;
  useByDefault: boolean;
  createdAt: string;
}

export interface CreateBrief {
  platform: Platform;
  idea: string;
  contentType: ContentTypeKey;
  /** `null` means "use my voice profile". */
  tone: ToneKey | null;
  length: LengthKey;
  /** Saved references chosen from the library. */
  referenceIds: string[];
  /** One-off references pasted directly into the composer. */
  inlineReferences: string[];
}

export interface PostVersion {
  id: string;
  content: string;
  /** What produced this version: initial generation, a refinement, or a manual edit. */
  origin: "generate" | RefineActionKey | "edit" | "regenerate";
  createdAt: string;
}

export interface HashtagSuggestion {
  tag: string;
  reason: string;
}

export interface HashtagGroups {
  recommended: HashtagSuggestion[];
  broader: HashtagSuggestion[];
  niche: HashtagSuggestion[];
}

export interface HashtagState {
  groups: HashtagGroups | null;
  selected: string[];
  generatedAt: string | null;
}

export type Rating = "strong" | "moderate" | "weak";
export type Readability = "easy" | "moderate" | "dense";

export interface PostInsight {
  hookStrength: Rating;
  tone: string;
  readability: Readability;
  suggestion: string;
  /** Hash of the content that was analysed, so the UI can tell when it's stale. */
  contentHash: string;
  analysedAt: string;
}

export type PostStatus = "draft" | "saved";

/** A post Ideako generated. Becomes a "SavedPost" when status === 'saved'. */
export interface GeneratedPost {
  id: string;
  profileId: string;
  platform: Platform;
  title: string;
  content: string;
  brief: CreateBrief;
  versions: PostVersion[];
  hashtags: HashtagState;
  insight: PostInsight | null;
  status: PostStatus;
  createdAt: string;
  updatedAt: string;
}

/** Everything a profile owns; used for export and hydration. */
export interface WorkspaceSnapshot {
  user: User | null;
  profile: Profile | null;
  voice: Voice | null;
  references: Reference[];
  posts: GeneratedPost[];
}
