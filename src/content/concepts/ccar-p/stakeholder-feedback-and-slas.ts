import type { Concept } from '../../types';

export const stakeholderFeedbackAndSlas: Concept = {
  id: 'stakeholder-feedback-and-slas',
  title: 'Stakeholder Feedback and SLAs',
  summary:
    'Run feedback loops that turn stakeholder reactions into prioritized changes, set expectations about probabilistic systems, define SLAs and SLOs for latency, availability and quality that an AI system can actually meet, and respond well when "it got it wrong once".',
  certs: ['ccar-p'],
  domains: ['ccar-p-6', 'ccar-p-4'],
  tags: ['stakeholders', 'sla', 'slo', 'feedback', 'expectations'],
  difficulty: 'advanced',
  sections: [
    {
      heading: 'Feedback loops that produce change',
      body: `Stakeholder feedback is a data stream, and like any data stream it needs a pipeline: collect, classify, prioritize, act, close the loop.

- **Collect** from every channel: in-product thumbs and comments, reviewer edits, support tickets about the assistant, operator interviews, business metric reviews, incident reports.
- **Classify** into buckets that map to owners: factual error (eval and prompt), missing capability (roadmap), tone or format (prompt), latency (platform), policy or scope (governance), misunderstanding of what the system is for (expectations and training).
- **Prioritize** by frequency × impact, using the same metrics as the requirements brief. Ten complaints about a formatting quirk may matter less than one incorrect regulatory answer.
- **Act** through the normal change process: eval case added, prompt or config change reviewed, released through the eval gate.
- **Close the loop**: tell the person who reported it what changed. Stakeholders who never hear back stop reporting, and the feedback stream dries up precisely when the system drifts.

Set a cadence: a weekly review of feedback and metrics with operators, a monthly review with sponsors against the success criteria, and an immediate path for anything safety- or compliance-related.`,
    },
    {
      heading: 'Managing expectations about a probabilistic system',
      body: `Most stakeholders have a deterministic mental model of software: the same input produces the same output, and a bug fixed stays fixed. LLM systems break both assumptions, and unmanaged, that gap produces either over-trust ("it is always right") or collapse of trust ("it was wrong once, turn it off").

Set expectations early and repeatedly:

- **Frame quality as a rate**, not a binary. "97% field accuracy on the golden set" means roughly 3 in 100 will be wrong, and the design includes review routing for that reason.
- **Explain variance**: the same question can get differently worded answers; evaluation uses hundreds of cases and repetitions, not one demo.
- **Explain that improvement is iterative**: changes are measured against an eval and rolled out gradually, and some requests trade one metric for another.
- **Explain the controls**, not just the model: grounding, citations, validation, human review, monitoring. Trust should attach to the system, not to the model's eloquence.
- **Agree on how to judge the system**: the success criteria in the brief, measured on the agreed cadence, not anecdotes in either direction.

Demos deserve special care. Show failure cases alongside successes, and never demo capabilities that are not in scope.`,
    },
    {
      heading: 'SLAs and SLOs for AI systems',
      body: `An **SLO** (service level objective) is an internal target; an **SLA** (service level agreement) is a commitment to a customer with consequences. Define SLOs first, run against them for a while, then commit to SLAs with headroom. For AI systems the usual dimensions are:

| Dimension | Example SLO | Notes |
|---|---|---|
| **Latency** | p95 time to first token < 2 s; p95 end-to-end < 8 s | Set per interaction type; batch jobs get completion-time targets instead |
| **Availability** | 99.9% of requests succeed (non-5xx, non-timeout) | Depends on the model platform's availability plus your own; design retries, fallbacks and degradation to exceed the upstream figure |
| **Quality** | Groundedness ≥ 0.95 on the weekly sample; incorrect-resolution rate ≤ 2%; inappropriate refusal rate ≤ 1% | Measured by sampled judging and human review, not by availability monitors |
| **Throughput** | Sustain 50 requests/s at peak | Must fit rate limits, with headroom |
| **Review turnaround** | Gated actions decided within 4 business hours | The human part of the system has an SLO too |

Rules: measure what you commit to, with the measurement method written into the SLO; commit to percentiles, not averages; set **error budgets** so a quality dip triggers a change freeze rather than a blame cycle; and include **degraded modes** (fall back to a smaller model, to retrieval-only answers, or to "a person will follow up") so an upstream incident reduces quality gracefully instead of taking the service down. Never commit to a quality SLA you cannot measure continuously, and never commit to "no errors".`,
    },
    {
      heading: 'Handling "it got it wrong once"',
      body: `A senior stakeholder forwards one bad answer with "this is unacceptable; we need to pause the rollout". How you respond determines whether the program survives.

1. **Acknowledge and take it seriously.** Thank them, confirm the specific case, and say what you will do and by when.
2. **Diagnose with the trace.** Was it retrieval, prompt, hallucination, integration, or a case outside scope? Was it caught by any control (review routing, validation)? Should it have been?
3. **Put it in context with data.** "This is one of 14 incorrect answers in 2,100 this week (0.67%); the agreed threshold is 2%. Eleven of the 14 were routed to review and corrected before the customer saw them; this one was not because confidence was high. Here is why."
4. **Fix the class, not the instance.** Add the case to the eval, adjust the control that should have caught it, and report the before/after numbers.
5. **Revisit the expectation, if needed.** If the stakeholder's real requirement is "never wrong in category X", that is a design conversation about gating category X behind human approval, with its cost, not a reason to abandon the system.
6. **Close the loop** in writing, and add the incident to the register.

What not to do: dismiss it ("LLMs do that"), over-react (pause everything without data), or hide it. Exam angle: the correct option acknowledges, diagnoses from evidence, contextualizes with the agreed metrics, fixes the class via eval and controls, and manages the expectation. Options that pause the system on one anecdote or that brush it off are distractors.`,
    },
  ],
  examples: [
    {
      title: 'An SLO document for a support assistant',
      description:
        'The SLOs are specific, measurable and include the human and degraded-mode parts of the system. Each has a measurement method and an owner.',
      language: 'yaml',
      code: `service: support-assistant
slos:
  - name: latency_first_token
    target: "p95 < 2.0s"
    window: 28d
    measured_by: otel span llm.request (final successful attempt)
  - name: availability
    target: ">= 99.9% non-error responses"
    degraded_mode: "retrieval-only answer + 'a specialist will follow up'"
  - name: quality_groundedness
    target: ">= 0.95"
    measured_by: weekly judge-graded stratified sample (n=400), calibrated vs human labels
    error_budget_policy: "below 0.93 -> prompt/model change freeze until recovered"
  - name: incorrect_resolution_rate
    target: "<= 2%"
    measured_by: weekly human review sample (n=300)
  - name: review_turnaround
    target: "gated actions decided within 4 business hours (p95)"
    owner: support-ops
owners: { engineering: ai-platform, business: support-ops }`,
      takeaway: 'An AI SLO set covers latency, availability, quality, and the human loop, each with a measurement method.',
    },
    {
      title: 'The pause that was not needed',
      description:
        'A COO demanded a halt after the assistant gave a wrong refund policy answer to a VIP. The architect pulled the trace: retrieval had returned an outdated policy PDF that had not been removed from the index. Weekly data showed 0.4% incorrect answers against a 2% threshold. The fix was a document-lifecycle rule (expired policies are removed on publish of a replacement), a new eval case, and a report back within 48 hours. The rollout continued, and the COO became a sponsor of the document-governance work.',
      takeaway: 'Acknowledge, diagnose from the trace, contextualize with agreed metrics, fix the class, and report back.',
    },
    {
      title: 'Feedback triage that changed priorities',
      description:
        'A monthly feedback review classified 340 items: 190 formatting and tone, 85 missing capability, 40 latency, 25 factual errors. Frequency alone pointed at formatting. Weighting by impact (factual errors in regulated topics) moved the 25 errors to the top; eight were the same retrieval gap. Fixing that gap removed a class of errors and the formatting items were batched into a single prompt revision.',
      takeaway: 'Prioritize feedback by frequency × impact against the brief\'s criteria, not by volume alone.',
    },
    {
      title: 'Committing to an SLA with headroom',
      description:
        'A vendor was asked to sign an SLA of p95 latency under 3 s and 99.95% availability for a Claude-based feature. Internal SLOs over the previous quarter showed p95 at 2.4 s and availability at 99.93% including upstream incidents. The architect negotiated p95 under 4 s, 99.9% availability with a documented degraded mode, and quality reporting (not a quality SLA) on a monthly cadence, leaving room for upstream variance.',
      takeaway: 'Commit to SLAs below demonstrated SLO performance and avoid quality guarantees you cannot measure continuously.',
    },
  ],
  keyPoints: [
    'Treat feedback as a pipeline: collect from all channels, classify by owner, prioritize by frequency × impact, act through the eval-gated change process, and close the loop with reporters.',
    'Set expectations that quality is a rate, outputs vary, improvement is iterative, and trust belongs to the controls, not the model\'s fluency.',
    'Define SLOs first, then SLAs with headroom; use percentiles, not averages, and write the measurement method into each objective.',
    'AI SLOs cover latency, availability, quality (sampled judging and human review), throughput and human review turnaround.',
    'Use error budgets and degraded modes so dips trigger freezes and graceful fallback rather than outages or blame.',
    'Never commit to "no errors" or to a quality SLA you cannot measure continuously.',
    'On "it got it wrong once": acknowledge, diagnose from the trace, contextualize with agreed metrics, fix the class via eval and controls, revisit expectations if needed, close the loop in writing.',
  ],
  flashcards: [
    { front: 'Five stages of a stakeholder feedback pipeline?', back: 'Collect, classify, prioritize (frequency × impact), act through the change process, close the loop.' },
    { front: 'SLO vs SLA?', back: 'SLO is an internal target; SLA is a customer commitment with consequences. Set SLOs first, commit to SLAs with headroom.' },
    { front: 'Why commit to percentiles rather than averages?', back: 'Averages hide the tail that users experience; p95 reflects it.' },
    { front: 'How is a quality SLO measured?', back: 'By sampled judge grading calibrated against humans and by human review samples, not by availability monitors.' },
    { front: 'What is an error budget policy in an AI SLO?', back: 'A rule such as "if quality falls below X, freeze prompt and model changes until recovered".' },
    { front: 'What is a degraded mode?', back: 'A planned fallback (smaller model, retrieval-only answer, human follow-up) that keeps the service useful during upstream incidents.' },
    { front: 'First two steps when a stakeholder reports a wrong answer?', back: 'Acknowledge it seriously with a commitment and date, then diagnose from the trace.' },
    { front: 'Why put a single error in context with data?', back: 'To compare it with the agreed error threshold and show which controls caught similar cases, preventing over-reaction.' },
    { front: 'Which SLO is often forgotten in AI systems?', back: 'Human review turnaround for gated actions.' },
    { front: 'Why is closing the loop with reporters important?', back: 'People who never hear back stop reporting, and the feedback stream dries up when it is most needed.' },
  ],
  quiz: [
    {
      question:
        'A senior executive forwards one incorrect answer from the assistant and asks to pause the rollout. Weekly metrics show 0.5% incorrect answers against an agreed 2% threshold. What is the BEST response?',
      options: [
        'Pause the rollout immediately to show responsiveness.',
        'Reply that LLMs are probabilistic and such errors are expected.',
        'Acknowledge the case, diagnose it from the trace, present it in the context of the agreed metrics and controls, fix the underlying class (eval case plus control), and report back with a date.',
        'Switch to a larger model and tell the executive it is fixed.',
      ],
      correct: [2],
      explanation:
        'The professional response is evidence-based and fixes the class while respecting the agreed criteria. Pausing on an anecdote, dismissing the concern, or claiming a fix without diagnosis all damage trust.',
    },
    {
      question:
        'Which SLO definition for an AI assistant is well formed?',
      options: [
        '"The assistant will be accurate."',
        '"Average latency under 3 seconds."',
        '"p95 end-to-end latency under 6 s measured on the final successful request over a 28-day window; groundedness ≥ 0.95 on a weekly 400-case judge-graded sample calibrated against human labels."',
        '"No hallucinations in production."',
      ],
      correct: [2],
      explanation:
        'Well-formed SLOs use percentiles, windows and explicit measurement methods. "Accurate" is unmeasurable, averages hide tails, and "no hallucinations" is an impossible commitment.',
    },
    {
      question: 'Which TWO practices help manage stakeholder expectations for a probabilistic system? (Select two)',
      options: [
        'Frame quality as a measured rate with review routing for the residual, rather than as a binary.',
        'Demo only the best-case examples to build confidence.',
        'Explain the controls (grounding, citations, validation, human review) so trust attaches to the system rather than the model\'s fluency.',
        'Promise that each fix is permanent.',
      ],
      correct: [0, 2],
      explanation:
        'Rates and controls set accurate expectations. Best-case-only demos and permanence promises create the over-trust that collapses at the first error.',
    },
    {
      question:
        'A customer wants a contractual SLA guaranteeing 99% answer accuracy. Internal measurement is a weekly judge-graded sample. What should the architect propose?',
      options: [
        'Sign it; the eval shows 97% so 99% is close.',
        'Commit to latency and availability SLAs with headroom below demonstrated SLOs, and offer quality reporting on the agreed measurement cadence rather than a contractual accuracy guarantee.',
        'Refuse any SLA.',
        'Guarantee 100% by adding a disclaimer.',
      ],
      correct: [1],
      explanation:
        'Quality cannot be measured continuously enough to contract on, and 99% exceeds measured performance. Latency and availability SLAs with headroom plus quality reporting are defensible. Refusing all SLAs or using disclaimers are not viable.',
    },
    {
      question:
        'Monthly feedback shows 190 formatting complaints and 25 factual-error reports in regulated topics. How should the team prioritize?',
      options: [
        'Fix formatting first because it has the most reports.',
        'Prioritize by frequency × impact: investigate the factual errors first (likely a shared root cause with regulatory impact), batch the formatting items into one prompt revision.',
        'Ignore both; the system meets its SLOs.',
        'Pause the system until all 215 items are resolved.',
      ],
      correct: [1],
      explanation:
        'Impact weighting puts regulated factual errors first, and root-cause analysis often collapses many reports into one fix. Volume-only prioritization, ignoring feedback, or pausing are all poor responses.',
    },
    {
      question:
        'The model platform suffers a partial outage. Which design element keeps the assistant within its availability SLO while protecting quality expectations?',
      options: [
        'Returning HTTP 500 to users until the platform recovers.',
        'A pre-defined degraded mode (for example a smaller model or retrieval-only answer with a human follow-up promise), communicated to users as such.',
        'Silently returning cached answers to different questions.',
        'Disabling all guardrails to reduce latency.',
      ],
      correct: [1],
      explanation:
        'Degraded modes preserve availability honestly. Errors break the SLO, returning unrelated cached answers is deceptive and harmful, and dropping guardrails trades safety for nothing.',
    },
  ],
  statements: [
    { text: 'SLOs should be set and observed before SLAs are committed to customers.', isTrue: true, explanation: 'SLAs need headroom below demonstrated performance.' },
    { text: 'Average latency is an acceptable SLA metric for interactive AI features.', isTrue: false, explanation: 'Use percentiles such as p95; averages hide tails.' },
    { text: 'A quality SLO can be measured with availability monitors.', isTrue: false, explanation: 'Quality needs sampled judging and human review; availability monitors cannot see wrongness.' },
    { text: 'An error budget policy can freeze prompt and model changes when quality dips.', isTrue: true, explanation: 'It converts a dip into a controlled response rather than a blame cycle.' },
    { text: 'The best reaction to a single reported wrong answer is to pause the system until a full investigation completes.', isTrue: false, explanation: 'Acknowledge, diagnose, contextualize with agreed metrics and fix the class; pause only if data shows a threshold breach or safety issue.' },
    { text: 'Closing the loop with people who report problems keeps the feedback stream alive.', isTrue: true, explanation: 'Unacknowledged reporters stop reporting.' },
    { text: 'Human review turnaround for gated actions should have its own SLO.', isTrue: true, explanation: 'The human part of the system affects end-to-end performance.' },
  ],
  resources: [
    { label: 'Define your success criteria (Claude docs)', url: 'https://platform.claude.com/docs/en/test-and-evaluate/define-success' },
    { label: 'Anthropic status page', url: 'https://status.anthropic.com/' },
  ],
};
