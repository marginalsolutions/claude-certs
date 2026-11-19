import type { Concept } from '../../types';

export const enablingTeamsWithClaudeCode: Concept = {
  id: 'enabling-teams-with-claude-code',
  title: 'Enabling Teams with Claude Code',
  summary:
    'Configure Claude Code for an engineering organization: a standard project CLAUDE.md and settings, shared skills, commands and plugins, MCP servers with scoped access, permission policies and hooks that enforce safety, an onboarding path, and a way to measure whether developer productivity actually improved.',
  certs: ['ccar-p', 'ccar-f', 'ccdv-f'],
  domains: ['ccar-p-7', 'ccar-f-3', 'ccdv-f-3'],
  tags: ['claude-code', 'team-enablement', 'claude-md', 'settings', 'hooks', 'mcp', 'developer-productivity'],
  difficulty: 'advanced',
  diagram: 'claude-md-hierarchy',
  sections: [
    {
      heading: 'A standard configuration teams inherit',
      body: `Individual developers get value from Claude Code on day one; organizations get value when the configuration is **shared, versioned and enforced**. The architect's job is to decide what lives at each level of the hierarchy:

| Level | Location | Shared via | Use for |
|---|---|---|---|
| Managed / enterprise | Managed settings deployed by IT (system-level \`managed-settings.json\`) | Device management | Organization-wide guardrails that users cannot override: denied commands, allowed MCP servers, telemetry |
| Project | \`CLAUDE.md\` at the repo root or \`.claude/CLAUDE.md\`; \`.claude/settings.json\`; \`.claude/rules/\`; \`.claude/commands/\`; \`.claude/skills/\`; \`.mcp.json\` | Version control | Team conventions, build and test commands, architecture notes, approved tools and servers, hooks |
| Subdirectory | \`CLAUDE.md\` in a package directory | Version control | Package-specific rules loaded when working there |
| User | \`~/.claude/CLAUDE.md\`, \`~/.claude/settings.json\`, \`~/.claude/commands/\`, \`~/.claude.json\` (user-scope MCP) | Not shared | Personal preferences and personal MCP servers |
| Local overrides | \`.claude/settings.local.json\` (git-ignored) | Not shared | Per-machine permissions and experiments |

A recurring exam scenario: a new team member does not get the team's instructions because they were written in a user-level file. Anything the team must share belongs at project level in version control. Use \`@import\` to pull in existing standards documents and \`.claude/rules/\` with \`paths:\` frontmatter to keep topic-specific rules (testing, API conventions, deployment) scoped and short instead of one monolithic CLAUDE.md. Run \`/memory\` to see which files are loaded when behaviour differs between machines.`,
    },
    {
      heading: 'Shared skills, commands, plugins and MCP servers',
      body: `Reusable capability should be packaged once and distributed, not re-prompted by every developer:

- **Commands** (\`.claude/commands/*.md\`) are project-scoped slash commands committed to the repo: \`/review-pr\`, \`/release-notes\`, \`/migrate-schema\`. They encode the team's procedure so every run follows it.
- **Skills** (\`.claude/skills/<name>/SKILL.md\`) carry richer instructions plus frontmatter: \`allowed-tools\` restricts what the skill may do, \`context: fork\` runs it in an isolated subagent so its output does not flood the main conversation, \`argument-hint\` documents parameters. Skills are loaded on demand, which keeps the base context small.
- **Plugins** bundle commands, skills, hooks and MCP configuration for distribution across many repositories through a marketplace the organization controls. Use them when the same capability must reach dozens of teams.
- **MCP servers** give Claude Code access to internal systems (issue tracker, CI, observability, internal docs). Configure team servers in project \`.mcp.json\` so everyone gets the same set; personal servers go in user scope. Prefer the organization's own servers or vetted ones; a malicious or sloppy MCP server is a supply-chain risk, and every server adds tool descriptions to context, so include only what the team needs (tool search helps when the catalogue is large).

Governance rule: anything that can take an action (deploy, write to production, send messages) is reviewed like code before it is shared, and its permissions are scoped as narrowly as the task allows.`,
    },
    {
      heading: 'Permission policies and hooks for safety',
      body: `Claude Code asks before running tools unless permissions say otherwise. For teams, encode the policy rather than relying on each developer's judgment:

- **\`permissions.allow\`** pre-approves safe, frequent actions (reading files, running the test suite, \`git status\`) so developers are not interrupted; **\`permissions.deny\`** blocks dangerous ones regardless of prompt (\`rm -rf\`, force pushes, production credentials, writes to certain paths). Deny rules at the managed level cannot be overridden locally.
- **Hooks** add deterministic checks at lifecycle events: \`PreToolUse\` to block or require confirmation for specific commands or file paths, \`PostToolUse\` to run formatters, linters or secret scanners after edits, \`Stop\` to run tests before a turn ends, \`SessionStart\` to load context or verify the environment, \`Notification\` to route events. Hooks are shell commands or scripts and run outside the model, so they are enforcement, not advice.
- **Headless and CI use** (\`claude -p\`) should run with explicit \`--allowedTools\` and in sandboxed runners with least-privilege credentials.
- **Secrets**: never in CLAUDE.md or settings committed to the repo; use environment variables and the organization's secret manager, and add a hook or deny rule that prevents reading secret files.

Exam angle: when a scenario asks how to ensure *every* developer's Claude Code sessions follow a safety rule, the answer is a project- or managed-level deny rule or hook committed and enforced, not a line in a personal CLAUDE.md or a reminder in a chat.`,
    },
    {
      heading: 'Onboarding and measuring productivity',
      body: `Rolling Claude Code out to a team is a change-management project:

1. **Start with a pilot team** that owns a repository with good tests; configure CLAUDE.md, settings, commands and MCP servers with them; capture what worked.
2. **Create a starter kit**: a template CLAUDE.md, a settings baseline with the organization's deny rules, two or three high-value commands, and an onboarding guide ("run \`/init\`, then review the generated CLAUDE.md against the template").
3. **Teach the workflow, not just the tool**: plan mode for larger changes, how to review AI-written diffs, when to use subagents, how to write a good CLAUDE.md (short, specific, verified commands), and how to report problems.
4. **Set guardrails for review**: AI-assisted changes go through the same pull-request review, tests and CI as any other change.

Measure before and after, and be honest about what the numbers mean. Useful signals: cycle time from ticket to merged PR, PR review turnaround, test coverage trend, change failure rate and incident count (productivity that raises failure rate is not productivity), onboarding time for new engineers, developer-reported time saved and satisfaction, and Claude Code usage and cost by team (Claude Code supports OpenTelemetry-based metrics export for exactly this). Avoid single-metric targets such as "lines of code" or "number of sessions"; they are easy to inflate and say nothing about value.`,
    },
  ],
  examples: [
    {
      title: 'Project settings with permissions and safety hooks',
      description:
        'A payments team commits a baseline settings file. Frequent safe actions are pre-approved, destructive commands are denied, and hooks block edits to migration files without a ticket reference and run the secret scanner after every edit.',
      language: 'json',
      code: `{
  "permissions": {
    "allow": ["Read", "Grep", "Glob", "Bash(npm test:*)", "Bash(git status)", "Bash(git diff:*)"],
    "deny": ["Bash(rm -rf:*)", "Bash(git push --force:*)", "Read(./.env*)", "Read(./secrets/**)"]
  },
  "hooks": {
    "PreToolUse": [
      { "matcher": "Edit|Write",
        "hooks": [{ "type": "command", "command": "scripts/hooks/guard-migrations.sh" }] }
    ],
    "PostToolUse": [
      { "matcher": "Edit|Write",
        "hooks": [{ "type": "command", "command": "scripts/hooks/secret-scan.sh" }] }
    ]
  }
}`,
      takeaway: 'Encode the team\'s safety policy in versioned settings and hooks so it applies to every session, not just careful developers.',
    },
    {
      title: 'Instructions that never reached the team',
      description:
        'A tech lead wrote detailed testing conventions into ~/.claude/CLAUDE.md. Weeks later, new hires produced PRs that ignored them. The file was user-level and never left the lead\'s laptop. Moving the conventions into .claude/rules/testing.md with a paths: frontmatter scoped to the test directories, committed to the repo, fixed it for everyone; /memory confirmed the file loaded on each machine.',
      takeaway: 'Team instructions belong in project-level files under version control; user-level files are personal.',
    },
    {
      title: 'A shared skill with restricted tools and forked context',
      description:
        'The platform team ships a dependency-audit skill. It may only read files and run the audit command, and it runs in a forked context so its long output does not consume the main conversation.',
      language: 'markdown',
      code: `---
name: dep-audit
description: Audit dependencies for known vulnerabilities and summarize required upgrades
allowed-tools: Read, Grep, Glob, Bash(npm audit:*)
context: fork
argument-hint: "[package-dir]"
---
Run \`npm audit --json\` in $ARGUMENTS (default: repo root).
Group findings by severity. For each high or critical finding, state the package,
the fixed version, and whether the upgrade is a major version. Do not modify any files.
Return a short table and a recommended order of upgrades.`,
      takeaway: 'Skills package a procedure with least-privilege tools; context: fork keeps noisy work out of the main session.',
    },
    {
      title: 'Measuring the rollout honestly',
      description:
        'Six weeks after rolling out Claude Code to two teams, the architect reported: median PR cycle time down 28%, review turnaround unchanged, change failure rate flat, developer-reported time saved 5 h/week median, Claude Code cost $1,900/month across 24 engineers. The unchanged review turnaround became the next focus (a /review-pr command and a review checklist in CLAUDE.md). Lines-of-code metrics were deliberately excluded.',
      takeaway: 'Report a balanced set including failure rate and cost; use the gaps to decide the next enablement step.',
    },
  ],
  keyPoints: [
    'Share what the team needs at project level in version control (CLAUDE.md, .claude/rules/, settings.json, commands, skills, .mcp.json); user-level files are personal and never reach teammates.',
    'Use @import and .claude/rules/ with paths: frontmatter to keep instructions modular and scoped; use /memory to debug which files are loaded.',
    'Package reusable procedures as commands and skills (allowed-tools, context: fork, argument-hint); distribute across many repos with plugins.',
    'Configure team MCP servers in project .mcp.json, personal ones in user scope; include only needed servers and vet them as supply chain.',
    'Enforce safety with permissions.allow/deny and hooks (PreToolUse, PostToolUse, Stop, SessionStart, Notification); managed settings make organization rules non-overridable.',
    'Never commit secrets in CLAUDE.md or settings; deny reads of secret files; run headless sessions with explicit allowed tools and least privilege.',
    'Onboard with a pilot, a starter kit and workflow training; AI-assisted changes go through normal review and CI.',
    'Measure productivity with a balanced set: cycle time, review turnaround, change failure rate, satisfaction, cost by team; avoid lines-of-code targets.',
  ],
  flashcards: [
    { front: 'Where do team-wide Claude Code instructions belong?', back: 'Project-level CLAUDE.md (repo root or .claude/CLAUDE.md) or .claude/rules/, committed to version control.' },
    { front: 'Why did a new hire not receive the lead\'s instructions?', back: 'They were in ~/.claude/CLAUDE.md, a user-level file that is not shared through version control.' },
    { front: 'What does .claude/rules/ with paths: frontmatter provide?', back: 'Topic-specific rule files scoped to matching paths, as an alternative to one monolithic CLAUDE.md.' },
    { front: 'Which command shows which memory files are loaded?', back: '/memory' },
    { front: 'Three useful SKILL.md frontmatter fields?', back: 'allowed-tools (restrict tools), context: fork (isolated subagent context), argument-hint (document parameters).' },
    { front: 'Project vs user MCP scope files?', back: 'Project: .mcp.json in the repo (shared). User: ~/.claude.json (personal).' },
    { front: 'What is the difference between a deny rule and a CLAUDE.md instruction?', back: 'A deny rule is enforced by the harness regardless of the prompt; a CLAUDE.md instruction is advice to the model.' },
    { front: 'Which hook runs before a tool executes and can block it?', back: 'PreToolUse' },
    { front: 'How are organization-wide non-overridable rules deployed?', back: 'Through managed settings deployed by IT (system-level managed-settings.json).' },
    { front: 'Name four balanced productivity metrics for a Claude Code rollout.', back: 'PR cycle time, review turnaround, change failure rate, developer-reported time saved and satisfaction (plus cost by team).' },
  ],
  quiz: [
    {
      question:
        'A team lead documented coding conventions in ~/.claude/CLAUDE.md, but a new teammate\'s Claude Code sessions ignore them. What is the MOST likely cause and fix?',
      options: [
        'The teammate\'s model is different; switch models.',
        'User-level CLAUDE.md is not shared; move the conventions into the project\'s CLAUDE.md or .claude/rules/ and commit them.',
        'Claude Code requires conventions in settings.json, not CLAUDE.md.',
        'The teammate must run /init to copy the lead\'s file.',
      ],
      correct: [1],
      explanation:
        'User-level files live on one machine. Project-level files in version control reach everyone. Model choice is unrelated, conventions do belong in CLAUDE.md, and /init generates a new file rather than copying someone else\'s.',
    },
    {
      question:
        'Security requires that no Claude Code session in the organization can run force pushes or read .env files, regardless of a developer\'s local settings. Which approach satisfies this?',
      options: [
        'Add a sentence to every project CLAUDE.md asking Claude not to do these things.',
        'Deny rules for those commands and paths in managed settings deployed by IT, which local settings cannot override.',
        'Ask developers to add the rules to settings.local.json.',
        'Rely on the model\'s safety training.',
      ],
      correct: [1],
      explanation:
        'Managed-level deny rules are enforced and non-overridable. Prompt text is advice, local settings are per developer and optional, and safety training is not an authorization control.',
    },
    {
      question: 'Which TWO are appropriate uses of SKILL.md frontmatter? (Select two)',
      options: [
        'allowed-tools to restrict the skill to read-only tools and a specific command.',
        'context: fork so a long-running audit does not flood the main conversation.',
        'Embedding the production API key so the skill can authenticate.',
        'Setting the model temperature.',
      ],
      correct: [0, 1],
      explanation:
        'allowed-tools and context: fork are supported and useful. Secrets never belong in committed files, and temperature is not a skill setting (and is rejected on current models).',
    },
    {
      question:
        'An organization wants the same set of internal MCP servers (issue tracker, CI, docs) available to every engineer working in a repository. Where should the configuration live?',
      options: [
        'Each engineer\'s ~/.claude.json.',
        'The project\'s .mcp.json committed to the repository.',
        'A wiki page with setup steps.',
        'The system prompt of each session.',
      ],
      correct: [1],
      explanation:
        'Project-scope .mcp.json is shared through version control. User scope is personal, wiki steps are manual and drift, and MCP servers are not configured via prompts.',
    },
    {
      question:
        'After a Claude Code rollout, leadership asks for a productivity report. Which metric set is MOST credible?',
      options: [
        'Lines of code written per developer per week.',
        'Number of Claude Code sessions started.',
        'PR cycle time, review turnaround, change failure rate, developer-reported time saved and satisfaction, and cost per team.',
        'Tokens consumed per month.',
      ],
      correct: [2],
      explanation:
        'A balanced set includes quality (failure rate) and cost alongside speed. Lines of code, session counts and tokens are easy to inflate and do not measure value.',
    },
    {
      question:
        'A team wants a formatter and secret scanner to run automatically after every file edit Claude Code makes. Which mechanism fits?',
      options: [
        'A PostToolUse hook matching Edit and Write tools.',
        'A note in CLAUDE.md asking Claude to run them.',
        'A PreToolUse hook on Bash.',
        'A user-level command.',
      ],
      correct: [0],
      explanation:
        'PostToolUse hooks run deterministically after the matched tool. A CLAUDE.md note is advisory, PreToolUse on Bash runs before shell commands rather than after edits, and a user-level command is manual and personal.',
    },
  ],
  statements: [
    { text: 'Instructions in ~/.claude/CLAUDE.md are shared with teammates through version control.', isTrue: false, explanation: 'User-level files are personal; project-level files are shared.' },
    { text: '.claude/rules/ files can be scoped to specific paths with frontmatter.', isTrue: true, explanation: 'paths: frontmatter loads a rule file only when working in matching paths.' },
    { text: 'A deny rule in managed settings can be overridden by a developer\'s settings.local.json.', isTrue: false, explanation: 'Managed settings are enforced organization-wide and cannot be overridden locally.' },
    { text: 'context: fork runs a skill in an isolated subagent context.', isTrue: true, explanation: 'This prevents the skill\'s output from polluting the main conversation.' },
    { text: 'Project-scoped MCP servers are configured in .mcp.json in the repository.', isTrue: true, explanation: 'User-scoped servers go in ~/.claude.json.' },
    { text: 'Hooks are suggestions the model may choose to follow.', isTrue: false, explanation: 'Hooks are shell commands run by the harness at lifecycle events; they are enforcement.' },
    { text: 'Lines of code is a reliable primary metric for AI-assisted developer productivity.', isTrue: false, explanation: 'It is easy to inflate and ignores quality; use cycle time, failure rate, satisfaction and cost.' },
    { text: 'Claude Code can export usage metrics through OpenTelemetry for team-level reporting.', isTrue: true, explanation: 'This supports cost attribution and adoption measurement.' },
  ],
  resources: [
    { label: 'Claude Code settings (Claude Code docs)', url: 'https://code.claude.com/docs/en/settings' },
    { label: 'Claude Code memory and CLAUDE.md (Claude Code docs)', url: 'https://code.claude.com/docs/en/memory' },
    { label: 'Hooks reference (Claude Code docs)', url: 'https://code.claude.com/docs/en/hooks' },
    { label: 'Monitoring Claude Code usage (Claude Code docs)', url: 'https://code.claude.com/docs/en/monitoring-usage' },
  ],
};
