import type { Concept } from '../../types';

export const promptingTechniques: Concept = {
  id: 'prompting-techniques',
  title: 'Prompting Techniques: Zero-, One- and Few-Shot',
  summary:
    'When to instruct and when to demonstrate: zero-shot, one-shot and few-shot prompting, how to pick examples, and how explicit chain-of-thought relates to the built-in thinking of current models.',
  certs: ['ccdv-f', 'ccao-f', 'ccar-f', 'ccar-p'],
  domains: ['ccdv-f-5', 'ccdv-f-6', 'ccao-f-1', 'ccar-f-4', 'ccar-p-2'],
  tags: ['prompting', 'few-shot', 'examples', 'chain-of-thought'],
  difficulty: 'foundations',
  sections: [
    {
      heading: 'Zero-shot, one-shot, few-shot',
      body: `The "shots" are the number of worked examples you include in the prompt.

- **Zero-shot**: instructions only. "Classify this ticket as billing, technical or account. Reply with the label." Current Claude models are strong zero-shot performers, so this is the right starting point for most tasks, and it is the cheapest in tokens.
- **One-shot (single-shot)**: one example of input and desired output. Enough to pin down a *format* ("here is exactly what a good answer looks like") when words are clumsy, such as a quirky date layout or a house style.
- **Few-shot (multi-shot)**: several examples, typically three to eight, covering the variety the model will see. Use when the task has subtle boundaries that are easier to show than to define: tone, what counts as "urgent", how to handle edge cases, how terse to be.

Rule of thumb: start zero-shot with clear instructions, run the eval, and add examples only for the failures you can demonstrate better than describe. Each example costs tokens on every call (cache them), and a bad example teaches a bad habit.`,
    },
    {
      heading: 'Instruction versus demonstration',
      body: `Instructions and examples do different jobs:

| Use instructions when... | Use examples when... |
|---|---|
| The rule is crisp and general ("never include PII") | The rule is fuzzy or stylistic ("sound like our support team") |
| You need the model to generalise to unseen cases | You need exact formatting or edge-case handling |
| Token budget is tight | Mistakes are cheaper to show than to explain |

They combine well: state the rule, then show one or two cases that illustrate the tricky part. Make sure examples **agree with** the instructions; a conflict is resolved unpredictably. Wrap examples in clear delimiters (XML-style tags such as \`<example>\` work well) so the model does not confuse them with the live input, and label the parts (\`<input>\`, \`<output>\`).

For structured output, the strongest combination on current models is a JSON schema via \`output_config.format\` or a tool definition for the *shape*, plus one or two examples for *content* decisions the schema cannot express (what goes in \`summary\`, how to fill \`confidence\`).`,
    },
    {
      heading: 'Choosing and maintaining examples',
      body: `Good few-shot sets are curated, not dumped:

- **Representative, then edge cases.** Cover the common inputs first, then the ones the model gets wrong. Include at least one "negative" example that shows what *not* to do or when to abstain, if abstention is a valid output.
- **Diverse.** Several near-identical examples teach less than three varied ones and can bias the model toward that pattern (for example always answering "yes" if all examples are positive).
- **Correct and consistent.** Examples are treated as ground truth. Have a second person review them, and keep the output format identical across all of them.
- **Order matters a little.** Models weight recent context more; put the most important or most similar example last if you have to choose.
- **Versioned and evaluated.** Examples are part of the prompt. Store them with the prompt, run the eval when they change, and keep the whole block stable so it caches.

For large or shifting example pools, retrieve the few most similar examples per request (dynamic few-shot) rather than sending all of them. That trades cache hits for relevance, so measure both.`,
    },
    {
      heading: 'Chain-of-thought and built-in thinking',
      body: `**Chain-of-thought (CoT)** prompting asks the model to reason step by step before answering, which historically improved accuracy on math, logic and multi-step tasks. Current Claude models have **thinking built in**: Opus 5.5 always thinks (depth controlled by \`output_config.effort\`), Sonnet 5.5 and Haiku 5.5 use adaptive thinking by default. The model already reasons privately before the visible answer, so manual "think step by step" instructions add little and asking the model to *write out* its reasoning in the reply costs output tokens and can be unnecessary.

What still helps:

- Telling the model **what to consider** ("check the refund window and the warranty status before deciding") is a form of structured reasoning guidance that works alongside built-in thinking.
- Raising **effort** when a task needs deeper reasoning, rather than inflating the prompt.
- Asking for a short **rationale field** in structured output when humans need to audit decisions; keep it brief.

Where you want a visible, auditable chain in the answer, say so explicitly and budget for the extra tokens. Otherwise, let the model think on its own and keep the visible output tight. Related: the Architect exams list "zero-shot, few-shot, chain-of-thought" as prompt engineering techniques; be ready to name when each is appropriate.`,
    },
  ],
  examples: [
    {
      title: 'Few-shot for a fuzzy classification',
      description:
        'A triage prompt must label incidents as sev1, sev2 or sev3. Zero-shot the model over-rated outages that affected one internal dashboard. Three examples, including a borderline case, fixed it.',
      language: 'python',
      code: `SYSTEM = """You assign incident severity. sev1 = customer-facing outage or data loss;
sev2 = degraded customer experience or internal outage blocking many staff;
sev3 = everything else. Reply with only the label.

<example><input>Checkout returns 500 for all EU users</input><output>sev1</output></example>
<example><input>Internal BI dashboard down, finance team blocked</input><output>sev2</output></example>
<example><input>Typo on the pricing page footer</input><output>sev3</output></example>"""

resp = client.messages.create(
    model="claude-opus-5-5", max_tokens=5,
    system=[{"type": "text", "text": SYSTEM, "cache_control": {"type": "ephemeral"}}],
    messages=[{"role": "user", "content": incident_text}],
)`,
      takeaway: 'State the rule, then show the boundary cases; cache the example block because it is identical every call.',
    },
    {
      title: 'Mistake: examples that fight the instructions',
      description:
        'A prompt said "respond in under 50 words" but its two examples were 120-word replies. The model mostly copied the examples. Shortening the examples to match the instruction removed the inconsistency and the long answers.',
      language: 'text',
      code: `# Instruction: "Answer in under 50 words."
# Example output (before): 120 words of friendly explanation ...   <- contradicts the rule
# Example output (after):  "Your refund was approved on 3 May and will reach your card
#                           within 5 business days. Reply here if it has not arrived by 10 May."`,
      takeaway: 'Examples are stronger than instructions when they conflict; make them agree.',
    },
    {
      title: 'Zero-shot first, then measure',
      description:
        'A team started an extraction task with eight examples and a 4,000-token prompt. An eval showed the zero-shot version with a JSON schema scored the same on 58 of 60 cases. They kept one example for the two edge cases and cut prompt cost by 70%.',
      takeaway: 'Add examples to fix measured failures, not by default.',
    },
    {
      title: 'Guiding reasoning without manual chain-of-thought',
      description:
        'A loan pre-screening prompt used "think step by step and show your work" and produced 300-word rationales. With Opus 5.5 the team removed the instruction, listed the three checks to perform, and asked for a 1-sentence reason field in the schema. Accuracy was unchanged; output tokens fell by 80%.',
      language: 'python',
      code: `SYSTEM = """Decide whether the applicant passes pre-screening.
Consider: (1) debt-to-income under 40%, (2) no defaults in 24 months, (3) stated income verified.
Return JSON with fields decision ("pass"|"review") and reason (one sentence)."""`,
      takeaway: 'Current models reason internally; tell them what to consider and keep visible output small.',
    },
  ],
  keyPoints: [
    'Zero-shot = instructions only; one-shot = one example; few-shot (multi-shot) = several examples showing the variety of inputs.',
    'Start zero-shot with clear instructions; add examples for failures that are easier to show than to describe.',
    'Instructions define general rules; examples pin down format, tone and edge cases. They must agree.',
    'Pick examples that are representative, diverse, correct and consistently formatted; include a negative or abstain example where relevant.',
    'Delimit examples (e.g. <example> tags) so they are not confused with live input, and cache the block.',
    'Current models think internally; raise effort for harder reasoning instead of adding "think step by step".',
    'Use schemas for output shape and examples for content decisions the schema cannot express.',
  ],
  flashcards: [
    { front: 'Define zero-shot prompting.', back: 'Giving instructions with no worked examples.' },
    { front: 'When is one-shot usually enough?', back: 'When the main thing to convey is an exact output format or style that is awkward to describe in words.' },
    { front: 'Typical number of examples in a few-shot prompt?', back: 'About three to eight, covering representative and edge cases.' },
    { front: 'What happens when examples contradict the instructions?', back: 'Behaviour becomes unpredictable and the model often follows the examples; make them consistent.' },
    { front: 'Why delimit examples with tags?', back: 'So the model can tell demonstrations from the live input and does not answer the example instead.' },
    { front: 'How do current Claude models relate to chain-of-thought prompting?', back: 'They think internally (adaptive thinking, effort-controlled); manual "think step by step" adds little, while telling the model what to consider still helps.' },
    { front: 'What is dynamic few-shot?', back: 'Retrieving the most similar examples per request instead of a fixed set; trades cache hits for relevance.' },
    { front: 'Which exam phrase lists the three classic techniques?', back: 'Architect Professional domain 2: zero-shot, few-shot, chain-of-thought.' },
    { front: 'Best split of responsibilities for structured extraction?', back: 'JSON schema (structured outputs or tool) for the shape; one or two examples for content judgement.' },
  ],
  quiz: [
    {
      question:
        'A support-tone classifier works well except for sarcastic messages, which it labels positive. The rule "detect sarcasm" has not helped. What is the MOST effective next step?',
      options: [
        'Add three few-shot examples of sarcastic messages with the correct label.',
        'Switch to a larger context window.',
        'Set effort to max.',
        'Repeat the instruction in uppercase.',
      ],
      correct: [0],
      explanation:
        'Sarcasm is fuzzy and is better demonstrated than defined. Context window size is irrelevant, effort helps reasoning depth rather than concept boundaries, and shouting the instruction does not add information.',
    },
    {
      question:
        'A prompt includes six examples that are all positive-sentiment reviews labelled "keep". In production the model labels nearly everything "keep". What went wrong?',
      options: [
        'Too few examples were given.',
        'The example set lacked diversity and biased the model toward one label.',
        'The examples should have been in the user turn, not the system prompt.',
        'Few-shot prompting does not work for classification.',
      ],
      correct: [1],
      explanation:
        'Unbalanced examples teach a bias. Six is plenty, placement is secondary, and few-shot works well for classification when examples are balanced.',
    },
    {
      question:
        'Which TWO practices improve few-shot prompts? (Select two)',
      options: [
        'Wrapping each example in clear delimiters such as <example> tags.',
        'Making example outputs match the instructed format exactly.',
        'Using as many examples as fit in the context window.',
        'Writing examples with slightly different formats so the model stays flexible.',
      ],
      correct: [0, 1],
      explanation:
        'Delimiting and consistency are core practices. More examples cost tokens and can bias; inconsistent formats confuse the model about the target output.',
    },
    {
      question:
        'A team using claude-opus-5-5 appends "Think step by step and write out all your reasoning" to a classification prompt. Outputs are accurate but long and expensive. What should they do?',
      options: [
        'Keep the instruction but lower max_tokens to cut the reasoning off.',
        'Remove the instruction, list the factors to consider, and ask for a one-sentence reason; raise effort only if accuracy drops.',
        'Switch to Haiku to make the reasoning cheaper.',
        'Add more examples of long reasoning.',
      ],
      correct: [1],
      explanation:
        'The model already thinks internally; visible reasoning is extra output. Cutting max_tokens truncates answers, switching models does not remove the verbose instruction, and more long examples would make it worse.',
    },
    {
      question: 'For a new extraction task, what is the recommended order of work?',
      options: [
        'Write eight examples first, then instructions, then test by hand.',
        'Start with clear zero-shot instructions and a schema, run an eval, then add examples for observed failures.',
        'Start with max effort and reduce until it fails.',
        'Copy examples from production logs without reviewing them.',
      ],
      correct: [1],
      explanation:
        'Zero-shot plus schema is cheap and often sufficient; examples should target measured failures. Effort is not a substitute for prompt design, and unreviewed examples can teach errors.',
    },
  ],
  statements: [
    { text: 'Few-shot prompting means providing several worked examples in the prompt.', isTrue: true, explanation: 'Typically three to eight, covering representative and edge cases.' },
    { text: 'More examples always produce better results.', isTrue: false, explanation: 'Examples cost tokens and can bias the model; add them to fix measured failures and keep them diverse.' },
    { text: 'If examples and instructions conflict, the model will reliably follow the instructions.', isTrue: false, explanation: 'Behaviour is unpredictable and often follows the examples; keep them consistent.' },
    { text: 'On current Claude models, manual chain-of-thought instructions are largely redundant because the models think internally.', isTrue: true, explanation: 'Raise effort for harder reasoning; guide what to consider rather than demanding written reasoning.' },
    { text: 'Zero-shot prompting is a reasonable default starting point with current models.', isTrue: true, explanation: 'Measure first, then add examples where needed.' },
    { text: 'Examples should be placed without delimiters so the prompt reads naturally.', isTrue: false, explanation: 'Clear delimiters prevent the model from confusing examples with the live input.' },
  ],
  resources: [
    { label: 'Use examples (multishot prompting)', url: 'https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/multishot-prompting' },
    { label: 'Prompt engineering overview', url: 'https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview' },
  ],
};
