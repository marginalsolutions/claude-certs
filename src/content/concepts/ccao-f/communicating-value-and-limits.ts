import type { Concept } from '../../types';

export const communicatingValueAndLimits: Concept = {
  id: 'communicating-value-and-limits',
  title: 'Communicating Value and Limits',
  summary:
    'Explain to stakeholders what Claude does well, where it fails, what it costs and returns, set realistic expectations, and know when and how to escalate to Developers and Architects.',
  certs: ['ccao-f', 'ccar-p'],
  domains: ['ccao-f-4', 'ccao-f-6', 'ccar-p-6'],
  tags: ['stakeholders', 'communication', 'expectations', 'escalation'],
  difficulty: 'foundations',
  sections: [
    {
      heading: 'What Claude does well, in business terms',
      body: `Stakeholders do not need to know how language models work. They need to know what to expect. Describe strengths as outcomes they recognize:

- **First drafts in minutes**: emails, briefs, proposals, policies, job descriptions, from a structured brief.
- **Making sense of volume**: summarizing long documents, extracting themes from hundreds of survey responses, organizing messy notes.
- **Consistency**: applying the same style guide, checklist or template every time, across a whole team, through a Project.
- **Breadth of options**: brainstorming, alternatives, counterarguments, questions you did not think to ask.
- **Analysis on your data**: calculations, charts and comparisons from spreadsheets through code execution, with the arithmetic done by code.
- **Research with citations**: multi-source reports on current topics, with sources you can check.

Pair every strength with the condition that makes it true: "first drafts in minutes, *when given a clear brief and the source material*." That one habit prevents most expectation problems later.`,
    },
    {
      heading: 'Where it fails, stated plainly',
      body: `Credibility with stakeholders comes from being specific about limits before they discover them.

- **It can state false things confidently.** Citations, numbers and names can be fabricated. Every fact that matters is verified by a person.
- **It does not know your organization** unless you give it the information. It cannot look into systems it is not connected to.
- **Its knowledge has a cutoff** unless research or web search is used, and even then sources must be checked.
- **It does not take accountability.** Decisions, approvals and external statements remain with named people.
- **Quality depends on the input.** A vague request gets a generic answer. A team that will not write briefs will not get good drafts.
- **It can reflect bias** in sources or in the way a question is framed.
- **Some tasks are not appropriate** under policy (regulated personal data, decisions about individuals without review) regardless of capability.

Say these early, in the same breath as the strengths. A stakeholder who hears "it drafts in minutes, and every figure gets checked by a person" has an accurate picture. One who hears only the first half is set up for disappointment and, worse, for forwarding an unchecked output.`,
    },
    {
      heading: 'Cost, benefit and expectations',
      body: `Frame value as a before-and-after on measures the stakeholder already cares about: hours per task, cycle time, rework, error rates, backlog, satisfaction. Use pilot data where you have it (see Integrating Claude into Workflows) and label estimates as estimates.

Be complete about costs:

- Plan or usage cost.
- Time for people to learn to brief well and to review outputs.
- Time to build and maintain Projects, templates and knowledge.
- Review and verification time, which does not go away.
- Any Developer or Architect effort for integrations.

Set expectations with ranges and phases rather than promises: "In the pilot we expect drafting time to fall by a third to a half; review time stays the same; we will report in six weeks." Avoid "automates", "eliminates" and "replaces" unless you can defend them with data. Prefer "drafts", "assists", "speeds up", "reduces".

When a stakeholder asks for something Claude should not do (approve expenses unsupervised, decide who to promote, publish without review), explain the control that stays in place and why, and offer the version of the task that is appropriate.`,
    },
    {
      heading: 'Escalating to Developers and Architects',
      body: `The Associate credential explicitly includes recognizing limitations and escalating more complex or technical work. Escalate when a request involves:

- Connecting to systems that have no approved connector, or building a new integration.
- Automation that runs on a schedule or without a person triggering it.
- Custom tools, agents or multi-step automated pipelines.
- Processing volumes or data that belong in a governed system rather than a chat.
- Security, access control or compliance architecture.
- Anything that needs the API, Claude Code or software development.

Escalate well: write down the business goal, the current process, the requirements and quality bar, the data involved and its sensitivity, the expected volume, and what you have already achieved in a Project. A Developer can build from that; "we want AI to do our reporting" they cannot. After hand-off, the Associate typically still owns the instructions, templates and evaluation of outputs, because they understand the business need.

Exam angle: distractors include attempting the technical work yourself in chat, over-promising to stakeholders, presenting Claude as infallible, or declining to use Claude at all when a well-scoped use exists. The right answers are balanced, specific and route technical work to the right role.`,
    },
  ],
  examples: [
    {
      title: 'A balanced pitch to a department head',
      description:
        'An operations lead proposed using Claude for weekly reporting. Rather than promise automation, she presented pilot data: drafting time down from four hours to one, review time unchanged at thirty minutes, two factual errors caught in review over six weeks. She listed the costs (plan seats, two hours to set up the Project, ten minutes a week to maintain knowledge) and the control (the analyst verifies every figure against the source dashboard). The department head approved a wider rollout and asked for the same format for other proposals.',
      language: 'markdown',
      code: `## Weekly reporting with Claude: pilot results (6 weeks)
- Drafting: 4h → 1h per report
- Review: 30 min (unchanged, by design)
- Errors caught in review: 2 (both numeric; source dashboard checked)
- Setup: 2h Project build; ~10 min/week knowledge upkeep
- Control: every figure verified before distribution
- Next: extend to two more teams; report again in 6 weeks`,
      takeaway: 'Lead with measured results, name the costs and the control, and propose the next bounded step.',
    },
    {
      title: 'A mistake: promising automation',
      description:
        'A manager told leadership Claude would "automate customer onboarding emails". Leadership expected zero human effort. In practice an agent still briefed Claude and reviewed each email, and the integration with the CRM needed a Developer. Leadership felt misled even though the time savings were real. The manager reframed it as "drafts onboarding emails from the CRM record for agent review; CRM connection to be scoped with the Developer team" and rebuilt trust with a pilot report.',
      takeaway: 'Use verbs you can defend (drafts, assists, speeds up) and name the human and technical dependencies up front.',
    },
    {
      title: 'Escalating with a usable brief',
      description:
        'A finance analyst wanted month-end variance commentary generated from the ERP system every month. She wrote a one-page escalation: goal, current process and timing, the exact fields needed, the commentary template already proven in a Project, data sensitivity (internal financials, no personal data), expected volume, and the review step. The Developer scoped the integration in one meeting instead of three.',
      takeaway: 'A good escalation brief carries the business requirements and the proven prompt; the Developer adds the plumbing.',
    },
  ],
  keyPoints: [
    'Describe strengths as business outcomes (drafts, synthesis, consistency, options, analysis on data, cited research) and pair each with the condition that makes it true.',
    'State limits plainly and early: confident errors, no knowledge of your organization unless provided, knowledge cutoff, no accountability, input-dependent quality, possible bias, policy constraints.',
    'Frame value as before-and-after on measures stakeholders already track; count all costs including review, maintenance and technical effort.',
    'Set expectations with ranges and phases; prefer "drafts" and "assists" over "automates" and "replaces" unless data supports it.',
    'Escalate integrations, scheduled automation, custom tools, governed data processing, security architecture and anything needing the API or Claude Code.',
    'Escalate with a brief: goal, current process, requirements and quality bar, data and sensitivity, volume, and the Project work already proven.',
    'After escalation the Associate usually still owns instructions, templates and output evaluation.',
  ],
  flashcards: [
    { front: 'Habit that prevents most expectation problems', back: 'Pair every claimed strength with the condition that makes it true ("drafts in minutes, when given a clear brief and the source material").' },
    { front: 'Seven limits to state to stakeholders', back: 'Confident false statements; no organizational knowledge unless provided; knowledge cutoff; no accountability; input-dependent quality; possible bias; policy constraints on some uses.' },
    { front: 'How should value be framed?', back: 'Before-and-after on measures the stakeholder already tracks: hours per task, cycle time, rework, errors, backlog, satisfaction.' },
    { front: 'Costs that are often omitted', back: 'Learning to brief well, review and verification time, Project and knowledge maintenance, Developer or Architect effort for integrations.' },
    { front: 'Verbs to prefer when describing Claude\'s role', back: 'Drafts, assists, speeds up, reduces; avoid automates, eliminates, replaces unless data supports it.' },
    { front: 'Six triggers for escalation to Developers or Architects', back: 'New integrations, scheduled or unattended automation, custom tools or agents, volumes or data belonging in governed systems, security or compliance architecture, anything needing the API or Claude Code.' },
    { front: 'Contents of a good escalation brief', back: 'Business goal, current process, requirements and quality bar, data involved and sensitivity, expected volume, and what is already proven in a Project.' },
    { front: 'Who owns instructions and output evaluation after an integration is built?', back: 'Usually the Associate, because they understand the business need; the Developer owns the plumbing.' },
    { front: 'Stakeholder asks Claude to approve expenses unsupervised. Response?', back: 'Explain the human accountability control that stays in place and offer the appropriate version: Claude prepares and flags, a person approves.' },
  ],
  quiz: [
    {
      question:
        'A manager is preparing to present a Claude-assisted reporting pilot to leadership. Which framing is MOST appropriate?',
      options: [
        '"Claude automates our reporting; no analyst time is needed."',
        '"Drafting time fell from four hours to one; review time is unchanged and every figure is verified; setup and upkeep cost about two hours plus ten minutes a week."',
        '"Claude is highly accurate, so we have stopped checking the numbers."',
        '"Results vary, so we cannot say anything yet."',
      ],
      correct: [1],
      explanation:
        'Measured results, costs and the control, stated plainly. Option A over-promises; C removes verification; D withholds available pilot data.',
    },
    {
      question: 'Which TWO requests should an Associate escalate to a Developer or Architect rather than attempt in chat? (Select two)',
      options: [
        'Generating variance commentary every month directly from the ERP system without a person triggering it.',
        'Rewriting a policy document for a general audience.',
        'Building a connection to an internal system that has no approved connector.',
        'Summarizing twenty customer interviews uploaded as files.',
      ],
      correct: [0, 2],
      explanation:
        'Scheduled, unattended automation and new system integrations are technical work. Rewriting (B) and summarizing uploaded files (D) are core Associate tasks.',
    },
    {
      question: 'A stakeholder says "AI gets things wrong, so we should not use it at all." What is the best response?',
      options: [
        'Agree and drop the initiative.',
        'Argue that Claude does not make mistakes.',
        'Acknowledge the limit specifically, describe the verification control that stays in place, and propose a bounded, low-risk pilot with measurement.',
        'Propose using Claude only for decisions that no one will check.',
      ],
      correct: [2],
      explanation:
        'Balanced, specific and controlled. Dropping it (A) forgoes a well-scoped use; denying errors (B) destroys credibility; unchecked decisions (D) is the riskiest possible use.',
    },
    {
      question: 'Which element is MOST important to include in an escalation brief for a Developer?',
      options: [
        'A request to "make it work with AI".',
        'The business goal, current process, requirements and quality bar, data sensitivity, expected volume, and the prompt already proven in a Project.',
        'The Associate\'s preferred programming language.',
        'A promise to leadership about the delivery date.',
      ],
      correct: [1],
      explanation:
        'Developers build from clear business requirements and proven prompts. Vague requests (A) cannot be scoped; language preference (C) is not the Associate\'s call; promising dates (D) before scoping sets up failure.',
    },
    {
      question: 'A director asks for Claude to decide which employees receive bonuses to save managers time. What should the Associate say?',
      options: [
        'Agree, since Claude can analyze performance data quickly.',
        'Explain that decisions about individuals need human accountability and fairness review, and offer to have Claude prepare consistent summaries for managers to decide from.',
        'Say Claude cannot read performance data.',
        'Suggest using a larger model for better fairness.',
      ],
      correct: [1],
      explanation:
        'Keep the decision with people, offer the appropriate assistive version. Agreeing (A) violates governance norms; option C is false; model size (D) does not resolve accountability or fairness.',
    },
  ],
  statements: [
    { text: 'Pairing each strength with its condition ("when given a clear brief") helps set accurate expectations.', isTrue: true, explanation: 'Stakeholders then understand what they must supply for the benefit to appear.' },
    { text: 'Review and verification time should be excluded from cost estimates because it is temporary.', isTrue: false, explanation: 'Verification does not go away; omitting it misstates the net benefit.' },
    { text: '"Drafts" and "assists" are safer verbs than "automates" and "replaces" when describing Claude\'s role.', isTrue: true, explanation: 'They describe what actually happens and keep human accountability visible.' },
    { text: 'An Associate should attempt to build a system integration in chat before escalating, to save Developer time.', isTrue: false, explanation: 'Integrations, automation and custom tools are Developer and Architect work; the Associate specifies and escalates.' },
    { text: 'After an integration is built, the Associate typically still owns the instructions and output quality.', isTrue: true, explanation: 'The Associate understands the business need; the Developer owns the technical plumbing.' },
    { text: 'Telling stakeholders about Claude\'s limits early reduces credibility.', isTrue: false, explanation: 'Specific, early statements of limits build credibility and prevent unchecked outputs being forwarded.' },
    { text: 'A stakeholder who refuses all AI use because it can be wrong should be met with a bounded pilot and a described verification control.', isTrue: true, explanation: 'Balanced, specific and controlled responses address the real concern.' },
  ],
  resources: [
    { label: 'Claude Help Center', url: 'https://support.claude.com/' },
    { label: 'Anthropic Usage Policy', url: 'https://www.anthropic.com/legal/aup' },
    { label: 'Claude certification program', url: 'https://anthropic-partners.skilljar.com/' },
  ],
};
