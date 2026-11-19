import type { Concept } from '../../types';

export const validationRetryAndFeedbackLoops: Concept = {
  id: 'validation-retry-and-feedback-loops',
  title: 'Validation, Retry and Feedback Loops',
  summary:
    'Catch semantic extraction errors the schema cannot, retry with the specific validation errors attached, recognise when a retry cannot help because the information is absent, and build feedback fields (detected_pattern, calculated_total vs stated_total, conflict_detected) that make quality measurable.',
  certs: ['ccar-f', 'ccdv-f', 'ccar-p'],
  domains: ['ccar-f-4', 'ccar-f-5', 'ccdv-f-6', 'ccar-p-4', 'ccar-p-2'],
  tags: ['extraction', 'validation', 'retry', 'feedback-loop', 'quality'],
  difficulty: 'intermediate',
  sections: [
    {
      heading: 'Two kinds of error, two kinds of fix',
      body: `Once output is schema-enforced (strict tools or \`output_config.format\`), **syntax errors are gone**: no malformed JSON, no missing required field, no value outside an enum. What remains are **semantic errors**: the output is well-formed and wrong.

| Error | Example | Caught by |
|---|---|---|
| Syntax / structure | Trailing comma, missing field, string where integer expected | Schema enforcement (eliminated) |
| Semantic: internal inconsistency | Line items sum to 1,180 but \`total\` says 1,250 | Your validation code |
| Semantic: wrong placement | Vendor name in the \`customer\` field | Validation against known values or cross-checks |
| Semantic: fabrication | A PO number that appears nowhere in the document | Source-grounding checks (does the value appear in the text?) |
| Absence | The document never states the sample size | Cannot be fixed by retrying; needs a null plus routing |

Validation therefore runs **after** parsing and checks relationships the schema cannot: arithmetic, cross-field consistency, membership in known lists, presence of the value in the source text. The output of validation is a list of specific errors, and those errors are the input to the retry.`,
    },
    {
      heading: 'Retry with error feedback',
      body: `A bare retry (send the same request again) is a coin flip. A **retry with error feedback** gives the model what it needs to correct itself: the original document, the failed extraction, and the specific validation errors.

\`\`\`text
Your previous extraction (attached) failed validation:
- line_items sum to 1180.00 but total is 1250.00
- invoice_date "2025-13-02" is not a valid date
Re-extract from the document. Correct these errors; keep everything else unless the document contradicts it.
\`\`\`

Including the failed extraction matters: the model can see what it got right and change only what is wrong, rather than regenerating from scratch and introducing new errors. Including the specific errors matters more: "fix the total" is actionable, "the output was wrong" is not.

Bound the loop. One or two feedback retries recover most structural and format mistakes. If the same error persists after that, the problem is not transient and the document should go to a review queue with the errors attached.`,
    },
    {
      heading: 'When retries cannot help',
      body: `Retries fix errors the model *could* have avoided: format mismatches, misplaced values, arithmetic slips, misread structures. They cannot fix **missing information**. If the sample size exists only in a supplementary PDF that was never provided, no number of retries will produce it; each retry either returns null (correct) or fabricates (worse, and more likely under pressure from an error message demanding a value).

Before retrying, classify the failure:

- **Format or structural error** (wrong date format, value in the wrong field, items not summing): retry with feedback. High success rate.
- **Information absent from the provided input** (referenced in an external document, cut off by truncation, never stated): do not retry for the value. Record null, flag the field, and route the document to a human or fetch the missing source.
- **Ambiguous source** (two different totals printed, conflicting dates): do not force a choice. Surface the conflict (next section).

The exam tests this distinction directly: a scenario where "the required information is in a document the pipeline does not have" has the answer "retrying will not help; provide the source or accept null", not "retry with a stronger prompt".`,
    },
    {
      heading: 'Designing fields that create a feedback loop',
      body: `Good schemas carry fields whose purpose is to make quality visible, not just to hold data.

- **\`calculated_total\` alongside \`stated_total\`.** Ask the model to extract the total the document states *and* compute the sum of the line items it extracted. A mismatch is a precise, automatic signal: either a line item was missed or the document itself is inconsistent. Either way the record is flagged rather than silently wrong.
- **\`conflict_detected\` (boolean) plus a \`conflict_detail\`.** When the source contains contradictory data (two dates, two totals, a header that disagrees with a table), the model reports the conflict instead of picking one. Downstream routing sends conflicts to review.
- **\`detected_pattern\`** on review findings. Each finding records which code construct triggered it (for example \`bare_except\`, \`string_concat_sql\`, \`unused_param\`). When developers dismiss findings, you can group dismissals by pattern and see that, say, 80% of \`unused_param\` findings are dismissed because of interface conformance. That tells you exactly which criterion to refine or disable, instead of guessing from anecdotes.
- **Confidence per field or per finding.** Lets you route low-confidence items to review and audit whether the model's confidence is calibrated.

These fields turn an extraction or review system from a black box into something you can measure and improve release by release.`,
    },
  ],
  examples: [
    {
      title: 'A validate-and-retry loop',
      description:
        'A procurement pipeline extracts invoices with structured outputs, then validates arithmetic and dates. On failure it retries once with the failed output and the specific errors attached. Persistent failures go to a review queue with the error list.',
      language: 'python',
      code: `def validate(d):
    errs = []
    calc = sum(i["amount_minor"] for i in d["line_items"])
    if calc != d["stated_total_minor"]:
        errs.append(f"line_items sum to {calc} but stated_total_minor is {d['stated_total_minor']}")
    try: date.fromisoformat(d["invoice_date"])
    except ValueError: errs.append(f"invoice_date {d['invoice_date']!r} is not ISO 8601")
    return errs

data = extract(doc)                      # structured output, schema-valid
for attempt in range(2):
    errs = validate(data)
    if not errs:
        break
    feedback = ("Previous extraction failed validation:\\n- " + "\\n- ".join(errs)
                + "\\nPrevious output: " + json.dumps(data)
                + "\\nRe-extract from the document and correct these errors.")
    data = extract(doc, extra_instructions=feedback)
else:
    route_to_review(doc, data, errs)`,
      takeaway: 'Validation produces specific errors; the retry carries the document, the failed output and those errors.',
    },
    {
      title: 'The mistake: retrying for information that is not there',
      description:
        'A clinical-trial extraction pipeline retried up to five times whenever `primary_endpoint` came back null. On the third retry the model usually produced a plausible endpoint, which validated and was stored. An audit found that in most of those cases the endpoint was defined only in a protocol document the pipeline never received. The fabricated endpoints had passed every check. The fix: on null, check whether the field is referenced as external ("see protocol"), and if so stop retrying, keep null and request the protocol.',
      takeaway: 'Retrying for absent information does not recover it; it manufactures it.',
    },
    {
      title: 'calculated_total vs stated_total surfaces a bad source',
      description:
        'An invoice schema included both fields. In most mismatches a line item had been missed and the retry fixed it. In a persistent minority the document itself was wrong: the supplier\'s PDF stated a total that did not match its own lines. Because the mismatch was captured rather than resolved, finance could dispute those invoices instead of paying the stated amount.',
      language: 'json',
      code: `{
  "stated_total_minor": 125000,
  "calculated_total_minor": 118000,
  "line_items": [{"desc": "Consulting", "amount_minor": 90000},
                 {"desc": "Travel", "amount_minor": 28000}],
  "conflict_detected": true,
  "conflict_detail": "Stated total exceeds sum of line items by 7000; no additional line found."
}`,
      takeaway: 'Extract both the stated and the computed value so inconsistency is a flag, not a silent choice.',
    },
    {
      title: 'detected_pattern turns dismissals into a prompt fix',
      description:
        'A review bot recorded a detected_pattern for every finding and the PR bot recorded which findings developers dismissed. After a month the data showed 78% of dismissed findings shared the pattern `unused_parameter`, almost all on methods implementing an interface. The team added that case to the skip list with an example. Dismissals fell by two thirds; no other category was touched.',
      takeaway: 'A pattern field on each finding makes false positives analysable by construct rather than by anecdote.',
    },
  ],
  keyPoints: [
    'Schema enforcement removes syntax errors; semantic errors (bad sums, misplaced values, fabrication) need validation code.',
    'Retry with error feedback: include the original document, the failed extraction and the specific validation errors.',
    'Bound retries to one or two attempts; persistent failures go to a review queue with the errors attached.',
    'Retries fix format and structural errors but cannot recover information absent from the provided input.',
    'When information is absent or only in an external document, keep null and fetch the source or route to a human; do not pressure the model into a value.',
    'Extract calculated_total alongside stated_total so arithmetic mismatches are flagged automatically.',
    'Use conflict_detected plus detail when the source contradicts itself, instead of forcing a choice.',
    'Add detected_pattern to review findings so dismissals can be analysed by code construct.',
  ],
  flashcards: [
    { front: 'What should a retry prompt include after a validation failure?', back: 'The original document, the failed extraction and the specific validation errors.' },
    { front: 'Which errors can a retry-with-feedback fix?', back: 'Format mismatches, structural errors, misplaced values, arithmetic slips.' },
    { front: 'Which failures can a retry NOT fix?', back: 'Information that is absent from the provided input, for example a value that exists only in an external document.' },
    { front: 'Why extract calculated_total alongside stated_total?', back: 'A mismatch flags a missed line item or an inconsistent source document automatically.' },
    { front: 'What is conflict_detected for?', back: 'Reporting that the source contains contradictory data so the record is routed to review rather than silently resolved.' },
    { front: 'What is a detected_pattern field?', back: 'A field on each review finding naming the code construct that triggered it, enabling analysis of which patterns developers dismiss.' },
    { front: 'Difference between semantic and schema syntax errors?', back: 'Syntax errors are malformed or mis-shaped output, eliminated by schema enforcement; semantic errors are well-formed but wrong values.' },
    { front: 'How many feedback retries are reasonable before routing to review?', back: 'One or two; persistent identical errors indicate a non-transient problem.' },
    { front: 'A field is null because the document says "see attached protocol". Retry?', back: 'No. The information is absent; keep null, flag it and obtain the protocol.' },
  ],
  quiz: [
    {
      question:
        'An invoice extraction returns schema-valid JSON, but the line items sum to 1,180 while the total field says 1,250. What is the MOST appropriate next step?',
      options: [
        'Accept the output; it passed the schema.',
        'Retry with the document, the failed extraction and the specific mismatch described, and route to review if it persists.',
        'Resend the identical request and hope for a different result.',
        'Mark the total field as optional so the mismatch cannot occur.',
      ],
      correct: [1],
      explanation:
        'A specific error message guides correction; a persistent mismatch may indicate a bad source. Accepting it stores wrong data, a blind retry is a coin flip, and making the field optional hides the problem.',
    },
    {
      question:
        'A pipeline extracting trial reports returns null for "primary_endpoint" on documents that say "endpoint defined in the study protocol". The team wants to add retries. What should an architect advise?',
      options: [
        'Retry up to five times with "the endpoint must be present" in the prompt.',
        'Do not retry for the value; the information is absent from the input. Keep null, flag the field and obtain the protocol document.',
        'Switch to a larger model that can infer the endpoint.',
        'Make the field required so the model commits to an answer.',
      ],
      correct: [1],
      explanation:
        'Retries cannot recover absent information and pressure leads to fabrication. Inference by a larger model is still fabrication, and requiring the field makes it worse.',
    },
    {
      question:
        'Developers dismiss many findings from a review bot, but the team cannot tell which criteria are at fault. Which schema change BEST enables systematic analysis?',
      options: [
        'Add a free-text "notes" field to each finding.',
        'Add a detected_pattern field naming the code construct that triggered each finding.',
        'Remove severity so findings are uniform.',
        'Add a timestamp to each finding.',
      ],
      correct: [1],
      explanation:
        'Grouping dismissals by detected_pattern reveals which constructs generate false positives. Free text is hard to aggregate, and severity or timestamps do not identify the triggering criterion.',
    },
    {
      question: 'Which TWO are examples of semantic validation errors that schema enforcement does not catch? (Select two)',
      options: [
        'A vendor name placed in the customer field.',
        'A missing required field.',
        'A date string that is not in the declared format.',
        'A stated total that does not equal the sum of extracted line items.',
      ],
      correct: [0, 3],
      explanation:
        'Wrong-field placement and arithmetic inconsistency are well-formed but wrong. Missing required fields and format violations are structural and are blocked by the schema.',
    },
    {
      question:
        'A supplier invoice prints two different totals, one in the header and one in the footer. How should the extraction schema handle this?',
      options: [
        'Instruct the model to always use the header value.',
        'Report conflict_detected: true with a detail describing both values so the record is routed to review.',
        'Average the two values.',
        'Reject the document with a schema error.',
      ],
      correct: [1],
      explanation:
        'Surfacing the conflict preserves information and routes the decision to a human. Picking one arbitrarily or averaging hides the problem, and a schema cannot express this as an error.',
    },
  ],
  statements: [
    { text: 'Appending specific validation errors to a retry prompt is more effective than resending the identical request.', isTrue: true, explanation: 'Specific errors tell the model what to change; a blind retry gives it nothing new.' },
    { text: 'Retrying with error feedback can recover a value that exists only in a document the pipeline never received.', isTrue: false, explanation: 'Absent information cannot be recovered by retrying; the model can only return null or fabricate.' },
    { text: 'Once output is schema-enforced, validation code is no longer needed.', isTrue: false, explanation: 'Schema enforcement eliminates syntax errors only; semantic checks such as arithmetic and cross-field consistency still require code.' },
    { text: 'Extracting calculated_total alongside stated_total helps flag missed line items and inconsistent source documents.', isTrue: true, explanation: 'Any mismatch becomes an automatic signal instead of a silent error.' },
    { text: 'A detected_pattern field records the model\'s confidence in a finding.', isTrue: false, explanation: 'It records which code construct triggered the finding; confidence is a separate field.' },
    { text: 'When a source document contradicts itself, the model should be instructed to pick the most likely value silently.', isTrue: false, explanation: 'It should report the conflict via conflict_detected so the record is routed to review.' },
    { text: 'Including the failed extraction in the retry helps the model change only what is wrong.', isTrue: true, explanation: 'It can preserve correct fields rather than regenerating everything and introducing new errors.' },
  ],
  resources: [
    { label: 'Structured outputs', url: 'https://platform.claude.com/docs/en/build-with-claude/structured-outputs' },
    { label: 'Increase output consistency', url: 'https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/increase-consistency' },
  ],
};
