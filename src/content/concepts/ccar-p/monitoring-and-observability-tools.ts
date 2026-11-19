import type { Concept } from '../../types';

export const monitoringAndObservabilityTools: Concept = {
  id: 'monitoring-and-observability-tools',
  title: 'Monitoring and Observability Tools',
  summary:
    'Instrument Claude systems with structured logs, OpenTelemetry traces and dashboards; alert on quality drift, refusal and error rates; sample outputs for human review; and attribute cost to the teams that incur it.',
  certs: ['ccar-p', 'ccdv-f'],
  domains: ['ccar-p-4', 'ccar-p-3', 'ccdv-f-4'],
  tags: ['observability', 'monitoring', 'opentelemetry', 'logging', 'alerting', 'cost'],
  difficulty: 'advanced',
  diagram: 'eval-loop',
  sections: [
    {
      heading: 'What to observe in an LLM system',
      body: `Traditional monitoring asks "is it up and is it fast?" LLM systems add a third question: "is it still *right*?" A system can be 100% available, within latency SLO, and quietly answering worse than yesterday because a document index broke or a model upgrade shifted behaviour. Observability must therefore cover three layers:

1. **Infrastructure and API health**: error rates by type (429 rate limits, 5xx, timeouts), latency p50/p95 by endpoint and model, token throughput against rate limits.
2. **Model behaviour**: \`stop_reason\` distribution (a rise in \`max_tokens\` means truncation; a rise in \`refusal\` means a classifier or a traffic shift), tool-call counts per task, iterations per agent run, cache hit rate, output length.
3. **Quality**: scores from automated judges on a sampled stream, user feedback signals (thumbs down, regenerate, escalation), groundedness, and the eval pass rate on the latest nightly run.

Each request should emit a structured log line with: request id, user or tenant id (hashed if required), prompt version, model id, \`usage\` (all four token fields), latency, \`stop_reason\`, tool calls, retrieved chunk ids, guardrail decisions, and estimated cost. Put the prompt and response bodies behind retention controls appropriate to the data classification.`,
    },
    {
      heading: 'OpenTelemetry tracing',
      body: `A single user request often becomes a tree of operations: retrieval, several model calls, tool executions, validators. Logs alone do not show how they nest; **traces** do. OpenTelemetry (OTel) is the vendor-neutral standard, and Claude tooling emits OTel spans in two independent ways:

- **SDK tracing** runs in your application process. The Anthropic SDK emits spans for Messages requests and for client-side tool runs (for example inside the tool runner), and your existing OTel exporter ships them to whatever backend you run (Datadog, Grafana, Honeycomb, Langfuse, Braintrust or any OTLP endpoint). Works with any platform client, including Bedrock and Vertex.
- **API tracing** is emitted server-side and delivered to an OTLP destination configured by an organization admin. It needs no code change, covers every client, and can see things the SDK cannot, such as each model request inside one API request, server tools and Managed Agents turns.

Used together, API spans nest under the SDK's span for the same request. Both are in beta, so pin SDK versions and expect attribute names to evolve. Claude Code has its own OTel-based monitoring on code.claude.com; it is a separate setup from API tracing.

The practical payoff: when a case fails, you open one trace and see the retrieved chunks, the tool arguments, the model's \`stop_reason\` and the token counts side by side. That collapses diagnosis from hours to minutes.`,
    },
    {
      heading: 'Dashboards and alerting',
      body: `Dashboards show trends; alerts wake people. Design both around the metrics that predict customer impact.

**Dashboard panels** (per application, with filters by model, prompt version and tenant): request volume; p50/p95 latency; error rate by class; \`stop_reason\` mix; cache hit rate; tokens and cost per task; refusal rate; quality score trend from sampled judging; user feedback rate.

**Alerts** should fire on:

- Error or timeout rate above threshold for N minutes (infrastructure).
- p95 latency above the SLO budget (performance).
- **Refusal rate** change beyond the normal band in either direction: a spike can mean a traffic shift, an attack, or a classifier change; a drop can mean a guardrail stopped working.
- **Quality drift**: sampled judge score or groundedness falling more than the noise floor below the rolling baseline; thumbs-down rate rising.
- **Cost anomalies**: spend per hour or per task outside the expected range, which often reveals a runaway loop or a lost cache hit rate.
- **Truncation**: share of \`max_tokens\` stop reasons rising.

Tie alerts to runbooks: "refusal spike → check recent prompt or model change, sample ten refused requests, classify as appropriate or inappropriate".`,
    },
    {
      heading: 'Sampling for human review and cost attribution',
      body: `Automated judges catch drift cheaply, but humans catch what the judge was never told to look for. Sample a **stratified** slice of production conversations every week (by intent, tenant, model, and over-represent low-confidence or flagged cases) and have domain reviewers grade them. Feed the results into the eval set as new cases and into the judge calibration set. Review capacity is finite, so size the sample to what reviewers can actually finish; an unreviewed backlog is not a control.

**Cost attribution** matters as soon as more than one team uses the platform. Tag every request with team, product and feature (metadata on the request, or separate API keys and workspaces per team), and report cost per team and per task. The Admin API usage and cost reports can be grouped by workspace, API key and model, which gives finance a reconciliation path without touching application logs. Attribution turns "the AI bill went up" into "team X's new feature runs without caching", which is actionable.

Exam angle: when a scenario asks how to detect that answer quality has degraded even though availability and latency are fine, the answer is a quality signal (sampled judging, groundedness, feedback) with an alert, not more infrastructure metrics. When it asks how to find which part of a multi-step agent is slow or wrong, the answer is distributed tracing, not aggregate logs.`,
    },
  ],
  examples: [
    {
      title: 'Structured request log with cost and behaviour fields',
      description:
        'Every model call in a claims platform emits one structured event. The fields support dashboards (latency, cost), alerts (stop_reason, refusal) and cost attribution (team, feature) without parsing free text.',
      language: 'python',
      code: `import json, time, logging
log = logging.getLogger("llm")

def traced_call(team, feature, prompt_version, **params):
    t0 = time.perf_counter()
    r = client.messages.create(model="claude-opus-5-5", **params)
    u = r.usage
    log.info(json.dumps({
        "team": team, "feature": feature, "prompt_version": prompt_version,
        "model": r.model, "stop_reason": r.stop_reason,
        "latency_ms": round((time.perf_counter() - t0) * 1000),
        "input_tokens": u.input_tokens, "output_tokens": u.output_tokens,
        "cache_read": u.cache_read_input_tokens or 0,
        "cache_write": u.cache_creation_input_tokens or 0,
        "tool_calls": sum(1 for b in r.content if b.type == "tool_use"),
        "request_id": r.id,
    }))
    return r`,
      takeaway: 'One structured event per call gives you dashboards, alerts and attribution for free.',
    },
    {
      title: 'The silent quality drop',
      description:
        'A bank\'s policy assistant showed green on every infrastructure dashboard for three weeks while answer quality fell after a knowledge-base migration changed document ids. Nobody noticed until an internal audit. The fix was a daily job that judges a 300-case sample for groundedness and alerts when the score drops more than 5 points below the 14-day baseline; the same migration today would page within a day.',
      takeaway: 'Availability and latency dashboards cannot see wrongness; add a sampled quality signal with an alert.',
    },
    {
      title: 'Alert rule for refusal-rate drift',
      description:
        'A refusal spike after a prompt deploy and a refusal collapse after a guardrail misconfiguration both matter. The team alerts on deviation in either direction from the rolling baseline and links the runbook.',
      language: 'yaml',
      code: `# alerting rule (Prometheus-style, illustrative)
- alert: ClaudeRefusalRateDrift
  expr: |
    abs(
      rate(llm_requests_total{stop_reason="refusal"}[1h]) / rate(llm_requests_total[1h])
      - avg_over_time(llm_refusal_ratio[14d])
    ) > 0.02
  for: 30m
  labels: { severity: warning, team: ai-platform }
  annotations:
    runbook: https://wiki.internal/runbooks/llm-refusal-drift
    summary: "Refusal ratio moved >2 points from 14-day baseline"`,
      takeaway: 'Alert on change in either direction; a vanishing refusal rate is as suspicious as a spike.',
    },
    {
      title: 'Finding the slow step with a trace',
      description:
        'A procurement agent\'s p95 jumped from 6 s to 19 s. Aggregate logs showed only "model call slow". The OTel trace showed each model call was still 2 s, but a newly added vendor-lookup tool was taking 11 s because it paged through an API serially. Fixing the tool, not the model, restored the SLO.',
      takeaway: 'Traces separate model time from tool time; aggregate logs cannot.',
    },
  ],
  keyPoints: [
    'Observe three layers: API health (errors, latency, throughput), model behaviour (stop_reason mix, tool calls, cache hit rate), and quality (sampled judging, feedback, groundedness).',
    'Emit one structured event per model call with prompt version, model, usage (four token fields), latency, stop_reason, tool calls and attribution tags.',
    'OpenTelemetry: SDK tracing runs in your process and works on every platform; API tracing is server-side, configured by an admin, and sees inside the API. Both are beta.',
    'Alert on error rate, p95 latency, refusal-rate change in either direction, quality drift beyond the noise floor, cost anomalies and truncation share.',
    'Sample production conversations for stratified human review sized to reviewer capacity; feed results back into evals and judge calibration.',
    'Attribute cost by team and feature through request tags, per-team keys or workspaces, and the Admin API usage and cost reports.',
    'Traces, not aggregate logs, show which step of a multi-step agent is slow or wrong.',
  ],
  flashcards: [
    { front: 'What third question does LLM observability add to "is it up, is it fast"?', back: '"Is it still right?" Quality can degrade while availability and latency stay green.' },
    { front: 'Difference between SDK tracing and API tracing?', back: 'SDK tracing is emitted in your process by the Anthropic SDK and exported by your OTel setup; API tracing is emitted server-side to an OTLP destination configured by an org admin and sees inside the API.' },
    { front: 'What does a rising share of max_tokens stop reasons indicate?', back: 'Truncation: outputs are hitting the output limit.' },
    { front: 'Why alert on refusal-rate drops as well as spikes?', back: 'A drop can mean a guardrail stopped working; a spike can mean a traffic shift, an attack or a classifier/prompt change.' },
    { front: 'How do you detect quality drift automatically?', back: 'Judge a daily stratified sample for groundedness or rubric score and alert when it falls more than the noise floor below the rolling baseline.' },
    { front: 'How should human review samples be sized?', back: 'To what reviewers can actually complete; stratify by intent, tenant and model, over-sampling flagged or low-confidence cases.' },
    { front: 'Three ways to attribute cost by team?', back: 'Request metadata tags, separate API keys or workspaces per team, and Admin API usage/cost reports grouped by workspace, key and model.' },
    { front: 'What does a sudden cost-per-task spike often reveal?', back: 'A runaway agent loop or a lost cache hit rate.' },
    { front: 'Is Claude Code monitoring the same setup as Claude API tracing?', back: 'No. Claude Code has its own OpenTelemetry-based monitoring documented on code.claude.com.' },
  ],
  quiz: [
    {
      question:
        'A knowledge assistant\'s availability is 99.99% and p95 latency is within SLO, yet an audit finds answer quality has declined for weeks. Which monitoring addition would have caught this earliest?',
      options: [
        'A dashboard panel for HTTP error codes.',
        'A daily judge-graded groundedness score on a stratified production sample with an alert on drift.',
        'Alerting on p99 latency.',
        'Logging the model id on every request.',
      ],
      correct: [1],
      explanation:
        'Quality degradation is invisible to availability and latency metrics; only a quality signal detects it. Error codes, latency and model id logging do not measure correctness.',
    },
    {
      question:
        'A multi-step agent\'s p95 latency tripled. Aggregate logs show "request slow" with no further detail. What is the MOST effective next step?',
      options: [
        'Switch to a faster model.',
        'Use distributed tracing (OpenTelemetry spans) to see per-step timing for model calls and tool executions.',
        'Increase the client timeout.',
        'Reduce the system prompt length.',
      ],
      correct: [1],
      explanation:
        'Traces separate model time from tool and retrieval time, which is what the team needs to know. The other options guess at a cause without evidence.',
    },
    {
      question: 'Which TWO signals should trigger an alert in an LLM system? (Select two)',
      options: [
        'The refusal rate drops to zero after a deployment.',
        'The cache hit rate stays at 90% for a week.',
        'Cost per completed task doubles within an hour.',
        'The average output length is 400 tokens, unchanged from last week.',
      ],
      correct: [0, 2],
      explanation:
        'A vanishing refusal rate suggests a guardrail failure and a sudden cost spike suggests a runaway loop or lost caching. Stable cache hit rate and unchanged output length are healthy signals.',
    },
    {
      question:
        'Finance asks why the AI bill grew 40% last month. The platform serves six product teams through one API key. What change makes the question answerable going forward?',
      options: [
        'Switch all teams to a cheaper model.',
        'Tag requests by team and feature (or use per-team keys/workspaces) and report cost per team from usage data.',
        'Disable prompt caching to simplify billing.',
        'Ask each team to estimate their usage.',
      ],
      correct: [1],
      explanation:
        'Attribution requires tagging or per-team keys so usage can be grouped. A blanket model change does not explain the growth, disabling caching raises cost, and estimates are not data.',
    },
    {
      question:
        'An organization wants traces of every Claude API call from many services written in different languages, including some that call the REST API directly without an SDK, with no code changes. Which option fits?',
      options: [
        'SDK tracing in each service.',
        'Server-side API tracing delivered to an OTLP destination configured by an org admin.',
        'Parsing application stdout logs.',
        'Claude Code telemetry.',
      ],
      correct: [1],
      explanation:
        'API tracing is emitted by the API itself and covers any client without code changes. SDK tracing requires the SDK and code changes per service, log parsing is fragile, and Claude Code telemetry covers Claude Code, not application API calls.',
    },
    {
      question:
        'A team sets up weekly human review of 2,000 production conversations but has two reviewers who can grade about 150 each. What is the BEST adjustment?',
      options: [
        'Keep the 2,000 sample and let the backlog grow.',
        'Reduce the sample to roughly 300, stratified by intent and over-sampling flagged cases, so it is actually reviewed.',
        'Stop human review and rely only on the LLM judge.',
        'Review only conversations with positive feedback.',
      ],
      correct: [1],
      explanation:
        'An unreviewed backlog is not a control; size the sample to capacity and stratify to keep coverage. Dropping human review loses what judges miss, and reviewing only positive cases hides failures.',
    },
  ],
  statements: [
    { text: 'If availability and latency are within SLO, answer quality is also within acceptable bounds.', isTrue: false, explanation: 'Quality can degrade independently; it needs its own sampled signal.' },
    { text: 'SDK tracing for the Anthropic SDK works with Bedrock and Vertex clients as well as the Claude API.', isTrue: true, explanation: 'SDK spans are emitted in your process regardless of the platform the client talks to.' },
    { text: 'API tracing requires adding instrumentation code to each application.', isTrue: false, explanation: 'API tracing is emitted server-side and delivered to a destination configured by an org admin; no code change is needed.' },
    { text: 'A rising share of max_tokens stop reasons indicates outputs are being truncated.', isTrue: true, explanation: 'It is a mechanical signal worth alerting on.' },
    { text: 'Refusal-rate alerts should only fire on increases.', isTrue: false, explanation: 'A drop can indicate a guardrail stopped working; alert on change in either direction.' },
    { text: 'Human review samples should be stratified and sized to reviewer capacity.', isTrue: true, explanation: 'An unreviewed backlog provides no control.' },
    { text: 'The Admin API usage and cost reports can group spend by workspace, API key and model.', isTrue: true, explanation: 'This supports cost attribution without parsing application logs.' },
  ],
  resources: [
    { label: 'OpenTelemetry for the Claude API (Claude docs)', url: 'https://platform.claude.com/docs/en/build-with-claude/opentelemetry' },
    { label: 'Usage and Cost Admin API (Claude docs)', url: 'https://platform.claude.com/docs/en/build-with-claude/usage-cost-api' },
    { label: 'Monitoring Claude Code (Claude Code docs)', url: 'https://code.claude.com/docs/en/monitoring-usage' },
  ],
};
