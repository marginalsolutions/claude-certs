import type { Concept } from '../../types';

export const modelSelectionTradeoffs: Concept = {
  id: 'model-selection-tradeoffs',
  title: 'Model Selection and Tradeoffs',
  summary:
    'How to choose between Opus, Sonnet, Haiku and Fable on quality, latency and cost; current ids and prices; the breaking changes that arrive with new releases; and why you pin a model and re-evaluate before every upgrade.',
  certs: ['ccdv-f', 'ccao-f', 'ccar-f', 'ccar-p'],
  domains: ['ccdv-f-5', 'ccdv-f-2', 'ccao-f-3', 'ccar-f-4', 'ccar-p-2', 'ccar-p-4'],
  tags: ['models', 'cost', 'latency', 'quality', 'migration'],
  difficulty: 'foundations',
  diagram: 'model-tiers',
  sections: [
    {
      heading: 'The lineup',
      body: `| Model | Id | Price (in / out per MTok) | Fit |
|---|---|---|---|
| Claude Fable 5.2 | \`claude-fable-5-2\` | $8 / $40 | Most capable widely released model: hardest reasoning, long-horizon agents, when Opus at high effort still falls short |
| Claude Opus 5.5 | \`claude-opus-5-5\` | $4 / $20 | Default recommendation: complex coding, agentic and knowledge work |
| Claude Sonnet 5.5 | \`claude-sonnet-5-5\` | $2 / $10 | Everyday coding and agent work; strong quality at half the Opus price |
| Claude Haiku 5.5 | \`claude-haiku-5-5\` | $0.10 / $0.50 (prompts up to 100K tokens; higher above) | High-volume, latency-sensitive: classification, routing, extraction, subagents |

Older models still served include Opus 5, Opus 4.8/4.7/4.6, Sonnet 5 and 4.6, and Haiku 4.5. All current models have a 1M-token context window and 128K max output (Haiku 4.5: 200K / 64K). All support adaptive thinking, effort levels, structured outputs, vision and tool use; the differences are the capability ceiling, speed and price.

Never append date suffixes to current ids (\`claude-opus-5-5\`, not \`claude-opus-5-5-2026xxxx\`). Query \`client.models.retrieve(id)\` or \`client.models.list()\` (the Models API) for live context limits and capability flags instead of hard-coding them.`,
    },
    {
      heading: 'Quality, latency, cost: choosing a tier',
      body: `Model choice sets the **intelligence ceiling**; everything else (effort, caching, prompting) works underneath it. A useful decision procedure:

1. **Start with the task's failure cost.** If a wrong answer is expensive (legal analysis, code merged to main, financial decisions), start with Opus 5.5 and move to Fable 5.2 only if evals at higher effort still fall short.
2. **Measure, then step down.** Run the eval on Sonnet 5.5 and Haiku 5.5. If a smaller model meets the quality bar, it wins on both latency and cost. Many classification and extraction tasks are Haiku tasks.
3. **Compare cost per completed task, not per token.** A smaller model that needs more retries, more turns or a human fallback can cost more overall. A bigger model at low effort is sometimes the cheapest cell.
4. **Route by task, not within a conversation.** Use Haiku for triage and Opus for the hard path, but switch models between conversations: caches are per model and thinking blocks are bound to the model that produced them.
5. **Latency is not just model size.** Time-to-first-token falls with less uncached input; total time falls with fewer output tokens. A smaller model that writes twice as much can be slower end to end.

The Associate exam asks the same question at the product level: Haiku for quick, high-volume tasks; Sonnet for everyday work; Opus for deep analysis and complex reasoning.`,
    },
    {
      heading: 'Breaking changes across releases',
      body: `New model generations change the API surface, not just the weights. Recent releases removed or changed:

| Change | Affected models | What to do |
|---|---|---|
| \`budget_tokens\` removed | Opus 4.7+, Opus 5/5.5, Sonnet 5/5.5, Haiku 5.5, Fable 5.x | Use adaptive thinking and \`output_config.effort\` |
| \`temperature\`, \`top_p\`, \`top_k\` removed | Opus 4.7+, Opus 5/5.5, Fable 5.x; rejected on API version 2026-10-21 for all | Delete the parameters |
| Assistant prefill removed | 4.6+ models | Use structured outputs (\`output_config.format\`) or a tool schema |
| Forced \`tool_choice\` (\`any\` / \`tool\`) returns 400 | Opus 5.5, Sonnet 5.5, Fable 5.1/5.2 | Use \`auto\` plus prompt steering and \`strict: true\`, or structured outputs |
| Thinking cannot be disabled | Opus 5.5, Fable 5.x | Omit \`thinking\`; lower effort instead |
| Thinking blocks bound to model and conversation | Opus 5.5, Sonnet 5.5, Fable 5.1+ | Keep history append-only; do not edit earlier turns |
| New tokenizer (~30% more tokens) | Sonnet 5, Haiku 5.5 | Re-count tokens, re-size \`max_tokens\`, re-model cost |
| Default effort changed | Opus 5.5 (medium) vs Opus 5 (high) | Set effort explicitly |
| New computer-use toolset | Opus 5.5, Sonnet 5.5, Fable 5.2 | Use \`computer_toolset_20260801\` |

Behavioural shifts also matter: newer models follow instructions more literally, calibrate verbosity to task complexity, and may be more willing to ask instead of assume. Prompts tuned for one generation can land differently on the next.`,
    },
    {
      heading: 'Pin, evaluate, migrate',
      body: `**Pin the model id** in configuration, not in scattered code, and never rely on "latest". A pinned id means behaviour changes only when you decide. Model deprecations are announced in advance with retirement dates (for example Sonnet 4.5 retires 30 Nov 2026), so schedule migrations rather than being forced into them.

A migration checklist:

1. Read the migration guide for the target model and apply the breaking changes behind a flag or in a test runner.
2. Re-count tokens on representative prompts with \`count_tokens\` against the new model; update \`max_tokens\` and cost models.
3. Set \`effort\` explicitly to the level you were effectively using.
4. Run the full eval on the new model; compare per slice, cost per case and latency against the pinned baseline.
5. Re-tune prompts where slices dropped (format, verbosity, literalness).
6. Roll out gradually with monitoring, and keep the old id available for rollback until the new one is proven.

Treat the model id like a dependency version: upgrade deliberately, test before deploying, and keep a changelog of which id ran in production when, so incidents can be correlated with model changes.`,
    },
  ],
  examples: [
    {
      title: 'Routing by task tier',
      description:
        'A support platform triages 200,000 messages a day. Haiku 5.5 classifies intent and urgency; only the 8% flagged as complex go to Opus 5.5. Cost per ticket fell by 85% versus sending everything to Opus, with no measured drop in resolution quality on the eval.',
      language: 'python',
      code: `def answer(ticket: str) -> str:
    triage = client.messages.create(
        model="claude-haiku-5-5", max_tokens=20,
        output_config={"format": {"type": "json_schema", "schema": TRIAGE_SCHEMA}},
        messages=[{"role": "user", "content": ticket}])
    route = json.loads(triage.content[0].text)
    model = "claude-opus-5-5" if route["complex"] else "claude-sonnet-5-5"
    return client.messages.create(model=model, max_tokens=1500, system=SUPPORT_PROMPT,
                                  messages=[{"role": "user", "content": ticket}]).content[0].text`,
      takeaway: 'Route between conversations by measured difficulty; keep one model within a conversation.',
    },
    {
      title: 'Mistake: swapping the id and nothing else',
      description:
        'A team changed `claude-sonnet-4-6` to `claude-sonnet-5-5` in production. Half the requests failed with 400 because the code still sent `tool_choice: {type: "any"}` and `temperature: 0`; the other half cost 30% more because of the new tokenizer. The migration should have gone through the eval with breaking changes applied first.',
      language: 'python',
      code: `# Before (400 on Sonnet 5.5):
# tool_choice={"type": "any"}, temperature=0

resp = client.messages.create(
    model="claude-sonnet-5-5",
    max_tokens=1024,
    tools=[{**EXTRACT_TOOL, "strict": True}],
    tool_choice={"type": "auto"},
    system="Always call extract_fields with the data from the document.",
    messages=[{"role": "user", "content": doc}],
)`,
      takeaway: 'A model upgrade is a migration: apply the breaking changes, re-run the eval, re-model cost, then switch.',
    },
    {
      title: 'Discovering capabilities at runtime',
      description:
        'A platform team supports several models and kept a hand-maintained table of context limits that went stale. Using the Models API removed the table.',
      language: 'typescript',
      code: `const m = await client.models.retrieve("claude-opus-5-5");
console.log(m.max_input_tokens, m.max_tokens);           // 1000000 128000
const caps = m.capabilities as Record<string, any>;
if (!caps.thinking.types.adaptive.supported) throw new Error("needs adaptive thinking");`,
      takeaway: 'The Models API is the source of truth for limits and feature support; do not hard-code them.',
    },
    {
      title: 'Bigger model, lower effort, lower cost',
      description:
        'An eval grid over model x effort showed Opus 5.5 at effort low scoring higher than Sonnet 5.5 at effort high on a contract-review task, at similar cost per case because Opus finished in fewer turns. Without the grid the team would have assumed Sonnet was the cheaper option.',
      takeaway: 'Compare cost per completed task across model and effort combinations; intuition about "cheaper model" is often wrong.',
    },
  ],
  keyPoints: [
    'Current ids and prices: Fable 5.2 ($8/$40), Opus 5.5 ($4/$20, default pick), Sonnet 5.5 ($2/$10), Haiku 5.5 ($0.10/$0.50 up to 100K-token prompts). No date suffixes.',
    'All current models: 1M context, 128K output, adaptive thinking, effort, structured outputs. Haiku 4.5 is the 200K exception.',
    'Model sets the capability ceiling; choose by failure cost, then step down to the smallest model that passes the eval.',
    'Compare cost per completed task, including retries and turns, not price per token; route between conversations, not inside one.',
    'Breaking changes to know: budget_tokens removed, sampling params removed, prefill removed, forced tool_choice 400s, thinking cannot be disabled on Opus 5.5/Fable, thinking blocks bound to model, new tokenizers, effort defaults differ.',
    'Pin the model id; upgrade deliberately with the migration guide, token re-count, explicit effort, full eval and gradual rollout.',
    'Use the Models API (models.retrieve / models.list) for live limits and capabilities.',
  ],
  flashcards: [
    { front: 'Price of claude-opus-5-5 per MTok?', back: '$4 input / $20 output.' },
    { front: 'Price of claude-sonnet-5-5 per MTok?', back: '$2 input / $10 output.' },
    { front: 'Price of claude-haiku-5-5 per MTok?', back: '$0.10 input / $0.50 output for prompts up to 100K tokens; higher above that.' },
    { front: 'Price of claude-fable-5-2 per MTok?', back: '$8 input / $40 output; the most capable widely released model.' },
    { front: 'Which current model is the exception with a 200K context window?', back: 'Haiku 4.5 (older, still served). All current 5.x models have 1M.' },
    { front: 'Name four parameters or features removed on current models.', back: 'budget_tokens, temperature/top_p/top_k, assistant prefill, forced tool_choice (any / tool).' },
    { front: 'Why route models between conversations rather than within one?', back: 'Prompt caches are per model and thinking blocks are bound to the producing model, so switching mid-conversation loses both.' },
    { front: 'What should replace forced tool_choice on Opus 5.5 / Sonnet 5.5?', back: 'tool_choice auto with prompt steering and strict: true, or structured outputs via output_config.format.' },
    { front: 'How do you get a model\'s context window programmatically?', back: 'client.models.retrieve(id).max_input_tokens (Models API).' },
    { front: 'First three steps of a model migration?', back: 'Apply the migration guide\'s breaking changes behind a flag, re-count tokens and resize max_tokens, set effort explicitly; then run the full eval.' },
  ],
  quiz: [
    {
      question:
        'A company must classify 5 million short product reviews per day into 6 categories. Accuracy on a labelled sample is 96% with Haiku 5.5 and 97% with Opus 5.5. Which choice is MOST appropriate?',
      options: [
        'Opus 5.5, because higher accuracy always justifies the cost.',
        'Haiku 5.5, because it meets the quality bar at a fraction of the cost and latency.',
        'Fable 5.2 to maximise accuracy.',
        'Sonnet 5.5 as a compromise without measuring it.',
      ],
      correct: [1],
      explanation:
        'Step down to the smallest model that passes the eval; at this volume a 40x price difference for one point of accuracy is rarely justified. Choosing Sonnet without measuring ignores the data, and Fable is overkill.',
    },
    {
      question:
        'After changing the model id from claude-opus-4-6 to claude-opus-5-5, requests fail with HTTP 400. Which TWO request fields are the most likely culprits? (Select two)',
      options: [
        'thinking: {type: "enabled", budget_tokens: 8000}',
        'temperature: 0.2',
        'max_tokens: 4096',
        'system: a long string',
      ],
      correct: [0, 1],
      explanation:
        'budget_tokens and sampling parameters are removed on Opus 5.5 and return 400. max_tokens and a long system prompt are valid on both models.',
    },
    {
      question:
        'An agent switches from Haiku to Opus halfway through a 30-turn conversation when the task gets hard. Which consequence should the team expect?',
      options: [
        'The conversation continues with no side effects.',
        'The prompt cache is cold for the new model and prior thinking blocks are not usable, raising cost and possibly quality risk.',
        'The API rejects the request because models cannot change.',
        'Output tokens become free for the first turn on the new model.',
      ],
      correct: [1],
      explanation:
        'Caches are per model and thinking blocks are bound to the producing model. The API allows the switch but you pay for it; route between conversations instead.',
    },
    {
      question:
        'Which practice BEST protects a production system from unexpected behaviour changes in Claude models?',
      options: [
        'Always use the newest model id as soon as it is released.',
        'Pin the model id, and upgrade only after running the eval on the new model with migration changes applied.',
        'Avoid upgrading models at all.',
        'Set effort to max so model differences are hidden.',
      ],
      correct: [1],
      explanation:
        'Pinning plus eval-gated upgrades gives control. Auto-adopting newest ids invites surprises, never upgrading leads to forced migrations at retirement, and effort does not mask API or behavioural differences.',
    },
    {
      question:
        'A team needs the model\'s maximum output tokens and whether it supports adaptive thinking, for several models, without maintaining a table. What should they use?',
      options: [
        'The Models API (models.retrieve / models.list) and read max_tokens and capabilities.',
        'Parse the pricing page HTML.',
        'Send a test request with a huge max_tokens and see if it fails.',
        'Read the value from usage in a previous response.',
      ],
      correct: [0],
      explanation:
        'The Models API returns limits and capability flags per model. Scraping is brittle, probing is wasteful and incomplete, and usage reports consumption, not limits.',
    },
    {
      question:
        'A legal-review flow on Sonnet 5.5 at effort high misses subtle clauses. What is the recommended next step?',
      options: [
        'Jump straight to Fable 5.2.',
        'Try Opus 5.5 (also sweeping effort) on the eval, and move to Fable 5.2 only if Opus at higher effort still falls short.',
        'Lower effort to make responses more focused.',
        'Add temperature: 0 for precision.',
      ],
      correct: [1],
      explanation:
        'Opus 5.5 is the default step up; Fable is reserved for when Opus at high effort is insufficient. Lower effort reduces reasoning, and temperature is rejected on current models.',
    },
  ],
  statements: [
    { text: 'claude-opus-5-5 is priced at $4 input and $20 output per million tokens.', isTrue: true, explanation: 'Sonnet 5.5 is $2 / $10, Haiku 5.5 $0.10 / $0.50, Fable 5.2 $8 / $40.' },
    { text: 'Haiku 5.5 has a smaller 200K context window than the other current models.', isTrue: false, explanation: 'Haiku 5.5 has a 1M window; Haiku 4.5 is the 200K model.' },
    { text: 'Forced tool_choice ({type: "any"} or {type: "tool"}) returns 400 on Opus 5.5 and Sonnet 5.5.', isTrue: true, explanation: 'Use auto with prompt steering and strict: true, or structured outputs.' },
    { text: 'Using the most capable model is always the most cost-effective choice because it needs fewer retries.', isTrue: false, explanation: 'Sometimes true for hard tasks, but for many tasks a smaller model passes the eval at a fraction of the cost; measure cost per completed task.' },
    { text: 'Assistant prefill is still the recommended way to force JSON output on current models.', isTrue: false, explanation: 'Prefill is removed on 4.6+ models; use structured outputs or a tool schema.' },
    { text: 'Model ids like claude-opus-5-5 should be used without appending date suffixes.', isTrue: true, explanation: 'Current ids are stable aliases; date-suffixed ids are not the public ids for these models.' },
    { text: 'The Models API can report whether a model supports adaptive thinking.', isTrue: true, explanation: 'capabilities.thinking.types.adaptive.supported in models.retrieve.' },
  ],
  resources: [
    { label: 'Models overview', url: 'https://platform.claude.com/docs/en/about-claude/models/overview' },
    { label: 'Choosing a model', url: 'https://platform.claude.com/docs/en/about-claude/models/choosing-a-model' },
    { label: 'Migrating to the latest models', url: 'https://platform.claude.com/docs/en/about-claude/models/migration-guide' },
    { label: 'Pricing', url: 'https://claude.com/pricing#api' },
  ],
};
