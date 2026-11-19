import type { Concept } from '../../types';

export const workflowEnforcementAndHandoffs: Concept = {
  id: 'workflow-enforcement-and-handoffs',
  title: 'Workflow Enforcement and Handoff Patterns',
  summary:
    'When a step must happen before another (verify identity before refunding), enforce it in code, not in the prompt. Decompose multi-concern requests, investigate in parallel, and hand off to humans with a structured summary they can act on without the transcript.',
  certs: ['ccar-f', 'ccdv-f', 'ccar-p'],
  domains: ['ccar-f-1', 'ccar-f-5', 'ccdv-f-1', 'ccar-p-1'],
  tags: ['workflows', 'enforcement', 'escalation', 'handoff', 'support-agent', 'hooks'],
  difficulty: 'intermediate',
  diagram: 'escalation-decision',
  sections: [
    {
      heading: 'Programmatic enforcement versus prompt guidance',
      body: `There are two ways to make an agent follow an order of operations:

- **Prompt guidance**: "Always call get_customer before lookup_order or process_refund." The model usually complies. *Usually* is the problem.
- **Programmatic enforcement**: a hook or prerequisite gate in the harness that refuses to run \`process_refund\` until \`get_customer\` has returned a verified customer id in this session.

Prompt instructions are probabilistic. In the exam's own sample, an agent skipped \`get_customer\` in 12% of cases and looked up orders by the customer's stated name, occasionally refunding the wrong account. Stronger wording, capital letters and few-shot examples lower that rate but never reach zero. When the downstream action is financial, irreversible or regulated, a non-zero failure rate is unacceptable, so the rule belongs in code.

Use the prompt for *judgment* (is this refund reasonable? should I escalate?) and code for *invariants* (identity verified, amount under threshold, required fields present). Both together is normal: the prompt explains the policy so the model behaves sensibly, and the gate guarantees it.`,
    },
    {
      heading: 'Implementing a prerequisite gate',
      body: `A prerequisite gate is state plus a check:

1. Track workflow state in the harness, for example \`verified_customer_id\`, set only when \`get_customer\` returns successfully.
2. Intercept outgoing tool calls (a \`PreToolUse\` hook in the Agent SDK, or a check before dispatch in a manual loop).
3. If a gated tool is requested without the prerequisite, **block** the call and return a clear explanation as the tool result: "process_refund blocked: customer identity has not been verified. Call get_customer first."

The explanation matters. The model reads the denial as a tool result and adjusts its plan, so a good message turns a blocked call into a self-correcting loop rather than a dead end. Compare this with a bare "permission denied", which leaves the model guessing.

Gates compose with thresholds. The same hook that checks identity can check \`amount > 500\` and redirect to \`escalate_to_human\`. Note what a gate does *not* do: it does not decide whether the refund is deserved. That remains the model's call within the boundaries the gate enforces.`,
    },
    {
      heading: 'Multi-concern requests: decompose, investigate in parallel, synthesise',
      body: `Real support messages bundle several issues: "I was charged twice, the item arrived damaged, and my address is wrong on the account." Handling them one after another in a single thread produces long, confused conversations and often drops the third item.

The pattern:

1. **Decompose** the message into distinct concerns (duplicate charge, damaged item, address).
2. **Investigate each in parallel** using shared context (the verified customer record and order list are fetched once and passed to each investigation). In the Agent SDK this can be parallel tool calls in one response, or parallel subagents each handed the shared context.
3. **Synthesise** a unified resolution: one reply covering all three, with the actions taken and anything still pending.

Decomposition also helps enforcement: the refund concern is subject to the identity gate and the $500 threshold, the address concern is not, and each can be routed accordingly.`,
    },
    {
      heading: 'Structured handoffs to humans',
      body: `Escalation is not failure; it is a designed outcome. The target of 80% first-contact resolution implies 20% of cases go to a person, and that person usually **cannot see the transcript**. A handoff that says "customer is upset, please help" forces them to start over.

A structured handoff summary should include at minimum:

| Field | Why |
|---|---|
| Customer id (verified) | So the human acts on the right account |
| Concern(s) and root cause analysis | What the agent established and how |
| Amounts involved (e.g. refund amount) | Needed for approval thresholds |
| Actions already taken | Prevents double refunds |
| Recommended action and why it needs a human | Policy exception, threshold, ambiguity |
| Evidence references | Order ids, photo ids, timestamps |

Make \`escalate_to_human\` take these as **required schema fields** rather than a free-text \`reason\`. The schema forces the agent to compile the summary, and the receiving system gets consistent data. Mid-process escalation (part way through a refund) should also state exactly where the process stopped so the human can resume rather than restart.`,
    },
  ],
  examples: [
    {
      title: 'Gating process_refund behind identity verification (Agent SDK PreToolUse hook)',
      description:
        'The hook denies the refund call unless get_customer has succeeded in this session. The denial reason is returned so the model can correct course.',
      language: 'python',
      code: `from claude_agent_sdk import ClaudeAgentOptions, HookMatcher

state = {"verified_customer_id": None}

async def require_verified_customer(input_data, tool_use_id, context):
    if state["verified_customer_id"] is None:
        return {"hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason":
                "Blocked: verify identity with get_customer before process_refund.",
        }}
    return {}

async def record_customer(input_data, tool_use_id, context):
    resp = input_data.get("tool_response") or {}
    if resp.get("verified"):
        state["verified_customer_id"] = resp["customer_id"]
    return {}
options = ClaudeAgentOptions(hooks={
    "PreToolUse":  [HookMatcher(matcher="mcp__support__process_refund",
                                hooks=[require_verified_customer])],
    "PostToolUse": [HookMatcher(matcher="mcp__support__get_customer",
                                hooks=[record_customer])],
})`,
      takeaway: 'Track the prerequisite in harness state and deny gated tools with an explanation the model can act on.',
    },
    {
      title: 'The mistake: fixing a 12% skip rate with louder prompts',
      description:
        'After discovering the agent skipped identity verification in 12% of cases, a team added "CRITICAL: You MUST ALWAYS call get_customer first" and eight few-shot examples. The rate fell to 4%, and the extra tokens broke their prompt cache layout. 4% of refunds to possibly wrong accounts was still unacceptable. A prerequisite gate took the rate to zero and the prompt was shortened back to a one-line explanation of the policy.',
      language: 'text',
      code: `Approach                         Skip rate   Guarantee?
Original prompt                   12%         no
"CRITICAL/MUST" + 8 few-shots      4%         no
PreToolUse prerequisite gate       0%         yes (deterministic)`,
      takeaway: 'For invariants with financial consequences, prompt strengthening reduces but never eliminates failures; a gate does.',
    },
    {
      title: 'escalate_to_human with a required structured summary',
      description:
        'The tool schema requires the fields a human needs. The agent cannot escalate with a vague reason, and the ticketing system receives consistent data.',
      language: 'json',
      code: `{
  "name": "escalate_to_human",
  "description": "Hand the case to a human agent who cannot see this conversation. Use for policy exceptions, refunds over $500, or when the customer's identity cannot be verified.",
  "input_schema": {
    "type": "object",
    "properties": {
      "customer_id": {"type": "string", "description": "Verified id from get_customer"},
      "concerns": {"type": "array", "items": {"type": "string"}},
      "root_cause": {"type": "string", "description": "What was established and the evidence"},
      "refund_amount": {"type": "number"},
      "actions_taken": {"type": "array", "items": {"type": "string"}},
      "recommended_action": {"type": "string"},
      "escalation_reason": {"type": "string", "enum": ["threshold", "policy_exception", "unverified_identity", "ambiguous"]}
    },
    "required": ["customer_id", "concerns", "root_cause", "actions_taken", "recommended_action", "escalation_reason"]
  }
}`,
      takeaway: 'Encode the handoff summary in the tool schema so every escalation is complete and consistent.',
    },
    {
      title: 'Decomposing a three-concern message',
      description:
        'A customer reports a duplicate charge, a damaged item and a wrong address in one message. The agent verifies identity once, then investigates the three concerns in parallel with that shared context, applies the refund gate only to the charge concern, fixes the address directly, and replies with one unified summary.',
      language: 'markdown',
      code: `## Agent plan (from the system prompt)
1. Verify identity once (get_customer). Share the result with every concern.
2. List each distinct concern. For each, pick the tools needed.
3. Investigate concerns in parallel (lookup_order for #A and #B, account lookup for the address).
4. Apply policy per concern: refunds need verified identity and are capped at $500 before escalation.
5. Reply once: what was resolved, what was escalated (with ticket id), what the customer should expect next.`,
      takeaway: 'Fetch shared context once, investigate concerns in parallel, and synthesise a single resolution.',
    },
  ],
  keyPoints: [
    'Prompt instructions for ordering are probabilistic; prerequisite gates and hooks are deterministic. Use code for invariants, prompts for judgment.',
    'When errors have financial or regulatory consequences, any non-zero failure rate from prompt-only enforcement is unacceptable.',
    'A prerequisite gate tracks state (e.g. verified_customer_id) and blocks downstream tools until the prerequisite has completed.',
    'Return a clear reason when blocking a call so the model can self-correct instead of stalling.',
    'Multi-concern requests: decompose into distinct items, investigate in parallel with shared context, then synthesise one unified resolution.',
    'Human escalation needs a structured summary: customer id, root cause, amounts, actions taken, recommended action, because the human lacks the transcript.',
    'Put the handoff fields in the escalate_to_human schema as required properties rather than a free-text reason.',
  ],
  flashcards: [
    { front: 'Prompt guidance vs programmatic enforcement: which gives a deterministic guarantee?', back: 'Programmatic enforcement (hooks, prerequisite gates). Prompts have a non-zero failure rate.' },
    { front: 'What is a prerequisite gate?', back: 'Harness logic that blocks a downstream tool call (e.g. process_refund) until a prerequisite step (e.g. get_customer returning a verified id) has completed.' },
    { front: 'Why return an explanation when a hook blocks a tool call?', back: 'The model reads it as a tool result and can correct its plan; a bare denial leaves it guessing.' },
    { front: 'How should an agent handle a message containing three unrelated issues?', back: 'Decompose into distinct concerns, investigate each in parallel using shared context, then synthesise a single resolution.' },
    { front: 'What belongs in a structured handoff summary?', back: 'Verified customer id, concerns and root cause, amounts, actions already taken, recommended action, evidence references.' },
    { front: 'Why do human agents need a structured handoff?', back: 'They typically cannot see the conversation transcript and would otherwise restart from scratch.' },
    { front: 'How do you make sure every escalation contains the required fields?', back: 'Make them required properties in the escalate_to_human tool schema.' },
    { front: 'Where does the decision "is this refund deserved?" live: gate or prompt?', back: 'Prompt/model judgment, within boundaries the gate enforces (identity verified, under threshold).' },
    { front: 'An agent skips a mandatory step 12% of the time despite clear instructions. Best fix?', back: 'Add a programmatic prerequisite that blocks the downstream tools until the step has completed.' },
  ],
  quiz: [
    {
      question:
        'Production data shows the support agent skips get_customer in 12% of cases and calls lookup_order using the customer\'s stated name, occasionally causing refunds to the wrong account. Which change MOST effectively fixes this?',
      options: [
        'Strengthen the system prompt to say that get_customer is mandatory before any order operation.',
        'Add a programmatic prerequisite that blocks lookup_order and process_refund until get_customer has returned a verified customer id.',
        'Add few-shot examples showing get_customer always being called first.',
        'Add a classifier that enables only the tools relevant to each request type.',
      ],
      correct: [1],
      explanation:
        'A required sequence with financial consequences needs deterministic enforcement. Prompt strengthening and few-shot examples rely on probabilistic compliance and still fail sometimes. A tool-availability classifier addresses which tools exist, not the order they are called in.',
    },
    {
      question:
        'A refund gate denies process_refund with the message "denied". After the denial, the agent retries the same call three times and then tells the customer the system is down. What is the best improvement?',
      options: [
        'Raise the retry limit so the agent eventually succeeds.',
        'Have the denial explain the missing prerequisite ("verify identity with get_customer first") so the model can correct its plan.',
        'Remove the gate and instruct the model to verify identity.',
        'Switch to a larger model that understands denials better.',
      ],
      correct: [1],
      explanation:
        'The model treats the denial as a tool result; an actionable message turns it into a self-correcting step. More retries of the same blocked call cannot succeed, removing the gate reintroduces the risk, and model size does not supply information the harness withheld.',
    },
    {
      question:
        'Which TWO elements should a structured handoff to a human agent include? (Select two)',
      options: [
        'The verified customer id and the actions the agent has already taken.',
        'The full raw conversation transcript pasted into the ticket body.',
        'The root cause analysis and the recommended action with the reason it needs a human.',
        'The agent\'s self-reported confidence score as the only context.',
      ],
      correct: [0, 2],
      explanation:
        'Humans without transcript access need identity, what was done, what was found and what to do next. Dumping the raw transcript is noisy and often not permitted; a confidence score alone gives the human nothing actionable.',
    },
    {
      question:
        'A customer writes: "I was charged twice, the package was damaged, and please fix my shipping address." The agent handles the double charge, then forgets the other two items. Which design change best addresses this?',
      options: [
        'Ask customers to submit one issue per message.',
        'Have the agent decompose the message into distinct concerns, investigate them in parallel using the shared customer context, and synthesise one response.',
        'Increase max_tokens so the agent has room for all three answers.',
        'Route every multi-issue message straight to a human.',
      ],
      correct: [1],
      explanation:
        'Decompose, investigate in parallel with shared context, synthesise is the pattern for multi-concern requests. Restricting customers hurts experience, max_tokens is not the bottleneck, and routing everything to humans defeats the first-contact resolution target.',
    },
    {
      question:
        'An architect proposes removing the "explain the refund policy" paragraph from the system prompt because a PreToolUse hook now enforces the $500 threshold. What is the best assessment?',
      options: [
        'Correct: once a rule is enforced in code the prompt should not mention it.',
        'Incorrect: keep a concise policy explanation so the model plans sensibly, and rely on the hook for the guarantee.',
        'Incorrect: the hook should be removed instead because prompts are easier to maintain.',
        'Correct: hooks and prompt text conflict and cause the model to refuse valid refunds.',
      ],
      correct: [1],
      explanation:
        'Code guarantees the invariant; the prompt supplies the judgment context so the model proposes compliant actions in the first place and explains policy to customers. The two complement each other. Removing the hook reintroduces non-zero failure, and hooks do not conflict with policy text.',
    },
  ],
  statements: [
    { text: 'A well-worded system prompt can guarantee that get_customer is always called before process_refund.', isTrue: false, explanation: 'Prompt compliance is probabilistic. Only programmatic enforcement provides a guarantee.' },
    { text: 'A prerequisite gate should block the downstream tool and return a reason the model can act on.', isTrue: true, explanation: 'The reason becomes a tool result that lets the model correct its plan.' },
    { text: 'Human agents receiving an escalation can normally read the full agent transcript, so a brief reason is enough.', isTrue: false, explanation: 'The exam assumes the human lacks transcript access; the handoff must carry customer id, root cause, amounts, actions taken and recommended action.' },
    { text: 'Multi-concern requests should be decomposed and investigated in parallel using shared context before a single synthesised reply.', isTrue: true, explanation: 'This avoids dropped concerns and long, confused single-thread handling.' },
    { text: 'Making handoff fields required in the escalate_to_human schema forces the agent to compile a complete summary.', isTrue: true, explanation: 'The schema is enforced on every call, so escalations are consistent.' },
    { text: 'Once a hook enforces a business rule, the model no longer needs any information about that rule.', isTrue: false, explanation: 'The model still needs policy context to plan sensible actions and explain outcomes; the hook supplies the guarantee, not the understanding.' },
    { text: 'Escalation to a human is a failure state that a well-designed agent should never reach.', isTrue: false, explanation: 'Escalation is a designed outcome; the 80% target implies about one in five cases legitimately go to a person.' },
  ],
  resources: [
    { label: 'Agent SDK hooks', url: 'https://platform.claude.com/docs/en/agent-sdk/hooks' },
    { label: 'Claude Code hooks reference', url: 'https://code.claude.com/docs/en/hooks' },
    { label: 'Building effective agents (Anthropic)', url: 'https://www.anthropic.com/research/building-effective-agents' },
  ],
};
