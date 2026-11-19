import type { Concept } from '../../types';

export const modelOptionsFastModeThinkingEffort: Concept = {
  id: 'model-options-fast-mode-thinking-effort',
  title: 'Model Options: Fast Mode, Adaptive Thinking, Effort and Task Budgets',
  summary:
    'The request-level knobs that trade latency, cost and quality on current Claude models: fast mode (speed: "fast"), adaptive thinking, the effort ladder from low to max, and advisory task budgets.',
  certs: ['ccdv-f', 'ccar-p', 'ccao-f'],
  domains: ['ccdv-f-5', 'ccdv-f-2', 'ccar-p-2', 'ccar-p-4', 'ccao-f-3'],
  tags: ['effort', 'thinking', 'fast-mode', 'latency', 'cost'],
  difficulty: 'intermediate',
  sections: [
    {
      heading: 'Adaptive thinking: how current models reason',
      body: `Older Claude models used **extended thinking** with a manual \`budget_tokens\` number. Current models use **adaptive thinking**: the model decides how much to reason per request, and you steer depth with an effort level instead of a token budget.

| Model | Thinking behaviour |
|---|---|
| Opus 5.5 | Always on. \`thinking: {type: "disabled"}\` and \`budget_tokens\` both return 400. Omit \`thinking\` or send \`{type: "adaptive"}\`. |
| Sonnet 5.5 | Adaptive by default. To turn thinking off send \`{type: "between_tools"}\` (effort high or below). |
| Haiku 5.5 | Adaptive by default; \`{type: "disabled"}\` accepted at effort high or below. \`budget_tokens\` returns 400. |
| Fable 5.x | Always on; explicit disabled returns 400. |
| Haiku 4.5 and older | Manual \`thinking: {type: "enabled", budget_tokens: N}\`; no effort parameter. |

Thinking tokens are billed as output tokens. By default thinking text is not returned in full (\`thinking.display\` can request summaries), and thinking blocks are bound to the model and conversation that produced them: replaying edited history can invalidate them. The practical rule: on current models, never send \`budget_tokens\`; control depth with effort.`,
    },
    {
      heading: 'Effort levels',
      body: `\`output_config.effort\` takes \`low\`, \`medium\`, \`high\`, \`xhigh\` or \`max\`. It scales how many tokens the model spends on thinking, text and tool calls, and in an agent loop it usually changes the number of turns too. Lower effort means shorter, cheaper, faster calls with some loss of capability on hard problems; higher effort buys quality on difficult reasoning at the cost of latency and tokens.

**Defaults differ by model**, which is a classic exam trap: Opus 5.5 defaults to \`medium\`; Opus 5, Sonnet 5.5 and Fable 5.2 default to \`high\`; Haiku 5.5 defaults to \`medium\`. A migration from Opus 5 to Opus 5.5 that omits \`effort\` silently runs one level lower. Set effort explicitly.

Guidance:

- Simple classification, extraction, routing: \`low\` or \`medium\`.
- Everyday coding and analysis: \`medium\` or \`high\`.
- Hard multi-step reasoning, long agentic tasks, research: \`high\`, \`xhigh\`, or \`max\` when evals show the gain is worth it.
- Changing top-level effort mid-conversation breaks the prompt cache; use **per-message effort** (a system message inside \`messages\` with \`output_config\`, beta) to raise it only on hard turns.

Always sweep effort on your eval: a stronger model at low effort is sometimes cheaper and better than a weaker model at high effort.`,
    },
    {
      heading: 'Fast mode',
      body: `**Fast mode** runs the *same model* with faster output-token generation. You request it with the top-level parameter \`speed: "fast"\`. It changes speed, not capability, which is why it is the first tradeoff to try when latency matters and quality must not move.

- **Available on**: Opus 5.5 (generally available, no beta header, priced at **$8 / $40 per MTok, double the standard $4 / $20**), Opus 5 and Opus 4.8 (research preview, beta header \`fast-mode-2026-02-01\`, $10 / $50), and Fable 5.2 / Mythos 5.2 where the fast-mode docs list them. Sonnet and Haiku do not offer it; Haiku is already the fast tier.
- **Price**: roughly 2x the standard rate for the model. Fast mode has its own rate limits, and you should check whether fast and standard requests share cached prefixes before planning a fallback.
- **Platforms**: Claude API and Anthropic-managed platforms; availability on Bedrock and Vertex differs, so check the docs.
- **When**: interactive experiences where time-to-complete is user visible (a coding assistant, live chat) and the quality of the large model is required. If a smaller model meets the quality bar, Haiku or Sonnet is usually cheaper than Opus fast mode.

Fast mode does not shorten the answer; combine it with fewer output tokens (lower effort, tighter format) for the biggest latency win.`,
    },
    {
      heading: 'Task budgets and the tradeoff triangle',
      body: `A **task budget** (beta, header \`task-budgets-2026-03-13\`) tells the model how many tokens it has for an entire agentic task: thinking, tool calls and final output across turns. The model sees a running countdown and paces itself, wrapping up gracefully rather than being cut off. It is **advisory**: it steers behaviour but does not enforce a hard stop. \`max_tokens\` remains the enforced per-response ceiling, and the model is not shown it. Set a budget from the 90th percentile of observed usage, set it once at the start (changing it mid-task invalidates the cache), and verify adherence on your eval; very tight budgets reduce pass rates.

Putting the levers together:

| Lever | Latency | Cost | Quality |
|---|---|---|---|
| Lower effort | Faster (fewer tokens) | Cheaper | Lower on hard tasks |
| Higher effort | Slower | More expensive | Higher ceiling |
| Fast mode | Faster per token | ~2x price | Same |
| Smaller model | Faster | Cheaper | Lower ceiling |
| Task budget | Bounds long tasks | Cheaper | Slight drop as it tightens |
| Prompt caching | Lower TTFT | Much cheaper on repeats | Same |

Order of operations: cache first, trim tokens, then adjust effort, then consider fast mode or a different model, measuring each on the eval.`,
    },
  ],
  examples: [
    {
      title: 'Setting effort explicitly',
      description:
        'A team moved from claude-opus-5 to claude-opus-5-5 and quality dipped on a reasoning-heavy slice. They had never set effort; the default fell from high to medium. Setting it explicitly restored results and made the behaviour independent of model defaults.',
      language: 'python',
      code: `resp = client.messages.create(
    model="claude-opus-5-5",
    max_tokens=8000,
    output_config={"effort": "high"},   # low | medium | high | xhigh | max
    messages=[{"role": "user", "content": hard_question}],
)
print(resp.usage.output_tokens)        # includes thinking tokens`,
      takeaway: 'Defaults differ between models; always set effort yourself so upgrades do not change it silently.',
    },
    {
      title: 'Fast mode for an interactive coding assistant',
      description:
        'An IDE plugin needs Opus-level quality but users wait for every completion. Fast mode roughly doubles the price per token while keeping the same model.',
      language: 'typescript',
      code: `const res = await client.messages.create({
  model: "claude-opus-5-5",
  max_tokens: 2048,
  speed: "fast",                       // same model, faster output, ~2x price
  output_config: { effort: "medium" }, // fewer tokens also helps latency
  messages: [{ role: "user", content: prompt }],
});`,
      takeaway: 'Fast mode buys speed with dollars, not capability; pair it with fewer output tokens.',
    },
    {
      title: 'Mistake: budget_tokens on a current model',
      description:
        'Code written for Haiku 4.5 sent thinking: {type: "enabled", budget_tokens: 4000}. After switching to claude-haiku-5-5 every call returned 400. The fix removes the budget and uses adaptive thinking with effort.',
      language: 'python',
      code: `# Before (400 on Haiku 5.5 / Opus 5.5 / Sonnet 5.5):
# thinking={"type": "enabled", "budget_tokens": 4000}

resp = client.messages.create(
    model="claude-haiku-5-5",
    max_tokens=2048,
    thinking={"type": "adaptive"},        # or omit: adaptive is the default
    output_config={"effort": "low"},      # cheap routing task
    messages=[{"role": "user", "content": ticket}],
)`,
      takeaway: 'budget_tokens is for Haiku 4.5 and older only; current models use adaptive thinking plus effort.',
    },
    {
      title: 'Bounding a long agent run with a task budget',
      description:
        'A research agent occasionally ran for 400K tokens. The team observed p90 usage of 110K and set a 128K task budget so the model paces itself and wraps up, keeping max_tokens as the hard per-response cap.',
      language: 'python',
      code: `resp = client.beta.messages.create(
    model="claude-opus-5-5",
    max_tokens=16000,                                  # hard cap per response
    betas=["task-budgets-2026-03-13"],
    output_config={"effort": "high",
                   "task_budget": {"type": "tokens", "total": 128000}},  # advisory
    tools=tools, messages=messages,
)`,
      takeaway: 'A task budget is a signal the model paces to; max_tokens is the stop the API enforces.',
    },
  ],
  keyPoints: [
    'Current models use adaptive thinking; budget_tokens is removed (400) and only applies to Haiku 4.5 and older.',
    'Opus 5.5 and Fable 5.x cannot disable thinking; Sonnet 5.5 uses {type: "between_tools"} to turn it off; Haiku 5.5 accepts disabled at effort high or below.',
    'output_config.effort: low, medium, high, xhigh, max. Defaults differ: Opus 5.5 and Haiku 5.5 medium; Opus 5, Sonnet 5.5, Fable 5.2 high. Set it explicitly.',
    'Fast mode (speed: "fast") runs the same model faster at about 2x price: Opus 5.5 $8/$40 with no beta header; Opus 5 / 4.8 in research preview with a beta header; not on Sonnet or Haiku.',
    'Task budgets (beta) are advisory token targets the model paces to; max_tokens is the enforced per-response limit.',
    'Changing top-level effort mid-conversation breaks the cache; per-message effort (beta) avoids that.',
    'Order of levers: caching, trim tokens, effort, then fast mode or model change, each measured on an eval.',
  ],
  flashcards: [
    { front: 'How do you request fast mode?', back: 'Top-level request parameter speed: "fast" (no beta header on Opus 5.5).' },
    { front: 'Fast mode price on Opus 5.5?', back: '$8 input / $40 output per MTok, about twice the standard $4 / $20.' },
    { front: 'Which current models support fast mode?', back: 'Opus 5.5 (GA), Opus 5 and Opus 4.8 (research preview, beta header), Fable 5.2 / Mythos 5.2 where documented. Not Sonnet or Haiku.' },
    { front: 'Default effort on Opus 5.5?', back: 'medium (Opus 5, Sonnet 5.5 and Fable 5.2 default to high; Haiku 5.5 to medium).' },
    { front: 'List the effort levels.', back: 'low, medium, high, xhigh, max.' },
    { front: 'How do you turn thinking off on Sonnet 5.5?', back: 'thinking: {type: "between_tools"} at effort high or below; {type: "disabled"} returns 400.' },
    { front: 'Can thinking be disabled on Opus 5.5?', back: 'No. It is always on; depth is controlled only with output_config.effort.' },
    { front: 'Task budget vs max_tokens?', back: 'Task budget is advisory, visible to the model, spans the whole task; max_tokens is enforced per response and invisible to the model.' },
    { front: 'Why set effort per message instead of changing it at the top level mid-conversation?', back: 'A top-level change invalidates the prompt cache; per-message effort (beta) keeps the prefix.' },
    { front: 'Where do thinking tokens show up in billing?', back: 'As output tokens in usage.output_tokens.' },
  ],
  quiz: [
    {
      question:
        'A legal-analysis service on claude-opus-5-5 needs the highest accuracy and latency is not a concern. Which configuration is MOST appropriate?',
      options: [
        'speed: "fast" with effort low',
        'thinking: {type: "enabled", budget_tokens: 32000}',
        'output_config: {effort: "xhigh"} or "max", validated by the eval',
        'Switch to claude-haiku-5-5 with effort max',
      ],
      correct: [2],
      explanation:
        'Higher effort raises the reasoning ceiling. Fast mode does not change quality, budget_tokens returns 400 on Opus 5.5, and Haiku has a lower capability ceiling regardless of effort.',
    },
    {
      question:
        'An interactive assistant must keep Opus-level quality but users complain about waiting for long answers. Which TWO changes directly reduce perceived latency without lowering the model tier? (Select two)',
      options: [
        'Enable fast mode with speed: "fast".',
        'Stream the response and reduce output tokens with a tighter format or lower effort.',
        'Increase max_tokens.',
        'Add budget_tokens to the request.',
      ],
      correct: [0, 1],
      explanation:
        'Fast mode speeds token generation; streaming and fewer tokens shorten the visible wait. Raising max_tokens does nothing for speed, and budget_tokens is rejected on current models.',
    },
    {
      question:
        'After migrating from claude-opus-5 to claude-opus-5-5 with no other changes, a reasoning benchmark drops a few points. What is the MOST likely cause?',
      options: [
        'Opus 5.5 is a weaker model.',
        'The default effort changed from high to medium and the code never set it explicitly.',
        'Fast mode was enabled automatically.',
        'The context window shrank.',
      ],
      correct: [1],
      explanation:
        'Opus 5.5 defaults to medium effort where Opus 5 defaulted to high. Fast mode is opt-in, the context window is 1M on both, and the model is a successor rather than a downgrade.',
    },
    {
      question:
        'A team wants to cap the total tokens an autonomous agent spends on a task while letting it finish gracefully. Which option best fits?',
      options: [
        'Set max_tokens to the total budget.',
        'Use a task budget (beta) sized from observed p90 usage and keep max_tokens as the per-response cap.',
        'Set effort to low for every call.',
        'Add "stop after 100,000 tokens" to the system prompt.',
      ],
      correct: [1],
      explanation:
        'Task budgets are designed for this: the model sees the countdown and paces itself. max_tokens is per response, low effort reduces quality everywhere, and a prompt instruction cannot count tokens.',
    },
    {
      question: 'Which statement about fast mode is correct?',
      options: [
        'It uses a smaller distilled model to answer faster.',
        'It is available on Haiku 5.5 to make it even cheaper.',
        'It runs the same model with faster output at roughly double the price.',
        'It requires setting effort to low.',
      ],
      correct: [2],
      explanation:
        'Fast mode trades dollars for speed on the same model. It is not a different model, is not offered on Haiku, and is independent of effort.',
    },
  ],
  statements: [
    { text: 'On Opus 5.5 you can disable thinking by sending thinking: {type: "disabled"}.', isTrue: false, explanation: 'Thinking is always on for Opus 5.5; disabled returns 400. Use effort to control depth.' },
    { text: 'Fast mode on Opus 5.5 costs about twice the standard token price.', isTrue: true, explanation: '$8 / $40 per MTok versus $4 / $20.' },
    { text: 'Effort defaults are the same across all current models.', isTrue: false, explanation: 'Opus 5.5 and Haiku 5.5 default to medium; Opus 5, Sonnet 5.5 and Fable 5.2 default to high.' },
    { text: 'A task budget is a hard limit enforced by the API.', isTrue: false, explanation: 'It is advisory; the model paces to it. max_tokens is the enforced per-response limit.' },
    { text: 'Thinking tokens are billed as output tokens.', isTrue: true, explanation: 'They appear in usage.output_tokens.' },
    { text: 'Changing top-level effort between turns of a conversation invalidates the prompt cache.', isTrue: true, explanation: 'Use per-message effort (beta) to vary depth without breaking the prefix.' },
    { text: 'budget_tokens is the recommended way to control thinking depth on Sonnet 5.5.', isTrue: false, explanation: 'Sonnet 5.5 uses adaptive thinking and output_config.effort; budget_tokens is removed.' },
  ],
  resources: [
    { label: 'Adaptive thinking', url: 'https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking' },
    { label: 'Effort parameter', url: 'https://platform.claude.com/docs/en/build-with-claude/effort' },
    { label: 'Fast mode', url: 'https://platform.claude.com/docs/en/build-with-claude/fast-mode' },
  ],
};
