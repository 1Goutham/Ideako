import type { HashtagRequest, HashtagResult } from "@/lib/ai/contracts";
import { callGeminiJson } from "@/lib/ai/gemini";
import { hashtagPrompt, SYSTEM } from "@/lib/ai/prompts";
import { isObj, parseContext, parsePlatform, str, withAiRoute } from "@/lib/ai/route";

export const runtime = "nodejs";

function cleanTag(raw: string): string {
  return raw.replace(/^#+/, "").replace(/[^A-Za-z0-9_]/g, "").slice(0, 40);
}

function parseGroup(v: unknown, seen: Set<string>) {
  if (!Array.isArray(v)) return [];
  const out: { tag: string; reason: string }[] = [];
  for (const item of v) {
    if (!isObj(item)) continue;
    const tag = cleanTag(str(item.tag, 60));
    if (!tag || seen.has(tag.toLowerCase())) continue;
    seen.add(tag.toLowerCase());
    out.push({ tag, reason: str(item.reason, 120).trim() });
  }
  return out.slice(0, 8);
}

export async function POST(req: Request) {
  return withAiRoute<HashtagRequest, HashtagResult>(
    req,
    (body) => {
      if (!isObj(body)) return "Invalid request.";
      const context = parseContext(body.context);
      if (!context) return "Missing voice context.";
      const post = str(body.post, 12_000).trim();
      if (!post) return "Generate a post first, then Ideako can suggest hashtags for it.";
      return { context, post, platform: parsePlatform(body.platform) };
    },
    (data) =>
      callGeminiJson<HashtagResult>(
        { system: SYSTEM, prompt: hashtagPrompt(data), temperature: 0.5, maxOutputTokens: 1024 },
        (v) => {
          if (!isObj(v)) return null;
          const seen = new Set<string>();
          const groups = {
            recommended: parseGroup(v.recommended, seen),
            broader: parseGroup(v.broader, seen),
            niche: parseGroup(v.niche, seen),
          };
          return groups.recommended.length ? groups : null;
        },
      ),
  );
}
