import type { Concept } from '../../types';

export const toolInterfaceDesign: Concept = {
  id: 'tool-interface-design',
  title: 'Tool Interface Design: Descriptions and Boundaries',
  summary:
    'Claude selects tools almost entirely from their names and descriptions. Minimal or overlapping descriptions cause misrouting; rich descriptions with input formats, examples, edge cases and "use this instead of X when..." boundaries fix it. Watch for system-prompt keywords that override good descriptions.',
  certs: ['ccar-f', 'ccdv-f', 'ccar-p'],
  domains: ['ccar-f-2', 'ccdv-f-8', 'ccar-p-3'],
  tags: ['tools', 'tool-descriptions', 'mcp', 'tool-selection', 'schema'],
  difficulty: 'foundations',
  diagram: 'tool-use-sequence',
  sections: [
    {
      heading: 'Descriptions are the selection mechanism',
      body: `When Claude decides which tool to call, it has three inputs: the tool's **name**, its **description**, and its **input schema** (including per-parameter descriptions). It cannot read your implementation. If two tools say "Retrieves customer information" and "Retrieves order details" and both accept a string identifier, the model has almost nothing to distinguish them, and selection becomes unreliable for any query that mentions both a customer and an order.

Anthropic's guidance is to treat the description as the most important part of the definition and to write it for a capable new colleague who has never seen your system. A strong description covers:

- **What it does and returns** (fields, shape, size).
- **Input formats** it accepts, with examples ("order ids look like ORD-123456; also accepts the 12-digit numeric form").
- **Example queries** that should route here ("check my order #12345", "where is my package").
- **Edge cases** ("returns an empty list, not an error, when the customer has no orders").
- **Boundaries**: when to use it versus similar tools ("use get_customer for account-level data such as email or tier; use this tool for anything about a specific purchase").

The exam's sample question makes the point: when selection is wrong and the descriptions are one line each, expanding the descriptions is the correct *first* step, ahead of few-shot examples, routing layers or merging the tools.`,
    },
    {
      heading: 'Overlap causes misrouting',
      body: `Misrouting is usually a description problem, not a model problem. Two patterns dominate:

**Near-identical descriptions.** \`analyze_content\` and \`analyze_document\` both described as "analyses text and returns insights" will be chosen interchangeably. Fix by making the purpose and domain explicit in both the name and description: rename \`analyze_content\` to \`extract_web_results\` with a web-specific description ("parses search engine result pages into title, URL, snippet, date"), and give \`analyze_document\` a document-specific one.

**One generic tool doing many jobs.** A single \`analyze_document(mode: str)\` with modes "extract", "summarize", "verify" forces the model to pick a mode through a parameter the description barely explains. Split it into **purpose-specific tools with defined contracts**: \`extract_data_points\` (returns \`[{field, value, page}]\`), \`summarize_content\` (returns a bounded summary), \`verify_claim_against_source\` (takes a claim and returns \`{supported: bool, evidence, page}\`). Each description now says exactly one thing, and each output shape is predictable for the consumer.

Names matter too. Specific verbs and objects (\`lookup_order\`, \`process_refund\`) beat vague ones (\`get_data\`, \`handle\`). Avoid abbreviations the model must decode.`,
    },
    {
      heading: 'System-prompt wording can override good descriptions',
      body: `Tool selection does not happen in isolation; the system prompt is in context too, and the model is **keyword-sensitive**. If the system prompt says "Always start by searching for the customer", the model may associate the word *search* with a \`web_search\` tool and call it for customer lookups even though \`get_customer\`'s description is excellent. If it says "analyse the document carefully", a tool named \`analyze_document\` becomes a magnet regardless of what the user asked.

When you see misrouting that good descriptions do not fix, **review the system prompt for keyword-sensitive instructions** that create unintended tool associations. Rewrite them to use the tool names explicitly ("verify identity with get_customer") or neutral language that does not echo another tool's name.

The same sensitivity applies to parameter names. A parameter called \`query\` invites free-text search strings; one called \`order_id\` invites an identifier.`,
    },
    {
      heading: 'Schemas, strictness and the exam angle',
      body: `The input schema is a contract. Give each property a description, use enums for closed sets, mark required fields, and describe formats. Setting \`strict: true\` on a tool makes the API guarantee that the arguments Claude emits match the schema exactly, which removes a whole class of malformed-call bugs. With \`tool_choice\` left on \`auto\` (forced \`any\`/\`tool\` is rejected on the newest models), a strict schema plus a prompt that states the expectation is the current pattern for reliable calls.

For the exam, expect scenarios where a support agent calls the wrong tool, a research system misroutes between analysis tools, or a developer agent prefers a built-in over an MCP tool. The ladder of fixes, cheapest first:

1. Expand and differentiate the descriptions (inputs, examples, edge cases, boundaries).
2. Rename to remove overlap; split generic tools into purpose-specific ones.
3. Review the system prompt for keyword collisions.
4. Reduce the tool set per agent (covered in tool distribution).

Few-shot examples of tool selection, routing classifiers and merging tools are heavier interventions that come after the descriptions are right.`,
    },
  ],
  examples: [
    {
      title: 'From minimal to differentiated descriptions',
      description:
        'The agent kept calling get_customer for "check my order #12345". Both descriptions were one line. The rewritten lookup_order description states its input formats, example queries, edge cases and boundary with get_customer.',
      language: 'json',
      code: `{
  "name": "lookup_order",
  "description": "Retrieve one order's status, items, shipping events and payment summary. Input: an order id such as ORD-123456 or the 12-digit numeric form; if only a customer id is known, pass it to list that customer's recent orders instead. Use for questions about a specific purchase: 'check my order #12345', 'where is my package', 'was I charged for order 9981'. Returns {order_id, status, items[], shipments[], charges[]}. Returns an empty orders list (not an error) when nothing matches. Do NOT use for account-level data (email, tier, address): use get_customer for that.",
  "input_schema": {
    "type": "object",
    "properties": {
      "order_id": {"type": "string", "description": "ORD-xxxxxx or 12 digits"},
      "customer_id": {"type": "string", "description": "Verified id from get_customer; lists recent orders"}
    }
  },
  "strict": true
}`,
      takeaway: 'Inputs, example queries, edge cases and an explicit boundary with the similar tool make selection reliable.',
    },
    {
      title: 'The mistake: two analysis tools with the same description',
      description:
        'A research system had analyze_content ("Analyses text content") and analyze_document ("Analyses document content"). Web results were sent to the document tool and PDFs to the content tool about half the time. Renaming analyze_content to extract_web_results with a web-specific description, and splitting analyze_document into three purpose-specific tools, removed the ambiguity.',
      language: 'text',
      code: `Before
  analyze_content   "Analyses text content"
  analyze_document  "Analyses document content"

After
  extract_web_results           "Parses web search result pages into {title, url, snippet, date}.
                                 Input: raw HTML or text of a results page. Web only."
  extract_data_points           "Pulls named facts/figures from a supplied document -> [{field, value, page}]"
  summarize_content             "Bounded summary (<= N words) of a supplied document"
  verify_claim_against_source   "Given a claim and a document, returns {supported, evidence, page}"`,
      takeaway: 'Eliminate functional overlap by renaming and by splitting generic tools into single-purpose tools with defined outputs.',
    },
    {
      title: 'A system-prompt keyword that hijacked routing',
      description:
        'After the descriptions were fixed, the support agent still occasionally called web_search when asked about a customer. The system prompt said "Begin every conversation by searching for the customer\'s record." The word "searching" pulled in the search tool. Rewording to name the tool fixed the last of the misrouting.',
      language: 'markdown',
      code: `<!-- Before -->
Begin every conversation by searching for the customer's record.

<!-- After -->
Begin every conversation by verifying identity with the get_customer tool.
Use web_search only for public shipping-carrier status pages.`,
      takeaway: 'Audit the system prompt for words that echo other tool names; name the intended tool explicitly.',
    },
  ],
  keyPoints: [
    'Claude selects tools from names, descriptions and schemas; the description is the primary selection mechanism.',
    'Good descriptions include what the tool returns, accepted input formats, example queries, edge cases and when to use it versus similar tools.',
    'Near-identical descriptions (analyze_content vs analyze_document) cause misrouting; rename and differentiate.',
    'Split generic multi-mode tools into purpose-specific tools with defined input/output contracts.',
    'System-prompt wording is keyword-sensitive and can override well-written descriptions; name tools explicitly.',
    'Expanding descriptions is the cheapest, highest-leverage first fix for selection problems, ahead of few-shot examples, routers or merging tools.',
    'strict: true guarantees schema-valid arguments; combine with tool_choice auto and prompt steering on current models.',
  ],
  flashcards: [
    { front: 'What does Claude use to decide which tool to call?', back: 'The tool name, description and input schema (including parameter descriptions). It cannot see the implementation.' },
    { front: 'Five things a strong tool description should include.', back: 'What it does/returns, accepted input formats, example queries, edge cases, and boundaries versus similar tools.' },
    { front: 'Two tools have near-identical descriptions and are chosen interchangeably. First fix?', back: 'Rename and rewrite the descriptions so each states a distinct purpose, domain and boundary.' },
    { front: 'How do you fix a generic analyze_document tool with several modes?', back: 'Split it into purpose-specific tools such as extract_data_points, summarize_content and verify_claim_against_source, each with a defined output.' },
    { front: 'Why might a well-described get_customer tool still lose to web_search?', back: 'A keyword-sensitive system prompt ("start by searching for the customer") creates an unintended association with the search tool.' },
    { front: 'Where does "expand the descriptions" sit relative to few-shot examples and routing layers?', back: 'First. It is the lowest-effort, highest-leverage fix; the others are heavier and come later.' },
    { front: 'What does strict: true on a tool guarantee?', back: 'That the arguments Claude emits conform exactly to the input schema.' },
    { front: 'Why should an empty result be described in the tool description?', back: 'So the model treats "no matches" as a successful query rather than an error to retry.' },
    { front: 'Good name or bad: get_data?', back: 'Bad. Use specific verbs and objects such as lookup_order or process_refund.' },
  ],
  quiz: [
    {
      question:
        'Logs show the support agent frequently calls get_customer when users ask "check my order #12345" instead of lookup_order. Both tools have one-line descriptions and accept similar identifiers. What is the most effective FIRST step?',
      options: [
        'Add five to eight few-shot examples of correct tool selection to the system prompt.',
        'Expand each description to include input formats, example queries, edge cases and when to use it versus the other tool.',
        'Add a keyword-based routing layer that pre-selects the tool before each turn.',
        'Merge both into a single lookup_entity tool.',
      ],
      correct: [1],
      explanation:
        'Descriptions are the primary selection mechanism and these are minimal, so enriching them addresses the root cause cheaply. Few-shot examples add tokens without fixing the definitions; a routing layer bypasses the model\'s understanding and is over-engineered for a first step; merging is a larger redesign.',
    },
    {
      question:
        'A research system has analyze_content and analyze_document with nearly identical descriptions. Web search results are often sent to the wrong one. Which change best resolves it?',
      options: [
        'Instruct the coordinator to alternate between the two tools.',
        'Rename analyze_content to extract_web_results with a web-specific description and give analyze_document a document-specific one.',
        'Remove analyze_document and route everything through analyze_content.',
        'Increase the model\'s effort level so it reads descriptions more carefully.',
      ],
      correct: [1],
      explanation:
        'Overlap is the cause; distinct names and domain-specific descriptions remove it. Alternating is arbitrary, removing a tool loses capability, and effort does not create distinguishing information that is absent from the definitions.',
    },
    {
      question: 'Which TWO elements belong in a high-quality tool description? (Select two)',
      options: [
        'Example user queries that should route to this tool.',
        'The implementation language of the tool\'s backend.',
        'An explanation of when to use this tool versus a similar one.',
        'The internal database table the tool reads from.',
      ],
      correct: [0, 2],
      explanation:
        'Example queries and boundaries directly improve selection. Implementation language and table names are irrelevant to the model\'s decision and add noise.',
    },
    {
      question:
        'After rewriting all tool descriptions, an agent still calls web_search when asked about customer accounts. The system prompt says "Always begin by searching for the customer." What is the most likely cause and fix?',
      options: [
        'The descriptions are still too short; add more detail.',
        'The system prompt\'s keyword "searching" creates an association with web_search; reword it to name get_customer explicitly.',
        'web_search should be removed from all agents.',
        'The model needs few-shot examples of account questions.',
      ],
      correct: [1],
      explanation:
        'Keyword-sensitive system-prompt wording can override good descriptions. Naming the intended tool fixes it. Removing web_search loses a needed capability; more description or examples do not address the prompt collision.',
    },
    {
      question:
        'A team wants to make analyze_document more reliable. It currently takes a mode parameter ("extract" | "summarize" | "verify") and returns free text. What is the best redesign?',
      options: [
        'Keep one tool but add a longer description of the mode parameter.',
        'Split it into extract_data_points, summarize_content and verify_claim_against_source, each with a defined output schema.',
        'Replace it with a Bash tool that runs a script.',
        'Set tool_choice to force analyze_document on every turn.',
      ],
      correct: [1],
      explanation:
        'Purpose-specific tools with defined contracts make both selection and downstream consumption predictable. A longer mode description still hides three behaviours behind one entry point; a Bash tool is less inspectable; forcing the tool is both unavailable on current models and unrelated to the ambiguity.',
    },
  ],
  statements: [
    { text: 'Claude chooses tools primarily from their names and descriptions, not from their implementation.', isTrue: true, explanation: 'The model never sees the code; the definition is all it has.' },
    { text: 'A one-line description is sufficient as long as the schema is complete.', isTrue: false, explanation: 'Minimal descriptions cause unreliable selection among similar tools; include inputs, examples, edge cases and boundaries.' },
    { text: 'Splitting a generic tool into several purpose-specific tools can improve selection reliability.', isTrue: true, explanation: 'Each tool then has a single, clearly described job and a defined output contract.' },
    { text: 'System-prompt wording has no effect on which tool Claude selects.', isTrue: false, explanation: 'The model is keyword-sensitive; prompt words that echo a tool name can create unintended associations.' },
    { text: 'Adding few-shot tool-selection examples is the recommended first fix for misrouting between two minimally described tools.', isTrue: false, explanation: 'Expanding the descriptions is the first step; few-shot examples are a heavier intervention that comes later.' },
    { text: 'Describing that a tool returns an empty list rather than an error when nothing matches helps the agent avoid pointless retries.', isTrue: true, explanation: 'Edge-case documentation lets the model distinguish a valid empty result from a failure.' },
    { text: 'strict: true guarantees that tool arguments conform to the declared input schema.', isTrue: true, explanation: 'This removes malformed-argument bugs and pairs well with tool_choice auto on current models.' },
  ],
  resources: [
    { label: 'Tool use overview: best practices for tool definitions', url: 'https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview' },
    { label: 'Writing tools for agents (Anthropic engineering)', url: 'https://www.anthropic.com/engineering/writing-tools-for-agents' },
    { label: 'MCP tools specification', url: 'https://modelcontextprotocol.io/specification/latest/server/tools' },
  ],
};
