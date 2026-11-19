import type { Concept } from '../../types';

export const structuredOutputAndValidation: Concept = {
  id: 'structured-output-and-validation',
  title: 'Structured Output and Validation',
  summary:
    'Get machine-readable output with structured outputs or strict tools, design schemas that do not invite fabrication, and validate semantics with retries that feed errors back, because valid JSON is not the same as correct data.',
  certs: ['ccdv-f', 'ccar-f', 'ccar-p'],
  domains: ['ccdv-f-6', 'ccdv-f-2', 'ccdv-f-4', 'ccar-f-4', 'ccar-f-5', 'ccar-p-4'],
  tags: ['structured-output', 'json-schema', 'validation', 'tools', 'extraction', 'defensive-parsing'],
  difficulty: 'intermediate',
  diagram: 'structured-output-flow',
  sections: [
    {
      heading: 'Three ways to get structured output',
      body: `When a program, not a person, consumes Claude's answer, you need output in a fixed shape. There are three approaches, in decreasing order of reliability:

| Approach | How | Guarantee |
|---|---|---|
| **Structured outputs** | \`output_config.format = {type: "json_schema", schema: ...}\`; SDK helper \`client.messages.parse(output_format=PydanticModel)\` returns \`parsed_output\` | Response text is valid JSON that conforms to the schema |
| **Tool with a JSON schema** | Define an "extraction" tool whose \`input_schema\` is the shape you want; read \`tool_use.input\`; add \`strict: true\` so inputs conform exactly | Tool input conforms to the schema (with strict) |
| **Prompting for JSON** | Ask in prose, maybe show an example | None; must parse defensively |

Structured outputs are the default choice for "give me this document as JSON". A tool with a schema is natural when the output *is* an action (book, refund, create) or when you want the model to choose between several schemas by choosing a tool. Strict tools and structured outputs can be combined in one request.

Historically, \`tool_choice: "any"\` or a forced tool guaranteed a tool call. On Opus 5.5, Sonnet 5.5 and Fable 5.x forcing returns a 400, so steer with the prompt, keep \`strict: true\` for the schema guarantee, or use structured outputs. Assistant prefill (starting the response with \`{\`) is also gone on current models.

Schemas for strict tools and structured outputs must set \`additionalProperties: false\` and list required fields explicitly.`,
    },
    {
      heading: 'Schema design that prevents fabrication',
      body: `A schema is a set of demands. If you demand a value the document does not contain, the model will often invent one to satisfy the schema. Design choices that prevent this:

- **Optional or nullable fields** for anything the source might not contain. A required \`invoice_date\` on a receipt with no date yields a plausible-looking fake; \`"type": ["string", "null"]\` yields \`null\`.
- **Enums with an escape hatch.** Closed enums force a wrong category when none fits. Add \`"other"\` plus a free-text \`other_detail\` field, and \`"unclear"\` for genuinely ambiguous cases.
- **Fields that make inconsistency visible.** Extract both \`stated_total\` and \`calculated_total\` (sum of line items) so your code can flag a mismatch; add a \`conflict_detected\` boolean for contradictory source data.
- **Provenance fields.** \`source_quote\` or \`page\` fields let reviewers verify and let you detect confident fabrication.
- **Confidence fields used carefully.** A self-reported confidence can route review attention, but it must be calibrated against labeled data before you trust it to gate automation.
- **Format normalization in the prompt.** Pair the strict schema with prompt rules ("dates as ISO 8601, amounts as decimals without currency symbols") so inconsistent source formatting does not produce inconsistent values.

Keep schemas as small as the downstream system needs. Every extra required field is another opportunity for invention and another thing to validate.`,
    },
    {
      heading: 'Syntax is guaranteed; semantics are not',
      body: `Structured outputs and strict tools eliminate **syntax** errors: unbalanced braces, missing fields, wrong types. They do **not** guarantee the values are right. Semantic errors survive the schema:

- Line items that do not sum to the total.
- A value placed in the wrong field (billing address in shipping address).
- An amount that is an order of magnitude off because of a misread decimal.
- A perfectly formatted date that appears nowhere in the document.

So validation has two layers. **Schema validation** is cheap and, with structured outputs, already done. **Semantic validation** is yours: cross-field checks, range checks, lookups against reference data, comparison with a second extraction pass. Treat a confident, well-formatted answer with the same skepticism as a sloppy one; formatting is not evidence of correctness.

Parse defensively even with guarantees. Check \`stop_reason\` before reading content: a \`refusal\` returns an empty or partial response, and \`max_tokens\` can truncate output that a schema would otherwise have completed. Wrap parsing in error handling and never index \`content[0]\` unconditionally.`,
    },
    {
      heading: 'Retry with error feedback, and when not to',
      body: `When semantic validation fails, the most effective recovery is a **follow-up request** that includes the original document, the failed extraction and the specific validation errors ("line_items sum to 412.00 but stated_total is 421.00; re-check the quantities on page 2"). The model is good at correcting a named mistake; it is poor at guessing what was wrong from a generic "try again".

Retries have limits:

- They **work** for format mismatches, structural mistakes, and misreadings the model can fix by looking again.
- They **do not work** when the information is simply absent from the source (it lives in another document, or was never there). Retrying produces a new fabrication. The right outcome is \`null\` plus a flag for human review.
- Cap the number of retries and log every attempt; an extraction that needs three tries is a signal about the prompt or the document class.

For review systems, add a \`detected_pattern\` field to each finding so dismissals can be analyzed by pattern and the prompt improved systematically rather than anecdotally.`,
    },
  ],
  examples: [
    {
      title: 'Structured outputs with the parse helper',
      description:
        'A team extracts contact details from inbound emails into a CRM. Using the SDK parse helper with a Pydantic model gives them typed, validated objects without hand-written JSON parsing. Nullable fields keep the model from inventing a phone number when none is present.',
      language: 'python',
      code: `from pydantic import BaseModel
from typing import Literal

class Lead(BaseModel):
    name: str
    email: str | None
    phone: str | None
    plan: Literal["starter", "pro", "enterprise", "other", "unclear"]
    plan_other_detail: str | None
    source_quote: str

response = client.messages.parse(
    model="claude-opus-5-5",
    max_tokens=2000,
    system="Extract lead details. Use null for anything not stated. Quote the sentence you relied on.",
    messages=[{"role": "user", "content": f"<email>{email_text}</email>"}],
    output_format=Lead,
)
if response.stop_reason == "refusal":
    raise RuntimeError("request refused")
lead: Lead = response.parsed_output`,
      takeaway: 'parse() plus a nullable, enum-with-other schema gives typed output that admits uncertainty instead of inventing values.',
    },
    {
      title: 'Strict tool as an extraction schema',
      description:
        'An invoice pipeline must pick between two shapes (invoice vs credit note) depending on the document. Two strict tools let the model choose the schema by choosing the tool. Prompt steering replaces forced tool_choice, which returns 400 on current models.',
      language: 'typescript',
      code: `const res = await client.messages.create({
  model: "claude-opus-5-5",
  max_tokens: 4000,
  system: "Classify the document and call exactly one of the tools with the extracted fields.",
  tools: [
    { name: "record_invoice", description: "Use for invoices (amounts owed).", strict: true,
      input_schema: { type: "object",
        properties: { number: { type: "string" }, stated_total: { type: "number" },
                      line_items: { type: "array", items: { type: "object",
                        properties: { desc: { type: "string" }, amount: { type: "number" } },
                        required: ["desc", "amount"], additionalProperties: false } } },
        required: ["number", "stated_total", "line_items"], additionalProperties: false } },
    { name: "record_credit_note", description: "Use for credit notes (amounts refunded).", strict: true,
      input_schema: { /* ... */ type: "object", properties: {}, additionalProperties: false } },
  ],
  messages: [{ role: "user", content: documentText }],
});
const call = res.content.find((b) => b.type === "tool_use");
if (!call) throw new Error("no extraction produced"); // defensive: auto choice may yield text`,
      takeaway: 'Strict tools guarantee schema-conformant inputs; your code must still handle the case where no tool was called.',
    },
    {
      title: 'The mistake: valid JSON, wrong numbers',
      description:
        'A finance team enabled structured outputs and stopped validating because "the schema guarantees it". Weeks later they found invoices where line items did not sum to the total and a date that appeared nowhere in the PDF. Adding cross-field checks and a feedback retry caught these; absent data was routed to review instead of retried.',
      language: 'python',
      code: `def validate(inv: dict) -> list[str]:
    errors = []
    calc = round(sum(i["amount"] for i in inv["line_items"]), 2)
    if abs(calc - inv["stated_total"]) > 0.01:
        errors.append(f"line_items sum to {calc} but stated_total is {inv['stated_total']}")
    if inv.get("invoice_date") and inv["invoice_date"] not in source_text:
        errors.append("invoice_date does not appear verbatim in the document")
    return errors

for attempt in range(2):
    inv = extract(source_text, feedback=errors if attempt else None)
    errors = validate(inv)
    if not errors:
        break
else:
    route_to_human_review(inv, errors)   # do not keep retrying`,
      takeaway: 'Schema conformance proves syntax only; semantic checks and bounded, specific retries prove the data.',
    },
    {
      title: 'Retry that cannot succeed',
      description:
        'An extraction kept returning null for `purchase_order_number`, and the pipeline retried five times with escalating insistence. The PO number was only in a separate email thread the model never saw. The retries produced one fabricated number. The fix: detect "field absent from source" (null with a note) and stop retrying; fetch the other document or send to a human.',
      language: 'text',
      code: `Retry decision table
- Schema/format error            -> retry with the specific error quoted
- Values misread (sum mismatch)  -> retry with the discrepancy named
- Field absent from the source   -> accept null, flag for review, do NOT retry
- Refusal stop_reason            -> do not retry the same prompt; handle or fall back
- max_tokens truncation          -> raise max_tokens and retry once`,
      takeaway: 'Match the recovery to the failure type; retrying for missing information manufactures hallucinations.',
    },
  ],
  keyPoints: [
    'Structured outputs (output_config.format / messages.parse) guarantee schema-valid JSON text; strict tools (strict: true) guarantee schema-valid tool inputs; prompting for JSON guarantees nothing.',
    'Forced tool_choice and assistant prefill are not available on current models; steer with the prompt and use strict or structured outputs.',
    'Make fields nullable/optional when the source may lack them, so the model returns null instead of inventing values.',
    'Use enums with "other" (+ detail field) and "unclear" to avoid forcing wrong categories.',
    'Schema conformance eliminates syntax errors only; cross-field and reference checks catch semantic errors.',
    'Parse defensively: check stop_reason (refusal, max_tokens) before reading content; never assume content[0] exists.',
    'Retry with specific validation errors appended; stop retrying when the information is absent from the source.',
    'Add stated vs calculated fields, conflict flags and detected_pattern fields so errors are visible and analyzable.',
  ],
  flashcards: [
    { front: 'Which API parameter enables structured outputs?', back: 'output_config.format with type "json_schema" and a schema; the SDK helper is client.messages.parse(output_format=Model), returning parsed_output.' },
    { front: 'What does strict: true on a tool guarantee?', back: 'That the tool_use input conforms exactly to the input_schema (which must set additionalProperties: false).' },
    { front: 'Why make extraction fields nullable?', back: 'A required field the document lacks pushes the model to fabricate a value; nullable lets it return null honestly.' },
    { front: 'Why add "other" and "unclear" to enums?', back: 'Closed enums force a wrong category when none fits; the escape hatch plus a detail field keeps the data truthful and extensible.' },
    { front: 'Does structured output prevent semantic errors?', back: 'No. It guarantees syntax and shape; wrong values, wrong fields and sums that do not add up still happen.' },
    { front: 'What is retry-with-error-feedback?', back: 'A follow-up request containing the original input, the failed output and the specific validation errors so the model can correct them.' },
    { front: 'When is a retry ineffective?', back: 'When the required information is absent from the source; retrying produces fabrication. Return null and flag for review.' },
    { front: 'What should you check before parsing response.content?', back: 'stop_reason: refusal may mean empty content, max_tokens may mean truncated output.' },
    { front: 'What is the stated_total vs calculated_total pattern?', back: 'Extract both so code can detect discrepancies between what the document claims and what its line items add up to.' },
    { front: 'Why does forcing a tool no longer work on Opus 5.5 / Sonnet 5.5?', back: 'tool_choice any/tool returns a 400 on those models; use prompt steering, strict: true, or structured outputs.' },
  ],
  quiz: [
    {
      question:
        'A pipeline extracts invoice data using structured outputs. Some invoices have no due date, and the output always contains a plausible due date anyway. What is the MOST appropriate fix?',
      options: [
        'Add "do not guess" to the prompt and keep the field required.',
        'Make due_date nullable in the schema and instruct the model to return null when absent.',
        'Lower output_config.effort so the model is less creative.',
        'Switch from structured outputs to prompting for JSON.',
      ],
      correct: [1],
      explanation:
        'A required field the source lacks invites fabrication; nullable fields let the model be honest. A prompt plea does not change the schema\'s demand, effort is unrelated, and prompting for JSON removes the syntax guarantee without fixing fabrication.',
    },
    {
      question:
        'After enabling strict tool use, a team stops validating extracted invoices. Which error class can still occur?',
      options: [
        'Missing required fields in the tool input.',
        'A string where the schema requires a number.',
        'Line items that do not sum to the stated total.',
        'Malformed JSON with unbalanced braces.',
      ],
      correct: [2],
      explanation: 'Strict schemas eliminate syntax and type errors (A, B, D) but not semantic errors such as inconsistent values.',
    },
    {
      question: 'Which TWO are appropriate uses of retry in an extraction pipeline? (Select two)',
      options: [
        'The line items sum to a different value than the stated total; retry with the discrepancy spelled out.',
        'A required field is not present anywhere in the document; retry with stronger wording until a value appears.',
        'The output was truncated with stop_reason max_tokens; raise max_tokens and retry once.',
        'The response has stop_reason refusal; retry the identical prompt repeatedly.',
      ],
      correct: [0, 2],
      explanation:
        'Retries fix errors the model can correct by re-reading or by having more room. Retrying for absent information manufactures hallucinations, and repeating a refused prompt is not a recovery strategy.',
    },
    {
      question:
        'A team wants the model to always produce a JSON object on claude-opus-5-5 and tries tool_choice: {"type": "tool", "name": "extract"}. The API returns a 400. What should they do?',
      options: [
        'Add an assistant prefill of "{" instead.',
        'Use output_config.format with a JSON schema (or messages.parse), or keep the tool with strict: true and steer with the prompt.',
        'Set temperature to 0.',
        'Downgrade to an older model permanently.',
      ],
      correct: [1],
      explanation:
        'Forced tool_choice is rejected on current models; structured outputs are the designed replacement, and strict tools keep the schema guarantee. Prefill is removed, temperature is rejected on the current API version, and downgrading avoids the fix.',
    },
    {
      question: 'A classification schema uses a closed enum of five categories. Reviewers notice miscategorized items that fit none of the five. What schema change helps most?',
      options: [
        'Remove the enum and accept any string.',
        'Add "other" with an other_detail string field, and "unclear" for ambiguous cases.',
        'Make the field required so the model chooses more carefully.',
        'Add ten more specific categories.',
      ],
      correct: [1],
      explanation:
        'An escape hatch keeps categorization honest and extensible. Free strings lose consistency, the field is already effectively required, and more categories do not cover the unknown unknowns.',
    },
    {
      question: 'Which practice best reflects "skepticism toward confident output"?',
      options: [
        'Trusting output that is well formatted and uses precise numbers.',
        'Cross-checking extracted values against the source and against each other regardless of how confident the output looks.',
        'Asking the model to rate its own confidence and accepting anything above 0.9 without calibration.',
        'Running the extraction twice and accepting whichever has more fields filled in.',
      ],
      correct: [1],
      explanation:
        'Formatting and confidence are not evidence of correctness. Self-reported confidence must be calibrated before it gates anything, and "more fields filled" rewards fabrication.',
    },
  ],
  statements: [
    { text: 'Structured outputs guarantee the response conforms to the provided JSON schema.', isTrue: true, explanation: 'output_config.format produces schema-valid JSON text; parse() additionally returns a typed object.' },
    { text: 'Schema conformance means the extracted values are correct.', isTrue: false, explanation: 'Semantic errors (wrong values, wrong fields, sums that do not match) are not caught by a schema.' },
    { text: 'Making a field required is a good way to ensure the model finds it in the document.', isTrue: false, explanation: 'If the document lacks it, a required field pushes the model to fabricate. Use nullable fields.' },
    { text: 'Retrying with the specific validation error appended is more effective than a generic "try again".', isTrue: true, explanation: 'The model corrects a named mistake well; it cannot guess what was wrong.' },
    { text: 'If required information is missing from the source, retrying enough times will eventually extract it.', isTrue: false, explanation: 'Retries cannot recover information that is not there; they produce fabrications. Return null and route to review.' },
    { text: 'Strict tool schemas must set additionalProperties: false.', isTrue: true, explanation: 'Strict mode requires fully specified object schemas.' },
    { text: 'On Opus 5.5 you can guarantee a tool call with tool_choice: "any".', isTrue: false, explanation: 'Forced tool_choice returns a 400 on Opus 5.5, Sonnet 5.5 and Fable 5.x; use structured outputs or prompt steering with strict tools.' },
    { text: 'You should check stop_reason before reading response.content.', isTrue: true, explanation: 'A refusal can return empty content and max_tokens can truncate; code that indexes content[0] unconditionally breaks.' },
  ],
  resources: [
    { label: 'Structured outputs (Claude docs)', url: 'https://platform.claude.com/docs/en/build-with-claude/structured-outputs' },
    { label: 'Tool use overview', url: 'https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview' },
    { label: 'Refusals and fallback', url: 'https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback' },
  ],
};
