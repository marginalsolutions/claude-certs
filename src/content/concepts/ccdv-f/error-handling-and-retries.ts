import type { Concept } from '../../types';

export const errorHandlingAndRetries: Concept = {
  id: 'error-handling-and-retries',
  title: 'Error Handling and Retries',
  summary:
    'HTTP status codes the Claude API returns, the SDK exception hierarchy, built-in retries and backoff, timeouts, retry-after, idempotency, and how to handle truncation and refusals that are not errors at all.',
  certs: ['ccdv-f', 'ccar-f', 'ccar-p'],
  domains: ['ccdv-f-2', 'ccdv-f-4', 'ccar-f-5', 'ccar-p-3'],
  tags: ['errors', 'retries', 'reliability', 'sdk', 'api'],
  difficulty: 'intermediate',
  sections: [
    {
      heading: 'Status codes and what they mean',
      body: `Every non-2xx response carries a JSON body with \`type: "error"\`, an \`error.type\`, a human-readable \`message\` and a \`request_id\`. Log the request id; it is what Anthropic support needs.

| Code | error.type | Retry? | Typical cause |
|---|---|---|---|
| 400 | \`invalid_request_error\` | No | Bad JSON, missing field, roles not alternating, removed parameter (\`temperature\`, \`budget_tokens\`), unknown beta |
| 401 | \`authentication_error\` | No | Missing, revoked or wrong key; stale env var overriding a login |
| 403 | \`permission_error\` | No | Credential's org or workspace not allowed; region or access restriction |
| 404 | \`not_found_error\` | No | Typo in model id, retired model, or a model your org cannot use |
| 413 | \`request_too_large\` | No | Body over the size limit; too many image or document bytes |
| 429 | \`rate_limit_error\` | Yes, after \`retry-after\` | RPM, TPM or TPD exceeded |
| 500 | \`api_error\` | Yes | Transient server problem |
| 529 | \`overloaded_error\` | Yes | Capacity; back off, consider another model or time |

Two subtleties matter on the exam. A model your organisation cannot use returns the same 404 as a typo, so check \`GET /v1/models\` rather than assuming a spelling mistake. And a beta header your organisation is not enabled for is a 400, not a 403.`,
    },
    {
      heading: 'SDK typed exceptions',
      body: `The SDKs map each status to a class so you never string-match messages:

- Python (\`anthropic.*\`): \`BadRequestError\`, \`AuthenticationError\`, \`PermissionDeniedError\`, \`NotFoundError\`, \`UnprocessableEntityError\`, \`RateLimitError\`, \`InternalServerError\`; all subclass \`APIStatusError\` (has \`.status_code\`, \`.message\`, \`.response\`). Network failures before any response raise \`APIConnectionError\`, with \`APITimeoutError\` as its subclass. \`APIError\` is the common base.
- TypeScript (\`Anthropic.*\`): the same names. Note that \`APIConnectionError\` is a subclass of \`APIError\` in TypeScript, so check it before the base class.

Catch most-specific first and give each category its own branch: retryable (429, 5xx, connection) versus non-retryable (other 4xx). A single broad catch throws away the information the SDK worked to give you. The \`retry-after\` header is available on \`e.response.headers\` for a 429.`,
    },
    {
      heading: 'Built-in retries, backoff and timeouts',
      body: `You usually do not need your own retry loop. The SDKs automatically retry connection errors, 408, 409, 429 and all 5xx responses with exponential backoff and jitter, honouring \`retry-after\` when present. The default is **2 retries**; configure it with \`max_retries\` on the client or per call with \`with_options(max_retries=...)\` (Python) / request options (TypeScript). \`max_retries=0\` disables retries, which you want when the caller is already retrying or when a duplicate call would be expensive.

The default request timeout is **10 minutes**. On timeout the SDK raises \`APITimeoutError\` and retries per \`max_retries\`. Set shorter timeouts for interactive paths and use streaming for long generations rather than raising the timeout to an hour; the SDK refuses non-streaming requests it expects to exceed roughly 10 minutes.

Write your own retry logic only when you need behaviour the SDK does not offer, for example falling back to a different model after repeated 529s, or a circuit breaker across many workers. Even then, retry only retryable classes; retrying a 400 forever is a classic bug.`,
    },
    {
      heading: 'Idempotency and side effects',
      body: `A Messages call is **read-like from your system's point of view**: retrying it costs tokens but does not corrupt state. That is why automatic retries are safe. The danger is in what you do with the result. If a tool call "create invoice" ran, the network dropped, and your harness retries the same turn, the model may ask to create the invoice again.

Design so that duplicates are harmless:

- Give every tool side effect an idempotency key derived from the \`tool_use\` id or a business key, and make the executor check-and-skip.
- Persist the transcript after each step so a crash resumes from the last completed tool result instead of re-running the turn.
- Keep retries at one layer. If the SDK retries and your worker queue retries and your orchestrator retries, a transient 529 becomes 27 calls.
- Treat the model's response as a request for an action, and the action's own confirmation as the record of truth.`,
    },
    {
      heading: 'Successful responses that still need handling',
      body: `Some failures arrive with HTTP 200. The two you must handle:

**\`stop_reason: "max_tokens"\`.** The output is truncated. Never present it as complete and never execute a truncated \`tool_use\`. Options: raise \`max_tokens\`, stream, split the task, or continue the generation in a follow-up turn.

**\`stop_reason: "refusal"\`.** Claude declined on safety grounds. Read \`stop_details\` (category, explanation), log it, and show the user an honest message. Do not loop on retries hoping for a different answer; the same input produces the same decision. On the first-party API a beta server-side \`fallbacks\` parameter can route a refused request to another model within the call; elsewhere the SDK offers a client-side fallback middleware.

Also watch \`is_error: true\` on your own \`tool_result\` blocks: that is how you tell the model a tool failed so it can recover, instead of throwing inside the loop and losing the turn.`,
    },
  ],
  examples: [
    {
      title: 'A typed exception chain',
      description:
        'A service distinguishes bad requests (bug, alert the team), rate limits (back off using retry-after), server errors (let the SDK retry, then degrade) and connection failures.',
      language: 'python',
      code: `import anthropic

client = anthropic.Anthropic(max_retries=3, timeout=60.0)
try:
    resp = client.messages.create(model="claude-opus-5-5", max_tokens=1024,
                                  messages=[{"role": "user", "content": q}])
except anthropic.BadRequestError as e:
    alert("bug in request", e.message, e.request_id)       # do not retry
except anthropic.RateLimitError as e:
    wait = int(e.response.headers.get("retry-after", "30"))
    queue.retry_in(seconds=wait)
except anthropic.APIStatusError as e:                        # 5xx after SDK retries
    degrade(f"api {e.status_code}")
except anthropic.APIConnectionError:
    degrade("network")`,
      takeaway: 'Most-specific first; retryable and non-retryable errors get different branches.',
    },
    {
      title: 'Idempotent tool execution in an agent loop',
      description:
        'A procurement agent calls create_purchase_order. The executor keys the side effect on the tool_use id so a retried turn cannot create a duplicate order.',
      language: 'typescript',
      code: `async function execute(block: Anthropic.ToolUseBlock) {
  const existing = await db.toolRuns.get(block.id);      // idempotency key
  if (existing) return existing.result;                  // replayed turn: skip

  const result = await purchasing.createOrder(block.input as OrderInput);
  await db.toolRuns.put(block.id, { result });
  return result;
}`,
      takeaway: 'Make side effects idempotent on the tool_use id; retries then cost tokens, not duplicate orders.',
    },
    {
      title: 'Mistake: retrying a 400 and treating a 200 as success',
      description:
        'A batch worker wrapped every call in "retry 5 times on any exception" and also returned whatever text came back. Requests with a removed parameter failed five times each (same 400 every time), and truncated answers with stop_reason max_tokens were saved as final. The fix separated retryable from non-retryable classes and checked stop_reason.',
      language: 'python',
      code: `# Before
for _ in range(5):
    try:
        return client.messages.create(**req).content[0].text
    except Exception:
        time.sleep(2)

# After
try:
    resp = client.messages.create(**req)          # SDK already retries 429/5xx
except anthropic.APIStatusError as e:
    if e.status_code < 500 and e.status_code != 429:
        raise                                     # fix the request, don't retry
    raise
if resp.stop_reason == "max_tokens":
    raise Truncated(resp)`,
      takeaway: 'Retry only retryable errors, and check stop_reason because a 200 can still be an incomplete answer.',
    },
  ],
  keyPoints: [
    'Retryable: 429, 500, 529 (and 408/409, connection errors). Non-retryable: 400, 401, 403, 404, 413.',
    'Error bodies carry error.type, message and request_id; log the request id.',
    'A model your org cannot use returns the same 404 as a typo; check the Models API.',
    'SDK exceptions: BadRequestError, AuthenticationError, PermissionDeniedError, NotFoundError, RateLimitError, InternalServerError (all APIStatusError), APIConnectionError and APITimeoutError.',
    'SDKs retry automatically with exponential backoff and retry-after; default max_retries is 2; default timeout is 10 minutes.',
    'Keep retries at one layer and make tool side effects idempotent (key on tool_use id).',
    'stop_reason max_tokens means truncated output; stop_reason refusal means a safety decline with stop_details. Both arrive as HTTP 200.',
    'Use is_error: true on tool_result to let the model recover from tool failures.',
  ],
  flashcards: [
    { front: 'Which status codes does the SDK retry automatically?', back: 'Connection errors, 408, 409, 429 and all 5xx (including 529), with exponential backoff.' },
    { front: 'Default number of SDK retries and default timeout?', back: '2 retries; 10-minute timeout.' },
    { front: 'What does a 529 mean?', back: 'overloaded_error: the API is at capacity. Back off and retry; consider another model or time.' },
    { front: 'Python exception for a 429?', back: 'anthropic.RateLimitError (subclass of APIStatusError).' },
    { front: 'Which exception represents a network failure before any HTTP response?', back: 'APIConnectionError (APITimeoutError is its subclass).' },
    { front: 'A 404 for a correctly spelled model id most likely means what?', back: 'Your organisation cannot use that model; the API does not distinguish it from a nonexistent id. Check GET /v1/models.' },
    { front: 'Why are automatic retries of a Messages call safe?', back: 'The call itself has no side effects on your systems; side effects live in tool execution, which you must make idempotent.' },
    { front: 'How should a refusal stop reason be handled?', back: 'Read stop_details, log, show an honest message; do not retry in a loop. Optionally use server-side fallbacks (beta).' },
    { front: 'How do you tell the model a tool failed?', back: 'Return a tool_result with is_error: true and a description of the failure.' },
    { front: 'Which header tells you how long to wait after a 429?', back: 'retry-after (seconds).' },
  ],
  quiz: [
    {
      question:
        'A worker retries every exception five times with a fixed two-second sleep. Logs show the same 400 "temperature is not supported" repeated five times per request. What is the best fix?',
      options: [
        'Increase the retry count to ten so transient issues resolve.',
        'Retry only retryable errors (429, 5xx, connection) and fix the request so the 400 stops occurring.',
        'Catch the 400 and resend with a different model.',
        'Add a longer sleep between retries.',
      ],
      correct: [1],
      explanation:
        'A 400 is a client bug and will fail identically every time. More retries or longer sleeps waste time; changing the model does not remove the invalid parameter.',
    },
    {
      question: 'A request to a correctly spelled current model returns 404 not_found_error. What should the developer check first?',
      options: [
        'Whether the API key is expired.',
        'Whether the organisation has access to that model, via GET /v1/models.',
        'Whether max_tokens exceeds the limit.',
        'Whether the request body is valid JSON.',
      ],
      correct: [1],
      explanation:
        'The API returns the same 404 for a model the org cannot use as for a nonexistent id. An expired key gives 401, a bad max_tokens or JSON gives 400.',
    },
    {
      question: 'Which TWO statements about SDK error handling are correct? (Select two)',
      options: [
        'The SDK retries 400 errors by default.',
        'RateLimitError and InternalServerError are both subclasses of APIStatusError in Python.',
        'max_retries can be set on the client or overridden per request.',
        'A refusal is raised as an exception by the SDK.',
      ],
      correct: [1, 2],
      explanation:
        'Status-code exceptions share APIStatusError, and max_retries is configurable at both levels. 400s are not retried, and a refusal is a normal 200 response with stop_reason refusal, not an exception.',
    },
    {
      question: 'An agent that books travel occasionally books the same flight twice after a network blip. What is the most appropriate fix?',
      options: [
        'Set max_retries to 0 on the SDK client and accept failed calls.',
        'Key the booking tool\'s side effect on the tool_use id so a replayed turn is skipped.',
        'Add "do not book twice" to the system prompt.',
        'Switch to the Batches API.',
      ],
      correct: [1],
      explanation:
        'Idempotent tool execution is the enforceable control. Disabling retries hurts reliability, a prompt instruction is not a guarantee, and batches cannot run tool loops.',
    },
    {
      question: 'A response returns HTTP 200 with stop_reason "max_tokens". How should the application treat it?',
      options: [
        'As a complete answer, since the status was 200.',
        'As truncated output: do not execute any tool_use in it and recover by raising max_tokens, streaming or continuing.',
        'As a rate limit; wait and retry.',
        'As a refusal; show stop_details.',
      ],
      correct: [1],
      explanation:
        'max_tokens signals truncation despite the 200. It is not a rate limit or a refusal, and stop_details is only present for refusals.',
    },
  ],
  statements: [
    { text: 'The SDK retries 429 and 5xx responses automatically by default.', isTrue: true, explanation: 'Two retries with exponential backoff, honouring retry-after.' },
    { text: 'A 403 is the normal response when a model is not available to your organisation.', isTrue: false, explanation: 'That case returns a 404 identical to a nonexistent model; 403 is for org, workspace or region restrictions.' },
    { text: 'A refusal is delivered as HTTP 200 with stop_reason "refusal".', isTrue: true, explanation: 'Check stop_details; it is not an exception.' },
    { text: 'Retrying a request with an unknown beta header will eventually succeed.', isTrue: false, explanation: 'It is a 400 every time; fix the header.' },
    { text: 'The default SDK request timeout is 10 minutes.', isTrue: true, explanation: 'Set shorter timeouts for interactive paths and stream long generations.' },
    { text: 'Because Messages calls have no side effects on your systems, retrying them is safe; side-effect safety must be built into tool execution.', isTrue: true, explanation: 'Key tool side effects on the tool_use id or a business key.' },
    { text: 'In Python, APIConnectionError is a subclass of APIStatusError.', isTrue: false, explanation: 'It is a sibling (no HTTP response was received). In TypeScript it subclasses APIError.' },
  ],
  resources: [
    { label: 'Errors', url: 'https://platform.claude.com/docs/en/api/errors' },
    { label: 'Rate limits', url: 'https://platform.claude.com/docs/en/api/rate-limits' },
    { label: 'Handling stop reasons', url: 'https://platform.claude.com/docs/en/build-with-claude/handling-stop-reasons' },
  ],
};
