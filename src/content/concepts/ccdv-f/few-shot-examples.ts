import type { Concept } from '../../types';

export const fewShotExamples: Concept = {
  id: 'few-shot-examples',
  title: 'Few-Shot Examples',
  summary:
    'Show, do not just tell: two to four targeted examples teach format and judgment faster than paragraphs of rules, as long as you pick the right cases and manage the costs.',
  certs: ['ccdv-f', 'ccar-f', 'ccar-p', 'ccao-f'],
  domains: ['ccdv-f-6', 'ccdv-f-5', 'ccar-f-4', 'ccar-f-5', 'ccar-p-2', 'ccao-f-1'],
  tags: ['prompting', 'few-shot', 'multishot', 'examples', 'format'],
  difficulty: 'foundations',
  sections: [
    {
      heading: 'Why examples beat prose',
      body: `Zero-shot prompting gives the model instructions only. One-shot adds a single worked example; few-shot (multishot) adds several. The exam guides are blunt about when to use them: few-shot examples are the **most effective technique for consistently formatted, actionable output when detailed instructions alone produce inconsistent results**.

Examples work because they resolve ambiguity that prose cannot. "Return location, issue, severity and a suggested fix" leaves dozens of micro-decisions open: how to format the location, how long the fix should be, whether to include a rationale. One example answers all of them at once. The model generalizes from the *shape* and the *judgment* shown rather than matching only the literal case.

Examples are also the best tool for **judgment** problems:

- Which of two plausible tools to call for an ambiguous request.
- Whether an acceptable code pattern is a genuine issue.
- When a customer service agent should escalate versus resolve.
- How to extract from documents with different structures (inline citations versus a bibliography, informal measurements such as "about a cup").

In extraction tasks, a few examples showing *correct* handling of varied formats measurably reduce hallucinated and empty fields.`,
    },
    {
      heading: 'Choosing the examples',
      body: `Aim for **two to four** targeted examples. More rarely helps and costs tokens on every call. Select them deliberately:

- **Cover the ambiguous cases**, not the easy ones. If the model already handles the common path, an example of it adds nothing; an example of the borderline case changes behavior.
- **Show reasoning, briefly.** For judgment tasks, include a one-line "why this action and not the alternative" so the model can generalize the rule rather than memorize the instance.
- **Vary the surface, hold the logic constant.** Different wording, lengths and document structures with the same correct behavior teach the rule; near-duplicate examples teach the surface.
- **Include a negative or null example** where that behavior matters: a document from which a field *cannot* be extracted, with the output showing \`null\`; a request that should *not* trigger a tool.
- **Match the output exactly.** The example output should be in precisely the format you want back, including field names and ordering, because that is what will be copied.

Wrap examples in \`<example>\` tags (inside an \`<examples>\` block) so the model can tell them apart from instructions and from the live input.`,
    },
    {
      heading: 'Risks and how to manage them',
      body: `| Risk | What it looks like | Mitigation |
|---|---|---|
| **Overfitting** | Model copies surface details from an example (a name, a number, a phrase) into real output; treats the example set as an exhaustive list | Vary examples; state that they illustrate a rule; include a counter-example |
| **Token cost** | Four long examples add thousands of tokens to every call | Keep examples minimal; place them in the stable system prefix and cache it |
| **Leaking into output** | Model echoes example text, or mentions "as in the example" | Use clearly synthetic data; tag examples; instruct that examples are illustrative only |
| **Stale examples** | Examples show an old schema or an old policy after a change | Version examples with the prompt and schema; add an eval that catches drift |
| **Bias toward example distribution** | All examples are high severity, so everything is rated high | Balance examples across the categories you want |

A subtle point: examples teach by demonstration, so an example that itself violates a rule (say, a fix suggestion that is five paragraphs long) will be copied. Review examples as carefully as the instructions.`,
    },
    {
      heading: 'Placement: system versus user turn',
      body: `Examples that apply to every request belong in the **system prompt**, inside the stable prefix, so they are cached and never drift between turns. This is the normal case for format examples and standing judgment rules.

Examples that depend on the request belong in the **user turn**: a retrieval step that fetches the three most similar labeled cases for *this* input, or a per-customer sample of their preferred style. These change per request, so they must sit after the cache breakpoint.

For agentic systems, judgment examples can also live in **tool descriptions** ("Example: a user asking 'where is my package' means call track_shipment, not search_orders") and in **Claude Code skills or CLAUDE.md**, where a worked example of a commit message or test file communicates conventions better than a rule list.

Whichever placement you choose, the iterative loop still applies: add an example for a failing case, re-run the same eval sample, and keep only the examples that change outcomes.`,
    },
  ],
  examples: [
    {
      title: 'Fixing inconsistent review output with two examples',
      description:
        'A CI review prompt listed the required fields but findings came back in prose, in tables, sometimes with no severity. Adding two examples in the exact target format made every finding parseable without changing the instructions.',
      language: 'markdown',
      code: `<examples>
<example>
<finding>
location: src/billing/refund.py:142
issue: refund amount is not validated against order total; negative or oversized refunds are accepted
severity: high
fix: add a guard: if amount <= 0 or amount > order.total: raise ValueError
</finding>
</example>
<example>
<finding>
location: src/api/auth.py:58
issue: token expiry compared with local time instead of UTC; tokens appear valid for an extra timezone offset
severity: critical
fix: replace datetime.now() with datetime.now(timezone.utc)
</finding>
</example>
</examples>
Report findings in exactly this format, one <finding> block per issue.`,
      takeaway: 'An example in the exact target format resolves every formatting decision at once.',
    },
    {
      title: 'Teaching escalation judgment with reasoning',
      description:
        'A support agent either escalated everything frustrated-sounding or never escalated. Three examples with one-line reasoning taught the actual rule: explicit requests for a human and policy gaps escalate; frustration alone does not.',
      language: 'python',
      code: `SYSTEM = """You resolve support cases and escalate only when required.

<examples>
<example>
Customer: "I want to speak to a person. Now."
Action: escalate_to_human immediately.
Why: an explicit request for a human is honored before any investigation.
</example>
<example>
Customer: "This is the third time my order is late, I'm furious."
Action: acknowledge, then look up the order and offer resolution; escalate only if they ask again.
Why: frustration alone is not an escalation trigger when the issue is within your tools.
</example>
<example>
Customer: "Your competitor sells this for less, match the price."
Action: escalate_to_human.
Why: policy covers our own-site price adjustments only; it is silent on competitor matching.
</example>
</examples>"""`,
      takeaway: 'For judgment tasks, show the choice and the reason so the model learns the rule, not the instance.',
    },
    {
      title: 'Overfitting: the example that leaked',
      description:
        'An extraction prompt used a single example invoice from "Acme Corp" for $1,250.00. In production, documents with an unreadable vendor name were returned as "Acme Corp", and missing totals became 1250.00. The fix: three varied examples with obviously synthetic data, one showing a missing field returned as null, and an explicit statement that examples illustrate format only.',
      language: 'json',
      code: `{
  "examples_note": "The examples below illustrate FORMAT only. Never reuse their values.",
  "example_3_input": "Receipt with no visible vendor name, total $82.10",
  "example_3_output": {
    "vendor": null,
    "total": 82.10,
    "currency": "USD",
    "notes": "vendor name not present in document"
  }
}`,
      takeaway: 'One example is a template to copy; varied examples with a null case teach a rule.',
    },
    {
      title: 'Dynamic examples in the user turn',
      description:
        'A classification service for support tickets kept a labeled dataset. For each new ticket it retrieved the three most similar labeled tickets and inserted them as examples in the user turn, after the cached system prefix. Accuracy on rare categories improved because the examples were relevant to each input.',
      language: 'typescript',
      code: `const similar = await retrieveSimilarLabeled(ticket.text, 3);
const examples = similar
  .map((s) => \`<example>\\n<ticket>\${s.text}</ticket>\\n<label>\${s.label}</label>\\n</example>\`)
  .join("\\n");

const res = await client.messages.create({
  model: "claude-opus-5-5",
  max_tokens: 50,
  system: [{ type: "text", text: CLASSIFIER_RULES, cache_control: { type: "ephemeral" } }],
  messages: [{
    role: "user",
    content: \`<examples>\\n\${examples}\\n</examples>\\n\\n<ticket>\${ticket.text}</ticket>\\nReturn only the label.\`,
  }],
});`,
      takeaway: 'Request-specific examples go in the user turn, after the cache breakpoint; standing examples go in the system prompt.',
    },
  ],
  keyPoints: [
    'Few-shot examples are the most effective fix when detailed instructions still produce inconsistent format or judgment.',
    'Use 2–4 targeted examples that cover ambiguous and edge cases, not the easy path.',
    'For judgment tasks, show the chosen action and a one-line reason so the model generalizes the rule.',
    'Include a null or negative example where that behavior matters (missing field → null; request that should not call a tool).',
    'Example outputs must be in the exact target format; they will be copied.',
    'Risks: overfitting to surface details, token cost on every call, example content leaking into output, stale examples after schema changes.',
    'Standing examples go in the cached system prefix; request-specific examples go in the user turn after the breakpoint.',
    'Wrap examples in <examples>/<example> tags so they are distinct from instructions and live input.',
  ],
  flashcards: [
    { front: 'Zero-shot vs one-shot vs few-shot?', back: 'Zero-shot: instructions only. One-shot: one worked example. Few-shot (multishot): several examples.' },
    { front: 'When are few-shot examples the recommended fix?', back: 'When detailed instructions alone still produce inconsistent format or inconsistent judgment on ambiguous cases.' },
    { front: 'How many few-shot examples should you typically use?', back: 'Two to four targeted examples; more adds token cost with little gain.' },
    { front: 'Which cases should few-shot examples cover?', back: 'Ambiguous and edge cases, varied surface forms, and at least one null/negative case where relevant.' },
    { front: 'Why include a one-line reason in a judgment example?', back: 'So the model learns the rule behind the choice and generalizes to novel cases instead of pattern-matching the instance.' },
    { front: 'Name three risks of few-shot examples.', back: 'Overfitting to surface details, token cost on every call, example content leaking into real output (also staleness and category bias).' },
    { front: 'Where do standing examples go, and why?', back: 'In the system prompt inside the cached prefix, so they are reused cheaply and never vary between turns.' },
    { front: 'Where do request-specific examples go?', back: 'In the user turn, after the cache breakpoint, for instance retrieved similar labeled cases.' },
    { front: 'How do few-shot examples reduce hallucination in extraction?', back: 'By demonstrating correct handling of varied document structures and showing missing fields returned as null rather than invented.' },
    { front: 'How should examples be delimited?', back: 'Inside <examples> with each one in an <example> tag, separate from instructions and live input.' },
  ],
  quiz: [
    {
      question:
        'A code review bot is given a detailed list of required fields, yet its findings vary in structure and sometimes omit severity. Which change is MOST likely to produce consistent output?',
      options: [
        'Add a sentence asking the model to "always be consistent".',
        'Add two or three examples of findings in the exact target format.',
        'Increase max_tokens so it has room for all fields.',
        'Switch to a smaller, faster model.',
      ],
      correct: [1],
      explanation:
        'Few-shot examples are the most effective technique when instructions alone give inconsistent formatting. "Be consistent" is not a criterion, max_tokens is not the constraint, and a smaller model would not improve adherence.',
    },
    {
      question:
        'An extraction prompt uses one example invoice from "Northwind Traders". In production, documents with unreadable vendor names come back labeled "Northwind Traders". What is the BEST fix?',
      options: [
        'Remove all examples and rely on instructions.',
        'Use several varied examples with synthetic data, include one where the vendor is missing and the output is null, and state that examples illustrate format only.',
        'Add ten more invoices from Northwind Traders.',
        'Make vendor a required field so the model must find it.',
      ],
      correct: [1],
      explanation:
        'This is overfitting to a single example. Varied examples plus a null case teach the rule and show the correct behavior when data is absent. More of the same example worsens it, removing examples loses format control, and a required field encourages fabrication.',
    },
    {
      question: 'Which TWO statements about few-shot example placement are correct? (Select two)',
      options: [
        'Examples that apply to every request belong in the system prompt within the cached prefix.',
        'Examples retrieved per request should be placed before the cache breakpoint so they are cached too.',
        'Request-specific examples belong in the user turn after the cached prefix.',
        'Examples must never appear in tool descriptions.',
      ],
      correct: [0, 2],
      explanation:
        'Standing examples are cached in the system prefix; varying examples go in the user turn so they do not invalidate the cache. Per-request content before the breakpoint would break caching, and short examples in tool descriptions are a legitimate way to steer tool selection.',
    },
    {
      question:
        'A support agent escalates every ticket that sounds angry and never escalates polite requests for a human. How should few-shot examples be designed to fix this?',
      options: [
        'Show three angry tickets that were resolved without escalation.',
        'Show contrasting cases with one-line reasoning: an explicit request for a human (escalate), frustration within tool capability (resolve), and a policy gap (escalate).',
        'Show a single ideal resolution so the model has a template.',
        'Show examples of polite tickets only.',
      ],
      correct: [1],
      explanation:
        'Judgment is taught by contrasting cases with reasoning, so the model learns the actual triggers. One-sided or single examples bias the model toward one behavior.',
    },
    {
      question: 'Why should few-shot examples be reviewed as carefully as the instructions?',
      options: [
        'Because the API validates example formatting and returns 400 on errors.',
        'Because the model copies what examples demonstrate, including any rule violations in them.',
        'Because examples are billed at a higher token rate.',
        'Because examples override the system prompt.',
      ],
      correct: [1],
      explanation:
        'Examples teach by demonstration, so a flawed example teaches the flaw. The API does not validate example content, examples are ordinary tokens, and they do not override the system prompt.',
    },
  ],
  statements: [
    { text: 'More few-shot examples always produce better results.', isTrue: false, explanation: 'Two to four targeted examples are the sweet spot; more mostly adds token cost and can bias the model toward the example distribution.' },
    { text: 'Few-shot examples help the model generalize judgment to novel cases, not just match the shown ones.', isTrue: true, explanation: 'Especially when the examples include brief reasoning for why one action was chosen over alternatives.' },
    { text: 'Few-shot examples can reduce empty or hallucinated fields in extraction tasks.', isTrue: true, explanation: 'Showing correct extraction from varied document structures, including null for absent data, improves reliability.' },
    { text: 'Example data can leak into real outputs if the examples use realistic-looking values.', isTrue: true, explanation: 'Use clearly synthetic values and state that examples illustrate format only.' },
    { text: 'Examples retrieved per request should go in the system prompt so the model trusts them more.', isTrue: false, explanation: 'Per-request content in the system prompt breaks the cached prefix; put it in the user turn.' },
    { text: 'Few-shot examples should be chosen from the most common, straightforward cases.', isTrue: false, explanation: 'Target ambiguous and edge cases; the model already handles the easy path.' },
    { text: 'Few-shot examples work only for formatting, not for decisions such as tool selection.', isTrue: false, explanation: 'They are equally effective for demonstrating ambiguous-case handling such as which tool to call or when to escalate.' },
  ],
  resources: [
    { label: 'Use examples (multishot prompting)', url: 'https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/multishot-prompting' },
    { label: 'Prompt engineering overview', url: 'https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview' },
  ],
};
