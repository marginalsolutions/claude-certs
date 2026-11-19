import type { Concept } from '../../types';

export const sessionStateResumeAndFork: Concept = {
  id: 'session-state-resume-and-fork',
  title: 'Session State: Resume, Fork and Fresh Starts',
  summary:
    'Sessions persist an agent\'s conversation and tool results. Resume a named session to continue work, fork it to explore alternatives from a shared baseline, and know when stale tool results make a fresh session with a summary the safer choice.',
  certs: ['ccar-f', 'ccdv-f'],
  domains: ['ccar-f-1', 'ccar-f-5', 'ccdv-f-1', 'ccdv-f-3'],
  tags: ['sessions', 'resume', 'fork_session', 'agent-sdk', 'claude-code', 'context'],
  difficulty: 'intermediate',
  diagram: 'context-window',
  sections: [
    {
      heading: 'What a session holds',
      body: `A Claude Code or Agent SDK **session** is the persisted conversation: every user message, assistant response, tool call and tool result. When you resume a session, all of that history is reloaded into context, so the agent "remembers" the codebase it explored, the decisions it made and the files it read.

Each session has an id, and in Claude Code you can give it a **name** (\`/rename\`) so it is easy to find later. Resuming by name is the ergonomic way to run long investigations across several working sessions: "the auth-refactor investigation" rather than a UUID.

| Mechanism | Claude Code CLI | Agent SDK option |
|---|---|---|
| Continue the most recent session | \`claude --continue\` | \`continue_conversation=True\` |
| Resume a specific session | \`claude --resume <id-or-name>\` | \`resume="<session_id>"\` |
| Branch from a session | \`claude --resume <id> --fork-session\` | \`resume=..., fork_session=True\` |

The Agent SDK surfaces the session id in the initial system message of a \`query()\` stream; store it if you intend to resume programmatically.`,
    },
    {
      heading: 'Resuming: cheap continuity, with a catch',
      body: `Resuming is cheap because the analysis already done is not repeated. It is the right choice when **the prior context is still mostly valid**: the agent read 40 files yesterday, nothing material changed, and you want to continue the same investigation.

The catch is that the agent's knowledge of the codebase is frozen at the moment each file was read. If you edited \`billing/invoice.py\` after the session ended, the resumed agent still "knows" the old version. It will reason from stale tool results and may make edits that conflict with the current file.

The remedy is to **inform the resumed session about what changed**: "Since the last session, invoice.py and the tests under tests/billing changed; re-read those before continuing." This targets re-analysis at the files that actually changed instead of forcing the agent to re-explore everything, and it prevents confident mistakes based on outdated content.`,
    },
    {
      heading: 'Forking: divergent branches from a shared baseline',
      body: `\`fork_session\` creates a **new** session whose history is a copy of the original up to the fork point. The original is untouched. Use it when you want to explore two approaches that both start from the same analysis:

- Compare two testing strategies (property-based vs example-based) for the same module after one exploration pass.
- Try two refactoring approaches (extract interface vs adapter) without paying for the codebase analysis twice.
- Run a risky experiment without polluting the main investigation's context.

Each fork proceeds independently and accumulates its own history. Afterwards you compare outcomes and keep the better branch. Without forking, you would either serialise the experiments in one session (each one's context contaminating the next) or redo the expensive baseline analysis per approach.

Forking is a session-level mechanism; it is distinct from subagents, which start with empty context and are used for delegation rather than for exploring alternatives.`,
    },
    {
      heading: 'When to start fresh instead',
      body: `Resumption carries every stale tool result along with it. When **most** of the prior context is outdated, say a large merge landed or the branch was rebased, a resumed session is full of file contents that no longer exist. The agent cannot easily tell which parts of its memory are current, and the context is also bloated with obsolete data.

In that case, **start a new session and inject a structured summary**: what was investigated, what was decided and why, which files are relevant, what remains to be done. The new session re-reads current files on demand and reasons from accurate state. A written summary is also auditable and shareable in a way a raw transcript is not.

Decision rule:

- Prior context mostly valid, small known changes → resume and name the changed files.
- Prior context largely stale → fresh session with a structured summary.
- Want to compare alternatives from one baseline → fork.
- Context nearly full but still valid → \`/compact\` (or Agent SDK compaction) rather than abandoning the session.`,
    },
  ],
  examples: [
    {
      title: 'Forking a codebase analysis to compare two test strategies',
      description:
        'The baseline session explored the billing module. Two forks try different strategies without repeating the exploration. The original session stays intact for later use.',
      language: 'python',
      code: `from claude_agent_sdk import query, ClaudeAgentOptions

BASELINE = "sess_billing_analysis"   # captured from the first run's init message

async def try_strategy(instruction):
    opts = ClaudeAgentOptions(resume=BASELINE, fork_session=True,
                              allowed_tools=["Read", "Write", "Edit", "Bash", "Grep", "Glob"])
    async for msg in query(prompt=instruction, options=opts):
        yield msg

a = try_strategy("Using the analysis so far, add property-based tests for invoice.py "
                 "with hypothesis. Report coverage and any bugs found.")
b = try_strategy("Using the analysis so far, add example-based pytest tests for "
                 "invoice.py. Report coverage and any bugs found.")`,
      takeaway: 'fork_session gives each experiment the shared baseline without re-analysis and without contaminating the original.',
    },
    {
      title: 'The mistake: resuming after a big refactor',
      description:
        'An engineer resumed last week\'s "payment-migration" session after a 60-file merge. The agent confidently edited functions that had been moved or renamed, producing a broken diff. Its memory of the codebase was a week old. The fix was to start a fresh session with a half-page summary of decisions and open items, letting the agent re-read current files.',
      language: 'markdown',
      code: `# Summary for new session (replaces stale resume)
## Goal
Migrate payment provider from Stripe v1 client to v2 across services/payments.

## Decided
- Keep PaymentGateway interface; implement StripeV2Gateway behind it.
- Idempotency keys generated in gateway, not callers.

## Already done (merged in PR #412)
- Interface extracted; StripeV1Gateway adapted.

## Remaining
- Implement StripeV2Gateway; update webhooks/handlers.py; add contract tests.
Note: a 60-file merge landed since the last analysis. Re-read files before editing.`,
      takeaway: 'When most prior tool results are stale, a fresh session with a structured summary beats resuming.',
    },
    {
      title: 'Resuming a named session and naming what changed',
      description:
        'The investigation is still valid, but two files changed overnight. Resuming by name and pointing the agent at those files avoids both a full re-exploration and stale edits.',
      language: 'bash',
      code: `# Day 1: name the session so it is easy to find
claude
> /rename auth-refactor-investigation

# Day 2: resume it and flag the changed files
claude --resume auth-refactor-investigation
> Since yesterday, src/auth/session.py and tests/auth/test_session.py changed
> (PR #418). Re-read those two files before continuing the refactor plan.`,
      takeaway: 'Resume when context is mostly valid, and tell the agent exactly which files to re-read.',
    },
  ],
  keyPoints: [
    'A session persists the full conversation including tool results; resuming reloads it so prior analysis is not repeated.',
    'Claude Code: --continue for the latest session, --resume <id-or-name> for a specific one, /rename to name a session.',
    'Agent SDK: resume="<session_id>" to continue; add fork_session=True to branch into an independent copy.',
    'Resumed sessions hold stale file contents; tell the agent which files changed so it re-reads them.',
    'fork_session explores divergent approaches from a shared analysis baseline without repeating work or contaminating the original.',
    'When most prior tool results are stale (big merge, rebase), start a fresh session with a structured summary instead of resuming.',
    'Forking is for comparing alternatives; subagents are for delegation with fresh, isolated context.',
  ],
  flashcards: [
    { front: 'How do you resume a specific named session in Claude Code?', back: 'claude --resume <session-name-or-id>.' },
    { front: 'What does fork_session do?', back: 'Creates a new session that copies the original history up to that point, leaving the original untouched, so alternatives can be explored independently.' },
    { front: 'When is fork_session the right tool?', back: 'When comparing divergent approaches (two test or refactoring strategies) from a shared analysis baseline.' },
    { front: 'What should you tell a resumed session after files changed?', back: 'Which specific files changed, so it re-reads them rather than relying on stale tool results or re-exploring everything.' },
    { front: 'When is a fresh session with a summary better than resuming?', back: 'When most prior tool results are stale, for example after a large merge or rebase.' },
    { front: 'What is the risk of resuming after extensive code changes without warning the agent?', back: 'It reasons from stale file contents and may make edits that conflict with the current code.' },
    { front: 'How does the Agent SDK expose the session id for later resumption?', back: 'In the initial system message of the query() stream; store it.' },
    { front: 'Fork vs subagent: what is the difference?', back: 'A fork inherits the full session history for exploring alternatives; a subagent starts with isolated, empty context for delegation.' },
    { front: 'What does --continue do?', back: 'Resumes the most recent session in the current directory.' },
  ],
  quiz: [
    {
      question:
        'An engineer wants to compare property-based and example-based testing for a module after an agent spent 20 minutes analysing it. Which approach avoids repeating the analysis while keeping the comparisons independent?',
      options: [
        'Run both strategies sequentially in the same session.',
        'Start two fresh sessions and paste the module path into each.',
        'Fork the analysis session twice with fork_session and run one strategy per fork.',
        'Spawn two subagents from the session with the Task tool.',
      ],
      correct: [2],
      explanation:
        'Forks inherit the baseline analysis and proceed independently. Sequential runs in one session let the first contaminate the second; fresh sessions redo the analysis; subagents start with empty context and would also need to re-analyse.',
    },
    {
      question:
        'A session analysed a service last week. Since then a 60-file merge rewrote much of it. The engineer resumes the session and the agent produces edits against functions that no longer exist. What is the best remedy?',
      options: [
        'Resume again with a higher effort setting.',
        'Start a new session with a structured summary of decisions and open items, letting the agent re-read current files.',
        'Resume and ask the agent to "double-check everything".',
        'Run /compact on the resumed session to remove old content.',
      ],
      correct: [1],
      explanation:
        'Most of the prior tool results are stale, so a fresh session with an injected summary is more reliable. Effort does not refresh stale data, a vague instruction leaves the agent unsure what is current, and compaction summarises the stale content rather than replacing it.',
    },
    {
      question: 'Which TWO statements about session resumption are correct? (Select two)',
      options: [
        'Resuming reloads prior tool results, so the agent\'s view of files is frozen at the time they were read.',
        'Resumed sessions automatically detect and re-read files changed since the last session.',
        'Telling the resumed agent which files changed enables targeted re-analysis instead of full re-exploration.',
        'Resuming is only possible within 24 hours of the original session.',
      ],
      correct: [0, 2],
      explanation:
        'Resumed context is static until the agent re-reads files, which is why naming the changed files matters. There is no automatic change detection, and resumption is not limited to a 24-hour window.',
    },
    {
      question:
        'A two-day investigation into an authentication bug is still accurate; only one file changed overnight. What is the most efficient way to continue?',
      options: [
        'Start a fresh session and re-explore the codebase.',
        'Resume the named session and tell the agent to re-read the changed file before continuing.',
        'Fork the session so the change does not affect the original.',
        'Paste the full transcript into a new session.',
      ],
      correct: [1],
      explanation:
        'Prior context is mostly valid, so resuming with a targeted note is cheapest and safest. Re-exploring wastes the two days of work, forking is for comparing alternatives, and pasting a transcript bloats context with stale data.',
    },
    {
      question: 'In the Agent SDK, which option combination creates an independent branch of an existing session?',
      options: [
        'continue_conversation=True alone',
        'resume="<session_id>" together with fork_session=True',
        'allowed_tools including "Task"',
        'A new AgentDefinition with the same prompt',
      ],
      correct: [1],
      explanation:
        'resume selects the session and fork_session makes the continuation a new branch. continue_conversation resumes the latest session in place, Task enables subagents, and AgentDefinition defines subagent types.',
    },
  ],
  statements: [
    { text: 'Resuming a session reloads the full prior conversation including tool results.', isTrue: true, explanation: 'This is what lets the agent continue without repeating analysis.' },
    { text: 'A resumed session automatically knows which files changed since it last ran.', isTrue: false, explanation: 'It does not. You must tell it which files changed so it re-reads them.' },
    { text: 'fork_session modifies the original session so both branches share subsequent history.', isTrue: false, explanation: 'A fork is an independent copy; the original is untouched and the branches diverge.' },
    { text: 'When most prior tool results are stale, a fresh session with a structured summary is more reliable than resuming.', isTrue: true, explanation: 'Stale file contents lead to confident but wrong edits; a summary plus fresh reads avoids that.' },
    { text: 'Sessions can be given names in Claude Code so they can be resumed by name.', isTrue: true, explanation: '/rename names a session; claude --resume <name> brings it back.' },
    { text: 'Forking a session and spawning a subagent are interchangeable ways to explore alternative approaches.', isTrue: false, explanation: 'Forks inherit the full history; subagents start with isolated context and are for delegation.' },
    { text: 'Informing a resumed session about specific changed files allows targeted re-analysis instead of full re-exploration.', isTrue: true, explanation: 'This is the recommended practice when prior context is mostly valid.' },
  ],
  resources: [
    { label: 'Agent SDK sessions', url: 'https://platform.claude.com/docs/en/agent-sdk/sessions' },
    { label: 'Claude Code CLI reference', url: 'https://code.claude.com/docs/en/cli-reference' },
    { label: 'Claude Code common workflows: resume conversations', url: 'https://code.claude.com/docs/en/common-workflows' },
  ],
};
