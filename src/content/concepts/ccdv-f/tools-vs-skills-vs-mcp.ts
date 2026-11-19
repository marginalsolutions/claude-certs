import type { Concept } from '../../types';

export const toolsVsSkillsVsMcp: Concept = {
  id: 'tools-vs-skills-vs-mcp',
  title: 'Built-in Tools vs Custom Tools vs Skills vs MCP',
  summary:
    'The agentic customization decision: when to rely on built-in tools, write a custom tool, package knowledge as an Agent Skill (SKILL.md with progressive disclosure), or build an MCP server, with a decision table and concrete cases.',
  certs: ['ccdv-f', 'ccar-f', 'ccar-p'],
  domains: ['ccdv-f-8', 'ccdv-f-3', 'ccar-f-2', 'ccar-f-3', 'ccar-p-2', 'ccar-p-3'],
  tags: ['tools', 'skills', 'mcp', 'customization', 'decision'],
  difficulty: 'intermediate',
  sections: [
    {
      heading: 'Four ways to extend what an agent can do',
      body: `Each mechanism answers a different question.

| Mechanism | Adds | Lives | Loaded |
|---|---|---|---|
| **Built-in tools** (Read, Write, Edit, Bash, Glob, Grep, web tools; server tools on the API) | Generic capability that already exists | In the harness | Always |
| **Custom tools** | A specific action your code performs | In your application\'s harness | Always (or via tool search) |
| **Agent Skills** | *Knowledge and procedure*: how to do a task well, with optional scripts and reference files | \`.claude/skills/<name>/SKILL.md\` (or the Skills API / \`container.skills\`) | On demand, by description match |
| **MCP servers** | *Capabilities* exposed by an external system, reusable across hosts | A separate process or service | At connection time |

The short version: tools give the agent **hands**, Skills give it **know-how**, MCP gives it **reusable connections**. Built-in tools are the default; the other three are what you add when the defaults are not enough.

Two of these are capability mechanisms (custom tools, MCP) and one is an instruction mechanism (Skills). Confusing them produces the classic mistakes: writing a tool for something that is really a procedure, or writing a 2,000-word CLAUDE.md section for something that should be an on-demand Skill.`,
    },
    {
      heading: 'Agent Skills and progressive disclosure',
      body: `A Skill is a folder with a \`SKILL.md\` whose YAML frontmatter has a \`name\` and a \`description\`, followed by Markdown instructions, plus optional supporting files (scripts, templates, reference docs). Frontmatter can also set \`allowed-tools\` (restrict what the skill may call), \`context: fork\` (run in an isolated subagent context), and \`argument-hint\` for invocation.

The key design idea is **progressive disclosure**:

1. At startup only the skill's **name and description** are in context, a few dozen tokens each.
2. When a task matches the description, Claude reads the **full SKILL.md**.
3. The skill may point to **reference files or scripts** that are read or run only when needed.

This keeps the always-on context small while making deep expertise available. Compare with \`CLAUDE.md\`, which is loaded every session: put universal conventions there and task-specific procedures in Skills.

Skills exist in Claude Code (\`.claude/skills/\`, personal or project), in the Agent SDK, in Claude.ai, and on the Messages API via \`container.skills\` with code execution (Anthropic skills such as \`pptx\`, \`xlsx\`, \`docx\`, \`pdf\`, and custom skills uploaded with the Skills API). A skill cannot do anything the available tools cannot; it tells the agent *how* to use them for a class of task.`,
    },
    {
      heading: 'A decision table',
      body: `| Situation | Choose | Why |
|---|---|---|
| Read, search or edit files in a repo | Built-in tools | Already present, hardened, parallel-safe |
| Run tests, lint, build | Built-in Bash (plus a Skill describing the project\'s commands) | Capability exists; the know-how is the missing piece |
| Call one internal API from one app | Custom tool | Smallest unit of new capability; no process boundary |
| Call an internal system from several Claude apps / hosts | MCP server | Write once, reuse everywhere, maintain independently |
| Integrate a standard SaaS (GitHub, Jira, Slack) | Existing MCP server | Do not rebuild what the ecosystem maintains |
| Enforce a multi-step procedure or house style (release checklist, report format) | Skill | Procedure, not capability; loaded only when relevant |
| Produce .pptx / .xlsx / .docx / .pdf files via the API | Anthropic skill + code execution | Packaged expertise plus a sandbox |
| Gate or audit a specific risky action | Dedicated tool (custom or MCP) + hook/approval | Typed arguments the harness can intercept |
| Expose a data catalog so the agent knows what exists | MCP resource | Application-controlled context, no exploratory calls |
| Dozens of rarely used tools | Tool search with deferred loading | Keeps context small; cache-friendly |

The capability-bloat warning from the Architect Professional guide applies to all four: every added tool, server or always-on instruction costs tokens and dilutes selection. Add the smallest mechanism that solves the problem, and remove what the role does not need.`,
    },
    {
      heading: 'Combinations and anti-patterns',
      body: `The mechanisms compose. A Skill often *references* MCP tools ("use \`mcp__jira__create_issue\` with these fields") and *restricts* itself with \`allowed-tools\`. An MCP server may ship prompts that act like Skills for its own domain. A custom tool may be promoted to an MCP server once a second application needs it.

Anti-patterns the exam likes:

- **A tool for a procedure.** \`run_release_checklist\` as a tool that returns the checklist text. The checklist is instructions; make it a Skill the agent follows using existing tools.
- **CLAUDE.md as an encyclopedia.** Thousands of tokens of occasionally relevant procedure loaded on every session. Move it to Skills with good descriptions.
- **An MCP server for one app, one tool.** Process boundary, auth and deployment for something a 20-line custom tool would do. MCP earns its cost through reuse.
- **Pasting data every request** instead of giving the agent a tool or resource to fetch what it needs.
- **Rebuilding a standard integration** when a maintained community server exists.
- **Capability bloat.** Attaching every available server and tool "just in case". Scope per role.

For architects, the parallel question is integration mechanism selection: MCP for tool-shaped access to systems across hosts; direct API or CLI when a single harness needs it and no reuse is expected; agent-to-agent delegation when the other side has its own reasoning and context.`,
    },
  ],
  examples: [
    {
      title: 'A Skill that teaches the release procedure',
      description:
        'The team\'s release steps live in a Skill instead of CLAUDE.md. Only the description is in context until someone asks to cut a release; then the full procedure loads. allowed-tools keeps the skill from doing anything beyond git and the release script.',
      language: 'markdown',
      code: `---
name: cut-release
description: Prepare and tag a production release for this repo. Use when asked to "cut", "ship" or "tag" a release.
allowed-tools: Bash(git *), Bash(./scripts/release.sh *), Read
argument-hint: "<version>"
---
# Cutting a release
1. Confirm the working tree is clean: \`git status --porcelain\` must be empty.
2. Run \`./scripts/release.sh \$ARGUMENTS\` and read its output.
3. If CHANGELOG.md lacks a section for \$ARGUMENTS, stop and ask.
4. Tag with \`git tag -a v\$ARGUMENTS -m "Release \$ARGUMENTS"\` and push tags.
See reference/release-faq.md for failure cases.`,
      takeaway: 'Procedures are Skills: small always-on footprint, full detail on demand, tool scope restricted.',
    },
    {
      title: 'Custom tool now, MCP server later',
      description:
        'A single internal app needed to look up customer tiers. A custom tool in the harness took an afternoon. Six months later three other Claude applications needed the same lookup, so the team moved it into an MCP server with the same description and schema, and each app connected to it. The tool definition the model sees barely changed; what changed was reuse and ownership.',
      language: 'python',
      code: `# Phase 1: custom tool in one app
@beta_tool
def get_customer_tier(customer_id: str) -> str:
    """Return the support tier (bronze/silver/gold) for a customer id."""
    return crm.tier(customer_id)

# Phase 2: same contract as an MCP tool, shared by many apps
@mcp.tool()
def get_customer_tier(customer_id: str) -> str:
    """Return the support tier (bronze/silver/gold) for a customer id."""
    return crm.tier(customer_id)`,
      takeaway: 'Start with the smallest mechanism; promote to MCP when a second consumer appears.',
    },
    {
      title: 'The mistake: a tool that returns instructions',
      description:
        'A team added a custom tool `get_coding_standards` that returned a 3,000-word style guide. The agent called it on almost every task, re-ingesting the same text, and sometimes skipped it and violated the standards. Converting the content into a Skill (`description: Apply house coding standards when writing or reviewing code`) with the detailed rules in SKILL.md and language-specific files in a reference folder fixed both problems: the standards loaded automatically when relevant and only the relevant file was read.',
      language: 'text',
      code: `Before: tools=[get_coding_standards]  -> 3,000 tokens per call, often skipped
After:  .claude/skills/coding-standards/
          SKILL.md            (description + core rules)
          reference/python.md (loaded only for Python work)
          reference/ts.md     (loaded only for TypeScript work)`,
      takeaway: 'Instructions are not capabilities; package knowledge as a Skill, not a tool.',
    },
  ],
  keyPoints: [
    'Built-in tools: generic capability, always available; use them first.',
    'Custom tools: a specific action for one application; the smallest unit of new capability.',
    'Agent Skills: knowledge and procedure in SKILL.md with name/description frontmatter, allowed-tools, context: fork, argument-hint; loaded on demand via progressive disclosure.',
    'MCP servers: capabilities from external systems, reusable across hosts and apps, discovered at connection time.',
    'Tools give hands, Skills give know-how, MCP gives reusable connections.',
    'Choose the smallest mechanism that solves the problem; promote a custom tool to MCP when a second consumer appears.',
    'Anti-patterns: tools that return instructions, encyclopedic CLAUDE.md, single-app MCP servers, rebuilding standard integrations, capability bloat.',
    'Prefer existing community MCP servers for standard systems; write custom servers for team-specific workflows.',
  ],
  flashcards: [
    { front: 'In one phrase each: what do tools, Skills and MCP add?', back: 'Tools: hands (capability). Skills: know-how (procedure). MCP: reusable connections to external systems.' },
    { front: 'What is in a SKILL.md frontmatter?', back: 'name and description (required); optionally allowed-tools, context: fork, argument-hint.' },
    { front: 'What is progressive disclosure in Skills?', back: 'Only name and description are always in context; the full SKILL.md loads when relevant; reference files and scripts load only when needed.' },
    { front: 'When does a custom tool beat an MCP server?', back: 'When one application needs one action and no reuse across apps or hosts is expected.' },
    { front: 'When does an MCP server beat a custom tool?', back: 'When several Claude applications or hosts need the capability, or it should be maintained independently of any one app.' },
    { front: 'Should you write an MCP server for Jira?', back: 'Usually not; use a maintained community server and reserve custom servers for team-specific workflows.' },
    { front: 'What belongs in CLAUDE.md versus a Skill?', back: 'Universal, always-relevant conventions in CLAUDE.md; task-specific procedures in Skills so they load only when needed.' },
    { front: 'How do Skills work on the Messages API?', back: 'Via container.skills with the code execution tool; Anthropic skills (pptx, xlsx, docx, pdf) or custom skills uploaded through the Skills API.' },
    { front: 'What does allowed-tools do in a Skill?', back: 'Restricts which tools the skill may use while it runs, limiting blast radius.' },
    { front: 'What is capability bloat?', back: 'Attaching more tools, servers and always-on instructions than a role needs, which raises token cost and degrades tool selection.' },
  ],
  quiz: [
    {
      question:
        'A team wants Claude Code to follow a 12-step database migration procedure whenever someone asks to add a migration, but not to load those steps during unrelated work. Which mechanism fits?',
      options: [
        'Add the steps to CLAUDE.md.',
        'Create a Skill whose description matches migration requests and whose SKILL.md contains the steps.',
        'Build an MCP server with a run_migration_procedure tool.',
        'Write a custom tool that returns the procedure text.',
      ],
      correct: [1],
      explanation:
        'A procedure that should load on demand is exactly what Skills with progressive disclosure provide. CLAUDE.md (A) loads every session; an MCP server (C) and a tool returning text (D) treat instructions as capability.',
    },
    {
      question:
        'Four internal Claude applications all need to query the same customer-tier service. Today each has its own copy of a custom tool, and they have drifted. What is the best consolidation?',
      options: [
        'Keep the four custom tools but share a Markdown spec.',
        'Build one MCP server exposing the lookup and connect all four applications to it.',
        'Paste the tier table into each application\'s system prompt.',
        'Create a Skill describing how to call the service.',
      ],
      correct: [1],
      explanation:
        'Shared capability across multiple apps is the MCP use case. A shared spec (A) does not stop drift, pasting data (C) is stale and wasteful, and a Skill (D) is instructions without the capability.',
    },
    {
      question:
        'Which TWO statements about Agent Skills are correct? (Select two)',
      options: [
        'Only the skill\'s name and description are loaded into context until the skill is needed.',
        'Skills can perform actions that no available tool can perform.',
        'allowed-tools in the frontmatter restricts which tools the skill may use.',
        'Skills must be invoked with an MCP server.',
      ],
      correct: [0, 2],
      explanation:
        'Progressive disclosure and allowed-tools are core features. Skills cannot exceed the capabilities of available tools (B), and they do not depend on MCP (D).',
    },
    {
      question:
        'A developer proposes writing a custom MCP server to integrate with GitHub for a single Claude Code project. What is the most appropriate response?',
      options: [
        'Approve; custom servers are always more secure.',
        'Use the maintained GitHub MCP server and reserve custom servers for team-specific workflows.',
        'Use a Skill instead, since GitHub access is a procedure.',
        'Paste repository data into CLAUDE.md.',
      ],
      correct: [1],
      explanation:
        'Standard integrations should use existing, maintained servers. Custom is not inherently more secure (A), GitHub access is a capability not a procedure (C), and pasting data (D) is neither live nor scalable.',
    },
    {
      question:
        'An agent has 18 tools from five MCP servers and frequently picks the wrong one. Which change is most consistent with the agentic-customization guidance?',
      options: [
        'Add detailed instructions in the system prompt about every tool.',
        'Remove servers and tools the role does not need, leaving a small, well-described set.',
        'Convert all the tools into a single Skill.',
        'Switch to a larger model.',
      ],
      correct: [1],
      explanation:
        'Capability bloat degrades selection; scoping is the fix. More prompt text (A) adds tokens without removing the confusion, Skills (C) do not replace capabilities, and model size (D) does not address an oversized tool set.',
    },
  ],
  statements: [
    { text: 'A Skill can give an agent a capability that none of its tools provide.', isTrue: false, explanation: 'Skills are instructions and supporting files; they direct how existing tools are used.' },
    { text: 'Progressive disclosure means a Skill\'s full content loads only when the task matches its description.', isTrue: true, explanation: 'Only name and description are always in context.' },
    { text: 'An MCP server is the right choice whenever you need one custom action in one application.', isTrue: false, explanation: 'A custom tool is smaller; MCP earns its cost through reuse across apps and hosts.' },
    { text: 'Universal conventions belong in CLAUDE.md while task-specific procedures belong in Skills.', isTrue: true, explanation: 'This keeps the always-loaded context small.' },
    { text: 'Anthropic recommends building custom MCP servers for standard systems like Jira rather than using community servers.', isTrue: false, explanation: 'Prefer existing maintained servers for standard integrations; write custom servers for team-specific workflows.' },
    { text: 'A Skill can reference MCP tools by name and restrict itself to them with allowed-tools.', isTrue: true, explanation: 'The mechanisms compose: Skills supply the procedure, MCP supplies the capability.' },
    { text: 'Adding more tools and servers generally makes an agent more capable with no downside.', isTrue: false, explanation: 'Capability bloat raises token cost and degrades tool selection; scope per role.' },
  ],
  resources: [
    { label: 'Agent Skills overview (Claude docs)', url: 'https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview' },
    { label: 'Skills in Claude Code', url: 'https://code.claude.com/docs/en/skills' },
    { label: 'Connect Claude Code to MCP servers', url: 'https://code.claude.com/docs/en/mcp' },
    { label: 'Tool use overview (Claude docs)', url: 'https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview' },
  ],
};
