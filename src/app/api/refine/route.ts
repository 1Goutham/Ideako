import { REFINE_ACTIONS } from "@/lib/constants";
import type { RefineRequest, RefineResult } from "@/lib/ai/contracts";
import { completeJson } from "@/lib/ai/engine";
import { refinePrompt, SYSTEM } from "@/lib/ai/prompts";
import { isObj, parseContext, parsePlatform, str, withAiRoute } from "@/lib/ai/route";

export const runtime = "nodejs";

export async function POST(req: Request) {
  return withAiRoute<RefineRequest, RefineResult>(
    req,
    (body) => {
      if (!isObj(body)) return "Invalid request.";
      const context = parseContext(body.context);
      if (!context) return "Missing voice context.";
      const post = str(body.post, 12_000).trim();
      if (!post) return "There's no post to refine yet.";
      if (!REFINE_ACTIONS.some((a) => a.key === body.action)) return "Unknown refinement.";
      return {
        context,
        post,
        action: body.action as RefineRequest["action"],
        platform: parsePlatform(body.platform),
        idea: str(body.idea, 4_000) || undefined,
      };
    },
    (data) =>
      completeJson<RefineResult>(
        { system: SYSTEM, prompt: refinePrompt(data), temperature: 0.75, maxOutputTokens: 2048 },
        (v) => {
          if (!isObj(v)) return null;
          const post = str(v.post).trim();
          return post ? { post } : null;
        },
      ),
  );
}
