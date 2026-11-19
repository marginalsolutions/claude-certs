import type { Concept } from '../../types';

export const agentMemoryPatterns: Concept = {
  id: 'agent-memory-patterns',
  title: 'Agent Memory Patterns',
  summary:
    'How agents remember: the memory tool for cross-session persistence, scratchpad files for working state, and in-loop context management with compaction and context editing.',
  certs: ['ccdv-f', 'ccar-f', 'ccar-p'],
  domains: ['ccdv-f-1', 'ccdv-f-6', 'ccar-f-5', 'ccar-p-2'],
  tags: ['memory', 'context-window', 'compaction', 'context-editing', 'agents'],
  difficulty: 'intermediate',
  diagram: 'context-window',
  sections: [
    {
      heading: 'Three time horizons of memory',
      body: `The Messages API is stateless: the model remembers only what is in the current request. "Memory" in an agent is therefore something you build, and it comes in three horizons.

| Horizon | Lives in | Mechanism |
|---|---|---|
| **Within a turn** | The context window | The \`messages\` array: history, tool results, thinking |
| **Within a session** | Context window plus files the agent writes | Scratchpad / plan files, compaction, context editing |
| **Across sessions** | Durable storage | Memory tool (\`memory_20250818\`), memory stores, your database |

Most memory bugs come from confusing these. A fact the agent "learned" in one session is gone next session unless something wrote it to durable storage. A long session that keeps appending tool results eventually hits the window limit even on a 1M-token model, and quality degrades well before the hard limit as stale results dilute attention.

The design question is: what must survive, for how long, and in what form? Raw transcripts are the wrong form for long-term memory; distilled notes are the right one.`,
    },
    {
      heading: 'The memory tool',
      body: `The **memory tool** is an Anthropic-defined, client-executed tool declared as \`{"type": "memory_20250818", "name": "memory"}\`. Claude issues file-system-style commands against a \`/memories\` directory: \`view\`, \`create\`, \`str_replace\`, \`insert\`, \`delete\`, \`rename\`. Your code executes them against storage you control (local disk, a database, object storage) and returns results. The Python and TypeScript SDKs provide a helper (\`BetaAbstractMemoryTool\` / \`betaMemoryTool\`) so you only implement the six operations.

Claude is trained to check its memory directory at the start of a task and to write down durable facts (user preferences, project conventions, decisions) as it works. Because the files persist between conversations, the next session starts with that knowledge.

Rules that come up on the exam:

- Never store secrets (API keys, passwords, tokens) in memory files; they are replayed verbatim into future contexts.
- Treat PII carefully and respect data-protection rules; the reference implementation has **no built-in access control**, so multi-user systems need per-user directories and authentication in the tool handler.
- Memory content is model-written and therefore untrusted; validate paths and confine operations to the memory root.

Managed Agents offers a hosted equivalent, **memory stores**, mounted into the session container as a directory the agent edits with ordinary file tools.`,
    },
    {
      heading: 'Scratchpads and state files inside a session',
      body: `Long tasks benefit from the agent writing its own working state to a file: a plan with checkboxes, a list of files examined, open questions, intermediate results. This is the **scratchpad** pattern. It serves two purposes:

1. **Recovery.** If the context is compacted or the session restarts, the agent re-reads the scratchpad and continues rather than re-deriving everything.
2. **Focus.** Writing a plan and ticking items off keeps a long agentic run on track, a known weakness of unstructured loops.

In Claude Code this is what \`CLAUDE.md\`, plan mode and the auto-memory directory do; in the Agent SDK it is any file the agent writes with the built-in tools; in a custom harness it can be a dedicated \`update_plan\` tool or the memory tool itself. The Architect guide's advice on resumption follows from this: when resuming after code changes, tell the agent what changed; when prior tool results are stale, start fresh with a structured summary. A scratchpad is that structured summary, maintained continuously.

Subagents are the complementary pattern: delegate the noisy exploration so its tool results never enter the main window, and keep only the returned summary.`,
    },
    {
      heading: 'Managing the window inside a loop: compaction vs context editing',
      body: `Two API features keep a long loop within budget, and the exam expects you to tell them apart.

| | Compaction | Context editing |
|---|---|---|
| What it does | **Summarizes** earlier history into a compaction block | **Removes** old tool results (and optionally tool inputs or thinking blocks) |
| Beta header | \`compact-2026-01-12\` (\`compact_20260112\` edit) | \`context-management-2025-06-27\` (\`clear_tool_uses_20250919\`, \`clear_thinking_20251015\`) |
| When | Approaching the window limit | Many turns of stale tool output that no longer matter |
| Information | Preserved in condensed form | Dropped; conversation structure kept |

Both operate within a session; neither persists anything across sessions. That is the memory tool's job. Many long-running agents use all three: context editing to prune, compaction when nearing the limit, memory for what must outlive the session.

Operational points: cache the stable prefix and move the breakpoint forward each turn so the growing history is cheap; prune tool outputs in your harness (truncate huge file reads, summarize search results) before they enter the window; and keep an eye on \`usage.input_tokens\` per iteration as an early warning of bloat.`,
    },
  ],
  examples: [
    {
      title: 'Wiring the memory tool with the SDK helper',
      description:
        'A support agent should remember each customer\'s preferences across chats. The handler stores files under a per-customer root so one customer\'s memory can never leak into another\'s session.',
      language: 'python',
      code: `from pathlib import Path
from anthropic.lib.tools import BetaAbstractMemoryTool

class CustomerMemory(BetaAbstractMemoryTool):
    def __init__(self, customer_id: str):
        super().__init__()
        self.root = Path(f"/data/memories/{customer_id}").resolve()
    def _safe(self, p: str) -> Path:
        full = (self.root / p.removeprefix("/memories/")).resolve()
        if not full.is_relative_to(self.root): raise ValueError("path escapes root")
        return full
    def view(self, cmd):   return self._safe(cmd.path).read_text()
    def create(self, cmd): self._safe(cmd.path).write_text(cmd.file_text); return "ok"
    # str_replace / insert / delete / rename implemented the same way

runner = client.beta.messages.tool_runner(
    model="claude-opus-5-5", max_tokens=4096, tools=[CustomerMemory(cust_id)],
    messages=[{"role": "user", "content": question}])`,
      takeaway: 'You own the storage; scope it per user and confine paths to the memory root.',
    },
    {
      title: 'Context editing in a long tool loop',
      description:
        'A log-analysis agent runs 60 iterations, each returning a few thousand tokens of grep output that is irrelevant after the next step. Clearing old tool results keeps the window lean without losing the conversation shape.',
      language: 'python',
      code: `response = client.beta.messages.create(
    model="claude-opus-5-5",
    max_tokens=4096,
    betas=["context-management-2025-06-27"],
    context_management={"edits": [{
        "type": "clear_tool_uses_20250919",
        "trigger": {"type": "input_tokens", "value": 150_000},
        "keep": {"type": "tool_uses", "value": 5},
    }]},
    tools=tools,
    messages=messages,
)`,
      takeaway: 'Context editing prunes stale tool results; it is not the same feature as compaction.',
    },
    {
      title: 'The mistake: expecting the transcript to be memory',
      description:
        'A team\'s onboarding agent asked each new hire for their preferred language and time zone, then asked again the next day. Nothing had been persisted; the "memory" was the previous day\'s messages array, which lived only in that process. The fix added the memory tool and a system-prompt line to check /memories first. A second bug surfaced during review: the agent had written a user\'s SSO token into a memory file. They added a handler-side scrub for secret-shaped strings and a prompt rule never to store credentials.',
      language: 'text',
      code: `Before: session 1 messages[] ----X (process ends)----  session 2 starts empty
After:  session 1 -> memory.create("/memories/user_prefs.md") -> disk
        session 2 -> memory.view("/memories") -> prefs loaded`,
      takeaway: 'Cross-session memory must be written to durable storage, and never contain secrets.',
    },
  ],
  keyPoints: [
    'The API is stateless; all memory is built by the application across three horizons: turn, session, cross-session.',
    'The memory tool (`memory_20250818`) is client-executed: Claude issues view/create/str_replace/insert/delete/rename against a /memories directory you store.',
    'Never store secrets in memory files; add per-user isolation and access control, because the reference implementation has none.',
    'Scratchpad/plan files keep long runs on track and allow recovery after compaction or restart.',
    'Compaction summarizes history (beta compact-2026-01-12); context editing removes old tool results (beta context-management-2025-06-27). They are different features.',
    'Neither compaction nor context editing persists across sessions; that is the memory tool\'s job.',
    'Subagents keep noisy exploration out of the main window; prune large tool outputs in the harness.',
  ],
  flashcards: [
    { front: 'What is the tool type string for the memory tool?', back: 'memory_20250818 (declared as {"type": "memory_20250818", "name": "memory"}).' },
    { front: 'Who executes memory tool commands?', back: 'Your application (client side); you implement storage for the /memories directory.' },
    { front: 'List the memory tool commands.', back: 'view, create, str_replace, insert, delete, rename.' },
    { front: 'Which SDK helpers implement the memory backend?', back: 'BetaAbstractMemoryTool (Python) and betaMemoryTool with MemoryToolHandlers (TypeScript).' },
    { front: 'What should never go into memory files?', back: 'Secrets such as API keys, passwords and tokens; they are replayed verbatim into future contexts.' },
    { front: 'Compaction vs context editing in one sentence each.', back: 'Compaction summarizes earlier history into a block; context editing deletes old tool results and thinking blocks.' },
    { front: 'Which beta header enables compaction? Which enables context editing?', back: 'compact-2026-01-12 for compaction; context-management-2025-06-27 for context editing.' },
    { front: 'Does compaction persist information across sessions?', back: 'No. It operates within a session. Cross-session persistence requires the memory tool or external storage.' },
    { front: 'What is the scratchpad pattern?', back: 'The agent writes its plan and working state to a file so it can recover after compaction or restart and stay focused.' },
    { front: 'What is the Managed Agents equivalent of the memory tool?', back: 'Memory stores, mounted into the session container as a directory edited with ordinary file tools.' },
  ],
  quiz: [
    {
      question:
        'An agent must remember a user\'s preferred report format from one week to the next. Which mechanism provides this?',
      options: [
        'Prompt caching, so the earlier conversation is cached between sessions.',
        'The memory tool, with files persisted to storage your application controls.',
        'Compaction, so the preference is included in the summary.',
        'A larger context window.',
      ],
      correct: [1],
      explanation:
        'Cross-session persistence requires durable storage written via the memory tool (or your own store). Caching (A) is a cost feature with a short lifetime, compaction (C) works within a session, and window size (D) does not survive process end.',
    },
    {
      question:
        'A 200-iteration agent loop is slowing down and costs are rising, but the conversation is still far from the context limit. Most tokens are old grep output. Which feature targets this directly?',
      options: [
        'Compaction with beta compact-2026-01-12.',
        'Context editing with clear_tool_uses_20250919 to remove old tool results.',
        'The memory tool.',
        'Raising max_tokens.',
      ],
      correct: [1],
      explanation:
        'Stale tool results that are no longer needed are what context editing removes. Compaction (A) is for approaching the limit and summarizes rather than prunes; memory (C) is cross-session; max_tokens (D) governs output length.',
    },
    {
      question:
        'Which TWO statements about the memory tool are correct? (Select two)',
      options: [
        'It is executed on Anthropic\'s servers with storage managed by Anthropic.',
        'Claude issues commands such as view, create and str_replace against a /memories directory.',
        'The reference implementation includes per-user access control by default.',
        'Secrets should never be written to memory files.',
      ],
      correct: [1, 3],
      explanation:
        'The tool is client-executed (A is false) and the reference implementation has no access control (C is false). The command set and the no-secrets rule are correct.',
    },
    {
      question:
        'A multi-tenant assistant implements the memory tool by writing all files to a single /memories directory on disk. What is the primary risk?',
      options: [
        'The files will exceed the context window.',
        'One tenant\'s memories can be read by another tenant\'s session.',
        'Claude cannot use str_replace on shared files.',
        'Compaction will delete the files.',
      ],
      correct: [1],
      explanation:
        'Without per-tenant directories and authorization in the handler, memory leaks across users. The other options misunderstand the mechanics: files are read on demand (A), str_replace works on any file (C), and compaction does not touch storage (D).',
    },
    {
      question:
        'A developer is resuming a long investigation after the context was compacted mid-task and notices the agent repeating earlier steps. Which practice would have prevented this?',
      options: [
        'Disabling compaction entirely.',
        'Having the agent maintain a scratchpad/plan file it re-reads after compaction.',
        'Setting an iteration cap of 10.',
        'Using a smaller model to reduce verbosity.',
      ],
      correct: [1],
      explanation:
        'A scratchpad preserves working state in a form that survives summarization. Disabling compaction (A) leads to window overflow, an iteration cap (C) truncates the task, and model size (D) is unrelated.',
    },
  ],
  statements: [
    { text: 'The memory tool stores files on Anthropic\'s infrastructure automatically.', isTrue: false, explanation: 'It is a client-side tool; your application implements the storage backend.' },
    { text: 'Compaction and context editing are two names for the same feature.', isTrue: false, explanation: 'Compaction summarizes (compact-2026-01-12); context editing clears old tool results (context-management-2025-06-27).' },
    { text: 'Memory tool commands include view, create, str_replace, insert, delete and rename.', isTrue: true, explanation: 'Claude operates on a /memories directory with these file-style operations.' },
    { text: 'Context editing persists the cleared tool results to disk for later retrieval.', isTrue: false, explanation: 'Cleared content is removed, not archived. Anything needed later must be written to memory or a file.' },
    { text: 'Writing a plan file during a long task helps the agent recover after compaction.', isTrue: true, explanation: 'The scratchpad pattern provides a structured summary the agent can re-read.' },
    { text: 'Storing a user\'s API token in a memory file is acceptable if the directory is per-user.', isTrue: false, explanation: 'Secrets must never be stored in memory files regardless of isolation; they are replayed into future contexts.' },
    { text: 'Delegating exploration to a subagent is a form of context-window management.', isTrue: true, explanation: 'The subagent\'s tool results stay in its own window; only the summary returns.' },
  ],
  resources: [
    { label: 'Memory tool (Claude docs)', url: 'https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool' },
    { label: 'Compaction (Claude docs)', url: 'https://platform.claude.com/docs/en/build-with-claude/compaction' },
    { label: 'Context editing (Claude docs)', url: 'https://platform.claude.com/docs/en/build-with-claude/context-editing' },
    { label: 'Effective context engineering for AI agents (Anthropic)', url: 'https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents' },
  ],
};
