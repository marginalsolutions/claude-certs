import type { Concept } from '../../types';

export const sdkAndRestFoundations: Concept = {
  id: 'sdk-and-rest-foundations',
  title: 'SDK and REST Foundations',
  summary:
    'How the official SDKs wrap the REST API: JSON over HTTPS, headers and versioning, authentication options, sync versus async clients, Python and TypeScript idioms, token counting and the Models API.',
  certs: ['ccdv-f', 'ccar-p'],
  domains: ['ccdv-f-2', 'ccdv-f-5', 'ccar-p-3'],
  tags: ['sdk', 'rest', 'json', 'async', 'authentication', 'python', 'typescript'],
  difficulty: 'foundations',
  sections: [
    {
      heading: 'REST underneath, SDK on top',
      body: `The Claude API is a plain HTTPS/JSON REST API. A request is \`POST https://api.anthropic.com/v1/messages\` with three headers:

- \`x-api-key: $ANTHROPIC_API_KEY\` (or \`Authorization: Bearer <token>\` for OAuth tokens)
- \`anthropic-version: 2026-10-21\` (the API version date)
- \`content-type: application/json\`

plus an optional \`anthropic-beta\` header listing beta features. The body is JSON; the response is JSON (or SSE when streaming). Everything an SDK does, you could do with \`curl\`.

The official SDKs (Python \`anthropic\`, TypeScript \`@anthropic-ai/sdk\`, plus Go, Java, Ruby, C#, PHP and the \`ant\` CLI) add typed request and response objects, automatic retries and timeouts, streaming helpers, pagination, platform clients for Bedrock, Vertex, Foundry and AWS, and the correct version header for their release. Use the SDK in application code; reach for raw HTTP when debugging, when a language has no SDK, or when a proxy sits in between.`,
    },
    {
      heading: 'API versioning',
      body: `Breaking changes ship as a new \`anthropic-version\` date, never silently. The current version is \`2026-10-21\`; the previous long-lived version was \`2023-06-01\`. A codebase moves when ready by upgrading the SDK (which sends the new default) or by changing the header on raw calls. The move to \`2026-10-21\` removed \`temperature\`, \`top_p\` and \`top_k\`, forbade \`document\` blocks in assistant messages and \`citations\` on user text blocks, and renamed some Admin API fields.

On Bedrock and Vertex the version travels as an \`anthropic_version\` field in the request body rather than a header. Model behaviour changes are a different axis: they come with new model ids, which is why pinning model versions is covered under configuration management.`,
    },
    {
      heading: 'Authentication and client configuration',
      body: `A bare \`Anthropic()\` / \`new Anthropic()\` resolves credentials from the environment in order: \`ANTHROPIC_API_KEY\`, then \`ANTHROPIC_AUTH_TOKEN\`, then a profile created by \`ant auth login\` (an OAuth sign-in stored under \`~/.config/anthropic/\`). Prefer this to hard-coding keys. The classic trap: a stale exported \`ANTHROPIC_API_KEY\` overrides a valid login and causes mysterious 401s.

Guidance by environment:

- **Local development**: \`ant auth login\` (no static key to leak) or a personal key in a shell profile.
- **CI, servers, containers**: a key from the platform's secret store, or Workload Identity Federation. Never copy a login's token file.
- **Browsers**: never ship a key; call through your own backend.

Client options: \`base_url\` / \`ANTHROPIC_BASE_URL\` to route through a proxy or gateway, \`timeout\`, \`max_retries\`, \`default_headers\`, and a custom HTTP client. Python's \`client.with_options(...)\` returns a copy with overrides for one call. Set \`ANTHROPIC_LOG=debug\` to see requests. Every response exposes its request id (\`_request_id\` in Python) for support tickets.`,
    },
    {
      heading: 'Sync, async, and language idioms',
      body: `**Python** offers \`Anthropic\` (blocking) and \`AsyncAnthropic\` (\`await client.messages.create(...)\`). Use the async client inside asyncio services and for high fan-out; use the sync client in scripts and workers. Method and field names are snake_case (\`count_tokens\`, \`get_final_message\`, \`max_tokens\`). Responses are Pydantic models with \`.to_dict()\` and \`.to_json()\`. The SDK is built on \`httpx2\`; a proxy or custom transport must come from \`anthropic.DefaultHttpxClient\`, not the old \`httpx\` package.

**TypeScript** has one client and every call returns a Promise, so it is async by nature. Methods are camelCase (\`countTokens\`, \`finalMessage\`) while JSON body fields stay snake_case (\`max_tokens\`). Streams are async iterables consumed with \`for await\`. Content is a discriminated union: narrow on \`block.type\` before reading \`block.text\` or the compiler complains. In ESM files \`__dirname\` is undefined; derive paths from \`import.meta.url\`.

Both SDKs auto-paginate list endpoints when you iterate the result, give you \`with_raw_response\` / \`.withResponse()\` for headers, and expose beta features under \`client.beta.*\`.`,
    },
    {
      heading: 'Token counting and the Models API',
      body: `\`POST /v1/messages/count_tokens\` (\`client.messages.count_tokens\` / \`countTokens\`) returns \`input_tokens\` for a prospective request (system, messages, tools, images, documents) **without** running the model and **free of charge**. Use it to enforce input budgets, estimate cost before a batch, trim context before a limit, or diff a prompt change. Count with the same model you will call; tokenizers differ between model families. Do not estimate Claude tokens with OpenAI's tiktoken; it undercounts materially.

\`GET /v1/models\` and \`GET /v1/models/{id}\` (\`client.models.list()\` / \`retrieve()\`) return each model's \`display_name\`, \`max_input_tokens\` (context window), \`max_tokens\` (max output) and a \`capabilities\` tree with \`supported\` flags for vision, adaptive thinking, effort levels, structured outputs and more. Use it for runtime capability discovery and to answer "can my org use this model?" instead of relying on a 404. The Models API is only on the first-party API and Claude Platform on AWS.`,
    },
  ],
  examples: [
    {
      title: 'The same call three ways',
      description:
        'Raw curl, Python and TypeScript for one request. Seeing them side by side makes clear that the SDK is a thin, typed layer over the REST call.',
      language: 'bash',
      code: `curl https://api.anthropic.com/v1/messages \\
  -H "x-api-key: $ANTHROPIC_API_KEY" \\
  -H "anthropic-version: 2026-10-21" \\
  -H "content-type: application/json" \\
  -d '{"model":"claude-opus-5-5","max_tokens":256,
       "messages":[{"role":"user","content":"Hello"}]}'

# Python:      anthropic.Anthropic().messages.create(model=..., max_tokens=256, messages=[...])
# TypeScript:  await new Anthropic().messages.create({ model, max_tokens: 256, messages })`,
      takeaway: 'Three headers and a JSON body; the SDKs add types, retries and helpers on top.',
    },
    {
      title: 'Async fan-out with a concurrency limit',
      description:
        'A document pipeline summarises 200 files concurrently with AsyncAnthropic and a semaphore to stay under the rate limit, instead of spawning threads around the sync client.',
      language: 'python',
      code: `import asyncio, anthropic

client = anthropic.AsyncAnthropic(max_retries=3)
sem = asyncio.Semaphore(8)

async def summarise(doc: str) -> str:
    async with sem:
        resp = await client.messages.create(
            model="claude-opus-5-5", max_tokens=512,
            messages=[{"role": "user", "content": f"Summarise:\\n{doc}"}],
        )
        return next(b.text for b in resp.content if b.type == "text")

summaries = asyncio.run(asyncio.gather(*(summarise(d) for d in docs)))`,
      takeaway: 'Use the async client for fan-out and bound concurrency explicitly.',
    },
    {
      title: 'Mistake: hard-coded key and a stale environment variable',
      description:
        'A developer committed `Anthropic(api_key="sk-ant-...")` to a repo (the key had to be revoked) and later saw 401s on a laptop after `ant auth login` because an old exported ANTHROPIC_API_KEY took precedence. The fix was a bare client, secrets from the environment or secret store, and unsetting the stale variable.',
      language: 'python',
      code: `# Before
client = anthropic.Anthropic(api_key="sk-ant-api03-...")      # leaked in git

# After
client = anthropic.Anthropic()   # ANTHROPIC_API_KEY, ANTHROPIC_AUTH_TOKEN, or ant auth login profile
# shell: env -u ANTHROPIC_API_KEY python app.py   (a stale export beats the login)`,
      takeaway: 'Let the client resolve credentials from the environment; never commit keys.',
    },
    {
      title: 'Capability discovery with the Models API',
      description:
        'A router picks, at startup, the cheapest model that supports adaptive thinking and a 200K-plus context, instead of hard-coding assumptions that break on the next release.',
      language: 'typescript',
      code: `const candidates = [];
for await (const m of client.models.list()) {
  const caps = m.capabilities as any;
  if (caps.thinking?.types?.adaptive?.supported && m.max_input_tokens >= 200_000) {
    candidates.push(m.id);
  }
}
const count = await client.messages.countTokens({ model: candidates[0], messages });
console.log(count.input_tokens);`,
      takeaway: 'Discover capabilities and count tokens at runtime rather than guessing.',
    },
  ],
  keyPoints: [
    'The API is JSON over HTTPS: POST /v1/messages with x-api-key (or Authorization: Bearer), anthropic-version and content-type headers.',
    'Current API version is 2026-10-21 (previous 2023-06-01); breaking changes ship as a new version date. Bedrock and Vertex put anthropic_version in the body.',
    'A bare client resolves ANTHROPIC_API_KEY, then ANTHROPIC_AUTH_TOKEN, then an ant auth login profile; a stale exported key overrides a login.',
    'Use secret stores or Workload Identity Federation in CI and production; never ship keys to browsers.',
    'Python: Anthropic and AsyncAnthropic, snake_case, Pydantic models, with_options. TypeScript: single async client, camelCase methods, for await streams, narrow on block.type.',
    'base_url / ANTHROPIC_BASE_URL routes through gateways; timeout and max_retries are client options.',
    'count_tokens is free and returns input_tokens for a prospective request; count with the model you will use.',
    'The Models API exposes context window, max output and a capabilities tree for runtime discovery (first-party and Claude Platform on AWS only).',
  ],
  flashcards: [
    { front: 'Three headers on a raw Messages API request?', back: 'x-api-key (or Authorization: Bearer), anthropic-version, content-type: application/json.' },
    { front: 'Current anthropic-version value?', back: '2026-10-21 (the earlier long-lived version was 2023-06-01).' },
    { front: 'Credential resolution order for a bare SDK client?', back: 'ANTHROPIC_API_KEY, then ANTHROPIC_AUTH_TOKEN, then the ant auth login profile.' },
    { front: 'Python async client class?', back: 'anthropic.AsyncAnthropic.' },
    { front: 'TypeScript method to count tokens?', back: 'client.messages.countTokens({ model, messages }) returning input_tokens.' },
    { front: 'Does count_tokens cost money or run the model?', back: 'Neither. It is free and returns the input token count only.' },
    { front: 'How do you route SDK traffic through a gateway?', back: 'Set base_url on the client or the ANTHROPIC_BASE_URL environment variable.' },
    { front: 'What does GET /v1/models/{id} return?', back: 'display_name, max_input_tokens, max_tokens and a capabilities tree with supported flags.' },
    { front: 'Where does the API version go on Bedrock and Vertex?', back: 'In the request body as anthropic_version rather than a header.' },
    { front: 'Why not use tiktoken to estimate Claude tokens?', back: 'It is OpenAI\'s tokenizer and undercounts Claude tokens by a large margin.' },
  ],
  quiz: [
    {
      question:
        'A developer ran ant auth login successfully but every SDK call returns 401. ant auth status shows ANTHROPIC_API_KEY as the active credential. What is the most likely cause and fix?',
      options: [
        'The login profile is corrupt; delete ~/.config/anthropic and retry.',
        'A stale exported ANTHROPIC_API_KEY overrides the login; unset it.',
        'The SDK needs the anthropic-beta oauth header; add it.',
        'The organisation has no credits.',
      ],
      correct: [1],
      explanation:
        'Environment keys take precedence over a login profile. No credits produces a different error, the profile is not the problem, and the SDK handles OAuth headers itself.',
    },
    {
      question: 'A service needs to summarise 500 documents concurrently in Python with a controlled parallelism of 10. Which is the most idiomatic approach?',
      options: [
        'Spawn 500 threads around the synchronous client.',
        'Use AsyncAnthropic with asyncio.gather and a semaphore of 10.',
        'Loop synchronously; the SDK parallelises internally.',
        'Use the Batches API and poll every second.',
      ],
      correct: [1],
      explanation:
        'The async client with a semaphore is the designed path for fan-out. The SDK does not parallelise a sync loop, 500 threads is wasteful, and batches are for latency-tolerant work (and should not be polled every second).',
    },
    {
      question: 'Which TWO statements about token counting are correct? (Select two)',
      options: [
        'count_tokens is billed at the normal input rate.',
        'count_tokens returns input_tokens without generating a response.',
        'Counts should be made with the same model you will call.',
        'tiktoken gives accurate Claude token counts.',
      ],
      correct: [1, 2],
      explanation:
        'The endpoint is free and model-specific; tiktoken is OpenAI\'s tokenizer and undercounts.',
    },
    {
      question: 'A TypeScript build fails on `response.content[0].text` with a type error. What is the correct fix?',
      options: [
        'Cast the whole response to any.',
        'Narrow on block.type === "text" before reading .text, since content is a discriminated union.',
        'Use the Python SDK instead.',
        'Set max_tokens so only one block is returned.',
      ],
      correct: [1],
      explanation:
        'Content blocks are a union of text, tool_use, thinking and others; narrowing is the typed, correct approach. Casting hides real runtime risk.',
    },
    {
      question: 'Which option best describes the relationship between the SDK and the REST API?',
      options: [
        'The SDK uses a private binary protocol unavailable to raw HTTP clients.',
        'The SDK is a typed wrapper over the same JSON REST endpoints, adding retries, timeouts, streaming helpers and platform clients.',
        'The SDK stores conversation state server side on your behalf.',
        'The SDK is required; the REST API cannot be called directly.',
      ],
      correct: [1],
      explanation:
        'Everything the SDK does is possible with curl. It adds convenience and safety, not a different protocol or server-side state.',
    },
  ],
  statements: [
    { text: 'Breaking API changes are shipped under a new anthropic-version date.', isTrue: true, explanation: 'Code moves when it upgrades the SDK or changes the header.' },
    { text: 'The TypeScript SDK offers separate synchronous and asynchronous clients.', isTrue: false, explanation: 'TypeScript has one client whose methods return Promises; Python has Anthropic and AsyncAnthropic.' },
    { text: 'ANTHROPIC_BASE_URL changes which host the SDK sends requests to.', isTrue: true, explanation: 'Used for proxies and gateways.' },
    { text: 'The Models API is available on Amazon Bedrock.', isTrue: false, explanation: 'It is offered on the first-party API and Claude Platform on AWS only.' },
    { text: 'count_tokens accounts for images and documents as well as text.', isTrue: true, explanation: 'It counts the whole prospective request including tools, system, images and documents.' },
    { text: 'Hard-coding an API key in the client constructor is acceptable if the repository is private.', isTrue: false, explanation: 'Keys belong in environment variables or secret stores; private repos leak and keys end up in history.' },
    { text: 'Python SDK method names are snake_case while TypeScript method names are camelCase, but JSON body fields are snake_case in both.', isTrue: true, explanation: 'For example count_tokens vs countTokens, with max_tokens in both.' },
  ],
  resources: [
    { label: 'Client SDKs', url: 'https://platform.claude.com/docs/en/api/client-sdks' },
    { label: 'API versioning', url: 'https://platform.claude.com/docs/en/api/versioning' },
    { label: 'Token counting', url: 'https://platform.claude.com/docs/en/build-with-claude/token-counting' },
    { label: 'Models API', url: 'https://platform.claude.com/docs/en/api/models-list' },
  ],
};
