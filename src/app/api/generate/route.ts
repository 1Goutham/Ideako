import { CONTENT_TYPES, LENGTHS, TONES } from "@/lib/constants";
import type { GenerateRequest, GenerateResult } from "@/lib/ai/contracts";
import { callGeminiJson } from "@/lib/ai/gemini";
import { generatePrompt, SYSTEM } from "@/lib/ai/prompts";
import { isObj, parseContext, parsePlatform, parseReferences, str, strArr, withAiRoute } from "@/lib/ai/route";

export const runtime = "nodejs";

export async function POST(req: Request) {
  return withAiRoute<GenerateRequest, GenerateResult>(
    req,
    (body) => {
      if (!isObj(body)) return "Invalid request.";
      const context = parseContext(body.context);
      if (!context) return "Missing voice context.";
      if (!isObj(body.brief)) return "Missing brief.";
      const b = body.brief;
      const idea = str(b.idea, 4_000).trim();
      if (!idea) return "Tell Ideako what you want to talk about.";
      const contentType = CONTENT_TYPES.some((c) => c.key === b.contentType)
        ? (b.contentType as GenerateRequest["brief"]["contentType"])
        : "thought-leadership";
      const tone = TONES.some((t) => t.key === b.tone) ? (b.tone as GenerateRequest["brief"]["tone"]) : null;
      const length = LENGTHS.some((l) => l.key === b.length) ? (b.length as GenerateRequest["brief"]["length"]) : "medium";
      return {
        context,
        brief: {
          platform: parsePlatform(b.platform),
          idea,
          contentType,
          tone,
          length,
          inlineReferences: strArr(b.inlineReferences, 5),
          references: parseReferences(b.references),
        },
      };
    },
    (data) =>
      callGeminiJson<GenerateResult>(
        { system: SYSTEM, prompt: generatePrompt(data), temperature: 0.85, maxOutputTokens: 2048 },
        (v) => {
          if (!isObj(v)) return null;
          const post = str(v.post).trim();
          if (!post) return null;
          return { title: str(v.title, 120).trim() || post.split("\n")[0].slice(0, 60), post };
        },
      ),
  );
}
