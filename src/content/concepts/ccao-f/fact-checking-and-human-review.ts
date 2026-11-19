import type { Concept } from '../../types';

export const factCheckingAndHumanReview: Concept = {
  id: 'fact-checking-and-human-review',
  title: 'Fact-Checking and Human Review',
  summary:
    'Concrete validation techniques (ask for sources, cross-check against authoritative text, recompute numbers), the situations where human expert review is mandatory, and why Claude\'s self-reported confidence is not a signal.',
  certs: ['ccao-f', 'ccar-p'],
  domains: ['ccao-f-2', 'ccao-f-6', 'ccar-p-5'],
  tags: ['validation', 'human-in-the-loop', 'risk', 'quality'],
  difficulty: 'foundations',
  sections: [
    {
      heading: 'Validation techniques you can apply yourself',
      body: `Evaluation tells you something might be wrong; validation establishes whether it is. Techniques an Associate should use routinely:

- **Ask for sources, then open them.** Prompt Claude to attach a source to every factual claim and to say "no source" when it has none. Then actually check the source says what Claude says it says. A real URL to a page that does not support the claim is still a failure.
- **Cross-check against the authoritative text.** For regulations, policies, contracts and product documentation, the authority is the original document, not a summary of it. Find the cited section and read it.
- **Recompute the numbers.** Totals, percentages, growth rates and averages can be recomputed in a spreadsheet in minutes. If Claude did the arithmetic in prose, redo it; if Claude used code execution, check the inputs it used.
- **Quote-and-locate.** Ask Claude to quote the exact passage from your uploaded document that supports each point. Missing or paraphrased "quotes" are a red flag.
- **Triangulate.** For research, require at least two independent sources for any claim that will drive a decision.
- **Ask for the opposite.** "What evidence would show this conclusion is wrong?" surfaces weak points faster than asking for more support.

Choose the technique by the type of claim: text claims get cross-checked, numeric claims get recomputed, research claims get triangulated.`,
    },
    {
      heading: 'When human review is mandatory',
      body: `Some outputs must be reviewed by a qualified person regardless of how good they look. The rule of thumb: when an error would cause legal, financial, health, safety or reputational harm, or when the content speaks for the organization. Typical mandatory-review categories:

| Category | Who reviews | Why |
|---|---|---|
| Legal and regulatory (contracts, compliance summaries, policy interpretations) | Legal or compliance | Fabricated citations; jurisdiction-specific nuance |
| Medical, health and safety guidance | Qualified clinician or safety officer | Harm from wrong advice |
| Financial figures, forecasts, tax and accounting | Finance | Decisions and filings depend on them |
| HR decisions about individuals (performance, discipline, hiring) | HR and the accountable manager | Fairness, bias, employment law |
| External communications (press, customers, regulators, public posts) | Comms owner and relevant SME | Speaks for the organization |
| Anything going to a regulator or auditor | Compliance | Accountability cannot be delegated to a model |

Your own review is still required even when an expert will also look. The expert's time is expensive; hand them something you have already checked for obvious errors and clearly marked as AI-assisted.`,
    },
    {
      heading: 'Why self-reported confidence is not a signal',
      body: `The official sample item rejects two tempting shortcuts: sending because Claude "expressed high confidence", and asking Claude to rate its own confidence. Both fail for the same reason: a language model's confidence is a property of its prose, not a measurement of its accuracy. Claude produces fluent, assured text when it is right and when it is wrong, and when asked to self-rate it will often give a high score to a fabricated citation because the citation looks like the kind of thing that is usually right.

Asking Claude to double-check its own work is slightly better than nothing (it sometimes catches arithmetic slips or internal contradictions) but it is not verification. Verification means contact with something outside the conversation: the original document, the data, a second independent source, or a human expert.

A practical mental model: Claude is a highly capable drafter and analyst that cannot see the world beyond what you gave it. Trust it for structure, synthesis and first drafts; verify it for facts.`,
    },
    {
      heading: 'Building verification into the work',
      body: `Make validation part of the workflow rather than an afterthought:

- **Ask for a verifiable format.** Request claims as a table with columns for claim, source and quote. It is much faster to check than prose.
- **Keep the source material attached.** When Claude works from your uploaded document, hallucination risk drops and quote-and-locate becomes possible.
- **Label AI-assisted drafts** when handing them to reviewers, so they apply the right level of scrutiny.
- **Match depth of verification to stakes.** An internal brainstorm needs a skim; a compliance summary needs line-by-line checking against the regulation.
- **Record what was verified** for high-stakes outputs: which claims, against which source, by whom. This supports accountability and makes the next review faster.
- **Escalate instead of guessing.** If you cannot verify a claim and the stakes are high, remove it or route it to someone who can, rather than leaving it in because it is probably fine.

On the exam, the right answer in a verification scenario is the one that puts an authoritative source or a qualified human between the output and its consequences.`,
    },
  ],
  examples: [
    {
      title: 'Recomputing a forecast before the budget meeting',
      description:
        'A finance coordinator asked Claude to project next year\'s software spend from a pasted list of subscriptions and expected headcount growth. The narrative looked right, but the coordinator rebuilt the calculation in a spreadsheet and found Claude had applied the growth rate to the total twice. The corrected figure was 9% lower. Finance reviewed the final version before it went into the budget pack.',
      takeaway: 'Numeric claims are recomputed, not re-read; and financial outputs still get a finance reviewer.',
    },
    {
      title: 'A mistake: the real URL that did not say that',
      description:
        'A communications officer asked for industry statistics with sources. Claude supplied a real, working link to a well-known research firm. The officer pasted the stat into a press release draft because the link worked. A reviewer opened the page: it existed, but contained a different figure for a different year. The release was corrected before publication, and the team adopted a rule that every source is opened and the exact figure located, not just clicked.',
      takeaway: 'A source that exists is not the same as a source that supports the claim; read it.',
    },
    {
      title: 'Quote-and-locate on an uploaded contract',
      description:
        'A procurement specialist uploaded a vendor contract and asked for the termination terms. Rather than accept the summary, they asked Claude to quote the exact clause and give its clause number for each point. One "term" Claude had listed had no matching quote; it had been inferred from a different section. The specialist flagged the ambiguity for legal review instead of acting on the inference.',
      language: 'text',
      code: `Prompt pattern:
"For each termination condition you list, quote the exact sentence
from the attached contract and give the clause number. If you cannot
find a supporting sentence, write 'NOT FOUND' instead of inferring."`,
      takeaway: 'Forcing exact quotes from the source turns a hallucination into a visible gap you can route to legal.',
    },
  ],
  keyPoints: [
    'Match the validation technique to the claim type: cross-check text against the authoritative document, recompute numbers, triangulate research with independent sources.',
    'A source that exists is not the same as a source that supports the claim; open it and find the exact passage.',
    'Ask Claude to quote and locate the supporting passage from your uploaded material; "NOT FOUND" is better than an inference.',
    'Human expert review is mandatory for legal, medical, financial, HR-about-individuals, external communications and anything going to a regulator.',
    'Self-reported confidence is a property of the prose, not a measure of accuracy; asking Claude to rate itself is not verification.',
    'Verification means contact with something outside the conversation: the source document, the data, a second source, or a qualified person.',
    'Match verification depth to stakes, label AI-assisted drafts for reviewers, and record what was verified for high-stakes outputs.',
  ],
  flashcards: [
    { front: 'Validation technique for a numeric claim', back: 'Recompute it from the source data, in a spreadsheet or by checking the inputs used in code execution.' },
    { front: 'Validation technique for a regulatory or contractual claim', back: 'Cross-check against the authoritative original text; find and read the cited section.' },
    { front: 'Validation technique for a research claim that will drive a decision', back: 'Triangulate: at least two independent sources, each opened and read.' },
    { front: 'What is "quote-and-locate"?', back: 'Asking Claude to quote the exact passage and location in your uploaded document that supports each point, writing NOT FOUND when none exists.' },
    { front: 'Six categories where human expert review is mandatory', back: 'Legal/regulatory, medical/health/safety, financial figures and forecasts, HR decisions about individuals, external communications, and anything for regulators or auditors.' },
    { front: 'Why is Claude\'s self-reported confidence not a signal?', back: 'Confidence is a property of the generated prose; the model is equally fluent when wrong and will often rate fabricated details highly.' },
    { front: 'A working link counts as verification. True or false?', back: 'False. The page must actually contain the claimed figure or statement; open it and locate the exact passage.' },
    { front: 'What does "verification" require that "asking Claude to double-check" does not?', back: 'Contact with something outside the conversation: the source document, the data, an independent source, or a qualified human.' },
    { front: 'Why label drafts as AI-assisted when handing to a reviewer?', back: 'So the reviewer applies appropriate scrutiny and accountability stays with people.' },
  ],
  quiz: [
    {
      question:
        'Claude provides industry statistics with a real, working link to a research firm. A communications officer wants to use one statistic in a press release. What is the MOST appropriate action?',
      options: [
        'Use it; the link works, so the source is verified.',
        'Open the linked page, locate the exact figure and year, and have the comms owner review the release before publication.',
        'Ask Claude to confirm the statistic is accurate.',
        'Replace the statistic with a vaguer phrase such as "many experts agree".',
      ],
      correct: [1],
      explanation:
        'A link existing does not prove it supports the claim; the passage must be located, and external communications need human sign-off. Trusting the link (A) or asking Claude (C) is not verification; vagueness (D) weakens the release without checking anything.',
    },
    {
      question: 'Which TWO outputs require review by a qualified human before use, regardless of how good they look? (Select two)',
      options: [
        'A summary of a new regulation going to the compliance team.',
        'A list of icebreaker questions for a team meeting.',
        'A draft response to a customer complaint that will be sent externally.',
        'A first-pass outline for an internal brainstorming session.',
      ],
      correct: [0, 2],
      explanation:
        'Regulatory content and external communications carry legal and reputational consequences and must be reviewed. Icebreakers (B) and an internal brainstorm outline (D) are low stakes and can be used after a quick personal check.',
    },
    {
      question: 'A finance coordinator receives a spend forecast written as a narrative paragraph by Claude. What is the best validation step?',
      options: [
        'Ask Claude to re-read the paragraph and confirm the arithmetic.',
        'Rebuild the calculation from the source figures in a spreadsheet and compare.',
        'Accept it if the number seems reasonable.',
        'Ask Claude to express higher confidence in the result.',
      ],
      correct: [1],
      explanation:
        'Numeric claims are validated by recomputation from source data. Self-check (A) and confidence requests (D) are not verification, and plausibility (C) is how errors slip through.',
    },
    {
      question:
        'A procurement specialist asks Claude to quote the exact contract clause supporting each termination condition. One condition comes back with no quote. What should the specialist do?',
      options: [
        'Assume Claude inferred it correctly and act on it.',
        'Treat the condition as unverified and route the ambiguity to legal review.',
        'Delete the condition and never mention it.',
        'Ask Claude to write a plausible clause to fill the gap.',
      ],
      correct: [1],
      explanation:
        'A missing quote means the claim is unsupported by the document. Legal content with ambiguity goes to legal. Acting on inference (A), silently deleting (C) or fabricating text (D) are all inappropriate.',
    },
    {
      question: 'Why is asking Claude to rate its own confidence an unreliable validation method?',
      options: [
        'Claude is not permitted to discuss confidence.',
        'Confidence in generated text does not measure accuracy; fabricated details often receive high self-ratings.',
        'Claude always rates itself at the lowest level.',
        'Confidence ratings are only available through the API.',
      ],
      correct: [1],
      explanation:
        'Self-rated confidence reflects how typical the answer looks, not whether it is true. The other options describe restrictions that do not exist.',
    },
  ],
  statements: [
    { text: 'A real, working URL from Claude is sufficient proof that the cited statistic is correct.', isTrue: false, explanation: 'The page must be opened and the exact figure located; links can point to pages that say something different.' },
    { text: 'Numeric claims should be recomputed from source data rather than re-read.', isTrue: true, explanation: 'Arithmetic errors in prose are easy to miss by reading and easy to catch by recomputing.' },
    { text: 'External communications drafted with Claude can be sent without human review if the author checked the facts.', isTrue: false, explanation: 'External communications speak for the organization and require the accountable owner\'s review in addition to the author\'s checks.' },
    { text: 'Asking Claude to quote the exact supporting passage from an uploaded document is a valid validation technique.', isTrue: true, explanation: 'It turns unsupported inferences into visible gaps ("NOT FOUND") you can act on.' },
    { text: 'Asking Claude to double-check its own answer is equivalent to verification.', isTrue: false, explanation: 'Self-review may catch slips but is not contact with an outside source; verification requires the original document, data, an independent source or a qualified person.' },
    { text: 'The depth of verification should match the stakes of the output.', isTrue: true, explanation: 'An internal brainstorm needs a skim; a compliance summary needs line-by-line checking.' },
    { text: 'Recording which claims were verified, against what, and by whom supports accountability for high-stakes outputs.', isTrue: true, explanation: 'It keeps responsibility with people and speeds up future reviews.' },
  ],
  resources: [
    { label: 'Reduce hallucinations (Claude docs)', url: 'https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations' },
    { label: 'Anthropic Usage Policy', url: 'https://www.anthropic.com/legal/aup' },
  ],
};
