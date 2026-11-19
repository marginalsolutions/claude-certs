import type { Concept } from '../../types';

export const definingEvaluationMetrics: Concept = {
  id: 'defining-evaluation-metrics',
  title: 'Defining Evaluation Metrics',
  summary:
    'Choose the handful of numbers that tell you whether a Claude system is working: task quality, latency percentiles, cost per completed task, safety and security behaviour, and the leading indicators that move before business outcomes do.',
  certs: ['ccar-p', 'ccdv-f', 'ccao-f'],
  domains: ['ccar-p-4', 'ccdv-f-4', 'ccao-f-2'],
  tags: ['evaluation', 'metrics', 'latency', 'cost', 'safety'],
  difficulty: 'advanced',
  diagram: 'eval-loop',
  sections: [
    {
      heading: 'Why metrics come before prompts',
      body: `An architect who cannot say what "good" means for a system cannot tell an improvement from a regression. Every later activity in this domain, building datasets, A/B testing, diagnosing issues, optimizing cost, depends on a metric definition agreed with the business **before** the first prompt is tuned.

A useful metric definition has four parts:

1. **What is measured** (for example "the extracted invoice total matches the ground-truth total to the cent").
2. **The unit** (per request, per conversation, per completed task).
3. **The target and the floor** ("target 97%, release blocked below 94%").
4. **How it is collected** (offline eval set, online sampling, human review).

The exam expects you to pick metrics that match the business problem, not generic ones. A support deflection bot is judged on resolution rate without escalation and customer satisfaction, not on BLEU score. An extraction pipeline is judged on field-level precision and recall, not on "the answer looked right".`,
    },
    {
      heading: 'The five metric families',
      body: `The CCAR-P blueprint names accuracy, latency, cost, safety and security. Treat them as five families and pick at least one concrete metric in each.

| Family | Typical concrete metrics | Notes |
|---|---|---|
| **Accuracy / quality** | Exact match, precision/recall/F1, rubric score, pairwise win rate, resolution rate, groundedness (claims supported by retrieved context) | Pick the one that matches the output shape: closed set → programmatic; open-ended → rubric or pairwise judge. |
| **Latency** | Time to first token, time to final token, end-to-end task time, reported as **p50 and p95** (sometimes p99) | Averages hide tails. A p95 of 20 s with a p50 of 2 s is a different product from a flat 4 s. |
| **Cost** | Cost per completed task, tokens per task split into uncached input, cache reads, cache writes and output | Cost per *token* is misleading; a cheaper model that fails and retries can cost more per task. |
| **Safety** | Refusal rate (appropriate vs inappropriate), harmful-output rate on red-team sets, policy-violation rate | Measure both over-refusal and under-refusal; one number cannot capture both. |
| **Security** | Prompt-injection success rate, data-leakage incidents, unauthorized tool-call attempts blocked | Security metrics come from adversarial sets, not from normal traffic. |

Record these as **separate columns**. Blending them into a single "score" hides the tradeoff you are actually making, for example a variant that is 2 points more accurate but 40% slower at p95.`,
    },
    {
      heading: 'Task-specific metrics',
      body: `Generic metrics rarely satisfy a stakeholder. Map each use case to the metric the business already understands:

- **Extraction / classification**: per-field precision and recall, confusion matrix, false-positive rate. Report them separately: a variant can "win" on accuracy by silently trading recall for precision.
- **Support / conversational agents**: first-contact resolution rate, escalation rate, average handle time, CSAT, and the rate of *incorrect* resolutions (the dangerous one).
- **RAG / knowledge assistants**: retrieval hit rate (is the right chunk in the top-k?), groundedness, citation accuracy, "I don't know" rate on out-of-scope questions.
- **Coding agents**: tests passing in a clean sandbox, diff applies cleanly, files outside scope untouched, tool-call count within budget.
- **Summarization / drafting**: rubric or pairwise judgment against a baseline, factual consistency with the source, length adherence.

A good rule: grade **outcomes and end states, not paths**. Requiring a specific tool-call sequence penalizes a model that solved the task a different valid way.`,
    },
    {
      heading: 'Leading vs lagging indicators',
      body: `Business outcomes (ticket volume reduced, revenue per agent, audit findings) are **lagging** indicators: they move weeks after a change and are confounded by everything else happening in the business. You cannot steer a release on them.

**Leading** indicators move within hours and predict the lagging ones: offline eval pass rate, groundedness score on a sampled set, refusal rate, p95 latency, cost per task, user thumbs-down rate, escalation rate. Design the metric set so each lagging business metric has at least one leading proxy, and validate the link once you have data ("when groundedness dropped below 0.9, CSAT fell two weeks later").

Exam angle: when a scenario asks which metric lets a team *catch a regression before customers do*, the answer is a leading indicator measured continuously, not a quarterly business KPI. When it asks which metric *proves business value to an executive*, the answer is the lagging outcome, with the leading indicators as supporting evidence.`,
    },
    {
      heading: 'Common mistakes',
      body: `- **Reporting averages for latency.** Users experience the tail. Always carry p95 next to p50.
- **Measuring cost per request instead of per completed task.** Multi-turn agents with retries make per-request numbers meaningless.
- **One blended score.** It hides regressions in one dimension behind gains in another.
- **Estimating tokens from string length.** Read \`usage\` on every response; estimates are off by enough to reverse a comparison.
- **Only measuring under-refusal.** An over-cautious system that refuses legitimate requests also fails the business; track appropriate and inappropriate refusals separately.
- **Metrics with no floor.** A target without a release-blocking threshold is a wish, not a control.`,
    },
  ],
  examples: [
    {
      title: 'Recording cost and latency per task from the usage object',
      description:
        'A claims-processing pipeline runs several model calls per claim. The team records the four token quantities and wall-clock time per *claim*, not per request, so cost per completed task can be computed with the correct rates for cache reads and writes.',
      language: 'python',
      code: `import time
from anthropic import Anthropic

client = Anthropic()
PRICE = {"input": 4, "cache_read": 0.4, "cache_write": 5, "output": 20}  # $/MTok, Opus 5.5

def call(messages, system, task_log):
    t0 = time.perf_counter()
    r = client.messages.create(model="claude-opus-5-5", max_tokens=2048,
                               system=system, messages=messages)
    u = r.usage
    task_log["latency_s"] += time.perf_counter() - t0
    task_log["cost_usd"] += (u.input_tokens * PRICE["input"]
        + (u.cache_read_input_tokens or 0) * PRICE["cache_read"]
        + (u.cache_creation_input_tokens or 0) * PRICE["cache_write"]
        + u.output_tokens * PRICE["output"]) / 1_000_000
    task_log["calls"] += 1
    return r`,
      takeaway: 'Roll up real usage per completed task; cost per request and estimated token counts both mislead.',
    },
    {
      title: 'The blended score that hid a regression',
      description:
        'A team scored its support bot with a single "quality index" that averaged accuracy, helpfulness and tone. A new prompt raised the index from 82 to 85. Two weeks later escalations spiked: the prompt had made answers friendlier and longer while the rate of *incorrect resolutions* rose from 3% to 7%. Splitting the metric into separate columns, with incorrect-resolution rate as a release-blocking floor, would have caught it offline.',
      takeaway: 'Report atomic metrics side by side and give the dangerous one a hard floor.',
    },
    {
      title: 'Choosing metrics for an invoice-extraction system',
      description:
        'Finance asked for "95% accuracy". The architect reframed it: per-field precision and recall on amount, vendor, date and tax id; a false-positive rate for the "needs human review" flag; p95 latency under 8 s because the ERP integration times out at 10 s; and cost per invoice under $0.05. Each metric was tied to a business consequence (a wrong amount is a payment error, a slow call is a timeout, a high cost erases the savings).',
      takeaway: 'Translate a vague accuracy wish into field-level metrics with business consequences and floors.',
    },
    {
      title: 'Leading indicator for a RAG assistant',
      description:
        'An internal knowledge assistant was judged quarterly on an employee survey. The architect added a daily groundedness score computed by an LLM judge on a 200-case sample and a retrieval hit-rate check against a golden set. When a document migration broke indexing, groundedness fell the same day, three months before the survey would have.',
      takeaway: 'Pair every lagging business metric with a leading proxy you can measure daily.',
    },
  ],
  keyPoints: [
    'Define metrics (what, unit, target and floor, collection method) before tuning prompts.',
    'Cover five families: accuracy/quality, latency, cost, safety, security. Keep them as separate columns.',
    'Report latency as p50 and p95; averages hide the tail users feel.',
    'Measure cost per completed task from real usage fields, not cost per request or per token.',
    'Match quality metrics to the output shape: closed-set outputs get programmatic checks, open-ended outputs get rubrics or pairwise judgment.',
    'Track appropriate and inappropriate refusals separately; both over- and under-refusal are failures.',
    'Leading indicators (eval pass rate, groundedness, p95) move within hours; lagging ones (CSAT, savings) move in weeks. You steer on leading and prove value with lagging.',
    'Grade outcomes and end states, not the path the model took.',
  ],
  flashcards: [
    { front: 'Which latency percentiles should an eval report?', back: 'p50 and p95 (sometimes p99). Averages hide tail latency.' },
    { front: 'Why is cost per token a misleading optimization unit?', back: 'A cheaper model that fails and retries can cost more per completed task. Optimize cost per completed task.' },
    { front: 'Which usage fields are needed to compute true cost?', back: 'input_tokens, cache_read_input_tokens, cache_creation_input_tokens and output_tokens, each at its own rate.' },
    { front: 'Good quality metrics for an extraction task?', back: 'Per-field precision, recall (and F1), confusion matrix, false-positive rate; reported separately, not as one accuracy number.' },
    { front: 'Leading vs lagging indicator?', back: 'Leading moves quickly and predicts outcomes (eval pass rate, groundedness, p95). Lagging is the business outcome itself (CSAT, cost savings).' },
    { front: 'What two refusal metrics should a safety eval track?', back: 'Appropriate refusals on harmful inputs (should be high) and inappropriate refusals on legitimate inputs (should be low).' },
    { front: 'Why not blend metrics into one score?', back: 'A blended score hides a regression in one dimension behind a gain in another and removes the tradeoff from view.' },
    { front: 'What is groundedness in a RAG eval?', back: 'The share of claims in the answer that are supported by the retrieved context.' },
    { front: 'Where do security metrics such as injection success rate come from?', back: 'Adversarial test sets, not normal production traffic.' },
    { front: 'What does "grade outcomes, not paths" mean?', back: 'Score whether the result is correct (end state, tests pass) rather than requiring a specific sequence of steps or tool calls.' },
  ],
  quiz: [
    {
      question:
        'A finance team asks for a Claude-based invoice extraction pipeline that is "95% accurate". Which metric definition BEST lets the architect verify the system meets the business need?',
      options: [
        'Average rubric score from an LLM judge rating overall answer quality from 1 to 10.',
        'Per-field precision and recall for amount, vendor and date, with a release-blocking floor on amount accuracy.',
        'Percentage of invoices processed without an API error.',
        'Mean latency per invoice compared with the manual process.',
      ],
      correct: [1],
      explanation:
        'Field-level precision and recall with a floor on the highest-consequence field maps directly to the business risk (wrong payments). A holistic rubric score is too coarse for structured extraction, error-free processing says nothing about correctness, and latency is a different metric family.',
    },
    {
      question:
        'A support assistant reports a mean response latency of 3.1 seconds, yet users complain about slowness. What is the MOST likely explanation and the right fix to the metric?',
      options: [
        'Users are exaggerating; the metric is fine.',
        'The mean hides a long tail; report p50 and p95 latency and set the SLO on p95.',
        'The metric should be switched to tokens per second.',
        'Latency should be measured only on cache hits.',
      ],
      correct: [1],
      explanation:
        'A low mean with user complaints is the signature of a heavy tail. Percentiles expose it. Tokens per second measures generation speed, not what the user waits for, and measuring only cache hits ignores the slow requests.',
    },
    {
      question: 'Which TWO are leading indicators an architect should monitor daily to catch regressions before the business notices? (Select two)',
      options: [
        'Quarterly customer satisfaction survey results.',
        'Groundedness score on a daily sample of production answers.',
        'Annual audit findings.',
        'Rate of inappropriate refusals on a fixed legitimate-request set.',
      ],
      correct: [1, 3],
      explanation:
        'Groundedness and refusal rates can be computed continuously and move within hours of a change. Survey results and audit findings are lagging outcomes measured long after the fact.',
    },
    {
      question:
        'A team compares two models by estimating cost from the average character length of prompts and responses. Their comparison shows Model A is 15% cheaper. Why should the architect distrust this result?',
      options: [
        'Character-length estimates are inaccurate enough to reverse a close comparison; cost must come from the usage object with cache rates applied.',
        'Model comparisons must always be done with the Batch API.',
        'Cheaper models are always worse, so the comparison is irrelevant.',
        'Cost should be measured in requests, not tokens.',
      ],
      correct: [0],
      explanation:
        'Estimated token counts and flat rates ignore cache reads/writes and tokenization differences, and the error can exceed a 15% gap. The Batch API is unrelated, "cheaper is worse" is false, and cost per request is a worse unit than cost per completed task.',
    },
    {
      question:
        'A safety review reports a 0.2% harmful-output rate and declares the system safe. Which additional metric is MOST important to add before release?',
      options: [
        'Average output length.',
        'Inappropriate refusal rate on a set of legitimate requests.',
        'Cache hit rate.',
        'Number of tools configured.',
      ],
      correct: [1],
      explanation:
        'Safety has two failure directions. A system can achieve a low harmful-output rate by refusing too much, which fails users and the business. Output length, cache hit rate and tool count do not measure safety.',
    },
    {
      question:
        'An agent eval requires the model to call tools in a specific order to pass. A newer model solves every task correctly but with a different order and scores 40%. What should the architect change?',
      options: [
        'Pin the older model permanently.',
        'Grade the end state (correct result, tests passing, nothing out of scope touched) instead of the trajectory.',
        'Add a system prompt instruction forcing the old order.',
        'Lower the passing threshold to 40%.',
      ],
      correct: [1],
      explanation:
        'The grader is measuring the path rather than the outcome, so it penalizes a valid solution. Pinning the model or forcing the old order preserves a grader bug; lowering the threshold makes the eval meaningless.',
    },
  ],
  statements: [
    { text: 'Cost per completed task is a better optimization unit than cost per token.', isTrue: true, explanation: 'A cheaper model that fails and retries bills its tokens plus the retry plus downstream failure cost.' },
    { text: 'Reporting mean latency is sufficient for an SLO on an interactive assistant.', isTrue: false, explanation: 'Means hide tails. Use p50 and p95 (or p99) and put the SLO on the tail percentile.' },
    { text: 'A single blended quality index is preferred because stakeholders want one number.', isTrue: false, explanation: 'Blended scores hide regressions in one dimension. Report atomic metrics as separate columns, then summarize.' },
    { text: 'Groundedness measures whether claims in a RAG answer are supported by the retrieved context.', isTrue: true, explanation: 'It is the key quality metric for RAG systems alongside retrieval hit rate.' },
    { text: 'A low harmful-output rate alone proves a system is safe for release.', isTrue: false, explanation: 'You must also measure over-refusal; refusing everything also yields a low harmful-output rate.' },
    { text: 'Leading indicators are measured continuously and predict lagging business outcomes.', isTrue: true, explanation: 'Eval pass rate, groundedness and p95 move within hours; CSAT and savings move in weeks.' },
    { text: 'Security metrics such as prompt-injection success rate can be derived from normal production traffic alone.', isTrue: false, explanation: 'They require adversarial test sets; benign traffic rarely contains attacks.' },
  ],
  resources: [
    { label: 'Define your success criteria (Claude docs)', url: 'https://platform.claude.com/docs/en/test-and-evaluate/define-success' },
    { label: 'Develop test cases (Claude docs)', url: 'https://platform.claude.com/docs/en/test-and-evaluate/develop-tests' },
    { label: 'Pricing', url: 'https://claude.com/pricing#api' },
  ],
};
