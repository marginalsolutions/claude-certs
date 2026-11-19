import type { Concept } from '../../types';

export const aiAssistedDeveloperWorkflows: Concept = {
  id: 'ai-assisted-developer-workflows',
  title: 'AI-Assisted Developer Workflows',
  summary:
    'Apply Claude Code where it pays: code review, test generation, codebase exploration, migrations with plan mode, headless CI jobs and operational debugging, while keeping humans accountable and avoiding automation that outruns review capacity.',
  certs: ['ccar-p', 'ccar-f', 'ccdv-f'],
  domains: ['ccar-p-7', 'ccar-f-3', 'ccdv-f-3'],
  tags: ['claude-code', 'developer-workflows', 'code-review', 'testing', 'plan-mode', 'ci', 'debugging'],
  difficulty: 'advanced',
  diagram: 'hooks-lifecycle',
  sections: [
    {
      heading: 'Where AI assistance pays off',
      body: `Not every developer task benefits equally. The highest-return workflows share three traits: the task is well specified or verifiable, the codebase provides the context, and a human reviews the result before it matters.

| Workflow | Why it works | Guardrail |
|---|---|---|
| **Codebase exploration** | Claude Code reads, greps and summarizes faster than a human can navigate; the Explore subagent keeps the main context clean | Verify claims against the code before acting on them |
| **Code review** | A consistent first pass for bugs, missing tests, security smells and convention violations | Human reviewer owns the merge decision; AI comments are input, not approval |
| **Test generation** | Tests are verifiable: they run or they do not; coverage gaps are mechanical to find | Review for meaningful assertions; reject tests that only mirror the implementation |
| **Migrations and refactors** | Repetitive, pattern-based changes across many files | Plan mode first; run tests after each batch; small PRs |
| **Documentation and onboarding** | Explaining existing code is low risk and high value | Keep generated docs versioned with code |
| **Operational debugging** | Correlating logs, traces and code to form hypotheses | Read-only access to production; humans execute changes |

Lower-return or risky: generating large novel systems from a vague prompt, unattended changes to production infrastructure, and anything where nobody can review the output competently.`,
    },
    {
      heading: 'Plan mode, subagents and migrations',
      body: `For any change touching more than a few files, start in **plan mode**: Claude Code explores and proposes a plan without editing anything, the developer reviews and adjusts it, then execution begins. This catches wrong assumptions before they become a 40-file diff. Plan mode is also the right default for unfamiliar codebases and for anything irreversible.

A migration workflow that works at scale:

1. Write the migration rule and acceptance criteria into the repository (a command or a skill) so every run is consistent.
2. Use plan mode to inventory affected files and group them into batches.
3. Execute one batch, run the tests (a \`Stop\` hook can enforce this), review the diff, commit.
4. Repeat; keep PRs small enough to review in minutes.
5. Record decisions and exceptions in CLAUDE.md or an ADR so the next batch (or the next engineer) follows the same rules.

**Subagents** (the Explore subagent, custom agents defined in \`.claude/agents/\`, or skills with \`context: fork\`) keep exploration and noisy work out of the main context, which preserves quality on long tasks. Use \`/compact\` when a long session accumulates stale context, and \`--resume\` to pick up a prior session rather than re-explaining.`,
    },
    {
      heading: 'Headless mode and CI integration',
      body: `Claude Code runs non-interactively with \`claude -p "<prompt>"\` (\`--print\`), which makes it a build step. Common CI uses: a first-pass PR review comment, release-note drafting from commits, flaky-test triage, dependency-upgrade summaries, and documentation checks. Rules for doing it safely:

- \`--output-format json\` (and \`--json-schema\` for a fixed shape) so downstream steps parse structured results instead of prose.
- \`--allowedTools\` set explicitly and minimally; CI jobs should usually be read-only (no Write or Bash beyond the test command).
- Least-privilege credentials, a sandboxed runner, and no production secrets in the job.
- Treat the output as **input to humans or to a gated step**, not as an authority. A CI review comment informs the reviewer; it does not approve the merge.
- Budget: cap tokens and turns per job; track cost per pipeline run.
- Determinism: results vary between runs, so do not make a build *fail* on a judgment call unless the check is mechanical (schema valid, test passes).

The Claude Agent SDK is the programmatic form of the same capability for teams that need custom automation beyond the CLI.`,
    },
    {
      heading: 'Avoiding over-automation and supporting operations',
      body: `The failure mode of AI-assisted development is not that the model writes bad code; it is that the organization stops reading it. Signs: PRs growing faster than review capacity, rubber-stamp approvals, test suites full of assertions that mirror implementation, rising change failure rate, developers who cannot explain code they merged. Countermeasures:

- Keep AI-generated changes in the same review, test and CI gates as human changes. Smaller PRs, not fewer reviews.
- Require the author to understand and describe the change; the AI drafted it, the human owns it.
- Watch change failure rate and incident count alongside velocity. If failures rise, slow down.
- Do not automate decisions that need accountability (production deploys, security exceptions, data deletions) without a human approval step.

For **operational debugging**, Claude Code is a strong assistant when given read access to logs, traces, dashboards (often via MCP servers) and the code: it can correlate an alert with recent commits, find the code path behind a stack trace, propose hypotheses and draft a fix. Keep production access read-only and keep the remediation in human hands; a runbook entry that says "use Claude Code with the observability MCP server to triage" is reasonable, one that lets it restart services unattended is not. Capture the diagnosis as an eval case or a test so the same incident does not recur.

Exam angle: scenarios reward plan mode for large changes, headless mode with structured output and minimal tools for CI, human ownership of merges and deploys, and read-only AI access in production debugging. "Let the agent merge if tests pass" and "give the agent production credentials to fix incidents faster" are distractors.`,
    },
  ],
  examples: [
    {
      title: 'Headless PR review in CI',
      description:
        'A CI step runs Claude Code non-interactively on the diff with read-only tools and a fixed output schema. The result is posted as a comment for the human reviewer; it never approves or merges.',
      language: 'bash',
      code: `# .github/workflows/ai-review.yml (step)
git diff origin/main...HEAD > /tmp/pr.diff
claude -p "Review the diff in /tmp/pr.diff against CLAUDE.md conventions. \\
  Report likely bugs, missing tests and security concerns with file:line references." \\
  --allowedTools "Read,Grep,Glob" \\
  --output-format json \\
  --json-schema '{"type":"object","properties":{"findings":{"type":"array","items":{
      "type":"object","properties":{"severity":{"enum":["high","medium","low"]},
      "location":{"type":"string"},"issue":{"type":"string"},"suggestion":{"type":"string"}},
      "required":["severity","location","issue"]}}},"required":["findings"]}' \\
  > /tmp/review.json
node scripts/post-review-comment.js /tmp/review.json   # informs the reviewer; does not approve`,
      takeaway: 'Headless mode with minimal tools and structured output turns Claude Code into a safe, parseable CI step.',
    },
    {
      title: 'The migration that skipped plan mode',
      description:
        'An engineer asked Claude Code to "migrate all API handlers to the new auth middleware" and accepted a 63-file diff. Two handlers had custom auth that the new middleware did not support; the change broke a partner integration. The team\'s updated workflow: plan mode to inventory handlers and flag exceptions, batches of ten with tests between, and a .claude/commands/migrate-auth.md command encoding the rules and known exceptions.',
      takeaway: 'Plan first, batch small, test between batches, and encode the rules so every run follows them.',
    },
    {
      title: 'Operational triage with read-only access',
      description:
        'During an incident, an on-call engineer used Claude Code with a read-only observability MCP server and the repository. It correlated a spike in 500s with a commit from the previous evening, located the unchecked null in the new code path, and drafted a fix and a regression test. The engineer reviewed, ran the tests, and deployed through the normal pipeline. The runbook now lists this triage flow.',
      takeaway: 'AI accelerates diagnosis; humans execute remediation through the normal change process.',
    },
    {
      title: 'Test generation that looked good and tested nothing',
      description:
        'A team generated 400 unit tests in a week and coverage rose to 92%. Review found most asserted the current output of the function under test rather than its intended behaviour, so refactors passed and real bugs did too. The fix was a CLAUDE.md rule ("derive assertions from the specification or docstring, not from running the code; include at least one negative case") and a reviewer checklist item.',
      takeaway: 'Coverage is not quality; review generated tests for meaningful assertions.',
    },
  ],
  keyPoints: [
    'Highest-return workflows: codebase exploration, first-pass code review, test generation, pattern-based migrations, documentation and operational triage, each with a human gate.',
    'Use plan mode for multi-file or irreversible changes; batch migrations with tests between batches; encode rules in commands or skills.',
    'Subagents (Explore, custom agents, context: fork skills) keep noisy work out of the main context; /compact and --resume manage long sessions.',
    'Headless mode (claude -p) with --output-format json, --json-schema and minimal --allowedTools makes Claude Code a safe CI step whose output informs humans or gated steps.',
    'AI-generated changes go through the same review, tests and CI; the human author owns the change.',
    'Watch change failure rate and review capacity; over-automation shows up as rubber-stamping and tests that mirror implementation.',
    'In production debugging, give AI read-only access to logs, traces and code; humans execute remediation through the normal pipeline.',
    'Never let an agent merge or deploy unattended on "tests pass", and never hand it production credentials to speed up incidents.',
  ],
  flashcards: [
    { front: 'When should plan mode be used?', back: 'For changes touching more than a few files, unfamiliar codebases and anything irreversible: explore and plan before editing.' },
    { front: 'How do you run Claude Code non-interactively?', back: 'claude -p "<prompt>" (--print), optionally with --output-format json and --json-schema.' },
    { front: 'Which flag limits tools in a headless run?', back: '--allowedTools with an explicit minimal list, e.g. Read, Grep, Glob for a review job.' },
    { front: 'What should a CI AI review comment be allowed to do?', back: 'Inform the human reviewer; it must not approve or merge.' },
    { front: 'Why batch a large migration?', back: 'Small diffs can be reviewed and tested between batches; exceptions are caught early.' },
    { front: 'What keeps exploration output from polluting the main context?', back: 'Subagents: the Explore subagent, custom agents, or skills with context: fork.' },
    { front: 'Three signs of over-automation?', back: 'PRs outpacing review capacity, rubber-stamp approvals, tests that mirror implementation; plus rising change failure rate.' },
    { front: 'What access should AI have during production incident triage?', back: 'Read-only access to logs, traces, dashboards and code; remediation stays with humans through the normal pipeline.' },
    { front: 'Why not fail a build on an AI judgment call?', back: 'Results vary between runs; fail builds only on mechanical checks (schema valid, tests pass).' },
    { front: 'Where should migration rules and exceptions be recorded?', back: 'In a project command or skill and in CLAUDE.md or an ADR so every run and engineer follows them.' },
  ],
  quiz: [
    {
      question:
        'A team wants Claude Code to review every pull request in CI. Which configuration is MOST appropriate?',
      options: [
        'Run claude -p with full tool access and let it merge when it finds no issues.',
        'Run claude -p with read-only allowed tools and a JSON schema, post the findings as a comment, and leave approval to the human reviewer.',
        'Give the job production credentials so it can verify behaviour.',
        'Have Claude Code rewrite the PR to fix issues automatically before review.',
      ],
      correct: [1],
      explanation:
        'Minimal tools, structured output and human ownership of the merge are the safe pattern. Auto-merge, production credentials and unattended rewrites remove human accountability and widen the blast radius.',
    },
    {
      question:
        'An engineer must migrate 60 service handlers to a new middleware. Which approach BEST reduces risk?',
      options: [
        'Ask Claude Code to migrate everything in one pass and accept the diff if tests pass.',
        'Use plan mode to inventory handlers and exceptions, migrate in small batches with tests between, and encode the rules in a project command.',
        'Migrate manually to avoid AI risk entirely.',
        'Disable tests during migration to speed up iteration.',
      ],
      correct: [1],
      explanation:
        'Plan mode, batching and encoded rules catch exceptions early and keep diffs reviewable. One giant pass hides exceptions, manual migration wastes the tool\'s strength, and disabling tests removes the safety net.',
    },
    {
      question: 'Which TWO indicate that AI-assisted development has become over-automated? (Select two)',
      options: [
        'Change failure rate is rising while PR throughput climbs.',
        'Reviewers approve large AI-generated PRs within a minute.',
        'Developers use plan mode for large refactors.',
        'Generated tests include negative cases derived from specifications.',
      ],
      correct: [0, 1],
      explanation:
        'Rising failure rate and rubber-stamp reviews are the warning signs. Plan mode and specification-derived tests are healthy practices.',
    },
    {
      question:
        'During a production incident, an on-call engineer wants to use Claude Code to find the cause quickly. Which setup is MOST appropriate?',
      options: [
        'Give Claude Code production shell access so it can fix the issue directly.',
        'Give it read-only access to logs, traces and the repository (for example via an observability MCP server), let it correlate and propose a fix, and have the engineer apply the fix through the normal pipeline.',
        'Do not use AI during incidents.',
        'Let it restart services automatically when it detects errors.',
      ],
      correct: [1],
      explanation:
        'Read-only triage accelerates diagnosis while humans keep accountability for changes. Production shell access and automatic restarts remove the human gate; banning AI forgoes the benefit.',
    },
    {
      question:
        'Generated unit tests raised coverage to 92%, yet real bugs still reach production. What is the MOST likely problem?',
      options: [
        'Coverage must reach 100%.',
        'The tests assert the implementation\'s current output rather than specified behaviour; review for meaningful assertions and require spec-derived negative cases.',
        'The tests run too fast.',
        'The model is too small.',
      ],
      correct: [1],
      explanation:
        'Tests that mirror implementation pass regardless of correctness. Coverage percentage, speed and model size do not address assertion quality.',
    },
    {
      question:
        'A CI job uses Claude Code to judge whether release notes "read well" and fails the build when it says no. Builds fail intermittently on identical inputs. What should change?',
      options: [
        'Raise the model\'s effort.',
        'Only fail builds on mechanical checks; make subjective judgments advisory output for humans, since model output varies between runs.',
        'Run the job three times and take the majority.',
        'Remove release notes from the pipeline.',
      ],
      correct: [1],
      explanation:
        'Non-deterministic judgments should not gate builds. Effort does not remove variance, majority voting triples cost for a check that should be advisory, and removing the feature is unnecessary.',
    },
  ],
  statements: [
    { text: 'Plan mode lets Claude Code explore and propose changes without editing files.', isTrue: true, explanation: 'It is the right default for multi-file or irreversible changes.' },
    { text: 'In CI, an AI review that finds no issues is a sufficient basis for automatic merge.', isTrue: false, explanation: 'AI review informs the human reviewer; the merge decision stays with a person.' },
    { text: 'claude -p with --output-format json produces parseable output for downstream pipeline steps.', isTrue: true, explanation: 'Add --json-schema for a fixed shape.' },
    { text: 'Giving Claude Code production credentials during incidents is recommended to shorten recovery time.', isTrue: false, explanation: 'Keep AI access read-only during triage; humans execute remediation through the normal pipeline.' },
    { text: 'High test coverage from generated tests guarantees the tests are meaningful.', isTrue: false, explanation: 'Generated tests can mirror implementation; review assertions and require spec-derived negative cases.' },
    { text: 'Subagents and context: fork skills help keep the main conversation context focused during long tasks.', isTrue: true, explanation: 'Noisy exploration happens in an isolated context.' },
    { text: 'Change failure rate should be monitored alongside velocity after adopting AI-assisted workflows.', isTrue: true, explanation: 'Velocity that raises failure rate is not productivity.' },
  ],
  resources: [
    { label: 'Common workflows (Claude Code docs)', url: 'https://code.claude.com/docs/en/common-workflows' },
    { label: 'Run Claude Code programmatically / headless (Claude Code docs)', url: 'https://code.claude.com/docs/en/headless' },
    { label: 'Claude Code GitHub Actions (Claude Code docs)', url: 'https://code.claude.com/docs/en/github-actions' },
    { label: 'Subagents (Claude Code docs)', url: 'https://code.claude.com/docs/en/sub-agents' },
  ],
};
