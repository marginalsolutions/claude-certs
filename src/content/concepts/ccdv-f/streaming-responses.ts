import type { Concept } from '../../types';

export const streamingResponses: Concept = {
  id: 'streaming-responses',
  title: 'Streaming Responses',
  summary:
    'Why and how to stream Messages API output: server-sent event types, the SDK stream helpers, streaming with tool use, and the eager input streaming caveats.',
  certs: ['ccdv-f', 'ccar-p'],
  domains: ['ccdv-f-2', 'ccdv-f-5', 'ccar-p-3'],
  tags: ['api', 'streaming', 'sse', 'latency', 'sdk'],
  difficulty: 'intermediate',
  sections: [
    {
      heading: 'Why stream',
      body: `A non-streaming call holds an HTTP connection open until the whole response is generated. For a short answer that is fine. For a long answer, a 50-page report, or a large tool input, three problems appear:

- **Perceived latency.** The user sees nothing until the last token. Streaming shows the first token in well under a second.
- **Timeouts.** Idle connections through proxies and load balancers get cut. The SDKs refuse non-streaming requests they estimate will run longer than about 10 minutes and raise an error telling you to stream.
- **Partial progress.** If a stream drops you still have everything received so far; a non-streaming failure gives you nothing.

The rule of thumb in the official docs is to default to streaming for anything with a large \`max_tokens\`, and to use the SDK helper that accumulates the final message so your code still gets a normal \`Message\` object at the end.`,
    },
    {
      heading: 'The SSE event sequence',
      body: `Streaming uses server-sent events. Set \`stream: true\` (or use the SDK helper) and the response arrives as a sequence of typed events:

| Event | Fires | Carries |
|---|---|---|
| \`message_start\` | Once | The Message shell: id, model, role, initial usage |
| \`content_block_start\` | Per block | Block index and type (text, tool_use, thinking) |
| \`content_block_delta\` | Many per block | \`text_delta\`, \`input_json_delta\`, \`thinking_delta\`, \`signature_delta\` |
| \`content_block_stop\` | Per block | Block finished |
| \`message_delta\` | Once near the end | \`stop_reason\`, \`stop_details\`, final output \`usage\` |
| \`message_stop\` | Once | Stream complete |

\`ping\` events keep the connection alive and \`error\` events can arrive mid-stream (for example an overload), so a robust client handles both. Tool inputs arrive as \`input_json_delta\` fragments of partial JSON that you concatenate and parse when the block stops. The \`stop_reason\` is not known until \`message_delta\`, which is why you cannot decide "was this truncated?" from the text alone.`,
    },
    {
      heading: 'SDK helpers',
      body: `Both official SDKs give you two layers.

**Low level:** \`client.messages.create(..., stream=True)\` returns a raw event iterator. Nothing is accumulated for you.

**Helper:** \`client.messages.stream(...)\` returns a stream object that tracks state. In Python it is a context manager with \`stream.text_stream\` for text deltas and \`stream.get_final_message()\` to obtain the fully assembled \`Message\` (content blocks, \`stop_reason\`, \`usage\`) once the stream ends. In TypeScript, \`client.messages.stream(...)\` is async-iterable, emits events such as \`.on("text", ...)\`, and \`await stream.finalMessage()\` returns the assembled message.

The helper is what you want in almost all application code: you get streaming's timeout protection and progressive display while still writing the same post-processing code (branch on \`stop_reason\`, read \`usage\`) as a non-streaming call. The Agent SDK and the beta tool runner expose the same idea per turn.`,
    },
    {
      heading: 'Streaming with tools and eager input streaming',
      body: `When tools are defined, a streamed turn may end with a \`tool_use\` block. The sequence is the same loop as non-streaming: get the final message, check \`stop_reason == "tool_use"\`, run the tools, append the assistant content and a \`tool_result\` user message, and stream again.

By default the API **buffers and validates each tool-input parameter** before emitting any \`input_json_delta\` for it. For a tool whose argument is a whole file or a code block, that means a long silent gap followed by a burst. Setting \`eager_input_streaming: true\` on a user-defined tool turns the buffering off: fragments arrive as generated. The caveats:

- The server no longer validates the JSON for that tool. The SDK's tolerant parser may return a partial or subtly truncated object, so **validate the parsed input against your schema before running the tool** (the typed tool-runner helpers do this; raw helpers do not).
- Completely unparseable JSON surfaces as an error from the stream iterator, not from the final-message read, so wrap the iteration.
- It is only meaningful on streamed requests and only on client tools; it is not a valid field on server tools.
- A tool input ending with \`stop_reason: "max_tokens"\` is truncated even if it parses. Do not execute it.`,
    },
  ],
  examples: [
    {
      title: 'Streaming a long report with the helper',
      description:
        'A reporting feature generates up to 20K tokens. Without streaming, users waited minutes staring at a spinner and some requests timed out at the load balancer. The team switched to the stream helper and kept their existing post-processing by reading the final message.',
      language: 'python',
      code: `with client.messages.stream(
    model="claude-opus-5-5",
    max_tokens=32000,
    messages=[{"role": "user", "content": prompt}],
) as stream:
    for text in stream.text_stream:
        ui.append(text)                       # progressive display
    final = stream.get_final_message()        # full Message object

if final.stop_reason == "max_tokens":
    ui.warn("Report was cut off")
log.info("output tokens: %d", final.usage.output_tokens)`,
      takeaway: 'Use the helper: progressive display plus a normal Message at the end.',
    },
    {
      title: 'TypeScript event handlers and finalMessage()',
      description:
        'A Node service streams tokens to a browser over a websocket, then persists the assembled message for the transcript.',
      language: 'typescript',
      code: `const stream = client.messages.stream({
  model: "claude-opus-5-5",
  max_tokens: 16000,
  messages: [{ role: "user", content: question }],
});

stream.on("text", (delta) => socket.send(delta));

const message = await stream.finalMessage();
await db.saveTurn({ role: "assistant", content: message.content });
if (message.stop_reason === "refusal") socket.send("[declined]");`,
      takeaway: 'finalMessage() gives the whole Message; branch on stop_reason after the stream ends.',
    },
    {
      title: 'Mistake: executing a streamed tool call without validation',
      description:
        'A team enabled eager_input_streaming on a write_file tool and executed `block.input` directly. On one run the JSON was silently truncated at an unescaped quote and the tool wrote an empty file over a real one. The fix was schema validation before execution and a stop_reason check.',
      language: 'python',
      code: `response = stream.get_final_message()
if response.stop_reason == "max_tokens":
    raise RuntimeError("tool input truncated")       # never run it

for block in response.content:
    if block.type != "tool_use":
        continue
    args = block.input
    if not (isinstance(args, dict) and isinstance(args.get("path"), str)
            and isinstance(args.get("contents"), str)):
        results.append({"type": "tool_result", "tool_use_id": block.id,
                        "is_error": True, "content": "invalid input"})
        continue
    results.append(run_tool(block, args))`,
      takeaway: 'Eager streaming trades server-side validation for speed; validate yourself before side effects.',
    },
  ],
  keyPoints: [
    'Stream for long outputs: lower perceived latency, protection from idle-connection timeouts, partial progress on failure.',
    'SSE order: message_start, content_block_start, content_block_delta (many), content_block_stop, message_delta, message_stop; ping and error can interleave.',
    'stop_reason and final usage arrive in message_delta, not with the text.',
    'Python: client.messages.stream(...) as a context manager, text_stream, get_final_message(). TypeScript: client.messages.stream(...), .on("text"), finalMessage().',
    'The low-level stream=True form gives raw events with no accumulation.',
    'Tool inputs stream as input_json_delta fragments; concatenate and parse at content_block_stop.',
    'eager_input_streaming: true removes server-side buffering and validation for that tool; validate parsed input before executing.',
    'A tool_use block in a response that stopped for max_tokens must not be executed.',
  ],
  flashcards: [
    { front: 'Which SSE event carries stop_reason?', back: 'message_delta (near the end of the stream).' },
    { front: 'Python helper method and the call that returns the assembled Message?', back: 'client.messages.stream(...) and stream.get_final_message().' },
    { front: 'TypeScript call that returns the assembled Message after streaming?', back: 'await stream.finalMessage().' },
    { front: 'What does input_json_delta contain?', back: 'Fragments of the partial JSON for a tool_use block\'s input; concatenate and parse when the block stops.' },
    { front: 'What does eager_input_streaming do?', back: 'Turns off per-parameter buffering and server-side JSON validation for a client tool so its input streams as it is generated.' },
    { front: 'Why do the SDKs refuse some non-streaming requests?', back: 'They estimate the request would exceed about 10 minutes and idle connections drop; stream instead or override the timeout.' },
    { front: 'Three delta subtypes besides text_delta?', back: 'input_json_delta, thinking_delta, signature_delta.' },
    { front: 'First and last events in a stream?', back: 'message_start and message_stop.' },
    { front: 'Where should eager_input_streaming NOT be set?', back: 'On server tools (invalid field), on non-streaming requests (ignored), or when the client cannot handle invalid JSON.' },
  ],
  quiz: [
    {
      question:
        'A document-generation endpoint requests 40,000 output tokens. Users report requests failing after several minutes with a gateway timeout and no output. Which change best addresses this?',
      options: [
        'Increase max_tokens so the model finishes sooner.',
        'Switch to streaming with the SDK helper and consume tokens as they arrive.',
        'Lower the effort level to speed up generation.',
        'Retry the request with max_retries set to 10.',
      ],
      correct: [1],
      explanation:
        'Long non-streaming responses sit on an idle connection that intermediaries cut. Streaming keeps bytes flowing and gives partial output. Raising max_tokens does nothing for speed, lowering effort may hurt quality without fixing the timeout, and retries repeat the same failure.',
    },
    {
      question: 'A developer streams a response and wants to know whether it was truncated. Where does that information arrive?',
      options: ['In message_start', 'In each content_block_delta', 'In message_delta as stop_reason', 'In the ping event'],
      correct: [2],
      explanation:
        'stop_reason and final usage are delivered in message_delta. message_start carries the message shell, deltas carry content, and ping is a keep-alive.',
    },
    {
      question: 'Which TWO statements about eager_input_streaming are correct? (Select two)',
      options: [
        'It makes the API validate tool input more strictly.',
        'It streams tool-input fragments as they are generated instead of buffering each parameter.',
        'It is a valid field on server tools like web_search.',
        'The client must validate the parsed input before executing the tool.',
      ],
      correct: [1, 3],
      explanation:
        'Eager streaming removes buffering and server-side validation, shifting validation to the client. It is not valid on server tools and does not increase validation.',
    },
    {
      question: 'A team uses client.messages.create(stream=True) and complains that they have to reassemble text and track stop_reason by hand. What is the simplest improvement?',
      options: [
        'Switch to client.messages.stream() and call get_final_message() / finalMessage().',
        'Disable streaming entirely.',
        'Parse the raw SSE bytes themselves.',
        'Use the Batches API instead.',
      ],
      correct: [0],
      explanation:
        'The helper accumulates state and returns a normal Message. Disabling streaming reintroduces timeout risk, raw parsing is more work, and batches are asynchronous and unsuitable for interactive use.',
    },
    {
      question: 'During a streamed tool-use turn the final message has stop_reason "max_tokens" and a tool_use block whose input parses as valid JSON. What should the code do?',
      options: [
        'Execute the tool since the JSON parsed.',
        'Do not execute; the input may be an incomplete object. Retry with a higher max_tokens.',
        'Execute the tool but mark the result is_error.',
        'Send the partial input back as a tool_result.',
      ],
      correct: [1],
      explanation:
        'A truncated input can still parse (tolerant parsing or a lucky cut). The stop_reason tells you it is incomplete, so running it risks a wrong side effect.',
    },
  ],
  statements: [
    { text: 'The SDK stream helper returns a complete Message object after the stream ends.', isTrue: true, explanation: 'get_final_message() in Python and finalMessage() in TypeScript.' },
    { text: 'stop_reason is available from the first event of a stream.', isTrue: false, explanation: 'It arrives in message_delta near the end.' },
    { text: 'Streaming changes the price per token.', isTrue: false, explanation: 'Streaming affects delivery, not billing.' },
    { text: 'Tool input is streamed as input_json_delta fragments of partial JSON.', isTrue: true, explanation: 'Concatenate the fragments and parse at content_block_stop.' },
    { text: 'With eager_input_streaming the server still guarantees the tool input is valid JSON.', isTrue: false, explanation: 'Eager streaming disables that validation; the client must validate.' },
    { text: 'The SDKs may refuse a non-streaming request with a very large max_tokens.', isTrue: true, explanation: 'They raise when the estimated duration exceeds about 10 minutes; stream or override the timeout.' },
    { text: 'An error event can arrive in the middle of a stream.', isTrue: true, explanation: 'For example an overloaded_error; clients must handle it.' },
  ],
  resources: [
    { label: 'Streaming Messages', url: 'https://platform.claude.com/docs/en/build-with-claude/streaming' },
    { label: 'Fine-grained tool streaming', url: 'https://platform.claude.com/docs/en/agents-and-tools/tool-use/fine-grained-tool-streaming' },
  ],
};
