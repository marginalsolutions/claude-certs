import type { Concept } from '../../types';

export const enterpriseModelSelection: Concept = {
  id: 'enterprise-model-selection',
  title: 'Enterprise Model Selection',
  summary:
    'Pick and route among Claude tiers by task using evaluation data, treat effort as a first-class lever alongside model size, pin versions with an upgrade cadence, and respect platform and regional availability.',
  certs: ['ccar-p', 'ccdv-f', 'ccao-f'],
  domains: ['ccar-p-2', 'ccar-p-4', 'ccdv-f-5', 'ccao-f-3'],
  tags: ['models', 'routing', 'effort', 'cost', 'versioning', 'platforms'],
  difficulty: 'advanced',
  diagram: 'model-tiers',
  sections: [
    {
      heading: 'The tiers and what they are for',
      body: `Claude ships in tiers that trade capability for cost and speed. As of late 2026:

| Tier | Model id | Price (in / out per MTok) | Typical role |
|---|---|---|---|
| Frontier | \`claude-fable-5-2\` | $8 / $40 | Hardest reasoning and long-horizon agentic work when evals at high effort on Opus still fall short |
| Opus | \`claude-opus-5-5\` | $4 / $20 | Default for complex judgment, planning, synthesis, agentic coding |
| Sonnet | \`claude-sonnet-5-5\` | $2 / $10 | Everyday coding and agent work, drafting, mid-complexity analysis |
| Haiku | \`claude-haiku-5-5\` | $0.10 / $0.50 (prompts up to 100K) | Classification, routing, extraction, high-volume subagent reading |

All current models have a 1M-token context window and up to 128K output tokens (Haiku 4.5, still served, has 200K). Thinking is adaptive on all current models and controlled by \`output_config.effort\` (\`low\`, \`medium\`, \`high\`, \`xhigh\`, \`max\`); on Opus 5.5 it cannot be disabled and defaults to \`medium\`.

Price differences are large (Haiku is roughly 40 times cheaper than Opus on input), so routing by task is the single biggest cost lever after caching. The tiers are not "good, better, best" for every task: a Haiku classifier with a clear prompt can match Opus on a well-defined label set at a fraction of the cost.`,
    },
    {
      heading: 'Effort versus model size',
      body: `Architects used to have one knob: model size. Now there are two, and they interact.

- **Effort** controls how much thinking and how thorough a response the model produces. Lowering effort on a strong model cuts latency and output tokens while keeping the model's knowledge and instruction following.
- **Model size** controls underlying capability.

A recurring finding in evaluations: a newer, stronger model at **low effort** often beats an older or smaller model at **high effort** on both quality and total cost, because the small model spends many thinking tokens to reach an answer the large model reaches directly. So "we need to cut cost, switch to Haiku" is not automatically right; "try Opus or Sonnet at low effort first and compare on the eval" often is.

The decision is empirical. Run the candidate configurations (model × effort) over the same eval set and record accuracy, p50/p95 latency and cost per task. Pick the cheapest configuration that clears the quality bar with margin. Record the result in an architecture decision record so the choice can be defended and revisited.`,
    },
    {
      heading: 'Routing, pinning and upgrade cadence',
      body: `**Routing.** Classify requests by complexity or type and send each class to the configuration that clears its bar. Routers are usually Haiku or a deterministic rule on request metadata. Remember that prompt caches are per model: splitting traffic across models splits cache reuse.

**Pinning.** Production code should reference a specific model id and treat a model change as a deployment: tested on the eval set, rolled out gradually, with a rollback path. Even within a family, a new release can change tokenization (Sonnet 5 and Haiku 5.5 count about 30% more tokens than their predecessors), default effort, or API behaviour (forced \`tool_choice\` returns 400 on Opus 5.5 and Sonnet 5.5; \`temperature\` is rejected on API version 2026-10-21; assistant prefill is gone). Budget for prompt re-tuning on every upgrade.

**Cadence.** Set a regular review (quarterly is common) in which the eval suite is run against newly released models, and track deprecation dates so you are never forced into an emergency migration. Use the Models API to query capabilities programmatically rather than hard-coding assumptions about context window or feature support.`,
    },
    {
      heading: 'Platform and regional availability',
      body: `The same Claude models are served through the first-party Claude API, Claude Platform on AWS, Amazon Bedrock (model ids prefixed \`anthropic.\`), Google Cloud Vertex AI and Microsoft Foundry. Enterprises choose a platform for data residency, existing contracts, identity integration and procurement, but **feature availability differs**:

- Message Batches, the Models API and \`inference_geo\` (data residency control) are first-party and Claude Platform on AWS only.
- The MCP connector and Managed Agents are not available on Bedrock or Vertex AI.
- Agent Skills on the Messages API, code execution and web fetch are not on Bedrock or Vertex AI.
- Server-side fallbacks for refusals exist only on the first-party API.
- Fast mode availability varies by platform and model.

An architect must check the feature matrix before promising a design on a given platform. Model release and deprecation schedules also differ on Bedrock and Vertex AI, so pinning and cadence must be managed per platform.

Exam items frame a cost, quality or compliance constraint and ask for the model strategy. Strong answers route by task, test effort before downsizing, pin and evaluate upgrades, and verify platform support. Distractors pick the biggest model for everything, the smallest model to save money regardless of fit, or assume every feature exists on every platform.`,
    },
  ],
  examples: [
    {
      title: 'Effort sweep before downsizing',
      description:
        'A claims team on Opus 5.5 at effort high wanted to cut cost by moving to Haiku. The architect ran a sweep over 400 eval cases: Opus/high 96.5% accuracy at $0.19 per case; Opus/low 95.8% at $0.07; Sonnet/high 95.1% at $0.08; Haiku/high 89% at $0.012. The quality bar was 95%. Opus at low effort was chosen: it met the bar at a third of the cost, with no model migration.',
      language: 'python',
      code: `CONFIGS = [("claude-opus-5-5", "high"), ("claude-opus-5-5", "low"),
           ("claude-sonnet-5-5", "high"), ("claude-haiku-5-5", "high")]

for model, effort in CONFIGS:
    correct, cost, latencies = 0, 0.0, []
    for case in eval_cases:
        t0 = time.perf_counter()
        r = client.messages.create(
            model=model, max_tokens=1024,
            output_config={"effort": effort},
            system=SYSTEM, messages=[{"role": "user", "content": case.input}])
        latencies.append(time.perf_counter() - t0)
        correct += grade(r, case.expected)
        cost += price(model, r.usage)
    print(model, effort, correct / len(eval_cases), p95(latencies), cost / len(eval_cases))`,
      takeaway: 'Sweep model × effort on the same eval set and pick the cheapest configuration that clears the bar; lower effort on a stronger model often wins.',
    },
    {
      title: 'Mistake: an unpinned alias in production',
      description:
        'A financial-services team referenced a model by a floating alias in a document-extraction service. A newer release arrived with a different tokenizer and a recalibrated default effort; prompt-cache costs rose 30% overnight and a few-shot prompt tuned for the old model began producing longer outputs that broke a downstream length check. The fix: pin the exact model id, run the eval suite against the new model in staging, re-tune the prompt, and roll out behind a feature flag.',
      takeaway: 'Treat a model change as a deployment: pin, evaluate, re-tune, roll out gradually.',
    },
    {
      title: 'Complexity routing with a shared quality floor',
      description:
        'A legal research product routes questions: a Haiku classifier labels each as lookup, summary or analysis. Lookups go to Haiku, summaries to Sonnet, analysis to Opus at high effort. Each route has its own eval set and quality floor; the router\'s own accuracy is tracked, because a misroute of an analysis question to Haiku is the most expensive error.',
      takeaway: 'Routing needs per-route quality floors and monitoring of the router itself.',
    },
    {
      title: 'Platform constraint discovered late',
      description:
        'An architect designed a Bedrock-hosted support agent using the MCP connector to reach an internal MCP server and the Batches API for nightly summaries. Neither is available on Bedrock. The redesign hosted the MCP client in the application (direct MCP SDK) and replaced the batch job with queued real-time calls off-peak. Checking the feature matrix first would have saved two weeks.',
      takeaway: 'Verify feature availability on the target platform before committing a design; model parity does not mean feature parity.',
    },
  ],
  keyPoints: [
    'Tiers: Fable 5.2 (frontier), Opus 5.5 (default for complex work), Sonnet 5.5 (everyday), Haiku 5.5 (high-volume, cheap). All current models have 1M context.',
    'Effort (output_config.effort: low to max) is a second lever alongside model size; a stronger model at low effort often beats a smaller model at high effort on quality and total cost.',
    'Selection is evaluation-driven: sweep model × effort over the same eval set, pick the cheapest configuration that clears the quality bar with margin.',
    'Route by task or complexity; routers are usually Haiku or deterministic rules; caches are per model.',
    'Pin exact model ids and treat upgrades as deployments: evaluate, re-tune prompts, roll out gradually, keep a rollback.',
    'Releases change tokenization, defaults and API behaviour (forced tool_choice 400s, temperature rejected, prefill removed); budget for re-tuning.',
    'Feature availability differs by platform: Batches, Models API, MCP connector, Managed Agents, Skills and server-side fallbacks are not everywhere.',
    'Choose platforms for residency, contracts and identity; verify the feature matrix before committing a design.',
  ],
  flashcards: [
    { front: 'Current Claude tiers and their model ids?', back: 'Fable 5.2 (claude-fable-5-2), Opus 5.5 (claude-opus-5-5), Sonnet 5.5 (claude-sonnet-5-5), Haiku 5.5 (claude-haiku-5-5).' },
    { front: 'What parameter controls thinking depth on current models?', back: 'output_config.effort with values low, medium, high, xhigh, max. budget_tokens is only for Haiku 4.5 and older.' },
    { front: 'Why can a stronger model at low effort be cheaper than a smaller model at high effort?', back: 'The smaller model spends many thinking and output tokens to reach an answer the stronger model reaches directly, so total cost and latency can be higher.' },
    { front: 'What should an architect do before downsizing a model to cut cost?', back: 'Run a model × effort sweep on the eval set and pick the cheapest configuration that clears the quality bar.' },
    { front: 'Why is model pinning important?', back: 'New releases can change tokenization, default effort and API behaviour; pinning makes the change a tested deployment rather than a surprise.' },
    { front: 'Name three features not available on Amazon Bedrock or Vertex AI.', back: 'Message Batches, the MCP connector, Managed Agents (also Skills on the Messages API, code execution, web fetch).' },
    { front: 'How do caches interact with multi-model routing?', back: 'Prompt caches are per model, so splitting traffic across models splits cache reuse.' },
    { front: 'How can code discover a model\'s context window and feature support at runtime?', back: 'Query the Models API (client.models.retrieve / list) rather than hard-coding assumptions.' },
    { front: 'What is a sensible upgrade cadence practice?', back: 'A regular (often quarterly) review running the eval suite against new models, plus tracking deprecation dates to avoid emergency migrations.' },
  ],
  quiz: [
    {
      question:
        'A team on Opus 5.5 at effort high must cut inference cost by 50% while keeping accuracy at or above 95%. Which approach is MOST appropriate?',
      options: [
        'Switch all traffic to Haiku 5.5 immediately.',
        'Run an eval sweep across Opus/low, Sonnet/high and Haiku/high and choose the cheapest configuration that clears 95%.',
        'Keep Opus at high effort and reduce max_tokens.',
        'Move to Fable 5.2 because it answers faster.',
      ],
      correct: [1],
      explanation:
        'Selection must be evaluation-driven and effort is a lever alongside model size. Blind downsizing (1) risks quality; max_tokens (3) truncates rather than saves; Fable (4) costs more.',
    },
    {
      question:
        'After a model upgrade, a production extraction service sees 30% higher token costs and longer outputs that break a downstream check. What MOST likely happened?',
      options: [
        'Prompt caching was silently disabled.',
        'The service used a floating alias and picked up a release with a new tokenizer and recalibrated defaults without re-evaluation.',
        'The context window shrank.',
        'The API started charging for thinking tokens for the first time.',
      ],
      correct: [1],
      explanation:
        'Unpinned models absorb release changes (tokenization, default effort) untested. Caching (1) would show in usage fields; context windows (3) have not shrunk; thinking tokens were already billed (4).',
    },
    {
      question:
        'Which TWO features should an architect verify before designing on Amazon Bedrock? (Select two)',
      options: [
        'Whether the MCP connector is available (it is not).',
        'Whether streaming is supported (it is).',
        'Whether the Message Batches API is available (it is not).',
        'Whether prompt caching exists (it does).',
      ],
      correct: [0, 2],
      explanation:
        'The MCP connector and Batches are first-party (and Claude Platform on AWS) features; streaming and caching are available everywhere and are not design risks.',
    },
    {
      question:
        'A legal product routes questions to Haiku, Sonnet or Opus based on a Haiku classifier. Which additional measurement is MOST important?',
      options: [
        'Total tokens generated by the classifier.',
        'The router\'s own accuracy, since misrouting an analysis question to Haiku is the costliest error.',
        'The number of distinct users per model.',
        'Whether Opus answers are longer than Sonnet answers.',
      ],
      correct: [1],
      explanation:
        'A router is a model stage with its own failure mode; its errors cascade into the wrong tier. Token counts, user counts and answer length (1, 3, 4) do not measure routing quality.',
    },
    {
      question:
        'Which statement about effort and model size on current Claude models is correct?',
      options: [
        'Effort is only available on Haiku models.',
        'Lower effort on a newer, stronger model often yields better quality per dollar than high effort on a smaller model.',
        'Effort can be disabled on Opus 5.5 by setting thinking to disabled.',
        'Effort is set with budget_tokens on all current models.',
      ],
      correct: [1],
      explanation:
        'That is the empirical pattern architects should test for. Effort exists on all current models (1); thinking cannot be disabled on Opus 5.5 (3); budget_tokens is deprecated on current models (4).',
    },
  ],
  statements: [
    { text: 'All current Claude models (Opus 5.5, Sonnet 5.5, Haiku 5.5, Fable 5.2) have a 1M-token context window.', isTrue: true, explanation: 'Only the older Haiku 4.5 is limited to 200K.' },
    { text: 'When cost is the concern, the smallest model should be chosen first and upgraded only if quality fails.', isTrue: false, explanation: 'Test effort on a stronger model and compare on the eval set; a stronger model at low effort is often cheaper per correct answer.' },
    { text: 'Prompt caches are shared across models, so routing between tiers does not affect cache hit rate.', isTrue: false, explanation: 'Caches are per model; multi-model routing splits reuse.' },
    { text: 'Message Batches and the Models API are available on the first-party Claude API but not on Amazon Bedrock or Vertex AI.', isTrue: true, explanation: 'Verify the platform feature matrix before committing a design.' },
    { text: 'Forced tool_choice (any or a specific tool) returns an error on Opus 5.5 and Sonnet 5.5.', isTrue: true, explanation: 'Use auto with strict schemas and prompt steering, or structured outputs.' },
    { text: 'Pinning a model id is unnecessary because new releases are backward compatible.', isTrue: false, explanation: 'Releases change tokenizers, defaults and API behaviour; pin and evaluate upgrades.' },
    { text: 'On Opus 5.5, thinking cannot be disabled and effort defaults to medium.', isTrue: true, explanation: 'Effort is the only control; adjust it rather than trying to turn thinking off.' },
  ],
  resources: [
    { label: 'Models overview (Claude docs)', url: 'https://platform.claude.com/docs/en/about-claude/models/overview' },
    { label: 'Choosing a model (Claude docs)', url: 'https://platform.claude.com/docs/en/about-claude/models/choosing-a-model' },
    { label: 'Effort parameter (Claude docs)', url: 'https://platform.claude.com/docs/en/build-with-claude/effort' },
    { label: 'Model deprecations (Claude docs)', url: 'https://platform.claude.com/docs/en/about-claude/model-deprecations' },
  ],
};
