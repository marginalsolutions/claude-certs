import type { Concept } from '../../types';

export const architecturalPatternsWorkflowAgenticAugmented: Concept = {
  id: 'architectural-patterns-workflow-agentic-augmented',
  title: 'Architectural Patterns: Augmented LLM, Workflows and Agents',
  summary:
    'Choose between an augmented LLM call, a predefined workflow (chaining, routing, parallelization, orchestrator-workers, evaluator-optimizer) and an autonomous agent based on predictability, value and the cost of errors.',
  certs: ['ccar-p', 'ccar-f', 'ccdv-f'],
  domains: ['ccar-p-1', 'ccar-f-1', 'ccdv-f-1'],
  tags: ['patterns', 'workflow', 'agent', 'orchestration', 'augmented-llm'],
  difficulty: 'intermediate',
  diagram: 'orchestration-patterns',
  sections: [
    {
      heading: 'The building block: the augmented LLM',
      body: `The basic unit of every pattern is a single model call enhanced with three capabilities:

- **Retrieval**: the call is given the documents or records it needs (RAG, search results, database rows).
- **Tools**: the model can request actions (look up an order, run a query) and receive results.
- **Memory**: state carried across calls (conversation history, a scratchpad file, a summary).

Many enterprise problems are solved by one well-designed augmented call: classify this ticket with the policy in context, extract these fields with a schema, answer this question from these retrieved passages. Reach for more structure only when a single call demonstrably cannot do the job. Every added step adds latency, cost and a new place to fail.`,
    },
    {
      heading: 'Workflows: predefined code paths',
      body: `A workflow orchestrates model calls along paths your code defines. The model fills in steps; it does not decide the shape of the process. Anthropic's catalogue:

| Pattern | Shape | Use when |
|---|---|---|
| Prompt chaining | Step A output feeds step B, with optional programmatic gates between | Task decomposes into fixed sequential subtasks (draft → check → translate) |
| Routing | A classifier sends input to a specialised prompt or model | Inputs fall into distinct categories handled differently (billing vs technical; easy vs hard) |
| Parallelization | Sectioning (independent subtasks at once) or voting (same task several times, aggregate) | Subtasks are independent, or you want multiple perspectives on a high-stakes judgment |
| Orchestrator-workers | A central model breaks the task into subtasks it determines at runtime and delegates | Subtasks cannot be predicted in advance (which files need changing) but the overall flow is still bounded |
| Evaluator-optimizer | One call produces, another critiques against criteria, loop until acceptable | Clear evaluation criteria exist and iteration measurably improves output |

Workflows are predictable, testable step by step, cheap to observe and easy to put SLAs on. They are the default for well-defined tasks.`,
    },
    {
      heading: 'Agents: the model directs its own process',
      body: `An agent is a model running in a loop: it plans, calls tools, observes results and decides what to do next until it judges the task complete or a stop condition fires. The number and order of steps are not known in advance.

Agents earn their cost when the task is open-ended, the path cannot be scripted and the model can get ground truth from the environment (test results, tool errors, search results). Coding against a failing test suite and multi-source research are the canonical examples.

Agents cost more and are less predictable. Mitigations are architectural, not hopeful: limit iterations, set budgets, restrict tools to the least privilege required, add checkpoints for human approval before irreversible actions, and trace every step. Four ways to build one on Claude: a manual loop, the SDK Tool Runner, Managed Agents (Anthropic runs the loop and sandbox), and the Claude Agent SDK (Claude Code as a library).`,
    },
    {
      heading: 'Choosing: predictability, value and error cost',
      body: `Decide along three axes:

1. **Predictability of the path.** If you can draw the flowchart, build a workflow. If the steps depend on what is discovered along the way, consider an agent.
2. **Value of flexibility.** Does autonomy produce a materially better outcome, or just the same outcome more expensively? Many "agent" requests are really routing plus chaining.
3. **Cost of errors.** Agents can take many actions before a human sees anything. High error cost demands narrow tools, approvals and workflow-style gates even inside an agent.

A heuristic ladder: start with one augmented call → add chaining or routing when quality needs it → parallelize when latency or confidence needs it → use orchestrator-workers when subtasks are dynamic but bounded → use an agent only for open-ended tasks with environmental feedback.

Exam distractors here are "use an agent because it is more capable" when the scenario describes a fixed process, and "use a bigger model" when the real fix is routing or a validation step. The most appropriate pattern is the simplest one that meets the requirement.`,
    },
  ],
  examples: [
    {
      title: 'Routing by complexity to control cost',
      description:
        'A bank\'s internal help desk sees 70% simple FAQ questions and 30% policy interpretations. A Haiku classifier routes each question: simple ones are answered by Haiku with retrieved FAQ passages; complex ones go to Opus with the full policy corpus and higher effort. Cost fell 60% with no measured quality loss on the complex set.',
      language: 'python',
      code: `route = client.messages.create(
    model="claude-haiku-5-5",
    max_tokens=50,
    system="Classify the question as SIMPLE (FAQ lookup) or COMPLEX (policy interpretation). Reply with one word.",
    messages=[{"role": "user", "content": question}],
).content[0].text.strip()

model, effort, context = (
    ("claude-haiku-5-5", "low", faq_passages(question))
    if route == "SIMPLE"
    else ("claude-opus-5-5", "high", policy_corpus(question))
)
answer = client.messages.create(
    model=model, max_tokens=1500,
    output_config={"effort": effort},
    system=ANSWER_PROMPT + context,
    messages=[{"role": "user", "content": question}],
)`,
      takeaway: 'Routing lets you spend the expensive model only where it changes the outcome.',
    },
    {
      title: 'Evaluator-optimizer for regulated marketing copy',
      description:
        'A pharmaceutical company drafts patient-facing material that must satisfy a compliance checklist. One call drafts; a second call with the checklist in context grades each item and lists violations; the draft is revised with the critique, up to three rounds. Compliance review rejections dropped from 40% to 6%. The loop is bounded and each round is logged.',
      takeaway: 'Evaluator-optimizer fits when criteria are explicit and iteration measurably improves output; bound the loop.',
    },
    {
      title: 'Mistake: an agent for a fixed five-step process',
      description:
        'A team built an autonomous agent to onboard vendors: collect documents, validate tax id, check sanctions list, create the ERP record, send a welcome email. The agent sometimes skipped the sanctions check or emailed before the record existed. The process was fixed and known in advance, so it was rebuilt as a prompt chain with deterministic gates between steps; the model is used only for document extraction and the email draft. Errors disappeared and latency halved.',
      takeaway: 'If you can draw the flowchart, build a workflow; autonomy adds risk without value on a fixed process.',
    },
    {
      title: 'Orchestrator-workers for a multi-file refactor',
      description:
        'A coding assistant must rename an internal API across a repository. Which files need changes is unknown until the code is inspected, so an orchestrator model lists affected files and delegates each edit to a worker with only that file in context, then runs the test suite. The overall flow (discover → edit → test) is bounded, but the subtasks are dynamic.',
      takeaway: 'Orchestrator-workers handles dynamic subtasks inside a bounded flow, sitting between a chain and a full agent.',
    },
  ],
  keyPoints: [
    'The augmented LLM (one call plus retrieval, tools and memory) is the building block; many problems need nothing more.',
    'Workflows follow code-defined paths: chaining, routing, parallelization (sectioning or voting), orchestrator-workers, evaluator-optimizer.',
    'Agents decide their own steps in a loop; they fit open-ended tasks with environmental feedback and cost more.',
    'Choose by predictability of the path, value of flexibility and cost of errors.',
    'Use the simplest pattern that meets the requirement; add structure only when a single call demonstrably fails.',
    'Agent risk is mitigated architecturally: iteration limits, budgets, least-privilege tools, approval checkpoints, tracing.',
    'Four ways to build an agent on Claude: manual loop, SDK Tool Runner, Managed Agents, Claude Agent SDK.',
    'Exam distractor: "use an agent" or "use a bigger model" when the scenario describes a fixed process that needs routing or a validation gate.',
  ],
  flashcards: [
    { front: 'What three capabilities define an augmented LLM?', back: 'Retrieval, tools and memory added to a single model call.' },
    { front: 'Workflow vs agent in one sentence each.', back: 'Workflow: code defines the path and the model fills steps. Agent: the model decides the steps in a loop until done.' },
    { front: 'Name the five workflow patterns in Anthropic\'s catalogue.', back: 'Prompt chaining, routing, parallelization, orchestrator-workers, evaluator-optimizer.' },
    { front: 'Two forms of parallelization?', back: 'Sectioning (independent subtasks run concurrently) and voting (same task run several times, results aggregated).' },
    { front: 'When does evaluator-optimizer pay off?', back: 'When explicit evaluation criteria exist and iterating on critique measurably improves the output; bound the number of rounds.' },
    { front: 'How does orchestrator-workers differ from prompt chaining?', back: 'In chaining the subtasks are fixed in advance; in orchestrator-workers a model determines the subtasks at runtime and delegates them.' },
    { front: 'Three axes for choosing a pattern?', back: 'Predictability of the path, value of flexibility, cost of errors.' },
    { front: 'Name four ways to build an agent on the Claude platform.', back: 'Manual loop, SDK Tool Runner (client.beta.messages.tool_runner), Managed Agents, Claude Agent SDK.' },
    { front: 'What architectural mitigations reduce agent risk?', back: 'Iteration limits, cost budgets, least-privilege tools, human approval before irreversible actions, full tracing.' },
  ],
  quiz: [
    {
      question:
        'A vendor-onboarding process has five fixed steps that must run in order, including a mandatory sanctions check. A team proposes an autonomous agent with all five tools. Which design is MOST appropriate?',
      options: [
        'The autonomous agent, with a system prompt instructing it never to skip steps.',
        'A prompt chain with deterministic gates between steps, using the model only for the fuzzy subtasks.',
        'An agent on a larger model with high effort so it follows instructions better.',
        'Parallelization: run all five steps at once to reduce latency.',
      ],
      correct: [1],
      explanation:
        'A fixed, ordered process is a workflow; gates in code guarantee the sanctions check runs. Instructing (1) or enlarging (3) the agent does not enforce order; the steps are dependent, so parallelization (4) is invalid.',
    },
    {
      question:
        'An internal help desk handles 70% simple FAQ questions and 30% complex policy interpretations with one Opus prompt. Cost is too high. Which pattern BEST reduces cost without hurting complex-question quality?',
      options: [
        'Evaluator-optimizer on every question.',
        'Routing: classify first, send simple questions to Haiku and complex ones to Opus.',
        'Lower effort to low for all requests.',
        'Orchestrator-workers with five subagents per question.',
      ],
      correct: [1],
      explanation:
        'Routing spends the expensive model only where it matters. Evaluator-optimizer (1) and orchestrator-workers (4) add cost; lowering effort for all (3) risks complex-question quality.',
    },
    {
      question:
        'Which TWO characteristics make a task a good candidate for an autonomous agent rather than a workflow? (Select two)',
      options: [
        'The sequence of steps cannot be known until intermediate results are seen.',
        'The task is a fixed, well-understood sequence.',
        'The environment provides ground-truth feedback such as test results or tool errors.',
        'Every output must be reviewed by a human before use.',
      ],
      correct: [0, 2],
      explanation:
        'Unpredictable paths and environmental feedback are what agents exploit. A fixed sequence (2) is a workflow; mandatory review of every output (4) is a review-placement concern and argues for tighter control, not autonomy.',
    },
    {
      question:
        'A coding tool must rename an API across a repository, but which files are affected is unknown until inspected. The overall flow is discover → edit → test. Which pattern fits BEST?',
      options: ['Prompt chaining with a fixed file list', 'Routing', 'Orchestrator-workers', 'Voting parallelization'],
      correct: [2],
      explanation:
        'Dynamic subtasks inside a bounded flow is the orchestrator-workers pattern. Chaining needs the subtasks in advance; routing picks one path; voting repeats the same task.',
    },
    {
      question:
        'A team\'s regulated marketing drafts are rejected 40% of the time by compliance against a published checklist. Which pattern MOST directly targets this?',
      options: [
        'Evaluator-optimizer: a critique call grades the draft against the checklist and the draft is revised, bounded to a few rounds.',
        'Switch to a larger model and ask it to be compliant.',
        'Parallel sectioning: write each paragraph with a separate call.',
        'Replace the drafting step with a lookup table.',
      ],
      correct: [0],
      explanation:
        'Explicit criteria plus measurable improvement from iteration is exactly where evaluator-optimizer fits. A bigger model (2) is not a control; sectioning (3) does not check compliance; a lookup table (4) cannot draft copy.',
    },
  ],
  statements: [
    { text: 'An augmented LLM is a single model call enhanced with retrieval, tools and memory.', isTrue: true, explanation: 'It is the building block of every larger pattern.' },
    { text: 'Agents are preferable to workflows whenever the budget allows, because they are more capable.', isTrue: false, explanation: 'Agents cost more and are less predictable. Use the simplest pattern that meets the requirement.' },
    { text: 'In orchestrator-workers the subtasks are determined by a model at runtime rather than fixed in code.', isTrue: true, explanation: 'That is what distinguishes it from prompt chaining.' },
    { text: 'Voting is a form of parallelization in which the same task is run several times and results are aggregated.', isTrue: true, explanation: 'It is used for high-stakes judgments where multiple perspectives raise confidence.' },
    { text: 'The evaluator-optimizer loop should run until the evaluator is fully satisfied, with no round limit.', isTrue: false, explanation: 'Unbounded loops are a cost and latency risk; always bound the rounds and log each.' },
    { text: 'Routing can be used to send easy inputs to a cheaper model and hard inputs to a stronger one.', isTrue: true, explanation: 'Complexity routing is a standard cost-control pattern.' },
    { text: 'Agent risk is best mitigated by a system prompt that tells the model to be careful.', isTrue: false, explanation: 'Mitigations are architectural: iteration limits, budgets, least-privilege tools, approval checkpoints and tracing.' },
  ],
  resources: [
    { label: 'Building effective agents (Anthropic engineering)', url: 'https://www.anthropic.com/engineering/building-effective-agents' },
    { label: 'Agent SDK overview (Claude docs)', url: 'https://platform.claude.com/docs/en/agent-sdk/overview' },
    { label: 'Managed Agents overview (Claude docs)', url: 'https://platform.claude.com/docs/en/managed-agents/overview' },
  ],
};
