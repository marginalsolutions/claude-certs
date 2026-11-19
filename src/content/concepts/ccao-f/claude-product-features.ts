import type { Concept } from '../../types';

export const claudeProductFeatures: Concept = {
  id: 'claude-product-features',
  title: 'Claude Product Features at a Glance',
  summary:
    'What each Claude surface and feature is for (chat, Projects, Artifacts, research, memory, Skills, code execution, connectors, Desktop, Chrome, Claude Code) and how to pick the right one for a task.',
  certs: ['ccao-f'],
  domains: ['ccao-f-3', 'ccao-f-4', 'ccao-f-5'],
  tags: ['products', 'features', 'projects', 'artifacts', 'connectors'],
  difficulty: 'foundations',
  diagram: 'claude-product-surfaces',
  sections: [
    {
      heading: 'The surfaces: where you meet Claude',
      body: `Claude is available through several surfaces. The exam expects you to know what each is for, not how it is built.

- **Claude web and mobile apps (claude.ai)**: the standard chat experience with Projects, Artifacts, research, memory, Skills and connectors.
- **Claude Desktop** (Mac and Windows): the same experience as an installed app, plus the ability to connect to local tools and files on your computer through desktop connectors (MCP servers that run on your machine). Good for people who want Claude working alongside their desktop applications.
- **Claude for Chrome**: a browser extension that lets Claude see and act in your browser tabs: filling forms, navigating sites, extracting information from pages you are already logged into. Useful for web-based repetitive tasks; treat its actions like you would an assistant with your browser session, and review before anything irreversible.
- **Claude Code**: a terminal-based coding agent for software developers. Associates should know it exists and that requests involving codebases, deployments or building integrations are escalation points to Developers and Architects, not something to attempt in chat.
- **The Claude Developer Platform (API)**: how developers build their own applications on Claude. Out of scope for Associate hands-on work, in scope as "know when to escalate".`,
    },
    {
      heading: 'Features inside the chat experience',
      body: `| Feature | What it does | Reach for it when |
|---|---|---|
| **Chat** | A single conversation with full history | One-off questions, exploration, a step in a decomposed task |
| **Projects** | A workspace with standing instructions and a knowledge base shared across many chats | Repeated work on the same subject, team workflows, anything needing the same background every time |
| **Artifacts** | Standalone outputs (documents, tables, diagrams, interactive pages) in their own panel with version history | Anything you will edit, iterate on, share or reuse |
| **Research** | Claude plans and runs many searches across the web and your connected sources, then writes a cited report | Questions needing current, multi-source information with citations |
| **Memory** | Claude can remember context across conversations (preferences, ongoing projects), with controls to view, edit, or turn it off; incognito chats leave no memory | Reducing repeated setup, keeping continuity across sessions |
| **Skills** | Packaged instructions and resources Claude loads when relevant (built-in skills for documents, spreadsheets, presentations; custom skills you or your organization create) | Repeatable procedures and house formats |
| **Code execution / analysis** | Claude writes and runs code in a sandbox to analyze data, make charts, produce files | Spreadsheets, calculations, data cleaning, charts, generating documents |
| **Connectors** | Secure links to tools like Google Drive, Gmail, Calendar, Slack and others via MCP | Working with information that lives in those tools instead of pasting it |

These combine. A Project can hold connectors and Skills; research can draw on connected sources; results can land in Artifacts.`,
    },
    {
      heading: 'Choosing a feature for a task',
      body: `A simple decision path:

1. **Is this a one-off or will it repeat?** Repeating work belongs in a Project (shared context) and possibly a Skill (shared procedure).
2. **Does Claude need information it does not have?** If it is in a file, upload it. If it lives in Drive, Gmail or Slack, use a connector. If it is on the public web and must be current, use research or web search.
3. **Does it involve numbers, data files or charts?** Use code execution so calculations are computed, not written as prose.
4. **Is the output a document or something you will iterate on?** Ask for an Artifact.
5. **Does it involve acting in web apps you are logged into?** Claude for Chrome.
6. **Does it involve code, systems, APIs or deployments?** Escalate to a Developer or Architect; mention Claude Code as the tool they will likely use.

Common exam distractors: using plain chat with pasted snippets when a Project would hold the knowledge; asking Claude to "estimate" data a connector could fetch exactly; asking for current facts in a plain chat when research mode exists; and trying to build an integration yourself instead of escalating.`,
    },
    {
      heading: 'Limits and responsible use of features',
      body: `Each feature has boundaries you should know:

- **Research** is only as good as its sources; it cites them, and you still open the ones that matter (see Fact-Checking and Human Review).
- **Memory** is convenient but means Claude may carry context between unrelated conversations. Use incognito chats for sensitive one-offs and review stored memory periodically. Organizational settings may govern whether memory is available.
- **Connectors** act with your permissions. Claude can reach what you can reach in that tool, so think about what a prompt could cause Claude to read or send, and follow your organization's rules on which connectors are approved.
- **Code execution** runs in a sandbox and works on the files you give it; results still need checking against the inputs.
- **Claude for Chrome** acts in your browser as you; review before purchases, submissions or anything hard to undo.
- **Plans differ.** Availability of features, usage limits, and administrative controls vary between Free, Pro, Max, Team and Enterprise plans. Team and Enterprise add admin controls over which features and connectors are enabled.

The Associate role is to use these features well and know their edges, not to configure enterprise deployments.`,
    },
  ],
  examples: [
    {
      title: 'Choosing the feature for a weekly competitor digest',
      description:
        'A product marketer compiled a weekly competitor digest by hand. They moved to a Project holding the competitor list, the digest template and instructions on tone; each week they run research mode inside the Project for "changes since last Monday", review the cited report, and have Claude produce the digest as an Artifact to paste into the team channel.',
      takeaway: 'Project for standing context, research for current sourced information, Artifact for the shareable output.',
    },
    {
      title: 'A mistake: asking chat to estimate what a connector could fetch',
      description:
        'An operations analyst asked Claude in a plain chat "roughly how many support tickets did we close last month?" and got a confident guess framed as an estimate. Claude had no access to the ticket system. The analyst nearly used the figure in a report. The fix was to export the ticket data (or connect the tool where a connector existed) and use code execution to compute the exact count.',
      takeaway: 'If data exists somewhere, give Claude access to it rather than asking it to guess; use code execution for the arithmetic.',
    },
    {
      title: 'Recognizing an escalation point',
      description:
        'An HR coordinator wanted Claude to "automatically pull new hires from the HR system every night and create onboarding checklists". That requires an integration with the HR system and scheduled automation. The coordinator documented the requirements (triggers, fields, outputs, approvals) and escalated to a Developer, who built it; the coordinator then owned the Project that holds the checklist templates and instructions.',
      takeaway: 'Associates specify and escalate integrations; they own the instructions and knowledge that the integration uses.',
    },
  ],
  keyPoints: [
    'Surfaces: web and mobile apps, Claude Desktop (adds local desktop connectors), Claude for Chrome (acts in your browser), Claude Code (developer terminal tool, an escalation point), and the API for developers.',
    'Projects hold standing instructions plus a knowledge base shared across many chats; use them for any repeated work.',
    'Artifacts hold standalone outputs with version history; research mode produces cited multi-source reports.',
    'Memory carries context across conversations and can be viewed, edited or turned off; incognito chats leave no memory.',
    'Skills package repeatable procedures; code execution computes rather than estimates; connectors reach data in tools like Drive, Gmail and Slack with your permissions.',
    'Choose a feature by asking: does it repeat, does Claude need outside information, does it involve data, is the output a document, does it act in a browser, does it involve code or systems.',
    'Requests involving integrations, codebases or deployments are escalated to Developers and Architects.',
  ],
  flashcards: [
    { front: 'What is a Project?', back: 'A workspace with standing instructions and a knowledge base shared across many chats; the home for repeated work and team workflows.' },
    { front: 'What is an Artifact?', back: 'A standalone output (document, table, diagram, interactive page) shown in its own panel with version history, easy to edit, share and reuse.' },
    { front: 'When should you use research mode instead of a plain chat?', back: 'When the answer needs current, multi-source information with citations.' },
    { front: 'What does code execution give you that plain chat does not?', back: 'Calculations, data analysis, charts and generated files that are computed by running code rather than written as prose.' },
    { front: 'What are connectors?', back: 'Secure, MCP-based links to tools such as Google Drive, Gmail, Calendar and Slack so Claude can work with information that lives there, using your permissions.' },
    { front: 'What is a Skill in claude.ai?', back: 'Packaged instructions and resources Claude loads when relevant; built-in ones handle documents, spreadsheets and presentations, and you can create custom ones for repeatable procedures.' },
    { front: 'What does Claude Desktop add over the web app?', back: 'An installed app that can connect to local tools and files on your computer through desktop connectors.' },
    { front: 'What is Claude for Chrome?', back: 'A browser extension that lets Claude see and act in your browser tabs; review before irreversible actions.' },
    { front: 'What is Claude Code and why should an Associate know about it?', back: 'A terminal-based coding agent for developers; it marks the kind of work (code, integrations, deployments) Associates escalate.' },
    { front: 'How does memory interact with sensitive one-off conversations?', back: 'Use an incognito chat so nothing is stored to memory; review and edit stored memory periodically.' },
  ],
  quiz: [
    {
      question:
        'A marketing team produces a weekly digest using the same competitor list, template and tone rules. Team members currently paste these into a new chat every week. What is the MOST appropriate improvement?',
      options: [
        'Keep pasting but use a more capable model.',
        'Create a Project holding the list, template and instructions, and run each week\'s digest as a chat inside it.',
        'Ask Claude to remember the template through memory alone.',
        'Switch to Claude Code to automate the digest.',
      ],
      correct: [1],
      explanation:
        'Repeated work with shared context is exactly what Projects are for. Model choice (A) does not address repetition; memory (C) is personal and not a reliable shared knowledge base; Claude Code (D) is a developer tool, not needed for this.',
    },
    {
      question: 'An analyst needs an exact count of tickets closed last month. The data is in a tool with an approved connector. Which approach is best?',
      options: [
        'Ask Claude in a plain chat for its best estimate.',
        'Use the connector to retrieve the data and code execution to compute the count.',
        'Describe the ticket system to Claude and ask it to infer the number.',
        'Ask Claude to search the web for the company\'s ticket volume.',
      ],
      correct: [1],
      explanation:
        'Exact data should be fetched and computed, not guessed. Estimating (A, C) produces unverifiable numbers; the web (D) will not have internal data.',
    },
    {
      question: 'Which TWO tasks are good fits for research mode rather than a standard chat response? (Select two)',
      options: [
        'A report on regulatory changes in the last six months across three countries, with citations.',
        'Rewording a paragraph to be friendlier.',
        'A comparison of five vendors\' current pricing pages and recent announcements.',
        'Brainstorming names for a team newsletter.',
      ],
      correct: [0, 2],
      explanation:
        'Research mode suits current, multi-source, citation-heavy questions. Rewording (B) and brainstorming (D) need no outside information.',
    },
    {
      question:
        'An HR coordinator wants new hires pulled automatically from the HR system each night to create onboarding checklists. What should the coordinator do?',
      options: [
        'Attempt to build the integration in chat by pasting system credentials.',
        'Document the requirements and escalate to a Developer or Architect, then own the Project holding the checklist templates and instructions.',
        'Manually paste each new hire into chat every morning indefinitely.',
        'Decline the request because Claude cannot help with onboarding.',
      ],
      correct: [1],
      explanation:
        'Scheduled integrations with internal systems are developer work; the Associate specifies, escalates and owns the instructions and knowledge. Pasting credentials (A) is unsafe; manual pasting (C) ignores the automation goal; declining (D) is unnecessary.',
    },
    {
      question: 'A user has a sensitive one-off conversation and does not want it to influence future chats. What is the most appropriate step?',
      options: [
        'Use an incognito chat so nothing is saved to memory.',
        'Ask Claude at the end to "forget this conversation".',
        'Delete the Project afterwards.',
        'Use a smaller model, which has no memory.',
      ],
      correct: [0],
      explanation:
        'Incognito chats are designed for this. Asking Claude to forget (B) is not a control; deleting a Project (C) is unrelated; model size (D) has nothing to do with memory.',
    },
  ],
  statements: [
    { text: 'Projects let many chats share the same instructions and knowledge base.', isTrue: true, explanation: 'That is their core purpose: standing context for repeated work.' },
    { text: 'Artifacts are only available to developers using the API.', isTrue: false, explanation: 'Artifacts are a claude.ai feature available to all chat users.' },
    { text: 'Research mode produces a report with citations drawn from multiple searches.', isTrue: true, explanation: 'It plans and runs many searches across the web and connected sources and cites what it used.' },
    { text: 'Connectors give Claude broader access to a tool than the user has.', isTrue: false, explanation: 'Connectors act with the user\'s permissions; Claude can reach what the user can reach.' },
    { text: 'Claude Code is the recommended tool for an Associate to draft a marketing email.', isTrue: false, explanation: 'Claude Code is a developer coding agent; drafting belongs in chat or a Project.' },
    { text: 'Code execution lets Claude compute results from data files rather than estimate them in prose.', isTrue: true, explanation: 'Claude writes and runs code in a sandbox to analyze data, make charts and produce files.' },
    { text: 'Incognito chats are not saved to memory.', isTrue: true, explanation: 'They are the right choice for sensitive one-off conversations.' },
    { text: 'Claude Desktop offers exactly the same capabilities as the web app with no additions.', isTrue: false, explanation: 'Desktop adds connections to local tools and files through desktop connectors.' },
  ],
  resources: [
    { label: 'Claude Help Center', url: 'https://support.claude.com/' },
    { label: 'Claude apps and features overview', url: 'https://claude.com/product/overview' },
    { label: 'Model Context Protocol (connectors)', url: 'https://modelcontextprotocol.io/' },
  ],
};
