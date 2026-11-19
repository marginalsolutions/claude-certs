import type { Concept } from '../../types';

export const debuggingClaudeApplications: Concept = {
  id: 'debugging-claude-applications',
  title: 'Debugging Claude Applications',
  summary:
    'How to tell an integration bug from a model-output problem, read agent traces, reproduce failures with fixed inputs, and apply the right recovery strategy for each common failure mode.',
  certs: ['ccdv-f', 'ccar-f', 'ccar-p'],
  domains: ['ccdv-f-4', 'ccdv-f-2', 'ccar-f-5', 'ccar-p-4', 'ccar-p-7'],
  tags: ['debugging', 'errors', 'tracing', 'observability', 'reliability'],
  difficulty: 'intermediate',
  sections: [
    {
      heading: 'Two layers, two kinds of bug',
      body: `Every Claude application has an **integration layer** (your code, the SDK, the network, the API) and a **model layer** (what Claude generated). The first debugging question is always: which layer failed?

| Symptom | Layer | Typical cause |
|---|---|---|
| HTTP 400 \`invalid_request_error\` | Integration | Bad parameter: \`temperature\` on a current model, \`budget_tokens\`, forced \`tool_choice\`, non-alternating roles, unknown beta header |
| 401 / 403 / 404 | Integration | Wrong or missing key, org not entitled, typo in model id (\`claude-sonnet-4.6\` instead of \`claude-sonnet-4-6\`) |
| 429 / 500 / 529 | Integration (transient) | Rate limit, service issue, overload; retry with backoff |
| \`stop_reason: max_tokens\` | Model/config | Output truncated; raise \`max_tokens\` or ask for less |
| \`stop_reason: refusal\` | Model (safety) | Classifier declined; handle before reading content |
| Valid 200 but wrong answer, wrong tool, bad JSON | Model | Prompt, tool description, schema or model choice |

Integration errors are deterministic and come with a status code, an error type and a \`request_id\`; fix the request. Model problems return 200 and need prompt, tool or eval work. A surprisingly common mistake is treating a 400 as "the model is confused" or treating a hallucinated field as "the API is broken". Log enough to tell them apart: status, error type, \`request_id\`, \`stop_reason\`, and the full \`usage\` block on every call.`,
    },
    {
      heading: 'Trace analysis for agent runs',
      body: `An agent failure is rarely in the last step. To find where a run went wrong you need a **trace**: the ordered list of every model call with its input messages, the tool calls Claude requested (name and arguments), the tool results your code returned, \`stop_reason\`, token usage and latency. Store the trace per run with a correlation id so one bad outcome can be replayed end to end.

Read traces backwards from the failure:

1. **Was the final answer wrong because of a bad tool result?** Check the result your code fed back. Empty strings, stack traces, or a silently swallowed exception teach the model that the tool "worked".
2. **Did Claude pick the wrong tool or wrong arguments?** Compare the tool description to what the user asked. Overlapping descriptions and vague parameter docs are the usual culprit.
3. **Did the loop stall?** Repeated identical tool calls mean the model is not getting new information; a result that never changes or an error message without guidance causes it.
4. **Did context overflow or compaction drop something?** Look at input token counts across turns; a drop followed by a mistake points at lost context.
5. **Did a cache miss or a parameter change creep in?** A sudden fall in \`cache_read_input_tokens\` often coincides with a config change that also altered behaviour.

Streaming makes traces harder to assemble; use the SDK's \`get_final_message()\` / \`finalMessage()\` to log the complete assembled message rather than individual deltas.`,
    },
    {
      heading: 'Reproduce, isolate, then fix',
      body: `LLM output is non-deterministic, so "run it again" is a weak test. Make the failure reproducible:

- **Freeze the input.** Save the exact request body (system prompt, tools, messages, parameters) from the failing trace and replay it against the API. If the bad behaviour recurs most of the time, it is a prompt or schema issue; if it was a one-off, decide whether retry logic or validation should have caught it.
- **Bisect the context.** Remove tools, trim history, or swap the user message to find the smallest input that still fails. Many "the model ignores my instruction" bugs disappear when a conflicting earlier instruction or a huge tool result is removed.
- **Separate the layers.** Call the API directly with the frozen request and bypass your application code. If the direct call works, the bug is in how your code builds or parses the request.
- **Fix at the right place.** Malformed JSON: use structured outputs or a tool schema, not a regex. Wrong tool: rewrite descriptions and add examples of when *not* to use it. Truncation: raise \`max_tokens\` or stream. Lost instructions in long sessions: move them to the system prompt, re-inject them, or compact earlier.

Keep the frozen failing request as a regression case in your eval set so the fix is checked on every future prompt or model change.`,
    },
    {
      heading: 'Recovery strategies by failure mode',
      body: `| Failure | Detect by | Recover by |
|---|---|---|
| Transient 429/5xx/529 | Status code | SDK retries with exponential backoff (default \`max_retries=2\`); honour \`retry-after\`; queue or shed load |
| Truncated output | \`stop_reason == "max_tokens"\` | Raise \`max_tokens\`, stream long answers, or ask for a shorter format; never parse a partial JSON |
| Malformed structured output | Schema validation fails | Use \`output_config.format\` or a strict tool schema; on failure re-prompt with the validator's error message once, then fail closed |
| Wrong tool chosen | Trace shows mismatched tool | Sharpen descriptions, remove overlapping tools, add negative examples; for mandatory structure use structured outputs (forced \`tool_choice\` is rejected on current models) |
| Tool error loop | Same call repeated | Return structured error text that says what to do differently (\`"customer_id must be numeric; you sent 'ab12'"\`) rather than a bare exception |
| Context overflow | 400 on size, or quality decay with large \`input_tokens\` | Prune old tool results (context editing), compact, summarise, or isolate in subagents |
| Refusal | \`stop_reason == "refusal"\`, \`stop_details\` | Show a safe message; server-side \`fallbacks\` (beta) can route to another model where available |
| \`pause_turn\` | \`stop_reason == "pause_turn"\` | Send the conversation back unchanged to let the server tool continue |

The common thread: detect with a *field you can test*, not by eyeballing text, and recover with the smallest change that addresses the actual layer.`,
    },
  ],
  examples: [
    {
      title: 'Logging what you need to debug later',
      description:
        'A team could not explain intermittent bad answers because they logged only the final text. Logging status, request_id, stop_reason and usage per call made the pattern obvious: every bad answer had stop_reason max_tokens.',
      language: 'python',
      code: `import logging, time
log = logging.getLogger("claude")

def call(client, **req):
    t0 = time.time()
    try:
        resp = client.messages.create(**req)
    except anthropic.APIStatusError as e:
        log.error("api_error status=%s type=%s request_id=%s",
                  e.status_code, e.body.get("error", {}).get("type"), e.request_id)
        raise
    u = resp.usage
    log.info("ok id=%s stop=%s in=%d out=%d cache_read=%d ms=%d",
             resp.id, resp.stop_reason, u.input_tokens, u.output_tokens,
             u.cache_read_input_tokens, int((time.time() - t0) * 1000))
    return resp`,
      takeaway: 'Per-call logging of stop_reason, usage and request_id turns mysterious failures into testable facts.',
    },
    {
      title: 'Mistake: parsing truncated JSON',
      description:
        'An extraction service set max_tokens=512 and parsed the response with json.loads. Large documents produced partial JSON, the parser threw, and the service retried the same request forever. The fix checks stop_reason first and uses structured outputs so the model stops cleanly.',
      language: 'python',
      code: `resp = client.messages.create(
    model="claude-opus-5-5",
    max_tokens=4096,                       # sized for the largest expected record
    output_config={"format": {"type": "json_schema", "schema": INVOICE_SCHEMA}},
    messages=[{"role": "user", "content": doc}],
)
if resp.stop_reason == "max_tokens":
    raise TruncatedOutput(resp.id)         # do not json.loads a partial body
invoice = Invoice.model_validate_json(resp.content[0].text)`,
      takeaway: 'Check stop_reason before parsing; a retry cannot fix an output limit that is too small.',
    },
    {
      title: 'Reading a trace for a wrong-tool failure',
      description:
        'A support agent kept calling `search_orders` when users asked about refunds, then answered "no orders found". The trace showed both `search_orders` and `lookup_refund` described as "look up customer order information". Rewriting the descriptions ("search_orders: find orders by date or product; lookup_refund: status of an existing refund request by order id") fixed 90% of cases without touching the model.',
      language: 'text',
      code: `turn 3  assistant -> tool_use search_orders {"query": "refund for order 8812"}
turn 3  user      <- tool_result "[]"
turn 4  assistant -> text "I could not find any orders."   <-- wrong tool, empty result, confident answer`,
      takeaway: 'Wrong-tool errors are usually description errors; the trace shows you which descriptions overlap.',
    },
    {
      title: 'Tool errors that teach the model',
      description:
        'A tool raised a Python exception that the harness returned verbatim ("KeyError: customer_id"). Claude retried with the same arguments three times. Returning a structured message with the fix ended the loop.',
      language: 'typescript',
      code: `// Before: toolResult = String(err)   // "KeyError: customer_id"
// After:
const toolResult = {
  type: "tool_result",
  tool_use_id: call.id,
  is_error: true,
  content: "customer_id is required and must be the numeric id from get_customer. " +
           "Call get_customer with the email first, then retry.",
};`,
      takeaway: 'Error text is a prompt: tell the model what to do next, not just what went wrong.',
    },
  ],
  keyPoints: [
    'First question: integration layer (status code, error type, request_id) or model layer (200 with wrong content)?',
    '400s on current models are usually removed parameters: temperature/top_p/top_k, budget_tokens, prefill, forced tool_choice.',
    'Log stop_reason and the full usage block on every call; stop_reason max_tokens means truncation, refusal means a safety classifier declined.',
    'A trace is the ordered record of model calls, tool calls, tool results and usage; read it backwards from the failure.',
    'Reproduce by freezing the exact request and replaying; bisect context to find the smallest failing input; keep it as a regression eval.',
    'Fix at the right place: schema for malformed JSON, descriptions for wrong tools, max_tokens/streaming for truncation, pruning or subagents for overflow.',
    'Tool error messages are prompts; make them say what to do differently to break retry loops.',
    'SDKs retry 429/5xx with exponential backoff by default (max_retries=2); honour retry-after.',
  ],
  flashcards: [
    { front: 'A request returns 400 invalid_request_error mentioning temperature. Which layer is at fault?', back: 'Integration layer: sampling parameters are rejected on current models/API version. Remove the parameter.' },
    { front: 'What does stop_reason "max_tokens" tell you?', back: 'The output was truncated at the limit; raise max_tokens, stream, or request a shorter format. Never parse the partial body.' },
    { front: 'What is an agent trace?', back: 'The ordered record of every model call, tool call (name + args), tool result, stop_reason, usage and latency for one run.' },
    { front: 'Repeated identical tool calls in a trace usually indicate what?', back: 'The model is not getting new information: an unchanging or unhelpful tool result or an error without guidance.' },
    { front: 'How do you make a non-deterministic failure reproducible?', back: 'Freeze the exact request body from the trace and replay it; bisect the context to the smallest failing input.' },
    { front: 'Best fix for malformed JSON output?', back: 'Structured outputs (output_config.format) or a strict tool schema plus validation, not regex clean-up.' },
    { front: 'Which stop_reason has stop_details populated?', back: 'refusal.' },
    { front: 'How should a tool report an error so the agent recovers?', back: 'Return a tool_result with is_error: true and text that explains what to change (e.g. required field format), not a raw exception.' },
    { front: 'Default SDK retry behaviour?', back: 'Automatic exponential backoff on 429 and 5xx/529, max_retries=2 by default; configurable.' },
  ],
  quiz: [
    {
      question:
        'After upgrading to claude-opus-5-5, every request fails with HTTP 400 and the message mentions `thinking.type.enabled`. What is the MOST likely cause and fix?',
      options: [
        'The model is overloaded; retry with backoff.',
        'The code still sends thinking with budget_tokens; remove it and control depth with output_config.effort.',
        'The system prompt is too long for the new model; compact it.',
        'The API key lacks permission for Opus; rotate the key.',
      ],
      correct: [1],
      explanation:
        'A 400 is a deterministic integration error, and budget_tokens is removed on current models. Overload would be 529, context size would be a different message, and permission problems return 401/403/404.',
    },
    {
      question:
        'An extraction pipeline intermittently throws JSON parse errors. Logs show stop_reason is "max_tokens" on every failing call. What should the team do FIRST?',
      options: [
        'Add a retry loop around json.loads.',
        'Increase max_tokens to fit the largest expected output and reject responses that still hit the limit.',
        'Switch to Haiku for faster responses.',
        'Ask the model in the prompt to "always return valid JSON".',
      ],
      correct: [1],
      explanation:
        'The output is truncated, so the JSON can never be complete; retrying or prompting cannot fix an output ceiling, and changing model does not change the limit you set.',
    },
    {
      question:
        'A support agent loops: it calls get_order with the same arguments five times, receiving "Error: NoneType has no attribute id" each time. Which TWO changes address the root cause? (Select two)',
      options: [
        'Return a structured tool error explaining the argument format and the prerequisite call.',
        'Raise max_turns so the agent has more attempts.',
        'Add is_error: true to the tool_result so the model treats it as a failure.',
        'Switch the loop to the Batches API.',
      ],
      correct: [0, 2],
      explanation:
        'The model needs an informative, clearly flagged error to change strategy. More turns just lengthen the loop, and batching does not support multi-turn tool loops at all.',
    },
    {
      question:
        'A user reports a wrong answer from an agent run. The final model call looks fine in isolation. What is the best next step?',
      options: [
        'Rerun the same question and see if it happens again.',
        'Walk the trace backwards and inspect the tool results that were fed into earlier turns.',
        'Increase the effort level.',
        'Add "double-check your work" to the system prompt.',
      ],
      correct: [1],
      explanation:
        'Agent failures usually originate upstream in a bad or empty tool result or a wrong tool choice. Rerunning is unreliable for non-deterministic output, and effort or prompt tweaks are guesses until the origin is isolated.',
    },
    {
      question:
        'Calls to the API start returning 429 during a traffic spike. Which recovery is MOST appropriate?',
      options: [
        'Catch the error and immediately resend the request.',
        'Rely on SDK exponential backoff, honour retry-after, and queue or shed excess load.',
        'Switch the model id to one with a 1M context window.',
        'Remove the system prompt to send fewer tokens.',
      ],
      correct: [1],
      explanation:
        '429 is a rate limit; backoff and load management are the fix. Immediate retries worsen it, context window size is unrelated, and dropping the system prompt harms quality while barely affecting request rate limits.',
    },
    {
      question: 'Which observation most strongly indicates a model-layer problem rather than an integration bug?',
      options: [
        'HTTP 404 with "model: claude-sonnet-4.6"',
        'HTTP 200, valid JSON, but a customer_id that does not exist in the source document',
        'HTTP 401 authentication_error',
        'A timeout from the HTTP client',
      ],
      correct: [1],
      explanation:
        'A successful response with fabricated content is a generation problem to address with grounding, schema, or prompt work. 404, 401 and timeouts are all integration-layer issues.',
    },
  ],
  statements: [
    { text: 'A 400 invalid_request_error means the model misunderstood the prompt.', isTrue: false, explanation: 'A 400 is rejected before generation; it is a request construction problem in the integration layer.' },
    { text: 'stop_details is populated only when stop_reason is refusal.', isTrue: true, explanation: 'Other stop reasons leave it empty.' },
    { text: 'Replaying the exact frozen request is a good way to reproduce a model-layer failure.', isTrue: true, explanation: 'It removes application code from the picture and shows how often the behaviour recurs.' },
    { text: 'The best fix for a model repeatedly choosing the wrong tool on current models is tool_choice: {type: "tool", name: ...}.', isTrue: false, explanation: 'Forced tool_choice returns 400 on Opus 5.5, Sonnet 5.5 and Fable 5.x; fix descriptions or use structured outputs instead.' },
    { text: 'Anthropic SDKs retry 429 and 5xx errors automatically with exponential backoff.', isTrue: true, explanation: 'The default is max_retries=2 and can be configured.' },
    { text: 'Returning a raw stack trace as a tool result is sufficient for the agent to recover.', isTrue: false, explanation: 'Raw exceptions often cause retry loops; tool errors should say what to do differently.' },
    { text: 'Logging only the final text output is enough to debug agent failures.', isTrue: false, explanation: 'You need stop_reason, usage, tool calls and results per step to locate where a run went wrong.' },
  ],
  resources: [
    { label: 'Errors (Claude API reference)', url: 'https://platform.claude.com/docs/en/api/errors' },
    { label: 'Handling stop reasons', url: 'https://platform.claude.com/docs/en/build-with-claude/handling-stop-reasons' },
    { label: 'Tool use: handling errors', url: 'https://platform.claude.com/docs/en/agents-and-tools/tool-use/implement-tool-use' },
  ],
};
