import type { Concept } from '../../types';

export const optimizingWorkflows: Concept = {
  id: 'optimizing-workflows',
  title: 'Optimizing Workflows',
  summary:
    'Make repeated work with Claude faster and more reliable: reusable prompts and Skills, Projects for recurring tasks, batching similar items, choosing cheaper and faster paths, and measuring time saved.',
  certs: ['ccao-f', 'ccar-p'],
  domains: ['ccao-f-7', 'ccao-f-4', 'ccar-p-2', 'ccar-p-7'],
  tags: ['optimization', 'skills', 'projects', 'efficiency', 'measurement'],
  difficulty: 'foundations',
  sections: [
    {
      heading: 'Stop re-typing: reusable prompts and Skills',
      body: `The first optimization is to notice repetition. If you have written roughly the same prompt three times, it should become a reusable asset.

- **Saved prompt templates.** A fill-in-the-blanks prompt that encodes the role, audience, format and quality rules you have already iterated on. Keep them where the team can find them: a shared document or, better, the Project knowledge.
- **Skills.** A Skill packages instructions, examples and supporting files for a repeatable procedure, and Claude loads it when a task matches. Built-in skills already handle common document, spreadsheet and presentation work; custom Skills capture your organization's procedures: "produce a board-paper summary in our format", "run the monthly QBR analysis", "convert meeting notes to our action-item tracker". Where your plan allows, Skills can be created and shared so everyone gets the same procedure without pasting instructions.
- **Project instructions** for the defaults that apply to all work on a topic.

The distinction: Project instructions are always-on context for a topic; a Skill is a procedure that applies across topics when triggered; a template is a lightweight prompt you fill in by hand. Many teams use all three.`,
    },
    {
      heading: 'Projects and batching for repeated work',
      body: `**Projects for recurring tasks.** Anything you do weekly or monthly with the same background belongs in a Project: the knowledge is loaded, the instructions encode the lessons, and each run is a short chat. This also makes the work transferable; a colleague can cover for you by opening the Project.

**Batching similar items.** Many small tasks of the same type are faster to run as one batch with a consistent instruction: "For each of the 15 customer comments below, give sentiment, theme and a one-line suggested reply, as a table." Batching gives consistent treatment, is quicker than 15 chats, and produces structured output you can review in one pass. Keep batches to a size you can still review carefully; a 500-row batch you do not read is not a time saving.

**Chaining batches.** Run a cheap, structured first pass (tag, classify, extract) over a large set, review the table, then run the expensive synthesis once over the clean table. This is the Associate-level version of the tiered workflow in Choosing a Model Tier.

For very large or scheduled batches, the right path is usually an escalation to Developers who can automate it with the API, while you own the prompt and quality criteria.`,
    },
    {
      heading: 'Choosing cheaper and faster paths',
      body: `Efficiency has several dials, and you should know which one to turn.

- **Model tier.** Routine, high-volume, low-depth work goes to the fast tier; reserve deep tiers for judgment-heavy steps.
- **Right-sized context.** Do not load a 200-page manual when a two-page excerpt answers the question; do not keep a chat alive for weeks when a fresh one with a summary is sharper.
- **Right feature.** Code execution for calculations rather than long prose arithmetic; research mode once rather than ten manual searches; a connector rather than exporting and uploading weekly; an Artifact rather than copying text into a document by hand.
- **Fewer, better iterations.** A well-built template that gets a usable draft in one pass beats a vague prompt that needs six rounds. Front-load the effort into the template.
- **Review efficiency.** Ask for outputs in a format that is fast to check (tables with sources, bullet lists of claims) and attach a review checklist, so verification takes minutes rather than a re-read.
- **Avoid false economies.** Removing review, over-batching beyond what you can read, or sending complex work to the smallest tier produce errors that cost more than they save.

The exam frames this as "optimize workflows for efficiency and effectiveness". The word "effectiveness" is there on purpose: a faster workflow that produces worse outputs is not optimized.`,
    },
    {
      heading: 'Measuring time saved and quality kept',
      body: `Optimization claims need numbers. A lightweight approach:

1. **Baseline** the current task: minutes per item, items per week, rework rate, who does it.
2. **Change one thing** (a template, a Skill, a Project, batching, a tier change).
3. **Measure again** over a representative period.
4. **Account for the full cost**: your setup time, review time, maintenance, usage.
5. **Check quality did not fall**: rework rate, errors caught downstream, recipient feedback.

Report in the stakeholder's units: "the weekly digest went from 3 hours to 45 minutes including review; zero factual corrections in six weeks; setup took 2 hours." Also report what did not work; a Skill that saved no time should be retired, not defended.

Share optimizations. A template that saves you an hour a week saves a ten-person team a day a week once it is in the shared Project. Making it findable and maintained is the last step of optimization, and often the most valuable.`,
    },
  ],
  examples: [
    {
      title: 'From six iterations to one template',
      description:
        'A communications manager spent about forty minutes and several rounds each week getting a stakeholder update right. She captured the final prompt from a good week as a fill-in template (audience, three sections, word limits, tone rules, "lead with the decision needed"), stored it in the team Project, and later turned it into a Skill so colleagues could invoke the same procedure. Weekly effort dropped to about ten minutes including review.',
      language: 'markdown',
      code: `## Weekly stakeholder update (template)
Audience: {sponsor names}, two minutes to read.
Source: this week's tracker export (attached).
Sections: 1) Decision needed (one sentence) 2) Done / Next / Blocked
(three bullets each) 3) Risks changed since last week.
Rules: max 180 words, plain language, no acronyms without expansion,
every figure traceable to the tracker.`,
      takeaway: 'Front-load the iteration into a template or Skill so each run is one pass.',
    },
    {
      title: 'Batching survey comments with a review-friendly format',
      description:
        'An operations coordinator used to process 60 customer comments one at a time. Now she pastes them in batches of 20 with the instruction to return a table of comment ID, sentiment, theme, suggested action and a quoted phrase supporting the theme. Reviewing a 20-row table with quotes takes a few minutes; three batches cover the week.',
      takeaway: 'Batch similar items into one structured output sized for careful review.',
    },
    {
      title: 'A mistake: optimizing speed and losing effectiveness',
      description:
        'A team moved its contract-summary step to the fastest tier and increased batch size to 100 contracts so the whole backlog cleared in an afternoon. Nobody could review 100 summaries, and two missed renewal clauses surfaced months later. The team returned complex summaries to a deeper tier, kept batches at a reviewable size, and used the fast tier only for the first-pass extraction of dates and parties.',
      takeaway: 'Efficiency that outruns review is not optimization; match tier and batch size to stakes and review capacity.',
    },
  ],
  keyPoints: [
    'Turn any prompt you have written three times into a reusable asset: a template, a Skill, or Project instructions.',
    'Project instructions are always-on context for a topic; Skills are procedures invoked across topics; templates are lightweight fill-in prompts.',
    'Put recurring work in a Project so each run is a short chat and colleagues can cover.',
    'Batch similar items into one structured output, sized so you can still review every row; run cheap extraction over many items and expensive synthesis once.',
    'Choose the cheaper, faster path by tier, right-sized context, right feature and fewer iterations, but avoid false economies that remove review or under-tier complex work.',
    'Measure baseline and after, including setup, review and maintenance costs, and confirm quality held; report in the stakeholder\'s units.',
    'Share and maintain optimizations in the team Project; retire ones that do not save time.',
  ],
  flashcards: [
    { front: 'Rule of thumb for creating a reusable prompt asset', back: 'If you have written roughly the same prompt three times, make it a template, Skill or Project instruction.' },
    { front: 'Project instructions vs Skill vs template', back: 'Instructions: always-on context for a topic. Skill: a procedure Claude loads when a task matches, across topics. Template: a fill-in prompt you run by hand.' },
    { front: 'What is batching and what limits it?', back: 'Running many similar items in one structured prompt; keep batches small enough that you can review every row.' },
    { front: 'Chaining batches pattern', back: 'Cheap first pass (tag, classify, extract) over many items, review the table, then one expensive synthesis over the clean table.' },
    { front: 'Four efficiency dials', back: 'Model tier, right-sized context, right feature (code execution, research, connectors, Artifacts), fewer better iterations via templates.' },
    { front: 'Three false economies', back: 'Removing review, over-batching beyond review capacity, sending complex work to the smallest tier.' },
    { front: 'Five steps to measure an optimization', back: 'Baseline, change one thing, measure again, account for full cost (setup, review, maintenance, usage), check quality held.' },
    { front: 'Why report what did not work?', back: 'So useless assets are retired rather than defended, and the team keeps trust in reported savings.' },
    { front: 'When does a large or scheduled batch become an escalation?', back: 'When it exceeds what a person can run and review in chat; Developers automate with the API while the Associate owns prompt and quality criteria.' },
  ],
  quiz: [
    {
      question:
        'A communications manager spends 40 minutes and several iterations each week producing the same stakeholder update. What is the MOST effective optimization?',
      options: [
        'Switch to a larger model so the first draft is better.',
        'Capture the proven prompt as a template or Skill in the team Project so each week is one pass with a short review.',
        'Skip the review step to save time.',
        'Write a shorter update.',
      ],
      correct: [1],
      explanation:
        'The repetition is the inefficiency; a reusable asset removes it and shares the benefit. Model size (A) does not encode the lessons; dropping review (C) trades quality for speed; shorter content (D) does not address the iteration cost.',
    },
    {
      question: 'Which TWO are sound ways to make a weekly batch of 60 customer comments faster without losing quality? (Select two)',
      options: [
        'Process them in three batches of 20 with a consistent table format including a supporting quote per row.',
        'Process all 60 plus the backlog of 400 in one batch and skim the result.',
        'Use a fast tier for tagging and a deeper tier once for the weekly synthesis.',
        'Remove the sentiment column so there is less to review.',
      ],
      correct: [0, 2],
      explanation:
        'Reviewable batches with verifiable structure and tiered steps preserve quality while saving time. An unreviewable mega-batch (B) and dropping needed output (D) sacrifice effectiveness.',
    },
    {
      question: 'A team moved complex contract summaries to the fastest tier and raised batch size to 100; two missed renewal clauses surfaced months later. What went wrong?',
      options: [
        'The team should have used an even faster tier.',
        'Efficiency outran review capacity and the task needed more reasoning depth; match tier and batch size to stakes.',
        'Contracts cannot be summarized by Claude.',
        'The missed clauses were unavoidable.',
      ],
      correct: [1],
      explanation:
        'Under-tiering complex work and over-batching beyond review are false economies. Faster still (A) worsens it; option C is false; the misses were avoidable with proper tiering and review (D).',
    },
    {
      question: 'How should an Associate demonstrate that a workflow optimization worked?',
      options: [
        'Report that the team "feels faster".',
        'Compare baseline and after measurements, include setup, review and maintenance costs, and show quality held.',
        'Count the number of prompts sent.',
        'Report time saved and omit review time since it is unchanged.',
      ],
      correct: [1],
      explanation:
        'Credible claims use measured before-and-after with full cost and a quality check. Feelings (A) and prompt counts (C) are not outcomes; omitting review time (D) misstates net savings.',
    },
    {
      question: 'Which statement best distinguishes a Skill from Project instructions?',
      options: [
        'Skills are only for developers; instructions are for everyone.',
        'Project instructions are always-on context for a topic, while a Skill is a packaged procedure Claude loads when a matching task appears, usable across topics.',
        'Skills replace the need for review.',
        'Instructions are temporary; Skills are permanent.',
      ],
      correct: [1],
      explanation:
        'That is the functional difference. Skills exist in claude.ai for all users (A), do not remove review (C), and instructions persist in the Project (D).',
    },
  ],
  statements: [
    { text: 'A prompt you have written three times is a candidate for a template, Skill or Project instruction.', isTrue: true, explanation: 'Repetition is the signal to create a reusable asset.' },
    { text: 'The larger the batch, the better the optimization.', isTrue: false, explanation: 'Batches must stay small enough to review every row; otherwise errors slip through.' },
    { text: 'Running a cheap extraction pass over many items and one expensive synthesis over the results is an efficient pattern.', isTrue: true, explanation: 'It matches tier to step and reduces cost without reducing judgment where it matters.' },
    { text: 'Removing the review step is a legitimate efficiency gain once outputs look reliable.', isTrue: false, explanation: 'It is a false economy; review is the control that catches the rare error.' },
    { text: 'Measurement of an optimization should include setup, review and maintenance time.', isTrue: true, explanation: 'Otherwise the reported saving overstates the benefit.' },
    { text: 'Skills in claude.ai are available only to API developers.', isTrue: false, explanation: 'Built-in and custom Skills are usable in claude.ai, subject to plan and settings.' },
    { text: 'An optimization that saves time but increases downstream errors is not an optimization.', isTrue: true, explanation: 'The objective is efficiency and effectiveness together.' },
  ],
  resources: [
    { label: 'Claude Help Center: Skills and Projects', url: 'https://support.claude.com/' },
    { label: 'Agent Skills overview (Claude docs)', url: 'https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview' },
  ],
};
