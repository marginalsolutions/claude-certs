import type { Concept } from '../../types';

export const builtInToolsReadWriteEditBashGrepGlob: Concept = {
  id: 'built-in-tools-read-write-edit-bash-grep-glob',
  title: 'Built-in Tools: Read, Write, Edit, Bash, Grep, Glob',
  summary:
    'Claude Code and the Agent SDK ship a small set of file and shell tools. Knowing which one fits each job, why Edit fails on non-unique text, and how to explore a codebase incrementally with Grep then Read is what separates efficient agents from ones that read everything.',
  certs: ['ccar-f', 'ccdv-f'],
  domains: ['ccar-f-2', 'ccar-f-5', 'ccdv-f-8', 'ccdv-f-3'],
  tags: ['claude-code', 'agent-sdk', 'built-in-tools', 'grep', 'glob', 'edit', 'codebase-exploration'],
  difficulty: 'foundations',
  diagram: 'tool-use-sequence',
  sections: [
    {
      heading: 'What each tool is for',
      body: `| Tool | Purpose | Typical input |
|---|---|---|
| **Glob** | Find files by **path pattern** | \`**/*.test.tsx\`, \`src/api/**/*.py\` |
| **Grep** | Search file **contents** for a pattern | a function name, an error message, an import statement |
| **Read** | Load a file's full contents (optionally a line range) | a path |
| **Write** | Create or completely overwrite a file | a path and the full new content |
| **Edit** | Make a targeted change by replacing a **unique** text match | path, old text, new text |
| **Bash** | Run shell commands: tests, builds, git, scripts | a command string |

Glob answers "which files?"; Grep answers "which files contain this?". Confusing them is the most common beginner error: using Grep to find files named \`*.test.tsx\` wastes a content search, and using Glob to find callers of \`parseInvoice\` cannot work because Glob never looks inside files.

Read and Write are whole-file operations; Edit is surgical. Bash is the escape hatch for anything else, and in Claude Code it is also where permissions and hooks do most of their gating work because its action space is so broad. Prefer the dedicated tools over Bash equivalents (\`cat\`, \`grep\`, \`find\`): they are safer to permit, parallel-safe, and produce output the harness understands.`,
    },
    {
      heading: 'Edit, uniqueness, and the Read + Write fallback',
      body: `Edit works by exact string replacement. You supply the text to replace and the replacement; the tool requires that the old text appear **exactly once** in the file. That constraint is what makes Edit safe: the agent can be certain which occurrence changes.

It also means Edit **fails** when the anchor text is not unique. Common cases: a repeated \`return null;\`, several identical \`except Exception:\` blocks, boilerplate repeated in a test file, or a short anchor like \`}\`. Two recovery strategies, in order:

1. **Widen the anchor.** Include surrounding lines so the match becomes unique. Usually this is enough.
2. **Fall back to Read + Write.** Read the full file, construct the complete new content, and Write it back. This is always reliable because it does not depend on matching, at the cost of sending the whole file.

Both require having **read the file first**. Edit on a file the agent has not read is a mistake; the agent does not know the exact text (whitespace, quotes, line endings) and matches fail. The exam frames this as: when Edit cannot find unique anchor text, use Read followed by Write.`,
    },
    {
      heading: 'Incremental codebase understanding',
      body: `The developer-productivity scenario is about unfamiliar codebases. The tempting approach, reading every file up front, fails on anything real: context fills with irrelevant code, cost explodes, and the agent's attention is diluted before the real question is asked.

The effective pattern is **incremental**:

1. **Glob** to learn the shape: where are sources, tests, configs?
2. **Grep** for entry points relevant to the task: the route handler, the error message from the bug report, the function named in the ticket.
3. **Read** only those files, and follow their **imports** with further Grep and Read calls to trace the flow.
4. Stop when the question is answered; do not read "for completeness".

This keeps context proportional to the task. It also mirrors how senior engineers work. Claude Code's Explore subagent exists for exactly this: run the search-heavy phase in an isolated context and return a summary, so the main session's window stays clean.

When a request is to "understand the legacy billing system", the deliverable of the first pass is a map (modules, entry points, data flow), not a full read.`,
    },
    {
      heading: 'Tracing usage across wrappers',
      body: `A hard case: finding every real use of a function that is re-exported through wrapper modules and barrel files (\`index.ts\` that re-exports from several files, or a Python package \`__init__\` that does the same). A single Grep for the original name misses callers that import the wrapper's alias.

The method:

1. **Identify all exported names.** Read the wrapper/barrel modules and Grep for \`export\` or \`__all__\` to list every name under which the function is exposed, including aliases (\`export { parseInvoice as parse }\`).
2. **Grep for each name across the codebase.** One search per exported name, scoped by file type.
3. **Read** the hits to confirm they refer to the right symbol and are not string matches in comments.

If a semantic code-intelligence MCP tool is available (resolving symbols through re-exports), it does this in one call and should be preferred, provided its description makes that capability clear. Without it, the two-stage Grep is the reliable manual approach.`,
    },
  ],
  examples: [
    {
      title: 'Tool choice for common developer tasks',
      description:
        'Each task maps to one tool. The agent should reach for the dedicated tool rather than a Bash equivalent.',
      language: 'text',
      code: `Task                                               Tool   Input
Find all React test files                          Glob   **/*.test.tsx
Find every caller of parseInvoice                  Grep   parseInvoice  (type: ts)
Locate where "payment declined" is raised          Grep   "payment declined"
Understand handlers.py before changing it          Read   src/api/handlers.py
Rename one variable in a function                  Edit   old text -> new text (unique)
Regenerate a config file from scratch              Write  path + full content
Run the test suite after the change                Bash   npm test -- invoice`,
      takeaway: 'Glob for file names, Grep for file contents, Read/Write for whole files, Edit for targeted changes, Bash to execute.',
    },
    {
      title: 'The mistake: Edit on a repeated anchor',
      description:
        'The agent tried to change one of six identical `return None` lines in a module. Edit failed because the anchor matched six times. Widening the anchor to include the preceding condition made it unique; for a file where that was impossible, the agent read the whole file and wrote the modified content back.',
      language: 'text',
      code: `Edit(file, old="    return None", new="    return default")
  -> error: old_string matched 6 times; must be unique

# Fix 1: widen the anchor
Edit(file,
     old="    if cache_miss:\\n        return None",
     new="    if cache_miss:\\n        return default")

# Fix 2 (when no unique anchor exists): Read + Write
content = Read(file)
Write(file, content_with_targeted_change(content))`,
      takeaway: 'Edit requires a unique match; widen the anchor or fall back to Read + Write.',
    },
    {
      title: 'Incremental exploration of an unfamiliar service',
      description:
        'Asked why refunds over a threshold fail silently, the agent does not read the repo. It finds the entry point, follows imports to the policy check, and stops once the cause is located.',
      language: 'markdown',
      code: `1. Glob  src/**/*.py                      -> 140 files; note services/, api/, policies/
2. Grep  "refund" --type py (files only)  -> 7 files
3. Grep  "def process_refund"             -> services/refunds.py:41
4. Read  services/refunds.py:1-120        -> imports policies.limits.check_amount
5. Grep  "def check_amount"               -> policies/limits.py:12
6. Read  policies/limits.py:1-60          -> returns False above limit, caller ignores return
Done: 2 files read out of 140.`,
      takeaway: 'Grep to find entry points, Read to follow imports, stop when the question is answered.',
    },
    {
      title: 'Tracing a function exported through a barrel file',
      description:
        'A Grep for parseInvoice found three callers, but the function is also re-exported as `parse` from a barrel. Listing exported names first, then searching for each, found nine more call sites.',
      language: 'bash',
      code: `# Step 1: find every name the function is exported under
Grep  "parseInvoice"  --glob "**/index.ts"
#  lib/billing/index.ts: export { parseInvoice } from "./parse";
#  lib/index.ts:         export { parseInvoice as parse } from "./billing";

# Step 2: search for each exported name
Grep  "\\bparseInvoice\\b"  --type ts     # 3 callers
Grep  "\\bparse\\("          --type ts     # 9 more, confirm via Read that they import from lib`,
      takeaway: 'Identify all exported names (including aliases) first, then search for each across the codebase.',
    },
  ],
  keyPoints: [
    'Glob finds files by path pattern; Grep searches file contents. Do not confuse them.',
    'Read and Write are whole-file operations; Edit replaces a unique text match; Bash runs commands.',
    'Edit fails when the anchor text is not unique: widen the anchor, or fall back to Read + Write.',
    'Always Read a file before editing it so the exact text is known.',
    'Explore codebases incrementally: Glob for shape, Grep for entry points, Read to follow imports; never read everything up front.',
    'To trace usage through wrappers and barrel files, list all exported names and aliases first, then Grep for each.',
    'Prefer dedicated tools over Bash equivalents (cat, grep, find): they are easier to permit, parallel-safe and better understood by the harness.',
  ],
  flashcards: [
    { front: 'Which tool finds files matching **/*.test.tsx?', back: 'Glob.' },
    { front: 'Which tool finds every file containing the string "payment declined"?', back: 'Grep.' },
    { front: 'What does Edit require of the text it replaces?', back: 'That it occur exactly once in the file.' },
    { front: 'Edit fails with "matched 6 times". What are the two fixes?', back: 'Widen the anchor to make it unique, or Read the whole file and Write the modified content.' },
    { front: 'Why Read before Edit?', back: 'Edit needs the exact text (whitespace, quotes); without reading, matches fail.' },
    { front: 'Describe the incremental exploration pattern.', back: 'Glob for structure, Grep for entry points, Read only relevant files and follow imports, stop when answered.' },
    { front: 'Why not read every file up front in an unfamiliar codebase?', back: 'Context fills with irrelevant code, cost rises, and attention is diluted.' },
    { front: 'How do you trace a function re-exported through barrel files?', back: 'Identify all exported names and aliases first, then Grep for each name across the codebase.' },
    { front: 'Dedicated Grep tool or Bash grep?', back: 'The dedicated tool: easier to permit, parallel-safe, structured output.' },
    { front: 'Which Claude Code subagent is designed for search-heavy exploration in isolated context?', back: 'The Explore subagent.' },
  ],
  quiz: [
    {
      question: 'An engineer asks the agent to find all React component test files in a monorepo. Which tool should it use first?',
      options: ['Grep for "describe("', 'Glob with **/*.test.tsx', 'Read the package.json files', 'Bash: cat -r .'],
      correct: [1],
      explanation:
        'The question is about file names, which is Glob\'s job. Grep for "describe(" also matches non-React tests and is a content search for a naming question; reading package.json or catting the tree does not answer it.',
    },
    {
      question:
        'The agent needs to change one of several identical `except Exception: pass` blocks in a file. Edit returns an error that the text matched four times. What should it do?',
      options: [
        'Retry Edit with the same anchor; the error is transient.',
        'Widen the anchor with surrounding lines to make it unique, or Read the file and Write the full modified content.',
        'Use Bash with sed to replace all four occurrences.',
        'Delete the file and recreate it with Write from memory.',
      ],
      correct: [1],
      explanation:
        'Edit requires a unique match; widening the anchor or falling back to Read + Write are the documented strategies. The error is deterministic, sed would change all four, and recreating from memory risks losing content.',
    },
    {
      question:
        'A developer-productivity agent is asked why a legacy service returns the wrong tax on invoices. It begins by reading all 180 source files. What is the better approach?',
      options: [
        'Read the files in smaller batches of 20.',
        'Grep for "tax" and the invoice entry point, Read only those files, and follow imports to trace the calculation.',
        'Ask the user to point to the exact file.',
        'Run the full test suite with Bash and read the output.',
      ],
      correct: [1],
      explanation:
        'Incremental exploration keeps context proportional to the task. Batching still reads everything; asking the user defeats the purpose of the tool; running tests may help later but does not locate the logic.',
    },
    {
      question: 'Which TWO statements about the built-in tools are correct? (Select two)',
      options: [
        'Grep searches file contents while Glob matches file paths.',
        'Edit will replace every occurrence of the old text in the file.',
        'Read followed by Write is a reliable fallback when Edit cannot find unique anchor text.',
        'Write appends to the end of an existing file.',
      ],
      correct: [0, 2],
      explanation:
        'Grep/Glob division and the Read + Write fallback are correct. Edit requires a unique match and changes only that one; Write overwrites the whole file rather than appending.',
    },
    {
      question:
        'A Grep for `formatCurrency` finds two callers, but the engineer knows it is used widely. The function is re-exported from lib/index.ts as `fmt`. What should the agent do?',
      options: [
        'Conclude the function is barely used.',
        'List every name the function is exported under (including aliases) by reading the barrel files, then Grep for each name.',
        'Rename the function so there is only one name.',
        'Read every file in lib/ to find usages manually.',
      ],
      correct: [1],
      explanation:
        'Wrapper and barrel modules hide usages behind aliases; enumerating exported names and searching each is the method. Concluding low usage is wrong, renaming is a code change not an investigation, and reading everything is the anti-pattern.',
    },
  ],
  statements: [
    { text: 'Glob is used to find files whose paths match a pattern such as **/*.test.tsx.', isTrue: true, explanation: 'Glob matches paths; it never looks at file contents.' },
    { text: 'Grep is the right tool for finding all files named config.yaml.', isTrue: false, explanation: 'That is a path pattern, so Glob fits; Grep searches contents.' },
    { text: 'Edit requires the text being replaced to appear exactly once in the file.', isTrue: true, explanation: 'Uniqueness is what makes targeted edits safe; non-unique anchors cause the edit to fail.' },
    { text: 'When Edit fails on a non-unique anchor, reading the file and writing the full modified content is a reliable fallback.', isTrue: true, explanation: 'Read + Write does not depend on matching.' },
    { text: 'The most thorough way to understand an unfamiliar codebase is to Read every file before answering.', isTrue: false, explanation: 'Incremental exploration (Glob, Grep, targeted Read) keeps context focused and is the recommended approach.' },
    { text: 'A single Grep for a function name reliably finds all its usages even when it is re-exported under an alias.', isTrue: false, explanation: 'Aliased re-exports hide usages; enumerate exported names first and search for each.' },
    { text: 'Using the dedicated Grep tool is preferable to running grep through Bash.', isTrue: true, explanation: 'Dedicated tools are easier to permit, parallel-safe and return structured output.' },
  ],
  resources: [
    { label: 'Claude Code: tools available to Claude', url: 'https://code.claude.com/docs/en/settings#tools-available-to-claude' },
    { label: 'Claude Code common workflows: understand new codebases', url: 'https://code.claude.com/docs/en/common-workflows' },
    { label: 'Agent SDK overview (built-in tools)', url: 'https://platform.claude.com/docs/en/agent-sdk/overview' },
  ],
};
