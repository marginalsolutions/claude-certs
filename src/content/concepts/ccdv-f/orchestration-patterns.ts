import type { Concept } from '../../types';

export const orchestrationPatterns: Concept = {
  id: 'orchestration-patterns',
  title: 'Orchestration Patterns',
  summary:
    'The standard ways to compose multiple Claude calls: prompt chaining, routing, parallelization, orchestrator-workers (manager/supervisor), evaluator-optimizer, and hub-and-spoke coordinators with context-isolated subagents.',
  certs: ['ccdv-f', 'ccar-f', 'ccar-p'],
  domains: ['ccdv-f-1', 'ccdv-f-6', 'ccar-f-1', 'ccar-f-4', 'ccar-p-1'],
  tags: ['agents', 'workflows', 'multi-agent', 'subagents', 'architecture'],
  difficulty: 'intermediate',
  diagram: 'orchestration-patterns',
  sections: [
    {
      heading: 'Workflow patterns: chaining, routing, parallelization',
      body: `Three patterns keep control flow in your code while using several model calls.

**Prompt chaining** decomposes a task into fixed sequential steps, each call consuming the previous output. Add programmatic **gates** between steps (schema validation, a test run, a length check) so a bad intermediate result stops the chain early. Use it when the task splits cleanly into predictable sub-steps: draft, then translate; analyze each file, then run a cross-file integration pass.

**Routing** classifies an input and dispatches it to a specialized prompt, tool set or model. It lets you tune each path independently and send easy cases to a cheaper model. Use it when inputs fall into distinct categories that need different handling; a mis-route is the main failure, so evaluate the classifier on its own.

**Parallelization** runs independent calls at once and merges the results. Two flavors: **sectioning** (split the work into independent parts, such as one review pass per file) and **voting** (run the same task several times and aggregate, useful for high-stakes judgments like "is this code vulnerable?"). Parallel calls cut latency and give each call a narrower focus, which improves attention on long inputs.`,
    },
    {
      heading: 'Orchestrator-workers and manager/supervisor hierarchies',
      body: `When the sub-tasks are not known in advance, a central model **dynamically** decomposes the task, delegates pieces to worker calls, and synthesizes their outputs. Anthropic calls this **orchestrator-workers**; the exam guides also say manager/supervisor or **coordinator-subagent**.

The orchestrator (manager) owns:

- **Decomposition**: deciding which subtasks exist based on the request and on what earlier workers found.
- **Delegation**: choosing which subagents to invoke; a good coordinator selects dynamically rather than always running the full pipeline.
- **Aggregation**: merging results, detecting gaps, and re-delegating with targeted follow-up queries until coverage is sufficient.
- **Error handling**: workers recover locally from transient failures; only unrecoverable errors, with partial results and what was attempted, propagate up.

The main risk is **over-narrow decomposition**: the coordinator splits a broad research question into a few tight subtopics and misses coverage. Prompt the coordinator with goals and quality criteria rather than step-by-step procedures so it can adapt, and partition scope across workers (distinct subtopics, distinct source types) to avoid duplicated effort.`,
    },
    {
      heading: 'Hub-and-spoke and context isolation',
      body: `In a **hub-and-spoke** design all communication goes through the coordinator. Subagents do not talk to each other. This costs a hop but gives one place for observability, consistent error handling and controlled information flow.

Subagents run with **isolated context**. They do not inherit the coordinator's conversation history or share memory between invocations. Everything a subagent needs must be placed in its prompt explicitly: the goal, prior findings, constraints and the format of the expected answer. When passing findings between agents, use **structured data** that separates content from metadata (source URL, document name, page) so provenance survives the hand-off.

Isolation is a feature, not just a constraint. A subagent that reads 40 files and returns a two-paragraph summary keeps those 40 files out of the coordinator's window. This is the primary tool for **context-window management** in large tasks: delegate the noisy exploration, keep the distilled result. In Claude Code and the Agent SDK this is the \`Task\` tool; parallel subagents are spawned by emitting several Task calls in one coordinator turn.

Give each subagent only the tools its role needs. A synthesis agent with a web-search tool tends to wander off and search; a research agent with a write tool may overwrite files. Scoped tool sets improve both reliability and safety.`,
    },
    {
      heading: 'Evaluator-optimizer and choosing a pattern',
      body: `**Evaluator-optimizer** pairs a generator call with an evaluator call in a loop: generate, critique against explicit criteria, revise, until the evaluator passes it or a round limit is hit. It fits tasks with clear evaluation criteria where iteration measurably helps: translation, code that must pass tests, extraction that must satisfy a schema and a consistency check. Keep the evaluator's criteria explicit and separate from the generator's prompt, and cap rounds so the loop cannot run forever.

Choosing:

| You have... | Use |
|---|---|
| Known, sequential sub-steps | Prompt chaining with gates |
| Distinct input categories | Routing |
| Independent sub-parts or a need for multiple opinions | Parallelization (sectioning / voting) |
| Sub-tasks you cannot predict until you look | Orchestrator-workers |
| Clear quality criteria and room to iterate | Evaluator-optimizer |

Every added agent multiplies tokens, latency and failure modes. Multi-agent systems are justified when the task exceeds one context window, when parallelism cuts wall-clock time materially, or when role separation (generator vs. evaluator, researcher vs. writer) measurably improves quality.`,
    },
  ],
  examples: [
    {
      title: 'Parallel sectioning for a code review',
      description:
        'A review of a 30-file pull request in one call missed issues in later files as attention diluted. The team split it into one call per file (local analysis) plus a final cross-file integration pass that receives only the per-file findings. Each call is short and focused; the integration pass sees distilled findings rather than raw code.',
      language: 'python',
      code: `async def review_file(path, diff):
    r = await client.messages.create(
        model="claude-opus-5-5", max_tokens=2048,
        system=REVIEW_RUBRIC,
        messages=[{"role": "user", "content": f"File: {path}\\n\\n{diff}"}])
    return {"file": path, "findings": r.content[0].text}

per_file = await asyncio.gather(*(review_file(p, d) for p, d in diffs.items()))
integration = await client.messages.create(
    model="claude-opus-5-5", max_tokens=4096,
    messages=[{"role": "user", "content":
        "Cross-file review. Per-file findings (JSON):\\n" + json.dumps(per_file)}])`,
      takeaway: 'Sectioning narrows each call\'s focus and the integration pass works from summaries, not raw input.',
    },
    {
      title: 'Coordinator that selects subagents dynamically',
      description:
        'A research coordinator has search, document-analysis and synthesis subagents. Early versions always ran all three, even for a question answerable from one document, wasting tokens and time. The fix prompted the coordinator to analyze the request first and invoke only the subagents it needs, re-delegating with targeted queries when the synthesis step reports gaps.',
      language: 'markdown',
      code: `## Coordinator instructions
Goal: produce a sourced answer that covers every aspect of the question.
1. Decide which specialists are needed; skip any that add nothing.
2. Partition scope so no two specialists cover the same subtopic.
3. Pass each specialist the full relevant findings so far as JSON
   {content, source_url, document, page}. They have no other context.
4. After synthesis, list uncovered aspects. If any, re-delegate with a
   targeted query and re-run synthesis. Stop when coverage is sufficient.`,
      takeaway: 'Coordinators should route dynamically and pass explicit, structured context because subagents start empty.',
    },
    {
      title: 'The mistake: assuming shared context',
      description:
        'A coordinator spent twelve turns analyzing a codebase, then spawned a "write tests" subagent with the prompt "Add tests for the modules we discussed." The subagent had no idea what was discussed and re-explored from scratch, doubling cost. The fix was to include the coordinator\'s findings (module list, key functions, conventions) directly in the subagent prompt.',
      language: 'text',
      code: `# Before
Task(prompt="Add tests for the modules we discussed.")

# After
Task(prompt="""Add pytest tests. Context from analysis:
- Modules: billing/invoice.py, billing/tax.py
- Public functions: compute_total(), apply_tax()
- Conventions: fixtures in tests/conftest.py, no network calls
Return: list of files created and the pytest summary line.""")`,
      takeaway: 'Subagents inherit nothing; everything they need must be in the prompt.',
    },
  ],
  keyPoints: [
    'Prompt chaining: fixed sequential steps with programmatic gates between them.',
    'Routing: classify, then dispatch to a specialized prompt, tool set or model.',
    'Parallelization: sectioning (independent parts) or voting (same task, multiple runs, aggregate).',
    'Orchestrator-workers / manager-supervisor: a central model decomposes dynamically, delegates, aggregates and re-delegates on gaps.',
    'Evaluator-optimizer: generate, critique against explicit criteria, revise, with a round cap.',
    'Hub-and-spoke: all subagent communication flows through the coordinator for observability and error handling.',
    'Subagents have isolated context; pass findings explicitly as structured data and give each only the tools its role needs.',
    'Subagents are the main context-window management tool: delegate noisy exploration, keep the distilled result.',
  ],
  flashcards: [
    { front: 'Prompt chaining: when to use it?', back: 'When a task decomposes into fixed, predictable sequential steps; add gates between steps to catch bad intermediates.' },
    { front: 'What is the difference between sectioning and voting in parallelization?', back: 'Sectioning splits a task into independent parts run in parallel; voting runs the same task several times and aggregates the answers.' },
    { front: 'What distinguishes orchestrator-workers from parallelization?', back: 'In orchestrator-workers the sub-tasks are decided dynamically by a model at runtime; in parallelization they are predefined.' },
    { front: 'What is hub-and-spoke in multi-agent systems?', back: 'A topology where the coordinator mediates all communication; subagents never talk to each other directly.' },
    { front: 'Do subagents inherit the coordinator\'s conversation history?', back: 'No. Their context is isolated; all needed context must be passed explicitly in the prompt.' },
    { front: 'Why pass findings between agents as structured data?', back: 'To separate content from metadata (source URL, document, page) so attribution and provenance survive the hand-off.' },
    { front: 'What is the main risk of coordinator-led decomposition?', back: 'Overly narrow decomposition that misses coverage of a broad topic; mitigate with goal-oriented prompts and gap-detection loops.' },
    { front: 'How do you spawn subagents in parallel with the Task tool?', back: 'Emit multiple Task tool calls in a single coordinator response rather than one per turn.' },
    { front: 'When does evaluator-optimizer fit?', back: 'When there are clear evaluation criteria and iterative refinement measurably improves output (translation, code that must pass tests).' },
    { front: 'How do subagents help with context-window management?', back: 'They absorb large exploration (reading many files, long searches) and return a compact summary, keeping the coordinator\'s window small.' },
  ],
  quiz: [
    {
      question:
        'A support system receives questions about billing, technical issues and account changes, each needing different tools and a different tone. Which pattern best fits?',
      options: [
        'Evaluator-optimizer',
        'Routing: classify the request and dispatch to a specialized prompt and tool set',
        'Voting with three parallel calls',
        'A single prompt that handles all three categories',
      ],
      correct: [1],
      explanation:
        'Distinct input categories needing different handling is the textbook case for routing. Evaluator-optimizer (A) is about iterative quality; voting (C) is for aggregating judgments; one giant prompt (D) is harder to tune and more error-prone.',
    },
    {
      question:
        'A coordinator spawns a synthesis subagent and the subagent reports that it has no sources to synthesize, even though two research subagents already returned results. What is the most likely cause?',
      options: [
        'The synthesis subagent needs a larger model.',
        'The coordinator did not include the research results in the synthesis subagent\'s prompt; subagents do not inherit context.',
        'Subagents cannot read text longer than a few thousand tokens.',
        'The Task tool only supports one subagent per session.',
      ],
      correct: [1],
      explanation:
        'Subagent context is isolated. The coordinator must pass prior findings explicitly. Model size (A) is irrelevant, and C and D are false claims.',
    },
    {
      question:
        'Which TWO are benefits of routing all subagent communication through a coordinator (hub-and-spoke)? (Select two)',
      options: [
        'Subagents can share the coordinator\'s memory automatically.',
        'One place to observe and log the whole system\'s information flow.',
        'Consistent error handling and controlled propagation of failures.',
        'It eliminates the need for tool descriptions on subagents.',
      ],
      correct: [1, 2],
      explanation:
        'Hub-and-spoke centralizes observability and error handling. It does not create shared memory (A); context is still isolated. Tool descriptions (D) remain essential.',
    },
    {
      question:
        'A research coordinator always runs search → analysis → synthesis for every request, including questions answerable from a single known document. What should change?',
      options: [
        'Add a fourth subagent to double-check the synthesis.',
        'Have the coordinator analyze the request and invoke only the subagents needed, re-delegating when it finds gaps.',
        'Replace the coordinator with a fixed workflow so the pipeline is faster.',
        'Give every subagent all tools so any of them can finish the task alone.',
      ],
      correct: [1],
      explanation:
        'Dynamic selection is the point of a coordinator. Adding agents (A) increases cost; a fixed workflow (C) loses the adaptivity needed for open-ended research; giving all tools to every agent (D) degrades selection reliability and safety.',
    },
    {
      question:
        'A translation pipeline produces output that is usually good but occasionally misses nuance. Quality criteria are well defined. Which pattern directly addresses this?',
      options: [
        'Evaluator-optimizer: a second call critiques against the criteria and the generator revises, up to N rounds.',
        'Routing by source language.',
        'Prompt chaining with more steps.',
        'Parallel sectioning by paragraph.',
      ],
      correct: [0],
      explanation:
        'Clear criteria plus benefit from iteration is exactly evaluator-optimizer. Routing (B) and chaining (C) do not add a critique step; sectioning (D) may even hurt nuance by removing surrounding context.',
    },
  ],
  statements: [
    { text: 'In prompt chaining, programmatic gates between steps can stop the chain when an intermediate output fails validation.', isTrue: true, explanation: 'Gates are the main reliability mechanism in a chain.' },
    { text: 'In orchestrator-workers the sub-tasks are fixed at design time.', isTrue: false, explanation: 'The orchestrator decides sub-tasks dynamically at runtime; fixed sub-tasks describe parallelization or chaining.' },
    { text: 'Subagents spawned with the Task tool automatically see the coordinator\'s prior conversation.', isTrue: false, explanation: 'Subagent context is isolated; needed context must be included in the prompt.' },
    { text: 'Voting runs the same task multiple times and aggregates the results.', isTrue: true, explanation: 'It trades tokens for confidence on high-stakes judgments.' },
    { text: 'Giving every subagent the full tool set improves reliability because any agent can finish the task.', isTrue: false, explanation: 'Agents with tools outside their role tend to misuse them; scoped tool sets are more reliable and safer.' },
    { text: 'Delegating exploration to a subagent that returns a summary is a form of context-window management.', isTrue: true, explanation: 'The raw material stays in the subagent\'s window; only the distilled result reaches the coordinator.' },
    { text: 'Evaluator-optimizer loops should run until the evaluator is satisfied, with no round limit.', isTrue: false, explanation: 'Always cap rounds; an unbounded loop can run indefinitely on a task the evaluator never passes.' },
  ],
  resources: [
    { label: 'Building effective agents (Anthropic)', url: 'https://www.anthropic.com/research/building-effective-agents' },
    { label: 'Subagents in the Agent SDK (Claude Code docs)', url: 'https://code.claude.com/docs/en/agent-sdk/subagents' },
    { label: 'How we built our multi-agent research system (Anthropic)', url: 'https://www.anthropic.com/engineering/multi-agent-research-system' },
  ],
};
