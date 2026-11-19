import type { Concept } from '../../types';

export const escalationAndAmbiguityPatterns: Concept = {
  id: 'escalation-and-ambiguity-patterns',
  title: 'Escalation and Ambiguity Resolution Patterns',
  summary:
    'Decide when an agent should hand off to a human versus resolve autonomously: explicit customer requests, policy gaps and lack of progress are real triggers; sentiment and self-reported confidence are not. Resolve ambiguous data by asking, not guessing.',
  certs: ['ccar-f', 'ccar-p'],
  domains: ['ccar-f-5', 'ccar-f-1', 'ccar-p-5'],
  tags: ['escalation', 'human-in-the-loop', 'support-agent', 'ambiguity', 'prompting'],
  difficulty: 'intermediate',
  diagram: 'escalation-decision',
  sections: [
    {
      heading: 'What escalation is for',
      body: `A support agent with an \`escalate_to_human\` tool faces two opposite failure modes. **Over-escalation** sends straightforward cases (a standard damage replacement with photo evidence) to humans, wrecking first-contact resolution and wasting agent capacity. **Under-escalation** lets the agent improvise on cases that need a human decision (a policy exception, a request the policy never anticipated), producing confident but unauthorized outcomes.

The guide's target of 80%+ first-contact resolution only means something if the remaining cases are the *right* ones to hand off. Escalation is a decision with explicit criteria, not a vague "when it gets hard." Three triggers are reliable:

1. **The customer asks for a human.** Honor it immediately. Do not investigate first, do not try one more time to resolve; acknowledge and hand off.
2. **Policy gap or exception.** The policy is silent or ambiguous on this specific request, or resolving it would require an exception the agent is not authorized to grant. Complexity alone is not the test; a complex case fully covered by policy can be resolved autonomously.
3. **Inability to make meaningful progress.** Tools keep failing, the customer's account cannot be found after reasonable attempts, or the conversation is looping. Escalate with what was tried.

Each trigger is observable in the transcript or tool results. That is what makes them usable as criteria and testable in evals.`,
    },
    {
      heading: 'Unreliable proxies: sentiment and self-confidence',
      body: `Two tempting signals do not track case complexity and should not drive escalation on their own.

**Sentiment.** A furious customer with a simple, in-policy problem is best served by a fast resolution, not a queue. A calm customer may be asking for something the policy does not cover. Frustration is a cue to **acknowledge** and resolve quickly; it is not evidence that the case needs a human. The right behaviour: acknowledge the frustration, offer the in-capability resolution, and escalate only if the customer reiterates that they want a person.

**Self-reported confidence.** Asking the model to rate its confidence 1 to 10 and routing low scores to humans sounds principled, but LLM self-reports are poorly calibrated. In the classic failure, the agent is *already* wrongly confident on the hard cases (it attempts policy exceptions autonomously), so its score will not flag them. The exam's sample item makes exactly this point: the proportionate fix for miscalibrated escalation is **explicit criteria plus few-shot examples in the system prompt**, not a confidence threshold, a sentiment detector, or a separately trained classifier.

The distinction to carry into any scenario: escalate on observable facts about the case (what the customer said, what the policy says, what the tools returned), not on inferred emotional or epistemic state.`,
    },
    {
      heading: 'Writing escalation criteria the model can apply',
      body: `Put the criteria in the system prompt as explicit rules, then add few-shot examples that demonstrate the boundary from both sides. Models learn boundaries from contrasting examples far better than from adjectives like "complex."

\`\`\`text
## Escalation rules
Resolve autonomously when the request is covered by policy and all required
evidence is present (e.g. damage replacement with photo, refund within 30 days).
Escalate with escalate_to_human when ANY of:
- the customer asks for a human or a manager (do this immediately, no investigation)
- the policy does not address the specific request, or resolving it needs an exception
- you cannot make progress after two reasonable attempts (tool failures, no match)

## Examples
Customer: "The mug arrived cracked, photo attached, order 5512." -> RESOLVE (policy 4.2, evidence present)
Customer: "Your competitor sells this for 20% less, match it." -> ESCALATE (policy covers only own-site price changes)
Customer: "I don't want to talk to a bot, get me a person." -> ESCALATE immediately, acknowledge first
Customer: "This is ridiculous, I've waited a week!" + in-policy refund -> RESOLVE; acknowledge, offer refund, escalate only if they still ask for a person
\`\`\`

Pass structured context in the escalation itself: issue summary, case facts, what was attempted, and why the trigger fired. A human picking up a ticket that says "escalated: policy gap, competitor price match, customer offered 10% code and declined" can act at once. For rules with financial consequences (refunds above a threshold), enforce them with a programmatic hook rather than prose; prompt instructions are probabilistic, hooks are deterministic.`,
    },
    {
      heading: 'Ambiguity in data: ask, do not guess',
      body: `Escalation handles ambiguity in *authority*. A second kind of ambiguity lives in *data*, and it has a different answer: clarify with the customer.

The canonical case is \`get_customer\` returning multiple matches for "Jordan Lee." A heuristic (pick the most recent account, pick the one with an open order) feels helpful and is wrong often enough to cause misidentified accounts and refunds to the wrong person. The correct behaviour is to **ask for additional identifiers** (email on file, order number, last four digits of the phone) and only proceed once the match is unique. Instruct this explicitly in the system prompt, and consider making the tool return a structured \`multiple_matches\` result with a hint ("ask for email or order id") so the right move is obvious.

Other ambiguity-resolution patterns:

- **Multi-concern messages.** "I want to return the kettle and also you charged me twice" has two issues. Decompose, handle each, synthesize one reply. Do not pick the first and drop the second.
- **Underspecified requests.** "Cancel my order" with three open orders: ask which one.
- **Conflicting information.** The customer says the order was placed Tuesday; the record says Thursday. Surface the discrepancy rather than silently trusting one side.

Clarifying costs one turn. Guessing wrong costs a refund, a trust incident and often a manual correction.`,
    },
  ],
  examples: [
    {
      title: 'Mistake: confidence-threshold routing',
      description: `An agent sits at 55% first-contact resolution. Logs show it escalates easy damage replacements but attempts policy exceptions on its own. The team adds "rate your confidence 1-10" and routes anything under 7 to humans. Resolution does not improve: the agent reports 9/10 on the exceptions it should not be handling and 5/10 on routine cases where the customer's wording is unusual.

**Fix:** remove the confidence gate. Add explicit escalation rules and six contrasting few-shot examples to the system prompt, then re-run the eval set. Resolution climbs because the boundary is now stated, not guessed.`,
      takeaway: 'Self-reported confidence is poorly calibrated; state the escalation boundary and show it with examples.',
    },
    {
      title: 'Honoring an explicit request for a human',
      description: `A customer opens with "I've already been through this twice with your bot. Get me a human." The agent is tempted to run \`get_customer\` and \`lookup_order\` first "so the human has context." That delay reads as ignoring the request.

Correct behaviour: acknowledge, call \`escalate_to_human\` at once with whatever is known (the message text, any identifiers the customer volunteered), and tell the customer what will happen next. Investigation, if any, can be done by the system after the hand-off, not as a precondition for it.`,
      language: 'python',
      code: `import anthropic
client = anthropic.Anthropic()

SYSTEM = """You are a support agent. If the customer asks for a human or a manager,
call escalate_to_human IMMEDIATELY with reason="customer_request" and a one-line
summary. Do not call any other tool first. Acknowledge the request in your reply."""

tools = [{
  "name": "escalate_to_human",
  "description": "Hand the conversation to a human agent. Use immediately when the customer asks for a person, when policy does not cover the request, or when no progress is possible.",
  "input_schema": {"type": "object", "properties": {
      "reason": {"type": "string", "enum": ["customer_request", "policy_gap", "no_progress"]},
      "summary": {"type": "string"},
      "attempted": {"type": "array", "items": {"type": "string"}}},
    "required": ["reason", "summary"]},
}]

resp = client.messages.create(model="claude-opus-5-5", max_tokens=512, system=SYSTEM,
    tools=tools, messages=[{"role": "user", "content": "Get me a human, now."}])
print([b for b in resp.content if b.type == "tool_use"])`,
      takeaway: 'An explicit request for a human is honored first; context-gathering is not a precondition.',
    },
    {
      title: 'Policy gap: competitor price matching',
      description: `The policy document covers price adjustments when the store's own price drops within 14 days. A customer asks the agent to match a competitor's lower price. The agent, reasoning that "price adjustment" is close enough, applies a 20% credit.

This is a policy gap, not a covered case: the policy is silent on competitor pricing. The right action is to escalate with reason \`policy_gap\`, a summary of the request, and the relevant policy section, so a human can decide. Add this exact contrast to the few-shot examples: own-site adjustment resolves, competitor match escalates.`,
      takeaway: 'Escalate when policy is silent or ambiguous on the specific request, even if a nearby rule looks similar.',
    },
    {
      title: 'Multiple customer matches',
      description: `\`get_customer(name="Jordan Lee")\` returns three accounts. The agent picks the one with the most recent order and processes a refund to it. It was the wrong Jordan Lee.

**Fix** in two places. The tool returns a structured result: \`{"status": "multiple_matches", "count": 3, "disambiguate_with": ["email", "order_id", "phone_last4"]}\` with no account data. The system prompt says: when a lookup returns multiple matches, ask the customer for one of the suggested identifiers and do not proceed until the match is unique.`,
      language: 'json',
      code: `{
  "status": "multiple_matches",
  "count": 3,
  "disambiguate_with": ["email", "order_id", "phone_last4"],
  "message": "Ask the customer for one of these identifiers before continuing."
}`,
      takeaway: 'Ambiguous identity is resolved by asking for more identifiers, never by heuristic selection.',
    },
  ],
  keyPoints: [
    'Reliable escalation triggers: explicit customer request for a human, policy gaps or exceptions, and inability to make meaningful progress.',
    'Honor an explicit request for a human immediately, without investigating first.',
    'Frustration is a cue to acknowledge and resolve quickly when the issue is within capability; escalate only if the customer reiterates the preference.',
    'Complexity alone is not an escalation trigger; a complex case fully covered by policy can be resolved autonomously.',
    'Sentiment analysis and self-reported confidence scores are poorly correlated with actual case complexity and should not gate escalation.',
    'The proportionate fix for miscalibrated escalation is explicit criteria plus few-shot examples in the system prompt, before classifiers or infrastructure.',
    'When a lookup returns multiple matches, ask for additional identifiers rather than selecting heuristically.',
    'Rules with financial consequences belong in programmatic hooks, not only in prose instructions.',
  ],
  flashcards: [
    { front: 'Name the three reliable escalation triggers.', back: 'Customer asks for a human; policy gap or exception; inability to make meaningful progress.' },
    { front: 'A customer demands a human in their first message. What should the agent do?', back: 'Acknowledge and call escalate_to_human immediately, without first running lookups or attempting resolution.' },
    { front: 'A frustrated customer has a clearly in-policy refund request. Escalate?', back: 'No. Acknowledge the frustration, offer the resolution, and escalate only if they reiterate that they want a person.' },
    { front: 'Why is sentiment-based escalation unreliable?', back: 'Sentiment does not correlate with case complexity; angry customers often have simple problems and calm ones may have policy gaps.' },
    { front: 'Why is a self-reported confidence threshold a poor escalation gate?', back: 'LLM self-reported confidence is poorly calibrated; the agent is often most confident on exactly the exceptions it should escalate.' },
    { front: 'The agent escalates easy cases and attempts hard ones. Best first fix?', back: 'Add explicit escalation criteria with few-shot examples showing when to escalate versus resolve.' },
    { front: 'Policy covers own-site price drops; a customer asks for competitor price matching. What is this?', back: 'A policy gap. Escalate rather than stretching the nearby rule.' },
    { front: 'get_customer returns three matches for a name. What next?', back: 'Ask the customer for additional identifiers (email, order id, phone) and proceed only once the match is unique.' },
    { front: 'What should an escalation payload contain?', back: 'Reason/trigger, issue summary, case facts, what was attempted, and relevant policy references so the human can act immediately.' },
    { front: 'Where should a "no refunds above $500 without approval" rule be enforced?', back: 'In a programmatic hook that blocks the tool call and routes to escalation; prompt text alone is probabilistic.' },
  ],
  quiz: [
    {
      question:
        'An agent achieves 55% first-contact resolution. Logs show it escalates standard damage replacements with photo evidence while autonomously attempting cases that need policy exceptions. What is the MOST effective way to improve escalation calibration?',
      options: [
        'Add explicit escalation criteria to the system prompt with few-shot examples showing when to escalate versus resolve.',
        'Have the agent self-report a 1-10 confidence score and route low scores to humans.',
        'Deploy a separate classifier trained on historical tickets to predict escalation needs.',
        'Add sentiment analysis and escalate when negative sentiment crosses a threshold.',
      ],
      correct: [0],
      explanation:
        'The root cause is an unclear decision boundary, which explicit criteria and examples fix directly. Self-reported confidence is poorly calibrated (the agent is already wrongly confident on hard cases); a classifier is over-engineered before prompt fixes are tried; sentiment does not track complexity.',
    },
    {
      question:
        'A customer writes: "I\'ve explained this twice already. I want a real person." The issue appears to be a routine refund. What should the agent do?',
      options: [
        'Run get_customer and lookup_order first so the human has full context, then escalate.',
        'Acknowledge the request and call escalate_to_human immediately.',
        'Offer to resolve the refund now and escalate only if the customer declines.',
        'Explain that the issue is simple and ask the customer to let the agent try once more.',
      ],
      correct: [1],
      explanation:
        'An explicit request for a human is honored immediately. Investigating first delays and ignores the request; offering to resolve is the right move for frustration without an explicit request, not for an explicit one; arguing with the customer is worse still.',
    },
    {
      question:
        'A customer is angry about a week-long delay and asks for a refund that is clearly within policy. They have not asked for a human. What is the BEST response pattern?',
      options: [
        'Escalate immediately because negative sentiment indicates a difficult case.',
        'Acknowledge the frustration, process the refund, and escalate only if the customer then asks for a person.',
        'Ask the customer to calm down before proceeding.',
        'Offer a discount code instead of the refund to de-escalate.',
      ],
      correct: [1],
      explanation:
        'The issue is within capability, so the fastest good outcome is to resolve it while acknowledging the feeling. Sentiment is not a complexity signal; telling customers to calm down or substituting a different remedy are poor service.',
    },
    {
      question:
        'Which TWO situations are appropriate escalation triggers? (Select two)',
      options: [
        'The policy document does not address the customer\'s specific request.',
        'The customer uses strongly negative language.',
        'After two reasonable attempts the agent still cannot locate the customer\'s account.',
        'The case involves three line items instead of one.',
      ],
      correct: [0, 2],
      explanation:
        'Policy gaps and inability to make progress are reliable triggers. Negative language is sentiment, not complexity, and a multi-item order is only complexity, which policy may fully cover.',
    },
    {
      question:
        'get_customer returns three accounts matching "Jordan Lee". Which behaviour should the system prompt require?',
      options: [
        'Select the account with the most recent order, since that is most likely the caller.',
        'Select the account whose email domain matches the chat login.',
        'Ask the customer for an additional identifier such as email or order id before proceeding.',
        'Escalate to a human immediately because identity is ambiguous.',
      ],
      correct: [2],
      explanation:
        'Data ambiguity is resolved by clarifying with the customer; heuristics cause misidentified accounts. Escalating is unnecessary when one question resolves it, and wastes human capacity.',
    },
    {
      question:
        'A business rule says refunds over $500 require human approval. Which implementation gives the strongest guarantee?',
      options: [
        'State the rule prominently in the system prompt.',
        'Add few-shot examples of the agent escalating large refunds.',
        'A programmatic hook that blocks process_refund above $500 and redirects to the escalation workflow.',
        'Log all refunds over $500 for next-day review.',
      ],
      correct: [2],
      explanation:
        'A hook enforces deterministically. Prompt text and examples rely on probabilistic compliance, and logging detects after the money has moved rather than preventing it.',
    },
  ],
  statements: [
    { text: 'Case complexity by itself is a sufficient reason to escalate.', isTrue: false, explanation: 'Complex cases covered by policy can be resolved autonomously; the trigger is policy gaps, explicit requests, or lack of progress.' },
    { text: 'An agent should gather account context before honoring a customer\'s explicit request for a human.', isTrue: false, explanation: 'Explicit requests are honored immediately; investigation is not a precondition.' },
    { text: 'LLM self-reported confidence scores are a poorly calibrated proxy for whether a case needs escalation.', isTrue: true, explanation: 'The model tends to be confident on exactly the cases it mishandles, so a threshold does not catch them.' },
    { text: 'When the policy is silent on a specific request, the agent should apply the closest similar rule.', isTrue: false, explanation: 'Silence or ambiguity is a policy gap and should be escalated for a human decision.' },
    { text: 'When a lookup returns multiple customer matches, asking for another identifier is preferred to heuristic selection.', isTrue: true, explanation: 'Heuristics cause misidentified accounts and incorrect refunds; one clarifying question resolves it.' },
    { text: 'Few-shot examples that contrast escalate and resolve cases help the model learn the boundary.', isTrue: true, explanation: 'Contrasting examples communicate boundaries better than adjectives like "complex" or "difficult."' },
    { text: 'Acknowledging a customer\'s frustration and offering to resolve the issue is appropriate when the issue is within the agent\'s capability.', isTrue: true, explanation: 'Escalate only if the customer then reiterates a preference for a human.' },
  ],
  resources: [
    { label: 'Building effective agents (Anthropic engineering)', url: 'https://www.anthropic.com/engineering/building-effective-agents' },
    { label: 'Tool use overview (Claude docs)', url: 'https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview' },
    { label: 'Hooks (Claude Agent SDK docs)', url: 'https://platform.claude.com/docs/en/agent-sdk/hooks' },
  ],
};
