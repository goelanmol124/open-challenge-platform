"use client";

import { useActionState } from "react";

import { FieldInput } from "@/components/field-input";
import { FormMessage, SubmitButton, type FormState } from "@/components/form-bits";
import { Input, Label, Select, Textarea } from "@/components/ui";
import { config } from "@/config";

type Initial = {
  title?: string;
  summary?: string;
  description?: string;
  category?: string | null;
  stage?: string;
  reward?: string | null;
  deadline?: string;
  fields?: Record<string, unknown>;
};

export function ChallengeForm({
  action,
  initial = {},
  submitLabel,
}: {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  initial?: Initial;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const err = (k: string) => state?.errors?.[k];
  const t = config.terminology;

  return (
    <form action={formAction} className="space-y-5">
      <FormMessage state={state} />

      <div className="space-y-1.5">
        <Label htmlFor="title">Title *</Label>
        <Input id="title" name="title" defaultValue={initial.title} required maxLength={255} />
        {err("title") && <p className="text-xs text-danger">{err("title")}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="summary">One-line summary *</Label>
        <Input id="summary" name="summary" defaultValue={initial.summary} required maxLength={500} />
        {err("summary") && <p className="text-xs text-danger">{err("summary")}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description *</Label>
        <Textarea id="description" name="description" defaultValue={initial.description} rows={10} required />
        <p className="text-xs text-muted-foreground">Markdown supported. Context, what a good {t.submission.singular.toLowerCase()} looks like, constraints.</p>
        {err("description") && <p className="text-xs text-danger">{err("description")}</p>}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="category">{t.category.singular} *</Label>
          <Select id="category" name="category" defaultValue={initial.category ?? ""} required>
            <option value="">Select…</option>
            {config.categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
          {err("category") && <p className="text-xs text-danger">{err("category")}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="stage">Stage</Label>
          <Select id="stage" name="stage" defaultValue={initial.stage ?? config.challenge.defaultStage}>
            {config.challenge.stages.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </Select>
        </div>
        {config.challenge.showReward && (
          <div className="space-y-1.5">
            <Label htmlFor="reward">{t.reward}</Label>
            <Input id="reward" name="reward" defaultValue={initial.reward ?? ""} maxLength={255} />
          </div>
        )}
        {config.challenge.showDeadline && (
          <div className="space-y-1.5">
            <Label htmlFor="deadline">{t.deadline}</Label>
            <Input id="deadline" name="deadline" type="date" defaultValue={initial.deadline ?? ""} />
          </div>
        )}
      </div>

      {config.challenge.fields.map((f) => (
        <FieldInput key={f.key} field={f} value={initial.fields?.[f.key]} error={err(f.key)} />
      ))}

      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
