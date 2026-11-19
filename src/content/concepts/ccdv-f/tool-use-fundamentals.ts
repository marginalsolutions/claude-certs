import type { Concept } from '../../types';

export const toolUseFundamentals: Concept = {
  id: 'tool-use-fundamentals',
  title: 'Tool Use Fundamentals',
  summary:
    'How to define tools (name, description, input_schema), how tool_use and tool_result blocks pair up, parallel tool calls, is_error, strict mode, eager input streaming, and what makes a description good.',
  certs: ['ccdv-f', 'ccar-f', 'ccar-p'],
  domains: ['ccdv-f-8', 'ccdv-f-2', 'ccar-f-2', 'ccar-f-4', 'ccar-p-3'],
  tags: ['tools', 'function-calling', 'json-schema', 'api'],
  difficulty: 'foundations',
  diagram: 'tool-use-sequence',
  sections: [
    {
      heading: 'Anatomy of a tool definition',
      body: `A custom (client) tool is a JSON object in the request's \`tools\` array with three required parts:

\`\`\`json
{
  "name": "get_order_status",
  "description": "Look up the current status of a customer order. Use when the user asks where an order is or whether it shipped. Do not use for returns.",
  "input_schema": {
    "type": "object",
    "properties": {
      "order_id": {"type": "string", "description": "Order id, format ORD-#####"}
    },
    "required": ["order_id"]
  }
}
\`\`\`

- **name**: unique, specific, snake_case (\`get_order_status\` beats \`orders\`). The model uses it in \`tool_use\` blocks.
- **description**: the main input to the model's decision about **whether and when** to call the tool. Say what it does, when to use it, when *not* to, what it returns, and any formats or limits.
- **input_schema**: JSON Schema for the arguments. Describe every property, use \`enum\` for fixed choices, and list only truly required fields in \`required\`.

Optional fields: \`strict: true\` (guaranteed schema-valid arguments; requires \`additionalProperties: false\`), \`eager_input_streaming: true\` (stream argument fragments as generated), \`cache_control\` (a cache breakpoint after the tool list), and \`defer_loading\` (used with tool search).

The model also sees the tool definitions as part of the prompt, so they count toward input tokens and sit at the very front of the cacheable prefix. Changing them invalidates the cache for the whole conversation.`,
    },
    {
      heading: 'tool_use and tool_result blocks',
      body: `When Claude decides to call a tool, the response has \`stop_reason: "tool_use"\` and its \`content\` contains one or more blocks like:

\`\`\`json
{"type": "tool_use", "id": "toolu_01A...", "name": "get_order_status", "input": {"order_id": "ORD-12345"}}
\`\`\`

Your application executes the call and replies with a **user** message whose content holds a \`tool_result\` per call:

\`\`\`json
{"type": "tool_result", "tool_use_id": "toolu_01A...", "content": "Shipped 2026-11-10, ETA 2026-11-13"}
\`\`\`

Rules:

- The \`tool_use_id\` must match exactly. The assistant message containing the \`tool_use\` block must be in the history immediately before the user message with the result.
- **Parallel tool use**: Claude may request several tools in one response. Execute them (concurrently if independent) and return **all** results in **one** user message, in any order. Set \`disable_parallel_tool_use: true\` in \`tool_choice\` if your harness can only handle one at a time.
- \`content\` may be a string or an array of blocks (text, images, documents), which is how a screenshot or PDF comes back from a tool.
- A \`tool_result\` with no useful output is fine (empty string); an unanswered \`tool_use\` is not.

\`tool_choice\` defaults to \`auto\`. \`none\` disables tools for a turn. \`any\` and \`{"type": "tool", "name": ...}\` force a call, but current models (Opus 5.5, Sonnet 5.5, Fable 5.x) reject them with a 400; steer with the prompt and rely on \`strict: true\` for the schema guarantee, or use structured outputs when the only goal was JSON.`,
    },
    {
      heading: 'Errors, strict mode and streaming',
      body: `**is_error.** When a tool fails, return the result with \`"is_error": true\` and a specific, actionable message ("Order ORD-99999 not found; ids are ORD- followed by five digits"). Claude reads the message and usually retries with corrected input, tries another approach, or tells the user. A generic "Operation failed" leaves it guessing. Distinguish *errors* from *empty results*: a search that legitimately returns nothing is a success with an empty list, not an error.

**strict: true.** Guarantees the arguments conform to the schema (types, required fields, enums) so your code can skip defensive parsing. The schema must have \`additionalProperties: false\` on every object and avoid unsupported keywords (numeric ranges, string length, recursion). The SDKs strip unsupported constraints and validate client side. New schemas incur a one-time compilation delay; identical schemas are cached for 24 hours.

**eager_input_streaming.** By default the API buffers and validates each argument before streaming it, so a tool that takes a 20K-token file body produces a long silent gap. Setting \`eager_input_streaming: true\` on a tool streams fragments as they are generated. In exchange the server no longer validates the argument, so validate the parsed input against the schema before running the tool, stop on \`max_tokens\` or \`refusal\`, and return an \`is_error\` result if the JSON is unusable. It only matters on streaming requests and is not valid on server tools.`,
    },
    {
      heading: 'Writing descriptions that get tools selected correctly',
      body: `Descriptions are the mechanism by which Claude selects among tools. Thin or overlapping descriptions cause misrouting: two tools named \`analyze_content\` and \`analyze_document\` with near-identical text will be used interchangeably. A good description covers:

1. **What** it does and what it returns.
2. **When** to call it, including trigger conditions ("Use when the user asks about current prices"). Recent Opus models call tools conservatively, so explicit triggers measurably raise the should-call rate.
3. **When not** to, and which sibling tool to use instead.
4. **Input formats, edge cases, limits** (date format, maximum rows, pagination).

Tool-set construction matters as much as any single description. Keep the set small and focused (a handful of tools per role rather than eighteen); split a generic tool into purpose-specific ones with clear contracts; replace a broad tool (\`fetch_url\`) with a constrained one (\`load_document\` that validates document URLs) when the broad one gets misused. Review the system prompt for keyword-sensitive instructions that override good descriptions ("always search first" will trigger searches even when a local tool is correct).

Test tool selection with a small eval set of realistic requests, including ones where the correct answer is "no tool".`,
    },
  ],
  examples: [
    {
      title: 'A complete tool call round trip',
      description:
        'Define a tool, handle a parallel request for two orders, and return both results in a single user message with matching ids.',
      language: 'typescript',
      code: `const tools = [{
  name: "get_order_status",
  description: "Return the shipping status of one order. Use when a user asks where an order is. Not for returns or refunds.",
  strict: true,
  input_schema: {
    type: "object",
    properties: { order_id: { type: "string", description: "Format ORD-#####" } },
    required: ["order_id"], additionalProperties: false,
  },
}];
const r = await client.messages.create({ model: "claude-opus-5-5", max_tokens: 1024, tools, messages });
const calls = r.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
const results = await Promise.all(calls.map(async (c) => ({
  type: "tool_result" as const, tool_use_id: c.id,
  content: await orders.status((c.input as { order_id: string }).order_id),
})));
messages.push({ role: "assistant", content: r.content }, { role: "user", content: results });`,
      takeaway: 'One assistant turn with N tool_use blocks is answered by one user turn with N tool_result blocks.',
    },
    {
      title: 'Returning a useful error',
      description:
        'The database threw because the id was malformed. Rather than crashing the loop or returning "error", the harness tells Claude exactly what was wrong so it can correct the call.',
      language: 'python',
      code: `try:
    out = orders.status(block.input["order_id"])
    result = {"type": "tool_result", "tool_use_id": block.id, "content": out}
except InvalidOrderId as e:
    result = {
        "type": "tool_result", "tool_use_id": block.id, "is_error": True,
        "content": f"Invalid order id '{e.value}'. Expected ORD- followed by five digits. "
                   "Ask the user to confirm the id if it is not in the conversation.",
    }`,
      takeaway: 'is_error plus a specific message lets the model recover instead of guessing.',
    },
    {
      title: 'The mistake: overlapping descriptions',
      description:
        'A research agent had `analyze_content` ("Analyze content and extract information") and `analyze_document` ("Analyze a document and extract information"). It routed web pages to the document tool about half the time. Renaming the first to `extract_web_results` with a web-specific description, and stating in each description when to use the other, brought routing accuracy above 95% without any model change.',
      language: 'json',
      code: `{"name": "extract_web_results",
 "description": "Extract facts from raw HTML or text fetched from a web page. Use only for content returned by web_fetch. For uploaded PDFs or Word files use analyze_document instead."}`,
      takeaway: 'Differentiate tools by name and by explicit when/when-not guidance; the model cannot infer boundaries you did not state.',
    },
  ],
  keyPoints: [
    'A tool definition has name, description and input_schema (JSON Schema); descriptions drive tool selection.',
    'Claude requests calls with tool_use blocks (stop_reason "tool_use"); you reply with tool_result blocks carrying the matching tool_use_id.',
    'Multiple tool_use blocks in one response are answered in one user message with all results.',
    'Return failures with is_error: true and a specific, actionable message; empty results are not errors.',
    'strict: true guarantees schema-valid arguments; requires additionalProperties: false and a supported schema subset.',
    'eager_input_streaming: true streams large arguments as generated but shifts validation to the client.',
    'Forced tool_choice (any / tool) returns 400 on current models; use auto plus prompt steering and strict, or structured outputs.',
    'Good descriptions say what, when, when not, and input formats; keep tool sets small and non-overlapping.',
  ],
  flashcards: [
    { front: 'What are the three required fields of a custom tool definition?', back: 'name, description, input_schema.' },
    { front: 'Which stop_reason indicates Claude wants to call a tool?', back: 'tool_use' },
    { front: 'How do you answer a tool_use block?', back: 'With a tool_result block in the next user message whose tool_use_id equals the tool_use block\'s id.' },
    { front: 'Claude returns two tool_use blocks. How many user messages do you send?', back: 'One, containing both tool_result blocks.' },
    { front: 'How do you signal that a tool call failed?', back: 'Set is_error: true on the tool_result and include a specific, actionable error message.' },
    { front: 'What does strict: true require of the schema?', back: 'additionalProperties: false on every object and only supported JSON Schema features (no numeric ranges, string lengths or recursion).' },
    { front: 'What does eager_input_streaming do, and what is the trade-off?', back: 'Streams tool-argument fragments as generated instead of buffering; the server no longer validates them, so the client must validate before executing.' },
    { front: 'Which tool_choice values are rejected on Opus 5.5 / Sonnet 5.5 / Fable 5.x?', back: '{"type": "any"} and {"type": "tool", "name": ...}; auto and none still work.' },
    { front: 'What should a good tool description contain?', back: 'What it does and returns, when to use it (trigger conditions), when not to and which sibling to use, input formats and limits.' },
    { front: 'How do you prevent parallel tool calls?', back: 'Set disable_parallel_tool_use: true inside tool_choice.' },
    { front: 'Where do tool definitions sit in the cacheable prefix?', back: 'First: tools → system → messages. Changing them invalidates the whole conversation cache.' },
  ],
  quiz: [
    {
      question:
        'Claude responds with three tool_use blocks. Your harness sends back a user message containing two tool_result blocks and plans to send the third after the next response. What happens?',
      options: [
        'The API accepts it and Claude waits for the third result.',
        'The request is rejected because every tool_use in the preceding assistant turn must have a matching tool_result.',
        'Claude re-requests the third tool automatically.',
        'The third tool_use is silently dropped.',
      ],
      correct: [1],
      explanation:
        'All tool_use blocks must be answered in the following user message. The API does not wait, re-request or drop; it returns an error.',
    },
    {
      question:
        'A tool call fails because the backend timed out. Which tool_result is most useful to Claude?',
      options: [
        '{"content": "error"}',
        '{"is_error": true, "content": "Inventory service timed out after 5s; this is transient. Retry once, then tell the user the check is unavailable."}',
        'No tool_result; just resend the request so Claude tries again.',
        '{"content": "[]"} so Claude assumes there is no inventory.',
      ],
      correct: [1],
      explanation:
        'A specific, categorized error with is_error lets Claude choose an appropriate recovery. A bare "error" (A) gives no guidance, omitting the result (C) causes an API error, and an empty list (D) misrepresents a failure as a valid empty result.',
    },
    {
      question:
        'Which TWO changes most directly improve tool selection when two tools are frequently confused? (Select two)',
      options: [
        'Rename them to reflect distinct purposes and state in each description when to use the other.',
        'Add ten more tools so the model has more context.',
        'Add explicit trigger conditions and input formats to each description.',
        'Set tool_choice to {"type": "any"}.',
      ],
      correct: [0, 2],
      explanation:
        'Differentiated names and when/when-not guidance, plus explicit triggers and formats, are the levers. More tools (B) degrades selection, and forced tool_choice (D) is rejected on current models and does not fix which tool is chosen.',
    },
    {
      question:
        'A tool takes a 30K-token document body as an argument. Users complain the stream goes silent for a minute before anything appears. Which change addresses this?',
      options: [
        'Set strict: true on the tool.',
        'Set eager_input_streaming: true on the tool and validate the parsed input client side before executing.',
        'Lower max_tokens.',
        'Move the tool to the system prompt.',
      ],
      correct: [1],
      explanation:
        'Eager input streaming removes the server-side buffering that causes the gap, at the cost of client-side validation. strict (A) is about schema conformance, lowering max_tokens (C) would truncate the argument, and D is not a thing.',
    },
    {
      question:
        'A developer sets tool_choice to {"type": "tool", "name": "extract_fields"} on claude-opus-5-5 to guarantee structured extraction and receives a 400. What should they do?',
      options: [
        'Retry with {"type": "any"}.',
        'Use structured outputs (output_config.format) or tool_choice auto with strict: true and a prompt that asks for the tool.',
        'Downgrade to a model that is no longer recommended.',
        'Remove the input_schema from the tool.',
      ],
      correct: [1],
      explanation:
        'Forced tool choice is rejected on current models; any (A) fails the same way. Structured outputs or auto + strict + prompt steering achieve the goal. Downgrading (C) or removing the schema (D) are not solutions.',
    },
  ],
  statements: [
    { text: 'The tool description is the primary signal Claude uses to decide whether to call a tool.', isTrue: true, explanation: 'Names and schemas help, but the description carries the when/when-not guidance.' },
    { text: 'Each tool_result must be sent in its own user message.', isTrue: false, explanation: 'All results for one assistant turn go in a single user message.' },
    { text: 'strict: true requires additionalProperties: false on object schemas.', isTrue: true, explanation: 'This is one of the schema constraints for guaranteed conformance.' },
    { text: 'A search tool that finds nothing should return is_error: true.', isTrue: false, explanation: 'An empty result is a successful query with no matches; is_error is for failures.' },
    { text: 'Forced tool_choice ({"type": "any"}) is accepted on claude-opus-5-5.', isTrue: false, explanation: 'Opus 5.5, Sonnet 5.5 and Fable 5.x return a 400 for any and tool; use auto plus strict and prompt steering, or structured outputs.' },
    { text: 'eager_input_streaming has no effect on non-streaming requests.', isTrue: true, explanation: 'It only changes when argument fragments are emitted on a stream; it is ignored otherwise and invalid on server tools.' },
    { text: 'Adding more tools to an agent generally improves its tool-selection accuracy.', isTrue: false, explanation: 'Large tool sets degrade selection reliability; keep sets small and role-scoped.' },
    { text: 'Tool definitions count toward input tokens and are part of the cacheable prefix.', isTrue: true, explanation: 'They come first in the tools → system → messages order.' },
  ],
  resources: [
    { label: 'Tool use overview (Claude docs)', url: 'https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview' },
    { label: 'Implement tool use (Claude docs)', url: 'https://platform.claude.com/docs/en/agents-and-tools/tool-use/implement-tool-use' },
    { label: 'Structured outputs and strict tools (Claude docs)', url: 'https://platform.claude.com/docs/en/build-with-claude/structured-outputs' },
    { label: 'Writing tools for agents (Anthropic)', url: 'https://www.anthropic.com/engineering/writing-tools-for-agents' },
  ],
};
