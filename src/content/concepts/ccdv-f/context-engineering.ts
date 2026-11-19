import type { Concept } from '../../types';

export const contextEngineering: Concept = {
  id: 'context-engineering',
  title: 'Context Engineering',
  summary:
    'Treat the context window as a budget: keep what the model needs, prune or summarize what it does not, isolate noisy work in subagents, and protect critical facts from drift.',
  certs: ['ccdv-f', 'ccar-f', 'ccar-p', 'ccao-f'],
  domains: ['ccdv-f-6', 'ccdv-f-1', 'ccar-f-5', 'ccar-f-1', 'ccar-p-2', 'ccar-p-3', 'ccao-f-3'],
  tags: ['context', 'memory', 'agents', 'compaction', 'subagents', 'tokens'],
  difficulty: 'intermediate',
  diagram: 'context-window',
  sections: [
    {
      heading: 'The context window is a budget, not a bucket',
      body: `Every request to Claude is a single sequence of tokens: system prompt, tool definitions, conversation history, tool results, and the new user turn. Current models accept up to 1M tokens, but a large window is not a reason to fill it. Three things get worse as context grows:

- **Cost and latency.** Every input token is billed and processed on every call. In an agent loop the whole history is resent on each iteration, so a 200K-token transcript costs 200K tokens *per step*.
- **Attention quality.** Models attend most reliably to the beginning and end of long inputs and may skip material in the middle (the "lost in the middle" effect). Facts buried in turn 40 of 120 are at risk.
- **Drift.** When early instructions and facts are far away and surrounded by noise, the model starts answering from "typical patterns" rather than from what it actually read. In long exploration sessions this shows up as inconsistent answers and invented details.

**Context engineering** is the discipline of deciding what goes into the window, in what shape, and when it leaves. The guiding question is: *what is the smallest, best-organized set of tokens that lets the model do this step well?*`,
    },
    {
      heading: 'Where bloat comes from and how to prune it',
      body: `The biggest source of bloat in agents is **tool output**. A \`lookup_order\` call might return 40 fields when the agent needs five. A \`grep\` over a repository might return 3,000 lines. These results sit in the transcript forever, consuming tokens out of all proportion to their usefulness.

Pruning strategies, roughly in order of preference:

1. **Fix the tool.** Return only relevant fields, paginate, cap line counts, summarize on the tool side. This is the only strategy that also helps the *current* call.
2. **Trim before appending.** In your own agent loop, post-process tool results (truncate, select fields, strip markup) before adding them to \`messages\`.
3. **Clear old tool results.** Context editing (beta \`context-management-2025-06-27\`, edit type \`clear_tool_uses_20250919\`) removes the content of older tool results server side once a token threshold is crossed, keeping the most recent N. Nothing is summarized; stale results are simply dropped.
4. **Compact.** Compaction (beta \`compact-2026-01-12\`, edit type \`compact_20260112\`) summarizes earlier history into a \`compaction\` block server side when input tokens pass a trigger (default 150K). You must append the full \`response.content\`, including the compaction block, on later requests.
5. **Summarize client side.** Your code asks the model (or a cheaper model) to summarize history and replaces the old turns. Flexible, but you own the prompt and the risk of losing detail.

Context editing and compaction are **different features**: editing deletes stale tool results without summarizing; compaction rewrites history into a summary. Many long-running agents use both, plus a memory mechanism for cross-session state.`,
    },
    {
      heading: 'Protect the facts that must not drift',
      body: `Summaries are lossy in a predictable way: they turn "$47.50 refund approved on 12 March for order #88213" into "a refund was discussed". Dates, amounts, IDs, statuses, and customer-stated expectations are exactly what progressive summarization destroys.

The fix is a **persistent fact block**: extract transactional facts into a small structured section (often XML or JSON) that is included verbatim in every prompt, *outside* the summarized history. In a support agent this is a "case facts" block; in a coding agent it is a scratchpad or notes file the agent re-reads. The block is updated when facts change and never summarized.

Two related techniques fight position effects:

- Put a **key findings summary at the start** of any long aggregated input, then organize details under explicit section headers.
- When a downstream agent has a limited budget, make upstream agents return **structured data** (key facts, citations, relevance scores, dates) rather than verbose prose and reasoning chains.

Scratchpad files serve the same purpose across context boundaries: an agent writes findings to a known file as it goes and can reload them after a compaction or a crash.`,
    },
    {
      heading: 'Context isolation with subagents',
      body: `Some work is inherently verbose: scanning a codebase, reading 30 search results, running a flaky test suite. If that work happens in the main conversation, its noise lives there forever.

**Subagents** solve this by running the noisy task in a fresh context and returning only a compact result. The coordinator's transcript gains a one-paragraph answer instead of 50K tokens of exploration. Key properties to remember for the exam:

- A subagent **does not inherit** the parent's conversation. Everything it needs must be passed explicitly in its prompt.
- Subagents do not share memory with each other between invocations.
- Isolation is also a security boundary: a subagent that reads untrusted web pages can be given read-only tools, so injected instructions cannot reach sensitive actions.

In Claude Code the same idea appears as the **Explore** subagent for verbose discovery, the **Task** tool in the Agent SDK (the parent's \`allowedTools\` must include \`Task\`), and skills with \`context: fork\` in their frontmatter, which run in an isolated sub-context so their output does not pollute the main session. \`/compact\` is the manual equivalent of compaction when a long session fills up.`,
    },
    {
      heading: 'Choosing a strategy',
      body: `| Symptom | Likely cause | First move |
|---|---|---|
| Cost per agent step keeps rising | Tool results accumulating | Trim tool output; enable context editing |
| Model forgets early instructions in long sessions | Drift / lost in the middle | Persistent fact block; restate critical rules near the end |
| Approaching the window limit in a multi-hour task | Transcript too long | Compaction, or start a new session from a structured summary |
| Main agent is cluttered with search noise | No isolation | Delegate to a subagent that returns structured findings |
| Summaries lose amounts and dates | Progressive summarization | Extract facts to a separate layer before summarizing |

A useful exam heuristic: a *bigger context window or a bigger model* is almost never the best answer to a context-quality problem. Attention, not capacity, is the bottleneck, so the right fix shapes and reduces the input.`,
    },
  ],
  examples: [
    {
      title: 'Trimming tool output before it enters the transcript',
      description:
        'A support agent calls `lookup_order`, which returns 40+ fields including shipping telemetry and marketing flags. Only a handful matter for returns. The team filters the result in the agent loop before appending it as a tool result.',
      language: 'python',
      code: `RETURN_FIELDS = {"order_id", "status", "total", "purchased_at", "items", "return_window_ends"}

def run_tool(name: str, args: dict) -> str:
    raw = TOOLS[name](**args)
    if name == "lookup_order":
        raw = {k: v for k, v in raw.items() if k in RETURN_FIELDS}
    return json.dumps(raw)

# in the loop
for block in response.content:
    if block.type == "tool_use":
        results.append({
            "type": "tool_result",
            "tool_use_id": block.id,
            "content": run_tool(block.name, block.input),
        })`,
      takeaway: 'The cheapest token is the one you never add; prune tool results at the source or before appending.',
    },
    {
      title: 'Compaction and context editing are not the same feature',
      description:
        'A team wanted to drop stale `Bash` outputs from a coding agent but configured compaction instead. Their transcript was now full of summaries that paraphrased error messages they needed verbatim. Switching to context editing cleared old tool results without touching the rest of the conversation. Compaction stayed in reserve for when the whole conversation neared the limit.',
      language: 'python',
      code: `# Clear old tool results (no summarization)
response = client.beta.messages.create(
    betas=["context-management-2025-06-27"],
    model="claude-opus-5-5",
    max_tokens=8000,
    tools=tools,
    messages=messages,
    context_management={
        "edits": [{
            "type": "clear_tool_uses_20250919",
            "trigger": {"type": "input_tokens", "value": 100_000},
            "keep": {"type": "tool_uses", "value": 5},
        }]
    },
)

# Summarize history server side when near the limit
response = client.beta.messages.create(
    betas=["compact-2026-01-12"],
    model="claude-opus-5-5",
    max_tokens=8000,
    messages=messages,
    context_management={"edits": [{"type": "compact_20260112"}]},
)
messages.append({"role": "assistant", "content": response.content})  # keep the compaction block`,
      takeaway: 'Context editing deletes stale tool results; compaction rewrites history into a summary block you must pass back.',
    },
    {
      title: 'A persistent case-facts block in a support agent',
      description:
        'After 30 turns, a billing agent summarized history and lost the exact refund amount, then quoted a different number to the customer. The fix extracted transactional facts into a block that is re-inserted verbatim on every call, outside the summarized history.',
      language: 'markdown',
      code: `<case_facts>
customer_id: C-20931
order_id: 88213
purchased_at: 2026-03-12
refund_requested: 47.50 USD
refund_status: approved_pending_processing
customer_expectation: "refund on original card within 5 business days"
</case_facts>

<history_summary>
Customer reported a damaged item, agent verified eligibility, refund approved...
</history_summary>`,
      takeaway: 'Numbers, dates, IDs and promises live in a fact block that is never summarized.',
    },
    {
      title: 'Isolating codebase exploration in a subagent',
      description:
        'An Agent SDK coordinator exploring a legacy monolith kept running out of context because every `Grep` and `Read` result stayed in its transcript. Moving discovery into a subagent that returns a structured summary (files, entry points, open questions) kept the coordinator lean and let it pass that summary into the next phase.',
      language: 'typescript',
      code: `import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const msg of query({
  prompt: "Map the refund flow: entry points, services touched, tests. Delegate file searching to a subagent and return a structured summary.",
  options: {
    allowedTools: ["Read", "Grep", "Glob", "Task"],   // Task enables subagents
    agents: {
      explorer: {
        description: "Searches the codebase and returns findings as a short structured list.",
        prompt: "Search thoroughly, then reply ONLY with: files, key functions, open questions. No raw file dumps.",
        tools: ["Read", "Grep", "Glob"],
      },
    },
  },
})) { /* handle messages */ }`,
      takeaway: 'Noisy work belongs in a subagent; only a compact, structured result should come back.',
    },
  ],
  keyPoints: [
    'The context window is a per-call budget: more tokens mean more cost, more latency and weaker attention, not better answers.',
    'Tool results are the main source of bloat; trim them at the source or before appending them to messages.',
    'Context editing (clear_tool_uses) deletes stale tool results; compaction summarizes history into a compaction block you must pass back. They are different betas.',
    'Progressive summarization loses amounts, dates and IDs; keep them in a persistent fact block outside the summarized history.',
    '"Lost in the middle": put key summaries first, use explicit headers, and restate critical rules near the end of long inputs.',
    'Subagents isolate verbose work; they do not inherit the parent context, so pass what they need explicitly and have them return structured results.',
    'In Claude Code, Explore subagents, context: fork skills and /compact are the practical tools for the same problems.',
    'A bigger model or window is rarely the answer to drift; reshape and reduce the input instead.',
  ],
  flashcards: [
    { front: 'What is "context drift"?', back: 'The model gradually answering from general patterns instead of specific facts it was given, as those facts get buried in a long, noisy transcript.' },
    { front: 'What is the "lost in the middle" effect?', back: 'Models attend reliably to the start and end of long inputs and may miss information in the middle sections.' },
    { front: 'Compaction vs context editing: what does each do?', back: 'Compaction summarizes earlier history into a compaction block server side; context editing clears old tool results without summarizing.' },
    { front: 'Which beta header enables server-side compaction, and what must you do with the response?', back: 'compact-2026-01-12 with edit type compact_20260112; append the full response.content so the compaction block is preserved.' },
    { front: 'Which beta header and edit type clear old tool results?', back: 'context-management-2025-06-27 with edit type clear_tool_uses_20250919, configured with a trigger and a keep count.' },
    { front: 'What is a persistent fact block?', back: 'A small structured block of transactional facts (IDs, amounts, dates, statuses) included verbatim in every prompt, outside the summarized history.' },
    { front: 'Do subagents inherit the parent agent\'s conversation?', back: 'No. Everything a subagent needs must be passed explicitly in its prompt; subagents also do not share memory with each other.' },
    { front: 'What is the first thing to fix when tool results bloat the context?', back: 'The tool itself: return only relevant fields, paginate or cap output so the noise never enters the transcript.' },
    { front: 'Claude Code: how do you keep a verbose skill from polluting the main session?', back: 'Set context: fork in the SKILL.md frontmatter so it runs in an isolated sub-context.' },
    { front: 'Why does a larger context window not fix drift?', back: 'Capacity is not the bottleneck; attention is. More tokens dilute attention further. Reduce and organize the input instead.' },
  ],
  quiz: [
    {
      question:
        'A support agent calls an order-lookup tool that returns 40+ fields per order. After 20 turns the context is large and the agent begins misquoting refund amounts. Which change addresses the root cause MOST directly?',
      options: [
        'Switch to a model with a larger context window.',
        'Trim the tool output to the few return-relevant fields and keep transactional facts in a persistent facts block.',
        'Add "pay close attention to amounts" to the system prompt.',
        'Lower max_tokens so responses are shorter.',
      ],
      correct: [1],
      explanation:
        'The bloat comes from irrelevant tool fields and the misquoting comes from facts drifting in a long transcript; trimming output and persisting facts fixes both. A larger window does not improve attention, a polite instruction is not a control, and max_tokens affects output length, not the input problem.',
    },
    {
      question:
        'A coding agent\'s transcript is filling with stale Bash outputs, but the team needs the recent error messages kept verbatim and does not want earlier turns paraphrased. Which feature fits best?',
      options: [
        'Compaction with compact_20260112, which summarizes everything older than the trigger.',
        'Context editing with clear_tool_uses_20250919, keeping the most recent tool results.',
        'Client-side summarization of the whole conversation every 10 turns.',
        'Prompt caching on the latest message.',
      ],
      correct: [1],
      explanation:
        'Context editing deletes old tool results without summarizing anything, which is exactly the requirement. Compaction and client-side summarization paraphrase history. Prompt caching reduces cost of repeated prefixes but does not shrink the context.',
    },
    {
      question: 'Which TWO statements about subagents and context isolation are correct? (Select two)',
      options: [
        'Subagents automatically inherit the coordinator\'s full conversation history.',
        'A subagent runs in its own context and should return a compact, structured result to the coordinator.',
        'Isolating untrusted-content processing in a subagent with read-only tools limits what injected instructions can do.',
        'Subagents share memory with each other between invocations by default.',
      ],
      correct: [1, 2],
      explanation:
        'Subagents run in isolated contexts, which both keeps the coordinator lean and bounds the blast radius of untrusted content. They do not inherit parent context or share memory; anything they need must be passed explicitly.',
    },
    {
      question:
        'A research coordinator aggregates 12 subagent reports into one 80K-token prompt and asks for a synthesis. Findings from reports 5 through 8 are consistently missing from the output. What is the MOST likely cause and best fix?',
      options: [
        'The model is refusing those reports; add fallbacks.',
        'Position effects (lost in the middle); place a key-findings summary first and organize details under explicit section headers, or have subagents return structured key facts instead of prose.',
        'The reports are too short; ask subagents for more detail.',
        'The context window has been exceeded; the API silently dropped the middle.',
      ],
      correct: [1],
      explanation:
        'Middle sections of long inputs are the ones models most often skip. Restructuring the input and reducing verbosity mitigates it. The API does not silently drop content (it returns an error if the window is exceeded), refusals are a stop reason not a symptom here, and more detail would worsen the problem.',
    },
    {
      question: 'After enabling compaction, a developer appends only the text block from each response to the message history. What goes wrong?',
      options: [
        'Nothing; compaction blocks are stored server side.',
        'The compaction block is lost, so the next request resends the full un-compacted history and the benefit disappears.',
        'The API returns a 400 because text blocks cannot be appended.',
        'Cache reads drop to zero.',
      ],
      correct: [1],
      explanation:
        'The compaction block must be passed back in subsequent requests; it is the summary that replaces earlier history. The API is stateless, so nothing is stored server side between calls. Appending text blocks is valid, and caching is unrelated.',
    },
    {
      question:
        'A multi-hour Claude Code session exploring a monolith starts giving inconsistent answers about classes it identified earlier. Which combination is the best response?',
      options: [
        'Keep going; the model will recover as it reads more files.',
        'Record key findings in a scratchpad file, use /compact or start a fresh session from a structured summary, and delegate further discovery to an Explore subagent.',
        'Increase effort to max so the model reasons harder about the existing transcript.',
        'Paste the entire repository into CLAUDE.md so it is always present.',
      ],
      correct: [1],
      explanation:
        'These are the standard context-degradation remedies: persist findings outside the transcript, reduce the transcript, and isolate verbose discovery. More effort does not fix a cluttered context, and loading the whole repository into CLAUDE.md makes bloat permanent.',
    },
  ],
  statements: [
    { text: 'Because current models have a 1M-token context window, filling it is harmless as long as you stay under the limit.', isTrue: false, explanation: 'Cost, latency and attention quality all degrade with size. The window is a budget to spend carefully.' },
    { text: 'Context editing (clear_tool_uses) removes old tool results without summarizing them.', isTrue: true, explanation: 'It drops stale tool result content based on a trigger and keep count; nothing is paraphrased.' },
    { text: 'Compaction returns a compaction block that you must include in subsequent requests.', isTrue: true, explanation: 'Append the full response.content; the block replaces the summarized history.' },
    { text: 'Subagents inherit the coordinator\'s conversation history automatically.', isTrue: false, explanation: 'Subagent context must be provided explicitly in the prompt. This is what makes isolation work.' },
    { text: 'Progressive summarization is a safe way to preserve amounts, dates and order IDs over long sessions.', isTrue: false, explanation: 'Summaries typically blur exactly those details. Keep them in a persistent fact block that is never summarized.' },
    { text: 'Placing a key-findings summary at the beginning of a long aggregated input helps counter the lost-in-the-middle effect.', isTrue: true, explanation: 'The beginning and end receive the most reliable attention, so lead with what matters.' },
    { text: 'The most effective fix for context bloat from verbose tools is to switch to a larger model.', isTrue: false, explanation: 'Model size does not change how much noise is in the transcript. Fix the tool output or prune it.' },
    { text: 'In Claude Code, a skill with context: fork runs in an isolated sub-context so its output does not fill the main session.', isTrue: true, explanation: 'This is the recommended setting for verbose or exploratory skills.' },
  ],
  resources: [
    { label: 'Context windows (Claude docs)', url: 'https://platform.claude.com/docs/en/build-with-claude/context-windows' },
    { label: 'Compaction', url: 'https://platform.claude.com/docs/en/build-with-claude/compaction' },
    { label: 'Context editing', url: 'https://platform.claude.com/docs/en/build-with-claude/context-editing' },
    { label: 'Subagents in the Agent SDK', url: 'https://platform.claude.com/docs/en/agent-sdk/subagents' },
  ],
};
