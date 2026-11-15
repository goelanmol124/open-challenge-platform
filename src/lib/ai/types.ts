/**
 * AI provider contract. A provider only has to turn (system, prompt) into a
 * JSON string; prompt building, parsing, validation and scoring are shared
 * (see ./evaluate.ts). To add a provider, implement this interface and
 * register it in ./index.ts. See docs/AI_PROVIDERS.md.
 */
import type { Criterion } from "@/config/schema";

export type JsonGenerationRequest = {
  system: string;
  prompt: string;
  /** JSON schema of the expected output (providers may use it for structured output). */
  responseSchema: Record<string, unknown>;
  /**
   * Structured context for providers that don't call a model (the mock
   * provider uses it to fabricate plausible output).
   */
  meta: {
    criteria: Criterion[];
    flags: string[];
    hasGate: boolean;
    summaryMaxLength: number;
    submissionText: string;
  };
};

export interface AIProvider {
  /** Stable id, stored with each evaluation, e.g. "gemini". */
  readonly id: string;
  /** Model name, stored with each evaluation. */
  readonly model: string;
  generateJson(req: JsonGenerationRequest): Promise<string>;
}
