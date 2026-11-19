import type { Concept } from '../../types';

export const configuringProjects: Concept = {
  id: 'configuring-projects',
  title: 'Configuring Projects',
  summary:
    'Set up a Claude Project with instructions and knowledge sources, understand how instructions shape behavior, write good system-level instructions, and maintain and version them over time.',
  certs: ['ccao-f', 'ccar-p'],
  domains: ['ccao-f-5', 'ccao-f-4', 'ccar-p-2'],
  tags: ['projects', 'instructions', 'knowledge', 'configuration'],
  difficulty: 'foundations',
  sections: [
    {
      heading: 'What a Project is made of',
      body: `A Project is a container for repeated work. Every chat started inside it begins with the same two things:

- **Project instructions**: standing guidance that applies to every conversation. This is the Associate's version of a system-level instruction: who Claude is acting as, what the work is, how outputs should look, what rules never to break.
- **Project knowledge**: files and sources Claude can draw on: style guides, templates, policies, reference documents, past examples of good work, and connected sources where enabled.

Projects can be personal or shared with teammates. Shared Projects are how a team gets consistent behavior: one place to fix an instruction and every member benefits. Depending on plan and settings, Projects can also keep their own memory of ongoing context so related chats build on each other.

The exam objective is "configure Claude Projects with instructions and knowledge sources" and "create effective system-level instructions". Think of the instructions as the standing brief and the knowledge as the reference shelf.`,
    },
    {
      heading: 'How instructions shape behavior',
      body: `Project instructions are read at the start of every chat, before the user's message. They set defaults: tone, format, scope, what to ask before answering, what to refuse or flag. A user's message can refine these for one conversation, but the instructions are what happens when the user says nothing in particular.

This has practical consequences:

- Instructions are the right place for anything that should be true in **every** chat: "Always write in UK English", "Never quote prices; direct users to the price list document", "Begin every draft with a one-line summary".
- They are the wrong place for one-off details; those belong in the chat.
- Vague instructions produce vague defaults. "Be helpful and professional" changes almost nothing. "Write for busy regional managers; lead with the action required; keep to 200 words unless asked" changes every output.
- Conflicts between instructions and a user request are resolved in context, but repeated conflicts mean the instructions need updating rather than users fighting them.

Instructions do not make Claude know facts. Put facts in knowledge and use the instructions to tell Claude how and when to use that knowledge: "Use the attached pricing policy as the only source for pricing questions; if the policy does not cover a case, say so."`,
    },
    {
      heading: 'Writing effective system-level instructions',
      body: `A reliable structure:

1. **Role and purpose**: "You help the customer success team draft renewal communications."
2. **Audience**: who reads the outputs and what they know.
3. **Knowledge usage**: which attached documents are authoritative for which questions, and what to do when they do not cover a case.
4. **Format defaults**: structure, length, language variant, when to use a table or an Artifact.
5. **Quality rules**: "Quote the source document for any policy statement." "Never invent product features." "Mark any figure you calculated as calculated."
6. **Boundaries**: topics to refuse or route to a person; sensitive data handling; required disclaimers.
7. **Process**: questions to ask before starting when key inputs are missing; how to handle ambiguity.

Keep instructions as short as they can be while still specific. Test them: run three or four typical requests and two edge cases in the Project and compare the results with what you want. Adjust one instruction at a time, the same way you iterate a prompt.

Include a couple of examples of good output in the knowledge rather than in the instructions; Claude mirrors examples strongly and the instructions stay readable.`,
    },
    {
      heading: 'Maintaining, updating and versioning',
      body: `Projects drift. Policies change, templates get revised, a teammate adds a document that contradicts an older one, and nobody remembers why an instruction exists. The blueprint says "inform, maintain, and update configurations, knowledge sources, and instructions". Practices:

- **Name an owner** for each shared Project who approves changes to instructions and knowledge.
- **Review on a schedule** (monthly or quarterly) and whenever an upstream policy or template changes.
- **Replace, do not accumulate.** When a document is superseded, remove the old one. Two versions of a policy in knowledge is a recipe for mixed answers.
- **Keep a change log** outside the Project (a shared document or the Project description): date, what changed, why, who approved. Instructions have no built-in history, so keep a dated copy of each version so you can roll back.
- **Date-stamp knowledge** in the file name or a header ("Expense policy, effective 2026-07-01") so Claude and users can tell which is current.
- **Collect feedback**: a simple channel where users report a wrong or odd output, with the chat link, so the owner can trace it to an instruction or a document.
- **Re-test after changes** with the same small set of typical requests.

Exam angle: scenarios describe inconsistent answers across teammates or outdated information appearing in outputs. The best fix is usually to consolidate instructions in a shared Project, remove superseded knowledge, and establish an owner and review cadence, rather than asking each user to add corrections to their prompts.`,
    },
  ],
  examples: [
    {
      title: 'Instructions for a customer success Project',
      description:
        'A customer success team built a shared Project for renewal communications. The instructions name the role, the audience, which documents are authoritative, output defaults, quality rules and boundaries. Examples of past good emails sit in the knowledge base rather than in the instructions.',
      language: 'markdown',
      code: `You help the Customer Success team draft renewal communications.

Audience: account administrators at mid-size customers; busy, not technical.
Knowledge: "Renewal policy 2026-07" is the only source for pricing and
terms. If it does not cover a case, say so and suggest asking the CS lead.
"Tone guide" governs voice. Mirror the structure of the examples folder.
Format: subject line + body under 180 words; UK English; one call to action.
Quality: never invent features or discounts; quote the policy section for
any term you state; mark calculated figures as calculated.
Boundaries: do not draft responses to legal threats or data-breach
questions; tell the user to escalate to the CS lead.
Before drafting, ask for: customer name, renewal date, current plan,
and any open issues, if not provided.`,
      takeaway: 'Specific role, authoritative sources, defaults, quality rules and boundaries make every chat in the Project start well.',
    },
    {
      title: 'A mistake: two versions of the policy in knowledge',
      description:
        'A team uploaded a revised expense policy but left the old one in the Project. Different teammates got different per-diem figures depending on which document Claude drew on. The fix was to remove the old file, rename the new one with its effective date, add an instruction naming it as the sole source, and log the change. The owner now reviews knowledge each quarter.',
      takeaway: 'Replace superseded documents instead of accumulating them, and name the authoritative source in the instructions.',
    },
    {
      title: 'Versioning instructions without a built-in history',
      description:
        'A communications lead keeps a dated copy of each version of the Project instructions in a shared document with a one-line reason for each change. When a new instruction to "always include a legal disclaimer" made internal notes awkward, she rolled back to the previous version in two minutes and rewrote the rule to apply only to external drafts.',
      language: 'markdown',
      code: `## Instruction change log: Comms drafting Project
- 2026-09-02 v3: disclaimer rule now applies to external drafts only (v2 made
  internal notes awkward). Approved: J. Okafor.
- 2026-08-20 v2: added legal disclaimer rule. Approved: J. Okafor.
- 2026-06-11 v1: initial instructions.`,
      takeaway: 'Keep dated copies and reasons so changes can be understood and reversed.',
    },
  ],
  keyPoints: [
    'A Project combines standing instructions (the system-level brief) with a knowledge base (the reference shelf) shared across every chat inside it.',
    'Instructions set defaults for every chat; put only always-true guidance there, and put facts in knowledge with instructions on how to use them.',
    'Effective instructions cover role and purpose, audience, knowledge usage, format defaults, quality rules, boundaries and process; keep them short and specific.',
    'Test instructions with typical and edge-case requests and adjust one thing at a time.',
    'Name an owner, review on a schedule, replace superseded documents, and date-stamp knowledge.',
    'Instructions have no built-in version history; keep a dated change log with reasons so you can roll back.',
    'Inconsistent answers across teammates usually mean conflicting knowledge or missing shared instructions, not user error.',
  ],
  flashcards: [
    { front: 'Two components of a Project', back: 'Project instructions (standing system-level guidance) and Project knowledge (files and sources Claude can draw on).' },
    { front: 'What belongs in Project instructions vs the chat?', back: 'Instructions: anything true in every chat (tone, format, rules, authoritative sources). Chat: one-off details for this task.' },
    { front: 'Do instructions make Claude know facts?', back: 'No. Facts go in knowledge; instructions tell Claude which document is authoritative and what to do when it does not cover a case.' },
    { front: 'Seven parts of effective system-level instructions', back: 'Role and purpose, audience, knowledge usage, format defaults, quality rules, boundaries, process (questions to ask when inputs are missing).' },
    { front: 'Why "be helpful and professional" is a weak instruction', back: 'It changes almost nothing; specific audience, format and rules change every output.' },
    { front: 'Teammates get different per-diem figures from the same Project. Likely cause?', back: 'Two versions of the policy in knowledge; remove the superseded one and name the authoritative source.' },
    { front: 'How do you version Project instructions?', back: 'Keep a dated copy of each version with the reason and approver in a change log outside the Project; roll back by restoring a previous copy.' },
    { front: 'Where should examples of good output live?', back: 'In the knowledge base, referenced from the instructions, so instructions stay short and Claude can mirror them.' },
    { front: 'Maintenance practices for a shared Project', back: 'Named owner, scheduled review, replace superseded files, date-stamp knowledge, feedback channel, re-test after changes.' },
  ],
  quiz: [
    {
      question:
        'Members of a team get inconsistent answers about expense limits from a shared Project. Investigation shows both the old and new expense policies are in the knowledge base. What is the MOST appropriate fix?',
      options: [
        'Ask each user to add "use the newest policy" to their prompts.',
        'Remove the superseded policy, date-stamp the current one, name it as the sole source in the instructions, and log the change.',
        'Switch the Project to a larger model.',
        'Delete the Project and have everyone use plain chat.',
      ],
      correct: [1],
      explanation:
        'The cause is conflicting knowledge; fix it at the source and record the change. Per-user workarounds (A) are fragile; model tier (C) does not resolve conflicting documents; abandoning the Project (D) loses shared consistency.',
    },
    {
      question: 'Which instruction is MOST likely to change Claude\'s outputs in a useful way?',
      options: [
        '"Be helpful and professional."',
        '"Do your best."',
        '"Write for busy regional managers; lead with the action required; keep to 200 words unless asked; quote the policy section for any rule you state."',
        '"You are an AI assistant."',
      ],
      correct: [2],
      explanation:
        'Specific audience, structure, length and a quality rule change every output. The other options are generic defaults that add nothing.',
    },
    {
      question: 'Which TWO belong in Project instructions rather than in an individual chat? (Select two)',
      options: [
        'The rule that pricing questions must use only the attached pricing policy.',
        'The name of the customer for today\'s email.',
        'The default output format and language variant.',
        'The renewal date for this specific account.',
      ],
      correct: [0, 2],
      explanation:
        'Always-true rules and defaults are instructions; per-task details (B, D) belong in the chat.',
    },
    {
      question: 'A new instruction has made some outputs worse and the owner wants to revert. What makes this easy?',
      options: [
        'Projects automatically store every past version of instructions.',
        'A dated change log with a copy of each instruction version and the reason for each change.',
        'Asking Claude to remember what the instructions used to say.',
        'Recreating the Project from scratch.',
      ],
      correct: [1],
      explanation:
        'Instructions have no built-in history, so the owner\'s own change log enables rollback. Claude cannot recall previous instruction text (C), and recreating (D) is slow and loses knowledge.',
    },
    {
      question: 'Where should several examples of excellent past outputs be placed so Claude mirrors them?',
      options: [
        'Pasted in full into the instructions.',
        'In the Project knowledge, referenced from the instructions.',
        'In memory.',
        'Nowhere; examples confuse the model.',
      ],
      correct: [1],
      explanation:
        'Knowledge keeps instructions readable while making examples available. Pasting into instructions (A) bloats them; memory (C) is personal and not a shared reference; examples help rather than confuse (D).',
    },
  ],
  statements: [
    { text: 'Project instructions apply to every chat started inside the Project.', isTrue: true, explanation: 'They are read before the user\'s message in each conversation.' },
    { text: 'Putting a fact in the instructions is the best way to make Claude know it.', isTrue: false, explanation: 'Facts belong in knowledge; instructions should tell Claude how to use the knowledge.' },
    { text: 'Keeping both the old and the new version of a policy in knowledge is a safe way to preserve history.', isTrue: false, explanation: 'It produces inconsistent answers; keep history in a change log outside the Project and remove superseded files.' },
    { text: 'Project instructions have no built-in version history, so owners should keep dated copies.', isTrue: true, explanation: 'A change log with reasons enables rollback and understanding.' },
    { text: 'A shared Project lets one instruction fix benefit every team member at once.', isTrue: true, explanation: 'That is the main advantage over each person maintaining their own prompts.' },
    { text: 'Instructions should be as long and detailed as possible.', isTrue: false, explanation: 'Keep them as short as they can be while still specific; move examples to knowledge.' },
    { text: 'Re-testing with the same small set of typical requests after each change is a good maintenance practice.', isTrue: true, explanation: 'It catches regressions the way iterating on a prompt does.' },
  ],
  resources: [
    { label: 'Claude Help Center: Projects', url: 'https://support.claude.com/' },
    { label: 'System prompts (Claude docs)', url: 'https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/system-prompts' },
  ],
};
