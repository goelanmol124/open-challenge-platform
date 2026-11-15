/**
 * Loads, validates and exposes the active platform configuration.
 *
 * Import `config` (and the small helpers below) anywhere — server or client.
 * Selection: NEXT_PUBLIC_PLATFORM_PRESET = custom (platform.config.ts) |
 * civic | corporate | research. It is inlined at build time.
 */
import customConfig from "../../platform.config";
import civic from "./presets/civic/config";
import corporate from "./presets/corporate/config";
import research from "./presets/research/config";
import { platformConfigSchema, type PlatformConfig, type PlatformConfigInput, type RoleKey } from "./schema";

export const presets: Record<string, PlatformConfigInput> = {
  custom: customConfig,
  civic,
  corporate,
  research,
};

export function loadConfig(presetId: string | undefined): PlatformConfig {
  const id = presetId && presetId.trim() ? presetId.trim() : "custom";
  const raw = presets[id];
  if (!raw) {
    throw new Error(`Unknown platform preset "${id}". Available: ${Object.keys(presets).join(", ")}`);
  }
  const parsed = platformConfigSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`).join("\n");
    throw new Error(`Invalid platform config "${id}":\n${issues}`);
  }
  return parsed.data;
}

export const activePresetId = process.env.NEXT_PUBLIC_PLATFORM_PRESET || "custom";
export const config: PlatformConfig = loadConfig(activePresetId);

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const t = config.terminology;

export function roleLabel(role: string, plural = false): string {
  const r = config.roles[role as RoleKey];
  if (!r) return role;
  return plural ? r.plural : r.label;
}

export function getStage(key: string | null | undefined) {
  return config.challenge.stages.find((s) => s.key === key) ?? null;
}

export function getStatus(key: string | null | undefined) {
  return config.submission.statuses.find((s) => s.key === key) ?? null;
}

export const publicStageKeys = config.challenge.stages.filter((s) => s.public).map((s) => s.key);

export type { PlatformConfig, RoleKey } from "./schema";
