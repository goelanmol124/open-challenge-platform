"use client";

import { useActionState } from "react";

import { FieldInput } from "@/components/field-input";
import { FormMessage, SubmitButton } from "@/components/form-bits";
import { Input, Label, Textarea } from "@/components/ui";
import type { FieldDef } from "@/config/schema";

import { updateProfile } from "./actions";

type Initial = { name: string; organization: string | null; bio: string | null; profile: Record<string, unknown> };

export function ProfileForm({ fields, initial }: { fields: FieldDef[]; initial: Initial }) {
  const [state, action] = useActionState(updateProfile, undefined);
  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />
      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={initial.name} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="organization">Organisation</Label>
        <Input id="organization" name="organization" defaultValue={initial.organization ?? ""} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" name="bio" defaultValue={initial.bio ?? ""} rows={3} />
      </div>
      {fields.map((f) => (
        <FieldInput key={f.key} field={f} value={initial.profile[f.key]} error={state?.errors?.[f.key]} />
      ))}
      <SubmitButton>Save</SubmitButton>
    </form>
  );
}
