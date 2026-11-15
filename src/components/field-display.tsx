import type { FieldDef } from "@/config/schema";
import { formatValue, isEmpty, type FieldValues } from "@/lib/fields";

import { Markdown } from "./markdown";

/** Read-only rendering of config-defined field values. */
export function FieldDisplay({ fields, values, showPrivate = false }: { fields: FieldDef[]; values: FieldValues; showPrivate?: boolean }) {
  const visible = fields.filter((f) => !isEmpty(values[f.key]) && (showPrivate || !f.private));
  if (visible.length === 0) return null;

  const long = visible.filter((f) => f.type === "markdown" || f.type === "textarea");
  const short = visible.filter((f) => f.type !== "markdown" && f.type !== "textarea");

  return (
    <div className="space-y-5">
      {short.length > 0 && (
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {short.map((f) => {
            const v = values[f.key];
            return (
              <div key={f.key} className="min-w-0">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {f.label}
                  {f.private && " (private)"}
                </dt>
                <dd className="mt-0.5 break-words text-sm">
                  {f.type === "url" && typeof v === "string" ? (
                    <a href={v} target="_blank" rel="noreferrer noopener nofollow" className="text-brand underline">
                      {v}
                    </a>
                  ) : (f.type === "tags" || f.type === "multiselect") && Array.isArray(v) ? (
                    <span className="flex flex-wrap gap-1">
                      {v.map((x) => (
                        <span key={String(x)} className="rounded bg-muted px-2 py-0.5 text-xs">
                          {String(x)}
                        </span>
                      ))}
                    </span>
                  ) : (
                    formatValue(f, v)
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
      )}
      {long.map((f) => (
        <section key={f.key}>
          <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{f.label}</h3>
          {f.type === "markdown" ? <Markdown content={String(values[f.key])} /> : <p className="whitespace-pre-wrap text-sm">{String(values[f.key])}</p>}
        </section>
      ))}
    </div>
  );
}
