import type { Concept } from '../../types';

export const endToEndArchitectureDesign: Concept = {
  id: 'end-to-end-architecture-design',
  title: 'End-to-End Architecture Design',
  summary:
    'Design Claude systems as a full loop: input → processing → output → feedback, with explicit components for ingestion, retrieval, the model layer, tools, validation, human review and monitoring.',
  certs: ['ccar-p', 'ccar-f', 'ccdv-f'],
  domains: ['ccar-p-1', 'ccar-p-3', 'ccar-f-5', 'ccdv-f-2'],
  tags: ['architecture', 'reference-architecture', 'feedback-loop', 'validation', 'human-review'],
  difficulty: 'advanced',
  diagram: 'eval-loop',
  sections: [
    {
      heading: 'The four stages of every Claude system',
      body: `Whatever the use case, a production Claude system has the same skeleton:

1. **Input.** Where requests and data enter: user messages, documents, events from a queue, webhooks, files. This stage owns authentication, input validation, PII handling and rate limiting. Untrusted content is labelled as such before it reaches the model.
2. **Processing.** Retrieval, prompt assembly, the model call(s), tool execution and any orchestration between steps. This is where the architectural pattern (workflow, agent, augmented LLM) lives.
3. **Output.** Validation against a schema or policy, formatting, delivery to the user or downstream system, and human review where the error cost demands it.
4. **Feedback.** Logging, evaluation, user signals (thumbs, corrections, escalations), and the loop that turns those signals into prompt, retrieval or model changes.

Architects are tested on whether they close the loop. A design that stops at "output" has no way to know whether it is working or to improve. Feedback is a first-class stage, not an afterthought bolted on after launch.`,
    },
    {
      heading: 'Component inventory and responsibilities',
      body: `| Component | Responsibility | Typical failure if missing |
|---|---|---|
| Ingestion | Normalise inputs, extract text from PDFs/images, chunk and index documents, enforce size limits | Garbage in: unreadable scans, truncated docs |
| Retrieval | Return the few passages or records the model needs, with metadata and provenance | Hallucination from missing context, or bloat from too much |
| Model layer | Model selection and routing, prompt templates, effort setting, caching, structured outputs | Cost blow-ups, inconsistent behaviour across versions |
| Tools | Typed, least-privilege actions on external systems, with authorization per call | Over-broad side effects, silent failures |
| Validation | Schema checks, business-rule checks, policy classifiers, confidence thresholds | Bad output reaches customers or systems of record |
| Human review | Queue, UI and SLAs for cases that fail validation or exceed risk thresholds | Either every case is reviewed (no savings) or none is (no safety) |
| Monitoring | Traces, metrics, cost attribution, alerting, eval dashboards | Problems discovered by customers, not operators |

Separate concerns so each component can be changed and tested independently: retrieval can be re-indexed without touching prompts; the model can be upgraded behind an evaluation gate without touching tools.`,
    },
    {
      heading: 'Reference architectures',
      body: `**Customer support assistant.** Input: chat message plus authenticated customer id. Processing: intent routing (often a small model), retrieval over policy and knowledge articles, an augmented LLM with read-only tools (\`get_customer\`, \`lookup_order\`) and an explicit \`escalate_to_human\` tool. Output: streamed reply, policy classifier, citations. Feedback: CSAT, escalation rate, resolution rate, weekly eval over sampled transcripts.

**Document processing pipeline.** Input: documents from a queue; OCR or PDF text extraction; classification by type. Processing: per-type extraction prompt with a JSON schema via structured outputs, often in the Message Batches API when there is no interactive latency requirement. Output: schema validation, cross-field consistency rules, confidence scoring; low-confidence fields go to a review queue. Feedback: reviewer corrections become eval cases and few-shot examples.

**Coding assistant in CI.** Input: a pull request diff and repository context. Processing: Claude Code in headless mode (\`-p\`) with a scoped CLAUDE.md and read-only tools, or the Agent SDK with hooks that block destructive commands. Output: structured review comments with explicit criteria to limit false positives. Feedback: acceptance rate of comments, false-positive labels from engineers, periodic re-tuning of the review prompt.

Each shares the skeleton; they differ in where the latency budget is spent, how much tool authority is granted and where human review sits.`,
    },
    {
      heading: 'Design choices that recur on the exam',
      body: `- **Synchronous vs asynchronous.** Interactive users need streaming and a latency budget per component. Back-office volume belongs in queues and the Batches API (50% discount, results within 24 hours, no latency SLA).
- **Where validation happens.** Prompt instructions ask; validation code enforces. Schema checks, allow-lists and policy classifiers sit between model output and any side effect.
- **Human review placement.** Review the cases that fail validation, fall below a confidence threshold, or exceed a risk threshold (large refunds, regulated decisions). Reviewing everything removes the efficiency gain; reviewing nothing removes the safety net.
- **Feedback mechanics.** Sample production traffic into an eval set, capture corrections, and gate every prompt or model change behind the eval. Without this the system cannot be improved safely.
- **Multiple teams.** Enterprise systems cross team boundaries: data owners, platform, security, the business unit. Document interfaces (schemas, tool contracts, SLAs) at each boundary so teams can change their side independently.

Exam stems describe a system with a gap (no validation, no feedback, review in the wrong place) and ask which addition most improves reliability. Prefer the answer that closes the loop or enforces a control over the one that tweaks the prompt or enlarges the model.`,
    },
  ],
  examples: [
    {
      title: 'Document pipeline with structured outputs and review routing',
      description:
        'An insurer processes 40,000 claim forms a month. Extraction uses structured outputs so every response conforms to the schema; a deterministic rules layer checks cross-field consistency (claim date before report date, totals add up) and routes failures to a reviewer queue. Only 9% of forms need a human, and reviewer corrections are captured as eval cases.',
      language: 'python',
      code: `response = client.messages.create(
    model="claude-opus-5-5",
    max_tokens=2048,
    system=EXTRACTION_PROMPT,
    messages=[{"role": "user", "content": [
        {"type": "document", "source": {"type": "base64", "media_type": "application/pdf", "data": pdf_b64}},
        {"type": "text", "text": "Extract the claim fields."},
    ]}],
    output_config={"format": {"type": "json_schema", "schema": CLAIM_SCHEMA}},
)
claim = json.loads(response.content[0].text)
issues = run_business_rules(claim)          # deterministic checks
if issues or claim["confidence"] < 0.9:
    review_queue.put(claim, issues)          # human review only where needed
else:
    claims_db.insert(claim)`,
      takeaway: 'Schema enforcement plus deterministic rules decide what reaches a human; the model does not police itself.',
    },
    {
      title: 'Mistake: a support assistant with no feedback stage',
      description:
        'A telecom launched a Claude support assistant with retrieval and tools but logged only errors. Three months later CSAT had dropped and nobody could say why. The fix added full tracing (prompt, retrieved chunks, tool calls, response), a weekly 200-transcript sample graded against a rubric, and an escalation-rate alert. The grading surfaced a stale knowledge article causing 30% of wrong answers.',
      takeaway: 'Without a feedback stage the system cannot be diagnosed or improved; design logging and evaluation in from day one.',
    },
    {
      title: 'Coding assistant in CI with enforced boundaries',
      description:
        'A platform team runs Claude Code headless on every pull request. The prompt lists explicit review criteria to cut false positives, settings.json denies Write and Bash except for test commands, and the output is requested as JSON so the CI job can post structured comments. Engineers mark comments as helpful or noise; the noise rate is tracked per week.',
      language: 'bash',
      code: `claude -p "Review this diff against the criteria in .claude/review-criteria.md. \\
Report only issues you are confident about." \\
  --output-format json \\
  --json-schema '{"type":"object","properties":{"findings":{"type":"array","items":{"type":"object","properties":{"file":{"type":"string"},"line":{"type":"integer"},"severity":{"type":"string"},"message":{"type":"string"}},"required":["file","line","severity","message"]}}},"required":["findings"]}' \\
  < pr.diff > findings.json`,
      takeaway: 'Headless Claude Code with scoped permissions and structured output turns a model into a reliable pipeline step.',
    },
    {
      title: 'Choosing asynchronous processing for back-office volume',
      description:
        'A legal team needed 200,000 historical contracts classified once, with no interactive user. The architect moved the job to the Message Batches API: half price, results within 24 hours, each request keyed by custom_id. The interactive contract-question assistant stayed on the real-time API with streaming.',
      takeaway: 'Match the delivery mode to the latency requirement; batch for volume without a deadline, real-time with streaming for users.',
    },
  ],
  keyPoints: [
    'Every Claude system has four stages: input, processing, output, feedback. Feedback is a first-class stage.',
    'Components: ingestion, retrieval, model layer, tools, validation, human review, monitoring. Separate them so each can change independently.',
    'Validation code enforces; prompt instructions only ask. Put schema and policy checks between model output and any side effect.',
    'Place human review where validation fails or risk is high, not everywhere and not nowhere.',
    'Use streaming and a per-component latency budget for interactive paths; use queues and the Batches API for back-office volume.',
    'Reference architectures (support, document processing, CI coding assistant) share the skeleton and differ in tool authority, latency budget and review placement.',
    'Document interfaces (schemas, tool contracts, SLAs) at team boundaries in enterprise systems.',
    'Exam answers that close the loop or enforce a control beat answers that tweak the prompt or enlarge the model.',
  ],
  flashcards: [
    { front: 'Name the four stages of an end-to-end Claude architecture.', back: 'Input → processing → output → feedback loops.' },
    { front: 'Which component turns reviewer corrections into system improvements?', back: 'The feedback stage: corrections become eval cases and few-shot examples, and changes are gated behind the eval.' },
    { front: 'Where should schema and policy validation sit?', back: 'Between model output and any side effect or delivery, enforced in code rather than requested in the prompt.' },
    { front: 'When should human review be applied?', back: 'To cases that fail validation, fall below a confidence threshold or exceed a risk threshold; not to every case and not to none.' },
    { front: 'What delivery mode fits 200,000 documents with no interactive deadline?', back: 'The Message Batches API: 50% discount, results within 24 hours, keyed by custom_id.' },
    { front: 'In the support reference architecture, what makes escalation reliable?', back: 'An explicit escalate_to_human tool plus policy and confidence checks, rather than hoping the model decides to give up.' },
    { front: 'How does a CI coding assistant limit false positives?', back: 'Explicit review criteria in the prompt, structured JSON output, and tracking engineers\' helpful/noise labels as feedback.' },
    { front: 'Why separate retrieval from the model layer?', back: 'So documents can be re-indexed and prompts or models upgraded independently, each behind its own tests.' },
    { front: 'What must be documented at boundaries between teams in an enterprise Claude system?', back: 'Schemas, tool contracts and SLAs, so each team can change its side without breaking the other.' },
  ],
  quiz: [
    {
      question:
        'A support assistant has retrieval, tools and streaming output but logs only API errors. CSAT is falling and the team cannot explain why. Which addition MOST directly addresses the gap?',
      options: [
        'Switch to a larger model with higher effort.',
        'Add tracing of prompts, retrieved chunks, tool calls and responses, plus a sampled weekly evaluation against a rubric.',
        'Increase the number of retrieved chunks from 5 to 20.',
        'Add a confirmation step before every reply.',
      ],
      correct: [1],
      explanation:
        'The missing stage is feedback: without traces and evaluation the cause cannot be found. A bigger model (1) or more chunks (3) are blind changes; confirmations (4) slow users without diagnosing anything.',
    },
    {
      question:
        'An extraction pipeline sends every document to a human reviewer "to be safe". Throughput is no better than the manual process. What is the BEST change?',
      options: [
        'Remove human review entirely and trust the model.',
        'Route to review only documents that fail schema or business-rule validation or fall below a confidence threshold.',
        'Ask the model in the prompt to only output correct values.',
        'Use the Batches API so review happens overnight.',
      ],
      correct: [1],
      explanation:
        'Selective review keeps the safety net while restoring the efficiency gain. Removing review (1) loses safety; prompting for correctness (3) is not a control; batching (4) changes timing, not review volume.',
    },
    {
      question: 'Which TWO are responsibilities of the input stage? (Select two)',
      options: [
        'Authenticating the caller and labelling untrusted content.',
        'Choosing the architectural pattern (workflow vs agent).',
        'Normalising documents and enforcing size limits.',
        'Alerting on refusal-rate spikes.',
      ],
      correct: [0, 2],
      explanation:
        'Authentication, trust labelling and normalisation are input concerns. Pattern selection belongs to processing; alerting belongs to feedback and monitoring.',
    },
    {
      question:
        'A legal team must classify 200,000 archived contracts once; no user is waiting. Which processing choice BEST fits?',
      options: [
        'Real-time API with streaming to show progress.',
        'The Message Batches API with each request keyed by custom_id.',
        'An interactive agent that processes contracts one by one in a conversation.',
        'A multi-agent coordinator with 50 subagents for speed.',
      ],
      correct: [1],
      explanation:
        'Volume work with no deadline is the Batches API\'s purpose: half price and results within 24 hours. Streaming (1) and interactive agents (3) are for users; a 50-subagent system (4) multiplies cost for no business reason.',
    },
    {
      question:
        'A CI code-review assistant produces many low-value comments and engineers ignore it. Which approach is MOST likely to fix this?',
      options: [
        'Give the assistant Write permission so it can fix issues itself.',
        'Define explicit review criteria in the prompt, request structured output, and track engineers\' helpful/noise labels to tune the prompt.',
        'Run the review twice and post both sets of comments.',
        'Raise max_tokens so the assistant can explain each comment in more detail.',
      ],
      correct: [1],
      explanation:
        'False positives are reduced by explicit criteria and a feedback signal. Write permission (1) widens authority without improving precision; double runs (3) double the noise; longer explanations (4) do not change which comments are made.',
    },
  ],
  statements: [
    { text: 'Feedback loops are an optional enhancement that can be added after a Claude system proves itself in production.', isTrue: false, explanation: 'Feedback is one of the four core stages. Without it the system cannot be diagnosed or improved safely.' },
    { text: 'Validation should be enforced in code between model output and any side effect, rather than only requested in the prompt.', isTrue: true, explanation: 'Prompt instructions ask; code enforces. Schema, allow-list and policy checks belong in the output stage.' },
    { text: 'Human review should be applied to every output so the system is always safe.', isTrue: false, explanation: 'Reviewing everything eliminates the efficiency gain. Route to review by validation failure, confidence or risk threshold.' },
    { text: 'The Message Batches API provides results within 24 hours at a 50% discount and is suited to back-office volume without a latency SLA.', isTrue: true, explanation: 'Batch processing trades latency for cost; it is not for interactive users.' },
    { text: 'In the CI coding-assistant reference architecture, Claude Code can be run headless with -p and asked for JSON output matching a schema.', isTrue: true, explanation: 'Headless mode with --output-format json and --json-schema makes Claude Code a reliable pipeline step.' },
    { text: 'Separating retrieval from the model layer is unnecessary because both are part of processing.', isTrue: false, explanation: 'Separation lets you re-index without touching prompts and upgrade models behind an eval gate without touching retrieval.' },
    { text: 'Reviewer corrections in a document pipeline should be captured as evaluation cases.', isTrue: true, explanation: 'Corrections are the richest feedback signal; they become regression tests and few-shot examples.' },
  ],
  resources: [
    { label: 'Building effective agents (Anthropic engineering)', url: 'https://www.anthropic.com/engineering/building-effective-agents' },
    { label: 'Structured outputs (Claude docs)', url: 'https://platform.claude.com/docs/en/build-with-claude/structured-outputs' },
    { label: 'Message Batches (Claude docs)', url: 'https://platform.claude.com/docs/en/build-with-claude/batch-processing' },
    { label: 'Run Claude Code programmatically (headless)', url: 'https://code.claude.com/docs/en/headless' },
  ],
};
