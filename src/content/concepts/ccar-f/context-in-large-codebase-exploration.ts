import type { Concept } from '../../types';

export const contextInLargeCodebaseExploration: Concept = {
  id: 'context-in-large-codebase-exploration',
  title: 'Context Management in Large Codebase Exploration',
  summary:
    'Long exploration sessions degrade: the agent starts describing "typical patterns" instead of the classes it actually found. Counter it with scratchpad files, subagent delegation, phase summaries, crash-recovery manifests and /compact.',
  certs: ['ccar-f', 'ccdv-f'],
  domains: ['ccar-f-5', 'ccar-f-3', 'ccdv-f-6'],
  tags: ['claude-code', 'agent-sdk', 'context', 'subagents', 'codebase', 'developer-productivity'],
  difficulty: 'intermediate',
  sections: [
    {
      heading: 'Recognizing context degradation',
      body: `An Agent SDK assistant exploring a legacy codebase with Read, Grep, Glob and Bash fills its context quickly. Each \`Grep\` over a large tree, each \`Read\` of a 2,000-line file, each \`Bash\` listing adds thousands of tokens that are useful once and then sit there. After an hour the symptoms are recognizable:

- **Inconsistent answers.** Asked the same question twice, the agent gives different file names or signatures.
- **Generic instead of specific.** Early in the session it said "refunds flow through \`RefundOrchestrator.process()\` in \`billing/refunds.py\`." Later it says "refund logic is typically handled by a service class in the billing module." It has lost the specific discovery and is falling back on priors about what codebases usually look like.
- **Re-discovery.** It re-reads files it already read, or re-runs a search whose result is still in the (now very long) transcript.
- **Forgotten constraints.** A convention the user stated at turn three (use the repository pattern, never call the ORM directly) stops being followed.

The cause is not that the window is full in the hard sense; current models have 1M-token windows. It is that the relevant findings are scattered through a long middle full of verbose tool output, so the model attends to them unreliably. Treat the first "typically" as a signal to act, not a curiosity.`,
    },
    {
      heading: 'Scratchpad files: findings that survive the context',
      body: `The simplest countermeasure is to move key findings out of the transcript and into a file the agent can re-read. Have the agent maintain a scratchpad (for example \`NOTES.md\` or \`.claude/scratch/exploration.md\`) with a compact record of what it has established: entry points, important classes and their locations, dependency edges, conventions, open questions.

Rules that make scratchpads work:

- **Write as you go, not at the end.** Each time a question is answered, append the fact with its file path and line reference.
- **Facts, not transcript.** "\`PaymentGateway\` is instantiated only in \`billing/factory.py:41\`" is a finding. Thirty lines of grep output are not.
- **Re-read before answering.** Instruct the agent to consult the scratchpad for subsequent questions. The file is short, so re-reading it costs little and puts the findings in the high-attention recent position.
- **Keep it under a page.** If it grows past a few hundred lines, split by topic or summarize the stable parts.

In Claude Code the same idea is served by \`CLAUDE.md\` for durable, project-wide facts (conventions, architecture overview) and by scratchpad files for session-specific discoveries. The \`/memory\` command edits the former; the agent writes the latter with its own Write tool. Do not put session-specific findings into \`CLAUDE.md\`; it loads into every future session.`,
    },
    {
      heading: 'Delegate verbose exploration to subagents',
      body: `Exploration output is verbose by nature, and most of it is only useful to the step that produced it. The structural fix is to run the verbose work in a **subagent** whose context is separate, and return only the conclusion to the main agent.

In the Agent SDK the coordinator uses the Task tool (its \`allowedTools\` must include \`Task\`) to spawn subagents defined by \`AgentDefinition\`s. In Claude Code, the built-in Explore subagent and custom agents in \`.claude/agents/\` do the same, and skills with \`context: fork\` run in isolation. Good delegations are narrow, question-shaped tasks:

- "Find all test files and report their framework and location by directory."
- "Trace the refund flow from the API handler to the database and list each class involved with file:line."
- "List every place \`LegacyAuth\` is imported and whether the import is used."

The subagent may read 40 files to answer; the coordinator receives a 20-line structured answer. The coordinator keeps the high-level map and decides what to ask next.

Subagents do not inherit the coordinator's conversation automatically. Pass what they need in the prompt (the current phase summary, the relevant conventions) and ask them to return structured findings with paths, so the answer can go straight into the scratchpad.`,
    },
    {
      heading: 'Phase summaries, crash recovery and /compact',
      body: `**Phase summaries.** Exploration proceeds in phases: map the structure, then trace a flow, then plan a change. Before spawning subagents for the next phase, summarize the key findings of the current phase (a dozen bullets with paths) and inject that summary into the subagents' initial context. They start with the map rather than rebuilding it, and the coordinator's own context stays small because the raw output lived in the previous subagents.

**Crash recovery with manifests.** Long multi-agent sessions die: a network blip, a rate limit, a laptop closing. Design for resume. Each agent exports its state (findings, pending questions, files examined) to a known location in a structured format, and the coordinator maintains a **manifest** that lists those exports and the current phase. On resume the coordinator loads the manifest, reads the state files, and injects the relevant state into each agent's prompt. Nothing depends on the lost transcript. In Claude Code, \`--resume\` restores a conversation, but structured state on disk is what lets you resume *work* reliably across agents.

**/compact.** When a Claude Code session's context fills with discovery output, \`/compact\` summarizes the conversation so far and continues with the summary in place of the history. Use it at a natural boundary (end of a phase), after the key findings are in the scratchpad or CLAUDE.md, and optionally with a focus instruction (\`/compact keep the list of files in the refund flow\`). Compacting without first persisting findings trades verbose context for a lossy summary, which is the problem you started with.`,
    },
  ],
  examples: [
    {
      title: 'Mistake: the agent that forgot the refund orchestrator',
      description: `A developer spends 90 minutes with an Agent SDK assistant mapping a payments monolith. At minute 20 the agent correctly identifies \`RefundOrchestrator.process()\` in \`billing/refunds.py\` as the entry point. At minute 80, asked where to add a new refund reason code, it answers "typically refund reasons are defined in an enum near the refund service" and suggests creating a new file that duplicates an existing enum.

**Fix:** the team adds a scratchpad instruction to the agent's system prompt, and re-runs. The agent records \`RefundReason\` enum at \`billing/models.py:112\` when it first sees it, re-reads the scratchpad before each answer, and later points to the right file.`,
      language: 'markdown',
      code: `# exploration-notes.md (maintained by the agent)

## Entry points
- POST /refunds -> api/refunds.py:handle_refund -> billing/refunds.py:RefundOrchestrator.process (line 58)

## Key types
- RefundReason enum: billing/models.py:112 (8 members; add new codes here, migration required)
- PaymentGateway: instantiated only in billing/factory.py:41

## Conventions (from user, turn 3)
- Repository pattern; never call the ORM from services

## Open questions
- Who consumes RefundSettled events? (grep pending)`,
      takeaway: 'Write specific findings with paths to a scratchpad as you go, and re-read it before answering; "typically" is the alarm bell.',
    },
    {
      title: 'Delegating a trace to a subagent',
      description: `A coordinator needs the full dependency chain of the refund flow but does not want 40 file reads in its own context. It spawns a subagent with a narrow question and a required output shape, then stores the result in the scratchpad.`,
      language: 'typescript',
      code: `import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const msg of query({
  prompt: "Trace the refund flow from POST /refunds to the database. Return ONLY a list of\\n" +
          "steps as 'file:line  Class.method  -> next' plus a 5-line summary. Context from phase 1:\\n" +
          PHASE1_SUMMARY,
  options: {
    allowedTools: ["Read", "Grep", "Glob", "Task"],
    agents: {
      tracer: {
        description: "Traces a code path and reports each hop with file:line. Use for dependency questions.",
        prompt: "You trace code paths. Read what you need; report findings compactly with paths.",
        tools: ["Read", "Grep", "Glob"],
      },
    },
  },
})) {
  // the coordinator receives the compact trace, not the 40 file reads
}`,
      takeaway: 'Verbose exploration runs in the subagent\'s context; the coordinator receives a compact, structured answer.',
    },
    {
      title: 'Resuming after a crash with a manifest',
      description: `A three-agent exploration (structure mapper, flow tracer, test auditor) dies at the 70-minute mark when the laptop sleeps. Without state on disk, the team restarts from zero. With it, each agent had been exporting findings to \`.claude/state/<agent>.json\` and the coordinator kept \`.claude/state/manifest.json\`. On resume the coordinator reads the manifest, sees phase 2 was in progress, loads the three state files, and injects each agent's own findings plus the phase-1 summary into its prompt. The run continues from phase 2.`,
      language: 'json',
      code: `{
  "run_id": "explore-2026-11-12",
  "phase": 2,
  "phase_summaries": { "1": ".claude/state/phase1-summary.md" },
  "agents": {
    "structure_mapper": { "state": ".claude/state/structure_mapper.json", "status": "done" },
    "flow_tracer":      { "state": ".claude/state/flow_tracer.json",      "status": "in_progress" },
    "test_auditor":     { "state": ".claude/state/test_auditor.json",     "status": "pending" }
  }
}`,
      takeaway: 'Structured state exports plus a manifest let the coordinator resume work, not just a transcript.',
    },
    {
      title: 'Using /compact at a phase boundary',
      description: `A Claude Code session mapping a service mesh is sluggish and the agent has started repeating searches. The developer first asks the agent to write the key findings to \`NOTES.md\`, then runs \`/compact focus on the service dependency list and the open questions\`. The conversation continues with a short summary plus the file on disk. Running \`/compact\` first and writing notes afterwards would have summarized away the paths the notes needed.`,
      language: 'bash',
      code: `# in the Claude Code session, at the end of the mapping phase
> Write everything we have established (services, owners, entry points, with paths) to NOTES.md
> /compact focus on the service dependency list and the open questions
> Read NOTES.md, then let's start tracing the checkout flow`,
      takeaway: 'Persist findings first, then /compact at a natural boundary, optionally with a focus instruction.',
    },
  ],
  keyPoints: [
    'Context degradation shows up as inconsistent answers and "typical pattern" generalities replacing specific classes and paths found earlier.',
    'Scratchpad files hold key findings (with file:line references) outside the transcript; write as you go and re-read before answering.',
    'Delegate verbose exploration (find all tests, trace a flow) to subagents so their output stays in their context and the coordinator keeps the high-level map.',
    'Subagents do not inherit the conversation; pass the current phase summary and conventions in their prompt and ask for structured findings.',
    'Summarize key findings at the end of each exploration phase and inject the summary into the next phase\'s subagents.',
    'Design crash recovery: each agent exports structured state to a known location and the coordinator loads a manifest on resume.',
    'Use /compact in Claude Code when discovery output fills the context, at a phase boundary and after persisting findings; it can take a focus instruction.',
    'CLAUDE.md is for durable project facts; session-specific discoveries belong in scratchpad files.',
  ],
  flashcards: [
    { front: 'Name two symptoms of context degradation during long codebase exploration.', back: 'Inconsistent answers to repeated questions, and generic "typical pattern" descriptions replacing specific classes and paths found earlier.' },
    { front: 'What is a scratchpad file for?', back: 'Persisting key findings (with paths) across context boundaries so the agent can re-read them instead of relying on a long, degraded transcript.' },
    { front: 'How should an agent use a scratchpad during a session?', back: 'Append facts as they are established and re-read the file before answering subsequent questions.' },
    { front: 'Why delegate "find all test files" to a subagent?', back: 'The verbose search output stays in the subagent\'s context; the main agent receives only the compact answer and keeps coordinating.' },
    { front: 'What must the coordinator\'s allowedTools include to spawn subagents in the Agent SDK?', back: 'Task.' },
    { front: 'What should happen between exploration phases?', back: 'Summarize the phase\'s key findings and inject that summary into the initial context of the next phase\'s subagents.' },
    { front: 'How do you design crash recovery for a multi-agent exploration?', back: 'Each agent exports structured state to a known location; the coordinator keeps a manifest, loads it on resume and injects state into agent prompts.' },
    { front: 'When should you run /compact in Claude Code?', back: 'When context fills with verbose discovery output, ideally at a phase boundary after persisting key findings; it accepts a focus instruction.' },
    { front: 'Where do durable project conventions go versus session-specific discoveries?', back: 'Conventions in CLAUDE.md (edit with /memory); session discoveries in scratchpad files.' },
    { front: 'Do subagents automatically see the coordinator\'s conversation history?', back: 'No. Pass the needed context (phase summary, conventions) explicitly in the subagent prompt.' },
  ],
  quiz: [
    {
      question:
        'After an hour exploring a legacy codebase, an Agent SDK assistant that earlier named RefundOrchestrator.process() in billing/refunds.py now says "refund logic is typically in a service class in the billing module." What is happening and what is the MOST appropriate fix?',
      options: [
        'The model is hallucinating; switch to a larger model.',
        'Context degradation; have the agent record key findings with paths in a scratchpad file and re-read it before answering.',
        'The codebase changed during the session; re-clone the repository.',
        'The system prompt is too long; shorten the conventions section.',
      ],
      correct: [1],
      explanation:
        'Falling back to "typical" patterns after specific discoveries is the signature of context degradation, and a scratchpad counters it. A larger model does not change attention over a long transcript; nothing suggests the code changed; the system prompt is not the bulky part.',
    },
    {
      question:
        'A coordinator agent needs the complete dependency chain of the checkout flow but its own context is already large. Which approach BEST preserves the coordinator\'s ability to keep coordinating?',
      options: [
        'Have the coordinator run Grep and Read itself, since it has the most context.',
        'Spawn a subagent with the narrow task of tracing the flow and returning a compact list of file:line hops.',
        'Ask the user to paste the relevant files.',
        'Run /compact and then have the coordinator do the trace.',
      ],
      correct: [1],
      explanation:
        'Delegation isolates the verbose exploration output. The coordinator doing it itself worsens the problem; asking the user defeats the purpose; compacting first helps but the trace output would refill the coordinator\'s context.',
    },
    {
      question:
        'Which TWO practices support reliable resumption of a multi-agent exploration after a crash? (Select two)',
      options: [
        'Each agent exports structured state (findings, pending questions) to a known file location.',
        'The coordinator maintains a manifest listing agent state files and the current phase, and loads it on resume.',
        'Each agent keeps all findings in its conversation context so nothing is lost.',
        'The coordinator re-runs every agent from scratch to ensure consistency.',
      ],
      correct: [0, 1],
      explanation:
        'State on disk plus a manifest is what resume needs. Keeping findings only in context is exactly what a crash destroys; re-running everything is the costly outcome the design is meant to avoid.',
    },
    {
      question:
        'A Claude Code session is sluggish and the agent has begun repeating searches it already ran. The developer plans to run /compact. What should happen FIRST?',
      options: [
        'Nothing; /compact preserves everything important automatically.',
        'Have the agent write the key findings with paths to a notes file so the compaction summary is not the only record.',
        'Delete CLAUDE.md so the summary has more room.',
        'Restart the session with --resume to clear the context.',
      ],
      correct: [1],
      explanation:
        'Compaction is a lossy summary; persisting findings first keeps the specifics. CLAUDE.md is not the problem, and --resume restores the same long conversation rather than clearing it.',
    },
    {
      question:
        'A team spawns phase-2 subagents that spend their first ten minutes re-discovering the module structure phase-1 agents already mapped. What is the MOST appropriate change?',
      options: [
        'Give the phase-2 subagents more tools.',
        'Summarize the phase-1 findings and inject the summary into the phase-2 subagents\' initial context.',
        'Run phase 1 and phase 2 in the same subagent so nothing is lost.',
        'Increase the subagents\' max_tokens.',
      ],
      correct: [1],
      explanation:
        'Phase summaries hand the map to the next phase. More tools or output tokens do not supply missing knowledge, and merging phases recreates the single bloated context the design was avoiding.',
    },
    {
      question:
        'An engineer stores session-specific discoveries ("the bug is in parse_date at utils/time.py:88") in the project CLAUDE.md. What is the problem?',
      options: [
        'CLAUDE.md cannot contain file paths.',
        'CLAUDE.md loads into every future session, so transient findings pollute all of them; session discoveries belong in a scratchpad file.',
        'CLAUDE.md is only read when Claude Code starts in plan mode.',
        'There is no problem; CLAUDE.md is the recommended place for all notes.',
      ],
      correct: [1],
      explanation:
        'CLAUDE.md is for durable project context. Paths are fine in it, it loads regardless of mode, and transient findings do not belong there.',
    },
  ],
  statements: [
    { text: 'When an exploration agent starts describing "typical patterns" instead of specific classes it found earlier, context degradation is the likely cause.', isTrue: true, explanation: 'This is the characteristic symptom; act on it with scratchpads, delegation or compaction.' },
    { text: 'A scratchpad file should be written once at the end of the session as a summary.', isTrue: false, explanation: 'It should be appended as findings are established and re-read before answering, otherwise the findings may already be degraded by the time you write it.' },
    { text: 'Subagents spawned with the Task tool automatically inherit the coordinator\'s full conversation history.', isTrue: false, explanation: 'They do not; pass the needed context explicitly in their prompt.' },
    { text: 'Delegating verbose exploration to subagents keeps the coordinator\'s context focused on high-level coordination.', isTrue: true, explanation: 'The subagent\'s file reads stay in its own context; only the compact answer returns.' },
    { text: '/compact should be run before writing findings to a file so the summary is smaller.', isTrue: false, explanation: 'Persist first; compaction is lossy and may drop the specifics you wanted to record.' },
    { text: 'A crash-recovery manifest lets the coordinator load agent state exports and inject them into agent prompts on resume.', isTrue: true, explanation: 'This is the structured-state-persistence pattern for resuming work rather than just a transcript.' },
    { text: 'Because current models have 1M-token windows, context degradation is no longer a concern in long sessions.', isTrue: false, explanation: 'Position effects and verbose middles still degrade recall long before the hard limit.' },
  ],
  resources: [
    { label: 'Subagents (Claude Agent SDK docs)', url: 'https://platform.claude.com/docs/en/agent-sdk/subagents' },
    { label: 'Claude Code memory and CLAUDE.md', url: 'https://code.claude.com/docs/en/memory' },
    { label: 'Claude Code common workflows (including /compact)', url: 'https://code.claude.com/docs/en/common-workflows' },
    { label: 'Effective context engineering for AI agents (Anthropic engineering)', url: 'https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents' },
  ],
};
