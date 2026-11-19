import type { Concept } from '../../types';

export const claudeCodeFundamentals: Concept = {
  id: 'claude-code-fundamentals',
  title: 'Claude Code Fundamentals',
  summary:
    'What Claude Code is, the five building blocks you configure it with (Rules, Skills, Commands, Agents, Memory), how sessions work, and how the CLAUDE.md hierarchy is loaded.',
  certs: ['ccdv-f', 'ccar-f', 'ccar-p'],
  domains: ['ccdv-f-3', 'ccdv-f-2', 'ccar-f-3', 'ccar-p-7'],
  tags: ['claude-code', 'cli', 'configuration', 'memory'],
  difficulty: 'foundations',
  diagram: 'claude-md-hierarchy',
  sections: [
    {
      heading: 'What Claude Code is',
      body: `Claude Code is Anthropic's agentic coding tool. It runs in your terminal (and in IDE extensions, the desktop app and the web), reads and edits files in your repository, runs shell commands, and iterates until a task is done. Under the hood it is an agent loop around the Claude API with a fixed set of built-in tools: **Read, Write, Edit, Bash, Glob, Grep**, plus web fetch, a **Task** tool for spawning subagents, and any MCP tools you connect.

The same harness is exposed as a library through the **Claude Agent SDK**, so what you learn about CLAUDE.md, hooks and permissions carries over to programmatic agents.

For the exam, think of Claude Code as a *configurable* agent. Most questions are about which configuration surface solves a given problem: a convention every engineer must follow, a repeatable workflow, a task that should run in isolation, or a guardrail that must be enforced rather than requested.`,
    },
    {
      heading: 'The five core components',
      body: `| Component | Where it lives | What it is for |
|---|---|---|
| **Agent Memory (CLAUDE.md)** | \`~/.claude/CLAUDE.md\`, \`./CLAUDE.md\` or \`./.claude/CLAUDE.md\`, subdirectory \`CLAUDE.md\` | Persistent instructions loaded into every session: build commands, conventions, architecture notes. |
| **Rules** | \`.claude/rules/*.md\` with optional \`paths:\` frontmatter | Modular instruction files; path-scoped rules load only when matching files are touched. |
| **Commands** | \`.claude/commands/<name>.md\` | Custom slash commands: a reusable prompt invoked as \`/name args\`. |
| **Skills** | \`.claude/skills/<name>/SKILL.md\` | Richer, discoverable capabilities with frontmatter (\`description\`, \`allowed-tools\`, \`context: fork\`, \`argument-hint\`) and supporting files. Claude can invoke them itself when the description matches. |
| **Agents (subagents)** | \`.claude/agents/<name>.md\` | Specialised workers with their own system prompt, tool list and model, run in a separate context window via the Task tool. |

Settings (\`settings.json\`) are the sixth piece: permissions, hooks, environment variables and the default model. The difference to remember: CLAUDE.md and rules are *always-on context*, commands are *user-triggered*, skills are *model-discoverable*, and agents are *isolated contexts*.`,
    },
    {
      heading: 'The CLAUDE.md hierarchy',
      body: `Claude Code assembles memory from several layers, most general first:

1. **Managed/enterprise policy** (set by an administrator, cannot be overridden).
2. **User memory** \`~/.claude/CLAUDE.md\`: your personal preferences across all projects.
3. **Project memory** \`./CLAUDE.md\` (or \`./.claude/CLAUDE.md\`): committed to the repo and shared with the team. \`CLAUDE.local.md\` is the gitignored personal variant.
4. **Subdirectory CLAUDE.md** files: loaded lazily when Claude works on files beneath them, so monorepo packages can carry their own conventions.

Claude Code also walks *up* from the current directory, so launching from a subfolder still picks up the repository root file. Files can pull in others with \`@path/to/file\` imports (for example \`@README.md\` or \`@docs/conventions.md\`), which keeps the root file short.

Keep CLAUDE.md concise and specific: commands to run, style rules the linter does not catch, architecture decisions, things *not* to do. Long, vague files dilute attention and cost tokens on every turn. Run \`/init\` in a new repository to generate a starting CLAUDE.md from what Claude finds in the codebase, then edit it. Use \`/memory\` to open and edit the memory files from inside a session, or just tell Claude to remember something and it will offer to save it.`,
    },
    {
      heading: 'Sessions and built-in slash commands',
      body: `A session is one conversation with its own context window. Useful controls:

- \`claude --continue\` (\`-c\`) reopens the most recent session in this directory; \`claude --resume\` (\`-r\`) lets you pick an earlier one by id or from a list.
- \`/compact [instructions]\` summarises the conversation so far and replaces the history with the summary, freeing context while keeping the gist. Claude Code also auto-compacts as the window fills.
- \`/clear\` wipes the history and starts fresh without leaving the process. Prefer it when switching to an unrelated task so stale context does not mislead the model.
- \`/memory\` edits CLAUDE.md files; \`/init\` bootstraps one.
- \`/model\` switches the model; \`/cost\` shows token usage for the session; \`/permissions\` manages allow/deny rules; \`/mcp\` and \`/agents\` list and configure servers and subagents; \`/hooks\` inspects hooks; \`/config\` and \`/status\` show settings; \`/doctor\` checks the install; \`/help\` lists everything.
- **Plan mode** (Shift+Tab to cycle, or \`--permission-mode plan\`) makes Claude read and propose without editing, which is the right choice for large refactors or unfamiliar code before committing to changes.

Session hygiene matters: compaction loses detail, so write durable facts into CLAUDE.md rather than relying on a long conversation to remember them.`,
    },
  ],
  examples: [
    {
      title: 'A good project CLAUDE.md',
      description:
        'A team wants every engineer, and Claude, to use the same build and test commands and to avoid a known footgun. They commit this file at the repo root.',
      language: 'markdown',
      code: `# Project: billing-service

## Commands
- Install: \`pnpm install\`
- Test a single file: \`pnpm vitest run <path>\`
- Lint before committing: \`pnpm lint --fix\`

## Conventions
- Use \`zod\` schemas in \`src/schemas/\` for all request validation.
- Never edit files under \`src/generated/\`; run \`pnpm codegen\` instead.

## Architecture
@docs/architecture.md`,
      takeaway: 'CLAUDE.md should hold the specific, non-obvious facts Claude cannot infer from the code, and import longer documents instead of inlining them.',
    },
    {
      title: 'Monorepo conventions per package',
      description:
        'A monorepo has a Python data pipeline in `services/etl/` and a React app in `apps/web/`. Instead of one giant root file, each package gets its own `CLAUDE.md` that loads only when Claude works in that tree, keeping the always-on context small.',
      language: 'text',
      code: `repo/
  CLAUDE.md                 # shared: PR process, commit style
  services/etl/CLAUDE.md    # "use poetry run pytest", dbt conventions
  apps/web/CLAUDE.md        # "use pnpm", component folder layout
  .claude/rules/sql.md      # paths: ["**/*.sql"] -> SQL style rules`,
      takeaway: 'Subdirectory CLAUDE.md files and path-scoped rules load conditionally; put package-specific guidance there rather than in the root.',
    },
    {
      title: 'Mistake: relying on conversation memory',
      description:
        'A developer spends an hour explaining a tricky deployment procedure to Claude in chat. The next day they start a new session and Claude has no idea. Even `--resume` would only bring back a compacted summary. The fix is to ask Claude to save the procedure to CLAUDE.md (or run `/memory`) so it is loaded every session.',
      language: 'bash',
      code: `# Yesterday (lost):  "Remember: deploy with ./scripts/deploy.sh --env staging first"
# Fix: persist it
/memory            # opens CLAUDE.md in your editor; add a "Deployment" section
# or simply type: "Add the staging-first deploy rule to the project CLAUDE.md"`,
      takeaway: 'Conversation history is ephemeral and lossy under compaction; durable knowledge belongs in memory files.',
    },
    {
      title: 'Choosing between /compact and /clear',
      description:
        'Midway through a long debugging session the context is nearly full. If the next step continues the same investigation, `/compact focus on the failing auth tests` keeps the relevant thread. If the developer is about to start an unrelated feature, `/clear` is better: a summary of the old bug would only distract.',
      takeaway: 'Compact to continue the same task with less context; clear to switch tasks cleanly.',
    },
  ],
  keyPoints: [
    'Claude Code is an agent loop with built-in Read/Write/Edit/Bash/Glob/Grep tools; the Agent SDK exposes the same harness as a library.',
    'Five configurable components: Agent Memory (CLAUDE.md), Rules (.claude/rules/), Commands (.claude/commands/), Skills (.claude/skills/), Agents (.claude/agents/). settings.json holds permissions, hooks and env.',
    'CLAUDE.md hierarchy: managed policy → user (~/.claude/CLAUDE.md) → project (./CLAUDE.md or .claude/CLAUDE.md, plus gitignored CLAUDE.local.md) → subdirectory files loaded on demand.',
    '@path imports keep CLAUDE.md short; /init generates a first draft; /memory edits it in session.',
    '--continue reopens the last session, --resume picks one; /compact summarises history, /clear discards it.',
    'Plan mode lets Claude read and propose without editing; use it before large or risky changes.',
    'Durable knowledge belongs in memory files, not in conversation history that compaction will lose.',
  ],
  flashcards: [
    { front: 'Where does user-level (cross-project) Claude Code memory live?', back: '~/.claude/CLAUDE.md' },
    { front: 'Two valid locations for project-level CLAUDE.md?', back: './CLAUDE.md at the repo root, or ./.claude/CLAUDE.md. CLAUDE.local.md is the gitignored personal variant.' },
    { front: 'How do you include another file inside CLAUDE.md?', back: 'With an @import, e.g. @docs/architecture.md.' },
    { front: 'Which slash command generates an initial CLAUDE.md for a repository?', back: '/init' },
    { front: 'Difference between claude --continue and claude --resume?', back: '--continue (-c) reopens the most recent session in the directory; --resume (-r) lets you choose a specific earlier session.' },
    { front: 'What does /compact do?', back: 'Summarises the conversation and replaces the history with the summary to free context; optional instructions focus the summary.' },
    { front: 'When are subdirectory CLAUDE.md files loaded?', back: 'Lazily, when Claude reads or edits files beneath that directory.' },
    { front: 'Which component is model-discoverable rather than user-triggered: a command or a skill?', back: 'A skill. Claude can invoke a skill when its description matches the task; commands are invoked by the user with /name.' },
    { front: 'Which slash command shows token usage for the current session?', back: '/cost' },
    { front: 'What is plan mode?', back: 'A permission mode where Claude reads and proposes changes but does not edit files or run mutating commands until you approve.' },
  ],
  quiz: [
    {
      question:
        'A team keeps re-explaining to Claude Code that tests must be run with `pnpm vitest run` rather than `npm test`, and that files under `src/generated/` must never be edited by hand. What is the MOST appropriate fix?',
      options: [
        'Start each session with a longer first prompt that repeats the rules.',
        'Add the commands and the prohibition to the project CLAUDE.md committed to the repository.',
        'Switch to a larger model so it infers the conventions.',
        'Create a subagent that reminds the main agent of the rules.',
      ],
      correct: [1],
      explanation:
        'Project CLAUDE.md is loaded into every session for every team member, which is exactly what persistent conventions need. Repeating the prompt is manual and error-prone, a bigger model cannot know repo-specific commands, and a subagent runs in a separate context and is not the mechanism for always-on instructions.',
    },
    {
      question:
        'A developer launches `claude` from `repo/apps/web/`. Which CLAUDE.md files are loaded at startup? (Select two)',
      options: [
        '`repo/CLAUDE.md` found by walking up from the current directory',
        '`~/.claude/CLAUDE.md` user memory',
        '`repo/services/etl/CLAUDE.md`, because all subdirectory files are loaded eagerly',
        'Only `repo/apps/web/CLAUDE.md`; parent directories are ignored',
      ],
      correct: [0, 1],
      explanation:
        'Claude Code loads user memory and walks up the tree to find project memory. Sibling subdirectory files (services/etl) are loaded only when Claude touches files there, and parent directories are not ignored.',
    },
    {
      question:
        'The context window in a long debugging session is almost full, and the developer wants to keep investigating the same failing test. Which action best fits?',
      options: [
        'Run /clear to free the context.',
        'Run /compact with a note to focus on the failing test.',
        'Exit and start a new session with --resume.',
        'Increase max_tokens in settings.json.',
      ],
      correct: [1],
      explanation:
        '/compact keeps a summary of the relevant thread while freeing space. /clear discards everything including the investigation so far. --resume reopens the same full history and does not free anything. max_tokens controls output length, not the context window.',
    },
    {
      question:
        'Which statement about `CLAUDE.local.md` is correct?',
      options: [
        'It is loaded only in headless mode.',
        'It is a personal, gitignored project memory file for one developer.',
        'It overrides managed enterprise policy.',
        'It must be placed in ~/.claude/.',
      ],
      correct: [1],
      explanation:
        'CLAUDE.local.md sits in the project but is excluded from version control so a developer can keep personal notes. Managed policy cannot be overridden by any user or project file, and the user-level file is ~/.claude/CLAUDE.md, not CLAUDE.local.md.',
    },
    {
      question:
        'A root CLAUDE.md has grown to 3,000 lines of architecture documentation and Claude seems to ignore some instructions. What is the best remedy?',
      options: [
        'Trim CLAUDE.md to specific commands and rules, and @import the long architecture document so it can be referenced when needed.',
        'Duplicate the file into every subdirectory so it is loaded more often.',
        'Move the whole file into a custom slash command.',
        'Disable compaction so the instructions are never summarised.',
      ],
      correct: [0],
      explanation:
        'Long, vague memory dilutes attention and costs tokens every turn; concise rules plus imports fix both. Duplicating multiplies the problem, a slash command would make the conventions user-triggered instead of always-on, and compaction is unrelated to how memory files are read.',
    },
    {
      question: 'Which component should a team use for a workflow a developer explicitly triggers, such as "prepare a release PR"?',
      options: ['A path-scoped rule in .claude/rules/', 'A custom slash command in .claude/commands/', 'A line in ~/.claude/CLAUDE.md', 'A PreToolUse hook'],
      correct: [1],
      explanation:
        'Custom slash commands are reusable prompts invoked on demand. Rules and CLAUDE.md are always-on context, and hooks are deterministic scripts around tool calls, not prompts.',
    },
  ],
  statements: [
    { text: 'Claude Code loads subdirectory CLAUDE.md files lazily, when it works on files under that directory.', isTrue: true, explanation: 'This keeps always-on context small in monorepos.' },
    { text: 'Running /compact permanently deletes the session so it cannot be resumed.', isTrue: false, explanation: '/compact replaces history with a summary inside the live session; it does not delete the session.' },
    { text: 'User-level memory in ~/.claude/CLAUDE.md applies to every project on that machine.', isTrue: true, explanation: 'It is the personal, cross-project layer of the hierarchy.' },
    { text: 'A project CLAUDE.md can override managed enterprise policy settings.', isTrue: false, explanation: 'Managed policy sits above all user and project configuration and cannot be overridden.' },
    { text: '/init generates a starting CLAUDE.md by inspecting the repository.', isTrue: true, explanation: 'You then edit the draft to add non-obvious conventions.' },
    { text: 'Skills are only ever invoked explicitly by the user with a slash command.', isTrue: false, explanation: 'Claude can invoke a skill itself when the SKILL.md description matches the task; that is what distinguishes skills from plain commands.' },
    { text: 'claude --continue reopens the most recent session in the current directory.', isTrue: true, explanation: '--resume lets you pick a specific earlier session instead.' },
  ],
  resources: [
    { label: 'Claude Code overview', url: 'https://code.claude.com/docs/en/overview' },
    { label: 'Manage Claude\'s memory (CLAUDE.md)', url: 'https://code.claude.com/docs/en/memory' },
    { label: 'Built-in slash commands', url: 'https://code.claude.com/docs/en/slash-commands' },
  ],
};
