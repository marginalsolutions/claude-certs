import type { Concept } from '../../types';

export const mcpServersInClaudeCode: Concept = {
  id: 'mcp-servers-in-claude-code',
  title: 'Integrating MCP Servers into Claude Code and Agents',
  summary:
    'MCP servers plug external systems into Claude Code and the Agent SDK. Know where configuration lives (project .mcp.json vs user ~/.claude.json), how ${ENV} expansion keeps secrets out of git, how tools are discovered at connect time, and when resources and richer descriptions make MCP tools get used.',
  certs: ['ccar-f', 'ccdv-f', 'ccar-p'],
  domains: ['ccar-f-2', 'ccar-f-3', 'ccdv-f-8', 'ccar-p-3', 'ccar-p-7'],
  tags: ['mcp', 'claude-code', 'configuration', '.mcp.json', 'resources', 'agent-sdk'],
  difficulty: 'intermediate',
  diagram: 'mcp-architecture',
  sections: [
    {
      heading: 'Scopes: where an MCP server is configured',
      body: `Claude Code is an MCP **host**: it runs an MCP client for each configured server. Where you configure a server decides who gets it.

| Scope | File | Shared via git? | Use for |
|---|---|---|---|
| **Project** | \`.mcp.json\` in the repo root | Yes | Team tooling everyone needs: the issue tracker, the design system docs, the internal API server |
| **User** | \`~/.claude.json\` (user section) | No | Personal or experimental servers you are trying out |
| **Local** | \`~/.claude.json\` (per-project section) | No | Private, project-specific servers (e.g. with your own credentials) |

\`claude mcp add --scope project|user|local ...\` writes the right file. All scopes load together; a developer with a project server and two personal servers sees all of them. Project-scoped servers prompt for approval the first time because a cloned repo could otherwise run arbitrary commands on your machine.

The design decision the exam tests: **shared, standard team tooling belongs in project \`.mcp.json\`; personal or experimental servers belong in user scope.** Putting a personal experiment in \`.mcp.json\` pushes it onto every teammate; putting the team's Jira server in user scope means each developer configures it by hand and drift follows.`,
    },
    {
      heading: 'Credentials: ${ENV} expansion',
      body: `\`.mcp.json\` is committed, so it must never contain tokens. It supports **environment variable expansion**: \`\${GITHUB_TOKEN}\` is replaced from the environment at connect time, and \`\${VAR:-default}\` supplies a fallback. Expansion works in \`command\`, \`args\`, \`env\`, \`url\` and \`headers\`.

The pattern is: the committed file names the variable; each developer (or the CI runner) sets it in their shell or secret store. If the variable is missing the server fails to start, which is the behaviour you want: a loud failure rather than a silently committed secret.

The same configuration shape works in the Agent SDK through the \`mcp_servers\` option (stdio servers with \`command\`/\`args\`/\`env\`, or HTTP servers with \`url\`/\`headers\`), so a server you prototyped in Claude Code moves into an agent without rewriting.`,
    },
    {
      heading: 'Discovery, naming and getting MCP tools chosen',
      body: `When Claude Code connects to a server it calls \`tools/list\` and registers each tool under the name \`mcp__<server>__<tool>\`. **Tools from every configured server are discovered at connection time and are available simultaneously**; nothing has to be "activated" per turn. The same holds for \`resources/list\` and \`prompts/list\`. (Slash commands exposed by a server appear as \`/mcp__server__prompt\`.)

Because all tools sit side by side with the built-ins, Claude chooses among them by description. A frequent failure in the developer-productivity scenario: a team adds a code-intelligence MCP server with a semantic \`find_references\` tool, but Claude keeps using built-in **Grep** because the MCP tool's description is a terse "Finds references". Grep's description is detailed and familiar, so it wins.

The fix is to **enrich the MCP tool description**: what it does that Grep cannot (resolves symbols through imports and re-exports, ignores comments and strings, returns file:line with the enclosing function), what input it takes, what it returns, and when to prefer it ("use instead of Grep when you need semantic references rather than text matches"). Descriptions are the lever; Claude cannot infer capability from a name.`,
    },
    {
      heading: 'Resources as catalogs, and build-vs-adopt',
      body: `MCP **resources** expose content by URI (\`jira://PROJ/issues/open\`, \`schema://warehouse/orders\`). In Claude Code they are referenced with \`@server:uri\` and can be listed by the agent. Their architectural value is as **catalogs**: a resource that lists open issue summaries, the documentation hierarchy, or the database schema gives the agent visibility into *what exists* without a series of exploratory tool calls. Instead of "call list_issues, then get_issue × 20", the agent reads one catalog resource and then calls a tool only for the items it needs. Fewer round trips, less context, more direct plans.

Finally, **adopt before you build**. For standard integrations (Jira, GitHub, Slack, Postgres, Google Drive) use an existing, maintained community or vendor server. Reserve custom servers for team-specific workflows: your internal deployment API, your proprietary data model, a tool that encodes your review checklist. Custom servers cost maintenance; a well-maintained community server costs a config entry.`,
    },
  ],
  examples: [
    {
      title: 'Project-scoped .mcp.json with environment variable expansion',
      description:
        'The team shares the GitHub and internal docs servers through git. Tokens come from each developer\'s environment, so nothing secret is committed. A default is provided for the docs URL.',
      language: 'json',
      code: `{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "\${GITHUB_TOKEN}" }
    },
    "team-docs": {
      "type": "http",
      "url": "\${DOCS_MCP_URL:-https://docs-mcp.internal.example.com/mcp}",
      "headers": { "Authorization": "Bearer \${DOCS_MCP_TOKEN}" }
    }
  }
}`,
      takeaway: 'Commit the configuration, not the credentials; ${VAR} is expanded from each environment at connect time.',
    },
    {
      title: 'Personal experimental server in user scope',
      description:
        'A developer is trying a local vector-search server. Adding it with user scope keeps it out of the repo while making it available alongside the project servers.',
      language: 'bash',
      code: `# Personal: lives in ~/.claude.json, not committed
claude mcp add --scope user vector-search -- node ~/experiments/vector-mcp/index.js

# Team: lives in .mcp.json, committed
claude mcp add --scope project jira -- npx -y @atlassian/mcp-server-jira

claude mcp list      # both appear; all tools are available simultaneously`,
      takeaway: 'User scope for personal/experimental servers, project scope for shared team tooling; both load together.',
    },
    {
      title: 'The mistake: an under-described MCP tool loses to Grep',
      description:
        'A code-intelligence server exposed find_references described as "Finds references to a symbol". The agent used Grep instead, missing re-exported usages. Rewriting the description to state what it does beyond text search, its inputs and outputs, and when to prefer it over Grep changed the agent\'s behaviour immediately.',
      language: 'text',
      code: `Before:
  find_references: "Finds references to a symbol"

After:
  find_references: "Semantic reference search using the TypeScript language service.
    Resolves a symbol through imports, re-exports and barrel files, and ignores
    matches inside comments and strings. Input: {file, line, column} or {symbolName,
    file}. Returns [{file, line, enclosingFunction, kind: 'read'|'write'|'call'}].
    Prefer this over Grep when you need actual usages of a function or type rather
    than text matches; use Grep for strings, error messages or non-code files."`,
      takeaway: 'MCP tools compete with built-ins on description quality; say what the tool does that the built-in cannot.',
    },
    {
      title: 'Exposing an issue catalog as a resource',
      description:
        'Instead of forcing the agent to call list_issues and then get_issue repeatedly, the server exposes a resource with one-line summaries of open issues. The agent reads the catalog once and calls get_issue only for the items it decides to work on.',
      language: 'typescript',
      code: `server.registerResource("open-issues", "jira://PROJ/issues/open",
  { description: "One-line summaries of all open issues: key, title, priority, assignee." },
  async (uri) => ({
    contents: [{ uri: uri.href, mimeType: "text/plain",
      text: (await jira.openIssues("PROJ"))
        .map(i => \`\${i.key} [\${i.priority}] \${i.title} (\${i.assignee ?? "unassigned"})\`)
        .join("\\n") }],
  }));`,
      takeaway: 'A catalog resource gives the agent visibility into available data without exploratory tool calls.',
    },
  ],
  keyPoints: [
    'Project scope (.mcp.json, committed) is for shared team tooling; user scope (~/.claude.json) is for personal or experimental servers; all scopes load together.',
    '.mcp.json supports ${VAR} and ${VAR:-default} expansion so credentials come from the environment, never from git.',
    'Tools (and resources, prompts) from all configured servers are discovered at connection time and available simultaneously, named mcp__<server>__<tool>.',
    'MCP tools compete with built-ins like Grep on description quality; enrich MCP descriptions with capabilities, inputs, outputs and when to prefer them.',
    'MCP resources can expose content catalogs (issue summaries, doc hierarchies, schemas) that reduce exploratory tool calls.',
    'Use existing community or vendor servers for standard integrations (Jira, GitHub); build custom servers only for team-specific workflows.',
    'The same server configuration shape works in the Agent SDK via the mcp_servers option.',
  ],
  flashcards: [
    { front: 'Where is a project-scoped MCP server configured?', back: 'In .mcp.json at the repository root, committed to version control.' },
    { front: 'Where are user-scoped MCP servers stored?', back: 'In ~/.claude.json (user section), not shared via the repo.' },
    { front: 'Which scope should the team\'s shared Jira server use?', back: 'Project scope (.mcp.json) so every teammate gets the same configuration.' },
    { front: 'How do you keep tokens out of a committed .mcp.json?', back: 'Reference environment variables with ${VAR} (or ${VAR:-default}); they are expanded at connect time.' },
    { front: 'When are MCP tools discovered?', back: 'At connection time via tools/list; tools from all servers are then available simultaneously.' },
    { front: 'How are MCP tools named inside Claude Code?', back: 'mcp__<server>__<tool>.' },
    { front: 'Why might Claude prefer built-in Grep over an MCP find_references tool?', back: 'The MCP tool\'s description is too thin; enrich it with what it does beyond text search and when to prefer it.' },
    { front: 'What are MCP resources good for architecturally?', back: 'Exposing content catalogs (issue summaries, documentation hierarchies, database schemas) so the agent sees what exists without exploratory tool calls.' },
    { front: 'Community server or custom server for GitHub integration?', back: 'Community/vendor server; reserve custom servers for team-specific workflows.' },
    { front: 'Which Agent SDK option configures MCP servers?', back: 'mcp_servers (mcpServers in TypeScript), with the same stdio/HTTP configuration shape.' },
  ],
  quiz: [
    {
      question:
        'A team wants every developer to have the same Jira MCP server, authenticated with each person\'s own token, without committing secrets. What is the correct setup?',
      options: [
        'Each developer adds the server in user scope with their token in ~/.claude.json.',
        'Configure the server in project-scoped .mcp.json with "${JIRA_TOKEN}" in its env, and have each developer set JIRA_TOKEN in their environment.',
        'Commit .mcp.json with a shared service account token.',
        'Add the server to CLAUDE.md so it is documented for manual setup.',
      ],
      correct: [1],
      explanation:
        'Project scope shares the configuration; environment variable expansion keeps the per-person token out of git. User scope causes drift across the team, a committed shared token is a secret leak, and CLAUDE.md does not configure servers.',
    },
    {
      question:
        'A developer is experimenting with a local vector-search MCP server. Which scope is appropriate?',
      options: [
        'Project scope, so teammates can review it.',
        'User scope in ~/.claude.json, keeping it personal until it proves useful.',
        'A new entry in .claude/settings.json permissions.',
        'It must be declared in the Agent SDK instead.',
      ],
      correct: [1],
      explanation:
        'Experimental and personal servers belong in user scope so they do not get pushed onto the team. settings.json permissions do not define servers, and the Agent SDK is unrelated to Claude Code configuration scope.',
    },
    {
      question:
        'After adding a code-intelligence MCP server with a semantic find_references tool, Claude Code keeps using Grep for reference searches and misses usages behind re-exports. What is the most effective fix?',
      options: [
        'Disable the Grep tool in settings.json.',
        'Enrich find_references\'s description with what it does beyond text search, its inputs and outputs, and when to prefer it over Grep.',
        'Move the server from project scope to user scope.',
        'Ask the user to type the tool name each time.',
      ],
      correct: [1],
      explanation:
        'Selection among built-ins and MCP tools is driven by descriptions; a rich description makes the MCP tool the obvious choice for semantic searches while keeping Grep for text. Disabling Grep loses a needed tool, scope does not affect selection, and manual invocation defeats the purpose.',
    },
    {
      question: 'Which TWO statements about MCP in Claude Code are correct? (Select two)',
      options: [
        'Tools from all configured servers are discovered at connect time and available at the same time.',
        'Only one MCP server can be active per session.',
        '.mcp.json supports ${VAR} expansion for values such as tokens.',
        'Servers in ~/.claude.json are automatically shared with teammates through git.',
      ],
      correct: [0, 2],
      explanation:
        'Simultaneous availability and environment expansion are both true. Multiple servers run together, and ~/.claude.json is a personal file outside the repository.',
    },
    {
      question:
        'A developer-productivity agent makes 25 tool calls per task just to discover which Jira issues exist before working on one. Which design change reduces this most directly?',
      options: [
        'Increase the agent\'s iteration cap.',
        'Expose an MCP resource that lists open issue summaries so the agent can read the catalog once.',
        'Replace the Jira MCP server with a custom one.',
        'Add the issue list to CLAUDE.md.',
      ],
      correct: [1],
      explanation:
        'A catalog resource gives visibility into available data without exploratory calls. Raising the cap tolerates the waste, a custom server is unnecessary for a standard integration, and CLAUDE.md is static and would be stale within hours.',
    },
    {
      question: 'A team needs GitHub integration for their coding agent. What should they do first?',
      options: [
        'Write a custom MCP server wrapping the GitHub REST API.',
        'Adopt the existing maintained GitHub MCP server and configure it in .mcp.json.',
        'Use Bash with curl against the GitHub API.',
        'Paste repository data into the prompt manually.',
      ],
      correct: [1],
      explanation:
        'Standard integrations should use existing community or vendor servers; custom servers are for team-specific workflows. curl via Bash is harder to gate and audit, and manual pasting does not scale.',
    },
  ],
  statements: [
    { text: 'Project-scoped MCP servers are configured in .mcp.json and shared through version control.', isTrue: true, explanation: 'This is the mechanism for team-wide tooling.' },
    { text: 'User-scoped MCP servers in ~/.claude.json are a good place for the team\'s shared issue tracker.', isTrue: false, explanation: 'User scope is personal and leads to drift; shared tooling belongs in project .mcp.json.' },
    { text: '.mcp.json can reference environment variables such as ${GITHUB_TOKEN} that are expanded at connection time.', isTrue: true, explanation: 'This keeps credentials out of the committed file.' },
    { text: 'MCP tools must be explicitly enabled per turn before Claude can call them.', isTrue: false, explanation: 'All tools from all connected servers are discovered at connect time and available simultaneously.' },
    { text: 'A terse MCP tool description can cause Claude to prefer a built-in tool such as Grep.', isTrue: true, explanation: 'Selection is description-driven; enrich the MCP description to win appropriate cases.' },
    { text: 'MCP resources are only for returning the content of individual files.', isTrue: false, explanation: 'They can expose catalogs (issue lists, doc hierarchies, schemas) that reduce exploratory tool calls.' },
    { text: 'For standard integrations like Jira, an existing community server is generally preferable to a custom implementation.', isTrue: true, explanation: 'Custom servers should be reserved for team-specific workflows.' },
    { text: 'Claude Code refers to MCP tools as mcp__<server>__<tool>.', isTrue: true, explanation: 'This naming is used in permissions, hooks and allowedTools.' },
  ],
  resources: [
    { label: 'Connect Claude Code to tools via MCP', url: 'https://code.claude.com/docs/en/mcp' },
    { label: 'MCP in the Agent SDK', url: 'https://platform.claude.com/docs/en/agent-sdk/mcp' },
    { label: 'MCP specification: resources', url: 'https://modelcontextprotocol.io/specification/latest/server/resources' },
  ],
};
