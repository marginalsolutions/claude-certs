import type { Concept } from '../../types';

export const abTestingAndIterativeImprovement: Concept = {
  id: 'ab-testing-and-iterative-improvement',
  title: 'A/B Testing and Iterative Improvement',
  summary:
    'Compare prompt and model variants rigorously, offline with split datasets and online with A/B or shadow traffic, and hill-climb against an eval without overfitting to it.',
  certs: ['ccar-p', 'ccdv-f'],
  domains: ['ccar-p-4', 'ccdv-f-4'],
  tags: ['evaluation', 'ab-testing', 'experimentation', 'iteration'],
  difficulty: 'advanced',
  diagram: 'eval-loop',
  sections: [
    {
      heading: 'Offline first, online second',
      body: `Iteration on a Claude system follows a ladder, and each rung is cheaper and faster than the next:

1. **Offline eval** on a fixed dataset. Minutes, no customer exposure, fully repeatable. This is where most prompt iteration should happen.
2. **Shadow testing.** The candidate variant runs on live traffic in parallel with production, but its output is logged and never shown to users. Reveals distribution gaps the offline set missed, measures real latency and cost, and is safe for high-risk changes such as a model upgrade. Costs double inference on the shadowed share.
3. **A/B test.** Users are randomly assigned to control or variant and the business metric (resolution rate, conversion, thumbs-up) is compared. The only way to measure real user impact, but slow, exposes customers, and needs statistical care.
4. **Canary / gradual rollout.** The winning variant gets 5%, then 25%, then 100% of traffic with automated rollback on metric breach.

Exam angle: a question that describes a risky change (new model, new retrieval index) and asks how to validate it *without customer impact* is pointing at shadow testing. One that asks how to measure *actual business impact* is pointing at a randomized A/B test.`,
    },
    {
      heading: 'Statistical care',
      body: `LLM outputs are non-deterministic and small eval sets are noisy, so "variant B scored 2 points higher" often means nothing.

- **Know your noise floor.** For a pass rate on n cases with R repetitions, the 95% half-width is roughly 1/sqrt(n·R): 25×2 ≈ ±14 points, 100×2 ≈ ±7. Before a comparison, state the smallest difference worth acting on and check the eval can see it.
- **Use paired comparisons.** Run both variants on the same cases and compare per-case differences; this removes case-difficulty variance.
- **Repeat runs.** Two or three repetitions per case expose model variance; grader variance should be measured separately by grading the same output twice.
- **Fix confounders.** Same model, same cache state (one warm and one cold variant will differ in latency and cost for reasons unrelated to the change), same eval set version, same judge.
- **Online tests need pre-registered metrics and a stopping rule.** Decide the primary metric, the minimum detectable effect and the sample size before starting; do not peek daily and stop when it looks good.
- **Segment, but carefully.** Check that a win on average is not a loss for an important segment (a language, a customer tier), while remembering that slicing many ways produces spurious findings.`,
    },
    {
      heading: 'Hill-climbing against an eval',
      body: `Iterative improvement is a loop: baseline → inspect failures → form a hypothesis → change one thing → re-run → keep or revert. To make the loop trustworthy:

- **Split the data** into **train** (what you look at to form hypotheses and pull examples from), **validation** (what you measure each round) and a **held-out test set** you touch only at the end. Draw the split at random, stratified by category, never by baseline score; hand-picking the worst cases as the train set guarantees fixes that target the tail rather than the population.
- **Change one variable per round** and record the diff. If a round changes the prompt, a tool description and the effort level, you learn nothing when the score moves.
- **Categorize failures before grinding.** When the loop stalls, bucket the remaining failures: retrieval misses, instruction-following, grader errors, genuinely ambiguous cases. Each bucket needs a different fix, and some (grader errors, bad labels) are not model problems.
- **Set a stopping condition.** A target score, a budget, or diminishing returns over N rounds.
- **Hold the other metrics.** A prompt change that raises accuracy while doubling output tokens is a tradeoff, not a win; report cost and latency alongside.`,
    },
    {
      heading: 'Avoiding overfitting the eval',
      body: `An eval you climb for long enough becomes a target rather than a measurement. Symptoms: the validation score climbs while the held-out test score and production metrics do not; the prompt accumulates special-case rules that describe eval cases; the system prompt contains eval examples verbatim.

Defences:

- Keep the held-out test set invisible to anyone editing prompts and check it rarely (end of a climb, before release).
- Refresh the validation set from recent production traffic periodically so the target moves with reality.
- Prefer **general principles** in prompt changes over case-specific patches ("cite the policy section" rather than "when asked about refunds over $500, mention clause 4.2").
- Watch for degenerate strategies: a model that answers "I don't know" to everything can score well on an eval that penalizes wrong answers more than non-answers.
- Confirm wins online: a shadow or A/B run is the final check that an offline gain is real.`,
    },
  ],
  examples: [
    {
      title: 'Shadow-testing a model upgrade',
      description:
        'A bank wants to move its document-classification pipeline from Sonnet 4.6 to Sonnet 5.5. Instead of flipping the model id, the team runs the candidate on 20% of live requests in shadow mode, stores both outputs, and compares agreement and per-class recall for two weeks before any customer sees a Sonnet 5.5 answer.',
      language: 'python',
      code: `import asyncio, random
from anthropic import AsyncAnthropic

client = AsyncAnthropic()

async def classify(model, doc):
    r = await client.messages.create(model=model, max_tokens=50,
        system=SYSTEM, messages=[{"role": "user", "content": doc}])
    return r.content[0].text.strip(), r.usage

async def handle(doc):
    prod_task = classify("claude-sonnet-4-6", doc)
    if random.random() < 0.20:               # shadow 20% of traffic
        prod, shadow = await asyncio.gather(prod_task, classify("claude-sonnet-5-5", doc))
        log_shadow(doc_id=doc.id, prod=prod, shadow=shadow)  # never shown to users
    else:
        prod = await prod_task
    return prod[0]                           # users only ever see production output`,
      takeaway: 'Shadow mode measures a risky change on real traffic with zero customer exposure.',
    },
    {
      title: 'The 2-point "win" that was noise',
      description:
        'A team declared a new prompt the winner after it scored 84% versus 82% on a 40-case set, one run each. The noise floor on 40 cases is about ±11 points. When rerun three times each, the two prompts alternated in rank. The fix was to grow the validation set to 200 stratified cases, run two reps, and use paired per-case comparison; the real difference turned out to be under one point.',
      takeaway: 'Compute the noise floor before declaring a winner; small sets cannot see small effects.',
    },
    {
      title: 'Overfitting a RAG prompt',
      description:
        'After 15 rounds of hill-climbing, a knowledge assistant\'s validation score rose from 70% to 91%. The system prompt had grown to include eleven rules of the form "when asked about X, answer Y". The held-out test set scored 72%. The team reverted to a principle-based prompt ("answer only from the provided context and cite the section"), fixed two retrieval bugs the failure categorization had exposed, and reached 86% on both validation and test.',
      takeaway: 'Case-specific prompt rules are memorization; the held-out set reveals it.',
    },
    {
      title: 'A/B test with a pre-registered plan',
      description:
        'A retailer\'s shopping assistant tests a new tone-of-voice prompt. Before launch the team wrote down: primary metric add-to-cart rate, minimum detectable effect 1.5 points, 50/50 split by hashed user id, required sample 40,000 sessions, guardrail metrics (refusal rate and p95 latency must not worsen). The test ran to the planned sample size and the variant was adopted with a documented 1.9-point lift.',
      takeaway: 'Decide metric, effect size, sample size and guardrails before starting; do not stop when it looks good.',
    },
  ],
  keyPoints: [
    'Iterate offline first; use shadow testing for risky changes with no customer exposure; use randomized A/B tests to measure real user impact; roll out gradually with rollback.',
    'Know the noise floor (roughly 1/sqrt(n·R)) and the smallest difference worth acting on before comparing variants.',
    'Use paired comparisons on the same cases, repeat runs, and hold confounders (model, cache state, judge, eval version) constant.',
    'Split data into train, validation and held-out test at random (stratified), never by baseline score.',
    'Change one variable per round, record the diff, and categorize failures when progress stalls.',
    'Hold cost and latency alongside the quality metric; a gain that doubles tokens is a tradeoff.',
    'Overfitting signs: validation climbs while test and production do not; prompt fills with case-specific rules.',
    'Pre-register online tests: primary metric, minimum detectable effect, sample size, guardrail metrics, stopping rule.',
  ],
  flashcards: [
    { front: 'What is shadow testing?', back: 'Running a candidate variant on live traffic in parallel with production, logging its output without showing it to users.' },
    { front: 'When is an A/B test required rather than an offline eval?', back: 'When you need to measure real user or business impact (conversion, resolution rate, CSAT) rather than output quality on fixed cases.' },
    { front: 'Approximate 95% noise floor for a pass rate on 100 cases × 2 reps?', back: 'About ±7 points.' },
    { front: 'Why use paired per-case comparison?', back: 'It removes case-difficulty variance so the difference between variants is isolated.' },
    { front: 'How should train/validation/test splits be drawn?', back: 'At random, stratified by category; never by baseline score.' },
    { front: 'Why change only one variable per hill-climb round?', back: 'So a score movement can be attributed to a specific change and reverted if needed.' },
    { front: 'Name two symptoms of overfitting an eval.', back: 'Validation score climbs while held-out test and production do not; the prompt accumulates case-specific rules or eval examples.' },
    { front: 'What should be decided before starting an online A/B test?', back: 'Primary metric, minimum detectable effect, sample size, guardrail metrics and the stopping rule (pre-registration).' },
    { front: 'What is a canary rollout?', back: 'Shipping the winning variant to a small share of traffic first and expanding with automated rollback on metric breach.' },
    { front: 'What is a degenerate strategy in eval terms?', back: 'A behaviour that scores well without solving the task, e.g. answering "I don\'t know" everywhere when non-answers are penalized less than wrong answers.' },
  ],
  quiz: [
    {
      question:
        'A healthcare company wants to validate a new Claude model for its clinical-note summarizer before any clinician sees output from it, using realistic traffic. Which approach BEST fits?',
      options: [
        'A 50/50 A/B test on live users.',
        'Shadow testing: run the new model in parallel on live requests, log its output, compare against production without displaying it.',
        'Switch the model id in production and monitor complaints.',
        'Ask the model to rate its own summaries.',
      ],
      correct: [1],
      explanation:
        'Shadow mode gives real-traffic evidence with zero exposure, which fits the high-risk clinical context. An A/B test exposes users, a straight switch is uncontrolled, and self-rating is not an evaluation.',
    },
    {
      question:
        'Two prompts score 84% and 82% on a 40-case eval after one run each. The team wants to ship the first. What is the MOST appropriate response?',
      options: [
        'Ship it; 2 points is a measurable gain.',
        'The noise floor on 40 cases is around ±11 points; increase cases and repetitions and use paired comparison before concluding.',
        'Ship the second prompt because it is shorter.',
        'Switch to a larger model to break the tie.',
      ],
      correct: [1],
      explanation:
        'A 2-point difference on 40 single-run cases is well inside the noise. The fix is more statistical resolution, not an arbitrary choice or a model change.',
    },
    {
      question: 'Which TWO practices help prevent overfitting a prompt to the evaluation set? (Select two)',
      options: [
        'Keep a held-out test set that prompt authors never see and check it only at the end of a climb.',
        'Select the training split from the lowest-scoring baseline cases so fixes target the hardest problems.',
        'Prefer general principles in prompt changes over case-specific rules.',
        'Copy the hardest eval cases into the system prompt as few-shot examples.',
      ],
      correct: [0, 2],
      explanation:
        'A hidden test set and principle-based changes generalize. Selecting train by baseline score biases the sample toward the tail, and copying eval cases into the prompt is leakage.',
    },
    {
      question:
        'After ten rounds of hill-climbing, the validation score has plateaued at 78%. What should the architect do NEXT?',
      options: [
        'Run ten more rounds with larger prompt changes.',
        'Categorize the remaining failures (retrieval misses, instruction following, grader errors, ambiguous labels) and fix each bucket with the right tool.',
        'Declare 78% the ceiling.',
        'Replace the eval with a new one that scores higher.',
      ],
      correct: [1],
      explanation:
        'A stall means the remaining failures have different causes; bucketing them reveals which are prompt problems, which are system bugs and which are measurement errors. Grinding blindly or swapping the eval does not address causes.',
    },
    {
      question:
        'An online A/B test shows the variant ahead after two days with 3,000 sessions out of a planned 40,000. The product owner wants to stop and ship. Why is that a problem?',
      options: [
        'Stopping early on a favourable peek inflates false positives; the pre-registered sample size and stopping rule should be respected.',
        'A/B tests must always run for exactly 30 days.',
        'The variant cannot be ahead this early, so the data is corrupt.',
        'Only offline evals can decide releases.',
      ],
      correct: [0],
      explanation:
        'Peeking and stopping when results look good is a classic source of spurious wins. There is no fixed 30-day rule, early leads are common noise, and online tests are a legitimate release input when run correctly.',
    },
    {
      question:
        'A prompt change raises accuracy from 85% to 89% but doubles average output tokens and raises p95 latency from 4 s to 9 s. How should this be reported?',
      options: [
        'As a clear win; accuracy is the only metric that matters.',
        'As a tradeoff with all three metrics shown side by side, for the stakeholders to decide against the latency budget.',
        'As a regression; latency always outranks accuracy.',
        'Only the accuracy number should be shared to avoid confusion.',
      ],
      correct: [1],
      explanation:
        'Quality, cost and latency must be reported together so the tradeoff is explicit. Neither metric universally outranks the other; the business constraints decide.',
    },
  ],
  statements: [
    { text: 'Shadow testing exposes a share of users to the candidate variant\'s output.', isTrue: false, explanation: 'Shadow output is logged and compared but never shown to users; that is the point.' },
    { text: 'Paired per-case comparison reduces the variance caused by differences in case difficulty.', isTrue: true, explanation: 'Both variants face the same cases, so the per-case difference isolates the variant effect.' },
    { text: 'Choosing the hill-climb training split from the worst-scoring baseline cases is good practice because it focuses effort.', isTrue: false, explanation: 'It biases the split toward pathological cases and inflates apparent gains; split at random, stratified by category.' },
    { text: 'A canary rollout sends the new variant to a small share of traffic with automated rollback on metric breach.', isTrue: true, explanation: 'It limits blast radius while gathering production evidence.' },
    { text: 'If the validation score rises but the held-out test score does not, the prompt is probably overfitting.', isTrue: true, explanation: 'The gap between the set you optimize on and the set you do not is the definition of overfitting.' },
    { text: 'Running one repetition per case is enough because current Claude models are deterministic.', isTrue: false, explanation: 'Outputs vary between runs; repetitions are needed to measure model variance.' },
    { text: 'Online A/B tests should pre-register the primary metric, effect size and sample size.', isTrue: true, explanation: 'Pre-registration prevents peeking and metric shopping.' },
  ],
  resources: [
    { label: 'Develop test cases (Claude docs)', url: 'https://platform.claude.com/docs/en/test-and-evaluate/develop-tests' },
    { label: 'Prompt engineering overview (Claude docs)', url: 'https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview' },
  ],
};
