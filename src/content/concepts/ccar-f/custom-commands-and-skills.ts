import type { Concept } from '../../types';

export const customCommandsAndSkills: Concept = {
  id: 'custom-commands-and-skills',
  title: 'Custom Slash Commands and Skills',
  summary:
    'Package repeatable workflows as project or personal slash commands and as skills with SKILL.md frontmatter (context: fork, allowed-tools, argument-hint), and know when a skill beats a CLAUDE.md rule.',
  certs: ['ccar-f', 'ccdv-f', 'ccar-p'],
  domains: ['ccar-f-3', 'ccdv-f-3', 'ccar-p-7'],
  tags: ['claude-code', 'slash-commands', 'skills', 'configuration'],
  difficulty: 'foundations',
  sections: [
    {
      heading: 'Slash commands: project vs user scope',
      body: `A custom slash command is a Markdown file whose contents become the prompt when you type \`/name\`. There are two places to put one:

| Scope | Location | Who gets it |
|---|---|---|
| Project | \`.claude/commands/<name>.md\` | Everyone who clones the repository, once committed |
| User | \`~/.claude/commands/<name>.md\` | Only you, in every project on your machine |

The decision is about audience, exactly as with CLAUDE.md levels. A \`/release-notes\` command that encodes the team's changelog format belongs in \`.claude/commands/\` so a new hire gets it on day one and changes go through code review. A \`/explain-like-im-new\` command that reflects how you personally like explanations belongs in \`~/.claude/commands/\`.

Commands accept arguments: \`/fix-issue 1234\` substitutes \`1234\` into the template (via \`$ARGUMENTS\`, or positional \`$1\`, \`$2\`). They are the lightest-weight way to stop retyping the same multi-paragraph prompt.`,
    },
    {
      heading: 'Skills and the SKILL.md frontmatter',
      body: `A skill is a directory, \`.claude/skills/<name>/SKILL.md\` (project) or \`~/.claude/skills/<name>/SKILL.md\` (personal), that can carry supporting files alongside the instructions. The SKILL.md starts with YAML frontmatter that configures how the skill runs. The three fields the Architect exam names:

- **\`context: fork\`** runs the skill in an isolated subagent context. The skill does its work, which may involve reading dozens of files or exploring alternatives, and only its summary returns to the main conversation. Use it for anything verbose (codebase analysis, dependency audits) or exploratory (brainstorming several designs) so the main session's context is not polluted.
- **\`allowed-tools\`** restricts which tools the skill may use while it runs. A skill that only ever needs to write documentation can be limited to file reads and writes, so a misinterpreted instruction cannot run a destructive shell command. The restriction is enforced by Claude Code, not merely requested in prose.
- **\`argument-hint\`** describes the arguments the skill expects, for example \`argument-hint: "<ticket-id> [--dry-run]"\`. When a developer invokes the skill without arguments, the hint prompts them for what is missing instead of letting the skill guess.

\`\`\`markdown
---
name: analyze-module
description: Deep-dive a module and report its public surface and risks
context: fork
allowed-tools: Read, Grep, Glob
argument-hint: "<path/to/module>"
---
Analyze the module at $ARGUMENTS. Report exported symbols, callers, and risks.
\`\`\``,
    },
    {
      heading: 'Personal variants and avoiding collisions',
      body: `Teams often ship a project skill that most people use as-is, while one developer wants a tweaked version. The wrong move is editing the shared SKILL.md for a personal preference: it changes behaviour for everyone and lands in code review. The right move is a **personal variant** in \`~/.claude/skills/\` under a **different name**, such as \`review-strict\` alongside the project's \`review\`. Using a different name avoids ambiguity about which skill \`/review\` means and keeps the team version untouched.

The same logic applies to commands: copy the project command into \`~/.claude/commands/\` under a new name, adjust it, and leave the shared one alone.`,
    },
    {
      heading: 'Skills vs CLAUDE.md: on demand vs always on',
      body: `Both are Markdown instructions, so the distinction is about *when* they load and *what* they are for.

| | CLAUDE.md / unscoped rules | Skills and commands |
|---|---|---|
| Loaded | Every session, always | Only when invoked (or when Claude decides a skill's description matches the task) |
| Best for | Universal standards: style, build commands, architecture facts, review criteria | Task-specific workflows: "generate a migration", "write release notes", "audit dependencies" |
| Cost of being wrong | Every token loads every time, relevant or not | None until invoked |

A standard that applies to all work ("never commit secrets", "run the linter") belongs in CLAUDE.md. A multi-step procedure that applies to one kind of task belongs in a skill. Putting the procedure in CLAUDE.md wastes context on every unrelated session; putting a universal standard in a skill means it is silently skipped whenever nobody invokes the skill.

Exam distractors frequently swap these: proposing a skill for a universal rule, or stuffing a 300-line workflow into CLAUDE.md "so it is always available".`,
    },
  ],
  examples: [
    {
      title: 'A team-wide /fix-issue command',
      description:
        'Engineers kept pasting the same five-paragraph prompt to pick up a GitHub issue, reproduce it, fix it and open a PR. One engineer turned it into a project command. Because it lives in `.claude/commands/`, it is versioned, reviewable and available to everyone after `git pull`.',
      language: 'markdown',
      code: `# .claude/commands/fix-issue.md
Fix GitHub issue #$ARGUMENTS.

1. Read the issue with \`gh issue view $ARGUMENTS\`.
2. Reproduce it with a failing test before changing code.
3. Make the smallest fix that passes the new test and the existing suite.
4. Open a PR titled "Fix #$ARGUMENTS: <summary>" with a short description.`,
      takeaway: 'Repeated multi-step prompts become shared project commands, not copy-paste.',
    },
    {
      title: 'Isolating a verbose analysis with context: fork',
      description:
        'A `/dependency-audit` skill read every lockfile and manifest in a 60-package monorepo and dumped thousands of lines into the main session. Afterwards, the developer\'s actual task kept losing track of earlier decisions because the context was full of audit output. Adding `context: fork` ran the audit in a subagent; only a one-page summary came back to the main conversation.',
      language: 'yaml',
      code: `---
name: dependency-audit
description: Find outdated or vulnerable dependencies across all packages
context: fork
allowed-tools: Read, Glob, Grep, Bash(npm audit *)
---`,
      takeaway: 'Verbose or exploratory skills should fork so their output does not pollute the main session.',
    },
    {
      title: 'The mistake: editing a shared skill for a personal preference',
      description:
        'A developer liked the team\'s `review` skill but wanted it to ignore formatting nits. She edited `.claude/skills/review/SKILL.md` and committed it. Reviews for the whole team stopped reporting formatting issues, which the team relied on. The fix was to revert, then create `~/.claude/skills/review-quiet/SKILL.md` with her variant under a new name.',
      language: 'bash',
      code: `# Wrong: changes everyone's /review
vim .claude/skills/review/SKILL.md && git commit -am "ignore nits"

# Right: a personal variant with a distinct name
mkdir -p ~/.claude/skills/review-quiet
cp .claude/skills/review/SKILL.md ~/.claude/skills/review-quiet/SKILL.md
# edit the copy; the project's /review is unchanged`,
      takeaway: 'Personal customizations go in ~/.claude/skills/ under a different name so teammates are unaffected.',
    },
    {
      title: 'argument-hint stops a skill from guessing',
      description:
        'A `/generate-migration` skill needed a table name and a change description. Invoked bare, Claude guessed a table from recent files and produced a useless migration. Adding `argument-hint: "<table> <description of change>"` meant a bare `/generate-migration` prompted the developer for the two values instead.',
      takeaway: 'Use argument-hint for required parameters so missing arguments trigger a prompt, not a guess.',
    },
  ],
  keyPoints: [
    'Project commands live in .claude/commands/ and are shared via version control; user commands live in ~/.claude/commands/ and are personal.',
    'Skills live in .claude/skills/<name>/SKILL.md (project) or ~/.claude/skills/<name>/SKILL.md (personal) and can bundle supporting files.',
    'context: fork runs a skill in an isolated subagent so verbose or exploratory output does not pollute the main conversation.',
    'allowed-tools restricts which tools a skill may use, for example limiting a docs skill to file reads and writes.',
    'argument-hint tells developers which arguments are required when they invoke a skill without them.',
    'Personal variants of a team skill go in ~/.claude/skills/ under a different name, never by editing the shared file.',
    'CLAUDE.md is for always-loaded universal standards; skills and commands are for on-demand, task-specific workflows.',
  ],
  flashcards: [
    { front: 'Where do project-scoped slash commands live?', back: '.claude/commands/<name>.md, committed to the repository.' },
    { front: 'Where do user-scoped slash commands live?', back: '~/.claude/commands/<name>.md, available only to you across all projects.' },
    { front: 'What file defines a skill?', back: 'SKILL.md inside .claude/skills/<name>/ (project) or ~/.claude/skills/<name>/ (personal).' },
    { front: 'What does context: fork do in SKILL.md frontmatter?', back: 'Runs the skill in an isolated subagent context so its output does not pollute the main conversation.' },
    { front: 'What does allowed-tools do in SKILL.md frontmatter?', back: 'Restricts the tools the skill can use while it runs, for example to prevent destructive shell commands.' },
    { front: 'What does argument-hint do?', back: 'Describes required arguments so a developer invoking the skill without them is prompted instead of the skill guessing.' },
    { front: 'How should a developer customise a team skill for personal taste?', back: 'Create a personal variant in ~/.claude/skills/ with a different name; do not edit the shared SKILL.md.' },
    { front: 'Skill or CLAUDE.md: "always run the linter before committing"?', back: 'CLAUDE.md. It is a universal standard that must apply every session.' },
    { front: 'Skill or CLAUDE.md: a 20-step release-notes procedure?', back: 'Skill or command. It is a task-specific workflow invoked on demand.' },
    { front: 'Which kind of skill most benefits from context: fork?', back: 'Verbose ones (codebase analysis) and exploratory ones (brainstorming alternatives).' },
  ],
  quiz: [
    {
      question:
        'A team wants every engineer to have a /release-notes command that follows the company changelog format, and wants changes to the format to go through code review. Where should the command live?',
      options: [
        'In each engineer\'s ~/.claude/commands/release-notes.md.',
        'In .claude/commands/release-notes.md in the repository.',
        'In the root CLAUDE.md as a section titled "Release notes".',
        'In .claude/settings.json under a "commands" key.',
      ],
      correct: [1],
      explanation:
        'Project commands in .claude/commands/ are shared through version control and reviewed like code. User commands are personal, CLAUDE.md would load the procedure into every session, and settings.json does not define commands.',
    },
    {
      question:
        'A /codebase-map skill reads hundreds of files and prints a long report. After running it, developers notice Claude forgets earlier decisions in the same session. Which frontmatter change BEST addresses this?',
      options: [
        'allowed-tools: Read',
        'context: fork',
        'argument-hint: "<directory>"',
        'Remove the skill and put the instructions in CLAUDE.md.',
      ],
      correct: [1],
      explanation:
        'context: fork runs the skill in an isolated subagent and returns only a summary, protecting the main context. allowed-tools limits tools, argument-hint handles missing arguments, and moving it to CLAUDE.md would make the problem worse.',
    },
    {
      question:
        'A documentation-generation skill should never be able to run shell commands, even if a prompt is misread. What is the MOST appropriate control?',
      options: [
        'Add "Do not run shell commands" to the skill body.',
        'Set allowed-tools in the SKILL.md frontmatter to the file read/write tools only.',
        'Run the skill with context: fork so damage is isolated.',
        'Ask developers to watch the skill while it runs.',
      ],
      correct: [1],
      explanation:
        'allowed-tools is enforced by Claude Code rather than requested in prose. Prose instructions can be misread, fork isolates context but not actions, and manual supervision is not a control.',
    },
    {
      question: 'Which TWO statements about skills and CLAUDE.md are correct? (Select two)',
      options: [
        'CLAUDE.md content is loaded every session; skills load when invoked or matched.',
        'A personal variant of a team skill should be created in ~/.claude/skills/ under a different name.',
        'Editing the project SKILL.md is the recommended way to apply a personal preference.',
        'Universal coding standards are best stored in a skill so they stay out of context until needed.',
      ],
      correct: [0, 1],
      explanation:
        'Always-on vs on-demand is the core distinction, and personal variants with distinct names avoid affecting teammates. Editing the shared skill changes everyone\'s behaviour, and universal standards must be always loaded, so they belong in CLAUDE.md.',
    },
    {
      question:
        'Developers keep invoking /generate-migration with no arguments, and the skill guesses a table name. Which change fixes this with the least effort?',
      options: [
        'Add argument-hint describing the required table and change description.',
        'Add context: fork so guesses do not reach the main session.',
        'Rewrite the skill to scan the schema and pick the most recently modified table.',
        'Move the skill to ~/.claude/skills/.',
      ],
      correct: [0],
      explanation:
        'argument-hint prompts for missing required parameters. Fork does not prevent guessing, auto-picking a table institutionalises the guess, and moving the skill changes scope, not behaviour.',
    },
  ],
  statements: [
    { text: 'Commands in ~/.claude/commands/ are available to the whole team once the repository is pushed.', isTrue: false, explanation: 'The ~/.claude directory is personal and outside the repository. Shared commands go in .claude/commands/.' },
    { text: 'context: fork runs a skill in an isolated subagent context.', isTrue: true, explanation: 'Only the skill\'s result returns to the main conversation, which keeps verbose output out of the main context.' },
    { text: 'allowed-tools in SKILL.md is a suggestion that Claude may override if the task needs another tool.', isTrue: false, explanation: 'It is an enforced restriction on which tools the skill can use during execution.' },
    { text: 'argument-hint prompts the developer for parameters when a skill is invoked without arguments.', isTrue: true, explanation: 'This prevents the skill from guessing required inputs.' },
    { text: 'The recommended way to customise a team skill for yourself is to edit the shared SKILL.md and not commit it.', isTrue: false, explanation: 'Create a personal variant in ~/.claude/skills/ under a different name so the shared skill is untouched and nothing is left uncommitted by accident.' },
    { text: 'Skills are a good home for task-specific workflows, while CLAUDE.md is for universal standards.', isTrue: true, explanation: 'Skills load on demand; CLAUDE.md loads every session.' },
    { text: 'A skill can bundle supporting files alongside SKILL.md.', isTrue: true, explanation: 'Skills are directories, so templates, scripts and reference files can live next to SKILL.md.' },
  ],
  resources: [
    { label: 'Claude Code slash commands', url: 'https://code.claude.com/docs/en/slash-commands' },
    { label: 'Claude Code skills', url: 'https://code.claude.com/docs/en/skills' },
  ],
};
