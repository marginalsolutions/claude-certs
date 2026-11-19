import type { Concept } from '../../types';

export const observabilityAtScale: Concept = {
  id: 'observability-at-scale',
  title: 'Observability at Scale',
  summary:
    'Log prompts, responses and tool calls with privacy controls, trace multi-step requests with OpenTelemetry, track latency, cost, error and refusal metrics, sample intelligently, alert on what matters and attribute cost to teams.',
  certs: ['ccar-p', 'ccdv-f', 'ccar-f'],
  domains: ['ccar-p-3', 'ccar-p-4', 'ccar-p-5', 'ccdv-f-4', 'ccdv-f-2', 'ccar-f-5'],
  tags: ['observability', 'tracing', 'opentelemetry', 'metrics', 'logging', 'privacy', 'cost-attribution'],
  difficulty: 'advanced',
  sections: [
    {
      heading: 'What to capture and why',
      body: `LLM systems fail in ways conventional monitoring does not see: a 200 OK response that is wrong, a retrieval step that returned stale chunks, an agent that took 40 iterations instead of 5. Observability must capture the content and shape of each request, not just its status code.

Per request, capture:

- **Identifiers**: request id, conversation or session id, prompt template id and version, model id, effort, user and tenant (hashed where required).
- **Inputs**: the assembled prompt or a reference to it, retrieved document ids and scores, tool definitions in use.
- **Steps**: each model call and tool call as a span, with arguments (redacted), results (truncated), latency and stop reason.
- **Outputs**: final response, structured output validation result, classifier scores, refusal and \`stop_details\`.
- **Usage**: input, cached input, output and thinking tokens from \`usage\`, converted to cost.
- **Feedback**: user ratings, escalations, reviewer corrections, linked back to the request id.

Without the prompt version and the retrieved ids, a regression cannot be attributed; without usage, cost cannot be attributed; without feedback linkage, evaluation cannot be built from production.`,
    },
    {
      heading: 'Tracing with OpenTelemetry',
      body: `A multi-step request (retrieval → model → tool → model → validation) is a tree of spans, and OpenTelemetry is the standard for recording it. Two sources exist on the Claude platform:

- **SDK spans** emitted in your application by the Anthropic SDKs: one span per API call with timing, token counts and status, exported to whatever OTel backend you run.
- **API spans (destinations)**, configured through the Admin API or Console on the first-party API, where Anthropic exports spans for Messages API and Managed Agents requests to your backend.

Content mode matters for privacy. In **metadata-only** mode, spans carry identifiers, timing, status, token counts and developer-chosen names; in **full content** mode they also carry prompts and responses. Full content is what lets you read a failed conversation or build evals from traces, but the backend then stores sensitive text under its own retention and access rules. Organisations with HIPAA, FERPA or K-12 restrictions export metadata only, whatever the setting. A conversation id is exported in both modes, so it must never contain personal data.

Claude Code and the Agent SDK also emit OTel metrics and events for team usage monitoring. Correlate everything with the request id so one trace shows the user turn, every subagent and every tool call.`,
    },
    {
      heading: 'Metrics, sampling and alerting',
      body: `The metrics an architect should be able to read on one dashboard:

| Category | Metrics |
|---|---|
| Latency | TTFT and completion p50/p95/p99 per route and model |
| Cost | Tokens and dollars per request, per route, per tenant; cache hit rate |
| Reliability | Error rate by type (429, 529, 5xx, timeouts), retry count, \`max_tokens\` stops, tool error rate |
| Safety | Refusal rate (\`stop_reason: refusal\`), classifier flags, injection detections |
| Quality | Schema validation failures, eval score on sampled traffic, escalation rate, user ratings |
| Agent health | Iterations per task, tool calls per task, abandoned sessions |

**Sampling.** Full-content capture of every request is expensive and a privacy liability at scale. Sample: 100% of metadata, a fixed percentage of full content for quality review, 100% of errors, refusals, validation failures and escalations. Stratify samples by route so rare request classes are represented.

**Alerting.** Alert on changes, not just thresholds: a refusal rate that doubles week over week, a cache hit rate that drops to zero after a deploy, a cost per request that climbs 30%, a validation-failure spike after a document refresh. Each alert should name the first place to look (the runbook). Alert fatigue is real; tune until every page is actionable.`,
    },
    {
      heading: 'Privacy, cost attribution and the exam angle',
      body: `**Privacy controls.** Redact or tokenise PII before logging; store full content in a system with access control and retention limits; separate the metadata store (long retention, broad access) from the content store (short retention, restricted access). Honour deletion requests by request id. Never log API keys, OAuth tokens or secrets, which means never putting them where the model can echo them.

**Cost attribution.** Tag every request with team, product and tenant. The Admin API's usage and cost reports plus your own \`usage\`-derived metrics let finance see which team or feature spends what, which is a prerequisite for chargeback and for prioritising optimisation. Workspaces and separate API keys per team help attribution at the platform level.

**Scale.** At millions of requests, store traces in a columnar or trace-native backend, pre-aggregate metrics, and keep the content store sampled. Design dashboards per audience: operators (latency, errors), product (quality, escalations), finance (cost per tenant), security (refusals, injection flags, privileged tool calls).

Exam stems describe a monitoring gap (a quality drop nobody can explain, a bill nobody can attribute, a compliance team asking for logs that contain PHI) and ask for the strategy. Correct answers add structured tracing with versions and ids, sample content with privacy controls, track refusal and validation metrics, and attribute cost by tag. Distractors log everything in full with no controls, log nothing but errors, or rely on model size to prevent problems.`,
    },
  ],
  examples: [
    {
      title: 'Structured per-request record with redaction',
      description:
        'A payments company logs every assistant request as a structured record. PII is redacted before the record is written, usage is converted to cost with the model\'s price table, and the record carries the prompt version, model and retrieved document ids so regressions can be attributed.',
      language: 'python',
      code: `msg = client.messages.create(model=MODEL, max_tokens=800, system=system, messages=messages,
                             output_config={"effort": effort})
record = {
    "request_id": req_id, "session_id": session_id, "tenant": tenant, "team": "payments-support",
    "prompt_version": "ps-v22", "model": MODEL, "effort": effort,
    "retrieved_ids": [d.id for d in docs],
    "stop_reason": msg.stop_reason, "stop_details": getattr(msg, "stop_details", None),
    "usage": msg.usage.model_dump(),
    "cost_usd": cost_from_usage(MODEL, msg.usage),
    "response_redacted": redact_pii(msg.content[0].text),   # content store, short retention
    "latency_ms": int((time.perf_counter() - t0) * 1000),
}
metadata_store.write({k: v for k, v in record.items() if k != "response_redacted"})
if sample(route, record):          # 100% of refusals/errors, 5% of normal traffic
    content_store.write(record)`,
      takeaway: 'Metadata for every request, redacted content for a stratified sample, and versions plus ids on both.',
    },
    {
      title: 'Mistake: full-content logging of patient conversations',
      description:
        'A healthcare provider enabled full-content OpenTelemetry export for a patient-facing assistant and sent traces to a shared observability platform used by all engineering teams. A privacy review found PHI readable by hundreds of engineers with indefinite retention. The remediation moved to metadata-only export for the shared platform, a restricted content store with 30-day retention and audited access for sampled transcripts, and PII redaction before storage. The compliance team confirmed their HIPAA arrangement meant API spans were metadata-only regardless.',
      takeaway: 'Separate broadly accessible metadata from restricted, short-retention content, and redact before storage.',
    },
    {
      title: 'Alert that caught a RAG regression',
      description:
        'A knowledge assistant\'s dashboard tracked "answers with zero citations" and "validation failures" per hour. After a nightly document refresh, both tripled within an hour while latency and model were unchanged. The alert runbook pointed at the indexing job first; a changed embedding model version had produced vectors incompatible with the existing index. Rolling back the index restored quality before most users noticed.',
      takeaway: 'Quality-proxy metrics with change-based alerts and runbooks find retrieval regressions that status codes never show.',
    },
    {
      title: 'Cost attribution across twelve teams',
      description:
        'An enterprise platform team ran one shared Claude integration for twelve product teams and received a single monthly bill. They introduced a mandatory team tag on every request, separate workspaces and API keys per team, and a dashboard combining Admin API cost reports with usage-derived per-request cost. Two teams accounted for 70% of spend; one was sending an uncached 40K prefix on every call and fixed it within a week.',
      takeaway: 'Tag requests and separate keys per team so cost can be attributed and the biggest waste found.',
    },
  ],
  keyPoints: [
    'LLM failures hide behind 200 OK; capture content, shape and usage of each request, not just status codes.',
    'Record prompt version, model, effort, retrieved ids, stop reason and usage with every request so regressions and cost can be attributed.',
    'Use OpenTelemetry: SDK spans from your application and, on the first-party API, API spans exported to your backend.',
    'Metadata-only vs full-content export is a privacy decision; regulated organisations may be limited to metadata-only.',
    'Sample full content (100% of errors, refusals and failures; a stratified percentage of normal traffic); keep 100% of metadata.',
    'Track latency percentiles, cost and cache hit rate, error types, refusal rate, validation failures, and agent iterations per task.',
    'Alert on changes with runbooks; separate metadata (long retention, broad access) from content (short retention, restricted access).',
    'Attribute cost with team and tenant tags, separate workspaces and keys, and the Admin API usage and cost reports.',
  ],
  flashcards: [
    { front: 'Why is conventional status-code monitoring insufficient for LLM systems?', back: 'Wrong answers, stale retrieval and runaway agent loops all return 200 OK; you must capture content, shape and usage.' },
    { front: 'Which identifiers must every request record carry to make regressions attributable?', back: 'Request id, session id, prompt template version, model id, effort, and retrieved document ids.' },
    { front: 'Two sources of OpenTelemetry spans on the Claude platform?', back: 'SDK spans emitted by the Anthropic SDKs in your application, and API spans exported by Anthropic to a configured destination (first-party API).' },
    { front: 'Metadata-only vs full-content span export?', back: 'Metadata-only: ids, timing, status, token counts, developer-chosen names. Full content adds prompts and responses, with stronger privacy obligations.' },
    { front: 'What sampling policy is recommended for full-content capture?', back: '100% of errors, refusals, validation failures and escalations; a stratified percentage of normal traffic; 100% metadata always.' },
    { front: 'Name four safety or quality metrics for an LLM dashboard.', back: 'Refusal rate, classifier flags or injection detections, schema validation failures, escalation rate (plus sampled eval score).' },
    { front: 'How should alerting be designed for LLM systems?', back: 'Alert on changes (refusal rate doubling, cache hit rate dropping to zero, cost per request climbing) with a runbook naming the first place to look.' },
    { front: 'What enables cost attribution across teams?', back: 'Team and tenant tags on every request, separate workspaces and API keys per team, and Admin API usage and cost reports combined with usage-derived cost.' },
    { front: 'Why must the conversation id never contain personal data?', back: 'It is exported in both metadata-only and full-content modes.' },
  ],
  quiz: [
    {
      question:
        'A knowledge assistant\'s answer quality dropped overnight, but latency and model version are unchanged and all requests return 200. Which observability capability would MOST directly reveal the cause?',
      options: [
        'An alert on HTTP 5xx rate.',
        'Per-request records with retrieved document ids and a quality-proxy metric such as answers with zero citations or validation failures.',
        'A dashboard of total tokens per day.',
        'Logging only the final response text.',
      ],
      correct: [1],
      explanation:
        'Retrieval regressions after a document refresh show up in retrieved ids and quality proxies, not in status codes (1) or token totals (3). Final text alone (4) cannot be attributed to a retrieval change.',
    },
    {
      question:
        'A hospital exports full-content traces of a patient assistant to a shared engineering observability platform. Which change BEST addresses the privacy risk?',
      options: [
        'Keep full content but add a note in the dashboard that data is sensitive.',
        'Export metadata only to the shared platform and keep redacted, sampled content in a restricted store with short retention and audited access.',
        'Stop all logging of the assistant.',
        'Switch to a larger model so fewer errors need investigation.',
      ],
      correct: [1],
      explanation:
        'Separating metadata from restricted content with redaction and retention limits preserves observability and privacy. A note (1) is not a control; no logging (3) removes operability; model size (4) is irrelevant.',
    },
    {
      question: 'Which TWO sampling rules are appropriate for full-content capture at scale? (Select two)',
      options: [
        'Capture 100% of refusals, errors and validation failures.',
        'Capture full content for every request to be safe.',
        'Capture a stratified percentage of normal traffic per route.',
        'Capture only requests from the largest tenant.',
      ],
      correct: [0, 2],
      explanation:
        'Failures must always be captured and normal traffic sampled by route. Capturing everything (2) is costly and a privacy liability; one tenant (4) biases the sample.',
    },
    {
      question:
        'Finance receives one monthly Claude bill for twelve product teams and cannot allocate it. Which approach BEST enables attribution?',
      options: [
        'Ask each team to estimate its share.',
        'Tag every request with team and tenant, use separate workspaces and keys per team, and combine Admin API cost reports with usage-derived per-request cost.',
        'Divide the bill equally.',
        'Switch all teams to Haiku to make the bill smaller.',
      ],
      correct: [1],
      explanation:
        'Attribution requires tagging and platform separation. Estimates (1) and equal division (3) are not attribution; changing models (4) does not reveal who spends what.',
    },
    {
      question:
        'An operations team is paged dozens of times a day on a static "p95 latency above 3 seconds" rule and has started ignoring pages. What is the MOST appropriate improvement?',
      options: [
        'Raise the threshold to 10 seconds.',
        'Alert on significant changes (rate doubling, cache hit dropping to zero after a deploy) per route, each with a runbook, and tune until every page is actionable.',
        'Remove the alert.',
        'Page the whole engineering organisation so someone responds.',
      ],
      correct: [1],
      explanation:
        'Change-based, route-specific alerts with runbooks eliminate fatigue while catching real regressions. Raising thresholds (1) or removing alerts (3) hides problems; wider paging (4) worsens fatigue.',
    },
  ],
  statements: [
    { text: 'Capturing only HTTP status codes and error rates is sufficient observability for an LLM application.', isTrue: false, explanation: 'Wrong answers, stale retrieval and runaway loops return 200 OK; capture content, shape and usage.' },
    { text: 'The prompt template version and model id should be recorded with every request.', isTrue: true, explanation: 'Without them a regression cannot be attributed to a prompt or model change.' },
    { text: 'In metadata-only OpenTelemetry export, prompts and responses are included in spans.', isTrue: false, explanation: 'Metadata-only carries ids, timing, status, token counts and developer-chosen names; full-content mode adds prompts and responses.' },
    { text: 'Organisations under HIPAA or similar restrictions with Anthropic export API spans as metadata only regardless of the content setting.', isTrue: true, explanation: 'The restriction overrides the destination\'s content mode.' },
    { text: 'The refusal stop reason and stop_details should be tracked as a safety metric.', isTrue: true, explanation: 'A refusal-rate change signals a prompt, traffic or policy shift worth investigating.' },
    { text: 'Full-content logging of every request is the recommended default because storage is cheap.', isTrue: false, explanation: 'Sample content with privacy controls; capture metadata for all requests and content for failures plus a stratified sample.' },
    { text: 'Separate workspaces and API keys per team improve cost attribution.', isTrue: true, explanation: 'Platform-level separation lets Admin API cost reports be split by team.' },
  ],
  resources: [
    { label: 'OpenTelemetry tracing (Claude docs)', url: 'https://platform.claude.com/docs/en/build-with-claude/opentelemetry' },
    { label: 'Usage and Cost API (Claude docs)', url: 'https://platform.claude.com/docs/en/build-with-claude/usage-cost-api' },
    { label: 'Monitoring Claude Code usage with OpenTelemetry', url: 'https://code.claude.com/docs/en/monitoring-usage' },
  ],
};
