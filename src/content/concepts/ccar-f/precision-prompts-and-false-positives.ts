import type { Concept } from '../../types';

export const precisionPromptsAndFalsePositives: Concept = {
  id: 'precision-prompts-and-false-positives',
  title: 'Precision Prompts and False Positives',
  summary:
    'Write review and classification prompts with explicit categorical criteria instead of vague instructions, understand why false positives destroy trust in a whole system, and define severity levels with concrete code examples.',
  certs: ['ccar-f', 'ccdv-f', 'ccar-p'],
  domains: ['ccar-f-4', 'ccar-f-3', 'ccdv-f-6', 'ccar-p-2', 'ccar-p-4'],
  tags: ['prompting', 'code-review', 'precision', 'ci-cd'],
  difficulty: 'intermediate',
  sections: [
    {
      heading: 'Explicit criteria beat vague instructions',
      body: `"Check that comments are accurate" sounds like a clear instruction. In practice it produces findings about comments that are slightly out of date, comments that could be more detailed, and comments the model would have phrased differently. Most of these are noise.

Compare: "Flag a comment only when the behaviour it claims **contradicts** what the code actually does." That is a **categorical criterion**: a reviewer (human or model) can test any candidate against it and get a yes or no. Precision rises because the ambiguous middle ("could be better") is explicitly excluded.

The same shift applies everywhere findings are produced:

| Vague | Explicit |
|---|---|
| "Look for performance problems" | "Flag loops that issue a database query per iteration" |
| "Check error handling" | "Flag caught exceptions that are neither logged, re-raised nor returned as an error" |
| "Review security" | "Flag string-concatenated SQL, unvalidated redirects, and secrets in source" |

Write the criteria as a list of what to **report** and a list of what to **skip** (minor style, patterns the linter already enforces, local conventions that look odd but are deliberate). Both lists matter; the skip list is what stops the model from filling the gaps with its own taste.`,
    },
    {
      heading: 'Why "be conservative" does not work',
      body: `A natural first reaction to noisy output is to add "be conservative", "only report high-confidence findings" or "do not nitpick". These rarely improve precision, for a simple reason: they ask the model to apply a threshold without telling it where the threshold is. "High confidence" about *what*? The model still has to decide what counts as an issue, and the vague adjective gives it no new information to decide with.

Confidence-based filtering also fails differently across categories. The model may be very confident that a variable name is unclear; that confidence is real but the finding is still unwanted. A categorical criterion ("do not report naming") removes it; a confidence threshold does not.

So: when precision is low, replace adjectives with **categories and definitions**. State which classes of issue exist, which to report, and what distinguishes a member of the class from a near miss. If a category keeps producing false positives even after that, the fix is to refine or disable the category (next section), not to add "be careful".`,
    },
    {
      heading: 'False positives erode trust across the board',
      body: `Developers do not evaluate review categories independently. If the "unused import" category is right 95% of the time but the "possible null dereference" category is wrong 60% of the time, developers learn that the tool's comments are often wrong and start skimming or dismissing **all** of them, including the accurate ones. A single noisy category can sink the credibility of the whole system.

This has a direct operational consequence. When one category is producing a high false-positive rate, the right move is to **disable that category temporarily** while you improve its criteria offline, then re-enable it. The trust in the accurate categories is preserved, and you can iterate on the noisy one without a live audience. Keeping it on "so we do not miss anything" trades a few true positives for the credibility of everything else.

Measuring this needs data: which findings do developers dismiss, and what did those findings have in common? That is what a \`detected_pattern\` field in structured findings is for (covered under validation and feedback loops).`,
    },
    {
      heading: 'Severity criteria with code examples',
      body: `Severity labels are only useful if they are applied consistently. "Critical", "high", "medium" and "low" mean different things to different reviewers, and to the same model on different days, unless each level has a **definition and a concrete code example**.

\`\`\`markdown
## Severity
- **critical**: data loss, security breach, or outage in production.
  Example: \`cursor.execute(f"DELETE FROM users WHERE id = {user_id}")\` (SQL injection).
- **high**: incorrect behaviour on realistic inputs, no data loss.
  Example: \`if total > limit\` where the spec says "at or above the limit".
- **medium**: incorrect behaviour only on unusual inputs, or a resource leak.
  Example: a file opened without a context manager in a rarely used path.
- **low**: no behavioural impact; maintainability only.
  Example: a function that is never called.
\`\`\`

The examples anchor each level. A reviewer deciding whether an issue is high or medium compares it to the examples rather than to an abstract adjective. This is few-shot prompting applied to classification, and it is why severity definitions and few-shot examples are tested together on the exam.`,
    },
  ],
  examples: [
    {
      title: 'Replacing "check comments" with a contradiction test',
      description:
        'A CI review step flagged 30 to 40 comment "issues" per PR, almost all of the form "this comment could be more descriptive". Developers stopped reading them. Rewriting the criterion to report only comments whose stated behaviour contradicts the code cut findings to one or two per PR, nearly all of which were real.',
      language: 'markdown',
      code: `## Comments
Report a comment ONLY when the behaviour it describes contradicts what the code does.
Example to report: comment says "returns None if not found"; code raises KeyError.
Do NOT report: comments that are brief, missing, stylistically different, or
slightly out of date without contradicting the code.`,
      takeaway: 'A testable categorical criterion removes the ambiguous middle that generates noise.',
    },
    {
      title: 'The mistake: adding "be conservative"',
      description:
        'After complaints about noisy reviews, a team added "Be conservative. Only report findings you are highly confident about." to the prompt. The volume dropped slightly, but the mix was the same: confident findings about naming and formatting kept appearing because the model was indeed confident about them. Replacing the sentence with an explicit report/skip list fixed the mix.',
      language: 'markdown',
      code: `# Before
Be conservative. Only report high-confidence findings.

# After
Report: logic bugs, security issues, data loss risks, unhandled error paths.
Skip: naming, formatting, import order, comment style, anything the linter enforces,
      and local patterns that are consistent within the file.`,
      takeaway: 'Confidence filters do not define what counts as an issue; categories do.',
    },
    {
      title: 'Disabling a noisy category to restore trust',
      description:
        'A review bot had four categories. Three were accurate; the "possible race condition" category was wrong about two thirds of the time. Developers began dismissing all comments. The team disabled the race category for two weeks, collected the dismissed findings, found that most involved framework-managed locks the model did not recognise, added those patterns to the skip list with examples, and re-enabled it at a much better precision.',
      takeaway: 'Protect trust in the accurate categories by turning the noisy one off while you fix it.',
    },
    {
      title: 'Inconsistent severities without examples',
      description:
        'Two near-identical off-by-one bugs were labelled "critical" in one PR and "low" in another. The severity section of the prompt consisted of four adjectives. Adding a definition and a short code example for each level produced consistent labels and let the pipeline route critical findings to block the merge while posting low ones as suggestions.',
      takeaway: 'Each severity level needs a definition and a concrete example to be applied consistently.',
    },
  ],
  keyPoints: [
    'Explicit categorical criteria ("report when X contradicts Y") outperform vague instructions ("check that X is accurate").',
    'List both what to report (bugs, security, data loss) and what to skip (style, linter-enforced rules, deliberate local patterns).',
    '"Be conservative" and "only high-confidence findings" do not improve precision because they do not define what counts as an issue.',
    'High false-positive rates in one category undermine developer trust in all categories.',
    'Temporarily disable a noisy category while improving its criteria, then re-enable it.',
    'Define each severity level with a definition and a concrete code example for consistent classification.',
    'Track dismissed findings to learn which patterns cause false positives.',
  ],
  flashcards: [
    { front: 'Rewrite "check that comments are accurate" as an explicit criterion.', back: 'Flag a comment only when the behaviour it claims contradicts what the code actually does.' },
    { front: 'Why does "be conservative" fail to improve precision?', back: 'It asks for a threshold without defining what counts as an issue; the model still fills the gap with its own judgement.' },
    { front: 'What happens to developer trust when one review category has a high false-positive rate?', back: 'Developers start dismissing findings from all categories, including accurate ones.' },
    { front: 'What should you do with a category that keeps producing false positives?', back: 'Disable it temporarily, improve its criteria (often with examples of acceptable patterns), then re-enable it.' },
    { front: 'How do you achieve consistent severity classification?', back: 'Define each level and give a concrete code example for each.' },
    { front: 'What belongs on the "skip" list of a review prompt?', back: 'Minor style, anything the linter enforces, and local patterns that are deliberate and consistent.' },
    { front: 'Categorical criteria vs confidence-based filtering: which improves precision?', back: 'Categorical criteria. Confidence filtering leaves the definition of "issue" unresolved.' },
    { front: 'Why does a severity example help more than a severity adjective?', back: 'A reviewer compares a candidate to the example rather than interpreting an abstract word, so classifications converge.' },
  ],
  quiz: [
    {
      question:
        'A CI review prompt says "check that comments are accurate" and produces dozens of low-value findings per PR. Which rewrite is MOST likely to improve precision?',
      options: [
        '"Check that comments are accurate. Be conservative."',
        '"Flag a comment only when the behaviour it describes contradicts what the code actually does."',
        '"Only report comment issues you are at least 90% confident about."',
        '"Check comments carefully and thoroughly."',
      ],
      correct: [1],
      explanation:
        'A categorical, testable criterion excludes the ambiguous "could be better" findings. "Be conservative", confidence thresholds and "carefully" do not define what counts as an issue.',
    },
    {
      question:
        'A review bot has four categories. Three are accurate; one ("possible race condition") is wrong most of the time, and developers have started ignoring all bot comments. What should the team do FIRST?',
      options: [
        'Add "only report races you are certain about" to the prompt.',
        'Temporarily disable the race-condition category while improving its criteria, keeping the accurate categories on.',
        'Disable the whole bot until every category is accurate.',
        'Switch to a larger model for the race-condition category.',
      ],
      correct: [1],
      explanation:
        'Disabling the noisy category restores trust in the accurate ones immediately and lets the team fix it offline. Confidence wording does not fix precision, disabling everything loses value, and a bigger model does not supply missing criteria.',
    },
    {
      question:
        'Two similar off-by-one bugs were labelled "critical" in one PR and "low" in another. The prompt lists the four severity names only. What is the BEST fix?',
      options: [
        'Remove severity from the output; it is too subjective.',
        'Add a definition and a concrete code example for each severity level.',
        'Ask the model to explain its severity choice in a paragraph.',
        'Use only two levels: "serious" and "minor".',
      ],
      correct: [1],
      explanation:
        'Definitions with examples anchor each level so classifications converge. Removing severity loses routing, explanations do not create consistency, and fewer vague levels are still vague.',
    },
    {
      question: 'Which TWO statements about precision in review prompts are correct? (Select two)',
      options: [
        'Listing what to skip is as important as listing what to report.',
        'A confidence threshold such as "only high-confidence findings" is the most reliable way to cut false positives.',
        'A single noisy category can reduce trust in accurate categories.',
        'Vague instructions are preferable because they let the model use its judgement.',
      ],
      correct: [0, 2],
      explanation:
        'Skip lists stop the model filling gaps with its own taste, and trust is evaluated on the system as a whole. Confidence thresholds do not define issues, and vague instructions are the source of the noise.',
    },
    {
      question:
        'A team wants the review bot to ignore style issues already enforced by their linter but keep reporting logic bugs. Which prompt change achieves this most directly?',
      options: [
        '"Focus on important things."',
        'An explicit report list (logic bugs, security, data loss) and skip list (formatting, naming, import order, linter-enforced rules).',
        '"Do not duplicate the linter."',
        'Lower the model\'s effort level.',
      ],
      correct: [1],
      explanation:
        'Explicit report and skip lists are categorical and testable. "Important", "do not duplicate the linter" and effort changes leave the categories undefined.',
    },
  ],
  statements: [
    { text: 'Adding "be conservative" to a review prompt is an effective way to raise precision.', isTrue: false, explanation: 'It does not define what counts as an issue. Explicit categorical criteria do.' },
    { text: 'High false-positive rates in one category can undermine confidence in categories that are accurate.', isTrue: true, explanation: 'Developers judge the tool as a whole and start dismissing all findings.' },
    { text: 'A review prompt should specify both which issues to report and which to skip.', isTrue: true, explanation: 'The skip list prevents the model from filling gaps with stylistic opinions.' },
    { text: 'Severity levels are applied consistently as long as the level names are listed in the prompt.', isTrue: false, explanation: 'Names alone are interpreted differently; each level needs a definition and a concrete code example.' },
    { text: 'Temporarily disabling a noisy review category is a legitimate way to protect developer trust while improving it.', isTrue: true, explanation: 'It preserves credibility of accurate categories and allows offline iteration on the noisy one.' },
    { text: '"Flag comments only when claimed behaviour contradicts the code" is less precise than "check that comments are accurate" because it misses outdated comments.', isTrue: false, explanation: 'The contradiction criterion is deliberately narrower; excluding the ambiguous middle is what raises precision.' },
  ],
  resources: [
    { label: 'Be clear and direct (prompt engineering)', url: 'https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/be-clear-and-direct' },
    { label: 'Prompt engineering overview', url: 'https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview' },
  ],
};
