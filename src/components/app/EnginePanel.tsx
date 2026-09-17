"use client";

import { useCallback, useEffect, useState } from "react";
import { cx } from "@/lib/utils";
import { Button, TextAction, ThinkingDots } from "@/components/ui";

interface ProviderStatus {
  id: string;
  label: string;
  signupUrl: string;
  configured: boolean;
  model: string | null;
  note?: string;
}
interface EngineResponse {
  ok: boolean;
  providers: ProviderStatus[];
  active: string[];
  routing?: { write: string | null; analyse: string | null };
  probe?: { ok: boolean; provider?: string; model?: string; ms: number; error?: string };
}

/**
 * Shows which AI engines power this deployment, in fallback order, and lets
 * the user prove the chain works. Keys never reach the browser.
 */
export function EnginePanel() {
  const [data, setData] = useState<EngineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [probing, setProbing] = useState(false);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async (probe = false) => {
    if (probe) setProbing(true);
    else setLoading(true);
    setFailed(false);
    try {
      const res = await fetch(`/api/engine${probe ? "?probe=1" : ""}`, { cache: "no-store" });
      const json = (await res.json()) as EngineResponse;
      setData(json);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
      setProbing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const active = data?.active ?? [];
  const byId = (id: string | null | undefined) => data?.providers.find((p) => p.id === id);
  const writer = byId(data?.routing?.write ?? active[0]);
  const analyser = byId(data?.routing?.analyse ?? active[0]);
  const split = !!writer && !!analyser && writer.id !== analyser.id;

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-3">
        <p className="text-[15px] text-ink">
          {loading ? (
            "Checking…"
          ) : failed ? (
            "Couldn't reach the server."
          ) : active.length === 0 ? (
            "No engine connected."
          ) : (
            <>
              Writing on <span className="font-medium">{writer?.label}</span>
              {writer?.model && <span className="mono ml-2 text-[11.5px] text-ink-3">{writer.model}</span>}
              {split && (
                <>
                  <span className="text-ink-3"> · analysis on </span>
                  <span className="font-medium">{analyser?.label}</span>
                  {analyser?.model && <span className="mono ml-2 text-[11.5px] text-ink-3">{analyser.model}</span>}
                </>
              )}
              {!split && active.length > 1 && <span className="text-ink-3"> · {active.length - 1} fallback{active.length > 2 ? "s" : ""}</span>}
            </>
          )}
        </p>
        <div className="flex items-center gap-4">
          <TextAction onClick={() => load(false)} disabled={loading || probing}>Refresh</TextAction>
          <Button size="sm" onClick={() => load(true)} disabled={loading || probing || active.length === 0}>
            {probing ? (
              <>
                Testing <ThinkingDots className="text-ink-3" />
              </>
            ) : (
              "Test connection"
            )}
          </Button>
        </div>
      </div>

      {data?.probe && (
        <p className={cx("mono mt-3 text-[11.5px]", data.probe.ok ? "text-success" : "text-danger")}>
          {data.probe.ok
            ? `OK · ${data.probe.provider} · ${data.probe.model} · ${data.probe.ms} ms`
            : `Failed · ${data.probe.error}`}
        </p>
      )}

      <ul className="mt-2">
        {(data?.providers ?? []).map((p, i) => {
          const order = active.indexOf(p.id);
          return (
            <li key={p.id} className="flex items-start justify-between gap-4 border-b border-line py-3">
              <div className="flex min-w-0 items-baseline gap-4">
                <span className="label w-6 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-[14px] text-ink">
                    {p.configured && <span className={cx("size-1.5 rounded-full", order === 0 ? "bg-accent" : "bg-ink-4")} aria-hidden="true" />}
                    {p.label}
                    {p.configured && (
                      <span className="mono text-[10.5px] uppercase tracking-wider text-ink-3">
                        {[p.id === writer?.id && "writing", p.id === analyser?.id && "analysis"].filter(Boolean).join(" · ") || `fallback ${order}`}
                      </span>
                    )}
                  </p>
                  {p.note && <p className="mt-0.5 text-[12.5px] text-ink-3">{p.note}</p>}
                </div>
              </div>
              <div className="shrink-0 text-right">
                {p.configured ? (
                  <p className="mono text-[11.5px] text-ink-3">{p.model ?? "model: auto"}</p>
                ) : p.signupUrl ? (
                  <a href={p.signupUrl} target="_blank" rel="noreferrer" className="link-underline text-[12.5px] text-ink-3 hover:text-ink">
                    Get a free key ↗
                  </a>
                ) : (
                  <p className="mono text-[11.5px] text-ink-4">not set</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-[12.5px] leading-relaxed text-ink-4">
        Keys live in the server environment (Vercel → Settings → Environment Variables). With two engines, Ideako writes posts on the
        strongest one and runs hashtags and insights on the fastest, and each covers for the other when rate-limited.
      </p>
    </div>
  );
}
