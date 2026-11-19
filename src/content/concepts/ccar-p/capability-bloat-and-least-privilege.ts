import type { Concept } from '../../types';

export const capabilityBloatAndLeastPrivilege: Concept = {
  id: 'capability-bloat-and-least-privilege',
  title: 'Capability Bloat and Least Privilege',
  summary:
    'Recognise when an agent has more tools, data or autonomy than its role needs, and reduce risk by removing capabilities rather than monitoring or guarding them.',
  certs: ['ccar-p', 'ccar-f', 'ccdv-f'],
  domains: ['ccar-p-3', 'ccar-p-5', 'ccar-f-2', 'ccdv-f-7', 'ccdv-f-8'],
  tags: ['least-privilege', 'tools', 'security', 'capability-bloat', 'scoping'],
  difficulty: 'intermediate',
  diagram: 'layered-guardrails',
  sections: [
    {
      heading: 'What capability bloat looks like',
      body: `Capability bloat is the gap between what an agent *can* do and what its role *needs* to do. It accumulates quietly: a tool added for a demo, an MCP server connected "in case", a service account with admin rights because it was convenient, a subagent inheriting the parent's full tool list.

Signs to look for in a configuration review:

- Tools the role never legitimately uses (a read-only support role with \`process_refund\` and \`delete_account\`).
- Write or delete tools where read tools would do.
- Tools with unbounded arguments (any amount, any table, any path) when the role operates in a narrow range.
- MCP servers exposing dozens of tools when two are used.
- Agents that can spawn agents that can spawn agents.
- Credentials with organisation-wide scope attached to a single-purpose agent.

Every unused capability is attack surface (prompt injection can invoke it), a reliability risk (the model may pick it by mistake) and a cost (tool definitions consume tokens on every call and dilute tool selection). Bloat is not a hypothetical concern: the model will eventually be asked, by a user or by injected content, to do something it should not be able to do.`,
    },
    {
      heading: 'Least privilege means removal first',
      body: `The security principle is simple: a component should hold exactly the capabilities its function requires, and no more. For agents the order of preference is:

1. **Remove.** If the role does not need the tool, it is not in the tool list. No prompt, no classifier, no log can be bypassed if the capability does not exist.
2. **Narrow.** If the role needs a tool sometimes, constrain it: read-only variants, argument allow-lists, amount caps, path prefixes, row-level filters derived from the authenticated user.
3. **Gate.** If a privileged action is genuinely part of the role, require an explicit approval step enforced outside the model (a human approval id, a hook that blocks the call until approved).
4. **Monitor.** Log and alert on everything, always. Monitoring is necessary but it is a detective control: it tells you about misuse after the fact.

The official sample question captures the point: a support agent that can read tickets, draft replies, issue refunds and delete accounts, when staff only read and draft, is fixed by removing the refund and delete tools, not by logging them or adding confirmations. Logging and confirmation are compensating controls; they leave the capability in place. A larger model is unrelated to authorisation scope.`,
    },
    {
      heading: 'Scoping agents and tools in practice',
      body: `**Per-role tool sets.** Define tool lists per role, not per platform. A triage agent, a billing agent and an admin agent share a codebase but receive different \`tools\` arrays. In the Agent SDK, each \`AgentDefinition\` carries its own \`tools\`; in Claude Code, \`settings.json\` permissions and Skills' \`allowed-tools\` scope what a session or skill may invoke; in Managed Agents each agent in a roster has its own toolset configuration.

**Read-only by default.** Design tools as read-only unless a write is a documented requirement. Separate \`get_order\` from \`update_order\`; never combine them behind one generic \`manage_order\` tool with an action flag.

**Narrow arguments.** Validate inside the tool: reject amounts over policy, restrict table or path arguments to an allow-list, and derive the customer id from the authenticated session rather than from model-supplied input.

**MCP server scoping.** Connect only the servers a role needs, and where a server exposes many tools, use the client's allow-list to expose a subset. Review MCP servers like any dependency: who maintains it, what it can reach, what credentials it holds.

**Subagent inheritance.** Subagents must not inherit the parent's full capability set by default. Give each a brief and only its role's tools.

**Periodic review.** Capability inventories drift. Schedule a quarterly review of every agent's tools, servers and credentials against actual usage logs; remove what has not been used or is not justified.`,
    },
    {
      heading: 'Layered guardrails and the exam angle',
      body: `Least privilege is the innermost layer of a defence in depth:

| Layer | Example | Type |
|---|---|---|
| Capability removal | Tool not present | Preventive, cannot be bypassed |
| Argument constraints | Amount cap, path allow-list | Preventive |
| Authorization per call | Tool checks the caller's permission | Preventive |
| Approval gates | Human approval id required | Preventive |
| Prompt instructions | "Never delete without confirmation" | Advisory |
| Input/output classifiers | Injection detection, PII filter | Detective and partial preventive |
| Logging and alerting | Audit trail of tool calls | Detective |

Exam stems describe an agent with more capabilities than its role needs and ask how to reduce risk. The best answer removes or narrows. Distractors: add logging (detective only), add a confirmation prompt (model-mediated, bypassable), switch to a larger model (irrelevant to authorisation), or write a stricter system prompt (advisory). When the capability is genuinely needed, the best answer is an approval gate enforced outside the model plus narrowed arguments.`,
    },
  ],
  examples: [
    {
      title: 'The official sample: read-only support role',
      description:
        'A support agent exposes read_ticket, draft_reply, issue_refund and delete_account, but staff only read and draft. Risk is best reduced by removing issue_refund and delete_account from the agent entirely. Logging them would only tell you about misuse afterwards; a confirmation prompt is still mediated by the model; a larger model does not change what the agent is authorised to do.',
      language: 'python',
      code: `# Before: capability bloat
tools = [read_ticket, draft_reply, issue_refund, delete_account]

# After: least privilege for the support role
SUPPORT_TOOLS = [read_ticket, draft_reply]
resp = client.messages.create(
    model="claude-opus-5-5", max_tokens=1024,
    tools=SUPPORT_TOOLS,            # refund/delete do not exist for this role
    system=SUPPORT_PROMPT,
    messages=messages,
)`,
      takeaway: 'Least privilege is removal of unnecessary capability, not monitoring or guarding it.',
    },
    {
      title: 'Narrowing a tool the role genuinely needs',
      description:
        'A billing agent must issue refunds up to $100 for a specific order. Instead of a generic refund tool accepting any amount and any order, the tool derives the customer from the authenticated session, verifies the order belongs to that customer, caps the amount and requires an approval id above the cap.',
      language: 'typescript',
      code: `const issueRefund = {
  name: "issue_refund",
  description: "Refund part or all of one of the authenticated customer's orders. Max $100 without approval.",
  input_schema: {
    type: "object",
    properties: {
      order_id: { type: "string" },
      amount: { type: "number", minimum: 0.01, maximum: 100 },
      reason: { type: "string", enum: ["damaged", "late", "wrong_item", "other"] },
    },
    required: ["order_id", "amount", "reason"],
  },
};
// handler: assert order.customerId === session.customerId; enforce the cap server-side too`,
      takeaway: 'Narrow arguments in the schema and enforce them again in the handler; derive identity from the session, not from the model.',
    },
    {
      title: 'Mistake: subagents inheriting the coordinator\'s tools',
      description:
        'A research coordinator with web search, file write and an internal database tool spawned "reader" subagents that inherited all three. A reader, confused by injected text on a web page, wrote a file into the shared workspace that later misled the coordinator. The fix gave readers only web_fetch and web_search and reserved writes for the coordinator.',
      takeaway: 'Subagents get their role\'s tools only; inherited capability is bloat with a wider blast radius.',
    },
    {
      title: 'MCP server with sixty tools, two used',
      description:
        'A team connected a CRM MCP server exposing sixty tools, including bulk delete and export-all. Usage logs showed only get_account and list_open_cases were ever called. The team used the client allow-list to expose exactly those two, cut 20,000 tokens from every request, and removed the possibility of a mass export via prompt injection.',
      takeaway: 'Scope MCP servers to the tools in use; review inventories against usage logs on a schedule.',
    },
  ],
  keyPoints: [
    'Capability bloat is the gap between what an agent can do and what its role needs; it is attack surface, reliability risk and token cost.',
    'Order of controls: remove > narrow > gate (approval enforced outside the model) > monitor.',
    'Logging and confirmation prompts are compensating or detective controls; they leave the capability in place.',
    'Model size is unrelated to authorisation scope.',
    'Define tool sets per role; design tools read-only by default and separate read from write tools.',
    'Constrain arguments in schemas and re-validate in handlers; derive identity from the authenticated session, not model input.',
    'Scope MCP servers to the tools actually used; subagents must not inherit parent capabilities by default.',
    'Review capability inventories against usage logs on a schedule and remove what is unjustified.',
  ],
  flashcards: [
    { front: 'Define capability bloat.', back: 'The gap between what an agent can do (tools, data, autonomy, credentials) and what its role needs to do.' },
    { front: 'In the official sample, how is a read-only support agent with refund and delete tools best fixed?', back: 'Remove the refund and delete tools from the agent\'s configuration entirely.' },
    { front: 'Why is adding logging not a least-privilege fix?', back: 'Logging is a detective control; it reports misuse after the fact and leaves the capability in place.' },
    { front: 'Why is a confirmation prompt not sufficient for a dangerous tool?', back: 'It is mediated by the model and can be bypassed by injected or persuasive input; the capability still exists.' },
    { front: 'Order of preference for controlling agent capabilities?', back: 'Remove, then narrow (argument constraints), then gate (approval enforced outside the model), then monitor.' },
    { front: 'Three costs of unused tools besides security?', back: 'Token cost on every call, diluted tool selection (wrong-tool errors), and maintenance burden.' },
    { front: 'How should identity reach a tool handler?', back: 'From the authenticated session or token, never from model-supplied arguments.' },
    { front: 'Where do you scope tools in the Agent SDK, Claude Code and Managed Agents?', back: 'AgentDefinition tools; settings.json permissions and Skills allowed-tools; per-agent toolset configuration in the roster.' },
    { front: 'Why should subagents not inherit the parent\'s tool list?', back: 'Inherited capability is bloat with a wider blast radius; each subagent gets only its role\'s tools.' },
  ],
  quiz: [
    {
      question:
        'A team exposes a customer-support agent that can read tickets, draft replies, issue refunds and delete user accounts. Support staff only need to read tickets and draft replies. Applying least-privilege principles, which change BEST reduces risk?',
      options: [
        'Add logging to the refund and delete tools so misuse can be audited later.',
        'Remove the refund and delete tools from the agent\'s configuration entirely.',
        'Keep all tools but add a confirmation prompt before refunds and deletions.',
        'Replace the agent with a larger model that follows instructions more reliably.',
      ],
      correct: [1],
      explanation:
        'Least privilege removes capabilities the role does not require. Logging is detective, confirmation is a compensating control mediated by the model, and model size is unrelated to authorisation scope.',
    },
    {
      question:
        'A billing agent genuinely needs to issue refunds, but only up to $100 on the authenticated customer\'s own orders. Which design is MOST appropriate?',
      options: [
        'A generic refund tool accepting any order id and amount, with a system prompt stating the limits.',
        'A refund tool whose schema caps the amount, whose handler verifies order ownership from the session and enforces the cap, and which requires an approval id above the cap.',
        'Remove the refund tool and have the model tell customers to call the hotline.',
        'Log every refund call and review the log weekly.',
      ],
      correct: [1],
      explanation:
        'When a capability is needed, narrow it and gate the exception outside the model. A prompt-stated limit (1) is advisory; removal (3) breaks the role\'s function; logging (4) is detective only.',
    },
    {
      question: 'Which TWO are signs of capability bloat in an agent configuration? (Select two)',
      options: [
        'Tools with unbounded arguments where the role operates in a narrow range.',
        'Tool descriptions that explain when not to use the tool.',
        'An MCP server exposing sixty tools when usage logs show two are called.',
        'Separate read and write tools for the same resource.',
      ],
      correct: [0, 2],
      explanation:
        'Unbounded arguments and unused server tools are bloat. Good descriptions (2) and separated read/write tools (4) are least-privilege practices.',
    },
    {
      question:
        'A research coordinator with web search, file write and a database tool spawns reader subagents that inherit all three tools. A reader, misled by injected web content, writes a misleading file. What is the BEST fix?',
      options: [
        'Instruct readers in their prompt never to write files.',
        'Give reader subagents only web_fetch and web_search; reserve writes for the coordinator.',
        'Add a classifier that scans web pages for injection before readers see them.',
        'Use a larger model for the readers.',
      ],
      correct: [1],
      explanation:
        'Removing the write capability from readers eliminates the failure. Instructions (1) are advisory; a classifier (3) is a useful extra layer but partial; model size (4) does not change capability.',
    },
    {
      question:
        'An architect is asked to rank controls for a destructive tool from strongest to weakest. Which ordering is correct?',
      options: [
        'Logging > confirmation prompt > removal.',
        'Removal > argument constraints and external approval gate > prompt instruction > logging.',
        'Prompt instruction > removal > logging.',
        'Confirmation prompt > logging > argument constraints.',
      ],
      correct: [1],
      explanation:
        'Preventive controls that cannot be bypassed (removal, enforced constraints and gates) come first; advisory instructions and detective logging are weakest.',
    },
  ],
  statements: [
    { text: 'Adding audit logging to a dangerous tool satisfies the least-privilege principle.', isTrue: false, explanation: 'Logging is a detective control. Least privilege means the role does not hold the capability at all.' },
    { text: 'Unused tool definitions still cost tokens on every request and can cause wrong-tool selection.', isTrue: true, explanation: 'Bloat has cost and reliability consequences, not only security ones.' },
    { text: 'A confirmation prompt before a destructive action is a preventive control equivalent to removing the tool.', isTrue: false, explanation: 'It is model-mediated and bypassable; the capability remains.' },
    { text: 'Tool handlers should derive the customer identity from the authenticated session rather than from model-supplied arguments.', isTrue: true, explanation: 'Model input can be manipulated; the session identity cannot.' },
    { text: 'Switching to a more capable model is an effective way to reduce an agent\'s authorisation scope.', isTrue: false, explanation: 'Model capability and authorisation scope are independent; the tool list defines scope.' },
    { text: 'Subagents should by default receive the same tools as their coordinator so they can handle any subtask.', isTrue: false, explanation: 'Each subagent should receive only its role\'s tools; inheritance widens the blast radius.' },
    { text: 'Capability inventories should be reviewed periodically against usage logs and unjustified tools removed.', isTrue: true, explanation: 'Bloat accumulates over time; scheduled review keeps configurations aligned with actual need.' },
  ],
  resources: [
    { label: 'Tool use overview (Claude docs)', url: 'https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview' },
    { label: 'Claude Code permissions (settings)', url: 'https://code.claude.com/docs/en/settings' },
    { label: 'Mitigating prompt injection in agents (Claude docs)', url: 'https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks' },
  ],
};
