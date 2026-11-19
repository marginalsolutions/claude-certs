import type { Concept } from '../../types';

export const batchVsRealtime: Concept = {
  id: 'batch-vs-realtime',
  title: 'Batch vs Realtime',
  summary:
    'How the Message Batches API works (create, poll, collect by custom_id, 24-hour window, 50% discount) and how to decide between it and synchronous Messages API calls.',
  certs: ['ccdv-f', 'ccar-f', 'ccar-p'],
  domains: ['ccdv-f-2', 'ccdv-f-5', 'ccar-f-4', 'ccar-p-3', 'ccar-p-4'],
  tags: ['batches', 'cost', 'latency', 'api', 'asynchronous'],
  difficulty: 'intermediate',
  diagram: 'batch-vs-realtime',
  sections: [
    {
      heading: 'What the Batches API is',
      body: `The Message Batches API (\`POST /v1/messages/batches\`) accepts a list of ordinary Messages API requests and processes them asynchronously. In exchange for giving up latency guarantees you get **50% off all token usage** in the batch, including cached and output tokens.

Mechanics:

- A batch holds up to **100,000 requests or 256 MB**. Each entry has a \`custom_id\` you choose and a \`params\` object identical to a synchronous request body (model, max_tokens, messages, system, tools, thinking, caching).
- Most batches finish within an hour; the hard ceiling is **24 hours**. Requests still unprocessed at 24 hours are marked \`expired\`.
- There is **no latency SLA**: do not build anything that waits on a batch in the request path.
- Results are available for **29 days** after creation.
- Each request is a single Messages call. A request whose response stops with \`tool_use\` just ends there; nothing executes tools and continues. **Multi-turn tool loops cannot run inside a batch.**
- Batch requests cannot set \`stream\`, \`speed\` (fast mode) or server-side \`fallbacks\`.
- Availability: the first-party Claude API and Claude Platform on AWS. Not on Amazon Bedrock, Vertex AI or Foundry.`,
    },
    {
      heading: 'Create, poll, collect',
      body: `The lifecycle has three steps:

1. **Create** with \`client.messages.batches.create(requests=[...])\`. The response has an \`id\` and \`processing_status: "in_progress"\`.
2. **Poll** with \`client.messages.batches.retrieve(id)\` until \`processing_status == "ended"\`. \`request_counts\` shows processing, succeeded, errored, canceled and expired totals. Poll on a sensible interval (tens of seconds to minutes), not in a tight loop.
3. **Collect** with \`client.messages.batches.results(id)\`, which streams a JSONL file. **Results are not in submission order.** Each line has \`custom_id\` and a \`result\` whose \`type\` is \`succeeded\`, \`errored\`, \`canceled\` or \`expired\`. Key everything by \`custom_id\`.

Handle result types individually. \`errored\` with \`invalid_request\` means fix the request before resubmitting; a server-side error is safe to retry as-is; \`expired\` means resubmit. Because \`custom_id\` identifies each item, you resubmit only the failed ones rather than the whole batch. You can also cancel a batch, which moves it to \`canceling\` and then \`ended\`, with unprocessed requests marked canceled.`,
    },
    {
      heading: 'Decision criteria',
      body: `The question the exam keeps asking is "sync or batch?" The answer follows from the workload's latency tolerance:

| Choose synchronous when | Choose batch when |
|---|---|
| A person or a blocking process is waiting (chat, pre-merge checks, interactive agents) | Results are needed later (overnight reports, weekly audits, backfills, evals, nightly test generation) |
| The task needs a tool loop or multi-step agent behaviour | Each item is one independent request |
| Volume is modest or bursty and must finish now | Volume is large and cost is the main concern |
| You need streaming or fast mode | A 24-hour worst case is acceptable |

Cost is the carrot and latency is the stick. Shaving 50% off a workload is significant only if nobody is waiting. A hybrid is common: synchronous calls for the blocking path, batches for the analytics and reprocessing paths behind it.

Scheduling against an SLA: if you promise results within 30 hours and a batch can take up to 24, you must submit at least every 4 to 6 hours so the latest item still makes it. Refine the prompt on a small synchronous sample first; a broken prompt costs the same across 50,000 batch items as across 50,000 sync calls.`,
    },
    {
      heading: 'Caching, errors and operations inside batches',
      body: `Prompt caching works inside batches, but the five-minute default cache lifetime interacts badly with requests that are processed hours apart. If many items share a long prefix, use the one-hour TTL and expect fewer hits than in a tight synchronous loop. Put the shared prefix (system prompt, document) first and the per-item content last, exactly as you would synchronously.

Rate limits for batches are separate from synchronous limits, which is another reason to move background volume out of the realtime path. Per-request errors inside a batch do not fail the batch; they appear as \`errored\` results. The forced \`tool_choice\` restriction, the removal of sampling parameters and all other model rules apply to each \`params\` object exactly as they would to a live call, and the API version used when the batch was created governs validation of every request inside it.`,
    },
  ],
  examples: [
    {
      title: 'Overnight classification of 10,000 tickets',
      description:
        'A support team needs sentiment and category for every ticket from the day, ready by 8 a.m. Nobody is waiting, so a batch at midnight saves half the cost. Results are collected by custom_id so they can be joined back to ticket ids.',
      language: 'python',
      code: `from anthropic.types.message_create_params import MessageCreateParamsNonStreaming
from anthropic.types.messages.batch_create_params import Request

batch = client.messages.batches.create(requests=[
    Request(custom_id=f"ticket-{t.id}", params=MessageCreateParamsNonStreaming(
        model="claude-haiku-5-5", max_tokens=200,
        output_config={"effort": "low"},
        system=CLASSIFY_PROMPT,
        messages=[{"role": "user", "content": t.text}],
    )) for t in tickets
])

# later: poll until ended, then collect
for r in client.messages.batches.results(batch.id):
    if r.result.type == "succeeded":
        save(r.custom_id, r.result.message.content[0].text)
    else:
        failed.append(r.custom_id)   # resubmit just these`,
      takeaway: 'custom_id is the join key; results arrive in any order and only failures get resubmitted.',
    },
    {
      title: 'Polling with a sane interval in TypeScript',
      description:
        'A nightly job submits a batch and polls every two minutes. It stops on "ended" and reports request_counts for monitoring.',
      language: 'typescript',
      code: `let batch = await client.messages.batches.create({ requests });

while (batch.processing_status !== "ended") {
  await new Promise((r) => setTimeout(r, 120_000));
  batch = await client.messages.batches.retrieve(batch.id);
}
metrics.gauge("batch.succeeded", batch.request_counts.succeeded);
metrics.gauge("batch.errored", batch.request_counts.errored);

for await (const r of await client.messages.batches.results(batch.id)) {
  handle(r.custom_id, r.result);
}`,
      takeaway: 'Poll processing_status until "ended"; never block a user request on a batch.',
    },
    {
      title: 'Mistake: batching a blocking pre-merge check',
      description:
        'A platform team moved both their nightly tech-debt report and their pre-merge PR review to batches to save 50%. Developers started waiting hours for PR feedback. The fix was to keep the pre-merge review synchronous and batch only the nightly report.',
      language: 'text',
      code: `Workflow                   Someone waiting?   API
pre-merge PR review        yes (developer)    synchronous Messages API
nightly tech-debt report   no                 Message Batches API (-50%)
weekly dependency audit    no                 Message Batches API (-50%)`,
      takeaway: 'Batch only latency-tolerant work; blocking workflows stay synchronous regardless of the discount.',
    },
  ],
  keyPoints: [
    'Batches process standard Messages requests asynchronously at 50% off all token usage.',
    'Up to 100,000 requests or 256 MB per batch; most finish within an hour; hard limit 24 hours; no latency SLA.',
    'Lifecycle: create, poll processing_status until "ended", collect results as JSONL.',
    'Results arrive in any order; correlate with custom_id. Result types: succeeded, errored, canceled, expired.',
    'No multi-turn tool loops inside a batch; each request is one call. No stream, speed or fallbacks.',
    'Available on the Claude API and Claude Platform on AWS only; not Bedrock, Vertex or Foundry.',
    'Choose sync when a person or blocking process waits or a tool loop is needed; batch for overnight, bulk, evals and backfills.',
    'Resubmit only failed custom_ids; test the prompt on a synchronous sample first.',
  ],
  flashcards: [
    { front: 'Discount offered by the Message Batches API?', back: '50% on all token usage in the batch.' },
    { front: 'Maximum processing window for a batch?', back: '24 hours; unprocessed requests are marked expired.' },
    { front: 'Maximum size of a single batch?', back: '100,000 requests or 256 MB.' },
    { front: 'How do you match a batch result to its request?', back: 'By custom_id; results are returned in arbitrary order.' },
    { front: 'Which processing_status value means the batch is done?', back: '"ended".' },
    { front: 'Four result types in a batch output?', back: 'succeeded, errored, canceled, expired.' },
    { front: 'Can an agent run a tool loop inside a batch request?', back: 'No. Each request is a single Messages call; a tool_use stop ends it.' },
    { front: 'Which platforms offer the Batches API?', back: 'The first-party Claude API and Claude Platform on AWS; not Bedrock, Vertex or Foundry.' },
    { front: 'How long are batch results retrievable?', back: '29 days after creation.' },
    { front: 'A 30-hour SLA with a 24-hour batch window implies what submission cadence?', back: 'Submit at least every 4 to 6 hours so the last item still finishes within the SLA.' },
  ],
  quiz: [
    {
      question:
        'A developer must process 10,000 documents overnight for a non-urgent analytics report. Cost is the primary concern and results are not needed until morning. Which approach best fits?',
      options: [
        'Send every request synchronously in parallel to finish as fast as possible.',
        'Use the Message Batches API, which processes large asynchronous workloads within 24 hours at reduced cost.',
        'Lower max_tokens on synchronous calls to reduce cost.',
        'Switch to the smallest model regardless of output quality.',
      ],
      correct: [1],
      explanation:
        'The workload is latency tolerant and high volume, exactly what batches are for. Parallel sync calls cost full price, lowering max_tokens risks truncation, and downsizing the model trades quality rather than addressing the batch-versus-realtime decision.',
    },
    {
      question: 'A team proposes moving both a nightly tech-debt report and a blocking pre-merge PR check to the Batches API for the discount. What should an architect recommend?',
      options: [
        'Batch both; add polling so developers can check status.',
        'Batch the nightly report; keep the pre-merge check synchronous.',
        'Keep both synchronous to avoid result-ordering problems.',
        'Batch both with a timeout that falls back to synchronous calls.',
      ],
      correct: [1],
      explanation:
        'Batches can take up to 24 hours, which is unacceptable for a blocking check but ideal overnight. Ordering is solved by custom_id, and a timeout fallback still leaves developers waiting first.',
    },
    {
      question: 'Which TWO statements about batch results are correct? (Select two)',
      options: [
        'Results are returned in the order requests were submitted.',
        'Each result is identified by the custom_id supplied at creation.',
        'A failed request fails the entire batch.',
        'Result types include succeeded, errored, canceled and expired.',
      ],
      correct: [1, 3],
      explanation:
        'Results arrive in arbitrary order keyed by custom_id, and individual failures appear as errored results without failing the batch.',
    },
    {
      question: 'A nightly batch of agentic code fixes returns every result with stop_reason "tool_use" and no fixes applied. Why?',
      options: [
        'Tools must be declared with strict: true in batches.',
        'The Batches API does not execute tools or continue multi-turn loops; each request is a single call.',
        'The batch exceeded 256 MB.',
        'Tool use requires streaming.',
      ],
      correct: [1],
      explanation:
        'Nothing runs tools inside a batch, so a tool-calling request ends at the first tool_use. Strictness, size and streaming are unrelated.',
    },
    {
      question: 'An enterprise runs Claude through Amazon Bedrock and wants to use the Message Batches API for its backfill. What is true?',
      options: [
        'Bedrock supports batches with the same 50% discount.',
        'The Batches API is not available on Bedrock; use the first-party API or Claude Platform on AWS for the batch workload.',
        'Batches on Bedrock require the anthropic. model prefix only.',
        'Batches are available on Bedrock but limited to 1,000 requests.',
      ],
      correct: [1],
      explanation:
        'The Batches API is offered on the Claude API and Claude Platform on AWS only. Bedrock does not expose it.',
    },
  ],
  statements: [
    { text: 'The Batches API guarantees results within one hour.', isTrue: false, explanation: 'Most finish within an hour but the only guarantee is the 24-hour window; there is no latency SLA.' },
    { text: 'Batch results must be correlated using custom_id because they arrive in any order.', isTrue: true, explanation: 'Submission order is not preserved.' },
    { text: 'Prompt caching cannot be used inside a batch.', isTrue: false, explanation: 'Caching works; prefer the one-hour TTL because items may be processed hours apart.' },
    { text: 'A batch may contain up to 100,000 requests.', isTrue: true, explanation: 'Or 256 MB, whichever is reached first.' },
    { text: 'Batch requests can enable streaming to receive partial results early.', isTrue: false, explanation: 'stream cannot be set on a batch request; results are collected after the batch ends.' },
    { text: 'The 50% discount applies to output tokens as well as input tokens.', isTrue: true, explanation: 'It applies to all token usage in the batch.' },
    { text: 'If one request in a batch errors, the remaining requests are canceled.', isTrue: false, explanation: 'Each request has its own result type; others continue.' },
  ],
  resources: [
    { label: 'Message Batches', url: 'https://platform.claude.com/docs/en/build-with-claude/batch-processing' },
    { label: 'Batches API reference', url: 'https://platform.claude.com/docs/en/api/creating-message-batches' },
  ],
};
