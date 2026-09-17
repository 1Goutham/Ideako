import { NextResponse } from "next/server";
import { complete, engineStatus } from "@/lib/ai/engine";
import { checkRateLimit, clientKey } from "@/lib/ai/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/engine          → which AI engines are configured and their models
 * GET /api/engine?probe=1  → also run a tiny completion to prove the chain works
 * Never returns keys.
 */
export async function GET(req: Request) {
  const limit = checkRateLimit(clientKey(req));
  if (!limit.allowed) return NextResponse.json({ ok: false, error: "Too many checks. Try again shortly." }, { status: 429 });

  const status = await engineStatus();
  const probe = new URL(req.url).searchParams.get("probe") === "1";
  if (!probe) return NextResponse.json({ ok: true, ...status });

  const started = Date.now();
  const { result, provider, model } = await complete({
    system: "You are a connectivity check. Reply with the single word OK.",
    prompt: "Reply with OK.",
    temperature: 0,
    maxOutputTokens: 8,
  });
  return NextResponse.json({
    ok: true,
    ...status,
    probe: result.ok
      ? { ok: true, provider, model, ms: Date.now() - started }
      : { ok: false, provider, model, ms: Date.now() - started, error: result.error.message },
  });
}
