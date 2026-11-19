import type { Concept } from '../../types';

export const buildingMcpServers: Concept = {
  id: 'building-mcp-servers',
  title: 'Building MCP Servers',
  summary:
    'Author an MCP server with the official SDKs, define tools, resources and prompts, return structured errors, choose stdio or remote HTTP deployment, handle auth, test with the inspector, and register it in Claude Code at project or user scope.',
  certs: ['ccdv-f', 'ccar-f'],
  domains: ['ccdv-f-8', 'ccdv-f-3', 'ccar-f-2', 'ccar-f-3'],
  tags: ['mcp', 'server', 'fastmcp', 'claude-code', 'deployment'],
  difficulty: 'intermediate',
  sections: [
    {
      heading: 'Authoring with the official SDKs',
      body: `The reference SDKs (Python \`mcp\` with its \`FastMCP\` class, TypeScript \`@modelcontextprotocol/sdk\`, plus Java, Kotlin, C#, Go and others) handle the protocol: JSON-RPC framing, the \`initialize\` handshake, capability negotiation, list/call dispatch. You write the capabilities.

In Python, \`FastMCP\` turns decorated functions into capabilities and derives the JSON Schema from type hints and the docstring:

- \`@mcp.tool()\` → a tool; the docstring becomes the description the model reads, so write it as you would a Claude tool description (what, when, when not, formats).
- \`@mcp.resource("schema://tables/{name}")\` → a resource or resource template addressed by URI.
- \`@mcp.prompt()\` → a reusable prompt template with arguments.

In TypeScript you create a \`McpServer\`, call \`server.registerTool(name, { description, inputSchema: zodShape }, handler)\` (and the equivalent \`registerResource\` / \`registerPrompt\`), then connect a transport.

Design the tool surface deliberately. Few, well-named, purpose-specific tools beat one generic \`run_query\`; include only what the consuming agents need; make descriptions detailed enough that the model prefers your tool over a built-in one when yours is better (a semantic code-search tool with a thin description loses to Grep).`,
    },
    {
      heading: 'Structured errors with isError',
      body: `A tool handler can fail in two ways. A **protocol error** (unknown tool, malformed request) is a JSON-RPC error. A **tool execution error** (the operation ran and failed) is returned as a normal result with \`isError: true\` and content describing the failure. The model sees the second kind and can recover; it does not see protocol errors in a useful form. Raise exceptions for bugs; return \`isError\` results for expected failures.

Uniform messages ("Operation failed") make recovery impossible. Structure the error so the agent can decide:

\`\`\`json
{"isError": true, "content": [{"type": "text", "text": "{\\"errorCategory\\": \\"transient\\", \\"isRetryable\\": true, \\"message\\": \\"Inventory API timed out after 5s\\"}"}]}
\`\`\`

Categories worth distinguishing:

| Category | Retry? | Example |
|---|---|---|
| transient | yes, with backoff | timeout, 503, rate limit |
| validation | no; fix the input | malformed id, missing field |
| business | no; explain to user | refund exceeds policy limit |
| permission | no; escalate | caller lacks scope |

Also separate **failure** from **empty success**: a search with zero matches is a successful result with an empty list, not an error. In multi-agent systems, subagents should retry transient errors locally and propagate only unrecoverable errors upward with partial results and a note of what was attempted.`,
    },
    {
      heading: 'Deployment, auth and testing',
      body: `**Local stdio.** The host launches your server as a subprocess (\`python server.py\`, \`npx my-server\`). Use \`mcp.run()\` (default transport stdio) or connect a \`StdioServerTransport\`. Credentials come from environment variables the host passes. Best for single-user developer tooling, file-system access and anything that should inherit the local environment. Never write to stdout except protocol messages; log to stderr.

**Remote Streamable HTTP.** Run the server as an HTTP service (\`mcp.run(transport="streamable-http")\` or the SDK's HTTP transport behind Express/FastAPI). Needed for shared, multi-user servers and for the Messages API MCP connector and Managed Agents, which only connect to URLs. Secure it with the specification's OAuth 2.1 authorization flow, or at minimum a bearer token checked on every request, and validate the \`Origin\` header to prevent DNS-rebinding attacks. Make the server stateless where you can so it scales horizontally.

**Testing.** The **MCP Inspector** (\`npx @modelcontextprotocol/inspector <command>\`) is an interactive UI that connects to your server, lists tools, resources and prompts, lets you call them with arguments, and shows raw protocol traffic. Use it before wiring the server into any host. Add unit tests for handlers and an integration test that starts the server, runs \`initialize\` and \`tools/list\`, and asserts the schema you expect. Then test tool *selection* with the actual model: a correct server with a weak description will still be misused.`,
    },
    {
      heading: 'Registering a server in Claude Code',
      body: `Claude Code reads MCP configuration from two scopes:

| Scope | File | Purpose |
|---|---|---|
| **Project** | \`.mcp.json\` at the repository root (committed) | Shared team tooling; everyone who clones the repo gets the same servers |
| **User** | \`~/.claude.json\` | Personal or experimental servers available in all your projects |

Add servers with \`claude mcp add\` (choose the scope with \`--scope project\` or \`--scope user\`) or edit the JSON directly. Each entry names a stdio server (\`command\`, \`args\`, \`env\`) or a remote one (\`type: "http"\`, \`url\`, \`headers\`).

Secrets never go into \`.mcp.json\` in plain text because the file is committed. Use **environment variable expansion**: \`"\${GITHUB_TOKEN}"\` (with an optional default \`"\${VAR:-default}"\`) is resolved from the user's environment at launch. Claude Code asks for approval the first time it loads project-scoped servers from a repository, since they can run arbitrary commands.

Once connected, the server's tools appear as \`mcp__<server>__<tool>\` and can be allowed or denied in \`settings.json\` permissions, restricted per subagent, and intercepted by hooks. \`/mcp\` inside Claude Code shows connection status and lets you authenticate remote servers. The same configuration shape is understood by the Agent SDK's \`mcpServers\` option.`,
    },
  ],
  examples: [
    {
      title: 'A FastMCP server with a tool, a resource and structured errors',
      description:
        'An inventory server for internal Claude apps. The tool docstring is the model-facing description; failures are returned as results with isError and a category so the agent can decide whether to retry.',
      language: 'python',
      code: `import json, os
from mcp.server.fastmcp import FastMCP
from mcp.types import TextContent, CallToolResult

mcp = FastMCP("inventory")

@mcp.tool()
def check_stock(sku: str, warehouse: str = "BER") -> CallToolResult:
    """Return on-hand quantity for a SKU at one warehouse.
    Use when a user asks whether an item is available. SKU format: four digits.
    Not for reservations; use reserve_stock for that."""
    try:
        qty = inventory_api.quantity(sku, warehouse, token=os.environ["INVENTORY_TOKEN"])
    except TimeoutError:
        err = {"errorCategory": "transient", "isRetryable": True, "message": "inventory API timed out"}
        return CallToolResult(isError=True, content=[TextContent(type="text", text=json.dumps(err))])
    return CallToolResult(content=[TextContent(type="text", text=json.dumps({"sku": sku, "qty": qty}))])

@mcp.resource("inventory://warehouses")
def warehouses() -> str:
    """Catalog of warehouse codes and locations."""
    return json.dumps(inventory_api.warehouses())

if __name__ == "__main__":
    mcp.run()  # stdio by default; transport="streamable-http" for remote`,
      takeaway: 'Docstrings are descriptions, isError results are recoverable, resources expose catalogs.',
    },
    {
      title: 'Registering the server at project scope with env-var expansion',
      description:
        'The team commits .mcp.json so every engineer gets the inventory server. The token is read from each user\'s environment and never enters the repository.',
      language: 'json',
      code: `{
  "mcpServers": {
    "inventory": {
      "command": "python",
      "args": ["tools/mcp/inventory_server.py"],
      "env": { "INVENTORY_TOKEN": "\${INVENTORY_TOKEN}" }
    },
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/",
      "headers": { "Authorization": "Bearer \${GITHUB_TOKEN}" }
    }
  }
}`,
      takeaway: 'Project scope for shared tooling, env-var expansion for credentials.',
    },
    {
      title: 'The mistake: the agent ignores the custom search server',
      description:
        'A team built a semantic code-search MCP server but Claude Code kept using Grep. The tool description was "Search code". Rewriting it to explain the capability ("Semantic search over the indexed codebase; finds functions by meaning, not text. Use for questions like \'where is retry logic\' when exact names are unknown; returns file, line and a snippet. Prefer Grep for exact strings.") made the agent choose it for conceptual queries and Grep for exact matches.',
      language: 'text',
      code: `Before: "Search code"
After:  "Semantic search over the indexed codebase. Finds functions by meaning
         rather than exact text. Use for conceptual questions ('where is retry
         logic?'). Returns {file, line, snippet}. For exact strings use Grep."`,
      takeaway: 'MCP tools compete with built-in tools; the description decides who wins.',
    },
  ],
  keyPoints: [
    'Official SDKs (Python FastMCP, TypeScript McpServer) handle the protocol; you write tools, resources and prompts with decorators or register* calls.',
    'The tool docstring/description is what the model reads; write it like any Claude tool description.',
    'Return expected failures as results with isError: true and structured metadata (errorCategory, isRetryable, message); reserve exceptions for bugs.',
    'Distinguish transient, validation, business and permission errors, and empty results from failures.',
    'stdio for local single-user servers (log to stderr); Streamable HTTP with OAuth 2.1 or bearer auth for remote, shared servers and for the MCP connector / Managed Agents.',
    'Test with the MCP Inspector, then with the real model to check tool selection.',
    'Claude Code scopes: project .mcp.json (committed, shared) vs user ~/.claude.json (personal); use ${VAR} expansion for secrets.',
    'MCP tools appear as mcp__<server>__<tool> and can be permissioned, scoped per subagent and hooked.',
  ],
  flashcards: [
    { front: 'Which Python class is the quickest way to author an MCP server?', back: 'FastMCP from the mcp package, with @mcp.tool(), @mcp.resource() and @mcp.prompt() decorators.' },
    { front: 'Where does the model-facing description of a FastMCP tool come from?', back: 'The function docstring (plus type hints for the schema).' },
    { front: 'How should a tool report an expected failure in MCP?', back: 'Return a result with isError: true and descriptive content; do not raise a protocol error.' },
    { front: 'Why return structured error metadata instead of "Operation failed"?', back: 'So the agent can decide whether to retry (transient), fix input (validation), explain (business) or escalate (permission).' },
    { front: 'Which transport should a local developer-tool server use, and what must it avoid?', back: 'stdio; it must not print non-protocol output to stdout (log to stderr).' },
    { front: 'Which transport do the Messages API MCP connector and Managed Agents require?', back: 'Remote Streamable HTTP (a URL).' },
    { front: 'What is the MCP Inspector?', back: 'An interactive tool (npx @modelcontextprotocol/inspector) for connecting to a server, listing and calling its tools, resources and prompts, and viewing protocol traffic.' },
    { front: 'Project vs user scope in Claude Code: which file is which?', back: 'Project: .mcp.json in the repo root (shared). User: ~/.claude.json (personal, all projects).' },
    { front: 'How do you keep tokens out of a committed .mcp.json?', back: 'Reference environment variables with ${VAR} (or ${VAR:-default}) expansion.' },
    { front: 'How are MCP tools named inside Claude Code and why does it matter?', back: 'mcp__<server>__<tool>; the names are used in settings.json permissions, subagent tool lists and hook matchers.' },
  ],
  quiz: [
    {
      question:
        'An MCP tool returns the string "Operation failed" for every problem. The agent retries validation errors endlessly and gives up on transient ones. What should the server author change?',
      options: [
        'Raise a JSON-RPC protocol error for all failures.',
        'Return isError results with structured metadata such as errorCategory and isRetryable so the agent can choose a recovery.',
        'Increase the tool\'s timeout.',
        'Add a system prompt instruction telling the agent to retry three times.',
      ],
      correct: [1],
      explanation:
        'Structured, categorized errors let the agent distinguish retryable from non-retryable failures. Protocol errors (A) hide information from the model, timeouts (C) do not address validation errors, and a blanket retry rule (D) wastes attempts on non-retryable failures.',
    },
    {
      question:
        'A team wants every engineer who clones the repository to get the same Jira MCP server, authenticated with each person\'s own token, without committing secrets. Which configuration is correct?',
      options: [
        'Add the server to each engineer\'s ~/.claude.json with their token pasted in.',
        'Add the server to the project\'s .mcp.json with the token referenced as ${JIRA_TOKEN}.',
        'Add the server to .mcp.json with a shared service token committed in the file.',
        'Add the server definition to CLAUDE.md.',
      ],
      correct: [1],
      explanation:
        'Project scope shares the configuration; env-var expansion keeps the secret out of the repo. User scope (A) is not shared, committing a token (C) leaks it, and CLAUDE.md (D) does not configure servers.',
    },
    {
      question:
        'Which TWO practices are correct for a stdio MCP server? (Select two)',
      options: [
        'Write debug logs to stdout so the host can see them.',
        'Read credentials from environment variables passed by the host.',
        'Log to stderr, keeping stdout for protocol messages only.',
        'Require OAuth 2.1 for every stdio connection.',
      ],
      correct: [1, 2],
      explanation:
        'stdio uses stdout for JSON-RPC, so logs go to stderr, and credentials arrive via environment. Writing logs to stdout (A) corrupts the protocol stream; OAuth (D) is for remote HTTP servers.',
    },
    {
      question:
        'A correct, well-tested MCP semantic-search server is never chosen by the agent, which keeps using Grep. What is the most likely fix?',
      options: [
        'Switch the server from stdio to Streamable HTTP.',
        'Rewrite the tool description to explain the capability, output and when to prefer it over Grep.',
        'Remove Grep from the agent\'s built-in tools.',
        'Upgrade the model.',
      ],
      correct: [1],
      explanation:
        'Tool selection is driven by descriptions, and a thin one loses to familiar built-ins. Transport (A) does not affect selection, removing Grep (C) harms exact-match searches, and the model (D) is not the bottleneck.',
    },
    {
      question:
        'A developer wants to verify a new MCP server\'s tools, schemas and responses before connecting it to Claude Code. Which is the most direct approach?',
      options: [
        'Run the MCP Inspector against the server and call the tools interactively.',
        'Add the server to .mcp.json and ask Claude whether it looks right.',
        'Deploy it to production behind OAuth and watch the logs.',
        'Write the schema by hand in a text file and compare visually.',
      ],
      correct: [0],
      explanation:
        'The Inspector exists for exactly this. Asking the model (B) is indirect, production deployment (C) is premature, and manual comparison (D) does not exercise the server.',
    },
  ],
  statements: [
    { text: 'In FastMCP, a tool\'s docstring becomes the description the model reads.', isTrue: true, explanation: 'Write it like any Claude tool description: what, when, when not, formats.' },
    { text: 'Tool execution failures should be raised as JSON-RPC protocol errors so the client can handle them.', isTrue: false, explanation: 'Expected failures are returned as results with isError: true so the model can recover; protocol errors are for malformed requests.' },
    { text: 'A search that returns no matches should set isError: true.', isTrue: false, explanation: 'Empty results are successful queries; isError is for failures.' },
    { text: 'Project-scoped MCP servers live in .mcp.json at the repository root and are shared with the team.', isTrue: true, explanation: 'User-scoped servers live in ~/.claude.json.' },
    { text: '.mcp.json supports ${VAR} environment variable expansion for credentials.', isTrue: true, explanation: 'This keeps secrets out of version control.' },
    { text: 'The Messages API MCP connector can connect to a server that uses the stdio transport.', isTrue: false, explanation: 'The connector and Managed Agents connect to remote Streamable HTTP URLs only.' },
    { text: 'Claude Code prompts for approval before loading project-scoped MCP servers from a newly cloned repository.', isTrue: true, explanation: 'Project servers can run arbitrary commands, so first use requires consent.' },
    { text: 'Once a server is correct and tested with the Inspector, the model will reliably select its tools.', isTrue: false, explanation: 'Selection depends on descriptions; test with the real model and refine descriptions.' },
  ],
  resources: [
    { label: 'Build an MCP server (modelcontextprotocol.io)', url: 'https://modelcontextprotocol.io/docs/develop/build-server' },
    { label: 'MCP Inspector', url: 'https://modelcontextprotocol.io/docs/tools/inspector' },
    { label: 'Connect Claude Code to tools via MCP', url: 'https://code.claude.com/docs/en/mcp' },
    { label: 'MCP in the Agent SDK', url: 'https://code.claude.com/docs/en/agent-sdk/mcp' },
  ],
};
