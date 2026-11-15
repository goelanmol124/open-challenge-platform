/**
 * Google Gemini adapter (default). Supports:
 *  - Google AI Studio API key            (GEMINI_API_KEY)
 *  - Vertex AI with a service account    (GEMINI_USE_VERTEX_AI=true + project/location
 *                                          + GOOGLE_APPLICATION_CREDENTIALS[_JSON_B64])
 *  - Vertex AI express mode with API key (GEMINI_USE_VERTEX_AI=true + GEMINI_API_KEY)
 */
import fs from "fs";
import os from "os";
import path from "path";

import { GoogleGenAI } from "@google/genai";

import type { AIProvider, JsonGenerationRequest } from "../types";

let credentialsPath: string | null = null;

function ensureVertexCredentials(): void {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return;
  const b64 = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON_B64;
  if (!b64) return;
  if (!credentialsPath) {
    credentialsPath = path.join(os.tmpdir(), `gcp-credentials-${process.pid}.json`);
    fs.writeFileSync(credentialsPath, Buffer.from(b64, "base64").toString("utf8"), { mode: 0o600 });
  }
  process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;
}

function createClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY || undefined;
  if (process.env.GEMINI_USE_VERTEX_AI === "true") {
    const project = process.env.GEMINI_VERTEX_PROJECT;
    const location = process.env.GEMINI_VERTEX_LOCATION || "global";
    if (project) {
      ensureVertexCredentials();
      return new GoogleGenAI({ vertexai: true, project, location });
    }
    if (!apiKey) throw new Error("Vertex AI needs GEMINI_VERTEX_PROJECT (service account) or GEMINI_API_KEY (express mode)");
    return new GoogleGenAI({ vertexai: true, apiKey });
  }
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set (or use AI_PROVIDER=mock for local development)");
  return new GoogleGenAI({ apiKey });
}

export class GeminiProvider implements AIProvider {
  readonly id = "gemini";
  readonly model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  private client: GoogleGenAI | null = null;

  async generateJson(req: JsonGenerationRequest): Promise<string> {
    this.client ??= createClient();
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: req.prompt,
      config: {
        systemInstruction: req.system,
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });
    const text = response.text?.trim();
    if (!text) throw new Error("Gemini returned an empty response");
    return text;
  }
}
