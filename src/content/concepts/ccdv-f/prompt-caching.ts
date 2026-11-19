import type { Concept } from '../../types';

export const promptCaching: Concept = {
  id: 'prompt-caching',
  title: 'Prompt Caching',
  summary:
    'Reuse a stable prompt prefix across requests so repeated tokens are read from cache at a fraction of the price and with lower latency.',
  certs: ['ccdv-f', 'ccar-f', 'ccar-p'],
  domains: ['ccdv-f-5', 'ccdv-f-2', 'ccar-f-4', 'ccar-p-2', 'ccar-p-4'],
  tags: ['cost', 'latency', 'api', 'optimization'],
  difficulty: 'intermediate',
  diagram: 'prompt-caching',
  sections: [
    {
      heading: 'What problem it solves',
      body: `Most production prompts repeat a lot of content on every call: a long system prompt, a policy document, tool definitions, few-shot examples. Without caching you pay full input price for those tokens every time and the model re-processes them before it can start answering.

Prompt caching lets the API remember the processed state of a **prefix** of your request. On the next request with the same prefix, the cached portion is read back instead of recomputed. Cache reads are billed at a steep discount (roughly 10% of the normal input price) and time-to-first-token drops because less work is done before generation starts.`,
    },
    {
      heading: 'How prefix matching works',
      body: `The request is rendered in a fixed order: \`tools\` → \`system\` → \`messages\`. The cache is a **prefix match**: everything up to a cache breakpoint must be byte-for-byte identical to hit.

Consequences:

- Any change anywhere in the prefix invalidates everything after it. A timestamp in the system prompt, a reordered tool list, or an unsorted JSON object silently kills your hit rate.
- Put stable content first and volatile content last: frozen system prompt and tool list, then the long document, then the per-request user message.
- You mark where the cacheable prefix ends with \`cache_control: {"type": "ephemeral"}\`. Up to **4 breakpoints** per request let you cache layers that change at different rates.
- There is a minimum cacheable length (model dependent, in the low thousands of tokens). Shorter prefixes are accepted but simply never cached.
- Writing to the cache costs a small premium over a normal input token; reads are the discount. Caching pays off when a prefix is reused at least a couple of times inside the cache lifetime.`,
    },
    {
      heading: 'Verifying it works',
      body: `Do not assume caching is active. Read the \`usage\` object on every response:

| Field | Meaning |
|---|---|
| \`cache_creation_input_tokens\` | Tokens written to cache on this request |
| \`cache_read_input_tokens\` | Tokens served from cache |
| \`input_tokens\` | Uncached input tokens |

If \`cache_read_input_tokens\` stays at zero across repeated requests, a silent invalidator is at work. The usual suspects: \`datetime.now()\` in the system prompt, a per-user ID placed before the breakpoint, tools listed in a different order, or a prefix that is below the minimum length.`,
    },
    {
      heading: 'Caching in multi-turn conversations and agents',
      body: `In a chat or agent loop the conversation history itself is a growing prefix. Place a breakpoint on the latest message each turn so the whole history up to that point is reused on the next turn. Only the new turn is uncached.

Changing a top-level parameter mid-conversation (for example the system prompt or the \`effort\` level) breaks the prefix. Newer models support **mid-conversation system messages** appended to \`messages\` so you can add operator instructions without invalidating the cached history.

Caches are scoped to the model. If you route between models, each model has its own cache, so a cost cascade across models forfeits reuse.`,
    },
  ],
  examples: [
    {
      title: 'Caching a policy document for a support bot',
      description:
        'A support assistant sends the same 8,000-token system prompt plus refund policy on every request, followed by a short customer question. Put the static material first and add a breakpoint after it.',
      language: 'python',
      code: `response = client.messages.create(
    model="claude-opus-5-5",
    max_tokens=1024,
    system=[
        {"type": "text", "text": SYSTEM_PROMPT},
        {
            "type": "text",
            "text": REFUND_POLICY,          # long, rarely changes
            "cache_control": {"type": "ephemeral"},
        },
    ],
    messages=[{"role": "user", "content": customer_question}],
)
print(response.usage.cache_read_input_tokens)  # > 0 on the second call`,
      takeaway: 'Stable content before the breakpoint, volatile content after it.',
    },
    {
      title: 'A silent cache invalidator',
      description:
        'A team enabled caching but saw zero cache reads. Their system prompt began with "Today is {date}. You are a helpful..." The date changed daily, and every request after midnight had a different prefix. Moving the date to the end of the user message restored a 95% hit rate.',
      language: 'text',
      code: `# Before (never hits)
system = f"Today is {date.today()}. You are a claims assistant. {POLICY}"

# After (hits)
system = [{"type": "text", "text": f"You are a claims assistant. {POLICY}",
           "cache_control": {"type": "ephemeral"}}]
user   = f"Today is {date.today()}.\\n\\n{question}"`,
      takeaway: 'Anything that varies per request belongs after the last breakpoint.',
    },
    {
      title: 'Caching in an agent loop',
      description:
        'An agent runs 20 tool-call iterations. Each iteration resends the full history. Marking the last message with a breakpoint on every call means each new call reads the previous history from cache and pays full price only for the newest tool result.',
      language: 'typescript',
      code: `const last = messages[messages.length - 1];
if (typeof last.content !== "string") {
  const blocks = last.content as Anthropic.ContentBlockParam[];
  blocks[blocks.length - 1] = {
    ...blocks[blocks.length - 1],
    cache_control: { type: "ephemeral" },
  } as Anthropic.ContentBlockParam;
}
const res = await client.messages.create({ model, max_tokens: 4096, tools, system, messages });`,
      takeaway: 'In loops, move the breakpoint forward each turn so history is reused.',
    },
  ],
  keyPoints: [
    'Caching is a prefix match over tools → system → messages; any byte change invalidates everything after it.',
    'Mark breakpoints with cache_control: {type: "ephemeral"}; up to four per request.',
    'Cache reads are roughly 10% of normal input price; writes carry a small premium.',
    'There is a minimum cacheable length. Short prefixes are silently not cached.',
    'Always verify with usage.cache_read_input_tokens.',
    'Caches are per model; switching models means a cold cache.',
  ],
  flashcards: [
    { front: 'In what order is a request rendered for prefix caching?', back: 'tools → system → messages' },
    { front: 'How do you mark a cache breakpoint?', back: 'Add cache_control: {"type": "ephemeral"} to a content block (or tool definition).' },
    { front: 'Maximum number of cache breakpoints per request?', back: 'Four.' },
    { front: 'Which usage field proves caching is working?', back: 'usage.cache_read_input_tokens (should be > 0 on repeated requests).' },
    { front: 'Roughly how much do cache reads cost relative to normal input tokens?', back: 'About 10% of the base input price.' },
    { front: 'Name three silent cache invalidators.', back: 'Timestamps in the system prompt, per-request IDs before the breakpoint, tools or JSON keys in varying order.' },
    { front: 'Why does a prefix under the minimum length never cache?', back: 'The API accepts the breakpoint but ignores it; prefixes below the model-specific minimum (low thousands of tokens) are not cached.' },
    { front: 'How do you keep a cache warm across an agent loop?', back: 'Move the breakpoint to the newest message on every call so the whole prior history is reused.' },
  ],
  quiz: [
    {
      question:
        'An application sends the same 8,000-token system prompt and policy document on every request, followed by a short varying user message. Latency and cost are both concerns. Which change most directly addresses both?',
      options: [
        'Truncate the policy document to its first 1,000 tokens.',
        'Switch to the smallest available model regardless of task fit.',
        'Place the static system prompt and policy before the dynamic content and enable prompt caching.',
        'Move the policy document into a few-shot example block.',
      ],
      correct: [2],
      explanation:
        'Ordering stable content first and adding a cache breakpoint lets the repeated prefix be reused, cutting both time-to-first-token and per-request cost without discarding needed context.',
    },
    {
      question: 'A team enabled caching but usage.cache_read_input_tokens is always 0. Which is the MOST likely cause?',
      options: [
        'Caching requires a beta header they forgot.',
        'Something in the prefix changes on every request, such as a timestamp or per-user ID.',
        'The model does not support caching.',
        'max_tokens is too low.',
      ],
      correct: [1],
      explanation:
        'Zero cache reads across repeated requests almost always means the prefix is not byte-identical. max_tokens affects output, not caching.',
    },
    {
      question: 'Which TWO statements about cache breakpoints are correct? (Select two)',
      options: [
        'You may place up to four breakpoints in one request.',
        'A breakpoint caches everything after it.',
        'A breakpoint caches everything up to and including the block it is on.',
        'Breakpoints are only allowed in the system prompt.',
      ],
      correct: [0, 2],
      explanation:
        'Breakpoints cache the prefix up to that point, and you can use up to four. They can go on system blocks, tool definitions and message content.',
    },
    {
      question: 'Which content should go AFTER the last cache breakpoint?',
      options: ['The tool definitions', 'The frozen system prompt', 'The per-request user question', 'The few-shot examples'],
      correct: [2],
      explanation: 'Volatile per-request content must come after the cached prefix so it does not break the match.',
    },
    {
      question: 'Why does a model-switching cost cascade reduce the benefit of prompt caching?',
      options: [
        'Caching is disabled when more than one model is used in an account.',
        'Caches are scoped per model, so each model starts cold.',
        'Smaller models have no cache.',
        'The cache is cleared when the response model differs from the request model.',
      ],
      correct: [1],
      explanation: 'Each model has its own cache namespace. Routing between models forfeits cache reuse across them.',
    },
  ],
  statements: [
    { text: 'Prompt caching matches on an exact prefix of the request.', isTrue: true, explanation: 'Any byte change in the prefix invalidates the cache from that point on.' },
    { text: 'You can place up to ten cache breakpoints in one request.', isTrue: false, explanation: 'The limit is four breakpoints per request.' },
    { text: 'Cache reads cost more than regular input tokens.', isTrue: false, explanation: 'Reads are heavily discounted (about 10% of base price). Writes carry a small premium.' },
    { text: 'The request is rendered tools → system → messages for caching purposes.', isTrue: true, explanation: 'Stable tools and system content should therefore come first.' },
    { text: 'A prefix shorter than the minimum cacheable length produces an API error.', isTrue: false, explanation: 'It is accepted but silently not cached.' },
    { text: 'Changing the system prompt mid-conversation invalidates the cached history.', isTrue: true, explanation: 'The system prompt is part of the prefix. Use mid-conversation system messages in messages[] to avoid this on supported models.' },
  ],
  resources: [
    { label: 'Prompt caching (Claude docs)', url: 'https://platform.claude.com/docs/en/build-with-claude/prompt-caching' },
    { label: 'Pricing', url: 'https://claude.com/pricing#api' },
  ],
};
