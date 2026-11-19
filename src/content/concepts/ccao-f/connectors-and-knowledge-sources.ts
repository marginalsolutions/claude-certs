import type { Concept } from '../../types';

export const connectorsAndKnowledgeSources: Concept = {
  id: 'connectors-and-knowledge-sources',
  title: 'Connectors and Knowledge Sources',
  summary:
    'How Claude reaches information: uploaded files, Project knowledge, and connectors to tools like Google Drive, Gmail and Slack built on MCP. Keeping knowledge current and understanding what Claude can and cannot access.',
  certs: ['ccao-f', 'ccar-p'],
  domains: ['ccao-f-5', 'ccao-f-6', 'ccar-p-3'],
  tags: ['connectors', 'mcp', 'knowledge', 'permissions'],
  difficulty: 'foundations',
  sections: [
    {
      heading: 'Three ways to give Claude information',
      body: `Claude only knows what is in front of it. There are three ways to put your information there.

1. **Attach to a chat.** Upload files (documents, spreadsheets, PDFs, images) or paste text. Good for one-off tasks. The material lives in that conversation only.
2. **Add to Project knowledge.** Upload files to a Project so every chat inside it can use them. Good for standing references: policies, templates, style guides, product documentation. Large knowledge bases are searched for the relevant parts rather than loaded in full.
3. **Connect a tool.** Connectors link Claude to systems where information already lives: Google Drive, Gmail, Google Calendar, Slack, and many others, plus organization-specific connectors built by technical teams. Claude can search and read (and, for some connectors, act) in those tools during a conversation, so you do not have to export and upload.

Connectors are built on the **Model Context Protocol (MCP)**, an open standard for connecting AI applications to tools and data. You do not need to understand the protocol; you need to know that a connector is a controlled bridge to a specific tool, that your organization decides which connectors are available, and that you authorize each one with your own account.`,
    },
    {
      heading: 'Permissions: what Claude can access',
      body: `A connector acts **as you**. When you connect Google Drive, Claude can see the files you can see, no more and no less. It does not gain access to colleagues' private folders, and it does not see anything you have not connected.

Implications:

- If you can reach sensitive material, so can Claude through your connector. Be deliberate about which prompts you run with which connectors enabled, and about which folders or channels you authorize if the connector lets you scope it.
- Connected tools may let Claude take actions (send an email, post a message, create a document). Review before confirming anything that leaves your control.
- Admins on Team and Enterprise plans control which connectors are allowed, and may restrict or audit them. Follow your organization's list; do not install unapproved connectors on work accounts.
- Disconnecting a connector removes Claude's access immediately for future conversations.

When an output cites a connected document, you can open that document to verify, which is a real advantage over pasted excerpts. When Claude says it cannot find something, check whether the connector is enabled, whether you have access in the source tool, and whether the content is where you think it is.`,
    },
    {
      heading: 'Keeping knowledge current',
      body: `Uploaded files are snapshots; connected sources are live. That difference drives how you keep knowledge current.

**Uploaded knowledge** (chat attachments, Project files):
- Reflects the file at the time of upload. If the source changes, re-upload.
- Needs an owner and a review schedule in shared Projects.
- Should be date-stamped and deduplicated (one authoritative version per document).

**Connected knowledge**:
- Reads the current version in the source tool at query time, so it is naturally up to date.
- Depends on the source being well organized; a messy Drive produces messy answers.
- Still needs instructions about which locations or documents are authoritative.

A good hybrid: put stable references (style guide, templates) in Project knowledge, and reach frequently changing material (this week's plan, the live tracker) through a connector. Tell Claude in the Project instructions which is which.

Whatever the source, Claude does not automatically know a document is outdated. If an old version is reachable, it may be used. Removing or archiving superseded content in the source tool matters as much as in Project knowledge.`,
    },
    {
      heading: 'Choosing the right source and the exam angle',
      body: `| Situation | Best source |
|---|---|
| One-off analysis of a report | Attach to the chat |
| Policy or template used in every chat on a topic | Project knowledge |
| Information that changes weekly and lives in Drive or Slack | Connector |
| Personal emails and calendar for scheduling and follow-ups | Gmail and Calendar connectors |
| Internal system with no connector | Export and upload, or escalate for a custom connector |
| Regulated personal data | Check policy first; anonymize or do not use (see Data Sensitivity and Privacy) |

Exam distractors in this area include: pasting fragments when a connector could read the live document; expecting Claude to access a tool that was never connected; assuming Claude can see files the user cannot; leaving superseded files in place; and connecting unapproved tools to work data. The best answers use the approved connector or Project knowledge, keep one authoritative version, and respect permission boundaries.`,
    },
  ],
  examples: [
    {
      title: 'A hybrid Project for weekly planning',
      description:
        'A program office keeps its planning standards and status-report template in Project knowledge, and connects Google Drive so Claude can read the live project tracker and the latest meeting notes. The instructions say: "Standards and template are in knowledge. For current status, read the file named Portfolio Tracker in the PMO folder; treat it as authoritative for dates and owners." Weekly status drafts stay current without re-uploading anything.',
      takeaway: 'Stable references in knowledge, live material through a connector, and instructions that say which is authoritative.',
    },
    {
      title: 'A mistake: expecting access that was never granted',
      description:
        'A coordinator asked Claude to "summarize the decisions from yesterday\'s leadership channel". Claude replied that it could not find the channel. The coordinator assumed Claude was malfunctioning. In fact the Slack connector was not enabled for that chat, and the coordinator was not a member of the channel anyway. Connectors act with the user\'s own permissions; enabling the connector and asking a colleague with access to share the summary resolved it.',
      takeaway: 'Claude reaches only what you have connected and only what you can access yourself.',
    },
    {
      title: 'Verifying through the connected source',
      description:
        'A finance analyst asked Claude, with the Drive connector, for the approved travel per-diem rates. Claude answered and cited the policy document. The analyst opened the cited document directly from the result and found it was last year\'s version still sitting in the shared folder. She archived the old file in Drive, re-ran the question, and got the current rate with the current document cited.',
      takeaway: 'Connected sources make verification easy, and superseded files in the source tool must be archived or Claude may use them.',
    },
  ],
  keyPoints: [
    'Three ways to give Claude information: attach to a chat (one-off), add to Project knowledge (standing references), or connect a tool (live data).',
    'Connectors are built on MCP and link Claude to tools such as Google Drive, Gmail, Calendar and Slack; organizations decide which are available.',
    'A connector acts as you: Claude sees what you can see, no more; disconnecting removes access.',
    'Some connectors allow actions; review before confirming anything that leaves your control.',
    'Uploaded files are snapshots that must be re-uploaded when the source changes; connected sources are read live.',
    'Claude does not know a document is outdated; archive superseded files in both Project knowledge and the source tool.',
    'Use the approved connector rather than pasting fragments, and escalate when an internal system has no connector.',
  ],
  flashcards: [
    { front: 'What is a connector?', back: 'A controlled bridge, built on MCP, that lets Claude search, read and sometimes act in a tool such as Google Drive, Gmail or Slack, authorized with your own account.' },
    { front: 'What does MCP stand for and why does it matter to an Associate?', back: 'Model Context Protocol, an open standard for connecting AI apps to tools and data; it is what connectors are built on. Associates use connectors, not the protocol.' },
    { front: 'Whose permissions does a connector use?', back: 'Yours. Claude can access exactly what you can access in the connected tool.' },
    { front: 'Uploaded file vs connected source: which is live?', back: 'Connected sources are read at query time; uploaded files are snapshots that must be re-uploaded when they change.' },
    { front: 'Claude says it cannot find a document you know exists. Three things to check?', back: 'Is the connector enabled for this chat? Do you have access to the document in the source tool? Is it where you think it is?' },
    { front: 'Best source for a policy used in every chat on a topic', back: 'Project knowledge, date-stamped, with one authoritative version.' },
    { front: 'Best source for information that changes weekly and lives in Drive', back: 'A Drive connector, with Project instructions naming the authoritative file.' },
    { front: 'Who decides which connectors are available on a Team or Enterprise plan?', back: 'Administrators; follow the approved list and do not install unapproved connectors on work accounts.' },
    { front: 'An internal system has no connector. Options?', back: 'Export and upload the needed data, or escalate to a Developer or Architect for a custom connector.' },
  ],
  quiz: [
    {
      question:
        'A program office re-uploads its project tracker to a Project every Monday because the file changes weekly. What is the MOST appropriate improvement?',
      options: [
        'Upload the tracker daily instead.',
        'Connect Google Drive and instruct Claude to read the live tracker file as the authoritative source for dates and owners.',
        'Ask Claude to remember the tracker through memory.',
        'Paste the tracker contents into every chat.',
      ],
      correct: [1],
      explanation:
        'Frequently changing material belongs behind a connector that reads it live. More frequent uploads (A) and pasting (D) keep the manual work; memory (C) is not a data source.',
    },
    {
      question: 'A coordinator asks Claude to summarize a Slack channel they are not a member of, with the Slack connector enabled. What happens?',
      options: [
        'Claude summarizes it because the connector has organization-wide access.',
        'Claude cannot access the channel because connectors act with the user\'s own permissions.',
        'Claude asks the channel owner for access automatically.',
        'Claude summarizes it from cached data.',
      ],
      correct: [1],
      explanation:
        'Connectors grant Claude the user\'s access, not more. Options A, C and D describe capabilities connectors do not have.',
    },
    {
      question: 'Which TWO practices keep connected and uploaded knowledge current and reliable? (Select two)',
      options: [
        'Archiving superseded documents in the source tool so Claude does not use them.',
        'Keeping every historical version in Project knowledge for completeness.',
        'Naming the authoritative file or location in the Project instructions.',
        'Asking Claude to ignore anything that looks old.',
      ],
      correct: [0, 2],
      explanation:
        'Removing superseded content and naming the authoritative source prevent mixed answers. Keeping all versions (B) causes conflicts; "ignore old things" (D) is not reliable because Claude cannot always tell which is current.',
    },
    {
      question: 'An employee wants to connect a personal note-taking app, not on the company\'s approved list, to analyze work documents. What is the appropriate action?',
      options: [
        'Connect it; connectors are safe by design.',
        'Use only approved connectors and request that the tool be reviewed by the administrators if it is needed.',
        'Connect it but only for small files.',
        'Connect it and disconnect after each use.',
      ],
      correct: [1],
      explanation:
        'Organizations govern which tools can touch work data. Unapproved connectors (A, C, D) bypass that governance regardless of file size or duration.',
    },
    {
      question: 'A Claude answer about per-diem rates cites a document in the connected Drive. The best verification step is to:',
      options: [
        'Trust it because a document was cited.',
        'Open the cited document and confirm it is the current version and states the rate.',
        'Ask Claude whether the document is current.',
        'Re-ask the question in a new chat and see if the answer matches.',
      ],
      correct: [1],
      explanation:
        'Connected sources make direct verification easy; do it. A citation alone (A) can point to an outdated file; Claude cannot reliably judge currency (C); consistency across chats (D) is not accuracy.',
    },
  ],
  statements: [
    { text: 'Connectors give Claude access to everything in the connected tool regardless of the user\'s permissions.', isTrue: false, explanation: 'Connectors act as the user; Claude sees only what the user can see.' },
    { text: 'Connectors in Claude are built on the Model Context Protocol.', isTrue: true, explanation: 'MCP is the open standard that connectors use to bridge Claude and external tools.' },
    { text: 'A file uploaded to a Project updates automatically when the original changes.', isTrue: false, explanation: 'Uploads are snapshots; re-upload when the source changes, or use a connector for live data.' },
    { text: 'Some connectors allow Claude to take actions such as sending messages, so outputs should be reviewed before confirming.', isTrue: true, explanation: 'Actions that leave your control deserve a human check.' },
    { text: 'Claude automatically ignores outdated documents it can reach.', isTrue: false, explanation: 'Claude cannot reliably tell which version is current; archive superseded files.' },
    { text: 'Administrators on Team and Enterprise plans can control which connectors are available.', isTrue: true, explanation: 'Connector governance is part of organizational AI policy.' },
    { text: 'When an internal system has no connector, exporting the data or escalating for a custom connector are both reasonable options.', isTrue: true, explanation: 'Associates do not build connectors themselves; they use what exists or escalate.' },
  ],
  resources: [
    { label: 'Model Context Protocol', url: 'https://modelcontextprotocol.io/' },
    { label: 'Claude Help Center: Connectors', url: 'https://support.claude.com/' },
  ],
};
