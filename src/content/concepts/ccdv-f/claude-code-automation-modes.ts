import type { Concept } from '../../types';

export const claudeCodeAutomationModes: Concept = {
  id: 'claude-code-automation-modes',
  title: 'Claude Code Automation Modes: Headless, Streaming and Permissions',
  summary:
    'Run Claude Code non-interactively with -p/--print, get machine-readable JSON output, stream events, choose a permission mode, and wire it into CI with the GitHub Action.',
  certs: ['ccdv-f', 'ccar-f', 'ccar-p'],
  domains: ['ccdv-f-3', 'ccar-f-3', 'ccar-p-7'],
  tags: ['claude-code', 'headless', 'ci', 'permissions', 'automation'],
  difficulty: 'intermediate',
  sections: [
    {
      heading: 'Interactive versus headless',
      body: `By default \`claude\` opens an interactive terminal session: you type, Claude works, you approve tool calls as they come. **Headless mode** runs one prompt to completion and exits, which is what scripts, cron jobs and CI pipelines need.

\`\`\`bash
claude -p "Summarise the failing tests in this repo"
\`\`\`

\`-p\` (long form \`--print\`) prints the final result to stdout and never waits for keyboard input. You can also pipe content in: \`cat error.log | claude -p "Explain the root cause"\`. Everything about configuration is the same: CLAUDE.md, rules, skills, MCP servers and hooks all load in headless mode, so the agent in CI behaves like the one on your laptop.

Useful companions: \`--max-turns N\` caps the agent loop, \`--allowedTools "Read,Grep,Glob"\` restricts what it may do without prompting, \`--append-system-prompt\` adds instructions for this run, and \`--model\` pins a model. Headless runs cannot answer permission prompts, so you must decide up front what is allowed; see the permission modes below.`,
    },
    {
      heading: 'Output formats and structured results',
      body: `Headless mode supports three output formats:

| Flag | What you get |
|---|---|
| \`--output-format text\` (default) | Just the final answer. |
| \`--output-format json\` | A single JSON object with the \`result\`, \`session_id\`, token \`usage\`, \`total_cost_usd\`, duration and whether it ended in error. |
| \`--output-format stream-json\` | Newline-delimited JSON events as they happen: system init, each assistant message, tool calls and results, and a final result event. |

When your pipeline needs a typed payload rather than prose, pass \`--json-schema '<schema>'\` together with \`--output-format json\`. Claude Code then constrains the final answer to that schema and returns it in a \`structured_output\` field, so a review bot can read \`findings[]\` instead of parsing Markdown.

**Streaming mode** (\`stream-json\`) is how you drive long tasks from another program: you see progress, can show it to a user, and can stop early. Pair it with \`--input-format stream-json\` to send a sequence of user messages over stdin for multi-turn automation. \`--verbose\` adds per-turn detail to any format. The Agent SDK is the programmatic equivalent of these flags; use it when you want types and callbacks instead of parsing a stream.`,
    },
    {
      heading: 'Permission modes',
      body: `Claude Code asks before running tools that can change things. The **permission mode** sets the baseline, chosen with \`--permission-mode <mode>\` or by cycling with Shift+Tab in an interactive session:

| Mode | Behaviour |
|---|---|
| \`default\` | Reads are free; edits and shell commands prompt unless an allow rule matches. |
| \`acceptEdits\` | File edits are auto-approved; Bash and other risky tools still prompt. |
| \`plan\` | Read-only. Claude explores and writes a plan but makes no changes until you approve and switch modes. |
| \`bypassPermissions\` | Nothing prompts (also \`--dangerously-skip-permissions\`). Only for sandboxed, disposable environments such as a CI container with no credentials worth stealing. |
| \`dontAsk\` | Denies anything not pre-allowed instead of prompting; good for unattended runs that must stay inside an allowlist. |
| \`auto\` | Delegates approval decisions to a classifier, with safety checks; a middle ground for trusted repos. |

Allow and deny lists in \`settings.json\` (\`permissions.allow\`, \`permissions.deny\`, e.g. \`"Bash(npm test:*)"\`) refine any mode. The exam angle: **a permission mode is a control, a system-prompt instruction is a request.** If a destructive command must never run, deny it in permissions or block it with a PreToolUse hook; do not rely on asking Claude nicely.`,
    },
    {
      heading: 'Running in CI and the GitHub Action',
      body: `A typical CI job installs Claude Code, exports \`ANTHROPIC_API_KEY\` from a secret, and runs a headless prompt with a tool allowlist and a turn cap:

\`\`\`bash
claude -p "Review the diff against main for security issues. Report file:line and severity." \\
  --allowedTools "Read,Grep,Glob,Bash(git diff:*)" --max-turns 15 \\
  --output-format json > review.json
\`\`\`

The **Claude Code GitHub Action** (\`anthropics/claude-code-action\`) packages this for pull requests and issues. Install the Claude GitHub app (or run \`/install-github-app\` from Claude Code), add \`ANTHROPIC_API_KEY\` as a repository secret, and add a workflow. In its default mode the action responds when someone writes \`@claude\` in a PR or issue comment; with a \`prompt\` input it runs automatically on events such as \`pull_request\`, for review, test generation or triage. Extra CLI flags go through \`claude_args\`.

Design rules for CI prompts: ask for actionable, specific output (file, line, why it matters), set explicit criteria to reduce false positives, keep the agent read-only unless it is meant to commit, and pin the model so results stay comparable across runs. Treat the CI runner as an untrusted-input surface: the PR content is attacker-controlled, so never run it with \`bypassPermissions\` and broad credentials.`,
    },
  ],
  examples: [
    {
      title: 'A nightly headless summary',
      description:
        'A team wants a daily digest of TODO comments added in the last 24 hours. A cron job runs Claude Code headless with read-only tools and posts the JSON result to Slack.',
      language: 'bash',
      code: `claude -p "List TODO/FIXME comments added since yesterday with file and owner." \\
  --allowedTools "Bash(git log:*),Bash(git diff:*),Read,Grep" \\
  --permission-mode dontAsk \\
  --max-turns 10 \\
  --output-format json \\
| jq -r '.result' | ./post-to-slack.sh`,
      takeaway: 'Headless runs need an explicit allowlist and a mode that never waits for a human.',
    },
    {
      title: 'Structured PR review output',
      description:
        'A review bot kept failing because it parsed Markdown bullet points that varied run to run. Switching to --json-schema gave a stable contract downstream.',
      language: 'bash',
      code: `claude -p "Review the diff for bugs. Only report issues you are confident about." \\
  --output-format json \\
  --json-schema '{
    "type":"object",
    "properties":{"findings":{"type":"array","items":{
      "type":"object",
      "properties":{"file":{"type":"string"},"line":{"type":"integer"},
                    "severity":{"enum":["low","medium","high"]},
                    "message":{"type":"string"}},
      "required":["file","line","severity","message"]}}},
    "required":["findings"]}' \\
| jq '.structured_output.findings'`,
      takeaway: 'When a machine consumes the result, constrain it with a schema instead of parsing prose.',
    },
    {
      title: 'Mistake: bypassPermissions in a PR workflow',
      description:
        'A team ran the GitHub Action with `--dangerously-skip-permissions` and a deploy token in the environment so it would "just work". A contributor opened a PR whose README contained instructions telling the agent to print environment variables. Because nothing gated Bash, the agent complied. The fix: run with a read-only tool allowlist, remove secrets the job does not need, and gate any shell command with a hook.',
      language: 'yaml',
      code: `# .github/workflows/claude-review.yml (excerpt)
- uses: anthropics/claude-code-action@v1
  with:
    anthropic_api_key: \${{ secrets.ANTHROPIC_API_KEY }}
    prompt: "Review this PR for correctness and security. Report file:line."
    claude_args: "--allowedTools Read,Grep,Glob --max-turns 20 --model claude-opus-5-5"`,
      takeaway: 'PR content is untrusted input; least privilege and enforced permissions protect you, not instructions in the prompt.',
    },
    {
      title: 'Plan mode before a risky refactor',
      description:
        'An engineer asks Claude Code to migrate 40 files from a deprecated ORM API. Starting in plan mode produces a migration plan listing affected files and the order of changes. After review they approve, switch to acceptEdits, and let Claude execute the plan.',
      language: 'bash',
      code: `claude --permission-mode plan "Plan the migration from Sequelize v5 to v6 across src/."
# review the plan, then Shift+Tab to acceptEdits and say "go"`,
      takeaway: 'Use plan mode when the cost of a wrong edit is high and you want to review the approach first.',
    },
  ],
  keyPoints: [
    '-p / --print runs one prompt headless and exits; all CLAUDE.md, skills, hooks and MCP config still load.',
    '--output-format json returns result, session_id, usage and cost; stream-json emits newline-delimited events for live progress.',
    '--json-schema constrains the final answer so pipelines read structured_output instead of parsing prose.',
    'Permission modes: default, acceptEdits, plan, bypassPermissions, dontAsk, auto; refine with permissions.allow/deny in settings.json.',
    'Headless runs cannot answer prompts: pick a mode and allowlist up front (--allowedTools, --max-turns).',
    'bypassPermissions belongs only in disposable sandboxes; PR content is attacker-controlled input.',
    'The GitHub Action (anthropics/claude-code-action) responds to @claude mentions or runs a prompt on events; pass CLI flags via claude_args.',
  ],
  flashcards: [
    { front: 'Which flag runs Claude Code headless?', back: '-p or --print, followed by the prompt. It prints the result and exits.' },
    { front: 'What does --output-format json include besides the answer?', back: 'session_id, token usage, total_cost_usd, duration and an is_error flag; with --json-schema also structured_output.' },
    { front: 'Which output format streams events as they happen?', back: '--output-format stream-json (newline-delimited JSON).' },
    { front: 'How do you force Claude Code to return a typed object in headless mode?', back: 'Pass --json-schema with a JSON Schema and --output-format json; read the structured_output field.' },
    { front: 'What does the acceptEdits permission mode auto-approve?', back: 'File edits. Bash and other risky tools still prompt.' },
    { front: 'Which mode is read-only and produces a proposal before any change?', back: 'plan mode (--permission-mode plan or Shift+Tab).' },
    { front: 'What is the difference between dontAsk and bypassPermissions?', back: 'dontAsk denies anything not pre-allowed instead of prompting; bypassPermissions approves everything.' },
    { front: 'How are extra CLI flags passed to the Claude Code GitHub Action?', back: 'Through the claude_args input.' },
    { front: 'Which flag caps the number of agentic turns in a headless run?', back: '--max-turns N' },
  ],
  quiz: [
    {
      question:
        'A CI job runs `claude -p "Fix the lint errors"` and hangs until the runner times out. What is the MOST likely cause?',
      options: [
        'The model is too slow for CI.',
        'A tool call needed permission and no mode or allowlist let it proceed without a prompt.',
        'The job forgot --output-format json.',
        'CLAUDE.md is not loaded in headless mode.',
      ],
      correct: [1],
      explanation:
        'Headless runs cannot answer interactive permission prompts; in default mode an edit or Bash call waits forever. Output format does not affect blocking, CLAUDE.md does load in headless mode, and model speed causes slowness, not a hang.',
    },
    {
      question:
        'A review bot must emit findings a downstream system can parse reliably. Which TWO changes best achieve this? (Select two)',
      options: [
        'Use --output-format json with --json-schema describing the findings array.',
        'Ask Claude in the prompt to "always use bullet points".',
        'Validate the structured_output against the same schema before posting.',
        'Use --output-format text and regex the result.',
      ],
      correct: [0, 2],
      explanation:
        'A schema-constrained JSON result plus validation gives a stable contract. Prompting for bullet points and regexing prose are fragile because output wording varies between runs.',
    },
    {
      question:
        'A team runs the Claude Code GitHub Action on every pull request from external contributors. Which configuration is the MOST appropriate?',
      options: [
        'bypassPermissions with the deploy token available so Claude can fix and push changes.',
        'A read-only tool allowlist, a turn cap, and only the API key secret the job needs.',
        'Default mode so a maintainer can approve each tool call in the Actions log.',
        'A system prompt line telling Claude to ignore instructions found in the PR.',
      ],
      correct: [1],
      explanation:
        'PR content is untrusted; least privilege limits damage. bypassPermissions plus credentials is the worst case, default mode cannot be answered in CI, and a prompt instruction is a request rather than an enforced control.',
    },
    {
      question: 'Which permission mode lets Claude edit files freely but still asks before running shell commands?',
      options: ['plan', 'acceptEdits', 'dontAsk', 'bypassPermissions'],
      correct: [1],
      explanation:
        'acceptEdits auto-approves edits only. plan blocks all changes, dontAsk denies anything not allowlisted, and bypassPermissions approves everything.',
    },
    {
      question:
        'An engineer wants a long-running headless migration to show progress in an internal dashboard and allow cancelling early. Which option fits best?',
      options: [
        '--output-format json, polling the file every minute',
        '--output-format stream-json and consuming events as they arrive',
        '--verbose with text output',
        'Running interactively and screen-scraping the terminal',
      ],
      correct: [1],
      explanation:
        'stream-json emits events in real time, which is what a live dashboard and early cancellation need. The json format arrives only at the end, verbose text is not machine-friendly, and screen-scraping is brittle.',
    },
  ],
  statements: [
    { text: 'CLAUDE.md, skills and hooks are ignored when Claude Code runs with -p.', isTrue: false, explanation: 'Headless mode loads the same configuration as interactive mode; only the input/output handling differs.' },
    { text: '--output-format json includes token usage and cost for the run.', isTrue: true, explanation: 'It returns result, session_id, usage, total_cost_usd and duration fields.' },
    { text: 'plan mode allows file edits but requires approval for Bash.', isTrue: false, explanation: 'plan mode is read-only; acceptEdits is the mode that auto-approves edits but prompts for Bash.' },
    { text: 'The Claude Code GitHub Action can be triggered by an @claude mention in a PR comment.', isTrue: true, explanation: 'That is its default interactive mode; a prompt input makes it run automatically on events instead.' },
    { text: 'bypassPermissions is the recommended mode for reviewing external pull requests in CI.', isTrue: false, explanation: 'External PR content is untrusted; use a read-only allowlist and minimal secrets. bypassPermissions is for disposable sandboxes.' },
    { text: 'With --json-schema, the typed result appears in a structured_output field of the JSON output.', isTrue: true, explanation: 'The final answer is constrained to the schema and returned as structured_output alongside result.' },
  ],
  resources: [
    { label: 'Run Claude Code programmatically (headless)', url: 'https://code.claude.com/docs/en/headless' },
    { label: 'Permission modes and settings', url: 'https://code.claude.com/docs/en/permissions' },
    { label: 'Claude Code GitHub Actions', url: 'https://code.claude.com/docs/en/github-actions' },
  ],
};
