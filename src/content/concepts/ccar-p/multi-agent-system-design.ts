import type { Concept } from '../../types';

export const multiAgentSystemDesign: Concept = {
  id: 'multi-agent-system-design',
  title: 'Multi-Agent System Design',
  summary:
    'Decide when a task justifies several agents, structure them as coordinator-subagents or peers, define communication contracts, and control the cost, latency and failure multipliers that come with every added agent.',
  certs: ['ccar-p', 'ccar-f', 'ccdv-f'],
  domains: ['ccar-p-1', 'ccar-f-1', 'ccar-f-5', 'ccdv-f-1'],
  tags: ['multi-agent', 'coordinator', 'subagents', 'orchestration', 'managed-agents'],
  difficulty: 'advanced',
  diagram: 'coordinator-subagents',
  sections: [
    {
      heading: 'When one agent is not enough',
      body: `Multi-agent systems exist to solve two problems a single agent cannot: **context** and **specialisation**.

- **Context isolation.** A task that requires reading dozens of documents, many files or many search results will fill one context window with raw material. Delegating each reading task to a subagent with a fresh context, and returning only a compact report, keeps the coordinator's context focused on planning and synthesis.
- **Specialisation.** Different subtasks need different system prompts, tools, or models. A read-only reviewer, a test writer and a researcher each have a narrow prompt and least-privilege tools. Narrow agents are more reliable and easier to evaluate than one agent with everything.
- **Parallelism.** Independent subtasks run at the same time, cutting wall-clock latency.

Multi-agent is **not** justified for answering one question at a time with "a checker" or "a voter" behind it. Each extra pass multiplies the cost of every answer. For single answers, give one agent the tools and documents it needs, ask it to verify its own work, and raise effort where measured gains justify it. Add agents when work splits into independent pieces.`,
    },
    {
      heading: 'Topologies: coordinator-subagents vs peers',
      body: `**Coordinator (orchestrator) with subagents** is the dominant pattern. The coordinator owns the plan, decomposes work, spawns subagents with self-contained briefs, and synthesises their reports. Subagents cannot delegate further, which bounds depth. This matches the Claude Agent SDK (a lead agent with the Task tool spawning subagents defined by \`AgentDefinition\`) and Managed Agents multi-agent sessions, where a coordinator delegates to agents in a roster, each running in its own thread with its own model, system prompt and tools while sharing a container.

**Peer or handoff** topologies pass control from one agent to another (triage → specialist) without a central planner. They fit conversational routing where exactly one agent should own the interaction at a time. They are harder to reason about when more than two or three agents can hand off to each other, and loops must be prevented.

Design rules that hold for both:

- Each subagent gets a **self-contained brief**: the task, the inputs, the output format and the stop condition. It does not see the coordinator's history unless deliberately passed.
- Returns are **structured reports**, not raw dumps. The coordinator should receive findings with provenance, not 50 pages of source.
- The coordinator **verifies** before it synthesises. Subagents can be confidently wrong.`,
    },
    {
      heading: 'Communication contracts and failure handling',
      body: `Treat agent boundaries like service boundaries:

| Contract element | What to specify |
|---|---|
| Input schema | What the subagent receives; keep it minimal and explicit |
| Output schema | Structured fields (findings, confidence, sources, errors); enforce with a JSON schema where possible |
| Error semantics | How a subagent reports partial failure vs total failure; never silent |
| Budget | Max iterations, token or dollar cap, timeout per subagent |
| Authority | Which tools and data each agent may touch; read-only unless the role requires writes |

Failure handling is where multi-agent systems earn or lose trust. Error propagation strategies: retry a failed subagent once with the same brief; fall back to a reduced result with the gap flagged; or abort the whole task and escalate. The coordinator must distinguish "subagent returned no findings" from "subagent failed", and it must preserve provenance so a human can audit which agent produced which claim. Managed Agents exposes per-thread events and session budgets for this purpose; in the Agent SDK, hooks on subagent tool calls give the same interception points.`,
    },
    {
      heading: 'Cost, latency and the exam angle',
      body: `Every agent multiplies three things:

- **Cost.** Each agent re-reads its own system prompt and brief; a coordinator plus five subagents can cost 5 to 15 times a single call. Use cheaper models for reading-heavy workers and reserve the strongest model for planning and synthesis.
- **Latency.** Parallel subagents cut wall-clock time, but the coordinator's planning and synthesis steps are sequential. Deep hierarchies add round trips.
- **Failure surface.** More agents, more handoffs, more places for context to be lost or instructions to drift.

Measure before and after. A multi-agent redesign should show a quality gain on an eval set that justifies the multiplier; if it does not, revert to the simpler design.

Exam scenarios describe a research or support system and ask about structure, context passing or error propagation. Prefer answers that isolate context, give each agent a narrow role and least privilege, enforce structured handoffs, and surface failures explicitly. Distractors give every agent every tool, pass the full conversation history to each subagent, or add agents to "double check" single answers.`,
    },
  ],
  examples: [
    {
      title: 'Research lead with cheaper reading workers (Managed Agents)',
      description:
        'A consulting firm builds a market-research system. The lead runs on Opus and plans, verifies and synthesises. Reading-heavy sub-questions go to a Haiku worker with read-only web tools. The lead spawns several workers in parallel, each with one self-contained question, and receives concise findings with source URLs. Session cost is capped with a budget.',
      language: 'python',
      code: `worker = client.beta.agents.create(
    name="Web researcher",
    description="Read-only researcher. Give it one scoped question; it reports findings with a source for every claim.",
    model="claude-haiku-5-5",
    system="Answer exactly the question given. Report concise findings with a source URL for each claim.",
    tools=[{"type": "agent_toolset_20260401",
            "default_config": {"enabled": False, "permission_policy": {"type": "auto"}},
            "configs": [{"name": n, "enabled": True} for n in ("web_fetch", "web_search")]}],
)
lead = client.beta.agents.create(
    name="Research lead", model="claude-opus-5-5",
    system="Plan the work. Delegate each independent reading-heavy question to Web researcher, several in parallel. Verify sources and write the synthesis yourself.",
    tools=[{"type": "agent_toolset_20260401",
            "configs": [{"name": n, "enabled": True} for n in ("web_fetch", "web_search")]}],
    multiagent={"type": "multiagent_20261001",
                "subagents": {"type": "enabled", "predefined_agents": [worker.id]}},
)`,
      takeaway: 'Put the strong model on planning and synthesis and a cheap model on bulk reading; each worker has a narrow prompt and least-privilege tools.',
    },
    {
      title: 'Mistake: passing the full conversation to every subagent',
      description:
        'A support platform spawned a "billing specialist" and a "technical specialist" subagent and forwarded the entire 60-turn customer conversation to both, plus all 14 tools. Cost tripled, the specialists contradicted each other, and the billing agent once called a technical reset tool. The fix: the coordinator writes a one-paragraph brief with the relevant facts and a required output schema, and each specialist receives only the tools for its role.',
      takeaway: 'Subagents get a self-contained brief and role-scoped tools, not the coordinator\'s whole context and tool set.',
    },
    {
      title: 'Structured handoff schema between agents',
      description:
        'A due-diligence system defines the report every analysis subagent must return. The coordinator can merge, de-duplicate and verify claims mechanically, and a missing or failed subagent is visible rather than silently absent.',
      language: 'json',
      code: `{
  "type": "object",
  "required": ["status", "findings", "sources", "gaps"],
  "properties": {
    "status": {"enum": ["complete", "partial", "failed"]},
    "findings": {"type": "array", "items": {
      "type": "object",
      "required": ["claim", "confidence", "source_ids"],
      "properties": {"claim": {"type": "string"},
                     "confidence": {"enum": ["high", "medium", "low"]},
                     "source_ids": {"type": "array", "items": {"type": "string"}}}}},
    "sources": {"type": "array", "items": {"type": "object",
      "required": ["id", "url_or_path"],
      "properties": {"id": {"type": "string"}, "url_or_path": {"type": "string"}}}},
    "gaps": {"type": "array", "items": {"type": "string"}}
  }
}`,
      takeaway: 'A structured output contract with explicit status and provenance makes multi-agent results auditable and failures visible.',
    },
    {
      title: 'Deciding against multi-agent for a Q&A assistant',
      description:
        'A legal team asked for "a second agent that double-checks every answer" from their contract Q&A assistant. The architect showed that a checker would double the cost of every answer, that the checker had no more information than the answerer, and that a deterministic quote-verification step (confirming each cited passage exists verbatim in the source) caught 90% of the errors at zero model cost. Effort was raised on the single agent for the remaining hard cases.',
      takeaway: 'Multi-agent is for work that splits into independent pieces, not for re-checking single answers; prefer deterministic checks and higher effort.',
    },
  ],
  keyPoints: [
    'Go multi-agent for context isolation, specialisation and parallelism, when work splits into independent pieces.',
    'Do not add checker or voter agents to single answers; each pass multiplies cost. Use deterministic checks and higher effort instead.',
    'Coordinator-subagents is the dominant topology: the coordinator plans, delegates self-contained briefs, verifies and synthesises; subagents do not delegate further.',
    'Subagents receive a minimal brief and role-scoped, least-privilege tools, never the full coordinator history and tool set.',
    'Define contracts at agent boundaries: input schema, structured output with status and provenance, error semantics, budget, authority.',
    'Error propagation: retry once, degrade with the gap flagged, or abort and escalate; never silently drop a failed subagent.',
    'Use cheaper models for reading-heavy workers and the strongest model for planning and synthesis.',
    'Measure the quality gain against the cost and latency multiplier; revert if it does not pay.',
  ],
  flashcards: [
    { front: 'What two problems justify a multi-agent design?', back: 'Context isolation (bulk reading fills one window) and specialisation (different prompts, tools, models per role); parallelism is a bonus.' },
    { front: 'Why not add a "checker" agent behind a single-answer Q&A assistant?', back: 'It doubles the cost of every answer and has no more information than the answerer; prefer deterministic checks and higher effort.' },
    { front: 'In the coordinator-subagents pattern, who synthesises and who can delegate?', back: 'The coordinator synthesises; subagents cannot delegate further, which bounds depth.' },
    { front: 'What should a subagent receive from the coordinator?', back: 'A self-contained brief: task, inputs, output format, stop condition; plus only the tools its role needs.' },
    { front: 'Name the five elements of an agent communication contract.', back: 'Input schema, output schema (status, findings, provenance), error semantics, budget, authority.' },
    { front: 'Three error-propagation strategies for a failed subagent?', back: 'Retry once with the same brief; degrade with the gap flagged; abort and escalate to a human.' },
    { front: 'How do Managed Agents multi-agent sessions isolate context?', back: 'Each agent runs in its own thread with its own history, model, prompt and tools, while sharing one container and filesystem.' },
    { front: 'In the Claude Agent SDK, what must allowedTools include for a lead agent to spawn subagents?', back: 'Task.' },
    { front: 'How should model selection differ between coordinator and workers?', back: 'Strongest model for planning, verification and synthesis; cheaper models (Haiku or Sonnet) for reading-heavy, narrow workers.' },
  ],
  quiz: [
    {
      question:
        'A research system must read 80 analyst reports and produce a cited summary. A single agent runs out of context before synthesising. Which redesign is MOST appropriate?',
      options: [
        'Switch to a model with a larger output limit.',
        'A coordinator that delegates batches of reports to subagents with fresh contexts, each returning structured findings with sources, and then synthesises.',
        'Truncate each report to its first page.',
        'Run the single agent twice and merge the two summaries.',
      ],
      correct: [1],
      explanation:
        'Context isolation through subagents is exactly what multi-agent is for. Output limit (1) is unrelated to input context; truncation (3) loses content; running twice (4) hits the same limit twice.',
    },
    {
      question:
        'A support coordinator forwards the full 60-turn conversation and all 14 tools to both a billing and a technical subagent. Costs tripled and the billing agent invoked a technical reset. Which TWO changes address the problems? (Select two)',
      options: [
        'Pass each subagent a concise brief with only the relevant facts.',
        'Give each subagent only the tools its role requires.',
        'Add a third subagent to arbitrate disagreements.',
        'Increase max_tokens on the subagents.',
      ],
      correct: [0, 1],
      explanation:
        'Minimal briefs cut cost and drift; role-scoped tools are least privilege. A third agent (3) multiplies cost further; max_tokens (4) is unrelated.',
    },
    {
      question:
        'A legal team asks for a second agent to double-check every answer from a contract Q&A assistant. What should the architect recommend FIRST?',
      options: [
        'Build the checker agent; accuracy is paramount.',
        'Add a deterministic verification step (cited passages must appear verbatim in the source), raise effort on the single agent, and measure before adding any agent.',
        'Replace the assistant with a five-agent voting system.',
        'Ask the model in the prompt to be more accurate.',
      ],
      correct: [1],
      explanation:
        'Single-answer re-checking multiplies cost per answer without new information; deterministic checks and effort come first. Voting (3) multiplies cost five-fold; prompting for accuracy (4) is not a control.',
    },
    {
      question:
        'In a coordinator-subagent system a subagent times out. Which behaviour is MOST appropriate for the coordinator?',
      options: [
        'Proceed with synthesis as if that subagent returned no relevant findings.',
        'Retry the subagent once with the same brief; if it fails again, flag the gap explicitly in the output or escalate.',
        'Spawn ten more subagents on the same question to compensate.',
        'Abort silently and return the partial result without comment.',
      ],
      correct: [1],
      explanation:
        'Failures must be visible. Treating a failure as "no findings" (1) or returning silently (4) hides the gap; spawning ten agents (3) is a cost multiplier with no diagnosis.',
    },
    {
      question:
        'Which model assignment BEST fits a coordinator-subagent research system under a cost constraint?',
      options: [
        'Opus for every agent so quality is uniform.',
        'Haiku for the coordinator and Opus for every reading worker.',
        'Opus for the coordinator (planning, verification, synthesis) and Haiku or Sonnet for reading-heavy workers.',
        'Haiku for every agent because workers do most of the tokens.',
      ],
      correct: [2],
      explanation:
        'Planning and synthesis need the strongest judgment; bulk reading does not. Opus everywhere (1) wastes money; Haiku coordinating Opus workers (2) inverts the judgment needs; Haiku everywhere (4) risks synthesis quality.',
    },
  ],
  statements: [
    { text: 'Multi-agent systems are primarily justified by context isolation and specialisation.', isTrue: true, explanation: 'Delegating bulk reading to fresh-context subagents and giving each role a narrow prompt and tools are the core benefits.' },
    { text: 'Adding a checker agent behind every single answer is the recommended way to raise accuracy in Q&A systems.', isTrue: false, explanation: 'It multiplies cost per answer with no new information. Prefer deterministic checks and higher effort; add agents when work splits into independent pieces.' },
    { text: 'In Managed Agents multi-agent sessions, every agent runs in its own thread with its own context while sharing the container.', isTrue: true, explanation: 'Threads isolate conversation history, model, prompt and tools; the filesystem is shared.' },
    { text: 'Subagents should receive the coordinator\'s full conversation history so they have complete context.', isTrue: false, explanation: 'They should receive a self-contained brief; passing full history inflates cost and causes drift.' },
    { text: 'A coordinator should verify subagent reports before synthesising them.', isTrue: true, explanation: 'Subagents can be confidently wrong; verification before synthesis preserves quality and provenance.' },
    { text: 'Deep agent hierarchies reduce latency because more work happens in parallel.', isTrue: false, explanation: 'Parallel siblings cut latency, but each additional level adds sequential planning and synthesis round trips.' },
    { text: 'Agent boundaries should be treated like service boundaries with explicit input and output schemas.', isTrue: true, explanation: 'Contracts make results mergeable and failures visible.' },
  ],
  resources: [
    { label: 'How we built our multi-agent research system (Anthropic engineering)', url: 'https://www.anthropic.com/engineering/multi-agent-research-system' },
    { label: 'Managed Agents multi-agent sessions (Claude docs)', url: 'https://platform.claude.com/docs/en/managed-agents/multiagent' },
    { label: 'Subagents in the Agent SDK (Claude docs)', url: 'https://platform.claude.com/docs/en/agent-sdk/subagents' },
  ],
};
