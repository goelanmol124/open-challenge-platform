/**
 * Any OpenAI-compatible Chat Completions endpoint: OpenAI, OpenRouter, Groq,
 * Together, Mistral, a local Ollama (`http://localhost:11434/v1`) or vLLM...
 * Uses plain fetch, no SDK dependency.
 */
import type { AIProvider, JsonGenerationRequest } from "../types";

export class OpenAICompatibleProvider implements AIProvider {
  readonly id = "openai-compatible";
  readonly model = process.env.OPENAI_COMPATIBLE_MODEL || "gpt-4o-mini";
  private readonly baseUrl = (process.env.OPENAI_COMPATIBLE_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");

  async generateJson(req: JsonGenerationRequest): Promise<string> {
    const apiKey = process.env.OPENAI_COMPATIBLE_API_KEY;
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: req.system },
          { role: "user", content: req.prompt },
        ],
      }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) {
      throw new Error(`OpenAI-compatible API error ${res.status}: ${(await res.text()).slice(0, 300)}`);
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("OpenAI-compatible API returned an empty response");
    return text;
  }
}
