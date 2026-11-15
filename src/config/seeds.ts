import customSeed from "../../platform.seed";
import civic from "./presets/civic/seed";
import corporate from "./presets/corporate/seed";
import research from "./presets/research/seed";
import type { SeedData } from "./seed-types";

/** Demo data per preset id (matches the keys of `presets` in ./index.ts). */
export const seeds: Record<string, SeedData> = { custom: customSeed, civic, corporate, research };

export const DEMO_PASSWORD = "demo-password";
