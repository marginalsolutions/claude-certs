import type { Concept } from '../../types';

export const communicatingArchitectureDecisions: Concept = {
  id: 'communicating-architecture-decisions',
  title: 'Communicating Architecture Decisions',
  summary:
    'Record decisions as ADRs, lay out tradeoffs in tables stakeholders can argue with, quantify risk and cost in business terms, speak differently to executives and engineers, and say no with evidence when a request conflicts with constraints.',
  certs: ['ccar-p'],
  domains: ['ccar-p-6', 'ccar-p-1'],
  tags: ['communication', 'adr', 'tradeoffs', 'stakeholders', 'decision-records'],
  difficulty: 'advanced',
  sections: [
    {
      heading: 'Architecture Decision Records',
      body: `An **Architecture Decision Record (ADR)** is a short, numbered document that captures one significant decision: the context, the options considered, the decision, and its consequences. ADRs matter more in AI systems than in most software because the decisions are revisited often (model upgrades, new tools, changed compliance rules) and because many stakeholders outside engineering need to understand why the system behaves as it does.

A minimal ADR:

- **Title and status** (proposed, accepted, superseded by ADR-nnn).
- **Context**: the forces at play, with numbers (volume, latency budget, cost cap, compliance rule, eval results).
- **Options considered**: at least two real alternatives, each with its tradeoffs.
- **Decision**: what was chosen and the decisive reason.
- **Consequences**: what gets easier, what gets harder, what must be monitored, and what would cause the decision to be revisited.

Typical AI ADRs: model selection per step, workflow vs agent pattern, RAG chunking strategy, MCP vs direct API integration, where humans sit, platform choice (Claude API vs Bedrock vs Vertex), retention and residency settings, guardrail layers. Keep them in the repository next to the prompts so a change to either shows up in the same review.`,
    },
    {
      heading: 'Tradeoff tables',
      body: `Stakeholders rarely object to a decision; they object to not seeing the alternatives. A **tradeoff table** makes the comparison explicit and lets people argue with the weights rather than the conclusion.

| Option | Quality (eval) | p95 latency | Cost / task | Compliance fit | Operational risk |
|---|---|---|---|---|---|
| Opus 5.5 single call | 94% | 6.1 s | $0.062 | OK | Low |
| Sonnet 5.5 single call | 90% | 3.4 s | $0.028 | OK | Low |
| Haiku 5.5 + Sonnet escalation | 91% | 2.9 s (p95 incl. escalations 4.8 s) | $0.019 | OK | Medium (routing logic, two prompts to maintain) |
| Sonnet 5.5 + human review of low-confidence | 97% effective | 3.4 s + review SLA | $0.028 + $0.31 review | Best (Article 22) | Medium (review capacity) |

Rules: columns are the criteria from the requirements brief, not generic ones; cells hold measured numbers where you have them and labelled estimates where you do not; the recommendation is a row, not a paragraph of persuasion. Include the option you are *not* recommending so the reader can see why. Add a "what would change this" line: "If run volume triples, the escalation design becomes cheaper than single-model Sonnet."`,
    },
    {
      heading: 'Executives vs engineers',
      body: `The same decision needs two framings.

**Executives** want: the business outcome, the cost in dollars and time, the risk in terms of what could go wrong for customers or regulators, and the decision you need from them. Lead with the recommendation and the number; keep the mechanism to one sentence; put the tradeoff table in an appendix. Avoid model names and parameter talk unless asked; say "a faster, lower-cost model for routine cases with a stronger model for complex ones" rather than "Haiku 5.5 with Sonnet 5.5 escalation".

**Engineers** want: the mechanism, the constraints that drove it, the interfaces, the failure modes and how they are detected, and what they are free to change. Give them the ADR, the tradeoff table, the eval results and the monitoring plan. They will distrust a recommendation with no alternatives considered.

Both audiences deserve the same honesty about uncertainty. "Eval accuracy is 94% on 400 cases, which means the true rate is likely between 91% and 97%" is better for everyone than "94%". When a stakeholder wants a guarantee ("it will never hallucinate"), reframe to the controls: "It will be grounded in approved documents, every claim will be cited, and low-confidence answers go to a person. Residual error rate is measured weekly and reported."`,
    },
    {
      heading: 'Quantifying risk and cost, and saying no',
      body: `Risk communicated as adjectives ("some hallucination risk") is ignored. Quantify it: expected frequency × impact, with the control and the residual. "Without the citation check, about 2% of answers contained an unsupported claim in testing; on 50,000 answers a month that is roughly 1,000 incidents. With the check and review routing it fell to 0.2%, about 100, all flagged for review." Cost works the same way: total cost of ownership per completed task, including human review and engineering maintenance, against the baseline process, over a realistic volume.

Sometimes the right answer is **no**, or "not like that". Say it with evidence and an alternative:

- Tie the refusal to a constraint in the signed brief or to a regulation ("the brief caps run cost at $0.40 per ticket; this option costs $1.10").
- Show the tradeoff table with the requested option included, so the reader sees what it would cost.
- Offer the nearest acceptable version ("we can do automatic refunds under $50 with a daily cap and full audit, not unlimited").
- Record the decision in an ADR, including who accepted which risk, so a later incident has a traceable owner.

Exam angle: scenarios reward the architect who presents options with quantified tradeoffs rather than a single recommendation, who adapts the message to the audience without changing the facts, who records decisions, and who declines unsafe requests with a documented rationale and an alternative instead of either caving or stonewalling.`,
    },
  ],
  examples: [
    {
      title: 'An ADR for model selection',
      description:
        'A payments company recorded why it chose a two-tier model strategy for dispute triage. The ADR captures the forces (cost cap, latency SLO, eval results) and the condition under which it would be revisited.',
      language: 'markdown',
      code: `# ADR-014: Two-tier model strategy for dispute triage
Status: Accepted (2026-09-30)  Supersedes: ADR-009

## Context
- 120k disputes / month; brief caps run cost at $0.05 / dispute; p95 < 4 s
- Eval (600 cases): Opus 5.5 94.1%, Sonnet 5.5 90.3%, Haiku 5.5 84.7%
- 62% of disputes are template cases where Haiku 5.5 scores 96%

## Options
1. Sonnet 5.5 for all: 90.3%, $0.028, p95 3.4 s
2. Opus 5.5 for all: 94.1%, $0.062 (over cap), p95 6.1 s (over SLO)
3. Haiku 5.5 with confidence-based escalation to Sonnet 5.5: 92.8%, $0.017, p95 4.6 s incl. escalations

## Decision
Option 3. Meets cost cap with headroom; quality above option 1; p95 slightly over SLO on escalated cases, accepted by Ops (see sign-off).

## Consequences
- Two prompts and a calibrated router to maintain; router re-calibrated on every model change
- Monitor escalation rate (expected 38% +/- 5); alert outside band
- Revisit if escalation rate > 50% or if a new Haiku-tier model closes the quality gap`,
      takeaway: 'An ADR records numbers, alternatives and the trigger for revisiting, so the decision survives staff and model changes.',
    },
    {
      title: 'Same decision, two audiences',
      description:
        'To the CFO: "Routine disputes go to a fast, low-cost model and complex ones to a stronger model. Cost is $0.017 per dispute versus $0.11 today, quality is above the current manual process, and about 100 cases a month will still need a person. I need your approval for the $24k monthly run budget." To the engineering team: the ADR, the router calibration data, the eval per tier, the alert thresholds and the list of what they may change without a new ADR.',
      takeaway: 'Adapt depth and vocabulary to the audience; keep facts and uncertainty identical.',
    },
    {
      title: 'Declining unlimited autonomous refunds',
      description:
        'A product lead asked for the support agent to issue refunds of any amount without approval to hit a resolution-time target. The architect presented the tradeoff table including that option, quantified the exposure (an injection test had succeeded in 3% of adversarial cases; at 20,000 refunds a month that is 600 potentially manipulated refunds), cited the brief\'s non-goal, and proposed refunds under $50 with a daily cap and audit, escalating the rest. The lead accepted; the decision and accepted risk were recorded in an ADR.',
      takeaway: 'Say no with numbers, a reference to agreed constraints, and a viable alternative.',
    },
    {
      title: 'The persuasive memo nobody trusted',
      description:
        'An architect sent a three-page recommendation for a multi-agent design with no alternatives and phrases like "state of the art" and "future-proof". Engineering pushed back, the executive sponsor asked for a second opinion, and the project stalled for a month. A one-page tradeoff table with a simpler workflow option, measured numbers and a "what would change this" line was accepted in a single meeting.',
      takeaway: 'Options with numbers persuade; adjectives without alternatives create distrust.',
    },
  ],
  keyPoints: [
    'An ADR records one decision: context with numbers, real alternatives, the decision and its consequences, including when to revisit it. Keep ADRs next to prompts in the repository.',
    'Tradeoff tables use the criteria from the requirements brief as columns, measured numbers where available, and include the options you are not recommending.',
    'Executives get the outcome, the dollars, the risk to customers and regulators, and the decision you need; engineers get the mechanism, constraints, interfaces, failure modes and freedom to change.',
    'Report uncertainty honestly to both audiences; reframe requests for guarantees into controls and measured residual error.',
    'Quantify risk as frequency × impact with and without controls, and cost as total cost per completed task against the baseline.',
    'Say no with evidence: cite the signed constraint, show the option in the tradeoff table, offer the nearest safe alternative, record who accepted which risk.',
    'Avoid adjectives ("state of the art") in place of measurements; they erode trust.',
  ],
  flashcards: [
    { front: 'What are the sections of a minimal ADR?', back: 'Title and status, context, options considered, decision, consequences (including when to revisit).' },
    { front: 'Why are ADRs especially useful for AI systems?', back: 'Decisions are revisited often (model upgrades, tools, compliance) and many non-engineering stakeholders need to understand the reasoning.' },
    { front: 'What should the columns of a tradeoff table be?', back: 'The criteria from the requirements brief (quality, latency, cost per task, compliance fit, operational risk), not generic ones.' },
    { front: 'How should you lead a message to executives?', back: 'With the recommendation, the business outcome, the dollars, the risk to customers/regulators and the decision you need from them.' },
    { front: 'What do engineers need from an architecture communication?', back: 'Mechanism, constraints, interfaces, failure modes and detection, eval results, and what they may change.' },
    { front: 'How do you respond to "guarantee it will never hallucinate"?', back: 'Reframe to controls (grounding, citations, review routing) and a measured, reported residual error rate.' },
    { front: 'How do you quantify a risk?', back: 'Expected frequency × impact, stated with and without controls, at realistic volume.' },
    { front: 'Four elements of saying no well?', back: 'Cite the agreed constraint, show the option in the tradeoff table, offer a safe alternative, record the decision and the risk owner in an ADR.' },
    { front: 'What is a "what would change this" line?', back: 'A statement of the condition under which the recommendation would flip, e.g. volume tripling or a new model tier.' },
  ],
  quiz: [
    {
      question:
        'An architect must present a model-selection decision to a steering committee of executives. Which opening is MOST effective?',
      options: [
        '"We evaluated Opus 5.5, Sonnet 5.5 and Haiku 5.5 with adaptive thinking and effort settings across 600 cases."',
        '"Routine cases will use a low-cost model and complex ones a stronger model, cutting cost per dispute from $0.11 to $0.017 at higher quality than today; I need approval for a $24k monthly budget."',
        '"The system uses a two-tier architecture with confidence-based routing."',
        '"Our design is state of the art and future-proof."',
      ],
      correct: [1],
      explanation:
        'Executives need the outcome, the money and the decision required. Model names and mechanisms belong in the appendix, and unsupported adjectives erode trust.',
    },
    {
      question:
        'Engineering rejects an architecture recommendation as "hand-wavy". Which addition would MOST improve it?',
      options: [
        'Stronger adjectives describing the benefits.',
        'A tradeoff table with measured quality, latency and cost per option, the alternatives not chosen, and an ADR explaining the decision and its consequences.',
        'A longer executive summary.',
        'Removing the alternatives to make the recommendation clearer.',
      ],
      correct: [1],
      explanation:
        'Engineers trust evidence and visible alternatives. Adjectives, length and hiding alternatives make the problem worse.',
    },
    {
      question: 'Which TWO belong in the "Consequences" section of an ADR? (Select two)',
      options: [
        'What must be monitored because of the decision.',
        'The condition under which the decision should be revisited.',
        'A list of every model Anthropic has ever released.',
        'The personal preferences of the architect.',
      ],
      correct: [0, 1],
      explanation:
        'Consequences cover monitoring obligations and revisit triggers, along with what becomes easier or harder. Exhaustive model lists and personal preferences are not decision content.',
    },
    {
      question:
        'A product lead demands the agent issue unlimited refunds autonomously to hit a speed target. Which response best reflects professional architecture communication?',
      options: [
        'Agree, since the product lead owns the roadmap.',
        'Refuse without explanation.',
        'Quantify the exposure from adversarial testing, cite the signed brief\'s non-goal, present the option in the tradeoff table, propose capped refunds with audit, and record the decision and risk owner in an ADR.',
        'Escalate to the CEO immediately.',
      ],
      correct: [2],
      explanation:
        'Saying no well means evidence, reference to agreed constraints, an alternative and a documented decision. Caving, stonewalling or jumping the chain of command are all weaker.',
    },
    {
      question:
        'A stakeholder asks the architect to guarantee the assistant "will never give a wrong answer". What is the BEST reply?',
      options: [
        '"Yes, with the most capable model it will be perfect."',
        '"That cannot be guaranteed by any system; here are the controls (grounding, citations, review routing) and the measured residual error rate we will report weekly."',
        '"Wrong answers are not our responsibility."',
        '"We will add a disclaimer."',
      ],
      correct: [1],
      explanation:
        'Honest reframing to controls and measured residual error builds trust and sets correct expectations. Promising perfection, disclaiming responsibility or relying on disclaimers do not.',
    },
    {
      question:
        'Two years from now a new team must decide whether to change the chunking strategy of a RAG system. Which artifact MOST helps them?',
      options: [
        'The Slack thread where it was discussed.',
        'An ADR recording the context, the options considered, the decision and the conditions for revisiting it.',
        'The current prompt text alone.',
        'The vendor\'s marketing page.',
      ],
      correct: [1],
      explanation:
        'ADRs preserve the reasoning so later teams can see whether the forces have changed. Chat threads are hard to find, prompts do not explain why, and marketing is not evidence.',
    },
  ],
  statements: [
    { text: 'An ADR should include at least two real alternatives to the chosen option.', isTrue: true, explanation: 'Visible alternatives are what make the decision credible and reviewable.' },
    { text: 'Executives should receive the same level of mechanism detail as engineers to ensure transparency.', isTrue: false, explanation: 'Adapt depth and vocabulary to the audience while keeping facts and uncertainty identical.' },
    { text: 'A tradeoff table should include the option the architect does not recommend.', isTrue: true, explanation: 'Readers need to see why it lost.' },
    { text: 'Stating eval accuracy as a point estimate without a range is best because it is clearer.', isTrue: false, explanation: 'Honest uncertainty (e.g. 94% on 400 cases, likely 91–97%) is better for every audience.' },
    { text: 'Declining a request should be accompanied by a reference to an agreed constraint and an alternative.', isTrue: true, explanation: 'Saying no with evidence and an option preserves the relationship and the system\'s safety.' },
    { text: 'Risk is best communicated with qualitative labels such as "some" or "moderate".', isTrue: false, explanation: 'Quantify as frequency × impact with and without controls at realistic volume.' },
    { text: 'ADRs should be stored in the repository alongside prompts and configuration.', isTrue: true, explanation: 'Changes to either then appear in the same review.' },
  ],
  resources: [
    { label: 'Building effective agents (Anthropic)', url: 'https://www.anthropic.com/research/building-effective-agents' },
    { label: 'Choosing a model (Claude docs)', url: 'https://platform.claude.com/docs/en/about-claude/models/choosing-a-model' },
  ],
};
