/**
 * Renders one config-defined field as a native form control named `f.<key>`
 * (read back by readFieldsFromForm in src/lib/fields.ts).
 */
import type { ReactNode } from "react";

import type { FieldDef } from "@/config/schema";

import { Input, Label, Select, Textarea } from "./ui";

type Props = { field: FieldDef; value?: unknown; error?: string };

export function FieldInput({ field: f, value, error }: Props) {
  const name = `f.${f.key}`;
  const id = `field-${f.key}`;
  const str = value === null || value === undefined ? "" : Array.isArray(value) ? value.join(", ") : String(value);

  let control: ReactNode;
  switch (f.type) {
    case "textarea":
    case "markdown":
      control = <Textarea id={id} name={name} defaultValue={str} required={f.required} placeholder={f.placeholder} rows={f.type === "markdown" ? 7 : 4} />;
      break;
    case "select":
      control = (
        <Select id={id} name={name} defaultValue={str} required={f.required}>
          <option value="">Select…</option>
          {f.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </Select>
      );
      break;
    case "multiselect": {
      const selected = new Set(Array.isArray(value) ? value.map(String) : []);
      control = (
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {f.options?.map((o) => (
            <label key={o} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name={name} value={o} defaultChecked={selected.has(o)} /> {o}
            </label>
          ))}
        </div>
      );
      break;
    }
    case "boolean":
      control = (
        <label className="flex items-center gap-2 text-sm">
          <input id={id} type="checkbox" name={name} defaultChecked={value === true} /> Yes
        </label>
      );
      break;
    case "number":
      control = <Input id={id} name={name} type="number" defaultValue={str} required={f.required} min={f.min} max={f.max} placeholder={f.placeholder} />;
      break;
    default:
      control = (
        <Input
          id={id}
          name={name}
          type={f.type === "url" ? "url" : f.type === "email" ? "email" : f.type === "date" ? "date" : "text"}
          defaultValue={str}
          required={f.required}
          placeholder={f.placeholder ?? (f.type === "tags" ? "Comma separated" : undefined)}
        />
      );
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {f.label}
        {f.required && <span className="text-danger"> *</span>}
        {f.private && <span className="ml-2 text-xs font-normal text-muted-foreground">(private)</span>}
      </Label>
      {control}
      {f.help && <p className="text-xs text-muted-foreground">{f.help}{f.type === "markdown" ? " Markdown supported." : ""}</p>}
      {!f.help && f.type === "markdown" && <p className="text-xs text-muted-foreground">Markdown supported.</p>}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
