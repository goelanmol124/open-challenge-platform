/**
 * Provider registry. Select with AI_PROVIDER (default "gemini").
 * Add your own: implement AIProvider (./types.ts) and add it here.
 */
import { GeminiProvider } from "./providers/gemini";
import { MockProvider } from "./providers/mock";
import { OpenAICompatibleProvider } from "./providers/openai-compatible";
import type { AIProvider } from "./types";

const registry: Record<string, () => AIProvider> = {
  gemini: () => new GeminiProvider(),
  "openai-compatible": () => new OpenAICompatibleProvider(),
  mock: () => new MockProvider(),
};

const cache = new Map<string, AIProvider>();

export function getProvider(id = process.env.AI_PROVIDER || "gemini"): AIProvider {
  const factory = registry[id];
  if (!factory) throw new Error(`Unknown AI_PROVIDER "${id}". Available: ${Object.keys(registry).join(", ")}`);
  let p = cache.get(id);
  if (!p) {
    p = factory();
    cache.set(id, p);
  }
  return p;
}

export const availableProviders = Object.keys(registry);
export type { AIProvider } from "./types";
