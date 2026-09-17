import "server-only";
import { CONTENT_TYPES, LENGTHS, PLATFORMS, REFINE_ACTIONS, TONES } from "../constants";
import type { GenerateRequest, HashtagRequest, InsightRequest, RefineRequest, VoiceAnalysisRequest, VoiceContext } from "./contracts";

/**
 * Prompt construction lives here, on the server, so the client never has to
 * know how Ideako talks to the model. Every prompt is grounded in the same
 * "voice brief" so the product feels consistent across generate, refine,
 * hashtags and insights.
 */

const MAX_REFERENCE_CHARS = 2_500;
const MAX_REFERENCES = 5;
const MAX_KNOWLEDGE_CHARS = 6_000;

export const SYSTEM = `You are Ideako, an AI creative partner. You help people create social media content that sounds like them, not like an AI.

Principles:
- Write in the user's voice. Their references, tone and preferences define how the content should feel.
- Never copy sentences or distinctive phrases from references. Learn the style (sentence length, vocabulary, formatting habits, level of technicality, personality) and write something original.
- Be specific. Prefer concrete details, numbers and moments over generic claims.
- No filler, no clichés ("in today's fast-paced world", "game-changer", "unlock"), no motivational fluff.
- Do not use markdown syntax (no **bold**, no # headings, no bullet asterisks). Social platforms render plain text. Use line breaks and, sparingly, simple characters like "—" or "→" if the user's references do.
- Never invent facts about the user, their company or their results. If a detail is unknown, keep it general or leave a clearly marked placeholder like [number].
- Do not add hashtags unless explicitly asked.
- Return only what is asked for, in the requested format, with no preamble or explanation.`;

function clip(text: string, max: number): string {
  const t = text.trim();
  return t.length > max ? `${t.slice(0, max)}\n[…trimmed]` : t;
}

function toneLabel(key: string): string {
  return TONES.find((t) => t.key === key)?.label ?? key;
}

export function voiceBrief(ctx: VoiceContext): string {
  const { profile, voice } = ctx;
  const who =
    profile.creatingFor === "myself"
      ? `${profile.name}${profile.role ? `, ${profile.role}` : ""}${profile.companyName ? ` at ${profile.companyName}` : ""}`
      : `${profile.companyName || profile.name} (posting as ${profile.creatingFor === "company" ? "the company" : "the brand/team"}; managed by ${profile.name}${profile.role ? `, ${profile.role}` : ""})`;

  const lines: string[] = [];
  lines.push(`WRITING AS: ${who}`);
  if (profile.industry) lines.push(`INDUSTRY: ${profile.industry}`);
  if (profile.website) lines.push(`WEBSITE: ${profile.website}`);
  if (voice.tones.length) lines.push(`PREFERRED FEEL: ${voice.tones.map(toneLabel).join(", ")}`);
  if (voice.summaryTraits.length) lines.push(`OBSERVED STYLE TRAITS: ${voice.summaryTraits.join(", ")}`);
  if (voice.description) lines.push(`HOW THEY DESCRIBE THEIR TONE: ${voice.description}`);
  if (voice.brandDescription) lines.push(`ABOUT THEM / THE BRAND: ${voice.brandDescription}`);
  if (voice.audience) lines.push(`AUDIENCE: ${voice.audience}`);
  if (voice.writingPreferences) lines.push(`WRITING PREFERENCES: ${voice.writingPreferences}`);
  if (voice.avoid) lines.push(`THINGS TO AVOID: ${voice.avoid}`);

  if (voice.knowledge.length) {
    let budget = MAX_KNOWLEDGE_CHARS;
    const docs: string[] = [];
    for (const doc of voice.knowledge) {
      if (budget <= 0) break;
      const body = clip(doc.content, Math.min(budget, 3_000));
      budget -= body.length;
      docs.push(`--- ${doc.name} ---\n${body}`);
    }
    lines.push(`BACKGROUND KNOWLEDGE (use for facts and context; do not quote verbatim):\n${docs.join("\n\n")}`);
  }
  return lines.join("\n");
}

function referencesBlock(refs: { title: string; content: string }[]): string {
  const usable = refs.filter((r) => r.content.trim()).slice(0, MAX_REFERENCES);
  if (!usable.length) return "";
  const body = usable
    .map((r, i) => `Reference ${String(i + 1).padStart(2, "0")}${r.title ? ` (${r.title})` : ""}:\n"""\n${clip(r.content, MAX_REFERENCE_CHARS)}\n"""`)
    .join("\n\n");
  return `STYLE REFERENCES (previous posts by the user; study the style, never reuse the wording):\n${body}`;
}

function platformGuidance(platform: keyof typeof PLATFORMS): string {
  switch (platform) {
    case "linkedin":
      return `PLATFORM: LinkedIn.
- The first two lines are the hook; LinkedIn truncates after roughly 210 characters with "…see more". Make the opening specific and worth expanding.
- Short paragraphs (1–3 lines) separated by blank lines. No walls of text.
- End with a soft close: a takeaway, a question, or a simple invitation. No aggressive CTAs.
- Plain text only. No emojis unless the references clearly use them.`;
    case "x":
      return `PLATFORM: X. Keep it under 280 characters, punchy, one idea.`;
    case "instagram":
      return `PLATFORM: Instagram caption. Warm, visual, short paragraphs, ends with a light prompt.`;
  }
}

export function generatePrompt(req: GenerateRequest): string {
  const { brief } = req;
  const type = CONTENT_TYPES.find((c) => c.key === brief.contentType);
  const length = LENGTHS.find((l) => l.key === brief.length);
  const tone = brief.tone
    ? `TONE FOR THIS POST: ${toneLabel(brief.tone)} (${TONES.find((t) => t.key === brief.tone)?.hint ?? ""})`
    : `TONE FOR THIS POST: use the user's own voice as described in the voice brief.`;

  return [
    voiceBrief(req.context),
    "",
    referencesBlock(brief.references),
    "",
    platformGuidance(brief.platform),
    "",
    `CONTENT TYPE: ${type?.label ?? brief.contentType}. ${type?.guidance ?? ""}`,
    tone,
    `LENGTH: ${length?.guidance ?? ""}`,
    "",
    `WHAT THE USER WANTS TO TALK ABOUT:\n"""\n${brief.idea.trim()}\n"""`,
    "",
    `Write one original post. Return JSON with exactly this shape:
{"title": "<a 3–7 word label describing the post, for the user's history>", "post": "<the full post text, with real line breaks>"}`,
  ]
    .filter((l) => l !== "")
    .join("\n");
}

export function refinePrompt(req: RefineRequest): string {
  const action = REFINE_ACTIONS.find((a) => a.key === req.action);
  return [
    voiceBrief(req.context),
    "",
    platformGuidance(req.platform),
    "",
    req.idea ? `ORIGINAL IDEA BEHIND THE POST:\n"""\n${req.idea.trim()}\n"""\n` : "",
    `CURRENT POST:\n"""\n${req.post.trim()}\n"""`,
    "",
    `INSTRUCTION: ${action?.instruction ?? "Improve the post while keeping its meaning."}`,
    `Keep everything that already works. Stay in the user's voice. Do not add hashtags.`,
    "",
    `Return JSON with exactly this shape: {"post": "<the revised post text, with real line breaks>"}`,
  ]
    .filter((l) => l !== "")
    .join("\n");
}

export function hashtagPrompt(req: HashtagRequest): string {
  return [
    voiceBrief(req.context),
    "",
    `POST:\n"""\n${req.post.trim()}\n"""`,
    "",
    `Recommend hashtags for this ${PLATFORMS[req.platform].label} post. Analyse its topic, the user's industry, the likely audience and the intent of the post.

Return three groups:
- "recommended": 5–6 hashtags with the best balance of relevance and reach for this exact post.
- "broader": 4–5 larger, more general hashtags that widen distribution while staying on-topic.
- "niche": 4–5 specific, community-level hashtags that reach people who care deeply about this subject.

Rules: CamelCase multi-word tags (e.g. ProductDesign), no "#" prefix, no spaces, no duplicates across groups, no generic spam tags (#follow, #viral). Each item includes a short "reason" (max 8 words) explaining why it fits.

Return JSON with exactly this shape:
{"recommended":[{"tag":"","reason":""}],"broader":[{"tag":"","reason":""}],"niche":[{"tag":"","reason":""}]}`,
  ].join("\n");
}

export function insightPrompt(req: InsightRequest): string {
  return [
    voiceBrief(req.context),
    "",
    `POST:\n"""\n${req.post.trim()}\n"""`,
    "",
    `Give a short, honest editorial read of this ${PLATFORMS[req.platform].label} post as Ideako. Judge it against the user's intended voice, not a generic standard.

Return JSON with exactly this shape:
{
  "hookStrength": "strong" | "moderate" | "weak",
  "tone": "<one or two words describing how the post actually reads, e.g. Conversational, Measured, Bold>",
  "readability": "easy" | "moderate" | "dense",
  "suggestion": "<one specific, actionable sentence about the single most valuable improvement. Refer to the actual text.>"
}`,
  ].join("\n");
}

export function voiceAnalysisPrompt(req: VoiceAnalysisRequest): string {
  return [
    voiceBrief(req.context),
    "",
    referencesBlock(req.references),
    "",
    `Based on the references and what the user told you, describe how this person or brand writes.

Return JSON with exactly this shape:
{
  "traits": ["<4 to 6 single-word or two-word style traits, e.g. Conversational, Thoughtful, Technical, Clear>"],
  "description": "<two sentences, written to the user, describing their style: sentence structure, vocabulary, formatting habits, how they open and close, and what makes them recognisable. Be specific; avoid flattery.>"
}`,
  ].join("\n");
}
