import type { Concept } from '../../types';

export const troubleshootingPoorOutputs: Concept = {
  id: 'troubleshooting-poor-outputs',
  title: 'Troubleshooting Poor Outputs',
  summary:
    'Diagnose why a prompt underperforms (too vague, too much at once, missing context, wrong feature or model, conflicting history), apply the matching fix, and adjust based on feedback and results.',
  certs: ['ccao-f', 'ccar-p'],
  domains: ['ccao-f-7', 'ccao-f-1', 'ccar-p-4'],
  tags: ['troubleshooting', 'diagnosis', 'prompting', 'quality'],
  difficulty: 'foundations',
  sections: [
    {
      heading: 'Diagnose before you fix',
      body: `When an output disappoints, the instinct is to retype the request with more emphasis or to reach for a bigger model. Both skip the step that matters: naming the cause. The blueprint objective is "identify, diagnose, and resolve issues with underperforming prompts or poor outputs", in that order.

Look at the output and ask which of these it most resembles:

| Symptom | Likely cause |
|---|---|
| Generic, could be for any company | Too vague: missing context, audience or specifics |
| Covers everything shallowly, misses parts | Too much at once: several tasks in one prompt |
| Confidently wrong facts | Missing source material; Claude filled gaps |
| Out of date | Wrong feature: needed research or web search, or a connector |
| Numbers do not add up | Arithmetic in prose; needed code execution |
| Ignores an instruction | Instruction buried, contradicted, or conversation too long |
| Right content, wrong shape | No format specified or wrong container (inline vs Artifact vs table) |
| Shallow reasoning on a hard case despite a clear prompt | Model tier too small for the task |
| Different users get different answers | Shared instructions or knowledge missing or conflicting |

One cause usually dominates. Fix that one, check, then move to the next. The exam often describes the symptom and asks for the "most likely cause" or the "most appropriate fix"; this table is the map.`,
    },
    {
      heading: 'Fixes by cause',
      body: `**Too vague.** Add the missing ingredient: audience, context, format, constraints, an example (see Business Prompt Fundamentals). Do not add adjectives like "better" or "more accurate".

**Too much at once.** Decompose into steps with a checkpoint after the one that feeds the rest (see Task Decomposition).

**Missing source material.** Attach the document or data. Ask Claude to quote the source for each claim and to say "not in the source" where it cannot.

**Wrong feature.** Current information needs research or web search; live internal data needs a connector; calculations need code execution; a long iterated document needs an Artifact.

**Buried or conflicting instructions.** Move must-follow rules into a numbered list at the top of the prompt or into Project instructions. If the chat is long and contradictory, summarize and restart.

**Model tier too small.** Only after the prompt is clear and the context is complete: if the task genuinely requires deep reasoning and the output still misses nuance, move up a tier. Moving up to fix a vague prompt wastes cost and does not work.

**Shared inconsistency.** Consolidate into a Project with one set of instructions and one authoritative version of each document.

A useful discipline: write the diagnosis in one sentence before editing anything, and change one thing per attempt so you learn what worked.`,
    },
    {
      heading: 'Adjusting based on feedback and results',
      body: `Troubleshooting continues after the output leaves you. Build feedback into the loop:

- **From reviewers**: when a reviewer corrects a draft, ask what kind of error it was (fact, tone, missing item, format). Patterns point at the prompt or Project instruction to change.
- **From recipients**: if readers ask the same follow-up question every time, the output is missing something; add it to the instructions.
- **From results**: if a workflow saves less time than expected, find where the time goes (review? rework? briefing?) and fix that step.
- **From Claude itself**: ask "what information would have let you do this better?" The answer is often a precise list of missing context.

Keep a short log of recurring problems and the fix that worked. In a team Project, the owner turns recurring fixes into instruction changes so everyone benefits and nobody has to rediscover them.

Knowing when a fix is not available matters too. If the information does not exist in any form you can provide, if the task requires a decision Claude should not make, or if the work needs an integration, the "fix" is to stop, route to a person, or escalate, rather than to keep prompting.`,
    },
    {
      heading: 'Exam angle: distinguishing causes in scenarios',
      body: `Scenario questions in this domain usually contain one or two clues that identify the cause. Train yourself to notice them:

- "Generic", "could apply to anyone", "did not reflect our situation" → vague prompt, missing context.
- "Covered many things briefly", "missed one of the requested items" → too much at once; decompose.
- "Cited a figure the team could not find", "mentioned a feature we do not have" → missing source; verify and attach material.
- "The data seemed old", "did not include last month's change" → wrong feature; research or connector.
- "Ignored the format I set at the start of a long session" → context problem; restart with consolidated instructions.
- "Hard case, clear prompt, shallow analysis" → model tier.
- "Teammates get different answers" → configuration; Project with shared instructions and one version of knowledge.

Distractors tend to be the generic cures: a bigger model for everything, rephrasing without new information, repeating the instruction more forcefully, or switching platforms. The correct answer names the specific cause and applies the matching fix.`,
    },
  ],
  examples: [
    {
      title: 'Diagnosing a generic policy draft',
      description:
        'A people-operations specialist asked for "a remote work policy" and got a template that could have belonged to any company. Diagnosis: too vague. The fix added the organization\'s current practice, the problems the policy must solve, the audience (all staff, many hourly), the jurisdictions involved, and a two-page limit. The second draft was specific and usable after a legal review.',
      language: 'text',
      code: `Diagnosis: generic -> missing context and audience.
One change: added current practice, problems to solve, audience,
jurisdictions, length. (No model change, no "be more specific".)
Result: specific draft; routed to legal review as policy requires.`,
      takeaway: 'Name the cause, make the one matching change, and keep required human review in place.',
    },
    {
      title: 'A mistake: upgrading the model to fix stale data',
      description:
        'A market analyst asked for "the latest competitor pricing" in a plain chat and got figures from an earlier year. They switched to the top-tier model and asked again; the figures were still old because no model tier has live web access by itself. Diagnosis: wrong feature. Using research mode, with a request to cite each price with the page date, produced current, checkable figures.',
      takeaway: 'Model tier does not make information current; stale data is a feature problem (research, web search, connector).',
    },
    {
      title: 'Turning reviewer feedback into an instruction change',
      description:
        'A grants Project produced drafts that reviewers repeatedly corrected for the same reason: the budget narrative never matched the funder\'s required categories. The Project owner logged three occurrences, then added an instruction ("use the funder\'s budget categories from the attached guidelines, in order") and a sample budget narrative to the knowledge. Corrections for that issue stopped.',
      takeaway: 'Recurring reviewer corrections are a signal to change the Project instructions, not to keep fixing drafts by hand.',
    },
  ],
  keyPoints: [
    'Diagnose before fixing: name the cause in one sentence, then make one matching change.',
    'Generic output means a vague prompt; shallow coverage means too much at once; confident wrong facts mean missing source material.',
    'Stale information or missing live data means the wrong feature (use research, web search or a connector); wrong arithmetic means use code execution.',
    'Ignored instructions in a long chat mean a context problem; consolidate and restart.',
    'Move up a model tier only when the prompt is clear, the context is complete, and the task still shows reasoning failures.',
    'Inconsistent answers across teammates point to missing shared Project instructions or conflicting knowledge.',
    'Turn recurring reviewer corrections into instruction or knowledge changes; log what worked; stop and escalate when no prompt fix exists.',
  ],
  flashcards: [
    { front: 'Output is generic and could apply to any company. Cause and fix?', back: 'Too vague; add context, audience, format, constraints or an example.' },
    { front: 'Output covers everything briefly and misses an item. Cause and fix?', back: 'Too much in one prompt; decompose into steps with checkpoints.' },
    { front: 'Output cites a figure nobody can find. Cause and fix?', back: 'Missing source material; attach the document and ask Claude to quote sources or say "not in the source".' },
    { front: 'Output uses old data. Cause and fix?', back: 'Wrong feature; use research mode, web search or a connector. Model tier does not help.' },
    { front: 'Output ignores a format rule set early in a long chat. Cause and fix?', back: 'Context problem (buried or conflicting instructions); summarize and restart with a consolidated prompt.' },
    { front: 'When is moving up a model tier the right fix?', back: 'Only when the prompt is clear, context is complete, and a genuinely hard task still shows shallow or inconsistent reasoning.' },
    { front: 'Teammates get different answers to the same question. Cause and fix?', back: 'Missing shared instructions or conflicting knowledge; consolidate in a Project with one authoritative version.' },
    { front: 'How do you use reviewer feedback for troubleshooting?', back: 'Classify each correction (fact, tone, missing item, format), look for patterns, and change the prompt or Project instruction that causes them.' },
    { front: 'Useful question to ask Claude after a poor output', back: '"What information would have let you do this better?" It often yields the exact missing context.' },
    { front: 'When is "keep prompting" the wrong response?', back: 'When the information does not exist in any form you can provide, when the task is a decision Claude should not make, or when the work needs an integration; stop, route to a person, or escalate.' },
  ],
  quiz: [
    {
      question:
        'A specialist receives a remote-work policy draft that "could belong to any company" and does not reflect the organization\'s situation. What is the MOST likely cause?',
      options: [
        'The model tier is too small.',
        'The prompt lacked context about current practice, audience, jurisdictions and constraints.',
        'Research mode was not enabled.',
        'The Project knowledge was outdated.',
      ],
      correct: [1],
      explanation:
        'Generic output is the signature of a vague prompt. Tier (A) does not supply context; research (C) is for external information; no Project was mentioned (D).',
    },
    {
      question: 'An analyst asks a plain chat for "the latest competitor pricing", gets old figures, switches to the top model, and still gets old figures. What should they do?',
      options: [
        'Ask again more forcefully with the word "current".',
        'Use research mode or web search and ask for each price with its source and date.',
        'Switch to a different AI platform.',
        'Accept the figures because two models agreed.',
      ],
      correct: [1],
      explanation:
        'Stale data is a feature problem; no tier has live access by itself. Forceful rephrasing (A) adds no capability; platform switching (C) does not address the cause; agreement between models (D) is not currency.',
    },
    {
      question: 'Which TWO symptoms most strongly suggest the prompt asked for too much at once? (Select two)',
      options: [
        'Each requested part is covered briefly and shallowly.',
        'One of the four requested items is missing entirely.',
        'The output uses the wrong language variant.',
        'The output contains a fabricated statistic.',
      ],
      correct: [0, 1],
      explanation:
        'Shallow coverage and dropped items are the signature of overloaded prompts. Language variant (C) is a format or instruction issue; fabricated statistics (D) point to missing source material.',
    },
    {
      question: 'In a 120-message chat, Claude ignores a formatting rule set at the start. What is the most appropriate fix?',
      options: [
        'Repeat the rule in capital letters.',
        'Summarize the decisions and requirements, then start a new chat with the rule in a numbered list at the top.',
        'Switch to a larger model in the same chat.',
        'Delete the formatting rule and format the output manually forever.',
      ],
      correct: [1],
      explanation:
        'Buried or conflicting instructions are a context problem; consolidating and restarting fixes it. Shouting (A) adds more history; a larger model (C) reads the same muddle; manual formatting (D) abandons the fix.',
    },
    {
      question: 'Reviewers correct the same budget-category error in every grant draft from a shared Project. What is the best response?',
      options: [
        'Keep correcting each draft by hand; it only takes a minute.',
        'Add an instruction and a sample to the Project so the error stops at the source.',
        'Ask reviewers to stop flagging it.',
        'Move the Project to a larger model.',
      ],
      correct: [1],
      explanation:
        'Recurring corrections are a signal to fix the configuration. Manual fixes (A) do not scale, suppressing feedback (C) hides the problem, and model tier (D) does not teach the funder\'s categories.',
    },
  ],
  statements: [
    { text: 'A bigger model is the right first fix for a generic output.', isTrue: false, explanation: 'Generic output comes from a vague prompt; add context first.' },
    { text: 'Diagnosing the cause in one sentence before editing the prompt improves troubleshooting.', isTrue: true, explanation: 'It targets the fix and makes the lesson reusable.' },
    { text: 'Stale information can be fixed by switching to the newest model tier.', isTrue: false, explanation: 'Currency comes from research, web search or connectors, not tier.' },
    { text: 'Recurring reviewer corrections should be turned into Project instruction or knowledge changes.', isTrue: true, explanation: 'Fixing the source stops the error for everyone.' },
    { text: 'If a long chat ignores early instructions, repeating them more forcefully is the recommended fix.', isTrue: false, explanation: 'Consolidate and restart; repetition adds to the conflicting history.' },
    { text: 'Sometimes the right response to a poor output is to stop prompting and escalate or route to a person.', isTrue: true, explanation: 'When information does not exist, a decision belongs to a human, or an integration is needed, prompting cannot fix it.' },
    { text: 'Asking Claude what information would have helped is a useful diagnostic step.', isTrue: true, explanation: 'It often produces a precise list of missing context.' },
  ],
  resources: [
    { label: 'Prompt engineering overview (Claude docs)', url: 'https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview' },
    { label: 'Reduce hallucinations (Claude docs)', url: 'https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations' },
    { label: 'Claude Help Center', url: 'https://support.claude.com/' },
  ],
};
