import type { Concept } from '../../types';

export const optimizingCostLatencyPerformance: Concept = {
  id: 'optimizing-cost-latency-performance',
  title: 'Optimizing Cost, Latency and Performance',
  summary:
    'Work the optimization levers in the right order: free wins first (caching, input and loop hygiene, output limits, batching), then tradeoffs (effort, model choice, fast mode), always measured as cost per completed task against a quality bar and a latency budget.',
  certs: ['ccar-p', 'ccdv-f', 'ccar-f'],
  domains: ['ccar-p-4', 'ccar-p-2', 'ccdv-f-5', 'ccar-f-5'],
  tags: ['cost', 'latency', 'optimization', 'caching', 'batch', 'effort'],
  difficulty: 'advanced',
  diagram: 'batch-vs-realtime',
  sections: [
    {
      heading: 'The unit is cost per completed task',
      body: `Optimize **cost per completed task**, never cost per token. A higher-priced model that finishes in two turns can be cheaper than a budget model that needs five turns, fails 10% of the time, and triggers a human retry. Every judgment reads cost and quality together, which means you need an eval before you touch a tradeoff lever. Without one, you cannot tell a saving from a regression.

Compute the baseline from real \`usage\` objects rolled up per task: uncached input, cache writes, cache reads and output tokens each at their own rate (for Opus 5.5: $4 / MTok input, $20 / MTok output, cache reads around 10% of input price, writes a small premium). Where the organization has Admin API access, the Usage and Cost reports give the same split by model, workspace and API key without spending tokens.

Then profile where tokens go. Workload shape decides which levers pay: a chat with a long static system prompt is a caching problem; a 40-turn agent loop is a loop-hygiene problem; a nightly classification job is a batch problem.`,
    },
    {
      heading: 'Lever order: free wins, then tradeoffs',
      body: `The order is load-bearing. Free wins lower what you pay without lowering quality; tradeoffs exchange cost for capability and must be validated against the eval.

**Free wins (do these first, in order):**

1. **Prompt caching.** Stable prefix first (tools → system → long documents), \`cache_control\` breakpoint after it, volatile content last. Verify with \`usage.cache_read_input_tokens\`. It stays on permanently.
2. **Input hygiene.** Audit prompts, tool descriptions and skills for redundancy; load reference material progressively (tool search, skills, retrieval) instead of monolithically; trim few-shot examples to the ones that change behaviour.
3. **Loop hygiene.** In agent loops the history is resent every turn. Clear old tool results (context editing), compact long sessions, cap iterations, parallelize independent tool calls, and avoid one-call-per-item patterns where one call can process a batch of items.
4. **Output hygiene.** Ask for the format you need and nothing more; set a sensible \`max_tokens\`; use structured outputs instead of prose-wrapped JSON.
5. **Batch processing.** Anything not interactive (nightly jobs, evals, backfills, bulk classification) goes to the Message Batches API for a 50% discount; results within 24 hours, in any order, keyed by \`custom_id\`.

**Tradeoffs (validate each with the eval):**

6. **Effort.** \`output_config.effort\` (\`low\` → \`max\`) is the first tradeoff because it keeps the same model. Lower it on routine steps, raise it on hard ones.
7. **Model choice.** Last, deliberately. Route by task: Haiku 5.5 for classification and extraction at scale, Sonnet 5.5 for everyday agent and coding work, Opus 5.5 for hard reasoning, Fable 5.2 where the ceiling matters. Remember caches are per model, so a cascade across models starts cold.`,
    },
    {
      heading: 'Latency budgets',
      body: `Latency is time to first token (TTFT) plus generation time plus everything your application adds (retrieval, tool execution, retries, queueing). Set a **budget per step** from the user-facing target backwards: if the SLO is p95 under 6 s and retrieval takes 800 ms, the model call has about 5 s.

Levers specific to latency:

- **Caching** cuts TTFT because the prefix is not reprocessed.
- **Streaming** cuts *perceived* latency: the user sees text while generation continues. Required for long outputs anyway.
- **Fewer, parallel calls**: run independent tool calls concurrently; avoid sequential chains where one call would do.
- **Shorter output**: generation time scales with output tokens; a 300-token answer is faster than a 1,200-token one.
- **Effort**: lower effort means less thinking before the first visible token.
- **Fast mode** (the request-level \`speed\` setting) buys faster output on the same model for a higher price. It is a tradeoff that costs dollars, not capability, so it comes before model downgrades when quality must not change. Check current docs for rate limits and whether it shares cached prefixes with standard speed.
- **Model choice**: smaller models are faster, with a lower ceiling.
- **Hedged requests** for stall-prone operations that are safe to run twice.

Always measure p50 and p95 on the final successful request, with client retries and queueing recorded separately; otherwise the variant that hit more transient errors looks slower for the wrong reason.`,
    },
    {
      heading: 'Apply one lever at a time, and know when to stop',
      body: `Change one lever, run the eval and the cost/latency measurement, keep or revert, then move to the next. Changing three things at once tells you nothing when the number moves.

Know when **not** to optimize:

- When the system has no eval. Free wins are safe; tradeoffs are not.
- When spend is small relative to the value delivered or to engineering time. A $300/month pipeline does not justify a two-week optimization project.
- When the next lever is a tradeoff and the quality floor has no headroom. A 2% accuracy loss on a compliance workflow can cost more than the tokens saved.
- When latency is already inside the budget and users are not waiting. Faster-than-needed is wasted effort.
- When the "saving" moves cost elsewhere: a cheaper model that produces more escalations to humans has not saved anything.

Exam angle: scenarios that ask for the change that *most directly* addresses both cost and latency without discarding context are usually caching plus prompt ordering. Scenarios about non-urgent bulk work are Batch API. Scenarios where quality must be preserved while cutting cost point to effort before model downgrade. "Switch to the smallest model regardless of task fit" is almost always a distractor.`,
    },
  ],
  examples: [
    {
      title: 'Routing a nightly job to the Batch API',
      description:
        'A retailer classifies 400,000 product reviews every night with Haiku 5.5. The job has no latency requirement. Moving it from real-time calls to the Batch API halved the model cost, and the team keys results by custom_id because they arrive in any order.',
      language: 'python',
      code: `from anthropic import Anthropic
client = Anthropic()

batch = client.messages.batches.create(
    requests=[
        {
            "custom_id": review.id,
            "params": {
                "model": "claude-haiku-5-5",
                "max_tokens": 20,
                "system": [{"type": "text", "text": CLASSIFY_SYSTEM,
                            "cache_control": {"type": "ephemeral"}}],
                "messages": [{"role": "user", "content": review.text}],
            },
        }
        for review in reviews
    ]
)
print(batch.id, batch.processing_status)   # poll until "ended", then fetch results by custom_id`,
      takeaway: 'Non-interactive bulk work belongs in the Batch API; caching still applies inside batches.',
    },
    {
      title: 'The downgrade that cost more',
      description:
        'A team moved an invoice-coding workflow from Sonnet 5.5 to Haiku 5.5 to cut spend. Token cost fell 80%, but the exception rate rose from 4% to 15%, and each exception cost 12 minutes of an accountant\'s time. Fully loaded cost per completed invoice rose. They reverted to Sonnet 5.5, then applied the free wins they had skipped: caching the 6,000-token coding-rules prefix and switching the nightly backlog to the Batch API, which cut cost 55% with no quality change.',
      takeaway: 'Model downgrade is the last lever, after free wins and only with an eval that includes downstream cost.',
    },
    {
      title: 'Per-step effort in a workflow',
      description:
        'A compliance pipeline runs three steps on Opus 5.5: extract fields, check against rules, write a rationale. Extraction is routine, rule-checking is hard, the rationale is medium. Setting effort per step cut thinking tokens where they added nothing and kept quality on the step that needed it.',
      language: 'typescript',
      code: `const EFFORT: Record<Step, "low" | "medium" | "high"> = {
  extract: "low",
  check_rules: "high",
  write_rationale: "medium",
};

async function runStep(step: Step, messages: Anthropic.MessageParam[]) {
  return client.messages.create({
    model: "claude-opus-5-5",
    max_tokens: 2048,
    output_config: { effort: EFFORT[step] },
    system: SYSTEM[step],
    messages,
  });
}`,
      takeaway: 'Effort is a per-step dial; spend thinking where the eval shows it matters.',
    },
    {
      title: 'Latency budget for a support widget',
      description:
        'The SLO is p95 under 5 s to first visible text. Measured: retrieval 900 ms, model TTFT 2.8 s at p95, plus 400 ms of app overhead. The team enabled caching on the 7,000-token system prefix (TTFT fell to 1.1 s), streamed the response, and ran the two independent lookups concurrently. p95 to first text landed at 2.6 s with the same model and prompt.',
      takeaway: 'Budget latency per step and spend free wins before touching the model.',
    },
  ],
  keyPoints: [
    'Optimize cost per completed task, measured from real usage fields and including downstream failure cost.',
    'Free wins first: caching, input hygiene, loop hygiene, output hygiene, batch processing. They do not change quality.',
    'Tradeoffs last and only with an eval: effort, then model choice.',
    'Batch API: 50% discount, results within 24 hours in any order keyed by custom_id, no latency SLA; for non-interactive work.',
    'Latency = TTFT + generation + your pipeline; budget it per step from the user-facing p95 backwards.',
    'Caching cuts TTFT; streaming cuts perceived latency; shorter outputs and parallel tool calls cut wall-clock time.',
    'Fast mode trades dollars for speed on the same model; model downgrade trades capability.',
    'Apply one lever at a time, and do not optimize when there is no eval, no headroom, or no meaningful spend.',
  ],
  flashcards: [
    { front: 'What unit should cost optimization use?', back: 'Cost per completed task, not cost per token or per request.' },
    { front: 'List the free-win levers in order.', back: 'Prompt caching, input hygiene, loop hygiene, output hygiene, batch processing.' },
    { front: 'Which lever is the first tradeoff and why?', back: 'Effort (output_config.effort), because it changes thinking depth while keeping the same model.' },
    { front: 'Why is model choice the last lever?', back: 'It changes what the model can do; overshooting costs quality that free wins never touch, and caches are per model.' },
    { front: 'Batch API key facts?', back: '50% discount, results within 24 hours, any order keyed by custom_id, no latency SLA, no multi-turn tool loops inside a batch.' },
    { front: 'What does streaming improve?', back: 'Perceived latency: the user sees output while generation continues. Total generation time is unchanged.' },
    { front: 'What does fast mode trade?', back: 'Dollars for speed on the same model; capability is unchanged.' },
    { front: 'How should latency be measured for comparisons?', back: 'p50 and p95 on the final successful request; retries, backoff and queueing recorded separately.' },
    { front: 'Name three situations where you should not optimize.', back: 'No eval exists (for tradeoff levers), spend is trivial relative to value or engineering time, quality floor has no headroom.' },
    { front: 'Why does a model cascade reduce caching benefit?', back: 'Caches are scoped per model, so each model in the cascade starts cold.' },
  ],
  quiz: [
    {
      question:
        'A team wants to cut the cost of a 30-turn agent that resends the full conversation history, including large tool results, on every turn. Which change is the BEST first step?',
      options: [
        'Switch the agent to the smallest available model.',
        'Add a cache breakpoint on the latest message each turn and clear or compact old tool results.',
        'Lower max_tokens to 200.',
        'Move the agent to the Batch API.',
      ],
      correct: [1],
      explanation:
        'Caching the growing prefix and trimming stale tool results are free wins aimed at the loop\'s actual cost driver. A blind model downgrade is a tradeoff, a tiny max_tokens breaks the agent, and the Batch API does not support interactive multi-turn tool loops.',
    },
    {
      question:
        'A nightly job classifies 2 million records and must finish by 8 a.m. the next day. Which optimization delivers the largest cost reduction with no quality impact?',
      options: [
        'Use the Message Batches API.',
        'Raise effort to max.',
        'Remove the system prompt.',
        'Switch to real-time streaming requests.',
      ],
      correct: [0],
      explanation:
        'Batch processing halves the price and the job tolerates the 24-hour window. Raising effort increases cost, removing the system prompt risks quality, and streaming does not change price.',
    },
    {
      question: 'Which TWO levers reduce latency without changing the model\'s capability? (Select two)',
      options: [
        'Prompt caching of the static prefix.',
        'Downgrading from Opus 5.5 to Haiku 5.5.',
        'Running independent tool calls in parallel.',
        'Setting effort to low on every step.',
      ],
      correct: [0, 2],
      explanation:
        'Caching reduces time to first token and parallel tool calls reduce wall-clock time; neither changes what the model can do. Model downgrade and blanket low effort trade capability for speed.',
    },
    {
      question:
        'After moving a workflow to a cheaper model, token spend fell 70% but human exception handling tripled. How should the architect assess the change?',
      options: [
        'A success; token cost is the only cost that matters.',
        'A likely failure; cost per completed task including downstream human effort probably rose, so revert and apply free wins first.',
        'Neutral; quality and cost are unrelated.',
        'A success as long as latency improved.',
      ],
      correct: [1],
      explanation:
        'Cost per completed task includes the cost of failures. Token savings that create more human work are not savings. Free wins should have been exhausted before the model tradeoff.',
    },
    {
      question:
        'A compliance workflow has a quality floor of 98% and currently sits at 98.3%. Cost is 20% over budget. Which lever is MOST appropriate to try first?',
      options: [
        'Downgrade the model tier across the workflow.',
        'Lower effort to low on all steps.',
        'Apply caching and input/loop hygiene, which do not affect quality, and measure.',
        'Remove the eval so quality cannot block savings.',
      ],
      correct: [2],
      explanation:
        'With almost no quality headroom, tradeoff levers are dangerous. Free wins reduce cost without touching output quality. Removing the eval removes the only protection.',
    },
    {
      question:
        'An interactive assistant must keep Opus 5.5 quality but respond faster during peak hours. Which option directly trades money for speed without changing capability?',
      options: [
        'Fast mode (request-level speed setting).',
        'Switching to Haiku 5.5 during peaks.',
        'Disabling streaming.',
        'Raising max_tokens.',
      ],
      correct: [0],
      explanation:
        'Fast mode runs the same model faster at a higher price. Haiku changes capability, disabling streaming worsens perceived latency, and max_tokens does not affect speed.',
    },
  ],
  statements: [
    { text: 'Cost optimization should start with model downgrade because it has the largest effect.', isTrue: false, explanation: 'Model choice is the last lever; free wins (caching, hygiene, batching) come first because they do not affect quality.' },
    { text: 'Batch API results can arrive in any order and must be matched by custom_id.', isTrue: true, explanation: 'Batches have no ordering guarantee and no latency SLA; results arrive within 24 hours.' },
    { text: 'Streaming reduces the total time the model takes to generate a response.', isTrue: false, explanation: 'Streaming improves perceived latency by showing tokens as they are produced; generation time is unchanged.' },
    { text: 'Effort can be set differently per step in a multi-step workflow.', isTrue: true, explanation: 'output_config.effort is a per-request setting, so routine steps can run low and hard steps high.' },
    { text: 'Fast mode changes the model used to answer the request.', isTrue: false, explanation: 'It runs the same model faster for a higher price.' },
    { text: 'Tradeoff levers should only be applied when an eval exists to detect quality regressions.', isTrue: true, explanation: 'Without an eval, savings and regressions are indistinguishable.' },
    { text: 'Latency comparisons should include client-side retry and backoff time in the model-latency column.', isTrue: false, explanation: 'Record retries and queueing separately or the variant with more transient errors looks slower for the wrong reason.' },
  ],
  resources: [
    { label: 'Prompt caching (Claude docs)', url: 'https://platform.claude.com/docs/en/build-with-claude/prompt-caching' },
    { label: 'Message Batches (Claude docs)', url: 'https://platform.claude.com/docs/en/build-with-claude/batch-processing' },
    { label: 'Reducing latency (Claude docs)', url: 'https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-latency' },
    { label: 'Pricing', url: 'https://claude.com/pricing#api' },
  ],
};
