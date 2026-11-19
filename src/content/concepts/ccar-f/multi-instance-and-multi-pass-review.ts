import type { Concept } from '../../types';

export const multiInstanceAndMultiPassReview: Concept = {
  id: 'multi-instance-and-multi-pass-review',
  title: 'Multi-Instance and Multi-Pass Review Architectures',
  summary:
    'Why a model is a poor reviewer of its own work, how an independent reviewer instance catches what self-review misses, how to split large reviews into per-file and cross-file passes, and how confidence self-reports route findings to the right level of human attention.',
  certs: ['ccar-f', 'ccdv-f', 'ccar-p'],
  domains: ['ccar-f-4', 'ccar-f-5', 'ccar-f-1', 'ccdv-f-6', 'ccar-p-4'],
  tags: ['code-review', 'architecture', 'multi-agent', 'ci-cd', 'confidence'],
  difficulty: 'intermediate',
  sections: [
    {
      heading: 'The self-review problem',
      body: `When a model generates code, its context holds the whole chain of reasoning that produced it: the assumptions it made, the alternatives it dismissed, the edge cases it decided were unlikely. Ask that same session to review the code and it reviews *from inside that reasoning*. It is primed to find its own decisions sensible, because it has just justified them.

This is not fixed by instruction. "Review your changes critically", "be skeptical", or turning up extended thinking all operate on the same anchored context. The model may think longer, but it thinks longer with the same assumptions in place. Self-review in the same session catches typos and obvious slips; it reliably misses the subtle issue that follows from an assumption the generator made early on.

The architectural fix is **context isolation**: give the review to a model instance that has *no* prior reasoning context. It sees the code, the diff, the requirements and the review criteria, and nothing about how the code came to be. With no decisions to defend, it questions the ones that look wrong.`,
    },
    {
      heading: 'The independent reviewer instance',
      body: `In practice an independent reviewer is a fresh request (or in Claude Code, a fresh \`claude -p\` invocation or a subagent with its own context) that receives:

- The diff or the files under review.
- The stated requirements or ticket, so it can check intent against implementation.
- Explicit review criteria and severity definitions (see precision prompts).
- Optionally, the existing tests and relevant surrounding code.

It must **not** receive the generator's conversation, its plan, or its explanations of why things are the way they are. If you pass "the author notes that the race condition is unlikely", you have re-introduced the anchoring you were trying to remove.

Compared with self-review instructions or more thinking, an independent instance is more effective at catching subtle issues, and it costs one extra request. For high-stakes changes the pattern extends naturally: two independent reviewers with different criteria (correctness, security), or a reviewer followed by a verifier that checks the reviewer's findings against the code.`,
    },
    {
      heading: 'Multi-pass review: local then integration',
      body: `A single review pass over a 40-file change has two failure modes. **Attention dilution**: with everything in context, the model skims, and local issues in file 27 go unnoticed. **Contradictory findings**: the model flags a pattern as wrong in one file and lets the same pattern pass in another, because it never compares them.

Split the review into passes with different scope:

1. **Per-file local passes.** One request per file (or small group of related files), looking for issues visible within the file: logic errors, error handling, input validation, local conventions. Each pass has a small, focused context and produces consistent, specific findings.
2. **Cross-file integration pass.** One request that receives the *interfaces* and the *data flow* across files: what each module exports, how data moves between them, where contracts changed. It looks for mismatched types across boundaries, callers not updated for a changed signature, inconsistent handling of the same value in different places, and ordering or transaction issues that span files.

The integration pass should receive the local findings as input so it can deduplicate and prioritise, but it should not redo the local work. This mirrors how good human reviews happen: read each file carefully, then step back and ask whether the pieces fit.`,
    },
    {
      heading: 'Confidence self-reports and review routing',
      body: `Not every finding deserves the same human attention. Ask the reviewer to attach a **confidence** to each finding (for example 0 to 1, or low/medium/high) along with a one-line reason for the confidence. Then route:

| Confidence | Severity | Route |
|---|---|---|
| High | Critical/High | Block the merge; notify the author immediately |
| High | Low/Medium | Post as an inline comment |
| Low | Critical/High | Send to a verification pass or a senior reviewer before posting |
| Low | Low | Suppress, or log for pattern analysis without posting |

Two cautions. Self-reported confidence is a signal, not a measurement; **calibrate** it by tracking, per confidence band, how often findings were accepted versus dismissed. If 70% of "high confidence" findings are dismissed, the band is miscalibrated and the criteria need work. And confidence routing complements, never replaces, explicit criteria: a model confident about a style nit is still producing a finding you asked it to skip.

Exam angle: "the generator session also reviews and misses bugs" → independent instance. "A huge PR review is shallow and contradicts itself" → per-file plus integration passes. "Too many findings for humans to triage" → confidence self-report and routing.`,
    },
  ],
  examples: [
    {
      title: 'Generator and reviewer as separate instances',
      description:
        'A pipeline generates a database migration with one request, then reviews it with a second request that sees only the migration, the schema, and the review criteria. The reviewer caught that a column was dropped before data was copied, an ordering the generator had reasoned was "safe because the copy is in the same transaction" (it was not).',
      language: 'python',
      code: `gen = client.messages.create(
    model="claude-opus-5-5", max_tokens=8000,
    messages=[{"role": "user", "content": f"Write a migration for: {ticket}\\n\\nSchema:\\n{schema}"}],
)
migration = text_of(gen)

review = client.messages.create(          # fresh context: no generator reasoning
    model="claude-opus-5-5", max_tokens=4000,
    system=REVIEW_CRITERIA,                # what to report/skip, severity definitions
    messages=[{"role": "user", "content":
        f"Review this migration against the schema. Report findings with "
        f"file, line, severity, confidence (0-1) and fix.\\n\\n{schema}\\n\\n{migration}"}],
    output_config={"format": {"type": "json_schema", "schema": FINDINGS_SCHEMA}},
)`,
      takeaway: 'The reviewer gets the artifact and the criteria, never the generator\'s reasoning.',
    },
    {
      title: 'The mistake: "now review your own work carefully"',
      description:
        'A team appended "Now review the code you just wrote. Be extremely critical and look for subtle bugs." to their generation prompt and raised the effort level for good measure. The self-review consistently reported "no significant issues" on changes that human reviewers later rejected. The generator had, in the same context, already argued itself into each decision. Moving the review to a separate request with no shared context immediately surfaced the issues.',
      takeaway: 'Stronger wording and more thinking do not remove anchoring; a fresh context does.',
    },
    {
      title: 'Per-file passes plus an integration pass',
      description:
        'A 38-file refactor changed a money type from float to a Decimal wrapper. A single-pass review produced vague findings and flagged the same conversion as wrong in two files and fine in three others. Re-running as 38 per-file passes (local correctness) plus one integration pass (fed the exported signatures, call graph and local findings) produced consistent per-file results and caught two callers that still passed floats across a module boundary.',
      language: 'text',
      code: `Pass 1 (x38): "Review ONLY this file for local issues. Context: this PR replaces float
               money with Money(Decimal). Report: file, line, severity, confidence, fix."
Pass 2 (x1):  "Here are the changed public signatures, the call graph between changed
               modules, and the per-file findings. Report ONLY cross-file issues:
               callers not updated, type mismatches at boundaries, inconsistent
               handling of the same value. Deduplicate against the per-file findings."`,
      takeaway: 'Local passes keep attention focused; the integration pass checks that the pieces fit.',
    },
    {
      title: 'Routing by confidence and calibrating it',
      description:
        'A review bot produced 60 findings per large PR, too many to triage. Adding a confidence field and routing high-confidence critical findings to block, low-confidence ones to a verification pass, and low/low to a log cut what humans saw to about 12 per PR. Monthly calibration showed "high" findings were accepted 85% of the time but "medium" only 40%, so the team tightened the criteria behind the medium band.',
      takeaway: 'Confidence enables routing, but only tracking acceptance rates tells you whether it is calibrated.',
    },
  ],
  keyPoints: [
    'A model reviewing its own output in the same session retains the reasoning that produced it and tends to confirm rather than question it.',
    'Self-review instructions and extended thinking do not remove this anchoring; an independent instance with no prior context does.',
    'The independent reviewer receives the artifact, requirements and criteria, never the generator\'s reasoning or justifications.',
    'Large multi-file reviews suffer attention dilution and contradictory findings in a single pass.',
    'Split into per-file local passes plus a separate cross-file integration pass for data flow and interface consistency.',
    'Feed local findings into the integration pass for deduplication, but do not redo local work there.',
    'Ask for a confidence self-report per finding to route high-confidence critical issues to block and low-confidence ones to verification.',
    'Calibrate confidence by tracking acceptance versus dismissal per band.',
  ],
  flashcards: [
    { front: 'Why is self-review in the same session less effective?', back: 'The model retains the reasoning and assumptions that produced the code and is unlikely to question its own decisions.' },
    { front: 'Does raising extended thinking effort fix the self-review problem?', back: 'No. It thinks longer within the same anchored context.' },
    { front: 'What should an independent reviewer instance receive?', back: 'The diff or files, the requirements, and explicit review criteria; not the generator\'s reasoning.' },
    { front: 'What is multi-pass review?', back: 'Per-file local passes for issues within each file plus a separate cross-file integration pass for data flow and interface consistency.' },
    { front: 'Two failure modes of a single pass over a large PR?', back: 'Attention dilution (missed local issues) and contradictory findings (the same pattern judged differently in different files).' },
    { front: 'What does the integration pass look for?', back: 'Callers not updated for changed signatures, type mismatches at module boundaries, inconsistent handling of the same value, cross-file ordering issues.' },
    { front: 'What is a confidence self-report used for?', back: 'Routing findings: high-confidence critical issues block, low-confidence ones go to verification or a senior reviewer.' },
    { front: 'How do you know whether self-reported confidence is calibrated?', back: 'Track acceptance versus dismissal rates per confidence band over time.' },
    { front: 'In Claude Code CI, how do you get an independent reviewer?', back: 'A separate claude -p invocation (or a subagent with its own context) that did not generate the code.' },
  ],
  quiz: [
    {
      question:
        'A pipeline has Claude generate a feature and then, in the same conversation, review it with the instruction "be extremely critical". Reviewers keep finding bugs the self-review passed. Which change is MOST effective?',
      options: [
        'Raise the effort level for the review step.',
        'Have a separate Claude instance with no access to the generation conversation review the diff against explicit criteria.',
        'Add "you are a world-class security auditor" to the self-review instruction.',
        'Ask the same session to review the code three times.',
      ],
      correct: [1],
      explanation:
        'Only a fresh context removes the anchoring from generation. More effort, stronger persona wording, or repeated self-review all operate inside the same reasoning context.',
    },
    {
      question:
        'A single review pass over a 45-file PR produces vague findings and flags a pattern as a bug in one file while passing it in others. What architecture BEST addresses this?',
      options: [
        'One pass with a larger model and the whole PR in context.',
        'Per-file local passes for in-file issues plus a separate integration pass over interfaces and data flow.',
        'Review only the five largest files.',
        'Ask the model to "be consistent across files".',
      ],
      correct: [1],
      explanation:
        'Splitting scope fixes attention dilution and gives the integration pass the job of cross-file consistency. A bigger model still dilutes attention, sampling files misses issues, and a consistency instruction does not change what the model can attend to.',
    },
    {
      question: 'Which TWO should the independent reviewer instance receive? (Select two)',
      options: [
        'The diff or files under review.',
        'The generator\'s explanation of why each design decision is safe.',
        'Explicit review criteria with severity definitions.',
        'The generator\'s full conversation transcript for context.',
      ],
      correct: [0, 2],
      explanation:
        'The reviewer needs the artifact and the criteria. Passing the generator\'s justifications or transcript reintroduces the anchoring that independence is meant to remove.',
    },
    {
      question:
        'A review bot produces 60 findings per large PR and the team cannot triage them. Which change helps MOST while keeping critical issues visible?',
      options: [
        'Cap findings at 10 per PR.',
        'Have the reviewer self-report confidence per finding and route high-confidence critical findings to block, low-confidence ones to a verification pass, and low/low to a log.',
        'Remove severity so all findings look equal.',
        'Only review files changed by senior engineers.',
      ],
      correct: [1],
      explanation:
        'Confidence-based routing focuses human attention without discarding critical findings. A hard cap may drop critical issues, removing severity loses information, and filtering by author is arbitrary.',
    },
    {
      question: 'What does the cross-file integration pass primarily look for?',
      options: [
        'Formatting and naming issues within each file.',
        'Callers not updated for changed signatures, type mismatches at boundaries, and inconsistent handling across modules.',
        'Spelling errors in comments.',
        'Whether each file compiles in isolation.',
      ],
      correct: [1],
      explanation:
        'Integration passes examine how pieces fit together. In-file style, spelling and per-file compilation are local concerns for the per-file passes or tooling.',
    },
    {
      question: 'Monthly data shows that 70% of findings the reviewer marked "high confidence" are dismissed by developers. What does this indicate?',
      options: [
        'Developers are careless and should be required to accept high-confidence findings.',
        'The confidence self-report is miscalibrated for that band and the criteria behind it need refinement.',
        'The model should be replaced with a larger one.',
        'Confidence should be removed from the schema.',
      ],
      correct: [1],
      explanation:
        'Self-reported confidence must be checked against outcomes; a high dismissal rate means the band is not reliable and the underlying criteria need work. Forcing acceptance, swapping models or removing the signal do not address calibration.',
    },
  ],
  statements: [
    { text: 'A model that generated code is less likely to question its own decisions when asked to review that code in the same session.', isTrue: true, explanation: 'It retains the reasoning context that produced the code.' },
    { text: 'Raising extended thinking effort is as effective as an independent reviewer for catching subtle issues.', isTrue: false, explanation: 'More thinking inside the same anchored context does not remove the anchoring; a fresh instance does.' },
    { text: 'The independent reviewer should be given the generator\'s reasoning so it understands the intent.', isTrue: false, explanation: 'Giving it the generator\'s justifications reintroduces the bias; give it the requirements and criteria instead.' },
    { text: 'Splitting a large review into per-file passes and a cross-file integration pass reduces attention dilution and contradictory findings.', isTrue: true, explanation: 'Each pass has focused scope, and cross-file consistency becomes an explicit job.' },
    { text: 'The integration pass should repeat the per-file analysis to double-check it.', isTrue: false, explanation: 'It should receive the local findings for deduplication and focus on cross-file data flow and interfaces.' },
    { text: 'Confidence self-reports can be used to route findings to different levels of human review.', isTrue: true, explanation: 'High-confidence critical findings block; low-confidence ones go to verification or a senior reviewer.' },
    { text: 'Self-reported confidence can be trusted without calibration because the model knows how sure it is.', isTrue: false, explanation: 'It is a signal that must be checked against acceptance and dismissal rates per band.' },
  ],
  resources: [
    { label: 'Claude Code GitHub Actions', url: 'https://code.claude.com/docs/en/github-actions' },
    { label: 'Claude Code subagents', url: 'https://code.claude.com/docs/en/sub-agents' },
    { label: 'Building effective agents', url: 'https://www.anthropic.com/research/building-effective-agents' },
  ],
};
