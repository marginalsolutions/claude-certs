import type { Concept } from '../../types';

export const claudeCodeCustomization: Concept = {
  id: 'claude-code-customization',
  title: 'Customizing Claude Code: Commands, Skills, Subagents, Rules, Hooks, Plugins and MCP',
  summary:
    'The extension points of Claude Code and when to reach for each: slash commands for reusable prompts, Skills for discoverable capabilities, subagents for isolated work, rules for scoped conventions, hooks for enforced behaviour, plugins for distribution, and .mcp.json for external tools.',
  certs: ['ccdv-f', 'ccar-f', 'ccar-p'],
  domains: ['ccdv-f-3', 'ccdv-f-8', 'ccdv-f-7', 'ccar-f-3', 'ccar-f-2', 'ccar-p-7', 'ccar-p-2'],
  tags: ['claude-code', 'skills', 'hooks', 'subagents', 'mcp', 'plugins'],
  difficulty: 'intermediate',
  diagram: 'hooks-lifecycle',
  sections: [
    {
      heading: 'Commands, Skills and the difference between them',
      body: `A **custom slash command** is a Markdown file in \`.claude/commands/\` (project) or \`~/.claude/commands/\` (user). The file name becomes the command: \`.claude/commands/fix-issue.md\` is \`/fix-issue\`. The body is the prompt; \`$ARGUMENTS\` (or \`$1\`, \`$2\`) is replaced with what the user typed, and \`!\`\`cmd\`\` lines run a shell command and inline its output. Commands are the right tool for workflows a person deliberately triggers.

A **Skill** is a directory \`.claude/skills/<name>/SKILL.md\` plus any helper files. The frontmatter declares:

- \`description\`: what the skill does and when to use it. Claude reads this to decide whether to invoke the skill on its own, so write it like a trigger condition.
- \`allowed-tools\`: tools the skill may use without prompting while it runs.
- \`context: fork\`: run the skill in a forked, isolated context so its intermediate work does not pollute the main conversation.
- \`argument-hint\`: placeholder text shown when a user invokes it as \`/<name>\`.
- \`disable-model-invocation: true\` if only humans should trigger it.

Skills load progressively: only the description sits in context until the skill is needed, then the body and supporting files are read. That is why a skill with scripts and reference documents is cheaper than pasting the same material into CLAUDE.md. Skills written this way also run in the Agent SDK and on the Claude API Skills endpoint, so the same package travels across surfaces.`,
    },
    {
      heading: 'Subagents and rules',
      body: `**Subagents** live in \`.claude/agents/<name>.md\` (or \`~/.claude/agents/\`). Frontmatter sets \`name\`, \`description\` (used to decide when to delegate), an optional \`tools\` allowlist and \`model\`; the body is the subagent's system prompt. The main agent delegates via the Task tool, the subagent works in its **own context window**, and only its final report comes back. Use subagents for noisy, parallelisable or specialised work: exploring a large codebase (the built-in Explore agent), running a test suite and summarising failures, or a security review with a restricted toolset. The cost is latency and a loss of shared context, so do not fork for trivial steps. \`/agents\` manages them interactively.

**Rules** in \`.claude/rules/*.md\` split CLAUDE.md into topic files. A rule with a \`paths:\` frontmatter list of globs loads only when Claude works on matching files:

\`\`\`markdown
---
paths:
  - "src/db/**/*.sql"
  - "migrations/**"
---
Use explicit column lists; never SELECT *. Every migration needs a down step.
\`\`\`

Rules without \`paths\` load always. Path scoping keeps the always-on context small and avoids irrelevant instructions competing for attention.`,
    },
    {
      heading: 'Hooks: deterministic control around the loop',
      body: `Hooks are shell commands (or prompts) that Claude Code runs at lifecycle events, configured under \`hooks\` in \`settings.json\` (user, project or \`settings.local.json\`). Events include \`SessionStart\`, \`UserPromptSubmit\`, \`PreToolUse\`, \`PostToolUse\`, \`Notification\`, \`Stop\`, \`SubagentStop\`, \`PreCompact\` and \`SessionEnd\`. Each hook has a \`matcher\` (for tool events, a regex over tool names such as \`Bash\` or \`Edit|Write\`) and a list of commands. The hook receives JSON on stdin describing the event (for PreToolUse, the tool name and its input).

Exit codes carry the decision: **0** lets the action proceed (stdout is shown or, for some events, added to context), **2** blocks it and feeds stderr back to Claude as the reason, any other code is a non-blocking error. A hook can also print a JSON object with a \`permissionDecision\` of allow, deny or ask, and a reason.

Hooks are the answer whenever a question says *must never*, *always*, or *automatically*: block \`rm -rf\` and \`git push --force\`, run the formatter after every edit, require tests to pass before Claude stops, or inject the current sprint context at session start. They execute outside the model, so they cannot be talked out of by a prompt injection. The same hook model exists in the Agent SDK.`,
    },
    {
      heading: 'Plugins, marketplaces and MCP servers',
      body: `A **plugin** bundles commands, skills, agents, hooks and MCP server definitions into one installable unit with a \`plugin.json\` manifest. Teams publish plugins to a **marketplace** (a Git repository or URL with a \`marketplace.json\` index). Users add a marketplace and install with \`/plugin\`, or an admin pins marketplaces and plugins in managed settings so every engineer gets the same toolkit. Plugins are how you distribute customisation across many repositories without copying files.

**MCP servers** connect Claude Code to external systems. Configure them with \`claude mcp add\` or by editing a config file:

| Scope | File | Shared with |
|---|---|---|
| project | \`.mcp.json\` in the repo root | Everyone who clones the repo (Claude asks for approval the first time) |
| user | \`~/.claude.json\` | All your projects on this machine |
| local | project entry in \`~/.claude.json\` | Only you, only this project |

Each entry names a server with a transport: \`stdio\` (a local command and args) or HTTP for remote servers, plus optional \`env\` and headers. Tools appear as \`mcp__<server>__<tool>\` and can be allowlisted in permissions like any other tool. Choosing between built-in tools, custom skills and MCP: use built-ins for files and shell, a skill for *how* to do something, and MCP when Claude needs *access* to a system it cannot reach through the shell.`,
    },
  ],
  examples: [
    {
      title: 'A slash command with arguments and shell context',
      description:
        'The team wants `/fix-issue 1234` to pull the GitHub issue and start a fix. The command inlines the issue body and the current branch.',
      language: 'markdown',
      code: `<!-- .claude/commands/fix-issue.md -->
---
description: Fix a GitHub issue by number
argument-hint: <issue-number>
allowed-tools: Bash(gh issue view:*), Bash(git status:*)
---
Issue to fix: !\`gh issue view $ARGUMENTS --json title,body\`
Current branch: !\`git branch --show-current\`

Write a failing test that reproduces the issue, then fix it. Keep the diff minimal.`,
      takeaway: 'Commands turn a repeatable prompt into a one-liner and can pull in live shell output.',
    },
    {
      title: 'A forked skill for release notes',
      description:
        'Generating release notes requires reading dozens of commits, which would flood the main conversation. The skill runs in a forked context and returns only the finished notes.',
      language: 'markdown',
      code: `<!-- .claude/skills/release-notes/SKILL.md -->
---
name: release-notes
description: Draft release notes from git history between two tags. Use when the user asks for a changelog or release notes.
allowed-tools: Bash(git log:*), Bash(git diff:*), Read
context: fork
argument-hint: <from-tag> <to-tag>
---
1. Run \`git log $0..$1 --pretty=format:'%h %s'\`.
2. Group commits by area using the conventions in ./conventions.md.
3. Return Markdown release notes only; no commentary.`,
      takeaway: 'context: fork isolates noisy work; the description is what lets Claude invoke the skill unprompted.',
    },
    {
      title: 'Mistake: asking instead of enforcing',
      description:
        'A team wrote "Never run destructive git commands" in CLAUDE.md. During a long session Claude, following a misleading error message, ran `git reset --hard` and lost uncommitted work. Instructions are advisory; a PreToolUse hook is enforced. The fix blocks the commands with exit code 2 so Claude is told why.',
      language: 'json',
      code: `{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Bash",
      "hooks": [{
        "type": "command",
        "command": "jq -r '.tool_input.command' | grep -Eq 'reset --hard|push --force|rm -rf' && { echo 'Blocked: destructive command' >&2; exit 2; } || exit 0"
      }]
    }]
  }
}`,
      takeaway: 'When something must never happen, use a hook or a permissions deny rule; a CLAUDE.md line is a request the model can misjudge.',
    },
    {
      title: 'Project-scoped MCP server',
      description:
        'A repo depends on an internal issue tracker exposed as an MCP server. Committing `.mcp.json` means every teammate gets the tools after cloning, and the token stays in an environment variable rather than the file.',
      language: 'json',
      code: `{
  "mcpServers": {
    "tracker": {
      "type": "http",
      "url": "https://mcp.tracker.internal/mcp",
      "headers": { "Authorization": "Bearer \${TRACKER_TOKEN}" }
    },
    "db-readonly": {
      "command": "npx",
      "args": ["-y", "@acme/mcp-postgres", "--readonly"],
      "env": { "DATABASE_URL": "\${DATABASE_URL}" }
    }
  }
}`,
      takeaway: 'Project .mcp.json shares server definitions with the team; secrets are referenced from the environment, never committed.',
    },
  ],
  keyPoints: [
    'Commands (.claude/commands/*.md) are user-triggered prompts; $ARGUMENTS and !`cmd` inject input and shell output.',
    'Skills (.claude/skills/<name>/SKILL.md) are model-discoverable via description; frontmatter supports allowed-tools, context: fork, argument-hint; body loads only when invoked.',
    'Subagents (.claude/agents/*.md) run in their own context with their own tools and model; only the final report returns.',
    'Rules (.claude/rules/*.md) modularise CLAUDE.md; paths: frontmatter loads them only for matching files.',
    'Hooks in settings.json run at PreToolUse, PostToolUse, Stop, SessionStart and other events; exit 2 blocks and sends stderr to Claude.',
    'Hooks and permission deny rules are enforced controls; prompt instructions are advisory.',
    'Plugins bundle commands/skills/agents/hooks/MCP for distribution through marketplaces.',
    'MCP scopes: project .mcp.json (shared), user ~/.claude.json, local; transports stdio and HTTP.',
  ],
  flashcards: [
    { front: 'Where do project custom slash commands live and how is the name derived?', back: '.claude/commands/<name>.md; the file name is the command, e.g. fix-issue.md -> /fix-issue.' },
    { front: 'Which SKILL.md frontmatter key lets Claude decide when to invoke the skill?', back: 'description. Write it as a trigger condition.' },
    { front: 'What does context: fork do in a skill?', back: 'Runs the skill in an isolated forked context so intermediate work does not clutter the main conversation.' },
    { front: 'How do you make a rule file apply only to certain files?', back: 'Add a paths: list of globs in the frontmatter of .claude/rules/<file>.md.' },
    { front: 'What does hook exit code 2 mean?', back: 'Block the action and feed stderr back to Claude as the reason. Exit 0 allows; other codes are non-blocking errors.' },
    { front: 'Name five hook events.', back: 'SessionStart, UserPromptSubmit, PreToolUse, PostToolUse, Stop (also Notification, SubagentStop, PreCompact, SessionEnd).' },
    { front: 'Which file shares MCP servers with everyone who clones a repo?', back: '.mcp.json at the project root.' },
    { front: 'Where is user-scoped MCP configuration stored?', back: '~/.claude.json' },
    { front: 'What frontmatter does a subagent file support?', back: 'name, description, optional tools allowlist and model; the body is its system prompt.' },
    { front: 'What is a plugin marketplace?', back: 'A Git repo or URL with a marketplace.json index from which users or admins install plugins with /plugin.' },
  ],
  quiz: [
    {
      question:
        'A team needs Prettier to run automatically after every file Claude Code edits, with no chance of being skipped. Which approach is MOST appropriate?',
      options: [
        'Add "always run prettier after editing" to CLAUDE.md.',
        'Configure a PostToolUse hook matching Edit|Write that runs prettier on the edited file.',
        'Create a /format slash command developers run at the end.',
        'Write a skill named format with a strong description.',
      ],
      correct: [1],
      explanation:
        'A hook runs deterministically after the matching tool call. CLAUDE.md and skills depend on the model choosing to comply, and a slash command depends on a human remembering to run it.',
    },
    {
      question:
        'SQL style rules should apply only when Claude edits files under db/ and migrations/, not when it works on the React frontend. What should the team do?',
      options: [
        'Put the rules in ~/.claude/CLAUDE.md.',
        'Create .claude/rules/sql.md with a paths: frontmatter listing the SQL globs.',
        'Create a subagent that knows SQL rules.',
        'Add the rules to .mcp.json.',
      ],
      correct: [1],
      explanation:
        'Path-scoped rules load only for matching files. User CLAUDE.md applies everywhere, a subagent is a separate context rather than a convention mechanism, and .mcp.json configures servers, not instructions.',
    },
    {
      question:
        'Which TWO statements about Skills are correct? (Select two)',
      options: [
        'Claude can invoke a skill on its own when the description matches the task.',
        'The full SKILL.md body is always loaded into context at session start.',
        'allowed-tools lets the skill use listed tools without prompting while it runs.',
        'Skills can only be invoked in headless mode.',
      ],
      correct: [0, 2],
      explanation:
        'Skills are model-discoverable and can pre-authorise tools. Only the description is loaded until the skill is used, and skills work in interactive and headless mode alike.',
    },
    {
      question:
        'Exploring a 500k-line codebase to find all callers of a deprecated API fills the main context with file dumps. What is the best remedy?',
      options: [
        'Raise the context window size in settings.json.',
        'Delegate the search to a subagent (such as the Explore agent) and receive only a summary.',
        'Ask Claude to read files more carefully.',
        'Switch to bypassPermissions so searches run faster.',
      ],
      correct: [1],
      explanation:
        'Subagents run in their own context and return only results, keeping the main window clean. Context size is a model property, prompting does not reduce tool output, and permissions do not affect context usage.',
    },
    {
      question:
        'A developer committed `.mcp.json` with a database connection string containing a password. What should they have done?',
      options: [
        'Moved the server definition to ~/.claude.json so it is never shared.',
        'Referenced the secret via an environment variable in .mcp.json and kept the value out of the repo.',
        'Added the password to CLAUDE.local.md instead.',
        'Used the stdio transport, which hides credentials.',
      ],
      correct: [1],
      explanation:
        'Project .mcp.json is meant to be shared; secrets belong in environment variables that each machine supplies. Moving to user scope defeats sharing, CLAUDE.local.md is memory not config, and transport choice does not protect credentials.',
    },
    {
      question: 'A hook script prints "tests failed" to stderr and exits with code 2 on a Stop event. What happens?',
      options: [
        'The session ends and the message is logged.',
        'Claude is prevented from stopping and receives the message so it can continue fixing the tests.',
        'The hook is treated as a non-blocking warning.',
        'Claude Code crashes with a configuration error.',
      ],
      correct: [1],
      explanation:
        'Exit code 2 blocks the event and returns stderr to Claude. Non-zero codes other than 2 are non-blocking errors, and a valid hook never crashes the session.',
    },
  ],
  statements: [
    { text: 'A skill with context: fork runs in an isolated context and returns only its result to the main conversation.', isTrue: true, explanation: 'This keeps noisy intermediate work out of the main window.' },
    { text: 'Hooks are suggestions the model may choose to follow.', isTrue: false, explanation: 'Hooks are shell commands executed by Claude Code itself at lifecycle events; the model cannot skip them.' },
    { text: 'Rules in .claude/rules/ without a paths: frontmatter load in every session.', isTrue: true, explanation: 'Only path-scoped rules are conditional.' },
    { text: 'MCP servers can only be configured per user, never per project.', isTrue: false, explanation: 'Project scope uses .mcp.json in the repo; user scope uses ~/.claude.json.' },
    { text: 'A subagent shares the main conversation context window.', isTrue: false, explanation: 'Subagents run in their own context; only the final report comes back.' },
    { text: 'Plugins can bundle commands, skills, agents, hooks and MCP server definitions.', isTrue: true, explanation: 'A plugin.json manifest ties them together for distribution via marketplaces.' },
    { text: 'In a slash command file, $ARGUMENTS is replaced with the text the user typed after the command.', isTrue: true, explanation: 'Positional $1, $2 are also supported.' },
  ],
  resources: [
    { label: 'Skills in Claude Code', url: 'https://code.claude.com/docs/en/skills' },
    { label: 'Subagents', url: 'https://code.claude.com/docs/en/sub-agents' },
    { label: 'Hooks reference', url: 'https://code.claude.com/docs/en/hooks' },
    { label: 'Connect to MCP servers', url: 'https://code.claude.com/docs/en/mcp' },
  ],
};
