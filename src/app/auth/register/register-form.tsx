"use client";

import { useActionState } from "react";

import { FormMessage, SubmitButton } from "@/components/form-bits";
import { Input, Label } from "@/components/ui";

import { register } from "../actions";

export type RoleOption = { value: string; label: string; description: string };

export function RegisterForm({ roles, orgLabel }: { roles: RoleOption[]; orgLabel: string }) {
  const [state, action] = useActionState(register, undefined);
  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />
      {roles.length > 1 ? (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">I want to join as</legend>
          {roles.map((r, i) => (
            <label key={r.value} className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 has-[:checked]:border-brand">
              <input type="radio" name="role" value={r.value} defaultChecked={i === 0} className="mt-1" />
              <span>
                <span className="block text-sm font-medium">{r.label}</span>
                {r.description && <span className="block text-xs text-muted-foreground">{r.description}</span>}
              </span>
            </label>
          ))}
        </fieldset>
      ) : (
        <input type="hidden" name="role" value={roles[0]?.value} />
      )}
      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" autoComplete="name" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="organization">{orgLabel} (optional)</Label>
        <Input id="organization" name="organization" autoComplete="organization" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      <SubmitButton pendingText="Creating account…">Create account</SubmitButton>
    </form>
  );
}
