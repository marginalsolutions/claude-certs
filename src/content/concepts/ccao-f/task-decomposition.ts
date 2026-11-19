import type { Concept } from '../../types';

export const taskDecomposition: Concept = {
  id: 'task-decomposition',
  title: 'Task Decomposition',
  summary:
    'Break a complex request into ordered steps with checkpoints, feed Claude one step at a time, and know when a piece of work deserves its own chat or Project.',
  certs: ['ccao-f', 'ccar-p'],
  domains: ['ccao-f-1', 'ccao-f-4', 'ccar-p-1'],
  tags: ['prompting', 'planning', 'workflow'],
  difficulty: 'foundations',
  sections: [
    {
      heading: 'Why one giant prompt underperforms',
      body: `A request like "Read these twelve customer interviews, find the themes, rank them by revenue impact, write an executive memo and draft the slides" asks Claude to do five different jobs in one pass. Each job depends on the previous one being right, but you only get to inspect the final product. If the theme extraction was off, the ranking, memo and slides are all built on sand and you cannot easily tell where it went wrong.

Decomposition turns one unverifiable leap into a chain of small, checkable steps. Each step has a clear input, a clear output and a point where you can look at the result before moving on. This mirrors how you would run the work with a human team: nobody hands an analyst twelve interviews and asks for finished slides without a review in between.

Decomposition also improves quality on each individual step. When Claude is asked only to extract themes, all of its attention goes to extracting themes well.`,
    },
    {
      heading: 'How to decompose: inputs, outputs, dependencies',
      body: `A practical method:

1. **Name the final deliverable** precisely (a one-page memo, a decision table, a training script).
2. **Work backwards**: what must exist before the deliverable can be written? Keep asking until you reach raw material you already have.
3. **Write each step as a verb plus an output**: "extract themes → a list of themes with supporting quotes", "rank themes → a table with impact scores and the reasoning".
4. **Mark dependencies**: which steps need the output of another, and which could happen in parallel.
5. **Decide checkpoints**: after which steps will you personally review before continuing? Anything that feeds many downstream steps (the theme list) deserves a checkpoint.

You can ask Claude to help with the decomposition itself: "Before doing anything, propose a step-by-step plan for this task and list what you would need from me at each step." Reviewing the plan first catches misunderstandings cheaply.`,
    },
    {
      heading: 'Sequencing and checkpoints in practice',
      body: `Run the steps in order, pasting or referencing the approved output of the previous step as the input to the next. At each checkpoint:

- Read the output for correctness and completeness before continuing.
- Fix problems at that step rather than hoping a later step will compensate.
- If you change your mind about scope, update the plan rather than silently redirecting mid-stream.

Sequencing tips:

- Put **analysis before synthesis**: extract, then rank, then write.
- Put **fact-establishing steps before creative steps**: confirm the numbers, then draft the narrative around them.
- Put **high-risk or high-uncertainty steps early** so a surprise does not invalidate hours of later work.
- Give the final step a **quality check**: "Compare the memo against the approved theme list; flag any claim that is not supported."`,
    },
    {
      heading: 'When to split across chats or Projects',
      body: `A single conversation accumulates everything said in it. That is useful while steps genuinely build on each other, but it has costs: long chats slow down, earlier instructions get diluted by later ones, and unrelated side quests pollute the context (see Context and Memory in Claude).

Start a **new chat** when:

- The next step does not need the detailed back-and-forth of the previous one, only its approved output. Paste the output in and begin fresh.
- You are switching to a different kind of task (from data analysis to writing the newsletter).
- The conversation has become long and Claude starts repeating itself or losing earlier instructions.

Use a **Project** when several steps or several people share the same background material and instructions. Put the source documents and the standing rules in the Project, then run each step as its own chat inside it. The steps share the knowledge without sharing each other's clutter.

Exam angle: given a messy multi-part request, the best answer is usually the one that breaks it into sequenced steps with a human review between them, not the one that asks for everything at once or the one that reaches for a bigger model.`,
    },
  ],
  examples: [
    {
      title: 'Turning a monster request into a plan',
      description:
        'A product manager wanted a competitive analysis deck for a leadership offsite. Instead of one prompt, they asked Claude for a plan first, approved it, then ran the steps as separate turns with a review after each.',
      language: 'text',
      code: `Step 1: From the five attached competitor pages, extract pricing,
        target customer and top three claimed differentiators.
        Output: one table. [checkpoint: PM verifies against sources]
Step 2: Using the approved table, identify where our product is
        weaker, comparable, stronger. Output: three short lists.
        [checkpoint]
Step 3: Draft speaker notes for a 10-minute segment for the
        leadership team. Output: five sections, 120 words each.
Step 4: Check the notes against the Step 1 table; flag any claim
        the table does not support.`,
      takeaway: 'Each step has one job, one output and a place where a human can catch errors before they spread.',
    },
    {
      title: 'A mistake: fixing downstream instead of upstream',
      description:
        'An HR analyst noticed the final training script contained a policy detail that was wrong. They asked Claude to "fix the script". Claude fixed that sentence, but the same wrong detail had come from an earlier summary step and reappeared in two other places. The fix was to correct the summary at its checkpoint and regenerate everything that depended on it.',
      takeaway: 'Correct errors at the step where they entered; patching the final output leaves the root cause in place.',
    },
    {
      title: 'Splitting into a Project with one chat per step',
      description:
        'A grants team runs the same four-step process for every application: summarize the call, map it to their programs, draft the narrative, and produce a compliance checklist. They created a Project holding the organization profile, past successful applications and style rules. Each application gets a fresh chat per step inside the Project, so every step has the shared knowledge but none of the previous application\'s clutter.',
      takeaway: 'Projects hold shared context; separate chats keep each step focused.',
    },
  ],
  keyPoints: [
    'One giant prompt hides where things went wrong; a chain of small steps makes each result inspectable.',
    'Decompose by working backwards from the final deliverable; write each step as a verb plus a concrete output.',
    'Place checkpoints after steps that feed many downstream steps, and fix errors at the step where they entered.',
    'Sequence analysis before synthesis, facts before narrative, and risky steps early.',
    'Ask Claude to propose the plan first; reviewing a plan is cheaper than reviewing a finished deck.',
    'Start a new chat when a step only needs the previous approved output, or when the conversation has grown long and unfocused.',
    'Use a Project when several steps or people share the same source material and standing instructions.',
  ],
  flashcards: [
    { front: 'Main weakness of a single "do everything" prompt', back: 'You can only inspect the final result, so an early error (bad theme extraction) silently corrupts every later step.' },
    { front: 'Decomposition method in one line', back: 'Work backwards from the deliverable; write each step as verb + output; mark dependencies; choose checkpoints.' },
    { front: 'Where should checkpoints go?', back: 'After steps whose output feeds many later steps, and after any step with high uncertainty.' },
    { front: 'Found an error in the final output that came from an earlier step. What do you do?', back: 'Fix it at the step where it entered and regenerate the dependent steps; patching the final output leaves the root cause.' },
    { front: 'Good sequencing rule for analysis and writing', back: 'Analysis before synthesis; establish facts before drafting narrative; risky steps early.' },
    { front: 'When should you start a new chat for the next step?', back: 'When the step needs only the approved output of the previous one, when switching task type, or when the chat has grown long and unfocused.' },
    { front: 'When does a Project beat separate chats?', back: 'When several steps or people share the same source documents and standing instructions.' },
    { front: 'Cheap way to catch misunderstandings before any work starts', back: 'Ask Claude to propose a step-by-step plan and list what it needs from you; review the plan first.' },
    { front: 'What should the last step of a decomposed task often be?', back: 'A quality check comparing the final output against the approved intermediate outputs.' },
  ],
  quiz: [
    {
      question:
        'A manager asks Claude in one prompt to read twelve interview transcripts, find themes, rank them by impact, write a memo and draft slides. The slides contain a theme nobody recognizes. What is the MOST appropriate change?',
      options: [
        'Use a more capable model and resend the identical prompt.',
        'Break the request into sequenced steps (extract themes, rank, write, check) and review the theme list before continuing.',
        'Ask Claude to add citations to the slides.',
        'Shorten the transcripts so Claude has less to read.',
      ],
      correct: [1],
      explanation:
        'The problem is that an early step (theme extraction) cannot be inspected. Decomposition with a checkpoint fixes that. A bigger model (A) still hides the error; citations on slides (C) treat the symptom; shortening transcripts (D) loses data.',
    },
    {
      question: 'Which TWO are good reasons to start a new chat for the next step of a task? (Select two)',
      options: [
        'The next step needs only the approved output of the previous step, not the discussion that produced it.',
        'Claude always gives better answers in a brand new chat.',
        'The conversation has become long and Claude has started ignoring earlier instructions.',
        'A new chat lets Claude remember the previous chat automatically.',
      ],
      correct: [0, 2],
      explanation:
        'Fresh chats help when prior detail is no longer needed or when a long chat has become unfocused. New chats are not inherently better (B), and a new chat does not carry over the previous one unless you paste the output or use a Project (D).',
    },
    {
      question:
        'An analyst finds a wrong figure in a final report that was built from a summary Claude produced two steps earlier. The best fix is to:',
      options: [
        'Edit the figure in the final report and send it.',
        'Correct the summary at its checkpoint and regenerate the steps that depended on it.',
        'Ask Claude to double-check the whole report for errors.',
        'Add a disclaimer that figures may be inaccurate.',
      ],
      correct: [1],
      explanation:
        'The wrong figure likely propagated to other places. Fixing upstream and regenerating removes all instances. Editing one spot (A) or adding a disclaimer (D) leaves errors; a generic re-check (C) may miss the same figure elsewhere.',
    },
    {
      question: 'A grants team repeats the same four-step writing process for every application and wants to share source material across steps and teammates. What fits best?',
      options: [
        'One very long chat that contains every application ever processed.',
        'A Project containing the organization profile and style rules, with a separate chat per step.',
        'A new chat for each step with the profile pasted into every prompt.',
        'A single prompt per application that asks for all four outputs at once.',
      ],
      correct: [1],
      explanation:
        'A Project shares knowledge and instructions across chats and people without accumulating clutter. One endless chat (A) degrades; re-pasting (C) works but is error-prone and unshared; a single mega-prompt (D) removes checkpoints.',
    },
    {
      question: 'Which sequencing principle is correct when decomposing an analysis-and-writing task?',
      options: [
        'Draft the narrative first so the analysis knows what to support.',
        'Run the riskiest, most uncertain step last so it does not disrupt the plan.',
        'Establish facts and analysis before drafting narrative; put uncertain steps early.',
        'Run every step in parallel to save time regardless of dependencies.',
      ],
      correct: [2],
      explanation:
        'Facts before narrative prevents writing around wrong assumptions; early uncertainty prevents late surprises. Narrative-first (A) invites confirmation bias, risky-last (B) wastes work, and ignoring dependencies (D) breaks the chain.',
    },
  ],
  statements: [
    { text: 'Decomposing a task into steps lets you catch errors before they propagate.', isTrue: true, explanation: 'Each checkpoint is a chance to inspect an intermediate output before it feeds later steps.' },
    { text: 'Asking Claude to propose a plan before starting is wasted effort because Claude will plan internally anyway.', isTrue: false, explanation: 'A visible plan lets you correct scope misunderstandings cheaply before any work is produced.' },
    { text: 'Starting a new chat automatically carries over everything from the previous chat.', isTrue: false, explanation: 'A new chat starts empty unless you paste the needed output or work inside a Project that holds shared knowledge.' },
    { text: 'Checkpoints are most valuable after steps whose output many later steps depend on.', isTrue: true, explanation: 'An error there would spread the widest, so it is the most cost-effective place to review.' },
    { text: 'If an error appears in the final output, patching that one sentence is sufficient.', isTrue: false, explanation: 'The error likely originated upstream and may appear elsewhere; fix the source step and regenerate.' },
    { text: 'A Project is a reasonable way to share source material across multiple step-specific chats.', isTrue: true, explanation: 'Project knowledge and instructions are available in every chat inside the Project.' },
    { text: 'Running all steps in one prompt is preferable because it is faster.', isTrue: false, explanation: 'It may be faster to type, but it removes inspection points and usually lowers quality on each sub-task.' },
  ],
  resources: [
    { label: 'Chain complex prompts (Claude docs)', url: 'https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/chain-prompts' },
    { label: 'Claude Help Center: Projects', url: 'https://support.claude.com/' },
  ],
};
