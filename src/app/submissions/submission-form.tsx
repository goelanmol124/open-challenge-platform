"use client";

import { useActionState } from "react";

import { FieldInput } from "@/components/field-input";
import { FormMessage, SubmitButton, type FormState } from "@/components/form-bits";
import { Input, Label, Textarea } from "@/components/ui";
import { config } from "@/config";

export function SubmissionForm({
  action,
  initial = {},
  submitLabel,
}: {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  initial?: { title?: string; summary?: string; fields?: Record<string, unknown> };
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const err = (k: string) => state?.errors?.[k];
  const sub = config.submission;

  return (
    <form action={formAction} className="space-y-5">
      <FormMessage state={state} />
      <div className="space-y-1.5">
        <Label htmlFor="title">Title *</Label>
        <Input id="title" name="title" defaultValue={initial.title} required maxLength={255} />
        {err("title") && <p className="text-xs text-danger">{err("title")}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="summary">{sub.summaryLabel} *</Label>
        <Textarea id="summary" name="summary" defaultValue={initial.summary} rows={5} required minLength={sub.summaryMinLength} />
        {sub.summaryHelp && <p className="text-xs text-muted-foreground">{sub.summaryHelp}</p>}
        {err("summary") && <p className="text-xs text-danger">{err("summary")}</p>}
      </div>
      {sub.fields.map((f) => (
        <FieldInput key={f.key} field={f} value={initial.fields?.[f.key]} error={err(f.key)} />
      ))}
      {config.evaluation.enabled && (
        <p className="text-xs text-muted-foreground">
          After you submit, an AI reviewer scores it against: {config.evaluation.criteria.map((c) => c.label).join(", ")}.
        </p>
      )}
      <SubmitButton pendingText="Submitting…">{submitLabel}</SubmitButton>
    </form>
  );
}
