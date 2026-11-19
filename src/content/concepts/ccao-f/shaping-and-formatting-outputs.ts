import type { Concept } from '../../types';

export const shapingAndFormattingOutputs: Concept = {
  id: 'shaping-and-formatting-outputs',
  title: 'Shaping and Formatting Outputs',
  summary:
    'Edit and adapt Claude\'s output for the real audience, compare drafts deliberately, and choose the right container: inline text, an Artifact, or structured data such as a table or CSV.',
  certs: ['ccao-f'],
  domains: ['ccao-f-2', 'ccao-f-3'],
  tags: ['formatting', 'artifacts', 'audience', 'curation'],
  difficulty: 'foundations',
  sections: [
    {
      heading: 'Adapting for the intended audience',
      body: `An accurate output is not finished until it fits the person who will read it. The blueprint calls this "edit, adapt, refine, and compare outputs for the intended audience". The levers:

- **Depth**: executives want the decision and two reasons; specialists want the method and the caveats.
- **Vocabulary**: replace internal acronyms for external readers; replace jargon for non-specialists; keep precise terms for experts.
- **Order**: lead with what the reader needs to do or decide; background goes after, or in an appendix.
- **Tone**: match the organization's voice and the relationship (a regulator, a customer, a colleague).
- **Length**: shorter is usually better; cut anything the reader will not act on.

You can do this editing yourself, or ask Claude: "Rewrite this for a reader who has two minutes and no finance background. Keep every number." Say what must survive the rewrite, or Claude may trim facts along with words.

Always re-check facts after an adaptation. Simplifying a sentence can change its meaning ("may be liable" becoming "is liable"), and that is a new error you introduced.`,
    },
    {
      heading: 'Comparing drafts',
      body: `Asking for two or three versions and choosing between them is one of the most productive ways to use Claude for writing. To compare well:

- **Set the criteria before you look.** Clarity for the audience, accuracy, tone, length, actionability. Without criteria, you pick the one that sounds nicest.
- **Vary one dimension across drafts.** Same facts, different structure; or same structure, different tone. If everything differs, you cannot say why one wins.
- **Ask Claude to compare too**, but as input, not verdict: "Which draft better meets these criteria, and what does each do that the other lacks?" Then combine: "Use draft B's structure with draft A's opening."
- **Keep the losing drafts** until the final is approved; a rejected paragraph is often the right one for a different audience.

For important documents, compare the final against the original brief, not against the other drafts. It is possible for the best of three drafts to still miss a requirement.`,
    },
    {
      heading: 'Inline, Artifact or structured data',
      body: `Claude can deliver output in different containers, and picking the right one is an exam objective.

| Container | Use when | Examples |
|---|---|---|
| **Inline response** | The answer is short, conversational, or a step in an ongoing discussion; you will read it once | A quick explanation, a reply to a question, an interim result in a decomposed task |
| **Artifact** | The output is a standalone document, something you will edit, iterate on, share, or reuse | A policy draft, a one-page brief, a slide outline, a diagram, an interactive checklist, a simple calculator |
| **Structured data** (table, CSV, JSON-like list) | The content is rows and columns, will be sorted or filtered, or will move into a spreadsheet or another system | Vendor comparison, action-item tracker, extracted fields from many documents |

Artifacts appear in their own panel beside the chat, keep their own version history as you iterate, and can be shared or downloaded. They are the right home for anything you would otherwise copy into a document. A long memo delivered inline is harder to edit and easy to lose in the scroll.

Structured data should be requested explicitly: "Return a table with columns: vendor, annual cost, contract end date, risk notes." If it is going into a spreadsheet, ask for CSV. If it is going into another tool, ask for the exact field names that tool expects.`,
    },
    {
      heading: 'Organizing and curating information',
      body: `Much Associate work is turning a pile of material (meeting notes, survey responses, emails, reports) into something a reader can use. Claude is good at this when you tell it the organizing principle.

- **Choose the structure first**: by theme, by stakeholder, by timeline, by priority, by decision required. Say which, or ask Claude to propose two and pick one.
- **Separate facts from interpretation**: "Section 1: what the data says. Section 2: what it might mean. Section 3: open questions."
- **Curate, do not just compress.** Summarizing everything equally produces mush. Tell Claude what matters to this reader and what can be dropped or moved to an appendix.
- **Preserve traceability.** Ask for a reference back to the source for each point (document name, respondent ID, date) so a reader can drill down and so you can verify.
- **Use consistent terminology.** Ask Claude to normalize names and labels across sources (one product name, one date format).

A curated output should let the reader find what they need in under a minute and trust that nothing important was left out silently. If something was deliberately excluded, say so.`,
    },
  ],
  examples: [
    {
      title: 'Same analysis, three audiences',
      description:
        'A customer success manager had Claude analyze 200 churn survey responses. The analysis was correct but was a wall of text. She asked for three outputs from the same analysis: a five-bullet inline summary for her own notes, an Artifact one-pager for the leadership meeting with the three biggest drivers and one recommendation each, and a CSV table of every coded response for the product team to filter.',
      language: 'text',
      code: `"From the analysis above, produce:
1) Five bullets for me, inline.
2) A one-page brief as an artifact for leadership: three drivers,
   one recommendation each, no jargon, under 300 words.
3) A CSV with columns: response_id, driver_code, quote, severity,
   for the product team."`,
      takeaway: 'The right container depends on who uses the output and what they will do with it; one analysis can feed all three.',
    },
    {
      title: 'A mistake: simplifying away the meaning',
      description:
        'An HR coordinator asked Claude to make a benefits explanation "simpler for all staff". The rewrite was clear and friendly, but "employees may be eligible after a 90-day review" had become "employees are eligible after 90 days". Several staff made plans on the new wording. The fix was to re-check facts after every adaptation and to tell Claude explicitly: "keep all conditions and qualifiers exactly as stated".',
      takeaway: 'Adaptation can change meaning; re-verify facts and qualifiers after every rewrite.',
    },
    {
      title: 'Comparing drafts with criteria',
      description:
        'A grants writer asked for two versions of a project narrative: one leading with community impact, one leading with the evidence base. Before reading, she wrote down the funder\'s stated priorities. Draft B matched the priorities but had a weaker opening, so she asked Claude to merge B\'s structure with A\'s first paragraph, then checked the result against the funder\'s guidelines, not against the drafts.',
      takeaway: 'Set criteria before comparing, vary one dimension between drafts, and check the winner against the original brief.',
    },
  ],
  keyPoints: [
    'Adapt depth, vocabulary, order, tone and length to the actual reader, and say what must survive the rewrite.',
    'Re-verify facts and qualifiers after any adaptation; simplification can change meaning.',
    'Compare drafts against criteria set in advance, vary one dimension at a time, and check the final against the original brief.',
    'Use inline responses for short, conversational or interim content.',
    'Use Artifacts for standalone documents and anything you will edit, iterate on, share or reuse; they live in their own panel with version history.',
    'Use structured data (tables, CSV) for rows and columns, for sorting and filtering, or when the output moves into a spreadsheet or another tool; specify the columns.',
    'Curate rather than compress: state the organizing principle, separate facts from interpretation, keep source references, and say what was excluded.',
  ],
  flashcards: [
    { front: 'Five levers for adapting an output to an audience', back: 'Depth, vocabulary, order, tone, length.' },
    { front: 'What should you do immediately after asking Claude to simplify a text?', back: 'Re-check facts and qualifiers; simplification can turn "may be eligible" into "is eligible".' },
    { front: 'When is an inline response the right container?', back: 'Short, conversational or interim content you will read once in the flow of the chat.' },
    { front: 'When is an Artifact the right container?', back: 'Standalone documents and anything you will edit, iterate on, share or reuse: briefs, policies, outlines, diagrams, interactive checklists.' },
    { front: 'When is structured data (table or CSV) the right container?', back: 'Rows-and-columns content that will be sorted, filtered or imported into a spreadsheet or another system.' },
    { front: 'How should you compare two drafts?', back: 'Set criteria first, vary one dimension between them, use Claude\'s comparison as input not verdict, and check the winner against the original brief.' },
    { front: 'Difference between curating and compressing', back: 'Compressing summarizes everything equally; curating keeps what matters to this reader, drops or appendixes the rest, and says what was excluded.' },
    { front: 'Why ask for source references in a curated summary?', back: 'So readers can drill down and so you can verify each point against its origin.' },
    { front: 'What do Artifacts provide that inline text does not?', back: 'A separate panel, version history as you iterate, and easy sharing or download.' },
  ],
  quiz: [
    {
      question:
        'A customer success manager has Claude analyze 200 survey responses and needs the product team to filter the coded responses by driver and severity. Which output format fits best?',
      options: [
        'A long inline narrative describing each response.',
        'A CSV or table with one row per response and columns for driver code, quote and severity.',
        'An Artifact containing a formatted essay.',
        'A bulleted list of the ten most interesting quotes.',
      ],
      correct: [1],
      explanation:
        'Filtering and sorting require structured rows and columns. Narrative (A), an essay Artifact (C) or a highlights list (D) cannot be filtered and lose the complete dataset.',
    },
    {
      question: 'An associate is drafting a two-page policy that will go through several revisions and be shared with a working group. Which container is most appropriate?',
      options: [
        'Inline text in the chat.',
        'An Artifact, so the document has its own panel and version history and can be shared.',
        'A CSV file.',
        'A series of short chat messages, one per section.',
      ],
      correct: [1],
      explanation:
        'A standalone, iterated, shared document is the core Artifact use case. Inline text (A, D) is hard to edit and gets lost; CSV (C) is for tabular data.',
    },
    {
      question:
        'After asking Claude to "make this benefits explanation simpler", an HR coordinator notices staff acting on a condition that no longer appears in the text. What went wrong and what should be done?',
      options: [
        'Claude refused to simplify; ask again more firmly.',
        'The simplification changed the meaning by dropping a qualifier; re-verify facts after adaptation and instruct Claude to keep all conditions exactly.',
        'Staff misread the text; no change is needed.',
        'Simplification is not possible for benefits content; revert to the original.',
      ],
      correct: [1],
      explanation:
        'Rewrites can alter meaning. The fix is to re-check after adaptation and to constrain what must survive. Blaming staff (C) or abandoning simplification (D) does not address the process gap; option A misdescribes what happened.',
    },
    {
      question: 'Which TWO practices make comparing two Claude drafts more reliable? (Select two)',
      options: [
        'Writing down the selection criteria before reading either draft.',
        'Asking Claude to vary everything between the drafts so the differences are obvious.',
        'Checking the chosen draft against the original brief rather than only against the other draft.',
        'Choosing the draft that reads most smoothly.',
      ],
      correct: [0, 2],
      explanation:
        'Criteria first prevents picking by polish, and checking against the brief catches shared omissions. Varying everything (B) hides why one wins; smoothness (D) is not a quality criterion.',
    },
    {
      question: 'A manager asks Claude to turn 40 pages of meeting notes into something leadership can use. Which instruction best supports curation rather than compression?',
      options: [
        '"Summarize everything in two pages."',
        '"Organize by decision required; for each, give the options discussed, the recommendation, and a reference to the meeting date. Move background to an appendix and list what you left out."',
        '"Make it shorter."',
        '"Pick the most interesting parts."',
      ],
      correct: [1],
      explanation:
        'Option B states the organizing principle, preserves traceability, and makes exclusions explicit. Options A and C compress without a principle; D delegates the judgment of what matters without stating the reader\'s needs.',
    },
  ],
  statements: [
    { text: 'An accurate output may still need editing before it is fit for its audience.', isTrue: true, explanation: 'Depth, vocabulary, order, tone and length all depend on the reader.' },
    { text: 'Artifacts are only for code.', isTrue: false, explanation: 'Artifacts hold documents, briefs, outlines, diagrams, interactive checklists and other standalone outputs.' },
    { text: 'Simplifying a text for a general audience never changes its factual meaning.', isTrue: false, explanation: 'Dropping qualifiers can change meaning; re-verify after adaptation.' },
    { text: 'When output will be imported into a spreadsheet, you should ask for CSV with named columns.', isTrue: true, explanation: 'Explicit structure and column names make the handoff reliable.' },
    { text: 'The best of three drafts is guaranteed to meet the original requirements.', isTrue: false, explanation: 'All three can share the same omission; check the winner against the brief.' },
    { text: 'A good curated summary states what was deliberately excluded.', isTrue: true, explanation: 'Readers need to trust nothing important was silently dropped.' },
    { text: 'Inline responses are the best container for a long policy document that will be revised many times.', isTrue: false, explanation: 'That is an Artifact use case; inline text is for short or interim content.' },
  ],
  resources: [
    { label: 'Claude Help Center: Artifacts', url: 'https://support.claude.com/' },
    { label: 'Prompt engineering overview (Claude docs)', url: 'https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview' },
  ],
};
