import type { Concept } from '../../types';

export const retrievalStrategiesByDataShape: Concept = {
  id: 'retrieval-strategies-by-data-shape',
  title: 'Retrieval Strategies by Data Shape',
  summary:
    'Match the retrieval mechanism to the data (structured, unstructured, tabular, code) and the query pattern (lookup, aggregation, exploration): SQL and tools for structured data, vectors and hybrid search for text, long context for small stable corpora.',
  certs: ['ccar-p', 'ccdv-f', 'ccar-f'],
  domains: ['ccar-p-3', 'ccar-p-1', 'ccdv-f-2', 'ccdv-f-8', 'ccar-f-2'],
  tags: ['retrieval', 'data-shape', 'sql', 'tools', 'vector-search', 'long-context', 'code-search'],
  difficulty: 'advanced',
  sections: [
    {
      heading: 'Start from the data shape',
      body: `"Use RAG" is not a retrieval strategy. The right mechanism depends on what the data looks like:

| Data shape | Examples | Natural retrieval mechanism |
|---|---|---|
| Structured | Orders, customers, tickets in a database or API | Query by key or filter through a tool (SQL, REST); exact, authoritative, cheap |
| Tabular analytics | Sales by region, metrics over time | Aggregation through SQL or a query engine; the model writes or selects the query, code computes the numbers |
| Unstructured text | Policies, manuals, emails, contracts | Chunked vector plus lexical search with reranking (RAG), or long context for small corpora |
| Semi-structured | JSON records with free-text fields, tickets with descriptions | Filter on structured fields first, then semantic search within the filtered set |
| Code | Repositories | Symbol and text search (grep, ripgrep, language servers), file reads on demand, embeddings only as a secondary aid |
| Images and PDFs | Scanned forms, diagrams | Vision input directly; OCR to text for indexing |

The common error is forcing structured data through a vector index: embedding "Order 48213 shipped 2026-03-04 to Lyon" and hoping similarity search finds it. A key lookup is exact and free; a vector search is approximate and may return the wrong order. Give Claude a tool that queries the system of record.`,
    },
    {
      heading: 'Then the query pattern',
      body: `The same data can be asked different kinds of questions, and the mechanism should follow the question:

- **Lookup** ("What is the status of order 48213?"): exact retrieval by key through a tool. No embeddings involved.
- **Aggregation** ("How many orders shipped late last quarter by region?"): computed by a query engine. The model translates the question into SQL or selects a parameterised report tool; the numbers come from the database, never from the model's arithmetic. Validate generated SQL (read-only role, allow-listed tables, row limits, timeouts) before execution.
- **Semantic search** ("Which policies mention reimbursement for home-office equipment?"): vector plus lexical retrieval over chunks.
- **Exploration or synthesis** ("Summarise how our refund policy changed over the last three versions"): retrieve the relevant documents in full (or large sections) and let the model compare them; long context beats small chunks here.
- **Navigation in code** ("Where is the retry logic for payments?"): grep for symbols, read the files found, follow imports. This is how Claude Code works and why it does not need a vector index of the repository.

Most real assistants face a mix. Route by question type: a classifier or the model's own tool choice sends lookups to the database tool, aggregations to the query tool and semantic questions to the document index.`,
    },
    {
      heading: 'Tools and SQL instead of vectors',
      body: `When the authoritative data lives in a system of record, expose it through tools rather than copying it into an index:

- **Freshness.** A tool reads the current value; an index is as stale as its last refresh.
- **Authorisation.** The system of record enforces its permissions on each query when the user's identity is propagated; a copied index needs its own access control.
- **Exactness.** Keys, counts and sums are exact.
- **Cost.** No embedding or re-indexing pipeline to run.

Design tool interfaces around the questions users ask: \`get_order(order_id)\`, \`search_orders(customer_id, status, date_range)\`, \`report_late_shipments(quarter, region)\`. Prefer parameterised tools over free-form SQL where the question set is known; use a text-to-SQL tool with a read-only role, table allow-list and result limits where questions are open-ended. Return compact, structured results; a tool that dumps 10,000 rows into the context is a retrieval failure of a different kind.

For analytics, the pattern "model writes the query, code runs it, model explains the result" keeps arithmetic deterministic and lets you log and audit every query.`,
    },
    {
      heading: 'Long context instead of RAG, and the exam angle',
      body: `With 1M-token windows, a corpus of a few hundred pages fits in the prompt. Loading it whole in a cached prefix is often simpler and more accurate than chunking it, because the model sees every cross-reference and nothing is lost at chunk boundaries. Conditions where long context wins:

- The corpus is small enough to cache comfortably (tens to a few hundred thousand tokens) and stable (so the cache stays warm).
- Questions require synthesis across the corpus, not pinpoint lookup.
- Access control is uniform (everyone who uses the assistant may see everything loaded).

Conditions where RAG wins: large or fast-changing corpora, per-user access control, pinpoint questions where a few passages suffice, and cost-sensitive high volume where sending 200K tokens per question is wasteful even when cached.

**Contextual retrieval** sits between: chunks are enriched with document context before embedding so RAG behaves more like a reader who knows where each passage came from.

Exam items describe a data source and a question type and ask for the retrieval approach. Match shape and pattern: structured lookups and aggregations go to tools and SQL; unstructured semantic questions go to hybrid RAG; small stable corpora with synthesis questions go to long context; code goes to symbol search and file reads. Distractors embed everything in a vector store regardless, or ask the model to compute aggregates from retrieved rows.`,
    },
  ],
  examples: [
    {
      title: 'Routing by data shape in one assistant',
      description:
        'An operations assistant handles order status (structured lookup), shipment analytics (aggregation) and policy questions (unstructured). It exposes a key-lookup tool, a parameterised report tool backed by SQL, and a document search tool. Claude chooses the tool from the question; the application enforces read-only access and row limits.',
      language: 'python',
      code: `tools = [
    {"name": "get_order", "description": "Exact lookup of one order by id from the order system (authoritative, current).",
     "input_schema": {"type": "object", "properties": {"order_id": {"type": "string"}}, "required": ["order_id"]}},
    {"name": "late_shipments_report",
     "description": "Count late shipments by region for a quarter. Computed by the warehouse database, not estimated.",
     "input_schema": {"type": "object", "properties": {"quarter": {"type": "string"}, "region": {"type": "string"}},
                      "required": ["quarter"]}},
    {"name": "search_policies",
     "description": "Semantic + keyword search over current policy documents. Returns top passages with source and section.",
     "input_schema": {"type": "object", "properties": {"query": {"type": "string"}}, "required": ["query"]}},
]
resp = client.messages.create(model="claude-opus-5-5", max_tokens=1024, tools=tools,
                              system=OPS_PROMPT, messages=[{"role": "user", "content": question}])`,
      takeaway: 'Each data shape gets its natural mechanism behind a tool; the model routes by choosing the tool.',
    },
    {
      title: 'Mistake: aggregating from retrieved rows in the model',
      description:
        'A finance assistant answered "total refunds last month by product line" by vector-searching a table of refund records, retrieving 50 rows and summing them in the response. Totals were wrong because retrieval missed most rows and the model\'s sums drifted. The fix replaced the index with a text-to-SQL tool (read-only role, allow-listed views, 10,000-row cap) and a deterministic execution step; the model explains the result but never computes it.',
      language: 'python',
      code: `def run_report_sql(sql: str) -> dict:
    assert sql.lstrip().upper().startswith("SELECT"), "read-only"
    assert all(t in ALLOWED_VIEWS for t in referenced_tables(sql)), "table not allowed"
    with readonly_conn(timeout_s=10) as conn:
        rows = conn.execute(sql + " LIMIT 10000").fetchall()
    audit.log(sql=sql, rows=len(rows), user=ctx.subject)
    return {"columns": [c[0] for c in conn.description], "rows": rows[:200], "truncated": len(rows) > 200}`,
      takeaway: 'Aggregations are computed by the database; the model writes or selects the query and explains the output.',
    },
    {
      title: 'Long context for a small, stable regulatory corpus',
      description:
        'A compliance team answers questions over one 180-page regulation and its 40 pages of guidance, roughly 120,000 tokens, which changes twice a year. Questions are mostly comparative ("how does Article 12 interact with the guidance on retention?"). Loading the whole corpus in a cached prefix outperformed chunked RAG on their eval by 9 points and removed the indexing pipeline entirely.',
      takeaway: 'Small, stable corpora with synthesis questions favour long context in a cached prefix over RAG.',
    },
    {
      title: 'Code navigation without a vector index',
      description:
        'A platform team considered embedding their 2-million-line monorepo for a developer assistant. Instead they used Claude Code and the Agent SDK with Grep, Glob and Read: the assistant searches for symbols, reads the matching files and follows imports on demand. It found the payments retry logic in three tool calls, with no index to maintain and no staleness between commits.',
      takeaway: 'Code is navigated by symbol and text search plus on-demand reads; embeddings are at most a secondary aid.',
    },
  ],
  keyPoints: [
    'Choose the retrieval mechanism from the data shape (structured, tabular, unstructured, semi-structured, code, images) and the query pattern (lookup, aggregation, semantic search, synthesis, navigation).',
    'Structured lookups go to key-based tools; aggregations go to SQL or a query engine; the model never computes totals from retrieved rows.',
    'Expose systems of record through tools for freshness, authorisation, exactness and lower cost rather than copying them into a vector index.',
    'Validate generated SQL: read-only role, table allow-list, row limits, timeouts, audit log.',
    'Unstructured text uses hybrid vector plus lexical retrieval with reranking; semi-structured data filters on fields first, then searches semantically.',
    'Small, stable corpora with synthesis questions often do better in a cached long-context prefix than in chunked RAG.',
    'Code is navigated with symbol and text search and on-demand file reads (Claude Code, Agent SDK), not primarily with embeddings.',
    'Exam distractor: embedding everything in a vector store regardless of shape, or asking the model to aggregate.',
  ],
  flashcards: [
    { front: 'What mechanism fits a lookup like "status of order 48213"?', back: 'An exact key-based tool call against the system of record; no embeddings.' },
    { front: 'How should "late shipments by region last quarter" be answered?', back: 'The model writes or selects a SQL query; the database computes the aggregation; the model explains the result.' },
    { front: 'Four reasons to use tools over a copied vector index for systems of record?', back: 'Freshness, authorisation enforced by the source, exactness, no indexing pipeline cost.' },
    { front: 'What controls belong on a text-to-SQL tool?', back: 'Read-only role, allow-listed tables or views, row limits, timeouts, audit logging of every query.' },
    { front: 'When does long context beat RAG?', back: 'Small, stable corpus that caches well, synthesis questions across the corpus, uniform access control.' },
    { front: 'How is code best retrieved for an assistant?', back: 'Symbol and text search (grep), glob, on-demand file reads and following imports; embeddings are secondary.' },
    { front: 'What is the retrieval approach for semi-structured records with free-text fields?', back: 'Filter on structured fields first, then semantic search within the filtered set.' },
    { front: 'Why is embedding "Order 48213 shipped to Lyon" and vector-searching it a mistake?', back: 'Similarity search is approximate and may return the wrong order; a key lookup is exact and free.' },
    { front: 'What does contextual retrieval change about RAG chunks?', back: 'Chunks are enriched with a description of their document context before embedding, improving retrieval of passages that are meaningless alone.' },
  ],
  quiz: [
    {
      question:
        'A finance assistant answers "total refunds last month by product line" by vector-searching refund records, retrieving 50 rows and summing them. Totals are wrong. What is the BEST redesign?',
      options: [
        'Retrieve 500 rows instead of 50 so the sum is more complete.',
        'Replace the index with a validated text-to-SQL or parameterised report tool so the database computes the totals.',
        'Switch to a larger model for better arithmetic.',
        'Ask the model to show its working when summing.',
      ],
      correct: [1],
      explanation:
        'Aggregation is a database operation. More rows (1) still risks misses and model arithmetic; bigger models (3) and visible working (4) do not make retrieval complete or sums exact.',
    },
    {
      question:
        'A compliance team has a 120,000-token regulatory corpus that changes twice a year, with mostly comparative questions. Which approach BEST fits?',
      options: [
        'Chunk into 300-token pieces and use vector search.',
        'Load the corpus in a cached long-context prefix and append each question.',
        'Build a multi-agent system with one agent per chapter.',
        'Convert the regulation into a SQL database.',
      ],
      correct: [1],
      explanation:
        'Small, stable, synthesis-heavy corpora favour long context with caching. Chunking (1) loses cross-references; agents per chapter (3) multiply cost; regulations are not tabular data (4).',
    },
    {
      question: 'Which TWO are appropriate uses of tools rather than vector retrieval? (Select two)',
      options: [
        'Fetching the current status of a specific customer account.',
        'Finding which policies discuss home-office equipment reimbursement.',
        'Computing the number of tickets opened per region this week.',
        'Summarising the tone of recent customer emails.',
      ],
      correct: [0, 2],
      explanation:
        'Exact lookups and aggregations belong to tools and SQL. Semantic policy search (2) and tone summarisation over free text (4) are unstructured retrieval and generation tasks.',
    },
    {
      question:
        'A platform team proposes embedding a 2-million-line monorepo so a developer assistant can answer "where is the retry logic for payments?". Which alternative is MORE appropriate?',
      options: [
        'Embed only the README files.',
        'Use symbol and text search (Grep, Glob) with on-demand file reads, as Claude Code does, avoiding a stale index.',
        'Load the entire repository into the context window.',
        'Ask developers to document every function first.',
      ],
      correct: [1],
      explanation:
        'Code navigation is search plus reads, always current with the checkout. README-only (1) misses code; the whole repo (3) exceeds any window and budget; documentation first (4) is not a retrieval strategy.',
    },
    {
      question:
        'A text-to-SQL tool will be exposed to a Claude assistant. Which control set is MOST appropriate?',
      options: [
        'Full read-write database credentials so the assistant can fix data issues.',
        'A read-only role, allow-listed views, row limits, timeouts and an audit log of every query.',
        'No controls, because the system prompt forbids destructive queries.',
        'A prompt instruction to always add LIMIT 100.',
      ],
      correct: [1],
      explanation:
        'Enforced controls on the tool bound the blast radius. Read-write credentials (1) invite destructive actions; prompt-only controls (3, 4) are advisory.',
    },
  ],
  statements: [
    { text: 'Vector search is the appropriate retrieval mechanism for exact lookups of records by identifier.', isTrue: false, explanation: 'Key-based tool calls are exact and free; vector search is approximate.' },
    { text: 'For aggregation questions, the database should compute the numbers and the model should explain them.', isTrue: true, explanation: 'Model arithmetic over retrieved rows is incomplete and approximate.' },
    { text: 'A small, stable corpus with synthesis questions can be served better by a cached long-context prefix than by chunked RAG.', isTrue: true, explanation: 'The model sees all cross-references and nothing is lost at chunk boundaries.' },
    { text: 'Code repositories should primarily be retrieved through embeddings for best results.', isTrue: false, explanation: 'Symbol and text search with on-demand reads is primary; embeddings are at most secondary.' },
    { text: 'Exposing a system of record through a tool preserves its authorisation model when user identity is propagated.', isTrue: true, explanation: 'The source enforces permissions per query; a copied index would need its own access control.' },
    { text: 'Semi-structured records are best handled by semantic search alone, ignoring structured fields.', isTrue: false, explanation: 'Filter on structured fields first, then search semantically within the filtered set.' },
    { text: 'A text-to-SQL tool is safe as long as the system prompt forbids destructive statements.', isTrue: false, explanation: 'Enforce a read-only role, allow-lists, limits and audit logging; prompts are advisory.' },
  ],
  resources: [
    { label: 'Tool use overview (Claude docs)', url: 'https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview' },
    { label: 'Context windows (Claude docs)', url: 'https://platform.claude.com/docs/en/build-with-claude/context-windows' },
    { label: 'Introducing Contextual Retrieval (Anthropic)', url: 'https://www.anthropic.com/news/contextual-retrieval' },
  ],
};
