import type { Concept } from '../../types';

export const choosingAModelTier: Concept = {
  id: 'choosing-a-model-tier',
  title: 'Choosing a Model Tier',
  summary:
    'Haiku, Sonnet and Opus trade speed and cost against depth of reasoning, with newer frontier tiers such as Fable above Opus. Match the tier to the task instead of defaulting to the biggest or the cheapest.',
  certs: ['ccao-f', 'ccar-p'],
  domains: ['ccao-f-3', 'ccar-p-2'],
  tags: ['models', 'cost', 'speed', 'quality'],
  difficulty: 'foundations',
  diagram: 'model-tiers',
  sections: [
    {
      heading: 'The tiers in plain language',
      body: `Anthropic offers Claude in tiers that trade off speed and cost against depth.

| Tier | Character | Typical fit |
|---|---|---|
| **Haiku** | Fastest and cheapest. Strong on straightforward, well-specified tasks. | High-volume short replies, classification, extraction, simple reformatting, first-pass triage |
| **Sonnet** | The balanced middle. Fast enough for interactive work, capable enough for most analysis and writing. | Everyday drafting, summarization, analysis of moderate complexity, most daily productivity |
| **Opus** | Deepest reasoning in the standard lineup. Slower and more expensive per task. | Complex multi-step analysis, nuanced writing, ambiguous problems, high-stakes documents |
| **Fable** (and any newer frontier tier Anthropic releases) | Most capable, for the most demanding work; higher cost | Research-grade synthesis, very long or intricate reasoning, cases where Opus falls short |

Names persist across generations (Haiku 5.5, Sonnet 5.5, Opus 5.5 are the current ones), so "Sonnet" always means the balanced tier of whatever generation is current. Newer generations of a lower tier often match or beat older generations of a higher tier, which is why the sensible default is the mid tier, moving up only when the task demands it.

In claude.ai you choose the model from the model selector; which tiers are available depends on your plan and organizational settings.`,
    },
    {
      heading: 'What you are trading',
      body: `Three variables move together when you change tiers:

- **Speed**: smaller tiers respond faster. For interactive, back-and-forth work or anything a person is waiting on, speed is part of quality.
- **Cost**: larger tiers consume more of your plan's usage and, for organizations on the API, cost more per task. The price gap between the smallest and largest tiers is large (tens of times), so routing routine work to a small tier is the single biggest cost lever.
- **Depth**: larger tiers follow longer chains of reasoning, hold more nuance, handle ambiguity better and make fewer subtle errors on hard tasks.

The important insight is that depth only matters when the task has depth. A model that can reason about a merger agreement brings nothing extra to "turn these bullet points into a polite two-line reply", and it does it slower and at higher cost. Conversely, saving money by sending a complex contract analysis to the smallest tier produces errors that cost far more than the saving.

The exam's own sample item frames this directly: for a high volume of short customer-reply drafts where speed and cost matter more than deep reasoning, the correct choice is the faster, lower-cost model suited to straightforward, high-volume work.`,
    },
    {
      heading: 'Matching tier to task',
      body: `A practical procedure:

1. **Describe the task's difficulty honestly.** Is the answer mostly in the input (summarize, reformat, classify) or does it require judgment across many factors (recommend, reconcile, interpret)?
2. **Describe the volume and stakes.** Hundreds of low-stakes items favor a small tier. One high-stakes document favors a large tier.
3. **Start in the middle** for anything you are unsure about; Sonnet handles most daily work well.
4. **Move down** if the outputs are consistently fine and you are doing many of them.
5. **Move up** only when you see reasoning failures on the actual task: missed nuance, inconsistent conclusions, errors on hard cases. Do not move up to fix a vague prompt; fix the prompt first.
6. **Use different tiers for different steps** of a decomposed task: a small tier to triage and extract, a large tier for the synthesis and recommendation.

Signs you are over-tiered: waiting on long responses to simple questions; usage limits reached early in the day on routine work. Signs you are under-tiered: errors on edge cases, shallow analysis of genuinely complex material, outputs that miss the point even with a clear prompt.`,
    },
    {
      heading: 'Exam angle and common traps',
      body: `Expect scenarios that describe a task and ask which model choice "best fits". Reason from volume, stakes and difficulty.

Distractors to recognize:

- **"Use the most capable model for everything to maximize quality."** Wastes cost and speed on work that does not need it; the exam treats this as a wrong answer.
- **"Use the cheapest model for everything to minimize cost."** Produces errors on complex work; quality failures cost more than the savings.
- **"Disable features to reduce cost."** Features and model tier are different dials; turning off Projects or research does not address model fit.
- **"Switch platforms."** Not an answer to a model-selection question.
- **"Upgrade the model because the first draft was generic."** Generic drafts come from missing context in the prompt, not from model capability.

Also remember that model tier does not change what Claude knows about your organization, does not make training data more current, and does not substitute for verification. A bigger model hallucinates less often on hard reasoning but still cannot know facts it was never given.`,
    },
  ],
  examples: [
    {
      title: 'High-volume short replies (official sample item)',
      description:
        'An associate needs to generate a high volume of short customer-reply drafts where speed and cost matter more than deep reasoning. The best fit is a faster, lower-cost model suited to straightforward, high-volume tasks. Using the most capable, highest-cost model for every reply wastes budget and time; disabling product features or switching platforms does not address the trade-off at all.',
      takeaway: 'Match the tier to the task: routine, high-volume, low-depth work goes to the small, fast tier.',
    },
    {
      title: 'Tiering the steps of one workflow',
      description:
        'A customer insights team processes 2,000 open-text survey responses each quarter. They use the fastest tier to tag each response with a theme and sentiment (simple, repetitive, well-defined), then the deepest tier once to read the tagged summary, reconcile contradictory themes and write the recommendation memo for leadership. Cost dropped sharply compared with running everything on the top tier, and the memo quality went up because the big model received clean, structured input.',
      takeaway: 'Decomposed tasks let you use a cheap tier for volume and an expensive tier for judgment.',
    },
    {
      title: 'A mistake: upgrading the model to fix a vague prompt',
      description:
        'A manager asked "write a proposal for the new intake process" and got a generic draft. They switched to the top tier and resent the same prompt; the draft was slightly better written but still generic, because the prompt still contained no details about the current process, the problems, or the audience. Adding those details on the mid tier produced a usable proposal in one pass.',
      takeaway: 'A bigger model cannot supply context you did not give; fix the prompt before changing the tier.',
    },
  ],
  keyPoints: [
    'Haiku is fastest and cheapest, Sonnet is the balanced default, Opus offers the deepest reasoning in the standard lineup, and frontier tiers like Fable sit above Opus for the most demanding work.',
    'Changing tier trades speed and cost against depth; depth only helps when the task actually has depth.',
    'For high-volume, straightforward tasks where speed and cost matter, choose the faster, lower-cost model (official sample item).',
    'Start in the middle tier, move down when outputs are consistently fine at volume, move up only on observed reasoning failures.',
    'Use different tiers for different steps of a decomposed workflow: small for triage and extraction, large for synthesis and judgment.',
    'A bigger model does not fix a vague prompt, does not know your organization, and does not replace verification.',
    'Disabling features or switching platforms are not answers to a model-selection question.',
  ],
  flashcards: [
    { front: 'Which tier is fastest and cheapest?', back: 'Haiku.' },
    { front: 'Which tier is the balanced everyday default?', back: 'Sonnet.' },
    { front: 'Which tier offers the deepest reasoning in the standard lineup?', back: 'Opus; frontier tiers such as Fable sit above it for the most demanding work.' },
    { front: 'Official sample: high volume of short customer-reply drafts, speed and cost matter. Best choice?', back: 'A faster, lower-cost model suited to straightforward, high-volume tasks.' },
    { front: 'Three variables that move when you change tier', back: 'Speed, cost and depth of reasoning.' },
    { front: 'When should you move UP a tier?', back: 'When you observe reasoning failures on the actual task (missed nuance, inconsistent conclusions, errors on hard cases) despite a clear prompt.' },
    { front: 'When should you move DOWN a tier?', back: 'When you are doing many similar tasks and outputs are consistently fine; volume and routine favor smaller tiers.' },
    { front: 'Does a larger model make Claude\'s knowledge more current or company-specific?', back: 'No. Tier affects reasoning depth, not what information Claude has access to.' },
    { front: 'How can model tiers be combined in one workflow?', back: 'Use a small tier for triage, tagging and extraction steps, and a large tier for the final synthesis and recommendation.' },
    { front: 'Why is "disable features to reduce cost" a wrong answer to a model-selection question?', back: 'Features and model tier are different dials; turning off Projects or research does not address model fit.' },
  ],
  quiz: [
    {
      question:
        'An associate needs to generate a high volume of short customer-reply drafts where speed and cost matter more than deep reasoning. Which choice best fits the task?',
      options: [
        'Use the most capable, highest-cost model for every reply to maximize quality.',
        'Use a faster, lower-cost model suited to straightforward, high-volume tasks.',
        'Disable all product features to reduce cost.',
        'Switch to a different AI platform.',
      ],
      correct: [1],
      explanation:
        'Aligning model to task means matching routine high-volume work to a fast, low-cost tier and reserving the top tier for complex reasoning. Always using the top model (A) wastes cost and latency; disabling features (C) or switching platforms (D) does not address the trade-off.',
    },
    {
      question:
        'A legal operations lead must reconcile three conflicting drafts of a 60-page contract and recommend which clauses to keep, with reasoning. The task happens once a quarter. Which tier is the best fit?',
      options: [
        'The fastest, cheapest tier, because the task is infrequent.',
        'The deepest-reasoning tier available, because the task is complex, high-stakes and low-volume.',
        'Whichever tier is selected by default, to avoid overthinking.',
        'The cheapest tier, with the instruction "be very careful".',
      ],
      correct: [1],
      explanation:
        'Complex, nuanced, high-stakes and infrequent work is where depth pays off and cost is not the constraint. Infrequency (A) does not reduce difficulty; defaults (C) ignore fit; instructions (D) cannot add reasoning capacity a small tier lacks.',
    },
    {
      question: 'Which TWO are valid reasons to move to a larger model tier? (Select two)',
      options: [
        'The current tier produces inconsistent conclusions on genuinely complex cases even with a clear, well-contexted prompt.',
        'The first draft was generic.',
        'The task requires holding many interacting constraints and the current tier keeps dropping some.',
        'Claude did not know an internal company acronym.',
      ],
      correct: [0, 2],
      explanation:
        'Observed reasoning failures and dropped constraints on hard tasks justify more depth. A generic draft (B) is a prompt problem; missing company knowledge (D) is a context problem that no tier fixes.',
    },
    {
      question: 'A team tags 2,000 survey responses per quarter and then writes one strategic memo. How should they assign tiers?',
      options: [
        'Top tier for everything to ensure consistency.',
        'Cheapest tier for everything to minimize cost.',
        'A small, fast tier for tagging the responses and a deep tier for the single synthesis memo.',
        'A deep tier for tagging and a small tier for the memo, since the memo is shorter.',
      ],
      correct: [2],
      explanation:
        'Tagging is high-volume and simple; the memo is low-volume and requires judgment. Option C matches each. Uniform top tier (A) wastes cost; uniform cheap tier (B) weakens the memo; option D inverts the fit.',
    },
    {
      question: 'What does the tier name "Sonnet" refer to across model generations?',
      options: [
        'A specific model version that never changes.',
        'The balanced middle tier of whichever generation is current.',
        'The model used only for creative writing.',
        'The tier reserved for enterprise customers.',
      ],
      correct: [1],
      explanation:
        'Tier names persist across generations and describe position in the lineup. Sonnet is not frozen (A), not writing-specific (C), and not plan-restricted by definition (D).',
    },
  ],
  statements: [
    { text: 'Using the most capable model for every task is the safest way to maximize quality.', isTrue: false, explanation: 'It wastes cost and speed on work that does not need depth; the exam treats this as a wrong answer.' },
    { text: 'Haiku is the fastest and lowest-cost tier.', isTrue: true, explanation: 'It is suited to straightforward, high-volume tasks.' },
    { text: 'A larger model knows more about your company\'s internal policies.', isTrue: false, explanation: 'Tier affects reasoning depth; company knowledge comes only from what you provide.' },
    { text: 'Different steps of one workflow can reasonably use different model tiers.', isTrue: true, explanation: 'Small tiers for triage and extraction, large tiers for synthesis and judgment.' },
    { text: 'Disabling Projects and research is an effective way to address a model-selection trade-off.', isTrue: false, explanation: 'Features and model tier are separate dials.' },
    { text: 'The sensible default for most daily work is the middle tier, moving up only on observed reasoning failures.', isTrue: true, explanation: 'Newer mid-tier models handle most productivity work; escalate on evidence, not assumption.' },
    { text: 'A newer generation of a lower tier can match or outperform an older generation of a higher tier.', isTrue: true, explanation: 'Generations improve, which is why defaulting to the mid tier of the current generation is reasonable.' },
  ],
  resources: [
    { label: 'Models overview (Claude docs)', url: 'https://platform.claude.com/docs/en/about-claude/models/overview' },
    { label: 'Choosing a model (Claude docs)', url: 'https://platform.claude.com/docs/en/about-claude/models/choosing-a-model' },
    { label: 'Claude pricing', url: 'https://claude.com/pricing' },
  ],
};
