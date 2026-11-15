import type { Metadata } from "next";

import { Card, PageHeader } from "@/components/ui";
import { config, t } from "@/config";

export const metadata: Metadata = { title: "How it works" };

/** Generated entirely from the config, so it stays accurate as you customise. */
export default function AboutPage() {
  const ev = config.evaluation;
  const totalWeight = ev.criteria.reduce((a, c) => a + c.weight, 0);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader title="How it works" subtitle={config.branding.description} />

      <Card className="space-y-3 text-sm">
        <h2 className="text-base font-semibold">Who&apos;s who</h2>
        <p>
          <strong>{config.roles.owner.plural}</strong> — {config.roles.owner.description}
        </p>
        <p>
          <strong>{config.roles.solver.plural}</strong> — {config.roles.solver.description}
        </p>
      </Card>

      <Card className="space-y-3 text-sm">
        <h2 className="text-base font-semibold">The life of a {t.challenge.singular.toLowerCase()}</h2>
        <ol className="space-y-2">
          {config.challenge.stages
            .filter((s) => s.public)
            .map((s) => (
              <li key={s.key}>
                <strong>{s.label}</strong>
                {s.acceptsSubmissions && ` — accepting ${t.submission.plural.toLowerCase()}`}
                {s.description && ` — ${s.description}`}
              </li>
            ))}
        </ol>
      </Card>

      {ev.enabled && (
        <Card className="space-y-3 text-sm">
          <h2 className="text-base font-semibold">How {t.submission.plural.toLowerCase()} are evaluated</h2>
          <p>Every {t.submission.singular.toLowerCase()} gets an automated first-pass review. The overall score (0-100) is a weighted average of:</p>
          {ev.gate && (
            <p className="rounded-md bg-muted p-3">
              <strong>{ev.gate.label}:</strong> {ev.gate.question} A {t.submission.singular.toLowerCase()} that fails this check scores 0.
            </p>
          )}
          <table className="w-full text-left">
            <thead className="text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-1">Criterion</th>
                <th className="py-1">Scale</th>
                <th className="py-1 text-right">Weight</th>
              </tr>
            </thead>
            <tbody>
              {ev.criteria.map((c) => (
                <tr key={c.key} className="border-t border-border align-top">
                  <td className="py-2 pr-4">
                    <strong>{c.label}</strong>
                    <div className="text-muted-foreground">{c.description}</div>
                  </td>
                  <td className="py-2 pr-4 tabular-nums">
                    {c.min}-{c.max}
                  </td>
                  <td className="py-2 text-right tabular-nums">{Math.round((c.weight / totalWeight) * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-muted-foreground">{ev.disclaimer}</p>
        </Card>
      )}

      {config.features.endorsements && (
        <Card className="text-sm">
          <h2 className="mb-2 text-base font-semibold">{t.endorsement.noun}</h2>
          <p>
            {config.permissions.endorse === "challenge-owner"
              ? `The ${config.roles.owner.label.toLowerCase()} who posted a ${t.challenge.singular.toLowerCase()}`
              : `Any ${config.roles.owner.label.toLowerCase()}`}{" "}
            can {t.endorsement.verb.toLowerCase()} a {t.submission.singular.toLowerCase()}, signalling they want to take it forward.
          </p>
        </Card>
      )}
    </div>
  );
}
