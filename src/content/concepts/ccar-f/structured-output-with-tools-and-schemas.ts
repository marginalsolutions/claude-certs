import type { Concept } from '../../types';

export const structuredOutputWithToolsAndSchemas: Concept = {
  id: 'structured-output-with-tools-and-schemas',
  title: 'Structured Output with Tools and JSON Schemas',
  summary:
    'Get schema-valid JSON from Claude with a tool definition or output_config.format, understand what tool_choice auto, any and forced mean and where forcing is no longer allowed, and design schemas (nullable fields, enums with "unclear" and "other" plus detail, normalisation rules) that prevent fabrication without preventing coverage.',
  certs: ['ccar-f', 'ccdv-f', 'ccar-p'],
  domains: ['ccar-f-4', 'ccar-f-2', 'ccdv-f-6', 'ccdv-f-2', 'ccar-p-2'],
  tags: ['structured-output', 'tool-use', 'json-schema', 'extraction', 'api'],
  difficulty: 'intermediate',
  diagram: 'structured-output-flow',
  sections: [
    {
      heading: 'Why a schema and not a prompt',
      body: `Asking in prose for "valid JSON with these fields" works most of the time, which is the problem: the 2% of responses with a trailing comma, a Markdown fence, a renamed key or a stray sentence before the brace break every downstream parser. Describing the shape in a **JSON schema** that the API enforces removes that class of failure entirely.

There are two ways to attach a schema:

1. **A tool whose \`input_schema\` is your output schema.** The model "calls" an \`extract_invoice\` tool; the \`tool_use\` block's \`input\` is your structured data. Add \`strict: true\` (and \`additionalProperties: false\`) so the arguments are guaranteed to validate. This is the approach the Architect exam guide describes, and it is still the right choice when the model may need to choose *between several schemas* (several extraction tools for different document types).
2. **Structured outputs: \`output_config.format\` with \`type: "json_schema"\`.** The response's text block is guaranteed to be valid JSON matching the schema. This is the modern path when you want one fixed shape and no tool loop; it replaced assistant prefill, which is removed on current models.

Either way the guarantee is **syntactic**: the output parses and matches the schema's types, required fields and enums. Neither mechanism checks that the values are *true*. A line-items array that does not sum to the stated total, a vendor name placed in the customer field, a date in the wrong column: all are schema-valid and all are wrong. Semantic validation remains your job (see validation and retry loops).`,
    },
    {
      heading: 'tool_choice: auto, any and forced',
      body: `\`tool_choice\` controls whether the model must call a tool:

| Value | Meaning |
|---|---|
| \`{"type": "auto"}\` (default) | The model may call a tool or answer in text. For extraction this means a response might contain no structured data. |
| \`{"type": "any"}\` | The model must call *some* tool but chooses which. Useful when several extraction schemas exist and the document type is unknown. |
| \`{"type": "tool", "name": "extract_metadata"}\` | The model must call that specific tool. Historically used to force a particular extraction step before enrichment. |
| \`{"type": "none"}\` | No tool calls. |

Know these meanings for the exam. Also know the current platform reality: on Opus 5.5, Sonnet 5.5 and Fable 5.x, \`any\` and forced \`tool\` return a 400 (\`tool_choice: type "tool" and "any" are not supported for this model\`), including in batches. The modern equivalents:

- To **guarantee structured output of one shape**, use \`output_config.format\` with a JSON schema.
- To **steer toward a specific tool**, keep \`auto\`, name the tool in the prompt ("Use the \`extract_metadata\` tool"), set \`strict: true\` for schema-valid arguments, and check in code that a call was made.
- To **choose among several schemas**, define several strict tools under \`auto\` and instruct the model to call exactly one; verify in code.

Older models (Opus 5, Sonnet 5 and earlier) still accept \`any\` and forced tools.`,
    },
    {
      heading: 'Schema design that prevents fabrication',
      body: `A schema is also a prompt. Every \`required\` field tells the model "there is always a value here", and when the document has none, the model will invent one rather than violate the schema. Three design rules follow:

- **Make fields optional or nullable when the source may not contain them.** A purchase order without a PO number should yield \`po_number: null\`, not a plausible-looking string. Use \`"type": ["string", "null"]\` or leave the field out of \`required\`. Reserve \`required\` for fields the document always has.
- **Give enums an escape hatch.** A \`document_type\` enum of \`invoice | receipt | credit_note\` forces a bank statement into one of the three. Add \`"unclear"\` for ambiguous cases and \`"other"\` paired with an \`other_detail\` string so new categories are captured with an explanation instead of mislabelled. Over time, frequent \`other_detail\` values tell you which enum values to add.
- **Put normalisation rules in the prompt, next to the schema.** The schema can say \`"format": "date"\`; it cannot say that "3/4/25" in a UK invoice means 3 April. Spell out date formats, currency handling (minor units? which symbol wins?), unit conversions and whitespace rules in the instructions so inconsistent source formatting becomes consistent output.

\`\`\`json
{"type": "object",
 "properties": {
   "po_number": {"type": ["string", "null"]},
   "document_type": {"type": "string",
                     "enum": ["invoice", "receipt", "credit_note", "unclear", "other"]},
   "other_detail": {"type": ["string", "null"]},
   "total_minor_units": {"type": "integer"},
   "currency": {"type": "string", "enum": ["USD", "EUR", "GBP", "other"]}
 },
 "required": ["document_type", "total_minor_units", "currency"],
 "additionalProperties": false}
\`\`\``,
    },
    {
      heading: 'Reading the result and the exam angle',
      body: `With a tool, iterate \`response.content\`, find the block with \`type == "tool_use"\` and read \`.input\`. With \`output_config.format\`, read the text block and \`json.loads\` it (or use the SDK's \`messages.parse\` helper with a typed model). In both cases, still run your own semantic checks before trusting the values.

Exam items in this area test four things: that schema enforcement is the most reliable way to eliminate JSON *syntax* errors; that it does **not** eliminate *semantic* errors; what \`auto\`, \`any\` and forced tool mean (and that \`any\` was the classic answer for "guarantee a tool call when the document type is unknown"); and schema-design judgement: optional fields against fabrication, "unclear"/"other" plus detail for extensible categories, normalisation rules alongside the schema. A distractor to recognise: "make every field required so nothing is missed". That is how you get confident, fabricated values.`,
    },
  ],
  examples: [
    {
      title: 'Invoice extraction with structured outputs',
      description:
        'A finance team extracts invoices into a fixed schema. There is one shape and no tool loop, so output_config.format is the simplest path. The schema makes po_number nullable because about a fifth of supplier invoices have none, and the prompt carries the normalisation rules the schema cannot express.',
      language: 'python',
      code: `SCHEMA = {
    "type": "object",
    "properties": {
        "vendor": {"type": "string"},
        "po_number": {"type": ["string", "null"]},
        "invoice_date": {"type": "string", "format": "date"},
        "total_minor_units": {"type": "integer"},
        "currency": {"type": "string", "enum": ["USD", "EUR", "GBP", "other"]},
    },
    "required": ["vendor", "invoice_date", "total_minor_units", "currency"],
    "additionalProperties": False,
}
resp = client.messages.create(
    model="claude-opus-5-5", max_tokens=2048,
    system="Dates: output ISO 8601; ambiguous d/m dates are day-first for GB vendors. "
           "Amounts: integer minor units (pence/cents). If no PO number appears, use null.",
    messages=[{"role": "user", "content": invoice_text}],
    output_config={"format": {"type": "json_schema", "schema": SCHEMA}},
)
data = json.loads(next(b.text for b in resp.content if b.type == "text"))`,
      takeaway: 'Schema for shape, nullable fields for absent data, prompt rules for normalisation.',
    },
    {
      title: 'Several document types, several strict tools',
      description:
        'A document pipeline receives invoices, receipts and credit notes mixed together. Classically this was tool_choice "any" so the model had to pick one extraction tool. On current models, define the three tools with strict schemas, keep auto, tell the model to call exactly one, and verify in code.',
      language: 'typescript',
      code: `const tools = [extractInvoice, extractReceipt, extractCreditNote].map(t => ({ ...t, strict: true }));
const res = await client.messages.create({
  model: "claude-opus-5-5", max_tokens: 2048, tools,
  tool_choice: { type: "auto" },
  system: "Classify the document and call exactly one extraction tool. Do not answer in prose.",
  messages: [{ role: "user", content: docText }],
});
const call = res.content.find(b => b.type === "tool_use");
if (!call) throw new Error("no extraction call; retry or route to review");
const extracted = call.input; // guaranteed to match that tool's schema`,
      takeaway: 'auto plus strict tools and a prompt instruction replaces "any"; always check a call was made.',
    },
    {
      title: 'The mistake: every field required',
      description:
        'A team made all twelve fields of a contract schema required to "ensure completeness". Contracts without a termination clause came back with termination dates that did not exist in the document, and nobody noticed for weeks because the output always validated. Making termination_date nullable and adding "use null when a clause is absent" to the prompt turned silent fabrication into visible nulls that could be routed to review.',
      language: 'json',
      code: `// Before: fabrication-prone
"termination_date": {"type": "string", "format": "date"}, ... "required": [..., "termination_date"]

// After: absence is representable
"termination_date": {"type": ["string", "null"], "format": "date"}  // not in "required"`,
      takeaway: 'A required field with no source value is an instruction to invent one.',
    },
    {
      title: 'An enum that could not grow',
      description:
        'A support classifier used an enum of six issue categories. New product lines introduced issues that fit none, and the model forced them into "billing". Adding "unclear" and "other" with an other_detail string stopped the mislabelling, and after a month the most common other_detail values became two new enum entries.',
      takeaway: '"unclear" and "other" plus a detail string make categories extensible and surface what the enum is missing.',
    },
  ],
  keyPoints: [
    'Schema enforcement (a strict tool input_schema or output_config.format) is the most reliable way to eliminate JSON syntax errors.',
    'It does not prevent semantic errors: wrong-field values or line items that do not sum to the total still validate.',
    'tool_choice auto: tool or text; any: must call some tool; tool + name: must call that tool; none: no tools.',
    'On Opus 5.5, Sonnet 5.5 and Fable 5.x, any and forced tool return 400. Use auto with strict tools and prompt steering, or output_config.format.',
    'Make fields optional or nullable when the source may lack them; required fields with no source value invite fabrication.',
    'Add "unclear" for ambiguous cases and "other" plus a detail field for extensible enums.',
    'Put normalisation rules (dates, currency units, whitespace) in the prompt alongside the schema.',
    'Read tool results from the tool_use block\'s input; read structured outputs from the text block and parse it.',
  ],
  flashcards: [
    { front: 'What class of error does a strict JSON schema eliminate?', back: 'Syntax and shape errors: invalid JSON, missing required fields, wrong types, values outside an enum.' },
    { front: 'What class of error does a strict JSON schema NOT eliminate?', back: 'Semantic errors: values in the wrong field, totals that do not match line items, fabricated values.' },
    { front: 'tool_choice "auto" means?', back: 'The model may call a tool or respond in text.' },
    { front: 'tool_choice "any" means?', back: 'The model must call some tool but chooses which one.' },
    { front: 'tool_choice {"type": "tool", "name": "x"} means?', back: 'The model must call the named tool.' },
    { front: 'What happens if you send tool_choice "any" to claude-opus-5-5?', back: 'A 400 error; forced tool choice is not supported on Opus 5.5, Sonnet 5.5 or Fable 5.x. Use auto with strict tools and prompt steering, or output_config.format.' },
    { front: 'Modern replacement for forcing a tool just to get JSON back?', back: 'output_config.format with type json_schema (structured outputs).' },
    { front: 'Why make a field nullable rather than required?', back: 'If the source may lack the value, a required field pushes the model to fabricate one.' },
    { front: 'Pattern for extensible enum categories?', back: 'Add "unclear" for ambiguous cases and "other" plus an other_detail string.' },
    { front: 'Where do date and currency normalisation rules go?', back: 'In the prompt, alongside the schema; the schema cannot express them.' },
    { front: 'Where is the structured data in a tool-based extraction response?', back: 'In the input of the content block with type tool_use.' },
  ],
  quiz: [
    {
      question:
        'An extraction pipeline asks for JSON in the prompt and occasionally receives output wrapped in Markdown fences or with a trailing comma, breaking the parser. What is the MOST reliable fix?',
      options: [
        'Add "respond with valid JSON only, no Markdown" to the prompt.',
        'Define the output as a JSON schema via output_config.format or a strict tool so the API enforces it.',
        'Strip fences and trailing commas with a regex before parsing.',
        'Lower max_tokens to discourage extra text.',
      ],
      correct: [1],
      explanation:
        'Schema enforcement removes syntax failures entirely. Prompt wording reduces but does not eliminate them, regex cleanup is brittle, and max_tokens does not control format.',
    },
    {
      question:
        'A team adopts strict tool schemas for invoice extraction and declares the problem solved. A month later, finance finds invoices where line items do not sum to the extracted total. Why did the schema not catch this?',
      options: [
        'The schema was not marked strict.',
        'Schema enforcement guarantees syntax and shape, not semantic correctness such as arithmetic consistency.',
        'The model ignored the schema for long documents.',
        'Tool schemas cannot contain arrays.',
      ],
      correct: [1],
      explanation:
        'A total that mismatches its line items is schema-valid. Semantic checks must be done in code (for example comparing calculated_total to stated_total). Strictness, document length and arrays are unrelated.',
    },
    {
      question:
        'A pipeline has three extraction tools for three document types and the type is unknown in advance. Historically the team used tool_choice "any" to guarantee a tool call. They move to claude-opus-5-5 and get a 400. What should they do?',
      options: [
        'Switch back to an older model permanently.',
        'Use tool_choice auto with strict: true on each tool, instruct the model to call exactly one, and verify in code that a call was made.',
        'Merge the three schemas into one with every field required.',
        'Set tool_choice to none and ask for JSON in prose.',
      ],
      correct: [1],
      explanation:
        'auto plus strict tools, prompt steering and a code check is the supported pattern on current models. Reverting models avoids the issue, one giant required schema invites fabrication, and prose JSON loses the guarantee.',
    },
    {
      question: 'Which TWO schema design choices reduce fabricated values in extraction? (Select two)',
      options: [
        'Making fields nullable or optional when the source document may not contain them.',
        'Marking every field required so the model always produces a complete record.',
        'Adding "unclear" and "other" plus a detail string to category enums.',
        'Removing enums so the model can write any category string.',
      ],
      correct: [0, 2],
      explanation:
        'Nullable fields let absence be represented, and escape-hatch enum values prevent forced mislabelling. Requiring everything increases fabrication, and removing enums loses consistency.',
    },
    {
      question:
        'Invoices from UK suppliers write dates as 03/04/2025 (3 April) while US suppliers write 04/03/2025 for the same date. The schema declares the field as a date. What else is needed?',
      options: [
        'Nothing; the date format in the schema resolves the ambiguity.',
        'Normalisation rules in the prompt stating how to interpret day/month order by vendor locale and to output ISO 8601.',
        'A larger model that knows supplier locales.',
        'Making invoice_date nullable.',
      ],
      correct: [1],
      explanation:
        'The schema can require a date format but cannot encode interpretation rules; those belong in the prompt. Model size does not supply locale rules, and nullability does not address ambiguity.',
    },
    {
      question: 'What does tool_choice "auto" imply for an extraction task?',
      options: [
        'The model will always call exactly one tool.',
        'The model may respond with text and no structured data, so the caller must check for a tool_use block.',
        'The model must call every tool provided.',
        'The API will select the tool whose schema best fits the document.',
      ],
      correct: [1],
      explanation:
        'auto permits a text-only response. Callers must verify a tool call occurred and handle the case where it did not.',
    },
  ],
  statements: [
    { text: 'A strict JSON schema guarantees that extracted line items sum to the extracted total.', isTrue: false, explanation: 'Schemas enforce shape and types, not arithmetic or semantic consistency.' },
    { text: 'tool_choice "any" requires the model to call a tool but lets it choose which.', isTrue: true, explanation: 'That is its definition; it was the classic answer for unknown document types with multiple extraction tools.' },
    { text: 'Forced tool_choice ("any" or a named tool) is accepted on claude-opus-5-5.', isTrue: false, explanation: 'It returns a 400 on Opus 5.5, Sonnet 5.5 and Fable 5.x. Use auto with strict tools or output_config.format.' },
    { text: 'output_config.format with a json_schema guarantees the response text is valid JSON matching the schema.', isTrue: true, explanation: 'This is the structured outputs feature and the modern replacement for assistant prefill.' },
    { text: 'Making every schema field required is a good way to ensure complete extractions.', isTrue: false, explanation: 'Required fields with no source value lead the model to fabricate; use nullable fields for data that may be absent.' },
    { text: 'Adding "other" with an other_detail field to an enum helps discover categories the enum is missing.', isTrue: true, explanation: 'Frequent other_detail values show which categories to add.' },
    { text: 'Date normalisation rules such as day-first interpretation can be expressed fully in the JSON schema.', isTrue: false, explanation: 'The schema can require a date format but not interpretation rules; those go in the prompt.' },
  ],
  resources: [
    { label: 'Structured outputs', url: 'https://platform.claude.com/docs/en/build-with-claude/structured-outputs' },
    { label: 'Tool use overview', url: 'https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview' },
    { label: 'Strict tool use', url: 'https://platform.claude.com/docs/en/agents-and-tools/tool-use/strict-tool-use' },
  ],
};
