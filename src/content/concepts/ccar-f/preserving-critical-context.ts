import type { Concept } from '../../types';

export const preservingCriticalContext: Concept = {
  id: 'preserving-critical-context',
  title: 'Preserving Critical Context Across Long Interactions',
  summary:
    'Keep the facts that matter (amounts, dates, order numbers, customer expectations) intact across long conversations by separating them from summarized history, trimming verbose tool results, and structuring aggregated inputs against position effects.',
  certs: ['ccar-f', 'ccdv-f', 'ccar-p'],
  domains: ['ccar-f-5', 'ccdv-f-6', 'ccar-p-1'],
  tags: ['context', 'summarization', 'tool-results', 'multi-agent', 'support-agent'],
  difficulty: 'intermediate',
  diagram: 'context-window',
  sections: [
    {
      heading: 'Why long interactions lose the facts that matter',
      body: `Every API request is stateless: the model only knows what you put in \`messages\`. To keep a conversation coherent you pass the complete history (or a faithful substitute) on each call. When a support session runs to 40 turns with a dozen tool calls, that history gets long, and teams reach for **progressive summarization**: replace older turns with a summary and keep going.

The problem is what summaries do to precise values. "Customer wants a refund of $249.99 for order A-18834 placed on 3 March, expects it within 5 business days" becomes "customer wants a refund for a recent order." The amount, the order id, the date and the customer's stated expectation are exactly the things a later turn needs to call \`process_refund\` correctly, and they are exactly what gets blurred. Numbers, percentages, dates and customer-stated expectations degrade first because a summary optimizes for gist, not for transactional precision.

A second failure is **lost in the middle**: models reliably attend to information at the beginning and end of a long input but may skip findings buried in the middle. A coordinator that concatenates ten subagent reports and asks for a synthesis will tend to over-weight reports one and ten.

A third is **tool-result bloat**. A \`lookup_order\` call may return 40+ fields (warehouse codes, carrier metadata, internal flags) when the agent needs five. Those tokens stay in context for the rest of the session, consuming budget out of all proportion to their relevance and pushing the useful facts further into the middle.`,
    },
    {
      heading: 'Pattern 1: a persistent case-facts block',
      body: `Separate what must stay exact from what can be compressed. As the agent learns transactional facts (order ids, amounts, statuses, dates, promises made to the customer), extract them into a structured **case facts** block that is included verbatim in every prompt, outside the summarized history.

\`\`\`text
## Case facts (authoritative, do not infer)
customer_id: C-77120 (verified via get_customer)
order_id: A-18834   placed: 2026-03-03   total: 249.99 USD
issue: damaged on arrival, photo evidence received
promised: refund to original card within 5 business days
status: refund_not_yet_processed
\`\`\`

The conversational history can then be summarized aggressively, because nothing precise lives only in the summary. Place the block near the end of the system prompt or at the top of the latest user turn, both positions the model attends to well. For **multi-issue sessions** (a customer with a return and a separate billing dispute) keep one entry per issue in a separate context layer, so resolving one issue does not blur the facts of another.

The block should be maintained by code where possible: parse the tool results your own code already receives and write the relevant fields into the block, rather than hoping the model remembers to restate them.`,
    },
    {
      heading: 'Pattern 2: trim tool outputs before they accumulate',
      body: `Tool results are the biggest controllable source of context growth. Filter them **before** they enter the conversation, not after.

- In the tool implementation (or a thin wrapper), project the raw record down to the fields the agent's job needs. For a returns agent, keep \`order_id\`, \`items\`, \`total\`, \`order_date\`, \`delivery_status\` and \`return_eligibility\`, and drop warehouse routing, tax breakdowns and carrier internals.
- Return structured JSON with stable keys rather than a dump of the backend response. Stable shape also helps prompt caching and downstream parsing.
- If the agent occasionally needs a rarely-used field, expose it through a second, narrower tool (\`get_order_shipping_details\`) instead of returning everything every time.

When a loop is already long, platform features can help: **context editing** (beta) clears old tool results server side, and **compaction** (beta) summarizes history server side. Both are different features, and neither is a substitute for trimming at the source, because a summary of a 40-field record is still a summary; the exact fields you need should already be in your case-facts block before any clearing happens.`,
    },
    {
      heading: 'Pattern 3: structure aggregated inputs against position effects',
      body: `When a coordinator hands many results to a synthesis step, do not concatenate them in arrival order and hope.

1. **Headers and key findings first.** Open the aggregated input with a short "key findings" summary that names every section and the one or two facts from each that must not be missed. The detailed material follows under explicit section headers (\`## Source 3: 2025 pricing report\`). The model sees the critical facts in the high-attention opening position and can navigate to details by header.
2. **Make upstream outputs structured, not verbose.** If a downstream agent has a limited context budget, modify the upstream subagents to return key facts, citations and relevance scores rather than full content plus reasoning chains. A research subagent returning a 3,000-word narrative per source will exhaust the synthesizer's budget by source four; the same subagent returning ten findings with excerpt, source and score fits comfortably.
3. **Require metadata in structured outputs.** Dates, source locations and methodological context (sample size, measurement method) must travel with each finding, because the synthesizer needs them to decide whether two numbers conflict or merely describe different years.

The exam angle: when a scenario says the final output is missing something that a middle subagent clearly found, suspect position effects and verbose aggregation before suspecting the subagent.`,
    },
  ],
  examples: [
    {
      title: 'The refund that drifted from $249.99 to "about $250"',
      description: `A support agent summarizes every ten turns to save tokens. A customer reports a damaged kettle (order A-18834, $249.99). After a long exchange about delivery, the agent calls \`process_refund\` with \`amount: 250.00\`, and finance flags a mismatch. The summary had reduced the amount to "roughly $250" and the model filled in a round number.

**Fix:** stop relying on the summary for transactional values. Code extracts \`order_id\`, \`total\` and \`order_date\` from the \`lookup_order\` result into a case-facts block that is appended to every prompt verbatim. The summary now only has to carry the narrative.`,
      language: 'python',
      code: `import anthropic, json
client = anthropic.Anthropic()

RELEVANT = ("order_id", "total", "currency", "order_date", "delivery_status", "return_eligibility")

def trim_order(raw: dict) -> dict:
    return {k: raw[k] for k in RELEVANT if k in raw}

def build_system(policy: str, case_facts: dict) -> list[dict]:
    return [
        {"type": "text", "text": policy, "cache_control": {"type": "ephemeral"}},
        {"type": "text", "text": "## Case facts (authoritative)\\n" + json.dumps(case_facts, indent=2)},
    ]

# after each lookup_order tool result arrives in your loop:
#   case_facts.update(trim_order(result))
# then on the next call:
#   client.messages.create(model="claude-opus-5-5", max_tokens=1024,
#       system=build_system(POLICY, case_facts), messages=summarized_history + [latest_turn])`,
      takeaway: 'Precise values belong in a structured block that is never summarized; the narrative history is what you compress.',
    },
    {
      title: 'Forty fields for a five-field job',
      description: `A team notices that a returns agent hits context limits after about 25 tool calls. Inspecting the transcript shows each \`lookup_order\` result is roughly 1,800 tokens: warehouse codes, tax lines, carrier scan events, fraud scores. The agent uses six of those fields.

**Fix:** the MCP server projects the record to the return-relevant fields before returning it. Result size drops to about 180 tokens, sessions no longer hit limits, and the model stops being distracted by irrelevant internal flags.`,
      language: 'typescript',
      code: `// MCP tool handler: project before returning
server.tool("lookup_order", { orderId: z.string() }, async ({ orderId }) => {
  const raw = await orders.get(orderId);
  const trimmed = {
    order_id: raw.id,
    items: raw.lineItems.map((l) => ({ sku: l.sku, name: l.name, qty: l.quantity })),
    total: raw.totals.grand,
    currency: raw.totals.currency,
    order_date: raw.placedAt,
    delivery_status: raw.shipment?.status ?? "unknown",
    return_eligibility: raw.policy.returnEligible,
  };
  return { content: [{ type: "text", text: JSON.stringify(trimmed) }] };
});`,
      takeaway: 'Trim tool outputs at the source; the agent should never see fields its job does not need.',
    },
    {
      title: 'Research synthesis that forgot sources four through eight',
      description: `A multi-agent research system runs ten search subagents and feeds their reports, concatenated in order, to a synthesis agent. Reviewers notice the final reports lean heavily on the first and last two sources; findings from the middle appear only when they are repeated elsewhere.

**Fix:** the coordinator rewrites the aggregated input. A "key findings" index listing each source and its headline fact goes first; detailed findings follow under explicit \`## Source N\` headers; each finding is a structured item (claim, excerpt, source, date, relevance score) rather than prose. Middle-source coverage in the final reports rises to parity with the ends.`,
      language: 'markdown',
      code: `# Aggregated findings for synthesis

## Key findings index (read first)
- Source 1 (2025 industry survey): adoption 41% among mid-size firms
- Source 2 (academic paper, 2024): productivity +12% in controlled trial
- Source 5 (regulator report, 2026): 3 enforcement actions; see conflicts with Source 7
- ...

## Source 1: 2025 industry survey (published 2025-09-14)
- claim: ... | excerpt: "..." | relevance: 0.9
## Source 2: ...`,
      takeaway: 'Put a findings index at the top and label every section; the model attends to the start and navigates by headers.',
    },
    {
      title: 'Mistake: summarizing instead of passing history',
      description: `To save money, a developer sends only the latest user message plus a one-line summary on every turn of a chat. Customers complain the agent "forgets" what they said two messages ago and re-asks for the order number.

The fix is not to abandon summarization but to be honest about what each layer is for: pass the recent turns in full for coherence, summarize only older turns, and keep transactional facts in the case-facts block. Prompt caching makes passing the full recent history cheap, because the unchanged prefix is read from cache.`,
      takeaway: 'Conversational coherence needs the real recent history; summaries are for the distant past, and facts live in their own block.',
    },
  ],
  keyPoints: [
    'The API is stateless; conversational coherence depends on passing complete (or faithfully preserved) history on each request.',
    'Progressive summarization blurs numbers, percentages, dates and customer-stated expectations first; never let a summary be the only home of a transactional fact.',
    'Keep a persistent, structured "case facts" block (ids, amounts, statuses, dates, promises) in every prompt, outside the summarized history; one entry per issue for multi-issue sessions.',
    'Trim verbose tool outputs to relevant fields before they enter context; a 40-field order record is a 5-field job.',
    'Lost-in-the-middle: models attend best to the beginning and end of long inputs, so put key findings first and use explicit section headers.',
    'When downstream agents have tight budgets, change upstream agents to return structured key facts, citations and relevance scores instead of verbose content and reasoning.',
    'Require dates, source locations and methodological context in subagent outputs so synthesis can interpret findings correctly.',
    'Context editing and compaction are server-side features for making room; they do not replace trimming at the source or a case-facts block.',
  ],
  flashcards: [
    { front: 'Which kinds of information degrade first under progressive summarization?', back: 'Numerical values, percentages, dates, order ids and customer-stated expectations; summaries keep gist and drop precision.' },
    { front: 'What is the "lost in the middle" effect?', back: 'Models process information at the beginning and end of long inputs reliably but may omit findings from the middle sections.' },
    { front: 'What is a "case facts" block?', back: 'A structured block of transactional facts (ids, amounts, statuses, dates, promises) included verbatim in every prompt, kept outside the summarized history.' },
    { front: 'Where should verbose tool outputs be trimmed?', back: 'At the source, in the tool or a wrapper, before the result enters the conversation and accumulates.' },
    { front: 'How do you mitigate position effects in an aggregated input for synthesis?', back: 'Put a key-findings summary first and organize the detailed results under explicit section headers.' },
    { front: 'A downstream synthesis agent keeps running out of context. What upstream change helps most?', back: 'Have upstream subagents return structured key facts, citations and relevance scores instead of verbose content and reasoning chains.' },
    { front: 'What metadata should subagent outputs carry for accurate synthesis?', back: 'Dates (publication or collection), source locations and methodological context.' },
    { front: 'Why pass the complete conversation history in subsequent API requests?', back: 'Each request is stateless; without the prior turns the model cannot maintain conversational coherence.' },
    { front: 'How do compaction and context editing differ?', back: 'Compaction summarizes history server side; context editing clears old tool results. Both are beta features and neither replaces a case-facts block.' },
    { front: 'How should a multi-issue support session store facts?', back: 'As structured issue data (order ids, amounts, statuses) in a separate context layer, one entry per issue.' },
  ],
  quiz: [
    {
      question:
        'A support agent summarizes conversation history every ten turns. Finance reports refunds being issued for slightly wrong amounts late in long sessions. Which change MOST directly fixes the root cause?',
      options: [
        'Switch to a larger model so it summarizes more accurately.',
        'Extract order ids, amounts and dates into a structured case-facts block that is included verbatim in every prompt, separate from the summarized history.',
        'Summarize every five turns instead of every ten so less is lost at once.',
        'Instruct the model in the system prompt to be careful with numbers when summarizing.',
      ],
      correct: [1],
      explanation:
        'Summaries inherently blur precise values, so the fix is to stop relying on them for transactional facts. A bigger model or more frequent summaries still produce summaries; a politeness instruction is probabilistic, not a control.',
    },
    {
      question:
        'A returns agent hits context limits after about 25 tool calls. Each lookup_order result is roughly 1,800 tokens, but the agent uses six fields. What is the MOST appropriate first step?',
      options: [
        'Enable server-side compaction so the history is summarized when it gets long.',
        'Trim the lookup_order result to the return-relevant fields in the tool implementation before it is returned.',
        'Move to a model with a larger context window.',
        'Ask the model to ignore irrelevant fields in its reasoning.',
      ],
      correct: [1],
      explanation:
        'Trimming at the source removes the bloat before it accumulates and keeps the agent focused. Compaction and a larger window treat the symptom and still carry the irrelevant fields until they are cleared; asking the model to ignore fields does not reduce tokens.',
    },
    {
      question:
        'A synthesis agent receives ten subagent reports concatenated in order. Its reports consistently under-represent sources four through eight even though those subagents found relevant material. What is the MOST likely cause?',
      options: [
        'The middle subagents have weaker search queries.',
        'Position effects: the model attends to the beginning and end of the long input and skips middle sections.',
        'The synthesis agent needs a higher effort setting.',
        'Subagents four through eight returned results in the wrong language.',
      ],
      correct: [1],
      explanation:
        'The pattern (ends covered, middle missing) is the signature of lost-in-the-middle. The subagents found relevant material, so their queries are not the cause; effort does not change attention over position; nothing suggests a language problem.',
    },
    {
      question:
        'Which TWO changes help a downstream synthesis agent with a limited context budget make correct use of upstream findings? (Select two)',
      options: [
        'Have upstream subagents return structured key facts, citations and relevance scores instead of full narrative and reasoning.',
        'Require each upstream finding to include its publication or collection date and source location.',
        'Have upstream subagents return their full reasoning chains so the synthesizer can audit them.',
        'Remove section headers from the aggregated input so the synthesizer reads it as one continuous document.',
      ],
      correct: [0, 1],
      explanation:
        'Structured, compact findings fit the budget, and metadata lets the synthesizer interpret them correctly. Full reasoning chains blow the budget, and removing headers worsens position effects.',
    },
    {
      question:
        'A developer sends only the latest user message plus a one-sentence summary each turn to save tokens. Users say the agent forgets what they said two messages ago. What should the developer do?',
      options: [
        'Pass the recent turns in full, summarize only older history, keep transactional facts in a dedicated block, and use prompt caching to keep the cost down.',
        'Increase max_tokens so the model can respond at greater length.',
        'Add "remember the previous messages" to the system prompt.',
        'Replace the summary with the model\'s own notes written during the previous turn.',
      ],
      correct: [0],
      explanation:
        'Coherence requires the real recent history; caching makes it cheap. max_tokens affects output only; the model cannot remember messages it was never sent; self-written notes are another lossy summary.',
    },
    {
      question:
        'A customer raises a return (order A-18834, $249.99) and, later in the same session, a billing dispute on a different order ($39.00). Which design BEST prevents the agent from mixing up the two?',
      options: [
        'Ask the customer to open a second chat for the second issue.',
        'Maintain structured issue data (order id, amount, status) per issue in a separate context layer that is included in each prompt.',
        'Summarize the first issue once it seems resolved so it stops distracting the model.',
        'Rely on the model to keep the two orders straight because both ids appear in the history.',
      ],
      correct: [1],
      explanation:
        'Per-issue structured data keeps each set of facts exact and distinct. Forcing a second chat hurts the customer experience; summarizing the first issue risks blurring the amount; relying on the raw history is what fails in long sessions.',
    },
  ],
  statements: [
    { text: 'Progressive summarization tends to preserve the narrative of a conversation while blurring exact amounts, dates and ids.', isTrue: true, explanation: 'Summaries optimize for gist, which is why transactional facts should live in a separate structured block.' },
    { text: 'Models process information in the middle of a long input as reliably as information at the beginning and end.', isTrue: false, explanation: 'The lost-in-the-middle effect means middle sections may be omitted; put key findings first and use section headers.' },
    { text: 'Tool results should be trimmed to relevant fields after the session ends, when the transcript is archived.', isTrue: false, explanation: 'Trimming must happen before results enter context, otherwise they consume tokens for the whole session.' },
    { text: 'Because the API is stateless, each request must carry the conversation history the model needs.', isTrue: true, explanation: 'Nothing persists between calls unless you send it (or use a server-side feature such as compaction).' },
    { text: 'Compaction and context editing are two names for the same feature.', isTrue: false, explanation: 'Compaction summarizes history server side; context editing clears old tool results. They are separate beta features.' },
    { text: 'Requiring subagents to include dates and source locations in structured outputs supports accurate downstream synthesis.', isTrue: true, explanation: 'Without that metadata the synthesizer cannot tell a temporal difference from a contradiction or attribute a claim.' },
    { text: 'A case-facts block should be rebuilt from the summarized history at the start of each turn.', isTrue: false, explanation: 'That would reintroduce summarization loss. Populate it from the raw tool results and keep it outside the summary.' },
  ],
  resources: [
    { label: 'Context windows (Claude docs)', url: 'https://platform.claude.com/docs/en/build-with-claude/context-windows' },
    { label: 'Context editing (Claude docs)', url: 'https://platform.claude.com/docs/en/build-with-claude/context-editing' },
    { label: 'Compaction (Claude docs)', url: 'https://platform.claude.com/docs/en/build-with-claude/compaction' },
    { label: 'Prompt caching (Claude docs)', url: 'https://platform.claude.com/docs/en/build-with-claude/prompt-caching' },
  ],
};
