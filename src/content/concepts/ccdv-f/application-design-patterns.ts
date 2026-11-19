import type { Concept } from '../../types';

export const applicationDesignPatterns: Concept = {
  id: 'application-design-patterns',
  title: 'Application Design Patterns',
  summary:
    'Design decisions that make Claude applications reliable: input and output schemas, session hygiene, conversation state storage, idempotent tool side effects, plugin management and designing for non-determinism.',
  certs: ['ccdv-f', 'ccar-f', 'ccar-p'],
  domains: ['ccdv-f-2', 'ccdv-f-6', 'ccar-f-4', 'ccar-f-5', 'ccar-p-1'],
  tags: ['design', 'schema', 'state', 'idempotency', 'non-determinism', 'plugins'],
  difficulty: 'intermediate',
  diagram: 'structured-output-flow',
  sections: [
    {
      heading: 'Schema design for inputs and outputs',
      body: `A Claude application has two contracts: what you give the model and what you accept back.

**Inputs.** Structure beats prose. Give data in typed blocks (document, image, search_result) or in labelled XML sections, keep field names stable so caching works, and include only what the task needs. For tools, write JSON Schemas with descriptive property names and descriptions; the schema is read by the model as documentation.

**Outputs.** Decide the shape before you write the prompt. The reliable options on current models are structured outputs (\`output_config.format\` with a JSON schema) or a tool whose input schema is the result shape, with \`strict: true\` for schema-valid arguments. Assistant prefill and forced \`tool_choice\` are not available on current models, so do not design around them.

Schema advice that shows up in exam scenarios: make fields optional or nullable when the source may lack them, so the model is not forced to invent values; add a \`confidence\` or \`evidence\` field when a human will review; version the schema; and validate on receipt. A schema-valid response can still be wrong, so validation is about shape and business rules, not truth.`,
    },
    {
      heading: 'Session hygiene',
      body: `Because the API is stateless, every turn resends the history, and history is where quality and cost drift. Session hygiene is deciding what stays in context:

- **Keep**: the system prompt, the user's goal, decisions made, the most recent tool results, and any artefact the next step needs.
- **Prune**: large tool outputs that have been consumed (replace with a short summary or a pointer), repeated retries, verbose logs.
- **Summarise**: when a conversation approaches the budget you set, compact it into a summary plus recent turns. Server-side compaction (beta) and context editing (beta) do this for you; in Claude Code, \`/compact\` does it; in your own harness, you write the summariser.
- **Start fresh**: when the task changes, when the model starts contradicting earlier decisions, or when the context is dominated by stale material. A new session with a short brief usually beats a long polluted one.

Keep edits append-only where models check thinking signatures: prefer summary-plus-recent-turns compaction, server-side context management, or a fresh session over rewriting earlier messages.`,
    },
    {
      heading: 'Storing conversation state',
      body: `Where does the transcript live? Three patterns:

| Pattern | Fits | Watch out for |
|---|---|---|
| Client holds the full history in memory | Short tools, CLIs | Lost on crash; grows unbounded |
| Your database stores messages per session id | Chat products, agents | Store the full content arrays (tool_use, thinking), not just text; redact PII per policy |
| Server-side threads / compaction (beta) | Long-running assistants | Platform availability; still own the user-facing record |

Persist after each completed step, not at the end, so a crash resumes from the last tool result. Store the raw \`usage\` with each turn for cost attribution. Decide retention and deletion up front; transcripts often contain personal data. Store the exact model id and prompt version used for each turn so you can debug a regression later.`,
    },
    {
      heading: 'Idempotent tool side effects',
      body: `Models retry, networks drop and harnesses replay turns. Any tool that changes the world must tolerate being called twice with the same input:

- Derive an idempotency key from the \`tool_use\` id (unique per call) or from a business key (order number). Store completed keys; on a repeat, return the stored result.
- Prefer tools that are naturally idempotent ("set status to shipped") over ones that are not ("increment counter").
- Separate "propose" from "commit" for high-stakes actions: the model drafts, a deterministic step or a human approves, then the side effect runs once.
- Return structured results including a stable identifier so the model can reference the created object rather than re-creating it.

This is the enforced counterpart to telling the model "do not duplicate orders", which is advice, not a guarantee.`,
    },
    {
      heading: 'Plugins and designing for non-determinism',
      body: `**Plugin management.** Claude Code plugins bundle skills, commands, agents, hooks and MCP servers that can be installed from a marketplace. Treat them like dependencies: pin versions, review what hooks and tools they add, scope them per project where possible, and keep the set small. Every plugin adds context and permissions, so an unmanaged plugin list is both a cost and a security problem. The same applies to MCP servers configured in \`.mcp.json\`.

**Non-determinism.** Two identical requests can produce different outputs. Design assuming it:

- Validate every output against its schema and business rules; never trust shape or confidence.
- Make flows tolerant of variation: retry with feedback on validation failure (bounded), not infinite loops.
- Use evals with many samples rather than a single run to judge a prompt change.
- Keep deterministic logic (math, lookups, authorisation) in code, not in the model.
- Log the full request and response so a surprising output can be reproduced and diagnosed as an integration bug or a model behaviour.`,
    },
  ],
  examples: [
    {
      title: 'Structured output with nullable fields and validation',
      description:
        'An invoice extractor returns JSON. Fields that may be missing are nullable so the model does not fabricate, and the result is validated before it is stored.',
      language: 'python',
      code: `schema = {
  "type": "object",
  "properties": {
    "invoice_number": {"type": "string"},
    "total": {"type": ["number", "null"]},
    "due_date": {"type": ["string", "null"], "description": "ISO date or null if absent"},
    "evidence": {"type": "string", "description": "Quote supporting the total"},
  },
  "required": ["invoice_number", "total", "due_date", "evidence"],
  "additionalProperties": False,
}
resp = client.messages.create(
    model="claude-opus-5-5", max_tokens=800,
    output_config={"format": {"type": "json_schema", "schema": schema}},
    messages=[{"role": "user", "content": [doc_block, {"type": "text", "text": "Extract."}]}],
)
data = json.loads(resp.content[0].text)
if data["total"] is not None and data["total"] < 0:
    raise ValueError("business rule: negative total")`,
      takeaway: 'Nullable fields prevent invention; schema validity is not truth, so apply business rules too.',
    },
    {
      title: 'Persisting state per step and compacting',
      description:
        'A long-running research agent stores each turn as it completes and compacts when the transcript passes a token budget, keeping the brief plus the last few turns.',
      language: 'typescript',
      code: `async function step(sessionId: string, messages: Anthropic.MessageParam[]) {
  const res = await client.messages.create({ model: "claude-opus-5-5", max_tokens: 8000, tools, messages });
  messages.push({ role: "assistant", content: res.content });
  await db.appendTurn(sessionId, res.content, res.usage, res.model);   // persist now

  const count = await client.messages.countTokens({ model: "claude-opus-5-5", messages });
  if (count.input_tokens > 150_000) {
    const summary = await summarise(messages.slice(0, -6));
    messages.splice(0, messages.length - 6, { role: "user", content: \`<summary>\${summary}</summary>\` });
  }
  return res;
}`,
      takeaway: 'Persist every step; compact into summary plus recent turns before the context bloats.',
    },
    {
      title: 'Mistake: the model as the source of truth for a total',
      description:
        'A finance tool asked Claude to sum line items and store the total. Occasionally the sum was off by a few cents and nobody noticed for weeks. The fix: extract line items with a schema, compute the total in code, and ask the model only for a stated_total to flag discrepancies.',
      language: 'text',
      code: `Before: model returns {"total": 1043.17}  -> stored as truth

After:  model returns {"line_items": [...], "stated_total": 1043.17}
        code computes calculated_total = sum(items)
        if abs(calculated_total - stated_total) > 0.01: flag_for_review()`,
      takeaway: 'Keep arithmetic and other deterministic logic in code; use the model to extract and to flag.',
    },
  ],
  keyPoints: [
    'Define output shape first: structured outputs (output_config.format) or a strict tool schema; no prefill or forced tool_choice on current models.',
    'Make schema fields nullable/optional when data may be absent; add evidence or confidence fields for human review; validate shape and business rules on receipt.',
    'Session hygiene: keep goals and decisions, prune consumed tool output, summarise before the budget, start fresh when the task changes or context is polluted.',
    'Store full content arrays, usage, model id and prompt version per turn; persist after each step; set retention and PII policy.',
    'Make tool side effects idempotent with a key from the tool_use id or a business key; separate propose from commit for high-stakes actions.',
    'Treat plugins and MCP servers as dependencies: pin, review, scope, keep few.',
    'Design for non-determinism: validate everything, bounded retries with feedback, evals over many samples, deterministic logic in code.',
  ],
  flashcards: [
    { front: 'Two reliable ways to get schema-shaped output on current models?', back: 'Structured outputs via output_config.format with a JSON schema, or a tool with a strict input schema.' },
    { front: 'Why make schema fields nullable?', back: 'So the model can report absence instead of inventing a value when the source lacks the data.' },
    { front: 'What is session hygiene?', back: 'Deciding what stays in context: keep goals and decisions, prune consumed output, summarise before limits, start fresh when the task changes.' },
    { front: 'When should you start a fresh session instead of compacting?', back: 'When the task changes, the model contradicts earlier decisions, or stale material dominates the context.' },
    { front: 'What should be stored with each persisted turn?', back: 'Full content array, usage, model id and prompt version (and a session id).' },
    { front: 'What is a good idempotency key for a tool side effect?', back: 'The tool_use id (unique per call) or a stable business key such as an order number.' },
    { front: 'Does a schema-valid response guarantee a correct answer?', back: 'No. Validity is about shape; apply business rules and keep deterministic logic in code.' },
    { front: 'How should plugins and MCP servers be managed?', back: 'Like dependencies: pin versions, review hooks and tools they add, scope per project, keep the set small.' },
    { front: 'How do you judge whether a prompt change helped, given non-determinism?', back: 'Run an eval over many samples rather than comparing single runs.' },
  ],
  quiz: [
    {
      question:
        'An extraction pipeline sometimes returns fabricated due dates for invoices that have none. Which schema change best addresses this?',
      options: [
        'Make due_date required and add "be accurate" to the prompt.',
        'Make due_date nullable with a description saying null if absent.',
        'Remove due_date from the schema entirely.',
        'Increase effort to high.',
      ],
      correct: [1],
      explanation:
        'A required field forces a value; nullable lets the model report absence. Removing the field loses data, and effort does not change the forced-value problem.',
    },
    {
      question: 'A long-running agent becomes slower and starts contradicting earlier decisions after many tool calls. What is the most appropriate response?',
      options: [
        'Raise max_tokens so the model can reason more.',
        'Compact the history into a summary plus recent turns, or start a fresh session with a brief if the task has shifted.',
        'Switch to a model with a larger context window and continue.',
        'Delete the system prompt to free space.',
      ],
      correct: [1],
      explanation:
        'Context bloat and drift are solved by session hygiene. max_tokens affects output, a bigger window delays the problem, and removing the system prompt loses the standing rules.',
    },
    {
      question: 'Which TWO practices make tool side effects safe under retries? (Select two)',
      options: [
        'Keying each side effect on the tool_use id and returning the stored result on repeats.',
        'Telling the model in the system prompt not to call the tool twice.',
        'Separating a propose step from a deterministic or human-approved commit step.',
        'Setting SDK max_retries to zero everywhere.',
      ],
      correct: [0, 2],
      explanation:
        'Idempotency keys and propose/commit are enforced controls. Prompt instructions are advice, and disabling retries harms reliability without preventing harness-level replays.',
    },
    {
      question: 'A team wants to compare two prompt versions. One run each shows version B slightly better. What should they conclude?',
      options: [
        'Ship B; a single comparison is sufficient.',
        'Nothing yet; outputs are non-deterministic, so run an eval over many samples before deciding.',
        'Ship A; the difference is noise so keep the original.',
        'Average the two prompts into one.',
      ],
      correct: [1],
      explanation:
        'Single runs are noise-dominated. Evals over many cases are the designed way to judge prompt changes.',
    },
    {
      question: 'What is the most important thing to store alongside each persisted conversation turn for later debugging?',
      options: ['Only the visible assistant text', 'The full content array plus usage, model id and prompt version', 'The user\'s IP address', 'The SDK version only'],
      correct: [1],
      explanation:
        'Full content preserves tool_use and thinking for replay; usage, model id and prompt version let you attribute cost and reproduce regressions. IP is unnecessary PII.',
    },
  ],
  statements: [
    { text: 'A response that validates against your JSON schema can still contain wrong values.', isTrue: true, explanation: 'Schema validity is about shape; apply business rules and keep deterministic logic in code.' },
    { text: 'Assistant prefill is a recommended way to force JSON output on current models.', isTrue: false, explanation: 'Prefill is removed on current models; use structured outputs or a strict tool schema.' },
    { text: 'Persisting state only when a task completes is sufficient for a tool-using agent.', isTrue: false, explanation: 'Persist after each step so a crash resumes from the last tool result rather than replaying side effects.' },
    { text: 'The tool_use id is a suitable idempotency key for a tool side effect.', isTrue: true, explanation: 'It is unique per call; a business key also works.' },
    { text: 'Installing many plugins has no effect on context size or security posture.', isTrue: false, explanation: 'Each plugin adds tools, hooks and context; manage them like dependencies.' },
    { text: 'Starting a fresh session can be the right move when the task changes substantially.', isTrue: true, explanation: 'A short brief in a clean context usually beats a long polluted history.' },
  ],
  resources: [
    { label: 'Structured outputs', url: 'https://platform.claude.com/docs/en/build-with-claude/structured-outputs' },
    { label: 'Context windows', url: 'https://platform.claude.com/docs/en/build-with-claude/context-windows' },
    { label: 'Claude Code plugins', url: 'https://code.claude.com/docs/en/plugins' },
  ],
};
