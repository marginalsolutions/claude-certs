import type { Concept } from '../../types';

export const structuredDiscoveryAndRequirements: Concept = {
  id: 'structured-discovery-and-requirements',
  title: 'Structured Discovery and Requirements',
  summary:
    'Run discovery that turns a vague request ("add AI to support") into a requirements brief: the workflow as it really runs, measurable success criteria, hard constraints on budget, SLA and compliance, explicit non-goals, and the evidence needed to decide whether Claude is the right tool at all.',
  certs: ['ccar-p', 'ccdv-f'],
  domains: ['ccar-p-6', 'ccar-p-1', 'ccdv-f-2'],
  tags: ['discovery', 'requirements', 'stakeholders', 'workflow-mapping', 'success-criteria'],
  difficulty: 'advanced',
  sections: [
    {
      heading: 'Why discovery is an architecture activity',
      body: `Most failed AI projects fail before design: the team built the wrong thing well. Discovery is where the architect learns what the business actually does, what "better" would mean in numbers, and what constraints will shape every later decision. Skipping it produces demos that impress and systems that nobody uses.

Discovery has four outputs:

1. A **workflow map** of the current process, with volumes, time per step, error rates and hand-offs.
2. **Success criteria** that are measurable and agreed, with a baseline.
3. **Constraints**: budget, latency and availability targets, compliance and data boundaries, integration points, timeline, team skills.
4. **Scope and non-goals**: what the first release does and, as importantly, what it deliberately does not.

These feed directly into Domain 1 (pattern selection), Domain 4 (metrics and eval design) and Domain 5 (risk register). A requirements brief that cannot answer "how will we know it worked?" or "what data can the model see?" is not finished.`,
    },
    {
      heading: 'Discovery interviews and workflow mapping',
      body: `Interview three kinds of people and expect them to disagree:

- **Sponsors** (why this, why now, what budget, what would make them cancel it).
- **Operators** who do the work today (what the steps really are, where time goes, what the exceptions look like, what information they use that is not in any system).
- **Downstream consumers** of the output (what format they need, what errors cost them, how fast they need it).

Questions that surface architecture-relevant facts: "Show me the last five cases you handled." "What do you do when the information is missing?" "How often is the input wrong?" "Who can see this data today?" "What happens if the answer is wrong and nobody notices for a week?" "What would you never want the system to do on its own?"

Map the workflow as it **runs**, not as the process document says. Annotate each step with volume, duration, error rate, decision points and systems touched. The map reveals where an LLM adds value (unstructured input, judgment-heavy drafting, synthesis across sources), where deterministic code is better (lookups, calculations, rules), and where a human must stay (irreversible, regulated, high-value). It also exposes the integration surface: every system on the map is an API, tool or data source you will need.`,
    },
    {
      heading: 'Success criteria and constraints',
      body: `Translate the sponsor's goal into measurable criteria with a baseline:

| Vague goal | Measurable criterion |
|---|---|
| "Faster support" | Median first-response time from 4 h to under 10 min; resolution without escalation from 35% to 55% |
| "Fewer errors" | Field-level extraction accuracy ≥ 97% on the golden set; incorrect-resolution rate ≤ 3% |
| "Save money" | Cost per handled ticket (model plus human) below $1.20, baseline $4.10 |
| "Better quality" | Reviewer edit rate below 10%; CSAT ≥ 4.3 |

For each criterion record how it will be measured, by whom and how often; that is the seed of the eval and monitoring design.

Then collect constraints, and treat them as hard until someone with authority relaxes them:

- **Budget**: build budget, run-rate budget per month or per task, who pays.
- **SLA / SLO**: latency (p95), availability, throughput at peak, acceptable degradation.
- **Compliance and data**: data classifications involved, residency, retention, agreements in place (DPA, BAA), who may see outputs, audit requirements.
- **Integration**: systems of record, authentication, existing observability and CI.
- **Organizational**: timeline, team skills, who owns the system after launch, change-management capacity.

A constraint discovered after design is a redesign. Ask about them explicitly; stakeholders rarely volunteer the compliance rule that will later block the project.`,
    },
    {
      heading: 'Non-goals and the requirements brief',
      body: `**Non-goals** are the most under-used tool in discovery. Writing "the first release will not take actions in the billing system, will not handle non-English tickets, and will not replace tier-2 agents" does three things: it prevents scope creep, it defines the capability layer (no billing tools), and it manages expectations so a stakeholder cannot later claim the system "failed" at something it never promised.

The **requirements brief** is a short document (two to four pages) with:

1. Problem statement and business value hypothesis, with baseline numbers.
2. Workflow map (current and proposed), with the human roles marked.
3. Success criteria, how each is measured, and the target for the first release.
4. Constraints (budget, SLA/SLO, compliance, integration, timeline, ownership).
5. Scope and non-goals.
6. Known risks and open questions, each with an owner and a date.
7. Recommended approach and the alternatives considered, including "do not use an LLM for this" where that is honest.

Circulate it, get the sponsor and the operators to sign it, and version it. It becomes the reference for every later tradeoff conversation ("we chose Sonnet over Opus because the brief caps run cost at $0.40 per ticket").

Exam angle: scenarios reward the architect who gathers requirements before proposing a model or a pattern, who converts goals to numbers, who asks about compliance and data access early, and who writes down non-goals. Options that jump to "build a multi-agent system" or "use the most capable model" before the problem is understood are distractors.`,
    },
  ],
  examples: [
    {
      title: 'Discovery that changed the architecture',
      description:
        'A retailer asked for "an AI agent that resolves returns". Operator interviews showed 70% of return requests failed a simple eligibility rule (outside window, final-sale item) that was buried in a PDF. The brief proposed deterministic eligibility checks first, Claude only for the ambiguous 30% (damaged items, missing receipts), and a non-goal of issuing refunds automatically in release one. Projected run cost fell 65% and the compliance team approved in one meeting.',
      takeaway: 'Workflow mapping shows where an LLM adds value; most of the volume often belongs to deterministic code.',
    },
    {
      title: 'The compliance constraint discovered after design',
      description:
        'A team designed a Claude-based HR assistant over six weeks, then learned in a security review that employee data could not leave the EU and that a works council had to approve any system that evaluated employee text. The design assumed a US-region platform and included a "sentiment on performance reviews" feature. Both had to be removed. One discovery question ("What data rules and approvals apply to employee data?") would have saved the six weeks.',
      takeaway: 'Ask about compliance, data residency and approvals in the first interview, not the last review.',
    },
    {
      title: 'A requirements brief excerpt',
      description:
        'The success-criteria and constraints sections of a brief for a claims-intake assistant. Each criterion has a baseline, a target and a measurement method, and each constraint names its source.',
      language: 'markdown',
      code: `## Success criteria (release 1)
| Criterion | Baseline | Target | Measured by |
|---|---|---|---|
| Intake fields extracted correctly | 88% (manual audit) | >= 96% | Golden set (400 claims), nightly |
| Time to triage decision (p50) | 26 h | < 2 h | Production logs |
| Cost per claim (model + human review) | $11.40 | < $4.00 | Usage logs + review time |
| Incorrect auto-triage rate | n/a | <= 1% | Weekly reviewer sample (300) |

## Constraints
- Run budget: $18k / month at 40k claims (Finance, J. Ortiz)
- p95 end-to-end < 8 s for adjuster-facing calls (Ops SLA)
- PHI present: BAA in place with platform; ZDR required; no PHI in traces (Compliance)
- Must integrate with ClaimsCore via existing OAuth service account (Platform team)

## Non-goals (release 1)
- No automatic payment or denial; every decision is adjuster-approved
- English only
- No historical backlog processing`,
      takeaway: 'Numbers, sources and non-goals turn a wish list into something an architecture can be designed against.',
    },
    {
      title: 'Saying "not an LLM problem"',
      description:
        'A logistics company wanted Claude to "predict delivery delays". Discovery showed the inputs were structured telemetry and the need was a numeric forecast with calibrated uncertainty. The architect recommended a conventional forecasting model and proposed Claude only for the adjacent task of drafting customer notifications from the forecast. The sponsor appreciated the honesty and funded both.',
      takeaway: 'Discovery sometimes concludes that Claude is the wrong tool for the core task; saying so builds trust.',
    },
  ],
  keyPoints: [
    'Discovery produces four things: a workflow map as it really runs, measurable success criteria with baselines, hard constraints, and scope with explicit non-goals.',
    'Interview sponsors, operators and downstream consumers; expect disagreement and resolve it in the brief.',
    'Map volumes, durations, error rates and systems per step; the map shows where LLM, deterministic code and humans each belong.',
    'Translate goals into criteria with baseline, target and measurement method; these seed the eval and monitoring design.',
    'Ask about budget, SLA/SLO, compliance, data access and ownership explicitly and early; constraints found late cause redesign.',
    'Non-goals prevent scope creep, define the capability layer and manage expectations.',
    'Write a short, signed, versioned requirements brief including alternatives considered, even "do not use an LLM".',
    'Do not propose models or patterns before the problem and constraints are understood.',
  ],
  flashcards: [
    { front: 'Four outputs of discovery?', back: 'Workflow map, measurable success criteria with baselines, constraints, scope and non-goals.' },
    { front: 'Which three stakeholder groups should be interviewed?', back: 'Sponsors, operators who do the work today, and downstream consumers of the output.' },
    { front: 'What should each step in a workflow map record?', back: 'Volume, duration, error rate, decision points and systems touched.' },
    { front: 'How do you make "faster support" measurable?', back: 'Baseline and target on specific metrics, e.g. median first response 4 h → under 10 min, measured from production logs.' },
    { front: 'Name five constraint categories to ask about.', back: 'Budget, SLA/SLO, compliance and data, integration, organizational (timeline, skills, ownership).' },
    { front: 'Why write non-goals?', back: 'They prevent scope creep, define which capabilities the system will not have, and set expectations.' },
    { front: 'What belongs in a requirements brief?', back: 'Problem and value hypothesis, workflow map, success criteria, constraints, scope and non-goals, risks and open questions, recommended approach and alternatives.' },
    { front: 'What does the workflow map reveal about architecture?', back: 'Where an LLM adds value, where deterministic code is better, where humans must stay, and the integration surface.' },
    { front: 'When should compliance constraints be gathered?', back: 'In the first discovery interviews, before design.' },
    { front: 'Is "do not use an LLM" a valid discovery outcome?', back: 'Yes; recommending the right tool, even a conventional one, builds trust and avoids wasted builds.' },
  ],
  quiz: [
    {
      question:
        'A VP asks an architect to "add an AI agent to customer support" and wants a design next week. What should the architect do FIRST?',
      options: [
        'Propose a multi-agent architecture using the most capable model.',
        'Run discovery: interview operators and consumers, map the current workflow with volumes and error rates, agree measurable success criteria and constraints.',
        'Build a prototype on sample tickets to show progress.',
        'Select the cheapest model to control cost.',
      ],
      correct: [1],
      explanation:
        'Architecture decisions depend on the workflow, metrics and constraints. Jumping to a pattern, a model or a prototype before understanding the problem is the classic failure.',
    },
    {
      question:
        'During discovery, a sponsor says success means "fewer mistakes". Which reformulation is MOST useful for design and evaluation?',
      options: [
        '"The system should be very accurate."',
        '"Field-level extraction accuracy of at least 97% on a 400-case golden set, with incorrect auto-decisions at or below 1%, measured nightly and by weekly review sample."',
        '"Use a model with the highest benchmark scores."',
        '"Reviewers should feel confident in the output."',
      ],
      correct: [1],
      explanation:
        'A criterion needs a metric, a target, a dataset and a measurement cadence. The other options are unmeasurable or substitute a model attribute for an outcome.',
    },
    {
      question: 'Which TWO questions are MOST important to ask in the first discovery interview to avoid later redesign? (Select two)',
      options: [
        'What data classifications and residency or retention rules apply to the information the system will see?',
        'Which font should the chat interface use?',
        'What is the run-rate budget per month or per task, and what latency and availability does the workflow require?',
        'Which vendor\'s benchmark should we quote in the pitch?',
      ],
      correct: [0, 2],
      explanation:
        'Compliance/data rules and budget/SLA constraints shape platform, model and pattern choices; discovering them late forces redesign. UI fonts and benchmark quotes are not architecture constraints.',
    },
    {
      question:
        'Workflow mapping shows that 70% of a team\'s cases are decided by a simple eligibility rule and 30% require judgment over unstructured text. What does this imply for the design?',
      options: [
        'Use Claude for all cases to keep the architecture simple.',
        'Handle the rule-based 70% with deterministic code and apply Claude to the 30% that needs judgment.',
        'Use a multi-agent system with one agent per case type.',
        'Decline the project because most cases do not need AI.',
      ],
      correct: [1],
      explanation:
        'The map shows where an LLM adds value. Deterministic logic is cheaper, faster and more reliable for rules; Claude belongs where unstructured judgment is needed. Multi-agent is unnecessary complexity, and the 30% is a worthwhile target.',
    },
    {
      question:
        'Six months after launch, a stakeholder declares the project a failure because it does not process Spanish tickets. The requirements brief listed "English only" as a release-1 non-goal. What does this illustrate?',
      options: [
        'Non-goals are pointless because stakeholders ignore them.',
        'A signed brief with explicit non-goals is the reference that manages expectations and frames the Spanish support as a scope change, not a failure.',
        'The architect should have promised every language.',
        'The eval was wrong.',
      ],
      correct: [1],
      explanation:
        'Documented non-goals convert "failure" into a scoped next-release conversation. Promising everything or blaming the eval misses the point.',
    },
    {
      question:
        'Discovery reveals that a requested "AI forecast of delivery delays" is a numeric prediction from structured telemetry. What is the BEST recommendation?',
      options: [
        'Build it with Claude because the client asked for AI.',
        'Recommend a conventional forecasting approach for the prediction and position Claude for adjacent language tasks such as drafting customer notifications.',
        'Use the largest Claude model to maximize accuracy.',
        'Refuse to engage further.',
      ],
      correct: [1],
      explanation:
        'Matching the tool to the problem is the architect\'s job; LLMs are not the right tool for calibrated numeric forecasting, but they fit the language task next to it.',
    },
  ],
  statements: [
    { text: 'Discovery should produce measurable success criteria with baselines before architecture is chosen.', isTrue: true, explanation: 'Criteria drive pattern, model and eval design.' },
    { text: 'The documented process is a reliable substitute for observing how the workflow actually runs.', isTrue: false, explanation: 'Map the workflow as it runs; documented processes omit exceptions and real durations.' },
    { text: 'Non-goals are mainly a legal formality with little design value.', isTrue: false, explanation: 'They define the capability layer, prevent scope creep and set expectations.' },
    { text: 'Compliance and data-residency constraints should be gathered in the first interviews.', isTrue: true, explanation: 'Discovering them after design causes rework.' },
    { text: 'A requirements brief should include alternatives considered, including not using an LLM.', isTrue: true, explanation: 'Honest alternatives build trust and document the reasoning.' },
    { text: 'The architect should select the model before discovery so the team can begin prompt engineering.', isTrue: false, explanation: 'Model choice depends on requirements and constraints discovered first.' },
    { text: 'Operators who do the work today are a key discovery source because they know the exceptions.', isTrue: true, explanation: 'Sponsors know goals; operators know reality.' },
  ],
  resources: [
    { label: 'Define your success criteria (Claude docs)', url: 'https://platform.claude.com/docs/en/test-and-evaluate/define-success' },
    { label: 'Building effective agents (Anthropic)', url: 'https://www.anthropic.com/research/building-effective-agents' },
  ],
};
