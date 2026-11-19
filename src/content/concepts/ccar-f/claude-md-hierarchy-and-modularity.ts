import type { Concept } from '../../types';

export const claudeMdHierarchyAndModularity: Concept = {
  id: 'claude-md-hierarchy-and-modularity',
  title: 'CLAUDE.md Hierarchy and Modular Organization',
  summary:
    'Where Claude Code looks for CLAUDE.md files, which level each kind of instruction belongs at, and how @import and .claude/rules/ keep a growing configuration readable and shareable.',
  certs: ['ccar-f', 'ccdv-f', 'ccar-p'],
  domains: ['ccar-f-3', 'ccdv-f-3', 'ccar-p-7'],
  tags: ['claude-code', 'claude-md', 'configuration', 'memory'],
  difficulty: 'foundations',
  diagram: 'claude-md-hierarchy',
  sections: [
    {
      heading: 'The three levels and what each is for',
      body: `Claude Code loads instructions from several \`CLAUDE.md\` files at the start of a session and treats them as standing context. There are three levels:

| Level | Location | Shared with teammates? | Typical content |
|---|---|---|---|
| User | \`~/.claude/CLAUDE.md\` | No. It lives in your home directory, outside any repository. | Personal preferences: "answer tersely", preferred shell, editor quirks |
| Project | \`CLAUDE.md\` at the repository root, or \`.claude/CLAUDE.md\` | Yes, once committed. | Build and test commands, architecture overview, coding standards, review criteria |
| Directory | \`CLAUDE.md\` inside a subdirectory (a package, a service) | Yes, once committed. | Conventions specific to that package, loaded when Claude works in files under it |

All levels are combined; more specific files add to, rather than replace, broader ones. The practical rule is simple: **anything a teammate must also follow belongs at project or directory level.** The user level is for things that are true only for you.

For the exam, the most tested consequence is that \`~/.claude/CLAUDE.md\` is never shared through version control. If a convention "works on my machine" but a new hire's Claude Code ignores it, the convention is almost certainly sitting at the user level on the original author's laptop.`,
    },
    {
      heading: 'Keeping CLAUDE.md modular with @import',
      body: `A monolithic CLAUDE.md grows until nobody reads it, and every token of it is loaded into every session whether relevant or not. Two mechanisms keep it modular.

**@import.** A line such as \`@docs/api-conventions.md\` pulls another file's contents into the loaded context. Paths are relative to the importing file. This lets a package's CLAUDE.md say exactly which company standards apply to it:

\`\`\`markdown
# payments-service
@../../standards/python-style.md
@../../standards/pci-handling.md
See README.md for local setup.
\`\`\`

Maintainers who know their package pick the relevant standards instead of every package inheriting a 3,000-line document. The same standards file can be imported by many packages, so it is edited in one place.

**.claude/rules/.** Instead of one large file, split instructions by topic into \`.claude/rules/testing.md\`, \`.claude/rules/api-conventions.md\`, \`.claude/rules/deployment.md\`, and so on. Rules without a \`paths:\` frontmatter field are always loaded, so this is a pure organization win: smaller files, clearer ownership, cleaner diffs in review. Rules *with* \`paths:\` load only when matching files are touched; that conditional behaviour is covered in the path-specific rules concept.`,
    },
    {
      heading: 'Diagnosing hierarchy problems with /memory',
      body: `When Claude Code behaves differently on two machines, or differently from one session to the next, start by asking what was actually loaded rather than rewriting instructions. The \`/memory\` slash command lists every memory file currently in effect for the session, with its path and level, and lets you open one to edit.

Typical findings:

- A rule is present at the user level on one laptop and nowhere else. Fix: move it to the project CLAUDE.md and commit.
- Two files contradict each other (the root says "use pytest", a subdirectory says "use unittest"). Fix: remove the stale instruction; more specific files should narrow, not contradict.
- An \`@import\` path is wrong after a directory move, so a standards file silently stopped loading. Fix: correct the path; verify with \`/memory\`.
- A subdirectory CLAUDE.md is not loaded because Claude has not touched files under that directory yet. This is expected behaviour, not a bug.

Treat \`/memory\` the way you would treat \`usage.cache_read_input_tokens\` for caching: it is the observability tool that turns a guess into a diagnosis.`,
    },
    {
      heading: 'Exam angle: choosing the level',
      body: `Scenario questions in this domain usually describe a symptom and ask for the most appropriate configuration change. Map the symptom to the level:

- "Only one developer gets the behaviour" → it is in that developer's \`~/.claude/CLAUDE.md\`; move it to the project level.
- "The convention applies to one package only" → directory-level CLAUDE.md in that package, or an \`@import\` of the relevant standard from that package's file.
- "The convention applies to files of a certain type scattered across the repository" → a \`.claude/rules/\` file with a \`paths:\` glob, not many duplicated directory files.
- "CLAUDE.md is 2,000 lines and nobody maintains it" → split into \`.claude/rules/\` topic files and use \`@import\` for shared standards.
- "Behaviour is inconsistent and nobody knows why" → run \`/memory\` first.

Distractors tend to propose fixing the symptom at the wrong layer: adding the rule to \`settings.json\` (which controls permissions, hooks and environment, not instructions), telling each developer to copy a file by hand, or writing the instruction into every prompt.`,
    },
  ],
  examples: [
    {
      title: 'The new team member who gets no instructions',
      description:
        'A senior engineer set up Claude Code to always run `make lint` before proposing a commit and to prefer the repo\'s internal HTTP client. A new hire clones the repository and Claude Code does neither. The engineer had written both rules into `~/.claude/CLAUDE.md`, which is not in the repository. Moving the two rules into the root `CLAUDE.md` and committing fixed it for everyone; the senior engineer kept only true personal preferences (response verbosity) at the user level.',
      language: 'markdown',
      code: `# Before: ~/.claude/CLAUDE.md (never leaves the laptop)
- Run \`make lint\` before proposing a commit
- Use internal/httpclient instead of requests
- Keep answers short

# After: <repo>/CLAUDE.md (committed)
- Run \`make lint\` before proposing a commit
- Use internal/httpclient instead of requests

# After: ~/.claude/CLAUDE.md
- Keep answers short`,
      takeaway: 'Team conventions go in version control; the user level is for preferences that are true only for you.',
    },
    {
      title: 'Per-package standards with @import in a monorepo',
      description:
        'A monorepo has a Go gateway, a Python ML service and a TypeScript web app. One company-wide CLAUDE.md listed every language\'s conventions and was loaded into every session. Package maintainers replaced it with a short root file plus per-package files that import only the standards they need.',
      language: 'markdown',
      code: `# services/ml-pipeline/CLAUDE.md
@../../standards/python-style.md
@../../standards/data-privacy.md

## Local notes
- Tests: \`uv run pytest -q\`
- Never load full datasets in tests; use fixtures in tests/fixtures/

# apps/web/CLAUDE.md
@../../standards/typescript-style.md
@../../standards/accessibility.md`,
      takeaway: 'Let the people who know a package choose which shared standards it imports.',
    },
    {
      title: 'Splitting a monolithic CLAUDE.md into .claude/rules/',
      description:
        'A 1,800-line CLAUDE.md mixed testing, API design, deployment and on-call runbooks. Pull requests that touched it were impossible to review. The team split it into topic files under `.claude/rules/`. Nothing about loading changed (files without `paths:` load every session), but ownership and review became tractable, and later they added `paths:` to the testing file so it only loads when test files are edited.',
      language: 'bash',
      code: `.claude/
  CLAUDE.md              # 40 lines: what the repo is, how to build, where rules live
  rules/
    testing.md           # test naming, fixtures, what not to mock
    api-conventions.md   # REST naming, error envelope, pagination
    deployment.md        # release branches, feature flags, rollback`,
      takeaway: 'Splitting by topic is an organization change first; conditional loading is an optional second step.',
    },
    {
      title: 'Using /memory to find a contradiction',
      description:
        'Claude Code sometimes generated Jest tests and sometimes Vitest tests in the same package. `/memory` showed two loaded files: the root CLAUDE.md said "use Vitest" and a stale `packages/ui/CLAUDE.md` still said "use Jest" from before a migration. Deleting the stale line ended the inconsistency. No prompt changes were needed.',
      takeaway: 'When behaviour is inconsistent, inspect what is loaded before you rewrite instructions.',
    },
  ],
  keyPoints: [
    'Three levels: user (~/.claude/CLAUDE.md), project (root CLAUDE.md or .claude/CLAUDE.md), directory (subdirectory CLAUDE.md). All are combined.',
    'User-level instructions are not in the repository and are never shared via version control.',
    'Anything teammates must follow belongs at project or directory level and is committed.',
    '@import pulls another file into context so each package can include only the standards relevant to it.',
    '.claude/rules/ splits a monolithic CLAUDE.md into topic files; without paths: frontmatter they always load.',
    'Subdirectory CLAUDE.md files apply when Claude works in files under that directory.',
    '/memory lists which memory files are loaded in the current session; use it to diagnose inconsistent behaviour.',
    'settings.json controls permissions, hooks and environment, not instructions. Do not confuse the two.',
  ],
  flashcards: [
    { front: 'Where does the user-level CLAUDE.md live?', back: '~/.claude/CLAUDE.md, in the home directory, outside any repository.' },
    { front: 'Where can a project-level CLAUDE.md live?', back: 'At the repository root as CLAUDE.md, or at .claude/CLAUDE.md.' },
    { front: 'A new teammate does not receive a convention that works for you. Most likely cause?', back: 'The convention is in your ~/.claude/CLAUDE.md, which is not shared via version control. Move it to the project CLAUDE.md.' },
    { front: 'What does the @import syntax do?', back: 'Includes another file\'s contents in the loaded context so CLAUDE.md can stay short and share standards across packages.' },
    { front: 'What is .claude/rules/ for?', back: 'Holding topic-specific rule files (testing.md, api-conventions.md, ...) instead of one monolithic CLAUDE.md.' },
    { front: 'Do .claude/rules/ files without a paths: field load every session?', back: 'Yes. Only files with a paths: frontmatter field are conditionally loaded.' },
    { front: 'Which slash command shows which memory files are loaded?', back: '/memory' },
    { front: 'When is a subdirectory CLAUDE.md applied?', back: 'When Claude works with files under that subdirectory.' },
    { front: 'Should "always run make lint before committing" go in settings.json?', back: 'No. settings.json is for permissions, hooks and environment. Instructions go in CLAUDE.md (or a hook if you want it enforced rather than requested).' },
    { front: 'How do more specific CLAUDE.md files relate to broader ones?', back: 'They add to them. Levels are combined; the more specific file should narrow, not contradict.' },
  ],
  quiz: [
    {
      question:
        'A team lead configured Claude Code to always use the repository\'s internal logging wrapper. It works on her machine. A new engineer clones the repository and Claude Code uses the standard library logger. What is the MOST likely cause?',
      options: [
        'The new engineer is on an older Claude Code version that does not read CLAUDE.md.',
        'The instruction is in the team lead\'s ~/.claude/CLAUDE.md, which is not in version control.',
        'The instruction is in .claude/rules/ and rules only load for the author.',
        'CLAUDE.md files require a settings.json entry before they are loaded.',
      ],
      correct: [1],
      explanation:
        'User-level instructions live in the home directory and never reach teammates. Rules files are shared once committed, CLAUDE.md needs no settings.json opt-in, and version differences would not selectively drop one instruction.',
    },
    {
      question:
        'A monorepo has eight packages in four languages. The root CLAUDE.md is 2,500 lines and is loaded into every session. Which change BEST reduces irrelevant context while keeping shared standards in one place?',
      options: [
        'Ask each developer to copy the relevant sections into their ~/.claude/CLAUDE.md.',
        'Keep a short root CLAUDE.md and give each package a CLAUDE.md that @imports only the standards files it needs.',
        'Move the whole file into settings.json so it is only read on demand.',
        'Paste the relevant conventions at the top of each prompt.',
      ],
      correct: [1],
      explanation:
        'Per-package files with @import let maintainers include only relevant standards, edited in one place. Copying to user level breaks sharing, settings.json does not hold instructions, and pasting into prompts is manual and inconsistent.',
    },
    {
      question:
        'Claude Code generates tests in two different frameworks within the same package across sessions. What should an architect do FIRST?',
      options: [
        'Rewrite the testing instructions with stronger wording such as "ALWAYS use Vitest".',
        'Run /memory to see which memory files are loaded and look for conflicting instructions.',
        'Switch to a larger model so it follows instructions more reliably.',
        'Delete all CLAUDE.md files and start again.',
      ],
      correct: [1],
      explanation:
        'Inconsistent behaviour is usually a configuration conflict. /memory shows exactly what is loaded so you can find the stale or contradictory file. Stronger wording, a bigger model, or starting over do not diagnose the cause.',
    },
    {
      question: 'Which TWO statements about the CLAUDE.md hierarchy are correct? (Select two)',
      options: [
        'User-level, project-level and directory-level files are combined rather than one replacing the others.',
        'A subdirectory CLAUDE.md overrides and disables the root CLAUDE.md for the whole session.',
        'Files in .claude/rules/ without a paths: field are loaded every session.',
        'The user-level CLAUDE.md is committed with the repository by default.',
      ],
      correct: [0, 2],
      explanation:
        'Levels stack, and unscoped rules files always load. A subdirectory file adds to the root file rather than disabling it, and the user-level file lives outside the repository.',
    },
    {
      question:
        'A payments package must follow PCI handling rules that no other package needs. Where should those rules live?',
      options: [
        'In ~/.claude/CLAUDE.md of the payments team lead.',
        'In the root CLAUDE.md so every package sees them.',
        'In the payments package\'s own CLAUDE.md, or @imported into it from a shared standards file.',
        'In .mcp.json for the payments package.',
      ],
      correct: [2],
      explanation:
        'Package-specific conventions belong in that package\'s directory-level file. The user level is not shared, the root level loads them into unrelated work, and .mcp.json configures MCP servers, not instructions.',
    },
    {
      question: 'What does the /memory command show?',
      options: [
        'The token count of the current context window.',
        'The memory files loaded for the session, with their paths, and lets you open them to edit.',
        'A summary of the conversation so far, like /compact.',
        'The permissions granted in settings.json.',
      ],
      correct: [1],
      explanation:
        '/memory lists loaded CLAUDE.md and rules files for diagnosis and editing. /compact summarizes the conversation; token counts and permissions are shown elsewhere.',
    },
  ],
  statements: [
    { text: 'Instructions in ~/.claude/CLAUDE.md are shared with teammates once the repository is pushed.', isTrue: false, explanation: 'The user-level file is in the home directory, outside the repository, so it is never shared via version control.' },
    { text: 'A project-level CLAUDE.md may live either at the repository root or at .claude/CLAUDE.md.', isTrue: true, explanation: 'Both locations are recognised as project-level configuration.' },
    { text: '@import lets a CLAUDE.md include the contents of another file.', isTrue: true, explanation: 'This is the mechanism for keeping CLAUDE.md modular and sharing standards across packages.' },
    { text: 'Files in .claude/rules/ are loaded only when a paths: glob matches the file being edited.', isTrue: false, explanation: 'Only rules files that declare paths: are conditional. Files without paths: load every session.' },
    { text: 'The /memory command lists which memory files are currently loaded.', isTrue: true, explanation: 'It is the primary diagnostic for inconsistent behaviour across sessions or machines.' },
    { text: 'settings.json is the right place for coding conventions such as "prefer the internal HTTP client".', isTrue: false, explanation: 'settings.json holds permissions, hooks and environment variables. Conventions go in CLAUDE.md or rules files.' },
    { text: 'A subdirectory CLAUDE.md replaces the root CLAUDE.md when Claude works in that directory.', isTrue: false, explanation: 'Levels are combined. The subdirectory file adds more specific guidance on top of the root file.' },
  ],
  resources: [
    { label: 'Claude Code memory (CLAUDE.md) docs', url: 'https://code.claude.com/docs/en/memory' },
    { label: 'Claude Code best practices', url: 'https://code.claude.com/docs/en/best-practices' },
  ],
};
