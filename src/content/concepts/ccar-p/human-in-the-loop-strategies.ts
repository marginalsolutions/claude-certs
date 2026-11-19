import type { Concept } from '../../types';

export const humanInTheLoopStrategies: Concept = {
  id: 'human-in-the-loop-strategies',
  title: 'Human-in-the-Loop Strategies',
  summary:
    'Decide where humans sit in a Claude system (approval gates, review sampling, escalation), route by confidence so reviewers see the cases that need them, size the design to real reviewer capacity, and capture every human decision as eval data.',
  certs: ['ccar-p', 'ccdv-f', 'ccao-f'],
  domains: ['ccar-p-5', 'ccar-p-1', 'ccdv-f-7', 'ccao-f-6'],
  tags: ['human-in-the-loop', 'approval', 'escalation', 'governance', 'review'],
  difficulty: 'advanced',
  diagram: 'escalation-decision',
  sections: [
    {
      heading: 'Three places humans sit',
      body: `"Human in the loop" is not one pattern. The architect chooses where human judgment is applied based on the consequence and reversibility of what the system does:

| Pattern | Human acts | Use when | Cost |
|---|---|---|---|
| **Approval gate** (human-before) | Before an action executes: the system proposes, the human approves or edits | Irreversible or high-value actions: payments, account changes, legal filings, production deployments, external communications | Adds latency to every gated action; blocks throughput if reviewers are slow |
| **Review sampling** (human-after) | After the fact, on a sample of outputs | High-volume, low-consequence-per-item outputs where the aggregate quality matters: classifications, summaries, drafts | Cheap per item; catches drift, not individual errors |
| **Escalation** (human-on-demand) | When the system detects it cannot or should not proceed | Out-of-scope requests, low confidence, policy triggers, user asks for a person | Only costs when triggered; depends on the system detecting the need |

Most production systems combine all three: gate the dangerous actions, sample the routine ones, and escalate the uncertain ones. The mistake is picking one pattern for everything: gating every output destroys the efficiency the system was built for, while sampling alone lets a single irreversible mistake through.`,
    },
    {
      heading: 'Confidence-based routing',
      body: `Reviewers are the scarcest resource in the system. Spend them on cases where their judgment changes the outcome. Confidence-based routing sends each case down one of three paths:

- **Auto-approve**: high confidence, low stakes. Logged, sampled later.
- **Human review**: medium confidence, or high stakes regardless of confidence.
- **Reject or escalate**: low confidence, policy trigger, or the model itself says it cannot answer.

Where does confidence come from? Not from asking the model "how confident are you?" in free text; self-reported confidence is poorly calibrated. Better signals, often combined:

- Agreement between independent checks (two model calls or model plus rule-based validator agree).
- Retrieval quality (top chunk similarity, whether a source was cited and the citation verifies).
- A dedicated classifier call returning a structured label (\`high | medium | low\`) **calibrated against human labels** on a held-out set, so "high" means something measurable such as 98% agreement.
- Structural checks: schema valid, required fields present, amounts within expected range.
- Business rules: amount over threshold, new counterparty, regulated topic → always review.

Thresholds are tuned on data: plot reviewer-catch rate against the share of cases routed to review and pick the point the business accepts. Re-check thresholds after any model or prompt change, because calibration shifts.`,
    },
    {
      heading: 'Designing for reviewer capacity and quality',
      body: `A review design that assumes infinite reviewers fails on day one. Work backwards from capacity: if three reviewers can each do 120 careful reviews a day, the system can route at most ~360 cases to review daily; everything else must be auto-handled, deferred or declined. Then protect review *quality*:

- **Show the evidence, not just the answer.** Reviewers need the source passage, the retrieved documents, the model's rationale and the proposed action side by side. A bare "approve?" invites rubber-stamping.
- **Make the default action safe.** If the reviewer does nothing, the action should not execute (fail closed) for gated actions.
- **Watch for automation bias.** Track reviewer edit and rejection rates and time per case. A fall toward zero edits in seconds means reviewers have stopped reviewing; respond with seeded test cases (known-bad items inserted to measure catch rate), rotation, and smaller batches.
- **Give reviewers authority.** They must be able to reject, edit and flag patterns, and their flags must reach the team that owns the prompt and eval.
- **Set SLAs for review** so a gated action does not wait indefinitely, with an escalation path when the queue backs up.

Escalation paths also need design: a user-facing assistant should hand off to a person with the conversation context attached, acknowledge the handoff, and never pretend to have resolved something it escalated.`,
    },
    {
      heading: 'Closing the loop into evals',
      body: `Every human decision is labelled data. An approval, an edit, a rejection and an escalation each say something about where the system is right or wrong. Capture them in a structured way:

- Store the original input, the model output, the reviewer's decision and the corrected output (if edited), with the prompt version and model id.
- Feed rejected and edited cases into the eval set as new regression cases, and into judge calibration.
- Track reviewer disagreement with the model as a **leading quality indicator**; rising disagreement after a change is a regression signal even before customers notice.
- Periodically audit auto-approved cases with a stratified sample to check that the confidence router is still calibrated.

This is how the human layer pays for itself twice: it prevents harm now and makes the automated system better over time. Exam angle: when a scenario asks how to use the output of human review beyond fixing the individual case, the answer is to turn it into eval cases and calibration data; when it asks how to reduce reviewer load without raising risk, the answer is confidence-based routing with stakes-aware rules, not removing review from high-consequence actions.`,
    },
  ],
  examples: [
    {
      title: 'Routing invoices by confidence and stakes',
      description:
        'An accounts-payable system extracts invoice fields with Claude and routes each invoice. A calibrated classifier call returns a confidence label; business rules override it for high amounts or new vendors. Reviewers see only the cases where their judgment matters.',
      language: 'python',
      code: `def route(invoice, extraction, confidence: str) -> str:
    # Stakes rules win over confidence
    if extraction["amount"] > 25_000 or invoice.vendor_is_new:
        return "human_review"
    if confidence == "high" and extraction["schema_valid"]:
        return "auto_approve"          # logged; 2% stratified sample reviewed weekly
    if confidence == "low" or not extraction["schema_valid"]:
        return "escalate"              # back to the AP team with the raw document
    return "human_review"

# confidence comes from a separate structured-output call calibrated on 500 labelled invoices,
# not from asking the extraction model "how sure are you?"`,
      takeaway: 'Combine calibrated confidence with stakes-based rules; high-value cases are reviewed regardless of confidence.',
    },
    {
      title: 'The rubber-stamp review queue',
      description:
        'A lender gated every AI-drafted adverse-action letter behind human approval. Within three months, approval rate was 99.9% and median review time 6 seconds. Seeded test letters with deliberate errors were caught only 30% of the time. The fix: show the source data beside the draft, highlight fields the model flagged as uncertain, cut the queue by auto-approving a calibrated low-risk tier, and report seeded-case catch rate as a KPI for the review team.',
      takeaway: 'A gate that humans click through is not a control; measure catch rate and design the review surface for judgment.',
    },
    {
      title: 'Capacity-first review design',
      description:
        'A healthcare provider wanted clinicians to review every AI-generated patient message summary: 4,000 a day against a review capacity of roughly 400. The architect proposed gating only summaries that mention medication changes or abnormal results (about 9% of volume, identified by a classifier plus keyword rules), sampling 3% of the remainder weekly, and escalating anything the model marked as unclear. Review load fit capacity and the high-consequence summaries were all reviewed.',
      takeaway: 'Start from reviewer capacity and spend it on the highest-consequence cases.',
    },
    {
      title: 'Turning edits into eval cases',
      description:
        'A support team edited roughly 12% of AI-drafted replies before sending. A nightly job collected the edited pairs, had a judge categorize the edit (factual fix, tone, missing policy), and appended factual fixes to the eval set with the corrected reply as the expected answer. Within two months the edit rate fell to 5% because the prompt team was fixing real failure patterns weekly.',
      takeaway: 'Reviewer corrections are labelled data; route them into the eval and the prompt backlog.',
    },
  ],
  keyPoints: [
    'Three patterns: approval gates before irreversible actions, review sampling after high-volume outputs, escalation when the system detects it should not proceed. Combine them.',
    'Confidence-based routing sends auto-approve, review and escalate paths; stakes rules (amount, regulated topic, new counterparty) override confidence.',
    'Do not use free-text self-reported confidence; use calibrated classifiers, agreement between checks, retrieval quality and structural validation.',
    'Design from reviewer capacity backwards; an unreviewable queue is not a control.',
    'Fight automation bias: show evidence beside the answer, fail closed, seed known-bad cases, track edit rate and time per case.',
    'Set review SLAs and escalation paths so gated actions do not wait indefinitely.',
    'Capture every approval, edit, rejection and escalation as structured data and feed it into evals and judge calibration.',
    'Reviewer disagreement rate is a leading indicator of quality regressions.',
  ],
  flashcards: [
    { front: 'When is an approval gate the right pattern?', back: 'Before irreversible or high-value actions: payments, account changes, legal filings, deployments, external communications.' },
    { front: 'When is review sampling appropriate?', back: 'For high-volume outputs where per-item consequence is low and aggregate quality matters.' },
    { front: 'Why not ask the model "how confident are you?" for routing?', back: 'Free-text self-reported confidence is poorly calibrated. Use calibrated classifiers, check agreement and structural validation instead.' },
    { front: 'What should override a high confidence score?', back: 'Stakes rules: high amounts, new counterparties, regulated topics; these are always reviewed.' },
    { front: 'Signs of automation bias in a review queue?', back: 'Approval rate near 100%, review time of seconds, low catch rate on seeded known-bad cases.' },
    { front: 'What does "fail closed" mean for a gated action?', back: 'If the reviewer does nothing, the action does not execute.' },
    { front: 'How do you measure whether reviewers are actually reviewing?', back: 'Seed known-bad cases and track catch rate; monitor edit/rejection rate and time per case.' },
    { front: 'What should happen to reviewer edits and rejections?', back: 'Store them with input, output, prompt version and model id; add them to the eval set and judge calibration.' },
    { front: 'How should an assistant hand off to a human?', back: 'Pass the conversation context, acknowledge the handoff, never claim to have resolved what it escalated.' },
    { front: 'How do you choose the confidence threshold for review?', back: 'From data: plot reviewer catch rate against share routed to review and pick the point the business accepts; re-tune after model or prompt changes.' },
  ],
  quiz: [
    {
      question:
        'A bank deploys an agent that drafts responses to customer complaints and can issue goodwill credits up to $200. Which human-in-the-loop design is MOST appropriate?',
      options: [
        'Human approval before every drafted response and every credit.',
        'No human involvement; the model is accurate in testing.',
        'Approval gate for credits above a threshold or for regulated complaint categories, sampling of sent responses, and escalation when the model flags uncertainty.',
        'Weekly sampling only, including of issued credits.',
      ],
      correct: [2],
      explanation:
        'Combining gates for high-consequence actions, sampling for routine outputs and escalation for uncertainty balances risk and throughput. Gating everything destroys efficiency, no oversight ignores irreversible credits, and sampling alone lets individual bad credits through.',
    },

    {
      question:
        'A team routes cases to review based on the model answering "How confident are you (0-100)?" at the end of each response. Reviewers report many confident wrong answers. What is the BEST improvement?',
      options: [
        'Ask the model to be more honest about confidence.',
        'Replace self-reported confidence with a calibrated signal: a separate structured classifier validated against human labels, plus agreement and retrieval-quality checks.',
        'Route every case to review.',
        'Increase the model\'s effort level.',
      ],
      correct: [1],
      explanation:
        'Self-reported confidence is poorly calibrated. Calibrated signals make thresholds meaningful. Reviewing everything is unsustainable, and effort does not fix calibration.',
    },
    {
      question: 'Which TWO indicate that a human approval gate has degraded into rubber-stamping? (Select two)',
      options: [
        'Median review time has dropped to a few seconds.',
        'Reviewers reject about 8% of cases with written reasons.',
        'Seeded known-bad cases are caught less than half the time.',
        'Review queue depth is stable within SLA.',
      ],
      correct: [0, 2],
      explanation:
        'Very short review times and low catch rates on seeded cases show reviewers are not evaluating. A steady rejection rate with reasons and a healthy queue are signs of a working gate.',
    },
    {
      question:
        'A hospital has capacity to review 400 AI-generated summaries per day but produces 4,000. Leadership insists every summary be reviewed. What should the architect propose?',
      options: [
        'Accept the requirement and let the queue grow.',
        'Prioritize review of summaries with high-consequence content (medication changes, abnormal results) identified by classifier and rules, sample the remainder, and escalate unclear cases, so review load matches capacity.',
        'Remove human review entirely.',
        'Switch to a smaller model to produce fewer summaries.',
      ],
      correct: [1],
      explanation:
        'Design from capacity and spend it on consequence. An ever-growing queue provides no control, removing review ignores patient safety, and model size does not change volume.',
    },
    {
      question:
        'Support agents edit about 12% of AI-drafted replies before sending. Beyond sending the corrected reply, what is the MOST valuable use of these edits?',
      options: [
        'Delete them to save storage.',
        'Store input, draft, edit and prompt version; add factual corrections to the eval set and use them to prioritize prompt fixes.',
        'Report the percentage to management only.',
        'Use them to penalize the agents who edit most.',
      ],
      correct: [1],
      explanation:
        'Edits are labelled failure data that improve the system when fed into evals and the prompt backlog. Discarding them or using them punitively wastes the signal.',
    },
    {
      question:
        'An assistant escalates a billing dispute to a human team but tells the customer "Your issue has been resolved." Which design principle was violated?',
      options: [
        'Escalations should always be silent.',
        'The assistant must acknowledge the handoff honestly and pass context; it should never claim resolution for something it escalated.',
        'Escalation should only occur after three failed attempts.',
        'Billing disputes should never be escalated.',
      ],
      correct: [1],
      explanation:
        'Honest handoff with context is the escalation design rule. Silent or delayed escalation and refusing to escalate billing issues are all wrong.',
    },
  ],
  statements: [
    { text: 'Approval gates are best reserved for irreversible or high-value actions.', isTrue: true, explanation: 'Gating everything destroys throughput; gating the consequential actions manages risk where it matters.' },
    { text: 'Asking the model to state its confidence in free text is a reliable routing signal.', isTrue: false, explanation: 'Self-reported confidence is poorly calibrated; use calibrated classifiers and structural checks.' },
    { text: 'A high-value transaction should be auto-approved if the confidence classifier says "high".', isTrue: false, explanation: 'Stakes rules override confidence; high-value or regulated cases are always reviewed.' },
    { text: 'Seeding known-bad cases into a review queue measures whether reviewers are actually catching errors.', isTrue: true, explanation: 'Catch rate on seeded cases is the direct measure of review effectiveness.' },
    { text: 'For a gated action, the safe default when no reviewer responds is to execute the action to avoid delays.', isTrue: false, explanation: 'Gated actions should fail closed; use review SLAs and escalation to handle delays.' },
    { text: 'Reviewer disagreement with the model is a leading indicator of quality regressions.', isTrue: true, explanation: 'Rising disagreement after a change signals a problem before customers do.' },
    { text: 'Confidence thresholds set once at launch remain valid across model upgrades.', isTrue: false, explanation: 'Calibration shifts with model and prompt changes; re-tune thresholds after each.' },
  ],
  resources: [
    { label: 'Building effective agents (Anthropic)', url: 'https://www.anthropic.com/research/building-effective-agents' },
    { label: 'Define your success criteria (Claude docs)', url: 'https://platform.claude.com/docs/en/test-and-evaluate/define-success' },
  ],
};
