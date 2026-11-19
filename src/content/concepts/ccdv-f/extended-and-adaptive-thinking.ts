import type { Concept } from '../../types';

export const extendedAndAdaptiveThinking: Concept = {
  id: 'extended-and-adaptive-thinking',
  title: 'Extended and Adaptive Thinking',
  summary:
    'The API mechanics of thinking: the adaptive thinking parameter, effort levels, display modes, signed thinking blocks that must be passed back unchanged, and what replaced budget_tokens.',
  certs: ['ccdv-f', 'ccar-f', 'ccar-p'],
  domains: ['ccdv-f-2', 'ccdv-f-5', 'ccar-f-5', 'ccar-p-2'],
  tags: ['thinking', 'reasoning', 'effort', 'api'],
  difficulty: 'intermediate',
  sections: [
    {
      heading: 'What thinking is',
      body: `Thinking lets Claude reason before it answers. The reasoning is emitted as \`thinking\` content blocks that precede the text or tool calls in the response. Those tokens are billed as output tokens and **count toward \`max_tokens\`**, which is the first practical consequence: a tight \`max_tokens\` sized around the answer alone can now truncate mid-response.

Two generations of the feature exist:

- **Extended thinking** (older models): \`thinking: {type: "enabled", budget_tokens: N}\`. You chose a fixed budget, which had to be at least 1,024 and less than \`max_tokens\`.
- **Adaptive thinking** (current models): \`thinking: {type: "adaptive"}\`. The model decides how much to think per request, and you steer depth with an effort level rather than a token budget.

On current models \`budget_tokens\` is removed: sending it returns a 400. Only Haiku 4.5 and older still accept it. Exam items that show \`budget_tokens\` on a current model are showing a bug.`,
    },
    {
      heading: 'Effort levels and model defaults',
      body: `Depth is controlled with \`output_config: {effort: ...}\` where effort is one of \`low\`, \`medium\`, \`high\`, \`xhigh\` or \`max\`. Effort influences both how much the model thinks and how thorough the final answer is, so it is a cost and latency lever as much as a quality lever. A classification task can run at \`low\`; a multi-file refactor or a hard proof wants \`high\` or above.

Defaults and restrictions differ by model, and they are a favourite exam detail:

- **Opus 5.5**: thinking is always on. Omit \`thinking\` or send \`{type: "adaptive"}\`; \`{type: "disabled"}\` and any budget return 400. Default effort is \`medium\`.
- **Opus 5**: thinking on by default (omitting the field runs adaptive). \`disabled\` is accepted only at effort \`high\` or lower.
- **Sonnet 5.5**: cannot be disabled with \`disabled\`; to turn off pre-answer thinking send \`{type: "between_tools"}\`, which keeps short progress notes between tool calls. Only valid at effort \`high\` or below.
- **Haiku 5.5**: adaptive only, on by default; \`budget_tokens\` is a 400.

Per-message effort changes (via a mid-conversation system message) exist as a beta; otherwise effort is a top-level request parameter and changing it mid-conversation changes the cache prefix.`,
    },
    {
      heading: 'Display modes',
      body: `What you see in a thinking block is governed by \`thinking.display\`:

| display | What the block contains |
|---|---|
| \`omitted\` (default on current models) | A \`thinking\` block whose \`thinking\` text is an empty string |
| \`summarized\` | A readable summary of the reasoning |
| \`updates\` (beta) | Short progress updates suitable for UIs |

Display changes visibility only. The model thinks and you are billed the same under every setting. The raw chain of thought is never returned on current models. This default caught teams migrating from older models: their "show reasoning" panel went blank until they opted in with \`display: "summarized"\`. The block field name is still \`block.thinking\`.`,
    },
    {
      heading: 'Pass thinking blocks back unchanged',
      body: `Thinking blocks carry a cryptographic \`signature\`. When you continue a conversation, especially across tool-use turns, **replay the assistant turn's full content including its thinking blocks, unmodified**. Do not edit, trim, reorder or hand-write them. The API verifies the signature and, on current models, also checks that the system prompt, tool list and earlier messages have not changed since the block was produced ("preserved thinking"). A violation returns a 400 that mentions an invalid signature or a block bound to a different conversation; retrying the same body never fixes it.

Practical rules:

- Keep the transcript append-only. Use mid-conversation \`system\` messages or server-side context editing instead of rewriting history.
- Never strip thinking blocks to save tokens. The API drops blocks the current model cannot read before pricing, and removing them yourself can trigger ordering or signature errors.
- If you must recover from a signature error, strip the named block and every thinking block after it, then retry once, or opt into \`block_binding.prefix_mismatch_behavior: "drop_block"\` under its beta header.
- In streaming, thinking arrives as \`thinking_delta\` and \`signature_delta\` events; the SDK helpers assemble the block for you.`,
    },
  ],
  examples: [
    {
      title: 'Adaptive thinking with explicit effort',
      description:
        'A code-review service wants deep reasoning on security findings but a readable summary for the reviewer UI. It uses adaptive thinking, high effort, summarized display and a max_tokens large enough for thinking plus the review.',
      language: 'python',
      code: `resp = client.messages.create(
    model="claude-opus-5-5",
    max_tokens=16000,                       # must cover thinking + answer
    thinking={"type": "adaptive", "display": "summarized"},
    output_config={"effort": "high"},
    messages=[{"role": "user", "content": diff_prompt}],
)
for block in resp.content:
    if block.type == "thinking":
        ui.show_reasoning(block.thinking)
    elif block.type == "text":
        ui.show_review(block.text)`,
      takeaway: 'Adaptive plus effort replaces budget_tokens; size max_tokens for thinking and answer together.',
    },
    {
      title: 'Replaying thinking blocks through a tool loop',
      description:
        'An agent loop appends Claude\'s full content array, thinking blocks included, before adding the tool result. The history stays append-only so signatures remain valid.',
      language: 'typescript',
      code: `const res = await client.messages.create({
  model: "claude-opus-5-5",
  max_tokens: 16000,
  thinking: { type: "adaptive" },
  tools,
  messages,
});
messages.push({ role: "assistant", content: res.content }); // keep thinking blocks as-is
if (res.stop_reason === "tool_use") {
  const results = await runTools(res.content);
  messages.push({ role: "user", content: results });
}`,
      takeaway: 'Replay the whole assistant turn; never edit or drop thinking blocks.',
    },
    {
      title: 'Mistake: budget_tokens carried over from an older model',
      description:
        'A team upgraded from Haiku 4.5 to Opus 5.5 without changing their request body and every call failed with a 400 saying thinking.type.enabled is not supported. They replaced the budget with adaptive thinking and an effort level, then raised max_tokens because thinking now counted toward it.',
      language: 'python',
      code: `# Before (works on Haiku 4.5, 400 on Opus 5.5)
thinking={"type": "enabled", "budget_tokens": 8000}, max_tokens=4000

# After
thinking={"type": "adaptive"},
output_config={"effort": "medium"},
max_tokens=12000`,
      takeaway: 'budget_tokens is gone on current models; migrate to adaptive thinking and effort, and resize max_tokens.',
    },
  ],
  keyPoints: [
    'Thinking blocks precede the answer, are billed as output tokens and count toward max_tokens.',
    'Current models use thinking: {type: "adaptive"}; budget_tokens is removed (400) except on Haiku 4.5 and older.',
    'Depth is set with output_config.effort: low, medium, high, xhigh, max.',
    'Opus 5.5 cannot disable thinking (default effort medium); Sonnet 5.5 uses between_tools instead of disabled; Haiku 5.5 is adaptive only.',
    'thinking.display: omitted (default, empty text), summarized, or updates (beta). Display never changes cost.',
    'Thinking blocks are signed; replay them unchanged. Editing history or stripping blocks causes signature 400s.',
    'Keep transcripts append-only; use mid-conversation system messages or server-side context management instead of rewriting.',
  ],
  flashcards: [
    { front: 'How do you enable thinking on a current model?', back: 'thinking: {type: "adaptive"} (or omit it on models where thinking is always on).' },
    { front: 'What replaced budget_tokens for controlling depth?', back: 'output_config.effort with values low, medium, high, xhigh, max.' },
    { front: 'Which models still accept budget_tokens?', back: 'Haiku 4.5 and older. Current models return 400.' },
    { front: 'Default display mode for thinking on current models?', back: 'omitted: a thinking block is present but its text is empty. Opt into summarized to see a summary.' },
    { front: 'Do thinking tokens count toward max_tokens?', back: 'Yes. Size max_tokens for thinking plus answer.' },
    { front: 'What happens if you edit a thinking block before replaying it?', back: 'The signature check fails and the API returns a 400; the block must be passed back unchanged.' },
    { front: 'How do you turn off pre-answer thinking on Sonnet 5.5?', back: 'thinking: {type: "between_tools"} at effort high or below; {type: "disabled"} returns 400.' },
    { front: 'Can thinking be disabled on Opus 5.5?', back: 'No. disabled and budget_tokens both return 400; lower effort instead.' },
    { front: 'Which streaming delta types carry thinking?', back: 'thinking_delta (text) and signature_delta (the signature).' },
  ],
  quiz: [
    {
      question:
        'After migrating to claude-opus-5-5, every request fails with a 400 mentioning "thinking.type.enabled" is not supported. What is the correct fix?',
      options: [
        'Increase budget_tokens so it is below max_tokens.',
        'Replace the enabled/budget_tokens config with thinking: {type: "adaptive"} and set output_config.effort.',
        'Add the extended-thinking beta header.',
        'Set thinking: {type: "disabled"} to skip reasoning.',
      ],
      correct: [1],
      explanation:
        'Current models use adaptive thinking with effort; budget_tokens is removed, no beta header exists for this, and Opus 5.5 rejects disabled as well.',
    },
    {
      question: 'A reasoning panel in the UI is empty after moving to a current model, although usage shows plenty of output tokens. Why?',
      options: [
        'Thinking is off by default on current models.',
        'The default display mode is omitted, so thinking blocks have empty text; set display to "summarized".',
        'Thinking is only returned when streaming.',
        'The effort level is too low to produce thinking.',
      ],
      correct: [1],
      explanation:
        'Thinking still happens and is billed; omitted display hides it. Thinking is on by default on these models, streaming is unrelated, and effort does not blank the block.',
    },
    {
      question: 'Which TWO statements about thinking blocks in multi-turn conversations are correct? (Select two)',
      options: [
        'They should be stripped before replay to save input tokens.',
        'They are signed and must be passed back unchanged.',
        'Changing the system prompt after a thinking block was produced can cause a 400 on current models.',
        'They may be rewritten by the application to guide the next turn.',
      ],
      correct: [1, 2],
      explanation:
        'Blocks are signed and bound to the conversation prefix; editing history or the blocks causes signature errors. Stripping can trigger ordering errors and is unnecessary since unreadable blocks are dropped before pricing.',
    },
    {
      question: 'A workload that ran with thinking off on an older model now truncates mid-answer on a current model with the same max_tokens. What is the most likely cause?',
      options: [
        'The model has a smaller context window.',
        'Thinking is now on by default and its tokens count toward max_tokens.',
        'The effort default is max.',
        'The response includes citations.',
      ],
      correct: [1],
      explanation:
        'Thinking tokens share the max_tokens cap. Raise max_tokens or lower effort. Context window, citations and the effort default (medium) are not the cause.',
    },
    {
      question: 'Which setting lowers cost and latency for a simple classification call on a model where thinking cannot be disabled?',
      options: ['thinking: {type: "disabled"}', 'output_config: {effort: "low"}', 'thinking.display: "omitted"', 'A smaller max_tokens'],
      correct: [1],
      explanation:
        'Effort controls how much the model thinks. disabled returns 400 on such models, display changes only visibility, and a small max_tokens truncates rather than reduces thinking.',
    },
  ],
  statements: [
    { text: 'budget_tokens is the recommended way to control thinking on claude-opus-5-5.', isTrue: false, explanation: 'It returns a 400 on current models; use adaptive thinking with output_config.effort.' },
    { text: 'Thinking tokens are billed as output tokens.', isTrue: true, explanation: 'And they count toward max_tokens.' },
    { text: 'Setting thinking.display to "omitted" reduces the cost of thinking.', isTrue: false, explanation: 'Display changes visibility only; thinking happens and is billed identically.' },
    { text: 'Thinking blocks must be replayed unchanged in subsequent turns.', isTrue: true, explanation: 'They are signed; editing them causes a 400.' },
    { text: 'On Opus 5.5 you can send thinking: {type: "disabled"} to save money.', isTrue: false, explanation: 'Thinking is always on for Opus 5.5; disabled returns 400. Lower effort instead.' },
    { text: 'Effort levels are low, medium, high, xhigh and max.', isTrue: true, explanation: 'Set via output_config.effort.' },
    { text: 'Removing old thinking blocks from history is a safe way to shrink the prompt.', isTrue: false, explanation: 'It can trigger signature or ordering errors; the API already drops unreadable blocks before pricing.' },
  ],
  resources: [
    { label: 'Adaptive thinking', url: 'https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking' },
    { label: 'Effort', url: 'https://platform.claude.com/docs/en/build-with-claude/effort' },
    { label: 'Preserved thinking', url: 'https://platform.claude.com/docs/en/build-with-claude/preserved-thinking' },
  ],
};
