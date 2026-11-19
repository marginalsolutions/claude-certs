import type { Concept } from '../../types';

export const technicalFundamentals: Concept = {
  id: 'technical-fundamentals',
  title: 'Technical Fundamentals for Claude Applications',
  summary:
    'The engineering basics the Developer exam assumes: REST versus WebSockets versus SSE, HTTP semantics and errors, JSON Schema, async code for concurrent requests, rate limits and backoff, secrets management, and basic observability.',
  certs: ['ccdv-f', 'ccar-p'],
  domains: ['ccdv-f-5', 'ccdv-f-2', 'ccdv-f-7', 'ccar-p-3', 'ccar-p-4'],
  tags: ['rest', 'sse', 'websockets', 'json-schema', 'async', 'rate-limits', 'secrets', 'observability'],
  difficulty: 'foundations',
  diagram: 'request-anatomy',
  sections: [
    {
      heading: 'REST, SSE and WebSockets',
      body: `The Claude API is a **REST** API over HTTPS: you POST a JSON body to \`/v1/messages\` with headers \`x-api-key\` and \`anthropic-version\` (current version \`2026-10-21\`), and receive a JSON response. Each request is stateless and independent; conversation state lives in the body you send. The official SDKs (Python, TypeScript, Java, Go, Ruby, PHP, C#) are thin wrappers that add typing, retries, timeouts and streaming helpers around those HTTP calls, so understanding the HTTP layer helps you read SDK errors.

Streaming uses **Server-Sent Events (SSE)**: a single HTTP response kept open while the server pushes \`event:\`/\`data:\` lines (\`message_start\`, \`content_block_delta\`, \`message_delta\`, \`message_stop\`). SSE is one-directional (server to client), works through ordinary HTTP infrastructure and is what \`stream=True\` / \`.stream()\` consume. The SDK's \`get_final_message()\` / \`finalMessage()\` assembles the deltas into a complete message.

**WebSockets** are a persistent, bidirectional connection. The Messages API does not use them; you meet WebSockets in your own product (pushing streamed tokens from your server to a browser, voice or realtime UIs) and in some MCP or agent transports. Pattern: browser ⇄ your server over WebSocket, your server → Claude over SSE. MCP itself uses stdio locally and **Streamable HTTP** remotely (plain HTTP with optional SSE); the older pure-SSE transport is legacy.`,
    },
    {
      heading: 'HTTP semantics, errors, rate limits and backoff',
      body: `Status codes tell you whether to fix or retry:

| Code | Type | Action |
|---|---|---|
| 400 | \`invalid_request_error\` | Fix the request (bad or removed parameter, roles not alternating) |
| 401 / 403 | authentication / permission | Fix the key or entitlement |
| 404 | \`not_found_error\` | Wrong model id or endpoint |
| 413 | \`request_too_large\` | Shrink the input |
| 429 | \`rate_limit_error\` | Back off and retry; read \`retry-after\` |
| 500 / 529 | \`api_error\` / \`overloaded_error\` | Retry with exponential backoff |

Rate limits are enforced per organisation on requests per minute and input/output tokens per minute (and per day), reported in \`x-ratelimit-*\` headers. The SDKs retry 429 and 5xx automatically with **exponential backoff and jitter** (\`max_retries=2\` by default, configurable), and expose \`timeout\`. For bursty workloads add a client-side limiter or queue, spread requests over time, and move non-urgent work to the Batches API, which has its own, separate limits. Every error response includes a \`request_id\`; log it so support can trace the call. Idempotency matters: a retried request that already succeeded on the server will be billed twice, so keep retries to the failures the status code marks retryable.`,
    },
    {
      heading: 'JSON, JSON Schema and async programming',
      body: `Requests and responses are JSON, and **JSON Schema** describes shape: \`type\`, \`properties\`, \`required\`, \`enum\`, \`items\`, \`additionalProperties\`. You write schemas in three places: tool \`input_schema\` (what arguments the model may pass), \`output_config.format\` for structured outputs (what the final answer must look like), and your own validators (Pydantic, zod) that check what came back. Keep schemas strict: mark required fields, forbid extra properties, use enums for closed sets, and describe each property because the model reads descriptions. The same schema can enforce the model's output and validate it, which closes the loop.

LLM calls are slow I/O (seconds, not milliseconds), so **asynchronous programming** is how you get throughput: issue many requests concurrently and wait for all of them instead of serialising. In Python use \`AsyncAnthropic\` with \`asyncio.gather\` and a \`Semaphore\` to cap concurrency under your rate limit; in TypeScript the client is async by nature, so use \`Promise.all\` with a concurrency limiter. Concurrency amplifies rate-limit pressure and cache races (parallel requests with the same new prefix can all miss), so start the first request alone to warm the cache, then fan out.`,
    },
    {
      heading: 'Environment variables, secrets and observability',
      body: `API keys are credentials. Rules: never commit them; load from the environment (\`ANTHROPIC_API_KEY\` is read automatically by every SDK) or from a secrets manager (AWS Secrets Manager, GCP Secret Manager, Vault); use separate keys per environment and per service so a leak is scoped and revocable; rotate them; and for Claude Code, keep keys in \`settings.json\` \`env\` or CI secrets rather than in CLAUDE.md or \`.mcp.json\`, which are committed. Enterprise setups use **Workspaces** in the Console to separate teams' keys, limits and spend, and the Admin API to manage them. On Bedrock, Vertex and Foundry you authenticate with the cloud provider's identity instead of an Anthropic key.

Observability means being able to answer "what did this request do and what did it cost" after the fact. Minimum: structured logs per call with \`request_id\`, model, \`stop_reason\`, the four \`usage\` meters and latency; metrics on error rate, p50/p95 latency and cost per feature; and traces that link the model calls and tool calls of one agent run. **OpenTelemetry** is the standard way to emit these: the Anthropic SDKs can produce OTel spans for each API call, and Anthropic offers server-side API tracing to an OTLP destination that an organisation admin configures. Send them to the backend you already use (Datadog, Honeycomb, Grafana, Jaeger). Without this plumbing, debugging and cost optimisation are guesswork.`,
    },
  ],
  examples: [
    {
      title: 'Concurrent requests with a concurrency cap',
      description:
        'A document pipeline processed files one at a time, taking two hours. Running them concurrently with a semaphore sized under the rate limit brought it to eight minutes without 429 storms.',
      language: 'python',
      code: `import asyncio, anthropic
client = anthropic.AsyncAnthropic(max_retries=4, timeout=60.0)
sem = asyncio.Semaphore(8)                     # stay under RPM/TPM limits

async def summarize(doc: str) -> str:
    async with sem:
        r = await client.messages.create(
            model="claude-opus-5-5", max_tokens=600,
            system=[{"type": "text", "text": SYSTEM, "cache_control": {"type": "ephemeral"}}],
            messages=[{"role": "user", "content": doc}])
        return r.content[0].text

async def main(docs):
    await summarize(docs[0])                   # warm the cache once
    return await asyncio.gather(*(summarize(d) for d in docs[1:]))`,
      takeaway: 'Async plus a semaphore gives throughput while respecting rate limits; warm the cache before fanning out.',
    },
    {
      title: 'Streaming to a browser: SSE in, WebSocket out',
      description:
        'A chat product streams tokens to users. The server consumes the Claude SSE stream with the SDK and forwards text deltas over the browser WebSocket, then logs the final assembled message and usage.',
      language: 'typescript',
      code: `const stream = client.messages.stream({
  model: "claude-opus-5-5", max_tokens: 2048,
  messages: [{ role: "user", content: userText }],
});
stream.on("text", (delta) => ws.send(JSON.stringify({ type: "delta", text: delta })));
const final = await stream.finalMessage();
log.info({ id: final.id, stop: final.stop_reason, usage: final.usage });
ws.send(JSON.stringify({ type: "done" }));`,
      takeaway: 'Claude streams over SSE; your own bidirectional channel to the user is where WebSockets belong.',
    },
    {
      title: 'Mistake: API key committed in .mcp.json',
      description:
        'A developer put a vendor API key directly in the project .mcp.json so the MCP server would start. The file was committed and the key was scraped from the public repo within hours. The fix references an environment variable in the config, moves the value to a secrets manager, and rotates the leaked key.',
      language: 'json',
      code: `{
  "mcpServers": {
    "crm": {
      "command": "npx", "args": ["-y", "@acme/mcp-crm"],
      "env": { "CRM_API_KEY": "\${CRM_API_KEY}" }
    }
  }
}`,
      takeaway: 'Committed files hold references to secrets, never values; rotate immediately after any leak.',
    },
    {
      title: 'A strict schema used twice',
      description:
        'An extraction service defines one JSON Schema, passes it to output_config.format so the model must produce that shape, and validates the response with the same schema before writing to the database.',
      language: 'python',
      code: `INVOICE = {"type": "object", "additionalProperties": False,
           "required": ["invoice_id", "total", "currency"],
           "properties": {"invoice_id": {"type": "string", "description": "Vendor's invoice number"},
                          "total": {"type": "number"},
                          "currency": {"type": "string", "enum": ["USD", "EUR", "GBP"]}}}
resp = client.messages.create(model="claude-opus-5-5", max_tokens=400,
    output_config={"format": {"type": "json_schema", "schema": INVOICE}},
    messages=[{"role": "user", "content": doc}])
jsonschema.validate(json.loads(resp.content[0].text), INVOICE)   # defensive check`,
      takeaway: 'Enforce and verify with the same schema; required, enum and additionalProperties: false do most of the work.',
    },
  ],
  keyPoints: [
    'The Messages API is stateless REST over HTTPS (x-api-key, anthropic-version 2026-10-21); SDKs wrap it with retries, timeouts and streaming helpers.',
    'Streaming uses Server-Sent Events, one-directional; WebSockets are bidirectional and belong between your server and your users, not between you and the Claude API.',
    'MCP transports: stdio locally, Streamable HTTP remotely; pure SSE transport is legacy.',
    '4xx means fix the request (400 removed params, 401/403 auth, 404 model id, 413 size); 429/500/529 are retried by the SDK with exponential backoff (max_retries=2 default). Rate limits are per org on RPM and tokens per minute/day; log request_id.',
    'JSON Schema (type, properties, required, enum, additionalProperties) is used for tool input_schema, structured outputs and your own validation.',
    'Use async (AsyncAnthropic + asyncio.gather + Semaphore, or Promise.all with a limiter) for concurrency; warm the cache before fanning out.',
    'Secrets come from environment variables or a secrets manager, scoped per environment and rotated; never in committed files.',
    'Observability: per-call structured logs (request_id, stop_reason, usage, latency), metrics and traces; OpenTelemetry via SDK spans or API tracing.',
  ],
  flashcards: [
    { front: 'Which protocol does Claude API streaming use?', back: 'Server-Sent Events (SSE) over a single HTTP response.' },
    { front: 'Does the Messages API use WebSockets?', back: 'No. WebSockets are for your own bidirectional client connections; Claude streams via SSE.' },
    { front: 'Which headers does every raw Messages request need?', back: 'x-api-key (or Authorization: Bearer for OAuth) and anthropic-version (2026-10-21), plus content-type: application/json.' },
    { front: 'Which HTTP codes are retryable?', back: '429 rate limit, 500 api_error, 529 overloaded. 4xx other than 429 are not.' },
    { front: 'Default SDK retry count?', back: 'max_retries=2 with exponential backoff; configurable on the client.' },
    { front: 'Which header tells you how long to wait after a 429?', back: 'retry-after (with x-ratelimit-* headers showing limits and remaining quota).' },
    { front: 'Name four JSON Schema keywords you should use in tool and output schemas.', back: 'required, enum, additionalProperties: false, and description on each property (plus type/properties/items).' },
    { front: 'How do you cap concurrency in async Python?', back: 'An asyncio.Semaphore around each call, with asyncio.gather to run tasks concurrently.' },
    { front: 'Where should an Anthropic API key live?', back: 'In an environment variable (ANTHROPIC_API_KEY) or a secrets manager, scoped per environment and rotated; never in committed files.' },
    { front: 'What is OpenTelemetry used for with Claude?', back: 'Emitting spans and metrics for API and tool calls (SDK tracing or server-side API tracing) to a backend like Datadog, Honeycomb or Jaeger.' },
  ],
  quiz: [
    {
      question:
        'A web app must show tokens to the user as Claude generates them and also let the user send a "stop" command mid-response. Which architecture fits BEST?',
      options: [
        'Browser connects to the Claude API directly over WebSockets.',
        'Server consumes the Claude SSE stream and relays deltas to the browser over a WebSocket, which also carries the stop command.',
        'Server polls the Claude API every second for partial results.',
        'Browser opens an SSE connection directly to the Claude API with the API key.',
      ],
      correct: [1],
      explanation:
        'Claude streams via SSE to your server; the browser needs a bidirectional channel for the stop command, and the API key must never reach the browser. Polling does not provide streaming and the Claude API offers no WebSocket endpoint.',
    },
    {
      question:
        'A batch script sends 500 requests in a tight loop and starts getting 429 errors. Which TWO changes are appropriate? (Select two)',
      options: [
        'Add concurrency limiting and exponential backoff with jitter, honouring retry-after.',
        'Move the non-urgent work to the Message Batches API.',
        'Retry immediately in a while loop until it succeeds.',
        'Remove the anthropic-version header to bypass limits.',
      ],
      correct: [0, 1],
      explanation:
        'Backoff plus limiting respects the rate limit; batching has separate limits and a 50% discount. Immediate retries worsen the problem and headers do not control rate limits.',
    },
    {
      question:
        'Which status code indicates a problem you should fix in the request rather than retry?',
      options: ['529', '400', '500', '429'],
      correct: [1],
      explanation:
        '400 invalid_request_error is deterministic (bad or removed parameter). 429, 500 and 529 are transient and retryable with backoff.',
    },
    {
      question:
        'An extraction tool sometimes receives an unexpected extra field and a currency value outside the supported list. Which schema changes prevent this?',
      options: [
        'Add description text asking the model to be careful.',
        'Set additionalProperties: false and define currency as an enum of supported codes.',
        'Increase max_tokens.',
        'Remove required so missing fields do not fail.',
      ],
      correct: [1],
      explanation:
        'Schema constraints are enforced by structured outputs and strict tools; descriptions help but do not enforce, max_tokens is unrelated, and dropping required weakens validation.',
    },
    {
      question:
        'A team hard-coded the API key in a Python file so the demo "just works". What is the MOST appropriate remediation?',
      options: [
        'Obfuscate the key with base64 in the file.',
        'Move the key to an environment variable or secrets manager, rotate the exposed key, and use separate keys per environment.',
        'Keep it but make the repository private.',
        'Store the key in CLAUDE.md so Claude Code can read it.',
      ],
      correct: [1],
      explanation:
        'Any committed key is compromised and must be rotated; secrets belong in the environment or a manager. Obfuscation and private repos do not fix a leaked credential, and CLAUDE.md is a committed file.',
    },
    {
      question: 'Which set of per-request fields is the minimum useful for debugging and cost attribution?',
      options: [
        'Only the final response text',
        'request_id, model, stop_reason, the four usage meters and latency',
        'The user\'s IP address and browser',
        'The full system prompt on every log line',
      ],
      correct: [1],
      explanation:
        'Those fields locate failures, attribute cost and correlate with Anthropic support. Response text alone cannot explain truncation or cost, user metadata is not request diagnostics, and logging the full prompt every time is wasteful and a privacy risk.',
    },
  ],
  statements: [
    { text: 'The Claude Messages API streams responses using Server-Sent Events.', isTrue: true, explanation: 'A single HTTP response carries event/data lines; the SDK assembles them.' },
    { text: 'You can open a WebSocket connection to /v1/messages for bidirectional chat.', isTrue: false, explanation: 'The Messages API is REST with SSE streaming; WebSockets are for your own client connections.' },
    { text: 'A 429 response should be retried with exponential backoff, honouring retry-after.', isTrue: true, explanation: 'SDKs do this automatically for 429 and 5xx.' },
    { text: 'A 400 error from the API is usually transient and resolves on retry.', isTrue: false, explanation: '400 means the request itself is invalid; retrying the same body fails the same way.' },
    { text: 'Committing an API key to a private repository is an acceptable way to store it.', isTrue: false, explanation: 'Keys belong in environment variables or secrets managers, scoped and rotated; committed keys must be treated as leaked.' },
    { text: 'The same JSON Schema can be used to constrain model output and to validate the response in code.', isTrue: true, explanation: 'Enforce via output_config.format or a strict tool; verify with a validator using the same schema.' },
    { text: 'MCP\'s recommended remote transport is Streamable HTTP.', isTrue: true, explanation: 'stdio is for local servers; the pure SSE transport is legacy.' },
  ],
  resources: [
    { label: 'Messages API reference', url: 'https://platform.claude.com/docs/en/api/messages' },
    { label: 'Streaming Messages', url: 'https://platform.claude.com/docs/en/build-with-claude/streaming' },
    { label: 'Rate limits', url: 'https://platform.claude.com/docs/en/api/rate-limits' },
    { label: 'Client SDKs', url: 'https://platform.claude.com/docs/en/api/client-sdks' },
  ],
};
