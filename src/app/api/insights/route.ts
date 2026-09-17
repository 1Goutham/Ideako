import type { InsightRequest, InsightResult } from "@/lib/ai/contracts";
import { completeJson } from "@/lib/ai/engine";
import { insightPrompt, SYSTEM } from "@/lib/ai/prompts";
import { isObj, parseContext, parsePlatform, str, withAiRoute } from "@/lib/ai/route";

export const runtime = "nodejs";

const RATINGS = ["strong", "moderate", "weak"] as const;
const READ = ["easy", "moderate", "dense"] as const;

export async function POST(req: Request) {
  return withAiRoute<InsightRequest, InsightResult>(
    req,
    (body) => {
      if (!isObj(body)) return "Invalid request.";
      const context = parseContext(body.context);
      if (!context) return "Missing voice context.";
      const post = str(body.post, 12_000).trim();
      if (!post) return "Nothing to analyse yet.";
      return { context, post, platform: parsePlatform(body.platform) };
    },
    (data) =>
      completeJson<InsightResult>(
        { system: SYSTEM, prompt: insightPrompt(data), temperature: 0.3, maxOutputTokens: 512 },
        (v) => {
          if (!isObj(v)) return null;
          const hook = str(v.hookStrength).toLowerCase() as InsightResult["hookStrength"];
          const readability = str(v.readability).toLowerCase() as InsightResult["readability"];
          if (!RATINGS.includes(hook) || !READ.includes(readability)) return null;
          const tone = str(v.tone, 40).trim();
          const suggestion = str(v.suggestion, 400).trim();
          if (!tone || !suggestion) return null;
          return { hookStrength: hook, readability, tone, suggestion };
        },
      ),
  );
}
