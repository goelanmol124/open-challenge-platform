# AI providers

Select a provider with `AI_PROVIDER`:

| id | needs | notes |
| --- | --- | --- |
| `gemini` (default) | `GEMINI_API_KEY`, or Vertex AI settings | Uses `@google/genai`, JSON response mode. Model: `GEMINI_MODEL` (default `gemini-2.5-flash`). |
| `openai-compatible` | `OPENAI_COMPATIBLE_BASE_URL`, `OPENAI_COMPATIBLE_API_KEY`, `OPENAI_COMPATIBLE_MODEL` | Any Chat Completions API: OpenAI, OpenRouter, Groq, Together, Mistral, local Ollama (`http://localhost:11434/v1`), vLLM. Plain `fetch`. |
| `mock` | nothing | Deterministic fake scores. Used by the seed script and good for local development and CI. |

### Gemini on Vertex AI

```
GEMINI_USE_VERTEX_AI=true
GEMINI_VERTEX_PROJECT=your-gcp-project
GEMINI_VERTEX_LOCATION=global
# Either point at a key file...
GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json
# ...or paste it base64-encoded (handy on PaaS hosts):
GOOGLE_APPLICATION_CREDENTIALS_JSON_B64=...
```

The service account needs the *Vertex AI User* role. Vertex "express mode"
works too: set `GEMINI_USE_VERTEX_AI=true` with only `GEMINI_API_KEY`.

## Adding a provider

A provider does one thing: it turns a system prompt and a user prompt into a
JSON string. Prompt building, parsing, validation, clamping and weighted
scoring are shared (`src/lib/ai/prompt.ts` and `scoring.ts`).

1. Create `src/lib/ai/providers/my-provider.ts`:

   ```ts
   import type { AIProvider, JsonGenerationRequest } from "../types";

   export class MyProvider implements AIProvider {
     readonly id = "my-provider";
     readonly model = process.env.MY_PROVIDER_MODEL || "some-model";

     async generateJson(req: JsonGenerationRequest): Promise<string> {
       // req.system, req.prompt, req.responseSchema (JSON schema, for native structured output)
       const text = await callYourApi(req);
       return text; // must contain one JSON object; ```json fences are tolerated
     }
   }
   ```

2. Register it in `src/lib/ai/index.ts`:

   ```ts
   const registry = { ..., "my-provider": () => new MyProvider() };
   ```

3. Set `AI_PROVIDER=my-provider`.

Each evaluation stores `ai_provider` and `ai_model`, so you can compare
providers over time.

### Anthropic Claude (example)

Claude can be added the same way through the `@anthropic-ai/sdk` package. Call
`messages.create` with `system: req.system`, put `req.prompt` in the user
message, and return the text content. It is not bundled, so the template stays
dependency-light.

## Tips

- **Calibrate before launch.** Seed 5-10 real-looking submissions of known
  quality. Run `npm run eval:pending` and check the ordering. Then adjust
  `criteria[].description`, `anchors` and `instructions`. Anchors help the
  most.
- **Keep humans in charge.** Scores are a triage signal. Statuses and
  endorsements are always human decisions, and `disclaimer` tells users so.
- **Cost.** One call per submission (plus re-runs on edit). Each prompt is
  roughly the challenge text plus the submission text.
