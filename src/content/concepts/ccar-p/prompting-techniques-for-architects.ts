import type { Concept } from '../../types';

export const promptingTechniquesForArchitects: Concept = {
  id: 'prompting-techniques-for-architects',
  title: 'Prompting Techniques for Architects',
  summary:
    'Know when zero-shot, few-shot, explicit chain-of-thought, adaptive thinking, decomposition prompts and self-critique each pay off, and what each costs in tokens, latency and maintenance.',
  certs: ['ccar-p', 'ccar-f', 'ccdv-f', 'ccao-f'],
  domains: ['ccar-p-2', 'ccar-f-4', 'ccdv-f-6', 'ccdv-f-5', 'ccao-f-1'],
  tags: ['prompting', 'few-shot', 'chain-of-thought', 'adaptive-thinking', 'self-critique', 'cost'],
  difficulty: 'intermediate',
  sections: [
    {
      heading: 'Zero-shot, few-shot and when each wins',
      body: `**Zero-shot** gives the instruction and nothing else. Current Claude models are strong zero-shot performers when the instruction is explicit: what to do, what to output, what to do in edge cases. Start here. It is the cheapest option and the easiest to maintain.

**Few-shot** adds worked examples. It pays off when the output format is unusual or strict, when the boundary between labels is subtle, or when "show, don't tell" is shorter than describing every rule. Guidelines:

- Use 3 to 5 diverse examples that cover the hard cases, not the easy ones.
- Keep them representative of production inputs; a mismatch teaches the wrong pattern.
- Wrap each in consistent delimiters so the model can tell example from task.
- Review them when the task changes; stale examples silently steer the model wrong.

Cost: examples sit in the prompt on every call. Put them in the cached prefix so they cost about 10% after the first call. Maintenance: each example is a small test case that must be kept correct.

Explicit criteria often beat examples. For a code reviewer, "flag only issues that would cause a runtime error, data loss or security vulnerability" reduces false positives more reliably than ten example comments.`,
    },
    {
      heading: 'Chain-of-thought and adaptive thinking',
      body: `Classic chain-of-thought prompting ("think step by step before answering") asked the model to reason in its visible output. On current Claude models this is largely superseded by **adaptive thinking**: the model reasons internally before responding, and the depth is governed by \`output_config.effort\`. Thinking is always on for Opus 5.5 and on by default for Sonnet 5.5 and Haiku 5.5.

What this changes for architects:

- You rarely need "think step by step" in the prompt. Raise effort instead when a task needs more deliberation; lower it for simple tasks to cut latency and cost.
- Thinking tokens are billed as output. Monitor them with \`usage\` (the thinking token detail where available) and avoid high effort on high-volume simple tasks.
- Visible reasoning is still useful when a human must audit the rationale (a credit decision, a compliance flag). Ask for a short "rationale" field in the structured output rather than free-form step-by-step text.
- Do not pass raw thinking back to other systems; it is not a specification and may not be returned in full.

A practical rule: effort is the knob for *how hard the model thinks*; the prompt is where you say *what a good answer looks like*.`,
    },
    {
      heading: 'Decomposition prompts and self-critique',
      body: `**Decomposition in the prompt** asks the model to break a task into parts before solving: "First list the clauses that affect termination, then for each clause state the notice period, then summarise." This is single-call decomposition and is cheap. When the parts need different tools, models or validation, decompose across calls instead (prompt chaining).

**Self-critique** asks the model to review its own draft against criteria and revise. In one call ("draft, then check against the checklist, then output the final version") it is inexpensive and effective for format and policy compliance. As a separate evaluator call (evaluator-optimizer) it costs a second request but allows a different model, a clean context and an independent rubric.

Caveats architects should know:

- Self-critique is not independent verification. It catches omissions and format slips; it does not reliably catch factual errors the model believes.
- For factual grounding, verify against sources deterministically (quote matching, schema checks) rather than asking the model to confirm itself.
- Each critique round multiplies output tokens; bound the rounds.`,
    },
    {
      heading: 'Cost, latency and the exam angle',
      body: `| Technique | Extra input tokens | Extra output tokens | Latency effect | Maintenance |
|---|---|---|---|---|
| Zero-shot with explicit criteria | None | None | Baseline | Low |
| Few-shot (3–5 examples) | Hundreds to thousands, cacheable | None | Small (cached) | Examples must be kept current |
| Higher effort (adaptive thinking) | None | More thinking tokens | Higher TTFT | None |
| In-prompt decomposition | Small | Moderate | Moderate | Low |
| Single-call self-critique | Small | Roughly double | Moderate | Low |
| Separate evaluator call | A second prompt | A second response | Doubles | Rubric upkeep |

Pick the cheapest technique that clears the quality bar on the eval set, and measure rather than assume. Common exam distractors: adding "think step by step" to a prompt on a model with adaptive thinking (effort is the right knob), adding examples that do not resemble production inputs, and using self-critique as if it were ground-truth verification. The correct answers tend to be: write explicit criteria, adjust effort, add representative few-shot examples for format and edge cases, and verify facts outside the model.`,
    },
  ],
  examples: [
    {
      title: 'Explicit criteria instead of more examples',
      description:
        'A CI review assistant produced many nitpick comments. The team had added fifteen example comments without improvement. Replacing them with three explicit severity criteria and an instruction to stay silent when unsure cut the comment volume by 70% and raised the acceptance rate from 35% to 80%.',
      language: 'text',
      code: `Review the diff. Report an issue ONLY if it meets one of these criteria:
1. It will cause a runtime error, data loss or incorrect results on a realistic input.
2. It introduces a security vulnerability (injection, auth bypass, secret exposure).
3. It violates a rule in CONVENTIONS.md and the rule is cited.
Do not comment on style, naming or formatting. If you are not confident an issue
meets a criterion, do not report it. Output findings as JSON matching the schema.`,
      takeaway: 'For precision problems, explicit inclusion criteria and an instruction to abstain beat piling on examples.',
    },
    {
      title: 'Few-shot for a strict, unusual output format',
      description:
        'A logistics company needs addresses normalised into a legacy 5-field fixed-width format with country-specific quirks. Describing every rule took two pages; four representative examples (including a PO box and a non-Latin script address) in the cached prefix achieved 99% format conformance.',
      language: 'python',
      code: `system = [
    {"type": "text", "text": "Normalise addresses into the LEGACY5 format. Follow the examples exactly."},
    {"type": "text", "text": FEW_SHOT_EXAMPLES,          # 4 hard cases, consistent <example> tags
     "cache_control": {"type": "ephemeral"}},
]
resp = client.messages.create(
    model="claude-sonnet-5-5", max_tokens=200,
    output_config={"effort": "low"},       # formatting task: deliberation adds nothing
    system=system,
    messages=[{"role": "user", "content": raw_address}],
)`,
      takeaway: 'Few-shot shines for strict formats; put examples in the cached prefix and lower effort on mechanical tasks.',
    },
    {
      title: 'Mistake: "think step by step" on a high-volume classifier',
      description:
        'A team added "Think step by step and explain your reasoning before answering" to a ticket classifier running 2 million calls a month on Haiku 5.5. Output tokens rose eightfold and p95 latency tripled with no accuracy gain, because adaptive thinking already handled the reasoning internally. The fix removed the instruction, set effort to low and asked for the label only.',
      takeaway: 'On adaptive-thinking models, control deliberation with effort; visible step-by-step output on high-volume tasks is pure cost.',
    },
    {
      title: 'Self-critique with deterministic fact verification',
      description:
        'A research summariser asked the model to draft, then critique its draft for unsupported claims, then revise. Omissions and format errors dropped, but a few fabricated figures survived because the model believed them. The team added a deterministic step: every number and quotation in the output must appear in the retrieved sources, or the summary is flagged for review.',
      takeaway: 'Self-critique improves completeness and format; factual grounding needs verification outside the model.',
    },
  ],
  keyPoints: [
    'Start zero-shot with explicit instructions and criteria; add few-shot only for strict formats or subtle boundaries.',
    'Few-shot examples should be 3–5, diverse, representative of production inputs and kept in the cached prefix.',
    'Explicit inclusion criteria plus an instruction to abstain are the strongest tool against false positives.',
    'On current models adaptive thinking replaces "think step by step"; control depth with output_config.effort.',
    'Thinking tokens are billed as output; avoid high effort on high-volume simple tasks.',
    'Ask for a short rationale field in structured output when humans must audit decisions.',
    'Self-critique catches omissions and format slips, not confidently held factual errors; verify facts deterministically.',
    'Choose the cheapest technique that clears the quality bar on the eval set, and measure.',
  ],
  flashcards: [
    { front: 'When does few-shot prompting pay off over zero-shot?', back: 'Strict or unusual output formats, subtle label boundaries, or when examples are shorter than describing every rule.' },
    { front: 'How many few-shot examples and of what kind?', back: '3–5 diverse examples covering the hard cases, representative of production inputs, in consistent delimiters.' },
    { front: 'What replaces "think step by step" on current Claude models?', back: 'Adaptive thinking, with depth controlled by output_config.effort (low to max).' },
    { front: 'How are thinking tokens billed?', back: 'As output tokens; monitor them in usage and avoid high effort on high-volume simple tasks.' },
    { front: 'What does self-critique reliably improve, and what does it not?', back: 'Improves completeness and format/policy compliance; does not reliably catch factual errors the model believes.' },
    { front: 'How should factual grounding be verified?', back: 'Deterministically outside the model: quote matching against sources, schema checks, lookups.' },
    { front: 'Where should few-shot examples be placed for cost efficiency?', back: 'In the cached system prefix so they cost about 10% of input price after the first call.' },
    { front: 'What is the strongest technique for reducing false positives in a review assistant?', back: 'Explicit inclusion criteria plus an instruction to stay silent when not confident.' },
    { front: 'Single-call self-critique vs separate evaluator call: key differences?', back: 'Single call is cheaper and shares context; a separate call doubles cost but allows a different model, clean context and independent rubric.' },
  ],
  quiz: [
    {
      question:
        'A ticket classifier on Haiku 5.5 handles 2 million calls a month. A developer added "Think step by step and explain your reasoning" and output tokens rose eightfold with no accuracy gain. What is the BEST action?',
      options: [
        'Keep the instruction but raise max_tokens so reasoning is not truncated.',
        'Remove the instruction, set effort to low and request only the label.',
        'Move the classifier to Opus so reasoning is faster.',
        'Add five more few-shot examples to shorten the reasoning.',
      ],
      correct: [1],
      explanation:
        'Adaptive thinking already reasons internally; visible step-by-step output is pure cost here. Raising max_tokens (1) and moving to Opus (3) increase cost; more examples (4) do not address the output verbosity.',
    },
    {
      question:
        'A CI review assistant produces many low-value comments despite fifteen example comments in its prompt. Which change is MOST likely to improve precision?',
      options: [
        'Add fifteen more examples.',
        'Replace the examples with explicit severity criteria and an instruction not to report when unsure.',
        'Increase effort to max.',
        'Switch from JSON output to free text so the model can explain itself.',
      ],
      correct: [1],
      explanation:
        'Precision problems respond to explicit inclusion criteria and permission to abstain. More examples (1) already failed; effort (3) does not define what counts as an issue; free text (4) harms downstream handling.',
    },
    {
      question: 'Which TWO statements about few-shot examples are correct? (Select two)',
      options: [
        'They should resemble production inputs and cover hard cases.',
        'They should be placed after the user question so the model sees them last.',
        'They are cost-effective when placed in the cached prefix.',
        'More examples always improve accuracy.',
      ],
      correct: [0, 2],
      explanation:
        'Representative hard cases in a cached prefix is the recommended practice. Placing them after the question (2) breaks caching and ordering; more examples (4) have diminishing or negative returns.',
    },
    {
      question:
        'A research summariser uses single-call self-critique, yet a few fabricated statistics still appear. What should the architect add?',
      options: [
        'A second self-critique round.',
        'A deterministic check that every number and quotation appears in the retrieved sources, flagging failures for review.',
        'An instruction to "be more careful with numbers".',
        'A larger model for the critique step.',
      ],
      correct: [1],
      explanation:
        'Self-critique cannot reliably catch facts the model believes; external verification can. More rounds (1), instructions (3) or a bigger critic (4) remain inside the model\'s beliefs.',
    },
    {
      question:
        'A credit-decision assistant must provide an auditable rationale to compliance reviewers. Which approach is MOST appropriate on Opus 5.5?',
      options: [
        'Return the raw thinking content to the reviewers.',
        'Request a concise "rationale" field in the structured output alongside the decision.',
        'Set effort to low to keep the output short.',
        'Prompt "think step by step" and parse the steps from free text.',
      ],
      correct: [1],
      explanation:
        'A structured rationale field is auditable and parseable. Raw thinking (1) is not a specification and may not be fully returned; low effort (3) does not produce a rationale; parsing free text (4) is brittle.',
    },
  ],
  statements: [
    { text: 'On current Claude models, "think step by step" in the prompt is the primary way to increase reasoning depth.', isTrue: false, explanation: 'Adaptive thinking handles reasoning internally; use output_config.effort to control depth.' },
    { text: 'Few-shot examples should be representative of production inputs and emphasise hard cases.', isTrue: true, explanation: 'Unrepresentative or trivial examples teach the wrong pattern.' },
    { text: 'Self-critique in a single call is a reliable way to catch factual hallucinations.', isTrue: false, explanation: 'It catches omissions and format slips; factual grounding needs deterministic verification against sources.' },
    { text: 'Thinking tokens are billed as output tokens.', isTrue: true, explanation: 'High effort on high-volume simple tasks is therefore expensive.' },
    { text: 'Explicit inclusion criteria with permission to abstain reduce false positives more reliably than adding examples.', isTrue: true, explanation: 'Criteria define the boundary directly; examples only hint at it.' },
    { text: 'Decomposition inside a single prompt is always inferior to decomposing across multiple calls.', isTrue: false, explanation: 'In-prompt decomposition is cheap and adequate when parts share tools and validation; cross-call decomposition is needed when parts need different models, tools or checks.' },
    { text: 'A separate evaluator call allows a different model and an independent rubric at the cost of a second request.', isTrue: true, explanation: 'That is the evaluator-optimizer trade-off versus single-call self-critique.' },
  ],
  resources: [
    { label: 'Prompt engineering overview (Claude docs)', url: 'https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview' },
    { label: 'Use examples (multishot prompting)', url: 'https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/multishot-prompting' },
    { label: 'Adaptive thinking (Claude docs)', url: 'https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking' },
    { label: 'Effort parameter (Claude docs)', url: 'https://platform.claude.com/docs/en/build-with-claude/effort' },
  ],
};
