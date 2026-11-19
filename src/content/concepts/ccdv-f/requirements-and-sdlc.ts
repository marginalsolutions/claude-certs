import type { Concept } from '../../types';

export const requirementsAndSdlc: Concept = {
  id: 'requirements-and-sdlc',
  title: 'Requirements and the Systems Life Cycle',
  summary:
    'Turning business requirements into functional and infrastructure requirements for a Claude system, running it through the systems life cycle, using Claude in code review and refactoring, and version-controlling prompts and configuration.',
  certs: ['ccdv-f', 'ccar-f', 'ccar-p'],
  domains: ['ccdv-f-2', 'ccar-f-3', 'ccar-p-1', 'ccar-p-6'],
  tags: ['requirements', 'sdlc', 'code-review', 'refactoring', 'version-control'],
  difficulty: 'foundations',
  sections: [
    {
      heading: 'From business requirements to technical requirements',
      body: `A business requirement says what the organisation wants: "cut first-response time on support tickets by half without increasing headcount." A developer's first job is to translate it into two kinds of technical requirement.

**Functional requirements** describe what the system does: classify each ticket, draft a reply in the customer's language, escalate when confidence is low, never promise refunds. For Claude systems they also include the inputs (text, screenshots, PDFs), the output contract (schema), the tools the model may call and the human-in-the-loop points.

**Infrastructure (non-functional) requirements** describe how well and under what constraints:

| Dimension | Example requirement | Claude design consequence |
|---|---|---|
| Latency | p95 under 4 s for the agent reply | Streaming, Sonnet or Haiku tier, caching, low effort |
| Throughput | 50 requests/s at peak | Rate-limit planning, async clients, batches for backlog |
| Cost ceiling | under $0.02 per ticket | Model tier, caching, token budgets, batch for analytics |
| Availability | 99.9% | Retries, fallbacks, multi-platform option |
| Data residency | EU data stays in EU | inference_geo or a platform/region that satisfies it |
| Compliance | PII redaction, retention limits | Logging policy, redaction before the API, ZDR considerations |

Writing these down early is what lets you choose a model, a platform and sync versus batch on evidence instead of taste.`,
    },
    {
      heading: 'The systems life cycle',
      body: `Claude applications follow the same life cycle as any IT system, with a few AI-specific additions at each phase:

1. **Plan**: requirements above, success metrics (accuracy, latency, cost, safety), a go/no-go on whether an LLM is the right tool, and a decision between workflow and agent.
2. **Build**: prompts, schemas, tools, harness. Build the eval set alongside the code, not after.
3. **Test**: unit tests for the integration layer, evals for model behaviour, red-team tests for injection, load tests against rate limits. Evals replace "it worked on my example".
4. **Deploy**: pinned model, versioned prompt, environment-specific keys, canary rollout, feature flags for betas.
5. **Operate**: monitor usage and cost from the \`usage\` object, latency, error classes, refusal rates and eval scores on sampled production traffic; set alerts.
6. **Maintain**: model upgrades through the eval gate, prompt iteration driven by failure analysis, deprecation calendar, periodic re-evaluation of guardrails.

Because models change on Anthropic's schedule, "maintain" is not optional: a model retirement date is a hard deadline that must be in the plan.`,
    },
    {
      heading: 'Code review and refactoring with Claude',
      body: `Claude is both a component you build and a tool you use while building. Two patterns from the exam guides:

**Code review.** Claude Code can review a diff in a terminal session or headless in CI (\`claude -p "Review this diff for security issues" --output-format json\`). Large reviews work better in **passes**: per-file local analysis first, then a separate cross-file integration pass over the summaries, so attention is not diluted across thousands of lines. Structured findings (file, line, severity, category, evidence) make results filterable and let you measure false-positive patterns. Claude's review supplements human review; it does not replace the approval gate.

**Refactoring.** Small refactors (rename, extract a function, fix a single bug with a clear stack trace) suit direct execution. Large refactors (a library migration across dozens of files, a service split) suit **plan mode**: explore first, agree an approach, then execute in reviewable steps with tests run between them. Give Claude the tests and the conventions (CLAUDE.md) and ask it to run the suite after each change. Break the work into commits that can be reviewed and reverted individually.`,
    },
    {
      heading: 'Version control for prompts and configuration',
      body: `Everything that changes model behaviour should be in version control and go through the same review as code:

- **Prompts and schemas** as files or modules, with versions and a changelog; link each change to the eval result that justified it.
- **CLAUDE.md, .claude/rules, .claude/settings.json, .claude/commands and skills** committed in the repository so the team and CI share one configuration.
- **Model ids and effort defaults** in configuration files per environment, reviewed when changed.
- **Eval datasets and golden outputs** versioned alongside prompts so a prompt diff can be judged against the same cases.
- **Secrets never committed**: API keys live in environment variables or a secrets manager; local settings files and \`.env\` are git-ignored.

Branching and review practice: a prompt change is a pull request; it includes the eval run; it is small enough to understand; it ships behind a flag or canary when risk is high. This is what the exam means by "SDLC integration" for Claude work.`,
    },
  ],
  examples: [
    {
      title: 'Translating a business requirement',
      description:
        'Business: "Customers in the EU must get a first reply within 5 seconds, 24/7, and the project budget is $500 per month for 100,000 tickets." The developer derives functional and infrastructure requirements before choosing anything.',
      language: 'markdown',
      code: `## Functional
- Classify ticket (billing / technical / other), draft reply in the ticket's language
- Escalate to a human when confidence < 0.7 or when a refund is requested
- Output: JSON {category, reply, confidence, escalate}

## Infrastructure
- Latency: p95 < 5 s  -> streaming, Sonnet/Haiku tier, cached system prompt, effort low/medium
- Cost: $500 / 100k = $0.005 per ticket -> Haiku 5.5 with caching; batch the nightly analytics
- Data residency: EU -> inference_geo or an EU-region platform; no PII in logs
- Availability: 24/7 -> SDK retries, alerting on 429/529, fallback model`,
      takeaway: 'Numbers in the requirements drive model tier, caching, platform and sync-versus-batch decisions.',
    },
    {
      title: 'A two-pass code review in CI',
      description:
        'A repository runs Claude Code headless on each pull request: one pass per changed file producing structured findings, then an integration pass over all findings looking for cross-file issues. Results are posted as a comment; humans still approve.',
      language: 'bash',
      code: `for f in $(git diff --name-only origin/main); do
  claude -p "Review $f for bugs and security issues. Output JSON findings." \\
    --output-format json --json-schema review-schema.json > "findings/$f.json"
done
claude -p "Given these per-file findings, identify cross-file data-flow and contract issues." \\
  --output-format json < <(cat findings/*.json) > integration.json
./post-review-comment.sh findings/ integration.json`,
      takeaway: 'Per-file passes plus a separate integration pass avoid attention dilution; structured output makes findings actionable.',
    },
    {
      title: 'Mistake: a prompt change shipped without an eval',
      description:
        'An engineer tweaked the triage prompt directly in production config to "be more helpful". Escalation rates fell because the model started answering refund requests itself, which violated a functional requirement. The team moved prompts into the repo, required the eval run in the pull request, and added a hook that blocks the refund tool unless an escalation flag is set.',
      language: 'text',
      code: `Before: edit prompt in prod config -> behaviour change -> discovered a week later
After:  prompt lives in repo as support_triage@v8
        PR includes eval results (escalation precision/recall) vs v7
        canary 10% for a day -> flip
        PreToolUse hook denies refund tool when escalate != true`,
      takeaway: 'Prompts are code: review, eval and canary them; enforce hard requirements with controls, not prose.',
    },
  ],
  keyPoints: [
    'Translate business requirements into functional requirements (what the system does, inputs, outputs, tools, HITL) and infrastructure requirements (latency, throughput, cost ceiling, availability, residency, compliance).',
    'Infrastructure numbers drive concrete choices: model tier, caching, streaming, platform/region, sync versus batch.',
    'Life cycle: plan, build, test, deploy, operate, maintain; build evals alongside code and treat model retirements as deadlines.',
    'Code review with Claude: per-file passes then a cross-file integration pass; structured findings; humans keep the approval gate.',
    'Small refactors: direct execution. Large refactors: plan mode, tests between steps, reviewable commits.',
    'Version-control prompts, schemas, CLAUDE.md, settings, commands, skills, model ids and eval datasets; never commit secrets.',
    'A prompt change is a pull request with an eval result and, when risky, a canary.',
  ],
  flashcards: [
    { front: 'Difference between functional and infrastructure requirements?', back: 'Functional: what the system does (inputs, outputs, tools, escalation). Infrastructure: how well and under what constraints (latency, throughput, cost, availability, residency, compliance).' },
    { front: 'Which infrastructure requirement most directly points to the Batches API?', back: 'A latency-tolerant workload with a tight cost ceiling.' },
    { front: 'Six phases of the systems life cycle used here?', back: 'Plan, build, test, deploy, operate, maintain.' },
    { front: 'What AI-specific artefact should be built during the build phase?', back: 'The eval set, alongside the prompts and code.' },
    { front: 'Why split a large code review into passes?', back: 'Per-file passes avoid attention dilution; a separate integration pass catches cross-file issues.' },
    { front: 'When is plan mode preferred over direct execution?', back: 'Large or architectural changes, multi-file migrations, several valid approaches. Direct execution suits small, well-scoped fixes.' },
    { front: 'What belongs in version control for a Claude system?', back: 'Prompts, schemas, CLAUDE.md, rules, settings, commands, skills, model ids per environment, eval datasets. Not secrets.' },
    { front: 'What should accompany a prompt change pull request?', back: 'The eval result against the previous version, and a canary plan if the change is risky.' },
    { front: 'Which operate-phase signals should be monitored?', back: 'Usage and cost from the usage object, latency, error classes, refusal rates, eval scores on sampled traffic.' },
  ],
  quiz: [
    {
      question:
        'A business sponsor asks for "faster support replies at lower cost". Which is the best first step for the developer?',
      options: [
        'Pick the cheapest model and start building.',
        'Translate the request into measurable functional and infrastructure requirements (latency target, cost per ticket, escalation rules, data constraints).',
        'Move all traffic to the Batches API for the discount.',
        'Write the system prompt and iterate in production.',
      ],
      correct: [1],
      explanation:
        'Requirements drive model, platform and API choices. Choosing a model or batches first solves a problem that has not been defined, and iterating in production skips testing.',
    },
    {
      question: 'A requirement states that EU customer data must not leave the EU. Which design consideration does this most directly affect?',
      options: ['max_tokens sizing', 'Choice of inference region or platform and logging policy', 'Effort level', 'Whether to use streaming'],
      correct: [1],
      explanation:
        'Data residency is an infrastructure requirement about where processing and storage happen. Tokens, effort and streaming do not address it.',
    },
    {
      question: 'Which TWO practices reflect sound SDLC integration for prompts? (Select two)',
      options: [
        'Editing the production prompt directly to react quickly to complaints.',
        'Storing prompts in version control with a version identifier and changelog.',
        'Including eval results in the pull request that changes a prompt.',
        'Keeping prompts as inline strings so they stay close to the code that uses them.',
      ],
      correct: [1, 2],
      explanation:
        'Versioned prompts plus evals in review make changes traceable and tested. Editing production directly and burying prompts in handlers both undermine review and rollback.',
    },
    {
      question: 'A 60-file library migration needs to be done with Claude Code. Which approach fits best?',
      options: [
        'Direct execution in one prompt: "migrate everything".',
        'Plan mode to explore and agree an approach, then execute in steps with the test suite run between them and reviewable commits.',
        'Ask Claude to skip tests until the end to save time.',
        'Do each file in a fresh session with no shared plan.',
      ],
      correct: [1],
      explanation:
        'Large, multi-file changes with architectural implications are what plan mode is for. One-shot execution and skipping tests raise risk; isolated sessions lose coherence.',
    },
    {
      question: 'A team wants Claude to review large pull requests but notices findings get vague as diffs grow. What is the recommended structure?',
      options: [
        'Raise max_tokens so the whole diff fits.',
        'Per-file review passes producing structured findings, followed by a separate cross-file integration pass.',
        'Ask reviewers to split PRs into single-file changes.',
        'Review only the largest file.',
      ],
      correct: [1],
      explanation:
        'Multi-pass review avoids attention dilution and still catches cross-file issues. Bigger outputs do not fix dilution, pushing the burden to developers is a workaround, and reviewing one file misses the rest.',
    },
  ],
  statements: [
    { text: 'A cost ceiling per transaction is an infrastructure (non-functional) requirement.', isTrue: true, explanation: 'It constrains how the system runs, driving model tier, caching and batch decisions.' },
    { text: 'The eval set should be written after the application is finished.', isTrue: false, explanation: 'Build it alongside the prompts and code so testing is possible from the start.' },
    { text: 'Model retirement dates should be treated as maintenance deadlines in the plan.', isTrue: true, explanation: 'Models are deprecated on a published schedule; pinning controls pace but does not stop time.' },
    { text: 'Claude\'s code review output should replace human approval on pull requests.', isTrue: false, explanation: 'It supplements review; humans keep the approval gate.' },
    { text: 'Secrets such as API keys should be stored in the committed settings file for convenience.', isTrue: false, explanation: 'Secrets belong in environment variables or a secrets manager; committed files are shared and persist in history.' },
    { text: 'A single-file bug fix with a clear stack trace is a good candidate for direct execution rather than plan mode.', isTrue: true, explanation: 'Plan mode is for large, multi-approach or architectural changes.' },
  ],
  resources: [
    { label: 'Claude Code common workflows', url: 'https://code.claude.com/docs/en/common-workflows' },
    { label: 'Run Claude Code headless', url: 'https://code.claude.com/docs/en/headless' },
    { label: 'Define your success criteria', url: 'https://platform.claude.com/docs/en/test-and-evaluate/define-success' },
  ],
};
