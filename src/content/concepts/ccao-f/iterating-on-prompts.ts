import type { Concept } from '../../types';

export const iteratingOnPrompts: Concept = {
  id: 'iterating-on-prompts',
  title: 'Iterating on Prompts',
  summary:
    'Treat the first output as a diagnostic, not a verdict. Read it, name what is wrong, change one thing, and adjust your strategy to the kind of task: analysis, research, drafting or brainstorming.',
  certs: ['ccao-f'],
  domains: ['ccao-f-1', 'ccao-f-7'],
  tags: ['prompting', 'iteration', 'quality'],
  difficulty: 'foundations',
  sections: [
    {
      heading: 'The iteration loop',
      body: `Experienced users rarely get the final result on the first try, and they do not expect to. They run a loop:

1. **Read the output carefully**, not just the first paragraph. Where exactly does it fall short?
2. **Diagnose** the gap in one sentence: "too long", "wrong audience", "missing the budget constraint", "invented a statistic", "answered a different question".
3. **Change one thing** in the prompt that targets that diagnosis.
4. **Regenerate and compare** against the previous version.

Changing one thing at a time matters because if you change five things and the result improves, you do not know which change helped, and you cannot reuse the lesson next time. The exam frames this as "iterate prompts to improve output quality" and "adjust approach based on feedback and results".

A useful habit is to tell Claude what was wrong rather than only what you want: "The previous version assumed the reader knows our pricing tiers. They do not. Rewrite with a one-line explanation of each tier." Claude uses the diagnosis to avoid the same gap elsewhere.`,
    },
    {
      heading: 'Mapping symptoms to fixes',
      body: `| Symptom in the output | Likely cause | One change to try |
|---|---|---|
| Generic, could apply to any company | Missing context or audience | Add who it is for and the specific situation |
| Too long or too short | No length constraint | State word count or number of items |
| Confident but wrong facts | Claude filled gaps with plausible content | Provide the source material; ask it to quote or say "not in the source" |
| Answered a neighboring question | Ambiguous task statement | Restate the task with a verb and the exact deliverable |
| Right content, wrong tone | No tone or example given | Add a tone instruction or paste an example you like |
| Ignored a requirement | Requirement buried mid-prompt or contradicted | Move it to a numbered constraints list; remove the contradiction |
| Mixed quality across parts | Too many tasks in one prompt | Decompose into steps |

Not every gap is a prompt problem. If the task needs current information, no amount of rewording fixes a missing web search or research step. If it needs a document, upload it. Part of diagnosis is deciding whether the fix is wording, material or feature.`,
    },
    {
      heading: 'Adapting strategy by task type',
      body: `The blueprint explicitly lists four task types. Each wants a different prompting posture.

**Analysis** (data, documents, options). Supply the material, define the criteria, and ask for reasoning before conclusions: "List the evidence for and against, then give a recommendation." Ask Claude to state assumptions and uncertainties. Iterate by tightening criteria.

**Research** (gathering and synthesizing information). Scope it: time range, geography, source types. Use research mode or web search when currency matters. Ask for sources with every claim and plan to verify them. Iterate by narrowing or widening scope, never by asking Claude to "be more thorough" without saying where.

**Drafting** (emails, reports, policies). Give audience, format, tone and an example. Iterate on structure first, then wording. Ask for two variants when you are unsure of direction, pick one, then refine.

**Brainstorming** (ideas, names, approaches). Ask for quantity and variety first ("20 options across at least four different angles"), suspend judgment, then ask Claude to cluster and critique. Iterate by pushing toward the corner you liked: "more like options 4 and 11, less like 1 to 3."

The common thread: analysis and research reward constraints and evidence; drafting rewards examples and audience; brainstorming rewards volume first and selection second.`,
    },
    {
      heading: 'Knowing when to stop and when to restart',
      body: `Iteration has diminishing returns. Signs that you should stop iterating in the current chat:

- You have made three or more targeted changes and the output is oscillating rather than converging.
- Claude keeps reintroducing something you asked it to remove. The conversation history now contains conflicting instructions, and the clean fix is a fresh chat with a consolidated prompt.
- The gap is not something a prompt can fix: the information does not exist in what you gave it, or the task needs a different feature (research, a connector, code execution).

When you restart, write the new prompt as if it were the first: include every lesson from the iterations as an explicit instruction. That consolidated prompt is also the one worth saving as a template or Skill if you will do the task again (see Optimizing Workflows).

Also know when "good enough" is reached. A first draft for a colleague to edit does not need the polish of a board paper. Matching effort to stakes is itself a skill the exam rewards.`,
    },
  ],
  examples: [
    {
      title: 'Three targeted iterations on a status update',
      description:
        'A project coordinator needed a weekly status email. Version 1 was generic. Each iteration changed one thing based on a one-line diagnosis, and each change was a reusable lesson.',
      language: 'text',
      code: `v1 prompt: "Write a status update for the website project."
Diagnosis: generic, no real content.
v2 change: pasted the task tracker export and said "use only this data."
Diagnosis: accurate but 600 words; sponsor will not read it.
v3 change: "Max 150 words. Lead with the one decision needed from
          the sponsor, then three bullets: done, next, blocked."
Diagnosis: good. Saved as the weekly template.`,
      takeaway: 'One diagnosis, one change, one comparison per round; the lessons compound into a reusable template.',
    },
    {
      title: 'A mistake: iterating on wording when the problem was missing information',
      description:
        'A marketing lead asked Claude for "the latest statistics on remote work adoption" in a plain chat, got figures that looked dated, and spent four rounds rewording the request ("most recent", "2026 data", "be current"). The output did not improve because the task needed research mode or web search, not better adjectives. Switching to research mode and asking for sources with dates solved it in one pass.',
      takeaway: 'Diagnose whether the gap is wording, material or feature before iterating; adjectives cannot replace a missing capability.',
    },
    {
      title: 'Brainstorm wide, then narrow',
      description:
        'An internal comms manager needed a name for an employee recognition program. The first prompt asked for "a good name" and got one safe suggestion. The rewrite asked for 25 names across five angles (values, nature, teamwork metaphors, playful, formal), then "cluster these and tell me which three best fit a conservative finance culture and why." The final pick came from a cluster the manager would not have thought to ask for.',
      language: 'text',
      code: `Round 1: "Give me 25 names for an employee recognition program.
          Spread them across five different angles. No judgment yet."
Round 2: "Cluster them by angle. Which three best fit a conservative
          finance culture? Explain in one line each."
Round 3: "More like 'Cornerstone' and 'Keystone'; fewer puns."`,
      takeaway: 'For brainstorming, ask for volume and variety first, then steer toward the corner you liked.',
    },
  ],
  keyPoints: [
    'Treat the first output as a diagnostic; read it fully and name the gap in one sentence before changing anything.',
    'Change one thing per round so you learn which change worked and can reuse the lesson.',
    'Tell Claude what was wrong with the previous version, not only what you want now.',
    'Some gaps are not prompt problems: missing material or a missing feature (research, connector) needs a different fix.',
    'Analysis and research reward criteria, scope and evidence; drafting rewards audience and examples; brainstorming rewards volume first, selection second.',
    'When a chat accumulates conflicting instructions, restart with a consolidated prompt that encodes every lesson.',
    'Match iteration effort to stakes; a draft for a colleague does not need board-paper polish.',
  ],
  flashcards: [
    { front: 'The four steps of the iteration loop', back: 'Read the output carefully, diagnose the gap in one sentence, change one thing, regenerate and compare.' },
    { front: 'Why change only one thing per iteration?', back: 'So you know which change caused the improvement and can reuse that lesson.' },
    { front: 'Output is confident but contains wrong facts. First fix to try?', back: 'Provide the source material and ask Claude to quote it or say when something is not in the source.' },
    { front: 'Prompting posture for analysis tasks', back: 'Supply material, define criteria, ask for evidence and reasoning before the recommendation, ask for assumptions.' },
    { front: 'Prompting posture for research tasks', back: 'Scope by time, place and source type; use research mode when currency matters; require sources; verify them.' },
    { front: 'Prompting posture for brainstorming', back: 'Ask for quantity and variety first, suspend judgment, then cluster, critique and steer toward the preferred corner.' },
    { front: 'Prompting posture for drafting', back: 'Give audience, format, tone and an example; iterate on structure first, then wording; ask for two variants when unsure.' },
    { front: 'Claude keeps reintroducing something you asked it to remove. What is happening?', back: 'The chat history holds conflicting instructions. Start a fresh chat with a consolidated prompt.' },
    { front: 'Rewording did not fix a request for current statistics. Why?', back: 'The gap was a missing capability (research mode or web search), not wording.' },
  ],
  quiz: [
    {
      question:
        'An analyst gets a 600-word summary when the sponsor wanted something readable in a minute, and the summary buries the one decision needed. What is the MOST effective single change?',
      options: [
        'Ask Claude to "make it better".',
        'Add a 150-word limit and instruct Claude to lead with the decision required, then regenerate.',
        'Switch to a smaller, faster model.',
        'Ask Claude to add headings to the 600-word version.',
      ],
      correct: [1],
      explanation:
        'The diagnosis is length and ordering; the fix targets both. "Make it better" (A) gives no direction; a smaller model (C) does not change the instructions; headings (D) keep the length problem.',
    },
    {
      question:
        'A marketing lead asks a plain chat for "the latest remote work statistics" and keeps rewording the request when the figures look dated. What should they do instead?',
      options: [
        'Keep adding words like "current" and "2026" until the figures update.',
        'Use research mode or web search and ask for sources with dates.',
        'Ask Claude to estimate the current figures from trends.',
        'Switch to the most capable model, which has more recent knowledge.',
      ],
      correct: [1],
      explanation:
        'The task needs current information, which requires a research capability. Rewording (A) cannot add knowledge; estimating (C) produces unverifiable numbers; model size (D) does not make training data current.',
    },
    {
      question: 'Which TWO practices make iteration more effective? (Select two)',
      options: [
        'Changing one targeted thing per round and comparing with the previous version.',
        'Changing as many things as possible each round to converge faster.',
        'Telling Claude specifically what was wrong with the previous output.',
        'Regenerating repeatedly with the identical prompt until a better version appears.',
      ],
      correct: [0, 2],
      explanation:
        'Single targeted changes make lessons reusable, and naming the flaw helps Claude avoid it. Changing everything at once (B) hides what worked; blind regeneration (D) is luck, not iteration.',
    },
    {
      question: 'An internal comms manager wants program names and received one safe suggestion. Which prompting strategy best fits brainstorming?',
      options: [
        'Ask for the single best name with a justification.',
        'Ask for 20 to 30 names across several distinct angles, then ask Claude to cluster and critique them.',
        'Provide strict criteria and ask for exactly three compliant names.',
        'Ask Claude to pick a name that a competitor uses and adapt it.',
      ],
      correct: [1],
      explanation:
        'Brainstorming rewards volume and variety before selection. Single-answer (A) and tight criteria (C) narrow too early; copying a competitor (D) is inappropriate and does not generate options.',
    },
    {
      question:
        'After five rounds, Claude keeps reinserting a paragraph the user asked it to remove, and earlier instructions seem forgotten. What is the most appropriate action?',
      options: [
        'Repeat the removal instruction in capital letters.',
        'Start a new chat with a consolidated prompt that includes every requirement learned so far.',
        'Ask Claude why it keeps disobeying.',
        'Accept the paragraph since Claude seems to insist on it.',
      ],
      correct: [1],
      explanation:
        'The chat now contains conflicting instructions. A consolidated fresh prompt removes the conflict. Shouting (A) or interrogating (C) leaves the conflicting history; accepting (D) abandons the requirement.',
    },
  ],
  statements: [
    { text: 'The first output from Claude should be read as a diagnostic rather than a final answer.', isTrue: true, explanation: 'Experienced users expect to iterate; the first draft tells you what the prompt was missing.' },
    { text: 'Changing several prompt elements at once is the fastest way to learn what works.', isTrue: false, explanation: 'If the result improves you cannot tell which change helped; change one thing per round.' },
    { text: 'For research tasks, asking Claude to "be more thorough" is a well-targeted iteration.', isTrue: false, explanation: 'It gives no direction. Narrow or widen the scope (time, geography, source types) explicitly.' },
    { text: 'Brainstorming benefits from asking for many varied options before any selection.', isTrue: true, explanation: 'Volume and variety first, then clustering and critique, surfaces options you would not have asked for.' },
    { text: 'Every poor output can be fixed by better wording.', isTrue: false, explanation: 'Some gaps need missing material or a different feature such as research mode or a connector.' },
    { text: 'Telling Claude what was wrong with the last version helps it avoid the same gap elsewhere.', isTrue: true, explanation: 'A diagnosis generalizes better than a single corrective instruction.' },
    { text: 'When a long chat has conflicting instructions, a fresh chat with a consolidated prompt is a legitimate fix.', isTrue: true, explanation: 'It removes the contradictory history that is causing Claude to oscillate.' },
  ],
  resources: [
    { label: 'Prompt engineering overview (Claude docs)', url: 'https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview' },
    { label: 'Use examples (multishot prompting)', url: 'https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/multishot-prompting' },
  ],
};
