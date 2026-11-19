import type { Concept } from '../../types';

export const toolDistributionAndToolChoice: Concept = {
  id: 'tool-distribution-and-tool-choice',
  title: 'Tool Distribution Across Agents and tool_choice',
  summary:
    'Fewer, role-scoped tools make selection more reliable. Give each agent only what its role needs, replace generic tools with constrained ones, and understand what tool_choice auto, any and forced selection mean, including why the newest models accept only auto and none.',
  certs: ['ccar-f', 'ccdv-f', 'ccar-p'],
  domains: ['ccar-f-2', 'ccdv-f-8', 'ccar-p-3'],
  tags: ['tools', 'tool_choice', 'multi-agent', 'capability-bloat', 'scoping', 'strict'],
  difficulty: 'intermediate',
  diagram: 'coordinator-subagents',
  sections: [
    {
      heading: 'Too many tools degrades selection',
      body: `Every tool in the \`tools\` array is a choice the model must weigh on every turn. With 4 or 5 well-described tools, selection is near-perfect. With 18, the model must discriminate among many partially overlapping options, the descriptions consume context, and selection errors rise. This is **capability bloat**, and it is the first thing to check when a multi-agent system misroutes.

The second effect is **cross-specialisation misuse**. An agent given tools outside its role tends to use them. A synthesis agent with \`web_search\` available starts searching instead of synthesising the findings it was given; a document analyst with \`process_refund\` is a liability waiting for a prompt injection. Tools are not free options; they are invitations.

The remedy is **scoped tool access**: each agent gets only the tools its role requires. In the research scenario, the search agent gets search and fetch, the analyst gets read and extraction tools, the synthesiser gets none of those. In the Agent SDK this is the \`tools\` list on each \`AgentDefinition\` plus \`allowedTools\` for the main agent. In Claude Code it is the \`tools\` frontmatter of a subagent file or a skill's \`allowed-tools\`.`,
    },
    {
      heading: 'Constrained alternatives and scoped cross-role tools',
      body: `Scoping is not only about count. Prefer **constrained tools** over generic ones when the role has a narrow need:

- Replace \`fetch_url\` (any URL) with \`load_document\` that validates the URL against an allowlist of document sources and returns parsed text. The analyst can still get what it needs, but cannot be steered to arbitrary sites.
- Replace \`run_sql\` with \`get_customer_orders(customer_id)\`. Same data, no injection surface.
- Replace \`bash\` with \`run_tests\` and \`lint\` in a CI reviewer that should never deploy.

Sometimes a role has a **high-frequency need** that technically belongs to another role. The synthesis agent frequently needs to check a single fact. Routing every such check through the coordinator to the search agent is slow. The pattern is a **scoped cross-role tool**: give the synthesiser a narrow \`verify_fact(claim, source_url)\` that checks one claim against one known source, while anything more complex (new research, open-ended search) still goes through the coordinator. The narrow tool covers the common case without reopening the whole capability.`,
    },
    {
      heading: 'tool_choice: what each setting means',
      body: `\`tool_choice\` tells the API how Claude may use the tools you supplied:

| Setting | Meaning |
|---|---|
| \`{"type": "auto"}\` (default) | Claude decides whether to call a tool or answer in text |
| \`{"type": "any"}\` | Claude must call at least one tool; it cannot reply with text only |
| \`{"type": "tool", "name": "extract_metadata"}\` | Claude must call that specific tool |
| \`{"type": "none"}\` | Claude may not call tools this turn |

Any of these can add \`"disable_parallel_tool_use": true\` to cap the response at one tool call.

Historically, \`any\` guaranteed a tool call instead of conversational text, and forced selection guaranteed that a specific tool ran **first** (for example \`extract_metadata\` before enrichment tools), with later steps handled in follow-up turns under \`auto\`. Forced selection was also a common way to get guaranteed JSON: define a tool whose schema is the output shape and force it.

**Current restriction.** Claude Opus 5.5, Sonnet 5.5 and Fable 5.x **reject** \`any\` and forced \`tool\` with a 400. \`auto\` and \`none\` are unaffected. The exam guide still describes all three, so know what each means and what replaces the forced forms today:

- For "always call a tool" or "call X first": keep \`auto\`, state the expectation in the prompt ("Use extract_metadata before anything else"), set \`strict: true\` on the tool to keep the schema-valid-arguments guarantee, and check in code that the call happened, retrying if not.
- For "I only wanted JSON": use structured outputs (\`output_config.format\` with a JSON schema) instead of a forced extraction tool.`,
    },
    {
      heading: 'Putting it together for the exam',
      body: `Expect scenarios like these:

- *A research coordinator gives all 18 tools to every subagent and the synthesiser keeps searching.* Scope each subagent's tools to its role; give the synthesiser a narrow \`verify_fact\` for its frequent need.
- *An analyst agent fetched an attacker-controlled page via \`fetch_url\`.* Replace with \`load_document\` that validates document URLs.
- *A pipeline must extract metadata before enrichment.* Conceptually forced tool selection on the first turn; on current models, \`auto\` plus explicit instruction and a code check, or restructure so the first stage is a separate call that only has the metadata tool available.
- *An agent sometimes answers in prose when a tool call was required.* Conceptually \`any\`; on current models, prompt steering plus a programmatic check.

A useful trick that works on every model: **control the tool list per call**. If the first step must be metadata extraction, make the first request with only \`extract_metadata\` in \`tools\`. Tool availability is a deterministic lever even where \`tool_choice\` is not.`,
    },
  ],
  examples: [
    {
      title: 'Scoping tools per subagent in the research system',
      description:
        'Each AgentDefinition lists only the tools its role requires. The synthesiser receives a narrow verify_fact tool for its frequent need, but no general search.',
      language: 'typescript',
      code: `const options = {
  allowedTools: ["Read", "Task"],                       // coordinator: delegate + read
  agents: {
    searcher:   { description: "Finds sources on a subtopic.",
                  prompt: SEARCH_PROMPT,
                  tools: ["WebSearch", "mcp__research__load_document"] },
    analyst:    { description: "Extracts claims from supplied documents.",
                  prompt: ANALYST_PROMPT,
                  tools: ["Read", "mcp__research__extract_data_points"] },
    synthesizer:{ description: "Writes the cited report from provided findings.",
                  prompt: SYNTH_PROMPT,
                  tools: ["mcp__research__verify_fact"] },   // scoped cross-role tool
  },
};`,
      takeaway: 'Each role gets only its tools; a narrow cross-role tool covers the frequent case without reopening full capability.',
    },
    {
      title: 'The mistake: every agent gets every tool',
      description:
        'A team registered all 18 MCP tools on the main agent and let subagents inherit them. The synthesis agent spent most of its turns running new web searches and produced reports that ignored the provided findings. Restricting it to verify_fact cut its tool calls by 80% and fixed the reports.',
      language: 'text',
      code: `Before: synthesizer tools = all 18   -> 11 web searches per report, findings ignored
After:  synthesizer tools = [verify_fact] -> 2 verifications per report, findings used
        complex follow-ups routed back through the coordinator`,
      takeaway: 'Agents use the tools they are given; tools outside a role invite misuse.',
    },
    {
      title: 'Guaranteeing a first step on current models',
      description:
        'The extraction pipeline must call extract_metadata before enrichment. Forced tool_choice is rejected on claude-opus-5-5, so the first call exposes only that tool, uses strict schemas, and verifies in code that the call happened.',
      language: 'python',
      code: `first = client.messages.create(
    model="claude-opus-5-5", max_tokens=1024,
    tools=[EXTRACT_METADATA],                 # only one tool available this turn
    tool_choice={"type": "auto"},             # 'any'/'tool' return 400 on this model
    system="Call extract_metadata on the document before anything else.",
    messages=[{"role": "user", "content": doc}],
)
calls = [b for b in first.content if b.type == "tool_use"]
if not calls:                                  # auto does not guarantee a call
    first = retry_with_stronger_instruction()
# follow-up turns: full tool set under auto
nxt = client.messages.create(model="claude-opus-5-5", max_tokens=4096,
                             tools=[EXTRACT_METADATA, *ENRICHMENT_TOOLS],
                             messages=history_with(first, metadata_result))`,
      takeaway: 'Where forced tool_choice is unavailable, restrict the tool list per call, steer in the prompt, and verify in code.',
    },
  ],
  keyPoints: [
    'Many tools (e.g. 18 instead of 4-5) degrade selection reliability by increasing decision complexity and context load.',
    'Agents tend to misuse tools outside their specialisation; scope each agent\'s tools to its role.',
    'Replace generic tools with constrained alternatives (fetch_url → load_document that validates document URLs).',
    'Provide narrow cross-role tools for high-frequency needs (verify_fact for the synthesiser) and route complex cases via the coordinator.',
    'tool_choice auto lets Claude decide; any requires at least one tool call; tool forces a named tool; none disables tools.',
    'Forced any/tool are rejected (400) on Opus 5.5, Sonnet 5.5 and Fable 5.x; use auto + strict + prompt steering with a code check, or structured outputs for JSON.',
    'Controlling which tools are in the tools array per call is a deterministic lever that works on every model.',
  ],
  flashcards: [
    { front: 'What happens to tool selection reliability as the tool count grows from 5 to 18?', back: 'It degrades: more overlapping options, more context consumed, more selection errors.' },
    { front: 'Why should a synthesis agent not have web_search?', back: 'Agents with tools outside their role tend to use them; the synthesiser starts searching instead of synthesising provided findings.' },
    { front: 'What is a constrained alternative to fetch_url?', back: 'load_document, which validates URLs against allowed document sources and returns parsed text.' },
    { front: 'What is a scoped cross-role tool?', back: 'A narrow tool (e.g. verify_fact) given to a role for a frequent need that would otherwise require another agent, while complex cases still route through the coordinator.' },
    { front: 'tool_choice auto means?', back: 'Claude decides whether to call a tool or answer in text. It is the default.' },
    { front: 'tool_choice any means?', back: 'Claude must call at least one tool rather than return text only.' },
    { front: 'tool_choice {"type": "tool", "name": "X"} means?', back: 'Claude must call tool X on this turn (forced selection).' },
    { front: 'Which tool_choice values do Opus 5.5, Sonnet 5.5 and Fable 5.x reject?', back: 'any and forced tool (400 error). auto and none still work.' },
    { front: 'Current replacement for forced tool selection?', back: 'auto + strict: true + prompt steering + a code check that the call happened; or structured outputs when the goal was JSON.' },
    { front: 'What does disable_parallel_tool_use do?', back: 'Limits the response to at most one tool call.' },
  ],
  quiz: [
    {
      question:
        'A multi-agent research system gives all 18 MCP tools to every subagent. The synthesis agent keeps running web searches and ignores the findings it was given. What is the best fix?',
      options: [
        'Add "do not search" to the synthesis agent\'s prompt.',
        'Restrict each subagent to the tools for its role and give the synthesiser only a narrow verify_fact tool.',
        'Increase the synthesis agent\'s context window.',
        'Replace the synthesiser with a larger model.',
      ],
      correct: [1],
      explanation:
        'Scoped tool access removes the temptation and reduces decision complexity; the narrow verify_fact covers its legitimate frequent need. A prompt prohibition is probabilistic, and context size or model choice do not address tool availability.',
    },
    {
      question:
        'A document analysis subagent was manipulated by page content into fetching an arbitrary external URL through its fetch_url tool. Which change best reduces this risk while preserving its function?',
      options: [
        'Add a warning about prompt injection to the subagent\'s prompt.',
        'Replace fetch_url with a load_document tool that validates URLs against approved document sources.',
        'Log all fetch_url calls for weekly review.',
        'Give fetch_url to the coordinator instead and have the analyst ask for pages.',
      ],
      correct: [1],
      explanation:
        'A constrained tool removes the capability to reach arbitrary URLs. Warnings are probabilistic, logging monitors rather than prevents, and moving the generic tool to the coordinator just relocates the risk.',
    },
    {
      question: 'Which TWO statements about tool_choice are correct? (Select two)',
      options: [
        'auto lets Claude decide whether to call a tool or respond with text.',
        'any guarantees Claude will call every tool in the list.',
        'Forced selection {"type": "tool", "name": ...} requires Claude to call that specific tool.',
        'none forces Claude to call at least one tool.',
      ],
      correct: [0, 2],
      explanation:
        'auto is the default model-decides mode and forced selection names one required tool. any requires at least one tool call, not every tool; none disables tool calls for the turn.',
    },
    {
      question:
        'An extraction pipeline on claude-opus-5-5 must call extract_metadata before any enrichment tool. The engineer sets tool_choice to {"type": "tool", "name": "extract_metadata"} and receives a 400. What is the best approach?',
      options: [
        'Switch to a model that accepts forced tool_choice for the whole pipeline.',
        'Make the first call with only extract_metadata in the tools array under auto, instruct the model to call it, set strict: true, and verify in code that the call occurred before continuing with the full tool set.',
        'Remove the ordering requirement.',
        'Set tool_choice to any instead.',
      ],
      correct: [1],
      explanation:
        'Forced any and tool are both rejected on Opus 5.5. Restricting the tool list per call is deterministic, prompt steering plus strict keeps the call reliable and schema-valid, and the code check handles the rare miss. Changing models for one parameter or dropping the requirement are poor trade-offs.',
    },
    {
      question:
        'A team used a forced extraction tool purely to get JSON matching a schema. They are migrating to claude-sonnet-5-5. What should they use instead?',
      options: [
        'Assistant prefill with an opening brace.',
        'Structured outputs via output_config.format with the JSON schema.',
        'tool_choice any with a single tool.',
        'A regex over the model\'s prose response.',
      ],
      correct: [1],
      explanation:
        'Structured outputs are the designed replacement for forced extraction tools. Prefill is removed on current models, any is rejected on Sonnet 5.5, and regex over prose is fragile.',
    },
    {
      question: 'Why is giving every agent the full tool set considered an anti-pattern even when each tool is well described?',
      options: [
        'The API limits requests to five tools.',
        'More options increase decision complexity and agents tend to use tools outside their specialisation.',
        'Tool descriptions are ignored when more than ten tools are present.',
        'It prevents prompt caching entirely.',
      ],
      correct: [1],
      explanation:
        'Capability bloat and cross-role misuse are the documented effects. There is no five-tool limit, descriptions are not ignored, and caching still works (though a bigger tool list is more to cache).',
    },
  ],
  statements: [
    { text: 'Giving an agent 18 tools instead of 4-5 tends to degrade tool selection reliability.', isTrue: true, explanation: 'More options mean more decision complexity and more context consumed by definitions.' },
    { text: 'A synthesis agent should be given web search so it can fill gaps independently.', isTrue: false, explanation: 'Agents with out-of-role tools misuse them; the synthesiser should get a narrow verify_fact and route new research through the coordinator.' },
    { text: 'tool_choice "any" means Claude must call at least one tool rather than reply with text only.', isTrue: true, explanation: 'That is its definition, though current models reject it.' },
    { text: 'Forced tool selection is accepted on Claude Opus 5.5 and Sonnet 5.5.', isTrue: false, explanation: 'Both return a 400 for tool_choice any and tool. Use auto with strict and prompt steering, or structured outputs.' },
    { text: 'Replacing fetch_url with a load_document tool that validates URLs is an example of a constrained alternative.', isTrue: true, explanation: 'It preserves the needed capability while removing the dangerous generality.' },
    { text: 'Restricting the tools array on a specific call is a reliable way to ensure only one tool can be used on that turn.', isTrue: true, explanation: 'Tool availability is deterministic on every model, unlike forced tool_choice.' },
    { text: 'disable_parallel_tool_use forces Claude to call exactly one tool.', isTrue: false, explanation: 'It caps the response at most one tool call; under auto, zero calls is still possible.' },
  ],
  resources: [
    { label: 'Tool use: controlling tool_choice', url: 'https://platform.claude.com/docs/en/agents-and-tools/tool-use/implement-tool-use' },
    { label: 'Structured outputs', url: 'https://platform.claude.com/docs/en/build-with-claude/structured-outputs' },
    { label: 'Agent SDK subagents (tool restrictions)', url: 'https://platform.claude.com/docs/en/agent-sdk/subagents' },
  ],
};
