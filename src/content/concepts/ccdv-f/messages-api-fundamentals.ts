import type { Concept } from '../../types';

export const messagesApiFundamentals: Concept = {
  id: 'messages-api-fundamentals',
  title: 'Messages API Fundamentals',
  summary:
    'The anatomy of a POST /v1/messages request and response: roles, content blocks, the system prompt, max_tokens, stop reasons, the usage object, and how multi-turn conversations work on a stateless API.',
  certs: ['ccdv-f', 'ccar-f', 'ccar-p'],
  domains: ['ccdv-f-2', 'ccdv-f-5', 'ccar-f-1', 'ccar-p-3'],
  tags: ['api', 'messages', 'content-blocks', 'stop-reason', 'usage'],
  difficulty: 'foundations',
  diagram: 'request-anatomy',
  sections: [
    {
      heading: 'One endpoint, one request shape',
      body: `Almost everything you do with Claude goes through a single call: \`POST /v1/messages\`. Streaming, tool use, vision, PDFs, thinking and caching are all options on that one request; the Message Batches API wraps many of these requests into a job, and the Agent SDK wraps them in a loop. Learn the shape once and the rest of the platform is variations on it.

The required fields are:

- \`model\` – the model id, for example \`claude-opus-5-5\`.
- \`max_tokens\` – the hard cap on output tokens for this response (thinking tokens count toward it on models that think).
- \`messages\` – the conversation so far, as an array of \`{role, content}\` objects.

Common optional fields: \`system\` (operator instructions, a string or a list of text blocks), \`tools\`, \`thinking\`, \`output_config\` (effort and structured output format), \`stop_sequences\`, \`metadata\`, \`stream\` and \`cache_control\`. On the current API version (\`2026-10-21\`) the sampling knobs \`temperature\`, \`top_p\` and \`top_k\` are rejected; steer behaviour with instructions and effort instead.

The response is a \`Message\` object: \`id\`, \`model\`, \`role: "assistant"\`, a \`content\` array of blocks, \`stop_reason\`, optional \`stop_details\`, and \`usage\`.`,
    },
    {
      heading: 'Roles and content blocks',
      body: `\`messages\` holds alternating \`user\` and \`assistant\` turns. The first message must be \`user\`. Consecutive same-role messages are merged into a single turn. On current models a \`system\` role may also appear mid-conversation to inject operator instructions without invalidating the cached prefix.

\`content\` is either a plain string (shorthand for one text block) or an array of typed blocks:

| Block type | Appears in | Purpose |
|---|---|---|
| \`text\` | user and assistant | Ordinary text |
| \`image\` | user | Base64, URL or Files API image |
| \`document\` | user | PDF or text document, optionally with citations |
| \`tool_use\` | assistant | Claude asks you to run a tool (\`id\`, \`name\`, \`input\`) |
| \`tool_result\` | user | Your answer to a \`tool_use\`, matched by \`tool_use_id\` |
| \`thinking\` | assistant | Reasoning block (signed; pass back unchanged) |

Two rules trip people up. First, \`tool_result\` blocks go in a **user** message, because from the API's point of view your application is the user replying to Claude's request. Second, when you replay an assistant turn, replay the entire \`content\` array, including \`tool_use\` and \`thinking\` blocks, not just the text you displayed. The SDKs type \`content\` as a discriminated union, so check \`block.type\` before reading \`block.text\`.`,
    },
    {
      heading: 'System prompt and max_tokens',
      body: `The \`system\` field carries instructions that have operator authority: persona, rules, output format, tool-usage policy. It is separate from \`messages\` so it stays stable across turns and caches well. Put per-request data (the user's question, retrieved documents) in the user turn, not the system prompt.

\`max_tokens\` is a ceiling, not a target. Claude stops naturally when done; it only hits the ceiling if the answer (plus any thinking) is longer than allowed, and then \`stop_reason\` is \`max_tokens\` and the content is truncated. Set it comfortably above the longest legitimate answer. Current models allow up to 128K output tokens, but the SDKs refuse non-streaming requests whose expected duration exceeds about 10 minutes, so large values should be paired with streaming.`,
    },
    {
      heading: 'Stop reasons and stop_details',
      body: `\`stop_reason\` tells your code what to do next. Branch on it explicitly:

| stop_reason | Meaning | Your next step |
|---|---|---|
| \`end_turn\` | Claude finished | Show the answer |
| \`tool_use\` | Claude wants a tool run | Execute it, append a \`tool_result\`, call again |
| \`max_tokens\` | Output was cut off | Raise \`max_tokens\`, stream, or ask to continue; never treat as complete |
| \`pause_turn\` | A server-side tool loop paused | Resend the same history unchanged to resume |
| \`refusal\` | Safety refusal | Read \`stop_details\`; do not blindly retry |
| \`stop_sequence\` | A custom stop sequence was hit | Handle as designed |

\`stop_details\` is populated only for \`refusal\`. It carries a \`category\` and an \`explanation\` so you can log, route or show a fallback message. A beta server-side \`fallbacks\` parameter can re-run a refused request on another model inside the same call.

A truncated \`tool_use\` block (stop reason \`max_tokens\` with a tool call present) must not be executed: its \`input\` may be a partial object.`,
    },
    {
      heading: 'Usage and stateless multi-turn',
      body: `Every response includes \`usage\`: \`input_tokens\`, \`output_tokens\`, \`cache_creation_input_tokens\` and \`cache_read_input_tokens\`. Log it on every call; it is the source of truth for cost modelling and for verifying that caching works.

The API is **stateless**. It does not remember your previous call. To continue a conversation you resend the whole history, appending Claude's last response and your new user message each turn. That is why context grows, why caching matters and why "session hygiene" is an application-design topic. Server-side compaction and message threads (both beta) exist to reduce what you must resend, but the default mental model is: the client owns the transcript.`,
    },
  ],
  examples: [
    {
      title: 'A minimal, correctly handled call',
      description:
        'A support tool calls Claude once per ticket. It reads the content blocks by type, branches on stop_reason, and logs usage. This is the baseline every production call should meet.',
      language: 'python',
      code: `import anthropic

client = anthropic.Anthropic()
resp = client.messages.create(
    model="claude-opus-5-5",
    max_tokens=2048,
    system="You are a support triage assistant. Answer in under 120 words.",
    messages=[{"role": "user", "content": ticket_text}],
)
if resp.stop_reason == "max_tokens":
    raise RuntimeError("truncated; raise max_tokens")
if resp.stop_reason == "refusal":
    log.warning("refused: %s", resp.stop_details)
answer = "".join(b.text for b in resp.content if b.type == "text")
log.info("tokens in=%d out=%d", resp.usage.input_tokens, resp.usage.output_tokens)`,
      takeaway: 'Read blocks by type, branch on stop_reason, and log usage on every call.',
    },
    {
      title: 'Multi-turn by resending history',
      description:
        'A chat UI keeps a messages array. Each turn it appends the user text, calls the API, then appends the full assistant content (not just the text) before the next turn.',
      language: 'typescript',
      code: `const history: Anthropic.MessageParam[] = [];

async function chat(userText: string) {
  history.push({ role: "user", content: userText });
  const res = await client.messages.create({
    model: "claude-opus-5-5",
    max_tokens: 2048,
    messages: history,
  });
  history.push({ role: "assistant", content: res.content }); // whole array
  return res.content.filter((b) => b.type === "text").map((b) => b.text).join("");
}`,
      takeaway: 'The client owns the transcript; append the entire assistant content array every turn.',
    },
    {
      title: 'Mistake: tool_result in the wrong role',
      description:
        'A developer appended the tool result as an `assistant` message and got a 400 about roles. The result must be a `user` message containing a `tool_result` block whose `tool_use_id` matches the `tool_use` block Claude emitted.',
      language: 'python',
      code: `# Wrong: tool result sent as the assistant
messages.append({"role": "assistant", "content": [{"type": "tool_result", ...}]})

# Right: replay Claude's turn, then answer as the user
messages.append({"role": "assistant", "content": resp.content})
messages.append({"role": "user", "content": [{
    "type": "tool_result",
    "tool_use_id": tool_block.id,
    "content": json.dumps(result),
}]})`,
      takeaway: 'Your application is the "user" that replies to Claude; tool results live in user turns.',
    },
  ],
  keyPoints: [
    'POST /v1/messages requires model, max_tokens and messages; system, tools, thinking and output_config are optional.',
    'messages alternate user/assistant and must start with user; content is a string or an array of typed blocks.',
    'tool_use blocks come from the assistant; tool_result blocks go back in a user message keyed by tool_use_id.',
    'Replay the whole assistant content array (text, tool_use, thinking) when continuing a conversation.',
    'Branch on stop_reason: end_turn, tool_use, max_tokens, pause_turn, refusal, stop_sequence. stop_details is only set for refusal.',
    'max_tokens is a hard cap that includes thinking tokens; hitting it means truncated output.',
    'usage reports input, output, cache write and cache read tokens; log it every call.',
    'The API is stateless: the client resends the full history each turn.',
  ],
  flashcards: [
    { front: 'Which three fields are required on every Messages API request?', back: 'model, max_tokens and messages.' },
    { front: 'Which role must the first message have?', back: 'user.' },
    { front: 'In which role does a tool_result block appear?', back: 'user. Your app is the user replying to Claude\'s tool_use request.' },
    { front: 'Name the six stop reasons.', back: 'end_turn, tool_use, max_tokens, pause_turn, refusal, stop_sequence.' },
    { front: 'When is stop_details populated?', back: 'Only when stop_reason is refusal; it carries category and explanation.' },
    { front: 'What does stop_reason pause_turn mean and how do you handle it?', back: 'A server-side tool loop hit its iteration limit. Resend the same history unchanged to resume.' },
    { front: 'What four token counts does usage report?', back: 'input_tokens, output_tokens, cache_creation_input_tokens, cache_read_input_tokens.' },
    { front: 'How does Claude remember previous turns?', back: 'It does not. The API is stateless; the client resends the full conversation each call.' },
    { front: 'Where should per-request data such as the user question go: system or messages?', back: 'messages (the user turn). The system prompt should hold stable operator instructions.' },
    { front: 'Which sampling parameters are rejected on API version 2026-10-21?', back: 'temperature, top_p and top_k.' },
  ],
  quiz: [
    {
      question:
        'A developer\'s agent loop appends only the text of Claude\'s reply to the history, then appends a tool_result. The next call returns a 400 referencing an unknown tool_use_id. What is the most likely cause?',
      options: [
        'The model does not support tools and must be changed.',
        'The assistant turn was replayed without its tool_use block, so the tool_result has nothing to match.',
        'max_tokens was too low for the tool result to be read.',
        'The tool_result should have been sent in the system prompt.',
      ],
      correct: [1],
      explanation:
        'A tool_result is matched to a tool_use block by id. Dropping the tool_use block when replaying the assistant turn orphans the result. Model support, max_tokens and the system prompt are unrelated to the id match.',
    },
    {
      question: 'A response comes back with stop_reason "max_tokens" and a tool_use block. What should the application do?',
      options: [
        'Execute the tool; the input is complete because the block was emitted.',
        'Treat the response as final and display the text.',
        'Do not execute the tool; the input may be partial. Retry with a higher max_tokens or streaming.',
        'Send an empty tool_result so the model continues.',
      ],
      correct: [2],
      explanation:
        'max_tokens means the output was cut off, so the tool input may be truncated JSON. Executing it is unsafe, treating it as final loses work, and an empty tool_result misrepresents what happened.',
    },
    {
      question: 'Which TWO statements about the Messages API are correct? (Select two)',
      options: [
        'The API stores conversation state between calls using the message id.',
        'The content field may be a plain string or an array of typed content blocks.',
        'stop_details is populated for every stop reason.',
        'Thinking tokens count toward the max_tokens cap on models that think.',
      ],
      correct: [1, 3],
      explanation:
        'content accepts a string shorthand or a block array, and max_tokens caps thinking plus text. The API is stateless (no server-side state by default), and stop_details is set only for refusals.',
    },
    {
      question: 'A team wants Claude\'s persona and formatting rules to stay stable across all turns and to be cacheable. Where should those instructions go?',
      options: ['In the first user message', 'In the system field', 'In a tool_result block', 'In metadata'],
      correct: [1],
      explanation:
        'The system field carries operator instructions, stays constant across turns and sits early in the cache prefix. User messages are per-turn data, tool_result is for tool output, and metadata is not shown to the model.',
    },
    {
      question: 'Which field proves whether a response was cut off before Claude finished?',
      options: ['usage.output_tokens equal to max_tokens', 'stop_reason', 'content length', 'model'],
      correct: [1],
      explanation:
        'stop_reason is the authoritative signal (max_tokens means truncated). Token counts can coincidentally match, and content length says nothing about completeness.',
    },
  ],
  statements: [
    { text: 'The first message in the messages array must have role "user".', isTrue: true, explanation: 'Starting with an assistant message returns a 400.' },
    { text: 'tool_result blocks are sent in an assistant message.', isTrue: false, explanation: 'They go in a user message; your application answers Claude\'s tool_use as the user.' },
    { text: 'stop_details is populated only when stop_reason is "refusal".', isTrue: true, explanation: 'It carries the refusal category and explanation.' },
    { text: 'Setting max_tokens high forces Claude to write longer answers.', isTrue: false, explanation: 'max_tokens is a ceiling. Claude stops when done; only truncation is affected.' },
    { text: 'When continuing a conversation you may replay only the text blocks of the assistant turn.', isTrue: false, explanation: 'Replay the whole content array; dropping tool_use or thinking blocks breaks the next turn.' },
    { text: 'The usage object includes cache read and cache creation token counts.', isTrue: true, explanation: 'cache_read_input_tokens and cache_creation_input_tokens appear alongside input_tokens and output_tokens.' },
    { text: 'A pause_turn stop reason requires you to add a user message saying "continue".', isTrue: false, explanation: 'Resend the history unchanged; the API detects the trailing server_tool_use and resumes.' },
  ],
  resources: [
    { label: 'Messages API reference', url: 'https://platform.claude.com/docs/en/api/messages' },
    { label: 'Handling stop reasons', url: 'https://platform.claude.com/docs/en/build-with-claude/handling-stop-reasons' },
    { label: 'Getting started with the Claude API', url: 'https://platform.claude.com/docs/en/get-started' },
  ],
};
