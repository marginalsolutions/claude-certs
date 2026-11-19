import type { Concept } from '../../types';

export const configurationManagement: Concept = {
  id: 'configuration-management',
  title: 'Configuration Management',
  summary:
    'Managing the configuration of Claude systems: CLAUDE.md files, settings.json scopes, pinning model versions, versioning prompts, plugin dependencies and separating dev, staging and production.',
  certs: ['ccdv-f', 'ccar-f', 'ccar-p'],
  domains: ['ccdv-f-2', 'ccdv-f-3', 'ccdv-f-5', 'ccar-f-3', 'ccar-p-7'],
  tags: ['configuration', 'claude-md', 'settings', 'model-pinning', 'prompt-versioning', 'environments'],
  difficulty: 'intermediate',
  diagram: 'claude-md-hierarchy',
  sections: [
    {
      heading: 'CLAUDE.md as configuration',
      body: `In Claude Code, \`CLAUDE.md\` files are the instruction layer and they are configuration in the full sense: they live in the repo, they are reviewed in pull requests, and they change behaviour for everyone who uses them.

The hierarchy, from broadest to most specific:

- \`~/.claude/CLAUDE.md\` – personal, every project, **not** shared.
- Project root \`CLAUDE.md\` or \`.claude/CLAUDE.md\` – shared via version control; the team's standards.
- Subdirectory \`CLAUDE.md\` – loaded when Claude works in that directory; package-specific conventions.
- \`.claude/rules/*.md\` – topic files, optionally scoped with \`paths:\` globs in YAML frontmatter so they load only when matching files are touched.
- \`CLAUDE.local.md\` – personal notes for one project, git-ignored.

\`@path\` imports pull other files in, keeping CLAUDE.md modular. \`/memory\` lists what is loaded, which is the first diagnostic for "Claude behaves differently on my machine". Keep the file short and declarative: build and test commands, conventions, what not to touch. Long essays dilute attention.`,
    },
    {
      heading: 'settings.json scopes',
      body: `\`settings.json\` configures how Claude Code is allowed to behave. There are layered scopes, and a more specific scope overrides a broader one:

| File | Scope | Shared? |
|---|---|---|
| \`~/.claude/settings.json\` | User, all projects | No |
| \`.claude/settings.json\` | Project | Yes, committed |
| \`.claude/settings.local.json\` | Project, this machine | No, git-ignored |
| Managed/enterprise policy settings | Organisation | Pushed by admins; cannot be overridden |

Key sections: \`permissions\` (\`allow\`, \`ask\`, \`deny\` rules for tools such as \`Bash(npm test:*)\` or \`Edit\`), \`hooks\` (\`PreToolUse\`, \`PostToolUse\`, \`Notification\`, \`Stop\`, \`SessionStart\` commands that run deterministically), \`env\` (environment variables for the session), and defaults such as the model. Put team-wide guardrails (deny destructive commands, require tests) in the project file; put personal conveniences in local or user files. Because hooks run commands, treat changes to the project settings file as code review material.`,
    },
    {
      heading: 'Pinning model versions',
      body: `Model behaviour changes between releases: tone, tool-calling eagerness, verbosity, what parameters are accepted and how refusals work. These are "breaking behaviour changes" even when the API shape is unchanged. Pinning means your production configuration names a specific model id (\`claude-sonnet-5-5\`) rather than "whatever is newest", and you upgrade deliberately.

Why pin:

- Your evals were run against one model; a silent swap invalidates them.
- Parameter compatibility differs (\`budget_tokens\`, \`temperature\`, \`tool_choice\` all changed across generations).
- Prompt caches are per model; a swap is a cold cache.
- Cost and latency profiles differ.

How to upgrade: run the eval suite against the candidate, read the migration guide for removed parameters, canary a percentage of traffic, compare cost and quality, then flip the config. Keep the model id in configuration (environment variable or config service), never scattered through code. Note that Anthropic retires old models on a published schedule, so pinning is a pace control, not a way to stand still forever.`,
    },
    {
      heading: 'Prompt versioning and registries',
      body: `A prompt is code that happens to be English. Manage it like code:

- Store prompts in version control, in files or a dedicated module, not inline strings in handlers.
- Give each prompt a name and a version (\`support_triage@v7\`), and log that identifier with every request so outputs can be traced to the prompt that produced them.
- Tie prompt versions to eval results; a change ships when its eval passes, with a changelog entry.
- A prompt registry (a table or service holding named, versioned prompts with metadata) lets you roll back without a deploy and run A/B comparisons safely. Caching favours stable prompt text, so avoid per-deploy churn in the cached prefix.
- Version tool definitions and schemas together with the prompt; they are part of the same contract.`,
    },
    {
      heading: 'Plugin dependencies and environment separation',
      body: `**Plugins and MCP servers** are dependencies. Record which marketplace and version each plugin comes from, review the hooks and tools it adds, and update on purpose. Project-scoped \`.mcp.json\` is committed and shared; user-scoped servers in \`~/.claude.json\` are personal. Secrets for MCP servers belong in environment variables referenced by the config, not in the committed file.

**Environments.** Separate dev, staging and production configurations:

- Different API keys or workspaces per environment, so a dev loop cannot burn production quota and usage reports stay attributable.
- Different model or effort defaults are acceptable in dev for speed, but staging must mirror production (same model id, same prompt versions) or its tests prove nothing.
- Feature flags for betas and new models so rollout is gradual.
- No production data in dev prompts; use synthetic or redacted fixtures.

Everything above (CLAUDE.md, settings, model id, prompt version, plugin list) should be reproducible from the repository plus an environment-specific secrets store.`,
    },
  ],
  examples: [
    {
      title: 'A team settings.json with guardrails and a hook',
      description:
        'A project file denies destructive git and shell commands, auto-allows the test runner, and runs a formatter after every file edit. It is committed so every developer and the CI agent get the same behaviour.',
      language: 'json',
      code: `{
  "permissions": {
    "allow": ["Bash(npm test:*)", "Bash(npm run lint:*)", "Read", "Edit"],
    "deny": ["Bash(rm -rf:*)", "Bash(git push --force:*)", "Read(./.env)"]
  },
  "hooks": {
    "PostToolUse": [{
      "matcher": "Edit|Write",
      "hooks": [{ "type": "command", "command": "npx prettier --write \\"$CLAUDE_FILE_PATH\\"" }]
    }]
  },
  "env": { "NODE_ENV": "test" }
}`,
      takeaway: 'Team guardrails live in the committed project settings; personal tweaks go in settings.local.json.',
    },
    {
      title: 'Model id and prompt version from configuration',
      description:
        'A service reads the model id and prompt version from the environment and logs both on every call, so a regression can be traced and a rollback is a config change.',
      language: 'python',
      code: `MODEL = os.environ["CLAUDE_MODEL"]            # e.g. claude-sonnet-5-5, pinned per environment
PROMPT_ID = os.environ["TRIAGE_PROMPT"]        # e.g. support_triage@v7
system = registry.get(PROMPT_ID)

resp = client.messages.create(
    model=MODEL, max_tokens=1024, system=system,
    messages=[{"role": "user", "content": ticket}],
    metadata={"user_id": hashed_user},
)
log.info("model=%s prompt=%s in=%d out=%d", resp.model, PROMPT_ID,
         resp.usage.input_tokens, resp.usage.output_tokens)`,
      takeaway: 'Pin the model and name the prompt version in config; log both with every request.',
    },
    {
      title: 'Mistake: a personal rule that the team never received',
      description:
        'A lead put "always run the full test suite before committing" in ~/.claude/CLAUDE.md and was surprised when teammates\' Claude Code sessions skipped tests. User-level files are not in the repository. Moving the rule to the project CLAUDE.md, and enforcing the important part with a PreToolUse hook on git commit in .claude/settings.json, fixed it.',
      language: 'markdown',
      code: `# ~/.claude/CLAUDE.md            (personal, not shared)  <- rule was here
# ./CLAUDE.md                     (committed)             <- rule belongs here
Run \`npm test\` before every commit. Never commit with failing tests.

# .claude/settings.json hook enforces it:
"PreToolUse": [{ "matcher": "Bash(git commit:*)", "hooks": [{ "type": "command", "command": "npm test" }] }]`,
      takeaway: 'Shared behaviour belongs in committed project files; critical rules get a hook, not just prose.',
    },
    {
      title: 'Mistake: unpinned model in production',
      description:
        'A team configured "latest Sonnet" through an internal alias. When the alias moved to a new release, tool calls became more eager and a parameter they still sent started returning 400s. Evals had never run on the new model. They switched to a pinned id, added a canary stage and tied upgrades to the eval suite.',
      language: 'text',
      code: `Before: CLAUDE_MODEL=sonnet-latest   -> silent behaviour change, 400s, cold cache
After:  CLAUDE_MODEL=claude-sonnet-5-5 (pinned)
        upgrade = run evals on candidate -> read migration notes -> canary 5% -> flip`,
      takeaway: 'Pin model ids and upgrade through evals and a canary, not through an alias that moves on its own.',
    },
  ],
  keyPoints: [
    'CLAUDE.md hierarchy: user (~/.claude), project root or .claude/, subdirectory, .claude/rules with paths: scoping, CLAUDE.local.md; @imports and /memory.',
    'settings.json scopes: user, project (committed), project local (git-ignored), managed policy; more specific overrides broader. Sections: permissions, hooks, env.',
    'Team guardrails and hooks belong in the committed project settings; personal preferences in local or user files.',
    'Pin model ids in configuration; behaviour, parameters, cost and caches change across releases. Upgrade via evals, migration notes and a canary.',
    'Version prompts like code: named, versioned, in source control or a registry, logged with every request, tied to eval results.',
    'Plugins and MCP servers are dependencies: record source and version, review added hooks and tools, keep secrets out of committed config.',
    'Separate dev, staging and prod keys and configs; staging must mirror prod\'s model and prompt versions.',
  ],
  flashcards: [
    { front: 'Which CLAUDE.md file is not shared with teammates?', back: '~/.claude/CLAUDE.md (user level) and CLAUDE.local.md (git-ignored project notes).' },
    { front: 'What does paths: frontmatter in .claude/rules do?', back: 'Scopes the rule file to load only when files matching the glob patterns are being edited.' },
    { front: 'Which settings file is committed and which is git-ignored?', back: '.claude/settings.json is committed; .claude/settings.local.json is local and git-ignored.' },
    { front: 'Name three sections of settings.json.', back: 'permissions (allow/ask/deny), hooks (PreToolUse, PostToolUse, Notification, Stop, SessionStart), env.' },
    { front: 'Why pin a model version?', back: 'Behaviour, accepted parameters, cost and caches change across releases; evals are only valid for the model they ran on.' },
    { front: 'Recommended upgrade path to a new model?', back: 'Run evals on the candidate, read migration notes for removed parameters, canary a slice of traffic, then flip the pinned id.' },
    { front: 'What is a prompt registry?', back: 'A store of named, versioned prompts with metadata that lets you log, roll back and A/B prompts without redeploying.' },
    { front: 'Which command shows which memory files are loaded in Claude Code?', back: '/memory.' },
    { front: 'Where should MCP server secrets go?', back: 'Environment variables referenced from the config, never in the committed .mcp.json.' },
    { front: 'Why must staging mirror production\'s model and prompt versions?', back: 'Otherwise staging tests prove nothing about production behaviour.' },
  ],
  quiz: [
    {
      question:
        'A new engineer\'s Claude Code sessions ignore the team\'s testing conventions, which the lead wrote in ~/.claude/CLAUDE.md. What is the fix?',
      options: [
        'Ask the engineer to copy the lead\'s home directory file.',
        'Move the conventions to the project CLAUDE.md so they are versioned and shared.',
        'Add the conventions to settings.local.json.',
        'Switch the engineer to the same model.',
      ],
      correct: [1],
      explanation:
        'User-level files are personal. Project CLAUDE.md is committed and reaches everyone. settings.local.json is also personal and is for permissions, not conventions.',
    },
    {
      question: 'After an internal "latest" alias moved to a new model release, a production service began returning 400s for a parameter it had always sent and its behaviour changed. Which practice would have prevented this?',
      options: [
        'Raising max_retries.',
        'Pinning a specific model id in configuration and upgrading through evals and a canary.',
        'Caching the prompt more aggressively.',
        'Using the Batches API.',
      ],
      correct: [1],
      explanation:
        'Pinning makes upgrades deliberate. Retries do not fix a 400, caching does not prevent behaviour changes, and batches are unrelated.',
    },
    {
      question: 'Which TWO belong in the committed .claude/settings.json rather than a personal file? (Select two)',
      options: [
        'A deny rule for rm -rf and force pushes.',
        'The developer\'s preferred editor theme.',
        'A PreToolUse hook that runs the test suite before git commit.',
        'A personal API key.',
      ],
      correct: [0, 2],
      explanation:
        'Guardrails and enforcing hooks are team-wide and should be shared. Personal preferences stay local, and secrets never belong in committed files.',
    },
    {
      question: 'A team wants to know which prompt produced a bad output seen in logs three weeks ago. What practice makes this possible?',
      options: [
        'Keeping prompts as inline strings in handlers.',
        'Naming and versioning prompts and logging the identifier with every request.',
        'Storing only the final assistant text.',
        'Re-running the request today with the current prompt.',
      ],
      correct: [1],
      explanation:
        'A logged prompt identifier ties outputs to the exact prompt version. Inline strings and text-only logs lose the link, and re-running with today\'s prompt tells you nothing about the old one.',
    },
    {
      question: 'A test file convention must apply to *.test.ts files spread across many directories. Which configuration mechanism fits best?',
      options: [
        'A CLAUDE.md in every directory that has tests.',
        'A .claude/rules file with paths: ["**/*.test.ts"] frontmatter.',
        'A settings.json permission rule.',
        'A plugin.',
      ],
      correct: [1],
      explanation:
        'Path-scoped rules load for matching files wherever they live, avoiding duplicated CLAUDE.md files. Permissions do not carry conventions, and a plugin is heavier than needed.',
    },
  ],
  statements: [
    { text: 'Settings in .claude/settings.local.json are committed and shared with the team.', isTrue: false, explanation: 'The local file is git-ignored and personal; .claude/settings.json is the shared one.' },
    { text: 'Hooks in settings.json run deterministically regardless of what the model decides.', isTrue: true, explanation: 'That is why they are suitable for enforcing guardrails that prose cannot guarantee.' },
    { text: 'Because the API shape is stable, upgrading model versions never changes application behaviour.', isTrue: false, explanation: 'Behaviour, accepted parameters, cost and caching change between releases; pin and test.' },
    { text: 'Prompt versions should be logged with each request.', isTrue: true, explanation: 'It lets you trace an output to the prompt that produced it and roll back safely.' },
    { text: 'Using a cheaper model in staging than in production is fine as long as the prompts match.', isTrue: false, explanation: 'Staging must mirror production\'s model id, otherwise its results do not predict production.' },
    { text: 'Managed enterprise policy settings can be overridden by a project settings.json.', isTrue: false, explanation: 'Managed policy settings take precedence and cannot be overridden locally.' },
    { text: '@imports let a CLAUDE.md pull in other files to stay modular.', isTrue: true, explanation: 'Useful for package-specific standards files.' },
  ],
  resources: [
    { label: 'Claude Code settings', url: 'https://code.claude.com/docs/en/settings' },
    { label: 'Claude Code memory (CLAUDE.md)', url: 'https://code.claude.com/docs/en/memory' },
    { label: 'Hooks reference', url: 'https://code.claude.com/docs/en/hooks' },
    { label: 'Model deprecations', url: 'https://platform.claude.com/docs/en/about-claude/model-deprecations' },
  ],
};
