import type { Concept } from '../../types';

export const provenanceAndUncertaintyInSynthesis: Concept = {
  id: 'provenance-and-uncertainty-in-synthesis',
  title: 'Provenance and Uncertainty in Multi-Source Synthesis',
  summary:
    'Keep every claim attached to its source through each summarization step, annotate conflicting statistics instead of picking one, carry dates so temporal differences are not read as contradictions, and render each content type in the form that suits it.',
  certs: ['ccar-f', 'ccar-p'],
  domains: ['ccar-f-5', 'ccar-f-1', 'ccar-p-5'],
  tags: ['multi-agent', 'research-system', 'citations', 'provenance', 'synthesis', 'uncertainty'],
  difficulty: 'intermediate',
  sections: [
    {
      heading: 'How attribution gets lost',
      body: `A research pipeline has at least three compression steps: a search subagent summarizes pages into findings, a document analysis subagent summarizes papers into points, and a synthesis agent merges everything into a report. Each step is a summary of a summary. If a step emits prose ("adoption rose sharply in 2025 according to several surveys"), the link between a specific claim and the specific source that made it is gone, and no later step can restore it. The final report then cites generally or not at all, and a reader who asks "which survey said 41%?" cannot be answered.

The fix is structural, not a matter of asking the model to "cite sources." Require every subagent to emit **structured claim-source mappings**: for each finding, the claim, the supporting excerpt, the source identifier (URL or document name and location), the publication or collection date, and any methodological context (sample size, population, method). Require the synthesis agent to **preserve and merge** those mappings rather than re-describe the findings: when two sources support the same claim, the merged finding lists both sources; when they differ, both values are kept with their attribution.

Prose is the output format for the final reader. Between agents, findings travel as structured data, and provenance is a field, not a hope.`,
    },
    {
      heading: 'Conflicting statistics: annotate, do not adjudicate silently',
      body: `Two credible sources report different numbers for the same quantity: a 2025 industry survey says 41% adoption, a 2025 academic study says 28%. A synthesis agent under pressure to produce a clean narrative will pick one (often the first, the larger, or the one that fits the paragraph) and drop the other. That is a silent editorial decision made by the wrong component.

The right behaviour at each layer:

- **Document analysis subagents** complete their analysis with the conflicting values **included and explicitly annotated**: both numbers, both sources, both methodological notes (the survey sampled 500 firms self-reporting; the study measured 120 firms by audit). They do not resolve the conflict.
- **The coordinator** decides how to reconcile, if at all: present both, prefer the methodologically stronger, or flag for a human. That decision is visible in its instructions to synthesis.
- **The synthesis agent** writes the conflict into the report with attribution: "Estimates range from 28% (audit of 120 firms, Study X, 2025) to 41% (self-reported survey of 500 firms, Survey Y, 2025)."

Reports should **separate well-established findings from contested ones** in explicit sections, so readers know which conclusions rest on agreement and which on a judgment call. Preserve the original source's characterization and hedging: if the source said "preliminary," the report does not say "shows." Upgrading certainty during summarization is a form of fabrication.`,
    },
    {
      heading: 'Temporal data: a date is part of the claim',
      body: `Many apparent contradictions are differences in time. "Adoption is 28%" (data collected 2024) and "adoption is 41%" (collected 2026) are not in conflict; they describe a trend. Without dates, a synthesis agent may flag a false contradiction, or worse, average the two.

Require subagents to include **publication date and data collection date** (they differ: a 2026 paper may report 2024 data) in every structured finding. Instruct the synthesis agent to compare like with like, to describe changes over time as changes, and to prefer the most recent collection date when the question is about current state, while still citing the older figure as history.

Dates also expose staleness. A finding whose source is three years old may be the best available, but the report should say so rather than present it as current. In practice this means the finding schema has required \`published\` and \`data_as_of\` fields, and the synthesis prompt treats a missing date as a quality flag rather than something to infer.`,
    },
    {
      heading: 'Render content in the form that fits it',
      body: `A synthesis agent asked for "a report" tends to flatten everything into paragraphs. That loses information: numbers stripped of their table lose comparability, and a list of technical findings written as prose loses structure a reader needs to scan.

Instruct the synthesis agent to **render each content type appropriately**:

| Content | Render as | Why |
|---|---|---|
| Financial or statistical data | Table with source and date columns | Comparability and attribution per cell |
| News and narrative developments | Prose with inline citations | Sequence and context matter |
| Technical findings, requirements, limitations | Structured lists | Scannable, one claim per item |
| Conflicting figures | Side-by-side with method and date | Makes the disagreement legible |

Combined with the established-versus-contested split and a coverage section (which areas had unavailable sources), the report becomes something a reader can trust and audit. Exam angle: the correct answer to "sources disagree" is never "pick the more credible one and move on" at the subagent layer; it is to preserve both with attribution and let the coordinator decide. The correct answer to "the report cites nothing" is structural claim-source mapping carried through synthesis, not a stronger instruction to cite.`,
    },
  ],
  examples: [
    {
      title: 'Mistake: the citation that evaporated',
      description: `A research system's search subagent returns prose summaries per source. The synthesis agent produces a fluent report with a generic "sources indicate" phrasing and two footnotes that do not correspond to specific claims. When an analyst asks which source gave the 41% figure, nobody can tell; the number is in the report but not in any excerpt the pipeline kept.

**Fix:** search and document subagents emit a list of findings in a fixed schema; the synthesis agent is told to cite each claim with the source id from the mapping and to keep the mapping as an appendix. The report's figures become traceable to excerpts.`,
      language: 'json',
      code: `{
  "claim": "41% of mid-size firms report using generative AI in production",
  "excerpt": "Forty-one percent of respondents (n=500, firms 200-2,000 employees) reported ...",
  "source": { "name": "2025 Industry AI Survey", "url": "https://example.org/survey-2025", "location": "p. 12" },
  "published": "2025-09-14",
  "data_as_of": "2025-06",
  "method": "self-reported online survey, n=500",
  "source_characterization": "reported",
  "relevance": 0.9
}`,
      takeaway: 'Provenance survives only if it is a field in a structured finding that every later step is required to preserve.',
    },
    {
      title: 'Two credible numbers, one honest report',
      description: `A document analysis subagent finds 28% (audit study, 120 firms) while a search subagent finds 41% (self-reported survey, 500 firms) for the same year. The subagents keep both values with method notes and mark the pair as a conflict. The coordinator instructs synthesis to present the range, note the methodological difference, and place the finding in the contested section. The report reads: "Adoption estimates for 2025 range from 28% (audited sample of 120 firms, Study X) to 41% (self-reported survey of 500 firms, Survey Y); self-report methods typically over-estimate."`,
      language: 'python',
      code: `SYNTHESIS_SYSTEM = """You merge structured findings into a report.
Rules:
1. Every claim cites its source id from the findings; never drop a source.
2. If two findings give different values for the same quantity, present BOTH with
   source, method and data_as_of. Do not pick one. Do not average.
3. Sections: 'Well-established' (multiple agreeing sources) and 'Contested or single-source'.
4. Keep the source's own characterization (preliminary, estimated, reported).
5. Render statistics as tables with source and date columns; narrative as prose with
   inline citations; technical findings as lists.
6. End with a Coverage section listing topic areas with unavailable sources."""

resp = client.messages.create(model="claude-opus-5-5", max_tokens=4096,
    system=SYNTHESIS_SYSTEM,
    messages=[{"role": "user", "content": "Findings (JSON):\\n" + json.dumps(findings)}])`,
      takeaway: 'Subagents include and annotate conflicts; the coordinator decides reconciliation; synthesis presents both with attribution.',
    },
    {
      title: 'A contradiction that was a trend',
      description: `Synthesis flags "sources contradict: 28% vs 41%." On inspection, the 28% figure was collected in 2024 and the 41% in 2026. The subagents had omitted dates because the schema did not require them. After \`published\` and \`data_as_of\` become required fields and the synthesis prompt says to compare by collection date, the report correctly describes growth from 28% to 41% over two years.`,
      takeaway: 'Dates are part of the claim; without them temporal differences masquerade as contradictions.',
    },
    {
      title: 'Mistake: everything as paragraphs',
      description: `A quarterly research report converts a table of twelve companies' revenue figures, a dozen news items and a list of regulatory requirements into uniform prose. Readers cannot compare revenues, and the requirements are buried mid-paragraph.

**Fix:** the synthesis instructions specify a form per content type. Revenues become a table with a source and date per row; news items stay as short cited paragraphs in time order; requirements become a numbered list, each with its source. Length drops and comprehension rises.`,
      language: 'markdown',
      code: `## Well-established: 2025 revenue (USD bn)
| Company | Revenue | Source | Data as of |
|---|---|---|---|
| Alpha | 12.4 | Alpha 10-K | 2025-12-31 |
| Beta  |  9.1 | Beta annual report | 2025-12-31 |

## Contested: market share
- 31% (Analyst firm A, 2026-02, panel data) vs 24% (Analyst firm B, 2026-01, survey)

## Coverage
- EU regulatory filings: 1 of 3 sources unavailable (timeout); findings preliminary`,
      takeaway: 'Tables for numbers, prose for news, lists for technical findings; one format for everything destroys information.',
    },
  ],
  keyPoints: [
    'Source attribution is lost when findings are compressed as prose; require structured claim-source mappings (claim, excerpt, source URL or document name, location) from every subagent.',
    'The synthesis agent must preserve and merge claim-source mappings, not re-describe findings.',
    'Conflicting statistics from credible sources are annotated with attribution and method, never silently resolved by picking one or averaging.',
    'Document analysis completes with conflicting values included and annotated; the coordinator decides reconciliation before synthesis.',
    'Reports separate well-established findings from contested or single-source ones in explicit sections and preserve original source characterizations.',
    'Require publication and data-collection dates in structured outputs so temporal differences are not misread as contradictions.',
    'Render content by type: financial data as tables, news as prose, technical findings as structured lists.',
    'Include a coverage section so gaps from unavailable sources are visible to the reader.',
  ],
  flashcards: [
    { front: 'Why does source attribution disappear in multi-step summarization?', back: 'Each step emits prose that detaches claims from their sources; once a step drops the mapping, no later step can recover it.' },
    { front: 'What fields belong in a structured claim-source mapping?', back: 'Claim, supporting excerpt, source identifier (URL or document name and location), publication and data-collection dates, methodological context.' },
    { front: 'What must the synthesis agent do with claim-source mappings?', back: 'Preserve and merge them when combining findings, citing each claim by source rather than re-describing in unattributed prose.' },
    { front: 'Two credible sources give different statistics. What should the document analysis subagent do?', back: 'Include both values, annotated with source and method, and mark the conflict; leave reconciliation to the coordinator.' },
    { front: 'How should a final report present conflicting figures?', back: 'Both values with source, method and date, in a section for contested findings; never silently choose or average.' },
    { front: 'Why require dates in subagent outputs?', back: 'So temporal differences (2024 vs 2026 data) are interpreted as change over time rather than contradiction, and staleness is visible.' },
    { front: 'What is the difference between published date and data_as_of?', back: 'Publication is when the source appeared; data_as_of is when the data was collected. A 2026 paper may report 2024 data.' },
    { front: 'How should financial data, news and technical findings be rendered in a synthesis report?', back: 'Financial data as tables, news as prose with citations, technical findings as structured lists.' },
    { front: 'A source called its result "preliminary." How may the report describe it?', back: 'As preliminary; the report preserves the source\'s own characterization and never upgrades certainty.' },
    { front: 'What two top-level sections distinguish evidence strength in a synthesis report?', back: 'Well-established findings (multiple agreeing sources) and contested or single-source findings.' },
  ],
  quiz: [
    {
      question:
        'A research system produces fluent reports, but analysts cannot trace specific figures back to a source. What is the MOST effective change?',
      options: [
        'Add "always cite your sources" to the synthesis agent\'s system prompt.',
        'Require subagents to output structured claim-source mappings (claim, excerpt, source, date) and require the synthesis agent to preserve and merge them.',
        'Have the synthesis agent re-run web searches to find sources for each claim in its draft.',
        'Append the full text of every retrieved page to the report.',
      ],
      correct: [1],
      explanation:
        'Attribution is lost structurally at summarization steps, so the fix is structural. An instruction cannot recover mappings that were never kept; re-searching for sources after the fact invites mis-citation; appending raw pages is not provenance.',
    },
    {
      question:
        'Two credible sources report 28% and 41% for the same metric and year. How should the synthesis output handle this?',
      options: [
        'Report the average, 34.5%, as a balanced estimate.',
        'Report 41% because the survey had the larger sample.',
        'Present both values with source attribution and methodological notes in a contested-findings section.',
        'Omit the metric since the sources disagree.',
      ],
      correct: [2],
      explanation:
        'Annotating the conflict preserves information and lets readers judge. Averaging invents a number no source reported; choosing on sample size alone ignores method; omission hides a real finding.',
    },
    {
      question:
        'The synthesis agent flags a contradiction between a 28% and a 41% adoption figure. Review shows one was collected in 2024 and the other in 2026. What design change prevents this?',
      options: [
        'Instruct the synthesis agent to trust the larger number.',
        'Require publication and data-collection dates in every subagent finding and have synthesis compare by collection date.',
        'Deduplicate findings so only one figure per metric reaches synthesis.',
        'Lower the relevance threshold so more sources are included.',
      ],
      correct: [1],
      explanation:
        'Dates let the agent recognize a trend rather than a contradiction. Trusting the larger number is arbitrary; deduplication discards a legitimate data point; more sources do not fix missing metadata.',
    },
    {
      question:
        'Which TWO practices preserve information quality in a multi-source synthesis report? (Select two)',
      options: [
        'Separating well-established findings from contested ones in explicit sections.',
        'Rendering financial data as tables, news as prose and technical findings as lists.',
        'Converting all content to uniform prose for a consistent reading experience.',
        'Upgrading "preliminary" source findings to definitive statements when multiple sources agree.',
      ],
      correct: [0, 1],
      explanation:
        'Evidence-strength sections and type-appropriate rendering both help readers. Uniform prose destroys comparability and structure; upgrading certainty misrepresents the sources.',
    },
    {
      question:
        'A document analysis subagent encounters conflicting values in two papers. What should it return?',
      options: [
        'The value from the more recently published paper only.',
        'Both values, each with source, method and date, explicitly marked as a conflict, leaving reconciliation to the coordinator.',
        'An error, since the analysis cannot be completed.',
        'The mean of the two values with a note that sources varied.',
      ],
      correct: [1],
      explanation:
        'The subagent completes its analysis with the conflict annotated; the coordinator decides how to reconcile. Choosing by recency alone may be wrong (data dates differ), an error discards the work, and a mean fabricates a figure.',
    },
    {
      question:
        'A report states "studies show a 12% productivity gain" when the single underlying source described its result as "a preliminary estimate from a small pilot." What went wrong?',
      options: [
        'The source was not credible enough to include.',
        'The synthesis step dropped the source\'s characterization and methodological context, upgrading certainty.',
        'The relevance score for the source was too high.',
        'The finding should have been rendered as a table.',
      ],
      correct: [1],
      explanation:
        'Preserving the original characterization and method is a provenance requirement. Credibility and relevance are not the issue; the format is irrelevant to the certainty inflation.',
    },
  ],
  statements: [
    { text: 'Instructing the synthesis agent to "cite sources" is sufficient to preserve attribution through multiple summarization steps.', isTrue: false, explanation: 'If upstream steps emitted prose without mappings, the synthesis agent has nothing to cite; the fix is structural claim-source mappings.' },
    { text: 'When credible sources conflict, the subagent should annotate both values and let the coordinator decide how to reconcile.', isTrue: true, explanation: 'Silent selection at the subagent layer is an editorial decision made by the wrong component.' },
    { text: 'Averaging two conflicting statistics is a reasonable way to present a balanced estimate.', isTrue: false, explanation: 'It produces a number no source reported and hides the disagreement.' },
    { text: 'Publication date and data collection date can differ and both should be captured.', isTrue: true, explanation: 'A paper published in 2026 may report data from 2024; the collection date governs temporal comparison.' },
    { text: 'Converting all synthesized content to prose improves report quality by giving it a consistent voice.', isTrue: false, explanation: 'Statistics lose comparability and technical findings lose structure; render each content type appropriately.' },
    { text: 'A synthesis report should distinguish well-established findings from contested or single-source findings.', isTrue: true, explanation: 'Readers need to know which conclusions rest on agreement and which on a judgment call.' },
    { text: 'If multiple sources agree, the report may describe a source\'s "preliminary" result as established.', isTrue: false, explanation: 'Preserve the original characterization; agreement among sources does not change what each one claimed.' },
  ],
  resources: [
    { label: 'Citations (Claude docs)', url: 'https://platform.claude.com/docs/en/build-with-claude/citations' },
    { label: 'How we built our multi-agent research system (Anthropic engineering)', url: 'https://www.anthropic.com/engineering/multi-agent-research-system' },
    { label: 'Reduce hallucinations (Claude docs)', url: 'https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations' },
  ],
};
