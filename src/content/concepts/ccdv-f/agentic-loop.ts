import type { Concept } from '../../types';

export const agenticLoop: Concept = {
  id: 'agentic-loop',
  title: 'The Agentic Loop',
  summary:
    'The core cycle behind every Claude agent: send a request, inspect stop_reason, execute requested tools, return tool_result blocks, and repeat until the model ends its turn.',
  certs: ['ccdv-f', 'ccar-f'],
  domains: ['ccdv-f-1', 'ccdv-f-2', 'ccar-f-1'],
  tags: ['agents', 'tool-use', 'stop_reason', 'api'],
  difficulty: 'foundations',
  diagram: 'agentic-loop',
  sections: [
    {
      heading: 'One iteration of the loop',
      body: `An agent is a loop around the Messages API. Each iteration does the same five things:

1. **Send** the full conversation (\`messages\`) plus the \`tools\` list.
2. **Inspect** \`response.stop_reason\`.
3. If it is \`tool_use\`, **execute** every \`tool_use\` block in \`response.content\` with your own code.
4. **Append** the assistant message (the whole \`response.content\`, including the \`tool_use\` blocks) and then a \`user\` message containing one \`tool_result\` block per call, each carrying the matching \`tool_use_id\`.
5. **Repeat** from step 1.

The model never executes anything. It emits a request to call a tool; your harness runs it and reports back. Because the API is stateless, the only memory the model has of earlier iterations is what you resend in \`messages\`. Dropping the assistant turn that contained the \`tool_use\` block, or sending a \`tool_result\` with the wrong id, produces a 400 error.

If Claude requests several tools in one response, run them all (in parallel if they are independent) and return **all** results in a single \`user\` message. Returning them one at a time breaks the pairing the API expects.`,
    },
    {
      heading: 'Stop reasons drive control flow',
      body: `\`stop_reason\` is the only reliable signal for what to do next.

| stop_reason | Meaning | What your loop does |
|---|---|---|
| \`tool_use\` | Claude wants one or more tools run | Execute them, append results, call again |
| \`end_turn\` | Claude has finished | Exit the loop; the last \`text\` block is the answer |
| \`max_tokens\` | Output was cut off by \`max_tokens\` | Do not run truncated tool calls; retry with a higher limit or ask for a shorter output |
| \`pause_turn\` | A server-side tool loop (web search, code execution) hit its iteration limit | Append the assistant content and call again with no new user message; the server resumes |
| \`refusal\` | Safety refusal; \`stop_details\` has more | Stop; never execute tools from that turn |

\`max_tokens\` is dangerous in agents because a truncated \`tool_use\` input often still parses as valid, incomplete JSON. Check the stop reason **before** executing tools. \`pause_turn\` is not an error: it is the server handing control back so your request does not run indefinitely. Resend the conversation as-is; do not add a "continue" message.`,
    },
    {
      heading: 'Termination anti-patterns',
      body: `The exam explicitly tests the wrong ways to end a loop.

- **Parsing natural language for termination.** Looking for "I'm done" or "Task complete" in the text is brittle; the model may phrase it differently or say it mid-task. Use \`stop_reason == "end_turn"\`.
- **Treating text content as completion.** Claude often writes text *and* requests a tool in the same response ("Let me check the file..." followed by a \`tool_use\` block). The presence of text means nothing; the absence of \`tool_use\` blocks, signalled by \`end_turn\`, does.
- **Iteration caps as the primary stop.** A hard cap like "stop after 10 turns" is a safety net against runaway cost, not a completion signal. If the cap fires, the task is unfinished and should be reported as such, not returned as a result.
- **Ignoring \`pause_turn\`.** Treating it as completion returns a half-finished answer.

The correct design: loop on \`tool_use\`, exit on \`end_turn\`, handle \`max_tokens\` and \`pause_turn\` explicitly, and keep a generous iteration or cost budget as a secondary guard that surfaces an error when hit.`,
    },
    {
      heading: 'Model-driven decisions vs decision trees',
      body: `What makes the loop *agentic* is that the model, not your code, decides which tool to call next based on the accumulated results. A loop that always calls \`get_customer\` then \`get_orders\` then \`draft_reply\` in a fixed order is a workflow wearing an agent's clothes; it would be simpler and cheaper written as three direct calls.

That does not mean every decision belongs to the model. Deterministic constraints (a refund tool that refuses to run until identity is verified, a cap on refund amount) live in the harness as hooks or checks around tool execution. The model proposes; the harness disposes.

Two practical refinements for production loops:

- Put a **cache breakpoint** on the newest message each iteration so the growing history is read from cache.
- **Prune or compact** old tool results when the loop runs long, either with context editing or with compaction, so the window does not fill with stale data.

The SDK tool runner (\`client.beta.messages.tool_runner\` / \`toolRunner\`) implements exactly this loop, including \`pause_turn\` resumption and a \`max_iterations\` guard, so you only write the manual version when you need control the runner does not expose.`,
    },
  ],
  examples: [
    {
      title: 'A minimal correct loop',
      description:
        'The loop exits only on end_turn, handles pause_turn by resending, refuses to run tools after max_tokens, and returns every tool result in one user message.',
      language: 'python',
      code: `messages = [{"role": "user", "content": task}]
while True:
    r = client.messages.create(model="claude-opus-5-5", max_tokens=8192,
                               tools=tools, messages=messages)
    if r.stop_reason == "end_turn":
        break
    if r.stop_reason == "pause_turn":
        messages.append({"role": "assistant", "content": r.content}); continue
    if r.stop_reason in ("max_tokens", "refusal"):
        raise RuntimeError(f"stopped early: {r.stop_reason}")
    messages.append({"role": "assistant", "content": r.content})
    results = [{"type": "tool_result", "tool_use_id": b.id,
                "content": run_tool(b.name, b.input)}
               for b in r.content if b.type == "tool_use"]
    messages.append({"role": "user", "content": results})
final = next(b.text for b in r.content if b.type == "text")`,
      takeaway: 'Branch on stop_reason, never on the words in the text.',
    },
    {
      title: 'The mistake: text as a completion signal',
      description:
        'A team\'s loop checked `if any(b.type == "text" for b in r.content): break`. It exited after the first iteration whenever Claude narrated its plan ("I will start by listing the files") before the tool_use block. The fix was to branch on stop_reason instead; text and tool_use blocks routinely appear together.',
      language: 'python',
      code: `# Wrong: exits while Claude is still working
if any(b.type == "text" for b in r.content):
    break

# Right
if r.stop_reason == "end_turn":
    break`,
      takeaway: 'Claude can explain and act in the same turn; only stop_reason tells you it is finished.',
    },
    {
      title: 'The mistake: iteration cap as the result',
      description:
        'An agent had `for _ in range(10)` as its loop and returned whatever text was present when the loop ended. On long tasks it quietly returned half-finished work with no indication anything was wrong. The fix kept the cap as a safety guard but raised an explicit error (or returned a structured "incomplete" status) when it fired.',
      language: 'typescript',
      code: `for (let i = 0; i < MAX_ITER; i++) {
  const r = await client.messages.create({ model, max_tokens: 8192, tools, messages });
  if (r.stop_reason === "end_turn") return finalText(r);
  // ... handle tool_use / pause_turn ...
}
throw new Error(\`agent exceeded \${MAX_ITER} iterations without finishing\`);`,
      takeaway: 'A cap protects your budget; it is not a completion signal and must not masquerade as one.',
    },
  ],
  keyPoints: [
    'Loop: send messages + tools → read stop_reason → run tool_use blocks → append assistant content and tool_result blocks → repeat.',
    'Continue on stop_reason "tool_use"; exit on "end_turn". These are the only completion signals.',
    'Each tool_result must carry the matching tool_use_id; all results from one response go back in a single user message.',
    'Never execute tools from a response with stop_reason "max_tokens" or "refusal"; inputs may be truncated.',
    'On "pause_turn", append the assistant content and call again with no new user message; the server resumes.',
    'Anti-patterns: parsing text for "done", treating text as completion, using an iteration cap as the primary stop.',
    'The model decides the next tool; the harness enforces deterministic rules around execution.',
  ],
  flashcards: [
    { front: 'Which stop_reason means "run the requested tools and call again"?', back: 'tool_use' },
    { front: 'Which stop_reason terminates a correctly written agent loop?', back: 'end_turn' },
    { front: 'What must each tool_result block contain?', back: 'type "tool_result", the tool_use_id from the matching tool_use block, and content (optionally is_error: true).' },
    { front: 'Claude requests three tools in one response. How many user messages do you send back?', back: 'One, containing all three tool_result blocks.' },
    { front: 'What does stop_reason "pause_turn" mean and how do you handle it?', back: 'A server-side tool loop hit its iteration limit. Append the assistant content and re-send; do not add a "continue" message.' },
    { front: 'Why is stop_reason "max_tokens" dangerous in an agent loop?', back: 'A truncated tool_use input may still parse as valid JSON; executing it acts on incomplete data. Check stop_reason before running tools.' },
    { front: 'Name three loop-termination anti-patterns.', back: 'Parsing natural language for completion phrases, treating the presence of text as completion, and using an iteration cap as the primary stopping mechanism.' },
    { front: 'What is the correct role of an iteration cap?', back: 'A safety net against runaway cost that raises an error or returns an "incomplete" status when hit, never a success path.' },
    { front: 'Why must you append the full assistant content, not just the text, before sending tool results?', back: 'The tool_result blocks must pair with tool_use blocks in the preceding assistant turn; omitting them causes a 400.' },
    { front: 'Which SDK helper implements the loop for you?', back: 'client.beta.messages.tool_runner (Python) / toolRunner (TypeScript), with max_iterations and automatic pause_turn resumption.' },
  ],
  quiz: [
    {
      question:
        'An agent loop sometimes returns an answer while the task is clearly unfinished. Inspection shows it exits whenever the response contains a text block. What is the correct fix?',
      options: [
        'Instruct Claude in the system prompt to never write text until it is finished.',
        'Exit only when stop_reason is "end_turn"; continue when it is "tool_use" regardless of text blocks.',
        'Exit when the text contains the phrase "Task complete".',
        'Reduce max_tokens so Claude cannot write long explanations.',
      ],
      correct: [1],
      explanation:
        'Text and tool_use blocks legitimately appear together. stop_reason is the only reliable signal. Prompting (A) is unenforceable, phrase matching (C) is the classic anti-pattern, and shrinking max_tokens (D) introduces truncation problems.',
    },
    {
      question:
        'Claude responds with two tool_use blocks (read_file and list_dir). Which handling is correct?',
      options: [
        'Run read_file, send its result, wait for the next response, then run list_dir.',
        'Run both, then send one user message containing two tool_result blocks with the matching tool_use_ids.',
        'Run both and send two separate user messages, one per result.',
        'Run only the first tool; Claude will re-request the second if it still needs it.',
      ],
      correct: [1],
      explanation:
        'All tool results for one assistant turn go back in a single user message. Splitting them (A, C) breaks the expected pairing and dropping one (D) leaves an unanswered tool_use, which the API rejects.',
    },
    {
      question:
        'A response in your loop has stop_reason "pause_turn" after several web searches. What should the loop do?',
      options: [
        'Treat it as completion and return the text so far.',
        'Append the assistant content to messages and call the API again without adding a user message.',
        'Append a user message saying "Please continue" and call again.',
        'Raise an error; pause_turn indicates the server failed.',
      ],
      correct: [1],
      explanation:
        'pause_turn means the server-side tool loop reached its iteration limit and will resume if you resend the conversation. It is not completion (A) or an error (D), and an extra "continue" message (C) is unnecessary and can confuse the resumption.',
    },
    {
      question:
        'Which TWO practices belong in a production agent loop? (Select two)',
      options: [
        'Check stop_reason for "max_tokens" before executing any tool_use block.',
        'Use `for i in range(10)` as the primary mechanism that decides the task is done.',
        'Keep an iteration or cost budget that raises an error when exceeded.',
        'Strip tool_use blocks from the assistant message before appending it, to save tokens.',
      ],
      correct: [0, 2],
      explanation:
        'Guarding against truncated inputs and keeping a budget as a safety net are both correct. An iteration cap as the completion signal (B) is an anti-pattern, and removing tool_use blocks (D) breaks the pairing with tool_result blocks and causes an API error.',
    },
    {
      question:
        'A loop always calls get_customer, then get_orders, then draft_reply in that order, with the tool names hard-coded in the harness. How should this be characterized?',
      options: [
        'A well-designed agent, because it uses tools.',
        'A workflow: the sequence is fixed in code, so an agent loop adds cost without adding autonomy.',
        'A multi-agent system, because each tool is a specialist.',
        'An orchestrator-workers pattern.',
      ],
      correct: [1],
      explanation:
        'Agentic behavior means the model chooses the next action based on results. A fixed sequence is a workflow and would be simpler as direct calls. Options C and D describe patterns that are not present.',
    },
  ],
  statements: [
    { text: 'The agentic loop continues while stop_reason is "tool_use" and terminates when it is "end_turn".', isTrue: true, explanation: 'These two stop reasons are the primary control signals for the loop.' },
    { text: 'When Claude requests multiple tools in one response, each result should be sent in its own user message.', isTrue: false, explanation: 'All results for one assistant turn go back together in a single user message.' },
    { text: 'If a response has stop_reason "max_tokens" and contains a tool_use block, it is safe to execute the tool because the JSON parsed.', isTrue: false, explanation: 'Truncated inputs can still parse as valid partial JSON. Never execute tools from a max_tokens response.' },
    { text: 'The presence of a text block in a response is a reliable indicator that the agent has finished.', isTrue: false, explanation: 'Claude often narrates and requests a tool in the same response. Only stop_reason indicates completion.' },
    { text: 'stop_reason "pause_turn" means the server will resume a long-running server-tool loop if you resend the conversation.', isTrue: true, explanation: 'Append the assistant content and call again; do not add a new user message.' },
    { text: 'An iteration cap should be the primary mechanism that decides when an agent is done.', isTrue: false, explanation: 'A cap is a safety guard. When it fires, the task is incomplete and should be reported as such.' },
    { text: 'The Messages API is stateless, so the full history including tool_use and tool_result blocks must be resent on each iteration.', isTrue: true, explanation: 'Nothing is remembered server side between requests; the messages array is the agent\'s memory.' },
  ],
  resources: [
    { label: 'Handling stop reasons (Claude docs)', url: 'https://platform.claude.com/docs/en/build-with-claude/handling-stop-reasons' },
    { label: 'Tool use overview (Claude docs)', url: 'https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview' },
    { label: 'Implement tool use (Claude docs)', url: 'https://platform.claude.com/docs/en/agents-and-tools/tool-use/implement-tool-use' },
  ],
};
