import type { Concept } from '../../types';

export const agentFrameworks: Concept = {
  id: 'agent-frameworks',
  title: 'Agentic Abstraction Frameworks',
  summary:
    'What frameworks such as Strands Agents, LangGraph and PydanticAI add on top of the raw API, what they cost in transparency and control, and when the SDK tool runner or a hand-written harness is the better choice.',
  certs: ['ccdv-f', 'ccar-p'],
  domains: ['ccdv-f-1', 'ccdv-f-2', 'ccar-p-1'],
  tags: ['agents', 'frameworks', 'langgraph', 'strands', 'pydanticai', 'tool-runner'],
  difficulty: 'intermediate',
  sections: [
    {
      heading: 'What a framework adds',
      body: `An agentic framework is a library that owns the loop and the plumbing around it so you write less glue code. The pieces they typically provide:

- **Loop and tool dispatch**: the request → \`tool_use\` → execute → \`tool_result\` cycle, with schemas generated from typed functions.
- **State and graph control**: explicit nodes, edges and conditional routing (LangGraph), or a simpler "agent with tools" object (Strands, PydanticAI).
- **Typed outputs**: validation of tool inputs and final results against Pydantic models or Zod schemas.
- **Provider abstraction**: a model interface that lets you swap Claude for another provider with minimal changes.
- **Operational extras**: persistence/checkpointing, retries, streaming helpers, tracing hooks, human-in-the-loop interrupts.

Three names appear in the Developer exam blueprint:

| Framework | Core idea | Notable traits |
|---|---|---|
| **Strands Agents** | Model-driven agent: give a model a prompt and tools and let it plan | Lightweight, AWS-origin, first-class Bedrock and Anthropic model support, MCP tool integration |
| **LangGraph** | Agents as explicit state graphs | Fine-grained control over control flow, persistence and checkpointing, human-in-the-loop interrupts |
| **PydanticAI** | Type-safe agents built on Pydantic | Dependency injection, validated structured results, strong typing for tools and outputs |

The Anthropic **SDK tool runner** sits in the same category at a smaller scale: it owns the loop and schema generation but adds no graph, state store or provider abstraction.`,
    },
    {
      heading: 'What a framework costs',
      body: `Anthropic's guidance on agents is cautious about frameworks: they make it easy to get started but add layers that **obscure the actual prompts and responses**, making debugging harder, and they tempt you to add complexity that a simpler design would not need.

Concrete costs:

- **Opacity.** When a tool is mis-selected or a prompt behaves oddly, you have to find what the framework actually sent. Many frameworks rewrite system prompts, inject their own tool descriptions, or serialize history in their own format.
- **Feature lag.** New API capabilities (a new stop reason, server tools, structured outputs, cache breakpoints, context editing) arrive in the Claude SDK first. A framework's provider adapter may expose them late or not at all.
- **Lowest-common-denominator abstractions.** Provider-neutral interfaces tend to model the intersection of providers, which drops Claude-specific features such as fine-grained cache control or \`pause_turn\` handling.
- **Hidden cost.** Automatic retries, re-planning loops and verbose default prompts consume tokens you did not budget for.
- **Dependency weight.** Upgrades can change behavior; some frameworks move fast and break APIs.

The recommended practice is to start by using the API directly (or the tool runner) so you understand the underlying loop, and to **read the framework's code** if you adopt one, so you know what it sends.`,
    },
    {
      heading: 'When a framework is the right call',
      body: `Frameworks earn their place when their abstractions match a real need:

- **Complex, branching control flow with persistence.** A multi-stage process that must survive restarts, pause for human approval and resume days later is what LangGraph's checkpointing and interrupts are built for. Hand-writing that is substantial work.
- **Strict typing across many tools and outputs.** PydanticAI's validated results and dependency injection reduce boilerplate in large, typed Python codebases.
- **Multi-provider requirements.** If the business requires running the same agent on several model providers, a provider abstraction (Strands, LangGraph, PydanticAI) is cheaper than maintaining parallel harnesses.
- **Team familiarity.** An organization already running a framework in production has tooling, tracing and expertise around it; consistency has value.

Frameworks are a poor fit when the agent is simple (a few tools, one loop), when you need the newest Claude features on day one, when debugging transparency is a priority, or when the task would be a plain workflow anyway. In those cases the tool runner or a short manual loop is less code and easier to reason about.

For architects: evaluate a framework the way you evaluate any dependency. What does it do that you would otherwise build? Can you see and control the prompts? How does it expose Claude-specific capabilities? What is the migration path if you remove it?`,
    },
    {
      heading: 'Hand-written harness vs framework: a decision sketch',
      body: `| Signal | Prefer |
|---|---|
| Fewer than ~5 tools, single loop | Tool runner or manual loop |
| Need \`pause_turn\`, cache breakpoints, context editing, new server tools now | Direct SDK |
| Durable state, resumable graphs, human interrupts across days | LangGraph or similar |
| Heavy Pydantic typing, DI, validated outputs | PydanticAI |
| Model-driven agent with minimal ceremony on AWS | Strands Agents |
| Must run on several providers | Any framework with provider abstraction |
| Coding/file agent with built-in tools | Claude Agent SDK (not a general framework) |

Whichever you pick, the underlying mechanics are unchanged: tools are described by name, description and JSON Schema; the model requests calls; something executes them and returns results; the loop ends on \`end_turn\`. The exam expects you to recognise that a framework is a convenience layer over this loop, and that debugging eventually requires looking at the raw requests it sends.`,
    },
  ],
  examples: [
    {
      title: 'The same agent, three ways',
      description:
        'A weather agent with one tool, sketched in the tool runner, Strands and PydanticAI. All three generate the schema from a typed function and run the loop; the difference is in what else the library brings.',
      language: 'python',
      code: `# Anthropic SDK tool runner
@beta_tool
def get_weather(city: str) -> str:
    """Current weather for a city. Args: city: City name."""
    return weather_api(city)
runner = client.beta.messages.tool_runner(model="claude-opus-5-5", max_tokens=1024,
    tools=[get_weather], messages=[{"role": "user", "content": "Weather in Oslo?"}])

# Strands Agents (sketch)
from strands import Agent, tool
@tool
def get_weather(city: str) -> str: ...
agent = Agent(model=anthropic_model, tools=[get_weather]); agent("Weather in Oslo?")

# PydanticAI (sketch)
from pydantic_ai import Agent
agent = Agent("anthropic:claude-opus-5-5")
@agent.tool_plain
def get_weather(city: str) -> str: ...
result = agent.run_sync("Weather in Oslo?")`,
      takeaway: 'Every framework is schema-from-signature plus a loop; choose by what else you need.',
    },
    {
      title: 'LangGraph for a resumable approval workflow',
      description:
        'A procurement agent drafts a purchase order, pauses for a manager\'s approval (which may take days), then submits. The pause-and-resume with durable state is exactly what a graph framework with checkpointing provides; writing it by hand would mean building a state store and resumption logic.',
      language: 'text',
      code: `draft_po --> [interrupt: manager approval] --> submit_po --> END
                     |
                     +--> (rejected) --> revise_po --> draft_po
State checkpointed after every node; resume by thread id.`,
      takeaway: 'Durable, human-interrupted graphs are where a framework\'s machinery pays for itself.',
    },
    {
      title: 'The mistake: debugging through three layers',
      description:
        'A team\'s framework-based agent kept calling the wrong tool. After two days they discovered the framework was prepending its own generic tool-usage instructions to the system prompt and rewriting their tool descriptions into a terse format. Logging the raw HTTP request to the Claude API revealed it in minutes. They kept the framework but added request logging and overrode the prompt template.',
      language: 'python',
      code: `import logging, httpx
# Log what actually reaches the API, regardless of framework
logging.basicConfig(level=logging.DEBUG)
logging.getLogger("httpx").setLevel(logging.DEBUG)
# or: pass a custom http_client with event hooks to anthropic.Anthropic(...)`,
      takeaway: 'Whatever layer you use, keep a way to see the exact prompt and tools the model received.',
    },
  ],
  keyPoints: [
    'Frameworks (Strands Agents, LangGraph, PydanticAI) own the loop, schema generation, state and often a provider abstraction.',
    'The SDK tool runner is the lightest member of the family: loop plus schemas, nothing else.',
    'Costs: obscured prompts, feature lag behind the Claude SDK, lowest-common-denominator abstractions, hidden token cost, dependency churn.',
    'Anthropic\'s advice: start with the API directly, understand the loop, and read the framework code if you adopt one.',
    'Frameworks fit durable branching workflows with human interrupts, heavy typing needs, multi-provider requirements and existing team expertise.',
    'For a few tools and one loop, the tool runner or a manual loop is simpler and more transparent.',
    'Always retain a way to log the raw requests the framework sends to the API.',
  ],
  flashcards: [
    { front: 'Which three frameworks does the Developer blueprint name?', back: 'Strands Agents, LangGraph, PydanticAI.' },
    { front: 'What is LangGraph\'s core abstraction?', back: 'Agents as explicit state graphs with nodes, edges, checkpointing and human-in-the-loop interrupts.' },
    { front: 'What distinguishes PydanticAI?', back: 'Type-safe agents built on Pydantic: validated structured outputs, typed tools, dependency injection.' },
    { front: 'What is Strands Agents\' approach?', back: 'A lightweight model-driven agent: prompt plus tools, the model plans; strong Bedrock/Anthropic and MCP integration.' },
    { front: 'What is the main debugging cost of a framework?', back: 'It obscures the actual prompts, tool descriptions and responses sent to the model.' },
    { front: 'Why can frameworks lag the Claude SDK?', back: 'New API features ship in the Anthropic SDK first; provider adapters expose them later or model only the cross-provider intersection.' },
    { front: 'When is a graph framework clearly worth it?', back: 'Durable, branching workflows that pause for human approval and resume later, needing persistence and checkpointing.' },
    { front: 'What does Anthropic recommend before adopting a framework?', back: 'Use the API directly first to understand the loop; if you adopt a framework, read its code to know what it sends.' },
    { front: 'How does the tool runner compare to a full framework?', back: 'It automates the loop and schema generation but adds no graph, state store or provider abstraction.' },
  ],
  quiz: [
    {
      question:
        'A team is building an agent with three internal tools and a single loop. They want the newest Claude features (server tools, context editing) as soon as they ship and need to see every prompt for debugging. What is the best fit?',
      options: [
        'LangGraph, for its control-flow features.',
        'The Anthropic SDK tool runner or a short manual loop.',
        'A multi-provider framework so they can switch models later.',
        'PydanticAI, for its typing.',
      ],
      correct: [1],
      explanation:
        'A small, single-loop agent needing day-one access to Claude features and full transparency is best served by the direct SDK. Frameworks (A, C, D) add layers and may lag on new features; multi-provider support is not a stated need.',
    },
    {
      question:
        'A procurement workflow must pause for a manager\'s approval, which can take days, then resume from the same state. Which choice directly addresses this?',
      options: [
        'A manual loop with a longer HTTP timeout.',
        'A graph framework with checkpointing and human-in-the-loop interrupts, such as LangGraph.',
        'The tool runner with max_iterations set very high.',
        'Prompt caching to keep the state warm.',
      ],
      correct: [1],
      explanation:
        'Durable state and resumable interrupts are what graph frameworks provide. Timeouts (A) and iteration caps (C) do not persist state across days, and caching (D) is about cost, not control flow.',
    },
    {
      question:
        'Which TWO are documented downsides of agent frameworks? (Select two)',
      options: [
        'They obscure the actual prompts and responses, making debugging harder.',
        'They prevent the use of tools entirely.',
        'They may lag behind the Claude SDK in exposing new API features.',
        'They force the use of a single model provider.',
      ],
      correct: [0, 2],
      explanation:
        'Opacity and feature lag are the standard costs. Frameworks do support tools (B is false) and most exist precisely to abstract across providers (D is false).',
    },
    {
      question:
        'An agent built on a framework repeatedly selects the wrong tool. The team\'s tool descriptions look clear. What should they do FIRST?',
      options: [
        'Switch to a larger model.',
        'Log the raw request sent to the Claude API to see the exact system prompt and tool definitions the framework produced.',
        'Add more tools so the model has more options.',
        'Increase the effort level.',
      ],
      correct: [1],
      explanation:
        'Frameworks can rewrite prompts and descriptions; inspecting what actually reaches the model is the diagnostic step. Model size and effort (A, D) do not fix a corrupted prompt, and more tools (C) worsens selection reliability.',
    },
    {
      question:
        'Which statement best describes the relationship between a framework and the Claude tool-use loop?',
      options: [
        'Frameworks replace the tool-use loop with a different protocol.',
        'Frameworks are convenience layers over the same request → tool_use → tool_result loop.',
        'Frameworks are required to use tools with Claude.',
        'Frameworks run the loop on Anthropic\'s servers.',
      ],
      correct: [1],
      explanation:
        'Every framework ultimately sends tool definitions and handles tool_use/tool_result blocks. They are not required (C), do not change the protocol (A), and run in your process (D).',
    },
  ],
  statements: [
    { text: 'Strands Agents, LangGraph and PydanticAI all generate tool schemas from typed function signatures.', isTrue: true, explanation: 'Schema-from-signature is common to the whole category, including the SDK tool runner.' },
    { text: 'Anthropic recommends starting with a framework so you never have to understand the raw API loop.', isTrue: false, explanation: 'The guidance is the opposite: start with the API directly, and read framework code if you adopt one.' },
    { text: 'LangGraph models agents as explicit state graphs with checkpointing.', isTrue: true, explanation: 'This is its distinguishing feature versus lighter "agent with tools" libraries.' },
    { text: 'Provider-neutral abstractions always expose every Claude-specific feature.', isTrue: false, explanation: 'They tend to model the intersection of providers and can drop features such as cache control or pause_turn handling.' },
    { text: 'The SDK tool runner provides durable state persistence across process restarts.', isTrue: false, explanation: 'The runner handles the loop in memory; persistence is a framework or application concern.' },
    { text: 'A framework can add hidden token cost through automatic retries and verbose default prompts.', isTrue: true, explanation: 'Budget for what the framework sends, not just what you wrote.' },
  ],
  resources: [
    { label: 'Building effective agents (Anthropic)', url: 'https://www.anthropic.com/research/building-effective-agents' },
    { label: 'Tool use overview (Claude docs)', url: 'https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview' },
  ],
};
