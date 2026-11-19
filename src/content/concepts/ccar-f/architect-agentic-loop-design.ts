import type { Concept } from '../../types';

export const architectAgenticLoopDesign: Concept = {
  id: 'architect-agentic-loop-design',
  title: 'Designing the Agentic Loop',
  summary:
    'The agentic loop sends a request, inspects stop_reason, runs any requested tools, appends the results and repeats until the model says it is done. Getting the control flow and the stopping condition right is the foundation of every agent.',
  certs: ['ccar-f', 'ccdv-f', 'ccar-p'],
  domains: ['ccar-f-1', 'ccdv-f-1', 'ccar-p-1'],
  tags: ['agents', 'tool-use', 'stop_reason', 'agent-sdk', 'orchestration'],
  difficulty: 'foundations',
  diagram: 'agentic-loop',
  sections: [
    {
      heading: 'The lifecycle of one iteration',
      body: `An agent is a loop around the Messages API. Each iteration does four things:

1. **Send** the conversation so far (system prompt, tool definitions, messages) to Claude.
2. **Inspect \`stop_reason\`** on the response. \`tool_use\` means Claude wants you to run one or more tools. \`end_turn\` means it has finished and is talking to the user.
3. **Execute** every \`tool_use\` block in the response. Each has an \`id\`, a \`name\` and an \`input\` object that matches the tool's JSON schema.
4. **Return** the results as \`tool_result\` blocks in a new \`user\` message, each carrying the matching \`tool_use_id\`, then go back to step 1.

The model never executes anything itself. It emits a request; your harness decides whether and how to run it. That split is what lets you gate, log, or block individual calls.

In the support-agent scenario, one iteration might be: the user says "refund order #12345" → Claude returns \`tool_use\` for \`get_customer\` → you call the MCP tool → you append the customer record as a \`tool_result\` → Claude now has enough to call \`lookup_order\`, and so on until it reaches \`end_turn\` with a reply.`,
    },
    {
      heading: 'Why tool results go back into the conversation',
      body: `Claude has no memory between API calls. The only way it can reason about what a tool returned is if that result is in the \`messages\` array on the next request. Appending results is therefore not optional bookkeeping; it is how new information enters the model's reasoning.

Rules that follow from this:

- The assistant message containing the \`tool_use\` block(s) must be appended **unchanged**, followed by a user message containing one \`tool_result\` per \`tool_use_id\`. A missing or mismatched id is a 400.
- If Claude requested several tools in one response (parallel tool use), run them all and return **all** results in a single user message.
- Tool results are plain content from the model's point of view. If a tool fails, say so with \`is_error: true\` and a useful message so Claude can adapt instead of guessing.
- Because the whole history is re-sent each turn, long loops grow the context. Prompt caching with a breakpoint on the newest message and, in long runs, context editing or compaction keep this affordable.`,
    },
    {
      heading: 'Model-driven decisions versus decision trees',
      body: `The defining feature of an agent is that **Claude chooses the next action** based on what it has seen so far. A workflow, by contrast, has the sequence of steps fixed in code: call A, then B, then C.

| | Agentic loop | Pre-configured sequence |
|---|---|---|
| Who decides the next step | The model, from context | Your code |
| Handles unexpected branches | Yes, by reasoning | Only if coded in advance |
| Predictability and cost | Lower; varies per run | High; fixed |
| Best for | High-ambiguity requests (returns, billing disputes) | Well-understood, repeatable pipelines |

Architects are expected to pick deliberately. A refund request that may involve identity checks, partial refunds and escalation is agentic. A nightly job that extracts fields from invoices in a fixed order is a workflow, even if it calls Claude at each step. Mixing the two is common: an agent inside one stage of a workflow, or hooks that enforce a fixed prerequisite inside an otherwise free loop.`,
    },
    {
      heading: 'Stopping conditions and anti-patterns',
      body: `The correct termination signal is \`stop_reason\`. Loop while it is \`tool_use\`; stop when it is \`end_turn\`. Also handle \`max_tokens\` (output was cut off; raise the limit or continue), \`pause_turn\` (a server tool paused a long turn; resend to continue), and \`refusal\` (do not run that turn's tools).

Anti-patterns the exam targets:

- **Parsing natural language for completion.** Searching the text for "done" or "I have finished" is brittle; the model may phrase it differently or say "done" mid-task.
- **Treating the presence of text as completion.** Claude frequently writes a sentence of explanation *and* emits a tool call in the same response. Text does not mean the turn is over.
- **Iteration caps as the primary stop.** A hard cap (for example 10 iterations) is a reasonable **safety net** against runaway loops, but if your agent routinely ends because it hit the cap you have a design problem, and the user gets a half-finished answer with no explanation.
- **Ignoring parallel tool calls.** Handling only \`content[0]\` drops the second tool request and the API rejects the next turn because a \`tool_use_id\` has no result.`,
    },
  ],
  examples: [
    {
      title: 'A minimal, correct loop for the support agent',
      description:
        'The loop continues while Claude requests tools, appends every result, and stops only when stop_reason is end_turn. The iteration cap is a safety net that raises an error rather than silently returning.',
      language: 'python',
      code: `messages = [{"role": "user", "content": user_message}]
for _ in range(25):                      # safety net, not the stop signal
    resp = client.messages.create(
        model="claude-opus-5-5", max_tokens=4096,
        system=SYSTEM, tools=TOOLS, messages=messages,
    )
    messages.append({"role": "assistant", "content": resp.content})
    if resp.stop_reason == "end_turn":
        break
    if resp.stop_reason != "tool_use":
        raise RuntimeError(f"unexpected stop_reason {resp.stop_reason}")
    results = []
    for block in resp.content:
        if block.type == "tool_use":
            out, err = run_mcp_tool(block.name, block.input)
            results.append({"type": "tool_result", "tool_use_id": block.id,
                            "content": out, "is_error": err})
    messages.append({"role": "user", "content": results})
else:
    raise RuntimeError("agent did not finish within the iteration budget")`,
      takeaway: 'Loop on stop_reason == "tool_use", stop on "end_turn", and return one tool_result per tool_use_id.',
    },
    {
      title: 'The mistake: checking for text to decide the loop is over',
      description:
        'A team wrote `if any(b.type == "text" for b in resp.content): return`. Claude often says "Let me look up that order" and emits a tool_use block in the same response, so the agent returned the sentence to the customer and never ran the tool. First-contact resolution collapsed. The fix was to key the loop on stop_reason only.',
      language: 'python',
      code: `# Before: text present => "done" (wrong)
if any(b.type == "text" for b in resp.content):
    return render(resp)

# After: the API tells you whether the turn is over
if resp.stop_reason == "end_turn":
    return render(resp)
elif resp.stop_reason == "tool_use":
    execute_and_append(resp)`,
      takeaway: 'Explanatory text and a tool call routinely arrive together; only stop_reason is authoritative.',
    },
    {
      title: 'Agent or workflow? Two requests from the same product',
      description:
        '"Why was I charged twice and can I get one charge refunded?" needs identity verification, order lookup, a judgment about whether the duplicate is real, and possibly escalation. The order of those steps depends on what each one reveals, so it is agentic. "Every night, pull yesterday\'s tickets and classify them into five categories" has a fixed shape and should be a workflow that calls Claude once per ticket with a structured-output schema. Choosing an agent for the second case adds cost and variance with no benefit.',
      language: 'text',
      code: `Request shape                      -> Pattern
Unknown number/order of steps      -> Agentic loop (model decides)
Fixed steps, known inputs/outputs  -> Workflow (code decides)
Fixed skeleton, one open-ended     -> Workflow with an agent inside one stage
  stage (e.g. "investigate")`,
      takeaway: 'Use the loop when the next step depends on the last result; use a workflow when it does not.',
    },
  ],
  keyPoints: [
    'Each iteration: send messages → inspect stop_reason → run tool_use blocks → append tool_result blocks → repeat.',
    'Continue while stop_reason is "tool_use"; terminate when it is "end_turn". Handle max_tokens, pause_turn and refusal explicitly.',
    'Tool results must be appended to the conversation or the model cannot reason about them; Claude is stateless between calls.',
    'Return one tool_result per tool_use_id, all in a single user message, even for parallel calls.',
    'Agentic loops let the model choose the next action from context; workflows fix the sequence in code. Pick based on how predictable the steps are.',
    'Never detect completion by parsing text or by the presence of assistant text; a sentence and a tool call often arrive together.',
    'An iteration cap is a safety net, not the stopping mechanism. If runs routinely hit it, redesign.',
  ],
  flashcards: [
    { front: 'Which stop_reason tells the loop to execute tools and continue?', back: '"tool_use". The response contains one or more tool_use blocks to run.' },
    { front: 'Which stop_reason ends the agentic loop?', back: '"end_turn": Claude has finished and is addressing the user.' },
    { front: 'How are tool results returned to Claude?', back: 'As tool_result blocks in a new user message, each with the tool_use_id of the request it answers.' },
    { front: 'Why must tool results be appended to the conversation history?', back: 'Claude has no memory between API calls; the messages array is the only way new information reaches its reasoning.' },
    { front: 'What distinguishes an agentic loop from a pre-configured tool sequence?', back: 'In the loop the model decides the next tool from context; in a sequence the order is fixed in code.' },
    { front: 'Name three loop-termination anti-patterns.', back: 'Parsing text for "done", treating any assistant text as completion, and using an iteration cap as the primary stopping mechanism.' },
    { front: 'What should a hard iteration cap be used for?', back: 'A safety net against runaway loops that raises or logs an error, never the normal way a run ends.' },
    { front: 'Claude returns two tool_use blocks in one response. What do you do?', back: 'Run both and return both tool_result blocks in one user message before the next request.' },
    { front: 'What does stop_reason "pause_turn" mean?', back: 'A server-side tool paused a long-running turn; resend the conversation to let Claude continue.' },
    { front: 'How should a tool failure be communicated inside the loop?', back: 'Return a tool_result with is_error: true and an informative message so Claude can recover.' },
  ],
  quiz: [
    {
      question:
        'A support agent built on the Agent SDK sometimes replies "Let me check that order for you" and then stops without ever calling lookup_order. Logs show the harness returns to the user whenever the response contains a text block. What is the MOST likely cause?',
      options: [
        'The model needs a higher effort setting to complete multi-step tasks.',
        'The loop is using the presence of assistant text as its completion signal instead of stop_reason.',
        'lookup_order is missing from the tools array.',
        'The tool_result blocks are being sent in the assistant role.',
      ],
      correct: [1],
      explanation:
        'Claude often emits a sentence and a tool_use block in the same response. Keying completion on text ends the loop prematurely. Effort does not change control flow; a missing tool would prevent the tool_use block being emitted at all rather than cause an early stop; sending results in the wrong role produces API errors, not silent stops.',
    },
    {
      question:
        'Your agent loop has `for i in range(8)` and returns whatever Claude last said when the loop ends. 30% of refund cases end at iteration 8 with an incomplete answer. What is the best change?',
      options: [
        'Raise the cap to 50 so more cases finish.',
        'Key termination on stop_reason == "end_turn", keep a generous cap only as a safety net, and surface a clear error when it is hit.',
        'Ask the model in the system prompt to finish within eight steps.',
        'Switch to a faster model so each iteration is cheaper.',
      ],
      correct: [1],
      explanation:
        'The cap is being used as the stopping mechanism, so users get truncated work with no signal. Termination must come from stop_reason; the cap should be a guard that fails loudly. Raising the cap or asking the model to hurry treats the symptom, and model speed is unrelated to whether the loop knows when it is done.',
    },
    {
      question:
        'Which TWO statements about handling a response with stop_reason "tool_use" are correct? (Select two)',
      options: [
        'Append the assistant response unchanged, then add a user message with the tool results.',
        'Only the first tool_use block needs a result; later ones are optional.',
        'Every tool_use block must receive a tool_result with the matching tool_use_id.',
        'Tool results should replace the assistant message rather than follow it.',
      ],
      correct: [0, 2],
      explanation:
        'The assistant turn (including its tool_use blocks) stays in history and is followed by a user message holding one tool_result per tool_use_id. Skipping a result or replacing the assistant message breaks the conversation structure and the API rejects the next call.',
    },
    {
      question:
        'A team is deciding how to build a nightly job that classifies each new support ticket into one of five categories and writes the result to a database. Which design best fits?',
      options: [
        'An agentic loop with tool_choice auto and all backend tools available, so the model can explore each ticket.',
        'A workflow that calls Claude once per ticket with a structured-output schema and writes the result in code.',
        'A coordinator agent that spawns one subagent per ticket.',
        'An agentic loop limited to ten iterations per ticket.',
      ],
      correct: [1],
      explanation:
        'The steps are fixed and known in advance, so a workflow is cheaper, more predictable and easier to test. An agentic loop or multi-agent system adds variance and cost without any decision for the model to make. Capping the loop does not change the fact that there is nothing to loop over.',
    },
    {
      question:
        'During a long research run, Claude returns stop_reason "max_tokens" while emitting a tool_use block. What should the harness do?',
      options: [
        'Execute the tool with the partial input since most of it is present.',
        'Treat it as end_turn and return the output to the user.',
        'Do not execute the truncated tool call; retry with a higher max_tokens (or continue the turn) so the call completes.',
        'Remove the tool from the tools array and retry.',
      ],
      correct: [2],
      explanation:
        'A truncated tool_use input is unreliable; running it risks a bad action. max_tokens is not completion, so returning to the user is wrong. Removing the tool solves nothing. The right move is to let the model finish the call with more output room.',
    },
  ],
  statements: [
    { text: 'The agentic loop should continue while stop_reason is "tool_use" and stop when it is "end_turn".', isTrue: true, explanation: 'stop_reason is the authoritative signal for whether Claude wants more tool execution or has finished.' },
    { text: 'If a response contains any text block, the model has finished its turn.', isTrue: false, explanation: 'Claude commonly emits explanatory text alongside tool_use blocks in the same response. Only stop_reason indicates completion.' },
    { text: 'Tool results are returned to Claude as tool_result blocks inside a user-role message.', isTrue: true, explanation: 'Each tool_result carries the tool_use_id it answers and is sent in the next user message.' },
    { text: 'A fixed iteration cap is the recommended primary mechanism for ending an agent loop.', isTrue: false, explanation: 'A cap is a safety net. Routinely ending on the cap means the agent returns unfinished work; termination should come from stop_reason.' },
    { text: 'Claude keeps the results of previous tool calls in memory between API requests, so they need not be re-sent.', isTrue: false, explanation: 'The API is stateless. The full conversation, including tool results, must be included on every request.' },
    { text: 'When Claude requests several tools in one response, all results should be returned together in a single user message.', isTrue: true, explanation: 'Every tool_use block needs a matching tool_result before the next request; sending them together is the correct structure.' },
    { text: 'In an agentic loop the model decides which tool to call next; in a workflow the order is fixed in code.', isTrue: true, explanation: 'This is the core distinction architects use to choose between the two patterns.' },
  ],
  resources: [
    { label: 'Tool use overview (Claude docs)', url: 'https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview' },
    { label: 'Building effective agents (Anthropic)', url: 'https://www.anthropic.com/research/building-effective-agents' },
    { label: 'Claude Agent SDK overview', url: 'https://platform.claude.com/docs/en/agent-sdk/overview' },
  ],
};
