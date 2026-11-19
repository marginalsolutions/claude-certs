import type { Concept } from '../../types';

export const businessProblemToAiSolution: Concept = {
  id: 'business-problem-to-ai-solution',
  title: 'From Business Problem to AI Solution',
  summary:
    'Find the real problem behind the request, decide whether an LLM is the right tool, define measurable success, and tie the design to the value pillars the business will actually pay for.',
  certs: ['ccar-p', 'ccao-f'],
  domains: ['ccar-p-1', 'ccar-p-6', 'ccao-f-4'],
  tags: ['discovery', 'business-value', 'fit-assessment', 'metrics', 'build-vs-buy'],
  difficulty: 'advanced',
  sections: [
    {
      heading: 'Discovery: find the problem behind the request',
      body: `Most requests arrive as a solution: "we want a chatbot", "we need an agent that reads contracts". The architect's first job is to recover the problem underneath. Ask what decision or action is slow, expensive or error-prone today, who feels the pain, how often, and what it costs when it goes wrong.

A useful discovery structure:

| Question | Why it matters |
|---|---|
| What happens today, step by step? | Reveals the real bottleneck, which is often not where the stakeholder points |
| What is the volume and variance? | 50 contracts a month with 3 templates is a different system from 50,000 a month in 40 formats |
| What does a wrong answer cost? | Sets the human-review and guardrail budget |
| Who owns the data and the process? | Exposes integration, compliance and change-management constraints |
| How will we know it worked? | Forces a metric before any design |

Write the problem statement in the stakeholder's language and have them confirm it. If you cannot state the cost of the current process, you cannot later claim an improvement.`,
    },
    {
      heading: 'Fit assessment: is an LLM the right tool?',
      body: `Claude is a good fit when inputs are unstructured or variable (free text, documents, images, conversations), when the task requires judgment that is hard to encode as rules, and when some error rate is acceptable or can be caught by review. It is a poor fit when the task is already deterministic (a lookup, a calculation, a fixed transformation), when the business cannot tolerate any error and no review is possible, or when the real problem is missing or bad data.

A practical test: could a competent new employee do this task with a written procedure and access to the same systems? If yes, an LLM plus tools is plausible. If even an expert would need information the system cannot provide, no model will succeed.

Also check the shape of the solution:

- **Deterministic core, LLM at the edges.** Often the best design uses Claude only for the fuzzy parts (classification, extraction, drafting) and conventional code for the rest. See the decomposition concept.
- **Prototype before committing.** A one-day prototype on 50 real examples tells you more about feasibility than weeks of design. Measure accuracy on those examples and extrapolate honestly.
- **Name the non-AI alternatives.** A better form, a rules engine or a process change may solve the problem more cheaply. Architects are paid to say so.`,
    },
    {
      heading: 'Success metrics and value pillars',
      body: `Every solution should map to at least one business value pillar, and each pillar needs a metric with a baseline and a target:

| Pillar | Typical metric | Example target |
|---|---|---|
| Efficiency | Handle time, cycle time, cost per case | Reduce average claim-processing time from 3 days to 4 hours |
| Productivity | Output per person, backlog size | Engineers close 30% more tickets per sprint |
| Cost | Fully loaded cost per transaction, including model spend | Cost per support contact below $0.40 including review |
| Transformation | New capability or revenue, not just speed | Offer same-day contract review to SMB customers for the first time |
| Performance SLAs | p95 latency, availability, accuracy floor | p95 under 4 s, 99.9% availability, extraction accuracy above 97% |

Pick leading indicators you can measure in weeks (accuracy on an eval set, deflection rate, time saved per task) and lagging ones for the business case (cost per case, revenue). Define the metric before the design so the evaluation framework and observability can be built to produce it. A project without a measurable target cannot be declared a success or a failure; it just drifts.`,
    },
    {
      heading: 'Build vs buy and the exam angle',
      body: `Three options exist for most problems:

1. **Buy a packaged product** (for example Claude.ai with Projects and connectors, or a vendor's vertical application). Fastest, lowest engineering cost, least control over data flow and behaviour.
2. **Compose on a managed platform** (Claude API with Managed Agents, Agent SDK, Skills, MCP servers you already have). Moderate effort, strong control, most lifecycle work handled for you.
3. **Build a custom stack** (your own loop, retrieval, evaluation and observability). Maximum control; you own every operational burden.

Decide by differentiation and constraints: build only what differentiates you or what compliance forces you to own. Hosted and third-party platforms (Amazon Bedrock, Google Cloud Vertex AI, Microsoft Foundry) matter when data residency, existing cloud contracts or procurement rules dictate where inference runs.

Exam items in this area describe a stakeholder request and ask for the architect's most appropriate first move. The right answer is almost always to clarify the problem, quantify the current state and define success before choosing a model or pattern. Distractors jump to a technology ("use the largest model", "build an agent") or solve a different problem than the one described.`,
    },
  ],
  examples: [
    {
      title: 'The chatbot that should have been a form',
      description:
        'A retailer asked for a Claude-powered chatbot to "reduce support volume". Discovery showed 60% of contacts were order-status questions whose answers were already in the order system but not visible to customers. The architect recommended an order-status page and a tracking email first, then a Claude assistant for the remaining 40% of genuinely unstructured questions. Volume dropped by half before any model was deployed.',
      takeaway: 'Discovery finds the cheapest fix; an LLM is only justified for the part of the problem that needs judgment.',
    },
    {
      title: 'Writing the problem statement with metrics',
      description:
        'A bank wanted to "use AI for KYC document review". After discovery the architect wrote: "Analysts spend 25 minutes per onboarding file checking 6 document types for 14 fields. Backlog is 3,000 files. Target: an extraction and consistency-check pipeline with analyst review that reduces time to 8 minutes per file at 98% field accuracy, p95 under 60 seconds per file, cost under $0.30 per file." Every later design decision was traceable to one of those numbers.',
      language: 'markdown',
      code: `## Problem statement (confirmed with Ops lead 2026-10-03)
- Current: 25 min/file, 3,000 file backlog, 2.1% field error rate (manual)
- Target: 8 min/file, >= 98% field accuracy, p95 < 60 s/file, < $0.30/file
- Pillars: efficiency (time), cost (per file), SLA (p95, accuracy floor)
- Out of scope: sanctions screening (separate system of record)
- Error cost: a missed field delays onboarding; a wrong field is a compliance finding
  -> all 14 fields are reviewed by an analyst before submission`,
      takeaway: 'A problem statement with baseline, target, pillars, scope and error cost is the contract the architecture must satisfy.',
    },
    {
      title: 'Mistake: proving feasibility on a synthetic sample',
      description:
        'A team validated a contract-clause extractor on 20 vendor-provided sample contracts, achieved 99%, and committed to a 6-month rollout. Real contracts included scanned faxes, handwritten amendments and non-English addenda; accuracy fell to 71%. The fix was to pull 200 real, de-identified documents from the last quarter, stratified by source and format, and re-run the feasibility test before sizing the project.',
      takeaway: 'Feasibility must be measured on representative production data, not on clean samples.',
    },
    {
      title: 'Choosing buy over build for a non-differentiating task',
      description:
        'An insurer considered building a custom meeting-summarisation pipeline for claims adjusters. The architect pointed out it was not a differentiator, that Claude.ai Projects with the existing calendar connector met the need, and that the engineering team\'s time was better spent on the claims-triage system where accuracy directly affected payouts. The build budget was redirected.',
      takeaway: 'Build what differentiates or what compliance forces you to own; buy or compose the rest.',
    },
  ],
  keyPoints: [
    'Recover the problem behind the requested solution: who is slow, how often, and what a wrong answer costs.',
    'An LLM fits unstructured, variable, judgment-heavy tasks where some error can be tolerated or caught; it does not fit deterministic tasks or missing-data problems.',
    'Prototype on real, representative data before sizing a project.',
    'Map every solution to value pillars (efficiency, productivity, cost, transformation, performance SLAs) with baseline and target metrics.',
    'Define success metrics before design so evaluation and observability can produce them.',
    'Build only what differentiates or what compliance forces you to own; otherwise buy or compose on managed platforms.',
    'Third-party platforms (Bedrock, Vertex AI, Foundry) are chosen for residency, contracts and procurement, not capability.',
    'On the exam, the best first move is to clarify and quantify the problem, not to pick a model or pattern.',
  ],
  flashcards: [
    { front: 'What is the first job of an architect receiving a request phrased as a solution ("we want a chatbot")?', back: 'Recover the underlying problem: who is slow or error-prone, how often, and what a wrong outcome costs.' },
    { front: 'Name the five business value pillars listed in the CCAR-P blueprint.', back: 'Efficiency, transformation, productivity, cost, performance SLAs.' },
    { front: 'Give a quick test for whether an LLM can plausibly do a task.', back: 'Could a competent new employee do it with a written procedure and the same system access? If even an expert lacks the needed information, no model will succeed.' },
    { front: 'Why must success metrics be defined before the design?', back: 'So the evaluation framework and observability can be built to produce them; otherwise the project cannot be judged a success or failure.' },
    { front: 'What distinguishes a leading indicator from a lagging one in an AI project?', back: 'Leading: measurable in weeks (eval accuracy, deflection rate). Lagging: business outcomes (cost per case, revenue) that take quarters.' },
    { front: 'When is an LLM a poor fit?', back: 'Deterministic tasks (lookups, calculations), zero-error-tolerance with no review possible, or problems caused by missing or bad data.' },
    { front: 'What is the build-vs-buy rule of thumb for Claude solutions?', back: 'Build only what differentiates you or what compliance forces you to own; buy or compose on managed platforms for the rest.' },
    { front: 'Why should feasibility be tested on production data rather than vendor samples?', back: 'Production data contains the formats, noise and edge cases that determine real accuracy; clean samples overstate feasibility.' },
    { front: 'What is a typical reason to choose Bedrock, Vertex AI or Foundry over the first-party API?', back: 'Data residency, existing cloud contracts and procurement rules, not model capability.' },
  ],
  quiz: [
    {
      question:
        'A VP of Operations asks an architect to "build an AI agent that processes all incoming invoices". No metrics or current-state analysis exist. What is the MOST appropriate first step?',
      options: [
        'Select Claude Opus 5.5 and design an agentic loop with invoice tools.',
        'Map the current invoice process, measure volume, time and error cost, and define a target metric with the VP.',
        'Build a RAG index over historical invoices so the agent has context.',
        'Ask the finance team which vendor products they have evaluated.',
      ],
      correct: [1],
      explanation:
        'Discovery and a measurable target must come before any technology choice. Picking a model or building retrieval (options 1 and 3) solves an undefined problem; asking about vendor products (4) skips the problem definition too.',
    },
    {
      question:
        'A hospital network wants to use Claude to compute patient medication dosages from weight and age. Which assessment is MOST accurate?',
      options: [
        'A good fit, because Claude can read patient records.',
        'A poor fit for the calculation itself: dosage is a deterministic formula that should be coded, with Claude at most extracting inputs from unstructured notes for a clinician to confirm.',
        'A good fit if a larger model with high effort is used.',
        'A poor fit because Claude cannot process numbers.',
      ],
      correct: [1],
      explanation:
        'Deterministic, zero-error-tolerance calculations belong in code. Claude may help at the fuzzy edges (extracting inputs from notes) with human confirmation. A bigger model (3) does not change the fit; option 4 misstates model capability.',
    },
    {
      question:
        'Which TWO elements must a problem statement contain for the architecture to be judged a success later? (Select two)',
      options: [
        'A baseline measurement of the current process.',
        'The model id that will be used.',
        'A target metric tied to a business value pillar.',
        'A list of MCP servers to integrate.',
      ],
      correct: [0, 2],
      explanation:
        'Baseline and target are what make success measurable. Model ids and MCP servers are design decisions that follow from the problem statement, not part of it.',
    },
    {
      question:
        'A team validated a document extractor at 99% on 20 clean vendor samples and now reports 71% in production. What was the root cause?',
      options: [
        'The production model version drifted.',
        'The feasibility test used non-representative data; production documents include scans, handwriting and other formats.',
        'The context window was too small for production documents.',
        'Prompt caching returned stale results.',
      ],
      correct: [1],
      explanation:
        'A large gap between a clean sample and production almost always means the sample did not represent production. Model drift (1) would not produce such a specific gap; context window (3) is unlikely with 1M-token windows; caching (4) does not return stale answers, it reuses a processed prefix.',
    },
    {
      question:
        'A mid-sized company needs meeting summaries for its sales team. It has no AI engineers and the task is not a differentiator. Which recommendation BEST fits?',
      options: [
        'Build a custom summarisation pipeline with evaluation and observability.',
        'Use a packaged Claude product (Claude.ai with Projects and connectors) and spend engineering budget elsewhere.',
        'Train a custom model on past meeting notes.',
        'Deploy a multi-agent system with a coordinator and summariser subagents.',
      ],
      correct: [1],
      explanation:
        'Non-differentiating tasks with no engineering capacity are a buy decision. Custom pipelines, custom training and multi-agent systems (1, 3, 4) add cost and operational burden without business value.',
    },
    {
      question:
        'An architect proposes a Claude solution that cuts claim handling time from 3 days to 4 hours. Under which value pillar does this PRIMARILY fall?',
      options: ['Transformation', 'Efficiency', 'Compliance', 'Performance SLA'],
      correct: [1],
      explanation:
        'Reducing cycle time of an existing process is efficiency. Transformation means a new capability or revenue; performance SLA is about latency and availability targets; compliance is not one of the blueprint\'s value pillars.',
    },
  ],
  statements: [
    { text: 'The architect\'s first task on a new request is to choose the model tier that fits the budget.', isTrue: false, explanation: 'The first task is discovery: understand the problem, quantify the current state and define success. Model choice follows.' },
    { text: 'A task is a plausible LLM fit if a competent new employee could do it with a written procedure and the same system access.', isTrue: true, explanation: 'This heuristic checks that the needed information and judgment are available; if an expert could not do it either, no model can.' },
    { text: 'Performance SLAs such as p95 latency and availability are one of the business value pillars in the CCAR-P blueprint.', isTrue: true, explanation: 'The blueprint lists efficiency, transformation, productivity, cost and performance SLAs.' },
    { text: 'Feasibility prototypes should use the cleanest available examples so the model\'s capability is measured without noise.', isTrue: false, explanation: 'Clean samples overstate feasibility. Use real, representative, stratified production data.' },
    { text: 'Choosing Amazon Bedrock or Vertex AI over the first-party API is usually driven by data residency and procurement rather than model capability.', isTrue: true, explanation: 'The same Claude models are served; the platform choice is about where inference runs and existing contracts.' },
    { text: 'If a solution is not a differentiator for the business, building a custom stack is still preferable because it offers full control.', isTrue: false, explanation: 'Full control brings full operational burden. Build only what differentiates or what compliance requires; buy or compose otherwise.' },
    { text: 'Success metrics can be defined after the pilot, once the team sees what the model is good at.', isTrue: false, explanation: 'Metrics must be defined before design so evaluation and observability can measure them; defining them afterwards invites moving the goalposts.' },
  ],
  resources: [
    { label: 'Define your success criteria (Claude docs)', url: 'https://platform.claude.com/docs/en/test-and-evaluate/define-success' },
    { label: 'Building effective agents (Anthropic engineering)', url: 'https://www.anthropic.com/engineering/building-effective-agents' },
    { label: 'Models overview', url: 'https://platform.claude.com/docs/en/about-claude/models/overview' },
  ],
};
