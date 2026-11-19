import type { Concept } from '../../types';

export const costAndTokenManagement: Concept = {
  id: 'cost-and-token-management',
  title: 'Cost and Token Management',
  summary:
    'Track usage per request, model cost from input, output, cache and batch rates, size max_tokens correctly, trim what you send, and judge success by cost per completed task rather than price per token.',
  certs: ['ccdv-f', 'ccar-f', 'ccar-p', 'ccao-f'],
  domains: ['ccdv-f-5', 'ccdv-f-2', 'ccar-f-4', 'ccar-p-2', 'ccar-p-4', 'ccao-f-3'],
  tags: ['cost', 'tokens', 'usage', 'batch', 'caching', 'optimization'],
  difficulty: 'intermediate',
  sections: [
    {
      heading: 'Where the money goes: the usage object',
      body: `Every response carries a \`usage\` block. It is the only reliable source of truth for what you were billed on that call:

| Field | Billed at |
|---|---|
| \`input_tokens\` | Uncached input, full input price |
| \`cache_creation_input_tokens\` | Input written to the prompt cache, a premium over input price (1.25x for the 5-minute TTL, 2x for 1-hour) |
| \`cache_read_input_tokens\` | Input served from cache, about 10% of input price (Opus 5.5 $0.20/MTok, Sonnet 5.5 $0.10/MTok) |
| \`output_tokens\` | Everything generated, **including thinking tokens**, at output price |

Log all four on every request with a request id, model, feature or tenant tag and latency. Aggregate them per feature per day and you have a cost dashboard that can answer "which prompt change doubled our bill" without guesswork. The Usage and Cost Admin API gives organisation-wide totals; per-request logging gives the attribution. In headless Claude Code, \`--output-format json\` reports \`total_cost_usd\`; in interactive sessions \`/cost\` shows it.`,
    },
    {
      heading: 'Cost modelling',
      body: `Cost per request is a sum of rates times token counts:

\`\`\`
cost = input_tokens * P_in
     + cache_creation_input_tokens * P_in * 1.25   (5-minute TTL)
     + cache_read_input_tokens * P_in * 0.10
     + output_tokens * P_out
\`\`\`

With Opus 5.5 at $4 / $20 per MTok, a request with 10,000 cached input tokens, 500 fresh input tokens and 800 output tokens costs roughly 10,000 x $0.0000004 + 500 x $0.000004 + 800 x $0.00002 = $0.004 + $0.002 + $0.016 = $0.022. Notice that output tokens dominate even though they are the smallest count: output is 5x the input price, and thinking counts as output. That is why effort and output format are such large cost levers.

Two multipliers change the base rates: **fast mode** doubles them (Opus 5.5: $8 / $40), and the **Message Batches API** halves them (50% off input and output) for work that can wait up to 24 hours. Build the model into a small spreadsheet or function, feed it your eval's token statistics, and multiply by expected volume before you launch. Re-run it on every model change: a new tokenizer or a different default effort shifts the numbers even when the prompt is unchanged. Use \`client.messages.count_tokens()\` to measure input tokens for a candidate prompt and model without paying for a completion.`,
    },
    {
      heading: 'The two biggest levers: caching and batching',
      body: `Most spend is repeated input: system prompts, tool definitions, documents, conversation history resent on every turn. **Prompt caching** attacks that directly and is the first lever to pull. The mechanics (prefix order tools → system → messages, \`cache_control: {type: "ephemeral"}\`, up to four breakpoints, verifying with \`cache_read_input_tokens\`) are covered in the *Prompt Caching* concept; the cost angle is that a well-cached agent loop reads most of its input at a tenth of the price, and a single volatile token above a breakpoint silently forfeits that.

**Batching** attacks the second axis: anything that does not need a response now. The Message Batches API takes up to thousands of requests, returns results within 24 hours (usually far sooner) in any order keyed by \`custom_id\`, and bills at 50%. It has no latency SLA and no multi-turn tool loop inside a batch, so it suits nightly classification, bulk extraction, eval runs, embeddings-style scoring and report generation. Caching and batching stack: a cached prefix inside a batch is discounted twice.

After those two: trim input (progressive disclosure of tools and documents, prune old tool results, compaction), reduce output (tighter formats, lower effort, no requested reasoning in the reply), and only then consider changing the model, because model choice also changes the quality ceiling.`,
    },
    {
      heading: 'max_tokens, trimming, and judging cost per task',
      body: `\`max_tokens\` is the enforced ceiling on output per response. Set it from the largest *legitimate* output you expect plus headroom, not from a wish to save money: a response cut off at \`stop_reason: max_tokens\` is wasted spend plus a retry. You are billed for tokens generated, not for the ceiling, so a generous \`max_tokens\` is free until the model uses it. Pair it with an output format that keeps answers short and, in agents, with a task budget to bound the whole loop.

Trimming input checklist: send images at the resolution the task needs; load tools on demand (tool search) rather than all at once; summarise or chunk documents; clear stale tool results with context editing; move volatile data below the cache breakpoint instead of removing the cache.

Finally, judge **cost per completed task**, not cost per request. A cheaper model that needs three attempts, or a low effort level that causes human escalations, costs more than it saves. Put cost, latency and pass rate side by side on the eval report, and track the same three in production. The Architect exams phrase this as "optimise token usage, latency and cost-performance trade-offs"; the method is the same: measure, pull the big levers first, re-measure.`,
    },
  ],
  examples: [
    {
      title: 'Per-request cost attribution',
      description:
        'A team could not tell which of twelve features drove a 40% bill increase. Tagging every request with the feature and computing cost from usage made the answer obvious within a day: one feature had broken its cache prefix.',
      language: 'python',
      code: `PRICES = {"claude-opus-5-5": (4.0, 20.0), "claude-sonnet-5-5": (2.0, 10.0),
          "claude-haiku-5-5": (0.10, 0.50)}   # $ per MTok (in, out)

def cost_usd(model: str, u) -> float:
    p_in, p_out = PRICES[model]
    return (u.input_tokens * p_in
            + u.cache_creation_input_tokens * p_in * 1.25
            + u.cache_read_input_tokens * p_in * 0.10
            + u.output_tokens * p_out) / 1_000_000

resp = client.messages.create(model="claude-opus-5-5", max_tokens=1024, system=SYSTEM,
                              messages=[{"role": "user", "content": q}])
metrics.emit("claude.cost_usd", cost_usd("claude-opus-5-5", resp.usage),
             tags={"feature": "summarize", "model": "claude-opus-5-5"})`,
      takeaway: 'Compute cost from the usage block on every call and tag it; dashboards built on estimates miss the real culprits.',
    },
    {
      title: 'Moving a nightly job to the Batches API',
      description:
        'A classification job processed 300,000 records every night with synchronous calls, hitting rate limits and paying full price. Submitting one batch halved the cost and removed the rate-limit retries.',
      language: 'python',
      code: `batch = client.messages.batches.create(requests=[
    {"custom_id": rec.id,
     "params": {"model": "claude-haiku-5-5", "max_tokens": 20,
                "system": [{"type": "text", "text": CLASSIFY_PROMPT,
                            "cache_control": {"type": "ephemeral"}}],
                "messages": [{"role": "user", "content": rec.text}]}}
    for rec in records])
# later: poll batch.id until processing_status == "ended", then
for result in client.messages.batches.results(batch.id):
    store(result.custom_id, result.result)      # results arrive in any order`,
      takeaway: 'If it can wait, batch it: 50% off, results within 24 hours, keyed by custom_id, and caching still applies.',
    },
    {
      title: 'Mistake: saving money with a tiny max_tokens',
      description:
        'To "control spend" a team set max_tokens=300 on a summarisation endpoint. Twenty percent of responses were truncated, users clicked regenerate, and total spend rose. Setting max_tokens to 1,200 (the largest legitimate summary plus headroom) and asking for a 150-word format fixed both quality and cost.',
      language: 'text',
      code: `# Before: max_tokens=300  -> 20% stop_reason=max_tokens, retries, angry users
# After:  max_tokens=1200 + "Summarise in at most 150 words." -> p99 output 260 tokens, 0 truncations`,
      takeaway: 'You pay for tokens generated, not for the ceiling; control length with the prompt and keep max_tokens as a safety net.',
    },
    {
      title: 'Cost per completed task beats price per token',
      description:
        'An eval compared Haiku 5.5 and Sonnet 5.5 on a form-filling agent. Haiku was 20x cheaper per token but needed 2.4x the turns and escalated 18% of cases to humans. Including human time, Sonnet was cheaper per completed form.',
      takeaway: 'Model the whole task, including retries, turns and human fallback, before declaring a model "cheaper".',
    },
  ],
  keyPoints: [
    'usage has four meters: input_tokens, cache_creation_input_tokens, cache_read_input_tokens, output_tokens; thinking is billed as output.',
    'cost = uncached input x P_in + cache writes x P_in x 1.25 (5-min) + cache reads x P_in x 0.10 + output x P_out; output is 5x input price.',
    'Fast mode doubles rates; the Batches API halves them (results within 24h, any order, keyed by custom_id, no tool loops).',
    'Caching and batching are the two biggest levers and they stack; then trim input, then reduce output, then reconsider the model.',
    'count_tokens measures a prompt for a specific model without generating; token counts differ between models.',
    'Size max_tokens for the largest legitimate output plus headroom; control length with the prompt, not the ceiling.',
    'Judge cost per completed task (including retries, turns and human fallback), not price per token.',
    'Re-run the cost model on every model change: tokenizers and default effort shift spend with an unchanged prompt.',
  ],
  flashcards: [
    { front: 'Which usage fields appear on every Messages response?', back: 'input_tokens, cache_creation_input_tokens, cache_read_input_tokens, output_tokens.' },
    { front: 'Are thinking tokens billed?', back: 'Yes, as output tokens.' },
    { front: 'Price of cache reads relative to input price?', back: 'About 10% (Opus 5.5 $0.20/MTok against $4 input).' },
    { front: 'Price of cache writes relative to input price?', back: 'A premium: 1.25x for the 5-minute TTL, 2x for the 1-hour TTL.' },
    { front: 'Discount of the Message Batches API?', back: '50% off input and output; results within 24 hours, no latency SLA.' },
    { front: 'How do batch results come back?', back: 'In any order, matched to your requests by custom_id.' },
    { front: 'How do you measure a prompt\'s input tokens without generating?', back: 'client.messages.count_tokens(model=..., system=..., messages=..., tools=...).' },
    { front: 'Do you pay for max_tokens or for generated tokens?', back: 'Generated tokens; a generous max_tokens costs nothing until used.' },
    { front: 'What is the right success metric for cost optimisation?', back: 'Cost per completed task, alongside latency and pass rate.' },
    { front: 'Which two levers should you pull first when reducing spend?', back: 'Prompt caching for repeated input, and batching for non-urgent work.' },
  ],
  quiz: [
    {
      question:
        'An Opus 5.5 request shows usage: input_tokens 500, cache_read_input_tokens 10,000, output_tokens 800. Which component contributes MOST to the cost?',
      options: ['The 10,000 cached input tokens', 'The 500 uncached input tokens', 'The 800 output tokens', 'They are roughly equal'],
      correct: [2],
      explanation:
        'Output is $20/MTok (800 tokens = $0.016), uncached input $4/MTok (500 = $0.002), cache reads $0.40/MTok (10,000 = $0.004). Output dominates despite the smallest count.',
    },
    {
      question:
        'A nightly job classifies 2 million records and must finish by morning but has no per-record latency requirement. Which TWO changes give the largest cost reduction? (Select two)',
      options: [
        'Submit the work through the Message Batches API.',
        'Cache the shared classification prompt with a breakpoint.',
        'Enable fast mode to finish sooner.',
        'Raise effort to max to avoid re-runs.',
      ],
      correct: [0, 1],
      explanation:
        'Batching halves the price and caching cuts the repeated prefix to about 10%; they stack. Fast mode doubles cost and max effort increases output tokens, both the opposite of the goal.',
    },
    {
      question:
        'A team lowered max_tokens from 2,000 to 400 to cut costs. Truncated responses and user retries followed, and spend went up. What is the correct approach?',
      options: [
        'Lower max_tokens further to 200 to stop the retries.',
        'Restore a max_tokens that fits the largest legitimate answer and constrain length through the prompt or output format.',
        'Switch to the Batches API for the chat endpoint.',
        'Disable thinking to save tokens.',
      ],
      correct: [1],
      explanation:
        'You pay for generated tokens, so the ceiling only causes truncation. Batch is unsuitable for interactive chat, and thinking cannot be disabled on Opus 5.5 (and lowering effort is a separate decision).',
    },
    {
      question:
        'After moving from claude-sonnet-4-6 to claude-sonnet-5-5 with the same prompts, the monthly bill rose 30% even though traffic was flat. What is the MOST likely cause?',
      options: [
        'The new model uses a tokenizer that counts more tokens per text.',
        'Prompt caching is not supported on Sonnet 5.5.',
        'Sonnet 5.5 has higher per-token prices.',
        'The Batches API discount was removed.',
      ],
      correct: [0],
      explanation:
        'Sonnet 5.5 shares Sonnet 5\'s newer tokenizer, which counts about 30% more tokens. Prices are unchanged ($2/$10), caching is supported, and batch discounts are unaffected.',
    },
    {
      question:
        'Which metric BEST tells a team whether switching an agent from Sonnet 5.5 to Haiku 5.5 actually saved money?',
      options: [
        'Price per million output tokens',
        'Average tokens per request',
        'Cost per completed task including retries, extra turns and human escalations',
        'Number of requests per day',
      ],
      correct: [2],
      explanation:
        'Only end-to-end cost per completed task captures the extra turns and fallbacks a weaker model may need. Per-token prices and per-request averages hide them.',
    },
  ],
  statements: [
    { text: 'Thinking tokens are free because they are not shown to the user.', isTrue: false, explanation: 'Thinking is billed as output tokens.' },
    { text: 'The Message Batches API offers a 50% discount but no latency guarantee.', isTrue: true, explanation: 'Results arrive within 24 hours in any order, keyed by custom_id.' },
    { text: 'You are billed for the full max_tokens value whether or not the model uses it.', isTrue: false, explanation: 'Billing is for tokens actually generated.' },
    { text: 'Prompt caching and batching discounts can be combined on the same request.', isTrue: true, explanation: 'A cached prefix inside a batch request receives both discounts.' },
    { text: 'Output tokens cost about five times as much as uncached input tokens on current models.', isTrue: true, explanation: 'E.g. Opus 5.5 $4 in / $20 out, Sonnet 5.5 $2 / $10.' },
    { text: 'Token counts from count_tokens are the same for every Claude model.', isTrue: false, explanation: 'Tokenizers differ by model; pass the model you will call.' },
    { text: 'Changing the model is the first lever to pull when reducing cost.', isTrue: false, explanation: 'Caching and batching come first; model choice also changes the quality ceiling, so it is considered last and with an eval.' },
  ],
  resources: [
    { label: 'Pricing', url: 'https://claude.com/pricing#api' },
    { label: 'Message Batches', url: 'https://platform.claude.com/docs/en/build-with-claude/batch-processing' },
    { label: 'Token counting', url: 'https://platform.claude.com/docs/en/build-with-claude/token-counting' },
    { label: 'Prompt caching', url: 'https://platform.claude.com/docs/en/build-with-claude/prompt-caching' },
  ],
};
