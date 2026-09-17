import type { VoiceAnalysisRequest, VoiceAnalysisResult } from "@/lib/ai/contracts";
import { completeJson } from "@/lib/ai/engine";
import { SYSTEM, voiceAnalysisPrompt } from "@/lib/ai/prompts";
import { isObj, parseContext, parseReferences, str, strArr, withAiRoute } from "@/lib/ai/route";

export const runtime = "nodejs";

export async function POST(req: Request) {
  return withAiRoute<VoiceAnalysisRequest, VoiceAnalysisResult>(
    req,
    (body) => {
      if (!isObj(body)) return "Invalid request.";
      const context = parseContext(body.context);
      if (!context) return "Missing voice context.";
      const references = parseReferences(body.references);
      const hasSignal =
        references.length > 0 ||
        context.voice.description.trim() ||
        context.voice.brandDescription.trim() ||
        context.voice.knowledge.length > 0;
      if (!hasSignal) return "Add a reference or describe your tone so Ideako has something to learn from.";
      return { context, references };
    },
    (data) =>
      completeJson<VoiceAnalysisResult>(
        { system: SYSTEM, prompt: voiceAnalysisPrompt(data), temperature: 0.4, maxOutputTokens: 512 },
        (v) => {
          if (!isObj(v)) return null;
          const traits = strArr(v.traits, 6).map((t) => str(t, 24).trim()).filter(Boolean);
          const description = str(v.description, 600).trim();
          if (!traits.length || !description) return null;
          return { traits, description };
        },
      ),
  );
}
