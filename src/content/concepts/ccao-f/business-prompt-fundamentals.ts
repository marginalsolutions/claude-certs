import type { Concept } from '../../types';

export const businessPromptFundamentals: Concept = {
  id: 'business-prompt-fundamentals',
  title: 'Business Prompt Fundamentals',
  summary:
    'A strong business prompt gives Claude a role, a clear task, the context it cannot guess, the audience, the output format and the constraints. Specificity is what separates a usable draft from a generic one.',
  certs: ['ccao-f'],
  domains: ['ccao-f-1', 'ccao-f-7'],
  tags: ['prompting', 'communication', 'productivity'],
  difficulty: 'foundations',
  sections: [
    {
      heading: 'Why vague prompts produce generic output',
      body: `Claude answers the question you actually asked, not the one in your head. When a prompt says "write a summary of this report", Claude has to guess who the summary is for, how long it should be, what matters most and what tone fits. It fills those gaps with sensible defaults, which is why the result often feels competent but generic.

Think of a prompt the way you would think of a brief handed to a new colleague on their first day. They are capable, but they do not know your company, your audience or what "good" looks like for this task. Everything you would tell that colleague belongs in the prompt.

The exam tests this from the other direction: given a disappointing output, you should be able to recognize that the prompt was missing a role, an audience, a format or a constraint, rather than concluding that Claude "cannot do" the task.`,
    },
    {
      heading: 'The six ingredients of a business prompt',
      body: `Most effective workplace prompts contain some version of these parts. You do not need all six every time, but each one you leave out is a decision you are delegating to Claude.

| Ingredient | What it does | Example |
|---|---|---|
| **Role** | Sets the perspective and expertise Claude adopts | "Act as an experienced HR business partner" |
| **Task** | The concrete action, stated with a verb | "Draft a three-paragraph announcement" |
| **Context** | Background Claude cannot infer | "We are moving from quarterly to monthly reviews because..." |
| **Audience** | Who reads the result and what they already know | "Written for frontline managers with no HR training" |
| **Format** | Shape of the output | "Bulleted list, then a one-sentence recommendation" |
| **Constraints** | Length, tone, things to avoid, must-include items | "Under 200 words, warm but direct, do not mention layoffs" |

Audience deserves special attention. The same facts become a different document for an executive, a customer and a regulator. Telling Claude who will read the output changes vocabulary, depth, and what gets left out.`,
    },
    {
      heading: 'Specificity: be concrete about the result you want',
      body: `Specific prompts describe the finished product, not just the topic. Compare:

- Weak: "Give me some ideas for the offsite."
- Strong: "Suggest five half-day team activities for a 12-person remote marketing team meeting in person for the first time. Budget is under $50 per person, no alcohol, indoors in case of rain. For each, give a one-line description and the main benefit."

The strong version did not become long for its own sake. Every added phrase removes a guess: head count, budget, venue constraint, and the exact output shape.

Other habits that raise specificity:

- Give an **example** of the output you want (a past email, a table layout). Claude copies structure and tone from examples very reliably.
- Say what **success looks like**: "the reader should be able to decide without asking a follow-up question."
- Name what to **leave out** as well as what to include.
- Attach the actual **source material** (document, data, previous draft) instead of describing it.`,
    },
    {
      heading: 'Common mistakes and the exam angle',
      body: `Patterns that show up both in real work and in exam distractors:

- **Stacking unrelated tasks in one sentence.** "Summarize this, translate it, and make a slide deck" produces a shallow version of each. Decompose instead (see Task Decomposition).
- **Describing the material instead of providing it.** Claude cannot read a report you only mention. Paste it or upload it.
- **Asking for "the best" without criteria.** Best for cost, speed, risk or morale? State the criteria.
- **Fixing a bad result by adding "please be more accurate".** Politeness does not supply missing context. Add the context.
- **Assuming Claude knows your organization.** It does not know your products, acronyms or policies unless they are in the prompt or a Project.

On the exam, when a scenario describes a disappointing first output, the most appropriate action is almost always to add the missing ingredient (audience, format, context, constraint) rather than to switch models, switch platforms or abandon the task.`,
    },
  ],
  examples: [
    {
      title: 'Rewriting a weak marketing prompt',
      description:
        'A marketing coordinator asked "Write a product launch email" and got a generic, salesy draft that mentioned features the product does not have. The rewrite supplied every missing ingredient and the attached spec sheet.',
      language: 'text',
      code: `Before:
Write a product launch email.

After:
You are a B2B email copywriter for a mid-size HR software company.
Task: write the launch announcement for our new "Shift Swap" feature.
Context: the attached spec sheet lists exactly what the feature does.
Do not invent capabilities that are not in it.
Audience: existing customers who are HR admins at retail chains;
they are busy and skeptical of hype.
Format: subject line, 120-word body, one call-to-action button text.
Constraints: plain language, no exclamation marks, mention that
the feature is included at no extra cost.`,
      takeaway: 'Every ingredient you add removes a guess Claude would otherwise make for you.',
    },
    {
      title: 'The audience changes the document',
      description:
        'An operations lead needed to explain a warehouse process change. One prompt produced a note for the executive team, a second for shift supervisors, using the same facts. The executive version led with cost and risk; the supervisor version led with what changes on Monday morning and who to ask.',
      language: 'text',
      code: `Same context, two prompts:

1) "...Audience: the COO and CFO. They want to know cost impact,
   risk, and the decision they need to make. Half a page."

2) "...Audience: shift supervisors who will run the new process.
   They need to know exactly what changes, when, and who to call
   if the scanner fails. Numbered steps, plain language."`,
      takeaway: 'State the audience explicitly; it determines what to lead with and what to leave out.',
    },
    {
      title: 'A mistake: describing the source instead of attaching it',
      description:
        'A project manager wrote "Summarize the risks in the Q3 vendor review" without attaching the review. Claude produced a plausible list of generic vendor risks that had nothing to do with the actual document. The PM nearly forwarded it. The fix was to upload the review and ask for risks "found in the attached document, quoting the relevant line for each".',
      takeaway: 'Claude cannot read what you only mention; attach the material and ask it to cite where each point came from.',
    },
  ],
  keyPoints: [
    'A business prompt usually needs a role, a task, context, an audience, a format and constraints; each one you omit is a guess you delegate to Claude.',
    'Specificity means describing the finished result (length, shape, criteria, exclusions), not writing a longer prompt for its own sake.',
    'Naming the audience changes vocabulary, depth and emphasis more than almost any other single instruction.',
    'Provide the actual source material; Claude cannot read a document you only refer to.',
    'Examples of the desired output are the fastest way to transfer structure and tone.',
    'When a first draft disappoints, the fix is usually a missing ingredient, not a different model or platform.',
    'Claude does not know your organization, acronyms or policies unless they are in the prompt or a Project.',
  ],
  flashcards: [
    { front: 'Six common ingredients of an effective business prompt', back: 'Role, task, context, audience, format, constraints.' },
    { front: 'Why does a vague prompt produce a generic answer?', back: 'Claude fills every unstated decision (audience, length, tone, emphasis) with a sensible default, so the output is competent but not tailored.' },
    { front: 'What is the fastest way to transfer the structure and tone you want?', back: 'Include an example of the desired output (a past email, a table layout).' },
    { front: 'Why name the audience in a prompt?', back: 'The audience determines vocabulary, depth, what to lead with and what to leave out; the same facts become different documents for executives, customers or regulators.' },
    { front: '"Give me the best option" is weak because...', back: 'It names no criteria. Best for cost, speed, risk or morale produce different answers; state the criteria.' },
    { front: 'You mention a report in the prompt but did not attach it. What happens?', back: 'Claude produces plausible generic content unrelated to the real document. Attach or paste the material.' },
    { front: 'What does "specificity" mean in prompting?', back: 'Describing the finished product concretely: length, format, success criteria, inclusions and exclusions.' },
    { front: 'First output is disappointing. Most appropriate next step?', back: 'Identify the missing ingredient (context, audience, format, constraint) and add it, rather than switching models or giving up.' },
    { front: 'Why does "please be more accurate" rarely fix a poor draft?', back: 'It supplies no new information. Accuracy improves when you add the context, source material or constraints Claude was missing.' },
  ],
  quiz: [
    {
      question:
        'A communications specialist asks Claude to "write an announcement about the new parental leave policy" and receives a long, formal draft full of HR jargon that staff will not read. What is the MOST appropriate next step?',
      options: [
        'Switch to the most capable model and resend the same prompt.',
        'Add the audience (all employees, many without HR background), a length limit and a plain-language constraint, then regenerate.',
        'Ask Claude to rate how readable the draft is and send it if the rating is high.',
        'Copy the draft into a different AI tool to compare.',
      ],
      correct: [1],
      explanation:
        'The draft is generic because the prompt omitted the audience, length and tone. Adding them addresses the actual cause. A bigger model (A) still lacks the context; self-rating (C) is not a reliable signal; switching tools (D) does not fix the prompt.',
    },
    {
      question:
        'Which TWO additions would most improve the prompt "Summarize this customer feedback"? (Select two)',
      options: [
        'Who will read the summary and what decision they need to make.',
        'A request that Claude be "as accurate as possible".',
        'The desired format, such as three themes with one quote each.',
        'A sentence telling Claude it is very intelligent.',
      ],
      correct: [0, 2],
      explanation:
        'Audience and format remove the two biggest guesses. Asking for accuracy (B) or flattering the model (D) supplies no information that changes the result.',
    },
    {
      question:
        'A project manager wrote "List the main risks in our vendor review" without attaching the review. Claude returned a confident list of generic vendor risks. What happened and what should the PM do?',
      options: [
        'Claude searched the company intranet; the PM should restrict its permissions.',
        'Claude cannot read a document it was not given and filled the gap with plausible generic content; the PM should upload the review and ask Claude to quote where each risk appears.',
        'Claude misunderstood the word "risk"; the PM should define it.',
        'The output is fine because vendor risks are similar across companies.',
      ],
      correct: [1],
      explanation:
        'Describing a document is not the same as providing it. Claude did not and could not access the intranet (A). Defining "risk" (C) does not supply the document. Accepting generic content (D) risks forwarding irrelevant analysis.',
    },
    {
      question:
        'An operations lead needs the same process change explained to executives and to frontline supervisors. What is the best approach?',
      options: [
        'Write one prompt and send the same output to both groups to keep the message consistent.',
        'Write two prompts that share the facts but state a different audience and what each group needs to decide or do.',
        'Ask Claude to write it "for everyone".',
        'Ask Claude to write the executive version first, then shorten it for supervisors by removing paragraphs.',
      ],
      correct: [1],
      explanation:
        'Audience shapes emphasis and vocabulary, not just length. One generic version (A, C) serves neither group well. Shortening the executive version (D) keeps executive framing (cost, risk) rather than the supervisor needs (what changes Monday, who to call).',
    },
    {
      question: 'Which prompt element most directly tells Claude the shape of the deliverable?',
      options: ['Role', 'Context', 'Format', 'Audience'],
      correct: [2],
      explanation:
        'Format specifies the structure (table, bullets, word count, sections). Role sets perspective, context supplies background, audience sets who reads it; none of those define the shape directly.',
    },
  ],
  statements: [
    { text: 'Including an example of the output you want is an effective way to control structure and tone.', isTrue: true, explanation: 'Claude reliably mirrors the structure and tone of a provided example.' },
    { text: 'A longer prompt is always a better prompt.', isTrue: false, explanation: 'Length is not the goal; specificity is. Each added phrase should remove a guess, not pad the request.' },
    { text: 'Claude knows your company acronyms and internal policies without being told.', isTrue: false, explanation: 'Claude has no access to your organization unless you supply the information in the prompt, upload it, or add it to a Project.' },
    { text: 'Stating the audience changes which facts Claude emphasizes, not just the vocabulary.', isTrue: true, explanation: 'Executives, customers and frontline staff need different lead points and depth from the same facts.' },
    { text: 'Mentioning a document by name is enough for Claude to summarize it.', isTrue: false, explanation: 'Claude can only work with material you actually provide; otherwise it produces plausible but unrelated content.' },
    { text: 'Telling Claude what to leave out is a legitimate part of a constraint.', isTrue: true, explanation: 'Exclusions ("do not mention pricing") are as useful as inclusions in shaping the output.' },
    { text: 'If a first draft is generic, the most likely cause is that the model is not capable enough.', isTrue: false, explanation: 'Generic drafts usually come from missing audience, context or format in the prompt, not from model capability.' },
  ],
  resources: [
    { label: 'Prompt engineering overview (Claude docs)', url: 'https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview' },
    { label: 'Be clear and direct (Claude docs)', url: 'https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/be-clear-and-direct' },
    { label: 'Claude Help Center', url: 'https://support.claude.com/' },
  ],
};
