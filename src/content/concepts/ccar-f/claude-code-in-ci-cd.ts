import type { Concept } from '../../types';

export const claudeCodeInCiCd: Concept = {
  id: 'claude-code-in-ci-cd',
  title: 'Claude Code in CI/CD Pipelines',
  summary:
    'Run Claude Code headlessly with -p, get machine-readable findings with --output-format json and --json-schema, feed it project context through CLAUDE.md, and design review and test-generation jobs that avoid duplicates and self-review blind spots.',
  certs: ['ccar-f', 'ccdv-f', 'ccar-p'],
  domains: ['ccar-f-3', 'ccar-f-4', 'ccdv-f-3', 'ccar-p-7', 'ccar-p-4'],
  tags: ['claude-code', 'ci-cd', 'code-review', 'headless', 'test-generation'],
  difficulty: 'intermediate',
  sections: [
    {
      heading: 'Headless mode: -p and structured output',
      body: `Interactive Claude Code waits for a human. In a pipeline there is no human, so an interactive invocation hangs until the job times out. The \`-p\` (or \`--print\`) flag runs Claude Code **non-interactively**: it takes the prompt, does the work, prints the result and exits.

\`\`\`bash
claude -p "Review the diff in this PR against .claude/rules/review.md" \\
  --output-format json \\
  --json-schema "$(cat ci/review-schema.json)" > findings.json
\`\`\`

Two flags make the output usable by the rest of the pipeline:

- \`--output-format json\` returns a JSON envelope instead of free text, so a script can parse it.
- \`--json-schema\` constrains the result to a schema you supply. Findings arrive as an array of objects with the fields you defined (file, line, severity, message, suggested fix), which a small script can post as inline PR comments without parsing prose.

Without these, you end up writing regular expressions over Markdown, and every change in phrasing breaks the pipeline. Other flags you will meet: \`--allowedTools\` to limit what the job may do, and \`--max-turns\` to bound runaway agent loops.`,
    },
    {
      heading: 'CLAUDE.md as the pipeline\'s project context',
      body: `A CI job starts cold. It knows nothing about your testing standards, your fixture library or what your team considers a review-worthy issue unless you tell it. The mechanism is the same one developers use locally: **CLAUDE.md and rules files in the repository**. Because the CI runner checks out the repository, Claude Code loads them automatically.

For review jobs, document the review criteria: which categories to report (bugs, security, data loss) and which to skip (style, local patterns a linter already covers). For test-generation jobs, document:

- Testing standards: framework, naming, one behaviour per test, no snapshot tests.
- What makes a test valuable: edge cases, error paths, boundary conditions, not re-testing the framework.
- Available fixtures and factories, with their names and locations, so generated tests reuse them instead of inventing setup code.

Teams that skip this get plausible-looking tests that duplicate existing coverage, build their own fixtures and assert on implementation details. The quality of generated tests tracks the quality of the standards written down for them.`,
    },
    {
      heading: 'Independent review and incremental re-runs',
      body: `**Do not have the generator review its own work.** A session that just wrote code carries the reasoning that produced it, including its assumptions. Asked to review, it tends to confirm those assumptions rather than challenge them. A **separate review instance** that sees only the diff, the criteria and the relevant files has no such anchoring and catches more. In CI this is natural: the review job is a fresh \`claude -p\` invocation, not a continuation of whatever generated the change.

**Avoid duplicate comments on re-runs.** PRs get new commits; the review re-runs. If each run reports everything from scratch, the PR fills with repeated comments and developers stop reading them. Include the **prior findings** in the prompt (fetched from the earlier run's output or from existing PR comments) and instruct Claude to report only issues that are *new* or *still unaddressed*. Resolved findings should be omitted or explicitly marked resolved.

**Avoid duplicate tests.** Test-generation jobs should receive the **existing test files** for the code under test so they do not propose scenarios already covered. Without them, the most likely output is the same happy-path tests the suite already has.`,
    },
    {
      heading: 'Putting the job together',
      body: `A typical review pipeline step:

1. Check out the repository (CLAUDE.md and rules load automatically).
2. Collect the diff and, if re-running, the previous findings.
3. Run \`claude -p\` with \`--output-format json --json-schema\`, limiting tools to read-only ones.
4. Parse the JSON; post each finding as an inline comment; fail or warn the build according to severity.
5. Persist the findings for the next re-run.

Exam questions pair this task with Domain 4: precision criteria to cut false positives, few-shot examples for consistent finding format, and detected_pattern fields for analysing dismissals. Common distractors: running Claude Code interactively in CI (hangs), parsing free-text output with regexes (brittle), asking the same session that wrote the code to review it (anchored), and re-reporting all findings on every commit (noise).`,
    },
  ],
  examples: [
    {
      title: 'A review job that posts inline comments',
      description:
        'A team wanted PR review comments with file, line, severity and a suggested fix, posted automatically. They defined a JSON schema for the findings and used --json-schema so each run produces an array their bot can post without parsing prose.',
      language: 'bash',
      code: `# ci/review.sh
DIFF=$(git diff origin/main...HEAD)
PRIOR=$(cat .ci/prior-findings.json 2>/dev/null || echo "[]")

claude -p "Review this diff. Prior findings are attached; report only new or \\
still-unaddressed issues. Follow .claude/rules/review.md.

<prior_findings>$PRIOR</prior_findings>
<diff>$DIFF</diff>" \\
  --allowedTools "Read,Grep,Glob" \\
  --output-format json \\
  --json-schema "$(cat ci/findings.schema.json)" > findings.json

node ci/post-comments.js findings.json
cp findings.json .ci/prior-findings.json`,
      takeaway: '-p plus --output-format json and --json-schema turns review output into data the pipeline can act on.',
    },
    {
      title: 'The findings schema',
      description:
        'The schema passed with --json-schema. Note the detected_pattern field, which records which code construct triggered the finding so the team can later analyse which patterns developers dismiss most often.',
      language: 'json',
      code: `{
  "type": "object",
  "properties": {
    "findings": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "file": {"type": "string"},
          "line": {"type": "integer"},
          "severity": {"type": "string", "enum": ["critical", "high", "medium", "low"]},
          "category": {"type": "string", "enum": ["bug", "security", "data_loss", "performance"]},
          "message": {"type": "string"},
          "suggested_fix": {"type": "string"},
          "detected_pattern": {"type": "string"},
          "confidence": {"type": "number", "minimum": 0, "maximum": 1}
        },
        "required": ["file", "line", "severity", "category", "message", "detected_pattern"]
      }
    }
  },
  "required": ["findings"]
}`,
      takeaway: 'Design the schema around what the pipeline will do with each field: posting, routing, and later analysis.',
    },
    {
      title: 'The mistake: self-review in the same session',
      description:
        'A team\'s nightly job asked Claude Code to implement a ticket and then, in the same session, to "review your changes carefully for bugs". The review step consistently passed changes that human reviewers later rejected, including a race condition the generation step had explicitly reasoned was "unlikely". Splitting the job into a generation invocation and a separate `claude -p` review invocation that saw only the diff and the criteria caught the race on the first run.',
      takeaway: 'A fresh instance without the generator\'s reasoning context reviews more critically than the generator reviewing itself.',
    },
    {
      title: 'Test generation that duplicates the suite',
      description:
        'A test-generation job produced tests that were 70% duplicates of existing coverage and built its own fixtures instead of using the team\'s `make_order()` factory. Two changes fixed it: passing the existing test files for the module into the prompt, and adding a CLAUDE.md section listing available fixtures, the definition of a valuable test, and the naming standard.',
      language: 'markdown',
      code: `## Testing standards (loaded by CI and local sessions)
- Framework: pytest. One behaviour per test; name tests as sentences.
- Valuable tests cover edge cases, error paths and boundaries. Do not re-test
  framework behaviour or trivially mirror the implementation.
- Fixtures: \`make_order()\`, \`make_customer()\` in tests/factories.py;
  \`db_session\` and \`frozen_clock\` in tests/conftest.py. Reuse them.
- Before proposing a test, check the existing test module for the same scenario.`,
      takeaway: 'Provide existing tests and document fixtures and standards so generated tests add coverage instead of repeating it.',
    },
  ],
  keyPoints: [
    'Use -p / --print to run Claude Code non-interactively in CI; interactive mode hangs waiting for input.',
    '--output-format json returns machine-parseable output; --json-schema constrains it to a schema you define.',
    'CLAUDE.md and rules files in the repository give CI-invoked Claude Code its project context: testing standards, fixtures, review criteria.',
    'Use a separate review instance rather than having the generating session review its own changes.',
    'On re-runs, include prior findings and instruct Claude to report only new or still-unaddressed issues.',
    'Provide existing test files so test generation does not duplicate covered scenarios.',
    'Document what makes a test valuable and which fixtures exist to reduce low-value generated tests.',
    'Limit tools in CI (for example to read-only tools for review) and bound turns.',
  ],
  flashcards: [
    { front: 'Which flag runs Claude Code non-interactively?', back: '-p (or --print).' },
    { front: 'What happens if Claude Code is run interactively in CI?', back: 'It waits for input and the job hangs until it times out.' },
    { front: 'Which two flags produce schema-constrained, machine-parseable output?', back: '--output-format json together with --json-schema.' },
    { front: 'How does a CI job get project-specific review criteria and testing standards?', back: 'From CLAUDE.md and .claude/rules/ files in the checked-out repository, which load automatically.' },
    { front: 'Why is an independent review instance better than self-review?', back: 'The generating session retains the reasoning and assumptions that produced the code and tends to confirm them; a fresh instance has no such anchoring.' },
    { front: 'How do you avoid duplicate review comments when a PR gets new commits?', back: 'Include prior findings in the prompt and instruct Claude to report only new or still-unaddressed issues.' },
    { front: 'How do you stop test generation from proposing already-covered scenarios?', back: 'Provide the existing test files for the code under test in context.' },
    { front: 'What should CLAUDE.md document to improve generated test quality?', back: 'Testing standards, criteria for a valuable test, and available fixtures and factories.' },
    { front: 'Why post findings from JSON rather than parsing Markdown output?', back: 'Prose phrasing changes break regex parsers; schema-constrained JSON is stable and directly mappable to inline comments.' },
  ],
  quiz: [
    {
      question:
        'A CI job that runs Claude Code for PR review hangs until the pipeline times out. What is the MOST likely cause and fix?',
      options: [
        'The model is too slow; switch to Haiku.',
        'Claude Code was started interactively; add the -p flag to run non-interactively.',
        'The diff is too large; truncate it to 100 lines.',
        'The runner lacks a CLAUDE.md; add one.',
      ],
      correct: [1],
      explanation:
        'Interactive mode waits for user input that never comes. Model speed, diff size or missing CLAUDE.md would cause slow or poor results, not an indefinite hang.',
    },
    {
      question:
        'A team wants review findings posted as inline PR comments with file, line and severity. Their script parses Claude\'s Markdown output with regular expressions and breaks whenever phrasing changes. What is the BEST fix?',
      options: [
        'Add "always use exactly this Markdown format" to the prompt.',
        'Use --output-format json with --json-schema defining the findings structure.',
        'Lower the model\'s effort so output is more predictable.',
        'Post the whole Markdown response as a single PR comment.',
      ],
      correct: [1],
      explanation:
        'Schema-constrained JSON is stable and directly mappable to comments. Prompted formats still drift, effort does not control format, and a single comment loses the inline mapping.',
    },
    {
      question:
        'A nightly job has Claude Code implement a ticket and then, in the same session, review its own changes. Human reviewers keep finding bugs the self-review missed. Which change is MOST likely to help?',
      options: [
        'Add "be extremely thorough and skeptical" to the self-review prompt.',
        'Increase extended thinking effort for the review step.',
        'Run the review as a separate Claude Code invocation that sees only the diff and the review criteria.',
        'Have the same session review the changes twice.',
      ],
      correct: [2],
      explanation:
        'An independent instance lacks the generator\'s reasoning context and so questions decisions the generator took for granted. Stronger wording, more thinking or repeated self-review all keep the same anchoring.',
    },
    {
      question: 'Which TWO practices reduce noise and duplication in Claude Code CI jobs? (Select two)',
      options: [
        'Including prior review findings and instructing Claude to report only new or unaddressed issues.',
        'Providing existing test files so generated tests do not repeat covered scenarios.',
        'Re-reporting every finding on each commit so nothing is missed.',
        'Omitting CLAUDE.md from the CI checkout to keep the prompt short.',
      ],
      correct: [0, 1],
      explanation:
        'Prior findings prevent duplicate comments; existing tests prevent duplicate scenarios. Re-reporting everything creates noise, and omitting CLAUDE.md removes the project context the job needs.',
    },
    {
      question:
        'Generated tests from a CI job mostly duplicate existing coverage and build their own setup code instead of using the team\'s factories. Which combination BEST addresses this?',
      options: [
        'Switch to a larger model and ask for "more creative tests".',
        'Pass the existing test files into context and document fixtures and valuable-test criteria in CLAUDE.md.',
        'Generate tests only for files with no existing tests.',
        'Lower max-turns so fewer tests are produced.',
      ],
      correct: [1],
      explanation:
        'Duplication comes from missing context, not model size. Existing tests show what is covered; documented fixtures and standards shape what is generated. Restricting to untested files or cutting turns reduces output without improving it.',
    },
    {
      question: 'Where should CI-invoked Claude Code get the team\'s review criteria?',
      options: [
        'From CLAUDE.md and .claude/rules/ files in the checked-out repository.',
        'From the CI runner\'s ~/.claude/CLAUDE.md.',
        'From environment variables set in the pipeline.',
        'From a comment at the top of each source file.',
      ],
      correct: [0],
      explanation:
        'Repository memory files load automatically and are versioned with the code. A runner home directory is not under version control, environment variables are not instructions, and per-file comments are unmaintainable.',
    },
  ],
  statements: [
    { text: 'The -p flag runs Claude Code in non-interactive mode suitable for pipelines.', isTrue: true, explanation: 'It prints the result and exits instead of waiting for input.' },
    { text: '--json-schema makes Claude Code output conform to a schema you supply.', isTrue: true, explanation: 'Combined with --output-format json, it produces machine-parseable, schema-constrained results.' },
    { text: 'A session that generated code is the best reviewer of that code because it already understands the intent.', isTrue: false, explanation: 'It retains the assumptions that produced the code and tends to confirm them. An independent instance catches more.' },
    { text: 'CLAUDE.md in the repository is loaded by Claude Code when it runs in CI.', isTrue: true, explanation: 'The runner checks out the repository, so project memory files load as they do locally.' },
    { text: 'On re-runs after new commits, reporting all findings again is preferable so none are lost.', isTrue: false, explanation: 'It floods the PR with duplicates. Include prior findings and report only new or unaddressed issues.' },
    { text: 'Providing existing test files to a test-generation job tends to increase duplicate tests because the model copies them.', isTrue: false, explanation: 'Existing tests show what is already covered so the model can avoid proposing the same scenarios.' },
    { text: 'Review jobs in CI should typically be restricted to read-only tools.', isTrue: true, explanation: 'A reviewer does not need to edit files or run arbitrary commands; limiting tools reduces risk.' },
  ],
  resources: [
    { label: 'Claude Code headless mode / CLI reference', url: 'https://code.claude.com/docs/en/cli-reference' },
    { label: 'Claude Code GitHub Actions', url: 'https://code.claude.com/docs/en/github-actions' },
    { label: 'Claude Code memory (CLAUDE.md)', url: 'https://code.claude.com/docs/en/memory' },
  ],
};
