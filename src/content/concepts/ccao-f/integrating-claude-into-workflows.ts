import type { Concept } from '../../types';

export const integratingClaudeIntoWorkflows: Concept = {
  id: 'integrating-claude-into-workflows',
  title: 'Integrating Claude into Workflows',
  summary:
    'Decide whether to augment or redesign a process, map it, pick the steps Claude should take, design clean hand-offs and templates, use Projects as shared hubs, and measure the impact.',
  certs: ['ccao-f', 'ccar-p'],
  domains: ['ccao-f-4', 'ccao-f-7', 'ccar-p-1'],
  tags: ['workflow', 'process', 'projects', 'adoption', 'measurement'],
  difficulty: 'foundations',
  sections: [
    {
      heading: 'Augment or redesign',
      body: `The blueprint says "integrate Claude into existing workflows to augment or redesign them". These are different strategies.

**Augment** keeps the process as it is and inserts Claude at specific steps: drafting the first version, summarizing inputs, checking a document against a checklist. Low risk, fast to adopt, easy to reverse. Most Associate-level integrations start here.

**Redesign** rethinks the process because Claude changes what is possible: steps that existed only because humans needed to batch work, hand-offs that existed only to move information between people, approvals that existed because the first draft was unreliable. Higher payoff, more change management, more stakeholders to align.

Choose augment when the process is stable and the pain is in a few steps. Choose redesign when the process is already broken, when several steps exist only to compensate for slow drafting or information transfer, or when a pilot of augmentation shows the bottleneck has simply moved. A sound path is: augment first, measure, then redesign with evidence.`,
    },
    {
      heading: 'Mapping the process and picking the steps',
      body: `Write the process down before touching it: steps, owner, input, output, time, error rate, tools. Then score each step on two questions:

1. **Is this step a good fit for Claude?** Good fits: drafting, summarizing, extracting, classifying, reformatting, comparing against criteria, generating options, first-pass review. Poor fits: final approvals, decisions about individuals, anything requiring access Claude does not have, anything where an error is costly and hard to catch.
2. **Is this step worth it?** High frequency, high time cost, or high error rate.

Pick the steps that score well on both. For each chosen step, write down:

- The **input** Claude receives (and where it comes from: pasted, uploaded, connector).
- The **prompt or Skill** that does the work.
- The **output format** (inline, Artifact, table) and where it goes next.
- The **human check**: who reviews, against what, before the output moves on.

Steps that need live data from internal systems, scheduled runs or actions in other tools are candidates for escalation to Developers and Architects. The Associate still owns the instructions, templates and quality criteria.`,
    },
    {
      heading: 'Hand-offs, templates and Projects as hubs',
      body: `Integrations fail at the seams. Design the hand-offs deliberately:

- **Human to Claude**: a template that captures exactly the inputs the prompt needs, so quality does not depend on who is typing. A short form or a fill-in-the-blanks prompt works.
- **Claude to human**: output in a predictable format with a review checklist attached ("verify the three figures; confirm the client name; check tone against the guide").
- **Claude to Claude**: the approved output of one step pasted or referenced as the input of the next, with the checkpoint in between (see Task Decomposition).

**Projects as shared workflow hubs.** A Project is the natural home for a team workflow: the standing instructions describe the process and the quality bar; the knowledge base holds the templates, style guide, examples of good output and reference documents; Skills encode the repeatable procedures; connectors bring in the live sources that are approved. Team members work in chats inside the Project, so everyone gets the same behavior and improvements to the instructions reach everyone at once.

Name an owner for the Project who maintains instructions and knowledge, and a simple way for users to report when an output was wrong (see Configuring Projects).`,
    },
    {
      heading: 'Piloting and measuring impact',
      body: `Run a pilot before a rollout: one team, a few weeks, a defined set of steps. Measure before and after.

| Measure | How |
|---|---|
| Time per task | Self-reported or timestamped; compare baseline to pilot |
| Cycle time | From request to delivered output |
| Rework rate | How often the output needed significant correction |
| Error rate | Errors caught downstream, per 100 outputs |
| Satisfaction | Short survey of producers and consumers of the output |
| Adoption | Share of eligible tasks actually run through the new process |

Also track the cost: usage, review time, maintenance of the Project. Honest measurement sometimes shows that review time ate the savings; that is a finding, not a failure, and it usually points at a better prompt, a different step or a redesign.

Exam angle: scenarios ask for the "best approach" to bringing Claude into a process. Favor answers that map the process first, start with a bounded pilot, keep a human check at the hand-off, put shared material in a Project, and measure. Distrust answers that automate end-to-end on day one, remove review to save time, or skip measurement.`,
    },
  ],
  examples: [
    {
      title: 'Augmenting a proposal-writing process',
      description:
        'A consulting team wrote every proposal from scratch. They mapped the process (intake call, outline, draft, partner review, formatting, send) and found drafting took 60% of the time. They created a Project with past winning proposals, the style guide and a structured intake template. Claude now drafts from the completed intake template; the consultant edits; the partner reviews as before. Drafting time fell by more than half; the review step was unchanged by design.',
      language: 'markdown',
      code: `## Intake template (human → Claude hand-off)
- Client and industry:
- Problem in the client's words:
- Scope in / scope out:
- Budget range and timeline:
- Three reasons we are a fit:
- Anything the client said they dislike in proposals:`,
      takeaway: 'Augment the slow step, keep the human check, and standardize the hand-off with a template.',
    },
    {
      title: 'A mistake: removing the review step to capture the time savings',
      description:
        'A customer support team used Claude to draft replies and, after a good first month, let agents send drafts without reading them to hit a response-time target. Within weeks, several replies contained wrong policy details and one promised a refund the policy did not allow. The team reinstated review, but added a short checklist to the output and a Project knowledge update so the policy mistakes stopped recurring.',
      takeaway: 'The human check at the hand-off is part of the design, not overhead to be optimized away.',
    },
    {
      title: 'Redesign after augmentation moved the bottleneck',
      description:
        'An HR team used Claude to draft job descriptions, which went from two days to two hours. The bottleneck then moved to a three-person approval chain that had existed because drafts used to be inconsistent. With consistent, template-based drafts and a Project enforcing the standards, the team redesigned approval to a single reviewer plus an automated checklist, cutting total cycle time from two weeks to three days.',
      takeaway: 'Augment first, measure, and redesign the steps that only existed to compensate for the old problem.',
    },
  ],
  keyPoints: [
    'Augment inserts Claude into existing steps with low risk; redesign rethinks the process when steps exist only to compensate for slow drafting or information transfer.',
    'Map the process first, then pick steps that are both a good fit for Claude (drafting, summarizing, extracting, comparing) and worth it (frequent, slow, error-prone).',
    'For each Claude step define the input source, the prompt or Skill, the output format, and the human check before the output moves on.',
    'Design hand-offs with templates for inputs and review checklists for outputs.',
    'Use a Project as the shared hub: instructions describe the process, knowledge holds templates and references, Skills encode procedures, connectors bring approved live sources.',
    'Pilot with one team, measure time, cycle time, rework, errors, satisfaction and adoption against a baseline, and count review and maintenance cost.',
    'Steps needing live internal data, scheduling or actions in other systems are escalated to Developers and Architects; the Associate owns instructions and quality criteria.',
  ],
  flashcards: [
    { front: 'Augment vs redesign', back: 'Augment inserts Claude into existing steps (low risk, fast); redesign restructures the process because Claude changes what is possible (higher payoff, more change management).' },
    { front: 'Two questions for scoring a step as a Claude candidate', back: 'Is it a good fit (drafting, summarizing, extracting, comparing)? Is it worth it (frequent, slow, error-prone)?' },
    { front: 'Four things to define for each Claude step', back: 'Input and its source, the prompt or Skill, the output format and destination, the human check.' },
    { front: 'How do you make the human-to-Claude hand-off reliable?', back: 'A template or form that captures exactly the inputs the prompt needs, so quality does not depend on who is typing.' },
    { front: 'How do you make the Claude-to-human hand-off reliable?', back: 'A predictable output format with a short review checklist attached.' },
    { front: 'What belongs in a Project used as a workflow hub?', back: 'Instructions describing the process and quality bar; knowledge with templates, style guide, good examples, references; Skills; approved connectors; a named owner.' },
    { front: 'Six measures for a pilot', back: 'Time per task, cycle time, rework rate, error rate, satisfaction, adoption; plus the cost of usage, review and maintenance.' },
    { front: 'Which steps are escalation candidates?', back: 'Those needing live internal system data, scheduled runs or actions in other tools.' },
    { front: 'A pilot shows review time consumed the savings. What does that mean?', back: 'A finding, not a failure; it points to a better prompt, a different step, or a redesign.' },
  ],
  quiz: [
    {
      question:
        'A team wants to bring Claude into its proposal-writing process. Which approach is MOST appropriate?',
      options: [
        'Automate the entire process end to end on day one so savings arrive quickly.',
        'Map the process, pilot Claude on the slow drafting step with a structured intake template, keep partner review, and measure before and after.',
        'Ask every consultant to use Claude however they like and see what happens.',
        'Replace the partner review with a Claude self-check to save time.',
      ],
      correct: [1],
      explanation:
        'Map, pilot a bounded step, keep the human check, measure. End-to-end automation (A) skips learning and risk control; unstructured use (C) produces inconsistent results; removing review (D) removes the control.',
    },
    {
      question: 'Which TWO steps are good candidates for Claude in a hiring process? (Select two)',
      options: [
        'Drafting a job description from a completed role template.',
        'Making the final hiring decision between two candidates.',
        'Summarizing interview notes into the agreed scorecard format for the panel.',
        'Deciding an individual\'s salary offer.',
      ],
      correct: [0, 2],
      explanation:
        'Drafting and summarizing into a fixed format are strong fits with human review. Final decisions about individuals (B, D) require human accountability and raise fairness and legal concerns.',
    },
    {
      question: 'After a good first month, a support team stops reading Claude-drafted replies before sending to meet a response-time target. What is the most likely consequence and the better approach?',
      options: [
        'Quality stays constant; the approach is fine.',
        'Errors such as wrong policy details reach customers; keep review and add a short checklist plus Project knowledge fixes for recurring mistakes.',
        'Claude will learn from customer complaints and self-correct.',
        'Response time will get worse because Claude slows down without review.',
      ],
      correct: [1],
      explanation:
        'The human check is the control that catches drafting errors; removing it lets errors through. Claude does not learn from complaints automatically (C), and option D misdescribes the mechanism.',
    },
    {
      question: 'What is the main reason to use a Project as the hub for a team workflow?',
      options: [
        'Projects make Claude faster.',
        'Everyone works from the same instructions, templates and references, and improvements reach all users at once.',
        'Projects remove the need for human review.',
        'Projects allow Claude to act in external systems without permissions.',
      ],
      correct: [1],
      explanation:
        'Shared, maintained context is the point. Projects do not change model speed (A), do not replace review (C), and connectors still act with user permissions (D).',
    },
    {
      question: 'After drafting time fell sharply, the HR team\'s bottleneck moved to a three-step approval chain that existed because old drafts were inconsistent. What does this suggest?',
      options: [
        'The pilot failed and should be reversed.',
        'It is time to consider redesigning the approval step, since its original reason has changed.',
        'Add more Claude drafting to compensate.',
        'Remove all approvals immediately.',
      ],
      correct: [1],
      explanation:
        'Augmentation revealed a step that compensated for an old problem; redesign with evidence is the next move. The pilot succeeded (A), more drafting does not address approval (C), and removing all approvals (D) discards a control without analysis.',
    },
  ],
  statements: [
    { text: 'Augmenting an existing process is usually lower risk than redesigning it.', isTrue: true, explanation: 'Inserting Claude at specific steps is fast to adopt and easy to reverse.' },
    { text: 'The human review step is overhead that should be removed once Claude outputs look good for a few weeks.', isTrue: false, explanation: 'The review is the control that catches drafting errors; keep it and make it efficient with a checklist.' },
    { text: 'A template for the inputs to a Claude step makes output quality less dependent on who runs it.', isTrue: true, explanation: 'Templates standardize the human-to-Claude hand-off.' },
    { text: 'Projects remove the need to escalate integrations with internal systems.', isTrue: false, explanation: 'Live internal data, scheduling and actions in other systems still require Developer or Architect work; the Project holds instructions and knowledge.' },
    { text: 'Measuring a pilot should include review and maintenance time, not just drafting time saved.', isTrue: true, explanation: 'Honest cost accounting shows whether the change actually paid off.' },
    { text: 'If a pilot shows review time ate the savings, the integration should be abandoned.', isTrue: false, explanation: 'It is a finding that points to a better prompt, step or redesign.' },
    { text: 'Final decisions about individuals are good candidates to hand to Claude to speed up HR processes.', isTrue: false, explanation: 'Such decisions need human accountability and raise fairness and legal concerns.' },
  ],
  resources: [
    { label: 'Claude Help Center: Projects', url: 'https://support.claude.com/' },
    { label: 'Claude for teams and enterprise', url: 'https://claude.com/' },
  ],
};
