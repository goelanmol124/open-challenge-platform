/**
 * Config-driven form fields: build a zod validator from FieldDef[], read
 * values out of FormData, and format values for display / AI prompts.
 */
import { z } from "zod";

import type { FieldDef } from "@/config/schema";

export type FieldValue = string | number | boolean | string[] | null;
export type FieldValues = Record<string, FieldValue>;

function validatorFor(f: FieldDef): z.ZodTypeAny {
  const label = f.label;
  switch (f.type) {
    case "number": {
      let n = z.number({ invalid_type_error: `${label} must be a number` });
      if (f.min !== undefined) n = n.min(f.min, `${label} must be at least ${f.min}`);
      if (f.max !== undefined) n = n.max(f.max, `${label} must be at most ${f.max}`);
      return f.required ? n : n.nullable();
    }
    case "boolean":
      return z.boolean();
    case "multiselect":
    case "tags": {
      const item: z.ZodTypeAny = f.type === "multiselect" && f.options ? z.enum(f.options as [string, ...string[]]) : z.string().max(100);
      let a = z.array(item);
      if (f.required) a = a.min(1, `${label} is required`);
      if (f.max !== undefined) a = a.max(f.max, `${label}: at most ${f.max} items`);
      return a;
    }
    case "select": {
      const e = z.enum(f.options as [string, ...string[]], { errorMap: () => ({ message: `Choose a valid ${label}` }) });
      return f.required ? e : e.nullable();
    }
    default: {
      let s = z.string().trim();
      if (f.required) s = s.min(1, `${label} is required`);
      if (f.min !== undefined) s = s.min(f.min, `${label} must be at least ${f.min} characters`);
      const maxLen = f.max ?? (f.type === "text" || f.type === "url" || f.type === "email" ? 500 : 20_000);
      s = s.max(maxLen, `${label} must be at most ${maxLen} characters`);
      if (f.type === "url") s = s.url(`${label} must be a valid URL`);
      if (f.type === "email") s = s.email(`${label} must be a valid email`);
      if (f.type === "date") s = s.regex(/^\d{4}-\d{2}-\d{2}$/, `${label} must be a date`);
      let v: z.ZodTypeAny = s;
      if (f.type === "url") v = s.refine((x) => /^https?:\/\//i.test(x), `${label} must start with http(s)://`);
      return f.required ? v : v.nullable();
    }
  }
}

export function buildFieldsSchema(fields: FieldDef[]) {
  return z.object(Object.fromEntries(fields.map((f) => [f.key, validatorFor(f)])));
}

/** Read raw values for the given fields from a form (inputs named `f.<key>`). */
export function readFieldsFromForm(fields: FieldDef[], form: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const name = `f.${f.key}`;
    switch (f.type) {
      case "boolean":
        out[f.key] = form.get(name) === "on" || form.get(name) === "true";
        break;
      case "multiselect":
        out[f.key] = form.getAll(name).map(String).filter(Boolean);
        break;
      case "tags":
        out[f.key] = String(form.get(name) ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        break;
      case "number": {
        const raw = String(form.get(name) ?? "").trim();
        out[f.key] = raw === "" ? null : Number(raw);
        break;
      }
      default: {
        const raw = String(form.get(name) ?? "").trim();
        out[f.key] = raw === "" ? null : raw;
      }
    }
  }
  return out;
}

export type FieldErrors = Record<string, string>;

export function validateFields(
  fields: FieldDef[],
  raw: Record<string, unknown>,
): { ok: true; values: FieldValues } | { ok: false; errors: FieldErrors } {
  const res = buildFieldsSchema(fields).safeParse(raw);
  if (res.success) return { ok: true, values: res.data as FieldValues };
  const errors: FieldErrors = {};
  for (const issue of res.error.issues) {
    const k = String(issue.path[0] ?? "_");
    errors[k] ??= issue.message;
  }
  return { ok: false, errors };
}

/** Normalise a JSON column value (some MySQL drivers return strings). */
export function asValues(v: unknown): FieldValues {
  if (!v) return {};
  if (typeof v === "string") {
    try {
      return JSON.parse(v) as FieldValues;
    } catch {
      return {};
    }
  }
  return v as FieldValues;
}

export function isEmpty(v: unknown): boolean {
  return v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0);
}

export function formatValue(f: FieldDef, v: unknown): string {
  if (isEmpty(v)) return "";
  if (Array.isArray(v)) return v.join(", ");
  if (f.type === "boolean") return v ? "Yes" : "No";
  return String(v);
}

/** Placeholder value used by the seed script for fields the seed omits. */
export function placeholderValue(f: FieldDef): FieldValue {
  switch (f.type) {
    case "number":
      return f.min ?? 1;
    case "boolean":
      return false;
    case "select":
      return f.options?.[0] ?? null;
    case "multiselect":
      return f.options?.slice(0, 1) ?? [];
    case "tags":
      return ["example"];
    case "url":
      return "https://example.com";
    case "email":
      return "someone@example.com";
    case "date":
      return new Date().toISOString().slice(0, 10);
    default:
      return f.required ? `Example ${f.label.toLowerCase()} (seed placeholder)`.padEnd(f.min ?? 0, ".") : null;
  }
}
