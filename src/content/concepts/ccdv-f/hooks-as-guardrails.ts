import type { Concept } from '../../types';

export const hooksAsGuardrails: Concept = {
  id: 'hooks-as-guardrails',
  title: 'Hooks as Guardrails',
  summary:
    'Hooks in Claude Code and the Agent SDK run your code at fixed points in the agent loop, so business and safety rules are enforced deterministically instead of requested in a prompt.',
  certs: ['ccdv-f', 'ccar-f', 'ccar-p'],
  domains: ['ccdv-f-7', 'ccdv-f-1', 'ccdv-f-3', 'ccar-f-1', 'ccar-f-3', 'ccar-p-5', 'ccar-p-7'],
  tags: ['hooks', 'claude-code', 'agent-sdk', 'guardrails', 'security', 'deterministic'],
  difficulty: 'intermediate',
  diagram: 'hooks-lifecycle',
  sections: [
    {
      heading: 'What hooks are',
      body: `A **hook** is code you register to run at a specific point in the agent lifecycle. Unlike a system-prompt instruction, which the model may or may not follow, a hook *always* runs and its decision is final. That makes hooks the right place for rules that must hold every time: destructive-command blocking, spending limits, data normalization, redaction, audit logging.

Hook events in Claude Code (and mirrored in the Agent SDK):

| Event | Fires | Typical guardrail use |
|---|---|---|
| \`PreToolUse\` | Before a tool call executes | Block, allow, or require confirmation; validate arguments |
| \`PostToolUse\` | After a tool returns | Normalize formats, redact secrets or PII, add context, flag anomalies |
| \`Stop\` | When the agent is about to finish its turn | Enforce completion criteria (tests ran, summary written); prevent premature stop |
| \`SessionStart\` | At session start or resume | Load environment context, inject policy reminders |
| \`Notification\` | When Claude Code sends a notification | Route alerts to chat or paging systems |
| \`UserPromptSubmit\` | When the user submits a prompt | Validate or enrich input; block prohibited requests |

In Claude Code hooks are configured in \`settings.json\` (user, project or \`settings.local.json\`) as shell commands with a \`matcher\` on tool name. In the Agent SDK they are functions passed in options (\`hooks\` with \`HookMatcher\` in Python; a \`hooks\` map in TypeScript), which is how you enforce rules in your own applications.`,
    },
    {
      heading: 'How a PreToolUse hook decides',
      body: `A command hook receives JSON on stdin describing the event: \`session_id\`, \`tool_name\`, \`tool_input\`, and for PostToolUse the \`tool_response\`. It communicates its decision in one of two ways:

- **Exit code.** \`0\` lets the action proceed; \`2\` blocks it and feeds stderr back to the model as the reason; other non-zero codes report an error without blocking.
- **JSON on stdout** for finer control: \`{"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "deny" | "allow" | "ask", "permissionDecisionReason": "..."}}\`. \`ask\` forces a human confirmation even in modes that would otherwise auto-approve.

Because the hook runs *before* the tool executes, a deny means the side effect never happens. The model sees the reason and can choose a different path, ask the user, or stop. This is fundamentally different from a prompt rule ("never delete files"), which the model might ignore under injection, confusion or a long context.

Agent SDK hooks follow the same model: the callback receives the tool name and input and returns a decision object (or raises), so your Python or TypeScript code is the gate.`,
    },
    {
      heading: 'Deterministic enforcement vs prompt instructions',
      body: `When should a rule be a hook rather than a sentence in the prompt?

- It is a **business or compliance rule** with a hard threshold: refunds over $200, writes outside the repo, emails to external domains, commands matching \`rm -rf\`. These need a guarantee, not a tendency.
- A violation is **irreversible or expensive**: deletion, payment, production deploy, sending a message.
- The rule must be **auditable**: you need to show it was enforced, not just requested.
- The input may be **adversarial**: anything derived from untrusted content.

Prompt instructions remain the right tool for judgment: tone, when to ask a clarifying question, how to prioritize, what counts as a good summary. Hooks cannot judge quality; they can only check conditions you can express in code.

The Architect Foundations guide states the distinction directly: choose hooks over prompt-based enforcement when business rules require guaranteed enforcement, and use PostToolUse hooks to normalize heterogeneous data (Unix timestamps vs ISO dates, currency formats) before the model sees it, so the model does not have to be told the same conversion rule on every turn.`,
    },
    {
      heading: 'Design and operational notes',
      body: `- **Match narrowly.** Use the \`matcher\` to target specific tools (\`Bash\`, \`Write|Edit\`, \`mcp__payments__refund\`) so hooks stay fast and predictable.
- **Fail closed.** If the hook script crashes or times out on a sensitive tool, treat it as a deny. A guardrail that disappears when it errors is not a guardrail.
- **Return useful reasons.** The denial reason goes back to the model; "refund exceeds $200 limit; use escalate_to_human" lets the agent recover gracefully.
- **Keep hooks deterministic and fast.** No model calls inside a PreToolUse hook on the hot path unless latency is acceptable; prefer regex, allowlists and simple lookups.
- **Pair with least privilege.** A hook that blocks \`delete_user\` is good; not giving the agent \`delete_user\` is better. Hooks guard the tools you must keep.
- **Scope and review.** Project-level hooks in \`.claude/settings.json\` are shared via version control and should be code-reviewed like any security control; \`settings.local.json\` is per-developer. Hooks run with the user's permissions, so a malicious hook is itself a risk: only run hooks you trust.
- **Log every decision.** Hook allow/deny/ask events are a high-signal monitoring stream for both security and prompt quality.`,
    },
  ],
  examples: [
    {
      title: 'Blocking destructive shell commands in Claude Code',
      description:
        'A team running Claude Code in CI wants a hard guarantee that no recursive delete or force-push runs, no matter what the prompt or a malicious file says. A PreToolUse hook on Bash inspects the command and exits 2 to block.',
      language: 'python',
      code: `#!/usr/bin/env python3
# .claude/hooks/block_destructive.py  (registered as a PreToolUse hook with matcher "Bash")
import json, re, sys

event = json.load(sys.stdin)
cmd = event.get("tool_input", {}).get("command", "")

PATTERNS = [
    r"\\brm\\s+-[a-zA-Z]*r[a-zA-Z]*f|\\brm\\s+-[a-zA-Z]*f[a-zA-Z]*r",  # rm -rf / rm -fr
    r"git\\s+push\\s+.*--force",
    r"\\bdrop\\s+(table|database)\\b",
    r"\\bmkfs\\b|\\bdd\\s+if=",
]
for p in PATTERNS:
    if re.search(p, cmd, re.IGNORECASE):
        print(f"Blocked destructive command matching /{p}/: {cmd}", file=sys.stderr)
        sys.exit(2)      # exit 2 = block; stderr is shown to the model
sys.exit(0)`,
      takeaway: 'Exit code 2 blocks the call before it runs and tells the model why.',
    },
    {
      title: 'Blocking refunds over a threshold in the Agent SDK',
      description:
        'A support agent built with the Agent SDK may call an MCP refund tool. Policy caps autonomous refunds at $200. A PreToolUse hook denies larger refunds and points the agent to the escalation tool, regardless of how persuasive the customer or an injected ticket is.',
      language: 'python',
      code: `from claude_agent_sdk import query, ClaudeAgentOptions, HookMatcher

REFUND_LIMIT = 200.0

async def cap_refunds(input_data, tool_use_id, context):
    if input_data["tool_name"].endswith("process_refund"):
        amount = float(input_data["tool_input"].get("amount", 0))
        if amount > REFUND_LIMIT:
            return {"hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason":
                    f"Refund {amount:.2f} exceeds the {REFUND_LIMIT:.0f} USD autonomous limit. "
                    "Call escalate_to_human instead.",
            }}
    return {}

options = ClaudeAgentOptions(
    allowed_tools=["mcp__support__lookup_order", "mcp__support__process_refund",
                   "mcp__support__escalate_to_human"],
    hooks={"PreToolUse": [HookMatcher(matcher="mcp__support__.*", hooks=[cap_refunds])]},
)`,
      takeaway: 'A threshold in code is enforced every time; a threshold in the prompt is a suggestion.',
    },
    {
      title: 'Writes outside a directory, and the prompt-only mistake',
      description:
        'A documentation agent was told in CLAUDE.md to "only modify files under docs/". After a long session it edited a CI config. The team replaced the instruction with a PreToolUse hook on Write and Edit that resolves the path and denies anything outside docs/. The CLAUDE.md line stays for context, but the hook is the control.',
      language: 'json',
      code: `{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | python3 -c \\"import sys,os; p=os.path.realpath(sys.stdin.read().strip()); root=os.path.realpath('docs'); sys.exit(0 if p.startswith(root+os.sep) else 2)\\""
          }
        ]
      }
    ]
  }
}`,
      takeaway: 'Instructions drift in long sessions; hooks do not.',
    },
    {
      title: 'Redacting secrets from tool output with PostToolUse',
      description:
        'An agent reads configuration files and logs while debugging. Some contain API keys. A PostToolUse hook on Read and Bash scrubs anything that looks like a credential before the content reaches the model, so secrets never enter the transcript, the logs, or a possible exfiltration path.',
      language: 'typescript',
      code: `import { query } from "@anthropic-ai/claude-agent-sdk";

const SECRET = /(sk-ant-[A-Za-z0-9_-]{10,}|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36}|-----BEGIN [A-Z ]*PRIVATE KEY-----[\\s\\S]*?-----END [A-Z ]*PRIVATE KEY-----)/g;

for await (const msg of query({
  prompt: "Investigate why the deploy job fails and propose a fix.",
  options: {
    allowedTools: ["Read", "Grep", "Bash"],
    hooks: {
      PostToolUse: [{
        matcher: "Read|Bash",
        hooks: [async (input) => {
          const out = JSON.stringify(input.tool_response ?? "");
          if (SECRET.test(out)) {
            return { hookSpecificOutput: { hookEventName: "PostToolUse",
              additionalContext: "Credential-like strings in this output were redacted by policy." } };
          }
          return {};
        }],
      }],
    },
  },
})) { /* ... */ }`,
      takeaway: 'PostToolUse hooks shape what the model sees; use them to normalize data and strip secrets.',
    },
  ],
  keyPoints: [
    'Hooks run your code at fixed lifecycle points (PreToolUse, PostToolUse, Stop, SessionStart, Notification, UserPromptSubmit) and always execute, unlike prompt instructions.',
    'PreToolUse hooks block, allow or require confirmation before a tool executes; exit code 2 blocks and returns stderr to the model; JSON permissionDecision gives finer control.',
    'PostToolUse hooks normalize heterogeneous data and redact secrets or PII before the model sees results.',
    'Use hooks for hard business/compliance rules, irreversible actions, auditability and adversarial input; use prompts for judgment.',
    'Classic examples: block rm -rf and force-push, cap refunds, confine writes to a directory, redact credentials from output.',
    'Fail closed: a hook that errors on a sensitive tool should deny, not allow.',
    'Hooks complement least privilege; removing a tool is still better than guarding it.',
    'Claude Code hooks live in settings.json (user/project/local) with matchers; Agent SDK hooks are callbacks in options.',
  ],
  flashcards: [
    { front: 'What is the key difference between a hook and a system-prompt rule?', back: 'A hook always runs and its decision is enforced in code; a prompt rule is followed probabilistically.' },
    { front: 'Which hook event blocks a tool call before it executes?', back: 'PreToolUse.' },
    { front: 'Which hook event normalizes or redacts tool results?', back: 'PostToolUse.' },
    { front: 'What does exit code 2 from a command hook mean?', back: 'Block the action; stderr is returned to the model as the reason.' },
    { front: 'How does a hook force human confirmation?', back: 'Return JSON with hookSpecificOutput.permissionDecision set to "ask".' },
    { front: 'Where are Claude Code hooks configured?', back: 'In settings.json (user ~/.claude/settings.json, project .claude/settings.json, or settings.local.json) under "hooks" with a matcher per tool.' },
    { front: 'How are hooks defined in the Agent SDK?', back: 'As callback functions in the options (Python: hooks={"PreToolUse": [HookMatcher(matcher=..., hooks=[fn])]}; TypeScript: a hooks map).' },
    { front: 'Give four classic guardrail hooks.', back: 'Block rm -rf / force-push; block refunds over a threshold; block writes outside a directory; redact secrets from tool output.' },
    { front: 'What does "fail closed" mean for a hook?', back: 'If the hook errors or times out on a sensitive tool, treat it as a deny.' },
    { front: 'Why use PostToolUse to normalize timestamps and currencies?', back: 'So heterogeneous tool data is converted deterministically once, instead of relying on the model to apply conversion rules every turn.' },
    { front: 'What does the Stop hook enable?', back: 'Enforcing completion criteria before the agent ends its turn, e.g., tests must have run.' },
  ],
  quiz: [
    {
      question:
        'A support agent must never issue refunds above $200 autonomously. The team has written this rule in the system prompt but occasionally sees larger refunds. What is the MOST appropriate fix?',
      options: [
        'Repeat the rule in bold at the top and bottom of the system prompt.',
        'Add a PreToolUse hook on the refund tool that denies amounts over $200 and directs the agent to escalate.',
        'Switch to a larger model that follows instructions better.',
        'Add a PostToolUse hook that reverses refunds over $200 after they are issued.',
      ],
      correct: [1],
      explanation:
        'A pre-execution hook guarantees the rule. Repeating prompt text and changing models remain probabilistic, and reversing after the fact means the side effect already happened and may not be reversible.',
    },
    {
      question: 'A command hook needs to block a Bash call and explain why. Which mechanism does that?',
      options: [
        'Exit code 0 with the reason on stdout.',
        'Exit code 2 with the reason on stderr.',
        'Exit code 1 with the reason on stdout.',
        'Returning the string "BLOCK".',
      ],
      correct: [1],
      explanation: 'Exit 2 blocks and feeds stderr to the model. Exit 0 allows, other non-zero codes report an error without blocking, and a bare string has no meaning.',
    },
    {
      question: 'Which TWO are appropriate uses of a PostToolUse hook? (Select two)',
      options: [
        'Converting Unix timestamps and ISO dates from different tools into one format before the model sees them.',
        'Preventing a destructive command from executing.',
        'Redacting API keys and card numbers from a file-read result.',
        'Deciding whether the agent\'s summary is well written.',
      ],
      correct: [0, 2],
      explanation:
        'PostToolUse operates on results: normalization and redaction. Preventing execution is PreToolUse, and judging prose quality is not something a deterministic hook can do.',
    },
    {
      question:
        'An organization wants its "no writes outside docs/" rule shared with every developer and reviewed like code. Where should the hook be configured?',
      options: [
        'In each developer\'s ~/.claude/settings.json.',
        'In the project\'s .claude/settings.json, committed to version control.',
        'In .claude/settings.local.json.',
        'In CLAUDE.md as an instruction.',
      ],
      correct: [1],
      explanation:
        'Project settings are shared and reviewable. User and local settings are per machine, and CLAUDE.md is an instruction, not an enforced control.',
    },
    {
      question: 'A PreToolUse hook guarding the payments tool crashes because of a network error. What should the system do?',
      options: [
        'Allow the call, since the hook could not evaluate it.',
        'Deny the call and report the hook failure (fail closed).',
        'Ask the model to decide whether the payment is safe.',
        'Retry the payment without the hook.',
      ],
      correct: [1],
      explanation: 'A guardrail that disappears on error is not a guardrail. The model is not a substitute for the control it was meant to constrain.',
    },
    {
      question: 'Which rule is better suited to a prompt instruction than a hook?',
      options: [
        'Never run rm -rf.',
        'Ask a clarifying question when the user\'s request is ambiguous.',
        'Never write outside the repository.',
        'Never email external domains.',
      ],
      correct: [1],
      explanation: 'Ambiguity is a judgment call that code cannot express; the others are conditions that can and should be checked deterministically.',
    },
  ],
  statements: [
    { text: 'A PreToolUse hook can prevent a tool call from executing.', isTrue: true, explanation: 'It runs before execution and a deny stops the side effect.' },
    { text: 'A clearly worded system-prompt rule provides the same guarantee as a hook.', isTrue: false, explanation: 'Prompt rules are followed probabilistically; hooks are enforced in code every time.' },
    { text: 'PostToolUse hooks can modify what the model sees by normalizing or redacting tool results.', isTrue: true, explanation: 'This is the documented pattern for data normalization and secret redaction.' },
    { text: 'If a hook errors, the safest default for a sensitive tool is to allow the call.', isTrue: false, explanation: 'Fail closed: deny and report.' },
    { text: 'Hooks make least privilege unnecessary because they can block any tool.', isTrue: false, explanation: 'Not giving the agent a dangerous tool is still stronger; hooks guard the tools you must keep.' },
    { text: 'Agent SDK hooks are callbacks that receive the tool name and input and return a decision.', isTrue: true, explanation: 'They mirror Claude Code hook events in application code.' },
    { text: 'Hooks can judge whether the agent\'s answer is high quality.', isTrue: false, explanation: 'Hooks check conditions expressible in code; quality judgment belongs to prompts and evals.' },
  ],
  resources: [
    { label: 'Claude Code hooks reference', url: 'https://code.claude.com/docs/en/hooks' },
    { label: 'Get started with hooks', url: 'https://code.claude.com/docs/en/hooks-guide' },
    { label: 'Agent SDK hooks', url: 'https://platform.claude.com/docs/en/agent-sdk/hooks' },
  ],
};
