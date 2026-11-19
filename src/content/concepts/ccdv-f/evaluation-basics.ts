import type { Concept } from '../../types';

export const evaluationBasics: Concept = {
  id: 'evaluation-basics',
  title: 'Evaluation Basics',
  summary:
    'Why you need evals, how to build an eval set from real traffic, which grader fits which task, what pass@k measures, and how to use evals as regression tests for prompt changes and model upgrades.',
  certs: ['ccdv-f', 'ccar-f', 'ccar-p', 'ccao-f'],
  domains: ['ccdv-f-4', 'ccdv-f-5', 'ccar-f-4', 'ccar-p-4', 'ccao-f-2', 'ccao-f-7'],
  tags: ['evals', 'testing', 'quality', 'regression', 'llm-as-judge'],
  difficulty: 'intermediate',
  diagram: 'eval-loop',
  sections: [
    {
      heading: 'Why evals, and what one is',
      body: `A prompt that "looks fine" on three examples is not evidence. Model outputs vary run to run, a prompt edit that fixes one case silently breaks another, and a model upgrade changes behaviour across the board. An **eval** turns "it seems better" into a number you can compare.

An eval has three parts:

1. **A set of inputs** (cases), each with whatever the application needs: the user message, attached files, conversation prefix, and usually an expected output or rubric.
2. **A runner** that sends each case through the *real* entry point of your app (same system prompt, tools, model, parameters) and records the output plus trace data such as \`usage\` and \`stop_reason\`.
3. **A grader** that scores each output.

Evaluate one flow at a time: a classifier, an extractor and an agent loop need different inputs and graders. Aim for roughly 15 to 100 cases for a first eval: fewer and one flaky case swings the score; many more and nobody reviews them. Evals are how you make deploy decisions, so every stakeholder should look at the cases and agree "yes, these are the situations that matter".`,
    },
    {
      heading: 'Building the eval set from real traffic',
      body: `The best cases come from production. In order of fidelity:

1. **Production logs and transcripts**: sample real requests, including the ugly ones. Check retention and PII rules first; an eval built on data you cannot keep is one you cannot re-run.
2. **Bug reports and complaints**: the cases someone already said went wrong. Every production incident should become an eval case.
3. **Hand-written by the team**: fast, but skewed toward what is salient rather than frequent. Use as a seed.
4. **Synthesised with a model**: lowest fidelity; anchor on a few real examples and a description of what makes a case hard, then vary them.

Label each case with tags (intent, difficulty, language, edge case) so you can see *which slice* regressed, not just the aggregate. Hold the set fixed while you iterate so scores are comparable, and version it alongside the prompt. Avoid leakage: do not tune the prompt on the same cases you report, or keep a held-out split.`,
    },
    {
      heading: 'Graders: match the method to the output',
      body: `| Grader | Works when | Watch out for |
|---|---|---|
| **Exact / normalised match** | Classification labels, ids, short canonical answers | Brittle to harmless formatting differences; normalise case and whitespace |
| **Code-based checks** | Structured output (schema validity, required fields, numeric tolerance), tool trajectories (did it call \`escalate\` when it should?), unit tests on generated code | Only tests what you thought to encode |
| **Rubric / LLM-as-judge** | Free text: summaries, support replies, explanations | Judge bias toward verbose or confident text; needs a specific rubric and calibration against human labels |
| **Human review** | Gold standard, calibrating judges, high-stakes slices | Slow and costly; sample rather than grade everything |

For LLM-as-judge, give the judge the rubric, the reference answer where one exists, and ask for a decision per criterion before an overall score. Use a different prompt (and often a different or stronger model) than the system under test, and spot-check judge verdicts against humans until agreement is high.

**pass@k**: for tasks where the system gets several attempts (coding, agent tasks), pass@k is the probability that at least one of k samples passes. pass@1 measures single-shot reliability, which is what most production flows need; a high pass@5 with a low pass@1 means the capability exists but the system is unreliable.`,
    },
    {
      heading: 'Regression testing and production monitoring',
      body: `Treat prompts and model ids like code: every change runs the eval before it ships. Compare against the baseline on the same cases and report per-slice deltas, cost per case and latency, not just the headline accuracy. A change that gains 2 points while doubling tokens may be a loss.

**Model upgrades** are the biggest regression risk. New releases change tokenisation (counts can rise ~30%), verbosity, literalness in following instructions, default effort and which parameters are accepted. Run the full eval on the new model with the migration changes applied before switching, then re-tune prompts where slices dropped.

In production, you cannot grade everything, so **monitor**: sample a percentage of live traffic into an asynchronous judge, track schema-validation failure rate, \`stop_reason\` distribution, refusal rate, latency percentiles and cost per completed task, and watch for drift when nothing was deployed. Feed flagged cases back into the eval set. This loop (traffic → cases → grade → fix → re-run → deploy → monitor) is what the diagram shows and what the exams expect you to describe.`,
    },
  ],
  examples: [
    {
      title: 'A minimal code-graded eval for a classifier',
      description:
        'A routing prompt labels support tickets as billing, technical or account. The team samples 60 real tickets, labels them, and runs this before every prompt change.',
      language: 'python',
      code: `import json, anthropic
client = anthropic.Anthropic()
cases = [json.loads(l) for l in open("eval/routing.jsonl")]   # {"ticket":..., "label":...}

def classify(ticket: str) -> str:
    r = client.messages.create(
        model="claude-opus-5-5", max_tokens=10, system=ROUTING_PROMPT,
        output_config={"format": {"type": "json_schema", "schema": LABEL_SCHEMA}},
        messages=[{"role": "user", "content": ticket}])
    return json.loads(r.content[0].text)["label"]

results = [(c, classify(c["ticket"])) for c in cases]
acc = sum(c["label"] == got for c, got in results) / len(results)
print(f"accuracy={acc:.2%}")
for c, got in results:
    if c["label"] != got: print("MISS", c["ticket"][:60], "->", got)`,
      takeaway: 'For labels, exact match on a schema-constrained output is cheap, deterministic and enough.',
    },
    {
      title: 'LLM-as-judge with a rubric',
      description:
        'Support replies cannot be exact-matched. The judge checks each rubric criterion and returns a structured verdict so the score is traceable.',
      language: 'python',
      code: `JUDGE = """You grade a customer-support reply. Reference facts: {facts}
Criteria: (1) states the correct refund window, (2) does not invent policy,
(3) ends with a clear next step. For each criterion answer pass/fail with a one-line reason."""

verdict = client.messages.create(
    model="claude-opus-5-5", max_tokens=400,
    output_config={"format": {"type": "json_schema", "schema": VERDICT_SCHEMA}},
    messages=[{"role": "user", "content": JUDGE.format(facts=case["facts"])
               + "\\n\\nREPLY:\\n" + reply}],
)`,
      takeaway: 'A judge needs explicit criteria and reference facts; a bare "rate 1-10" is noisy and biased toward verbosity.',
    },
    {
      title: 'Mistake: shipping a model upgrade on vibes',
      description:
        'A team swapped claude-sonnet-4-6 for claude-sonnet-5-5 after a few manual chats looked great. In production the extraction flow started returning longer explanations instead of bare JSON, and token spend rose 35% because the new tokenizer counts more tokens. Running the existing eval would have shown the format regression and the cost delta before launch.',
      language: 'text',
      code: `baseline  sonnet-4-6 : schema_valid 99.1%  acc 94.0%  mean_in 1,840 tok  cost/case $0.0041
candidate sonnet-5-5 : schema_valid 91.3%  acc 95.2%  mean_in 2,410 tok  cost/case $0.0056
-> fix: use output_config.format; re-run -> schema_valid 99.6%, acc 95.4%`,
      takeaway: 'Model upgrades are prompt changes in disguise; gate them with the same eval as any other change.',
    },
    {
      title: 'Turning an incident into a regression case',
      description:
        'A hallucinated discount code reached a customer. The team added the exact conversation to the eval set with a code-based check that no code outside the catalog appears in the reply. The next prompt iteration that reintroduced the problem failed CI instead of reaching production.',
      takeaway: 'Every production failure should become a permanent eval case.',
    },
  ],
  keyPoints: [
    'An eval is cases + a runner through the real entry point + a grader; it turns opinions into comparable numbers.',
    'Build cases from production logs and bug reports first; hand-written and synthetic cases are seeds, not the whole set.',
    'Exact match for labels, code checks for schemas and tool trajectories, rubric or LLM-as-judge for free text, humans to calibrate.',
    'LLM judges need explicit criteria, reference facts and calibration against human labels; they favour verbose text.',
    'pass@k is the chance at least one of k attempts passes; production usually cares about pass@1.',
    'Run the eval on every prompt change and every model upgrade; compare per slice, cost and latency, not just accuracy.',
    'In production, sample traffic into an async judge, track schema failures, stop_reason and refusal rates, latency and cost per task, and feed flagged cases back.',
  ],
  flashcards: [
    { front: 'What are the three parts of an eval?', back: 'A set of input cases, a runner that executes the real app on each case, and a grader that scores the outputs.' },
    { front: 'Best source of eval cases?', back: 'Production transcripts and bug reports; hand-written and synthetic cases are lower fidelity.' },
    { front: 'Which grader suits a classification label?', back: 'Exact (normalised) match, ideally on schema-constrained output.' },
    { front: 'Which grader suits free-text summaries?', back: 'A rubric-based LLM-as-judge calibrated against human labels, or human review for samples.' },
    { front: 'Known bias of LLM judges?', back: 'Preferring longer, more confident answers; mitigate with specific criteria, reference facts and calibration.' },
    { front: 'Define pass@k.', back: 'Probability that at least one of k independent attempts passes the test.' },
    { front: 'Why run the eval before a model upgrade?', back: 'New models change tokenisation, verbosity, instruction literalness and accepted parameters; evals catch slice regressions and cost changes.' },
    { front: 'Rough case count for a first eval?', back: 'About 15 to 100: enough to be stable, few enough to review.' },
    { front: 'How do you monitor quality in production without grading everything?', back: 'Sample live traffic into an asynchronous judge and track proxies like schema failure rate, stop_reason distribution, refusal rate, latency and cost per task.' },
  ],
  quiz: [
    {
      question:
        'A team wants to know whether a rewritten system prompt improved their invoice-extraction flow. Which approach gives the MOST reliable answer?',
      options: [
        'Try five invoices by hand with each prompt and compare.',
        'Run both prompts over a fixed set of labelled production invoices and compare schema validity and field accuracy.',
        'Deploy the new prompt and watch support tickets for a week.',
        'Ask Claude which prompt is better.',
      ],
      correct: [1],
      explanation:
        'A fixed labelled set with code-based grading isolates the prompt change. Hand tests are too few and non-deterministic, watching tickets is slow and confounded, and asking the model is an opinion without data.',
    },
    {
      question:
        'Which grading method is MOST appropriate for evaluating whether a support agent produced a helpful, policy-compliant free-text reply?',
      options: [
        'Exact string match against a reference reply',
        'Rubric-based LLM-as-judge with reference facts, spot-checked against human labels',
        'Counting the number of words',
        'Checking that the response is valid JSON',
      ],
      correct: [1],
      explanation:
        'Free text has many acceptable phrasings, so exact match fails; word count and JSON validity do not measure helpfulness or compliance.',
    },
    {
      question:
        'A coding agent has pass@1 of 40% and pass@5 of 85% on an eval. What does this tell the team?',
      options: [
        'The task is impossible for the model.',
        'The model can solve most tasks but is unreliable on a single attempt; improve consistency or add retries with verification.',
        'The eval set is too small.',
        'The grader is broken.',
      ],
      correct: [1],
      explanation:
        'High pass@5 shows capability; low pass@1 shows inconsistency. Nothing here indicates an eval size or grader problem, and the task is clearly solvable.',
    },
    {
      question:
        'Before switching production from claude-sonnet-4-6 to claude-sonnet-5-5, which TWO steps are most important? (Select two)',
      options: [
        'Run the full eval on the new model with migration changes applied and compare per-slice results.',
        'Compare cost per case, since the new tokenizer and verbosity change token counts.',
        'Skip the eval because newer models are always better.',
        'Lower max_tokens to offset any cost increase.',
      ],
      correct: [0, 1],
      explanation:
        'Upgrades change behaviour and cost; the eval and cost comparison reveal regressions before users do. Newer is not automatically better for a specific flow, and cutting max_tokens blindly risks truncation.',
    },
    {
      question:
        'Which is the best way to keep an eval honest while iterating on a prompt?',
      options: [
        'Tune the prompt on the full set and report the score on the same set.',
        'Keep a held-out split that is only scored, never used for tuning.',
        'Regenerate the eval set with a model each run.',
        'Remove cases the prompt keeps failing.',
      ],
      correct: [1],
      explanation:
        'Tuning and reporting on the same cases overfits; regenerating cases makes scores incomparable; removing failures hides regressions.',
    },
  ],
  statements: [
    { text: 'LLM-as-judge graders tend to favour longer, more confident answers unless given explicit criteria.', isTrue: true, explanation: 'Specific rubrics and reference facts reduce this bias; calibrate against human labels.' },
    { text: 'Exact match is the best grader for open-ended summaries.', isTrue: false, explanation: 'Summaries have many valid phrasings; use rubric or judge-based grading.' },
    { text: 'pass@1 measures how often a single attempt succeeds.', isTrue: true, explanation: 'It is the reliability figure most production flows care about.' },
    { text: 'A model upgrade does not require re-running evals because the prompt is unchanged.', isTrue: false, explanation: 'Model changes alter behaviour, tokenisation and parameters; they are among the largest regression risks.' },
    { text: 'Production incidents should be converted into permanent eval cases.', isTrue: true, explanation: 'This prevents the same failure from returning unnoticed.' },
    { text: 'The eval runner should call a simplified version of the prompt to keep tests fast.', isTrue: false, explanation: 'The runner must exercise the real entry point with the real prompt, tools and parameters, or it measures the wrong thing.' },
    { text: 'Monitoring in production can sample traffic into an asynchronous judge instead of grading every request.', isTrue: true, explanation: 'Sampling plus proxy metrics (schema failures, refusals, latency, cost) keeps monitoring affordable.' },
  ],
  resources: [
    { label: 'Define success criteria and build evals', url: 'https://platform.claude.com/docs/en/test-and-evaluate/define-success' },
    { label: 'Develop test cases (eval guide)', url: 'https://platform.claude.com/docs/en/test-and-evaluate/develop-tests' },
  ],
};
