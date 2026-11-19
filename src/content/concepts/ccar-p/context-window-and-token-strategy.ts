import type { Concept } from '../../types';

export const contextWindowAndTokenStrategy: Concept = {
  id: 'context-window-and-token-strategy',
  title: 'Context Window and Token Strategy',
  summary:
    'Plan token budgets per request and per session, decide between progressive discovery and monolithic context, use caching, compaction and context editing deliberately, and forecast token spend before launch.',
  certs: ['ccar-p', 'ccar-f', 'ccdv-f', 'ccao-f'],
  domains: ['ccar-p-2', 'ccar-p-3', 'ccar-p-4', 'ccar-f-5', 'ccdv-f-6', 'ccdv-f-5', 'ccao-f-3'],
  tags: ['context-window', 'tokens', 'caching', 'compaction', 'progressive-discovery', 'forecasting'],
  difficulty: 'advanced',
  diagram: 'context-window',
  sections: [
    {
      heading: 'A 1M window is a budget, not a target',
      body: `Current Claude models accept up to 1M input tokens and produce up to 128K output tokens. That removes many old hard limits but introduces a new discipline: everything you put in the window costs money and attention. More context is not free in three ways:

- **Cost.** Input tokens are billed on every call; in an agent loop the whole history is resent each iteration. Haiku 5.5 also moves to a higher price band above 100K input tokens.
- **Latency.** Time-to-first-token grows with uncached input.
- **Quality.** Irrelevant or stale material dilutes attention. Models do well at finding a needle in long context, but a window full of unrelated tool output still degrades instruction following and increases the chance of acting on outdated information.

Budget each request: fixed prefix (system, tools, reference material), per-request payload (retrieved passages, user input), history, and reserved output. Write the budget down with the SLA and alert when a request class exceeds it.`,
    },
    {
      heading: 'Progressive discovery versus monolithic context',
      body: `Two strategies for giving the model what it needs:

| Strategy | How | Best when |
|---|---|---|
| Monolithic context | Load everything relevant up front: the full manual, all tool definitions, the whole codebase slice | The corpus is small and stable (fits comfortably, under a few hundred thousand tokens), reused across many calls so it caches well, and the task may touch any part of it |
| Progressive discovery | Start small; let the model fetch what it needs via retrieval, file reads, tool search or subagents | The corpus is large or changes often, only a small fraction is relevant per request, or tool catalogues are big |

Progressive discovery is how Claude Code works (it reads files on demand rather than loading the repository), how the tool search tool works (tools marked \`defer_loading\` are discovered when needed), and how coordinator-subagent systems keep the lead's context small. It costs extra round trips and some design effort; it saves tokens and keeps attention focused.

The architect's test: what fraction of the loaded context is used by a typical request? If it is under a few percent, progressive discovery will win. If most of it is used on most calls and it caches well, monolithic is simpler and often cheaper.`,
    },
    {
      heading: 'Caching, compaction and context editing',
      body: `Three mechanisms manage tokens across a session, and they are different:

- **Prompt caching** reuses a byte-identical prefix across calls (tools → system → messages) at about 10% of input price. It does not shrink the window; it makes resending cheap. Place stable content first and move the breakpoint forward each turn in agent loops. See the prompt-caching concept for details.
- **Compaction** (beta \`compact-2026-01-12\`, via \`context_management.edits\` with \`compact_20260112\`) summarises older conversation server-side so a long session can continue. It is a window tool for sessions long enough to need it; the summarisation call is billed, and a custom \`instructions\` string replaces the default summary prompt, so write it to preserve task-critical state.
- **Context editing** (beta \`context-management-2025-06-27\`) clears old tool results or thinking from the window. Every clear rewrites the cached conversation, which works against caching, so trigger it rarely and in large batches rather than every turn.

Client-side pruning of tool results at natural boundaries is also possible, but on models that enforce preserved thinking, editing earlier turns invalidates later thinking blocks; prefer server-side mechanisms there. Claude Code exposes the same idea as \`/compact\`, and the Agent SDK isolates heavy work in subagents so the parent context never holds it.`,
    },
    {
      heading: 'Token forecasting and the exam angle',
      body: `Before launch, forecast spend from measured samples rather than guesses:

1. Count tokens for the fixed prefix with the token-counting endpoint.
2. Measure per-request payload and output on a representative sample (median and p95).
3. Model the session: for agent loops, tokens per iteration × iterations, with the cached share separated out.
4. Multiply by volume and by model price (input, cached input, output), and add a margin for retries and growth.
5. Log \`usage\` on every response in production and compare the forecast to reality weekly.

Typical findings: a few request classes dominate cost; caching hit rate is lower than assumed because something volatile sits in the prefix; thinking tokens on simple tasks are a large share. Each finding has a lever: route the dominant class to a cheaper configuration, fix the prefix, lower effort.

Exam items present a token or cost problem (a loop that grows until it fails, a bill that doubled, a 1M window "so we loaded everything") and ask for the fix. Answers that budget, cache, isolate context in subagents, discover progressively or compact are right; answers that just raise limits or load more are wrong.`,
    },
  ],
  examples: [
    {
      title: 'Forecasting an agent loop before launch',
      description:
        'A procurement agent averages 12 tool iterations per task. The team measured a 9,000-token cached prefix, 1,500 new tokens per iteration and 400 output tokens per iteration on Sonnet 5.5, then forecast cost per task and per month for 50,000 tasks, separating cached and uncached input. The forecast was within 15% of the first month\'s bill.',
      language: 'python',
      code: `prefix = client.messages.count_tokens(
    model="claude-sonnet-5-5", system=SYSTEM, tools=TOOLS,
    messages=[{"role": "user", "content": "x"}]).input_tokens      # ~9,000

iters, new_per_iter, out_per_iter = 12, 1500, 400
uncached_in = sum(new_per_iter for _ in range(iters))             # new content each turn
cached_in   = sum(prefix + new_per_iter * i for i in range(iters)) # history re-read from cache
out         = out_per_iter * iters

price = {"in": 2.00, "cached": 0.10, "out": 10.00}                # $/MTok, Sonnet 5.5
per_task = (uncached_in * price["in"] + cached_in * price["cached"] + out * price["out"]) / 1e6
print(f"per task \${per_task:.3f}, per month \${per_task * 50_000:,.0f}")`,
      takeaway: 'Forecast from measured prefix, per-iteration growth and output, with cached and uncached input priced separately.',
    },
    {
      title: 'Mistake: "we have 1M tokens, load the whole knowledge base"',
      description:
        'A support team replaced retrieval with the entire 600,000-token knowledge base in every request. Cost per conversation rose twelve-fold, time-to-first-token exceeded the SLA on cache misses, and accuracy fell on edge cases because stale articles competed with current ones. The fix restored retrieval of the top passages (about 4,000 tokens), kept the 20,000-token core policy in the cached prefix, and marked article freshness in metadata.',
      takeaway: 'A large window permits loading everything; cost, latency and attention argue for loading what the request needs.',
    },
    {
      title: 'Progressive tool discovery for a 200-tool platform',
      description:
        'An enterprise agent integrates 200 internal tools across HR, finance and IT. Loading every definition cost 60,000 tokens per call and the model occasionally picked a similarly named wrong tool. The team kept 8 core tools loaded and marked the rest with defer_loading behind the tool search tool. Prefix size fell by 85% and tool-selection errors dropped.',
      language: 'python',
      code: `tools = [
    {"type": "tool_search_tool_regex_20251119", "name": "tool_search_tool_regex"},
    *CORE_TOOLS,                                        # 8 always-loaded tools
    *[{**t, "defer_loading": True} for t in LONG_TAIL_TOOLS],   # 192 discovered on demand
]
resp = client.messages.create(
    model="claude-opus-5-5", max_tokens=2048,
    tools=tools, system=SYSTEM,
    messages=[{"role": "user", "content": request}],
)`,
      takeaway: 'Keep the core tool set loaded and let the model discover the long tail; smaller prefixes cost less and reduce mis-selection.',
    },
    {
      title: 'Compaction for a long-running analysis session',
      description:
        'A financial analyst assistant runs sessions that span hundreds of turns. Without management the window filled and the session failed. Enabling server-side compaction with custom instructions to preserve "open questions, confirmed figures with sources and the current hypothesis" let sessions continue indefinitely; the team monitored usage.iterations to see the summarisation cost and confirmed it was far below the cost of resending the full history.',
      takeaway: 'Compaction is for sessions long enough to need it; write the summary instructions to keep task-critical state.',
    },
  ],
  keyPoints: [
    'The 1M window is a budget: input costs money and latency on every call, and irrelevant context degrades quality.',
    'Budget each request as fixed prefix + per-request payload + history + reserved output; alert when a request class exceeds it.',
    'Monolithic context fits small, stable, heavily reused corpora; progressive discovery fits large or changing corpora where little is relevant per request.',
    'Progressive discovery mechanisms: retrieval, on-demand file reads, tool search with defer_loading, subagents with fresh contexts.',
    'Caching makes resending cheap; compaction summarises history server-side; context editing clears old tool results. They are different tools.',
    'Context editing and client-side pruning rewrite the cached conversation; use them rarely and in batches.',
    'Forecast tokens from measured prefix, per-iteration growth and output, separating cached and uncached input; log usage and compare weekly.',
    'Exam answers that budget, cache, isolate or discover progressively beat answers that raise limits or load more.',
  ],
  flashcards: [
    { front: 'Why is more context not free even with a 1M window?', back: 'Cost (billed every call), latency (TTFT grows with uncached input) and quality (irrelevant material dilutes attention).' },
    { front: 'When is monolithic context the right choice?', back: 'Small, stable corpus that caches well and whose parts are mostly used on most calls.' },
    { front: 'Name four progressive-discovery mechanisms on the Claude platform.', back: 'Retrieval (RAG), on-demand file reads (Claude Code), tool search with defer_loading, subagents with fresh contexts.' },
    { front: 'What does prompt caching do to the context window?', back: 'Nothing; it makes resending a byte-identical prefix cheap (about 10% of input price). It does not shrink the window.' },
    { front: 'Compaction vs context editing?', back: 'Compaction (compact-2026-01-12) summarises older history server-side; context editing (context-management-2025-06-27) clears old tool results or thinking. Different features.' },
    { front: 'Why trigger context editing rarely and in batches?', back: 'Each clear rewrites the cached conversation, breaking cache reuse; infrequent large clears cost less than clearing every turn.' },
    { front: 'How should a custom compaction instructions string be written?', back: 'It replaces the default summary prompt, so it must name the task-critical state to preserve (open questions, confirmed figures, current hypothesis).' },
    { front: 'What is the first step of token forecasting?', back: 'Count the fixed prefix with the token-counting endpoint, then measure payload and output on a representative sample.' },
    { front: 'What is the architect\'s test for monolithic vs progressive?', back: 'The fraction of loaded context actually used per request; under a few percent favours progressive discovery.' },
  ],
  quiz: [
    {
      question:
        'A support team loads its entire 600,000-token knowledge base into every request because "the window is 1M". Cost rose twelve-fold and accuracy fell on edge cases. What is the BEST fix?',
      options: [
        'Switch to Haiku to make the large context cheaper.',
        'Restore retrieval of the top relevant passages, keep core policy in a cached prefix and mark article freshness.',
        'Enable compaction on every request.',
        'Raise max_tokens so the model can address more of the context.',
      ],
      correct: [1],
      explanation:
        'Load what the request needs; cache what is stable. Haiku (1) still pays for 600K tokens and loses quality; compaction (3) is for long sessions, not single requests; max_tokens (4) is about output.',
    },
    {
      question:
        'An enterprise agent loads 200 tool definitions (60,000 tokens) per call and sometimes selects a similarly named wrong tool. Which approach BEST addresses both issues?',
      options: [
        'Keep core tools loaded and mark the long tail with defer_loading behind the tool search tool.',
        'Shorten every tool description to one sentence.',
        'Split the agent into 200 single-tool agents.',
        'Increase effort so the model reads the definitions more carefully.',
      ],
      correct: [0],
      explanation:
        'Progressive tool discovery shrinks the prefix and reduces confusion. Short descriptions (2) hurt selection; 200 agents (3) is unmanageable; effort (4) does not fix an oversized, confusable tool list.',
    },
    {
      question: 'Which TWO statements correctly distinguish caching, compaction and context editing? (Select two)',
      options: [
        'Prompt caching reduces the cost of resending an identical prefix but does not reduce the number of tokens in the window.',
        'Compaction and context editing are the same feature under two beta headers.',
        'Context editing clears old tool results, and each clear rewrites the cached conversation.',
        'Compaction is free because it runs server-side.',
      ],
      correct: [0, 2],
      explanation:
        'Caching is about price, not size; context editing clears content at the cost of cache rewrites. Compaction and editing are distinct features (2), and the compaction summarisation call is billed (4).',
    },
    {
      question:
        'A team\'s token forecast was off by 300% in production. Investigation shows cache_read_input_tokens is near zero. What MOST likely explains the gap?',
      options: [
        'The model has a smaller context window than documented.',
        'The forecast assumed a high cache hit rate, but something volatile sits in the prefix so the history is re-billed at full price.',
        'Output tokens are billed twice for agents.',
        'The token-counting endpoint undercounts system prompts.',
      ],
      correct: [1],
      explanation:
        'Forecasts separate cached and uncached input; a broken cache moves history into the full-price bucket. The other options misstate platform behaviour.',
    },
    {
      question:
        'A legal assistant answers questions over a stable 150,000-token contract set that is reused by thousands of queries per day, and most questions touch many parts of it. Which context strategy fits BEST?',
      options: [
        'Progressive discovery via retrieval, because the corpus is large.',
        'Monolithic context: load the contract set in a cached prefix and append each question.',
        'A subagent per contract on every query.',
        'Compaction after each question.',
      ],
      correct: [1],
      explanation:
        'Small enough, stable, heavily reused and broadly relevant is the monolithic sweet spot; caching makes it cheap. Retrieval (1) would miss cross-document relationships; subagents (3) multiply cost; compaction (4) is for long sessions.',
    },
  ],
  statements: [
    { text: 'With a 1M-token window, the cheapest and most accurate strategy is to load all potentially relevant material into every request.', isTrue: false, explanation: 'Input is billed every call, latency grows and irrelevant context degrades quality. Budget and load what the request needs.' },
    { text: 'Tool search with defer_loading is a form of progressive discovery.', isTrue: true, explanation: 'Deferred tools are known to the request but loaded into context only when discovered.' },
    { text: 'Prompt caching reduces the number of tokens in the context window.', isTrue: false, explanation: 'It reduces the price of resending an identical prefix; the window size is unchanged.' },
    { text: 'Context editing should be triggered every turn to keep the window minimal.', isTrue: false, explanation: 'Each clear rewrites the cached conversation; trigger it rarely and in large batches.' },
    { text: 'A custom compaction instructions string replaces the default summarisation prompt rather than adding to it.', isTrue: true, explanation: 'So it must explicitly preserve task-critical state.' },
    { text: 'Token forecasts should price cached and uncached input separately.', isTrue: true, explanation: 'Cached reads are about 10% of input price; conflating them makes forecasts wildly wrong when caching fails.' },
    { text: 'Haiku 5.5 charges the same per-token input price regardless of prompt length.', isTrue: false, explanation: 'Haiku 5.5 moves to a higher price band when the prompt exceeds 100K tokens.' },
  ],
  resources: [
    { label: 'Context windows (Claude docs)', url: 'https://platform.claude.com/docs/en/build-with-claude/context-windows' },
    { label: 'Compaction (Claude docs)', url: 'https://platform.claude.com/docs/en/build-with-claude/compaction' },
    { label: 'Tool search tool (Claude docs)', url: 'https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool' },
    { label: 'Token counting (Claude docs)', url: 'https://platform.claude.com/docs/en/build-with-claude/token-counting' },
  ],
};
