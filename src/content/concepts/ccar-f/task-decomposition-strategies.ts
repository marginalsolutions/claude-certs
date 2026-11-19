import type { Concept } from '../../types';

export const taskDecompositionStrategies: Concept = {
  id: 'task-decomposition-strategies',
  title: 'Task Decomposition Strategies',
  summary:
    'Break complex work into pieces the model can do well. Fixed prompt chains suit predictable multi-aspect tasks like code review; dynamic decomposition suits open-ended investigation where each finding changes the plan.',
  certs: ['ccar-f', 'ccdv-f', 'ccar-p'],
  domains: ['ccar-f-1', 'ccar-f-4', 'ccdv-f-1', 'ccar-p-1'],
  tags: ['decomposition', 'prompt-chaining', 'workflows', 'code-review', 'planning'],
  difficulty: 'intermediate',
  diagram: 'workflow-vs-agent',
  sections: [
    {
      heading: 'Why decompose at all',
      body: `A single prompt asked to do everything at once ("review this 40-file pull request for bugs, style, security and performance") suffers from **attention dilution**: the model spreads its reasoning thinly, misses issues it would catch in isolation, and produces inconsistent depth across files. Decomposition gives each step a focused context and a clear output, which raises quality and makes failures local and debuggable.

Decomposition also matches work to cost. Mechanical steps can run on a cheaper model or in a batch; judgment-heavy steps get the strongest model. And it creates natural checkpoints where code can validate intermediate output before the next step consumes it.

There are two families of decomposition, and the exam expects you to pick the right one for the workflow's shape.`,
    },
    {
      heading: 'Prompt chaining: fixed sequential pipelines',
      body: `**Prompt chaining** breaks a task into a predetermined sequence of steps, each a separate call whose output feeds the next. The steps are known before you start because the task has a predictable structure.

Code review is the canonical example:

1. **Per-file local pass.** For each changed file, one call: analyse this file for correctness, style and obvious defects. Output a structured list of findings.
2. **Cross-file integration pass.** One call with all per-file findings plus the diff summary: look for interface mismatches, broken callers, inconsistent naming, duplicated logic across files.
3. **Consolidation.** Merge, de-duplicate, rank by severity, format as PR comments.

Splitting local and cross-file analysis is deliberate. Local defects need the file's full text but not the rest of the PR; integration issues need the shape of every change but not every line. Mixing them dilutes attention on both.

Chaining is **predictable**: same steps every run, easy to test each stage, easy to cache the fixed instructions, easy to parallelise independent steps (all per-file passes can run at once). Its weakness is rigidity: it cannot add a step it did not anticipate.`,
    },
    {
      heading: 'Dynamic decomposition: adaptive plans',
      body: `Some tasks cannot be planned up front because the right subtasks depend on what you find. "Add comprehensive tests to this legacy codebase" is the exam's example. You do not know which modules matter, what the dependency graph looks like, or where the untestable code is until you look.

The adaptive pattern:

1. **Map the structure.** Glob and Grep to find modules, entry points, existing tests and build configuration.
2. **Identify high-impact areas.** Core business logic, frequently changed files, code with no tests, code called from many places.
3. **Create a prioritised plan** and start executing it.
4. **Adapt as dependencies are discovered.** Testing module A reveals it needs a mockable interface for database access; add a subtask. A module turns out to be dead code; drop it.

Here the agent (or coordinator) generates subtasks at runtime. This is the agentic loop applied to planning: each step's output changes the next step. It handles novelty well and over-engineers predictable work badly.`,
    },
    {
      heading: 'Choosing and combining',
      body: `| Signal | Prefer |
|---|---|
| Steps and their order are known in advance | Prompt chaining |
| Same aspects reviewed every time (security, style, tests) | Prompt chaining |
| Subtasks depend on intermediate findings | Dynamic decomposition |
| Open-ended investigation, unfamiliar codebase | Dynamic decomposition |
| Need strict cost and latency predictability | Prompt chaining |
| Need to follow leads, handle surprises | Dynamic decomposition |

Most real systems combine them. A CI review is a fixed chain whose cross-file pass may spawn a dynamic investigation when it finds a suspicious call path. A legacy-test agent uses dynamic planning to decide *which* modules to test, then a fixed chain (read module → write tests → run → fix) for *each* one.

Exam items in this area usually describe a workflow and ask which decomposition fits, or show a monolithic prompt failing and ask how to split it. Look for whether the steps are knowable in advance.`,
    },
  ],
  examples: [
    {
      title: 'Prompt chain for a CI code review',
      description:
        'Per-file passes run in parallel and return structured findings. A single cross-file pass then looks only at integration issues. Each stage has one job.',
      language: 'python',
      code: `async def review_file(path, content):
    r = await client.messages.create(
        model="claude-sonnet-5-5", max_tokens=2048,
        system="Review ONE file for correctness and style. Return JSON findings "
               "[{line, severity, issue, suggestion}]. Ignore cross-file concerns.",
        messages=[{"role": "user", "content": f"FILE {path}\\n{content}"}])
    return path, parse_findings(r)

local = await asyncio.gather(*(review_file(p, c) for p, c in changed_files))

integration = await client.messages.create(
    model="claude-opus-5-5", max_tokens=4096,
    system="You receive per-file findings and a diff summary. Report ONLY cross-file "
           "issues: broken callers, interface mismatches, duplicated logic.",
    messages=[{"role": "user", "content": json.dumps({"findings": local,
                                                      "diff_summary": summary})}])`,
      takeaway: 'Separate per-file local analysis from the cross-file integration pass to avoid attention dilution.',
    },
    {
      title: 'The mistake: one prompt for the whole pull request',
      description:
        'A team sent all 38 changed files in one request with "review this PR thoroughly". The model produced detailed comments on the first six files, one-liners on the rest, and missed a renamed function whose callers in two other files were not updated. Splitting into per-file passes plus a cross-file pass caught the broken callers and gave every file the same depth.',
      language: 'text',
      code: `Monolithic prompt (38 files, 1 call)
  - depth decays across files           - cross-file break missed
  - one failure loses the whole review  - cannot parallelise

Chained (38 local calls in parallel + 1 integration call)
  - uniform depth per file              - integration pass finds the callers
  - stage failures are isolated         - 38 calls run concurrently`,
      takeaway: 'Monolithic prompts dilute attention; chains give each concern a focused context.',
    },
    {
      title: 'Adaptive plan for "add tests to this legacy service"',
      description:
        'The developer-productivity agent cannot know the subtasks in advance. It maps the codebase, ranks modules, and revises the plan as it discovers hidden dependencies.',
      language: 'markdown',
      code: `## Phase 1: map
- Glob src/**/*.py, tests/**; Grep for "def main", "@app.route", "class .*Repository"
- Result: 42 modules, 3 have tests, billing/ and auth/ are called from 20+ places

## Phase 2: prioritise
1. billing/invoice.py (core logic, no tests, 11 callers)
2. auth/session.py (security-sensitive, no tests)
3. api/handlers.py (thin, lower value)

## Phase 3: execute and adapt
- invoice.py imports a live DB client at module load -> NEW subtask: introduce
  a repository interface so it can be mocked, then test
- session.py already covered indirectly by integration tests -> lower priority
- Discovered utils/money.py used by billing with rounding bug -> add to plan`,
      takeaway: 'For open-ended work, map first, prioritise, then let discoveries reshape the plan.',
    },
  ],
  keyPoints: [
    'Decomposition fights attention dilution: each step gets a focused context and a single, checkable output.',
    'Prompt chaining is a fixed sequence of calls, right when steps are predictable; it is testable, cacheable and parallelisable but rigid.',
    'Dynamic decomposition generates subtasks from intermediate findings; right for open-ended investigation but less predictable in cost.',
    'Code review: per-file local passes (parallel) followed by a separate cross-file integration pass.',
    'Open-ended tasks like adding tests to a legacy codebase: map structure, identify high-impact areas, build a prioritised plan, adapt as dependencies emerge.',
    'The deciding question is whether the subtasks can be known before starting.',
    'Real systems combine both: a fixed chain that can spawn an adaptive investigation, or an adaptive planner that runs a fixed chain per item.',
  ],
  flashcards: [
    { front: 'What is prompt chaining?', back: 'A fixed sequence of model calls where each output feeds the next step, for tasks whose steps are known in advance.' },
    { front: 'What is dynamic decomposition?', back: 'Generating subtasks at runtime based on what each step discovers; used for open-ended investigation.' },
    { front: 'How should a large code review be split?', back: 'Per-file local analysis passes (parallel), then a separate cross-file integration pass, then consolidation.' },
    { front: 'Why separate the cross-file pass from per-file passes?', back: 'Local defects and integration issues need different context; mixing them dilutes attention on both.' },
    { front: 'What is attention dilution?', back: 'Quality loss when one prompt must cover too many files or concerns at once; depth decays and issues are missed.' },
    { front: 'Which decomposition suits "add comprehensive tests to a legacy codebase"?', back: 'Dynamic: map structure, identify high-impact areas, prioritise, adapt as dependencies are discovered.' },
    { front: 'Which decomposition suits a nightly review that always checks security, style and tests?', back: 'Prompt chaining: the aspects are predictable.' },
    { front: 'Name two operational advantages of prompt chaining.', back: 'Each stage is independently testable, and independent steps can run in parallel (plus stable instructions cache well).' },
    { front: 'What is the main weakness of prompt chaining?', back: 'Rigidity: it cannot add a step it did not anticipate.' },
  ],
  quiz: [
    {
      question:
        'A CI review agent sends an entire 30-file pull request in one prompt. Reviews are detailed for early files and superficial for later ones, and a renamed function whose callers were not updated was missed. What is the best change?',
      options: [
        'Increase max_tokens so the model can write more comments.',
        'Split the review into per-file local passes followed by a separate cross-file integration pass.',
        'Ask the model to "be equally thorough on every file".',
        'Review only the first ten files to keep the prompt small.',
      ],
      correct: [1],
      explanation:
        'Per-file passes give uniform depth and the integration pass is designed to catch cross-file breaks like stale callers. More output tokens or an instruction to be thorough do not fix attention dilution, and reviewing fewer files drops coverage.',
    },
    {
      question:
        'An agent is asked to add comprehensive tests to a 200-module legacy service with almost no existing tests. Which approach fits best?',
      options: [
        'A fixed chain: for each module in alphabetical order, generate tests, run them, commit.',
        'Map the codebase structure first, identify high-impact untested areas, create a prioritised plan, and adapt it as hidden dependencies are discovered.',
        'Write one prompt asking for tests for all 200 modules at once.',
        'Generate tests only for modules that already have tests, since those are easiest.',
      ],
      correct: [1],
      explanation:
        'The subtasks depend on what is found, so dynamic decomposition with a prioritised, adaptive plan fits. Alphabetical chaining ignores impact and dependencies; a single prompt cannot hold 200 modules meaningfully; targeting already-tested modules adds little value.',
    },
    {
      question: 'Which TWO situations favour prompt chaining over dynamic decomposition? (Select two)',
      options: [
        'The same review aspects (security, style, test coverage) are checked on every run.',
        'The subtasks cannot be known until intermediate results are examined.',
        'Strict, predictable cost and latency per run are required.',
        'The task involves exploring an unfamiliar codebase to find where a bug originates.',
      ],
      correct: [0, 2],
      explanation:
        'Predictable aspects and strict cost control are the strengths of a fixed chain. Unknown subtasks and exploratory bug hunting are the hallmarks of dynamic decomposition.',
    },
    {
      question:
        'A team\'s per-file review calls each return excellent findings, but the integration pass receives the full text of all 30 files plus the findings and performs poorly. What is the most likely improvement?',
      options: [
        'Give the integration pass only the per-file findings and a diff summary, not every file\'s full text.',
        'Run the integration pass before the per-file passes.',
        'Remove the integration pass; per-file findings are sufficient.',
        'Run the integration pass once per file.',
      ],
      correct: [0],
      explanation:
        'The integration pass needs the shape of the changes, not every line; feeding it everything recreates the attention-dilution problem. Running it first removes its input, dropping it loses cross-file coverage, and per-file integration passes cannot see across files.',
    },
    {
      question: 'What is the primary reason to decompose a complex task into multiple model calls?',
      options: [
        'The API limits each request to one tool call.',
        'Each step gets a focused context and a single checkable output, which raises quality and localises failures.',
        'Smaller prompts are always cheaper in total than one large prompt.',
        'Decomposition removes the need for validation of outputs.',
      ],
      correct: [1],
      explanation:
        'Focus and checkpoints are the benefit. The API allows many tool calls per request; total cost may rise with decomposition; validation remains necessary and in fact becomes easier at each checkpoint.',
    },
  ],
  statements: [
    { text: 'Prompt chaining is best when the steps of a task are predictable before execution begins.', isTrue: true, explanation: 'Fixed pipelines suit known, repeatable multi-aspect work such as structured code review.' },
    { text: 'Dynamic decomposition generates subtasks based on intermediate findings.', isTrue: true, explanation: 'This is what makes it suitable for open-ended investigation.' },
    { text: 'Reviewing all files of a large PR in one prompt is preferable because the model can see every interaction at once.', isTrue: false, explanation: 'Attention dilution causes uneven depth and missed issues; split into per-file and cross-file passes.' },
    { text: 'The cross-file integration pass should receive the full text of every changed file.', isTrue: false, explanation: 'It should receive per-file findings and a diff summary; full text recreates attention dilution.' },
    { text: 'Per-file review passes can run in parallel because they are independent.', isTrue: true, explanation: 'Independence is a key operational benefit of chaining.' },
    { text: 'For "add comprehensive tests to a legacy codebase", the agent should fix the complete list of modules to test before reading any code.', isTrue: false, explanation: 'The plan should be built after mapping the structure and should adapt as dependencies are discovered.' },
    { text: 'Fixed chains and adaptive decomposition can be combined in one system.', isTrue: true, explanation: 'A chain stage can trigger an adaptive investigation, or an adaptive planner can run a fixed chain per item.' },
  ],
  resources: [
    { label: 'Building effective agents (Anthropic)', url: 'https://www.anthropic.com/research/building-effective-agents' },
    { label: 'Chain complex prompts (Claude docs)', url: 'https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/chain-prompts' },
    { label: 'Claude Code GitHub Actions', url: 'https://code.claude.com/docs/en/github-actions' },
  ],
};
