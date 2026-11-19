import type { Concept } from '../../types';

export const humanReviewAndConfidenceCalibration: Concept = {
  id: 'human-review-and-confidence-calibration',
  title: 'Human Review Workflows and Confidence Calibration',
  summary:
    'Decide which extractions a human must check. Aggregate accuracy hides segment failures, so measure by document type and field, calibrate field-level confidence on labeled data, route low-confidence and contradictory cases to reviewers, and keep sampling the high-confidence stream.',
  certs: ['ccar-f', 'ccar-p', 'ccdv-f'],
  domains: ['ccar-f-5', 'ccar-f-4', 'ccar-p-4', 'ccar-p-5', 'ccdv-f-6'],
  tags: ['human-in-the-loop', 'extraction', 'confidence', 'evaluation', 'sampling', 'structured-output'],
  difficulty: 'intermediate',
  diagram: 'structured-output-flow',
  sections: [
    {
      heading: 'Why 97% overall is not a decision',
      body: `A structured extraction pipeline reports 97% field accuracy on its validation set, and the business wants to stop reviewing every document. The aggregate number is real but it is not the number that matters, because errors are rarely uniform.

Suppose 85% of the corpus is clean, machine-generated invoices on which the model scores 99.5%, and 15% is scanned, handwritten purchase orders on which it scores 83%. The blended figure is about 97%. If you automate everything, the purchase orders go downstream with one wrong field in six. The same hiding happens across fields: \`vendor_name\` at 99.8% and \`payment_terms\` at 88% average out to something that looks fine.

Before reducing human review, **stratify** the accuracy measurement by every segment that could plausibly differ: document type, source or template, language, scan quality, and field. Set a threshold per segment and automate only the segments that clear it. Segments that do not clear it stay in full review or get a targeted fix (few-shot examples for that document type, a schema change for that field) and are re-measured.

This is the exam's recurring shape: an aggregate metric is offered as justification for removing a control, and the correct answer is to break the metric down by segment first.`,
    },
    {
      heading: 'Field-level confidence, calibrated on labeled data',
      body: `Routing review attention needs a signal per extraction, and the useful granularity is the **field**, not the document. A document may have nine certain fields and one guess; reviewing all ten wastes effort, while skipping all ten passes the guess.

Have the model output a confidence score alongside each field, as part of the structured output schema. Then **calibrate**: on a labeled validation set, bucket predictions by stated confidence and measure the actual accuracy in each bucket. If fields the model rates 0.9 are right 91% of the time, the score is informative at that range; if fields rated 0.9 are right only 70% of the time, the score is over-confident there and the threshold must be set accordingly, or the score replaced.

Raw self-reported confidence is not trustworthy on its own (the same lesson as escalation). What makes it usable is the empirical mapping from stated score to observed accuracy, measured on labeled data and re-measured as the pipeline changes. The review threshold is then a business decision: pick the confidence cut-off at which the measured error rate above the cut-off is acceptable for automation, given the cost of an undetected error for that field. A wrong \`total_amount\` on a payable invoice merits a stricter threshold than a wrong \`notes\` field.

Complement model confidence with **deterministic signals**: schema validation failures, totals that do not sum, dates outside a plausible range, and disagreement between two extraction passes all indicate review regardless of what the model says.`,
    },
    {
      heading: 'Routing with limited reviewer capacity',
      body: `Human reviewers are the scarce resource, so routing is a prioritization problem. Send to review:

1. **Low-confidence fields**, below the calibrated threshold for that field and document type.
2. **Ambiguous or contradictory source documents**: the invoice shows two different totals, the contract has a struck-through clause, the scan is partially illegible. Have the model flag these conditions explicitly in the schema (for example an \`ambiguity_notes\` field or an enum of source-quality issues) rather than guessing a value.
3. **Validation failures** that a retry did not fix.
4. **High-impact fields** where even calibrated confidence is not enough on its own (payment amounts, legal parties), at a sampling rate rather than 100%.

Present reviewers with the field, the model's value, the confidence, and the source excerpt the value came from, so a review takes seconds. Capture the reviewer's correction as a new labeled example; this is how the calibration set grows and how novel error patterns get into the eval set.

Order the queue by expected cost of error: a low-confidence \`total_amount\` on a large invoice outranks a low-confidence \`notes\` field. When capacity is exceeded, the overflow should default to *holding* high-impact items rather than passing them through.`,
    },
    {
      heading: 'Stratified random sampling of the automated stream',
      body: `Once high-confidence extractions flow through without review, you lose visibility into their error rate unless you deliberately keep some. **Stratified random sampling** solves two problems at once.

- **Ongoing error-rate measurement.** Sample a fixed fraction (say 2 to 5%) of high-confidence extractions from *each* stratum (document type × field group) and have reviewers check them. Per-stratum error rates now have a trend line, and drift (a vendor changes its invoice template; a new document type appears) shows up as a rising rate in one stratum rather than being diluted in the aggregate.
- **Novel error pattern detection.** Confidence-based routing only catches the errors the model knows it might be making. Random samples catch the confident, systematic mistakes: a date format misread the same way every time, a currency symbol consistently dropped. Those patterns feed back into few-shot examples, schema constraints and the eval set.

Stratification matters because uniform random sampling of a corpus that is 85% invoices will rarely sample the rare, risky document types. Sample within each stratum so small segments are covered.

Putting it together: measure by segment before automating; calibrate field-level confidence on labeled data; route low-confidence, contradictory and validation-failing cases to reviewers in cost order; sample the automated stream by stratum; feed corrections back. That loop is what "human review workflow" means on the exam.`,
    },
  ],
  examples: [
    {
      title: 'Mistake: automating on the aggregate',
      description: `A finance team's extraction pipeline hits 97% field accuracy and they turn off review for all documents above 0.8 confidence. Three weeks later accounts payable finds that purchase orders from one scanned-paper supplier have wrong line totals in about one case in six. Those documents were 12% of volume and the model was confident on them.

**Fix:** re-measure accuracy by document type and field. Clean invoices clear 99% on every field and stay automated; scanned POs go back to full review while the team adds few-shot examples for that layout; a stratified sample of 3% of automated documents per type is added for ongoing measurement.`,
      takeaway: 'Break accuracy down by document type and field before removing review; the aggregate hides the segment that fails.',
    },
    {
      title: 'Field-level confidence in the extraction schema',
      description: `An extraction tool schema is extended so each field carries a confidence and the model can flag source ambiguity. The pipeline then routes any field below its calibrated threshold, and any document with ambiguity notes, to the review queue.`,
      language: 'python',
      code: `import anthropic
client = anthropic.Anthropic()

field = lambda t: {"type": "object", "properties": {
    "value": {"type": [t, "null"]},
    "confidence": {"type": "number", "minimum": 0, "maximum": 1},
    "source_excerpt": {"type": "string"}}, "required": ["value", "confidence", "source_excerpt"]}

schema = {"type": "object", "properties": {
    "vendor_name": field("string"), "invoice_date": field("string"),
    "total_amount": field("number"),
    "ambiguity_notes": {"type": "array", "items": {"type": "string"},
        "description": "Conflicting or illegible source content; leave empty if none"}},
  "required": ["vendor_name", "invoice_date", "total_amount", "ambiguity_notes"]}

resp = client.messages.create(
    model="claude-opus-5-5", max_tokens=1024,
    output_config={"format": {"type": "json_schema", "schema": schema}},
    messages=[{"role": "user", "content": f"Extract fields from this invoice:\\n{document_text}"}])
# route: any field.confidence < threshold[doc_type][field] or ambiguity_notes -> review queue`,
      takeaway: 'Ask for confidence and ambiguity flags per field in the schema, then route using thresholds calibrated on labeled data.',
    },
    {
      title: 'Calibrating the threshold',
      description: `On a 2,000-document labeled set, the team buckets \`total_amount\` predictions by stated confidence. Fields rated 0.9 to 1.0 are correct 99.2% of the time; 0.8 to 0.9 are correct 94%; below 0.8, 81%. Finance accepts up to a 1% error rate on automated totals, so the threshold for \`total_amount\` is set at 0.9. For \`notes\`, where errors are cheap, 0.8 is acceptable. The same exercise for scanned POs shows 0.9-rated totals are only 93% correct, so that document type keeps a higher threshold until the few-shot fix is measured.`,
      language: 'text',
      code: `total_amount, clean invoices (n=1,700)        total_amount, scanned POs (n=300)
conf 0.9-1.0 : 99.2% correct  -> automate      conf 0.9-1.0 : 93.0% correct  -> review
conf 0.8-0.9 : 94.0% correct  -> review        conf 0.8-0.9 : 85.0% correct  -> review
conf  <0.8   : 81.0% correct  -> review        conf  <0.8   : 70.0% correct  -> review`,
      takeaway: 'A confidence score means only what the labeled set says it means; set thresholds per field and document type from measured accuracy.',
    },
    {
      title: 'Stratified sampling catches a silent template change',
      description: `Six months in, one vendor redesigns its invoice. The model keeps reporting high confidence but starts reading the due date from a "ship date" field. Confidence routing catches nothing because the model is sure. The 3% stratified sample for that vendor's stratum shows the date error rate jump from 0.4% to 9% within two weeks, and the team adds the new layout to the few-shot examples before the backlog grows.`,
      takeaway: 'Random stratified sampling of the high-confidence stream is the only way to see errors the model is confident about.',
    },
  ],
  keyPoints: [
    'Aggregate accuracy (for example 97% overall) can mask poor performance on specific document types or fields; measure by segment before automating.',
    'Validate accuracy per document type and per field, and automate only the segments that clear their threshold.',
    'Have the model output field-level confidence scores in the structured output schema.',
    'Calibrate review thresholds on a labeled validation set by measuring actual accuracy in each confidence bucket; raw self-reported confidence is not trustworthy on its own.',
    'Route low-confidence fields, ambiguous or contradictory source documents, and unresolved validation failures to human review, ordered by cost of error.',
    'Stratified random sampling of high-confidence extractions gives ongoing per-stratum error rates and detects novel, confident error patterns.',
    'Reviewer corrections become new labeled examples that refresh calibration and the eval set.',
    'Combine model confidence with deterministic checks (schema validation, arithmetic consistency, plausible ranges).',
  ],
  flashcards: [
    { front: 'Why is a 97% aggregate accuracy figure insufficient to justify removing human review?', back: 'It can mask much lower accuracy on specific document types or fields; measure by segment first.' },
    { front: 'What should be analyzed before reducing human review of extractions?', back: 'Accuracy by document type and by field, to verify consistent performance across all segments.' },
    { front: 'At what granularity should confidence scores be produced for routing review?', back: 'Per field, so only the uncertain fields of a document need attention.' },
    { front: 'How do you calibrate a confidence threshold?', back: 'On a labeled validation set, bucket predictions by stated confidence, measure actual accuracy per bucket, and choose the cut-off whose error rate is acceptable for that field.' },
    { front: 'Which extractions should be routed to human review?', back: 'Low model confidence, ambiguous or contradictory source documents, and validation failures a retry did not fix; prioritized by cost of error.' },
    { front: 'What is stratified random sampling used for in an extraction pipeline?', back: 'Ongoing measurement of error rates in high-confidence extractions per stratum and detection of novel error patterns the model is confident about.' },
    { front: 'Why stratify the sample instead of sampling uniformly?', back: 'Uniform sampling of a skewed corpus rarely covers rare, risky document types; sampling within each stratum does.' },
    { front: 'What should a reviewer see to make a review fast?', back: 'The field, the model\'s value, its confidence and the source excerpt it came from.' },
    { front: 'What happens to reviewer corrections?', back: 'They become labeled examples that refresh calibration, the eval set and few-shot examples.' },
    { front: 'How should an extraction schema handle a document with two conflicting totals?', back: 'Flag the ambiguity explicitly (for example in an ambiguity_notes field) and route to review rather than guessing one value.' },
  ],
  quiz: [
    {
      question:
        'An extraction pipeline reports 97% overall field accuracy. Management wants to stop human review for all documents. What should you do FIRST?',
      options: [
        'Approve the change; 97% exceeds the industry benchmark.',
        'Analyze accuracy by document type and by field to confirm every segment meets the threshold before automating any of them.',
        'Switch to a larger model to push accuracy above 99% first.',
        'Keep reviewing 100% of documents indefinitely.',
      ],
      correct: [1],
      explanation:
        'The aggregate may hide a badly performing segment. Approving on the aggregate is the trap; a larger model does not reveal where errors concentrate; blanket 100% review ignores the evidence that most segments may be fine.',
    },
    {
      question:
        'You want to route only uncertain extractions to reviewers. Which approach is MOST sound?',
      options: [
        'Ask the model for a document-level confidence score and review documents below 0.7.',
        'Have the model output field-level confidence scores, calibrate thresholds per field on a labeled validation set, and route fields below threshold.',
        'Review every document whose text contains the word "approximately".',
        'Use the model\'s confidence scores directly as probabilities without validation.',
      ],
      correct: [1],
      explanation:
        'Field granularity targets effort and calibration makes the score meaningful. Document-level scores waste review on certain fields; keyword rules are arbitrary; uncalibrated self-reported confidence is unreliable.',
    },
    {
      question:
        'Which TWO cases should be routed to human review even when reviewer capacity is limited? (Select two)',
      options: [
        'A field whose calibrated confidence is below the threshold for its document type.',
        'A document in which the model found two contradictory totals.',
        'A field with confidence 0.99 on a document type with measured 99.5% accuracy.',
        'Every document from the highest-volume vendor.',
      ],
      correct: [0, 1],
      explanation:
        'Low calibrated confidence and contradictory sources are the core routing triggers. High-confidence fields in well-performing segments should flow through (with sampling), and routing by volume is unrelated to risk.',
    },
    {
      question:
        'After automating high-confidence extractions, how should a team detect errors the model makes confidently and systematically?',
      options: [
        'Lower the confidence threshold so more documents are reviewed.',
        'Review a stratified random sample of high-confidence extractions from each document type on an ongoing basis.',
        'Ask the model to double-check its own high-confidence outputs.',
        'Wait for downstream systems to report mismatches.',
      ],
      correct: [1],
      explanation:
        'Confident errors do not trigger confidence routing, so only random sampling finds them; stratifying covers rare segments. Lowering the threshold increases volume without targeting confident errors; self-checking shares the model\'s blind spots; waiting for downstream failures is detection after harm.',
    },
    {
      question:
        'On the labeled set, total_amount fields rated 0.9 or higher are correct 99.2% of the time on clean invoices but only 93% on scanned purchase orders. The acceptable automated error rate is 1%. What is the correct policy?',
      options: [
        'Automate total_amount at 0.9 for both document types since the combined rate is above 98%.',
        'Automate total_amount at 0.9 for clean invoices; keep scanned purchase orders in review until a fix is measured.',
        'Review all total_amount fields on all document types.',
        'Raise the threshold to 0.95 for both and automate.',
      ],
      correct: [1],
      explanation:
        'Thresholds are set per segment from measured accuracy. Blending the types repeats the aggregate mistake; reviewing everything ignores the segment that is fine; raising the threshold without re-measuring the PO bucket is a guess.',
    },
    {
      question:
        'A reviewer corrects an extraction. What should happen to that correction?',
      options: [
        'Discard it once the downstream record is fixed.',
        'Add it to the labeled set used for calibration and evaluation, and consider it for few-shot examples.',
        'Use it to immediately lower the confidence threshold for all fields.',
        'Send it to the model as a system prompt instruction for future runs.',
      ],
      correct: [1],
      explanation:
        'Corrections are the cheapest source of new labeled data. Discarding them wastes it; changing all thresholds on one example is over-reaction; one-off system prompt instructions do not scale and are not evaluated.',
    },
  ],
  statements: [
    { text: 'A high aggregate accuracy figure can coexist with unacceptable accuracy on a minority document type.', isTrue: true, explanation: 'Blending a large clean segment with a small poor one produces a reassuring average.' },
    { text: 'Model self-reported confidence can be used as a review threshold without validation.', isTrue: false, explanation: 'It must be calibrated on a labeled set; stated confidence and observed accuracy often diverge.' },
    { text: 'Confidence scores are most useful for review routing at the document level.', isTrue: false, explanation: 'Field level is more useful: it isolates the uncertain fields and avoids reviewing certain ones.' },
    { text: 'Stratified random sampling of high-confidence extractions is needed because confidence routing cannot catch errors the model is confident about.', isTrue: true, explanation: 'Random samples per stratum reveal systematic, confident mistakes and track drift.' },
    { text: 'Documents whose source content is contradictory should have the model choose the most plausible value so review capacity is spared.', isTrue: false, explanation: 'Contradictory sources should be flagged and routed to review; guessing hides a real ambiguity.' },
    { text: 'Review thresholds may legitimately differ between fields on the same document.', isTrue: true, explanation: 'The acceptable error rate depends on the cost of an error, which differs between a payment amount and a notes field.' },
    { text: 'Uniform random sampling of a corpus dominated by one document type gives adequate coverage of rare types.', isTrue: false, explanation: 'Rare types are rarely sampled; stratify so each segment is measured.' },
  ],
  resources: [
    { label: 'Structured outputs (Claude docs)', url: 'https://platform.claude.com/docs/en/build-with-claude/structured-outputs' },
    { label: 'Define success criteria and develop tests (Claude docs)', url: 'https://platform.claude.com/docs/en/test-and-evaluate/define-success' },
    { label: 'Reduce hallucinations (Claude docs)', url: 'https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations' },
  ],
};
