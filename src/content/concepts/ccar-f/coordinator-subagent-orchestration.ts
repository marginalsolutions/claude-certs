import type { Concept } from '../../types';

export const coordinatorSubagentOrchestration: Concept = {
  id: 'coordinator-subagent-orchestration',
  title: 'Coordinator and Subagent Orchestration',
  summary:
    'A coordinator decomposes a task, spawns specialised subagents with isolated context, routes all communication, and aggregates results. Learn the hub-and-spoke pattern, how subagents are defined and invoked in the Agent SDK, and how to pass context so nothing is lost.',
  certs: ['ccar-f', 'ccdv-f', 'ccar-p'],
  domains: ['ccar-f-1', 'ccdv-f-1', 'ccar-p-1'],
  tags: ['multi-agent', 'subagents', 'agent-sdk', 'orchestration', 'context-passing'],
  difficulty: 'intermediate',
  diagram: 'coordinator-subagents',
  sections: [
    {
      heading: 'Hub-and-spoke: the coordinator owns the flow',
      body: `In the multi-agent research scenario a **coordinator** receives the research question and delegates to specialised subagents: web search, document analysis, synthesis, report generation. The architecture is hub-and-spoke. Subagents never talk to each other; every message goes through the coordinator.

Why centralise?

- **Observability.** One place logs every delegation and every result.
- **Consistent error handling.** The coordinator decides whether a failed subagent is retried, replaced, or reported as a coverage gap.
- **Controlled information flow.** The coordinator chooses what each subagent sees, which keeps subagent context small and prevents one subagent's noise from polluting another's.

The coordinator's jobs are decomposition, delegation, aggregation and **selection**: it should analyse the query and decide which subagents are actually needed. A simple factual question may need only search plus synthesis; forcing every query through the full four-stage pipeline wastes tokens and time. The opposite failure also exists: decomposing a broad topic too narrowly so that the subtopics assigned to subagents do not cover the question. Partition scope deliberately (distinct subtopics or source types per agent) to avoid both duplication and gaps.

Good coordinators also run **refinement loops**: evaluate the synthesis for gaps, re-delegate targeted searches, re-synthesise, and stop when coverage is sufficient.`,
    },
    {
      heading: 'Subagents have isolated context',
      body: `The most tested fact in this domain: **a subagent does not inherit the coordinator's conversation history.** It starts with its own system prompt (from its definition) and the prompt text the coordinator passes in the Task call, and nothing else. Subagents also do not share memory between invocations; a second call to the same subagent type starts clean.

Consequences:

- Anything the subagent needs must be **in the prompt**: the research question, prior findings, constraints, output format.
- A synthesis subagent that is told "synthesise the findings" without the findings will hallucinate or ask for them. Pass the complete search results and document analyses directly.
- Isolation is a feature. Each subagent works in a fresh, focused context window, so a 50-page document analysis does not consume the coordinator's budget. Only the subagent's final report returns to the coordinator.

This is also why the pattern scales: the coordinator holds summaries, the subagents hold the raw material.`,
    },
    {
      heading: 'Defining and invoking subagents in the Agent SDK',
      body: `In the Claude Agent SDK, subagents are declared with **\`AgentDefinition\`** entries in the \`agents\` option. Each has a \`description\` (used by the coordinator to decide when to delegate), a \`prompt\` (the subagent's system prompt), an optional \`tools\` list that restricts what it may call, and optionally a \`model\`.

The coordinator spawns a subagent by calling the built-in **\`Task\`** tool. For that to be possible, the coordinator's \`allowedTools\` **must include \`"Task"\`**. Forgetting this is the classic reason a "multi-agent" system quietly runs as a single agent: the coordinator cannot delegate, so it does everything itself.

To run subagents **in parallel**, the coordinator emits several Task tool calls **in one response**. Calls spread across separate turns run sequentially. Prompting the coordinator to "launch the search and document-analysis agents together" and giving it both inputs up front is what unlocks the latency win.

\`fork_session\` is a related mechanism: it branches a session from a shared analysis baseline so two approaches can be explored independently without re-doing the analysis (covered in Session State).`,
    },
    {
      heading: 'Passing context well: structure, completeness, goals',
      body: `Three practices make handoffs between agents reliable:

**Pass complete findings, not pointers.** The synthesis subagent should receive the actual search results and analysis outputs in its prompt. "See the earlier results" means nothing to an agent with fresh context.

**Separate content from metadata with structured data.** Each finding should be an object such as \`{claim, evidence, source_url, document, page, published}\`. Prose blends the source into the sentence and the synthesiser drops it; structured fields survive the hop and let the report cite correctly. This is how provenance is preserved across agents.

**Specify goals and quality criteria, not procedures.** "Find authoritative, recent sources on X; prefer primary data; flag disagreements between sources" lets the subagent adapt to what it finds. A rigid "run exactly these three queries" prevents it from following a promising lead and often produces worse coverage.

Finally, tell subagents what to return and in what shape. A coordinator that gets back a consistent JSON summary can aggregate mechanically; one that gets free text has to re-read everything.`,
    },
  ],
  examples: [
    {
      title: 'Coordinator with two parallel subagents (Python Agent SDK)',
      description:
        'The coordinator may only read files and delegate. Each subagent has its own prompt and tool set. The coordinator prompt asks for both searches in one response so they run concurrently.',
      language: 'python',
      code: `from claude_agent_sdk import query, ClaudeAgentOptions, AgentDefinition

options = ClaudeAgentOptions(
    allowed_tools=["Read", "Task"],              # Task is required to delegate
    agents={
        "web_searcher": AgentDefinition(
            description="Finds recent, authoritative web sources on a subtopic.",
            prompt="Return JSON findings: claim, evidence, source_url, published.",
            tools=["WebSearch", "WebFetch"],
        ),
        "doc_analyst": AgentDefinition(
            description="Extracts claims and evidence from provided documents.",
            prompt="Return JSON findings with document name and page number.",
            tools=["Read", "Grep"],
        ),
    },
)
prompt = ("Research battery recycling policy in the EU. Launch web_searcher and "
          "doc_analyst in the same response, then merge their JSON findings.")
async for msg in query(prompt=prompt, options=options):
    print(msg)`,
      takeaway: 'Declare subagents with AgentDefinition, include Task in the coordinator\'s tools, and ask for parallel delegation explicitly.',
    },
    {
      title: 'The mistake: assuming the synthesis agent can see earlier results',
      description:
        'A coordinator ran search and analysis, then invoked the synthesis subagent with the prompt "Synthesise the findings into a report." The synthesis agent, starting with empty context, produced a generic essay with invented citations. The fix was to serialise every finding into the prompt as structured JSON.',
      language: 'text',
      code: `# Before (subagent sees nothing)
Task(subagent="synthesizer", prompt="Synthesise the findings into a report.")

# After (complete findings, content separated from metadata)
Task(subagent="synthesizer", prompt=f"""
Synthesise these findings into a cited report. Keep source_url and page on every claim.
Findings (JSON):
{json.dumps(search_findings + doc_findings, indent=2)}
Quality criteria: note where sources disagree; do not merge conflicting figures.
""")`,
      takeaway: 'Subagents start with fresh context; everything they need must be in the prompt, preferably as structured data.',
    },
    {
      title: 'Selecting subagents instead of running the full pipeline',
      description:
        'Every query, including "What year did the EU Battery Regulation enter force?", went through search → analysis → synthesis → report, costing four subagent runs and 40 seconds. The coordinator prompt was changed to classify the query first: simple factual questions get a single search subagent and a direct answer; broad topics get the partitioned pipeline with distinct subtopics per searcher to avoid overlap.',
      language: 'markdown',
      code: `## Coordinator instructions (excerpt)
1. Classify the request: factual lookup | focused analysis | broad survey.
2. Factual lookup: one web_searcher call, answer directly with the citation.
3. Broad survey: split into 3-5 non-overlapping subtopics; assign one
   web_searcher per subtopic in a single response; assign doc_analyst only
   if documents were supplied.
4. After synthesis, list uncovered subtopics. If any, re-delegate targeted
   searches and re-run synthesis (max 2 rounds).`,
      takeaway: 'The coordinator should pick subagents based on query complexity, partition scope to avoid duplication, and iterate on gaps.',
    },
  ],
  keyPoints: [
    'Hub-and-spoke: all subagent communication routes through the coordinator for observability, consistent error handling and controlled information flow.',
    'Subagents have isolated context: they do not inherit the coordinator\'s history or share memory between invocations.',
    'Subagents are declared with AgentDefinition (description, prompt, tools, model) and spawned via the Task tool.',
    'The coordinator\'s allowedTools must include "Task" or it cannot delegate at all.',
    'Parallel subagents come from emitting multiple Task calls in a single coordinator response, not across turns.',
    'Pass complete findings in the prompt and use structured data to separate content from metadata so attribution survives.',
    'Coordinator prompts should state goals and quality criteria rather than step-by-step procedures.',
    'The coordinator should select which subagents to invoke per query, partition scope to avoid duplication, and run refinement loops to close coverage gaps.',
  ],
  flashcards: [
    { front: 'In hub-and-spoke orchestration, who do subagents communicate with?', back: 'Only the coordinator. Subagents never message each other directly.' },
    { front: 'Does a subagent inherit the coordinator\'s conversation history?', back: 'No. It starts with its AgentDefinition prompt plus whatever the coordinator puts in the Task prompt.' },
    { front: 'Which tool spawns a subagent in the Agent SDK?', back: 'The Task tool.' },
    { front: 'What must be present in the coordinator\'s allowedTools for delegation to work?', back: '"Task".' },
    { front: 'How do you make subagents run in parallel?', back: 'Have the coordinator emit multiple Task tool calls in one response.' },
    { front: 'What fields does an AgentDefinition carry?', back: 'description (when to use it), prompt (system prompt), optional tools restriction, optional model.' },
    { front: 'Why pass findings as structured JSON between agents?', back: 'To separate content from metadata (source URL, document, page) so attribution is preserved through synthesis.' },
    { front: 'Goals-based or procedure-based coordinator prompts?', back: 'Goals and quality criteria; procedures prevent subagents from adapting to what they find.' },
    { front: 'Name the three benefits of routing everything through the coordinator.', back: 'Observability, consistent error handling, controlled information flow.' },
    { front: 'What is the risk of overly narrow decomposition?', back: 'Subtopics assigned to subagents fail to cover the full question, producing incomplete research.' },
  ],
  quiz: [
    {
      question:
        'A research coordinator on the Agent SDK is configured with allowedTools ["Read", "WebSearch"] and three AgentDefinitions. In testing it never delegates; it performs all searches itself and produces thin reports. What is the MOST likely cause?',
      options: [
        'The subagent descriptions are too short for the coordinator to understand them.',
        '"Task" is missing from the coordinator\'s allowedTools, so it cannot spawn subagents.',
        'Subagents require a different model than the coordinator.',
        'WebSearch should be removed from the coordinator so it is forced to delegate.',
      ],
      correct: [1],
      explanation:
        'Delegation happens through the Task tool; without it in allowedTools the coordinator has no way to invoke subagents. Descriptions matter for choosing between subagents, not for enabling delegation. Model choice is independent. Removing WebSearch might reduce self-serving but still leaves the coordinator unable to delegate.',
    },
    {
      question:
        'The synthesis subagent in a research system produces reports whose citations do not match any source the search subagent found. The coordinator invokes it with "Write the final report from the research so far." What change fixes the root cause?',
      options: [
        'Increase the synthesis subagent\'s max_tokens so it has room for citations.',
        'Include the complete, structured findings (claim, evidence, source URL, date) directly in the synthesis prompt.',
        'Give the synthesis subagent the WebSearch tool so it can re-find sources.',
        'Add "do not hallucinate citations" to the subagent\'s system prompt.',
      ],
      correct: [1],
      explanation:
        'Subagents start with isolated context; "the research so far" is invisible to it, so it invents. Passing the findings as structured data solves it and preserves attribution. More tokens or an admonition do not supply the missing data, and giving it search duplicates work and invites a different set of sources.',
    },
    {
      question:
        'Which TWO practices improve context passing between coordinator and subagents? (Select two)',
      options: [
        'Pass complete prior findings in the subagent prompt rather than referring to them.',
        'Rely on the shared session memory so subagents can read earlier results.',
        'Use structured fields to separate content from metadata such as source URL and page number.',
        'Give every subagent the full coordinator conversation to be safe.',
      ],
      correct: [0, 2],
      explanation:
        'Complete findings and structured metadata are the two recommended practices. There is no shared memory between subagent invocations, and dumping the whole coordinator history defeats the purpose of isolated, focused context and bloats the subagent\'s window.',
    },
    {
      question:
        'A coordinator spawns the web search subagent, waits for it to finish, then in a new turn spawns the document analysis subagent. End-to-end latency is the sum of both. The two tasks are independent. What should change?',
      options: [
        'Merge the two subagents into one with both tool sets.',
        'Prompt the coordinator to emit both Task calls in a single response so they run concurrently.',
        'Use a faster model for the document analysis subagent.',
        'Have the search subagent call the analysis subagent directly when it finishes.',
      ],
      correct: [1],
      explanation:
        'Parallelism in the Agent SDK comes from multiple Task calls in one response. Merging the agents loses specialisation and tool scoping; a faster model only trims one leg; subagent-to-subagent calls break the hub-and-spoke model and remove the coordinator\'s visibility.',
    },
    {
      question:
        'A coordinator prompt reads: "Step 1: search for X. Step 2: search for Y. Step 3: summarise." Reports frequently miss important angles that surfaced during step 1. Which change best addresses this?',
      options: [
        'Add steps 4 to 8 covering more angles.',
        'Rewrite the prompt around research goals and quality criteria, and let the coordinator decide subtopics and re-delegate when gaps appear.',
        'Increase the number of search subagents to ten.',
        'Switch the subagents to a larger model.',
      ],
      correct: [1],
      explanation:
        'Procedural prompts prevent adaptation. Goal-and-criteria prompts with a refinement loop let the system follow what it discovers. More fixed steps or more agents without direction add cost but still cannot react to findings, and a larger model does not change a rigid plan.',
    },
    {
      question:
        'Why does the hub-and-spoke pattern route every subagent result through the coordinator instead of letting subagents hand off to one another?',
      options: [
        'Subagents cannot technically call tools, so only the coordinator can.',
        'It gives one point for logging, error handling and deciding what information each agent receives.',
        'It reduces the total number of tokens processed by the system.',
        'The Task tool only works when called by the top-level session.',
      ],
      correct: [1],
      explanation:
        'Centralisation buys observability, consistent error handling and controlled information flow. Subagents can call tools; the pattern is an architectural choice, not a technical limit. Token totals are not necessarily lower; the benefit is control, not cost.',
    },
  ],
  statements: [
    { text: 'Subagents automatically inherit the coordinator\'s conversation history when spawned.', isTrue: false, explanation: 'Subagent context is isolated. Everything it needs must be placed in the Task prompt.' },
    { text: 'The coordinator\'s allowedTools must include "Task" for it to spawn subagents.', isTrue: true, explanation: 'Task is the spawning mechanism; without it the coordinator cannot delegate.' },
    { text: 'Emitting several Task tool calls in one coordinator response runs those subagents in parallel.', isTrue: true, explanation: 'Calls in a single response run concurrently; calls across turns are sequential.' },
    { text: 'In hub-and-spoke orchestration, the search subagent should pass its results directly to the synthesis subagent to save a hop.', isTrue: false, explanation: 'All communication routes through the coordinator for observability, error handling and controlled information flow.' },
    { text: 'Two invocations of the same subagent type share memory of each other\'s work.', isTrue: false, explanation: 'Each invocation starts fresh. State must be carried by the coordinator and passed explicitly.' },
    { text: 'Structured findings with separate source fields help preserve attribution through synthesis.', isTrue: true, explanation: 'Separating content from metadata keeps source URL, document and page attached to each claim.' },
    { text: 'A good coordinator always runs every subagent in the pipeline so no query is under-served.', isTrue: false, explanation: 'The coordinator should select subagents based on query complexity; running the full pipeline for simple questions wastes tokens and time.' },
    { text: 'An AgentDefinition can restrict which tools a subagent may use.', isTrue: true, explanation: 'The tools field scopes each subagent to its role.' },
  ],
  resources: [
    { label: 'Subagents in the Agent SDK', url: 'https://platform.claude.com/docs/en/agent-sdk/subagents' },
    { label: 'How we built our multi-agent research system (Anthropic)', url: 'https://www.anthropic.com/engineering/built-multi-agent-research-system' },
    { label: 'Claude Code subagents', url: 'https://code.claude.com/docs/en/sub-agents' },
  ],
};
