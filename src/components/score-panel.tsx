import { Sparkles } from "lucide-react";

import { config } from "@/config";
import type { CriterionScore } from "@/lib/db/schema";

import { Badge, Card } from "./ui";

export function ScoreBadge({ overall }: { overall: number | null | undefined }) {
  if (overall === null || overall === undefined) return null;
  const tone = overall >= 75 ? "success" : overall >= 50 ? "info" : overall >= 30 ? "warning" : "danger";
  return (
    <Badge tone={tone}>
      <Sparkles className="mr-1 h-3 w-3" /> {overall}/100
    </Badge>
  );
}

type Props = {
  aiStatus: string;
  overall: number | null;
  scores: Record<string, CriterionScore> | null;
  gatePassed: boolean | null;
  gateReason: string | null;
  summary: string | null;
  flags: string[] | null;
  model: string | null;
  error?: string | null;
  showError?: boolean;
};

export function ScorePanel(p: Props) {
  const ev = config.evaluation;
  if (!ev.enabled) return null;

  if (p.aiStatus !== "done") {
    const label =
      p.aiStatus === "failed" ? "Evaluation failed. It will be retried automatically." : p.aiStatus === "running" ? "Evaluating…" : "Awaiting AI evaluation.";
    return (
      <Card className="text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" /> {label}
        </div>
        {p.showError && p.error && <p className="mt-2 font-mono text-xs text-danger">{p.error}</p>}
      </Card>
    );
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-semibold">
          <Sparkles className="h-4 w-4 text-brand" /> {ev.summary.label}
        </h2>
        <div className="text-right">
          <div className="text-2xl font-bold tabular-nums">{p.overall ?? 0}</div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">overall / 100</div>
        </div>
      </div>

      {ev.gate && p.gatePassed === false && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm">
          <strong>{ev.gate.label}: not passed.</strong> {p.gateReason}
        </div>
      )}

      {p.summary && <p className="text-sm leading-relaxed">{p.summary}</p>}

      <ul className="space-y-3">
        {ev.criteria.map((c) => {
          const s = p.scores?.[c.key];
          if (!s) return null;
          const pct = ((s.score - c.min) / (c.max - c.min)) * 100;
          return (
            <li key={c.key}>
              <div className="flex justify-between text-sm">
                <span className="font-medium">{c.label}</span>
                <span className="tabular-nums text-muted-foreground">
                  {s.score} / {c.max}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted" role="meter" aria-valuemin={c.min} aria-valuemax={c.max} aria-valuenow={s.score} aria-label={c.label}>
                <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
              </div>
              {s.rationale && <p className="mt-1 text-xs text-muted-foreground">{s.rationale}</p>}
            </li>
          );
        })}
      </ul>

      {p.flags && p.flags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {p.flags.map((f) => (
            <Badge key={f} tone="warning">
              {f.replace(/_/g, " ")}
            </Badge>
          ))}
        </div>
      )}

      <p className="border-t border-border pt-2 text-[11px] text-muted-foreground">
        {ev.disclaimer}
        {p.model && ` (${p.model})`}
      </p>
    </Card>
  );
}
