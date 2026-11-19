import type { Concept } from '../../types';

export const guardrailsAndSafeDeployment: Concept = {
  id: 'guardrails-and-safe-deployment',
  title: 'Guardrails and Safe Deployment',
  summary:
    'Layer independent controls (input classifiers, system-prompt policy, tool allowlists, hooks, output checks, human review), build on secure-by-design principles, handle the refusal stop reason and fallbacks, and roll out in stages.',
  certs: ['ccdv-f', 'ccar-f', 'ccar-p', 'ccao-f'],
  domains: ['ccdv-f-7', 'ccdv-f-2', 'ccar-f-5', 'ccar-f-1', 'ccar-p-5', 'ccar-p-3', 'ccao-f-6'],
  tags: ['security', 'guardrails', 'safety', 'deployment', 'least-privilege', 'refusal', 'rollout'],
  difficulty: 'intermediate',
  diagram: 'layered-guardrails',
  sections: [
    {
      heading: 'Why layering',
      body: `No single control is reliable against every failure mode of an LLM system. The model can be wrong, the prompt can be subverted, a tool can return something unexpected, and a user can be malicious. **Guardrail layering** means stacking controls that fail independently, so a failure in one is caught by another. The usual stack, from the outside in:

1. **Input classifiers and filters.** Cheap checks before the main model: known attack patterns, prohibited topics, PII that should be redacted, oversized inputs.
2. **System-prompt policy.** The behavioral rules: scope, persona, refusal criteria, escalation triggers, output format. Flexible, but probabilistic.
3. **Tool allowlists and least privilege.** Which tools exist for this agent, with which argument constraints. Removing a capability is the strongest control there is.
4. **Hooks and approval gates.** Deterministic code that runs before and after tool calls: block, require confirmation, validate, redact.
5. **Output checks.** Validate structure, scan for leakage (secrets, system prompt, PII), check policy compliance, run a second-model review for high-risk outputs.
6. **Human review.** Approval for consequential actions, sampled review of automated outputs, escalation paths.

Each layer is cheap on its own. Their value is in the combination: an injection that gets past the classifier and persuades the model still meets an agent without the dangerous tool, a hook that would block it anyway, and an output filter that would catch the leak.`,
    },
    {
      heading: 'Secure by design',
      body: `Guardrails are easier when the system is shaped correctly from the start. The principles the exam names:

- **Least privilege.** Every agent, tool and credential gets only the access its task requires. Scope API keys to a workspace, give agents only the tools they need, constrain tool arguments (directories, domains, amounts). When a capability is not needed, remove it rather than monitor it.
- **Privacy by default.** Minimize what data reaches the model; redact or tokenize PII before sending; choose appropriate retention; keep logs free of sensitive content.
- **Identity and access management (IAM).** Authenticate users and services; derive authorization from the authenticated session, never from model output; separate human identities from workload identities; review and rotate access.
- **Defense in depth** as above, and **fail safe**: when a check cannot run (classifier down, hook errors), the default should be to block or escalate, not to proceed.
- **Auditability.** Log prompts, tool calls and decisions in a way that lets you reconstruct an incident, with sensitive data redacted.

The Architect Professional sample item is the test case: an agent that can read tickets, draft replies, issue refunds and delete accounts, used by staff who only read and draft. Least privilege says remove the refund and delete tools; logging or confirmation prompts are weaker, compensating controls.`,
    },
    {
      heading: 'Content policy, refusals and fallbacks',
      body: `Anthropic's **Usage Policy** defines what applications may do with Claude. Your own content policy sits on top of it: what your product will and will not do, which topics it declines, how it handles requests outside scope. Encode that policy in the system prompt and verify it with evals; do not assume the model will infer it.

The model also enforces its own safety behavior. On current models, safety classifiers and the model itself can decline a request and return HTTP 200 with \`stop_reason: "refusal"\`. \`stop_details\` is populated only for refusals and carries a category (for example cyber, bio, reasoning_extraction) that can be \`null\`. Practical handling:

- **Branch on \`stop_reason\` before reading \`content\`.** A refusal can have empty content; code that indexes \`content[0]\` breaks.
- **Do not retry the identical prompt.** Surface the refusal or route to a fallback.
- **Server-side fallbacks** (beta) re-run a declined request on another model: \`fallbacks: "default"\` lets Anthropic choose by refusal category, or name models explicitly. If the whole chain refuses, the final response still has \`stop_reason: "refusal"\`. Not available on the Batches API or on third-party platforms (Bedrock, Vertex AI, Foundry), where SDK-side middleware is used instead.
- Legitimate security and life-science work can occasionally trip classifiers, so fallback handling belongs in production code from day one, not as a later hardening step.`,
    },
    {
      heading: 'Safe rollout',
      body: `Shipping an LLM feature is a controlled experiment, not a flag flip:

- **Evals first.** A representative test set with safety and security cases alongside quality cases; a release criterion that includes refusal correctness and guardrail coverage.
- **Shadow mode.** Run the new system on real traffic without acting or showing output; compare its decisions to the current system or to humans. This catches distribution shift that evals miss.
- **Staged exposure.** Internal users, then a small percentage, then wider, with automatic rollback thresholds on error rate, refusal rate, guardrail triggers and cost.
- **Human in the loop by default** for consequential actions until data shows the automation is safe for a specific segment; aggregate accuracy can hide poor performance on one document type or field.
- **Monitoring that includes safety signals.** Guardrail trigger rates, hook blocks, refusal categories, PII detections, anomalous tool sequences, cost per task.
- **Kill switch and version pinning.** Pin the model id and prompt version; be able to disable a tool, a feature or the whole agent quickly.

Exam heuristic: when a scenario asks how to deploy a risky new capability, the answer with a *staged, measured* exposure and a *removal* of unnecessary privilege beats the one that goes to full traffic with better monitoring.`,
    },
  ],
  examples: [
    {
      title: 'A layered stack for a refund-capable support agent',
      description:
        'A retailer deploys an agent that can look up orders and issue refunds. Each layer catches a failure the others might miss, and the team can point to which layer handles which risk.',
      language: 'yaml',
      code: `layers:
  input:        PII redaction of card numbers; max message length; abuse classifier (haiku)
  policy:       system prompt with refund criteria, escalation triggers, out-of-scope refusals
  tools:        [lookup_order, issue_refund, escalate_to_human]   # no account deletion, no email
  tool_limits:  issue_refund.amount <= 200 USD; one refund per order per day
  hooks:
    PreToolUse: block issue_refund above 200 USD -> escalate; block non-matching customer_id
    PostToolUse: strip payment details from lookup_order results
  output:       schema validation; scan for card numbers and internal URLs
  human:        refunds > 200 USD and all disputes reviewed by an agent; 5% random audit
  monitoring:   hook-block rate, refusal rate, refund total/hour, anomalous sequences`,
      takeaway: 'Write the stack down; each risk should map to at least two independent layers.',
    },
    {
      title: 'Handling refusals and fallbacks in code',
      description:
        'A security-tooling vendor saw occasional classifier refusals on benign requests. They added refusal handling and opted into server-side fallbacks so a declined request is re-run on a recommended model instead of failing the user.',
      language: 'python',
      code: `response = client.beta.messages.create(
    betas=["server-side-fallback-2026-07-01"],
    model="claude-opus-5-5",
    max_tokens=2000,
    fallbacks="default",            # Anthropic picks the fallback by refusal category
    system=SYSTEM,
    messages=messages,
)

if response.stop_reason == "refusal":
    category = response.stop_details.category if response.stop_details else None
    log_refusal(category)
    return "I can't help with that request."   # do not retry the same prompt

text = next((b.text for b in response.content if b.type == "text"), "")`,
      takeaway: 'Check stop_reason first, do not retry a refusal verbatim, and use fallbacks where available.',
    },
    {
      title: 'The mistake: monitoring instead of removing',
      description:
        'A team gave an internal document-summarizing agent the same tool set as their admin agent, including user deletion, "because it is internal". They added detailed logging. A prompt injection via an uploaded PDF deleted a test account before anyone read the logs. The remediation removed every tool the summarizer did not need and added a hook requiring approval for the rest.',
      language: 'text',
      code: `Before: tools = [read_doc, summarize, delete_user, reset_password, export_users] + logging
After:  tools = [read_doc, summarize]
        hook: PreToolUse on any tool not in allowlist -> deny
        rollout: shadow mode 1 week, then internal users, then all`,
      takeaway: 'Logging tells you what went wrong afterwards; least privilege stops it from going wrong.',
    },
    {
      title: 'Shadow mode before enabling automated actions',
      description:
        'A claims processor wanted Claude to auto-approve low-value claims. They first ran it in shadow mode: the model produced a decision that was logged next to the human decision but never acted on. After two weeks the agreement rate per claim type showed one category with poor accuracy, which stayed manual while the others were staged to 10%, then 50%, then full automation.',
      language: 'python',
      code: `decision = model_decision(claim)              # never acted upon in shadow mode
record_shadow(claim.id, model=decision, human=None)

# later, nightly comparison
for row in shadow_rows_with_human_outcome():
    stats[row.claim_type].update(agree=(row.model == row.human))

# promotion rule: enable automation only where agreement >= 0.98 on >= 500 cases
for claim_type, s in stats.items():
    if s.n >= 500 and s.agreement >= 0.98:
        enable_automation(claim_type, traffic_pct=10)`,
      takeaway: 'Shadow mode and per-segment thresholds reveal what aggregate accuracy hides before anything is at stake.',
    },
  ],
  keyPoints: [
    'Layer independent controls: input classifiers, system-prompt policy, tool allowlists, hooks, output checks, human review, monitoring.',
    'Least privilege: remove unneeded tools and permissions rather than logging or confirming them.',
    'Privacy by default and IAM: minimize data sent, derive authorization from the authenticated session, separate human and workload identities.',
    'Fail safe: if a guardrail cannot run, block or escalate rather than proceed.',
    'Encode your content policy (on top of Anthropic\'s Usage Policy) in the system prompt and verify it with evals.',
    'Handle stop_reason "refusal" before reading content; stop_details is populated only for refusals; do not retry the identical prompt.',
    'Server-side fallbacks (beta) re-run declined requests on another model; unavailable on Batches and third-party platforms.',
    'Roll out safely: evals, shadow mode, staged exposure with rollback thresholds, human in the loop for consequential actions, pinned versions and a kill switch.',
  ],
  flashcards: [
    { front: 'List the typical guardrail layers from outside in.', back: 'Input classifiers/filters, system-prompt policy, tool allowlists (least privilege), hooks/approval gates, output checks, human review, with monitoring throughout.' },
    { front: 'Least privilege: an agent has a tool its users never need. Best action?', back: 'Remove the tool. Logging and confirmation are weaker compensating controls.' },
    { front: 'What does "fail safe" mean for guardrails?', back: 'If a control cannot run (classifier down, hook errors), default to blocking or escalating, not proceeding.' },
    { front: 'What is stop_reason "refusal" and when is stop_details populated?', back: 'The model or a safety classifier declined the request (HTTP 200). stop_details is populated only for refusals and may carry a category that can be null.' },
    { front: 'What do server-side fallbacks do?', back: 'Re-run a refused request on another model in the same call (beta); "default" picks by refusal category. Not on Batches or third-party platforms.' },
    { front: 'Why not retry an identical prompt after a refusal?', back: 'It will be declined again and wastes rate limit; surface the refusal or use a fallback path.' },
    { front: 'What is shadow mode?', back: 'Running the new system on real traffic without acting or showing output, to compare its decisions against the current process.' },
    { front: 'What is staged exposure?', back: 'Rolling out to internal users, then a small percentage, then wider, with rollback thresholds on error, refusal, guardrail-trigger and cost metrics.' },
    { front: 'Why can aggregate accuracy be misleading for automation decisions?', back: 'A high overall number can hide poor performance on a specific document type or field; validate per segment before automating.' },
    { front: 'Whose content policy applies to your app?', back: 'Anthropic\'s Usage Policy as the floor, plus your own product policy encoded in the system prompt and verified by evals.' },
  ],
  quiz: [
    {
      question:
        'A team exposes a customer-support agent that can read tickets, draft replies, issue refunds and delete user accounts. Support staff only ever need to read tickets and draft replies. Applying least-privilege principles, which change BEST reduces risk?',
      options: [
        'Add logging to the refund and delete tools so misuse can be audited later.',
        'Remove the refund and delete tools from the agent\'s configuration entirely.',
        'Keep all tools but add a confirmation prompt before refunds and deletions.',
        'Replace the agent with a larger model that follows instructions more reliably.',
      ],
      correct: [1],
      explanation:
        'Least privilege removes capabilities the role does not require. Logging and confirmations are detective or compensating controls, and model size is unrelated to authorization scope.',
    },
    {
      question:
        'A production service occasionally receives stop_reason "refusal" on benign security-tooling requests, and the code crashes reading content[0]. Which TWO changes are appropriate? (Select two)',
      options: [
        'Check stop_reason before reading content and surface or route refusals instead of crashing.',
        'Retry the identical request in a loop until it succeeds.',
        'Opt into server-side fallbacks so declined requests are re-run on a recommended model.',
        'Switch to the Batches API, which does not apply safety classifiers.',
      ],
      correct: [0, 2],
      explanation:
        'Branching on stop_reason and using fallbacks are the documented patterns. Retrying the same prompt is ineffective, and the Batches API still applies the same model behavior and does not support server-side fallbacks.',
    },
    {
      question: 'Which rollout plan for a new auto-approval capability is the safest?',
      options: [
        'Enable for all traffic with detailed monitoring and respond to incidents quickly.',
        'Run in shadow mode against human decisions, then stage exposure per segment where agreement meets a threshold, keeping other segments manual.',
        'Enable for all low-value claims immediately because the eval score was 97%.',
        'Enable for internal staff only and never expand.',
      ],
      correct: [1],
      explanation:
        'Shadow mode and per-segment staging reveal problems before harm and respect the fact that aggregate accuracy hides segment failures. Full exposure with monitoring is reactive, 97% overall may hide a weak segment, and never expanding delivers no value.',
    },
    {
      question: 'A guardrail classifier service goes down. What should the agent do by default?',
      options: [
        'Proceed without the check so users are not blocked.',
        'Block or escalate affected requests until the check is restored (fail safe).',
        'Switch to a larger model that is less likely to misbehave.',
        'Ask the user whether their request is safe.',
      ],
      correct: [1],
      explanation: 'Fail safe means a missing control defaults to the safe outcome. Proceeding removes a layer silently; model size and user self-attestation are not controls.',
    },
    {
      question: 'Which statement about stop_details is correct?',
      options: [
        'It is populated on every response and describes why generation stopped.',
        'It is populated only for refusal stop reasons and may include a category that can be null.',
        'It replaces stop_reason on current models.',
        'It contains the retry delay for rate-limited requests.',
      ],
      correct: [1],
      explanation: 'stop_details accompanies refusals only; branch on stop_reason, treat stop_details as informational.',
    },
    {
      question: 'Where should your product\'s own content policy be enforced?',
      options: [
        'Only in Anthropic\'s Usage Policy, which covers all applications.',
        'In the system prompt, verified by evals, and backed by input/output checks for the rules that must hold deterministically.',
        'In the tool descriptions only.',
        'In the user turn on each request.',
      ],
      correct: [1],
      explanation:
        'Anthropic\'s policy is the floor; your product policy must be encoded and tested, with deterministic checks for hard rules. Tool descriptions and the user turn are the wrong components for standing policy.',
    },
  ],
  statements: [
    { text: 'A single well-written system prompt is a sufficient guardrail for a production agent.', isTrue: false, explanation: 'Prompt policy is probabilistic; it must be layered with least-privilege tools, hooks, output checks and review.' },
    { text: 'Removing an unneeded tool is a stronger control than logging its use.', isTrue: true, explanation: 'Removal eliminates the attack surface; logging is detective only.' },
    { text: 'stop_details is populated for every stop reason.', isTrue: false, explanation: 'It is populated only for refusals.' },
    { text: 'Server-side fallbacks are available when using the Message Batches API.', isTrue: false, explanation: 'Fallbacks are rejected on Batches and unavailable on Bedrock, Vertex AI and Foundry; use SDK-side middleware there.' },
    { text: 'Shadow mode runs the new system on real traffic without letting it act or show output.', isTrue: true, explanation: 'This exposes distribution shift and segment-level weaknesses before any harm.' },
    { text: 'Authorization for a tool call should be derived from the authenticated session, not from model output.', isTrue: true, explanation: 'Model output can be influenced by anything in context; IAM belongs in code.' },
    { text: 'If a guardrail check fails to run, the safest default is to let the request proceed so users are not blocked.', isTrue: false, explanation: 'Fail safe means block or escalate when a control is unavailable.' },
    { text: 'A 97% aggregate accuracy is sufficient evidence to automate all segments of a task.', isTrue: false, explanation: 'Aggregates can mask poor performance on specific document types or fields; validate per segment.' },
  ],
  resources: [
    { label: 'Strengthen guardrails (Claude docs)', url: 'https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations' },
    { label: 'Refusals and fallback', url: 'https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback' },
    { label: 'Anthropic Usage Policy', url: 'https://www.anthropic.com/legal/aup' },
  ],
};
