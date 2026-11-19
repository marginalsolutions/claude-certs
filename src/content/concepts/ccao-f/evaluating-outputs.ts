import type { Concept } from '../../types';

export const evaluatingOutputs: Concept = {
  id: 'evaluating-outputs',
  title: 'Evaluating Outputs',
  summary:
    'Judge every Claude output on accuracy, completeness and relevance, and know the tell-tale signs of hallucinated citations, numbers and names, internal inconsistencies, and bias.',
  certs: ['ccao-f', 'ccar-p'],
  domains: ['ccao-f-2', 'ccar-p-4', 'ccar-p-5'],
  tags: ['evaluation', 'hallucination', 'quality', 'bias'],
  difficulty: 'foundations',
  sections: [
    {
      heading: 'Three questions to ask of every output',
      body: `Output Evaluation is the single largest domain on the Associate exam (21%). The habit it tests is simple to state: never forward something you have not evaluated. Evaluation means asking three questions.

**Is it accurate?** Are the facts, figures, names, dates and quotations correct? Does each claim trace back to something you provided or something you can verify?

**Is it complete?** Did Claude cover everything the task required? A fluent answer that silently skips the hardest sub-question is a common failure. Check the output against your original request item by item.

**Is it relevant?** Did it answer the question asked, for the audience named, at the depth needed? Claude sometimes answers a neighboring, easier question very well.

Fluency is not evidence. Claude writes confidently whether it is right or wrong, so the polish of the prose tells you nothing about its accuracy. The sample exam item on this domain makes exactly that point: a confident summary citing a specific subsection number must still be verified against the official regulation text before it reaches the compliance team.`,
    },
    {
      heading: 'Recognizing hallucinations',
      body: `A hallucination is content that is plausible, specific and false. Claude generates text that fits the pattern of a correct answer; when it lacks the real fact, the pattern still gets completed. High-risk categories:

- **Citations and references**: section numbers, case names, article titles, URLs, page numbers. These look like exactly the kind of detail a careful author would include, which is why they are dangerous.
- **Numbers and statistics**: percentages, dollar figures, dates, headcounts. A hallucinated number is often round-ish and comes with no source.
- **Names and titles**: people, products, organizations, job titles, and quotations attributed to them.
- **Features and policies**: what a product can do, what a policy says, what a law requires.

Warning signs: a very specific detail with no source; a detail you did not provide and Claude had no way to look up; a claim that is suspiciously convenient for the argument; a reference you cannot find in thirty seconds of searching. Treat "Claude said it with confidence" as zero evidence either way.`,
    },
    {
      heading: 'Spotting inconsistencies and bias',
      body: `**Inconsistencies** are contradictions inside the output or between the output and your source. A summary that says "costs fell 12%" in paragraph two and "costs rose" in the conclusion; a table whose totals do not add up; a recommendation that ignores a constraint stated earlier in the same answer. Read the whole output, not just the opening, and check totals and dates mechanically.

**Bias** shows up in several ways:

- *Framing bias*: presenting one option favorably by default, or adopting the tone of the source without noting it is one-sided.
- *Representation bias*: examples, names or personas that default to one gender, culture or region; assumptions about who does what job.
- *Confirmation bias you introduced*: if your prompt said "explain why Plan A is best", Claude will do that even if Plan B is better. Ask for the case against your own preference.
- *Source bias*: research that leans on a single vendor or a single viewpoint.

Mitigation is partly prompting (ask for counterarguments, ask for diverse examples, ask what a skeptic would say) and partly review (have a person check for assumptions the team would not want to publish). Bias in a customer-facing or HR document is a reputational and legal risk, not only a quality issue.`,
    },
    {
      heading: 'A practical review checklist',
      body: `Before anything leaves your hands:

1. **Re-read your request.** Tick off each requirement against the output.
2. **Highlight every specific claim**: numbers, names, dates, citations, quotations.
3. **Trace each highlighted claim** to a source you provided or can check. Anything untraceable is unverified, not wrong, but it cannot go out as fact.
4. **Check internal consistency**: totals, timelines, terminology, tone.
5. **Read as the audience**: would they understand it, and would they object to any assumption?
6. **Decide the review tier**: can you sign off alone, or does this need a subject-matter expert (legal, medical, financial, HR, external comms)?

On the exam, distractors in this domain include sending the output because Claude sounded confident, asking Claude to rate its own confidence, and polishing the wording instead of checking the content. The correct option is almost always the one that verifies against an authoritative source or routes to a qualified human.`,
    },
  ],
  examples: [
    {
      title: 'The confident regulation summary (official sample item)',
      description:
        'An associate asks Claude to summarize a new regulation. Claude returns a confident summary citing a specific subsection number. The associate is about to send it to the compliance team. The correct action is to verify the cited subsection against the official regulation text first. Sending because Claude was confident, asking Claude to rate its own confidence, or rewording the summary to sound more formal all fail to address whether the citation is real.',
      takeaway: 'A specific-looking citation is exactly the kind of detail a model can fabricate; verify it against the authoritative source before a compliance audience sees it.',
    },
    {
      title: 'A mistake: the fluent, incomplete answer',
      description:
        'A product manager asked for an analysis covering market size, three competitors, pricing and regulatory risk. Claude returned a polished 800-word piece that covered the first three thoroughly and mentioned regulation in one vague sentence. The PM, impressed by the writing, almost circulated it. Checking the output against the original four requirements showed the gap. A follow-up prompt focused only on regulatory risk filled it.',
      takeaway: 'Completeness is checked item by item against your request; fluency can hide a skipped requirement.',
    },
    {
      title: 'Catching introduced bias',
      description:
        'A team lead asked Claude to "write up why we should adopt the four-day week pilot" for a leadership proposal. The draft was persuasive and one-sided. Before submitting, the lead asked a second prompt: "Now write the strongest case against, and list the assumptions the first version relied on." Two assumptions turned out to be untested, and the final proposal acknowledged them. Leadership later said the balance was why they approved the pilot.',
      language: 'text',
      code: `Follow-up prompt:
"Take the proposal above. Write the strongest case against it as a
skeptical CFO would. Then list every assumption the original relies
on and mark each as tested or untested."`,
      takeaway: 'If your prompt asked for one side, you introduced the bias; ask for the other side before you decide.',
    },
  ],
  keyPoints: [
    'Evaluate every output for accuracy, completeness and relevance before using it; fluency and confidence are not evidence.',
    'Hallucinations are plausible, specific and false; citations, numbers, names and product or policy claims are the highest-risk categories.',
    'A detail Claude had no way to know (not in your material, not looked up) should be treated as unverified.',
    'Check internal consistency mechanically: totals, dates, terminology, and whether the conclusion matches the body.',
    'Bias can come from the source, from defaults in examples and personas, or from a one-sided question you asked; request the counter-case.',
    'Check completeness item by item against your original request; a polished answer can skip the hardest part.',
    'Self-reported confidence from Claude is not a reliable accuracy signal; verification against an authoritative source is.',
  ],
  flashcards: [
    { front: 'Three questions to ask of every Claude output', back: 'Is it accurate? Is it complete? Is it relevant to the question, audience and depth asked for?' },
    { front: 'Definition of a hallucination', back: 'Content that is plausible, specific and false; the model completes the pattern of a correct answer without the real fact.' },
    { front: 'Four highest-risk categories for hallucination', back: 'Citations and references, numbers and statistics, names and titles, and product or policy or legal claims.' },
    { front: 'Does confident wording indicate accuracy?', back: 'No. Claude writes fluently whether right or wrong. Confidence is zero evidence either way.' },
    { front: 'How do you check completeness?', back: 'Re-read your original request and tick off each requirement against the output item by item.' },
    { front: 'Name three forms of bias in AI output', back: 'Framing bias (one option favored by default), representation bias (defaults in names, personas, examples), and confirmation bias introduced by a one-sided prompt.' },
    { front: 'Official sample: Claude confidently cites a subsection in a regulation summary. Correct action?', back: 'Verify the cited subsection against the official regulation text before sharing with compliance.' },
    { front: 'Why is "ask Claude to rate its own confidence" a wrong answer?', back: 'Self-reported confidence is not a reliable accuracy signal; only verification against an authoritative source is.' },
    { front: 'What is an inconsistency check?', back: 'Reading the whole output for contradictions: totals that do not add up, a conclusion that contradicts the body, constraints stated then ignored.' },
  ],
  quiz: [
    {
      question:
        'An associate asks Claude to summarize a new regulation. Claude produces a confident summary citing a specific subsection number. Before sending it to the compliance team, what is the MOST appropriate action?',
      options: [
        'Send it as-is, since Claude expressed high confidence.',
        'Verify the cited subsection against the official regulation text before sharing.',
        'Ask Claude to rate its own confidence and send it if the rating is high.',
        'Reword the summary to sound more formal, then send it.',
      ],
      correct: [1],
      explanation:
        'Models can fabricate specific-looking details such as citation numbers. Checking against the authoritative text is the required diligence. Self-reported confidence (A, C) is not an accuracy signal, and reformatting (D) does not address correctness.',
    },
    {
      question:
        'A polished 800-word analysis covers three of the four topics the manager requested and dismisses the fourth in one vague sentence. Which evaluation criterion did it fail, and what should the manager do?',
      options: [
        'Accuracy; ask Claude to add citations.',
        'Completeness; check the output against the original request and prompt specifically for the missing topic.',
        'Relevance; start over with a different model.',
        'Tone; ask for a more formal version.',
      ],
      correct: [1],
      explanation:
        'A skipped requirement is a completeness failure, detected by comparing output to request. Citations (A), a new model (C) or tone (D) do not address the gap.',
    },
    {
      question: 'Which TWO signals should raise suspicion that a detail in an output is hallucinated? (Select two)',
      options: [
        'The detail is very specific (a section number, a statistic) but no source is given and you did not provide it.',
        'The detail is written in a confident tone.',
        'The detail is suspiciously convenient for the argument and cannot be found in a quick search.',
        'The detail appears in the first paragraph.',
      ],
      correct: [0, 2],
      explanation:
        'Unsourced specificity and convenient-but-unfindable claims are classic hallucination markers. Confidence (B) is present in correct and incorrect output alike, and position (D) is irrelevant.',
    },
    {
      question:
        'A team lead asked Claude to "explain why we should adopt Plan A" and received a persuasive one-sided proposal. What is the best way to reduce the bias before presenting it?',
      options: [
        'Ask Claude to make the proposal even more persuasive.',
        'Ask Claude for the strongest case against Plan A and a list of the assumptions the proposal relies on.',
        'Remove the recommendation and present only facts.',
        'Present it as-is, since leadership can form their own view.',
      ],
      correct: [1],
      explanation:
        'The one-sidedness was introduced by the prompt; asking for the counter-case and assumptions restores balance. More persuasion (A) deepens the bias; removing the recommendation (C) hides rather than tests it; presenting as-is (D) passes the bias to decision-makers.',
    },
    {
      question: 'A Claude-generated table of regional sales shows a total that does not match the sum of its rows. What does this indicate?',
      options: [
        'The output has an internal inconsistency and should not be used until the figures are recomputed from the source.',
        'The model chose a more accurate rounding method; the total is fine.',
        'This is a formatting glitch and the numbers are reliable.',
        'The source data must be wrong; forward the table with a note.',
      ],
      correct: [0],
      explanation:
        'A total that does not reconcile is a consistency failure; recompute from the source data. Assuming clever rounding (B) or a glitch (C) excuses an error, and blaming the source without checking (D) forwards unverified numbers.',
    },
  ],
  statements: [
    { text: 'A confidently written answer is more likely to be accurate than a hedged one.', isTrue: false, explanation: 'Claude writes fluently regardless of accuracy; confidence is not a signal.' },
    { text: 'Citations, statistics and names are among the most common things models fabricate.', isTrue: true, explanation: 'They are specific details that fit the pattern of a good answer, so the model completes them even without the real fact.' },
    { text: 'Completeness is best judged by whether the answer feels thorough.', isTrue: false, explanation: 'Judge completeness by checking each requirement of your original request against the output.' },
    { text: 'A one-sided prompt can introduce bias into an otherwise balanced model.', isTrue: true, explanation: 'Asking "why is Plan A best" produces advocacy; ask for the counter-case as well.' },
    { text: 'Asking Claude to rate its own confidence is an accepted validation technique.', isTrue: false, explanation: 'Self-reported confidence is unreliable; verify against authoritative sources instead.' },
    { text: 'Internal consistency checks include confirming that totals add up and that the conclusion matches the body.', isTrue: true, explanation: 'Contradictions within an output are a signal that something was generated rather than derived.' },
    { text: 'If a detail is not in the material you provided and Claude had no lookup capability, it should be treated as unverified.', isTrue: true, explanation: 'Claude may be drawing on training knowledge, which can be outdated or wrong; verify before use.' },
  ],
  resources: [
    { label: 'Reduce hallucinations (Claude docs)', url: 'https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations' },
    { label: 'Claude Help Center', url: 'https://support.claude.com/' },
  ],
};
