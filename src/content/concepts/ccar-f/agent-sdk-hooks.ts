import type { Concept } from '../../types';

export const agentSdkHooks: Concept = {
  id: 'agent-sdk-hooks',
  title: 'Agent SDK Hooks: Interception and Normalisation',
  summary:
    'Hooks are deterministic code that runs at fixed points in the agent lifecycle. PreToolUse hooks intercept outgoing tool calls to allow, block or redirect them; PostToolUse hooks transform tool results before the model sees them. Use them when a rule must hold every time.',
  certs: ['ccar-f', 'ccdv-f', 'ccar-p'],
  domains: ['ccar-f-1', 'ccdv-f-1', 'ccar-p-3'],
  tags: ['hooks', 'agent-sdk', 'PreToolUse', 'PostToolUse', 'compliance', 'normalisation'],
  difficulty: 'intermediate',
  diagram: 'hooks-lifecycle',
  sections: [
    {
      heading: 'What hooks are and where they run',
      body: `A hook is a function (in the Agent SDK) or a shell command (in Claude Code \`settings.json\`) that the harness runs at a named lifecycle event. The important events for agent design:

| Event | When it fires | Typical use |
|---|---|---|
| \`PreToolUse\` | After Claude requests a tool, before it executes | Allow, deny or ask; enforce business rules |
| \`PostToolUse\` | After the tool returns, before the result goes back to Claude | Normalise, redact, enrich, log |
| \`SessionStart\` | When a session begins or resumes | Inject context, set state |
| \`Stop\` | When Claude ends its turn | Verify work, force continuation |
| \`Notification\` | When Claude needs attention | Alerting |

Hooks are registered with a **matcher** so they fire only for particular tools. MCP tools appear as \`mcp__<server>__<tool>\`, so a matcher of \`mcp__support__process_refund\` targets exactly one tool and \`mcp__support__.*\` targets the whole server.

Hooks run **outside the model**. They do not consume model tokens for the decision itself, they are not subject to the model's interpretation, and they execute every single time the event fires. That is the whole point.`,
    },
    {
      heading: 'PreToolUse: intercepting outgoing calls',
      body: `A PreToolUse hook receives the tool name and the proposed \`tool_input\`. It returns a decision: allow, deny (with a reason) or ask the user. In the Agent SDK the decision is expressed through \`hookSpecificOutput.permissionDecision\` and \`permissionDecisionReason\`.

The canonical exam example: **block refunds above $500**. The hook reads \`tool_input["amount"]\`; if it exceeds the threshold, it denies the call and the reason tells the model to use \`escalate_to_human\` instead. The model sees the denial as the tool's result and redirects its plan. The business rule is now enforced on 100% of calls, regardless of how the model was prompted or what the customer said.

Other PreToolUse uses: requiring a prerequisite step (identity verified before refund), blocking dangerous Bash patterns (\`rm -rf\`, \`git push --force\`), restricting file writes to a directory, and rate-limiting expensive tools. A hook can also **modify** the input before execution in some harnesses, for example clamping a value, but denying with a redirect is the clearer pattern for policy violations because the model stays informed.`,
    },
    {
      heading: 'PostToolUse: normalising heterogeneous data',
      body: `In a system with several MCP servers, the same concept arrives in different formats. The order service returns Unix timestamps, the CRM returns ISO 8601 strings, the payment gateway returns numeric status codes (\`200\`, \`402\`) while the shipping API returns strings (\`"delivered"\`). Left alone, the model must do the conversions itself on every turn, which costs tokens and occasionally goes wrong ("the order was placed in 1970").

A PostToolUse hook intercepts each tool result and rewrites it into one canonical shape before Claude processes it: timestamps to ISO 8601 UTC, status codes to a shared enum, currency to minor units with a currency code. The model then reasons over consistent data, and your prompts need no per-tool conversion instructions.

PostToolUse hooks also redact secrets or PII from results, truncate oversized outputs, and append **additional context** (for example "this customer is a VIP account" after \`get_customer\`). The hook sees the result after execution, so it cannot prevent the side effect; that is PreToolUse's job.`,
    },
    {
      heading: 'Deterministic guarantees versus probabilistic compliance',
      body: `The architectural question is always: *does this rule need to hold every time?*

- "Prefer concise replies" → prompt. Occasional verbosity is fine.
- "Escalate when the customer seems distressed" → prompt. It requires judgment.
- "Never refund more than $500 without a human" → hook. A single violation is a real loss.
- "Convert all timestamps to ISO 8601 before reasoning" → hook. Doing it in the prompt wastes tokens and still fails sometimes.

Prompts shape behaviour; hooks constrain it. Prompt-based compliance improves with better wording, few-shot examples and stronger models, but it asymptotically approaches, never reaches, 100%. Hooks are ordinary code: they either run or they do not, and you can unit-test them.

Keep the two aligned. If a hook blocks refunds over $500, the system prompt should say so, so the model proposes escalation on its own rather than repeatedly hitting the wall. The hook is the guarantee; the prompt is the explanation.`,
    },
  ],
  examples: [
    {
      title: 'Blocking refunds over $500 and redirecting to escalation',
      description:
        'A PreToolUse hook matched to the refund tool denies any amount above the threshold. The reason instructs the model to escalate, so the policy is enforced and the conversation continues productively.',
      language: 'python',
      code: `from claude_agent_sdk import query, ClaudeAgentOptions, HookMatcher

REFUND_LIMIT = 500

async def enforce_refund_limit(input_data, tool_use_id, context):
    amount = float(input_data["tool_input"].get("amount", 0))
    if amount > REFUND_LIMIT:
        return {"hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": (
                f"Refunds over \${REFUND_LIMIT} require a human. Call "
                "escalate_to_human with the customer id, amount and root cause."),
        }}
    return {}

options = ClaudeAgentOptions(
    mcp_servers={"support": SUPPORT_SERVER},
    allowed_tools=["mcp__support__get_customer", "mcp__support__lookup_order",
                   "mcp__support__process_refund", "mcp__support__escalate_to_human"],
    hooks={"PreToolUse": [HookMatcher(matcher="mcp__support__process_refund",
                                      hooks=[enforce_refund_limit])]},
)`,
      takeaway: 'A PreToolUse hook enforces the threshold on every call and tells the model which alternative workflow to use.',
    },
    {
      title: 'Normalising timestamps and status codes from three MCP servers',
      description:
        'Each server returns dates and statuses differently. A PostToolUse hook matched on the whole server prefix rewrites results into one canonical form before Claude reads them.',
      language: 'typescript',
      code: `import { query, type HookCallback } from "@anthropic-ai/claude-agent-sdk";

const STATUS: Record<string, string> = { "200": "ok", "402": "payment_required", "delivered": "ok" };

const normalize: HookCallback = async (input) => {
  const r = (input as any).tool_response as Record<string, unknown>;
  const out = { ...r };
  if (typeof r.created === "number") out.created = new Date(r.created * 1000).toISOString();
  if (typeof r.created === "string") out.created = new Date(r.created).toISOString();
  if (r.status !== undefined) out.status = STATUS[String(r.status)] ?? "unknown";
  return { hookSpecificOutput: { hookEventName: "PostToolUse",
           additionalContext: "Normalized: " + JSON.stringify(out) } };
};

for await (const msg of query({ prompt, options: {
  mcpServers: { orders: ORDERS, crm: CRM, payments: PAYMENTS },
  hooks: { PostToolUse: [{ matcher: "mcp__(orders|crm|payments)__.*", hooks: [normalize] }] },
}})) { /* ... */ }`,
      takeaway: 'Normalise heterogeneous formats in a PostToolUse hook so the model reasons over one canonical shape.',
    },
    {
      title: 'The mistake: enforcing the refund cap in the prompt',
      description:
        'A team wrote "Never process refunds above $500; escalate instead" in the system prompt. Audits found three refunds of $600 to $900 in a month where a persuasive customer convinced the agent the case was exceptional. Moving the rule into a PreToolUse hook made the violation count zero. The prompt sentence was kept so the agent escalates proactively.',
      language: 'text',
      code: `Rule location        Violations / 10,000 refunds   Testable in CI?
System prompt only          ~3                          no
PreToolUse hook              0                          yes (unit test the function)`,
      takeaway: 'Business rules with a cost per violation belong in hooks; prompts explain, hooks guarantee.',
    },
  ],
  keyPoints: [
    'PreToolUse runs before a tool executes and can allow, deny or ask; PostToolUse runs after and can transform or annotate the result.',
    'Hooks are deterministic code outside the model: they fire every time, are not subject to interpretation, and can be unit-tested.',
    'Use PreToolUse to enforce business rules such as blocking refunds over $500 and redirecting to escalate_to_human.',
    'Use PostToolUse to normalise heterogeneous formats (Unix vs ISO 8601 timestamps, numeric vs string status codes) before the model reasons over them.',
    'Matchers target specific tools; MCP tools are named mcp__<server>__<tool>.',
    'Choose hooks over prompts whenever compliance must be guaranteed; prompt compliance never reaches 100%.',
    'Keep the prompt and the hook aligned: the prompt explains the rule so the model plans around it, the hook guarantees it.',
  ],
  flashcards: [
    { front: 'Which hook intercepts a tool call before it executes?', back: 'PreToolUse.' },
    { front: 'Which hook transforms a tool result before Claude processes it?', back: 'PostToolUse.' },
    { front: 'How is an MCP tool named in a hook matcher?', back: 'mcp__<server>__<tool>, e.g. mcp__support__process_refund.' },
    { front: 'What decisions can a PreToolUse hook return?', back: 'Allow, deny (with a reason), or ask the user for permission.' },
    { front: 'Give the canonical example of a PreToolUse compliance hook.', back: 'Blocking process_refund when amount > $500 and redirecting to escalate_to_human.' },
    { front: 'Give the canonical example of a PostToolUse normalisation hook.', back: 'Converting Unix and ISO 8601 timestamps and numeric/string status codes from different MCP servers into one canonical format.' },
    { front: 'Why can a PostToolUse hook not prevent a dangerous action?', back: 'It runs after execution; preventing side effects is PreToolUse\'s role.' },
    { front: 'Hooks vs prompt instructions: which is deterministic?', back: 'Hooks. Prompt compliance is probabilistic.' },
    { front: 'Should the prompt still mention a rule that a hook enforces?', back: 'Yes, briefly, so the model plans compliant actions instead of repeatedly hitting the hook.' },
    { front: 'Name two other lifecycle hook events besides PreToolUse and PostToolUse.', back: 'SessionStart, Stop, Notification (also UserPromptSubmit, SubagentStop).' },
  ],
  quiz: [
    {
      question:
        'Compliance requires that no refund over $500 is processed without human approval. The agent currently has this rule in its system prompt and has violated it three times this month. What is the MOST appropriate fix?',
      options: [
        'Move the rule to the top of the system prompt in capital letters.',
        'Add a PreToolUse hook on process_refund that denies amounts over $500 and directs the model to escalate_to_human.',
        'Add a PostToolUse hook that logs refunds over $500 for later review.',
        'Lower the model\'s effort so it follows instructions more literally.',
      ],
      correct: [1],
      explanation:
        'A PreToolUse hook enforces the rule deterministically before the refund executes. Prompt emphasis remains probabilistic. A PostToolUse log runs after the money has moved, so it monitors rather than prevents. Effort does not change compliance guarantees.',
    },
    {
      question:
        'Three MCP servers return dates as Unix seconds, ISO 8601 strings and "MM/DD/YYYY" respectively. The agent sometimes miscalculates delivery windows. Which approach best fixes this?',
      options: [
        'Add instructions to the system prompt explaining each server\'s date format.',
        'Use a PostToolUse hook to convert every date to ISO 8601 UTC before the model sees the result.',
        'Use a PreToolUse hook to ask the servers for ISO dates.',
        'Switch to a larger model that handles date arithmetic better.',
      ],
      correct: [1],
      explanation:
        'Normalising in PostToolUse gives the model one canonical format on every turn and removes the conversion burden. Prompt instructions cost tokens and still fail occasionally; PreToolUse cannot change what a server returns; a larger model still has to do error-prone conversions.',
    },
    {
      question: 'Which TWO statements about Agent SDK hooks are correct? (Select two)',
      options: [
        'Hooks execute inside the model\'s reasoning and therefore consume output tokens.',
        'A PreToolUse hook can deny a tool call and supply a reason the model will see.',
        'Hook matchers can target a single MCP tool using the mcp__server__tool naming.',
        'PostToolUse hooks can prevent a tool\'s side effects from occurring.',
      ],
      correct: [1, 2],
      explanation:
        'Hooks are harness code, not model reasoning, and they can deny calls with reasons and be scoped by matcher. PostToolUse runs after execution, so it cannot prevent side effects.',
    },
    {
      question:
        'After adding a PreToolUse hook that blocks refunds over $500, the agent keeps attempting such refunds, getting denied, and then telling customers "the system is unavailable". What should be added?',
      options: [
        'Remove the hook; it is confusing the model.',
        'Include the $500 policy and the escalation path in the system prompt, and make the denial reason name escalate_to_human.',
        'Increase the threshold to $1,000.',
        'Add a retry loop so the refund eventually goes through.',
      ],
      correct: [1],
      explanation:
        'The hook guarantees the rule but the model needs the policy to plan correctly, and the denial should point at the alternative. Removing the hook or raising the limit abandons the requirement; retrying a blocked call cannot succeed.',
    },
    {
      question: 'Which rule is a good candidate for a prompt instruction rather than a hook?',
      options: [
        'Never write files outside the project directory.',
        'Prefer a warm, concise tone when replying to customers.',
        'Block process_refund until get_customer has verified the customer.',
        'Convert all currency amounts to minor units before reasoning.',
      ],
      correct: [1],
      explanation:
        'Tone is a judgment that tolerates variation. File-write boundaries, prerequisite ordering and data normalisation are rules that should hold every time and belong in hooks.',
    },
  ],
  statements: [
    { text: 'A PreToolUse hook runs before the tool executes and can block the call.', isTrue: true, explanation: 'This is the interception point for business rules like refund thresholds.' },
    { text: 'A PostToolUse hook can stop a destructive Bash command from running.', isTrue: false, explanation: 'PostToolUse fires after execution. Prevention belongs in PreToolUse.' },
    { text: 'Hooks provide deterministic enforcement while prompt instructions provide probabilistic compliance.', isTrue: true, explanation: 'Hooks are code that runs every time; prompt compliance never reaches 100%.' },
    { text: 'MCP tools cannot be targeted by hook matchers because their names are generated at runtime.', isTrue: false, explanation: 'They are named mcp__<server>__<tool> and can be matched exactly or by pattern.' },
    { text: 'Normalising heterogeneous timestamps in a PostToolUse hook removes the need for per-tool conversion instructions in the prompt.', isTrue: true, explanation: 'The model receives one canonical format, so no conversion guidance is required.' },
    { text: 'Once a hook enforces a rule, mentioning the rule in the prompt is redundant and should be removed.', isTrue: false, explanation: 'The prompt helps the model plan around the rule; the hook guarantees it. Both are useful.' },
    { text: 'Hook logic can be unit-tested like any other code.', isTrue: true, explanation: 'Hooks are ordinary functions or scripts, which is one reason they are preferred for guaranteed compliance.' },
  ],
  resources: [
    { label: 'Agent SDK hooks', url: 'https://platform.claude.com/docs/en/agent-sdk/hooks' },
    { label: 'Claude Code hooks reference', url: 'https://code.claude.com/docs/en/hooks' },
    { label: 'Claude Code hooks guide', url: 'https://code.claude.com/docs/en/hooks-guide' },
  ],
};
