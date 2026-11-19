import type { Concept } from '../../types';

export const agentConstructionOptions: Concept = {
  id: 'agent-construction-options',
  title: 'Four Ways to Build an Agent',
  summary:
    'Compare the manual loop, the SDK tool runner, Claude Managed Agents and the Claude Agent SDK, and reason about self-hosted versus Anthropic-hosted deployment.',
  certs: ['ccdv-f', 'ccar-p'],
  domains: ['ccdv-f-1', 'ccdv-f-2', 'ccar-p-1', 'ccar-p-3'],
  tags: ['agents', 'tool-runner', 'managed-agents', 'agent-sdk', 'deployment'],
  difficulty: 'intermediate',
  sections: [
    {
      heading: 'The four options at a glance',
      body: `Every Claude agent is the same loop (request → tool_use → execute → tool_result → repeat). The options differ in **who writes the loop**, **who runs the tools** and **what comes built in**.

| Option | Who runs the loop | Who executes tools | Built-in tools | Best for |
|---|---|---|---|---|
| **Manual loop** | Your code, on your infrastructure | You | None | Full control, custom transports, no beta dependency |
| **SDK tool runner** (\`client.beta.messages.tool_runner\` / \`toolRunner\`) | The Anthropic SDK, in your process | You (your tool functions) | None, but server tools can be mixed in | Custom-tool agents with minimal boilerplate |
| **Claude Managed Agents** | Anthropic's orchestration layer | Anthropic-hosted sandbox (or your self-hosted sandbox) | Bash, file tools, web search/fetch, MCP, skills | Long-running agents without owning the runtime |
| **Claude Agent SDK** | The Claude Code harness, in your process | You, via the harness | Read, Write, Edit, Bash, Glob, Grep, Task | Coding and file-system agents with Claude Code\'s tooling |

The first two are "bring your own harness" on the Messages API. The last two give you a complete harness, hosted by Anthropic in one case and embedded in your process in the other.`,
    },
    {
      heading: 'Manual loop and the SDK tool runner',
      body: `A **manual loop** is a \`while\` loop around \`messages.create\`. You own everything: stop-reason handling, tool dispatch, retries, caching breakpoints, context pruning. Choose it when you need control the runner does not expose: a custom transport, request shapes the SDK cannot build, or interleaving unrelated work mid-loop. Its cost is boilerplate and the many small mistakes (wrong \`tool_use_id\`, ignoring \`pause_turn\`) that the runner already handles.

The **tool runner** is the SDK's implementation of the loop. You declare tools as typed functions and the runner generates schemas, calls the API, executes the matching function, feeds results back and stops when Claude stops calling tools.

- Python: \`@beta_tool\` on a function with type hints and a docstring; pass the functions to \`client.beta.messages.tool_runner(...)\`; iterate the runner or call \`until_done()\`.
- TypeScript: \`betaZodTool({ name, description, inputSchema, run })\` (or \`betaTool\` with raw JSON Schema); pass to \`client.beta.messages.toolRunner(...)\`; await it or call \`runUntilDone()\`.

The runner is not a black box. Each iteration yields the assistant message before tools run, so you can approve or deny a call, modify a result, bump \`max_tokens\` and retry, or cap the run with \`max_iterations\`. It resumes \`pause_turn\` automatically and accepts server tools alongside your functions. "I need control" is rarely a reason to drop to the manual loop; the runner is the default for custom-tool agents.`,
    },
    {
      heading: 'Claude Managed Agents: Anthropic-hosted loop and sandbox',
      body: `**Managed Agents** moves the loop off your servers. You create three kinds of objects:

- An **Agent**: a persisted, versioned configuration with \`model\`, \`system\`, \`tools\`, \`mcp_servers\` and \`skills\`. Create it once; updating it produces a new version, and running sessions keep the version they started with.
- An **Environment**: a template for the container the agent's tools run in. \`config.type\` is \`cloud\` (Anthropic runs the container) or \`self_hosted\` (tool execution happens in your infrastructure while the loop stays on Anthropic's orchestration layer; connectivity is outbound-only from your worker).
- A **Session**: one run of an agent in an environment. You stream events out, and send user messages, tool confirmations and custom tool results in.

The agent loop, prompt caching, compaction and the tool sandbox are all handled server side. Tools can be gated with a \`permission_policy\` of \`always_ask\` (the session pauses with \`requires_action\` until you send \`user.tool_confirmation\`) or \`auto\`. Custom tools your application executes are still possible: the session emits a \`custom_tool_use\` event, idles, and waits for your \`custom_tool_result\`. Credentials for MCP servers live in vaults, not in the agent definition.

Choose Managed Agents when you want long-running, sandboxed agents without operating the runtime, when the work is shaped like a job (process these documents, run this analysis) and when a managed sandbox meets your data-residency needs.`,
    },
    {
      heading: 'Self-hosted vs Anthropic-hosted: how to decide',
      body: `The exam frames the choice as **deployment model** rather than library choice.

**Self-hosted** (manual loop, tool runner, Agent SDK): the loop and the tools run in your process. You control the sandbox, network egress, secrets, logging and the exact request shape. You also own scaling, retries, state persistence and the security of every tool implementation. Pick it when tools must reach systems only your network can see, when compliance requires that file contents never leave your environment, or when you need deep customization of the harness.

**Anthropic-hosted** (Managed Agents with \`cloud\` environments): Anthropic runs the loop and the container. You get a managed sandbox, versioned agents, event streams, budgets and built-in compaction, with less operational work. You give up low-level control of the request and run inside Anthropic's execution environment. The \`self_hosted\` environment type is the middle path: Anthropic orchestrates, your infrastructure executes.

Practical heuristics:

- Need Claude Code's file and shell tooling in your own app → Agent SDK.
- A handful of custom tools, your own service → tool runner.
- Exotic transport or request shape, or no beta dependency → manual loop.
- Long-running jobs, sandbox you would rather not operate → Managed Agents.

All four can call MCP servers, and all four are built on the same stop-reason loop, so knowledge transfers between them.`,
    },
  ],
  examples: [
    {
      title: 'Tool runner in Python',
      description:
        'A small internal agent needs two custom tools. The runner generates schemas from the type hints and docstrings and runs the loop; the team writes no stop-reason handling.',
      language: 'python',
      code: `from anthropic import Anthropic, beta_tool

client = Anthropic()

@beta_tool
def lookup_order(order_id: str) -> str:
    """Return the status of an order.

    Args:
        order_id: The order identifier, e.g. ORD-1234.
    """
    return orders_db.status(order_id)

runner = client.beta.messages.tool_runner(
    model="claude-opus-5-5", max_tokens=4096, tools=[lookup_order],
    messages=[{"role": "user", "content": "Where is order ORD-1234?"}],
    max_iterations=10,
)
final = runner.until_done()
print(final.content[0].text)`,
      takeaway: 'The runner removes loop boilerplate while keeping tool execution in your process.',
    },
    {
      title: 'Tool runner in TypeScript with an approval gate',
      description:
        'The same pattern with betaZodTool. Approval does not require a manual loop: the gate lives inside the tool\'s run function and returns a "declined" result instead of executing.',
      language: 'typescript',
      code: `import Anthropic from "@anthropic-ai/sdk";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";

const client = new Anthropic();
const sendEmail = betaZodTool({
  name: "send_email",
  description: "Send an email to a customer. Call only after the draft is final.",
  inputSchema: z.object({ to: z.string().email(), body: z.string() }),
  run: async ({ to, body }) => {
    if (!(await humanApproves(to, body))) return "User declined to send this email.";
    await mailer.send(to, body);
    return "sent";
  },
});
const final = await client.beta.messages.toolRunner({
  model: "claude-opus-5-5", max_tokens: 4096, tools: [sendEmail],
  messages: [{ role: "user", content: "Reply to the refund request from Dana." }],
});`,
      takeaway: 'Gate side effects inside the tool function; the runner still owns the loop.',
    },
    {
      title: 'The mistake: creating a Managed Agent on every request',
      description:
        'A team\'s API handler called agents.create() and then sessions.create() for each incoming job. They accumulated thousands of orphaned agent objects and paid creation latency every time. The fix: create the agent once in a setup step, store its id, and create only a session per job. To change behavior, update the agent (which produces a new version) rather than creating a new one.',
      language: 'python',
      code: `# Setup (once): store agent.id in config
agent = client.beta.agents.create(name="Doc processor", model="claude-opus-5-5",
                                  system=SYSTEM, tools=[{"type": "agent_toolset_20260401"}])

# Hot path (every job)
session = client.beta.sessions.create(agent=AGENT_ID, environment_id=ENV_ID)
client.beta.sessions.events.send(session.id,
    events=[{"type": "user.message", "content": [{"type": "text", "text": job_text}]}])
for ev in client.beta.sessions.events.stream(session.id):
    ...`,
      takeaway: 'Agent = versioned config created once; Session = one run. Do not conflate them.',
    },
  ],
  keyPoints: [
    'Four options: manual loop, SDK tool runner, Claude Managed Agents, Claude Agent SDK. All run the same stop-reason loop.',
    'Manual loop: maximum control, maximum boilerplate; use when the runner cannot express what you need.',
    'Tool runner: `@beta_tool` (Python) or `betaZodTool`/`betaTool` (TypeScript) plus `tool_runner`/`toolRunner`; handles the loop, pause_turn and max_iterations; the default for custom-tool agents.',
    'Managed Agents: Agent (versioned config, created once) + Environment (cloud or self_hosted) + Session (one run, event stream); Anthropic runs the loop and sandbox.',
    'Agent SDK: Claude Code as a library with built-in file/shell tools, hooks, subagents and sessions.',
    'Self-hosted gives control over sandbox, network and secrets at the cost of operating it; Anthropic-hosted trades control for a managed runtime.',
    'Approval gates do not require a manual loop; gate inside the tool function or intercept the yielded message in the runner.',
  ],
  flashcards: [
    { front: 'Name the four ways to build a Claude agent.', back: 'Manual loop, SDK tool runner, Claude Managed Agents, Claude Agent SDK.' },
    { front: 'Which Python decorator defines a tool for the tool runner?', back: '@beta_tool (and @beta_async_tool for async functions).' },
    { front: 'Which TypeScript helper defines a tool for the tool runner with a Zod schema?', back: 'betaZodTool({ name, description, inputSchema, run }); betaTool accepts raw JSON Schema.' },
    { front: 'How do you start the tool runner?', back: 'client.beta.messages.tool_runner(...) in Python, client.beta.messages.toolRunner(...) in TypeScript; iterate it or call until_done() / runUntilDone().' },
    { front: 'What three objects make up a Managed Agents deployment?', back: 'Agent (versioned config), Environment (container template, cloud or self_hosted), Session (one run with an event stream).' },
    { front: 'How often should you call agents.create() in Managed Agents?', back: 'Once, in setup. Store the id; create a session per run. Update the agent to change behavior.' },
    { front: 'What does a self_hosted Managed Agents environment change?', back: 'Tool execution moves into your infrastructure while the agent loop stays on Anthropic\'s orchestration layer; your worker connects outbound only.' },
    { front: 'How does a Managed Agents session ask you to approve a tool call?', back: 'With permission_policy always_ask the session idles with stop_reason requires_action until you send a user.tool_confirmation event.' },
    { front: 'When is a manual loop justified over the tool runner?', back: 'Custom transports, request shapes the SDK cannot build, avoiding a beta dependency, or control flow that does not fit per-turn hooks.' },
    { front: 'Which option gives you Claude Code\'s Read/Write/Edit/Bash tools in your own application?', back: 'The Claude Agent SDK.' },
  ],
  quiz: [
    {
      question:
        'A team needs an agent with four custom tools that call internal services, running inside their own backend. They want minimal loop code but must keep tool execution on their network. Which option fits best?',
      options: [
        'Claude Managed Agents with a cloud environment.',
        'The SDK tool runner with @beta_tool / betaZodTool definitions.',
        'The Claude Agent SDK with Bash enabled.',
        'A manual loop, because custom tools require it.',
      ],
      correct: [1],
      explanation:
        'The tool runner handles the loop while executing your tool functions in your process. A cloud Managed Agents environment (A) runs tools on Anthropic\'s side; the Agent SDK (C) brings file/shell tooling that is not needed; custom tools do not require a manual loop (D).',
    },
    {
      question:
        'Which TWO statements about Claude Managed Agents are correct? (Select two)',
      options: [
        'The agent loop runs in your process and Anthropic only hosts the model.',
        'An Agent is a versioned configuration that should be created once and referenced by many Sessions.',
        'A self_hosted environment keeps the loop on Anthropic\'s orchestration layer while tools execute in your infrastructure.',
        'Sessions cannot pause for human approval of tool calls.',
      ],
      correct: [1, 2],
      explanation:
        'Agents are versioned configs reused across sessions, and self_hosted environments move only tool execution to you. The loop runs on Anthropic\'s side (A is false), and always_ask permission policies do pause sessions for confirmation (D is false).',
    },
    {
      question:
        'A developer wants human approval before an agent sends any email. They believe this forces them to abandon the tool runner for a manual loop. What is the correct guidance?',
      options: [
        'They are right; approval gates only work in manual loops.',
        'Gate inside the tool\'s run function (return a "declined" result) or inspect the yielded message before tools run; the runner supports both.',
        'Use tool_choice "none" when approval is needed.',
        'Switch to Managed Agents; approval is impossible with the SDK.',
      ],
      correct: [1],
      explanation:
        'The runner yields each assistant message before executing tools and lets the tool function decide whether to act. A manual loop (A) is unnecessary, tool_choice none (C) disables tools entirely, and Managed Agents (D) is not required.',
    },
    {
      question:
        'A compliance requirement states that repository contents must never leave the company network, but the team wants Anthropic to orchestrate a long-running agent. Which deployment satisfies both?',
      options: [
        'Managed Agents with a cloud environment and web_fetch disabled.',
        'Managed Agents with a self_hosted environment so tool execution runs in company infrastructure.',
        'A manual loop that uploads the repository to the code execution server tool.',
        'The Agent SDK running on Anthropic\'s servers.',
      ],
      correct: [1],
      explanation:
        'self_hosted keeps file operations and the sandbox inside your network while Anthropic runs the loop. Cloud environments (A) run the container on Anthropic\'s side, uploading to code execution (C) sends the files out, and the Agent SDK runs where you run it, not on Anthropic\'s servers (D).',
    },
    {
      question:
        'A startup wants to embed a coding assistant in their IDE plugin with file editing, shell access and the ability to delegate to subagents, with as little custom harness code as possible. Which option fits?',
      options: ['Manual loop', 'SDK tool runner', 'Claude Agent SDK', 'Message Batches API'],
      correct: [2],
      explanation:
        'The Agent SDK provides built-in Read/Write/Edit/Bash/Glob/Grep, Task subagents, hooks and sessions. The manual loop and tool runner (A, B) would require implementing those tools; the Batches API (D) is for offline bulk requests, not interactive agents.',
    },
  ],
  statements: [
    { text: 'The SDK tool runner executes your tool functions inside your own process.', isTrue: true, explanation: 'It automates the loop but tool code still runs where you run it.' },
    { text: 'The tool runner cannot be combined with server tools such as web search.', isTrue: false, explanation: 'Server-tool definitions can be passed alongside runnable tools; they run on Anthropic\'s side.' },
    { text: 'In Managed Agents, model, system prompt and tools are set on the Agent object, not on each Session.', isTrue: true, explanation: 'Sessions reference an agent by id (and optionally version); they can override settings for one session but the configuration lives on the agent.' },
    { text: 'Updating a Managed Agent\'s configuration changes the behavior of sessions that are already running.', isTrue: false, explanation: 'Updates create a new version; running sessions keep the version they were created with.' },
    { text: 'A manual loop is required whenever a tool has side effects that need human approval.', isTrue: false, explanation: 'Approval gates work inside tool functions or via the runner\'s per-turn interception.' },
    { text: 'The Claude Agent SDK is the Claude Code harness exposed as a library with its built-in tools.', isTrue: true, explanation: 'This is what distinguishes it from the lower-level Messages API options.' },
    { text: 'All four construction options are built on the same request → tool_use → tool_result loop.', isTrue: true, explanation: 'They differ in who writes and hosts the loop, not in the underlying protocol.' },
  ],
  resources: [
    { label: 'Agents and tools overview (Claude docs)', url: 'https://platform.claude.com/docs/en/agents-and-tools/overview' },
    { label: 'Managed Agents overview (Claude docs)', url: 'https://platform.claude.com/docs/en/managed-agents/overview' },
    { label: 'Agent SDK overview (Claude Code docs)', url: 'https://code.claude.com/docs/en/agent-sdk/overview' },
    { label: 'Tool use: implement tool use (tool runner)', url: 'https://platform.claude.com/docs/en/agents-and-tools/tool-use/implement-tool-use' },
  ],
};
