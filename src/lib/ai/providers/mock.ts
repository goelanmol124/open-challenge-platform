/**
 * Mock provider: no network, no key. Produces deterministic, plausible scores
 * from a hash of the submission text (longer, more detailed submissions score
 * a bit higher). For local development, demos, tests and the seed script.
 */
import { createHash } from "crypto";

import type { AIProvider, JsonGenerationRequest } from "../types";

export class MockProvider implements AIProvider {
  readonly id = "mock";
  readonly model = "mock-deterministic-v1";

  async generateJson(req: JsonGenerationRequest): Promise<string> {
    const { criteria, flags, hasGate, summaryMaxLength, submissionText } = req.meta;
    const digest = createHash("sha256").update(submissionText).digest();
    const detail = Math.min(1, submissionText.length / 900); // 0..1

    const scores: Record<string, { score: number; rationale: string }> = {};
    criteria.forEach((c, i) => {
      const noise = digest[i % digest.length] / 255; // 0..1
      const fraction = Math.min(1, 0.25 + 0.45 * detail + 0.3 * noise);
      const score = Math.round(c.min + fraction * (c.max - c.min));
      scores[c.key] = {
        score,
        rationale: `Mock rationale: ${c.label.toLowerCase()} looks ${fraction > 0.7 ? "strong" : fraction > 0.45 ? "reasonable" : "limited"} based on the level of detail provided.`,
      };
    });

    // Line 2 of the submission text is "<summary label>: <summary>".
    const lines = submissionText.split("\n");
    const summaryLine = (lines[1] ?? lines[0] ?? "").replace(/^[^:]+:\s*/, "");
    const firstSentence = summaryLine.replace(/\s+/g, " ").split(/(?<=[.!?])\s/)[0] ?? "";
    const summary = `[Mock evaluation] ${firstSentence}`.slice(0, summaryMaxLength);

    return JSON.stringify({
      ...(hasGate ? { gate_passed: true, gate_reason: "Mock provider always passes the gate." } : {}),
      scores,
      summary,
      flags: detail < 0.2 && flags.includes("incomplete") ? ["incomplete"] : [],
    });
  }
}
