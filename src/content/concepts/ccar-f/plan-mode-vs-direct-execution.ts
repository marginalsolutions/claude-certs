import type { Concept } from '../../types';

export const planModeVsDirectExecution: Concept = {
  id: 'plan-mode-vs-direct-execution',
  title: 'Plan Mode vs Direct Execution',
  summary:
    'Decide when a Claude Code task deserves plan mode (large, multi-file, architectural, or with several valid approaches) versus direct execution (well-scoped, well-understood changes), and use the Explore subagent to keep discovery out of the main context.',
  certs: ['ccar-f', 'ccdv-f', 'ccar-p'],
  domains: ['ccar-f-3', 'ccar-f-5', 'ccdv-f-3', 'ccar-p-7'],
  tags: ['claude-code', 'plan-mode', 'workflow', 'context-management'],
  difficulty: 'foundations',
  sections: [
    {
      heading: 'What plan mode changes',
      body: `In plan mode Claude Code reads, searches and reasons about the codebase but does not edit files or run state-changing commands. It produces a plan that you review and approve before any implementation starts. Direct execution is the default: Claude reads what it needs and starts making changes immediately.

The value of plan mode is **cheap reversibility**. A plan is text; discarding it costs a few minutes. A half-finished 45-file migration that took the wrong approach costs hours to unwind. Plan mode front-loads the exploration and design so the expensive, hard-to-reverse step (editing) only happens once the approach is agreed.

The cost of plan mode is the round trip. For a change you could describe in one sentence and verify with one test run, writing and reviewing a plan is overhead that adds nothing.`,
    },
    {
      heading: 'Signals that call for plan mode',
      body: `Use plan mode when one or more of these is true:

- **Large scale.** The change touches many files (the exam guide uses "45+ files" as an illustration) or many modules. Example: migrating a library across the codebase.
- **Multiple valid approaches.** Choosing between integration strategies with different infrastructure requirements, such as a queue-based versus a synchronous integration. The plan surfaces the tradeoff so a human decides.
- **Architectural implications.** Restructuring a monolith into services, changing a data model, introducing a new layer. Mistakes here propagate.
- **Unfamiliar territory.** You cannot yet state what "done" looks like. Exploration first prevents committing to a wrong understanding.

Use direct execution when the change is **well-scoped and well-understood**:

- A single-file bug fix with a clear stack trace.
- Adding one validation conditional (for example a date range check) to one function.
- Renaming a symbol, adding a log line, fixing a typo in a message.

The test is not "is this important" but "is the approach already obvious and the blast radius small".`,
    },
    {
      heading: 'The Explore subagent and context preservation',
      body: `Discovery is verbose. Finding every call site of a deprecated API across a large repository can produce thousands of lines of grep output and file contents. If that lands in the main conversation, it crowds out the instructions and decisions that matter for the implementation phase, and long multi-phase tasks start to forget earlier context.

The **Explore subagent** runs discovery in its own context and returns a summary: which files matter, what patterns were found, what the risks are. The main conversation receives the conclusions, not the raw output. This is the same isolation idea as \`context: fork\` for skills, applied to codebase investigation.

Use Explore when:

- The task has distinct discovery and implementation phases.
- Discovery output would be large (searching a monorepo, reading many modules).
- You intend to keep working in the same session afterwards and need the context budget.

Plan mode and Explore combine naturally: plan mode decides *whether* to proceed and *how*; Explore keeps the *finding out* from exhausting the window.`,
    },
    {
      heading: 'Combining the modes, and the exam angle',
      body: `The strongest pattern is sequential: **plan, then execute**. Use plan mode to investigate a library migration, enumerate affected files, choose an approach and define verification steps. Once the plan is approved, switch to direct execution and implement it, ideally in reviewable chunks with tests run between them. The plan becomes the checklist.

Scenario questions tend to present a task and ask which mode fits, or present a failure and ask what would have prevented it:

- "Migration across 45 files went wrong halfway; how to avoid rework?" → plan mode first.
- "Two integration approaches with different infrastructure needs" → plan mode to surface the decision.
- "Null-pointer bug with a stack trace pointing at one function" → direct execution.
- "Discovery output fills the context and later steps lose track" → Explore subagent.
- "Planned a migration; now what?" → execute the approved plan directly.

Distractors usually over-apply one mode: planning a one-line fix, or diving straight into a service restructuring "to save time".`,
    },
  ],
  examples: [
    {
      title: 'Library migration across 45 files',
      description:
        'A team needed to move from a deprecated HTTP client to a new one across roughly 45 files, including places where retry semantics differed. In plan mode Claude catalogued the call sites, grouped them by usage pattern, flagged the three sites where behaviour would change, and proposed an order (shared wrapper first, then leaf callers). The team approved, then ran the implementation directly in three batches with tests between each.',
      language: 'text',
      code: `Plan (approved):
1. Add internal/http wrapper exposing the old retry semantics over the new client.
2. Migrate 38 straightforward call sites to the wrapper. Run unit tests.
3. Migrate 7 sites with custom retry logic one by one; add a test for each.
4. Remove the deprecated dependency; run the full suite and the integration smoke tests.`,
      takeaway: 'Plan when scale and behavioural risk are high; execute the approved plan in verifiable chunks.',
    },
    {
      title: 'The mistake: planning a one-line fix',
      description:
        'A developer had a stack trace showing `parseDate` throwing on an empty string in one function. They entered plan mode, waited for a plan that said "add an empty-string guard", approved it, and then implemented it. The whole exercise took longer than the fix. For a well-scoped change with an obvious approach, direct execution with a quick test is the right call.',
      takeaway: 'Plan mode adds a round trip; skip it when the approach is already obvious and the blast radius is one function.',
    },
    {
      title: 'Context exhaustion during discovery',
      description:
        'While refactoring an authentication module, a developer asked Claude Code to find every place session tokens were read or written across a large monorepo. The raw search results and file excerpts consumed most of the context, and by the time implementation began Claude had lost the earlier constraints about backward compatibility. Re-running the discovery through the Explore subagent returned a two-page summary, leaving ample room for the implementation phase.',
      takeaway: 'Route verbose discovery through Explore so only the conclusions enter the main conversation.',
    },
    {
      title: 'Choosing between integration approaches',
      description:
        'A product team asked Claude Code to "integrate the new notification provider". There were two viable designs: synchronous calls from the request path, or publishing to the existing event bus with a consumer. They have different infrastructure requirements and failure modes. Plan mode produced both options with tradeoffs; an architect picked the event-bus design before any code was written.',
      takeaway: 'When several approaches are valid and the choice has infrastructure consequences, plan mode makes the decision explicit and human-owned.',
    },
  ],
  keyPoints: [
    'Plan mode explores and designs without editing; you approve the plan before implementation.',
    'Use plan mode for large-scale changes, multi-file modifications, architectural decisions and tasks with several valid approaches.',
    'Use direct execution for well-scoped, well-understood changes such as a single-file fix with a clear stack trace.',
    'Plan mode prevents costly rework by making the design step cheap to discard.',
    'The Explore subagent isolates verbose discovery and returns a summary, preserving main-conversation context.',
    'Combine them: plan mode for investigation and approach selection, then direct execution of the approved plan.',
    'Over-planning small fixes wastes time; under-planning large changes wastes far more.',
  ],
  flashcards: [
    { front: 'What does plan mode prevent Claude Code from doing?', back: 'Editing files or running state-changing commands before you approve a plan.' },
    { front: 'Name four signals that a task deserves plan mode.', back: 'Large scale (many files), multiple valid approaches, architectural implications, unfamiliar territory.' },
    { front: 'Give two examples of tasks suited to direct execution.', back: 'A single-file bug fix with a clear stack trace; adding one date-validation conditional to a function.' },
    { front: 'What is the Explore subagent for?', back: 'Running verbose discovery in an isolated context and returning a summary so the main conversation is not exhausted.' },
    { front: 'How do plan mode and direct execution combine?', back: 'Plan the investigation and approach, get approval, then execute the plan directly in verifiable chunks.' },
    { front: 'Why does plan mode reduce rework?', back: 'Discarding a plan is cheap; unwinding a half-finished multi-file change is expensive.' },
    { front: 'Which mode for "choose between a sync integration and an event-bus integration with different infrastructure"?', back: 'Plan mode, so the tradeoff is surfaced and a human decides.' },
    { front: 'Which Claude Code feature resembles context: fork but for codebase investigation?', back: 'The Explore subagent.' },
  ],
  quiz: [
    {
      question:
        'A team must migrate from one ORM to another across about 50 files, several of which rely on lazy-loading behaviour the new ORM handles differently. Which approach is MOST appropriate?',
      options: [
        'Direct execution, migrating files alphabetically to keep momentum.',
        'Plan mode to catalogue call sites and choose an approach, then direct execution of the approved plan in chunks.',
        'Direct execution with a larger model so it can hold all 50 files in context.',
        'Ask Claude to migrate everything in one pass and fix test failures afterwards.',
      ],
      correct: [1],
      explanation:
        'Scale plus behavioural risk is exactly the plan-mode case, and executing the approved plan in chunks keeps changes verifiable. Starting directly risks expensive rework; a bigger model does not replace design; fix-after is the rework you are trying to avoid.',
    },
    {
      question:
        'A stack trace shows a null dereference in one function of one file, and the fix is a single guard clause. What should the developer do?',
      options: [
        'Enter plan mode and request a written plan before changing anything.',
        'Use the Explore subagent to map every caller first.',
        'Make the change directly and run the relevant tests.',
        'Open an architecture review for the module.',
      ],
      correct: [2],
      explanation:
        'Well-scoped, well-understood changes belong in direct execution. Plan mode and Explore add overhead without reducing risk here, and an architecture review is disproportionate.',
    },
    {
      question:
        'During a multi-phase refactor, the discovery phase produced thousands of lines of search output in the main session. Later, Claude Code lost track of constraints agreed earlier. Which change would BEST have prevented this?',
      options: [
        'Running the discovery through the Explore subagent so only a summary entered the main conversation.',
        'Using direct execution instead of plan mode.',
        'Asking Claude to be more concise.',
        'Splitting the repository into smaller repositories.',
      ],
      correct: [0],
      explanation:
        'Explore isolates verbose discovery and preserves main-context budget. Mode choice does not change how much output lands in context, politeness requests are unreliable, and restructuring repositories is out of proportion.',
    },
    {
      question: 'Which TWO situations are good candidates for plan mode? (Select two)',
      options: [
        'Restructuring a monolith into three services.',
        'Fixing a typo in an error message.',
        'Choosing between two integration designs with different infrastructure requirements.',
        'Adding a single log statement to one function.',
      ],
      correct: [0, 2],
      explanation:
        'Architectural restructuring and decisions between valid approaches are the core plan-mode cases. A typo fix and a log line are well-scoped direct-execution changes.',
    },
    {
      question: 'A team has an approved plan for a dependency upgrade. What is the recommended next step?',
      options: [
        'Stay in plan mode and ask for a second plan to compare.',
        'Switch to direct execution and implement the plan, running tests between chunks.',
        'Discard the plan and let Claude rediscover the approach during implementation.',
        'Convert the plan into a CLAUDE.md rule so it is always loaded.',
      ],
      correct: [1],
      explanation:
        'Plan then execute is the intended combination; the plan becomes the checklist. Re-planning stalls, discarding wastes the investigation, and a one-off plan is not a standing convention.',
    },
  ],
  statements: [
    { text: 'In plan mode Claude Code can read and search the codebase but does not edit files until the plan is approved.', isTrue: true, explanation: 'That separation is what makes design cheap to revise before implementation.' },
    { text: 'Plan mode is recommended for every change, including single-line fixes, to be safe.', isTrue: false, explanation: 'Plan mode adds a round trip. Well-scoped, well-understood changes should be executed directly.' },
    { text: 'The Explore subagent returns a summary of its findings rather than the raw discovery output.', isTrue: true, explanation: 'This preserves the main conversation\'s context for later phases.' },
    { text: 'Choosing between multiple valid integration approaches is a signal for direct execution because Claude can pick the best one.', isTrue: false, explanation: 'Multiple valid approaches with different consequences call for plan mode so the tradeoff is explicit and a human decides.' },
    { text: 'Plan mode and direct execution can be combined within one task: plan first, then execute.', isTrue: true, explanation: 'This is the recommended workflow for large migrations.' },
    { text: 'A single-file bug fix with a clear stack trace is a typical plan-mode task.', isTrue: false, explanation: 'It is the canonical direct-execution example in the exam guide.' },
  ],
  resources: [
    { label: 'Claude Code common workflows', url: 'https://code.claude.com/docs/en/common-workflows' },
    { label: 'Claude Code best practices', url: 'https://code.claude.com/docs/en/best-practices' },
  ],
};
