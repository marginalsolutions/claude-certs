import type { Concept } from '../../types';

export const workflowsVsAgents: Concept = {
  id: 'workflows-vs-agents',
  title: 'Workflows vs Agents',
  summary:
    'Decide whether a task needs a predefined workflow or a model-driven agent using four criteria: complexity, value, viability and cost of error. Start with the simplest design that works.',
  certs: ['ccdv-f', 'ccar-f', 'ccar-p'],
  domains: ['ccdv-f-1', 'ccar-f-1', 'ccar-p-1'],
  tags: ['agents', 'workflows', 'architecture', 'design'],
  difficulty: 'foundations',
  diagram: 'workflow-vs-agent',
  sections: [
    {
      heading: 'Two ways to put an LLM in a system',
      body: `Anthropic's vocabulary separates two architectures that both use Claude but differ in **who decides what happens next**.

- A **workflow** is code you wrote. The LLM is called at fixed points along a path your program defines: classify, then extract, then summarize. Control flow lives in your code; Claude fills in the steps.
- An **agent** is a loop in which Claude decides. You give it a goal, tools and a stopping condition; it chooses which tool to call, reads the result, and decides the next action until the job is done.

Both sit on top of the same building block, the **augmented LLM**: a model call with tools, retrieval and memory attached. The question is how much of the control flow you hand to the model.

Workflows are predictable, cheap to run and easy to test because every path is visible in your code. Agents are flexible and handle open-ended problems, but they cost more tokens, take longer, and fail in ways that are harder to reproduce. Neither is better in general; the exam tests whether you can pick the right one for a given situation.`,
    },
    {
      heading: 'The four decision criteria',
      body: `Anthropic's guidance reduces the choice to four questions. Ask them in order.

| Criterion | Ask | Points toward an agent when... |
|---|---|---|
| **Complexity** | Can I draw the steps in advance? | The path depends on what is discovered along the way; there are too many branches to enumerate. |
| **Value** | Is the outcome worth the extra tokens, latency and engineering? | Each run has high value (a resolved incident, a merged refactor) that justifies the cost of exploration. |
| **Viability** | Can the model actually do this well? | The capability has been prototyped and validated on representative cases, not just assumed. |
| **Cost of error** | What happens when it goes wrong? | Mistakes are cheap, reversible or caught by review; or you can constrain the agent with read-only tools, sandboxes and approval gates. |

If the steps are known, the task is routine, or an error is expensive and hard to catch, build a workflow. If the task is genuinely open-ended, valuable and recoverable, an agent earns its cost.

A common exam trap: a scenario describes a fixed three-step pipeline (fetch, classify, file a ticket) and offers an "autonomous agent" as the sophisticated-sounding answer. The predictable path and low per-item value make it a workflow.`,
    },
    {
      heading: 'Start simple, add autonomy only when needed',
      body: `The guidance is explicit: find the simplest solution possible and only increase complexity when it is demonstrably needed. The usual ladder:

1. **Single call** with a good prompt, retrieval and examples. Many "agent" ideas are solved here.
2. **Workflow** of several calls (chaining, routing, parallelization) when one call cannot hold the whole task or when steps need different prompts or models.
3. **Agent** when the model must decide the sequence of actions at runtime.

Each rung adds latency and cost and makes behavior harder to evaluate. Moving up the ladder should be driven by measured failure at the lower rung, not by ambition. The same principle applies inside an agent: prefer a small, well-described tool set over a large one, and use programmatic guardrails (hooks, prerequisites, scoped permissions) rather than trusting the model to follow every rule.

For architects, this maps onto business value pillars: a workflow that reliably automates a known process usually delivers efficiency; an agent is the right bet when the goal is transformation of work that could not previously be automated at all.`,
    },
    {
      heading: 'Mixing the two',
      body: `Real systems are rarely pure. Common hybrids:

- **Workflow with an agentic step.** A deterministic pipeline hands one hard, open-ended sub-problem (for example "investigate why this test fails") to a bounded agent, then continues deterministically.
- **Agent with workflow guardrails.** An agent chooses actions freely, but hooks enforce ordering (identity verification before a refund) and a deterministic post-processing step validates the output.
- **Routing in front of both.** A classifier sends easy requests down a cheap workflow and escalates ambiguous ones to an agent or a human.

The exam often phrases this as "which parts must be deterministic?" Anything involving compliance, money, deletion or irreversible side effects is a candidate for code or hooks, not prompt instructions, because prompt-based compliance has a non-zero failure rate.`,
    },
  ],
  examples: [
    {
      title: 'Invoice processing: a workflow',
      description:
        'A finance team wants to extract fields from 5,000 vendor invoices a day and post them to an ERP. The steps never change: OCR, extract fields with a schema, validate totals, post. Cost of error is high (wrong payments) but errors are easy to catch with validation rules. A fixed workflow with structured output and validation is the right fit; an agent would add cost and unpredictability for no gain.',
      language: 'python',
      code: `# Step 2 of a fixed pipeline: extraction with a schema, no agent loop
response = client.messages.create(
    model="claude-opus-5-5",
    max_tokens=2048,
    messages=[{"role": "user", "content": [
        {"type": "document", "source": {"type": "base64", "media_type": "application/pdf", "data": pdf_b64}},
        {"type": "text", "text": "Extract the invoice fields."},
    ]}],
    output_config={"format": {"type": "json_schema", "schema": INVOICE_SCHEMA}},
)
invoice = json.loads(response.content[0].text)
validate_totals(invoice)      # deterministic check, then post to ERP`,
      takeaway: 'Known steps plus checkable outputs means a workflow, even when the stakes are high.',
    },
    {
      title: 'Incident triage: an agent',
      description:
        'An SRE team wants help diagnosing production alerts. Each incident is different: the right next step depends on what the logs, metrics and recent deploys reveal. The path cannot be drawn in advance (complexity), each resolved incident is valuable (value), prototypes show Claude navigates the tooling well (viability), and the agent only has read-only tools plus a "propose remediation" output that a human approves (cost of error contained). This is a textbook agent.',
      takeaway: 'Open-ended investigation with contained blast radius is where agents pay off.',
    },
    {
      title: 'The mistake: an agent for a known path',
      description:
        'A team built a "support agent" with twelve tools to handle password resets. Latency was 40 seconds, cost per ticket was 15x the original script, and occasionally the agent skipped the identity check. The fix was a workflow: a classifier confirms the intent, code enforces identity verification, and a single Claude call drafts the reply. Latency dropped to 3 seconds and the identity step became impossible to skip.',
      language: 'text',
      code: `Before: user -> agent(12 tools, free choice) -> ??? -> reply
After:  user -> classify -> verify_identity() [code] -> reset() [code]
             -> Claude drafts reply -> send`,
      takeaway: 'When the steps are known and one of them must never be skipped, put the control flow in code.',
    },
  ],
  keyPoints: [
    'Workflow: your code decides the sequence of LLM calls. Agent: the model decides its next action in a loop.',
    'Four decision criteria: complexity (can the steps be drawn in advance?), value (is the outcome worth the cost?), viability (has the model been shown to do it?), cost of error (how bad and how recoverable is a mistake?).',
    'Start with a single well-crafted call, move to a workflow, and only then to an agent, driven by measured need.',
    'Agents trade predictability, cost and latency for flexibility on open-ended tasks.',
    'Steps that must never be skipped (identity checks, money movement, deletion) belong in code or hooks, not prompt instructions.',
    'Hybrids are normal: workflows with one agentic step, or agents wrapped in deterministic guardrails.',
    'Exam distractor: picking the "autonomous agent" for a task whose steps are fixed and routine.',
  ],
  flashcards: [
    { front: 'What distinguishes a workflow from an agent?', back: 'In a workflow your code defines the sequence of LLM calls; in an agent the model decides its next action at runtime inside a loop.' },
    { front: 'Name the four criteria for choosing an agent over a workflow.', back: 'Complexity, value, viability, cost of error.' },
    { front: 'What does the "complexity" criterion ask?', back: 'Whether the steps can be specified in advance. If yes, a workflow; if the path depends on discoveries along the way, an agent.' },
    { front: 'What does the "viability" criterion ask?', back: 'Whether the model has been shown (through prototyping and evals) to perform the task well, rather than assumed to.' },
    { front: 'How do you reduce the "cost of error" for an agent?', back: 'Read-only or scoped tools, sandboxes, approval gates for irreversible actions, and human review of outputs.' },
    { front: 'What is the "augmented LLM"?', back: 'The basic building block: a model call enhanced with tools, retrieval and memory. Both workflows and agents are built from it.' },
    { front: 'What is the recommended order of escalation when designing?', back: 'Single call → workflow → agent, moving up only when the simpler option demonstrably fails.' },
    { front: 'Why should compliance steps be enforced in code or hooks rather than prompts?', back: 'Prompt-based compliance is probabilistic and has a non-zero failure rate; code and hooks give a deterministic guarantee.' },
    { front: 'Give a typical hybrid architecture.', back: 'A deterministic pipeline that delegates one open-ended sub-problem to a bounded agent, then continues deterministically.' },
  ],
  quiz: [
    {
      question:
        'A team must process 20,000 customer feedback records per day: classify sentiment, extract the product mentioned, and write a row to a database. The steps are identical for every record. Which architecture best fits?',
      options: [
        'An autonomous agent with database tools so it can decide how to handle each record.',
        'A fixed workflow that makes one or two Claude calls per record and writes the row in code.',
        'A multi-agent system with a coordinator and one subagent per step.',
        'A single agent with extended thinking at maximum effort to improve accuracy.',
      ],
      correct: [1],
      explanation:
        'The steps are known in advance and routine, so a workflow is predictable and far cheaper. An agent (A, D) adds cost and variability with no benefit, and a multi-agent system (C) is unnecessary complexity for a linear pipeline.',
    },
    {
      question:
        'Which TWO situations most strongly justify building an agent rather than a workflow? (Select two)',
      options: [
        'The task path depends on what is discovered at each step and cannot be enumerated beforehand.',
        'The task runs millions of times a day on near-identical inputs.',
        'Each completed task is high value and prototypes show the model handles the domain well.',
        'The team wants to avoid writing any validation code.',
      ],
      correct: [0, 2],
      explanation:
        'Complexity (unknown path) and value plus viability are the criteria that point to an agent. High-volume identical inputs (B) favor a workflow. Avoiding validation (D) is never a design justification; agents need more guardrails, not fewer.',
    },
    {
      question:
        'A customer-service agent occasionally issues a refund before verifying the customer\'s identity, despite a clear system prompt instruction. What is the most appropriate fix?',
      options: [
        'Repeat the instruction in capital letters at the start and end of the system prompt.',
        'Enforce the prerequisite in code or a hook so the refund tool cannot run until verification has completed.',
        'Switch to a larger model that follows instructions more reliably.',
        'Log every refund so misuse can be audited later.',
      ],
      correct: [1],
      explanation:
        'Deterministic compliance requires programmatic enforcement. Stronger prompting (A) and a bigger model (C) lower but do not eliminate the failure rate. Logging (D) detects the problem after the money has moved.',
    },
    {
      question: 'What does Anthropic recommend as the starting point when designing an LLM system?',
      options: [
        'A coordinator agent with specialized subagents, since most tasks eventually need them.',
        'The simplest solution that could work, often a single well-crafted call, adding complexity only when it is shown to be needed.',
        'An agent with a broad tool set so it can handle unexpected requests.',
        'A workflow with at least five stages to maximize control.',
      ],
      correct: [1],
      explanation:
        'The guidance is to start simple and escalate only on measured need. Options A, C and D all begin with complexity that may never be justified.',
    },
    {
      question:
        'An architect is deciding whether an agent should be allowed to run database migrations autonomously. Which criterion is she primarily evaluating?',
      options: ['Complexity', 'Value', 'Viability', 'Cost of error'],
      correct: [3],
      explanation:
        'Running migrations is irreversible and high impact, so the question is about what happens when the agent is wrong. That is the cost-of-error criterion, which typically leads to approval gates or keeping the step deterministic.',
    },
  ],
  statements: [
    { text: 'In a workflow, the model decides which step to execute next.', isTrue: false, explanation: 'In a workflow your code defines the sequence; the model decides the next action only in an agent.' },
    { text: 'The four criteria for choosing an agent are complexity, value, viability and cost of error.', isTrue: true, explanation: 'These are the questions to ask, in order, before accepting the extra cost of an agent.' },
    { text: 'Agents are generally cheaper and faster than workflows for the same task.', isTrue: false, explanation: 'Agents usually cost more tokens and time because they explore; their advantage is flexibility, not efficiency.' },
    { text: 'A well-written system prompt is sufficient to guarantee that an agent never skips a compliance step.', isTrue: false, explanation: 'Prompt-based compliance is probabilistic. Guaranteed ordering requires hooks or code-level prerequisites.' },
    { text: 'Anthropic recommends starting with the simplest viable solution and adding agentic complexity only when it is demonstrably needed.', isTrue: true, explanation: 'Single call, then workflow, then agent, each step justified by measured failure of the previous one.' },
    { text: 'A workflow can contain a bounded agentic step for one open-ended sub-problem.', isTrue: true, explanation: 'Hybrids are common: deterministic stages around a constrained agent.' },
    { text: 'High volume of near-identical inputs is a strong signal to build an agent.', isTrue: false, explanation: 'Repetitive, predictable work favors a workflow; agents are for paths that cannot be enumerated in advance.' },
  ],
  resources: [
    { label: 'Building effective agents (Anthropic)', url: 'https://www.anthropic.com/research/building-effective-agents' },
    { label: 'Agents and tools overview (Claude docs)', url: 'https://platform.claude.com/docs/en/agents-and-tools/overview' },
  ],
};
