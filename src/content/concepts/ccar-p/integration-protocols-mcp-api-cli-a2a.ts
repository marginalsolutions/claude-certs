import type { Concept } from '../../types';

export const integrationProtocolsMcpApiCliA2a: Concept = {
  id: 'integration-protocols-mcp-api-cli-a2a',
  title: 'Integration Protocols: MCP, API/SDK, CLI and Agent-to-Agent',
  summary:
    'Choose how Claude connects to systems and to other agents: MCP for reusable, governed tool access; direct API/SDK tools for owned, latency-sensitive integrations; Claude Code headless for pipelines; agent-to-agent handoffs for delegation; and progressive tool discovery instead of loading everything.',
  certs: ['ccar-p', 'ccar-f', 'ccdv-f'],
  domains: ['ccar-p-3', 'ccar-p-1', 'ccar-f-2', 'ccdv-f-8', 'ccdv-f-2', 'ccdv-f-3'],
  tags: ['mcp', 'api', 'sdk', 'cli', 'agent-to-agent', 'tool-discovery', 'integration'],
  difficulty: 'advanced',
  diagram: 'mcp-architecture',
  sections: [
    {
      heading: 'The four integration mechanisms',
      body: `| Mechanism | What it is | Where it runs |
|---|---|---|
| MCP (Model Context Protocol) | An open protocol exposing tools, resources and prompts from a server to any MCP host; transports are stdio (local) and Streamable HTTP (remote; SSE is legacy) | Claude Code, Claude Desktop, Claude.ai connectors, Agent SDK, Managed Agents, or server-side through the Messages API MCP connector |
| Direct API/SDK tools | Tool definitions in your own code, executed by your application in a tool-use loop (manual loop or SDK Tool Runner) | Your service |
| CLI (Claude Code headless) | \`claude -p\` runs a full agent with built-in tools, CLAUDE.md, Skills and MCP servers from a shell, returning text or JSON | CI pipelines, scripts, batch jobs |
| Agent-to-agent | One agent delegates to another: subagents in the Agent SDK or Managed Agents, or a handoff to a separately deployed agent over an API | Within one system or across teams |

They are not competitors so much as layers: an MCP server can be called from a direct tool loop, Claude Code can use MCP servers, and an agent-to-agent handoff can wrap any of them. The architect's job is to pick the mechanism that matches ownership, reuse, governance and latency requirements for each integration.`,
    },
    {
      heading: 'Decision criteria',
      body: `**Reuse.** If the same capability (CRM access, ticketing, document search) will be used by several agents, surfaces or teams, build it once as an MCP server. Each consumer gets the same tools, descriptions, error semantics and authorisation. If only one application needs it, a direct tool in that application is simpler.

**Governance.** MCP servers are a natural control point: central ownership, versioning, OAuth scopes, allow-lists of exposed tools, logging. Enterprises standardise on MCP for sanctioned integrations for this reason. Direct tools are governed by the owning team's code review alone.

**Latency and ownership.** A direct tool is an in-process function call; a remote MCP server adds a network hop and a dependency on another team's uptime. Latency-critical, tightly owned integrations favour direct tools. Local stdio MCP servers remove the network hop but tie the server to the host machine.

**Pipelines vs products.** Claude Code headless fits CI and scripted tasks that need a full agent with file and shell access, structured JSON output and project configuration. It is not a substitute for an API integration inside a customer-facing product.

**Delegation across boundaries.** Agent-to-agent is for handing a bounded task to a different agent with its own prompt, tools and possibly team: a research lead delegating to readers, a support agent handing off to a billing agent. Define the contract (input, output schema, errors, budget) as for any service. Prefer subagents within one system; reserve cross-system handoffs for genuinely separate ownership.`,
    },
    {
      heading: 'Progressive tool discovery versus loading everything',
      body: `Enterprises accumulate hundreds of tools across MCP servers. Loading every definition into every request has three costs: tokens on every call, slower time to first token, and worse tool selection as similarly named tools compete.

Progressive discovery mechanisms:

- **Tool search tool** (\`tool_search_tool_regex_20251119\` or the BM25 variant): tools marked \`defer_loading: true\` are declared but not placed in the model's context until the model searches for them. A small core set stays loaded.
- **Mid-conversation tool changes** (beta): your application adds or removes tools by reference between turns when a mode changes, without invalidating the cached prefix. Tool search is for the model discovering tools; tool changes are for the application controlling them.
- **MCP client allow-lists**: expose only the tools a role needs from each server.
- **Skills**: package a procedure and its supporting files so they load when relevant rather than living permanently in the prompt.
- **Subagents**: a specialist agent holds its own tool set; the coordinator does not carry it.

When to load everything: small tool sets (roughly under 20 tools) that are used on most calls and cache well. When to discover progressively: large catalogues, long-tail tools, or multi-domain agents. The test is the same as for context in general: what fraction of the loaded tools does a typical request use?`,
    },
    {
      heading: 'Platform specifics and the exam angle',
      body: `Facts that matter for design:

- MCP primitives are **tools, resources and prompts**; hosts contain clients; each client connects to one server. Claude Code configures servers at project scope (\`.mcp.json\`) and user scope (\`~/.claude.json\`).
- The **MCP connector** in the Messages API (beta \`mcp-client-2025-11-20\`) lets Claude call a remote MCP server server-side with \`mcp_servers\` and an \`mcp_toolset\` entry; it is available on the first-party API and Claude Platform on AWS, not on Bedrock or Vertex AI. Elsewhere, host the MCP client in your application.
- Remote MCP authentication uses **OAuth 2.1**; see the authentication concept.
- Claude Code headless: \`-p\`, \`--output-format json\`, \`--json-schema\`, with \`settings.json\` permissions and hooks as guardrails.
- Agent SDK subagents are defined with \`AgentDefinition\` and invoked through the Task tool; Managed Agents multi-agent sessions use a roster of agents, each in its own thread.

Exam stems describe an integration need (several teams need the same CRM access; a CI job must review PRs; a support agent must hand billing disputes to a billing specialist; an agent has 300 tools) and ask for the mechanism. Match: shared and governed → MCP; owned and latency-critical → direct tool; pipeline with file and shell access → Claude Code headless; bounded delegation → agent-to-agent with a contract; large catalogue → progressive discovery. Distractors load every tool into every request, build a bespoke integration per team for a shared system, or use a chat product where an API integration is required.`,
    },
  ],
  examples: [
    {
      title: 'Shared CRM access as one MCP server for five teams',
      description:
        'Five product teams each built their own CRM tools with different descriptions, error formats and credentials. The platform team replaced them with one remote MCP server (Streamable HTTP, OAuth 2.1 with per-user tokens, versioned tool schemas, central logging). Teams consume it from Claude Code, the Agent SDK and the Messages API MCP connector. A field rename now happens in one place.',
      language: 'python',
      code: `resp = client.beta.messages.create(
    model="claude-opus-5-5", max_tokens=1024,
    betas=["mcp-client-2025-11-20"],
    mcp_servers=[{"type": "url", "url": "https://crm-mcp.corp.example/mcp",
                  "name": "crm", "authorization_token": user_scoped_token}],
    tools=[{"type": "mcp_toolset", "mcp_server_name": "crm"}],
    system=SUPPORT_PROMPT,
    messages=[{"role": "user", "content": question}],
)`,
      takeaway: 'Build shared, governed integrations once as MCP servers and consume them from every surface.',
    },
    {
      title: 'Progressive discovery for a 300-tool enterprise agent',
      description:
        'An internal assistant spans HR, finance, IT and facilities with 300 tools across eight MCP servers. Loading everything cost 90,000 tokens per request. The redesign keeps 12 core tools loaded, defers the rest behind the tool search tool, and applies per-role allow-lists at the MCP client. Prefix tokens fell by 90% and wrong-tool selections dropped sharply.',
      language: 'typescript',
      code: `const tools = [
  { type: "tool_search_tool_regex_20251119", name: "tool_search_tool_regex" },
  ...CORE_TOOLS,                                      // 12 always loaded
  ...LONG_TAIL_TOOLS.map((t) => ({ ...t, defer_loading: true })),   // 288 discovered on demand
];
const res = await client.messages.create({
  model: "claude-opus-5-5", max_tokens: 2048, tools, system: SYSTEM,
  messages: [{ role: "user", content: request }],
});`,
      takeaway: 'Keep a small core set loaded and let the model search for the long tail; combine with role allow-lists.',
    },
    {
      title: 'Mistake: a chat product where an API integration was needed',
      description:
        'A team prototyped a document-triage workflow in Claude.ai with Projects and then tried to run production volume through it by copy-pasting. There was no schema enforcement, no audit trail, no retries and no cost attribution. The production design moved to the Messages API with structured outputs for interactive cases and the Batches API for the nightly backlog, with the prompt reused from the prototype.',
      takeaway: 'Chat products are for people; pipelines and products integrate through the API, SDKs or Claude Code headless.',
    },
    {
      title: 'Claude Code headless in CI versus an API integration',
      description:
        'A security team needed dependency-vulnerability triage on every pull request, requiring file reads, running the scanner and applying project conventions from CLAUDE.md. Claude Code headless with JSON output and read-only permissions fit the job; wiring the same capability through a bespoke API tool loop would have meant re-implementing file access, shell execution and configuration loading.',
      language: 'bash',
      code: `claude -p "Triage the scanner output in scan.json against our policy in .claude/rules/security.md. \\
Return only findings requiring action." \\
  --output-format json --json-schema "$(cat triage.schema.json)" \\
  --allowedTools "Read,Grep,Glob,Bash(npm audit*)" > triage.json`,
      takeaway: 'When a pipeline step needs a full agent with file, shell and project configuration, Claude Code headless is the right mechanism.',
    },
  ],
  keyPoints: [
    'Four mechanisms: MCP (reusable, governed tool access), direct API/SDK tools (owned, in-process), Claude Code headless (pipelines with file and shell access), agent-to-agent (bounded delegation).',
    'Choose by reuse, governance, latency and ownership; the mechanisms layer rather than compete.',
    'Shared capabilities used by several teams or surfaces belong in an MCP server with OAuth scopes, versioning and allow-lists.',
    'Latency-critical, single-owner integrations are simpler as direct tools in the application.',
    'Agent-to-agent handoffs need a contract: input, output schema, errors, budget; prefer subagents within one system.',
    'Progressive discovery (tool search with defer_loading, allow-lists, Skills, subagents) beats loading every tool when catalogues are large.',
    'The MCP connector (beta mcp-client-2025-11-20) is first-party and Claude Platform on AWS only; elsewhere host the MCP client in the application.',
    'MCP primitives are tools, resources and prompts; transports are stdio and Streamable HTTP; remote auth is OAuth 2.1.',
  ],
  flashcards: [
    { front: 'Name the four integration mechanisms in the CCAR-P blueprint and one fit for each.', back: 'MCP (shared, governed tools), direct API/SDK tools (owned, latency-critical), CLI/Claude Code headless (CI pipelines), agent-to-agent (bounded delegation).' },
    { front: 'When should a capability become an MCP server rather than a direct tool?', back: 'When several agents, surfaces or teams need it and central governance (auth, versioning, logging) matters.' },
    { front: 'What are MCP\'s three primitives and two current transports?', back: 'Tools, resources, prompts; stdio and Streamable HTTP (SSE is legacy).' },
    { front: 'How does the tool search tool enable progressive discovery?', back: 'Tools declared with defer_loading: true are not in context until the model searches for them with tool_search_tool_regex_20251119 (or the BM25 variant).' },
    { front: 'Tool search vs mid-conversation tool changes?', back: 'Tool search lets the model discover tools; tool changes let the application add or remove tools between turns without breaking the cache.' },
    { front: 'Where is the MCP connector available?', back: 'First-party Claude API and Claude Platform on AWS (beta mcp-client-2025-11-20); not on Bedrock or Vertex AI.' },
    { front: 'Which Claude Code flags make it a pipeline step?', back: '-p (headless), --output-format json, --json-schema, plus settings.json permissions or --allowedTools.' },
    { front: 'What must an agent-to-agent handoff define?', back: 'A contract: input, output schema with status and provenance, error semantics, budget and authority.' },
    { front: 'When is loading every tool definition acceptable?', back: 'Small tool sets (roughly under 20) used on most calls that cache well.' },
  ],
  quiz: [
    {
      question:
        'Five product teams have each built their own Claude tools for the same CRM, with inconsistent descriptions, error formats and credentials. Which integration approach BEST addresses this?',
      options: [
        'Ask each team to copy the best-written tool definitions.',
        'Build one governed MCP server for the CRM with OAuth scopes, versioned schemas and logging, consumed by all teams.',
        'Give every team the same admin service account.',
        'Move all teams to Claude.ai connectors.',
      ],
      correct: [1],
      explanation:
        'Shared, governed capability is MCP\'s purpose. Copying definitions (1) still drifts; a shared admin account (3) is an authorisation gap; chat connectors (4) do not serve API products.',
    },
    {
      question:
        'An enterprise assistant loads 300 tool definitions (90,000 tokens) on every request and often picks a wrong, similarly named tool. Which change is MOST appropriate?',
      options: [
        'Keep a small core set loaded and defer the rest behind the tool search tool, with per-role allow-lists at the MCP client.',
        'Increase effort so the model reads the tool list more carefully.',
        'Rename all tools with numeric prefixes.',
        'Split the request across three models, each receiving 100 tools.',
      ],
      correct: [0],
      explanation:
        'Progressive discovery cuts tokens and confusion. Effort (2) does not fix an oversized list; renaming (3) does not reduce size; splitting across models (4) triples cost and complicates routing.',
    },
    {
      question: 'Which TWO scenarios fit Claude Code headless better than a Messages API integration? (Select two)',
      options: [
        'A CI job that must read repository files, run a scanner and apply project conventions from CLAUDE.md.',
        'A customer-facing chat feature inside a mobile app.',
        'A nightly script that applies a documented refactor across a repository and opens a pull request.',
        'A high-volume classification service with a 300 ms latency target.',
      ],
      correct: [0, 2],
      explanation:
        'Pipeline tasks needing a full agent with file and shell access fit headless Claude Code. Customer-facing features (2) and low-latency services (4) are API integrations.',
    },
    {
      question:
        'A support agent must hand billing disputes to a billing specialist agent owned by another team. Which design is MOST appropriate?',
      options: [
        'Give the support agent all billing tools so no handoff is needed.',
        'Define an agent-to-agent handoff contract (input, output schema, errors, budget) and pass a self-contained brief, not the full conversation.',
        'Forward the entire conversation history and all tools to the billing agent.',
        'Merge both agents into one with a longer system prompt.',
      ],
      correct: [1],
      explanation:
        'Cross-team delegation needs a contract and a minimal brief. Granting all billing tools (1) is capability bloat; forwarding everything (3) inflates cost and leaks context; merging (4) removes specialisation and least privilege.',
    },
    {
      question:
        'An architect designs a Bedrock-hosted agent that calls a remote MCP server through the Messages API MCP connector. What is the problem?',
      options: [
        'MCP servers cannot use OAuth.',
        'The MCP connector is not available on Amazon Bedrock; the MCP client must be hosted in the application instead.',
        'Bedrock does not support tool use.',
        'Remote MCP servers only support stdio transport.',
      ],
      correct: [1],
      explanation:
        'The connector is first-party and Claude Platform on AWS only. OAuth (1) is the standard for remote MCP; Bedrock supports tool use (3); remote servers use Streamable HTTP (4).',
    },
  ],
  statements: [
    { text: 'MCP, direct API tools, Claude Code headless and agent-to-agent handoffs are mutually exclusive choices for an architecture.', isTrue: false, explanation: 'They layer: MCP servers can be used from tool loops, Claude Code uses MCP, and handoffs can wrap any of them.' },
    { text: 'A capability needed by several teams and surfaces is a strong candidate for an MCP server.', isTrue: true, explanation: 'Reuse and central governance are the primary reasons to build an MCP server.' },
    { text: 'Tools marked defer_loading are placed in the model\'s context on every request like any other tool.', isTrue: false, explanation: 'They are declared but loaded only when the model discovers them through the tool search tool.' },
    { text: 'The Messages API MCP connector is available on Amazon Bedrock and Vertex AI.', isTrue: false, explanation: 'It is available on the first-party API and Claude Platform on AWS only.' },
    { text: 'MCP\'s current transports are stdio and Streamable HTTP, with SSE considered legacy.', isTrue: true, explanation: 'Streamable HTTP replaced the earlier SSE transport for remote servers.' },
    { text: 'Claude Code headless mode can return JSON conforming to a schema for use in CI pipelines.', isTrue: true, explanation: 'Use -p with --output-format json and --json-schema.' },
    { text: 'For a latency-critical integration owned by a single team, a remote MCP server is always preferable to a direct tool.', isTrue: false, explanation: 'A direct in-process tool avoids a network hop and an external dependency; MCP pays off with reuse and governance.' },
  ],
  resources: [
    { label: 'Model Context Protocol specification', url: 'https://modelcontextprotocol.io/specification/latest' },
    { label: 'MCP connector (Claude docs)', url: 'https://platform.claude.com/docs/en/agents-and-tools/mcp-connector' },
    { label: 'Tool search tool (Claude docs)', url: 'https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool' },
    { label: 'Run Claude Code programmatically (headless)', url: 'https://code.claude.com/docs/en/headless' },
  ],
};
