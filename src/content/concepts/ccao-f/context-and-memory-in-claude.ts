import type { Concept } from '../../types';

export const contextAndMemoryInClaude: Concept = {
  id: 'context-and-memory-in-claude',
  title: 'Context and Memory in Claude',
  summary:
    'The context window is everything Claude can see in the current conversation. Understand why long chats degrade, when to start fresh, summarize, or persist knowledge to a Project or memory, and how to work with long documents.',
  certs: ['ccao-f', 'ccar-p'],
  domains: ['ccao-f-3', 'ccao-f-7', 'ccar-p-2'],
  tags: ['context-window', 'memory', 'projects', 'long-documents'],
  difficulty: 'foundations',
  diagram: 'context-window',
  sections: [
    {
      heading: 'What the context window is',
      body: `Every time Claude replies, it reads the whole conversation so far: your messages, its earlier replies, any files you attached, the Project instructions and knowledge in play, and relevant memory. That bundle is the **context window**. It is measured in tokens (roughly three-quarters of a word each), and current Claude models can hold about a million tokens, which is several very long books.

Two consequences follow:

1. **Claude has no knowledge of your conversation beyond what is in the window.** It does not "remember" in a human sense; it re-reads. If something is not in the window (a previous separate chat, a document you mentioned but did not attach), Claude does not know it, however obvious it feels to you.
2. **The window is finite and attention is not uniform.** Even within the limit, very long conversations with many topics, corrections and tangents make it harder for Claude to weigh the instruction that matters. Early instructions compete with later contradictions; old drafts compete with new ones.

This is why users sometimes say Claude "forgot" an instruction from forty messages ago. It did not forget; the instruction is buried under newer, often conflicting, material, or the conversation reached the point where the oldest content fell outside the window.`,
    },
    {
      heading: 'Symptoms of a context problem',
      body: `Recognize these and respond with a context action rather than frustration:

- Claude reintroduces something you removed several turns ago.
- Claude blends details from two different documents or two different versions of a draft.
- Responses slow down noticeably in a very long chat.
- Claude asks for information you already gave much earlier.
- Quality on a new sub-task is lower than it would be in a fresh chat with the same request.
- You are told the conversation has reached its length limit.

The common thread: the conversation now contains more history than the task needs, and some of that history conflicts with the current request. The fix is to reduce or restructure the context, not to repeat yourself more loudly.`,
    },
    {
      heading: 'Restart, summarize, or persist',
      body: `The blueprint lists three responses. Choose by what you need to keep.

**Restart (new chat).** Use when the next task needs little of the previous conversation. Carry over only the approved output or a short brief. Best for: switching topics, moving to the next step of a decomposed task, recovering from a chat full of conflicting instructions.

**Summarize.** Use when you need the substance of a long conversation but not its back-and-forth. Ask Claude: "Summarize the decisions, open questions and current requirements from this conversation in a form I can paste into a new chat." Review the summary (it is an output like any other), then start a new chat with it. Best for: long working sessions that have drifted.

**Persist.** Use when the information will be needed again and again. Put standing instructions and reference documents into a **Project** so every chat inside it starts with them. Let **memory** carry durable personal preferences and ongoing context across conversations. Best for: repeated workflows, team knowledge, your working preferences.

A simple rule: if you would type it into every new chat, it belongs in a Project (shared, structured) or memory (personal, lightweight). If you only need it for the next step, paste it. If you do not need it, leave it behind.`,
    },
    {
      heading: 'Long documents and Project knowledge',
      body: `Long documents are the most common way to fill a context window. Practical guidance:

- **Attach, do not paste in pieces**, when a document fits. Claude handles a whole report better than fragments spread over several messages.
- **Ask targeted questions** of a long document rather than "summarize everything". Point Claude at the sections that matter: "Focus on sections 4 and 7; ignore the appendices."
- **For a set of documents**, consider extracting what you need from each into a structured note first (decomposition), then working from the notes.
- **Project knowledge** can hold more than one chat conveniently can. When a Project's knowledge base grows large, Claude retrieves the relevant parts for each question rather than reading everything each time, so you can keep a substantial reference library in a Project without stuffing every chat with it.
- **Keep knowledge current.** Out-of-date documents in a Project are still "in context" and will be used; remove or replace superseded versions.

Exam angle: scenarios describe a long, drifting conversation or a repeated need for the same background. The best answer restarts with a summary, or moves the standing material into a Project, rather than continuing the long chat or upgrading the model.`,
    },
  ],
  examples: [
    {
      title: 'Recovering a drifting working session',
      description:
        'A program manager spent a morning in one chat planning an event: venue options, then budget, then a side conversation about a different project, then back to the agenda. By afternoon, Claude was mixing the two projects\' budgets. She asked for a summary of decisions, open items and constraints for the event only, checked it, and started a new chat from the summary. The mix-ups stopped immediately.',
      language: 'text',
      code: `"Summarize this conversation for a new chat. Include only the
offsite event: confirmed decisions, open questions, budget constraints,
and the agenda as it currently stands. Leave out everything about the
vendor review project. Keep it under 300 words."`,
      takeaway: 'Summarize, review the summary, restart; the new chat carries the substance without the conflicting history.',
    },
    {
      title: 'Persisting what you retype every day',
      description:
        'A support team lead began every chat by pasting the team\'s tone guide, escalation rules and product glossary. He moved all three into a Project called "Support replies" and set the Project instructions to "always follow the attached tone guide and escalation rules". Every new chat in the Project now starts with that knowledge, and teammates share it.',
      takeaway: 'If you would paste it into every chat, it belongs in a Project.',
    },
    {
      title: 'A mistake: blaming the model for a context problem',
      description:
        'An analyst working in a 150-message chat found Claude ignoring a formatting rule set at the start and reintroducing a section removed twice. He switched to a larger model mid-chat; the behavior continued because the conflicting history was still there. A fresh chat with a consolidated prompt (including the formatting rule and the removal) fixed it on the original model.',
      takeaway: 'Conflicting or buried instructions are a context problem; a bigger model reading the same muddled history does not solve it.',
    },
  ],
  keyPoints: [
    'The context window is everything Claude reads to produce a reply: the conversation, attachments, Project instructions and knowledge, and memory; current models hold about a million tokens.',
    'Claude does not remember beyond the window; it re-reads. Anything not in the window is unknown to it, including other chats.',
    'Long, multi-topic chats degrade because old instructions compete with newer, often conflicting, material.',
    'Restart when the next task needs little history; summarize when you need the substance without the back-and-forth; persist to a Project or memory when you will need it repeatedly.',
    'A summary of a conversation is itself an output: review it before carrying it into a new chat.',
    'Attach long documents whole and ask targeted questions; Project knowledge can hold a reference library that Claude retrieves from as needed.',
    'Switching to a bigger model does not fix conflicting history; a fresh, consolidated chat does.',
  ],
  flashcards: [
    { front: 'What is the context window?', back: 'Everything Claude reads to produce a reply: the conversation so far, attachments, Project instructions and knowledge, and relevant memory, measured in tokens.' },
    { front: 'Roughly how large is the context window of current Claude models?', back: 'About one million tokens; a token is roughly three-quarters of a word.' },
    { front: 'Why does Claude seem to "forget" an instruction from early in a long chat?', back: 'The instruction is buried under newer, often conflicting material, or has fallen outside the window; Claude re-reads rather than remembers.' },
    { front: 'When should you restart in a new chat?', back: 'When the next task needs little of the previous history: topic switch, next step of a decomposed task, or a chat full of conflicting instructions.' },
    { front: 'When should you summarize?', back: 'When you need the substance of a long conversation but not the back-and-forth; ask for decisions, open questions and requirements, review it, and start fresh from it.' },
    { front: 'When should you persist, and where?', back: 'When the material is needed repeatedly: standing instructions and reference documents go in a Project; durable personal preferences go in memory.' },
    { front: 'Does Claude know about your other chats by default?', back: 'No, unless memory or a shared Project carries relevant context; separate chats do not see each other.' },
    { front: 'Best way to work with a long report?', back: 'Attach it whole and ask targeted questions about the sections that matter.' },
    { front: 'How does a Project handle a large knowledge base?', back: 'Claude retrieves the relevant parts for each question instead of loading everything, so a Project can hold more than one chat can conveniently carry.' },
  ],
  quiz: [
    {
      question:
        'After a long planning session covering two different projects in one chat, Claude starts mixing the budgets. What is the MOST appropriate action?',
      options: [
        'Switch to a larger model and continue the chat.',
        'Ask Claude to summarize only the relevant project\'s decisions and constraints, review it, and start a new chat from that summary.',
        'Repeat the correct budget figures in capital letters.',
        'Delete the earlier messages about the other project from your own notes.',
      ],
      correct: [1],
      explanation:
        'The chat holds conflicting context; summarizing the needed substance and restarting removes it. A larger model (A) reads the same muddle; repetition (C) adds more conflicting history; editing your notes (D) does not change Claude\'s context.',
    },
    {
      question: 'A team lead pastes the same tone guide and glossary at the start of every chat. What should they do instead?',
      options: [
        'Keep pasting, but shorten the guide.',
        'Move the guide and glossary into a Project so every chat inside it starts with that knowledge.',
        'Tell Claude once and rely on it remembering across all future chats automatically.',
        'Put the guide in an Artifact.',
      ],
      correct: [1],
      explanation:
        'Repeatedly needed standing material belongs in a Project. Shortening (A) keeps the repetition; chats do not automatically share history (C); Artifacts (D) are outputs, not standing instructions.',
    },
    {
      question: 'Which TWO are symptoms that a conversation has a context problem rather than a model capability problem? (Select two)',
      options: [
        'Claude reintroduces a section you removed several turns ago.',
        'Claude does not know an internal product name you never provided.',
        'Claude blends details from two versions of a draft discussed earlier.',
        'Claude declines to give medical advice.',
      ],
      correct: [0, 2],
      explanation:
        'Reintroduced content and blended versions come from conflicting history in the window. Not knowing unprovided information (B) is a missing-input problem; declining medical advice (D) is a safety behavior.',
    },
    {
      question: 'Why does Claude not know what was said in a different chat you had yesterday?',
      options: [
        'Chats expire after 24 hours.',
        'Each chat has its own context window; other chats are not in it unless memory or a Project carries the relevant information.',
        'Claude only reads the most recent message.',
        'Separate chats always use different models.',
      ],
      correct: [1],
      explanation:
        'Claude reads only what is in the current context. Chats do not expire in a day (A), Claude reads the whole window not just the last message (C), and model choice is unrelated (D).',
    },
    {
      question: 'A researcher needs specific facts from a 300-page report. What is the best approach?',
      options: [
        'Paste the report in 20 separate messages and then ask for a full summary.',
        'Attach the whole report and ask targeted questions about the relevant sections.',
        'Describe the report from memory and ask Claude to fill in the facts.',
        'Ask Claude to find the report online.',
      ],
      correct: [1],
      explanation:
        'Attaching the full document and asking focused questions uses context well. Fragmented pasting (A) scatters the material; describing from memory (C) invites hallucination; the report may not be public (D).',
    },
  ],
  statements: [
    { text: 'Claude remembers everything from every previous chat by default.', isTrue: false, explanation: 'Each chat has its own context; only memory or a shared Project carries information across chats.' },
    { text: 'A long conversation with many topics can cause Claude to weigh conflicting instructions poorly.', isTrue: true, explanation: 'Early instructions compete with later contradictions in the window.' },
    { text: 'Summarizing a long chat and restarting is a legitimate way to recover quality.', isTrue: true, explanation: 'It carries the substance forward without the conflicting history.' },
    { text: 'A conversation summary produced by Claude can be pasted into a new chat without review.', isTrue: false, explanation: 'The summary is an output and can contain errors or omissions; review it first.' },
    { text: 'Standing instructions you would type into every chat belong in a Project.', isTrue: true, explanation: 'Projects provide shared, structured, persistent context.' },
    { text: 'Switching to a larger model is the recommended fix for a chat full of conflicting instructions.', isTrue: false, explanation: 'The larger model reads the same conflicting history; restart with a consolidated prompt.' },
    { text: 'Out-of-date documents left in a Project\'s knowledge are ignored by Claude.', isTrue: false, explanation: 'They remain available and will be used; remove or replace superseded versions.' },
  ],
  resources: [
    { label: 'Context windows (Claude docs)', url: 'https://platform.claude.com/docs/en/build-with-claude/context-windows' },
    { label: 'Claude Help Center: Projects and Memory', url: 'https://support.claude.com/' },
  ],
};
