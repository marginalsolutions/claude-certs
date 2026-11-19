import type { Concept } from '../../types';

export const claudeAgentSdk: Concept = {
  id: 'claude-agent-sdk',
  title: 'Claude Agent SDK',
  summary:
    'Claude Code packaged as a library: query() runs a full agent loop with built-in file and shell tools, subagents via the Task tool and AgentDefinition, hooks for deterministic control, and sessions you can resume or fork.',
  certs: ['ccdv-f', 'ccar-f'],
  domains: ['ccdv-f-1', 'ccdv-f-7', 'ccar-f-1', 'ccar-f-2'],
  tags: ['agent-sdk', 'claude-code', 'subagents', 'hooks', 'sessions'],
  difficulty: 'intermediate',
  sections: [
    {
      heading: 'What the Agent SDK is',
      body: `The Claude Agent SDK (Python \`claude_agent_sdk\`, TypeScript \`@anthropic-ai/claude-agent-sdk\`) exposes the same harness that powers Claude Code as a programmable library. Instead of writing your own loop and tool implementations, you call \`query()\` with a prompt and options and receive a stream of messages while the agent works.

Out of the box it provides:

- **Built-in tools**: \`Read\`, \`Write\`, \`Edit\`, \`Bash\`, \`Glob\`, \`Grep\`, plus \`Task\` for subagents and web tools. These are production-hardened implementations with the permission model Claude Code uses.
- **Context management**: automatic compaction when the window fills, so long sessions keep running.
- **Project context**: \`CLAUDE.md\` files, skills and MCP servers are loaded the same way Claude Code loads them.
- **Permission modes** that decide which tool calls run without asking (for example a mode that auto-accepts file edits, a plan-only mode, and a bypass mode for sandboxed automation).
- **Hooks**, **sessions** and **subagents**, covered below.

Think of it as the fastest way to get a capable coding or file-manipulation agent, with the trade-off that you inherit its opinions about tools, prompts and permissions.`,
    },
    {
      heading: 'Subagents: AgentDefinition and the Task tool',
      body: `Subagents are declared in the \`agents\` option as a map of name → \`AgentDefinition\`. Each definition has a **description** (which tells the parent *when* to delegate), a **prompt** (the subagent's system prompt), an optional **tools** list that restricts what it may call, and optionally a different **model**.

Two rules the exam checks:

1. The parent can only spawn subagents if its \`allowedTools\` includes \`"Task"\`. Without it, the definitions exist but are unreachable.
2. Subagents start with an **empty context**. They do not see the parent's history. The parent must put findings, constraints and the expected output format into the Task prompt.

The parent spawns subagents in parallel by emitting several Task calls in one turn. Each subagent runs its own loop with its own context and returns a single result message to the parent. This is how large explorations stay out of the parent's window: the subagent reads fifty files and returns a page of findings.

Restrict tools per role. A reviewer subagent gets \`Read\`, \`Grep\`, \`Glob\`; an implementer gets \`Edit\` and \`Bash\` too. Fewer, relevant tools improve selection reliability and limit blast radius.`,
    },
    {
      heading: 'Hooks: deterministic control around tool calls',
      body: `Hooks are callbacks (or shell commands, in Claude Code settings) that run at fixed points in the loop: \`PreToolUse\` before a tool executes, \`PostToolUse\` after it returns, plus events such as \`Notification\`, \`Stop\` and \`SessionStart\`. In the SDK you register them in the \`hooks\` option, optionally with a matcher on the tool name.

Why they matter: a prompt instruction ("never delete files in /prod") is probabilistic. A \`PreToolUse\` hook that inspects the \`Bash\` command and returns a deny decision is deterministic. Typical uses:

- **Block policy violations**: deny a \`process_refund\` call whose amount exceeds a threshold and redirect to human escalation.
- **Enforce prerequisites**: deny downstream tools until a prerequisite tool (identity verification) has returned.
- **Normalize data**: a \`PostToolUse\` hook converts heterogeneous MCP tool outputs (Unix timestamps, ISO 8601 strings, numeric status codes) into one format before the model sees them.
- **Audit**: log every tool call with its inputs for compliance.

Hook output can allow, deny (with a reason the model sees), or modify what flows through. Choose hooks whenever a business rule requires guaranteed compliance; use prompts for preferences and style.`,
    },
    {
      heading: 'Sessions, resumption and forking',
      body: `Every \`query()\` run is a **session** with an id. You can \`resume\` a session to continue a prior conversation with its full context, which is useful for long investigations spread over several work sessions. In Claude Code the equivalent is \`--resume <name>\`.

**\`fork_session\`** creates an independent branch from an existing session. Use it when you have an expensive shared baseline (a complete codebase analysis) and want to explore divergent approaches from it (two refactoring strategies, two testing approaches) without one branch's changes polluting the other.

Two judgment calls the Architect guide tests:

- **Resume vs. start fresh.** Resume when prior context is still mostly valid. If files changed since the analysis, either tell the resumed session exactly which files changed so it re-analyzes only those, or start a new session with a structured summary. Stale tool results in a resumed session mislead the model.
- **Agent SDK vs. the API tool runner.** Use the Agent SDK when you want Claude Code's built-in tools, permission model, CLAUDE.md and compaction, especially for coding, file and shell tasks. Use the plain API (manual loop or \`tool_runner\`) when you need a lightweight loop with only your own custom tools, full control over the prompt and request shape, or no dependency on the Claude Code harness.`,
    },
  ],
  examples: [
    {
      title: 'A coordinator with a restricted reviewer subagent',
      description:
        'The parent can edit code; the reviewer may only read. Note that "Task" must be in allowedTools for delegation to work at all.',
      language: 'typescript',
      code: `import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const msg of query({
  prompt: "Refactor billing/tax.ts for readability, then have the reviewer check it.",
  options: {
    allowedTools: ["Read", "Edit", "Bash", "Grep", "Glob", "Task"],
    agents: {
      reviewer: {
        description: "Use after any code change to review for bugs and style.",
        prompt: "You review diffs for correctness and style. Report findings; do not edit.",
        tools: ["Read", "Grep", "Glob"],
      },
    },
  },
})) {
  if (msg.type === "result") console.log(msg.result);
}`,
      takeaway: 'AgentDefinition scopes each subagent; the parent needs the Task tool to use them.',
    },
    {
      title: 'A PreToolUse hook that blocks large refunds',
      description:
        'Business rule: refunds above $500 require a human. A prompt instruction was ignored once in a few hundred runs. The hook makes the rule deterministic and tells the model why the call was denied so it can escalate instead.',
      language: 'python',
      code: `from claude_agent_sdk import query, ClaudeAgentOptions, HookMatcher

async def cap_refunds(input_data, tool_use_id, context):
    if input_data["tool_name"] == "mcp__billing__process_refund":
        if input_data["tool_input"].get("amount", 0) > 500:
            return {"hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": "Refunds over $500 need human approval. Use escalate_to_human.",
            }}
    return {}

options = ClaudeAgentOptions(
    hooks={"PreToolUse": [HookMatcher(matcher="mcp__billing__.*", hooks=[cap_refunds])]},
)`,
      takeaway: 'Hooks turn a probabilistic instruction into a guaranteed control, with a reason the model can act on.',
    },
    {
      title: 'The mistake: resuming with stale analysis',
      description:
        'A developer analyzed a codebase on Monday, made large edits on Tuesday, and on Wednesday resumed the Monday session to "add tests for the functions you found." The agent wrote tests against function signatures that no longer existed. The fix was either to start a new session with a short structured summary and let it re-read the code, or to resume while stating exactly which files changed so the agent re-reads only those.',
      language: 'text',
      code: `# Better resume prompt
"Since our last session, billing/invoice.py and billing/tax.py were
rewritten; compute_total() now takes a Currency argument. Re-read those
two files before writing tests. Everything else is unchanged."`,
      takeaway: 'Resume only when prior context is still valid; otherwise inform the agent of changes or start fresh with a summary.',
    },
  ],
  keyPoints: [
    'The Agent SDK is Claude Code as a library: query() runs the full loop with built-in Read/Write/Edit/Bash/Glob/Grep tools, compaction and CLAUDE.md loading.',
    'Subagents are declared as AgentDefinition entries (description, prompt, tools, optional model) and spawned through the Task tool.',
    'The parent\'s allowedTools must include "Task" or it cannot delegate.',
    'Subagents start with empty context; pass findings and constraints explicitly in the Task prompt. Spawn in parallel with multiple Task calls in one turn.',
    'Hooks (PreToolUse, PostToolUse, Stop, SessionStart, ...) give deterministic control: block policy violations, enforce prerequisites, normalize tool outputs.',
    'Sessions can be resumed; fork_session branches from a shared baseline to explore alternatives independently.',
    'Resume when prior context is still valid; otherwise tell the agent what changed or start fresh with a structured summary.',
    'Prefer the Agent SDK for coding/file/shell agents; prefer the API tool runner for lightweight loops with only custom tools.',
  ],
  flashcards: [
    { front: 'What is the Claude Agent SDK?', back: 'The Claude Code harness exposed as a Python/TypeScript library; query() runs an agent loop with built-in tools, hooks, subagents and session management.' },
    { front: 'Which built-in tools does the Agent SDK provide?', back: 'Read, Write, Edit, Bash, Glob, Grep, plus Task for subagents and web tools.' },
    { front: 'What fields does an AgentDefinition carry?', back: 'description (when to delegate), prompt (system prompt), optional tools restriction, optional model.' },
    { front: 'What must be true for a parent agent to spawn subagents?', back: 'Its allowedTools must include "Task".' },
    { front: 'Do subagents inherit the parent\'s conversation?', back: 'No. They start with isolated, empty context; the parent passes what they need in the Task prompt.' },
    { front: 'How do you run several subagents in parallel?', back: 'Emit multiple Task tool calls in a single parent turn.' },
    { front: 'Name two uses of a PreToolUse hook.', back: 'Blocking a policy-violating tool call (refund over a threshold) and enforcing prerequisites (deny downstream tools until verification completes).' },
    { front: 'What is a PostToolUse hook good for?', back: 'Transforming tool results before the model sees them, e.g. normalizing timestamps and status codes from different MCP tools.' },
    { front: 'What is fork_session for?', back: 'Creating an independent branch from an existing session to explore divergent approaches from a shared analysis baseline.' },
    { front: 'When should you start a new session instead of resuming?', back: 'When prior tool results are stale (files changed); start fresh with a structured summary, or resume while naming exactly what changed.' },
    { front: 'When is the API tool runner a better fit than the Agent SDK?', back: 'A lightweight loop with only your own custom tools and full control of the request, with no need for Claude Code\'s built-in tools or harness.' },
  ],
  quiz: [
    {
      question:
        'A coordinator built with the Agent SDK defines three subagents in the agents option, but it never delegates and tries to do everything itself. What is the most likely cause?',
      options: [
        'Subagents only work with the Bash tool enabled.',
        '"Task" is missing from the coordinator\'s allowedTools, so it cannot invoke subagents.',
        'The subagent descriptions are too long.',
        'Subagents require fork_session to be enabled.',
      ],
      correct: [1],
      explanation:
        'The Task tool is the mechanism for spawning subagents and must be allowed. Bash (A) and fork_session (D) are unrelated; description length (C) affects delegation quality, not availability.',
    },
    {
      question:
        'An agent must never issue a refund above $500 without human approval. Which implementation gives a deterministic guarantee?',
      options: [
        'A system prompt line: "Never refund more than $500."',
        'A PreToolUse hook that inspects the refund tool\'s input and denies calls above $500 with a reason directing escalation.',
        'A PostToolUse hook that logs refunds above $500.',
        'Lowering the model\'s effort so it is less creative.',
      ],
      correct: [1],
      explanation:
        'Only an interception before execution guarantees compliance. A prompt (A) is probabilistic, logging after the fact (C) does not prevent the refund, and effort (D) is unrelated.',
    },
    {
      question:
        'Three MCP servers return dates as Unix timestamps, ISO 8601 strings and "MM/DD/YYYY" respectively, and the agent makes comparison errors. What is the cleanest fix?',
      options: [
        'A PostToolUse hook that normalizes dates to one format before the model processes the results.',
        'Ask the model in the system prompt to be careful with dates.',
        'Remove two of the three MCP servers.',
        'Use a larger model.',
      ],
      correct: [0],
      explanation:
        'PostToolUse hooks exist precisely to transform heterogeneous tool results deterministically. Prompting (B) is unreliable, removing servers (C) loses capability, and model size (D) does not fix inconsistent input formats.',
    },
    {
      question:
        'After a full codebase analysis, a team wants to compare two refactoring strategies without either exploration contaminating the other. Which feature fits?',
      options: [
        'Resume the same session twice in sequence.',
        'fork_session to create two independent branches from the shared analysis.',
        'Increase max_turns so one session can try both.',
        'Clear the session with /compact between attempts.',
      ],
      correct: [1],
      explanation:
        'Forking preserves the expensive baseline and keeps branches independent. Sequential resumes (A) and a single long session (C) mix the explorations; compaction (D) summarizes rather than branching.',
    },
    {
      question:
        'Which TWO statements about Agent SDK subagents are correct? (Select two)',
      options: [
        'They automatically share the parent\'s memory between invocations.',
        'Each AgentDefinition can restrict the tools the subagent may use.',
        'They can be run in parallel by issuing several Task calls in one turn.',
        'They must use the same model as the parent.',
      ],
      correct: [1, 2],
      explanation:
        'Tool restriction and parallel spawning are both supported. Subagents do not share memory or context (A), and an AgentDefinition may specify a different model (D).',
    },
  ],
  statements: [
    { text: 'The Agent SDK provides built-in Read, Write, Edit, Bash, Glob and Grep tools.', isTrue: true, explanation: 'These are the same production tools Claude Code uses.' },
    { text: 'A parent agent can spawn subagents even if "Task" is not in its allowedTools.', isTrue: false, explanation: 'Task is the spawning mechanism and must be allowed.' },
    { text: 'Subagents receive the parent\'s full conversation history automatically.', isTrue: false, explanation: 'Subagent context is isolated; the parent must pass needed context in the prompt.' },
    { text: 'A PreToolUse hook can deny a tool call and give the model a reason.', isTrue: true, explanation: 'This is the standard way to enforce business rules deterministically.' },
    { text: 'Hooks provide probabilistic compliance, similar to prompt instructions.', isTrue: false, explanation: 'Hooks are code and run every time; they give deterministic guarantees that prompts cannot.' },
    { text: 'fork_session creates an independent branch from an existing session\'s state.', isTrue: true, explanation: 'Useful for exploring alternatives from a shared, expensive baseline.' },
    { text: 'Resuming a session is always preferable to starting a new one because it preserves context.', isTrue: false, explanation: 'If prior tool results are stale, resuming misleads the model; start fresh with a summary or state exactly what changed.' },
    { text: 'The Agent SDK loads CLAUDE.md files and MCP servers the same way Claude Code does.', isTrue: true, explanation: 'It is the same harness exposed as a library.' },
  ],
  resources: [
    { label: 'Agent SDK overview (Claude Code docs)', url: 'https://code.claude.com/docs/en/agent-sdk/overview' },
    { label: 'Subagents in the SDK', url: 'https://code.claude.com/docs/en/agent-sdk/subagents' },
    { label: 'Hooks in the SDK', url: 'https://code.claude.com/docs/en/agent-sdk/hooks' },
    { label: 'Sessions in the SDK', url: 'https://code.claude.com/docs/en/agent-sdk/sessions' },
  ],
};
