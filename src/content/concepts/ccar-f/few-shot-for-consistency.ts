import type { Concept } from '../../types';

export const fewShotForConsistency: Concept = {
  id: 'few-shot-for-consistency',
  title: 'Few-Shot Prompting for Consistency and Quality',
  summary:
    'Use two to four targeted examples that show the reasoning for ambiguous cases, demonstrate the exact output format, separate acceptable patterns from genuine issues, and cover varied document structures so extraction does not return empty fields.',
  certs: ['ccar-f', 'ccdv-f', 'ccar-p'],
  domains: ['ccar-f-4', 'ccdv-f-6', 'ccar-p-2'],
  tags: ['prompting', 'few-shot', 'extraction', 'code-review', 'consistency'],
  difficulty: 'intermediate',
  sections: [
    {
      heading: 'When instructions are not enough',
      body: `Detailed instructions describe what you want; examples **show** it. When a prompt with careful instructions still produces inconsistently formatted or inconsistently judged output, the fix is usually not a longer instruction but a handful of examples.

Few-shot examples work for a different reason than rules do. A rule has to anticipate every case. An example demonstrates a judgement in one case and lets the model **generalise the judgement** to cases the rule never named. This is what makes few-shot examples the most effective technique for consistently formatted, actionable output, and why they also help with ambiguous decisions: tool selection when a request could map to two tools, or whether a missing branch in a test counts as a coverage gap.

Guidelines that hold up:

- **Two to four targeted examples**, not twenty. More examples cost tokens and tend to narrow rather than widen generalisation.
- **Target the ambiguous cases.** The model does not need an example of the obvious case.
- **Show the reasoning**, not just the answer, when the example is about a judgement call: why this action, and why not the plausible alternative.
- **Show the format exactly** when the example is about output shape.
- Place examples in the system prompt or as prior user/assistant turns; keep them stable so they cache.`,
    },
    {
      heading: 'Examples for judgement: ambiguity and false positives',
      body: `Two uses matter most in the Architect scenarios.

**Ambiguous requests.** A support agent with \`lookup_order\` and \`get_customer\` receives "where is my stuff?". An example that shows the request, the chosen tool, and a one-line rationale ("the user asks about delivery, so look up the order rather than the customer profile") teaches a decision pattern that transfers to "has it shipped?" and "any update on my package?" without an example for each.

**Acceptable pattern vs genuine issue.** In code review, false positives often come from legitimate patterns that look suspicious: a bare \`except\` that deliberately swallows a cleanup error, a hard-coded credential in a test fixture, a seemingly unused parameter required by an interface. One example pair per pattern, showing the acceptable version (not reported, with the reason) alongside the genuine issue (reported, with the reason), reduces false positives while still letting the model report variants it has not seen.

\`\`\`text
Acceptable (do not report): \`except Exception: pass\` inside \`__del__\` cleanup;
  swallowing is intentional and documented in the comment above it.
Genuine issue (report, high): \`except Exception: pass\` around a payment call;
  failures are silently lost and the order proceeds as if paid.
\`\`\``,
    },
    {
      heading: 'Examples for format: the actionable finding',
      body: `Review output that is actionable has a fixed shape: location, issue, severity, suggested fix. Instructions can describe this, but a single example in the exact shape does more to keep it consistent across hundreds of findings:

\`\`\`text
Location: src/billing/invoice.py:142
Issue: \`total\` is computed before discounts are applied, so the discount is never reflected.
Severity: high
Fix: move the \`total = sum(...)\` line below the discount loop, or recompute after it.
\`\`\`

When the pipeline consumes JSON (structured output with a schema), the schema enforces the fields, but examples still determine the **content quality** of each field: how specific the issue description is, whether the fix is a concrete edit or a vague suggestion. Schema guarantees shape; examples set the standard.`,
    },
    {
      heading: 'Examples for extraction: varied structures and null fields',
      body: `Extraction prompts fail in a specific way on real documents: the required field is present, but in a form the model did not expect, so it returns null or an empty string. Reference lists appear as inline citations in one paper and as a bibliography in another; a study's sample size sits in a methodology section in one document and in a figure caption in the next; a measurement reads "approx. half a cup" instead of "120 ml".

The cure is examples drawn from the **variety of real structures**: one example per structural variant, each showing where the information was found and how it was normalised. This both fixes the null extractions and reduces hallucination, because the model has seen that "approx. half a cup" maps to a number with a flag rather than to an invented precise value.

Exam angle: when a scenario reports that a required field comes back empty on some document formats, the right move is to add few-shot examples of those formats, not to make the field optional (which hides the problem) or to lengthen the instructions.`,
    },
  ],
  examples: [
    {
      title: 'Reasoning examples for ambiguous tool selection',
      description:
        'A support agent sometimes called `get_customer` for delivery questions and `lookup_order` for billing questions. Three examples showing the request, the chosen tool and why it beat the alternative fixed the confusion and generalised to phrasings not in the examples.',
      language: 'text',
      code: `User: "Where is my stuff?"
Choice: lookup_order(order_id from context)
Why: the question is about delivery status, which lives on the order,
     not on the customer profile (get_customer).

User: "Why was I charged twice?"
Choice: lookup_order then get_customer
Why: the charge is on an order, but a refund decision needs account standing;
     start with the order because it identifies the transaction.

User: "Can I change my email?"
Choice: get_customer
Why: this is a profile change; no order is involved.`,
      takeaway: 'Show the choice and the reason it beat the plausible alternative; the reasoning is what generalises.',
    },
    {
      title: 'Acceptable vs genuine issue pairs in code review',
      description:
        'A review bot flagged every hard-coded string that looked like a secret, including obvious test fixtures like `password="test-password"` in `tests/`. A single paired example taught it the distinction without disabling secret detection.',
      language: 'markdown',
      code: `## Secrets
Genuine (report, critical):
  \`STRIPE_KEY = "sk_live_51H..."\` in src/payments/client.py — a live key in source.
Acceptable (do not report):
  \`password = "test-password"\` in tests/conftest.py — a placeholder fixture value
  with no real credential format, used only in tests.
Generalise: report credentials that match real key formats or live outside tests;
skip obvious placeholders in test fixtures.`,
      takeaway: 'Paired examples cut false positives while keeping the category active.',
    },
    {
      title: 'The mistake: making the field optional instead of adding examples',
      description:
        'An extraction pipeline for research papers returned `sample_size: null` for about 30% of documents. The team made the field optional to stop validation failures. Downstream analysis then silently excluded a third of the corpus. Inspecting the failures showed the sample size was present but embedded in methodology prose or table captions. Two few-shot examples, one for each structure, brought null extractions below 3%.',
      language: 'text',
      code: `Example 1 (methodology section):
  "...we recruited 1,204 participants across four sites..." -> sample_size: 1204
Example 2 (table caption):
  "Table 2. Baseline characteristics (N = 856)" -> sample_size: 856
Example 3 (absent):
  No participant count anywhere in the text -> sample_size: null, note: "not stated"`,
      takeaway: 'Null extractions caused by format variety are fixed with examples of those formats, not by loosening the schema.',
    },
    {
      title: 'Handling informal measurements without hallucination',
      description:
        'A recipe-extraction system turned "a splash of milk" into `quantity: 50, unit: "ml"`, a fabricated precision. One example showing the informal phrase mapped to `quantity: null, unit: null, raw: "a splash", approximate: true` stopped the fabrication across all informal phrasings.',
      takeaway: 'Examples of how to represent uncertainty reduce hallucinated precision.',
    },
  ],
  keyPoints: [
    'Few-shot examples are the most effective technique for consistently formatted, actionable output when instructions alone are inconsistent.',
    'Use two to four targeted examples aimed at ambiguous cases, not many examples of the obvious case.',
    'For judgement calls, show the reasoning for why one action was chosen over a plausible alternative.',
    'For output shape, show one example in the exact format: location, issue, severity, suggested fix.',
    'Pair acceptable patterns with genuine issues to reduce false positives while preserving generalisation.',
    'For extraction, include examples drawn from varied document structures to fix empty or null required fields.',
    'Examples of informal or uncertain data mapped to explicit uncertainty fields reduce hallucinated precision.',
    'Examples let the model generalise judgement to novel patterns; rules only cover cases they name.',
  ],
  flashcards: [
    { front: 'How many few-shot examples does the exam guide recommend for ambiguous scenarios?', back: 'Two to four targeted examples.' },
    { front: 'What should a few-shot example for an ambiguous decision include?', back: 'The input, the chosen action, and the reasoning for why it beat the plausible alternative.' },
    { front: 'Why do examples generalise better than rules?', back: 'They demonstrate a judgement the model can apply to novel cases, while a rule covers only the cases it names.' },
    { front: 'What is the standard shape of an actionable review finding?', back: 'Location, issue, severity, suggested fix.' },
    { front: 'How do few-shot examples reduce false positives in code review?', back: 'By pairing acceptable patterns (not reported, with reason) with genuine issues (reported, with reason).' },
    { front: 'A required field is returned empty for some document formats. Best fix?', back: 'Add few-shot examples showing correct extraction from those formats.' },
    { front: 'How do examples reduce hallucination in extraction?', back: 'They show how to represent informal or missing data (null plus a raw/approximate flag) instead of inventing a precise value.' },
    { front: 'Does a JSON schema remove the need for format examples?', back: 'Schema guarantees field shape; examples still set the content quality of each field.' },
    { front: 'Where should few-shot examples be placed for caching?', back: 'In stable prompt content (system prompt or fixed prior turns) before the volatile per-request input.' },
  ],
  quiz: [
    {
      question:
        'A code review prompt contains detailed formatting instructions, but findings still vary in structure and some lack a suggested fix. What is the MOST effective change?',
      options: [
        'Add more detailed formatting instructions.',
        'Include two or three example findings in the exact desired format with location, issue, severity and fix.',
        'Increase the model\'s effort level.',
        'Ask the model to double-check its formatting at the end.',
      ],
      correct: [1],
      explanation:
        'Showing the format is more reliable than describing it further. Effort and self-checks do not define the shape, and longer instructions have already failed.',
    },
    {
      question:
        'A research-paper extraction pipeline returns null for a required "sample_size" field on roughly a third of documents, where the value appears in methodology prose or table captions. What should the architect do?',
      options: [
        'Make sample_size optional so validation passes.',
        'Add few-shot examples showing correct extraction from methodology prose and table captions.',
        'Lower max_tokens to force a more focused answer.',
        'Switch to a model with a larger context window.',
      ],
      correct: [1],
      explanation:
        'The data is present but in unexpected structures, which is exactly what format-variety examples fix. Making the field optional hides the loss, and token limits or context size are not the cause.',
    },
    {
      question:
        'A support agent with get_customer and lookup_order tools picks the wrong tool for ambiguous requests like "where is my stuff?". Which approach BEST improves selection and generalises to new phrasings?',
      options: [
        'Add a rule for every phrasing the team can think of.',
        'Provide two to four examples showing the request, the chosen tool and the reasoning for rejecting the alternative.',
        'Force the agent to always call both tools.',
        'Remove get_customer so only one tool is available.',
      ],
      correct: [1],
      explanation:
        'Reasoning examples teach a decision pattern that transfers to new phrasings. Enumerating phrasings does not scale, calling both wastes calls, and removing a tool breaks other tasks.',
    },
    {
      question: 'Which TWO are good practices for few-shot examples in review prompts? (Select two)',
      options: [
        'Pair an acceptable code pattern with a genuine issue so the model learns the distinction.',
        'Provide twenty examples of the most common case for maximum coverage.',
        'Target the ambiguous cases rather than the obvious ones.',
        'Place examples after the per-request diff so they are freshest in context.',
      ],
      correct: [0, 2],
      explanation:
        'Paired examples and ambiguity targeting are the recommended patterns. Many examples of the obvious case waste tokens and narrow generalisation, and examples belong in the stable prefix for caching, not after volatile input.',
    },
    {
      question:
        'A recipe-extraction system converts "a splash of milk" to exactly 50 ml. Which change BEST addresses this?',
      options: [
        'Add an example mapping informal phrases to a null quantity with a raw text field and an approximate flag.',
        'Instruct the model to "never guess".',
        'Remove the quantity field from the schema.',
        'Require the quantity field so the model must commit to a value.',
      ],
      correct: [0],
      explanation:
        'An example of how to represent uncertainty stops fabricated precision. "Never guess" is vague, removing the field loses real quantities, and requiring it increases fabrication.',
    },
  ],
  statements: [
    { text: 'Few-shot examples are most useful for the ambiguous cases rather than the obvious ones.', isTrue: true, explanation: 'The model handles obvious cases without help; examples should resolve the decisions that otherwise vary.' },
    { text: 'More few-shot examples always improve output quality.', isTrue: false, explanation: 'Two to four targeted examples are recommended; many examples cost tokens and can narrow generalisation.' },
    { text: 'Few-shot examples can only make the model match the exact cases shown, not generalise.', isTrue: false, explanation: 'Examples that show reasoning let the model apply the same judgement to novel patterns.' },
    { text: 'Pairing acceptable patterns with genuine issues helps reduce false positives in code review.', isTrue: true, explanation: 'The pair teaches the distinguishing feature rather than the surface pattern.' },
    { text: 'When a required field is often extracted as null, making it optional is the recommended fix.', isTrue: false, explanation: 'If the data is present in varied formats, add examples of those formats. Optional fields are for data that may genuinely be absent.' },
    { text: 'A strict JSON schema makes few-shot format examples unnecessary.', isTrue: false, explanation: 'Schema enforces field shape; examples still determine how specific and actionable the content of each field is.' },
    { text: 'Few-shot examples can reduce hallucinated precision in extraction tasks.', isTrue: true, explanation: 'Showing how to represent informal or missing data prevents the model inventing exact values.' },
  ],
  resources: [
    { label: 'Use examples (multishot prompting)', url: 'https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/multishot-prompting' },
    { label: 'Prompt engineering overview', url: 'https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview' },
  ],
};
