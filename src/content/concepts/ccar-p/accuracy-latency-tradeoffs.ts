import type { Concept } from '../../types';

export const accuracyLatencyTradeoffs: Concept = {
  id: 'accuracy-latency-tradeoffs',
  title: 'Accuracy–Latency Trade-offs',
  summary:
    'Understand the levers that trade accuracy against latency and cost (effort, model size, retrieval depth, streaming, caching, fast mode), set latency budgets per component, and justify every configuration with measurements.',
  certs: ['ccar-p', 'ccdv-f', 'ccar-f'],
  domains: ['ccar-p-3', 'ccar-p-4', 'ccar-p-2', 'ccdv-f-5', 'ccar-f-5'],
  tags: ['latency', 'accuracy', 'effort', 'streaming', 'caching', 'fast-mode', 'sla'],
  difficulty: 'advanced',
  sections: [
    {
      heading: 'Where latency comes from',
      body: `End-to-end latency for a Claude request has distinct parts, and each responds to different levers:

| Component | Driven by | Levers |
|---|---|---|
| Pre-model work | Auth, retrieval, prompt assembly | Caching retrieval results, precomputing, narrower indexes, parallel fetches |
| Time to first token (TTFT) | Uncached input size, thinking depth, queueing | Prompt caching, lower effort, smaller prompt, smaller model |
| Generation time | Output tokens × per-token speed | Shorter outputs, structured formats, fast mode, smaller model |
| Tool round trips | Number of iterations × (model + tool latency) | Fewer, better tools; parallel tool calls; batching lookups |
| Post-model work | Validation, formatting, side effects | Async where possible |

Users perceive TTFT and the stream of output, not total time. Streaming does not reduce total latency, but it transforms a 6-second wait into a response that starts in under a second. For interactive products, streaming is the first optimisation, and the SDK helpers (\`.stream()\` with \`get_final_message()\` / \`finalMessage()\`) make it cheap to adopt.`,
    },
    {
      heading: 'The accuracy side of each lever',
      body: `Every latency lever has an accuracy consequence that must be measured, not assumed:

- **Effort.** Lower effort cuts thinking tokens and TTFT. On well-defined tasks accuracy barely moves; on multi-step judgment it can drop. Sweep effort on the eval set per task class.
- **Model size.** Smaller models are faster per token and cheaper, but a stronger model at low effort frequently beats a smaller model at high effort on both axes. Compare configurations, not models.
- **Retrieval depth.** More passages raise recall but add input tokens and dilute attention. Measure answer accuracy against the number of passages; the curve usually flattens quickly. Reranking lets you fetch many and send few.
- **Caching.** Pure win for latency and cost when the prefix is stable; no accuracy cost. Design prompts to be cacheable before touching other levers.
- **Fast mode.** A per-request speed setting on supported models (Opus 5.5 on the Claude API) that increases output speed at a higher per-token price. Same model, same quality; it buys time with money. Fit for latency-critical paths with short outputs.
- **Output length.** Asking for only what is needed (a label, a schema) is the cheapest latency win and often improves downstream reliability.
- **Parallelism.** Independent tool calls or subagents in parallel cut wall-clock time at the same token cost.

The exam expects you to pick the lever that matches the bottleneck. If TTFT dominates, cache and lower effort; if generation dominates, shorten output or use fast mode; if tool loops dominate, redesign tools.`,
    },
    {
      heading: 'Latency budgets per component',
      body: `Turn the SLA into engineering constraints by allocating it:

Example, an interactive assistant with p95 under 4 seconds to first visible token and under 12 seconds to completion:

| Stage | p95 budget | Design implication |
|---|---|---|
| Auth and input handling | 100 ms | Session cache, no synchronous external calls |
| Retrieval | 500 ms | Vector + keyword index with precomputed embeddings; rerank top 30 to 6 |
| TTFT | 1,500 ms | Cached 15K prefix; effort low for FAQ class, medium for complex class |
| Streaming output | ≤ 8 s | Cap at 600 output tokens; structured response |
| Validation and post-processing | 200 ms | Schema check and policy classifier on the streamed result |

Any stage that misses its budget on the measurement dashboard is a redesign target. Budgets also govern what belongs on the interactive path at all: a 20-second deep analysis belongs behind "we will email you the report" or in a background job, not in a chat turn. The Batches API, with no latency SLA and a 50% discount, is the home for work with no user waiting.

Set budgets for p95 or p99, not averages. Averages hide the tail that users complain about.`,
    },
    {
      heading: 'Justifying decisions with measurements',
      body: `An architect must be able to defend a configuration with numbers. The minimum evidence for each decision:

1. **Eval accuracy** for each candidate configuration on the same dataset, with the quality bar stated.
2. **Latency distribution** (p50, p95, p99) under realistic load, not a single timing.
3. **Cost per task** from \`usage\` fields, with cached and uncached input separated.
4. **The decision rule**: the cheapest or fastest configuration that clears the quality bar with margin.

Record this in an architecture decision record: the options considered, the measurements, the choice, and the conditions under which it should be revisited (a new model release, a change in traffic mix). Keep the eval harness runnable so the decision can be re-checked quarterly.

Exam items present a latency complaint and candidate changes. The best answers target the measured bottleneck without sacrificing a stated accuracy requirement, or move non-interactive work off the interactive path. Distractors trade away required accuracy ("switch to the smallest model"), optimise the wrong component ("raise max_tokens to speed up output"), or make changes without measuring.`,
    },
  ],
  examples: [
    {
      title: 'Diagnosing TTFT before changing models',
      description:
        'A support assistant\'s p95 TTFT was 5 seconds. The team\'s first instinct was to switch from Opus to Haiku. Measurements showed cache_read_input_tokens was zero (a per-request timestamp sat in the system prompt) and the FAQ class ran at effort high. Fixing the prefix and setting effort to low for the FAQ class brought p95 TTFT to 1.1 seconds with no model change and no accuracy loss on the eval set.',
      language: 'python',
      code: `with client.messages.stream(
    model="claude-opus-5-5", max_tokens=600,
    output_config={"effort": "low" if route == "FAQ" else "medium"},
    system=[{"type": "text", "text": STABLE_PROMPT, "cache_control": {"type": "ephemeral"}}],
    messages=[{"role": "user", "content": f"Today: {today}\\n\\n{question}"}],  # volatile data after the prefix
) as stream:
    first = None
    for text in stream.text_stream:
        first = first or time.perf_counter()
        emit(text)
    msg = stream.get_final_message()
metrics.record(ttft=first - t0, cache_read=msg.usage.cache_read_input_tokens, effort=route)`,
      takeaway: 'Measure which component dominates; caching and effort often fix TTFT without a model change.',
    },
    {
      title: 'Mistake: trading away required accuracy to hit a latency target',
      description:
        'A compliance screening tool had a 97% recall requirement and a 3-second SLA. To hit the SLA the team moved to a smaller model at low effort and met 2.4 seconds, but recall fell to 91%. Compliance rejected the release. The right approach split the path: a fast first-pass classifier streams a provisional result within the SLA, and borderline cases run a deeper second pass asynchronously with a clear "under review" status.',
      takeaway: 'Never silently trade a stated accuracy requirement for latency; restructure the path so the slow, accurate work runs where its latency is acceptable.',
    },
    {
      title: 'Retrieval depth curve',
      description:
        'A legal Q&A team measured answer accuracy against the number of passages sent: 3 passages 84%, 6 passages 92%, 12 passages 93%, 25 passages 92.5%. Each passage added roughly 500 tokens and 60 ms of TTFT. They settled on retrieving 30 candidates, reranking, and sending 6, capturing nearly all the accuracy at a quarter of the tokens.',
      takeaway: 'Measure the accuracy-versus-depth curve; rerank many, send few.',
    },
    {
      title: 'Fast mode on a latency-critical short path',
      description:
        'A trading-desk assistant needs sub-second complete answers of about 80 tokens for a small set of high-value users. The team kept Opus 5.5 for quality and enabled fast mode on that route only, accepting the higher per-token price because the volume is small and the latency is the product. The bulk analytics path stayed on standard speed.',
      takeaway: 'Fast mode buys output speed with money at unchanged quality; apply it to the routes where latency is worth the premium.',
    },
  ],
  keyPoints: [
    'Latency decomposes into pre-model work, TTFT, generation, tool round trips and post-processing; each has its own levers.',
    'Streaming does not reduce total latency but transforms perceived latency; it is the first optimisation for interactive paths.',
    'Prompt caching has no accuracy cost; make prompts cacheable before touching other levers.',
    'Lower effort cuts TTFT; measure accuracy per task class before applying it. A stronger model at low effort often beats a smaller model at high effort.',
    'Retrieval depth has diminishing returns; rerank many candidates and send few passages.',
    'Fast mode increases output speed at a higher per-token price with the same model quality; use it on latency-critical routes with short outputs.',
    'Allocate the SLA as p95 budgets per component; move work that cannot fit the interactive budget to asynchronous paths or the Batches API.',
    'Justify configurations with eval accuracy, latency percentiles and cost per task in an architecture decision record.',
  ],
  flashcards: [
    { front: 'What are the main components of end-to-end latency in a Claude request?', back: 'Pre-model work (auth, retrieval), time to first token, generation time, tool round trips, post-processing.' },
    { front: 'Does streaming reduce total latency?', back: 'No. It reduces perceived latency by delivering the first tokens quickly; total completion time is unchanged.' },
    { front: 'Which lever improves latency and cost with no accuracy cost?', back: 'Prompt caching of a stable prefix.' },
    { front: 'What does fast mode trade?', back: 'Higher per-token price for faster output generation on the same model, with unchanged quality.' },
    { front: 'How should retrieval depth be chosen?', back: 'Measure accuracy against the number of passages sent; the curve flattens quickly. Retrieve many, rerank, send few.' },
    { front: 'Why set latency budgets on p95 rather than averages?', back: 'Averages hide the tail latency that users experience and complain about.' },
    { front: 'If TTFT dominates, which levers apply first?', back: 'Prompt caching and lower effort, then smaller prompt or smaller model.' },
    { front: 'What evidence justifies a configuration decision?', back: 'Eval accuracy per candidate configuration, latency percentiles under load, cost per task, and a stated decision rule, recorded in an ADR.' },
    { front: 'Where does work that cannot meet the interactive latency budget belong?', back: 'In an asynchronous path (background job with status) or the Batches API when no user is waiting.' },
  ],
  quiz: [
    {
      question:
        'A support assistant has p95 time-to-first-token of 5 seconds. cache_read_input_tokens is zero and every request runs at effort high. The team proposes switching to Haiku. Which action is MOST appropriate FIRST?',
      options: [
        'Switch to Haiku as proposed.',
        'Fix the cache (remove volatile content from the prefix) and lower effort for simple request classes, then re-measure.',
        'Raise max_tokens so output finishes faster.',
        'Add more retrieved passages so the model needs less thinking.',
      ],
      correct: [1],
      explanation:
        'The measurements point at caching and effort, which fix TTFT with no accuracy cost. Switching models (1) risks accuracy without addressing the cause; max_tokens (3) affects output length not TTFT; more passages (4) increases TTFT.',
    },
    {
      question:
        'A compliance tool requires 97% recall and a 3-second SLA. A smaller model meets the SLA but delivers 91% recall. What is the BEST design?',
      options: [
        'Ship the smaller model; the SLA is contractual.',
        'A fast first pass returns a provisional result within the SLA, and borderline cases run a deeper asynchronous second pass marked "under review".',
        'Keep the accurate model and renegotiate the SLA to 30 seconds.',
        'Use the smaller model with "think step by step" in the prompt to raise recall.',
      ],
      correct: [1],
      explanation:
        'Restructuring the path meets both requirements. Shipping below the recall bar (1) fails compliance; renegotiating (3) may be impossible; prompt wording (4) does not reliably restore recall and adds latency.',
    },
    {
      question: 'Which TWO statements about latency levers are correct? (Select two)',
      options: [
        'Streaming reduces total completion time.',
        'Prompt caching lowers TTFT and cost without changing accuracy.',
        'Fast mode increases output speed at a higher per-token price with the same quality.',
        'Lower effort always reduces accuracy significantly.',
      ],
      correct: [1, 2],
      explanation:
        'Caching and fast mode are described correctly. Streaming (1) changes perceived latency only; effort\'s accuracy impact (4) depends on the task and must be measured.',
    },
    {
      question:
        'A legal Q&A system sends 25 retrieved passages per question. Accuracy at 6 passages was measured at 92% versus 92.5% at 25, while TTFT doubled. Which change is MOST appropriate?',
      options: [
        'Keep 25 passages because accuracy is highest.',
        'Retrieve 30 candidates, rerank, and send the top 6.',
        'Send 50 passages to push accuracy higher.',
        'Remove retrieval and rely on the model\'s knowledge.',
      ],
      correct: [1],
      explanation:
        'The curve has flattened; reranking captures nearly all accuracy at a fraction of the tokens and latency. Options 1 and 3 pay for negligible gain; option 4 causes hallucination.',
    },
    {
      question:
        'An architect must justify choosing Opus 5.5 at effort low over Sonnet 5.5 at effort high. Which evidence set is MOST appropriate?',
      options: [
        'A single timing of each configuration on one example.',
        'Eval accuracy on the same dataset, p50/p95 latency under load and cost per task for both configurations, with the quality bar stated.',
        'The vendor\'s published benchmark scores.',
        'The development team\'s preference.',
      ],
      correct: [1],
      explanation:
        'Decisions are justified by comparable measurements on your own task. Single timings (1), generic benchmarks (3) and preference (4) do not establish the trade-off for this workload.',
    },
  ],
  statements: [
    { text: 'Streaming reduces the total time a request takes to complete.', isTrue: false, explanation: 'It reduces time to first visible token; total generation time is unchanged.' },
    { text: 'Prompt caching improves latency and cost with no accuracy penalty when the prefix is stable.', isTrue: true, explanation: 'Cached prefixes are read instead of recomputed; the model sees identical content.' },
    { text: 'Fast mode changes the model\'s quality to achieve higher speed.', isTrue: false, explanation: 'Fast mode runs the same model faster at a higher per-token price; quality is unchanged.' },
    { text: 'Latency budgets should be allocated per component at p95 or p99.', isTrue: true, explanation: 'Per-component tail budgets expose the real bottleneck.' },
    { text: 'Adding more retrieved passages always improves answer accuracy.', isTrue: false, explanation: 'Returns diminish and attention dilutes; measure the curve and rerank.' },
    { text: 'Work that cannot fit the interactive latency budget should be moved to an asynchronous path or the Batches API.', isTrue: true, explanation: 'Deep analysis belongs behind a status indicator or in batch, not in a chat turn.' },
    { text: 'A stronger model at low effort can be both faster and more accurate than a smaller model at high effort.', isTrue: true, explanation: 'The smaller model may spend many thinking tokens to reach what the stronger model produces directly; compare configurations on the eval set.' },
  ],
  resources: [
    { label: 'Reduce latency (Claude docs)', url: 'https://platform.claude.com/docs/en/build-with-claude/latency' },
    { label: 'Streaming messages (Claude docs)', url: 'https://platform.claude.com/docs/en/build-with-claude/streaming' },
    { label: 'Fast mode (Claude docs)', url: 'https://platform.claude.com/docs/en/build-with-claude/fast-mode' },
    { label: 'Effort parameter (Claude docs)', url: 'https://platform.claude.com/docs/en/build-with-claude/effort' },
  ],
};
