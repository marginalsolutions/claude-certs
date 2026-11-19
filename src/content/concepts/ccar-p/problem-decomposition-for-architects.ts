import type { Concept } from '../../types';

export const problemDecompositionForArchitects: Concept = {
  id: 'problem-decomposition-for-architects',
  title: 'Problem Decomposition for Architects',
  summary:
    'Break a complex business problem into stages, decide which stages are deterministic code and which need a model, place humans where error cost demands, and map each stage to its share of the latency and cost budget.',
  certs: ['ccar-p', 'ccar-f', 'ccao-f'],
  domains: ['ccar-p-1', 'ccar-f-1', 'ccao-f-1'],
  tags: ['decomposition', 'design', 'deterministic', 'human-in-the-loop', 'sla', 'budget'],
  difficulty: 'advanced',
  sections: [
    {
      heading: 'Why decompose',
      body: `A single prompt asked to "read this loan application, verify the documents, assess risk and draft a decision letter" will do all four things somewhat. It cannot be tested per stage, its failures cannot be localised, and its cost cannot be attributed. Decomposition turns one opaque task into stages that each have a clear input, output and quality measure.

Benefits an architect should be able to articulate:

- **Testability.** Each stage gets its own eval set; a regression is pinned to a stage.
- **Right-sizing.** Each stage can use the cheapest model or no model at all.
- **Controls.** Validation, authorization and human review can be inserted at precise points.
- **Reuse.** A well-defined extraction or classification stage is reusable across products.
- **SLAs.** Latency and cost budgets can be allocated and monitored per stage.

The cost is orchestration complexity and some loss of the model's ability to use cross-stage context. Keep stages as coarse as the controls and tests allow; do not split for its own sake.`,
    },
    {
      heading: 'Deterministic step or model step?',
      body: `For each stage, ask: can this be done correctly by code with the information available? If yes, write code. Reserve the model for steps that require reading unstructured input, judgment, or generation.

| Stage type | Examples | Implementation |
|---|---|---|
| Deterministic | Lookups, arithmetic, date math, schema validation, allow-list checks, routing by known field | Code, SQL, rules engine |
| Model: perception | OCR cleanup, extraction from documents, classification of free text | Claude with structured outputs, often a smaller model |
| Model: judgment | Risk assessment with policy in context, prioritisation, ambiguity resolution | Claude, stronger model, higher effort |
| Model: generation | Drafting letters, summaries, code | Claude with templates and validation |
| Human | Approvals above a threshold, regulated decisions, low-confidence cases | Review queue with SLA |

A common senior-level error is letting the model do deterministic work "because it can". Models approximate arithmetic and lookups; code does them exactly and for free. Conversely, encoding judgment as brittle rules when the input is unstructured is the error in the other direction.`,
    },
    {
      heading: 'Placing humans and controls',
      body: `Human review is a stage with its own cost and SLA. Place it by error cost and reversibility:

- **Before irreversible or high-value actions**: payments above a limit, account deletions, regulated decisions (credit, medical, employment). The model proposes; a human disposes.
- **At low confidence**: route only cases that fail validation or fall under a calibrated confidence threshold. Measure the reviewer agreement rate to tune the threshold.
- **On samples**: for low-risk stages, review a statistical sample to monitor quality rather than every item.

Controls that are not human: schema validation, business-rule checks, allow-lists on tool arguments, authorization per tool call, rate and spend limits. These sit between stages and run on every item.

A decomposition diagram should show, for every arrow between stages, what is checked and who or what can stop the flow.`,
    },
    {
      heading: 'Mapping stages to SLAs and budgets',
      body: `Once the stages exist, allocate the end-to-end targets across them:

- **Latency budget.** If the business SLA is p95 under 5 seconds for an interactive answer, allocate: auth and input handling 100 ms, retrieval 400 ms, model time-to-first-token 800 ms, streaming the remainder, validation 50 ms. A stage that cannot meet its slice must be redesigned (smaller model, lower effort, cached prefix, precomputed retrieval) or moved off the interactive path.
- **Cost budget.** Estimate tokens per stage per item (input, cached input, output) and multiply by model price and volume. Expensive judgment stages justify their price only if the perception stages in front of them have cut the input down.
- **Accuracy budget.** Errors compound across stages: three stages at 98% each give roughly 94% end-to-end. Decide which stage must be strongest and where review recovers the rest.

Exam items present a complex process and ask how to structure it, or present a monolithic prompt with a quality problem and ask what to do. The best answers separate deterministic from model work, add a validation or review stage at the point of error cost, or route by complexity. Distractors keep the monolith and add effort, examples or a bigger model.`,
    },
  ],
  examples: [
    {
      title: 'Decomposing loan-application processing',
      description:
        'A lender replaced a single "assess this application" prompt with five stages. Document classification and field extraction use Haiku with structured outputs; income verification and debt ratio are code; the risk narrative uses Opus with policy in context and high effort; a deterministic rule set flags mandatory human review for amounts above a threshold or adverse decisions; the decision letter is generated from a template with the approved fields only.',
      language: 'markdown',
      code: `| Stage | Type | Model | p95 budget | Cost/app | Check before next stage |
|---|---|---|---|---|---|
| 1 Classify + extract docs | perception | Haiku 5.5 | 6 s (batch) | $0.02 | schema valid, required docs present |
| 2 Verify income, DTI | deterministic | none | 50 ms | $0 | values within policy ranges |
| 3 Risk narrative | judgment | Opus 5.5, effort high | 20 s | $0.11 | cites only stage-1/2 fields |
| 4 Decision gate | deterministic + human | none | 1 business day | analyst time | human approval if > $50k or adverse |
| 5 Letter | generation | Sonnet 5.5 | 4 s | $0.01 | template fields only, no new facts |`,
      takeaway: 'Each stage has a type, a model (or none), a latency and cost slice and an explicit check; the expensive model touches only the stage that needs judgment.',
    },
    {
      title: 'Mistake: letting the model do the arithmetic',
      description:
        'An expense-audit prompt asked Claude to read receipts, sum line items, compare the total to the claimed amount and flag discrepancies. Sums were occasionally off by a few cents and auditors stopped trusting the flags. The fix extracted line items with structured outputs and performed the sum and comparison in code. Flag accuracy went to 100% on the arithmetic and model cost fell because the output was shorter.',
      language: 'python',
      code: `resp = client.messages.create(
    model="claude-haiku-5-5", max_tokens=1024,
    messages=[{"role": "user", "content": [
        {"type": "image", "source": {"type": "base64", "media_type": "image/jpeg", "data": receipt_b64}},
        {"type": "text", "text": "Extract every line item and the printed total."}]}],
    output_config={"format": {"type": "json_schema", "schema": RECEIPT_SCHEMA}},
)
receipt = json.loads(resp.content[0].text)
computed = round(sum(Decimal(i["amount"]) for i in receipt["items"]), 2)
if computed != Decimal(receipt["printed_total"]) or computed != claimed_amount:
    flag_for_audit(receipt, computed, claimed_amount)   # exact, free, testable`,
      takeaway: 'Use the model for perception (reading the receipt) and code for arithmetic and comparison.',
    },
    {
      title: 'Compounding accuracy across stages',
      description:
        'A document pipeline had three model stages at 97%, 98% and 96% accuracy. The team expected "about 97%" end to end but measured 91%. Understanding that errors compound, they made the first stage (classification) deterministic using document metadata where available, raising it to 99.5%, and added selective human review after extraction. End-to-end accuracy rose to 97.8%.',
      takeaway: 'Multiply stage accuracies to estimate end-to-end accuracy; strengthen the weakest early stage and place review where it recovers the most.',
    },
    {
      title: 'Placing human approval before an irreversible action',
      description:
        'A procurement agent could draft, approve and issue purchase orders. The architect split "approve and issue" out of the model\'s hands: the model drafts a PO with justification; a deterministic policy check validates vendor, budget line and amount; orders above a threshold wait for a buyer\'s approval; issuance is a separate service call made by the application after approval, not by the model.',
      takeaway: 'The model proposes; code validates; a human approves irreversible or high-value actions; the application executes.',
    },
  ],
  keyPoints: [
    'Decompose complex tasks into stages with explicit inputs, outputs and quality measures; test, size and monitor each stage separately.',
    'Deterministic steps (lookups, arithmetic, validation, routing on known fields) belong in code, not in the model.',
    'Use the model for perception, judgment and generation; use smaller models for perception and stronger models with higher effort for judgment.',
    'Place humans before irreversible or high-value actions, at calibrated low confidence, or on statistical samples for low-risk stages.',
    'Insert non-human controls (schema validation, allow-lists, per-call authorization, spend limits) between stages on every item.',
    'Allocate the end-to-end latency, cost and accuracy budgets across stages; redesign any stage that cannot meet its slice.',
    'Stage accuracies multiply: three stages at 98% give about 94% end to end.',
    'Keep stages as coarse as controls and tests allow; do not split for its own sake.',
  ],
  flashcards: [
    { front: 'Name four benefits of decomposing a complex LLM task into stages.', back: 'Per-stage testability, right-sizing models per stage, precise placement of controls and review, and per-stage SLA and cost budgets (plus reuse).' },
    { front: 'How do you decide whether a stage is deterministic or a model step?', back: 'If code can do it correctly with the available information, write code; reserve the model for unstructured input, judgment or generation.' },
    { front: 'Three model-step categories and typical model sizing?', back: 'Perception (smaller model, structured outputs), judgment (stronger model, higher effort), generation (templates plus validation).' },
    { front: 'Where should human review be placed?', back: 'Before irreversible or high-value actions, at calibrated low confidence, and on samples for low-risk stages.' },
    { front: 'If three stages are 97%, 98% and 96% accurate, what is the rough end-to-end accuracy?', back: 'About 91% (0.97 × 0.98 × 0.96).' },
    { front: 'What is wrong with letting the model sum receipt line items?', back: 'Arithmetic is deterministic; models approximate it. Extract items with the model and sum in code.' },
    { front: 'How is a 5-second p95 SLA turned into design constraints?', back: 'Allocate slices to each stage (auth, retrieval, time-to-first-token, streaming, validation) and redesign any stage that cannot meet its slice.' },
    { front: 'In the "propose, validate, approve, execute" pattern, who executes the irreversible action?', back: 'The application, after deterministic validation and human approval; not the model.' },
    { front: 'What is the main cost of decomposition?', back: 'Orchestration complexity and loss of cross-stage context; keep stages as coarse as controls and tests allow.' },
  ],
  quiz: [
    {
      question:
        'A single prompt reads a loan application, verifies income, assesses risk and drafts a letter. Quality is inconsistent and the team cannot tell which part fails. What is the MOST appropriate first change?',
      options: [
        'Raise effort to max and add more examples to the prompt.',
        'Decompose into stages (extraction, deterministic verification, risk judgment, letter) with per-stage validation and evals.',
        'Switch to the largest available model.',
        'Add a second model call that reviews the whole output.',
      ],
      correct: [1],
      explanation:
        'Decomposition localises failures and lets each stage be right-sized and tested. More effort (1), a bigger model (3) or a reviewer call (4) keep the opaque monolith and add cost.',
    },
    {
      question:
        'An expense-audit prompt asks Claude to sum receipt line items and compare to the claimed amount. Sums are occasionally off by cents. What is the BEST fix?',
      options: [
        'Ask the model to double-check its arithmetic in the prompt.',
        'Use a stronger model with higher effort.',
        'Extract line items with structured outputs and perform the sum and comparison in code.',
        'Round all amounts to whole currency units.',
      ],
      correct: [2],
      explanation:
        'Arithmetic is deterministic and belongs in code. Prompting (1) and bigger models (2) only reduce the error rate; rounding (4) hides discrepancies.',
    },
    {
      question:
        'Which TWO are appropriate placements for human review in a decomposed pipeline? (Select two)',
      options: [
        'Before any irreversible or high-value action such as issuing a payment above a threshold.',
        'On every item at every stage.',
        'On cases that fall below a calibrated confidence threshold.',
        'Only after the system has been live for six months.',
      ],
      correct: [0, 2],
      explanation:
        'Irreversible actions and low-confidence cases are where review earns its cost. Reviewing everything (2) destroys the efficiency gain; delaying review (4) leaves the launch uncontrolled.',
    },
    {
      question:
        'A pipeline has three model stages measured at 97%, 98% and 96% accuracy. The business requires 97% end to end. Which statement is correct?',
      options: [
        'The pipeline meets the target because the average is 97%.',
        'The pipeline is at roughly 91% end to end; the team must strengthen stages or add review to recover errors.',
        'Only the last stage matters for end-to-end accuracy.',
        'Accuracy cannot be estimated without running the full pipeline.',
      ],
      correct: [1],
      explanation:
        'Stage error rates compound multiplicatively: 0.97 × 0.98 × 0.96 ≈ 0.91. Averaging (1) and last-stage-only (3) are wrong models of compounding; estimation (4) is possible and useful before full runs.',
    },
    {
      question:
        'An interactive assistant must meet p95 under 5 seconds. Retrieval takes 2.5 seconds and the model\'s time-to-first-token is 2 seconds. Which approach BEST fits the budget?',
      options: [
        'Accept the SLA miss because the model is the bottleneck.',
        'Allocate per-stage slices and redesign retrieval (precompute, cache, narrower index) and the model stage (cached prefix, lower effort or smaller model) until each fits its slice.',
        'Remove retrieval so the model answers from memory.',
        'Move the interactive assistant to the Batches API.',
      ],
      correct: [1],
      explanation:
        'Budgets are allocated and each stage is engineered to its slice. Accepting the miss (1) fails the SLA; removing retrieval (3) causes hallucination; the Batches API (4) has no latency SLA and is for non-interactive work.',
    },
  ],
  statements: [
    { text: 'Decomposing a task into stages makes failures localisable and lets each stage use the cheapest adequate model.', isTrue: true, explanation: 'Per-stage evals pin regressions; perception stages can use smaller models while judgment stages use stronger ones.' },
    { text: 'If a model can perform a deterministic step correctly most of the time, it is acceptable to let it do so to simplify the design.', isTrue: false, explanation: 'Code does deterministic work exactly and for free; models approximate it. Keep lookups, arithmetic and validation in code.' },
    { text: 'End-to-end accuracy across sequential model stages is approximately the product of stage accuracies.', isTrue: true, explanation: 'Errors compound; three 98% stages yield roughly 94%.' },
    { text: 'Human review should be placed on a random sample of low-risk outputs rather than on every low-risk item.', isTrue: true, explanation: 'Sampling monitors quality at low cost; full review is reserved for high error-cost cases.' },
    { text: 'The model that drafts a purchase order should also be the component that issues it, to reduce latency.', isTrue: false, explanation: 'Irreversible actions should be executed by the application after deterministic validation and, above a threshold, human approval.' },
    { text: 'More stages is always better because each stage is more testable.', isTrue: false, explanation: 'Each split adds orchestration and loses cross-stage context; keep stages as coarse as controls and tests allow.' },
    { text: 'A latency SLA should be allocated as slices across stages so that each stage has a measurable target.', isTrue: true, explanation: 'Per-stage slices make bottlenecks visible and drive targeted redesign.' },
  ],
  resources: [
    { label: 'Chain complex prompts (Claude docs)', url: 'https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/chain-prompts' },
    { label: 'Building effective agents (Anthropic engineering)', url: 'https://www.anthropic.com/engineering/building-effective-agents' },
    { label: 'Structured outputs (Claude docs)', url: 'https://platform.claude.com/docs/en/build-with-claude/structured-outputs' },
  ],
};
