import type { Concept } from '../../types';

export const appropriateUseAndGovernance: Concept = {
  id: 'appropriate-use-and-governance',
  title: 'Appropriate Use and Governance',
  summary:
    'Tell appropriate from inappropriate uses of Claude, follow organizational AI policies and Anthropic\'s usage policy, keep humans accountable, be transparent about AI use, and recognize ethical risks such as bias, unfairness and over-reliance.',
  certs: ['ccao-f', 'ccar-p'],
  domains: ['ccao-f-6', 'ccao-f-4', 'ccar-p-5'],
  tags: ['governance', 'ethics', 'policy', 'accountability', 'bias'],
  difficulty: 'foundations',
  sections: [
    {
      heading: 'Appropriate and inappropriate use cases',
      body: `Capability is not the test; appropriateness is. A use is appropriate when the task suits what Claude does well, the risk of error is managed by a human check, the data involved is allowed, and the use complies with your organization's policy and Anthropic's usage policy.

Generally appropriate (with review):
- Drafting, summarizing, reformatting and translating internal and external content.
- Analyzing data you are permitted to use, generating options, planning.
- Research with cited sources, verified before use.
- Preparing material that a qualified person then decides on.

Generally inappropriate or requiring special controls:
- **Autonomous decisions about people**: hiring, firing, promotion, discipline, credit, housing, benefits eligibility. Claude may prepare summaries; a person decides, with fairness review.
- **Regulated or sensitive data** uploaded against policy (see Data Sensitivity and Privacy).
- **Professional advice presented as authoritative** (legal, medical, financial) without a qualified reviewer.
- **Deceptive uses**: impersonating a person, generating fake reviews or testimonials, passing off AI output as a human expert's verified work.
- **Prohibited content** under Anthropic's usage policy or your organization's rules.
- **Circumventing controls**: using a personal account to process work data an approved account would block.

The exam asks you to spot the inappropriate option in a scenario and to choose the version of the task that keeps the benefit while adding the control.`,
    },
    {
      heading: 'Organizational AI policies and acceptable use',
      body: `Most organizations now have an AI policy. It typically specifies:

- **Approved tools and plans** (for example, the company Team or Enterprise workspace, not personal accounts).
- **Data classifications** that may and may not be used with AI tools.
- **Approved connectors and integrations**.
- **Review requirements** by content type (external communications, legal, HR).
- **Disclosure rules** about when AI assistance must be stated.
- **Accountability**: the person who uses the output is responsible for it.
- **Where to ask** when a case is unclear.

Your job is to know the policy, follow it, and ask when unsure, not to interpret it creatively. "The analysis is internal" or "I told Claude not to retain the data" are not substitutes for a policy control; the official sample item makes exactly that point.

Anthropic's own **Usage Policy** sits underneath: it prohibits certain uses regardless of organizational permission. Associates do not need to recite it, but should know it exists, that it bans deceptive, harmful and illegal uses, and that organizational policy cannot override it.`,
    },
    {
      heading: 'Human accountability and transparency',
      body: `Two principles anchor responsible use.

**Humans stay accountable.** Claude is a tool. The person who sends the email, publishes the report, approves the expense or makes the hiring decision owns the result. "Claude wrote it" is not a defense. This is why review requirements scale with stakes, why decisions about individuals are reserved for people, and why outputs going to regulators or the public are signed off by a named owner.

**Be transparent about AI use.** Disclose AI assistance where your policy, your audience's reasonable expectations, or the law require it. Typical cases: content presented as a person's own professional judgment, customer-facing communications where the organization has committed to disclosure, academic or research contexts, and anything where a reader would feel deceived to learn it was AI-generated. Inside a team, a simple "drafted with Claude, reviewed by me" label helps reviewers calibrate their attention and keeps the record honest.

Transparency also means not overstating what Claude did. A summary you have not verified should not be presented as verified.`,
    },
    {
      heading: 'Ethical implications: bias, fairness, over-reliance',
      body: `**Bias and fairness.** Claude learns from human text and can reflect its biases; sources you give it can be biased; and the way you ask can bias the answer. Risks are highest when outputs affect people differently: screening, ranking, evaluating, allocating. Controls: keep people in the decision, ask for the counter-case, test outputs across different groups or examples, and avoid using protected characteristics as inputs unless there is a lawful, reviewed reason.

**Over-reliance and skill erosion.** When a tool is usually right, people stop checking. That is precisely when the rare error gets through. Controls: review proportionate to stakes, periodic spot checks even on "safe" workflows, and keeping people capable of doing the task without the tool.

**Authenticity and consent.** Do not generate content that imitates a specific person's voice without their consent, do not fabricate quotes, and do not present AI output as human testimony.

**Environmental and social considerations.** Using the smallest tier that does the job and avoiding wasteful usage is part of responsible use, alongside cost.

Exam angle: the correct option typically keeps the human in the decision, adds a fairness or verification check, and discloses AI use where expected. Distractors ask Claude to self-police, remove humans to save time, or treat an internal setting as exempt from policy.`,
    },
  ],
  examples: [
    {
      title: 'Screening job applications',
      description:
        'A recruiting coordinator wanted Claude to rank 300 applications and reject the bottom half automatically. Under the organization\'s policy, decisions about individuals need human review and fairness checks. The appropriate version: Claude extracts the stated qualifications into a consistent table against the published criteria, flags missing information, and the recruiter reviews every rejection. Protected characteristics are excluded from the inputs and a sample of outcomes is checked for disparities.',
      takeaway: 'Keep the benefit (consistent extraction) and the control (human decision, fairness check); do not automate decisions about people.',
    },
    {
      title: 'A mistake: "it is internal, so policy does not apply"',
      description:
        'An analyst reasoned that because a report was for internal use only, uploading a customer file with names and account numbers was fine, and added "do not retain this data" to the prompt. The organization\'s policy restricts regulated personal data regardless of audience, and an instruction to the model is not a policy control. The analyst anonymized the identifiers and ran the same analysis in compliance.',
      takeaway: 'Internal use and prompt instructions do not substitute for policy controls; anonymize or do not upload.',
    },
    {
      title: 'Disclosure in customer communications',
      description:
        'A support team drafted replies with Claude and reviewed each before sending. The organization\'s policy required disclosure of AI assistance in customer-facing content. They added a short footer noting that replies may be drafted with AI assistance and are reviewed by a team member, and kept a label on each internal draft stating who reviewed it. Complaints did not rise; trust metrics did.',
      takeaway: 'Transparency about AI use, with a named human reviewer, meets policy and keeps accountability visible.',
    },
  ],
  keyPoints: [
    'Appropriateness depends on task fit, managed error risk, permitted data, and compliance with organizational policy and Anthropic\'s Usage Policy, not just capability.',
    'Autonomous decisions about people, unreviewed professional advice, deceptive uses and policy-restricted data are inappropriate; keep the assistive version with human decision and review.',
    'Know your organization\'s AI policy: approved tools and plans, data classifications, connectors, review and disclosure rules, accountability, and where to ask.',
    '"It is internal" and "I told Claude not to retain it" are not policy controls.',
    'The person who uses the output owns it; review scales with stakes.',
    'Disclose AI assistance where policy, audience expectations or law require it, and do not overstate what was verified.',
    'Manage bias and fairness with human decisions, counter-cases, testing across groups and excluding protected characteristics; manage over-reliance with proportionate review and spot checks.',
  ],
  flashcards: [
    { front: 'Four tests for an appropriate use', back: 'The task suits Claude\'s strengths; error risk is managed by a human check; the data is permitted; it complies with organizational policy and Anthropic\'s Usage Policy.' },
    { front: 'Examples of inappropriate use', back: 'Autonomous decisions about people, unreviewed legal/medical/financial advice, deceptive content (impersonation, fake reviews), restricted data uploads, circumventing controls with personal accounts.' },
    { front: 'What typically appears in an organizational AI policy?', back: 'Approved tools and plans, data classifications, approved connectors, review requirements, disclosure rules, accountability, and where to ask.' },
    { front: 'Is "I instructed Claude not to retain the data" a valid control?', back: 'No. Prompt instructions are not policy controls; anonymize the data or do not upload it.' },
    { front: 'Who is accountable for a Claude-drafted email that goes wrong?', back: 'The person who sent it. Claude is a tool; accountability stays with people.' },
    { front: 'When should AI assistance be disclosed?', back: 'When policy, the audience\'s reasonable expectations or the law require it: content presented as personal professional judgment, customer-facing content under a disclosure commitment, research contexts.' },
    { front: 'Controls for bias and fairness', back: 'Human decision, ask for the counter-case, test across groups, exclude protected characteristics from inputs unless lawful and reviewed.' },
    { front: 'What is over-reliance and how is it controlled?', back: 'Trusting a usually-right tool so much that checking stops; control with stakes-proportionate review, periodic spot checks and maintaining skills.' },
    { front: 'Can organizational permission override Anthropic\'s Usage Policy?', back: 'No. The Usage Policy prohibits certain uses regardless of organizational approval.' },
  ],
  quiz: [
    {
      question:
        'A recruiter wants Claude to rank 300 applications and automatically reject the bottom half. What is the MOST appropriate approach under typical governance standards?',
      options: [
        'Proceed; ranking is a straightforward task for Claude.',
        'Have Claude extract qualifications into a consistent table against published criteria, exclude protected characteristics, and have the recruiter review every rejection with a fairness spot check.',
        'Proceed but ask Claude to be unbiased.',
        'Use the largest model so rankings are fairer.',
      ],
      correct: [1],
      explanation:
        'Decisions about individuals need human accountability and fairness controls; Claude can prepare consistent inputs. Automating (A), asking Claude to self-police (C), or relying on model size (D) do not provide the control.',
    },
    {
      question: 'An analyst argues that uploading customer account numbers is acceptable because the analysis is internal, and adds "do not retain this data" to the prompt. Which statement is correct?',
      options: [
        'Internal use exempts the data from policy.',
        'The prompt instruction satisfies the retention requirement.',
        'Neither internal use nor a prompt instruction is a policy control; the identifiers should be removed or anonymized first.',
        'The upload is fine as long as the chat is deleted afterwards.',
      ],
      correct: [2],
      explanation:
        'Policy on regulated data applies regardless of audience, and model instructions are not controls. Deleting afterwards (D) does not undo the upload.',
    },
    {
      question: 'Which TWO uses are generally appropriate with human review? (Select two)',
      options: [
        'Drafting a customer newsletter from an approved brief.',
        'Generating fake positive reviews for the company\'s product page.',
        'Summarizing twenty internal meeting transcripts into decisions and actions.',
        'Deciding which employees to lay off based on Claude\'s ranking.',
      ],
      correct: [0, 2],
      explanation:
        'Drafting and summarizing with review are core appropriate uses. Fake reviews (B) are deceptive and prohibited; layoff decisions (D) are decisions about individuals that must stay with accountable people.',
    },
    {
      question: 'A support team drafts replies with Claude and reviews each before sending. Company policy requires disclosure of AI assistance in customer communications. What should they do?',
      options: [
        'Nothing; reviewed replies count as human-written.',
        'Add a brief disclosure that replies may be drafted with AI assistance and reviewed by a team member.',
        'Stop using Claude for replies.',
        'Disclose only if a customer asks.',
      ],
      correct: [1],
      explanation:
        'Follow the disclosure policy with a clear, honest statement that keeps the human reviewer visible. Review does not negate the policy (A); stopping (C) is unnecessary; disclosing only on request (D) does not meet the requirement.',
    },
    {
      question: 'A team\'s Claude workflow has been accurate for six months, so members have stopped reading outputs before forwarding them. Which risk does this illustrate and what is the control?',
      options: [
        'Model drift; switch models.',
        'Over-reliance; restore stakes-proportionate review and periodic spot checks.',
        'Data leakage; disconnect connectors.',
        'None; a six-month track record justifies trust.',
      ],
      correct: [1],
      explanation:
        'When checking stops, the rare error gets through. The control is proportionate review and spot checks. Options A and C address different problems; D ignores the risk.',
    },
  ],
  statements: [
    { text: 'If Claude is capable of a task, the task is appropriate.', isTrue: false, explanation: 'Appropriateness depends on error risk, data permissions and policy, not capability alone.' },
    { text: 'The person who uses a Claude output is accountable for it.', isTrue: true, explanation: 'Claude is a tool; accountability stays with people.' },
    { text: 'Telling Claude not to retain data is an accepted substitute for anonymizing regulated personal data.', isTrue: false, explanation: 'Prompt instructions are not policy controls.' },
    { text: 'Organizational approval can override Anthropic\'s Usage Policy.', isTrue: false, explanation: 'The Usage Policy prohibits certain uses regardless of organizational permission.' },
    { text: 'Claude may prepare consistent summaries of applications, but hiring decisions should remain with people.', isTrue: true, explanation: 'Decisions about individuals require human accountability and fairness review.' },
    { text: 'Disclosing AI assistance is only required when a reader explicitly asks.', isTrue: false, explanation: 'Disclosure follows policy, audience expectations and law, not just requests.' },
    { text: 'A long record of accurate outputs is a reason to continue proportionate review rather than to stop it.', isTrue: true, explanation: 'Over-reliance is the condition under which rare errors slip through.' },
  ],
  resources: [
    { label: 'Anthropic Usage Policy', url: 'https://www.anthropic.com/legal/aup' },
    { label: 'Anthropic Responsible Scaling and safety', url: 'https://www.anthropic.com/safety' },
    { label: 'Claude Help Center', url: 'https://support.claude.com/' },
  ],
};
