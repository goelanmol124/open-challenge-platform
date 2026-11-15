"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "./ui";

export type FormState = { error?: string; errors?: Record<string, string>; ok?: string } | undefined;

export function SubmitButton({ children, pendingText, variant, size }: { children: ReactNode; pendingText?: string; variant?: "primary" | "outline" | "ghost" | "danger"; size?: "sm" | "md" | "lg" }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} variant={variant} size={size}>
      {pending ? (pendingText ?? "Saving…") : children}
    </Button>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  if (!state) return null;
  if (state.error) return <p role="alert" className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-danger">{state.error}</p>;
  if (state.ok) return <p role="status" className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm">{state.ok}</p>;
  return null;
}
