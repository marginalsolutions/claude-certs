import type { Concept } from '../../types';

export const pathSpecificRules: Concept = {
  id: 'path-specific-rules',
  title: 'Path-Specific Rules for Conditional Convention Loading',
  summary:
    'Use .claude/rules/ files with a paths: glob in their frontmatter so conventions load only when matching files are edited, and prefer globs over directory CLAUDE.md files when a convention spans the codebase.',
  certs: ['ccar-f', 'ccdv-f', 'ccar-p'],
  domains: ['ccar-f-3', 'ccdv-f-3', 'ccar-p-7'],
  tags: ['claude-code', 'rules', 'context-management', 'configuration'],
  difficulty: 'foundations',
  sections: [
    {
      heading: 'How a path-scoped rule works',
      body: `A file in \`.claude/rules/\` is ordinary Markdown with optional YAML frontmatter. When the frontmatter contains a \`paths:\` field, the rule becomes **conditional**: Claude Code loads it only when it is working with a file that matches one of the globs. Without \`paths:\`, the rule loads in every session like any other memory file.

\`\`\`markdown
---
paths:
  - "terraform/**/*"
  - "**/*.tf"
---
# Terraform conventions
- Pin provider versions; never use \`latest\`.
- Every module needs a README with inputs and outputs.
- Run \`terraform fmt\` and \`terraform validate\` before proposing changes.
\`\`\`

The mechanism matters for two reasons. First, **relevance**: a developer editing a React component does not need infrastructure conventions in context, and irrelevant instructions can even lead the model astray. Second, **tokens**: every always-loaded rule is paid for on every turn of every session. Scoping a 400-line Terraform guide to Terraform files removes that cost from the 90% of sessions that never touch infrastructure.`,
    },
    {
      heading: 'Globs beat directory CLAUDE.md for cross-cutting conventions',
      body: `A subdirectory CLAUDE.md applies to files *under that directory*. That is the right tool when a convention follows the directory tree: one package, one service. It is the wrong tool when a convention follows **file type** and the files are scattered.

Test files are the classic case. In a typical frontend repository, \`*.test.tsx\` files sit next to the components they test, in dozens of directories. To cover them with directory-level CLAUDE.md files you would duplicate the same testing conventions into every directory, and forget some. A single rule with \`paths: ["**/*.test.tsx"]\` covers every current and future test file with no duplication.

| Convention shape | Best mechanism |
|---|---|
| Applies to one package or service | Directory-level CLAUDE.md in that package |
| Applies to a file type anywhere in the repo | \`.claude/rules/*.md\` with a \`paths:\` glob |
| Applies to everything, always | Root CLAUDE.md or an unscoped rules file |
| Applies to one kind of task on demand | A skill or slash command |

Glob syntax follows familiar conventions: \`**\` matches across directories, \`*\` within one segment, and you can list several patterns under \`paths:\`.`,
    },
    {
      heading: 'Designing a rules directory',
      body: `A mature \`.claude/rules/\` directory mixes always-on and conditional files:

\`\`\`text
.claude/rules/
  general.md           # no paths: -> always loaded
  testing.md           # paths: ["**/*.test.*", "**/__tests__/**"]
  api-conventions.md   # paths: ["src/api/**", "**/*.openapi.yaml"]
  terraform.md         # paths: ["infra/**", "**/*.tf"]
  migrations.md        # paths: ["db/migrations/**"]
\`\`\`

Guidelines that hold up in practice and on the exam:

- Keep the always-loaded set small. If a rule is only relevant to some files, give it \`paths:\`.
- Scope by what the convention is *about*, not by who wrote it. A testing rule scoped to test files is intuitive; the same rule scoped to \`src/**\` is not.
- Prefer one rule per topic. Splitting \`testing.md\` into fifteen micro-files adds nothing; merging testing and deployment into one file forces the deployment text to load whenever tests are edited.
- Verify with \`/memory\` while editing a matching file to confirm the rule actually loads.`,
    },
    {
      heading: 'Exam angle',
      body: `Questions in this area describe a convention and ask where it should live. Decide along two axes: *does it follow the directory tree or the file type?* and *is it always relevant or only sometimes?*

- "Test conventions for \`*.test.tsx\` files spread across the repository" → \`.claude/rules/testing.md\` with \`paths: ["**/*.test.tsx"]\`. Not a CLAUDE.md in every directory.
- "Terraform standards that should not clutter frontend sessions" → \`.claude/rules/terraform.md\` with \`paths: ["terraform/**/*"]\`.
- "The payments service has its own error-handling style" → \`services/payments/CLAUDE.md\`.
- "Reduce tokens spent on irrelevant instructions" → add \`paths:\` to rules that are only sometimes relevant.

Distractors: putting everything in the root CLAUDE.md "so nothing is missed" (costly and distracting), duplicating a directory CLAUDE.md into every folder (unmaintainable), or using a skill for a convention that must apply automatically whenever a matching file is edited (skills are on demand).`,
    },
  ],
  examples: [
    {
      title: 'Test conventions that follow the files, not the folders',
      description:
        'A React codebase co-locates `Component.test.tsx` with `Component.tsx` in about 80 directories. The team wanted every generated test to use Testing Library queries by role, avoid snapshot tests, and reuse `renderWithProviders`. One rule file with a glob covers all of them.',
      language: 'markdown',
      code: `---
paths:
  - "**/*.test.tsx"
  - "**/*.test.ts"
---
# Test conventions
- Query by role or label (\`getByRole\`), never by test id unless no accessible name exists.
- No snapshot tests.
- Wrap components with \`renderWithProviders\` from \`src/test-utils\`.
- One behaviour per \`it\`; name it as a sentence: "shows an error when the email is invalid".`,
      takeaway: 'A single glob-scoped rule replaces dozens of duplicated directory CLAUDE.md files.',
    },
    {
      title: 'The mistake: a monolithic always-on file',
      description:
        'A platform team wrote a 600-line root CLAUDE.md covering Terraform, Helm, Python services and the web app. Frontend developers complained that Claude Code sometimes suggested "pinning the provider version" in TypeScript PRs and that sessions felt sluggish. Moving the infrastructure sections into `.claude/rules/terraform.md` and `.claude/rules/helm.md` with `paths:` globs cut the always-loaded text to under 100 lines and removed the misapplied advice.',
      language: 'yaml',
      code: `# .claude/rules/terraform.md frontmatter
---
paths: ["infra/terraform/**/*", "**/*.tf", "**/*.tfvars"]
---

# .claude/rules/helm.md frontmatter
---
paths: ["infra/charts/**/*"]
---`,
      takeaway: 'Instructions that are only sometimes relevant should be conditional, both for tokens and for accuracy.',
    },
    {
      title: 'Choosing between a directory CLAUDE.md and a rule',
      description:
        'Two requests arrived in the same week. Request A: "the billing service must use our Money type, never floats." Request B: "all database migrations must be reversible and include a down step." A lives entirely under `services/billing/`, so it became `services/billing/CLAUDE.md`. B applies to `db/migrations/**` in three different services, so it became `.claude/rules/migrations.md` with a glob covering all three.',
      takeaway: 'Directory CLAUDE.md for tree-shaped scope; glob rules for conventions that cut across the tree.',
    },
  ],
  keyPoints: [
    '.claude/rules/*.md files may declare a paths: list of glob patterns in YAML frontmatter.',
    'A rule with paths: loads only when Claude works with a file matching one of the globs; a rule without paths: always loads.',
    'Conditional loading reduces irrelevant context and token usage, and prevents advice from being misapplied to the wrong file type.',
    'Use glob rules (for example **/*.test.tsx) for conventions that follow file type across many directories.',
    'Use a directory-level CLAUDE.md when the convention follows the directory tree (one package or service).',
    'Keep the always-loaded set small; scope rules by topic, one topic per file.',
    'Verify a scoped rule loads by running /memory while editing a matching file.',
  ],
  flashcards: [
    { front: 'How do you make a .claude/rules/ file conditional?', back: 'Add a paths: list of glob patterns in its YAML frontmatter.' },
    { front: 'When does a rule with paths: ["terraform/**/*"] load?', back: 'Only when Claude is working with a file under terraform/.' },
    { front: 'What glob covers every TSX test file anywhere in the repo?', back: '**/*.test.tsx' },
    { front: 'Why prefer a glob rule over directory CLAUDE.md files for test conventions?', back: 'Test files are spread across many directories; one glob covers them all without duplicating the rule into every folder.' },
    { front: 'Two benefits of path-scoped rules?', back: 'Less irrelevant context (fewer tokens per turn) and less chance of conventions being misapplied to unrelated files.' },
    { front: 'When is a directory-level CLAUDE.md the better choice?', back: 'When the convention applies to one package or service, so its scope matches the directory tree.' },
    { front: 'Does a rules file without paths: load conditionally?', back: 'No. It behaves like CLAUDE.md and loads every session.' },
    { front: 'How can you confirm a scoped rule is actually loading?', back: 'Run /memory while working on a matching file and check that the rule is listed.' },
  ],
  quiz: [
    {
      question:
        'A repository has `*.test.tsx` files next to components in roughly 80 directories. The team wants consistent test conventions applied whenever Claude Code edits a test. Which approach is MOST appropriate?',
      options: [
        'Add a CLAUDE.md to each of the 80 directories with the test conventions.',
        'Create .claude/rules/testing.md with paths: ["**/*.test.tsx"].',
        'Create a /testing skill that developers invoke before writing tests.',
        'Put the conventions in ~/.claude/CLAUDE.md for each developer.',
      ],
      correct: [1],
      explanation:
        'A glob rule covers every matching file with one definition. Eighty directory files are unmaintainable, a skill is on demand rather than automatic, and user-level files are not shared.',
    },
    {
      question:
        'Frontend developers notice Claude Code occasionally suggests Terraform practices in TypeScript changes, and the root CLAUDE.md is 600 lines. What is the BEST fix?',
      options: [
        'Add "ignore Terraform rules when editing TypeScript" to the root CLAUDE.md.',
        'Move the Terraform section into .claude/rules/terraform.md with paths: ["terraform/**/*", "**/*.tf"].',
        'Switch to a model with a larger context window.',
        'Delete the Terraform conventions entirely.',
      ],
      correct: [1],
      explanation:
        'Scoping the rule to Terraform files removes it from unrelated sessions, cutting both the misapplied advice and the token cost. A negation instruction keeps the text loaded, a larger context does not fix relevance, and deleting the rules loses them for infrastructure work.',
    },
    {
      question: 'Which TWO statements about .claude/rules/ files are correct? (Select two)',
      options: [
        'A rules file without a paths: field is loaded in every session.',
        'paths: accepts glob patterns such as **/*.test.tsx.',
        'Rules files can only be scoped to a single directory, not by file extension.',
        'A paths-scoped rule is loaded at session start regardless of which files are edited.',
      ],
      correct: [0, 1],
      explanation:
        'Unscoped rules always load, and paths: takes glob patterns including extension-based ones. Rules can match by extension anywhere, and scoped rules load only when a matching file is in play.',
    },
    {
      question:
        'The billing service alone must use a Money type instead of floats. Everything about this convention is under services/billing/. Where should it live?',
      options: [
        'services/billing/CLAUDE.md',
        '.claude/rules/money.md with paths: ["**/*.py"]',
        'The root CLAUDE.md',
        'A /billing-review skill',
      ],
      correct: [0],
      explanation:
        'The scope matches a directory tree, so a directory-level CLAUDE.md is the natural fit. A **/*.py glob would load it for every Python file, the root file loads it everywhere, and a skill is not automatic.',
    },
    {
      question: 'What is the primary token-related benefit of adding paths: to a rules file?',
      options: [
        'The rule is cached so it costs nothing after the first turn.',
        'The rule is only loaded when a matching file is edited, so unrelated sessions do not pay for it.',
        'The rule is compressed before it is sent to the model.',
        'The rule is loaded once per repository rather than once per session.',
      ],
      correct: [1],
      explanation:
        'Conditional loading keeps irrelevant instructions out of context entirely. There is no compression or special caching tied to paths:, and loading is per session, not per repository.',
    },
  ],
  statements: [
    { text: 'A .claude/rules/ file with paths: ["**/*.test.tsx"] loads only when Claude works with a matching test file.', isTrue: true, explanation: 'That is the purpose of the paths: frontmatter field.' },
    { text: 'Path-scoped rules are mainly a way to override the root CLAUDE.md for specific files.', isTrue: false, explanation: 'They add conditional instructions on top of always-loaded ones; they are about relevance and token savings, not overriding.' },
    { text: 'Directory-level CLAUDE.md files are the best way to apply conventions to files of one type scattered across many directories.', isTrue: false, explanation: 'That requires duplicating the file into every directory. A glob-scoped rule covers all of them at once.' },
    { text: 'Rules without a paths: field behave like always-loaded memory.', isTrue: true, explanation: 'Only the presence of paths: makes a rule conditional.' },
    { text: 'The paths: field accepts multiple glob patterns.', isTrue: true, explanation: 'You can list several patterns, for example a directory glob and an extension glob.' },
    { text: 'A skill is the right mechanism when a convention must apply automatically every time a matching file is edited.', isTrue: false, explanation: 'Skills are invoked on demand. Automatic, file-triggered conventions belong in path-scoped rules.' },
  ],
  resources: [
    { label: 'Claude Code memory and rules', url: 'https://code.claude.com/docs/en/memory' },
    { label: 'Claude Code best practices', url: 'https://code.claude.com/docs/en/best-practices' },
  ],
};
