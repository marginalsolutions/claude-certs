# Content style guide

This file is for anyone (human or AI) writing concepts for Claude Cert Academy.
Read it fully before writing. Accuracy matters more than volume: students will
sit a proctored exam on this material.

## Where content lives

- `src/content/types.ts` is the schema. Every concept is a `Concept`.
- `src/content/certifications.ts` holds the four exam blueprints transcribed
  from the official exam guides (v1.0, July 2026). Domain ids look like
  `ccdv-f-5`. Use them in `Concept.domains`.
- `src/content/concepts/<cert>/<concept-id>.ts` exports one concept. The
  exemplar is `src/content/concepts/ccdv-f/prompt-caching.ts`. Match its depth.
- `src/content/concepts/index.ts` registers every concept.
- Diagrams live in `src/diagrams/` and are referenced by id from `Concept.diagram`.

## Shape of a good concept

| Field | Target |
|---|---|
| `sections` | 3 to 5 sections, each 80 to 250 words of Markdown. Teach the mechanism, then the tradeoffs, then the exam angle. |
| `examples` | 3 or more. Each is a concrete situation (a team, a bug, a design choice) with optional code and a one-sentence takeaway. At least one example should be a realistic *mistake* and how to fix it. |
| `keyPoints` | 5 to 8 crisp bullets a student could memorize. |
| `flashcards` | 8 or more. Front is a question or term; back is a short answer. |
| `quiz` | 5 or more. Exam style: scenario, four options, one or two correct, explanation that says why the wrong answers are wrong. Write at least one multiple-response item (two correct answers) and say "(Select two)" in the question. |
| `statements` | 6 or more true/false claims with an explanation. Mix true and false roughly evenly. Make false statements plausible, not silly. |
| `resources` | 1 to 4 links to official docs (platform.claude.com/docs, code.claude.com/docs, modelcontextprotocol.io). |

Markdown in `sections` and `examples` supports headings, lists, tables, bold,
inline code and fenced code blocks.

## Exam style

Anthropic's items are scenario based. The stem describes a realistic situation
and asks for the *most appropriate* action, the *most likely* cause, or the
approach that *best fits*. Distractors are things a reasonable but less
experienced person might pick: solving a different problem, using a bigger
model as a cure-all, monitoring instead of removing a privilege, asking the
model nicely instead of enforcing a control. Mirror that.

## Platform facts to get right (as of November 2026)

Model lineup and ids (never append date suffixes):

| Model | Id | Notes |
|---|---|---|
| Claude Opus 5.5 | `claude-opus-5-5` | Default recommendation. $4 / $20 per MTok. Thinking cannot be disabled; effort default `medium`. |
| Claude Sonnet 5.5 | `claude-sonnet-5-5` | $2 / $10. Everyday coding/agent work. |
| Claude Haiku 5.5 | `claude-haiku-5-5` | $0.10 / $0.50. Cheapest, fastest. |
| Claude Fable 5.2 | `claude-fable-5-2` | Most capable widely released model. $8 / $40. |
| Older still served: Opus 5, Opus 4.8/4.7/4.6, Sonnet 5, Sonnet 4.6, Haiku 4.5. | | |

- All current models have a 1M-token context window and up to 128K output tokens
  (Haiku 4.5 is 200K context).
- Thinking: current models use `thinking: {type: "adaptive"}` (or omit it on
  models where thinking is always on). `budget_tokens` is deprecated/removed on
  current models and is only for Haiku 4.5 and older. Depth is controlled with
  `output_config.effort` (`low`, `medium`, `high`, `xhigh`, `max`).
- Assistant prefill is removed on 4.6+ models. Use structured outputs
  (`output_config.format`) or a tool with a JSON schema instead.
- Forced `tool_choice` (`any` / `tool`) returns a 400 on Opus 5.5, Sonnet 5.5
  and Fable 5.x. Use `auto` plus `strict: true` and prompt steering, or
  structured outputs. The *concept* of `auto` / `any` / forced tool still
  appears in the Architect Foundations guide, so teach what each means and note
  the current restriction.
- `temperature`, `top_p`, `top_k` are rejected on API version 2026-10-21.
- Streaming is recommended for long outputs; SDK helpers:
  `.stream()` with `get_final_message()` / `finalMessage()`.
- Message Batches API: 50% discount, results within 24 hours, no latency SLA,
  results arrive in any order (key by `custom_id`), no multi-turn tool loops
  inside a batch.
- Prompt caching: prefix match over tools → system → messages,
  `cache_control: {type: "ephemeral"}`, max 4 breakpoints, reads ~10% of input
  price, verify with `usage.cache_read_input_tokens`.
- Stop reasons: `end_turn`, `tool_use`, `max_tokens`, `pause_turn`, `refusal`.
  `stop_details` is populated only for `refusal`. Server-side `fallbacks`
  (beta) routes refused requests to another model.
- Server tools: `web_search_20260209`, `web_fetch_20260209`,
  `code_execution_20260521`, tool search (`tool_search_tool_regex_20251119`).
- Files API and Skills API are out of beta (`client.files`, `client.skills`).
- Compaction (beta `compact-2026-01-12`) summarizes history server side;
  context editing (beta `context-management-2025-06-27`) clears old tool
  results. They are different features.
- Third-party platforms: Amazon Bedrock (model ids prefixed `anthropic.`),
  Google Cloud Vertex AI, Microsoft Foundry. Managed Agents runs the agent loop
  and a sandbox on Anthropic's side.
- Four ways to build an agent: manual loop, SDK Tool Runner
  (`client.beta.messages.tool_runner`), Managed Agents, Claude Agent SDK
  (Claude Code as a library with built-in Read/Write/Edit/Bash/Glob/Grep).
- MCP: hosts, clients, servers; primitives are tools, resources, prompts;
  transports are stdio and Streamable HTTP (SSE is legacy). Claude Code scopes:
  project `.mcp.json`, user `~/.claude.json`.
- Claude Code: `CLAUDE.md` hierarchy (user `~/.claude/CLAUDE.md`, project root
  or `.claude/CLAUDE.md`, subdirectory files), `@import`, `.claude/rules/` with
  `paths:` frontmatter, `.claude/commands/`, `.claude/skills/<name>/SKILL.md`
  with `allowed-tools`, `context: fork`, `argument-hint`; `settings.json`
  (user, project, `settings.local.json`) for permissions, hooks, env;
  hooks `PreToolUse`, `PostToolUse`, `Notification`, `Stop`, `SessionStart`;
  headless `-p` / `--print`, `--output-format json`, `--json-schema`;
  `--resume`, `/compact`, `/memory`, plan mode, Explore subagent.
- Agent SDK: `query()`, `AgentDefinition`, Task tool for subagents
  (`allowedTools` must include `Task`), `fork_session`, hooks.

If you are unsure about a detail, say less rather than guess, and prefer the
official docs linked in the resources.

## Tone

Plain, direct, second person. Short paragraphs. No marketing language. Teach
the *why* behind each rule so students can reason about novel exam scenarios.
