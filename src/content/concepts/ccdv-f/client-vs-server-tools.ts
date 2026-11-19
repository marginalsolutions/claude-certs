import type { Concept } from '../../types';

export const clientVsServerTools: Concept = {
  id: 'client-vs-server-tools',
  title: 'Client-Side vs Server-Side Tools',
  summary:
    'Who executes a tool and what that implies: custom tools you run, Anthropic-defined schema-less client tools (bash, text editor, computer use, memory), Anthropic server tools (web search, web fetch, code execution, tool search), approval patterns and harness dispatch.',
  certs: ['ccdv-f', 'ccar-f', 'ccar-p'],
  domains: ['ccdv-f-8', 'ccdv-f-7', 'ccar-f-2', 'ccar-p-3'],
  tags: ['tools', 'server-tools', 'security', 'approval', 'computer-use'],
  difficulty: 'intermediate',
  sections: [
    {
      heading: 'Three kinds of tools',
      body: `Every tool in the \`tools\` array falls into one of three categories, defined by **who writes the schema** and **who executes the call**.

| Kind | Schema defined by | Executed by | Examples |
|---|---|---|---|
| **Custom (client) tools** | You (name, description, input_schema) | Your code | \`get_order_status\`, \`send_email\`, any MCP tool you bridge locally |
| **Anthropic-defined client tools** | Anthropic (schema-less: declare \`type\` + \`name\` only) | Your code | \`bash_20250124\`, \`text_editor_20250728\`, \`memory_20250818\`, \`computer_toolset_20260801\` |
| **Server tools** | Anthropic | Anthropic's infrastructure | \`web_search_20260209\`, \`web_fetch_20260209\`, \`code_execution_20260521\`, tool search (\`tool_search_tool_regex_20251119\`), \`mcp_toolset\` via the MCP connector |

For the first two kinds the model emits a \`tool_use\` block, your harness does the work and returns a \`tool_result\`. For server tools you only declare the tool; the API runs an internal loop (\`server_tool_use\` and result blocks appear in the response) and you never execute anything. Server-tool loops are capped per request and surface \`stop_reason: "pause_turn"\` when they need to be continued.

Anthropic-defined client tools have a schema baked into the model. Do **not** pass an \`input_schema\`, and do not create a custom tool that happens to be called \`bash\`: that makes an ordinary custom tool without the trained behavior.`,
    },
    {
      heading: 'Server tools in practice',
      body: `- **Web search / web fetch** (\`web_search_20260209\`, \`web_fetch_20260209\`): Claude issues queries or URLs; Anthropic executes and returns results with citations. The 20260209 versions include dynamic filtering (Claude filters results with code before they enter context). Options such as \`max_uses\` and domain allow/block lists constrain them.
- **Code execution** (\`code_execution_20260521\`): a sandboxed container with Python and shell, no internet, persistent for 30 days via \`container\` id. Also the runtime for Agent Skills on the Messages API and for programmatic tool calling (Claude writes a script that calls your tools, with only the final output returning to context).
- **Tool search**: for libraries of dozens or hundreds of tools. Declare tools with \`defer_loading: true\`; Claude searches and loads only the relevant schemas, which are appended rather than swapped, preserving the prompt cache.

Server tools cost nothing to operate and nothing to secure on your side, but you accept Anthropic's execution environment and cannot customize behavior beyond the documented options. They are billed per use in addition to tokens.`,
    },
    {
      heading: 'Approval and human-confirmation patterns',
      body: `Because client tools execute in your harness, the harness is where safety controls live. Patterns, in increasing strength:

1. **Scoped tool sets.** Do not expose a tool the role does not need. Removing \`delete_record\` beats monitoring it.
2. **Read-only by default.** Give agents inspection tools freely; gate anything that writes, sends, pays or deletes.
3. **Confirmation gates.** Before executing a side-effecting call, ask a human. In a manual loop this is an \`if\` before execution; in the tool runner it is a check inside the tool's \`run\` function that returns "user declined" instead of acting, or an inspection of the yielded message before tools run. In Managed Agents it is \`permission_policy: always_ask\`, which pauses the session until a \`user.tool_confirmation\` arrives. In Claude Code and the Agent SDK it is the permission prompt or a \`PreToolUse\` hook.
4. **Programmatic prerequisites.** Block \`process_refund\` until \`verify_identity\` has returned success in this session.
5. **Limits and allowlists.** Threshold checks (refund amount), path confinement for file tools, command allowlists for bash.

The exam's distractors are predictable: "add logging so misuse can be audited" (detects after the fact), "ask the model nicely in the prompt" (probabilistic), "use a bigger model" (irrelevant). The correct answer removes the privilege or enforces the gate in code.

Treat every tool input as **untrusted model output**: validate it, confine paths to a project root, allowlist executables, and never interpolate it into a shell string.`,
    },
    {
      heading: 'Agentic harness dispatch',
      body: `A **harness** is the code around the model that dispatches tool calls to implementations and applies policy. A clean harness has a registry mapping tool names to handlers, so adding a tool means adding a definition and a handler, not editing the loop.

Design considerations the exam touches:

- **Bash vs dedicated tools.** A bash tool gives the model broad leverage but hands the harness an opaque command string. Promoting an action to a dedicated tool (\`send_email\`, \`edit_file\`) gives typed arguments the harness can gate, audit, render, or run in parallel safely. Start with bash for breadth; promote when you need to gate, render, audit or parallelize.
- **Parallel safety.** Mark read-only tools as parallel-safe and run them concurrently; serialize tools with side effects.
- **Timeouts and resource limits** on every handler; the model will not notice a hung tool.
- **Result shaping.** Truncate or summarize large outputs before they enter the window; pass images and documents back as content blocks when the model needs to see them.
- **Observability.** Log tool name, inputs, duration and outcome for every call; this is also your audit trail.

When tools come from MCP servers, the harness is the MCP client, and the same dispatch, gating and logging apply at that boundary.`,
    },
  ],
  examples: [
    {
      title: 'Mixing the three kinds in one request',
      description:
        'A research-and-draft assistant uses a server tool (web search) that Anthropic runs, an Anthropic-defined client tool (text editor) the harness implements, and a custom tool. Note that only the custom tool carries an input_schema.',
      language: 'python',
      code: `tools = [
    {"type": "web_search_20260209", "name": "web_search", "max_uses": 5},   # server
    {"type": "text_editor_20250728", "name": "str_replace_based_edit_tool"},  # client, schema-less
    {"name": "save_draft",                                                     # custom
     "description": "Persist the final draft to the CMS. Call once, after the user approves.",
     "input_schema": {"type": "object",
                      "properties": {"title": {"type": "string"}, "body": {"type": "string"}},
                      "required": ["title", "body"]}},
]
r = client.messages.create(model="claude-opus-5-5", max_tokens=4096, tools=tools, messages=msgs)
for b in r.content:
    if b.type == "tool_use":            # client-side: your harness runs these
        dispatch(b)
    elif b.type == "server_tool_use":   # informational: Anthropic already ran it
        log(b.name, b.input)`,
      takeaway: 'Only tool_use blocks need your execution; server tools are declared and then handled for you.',
    },
    {
      title: 'A dispatch table with a confirmation gate',
      description:
        'The harness maps tool names to handlers and marks which ones need human approval. Approval happens before execution, and a declined call returns a result the model can act on.',
      language: 'typescript',
      code: `const handlers: Record<string, { run: (i: any) => Promise<string>; confirm?: boolean }> = {
  get_order_status: { run: (i) => orders.status(i.order_id) },
  process_refund:   { run: (i) => billing.refund(i.order_id, i.amount), confirm: true },
};

async function dispatch(call: Anthropic.ToolUseBlock): Promise<Anthropic.ToolResultBlockParam> {
  const h = handlers[call.name];
  if (!h) return { type: "tool_result", tool_use_id: call.id, is_error: true, content: \`unknown tool \${call.name}\` };
  if (h.confirm && !(await askHuman(call.name, call.input)))
    return { type: "tool_result", tool_use_id: call.id, content: "User declined this action." };
  try { return { type: "tool_result", tool_use_id: call.id, content: await h.run(call.input) }; }
  catch (e) { return { type: "tool_result", tool_use_id: call.id, is_error: true, content: String(e) }; }
}`,
      takeaway: 'Policy lives in the harness: confirmation, error wrapping and unknown-tool handling in one place.',
    },
    {
      title: 'The mistake: defining a custom tool named "bash"',
      description:
        'A team wanted shell access and wrote a custom tool `{"name": "bash", "description": "Run a command", "input_schema": {...}}`. Claude used it, but without the trained conventions (restart handling, combined stdout/stderr expectations) and with poorer command quality. Switching to the Anthropic-defined `{"type": "bash_20250124", "name": "bash"}` with no input_schema restored the expected behavior. They also added a command allowlist and a container sandbox, because a shell tool executes untrusted model output.',
      language: 'json',
      code: `// Wrong: ordinary custom tool, no built-in behavior
{"name": "bash", "description": "Run a command", "input_schema": {"type": "object", "properties": {"command": {"type": "string"}}}}

// Right: Anthropic-defined, schema-less
{"type": "bash_20250124", "name": "bash"}`,
      takeaway: 'Anthropic-defined tools are declared by type and name only; the schema is in the model.',
    },
  ],
  keyPoints: [
    'Custom tools: you define schema and execute. Anthropic-defined client tools (bash, text editor, memory, computer toolset): Anthropic defines schema, you execute. Server tools (web search, web fetch, code execution, tool search, MCP connector): Anthropic defines and executes.',
    'Declare Anthropic-defined tools by type and name only; never pass an input_schema or create a custom tool with the same name.',
    'Server tools run an internal loop; you see server_tool_use blocks and may get stop_reason pause_turn.',
    'Approval patterns, strongest first: remove the privilege, read-only defaults, confirmation gates before execution, programmatic prerequisites, limits and allowlists.',
    'Logging detects misuse after the fact; prompting is probabilistic; removing or gating a tool is enforceable.',
    'Treat tool inputs as untrusted: validate, confine paths, allowlist commands, never build shell strings from them.',
    'A harness dispatches by tool name, applies policy, enforces timeouts, shapes results and logs every call.',
    'Promote bash actions to dedicated tools when you need to gate, render, audit or parallelize them.',
  ],
  flashcards: [
    { front: 'Who executes a server tool such as web_search_20260209?', back: 'Anthropic, on its infrastructure. You only declare it in tools.' },
    { front: 'Who executes the bash_20250124 tool?', back: 'Your application. It is Anthropic-defined (schema-less) but client-executed.' },
    { front: 'How do you declare an Anthropic-defined tool?', back: 'With type and name only, e.g. {"type": "text_editor_20250728", "name": "str_replace_based_edit_tool"}; no input_schema.' },
    { front: 'Name four current server tools.', back: 'web_search_20260209, web_fetch_20260209, code_execution_20260521, tool search (tool_search_tool_regex_20251119). The MCP connector\'s mcp_toolset is also server-executed.' },
    { front: 'What block type shows a server tool ran?', back: 'server_tool_use, followed by the tool\'s result block, inside the response content.' },
    { front: 'What is the strongest control against an agent misusing a dangerous tool?', back: 'Not giving it the tool. Next strongest: a confirmation gate or programmatic prerequisite enforced before execution.' },
    { front: 'How does Managed Agents implement human confirmation?', back: 'permission_policy always_ask pauses the session (requires_action) until a user.tool_confirmation event allows or denies.' },
    { front: 'Why promote a bash action to a dedicated tool?', back: 'Typed arguments let the harness gate, audit, render or parallelize the action; a command string is opaque.' },
    { front: 'What does a harness do with a tool_use for an unknown tool name?', back: 'Return a tool_result with is_error: true explaining the tool is unknown, so the loop continues safely.' },
    { front: 'What is the current request shape for computer use on Opus 5.5?', back: 'The computer toolset: {"type": "computer_toolset_20260801"}, with member tools (screenshot, left_click, ...) executed by your harness in a sandboxed environment.' },
  ],
  quiz: [
    {
      question:
        'A support agent can read tickets, draft replies, issue refunds and delete accounts. Leadership wants to eliminate the risk of accidental deletions. Which action is most effective?',
      options: [
        'Add logging to the delete tool so misuse can be audited.',
        'Remove the delete tool from the agent\'s configuration.',
        'Add a system prompt instruction never to delete accounts.',
        'Switch to a larger model that follows instructions more reliably.',
      ],
      correct: [1],
      explanation:
        'A tool the agent does not have cannot be misused. Logging (A) detects after the fact, prompting (C) is probabilistic, and model size (D) does not remove the capability.',
    },
    {
      question:
        'Which TWO tools are executed by Anthropic rather than by your application? (Select two)',
      options: ['bash_20250124', 'web_search_20260209', 'code_execution_20260521', 'text_editor_20250728'],
      correct: [1, 2],
      explanation:
        'Web search and code execution are server tools. Bash and the text editor are Anthropic-defined but client-executed: your harness performs the action.',
    },
    {
      question:
        'A developer declares {"type": "bash_20250124", "name": "bash", "input_schema": {...}} and gets a validation error. Why?',
      options: [
        'The bash tool requires a beta header.',
        'Anthropic-defined tools are schema-less; the input_schema must be omitted.',
        'The name must be "shell".',
        'bash is a server tool and cannot be declared by clients.',
      ],
      correct: [1],
      explanation:
        'The schema is built into the model for Anthropic-defined tools. No beta header is needed (A), the name is "bash" (C), and bash is client-executed (D).',
    },
    {
      question:
        'An agent must verify a customer\'s identity before issuing any refund. The team wants a guarantee, not a probability. Which design meets the requirement?',
      options: [
        'Describe the required order clearly in the refund tool\'s description.',
        'Have the harness (or a PreToolUse hook) reject process_refund unless verify_identity succeeded earlier in the session.',
        'Ask Claude to confirm in text that it verified identity before calling the tool.',
        'Increase the effort level so Claude reasons more carefully.',
      ],
      correct: [1],
      explanation:
        'Programmatic prerequisites in the harness are deterministic. Descriptions (A), self-attestation (C) and effort (D) all rely on the model\'s compliance.',
    },
    {
      question:
        'A harness runs a bash tool by interpolating the model\'s command into a shell string on the host machine. What is the most important fix?',
      options: [
        'Run the tool in an isolated sandbox with an allowlist of executables and timeouts.',
        'Add a note in the system prompt asking Claude not to run dangerous commands.',
        'Log every command to a file.',
        'Switch to the text editor tool instead.',
      ],
      correct: [0],
      explanation:
        'Commands are untrusted model output and must be contained by isolation and allowlists. Prompting (B) and logging (C) do not prevent damage, and replacing the tool (D) does not address the execution environment.',
    },
  ],
  statements: [
    { text: 'Server tools such as web search require your application to execute the search and return results.', isTrue: false, explanation: 'Server tools run on Anthropic\'s infrastructure; you only declare them.' },
    { text: 'The text editor tool is defined by Anthropic but executed by your application.', isTrue: true, explanation: 'It is a schema-less client tool; your harness performs the file operations.' },
    { text: 'Creating a custom tool named "bash" with your own input_schema gives you the built-in bash tool behavior.', isTrue: false, explanation: 'That creates an ordinary custom tool; the built-in behavior requires {"type": "bash_20250124", "name": "bash"}.' },
    { text: 'Logging tool calls is sufficient to prevent an agent from taking a destructive action.', isTrue: false, explanation: 'Logging detects after the fact. Prevention needs removal of the tool or a gate before execution.' },
    { text: 'A confirmation gate can be implemented inside a tool\'s run function in the SDK tool runner.', isTrue: true, explanation: 'Return a "user declined" result instead of executing; no manual loop is required.' },
    { text: 'Tool search loads only relevant tool schemas on demand and appends them, preserving the prompt cache.', isTrue: true, explanation: 'That is why it is preferred over swapping the tools array for large tool libraries.' },
    { text: 'Tool inputs produced by the model can be trusted because the schema was validated.', isTrue: false, explanation: 'Schema validity is not safety. Paths, commands and ids must still be confined, allowlisted and checked.' },
  ],
  resources: [
    { label: 'Tool use overview: client vs server tools (Claude docs)', url: 'https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview' },
    { label: 'Web search tool (Claude docs)', url: 'https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool' },
    { label: 'Code execution tool (Claude docs)', url: 'https://platform.claude.com/docs/en/agents-and-tools/tool-use/code-execution-tool' },
    { label: 'Bash tool security (Claude docs)', url: 'https://platform.claude.com/docs/en/agents-and-tools/tool-use/bash-tool' },
  ],
};
