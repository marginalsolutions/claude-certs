import type { Concept } from '../../types';

export const analyzingRequirementsWithClaude: Concept = {
  id: 'analyzing-requirements-with-claude',
  title: 'Analyzing Requirements with Claude',
  summary:
    'Use Claude as a structured thinking partner for requirements analysis, use-case identification, research, planning and process optimization, driven by well-designed discovery questions.',
  certs: ['ccao-f', 'ccar-p'],
  domains: ['ccao-f-4', 'ccar-p-1', 'ccar-p-6'],
  tags: ['requirements', 'discovery', 'planning', 'process'],
  difficulty: 'foundations',
  sections: [
    {
      heading: 'Claude as a thinking partner, not an oracle',
      body: `Requirements work is mostly about asking the right questions and organizing the answers. Claude is well suited to both, provided you position it correctly: it does not know your business, so it cannot tell you what you need, but it is very good at helping you discover what you need and at structuring what you learn.

Productive uses in this domain:

- **Surfacing questions you have not asked.** "Here is the request from the sales team. What would a seasoned business analyst want to know before scoping it?"
- **Structuring messy input.** Turn interview notes, email threads and meeting transcripts into a requirements list with sources.
- **Identifying use cases.** From a description of a team's work, propose candidate places where Claude or another tool could help, with the assumptions each depends on.
- **Stress-testing a plan.** "What could go wrong with this rollout plan? Rank by likelihood and impact."
- **Comparing options against criteria** you define.

The exam frames this as "apply Claude to analyze requirements and use cases" and "leverage Claude for research, planning and process optimization". In every case, the facts come from you and your stakeholders; Claude supplies structure, breadth and a second pair of eyes.`,
    },
    {
      heading: 'Structured discovery questions',
      body: `A good discovery session covers a predictable set of ground. Use Claude to generate and refine the questions, then use it again to organize the answers.

| Area | Questions to resolve |
|---|---|
| Goal | What outcome counts as success? How will we measure it? |
| Users and stakeholders | Who does the work today, who consumes the output, who approves, who is affected? |
| Current process | What are the steps, inputs, outputs, tools and hand-offs? Where does time go? Where do errors occur? |
| Constraints | Budget, timeline, policy, data sensitivity, systems that must be used. |
| Volume and variability | How often does this happen? How much does each instance vary? |
| Quality bar | What does a good output look like? What is unacceptable? Who judges? |
| Risks | What happens if it goes wrong? Who is accountable? |

Prompt Claude with the context you have and ask it to produce the questions for a specific stakeholder: "Draft 10 questions for the warehouse supervisor about the current returns process. Plain language, no jargon, ordered from easy to hard." Then paste the answers back and ask for gaps: "Which of the seven areas are still unresolved?"`,
    },
    {
      heading: 'From discovery to requirements and use cases',
      body: `Once you have answers, Claude can turn them into artifacts the organization can act on:

- **Requirements list**: each requirement stated as a testable sentence, tagged must/should/could, with the source (who said it, when).
- **Current-state process map** in text or a simple diagram: steps, owners, time per step, pain points.
- **Candidate use cases**, each with: the step it targets, what Claude would do, what a human still does, the data needed, the risk level, and the expected benefit. Ask Claude to be explicit about which use cases are suitable for an Associate to implement in a Project and which need Developer or Architect involvement (integrations, automation, custom tools).
- **Open questions and assumptions** kept separate from facts.

Always ask Claude to label inferences. "Mark anything you concluded that no stakeholder said explicitly." That distinction is what keeps the document trustworthy when it reaches a decision-maker.`,
    },
    {
      heading: 'Research, planning and process optimization',
      body: `**Research.** Use research mode when requirements depend on outside information: regulations, market practice, vendor capabilities. Scope it tightly and verify the sources that drive a decision (see Fact-Checking and Human Review).

**Planning.** Ask Claude for a plan with phases, dependencies, owners and checkpoints, then critique it: "Which steps are most likely to slip and why?" Treat the plan as a draft the team edits, not a schedule to obey.

**Process optimization.** Give Claude the current-state map and ask for the three changes with the best effort-to-impact ratio, including ones that do not involve AI at all. Some of the best outcomes of a "let's use Claude" discovery are removing a redundant approval or fixing a form. Being willing to recommend a non-AI fix is a mark of a trustworthy analyst and the exam rewards it.

Keep the human at the center. Stakeholders validate requirements; Claude organizes them. Decision-makers choose; Claude lays out the options. When the analysis involves individuals (performance, roles, redundancies), remember the governance rules on sensitive data and human accountability.`,
    },
  ],
  examples: [
    {
      title: 'Discovery for an invoice-processing request',
      description:
        'Finance asked an operations analyst to "use AI to speed up invoice processing". Rather than start building, the analyst had Claude draft discovery questions for the AP clerk, the approving managers and the controller, ran the interviews, then had Claude consolidate the answers into a requirements list and a current-state map. The biggest delay turned out to be approvals sitting in inboxes, not data entry. The recommended first change was an approval reminder, not an AI step.',
      language: 'text',
      code: `"Here are notes from three interviews about invoice processing
(attached). Produce:
1) A current-state map: steps, owner, typical time, pain points.
2) A requirements list; each item testable, tagged must/should/could,
   with who said it.
3) Open questions, and anything you inferred that nobody said.
Keep facts and inferences in separate sections."`,
      takeaway: 'Discovery with Claude surfaces the real bottleneck; the best recommendation may not be an AI step at all.',
    },
    {
      title: 'Use-case identification with an escalation flag',
      description:
        'A marketing manager described the team\'s monthly work and asked Claude to propose where it could help. Claude listed eight candidates and, as instructed, marked each as "Associate can set up in a Project" (brief drafting, campaign summaries, tone checks) or "needs Developer or Architect" (automatic pulls from the analytics platform, scheduled report generation). The manager started the first group that week and queued the second for the technical team.',
      takeaway: 'Ask Claude to classify use cases by who can implement them; that is the escalation decision made explicit.',
    },
    {
      title: 'A mistake: letting Claude invent the requirements',
      description:
        'A project lead short on time asked Claude to "write the requirements for a new client intake process" with no interviews and no documents. Claude produced a plausible, generic list. Two stakeholders rejected it in review because it missed a regulatory check specific to their industry. The lead redid the work with discovery questions and real answers; Claude\'s structure was still useful, but the content had to come from people.',
      takeaway: 'Claude structures requirements; it cannot source them. Facts come from stakeholders.',
    },
  ],
  keyPoints: [
    'Claude is a structuring and questioning partner in requirements work; the facts come from stakeholders and documents.',
    'Structured discovery covers goal, users and stakeholders, current process, constraints, volume and variability, quality bar, and risks.',
    'Ask Claude to draft stakeholder-specific discovery questions, then to consolidate answers and point out unresolved areas.',
    'Produce testable requirements with sources and must/should/could tags; keep facts, inferences and open questions in separate sections.',
    'For each candidate use case, record what Claude does, what humans still do, data needed, risk, benefit, and whether it needs Developer or Architect involvement.',
    'Use research mode for outside information and verify decision-driving sources.',
    'Be willing to recommend non-AI process fixes when they have the best effort-to-impact ratio.',
  ],
  flashcards: [
    { front: 'Role of Claude in requirements analysis', back: 'Structuring input, generating discovery questions, surfacing gaps and risks, comparing options; stakeholders supply the facts.' },
    { front: 'Seven areas of structured discovery', back: 'Goal, users and stakeholders, current process, constraints, volume and variability, quality bar, risks.' },
    { front: 'What makes a requirement well-written?', back: 'A testable sentence, tagged must/should/could, with its source (who said it, when).' },
    { front: 'Why ask Claude to mark inferences?', back: 'So readers can distinguish what stakeholders said from what Claude concluded, keeping the document trustworthy.' },
    { front: 'What should each candidate use case record?', back: 'Target step, what Claude does, what humans still do, data needed, risk level, expected benefit, and who can implement it (Associate vs Developer/Architect).' },
    { front: 'How to stress-test a plan with Claude', back: 'Ask what could go wrong, ranked by likelihood and impact, and which steps are most likely to slip and why.' },
    { front: 'Why recommend non-AI fixes during an AI discovery?', back: 'Some bottlenecks (approvals in inboxes, a bad form) are cheaper to fix directly; recommending them builds trust and the exam rewards it.' },
    { front: 'When does requirements analysis need research mode?', back: 'When requirements depend on outside information such as regulations, market practice or vendor capabilities.' },
    { front: 'Common mistake in requirements work with Claude', back: 'Asking Claude to write requirements without any stakeholder input; the result is plausible and generic.' },
  ],
  quiz: [
    {
      question:
        'Finance asks an analyst to "use AI to speed up invoice processing". What is the MOST appropriate first step?',
      options: [
        'Build a Project that drafts invoice summaries.',
        'Use Claude to draft discovery questions for the people involved, run the interviews, and have Claude consolidate the answers into a current-state map and requirements.',
        'Ask Claude to write the requirements for invoice processing based on general best practice.',
        'Escalate immediately to a Developer to build an integration.',
      ],
      correct: [1],
      explanation:
        'Understanding the actual process and bottleneck comes first. Building (A) or escalating (D) before discovery risks solving the wrong problem; generic requirements (C) miss organization-specific facts.',
    },
    {
      question: 'Which TWO practices make a Claude-assisted requirements document more trustworthy? (Select two)',
      options: [
        'Asking Claude to mark anything it inferred that no stakeholder said.',
        'Asking Claude to write in a confident, authoritative tone.',
        'Attaching a source (who said it, when) to each requirement.',
        'Removing all open questions so the document looks complete.',
      ],
      correct: [0, 2],
      explanation:
        'Labeled inferences and sourced requirements let reviewers verify. Confident tone (B) hides uncertainty, and deleting open questions (D) misrepresents completeness.',
    },
    {
      question:
        'During discovery, the biggest delay turns out to be approvals waiting in managers\' inboxes. The best recommendation is to:',
      options: [
        'Propose a Claude step that drafts the invoices faster anyway.',
        'Recommend an approval reminder or workflow fix first, since it has the best effort-to-impact ratio, and note where Claude could help afterwards.',
        'Ignore the finding because the project is about AI.',
        'Ask Claude to approve invoices on the managers\' behalf.',
      ],
      correct: [1],
      explanation:
        'Address the real bottleneck. An AI step elsewhere (A) does not fix the delay; ignoring the finding (C) wastes the discovery; having Claude approve (D) violates human accountability for financial decisions.',
    },
    {
      question: 'A marketing manager asks Claude to list places where it could help the team. What instruction makes the list most actionable?',
      options: [
        '"List as many ideas as possible."',
        '"For each idea, state the step targeted, what Claude does, what a human still does, data needed, risk, and whether an Associate can set it up in a Project or it needs a Developer or Architect."',
        '"Only list ideas that need no human review."',
        '"Rank ideas by how impressive they sound."',
      ],
      correct: [1],
      explanation:
        'Option B produces decision-ready use cases with the escalation call built in. Volume alone (A) is not actionable; "no human review" (C) is unrealistic and unsafe; impressiveness (D) is not a criterion.',
    },
    {
      question: 'A project lead asks Claude to "write the requirements for a new client intake process" with no interviews or documents. What is the most likely outcome?',
      options: [
        'An accurate, organization-specific requirements list.',
        'A plausible but generic list that misses organization-specific needs such as industry regulatory checks.',
        'Claude refuses because it needs more data.',
        'A list that is accurate because Claude researched the company online.',
      ],
      correct: [1],
      explanation:
        'Without stakeholder input Claude fills gaps with general practice. It will not refuse (C), and it cannot research internal processes online (D).',
    },
  ],
  statements: [
    { text: 'Claude can reliably determine an organization\'s requirements without stakeholder input.', isTrue: false, explanation: 'Claude structures and questions; the facts must come from stakeholders and documents.' },
    { text: 'Structured discovery should cover the current process, constraints, quality bar and risks, not just the goal.', isTrue: true, explanation: 'These areas expose where time and errors actually occur.' },
    { text: 'Asking Claude to separate facts from inferences improves the trustworthiness of a requirements document.', isTrue: true, explanation: 'Reviewers can verify sourced facts and challenge inferences.' },
    { text: 'A discovery that ends with a non-AI recommendation has failed.', isTrue: false, explanation: 'Recommending the highest-impact fix, even if it is not AI, is good analysis.' },
    { text: 'Each candidate use case should note whether it needs Developer or Architect involvement.', isTrue: true, explanation: 'This makes the escalation decision explicit and actionable.' },
    { text: 'Claude should be asked to make approval decisions on behalf of managers to remove the bottleneck.', isTrue: false, explanation: 'Financial approvals require human accountability; Claude can remind or prepare, not decide.' },
    { text: 'Research mode is useful when requirements depend on regulations or market practice.', isTrue: true, explanation: 'Outside information with citations supports requirements, provided sources are verified.' },
  ],
  resources: [
    { label: 'Claude Help Center', url: 'https://support.claude.com/' },
    { label: 'Claude for business use cases', url: 'https://claude.com/' },
  ],
};
