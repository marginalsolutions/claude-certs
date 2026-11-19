import type { Concept } from '../../types';

export const ragPipelineDesign: Concept = {
  id: 'rag-pipeline-design',
  title: 'RAG Pipeline Design',
  summary:
    'Design retrieval-augmented generation end to end: chunking strategy, metadata, embeddings and indexes, hybrid search and reranking, freshness and re-indexing, citations, and diagnosing the classic failure of confident wrong answers after a document refresh.',
  certs: ['ccar-p', 'ccdv-f', 'ccar-f'],
  domains: ['ccar-p-3', 'ccar-p-4', 'ccdv-f-2', 'ccdv-f-6', 'ccar-f-5'],
  tags: ['rag', 'retrieval', 'chunking', 'embeddings', 'reranking', 'citations', 'indexing'],
  difficulty: 'advanced',
  diagram: 'rag-pipeline',
  sections: [
    {
      heading: 'The pipeline and where it breaks',
      body: `RAG has two halves. **Offline**: ingest documents, split them into chunks, enrich with metadata, embed, and write to an index. **Online**: take the query, retrieve candidate chunks, rerank, assemble the prompt with the chosen passages, generate with citations, and validate.

Most RAG failures are retrieval failures, not generation failures. If the right passage is not in the prompt, no model can answer correctly, and a capable model will often produce a fluent, confident answer anyway. That is why the official sample question points at retrieval and indexing when a RAG system starts returning confident but wrong answers right after a document refresh while model and latency are unchanged: the generation side did not change; the data feeding it did.

Design the pipeline so each half is independently testable. Retrieval has its own metrics (recall@k, precision@k, mean reciprocal rank on a labelled query set); generation has its own (faithfulness to the passages, citation accuracy, answer correctness). When quality drops, these metrics tell you which half moved.`,
    },
    {
      heading: 'Chunking, overlap and metadata',
      body: `Chunking decides what a retrievable unit is. Three families:

| Strategy | How | Strengths | Weaknesses |
|---|---|---|---|
| Fixed-size | N tokens with overlap | Simple, predictable size | Splits mid-thought; ignores structure |
| Structural | By headings, paragraphs, sections, table boundaries | Preserves meaning units; good for manuals and policies | Variable size; needs parsers per format |
| Semantic | Split where topic shifts (embedding similarity between sentences) | Coherent chunks for narrative text | Costly to compute; less predictable |

Guidelines: match chunk size to query shape (short factual questions favour 200–500 token chunks; synthesis favours larger or parent-child retrieval where a small chunk is matched but its parent section is returned). Use 10–20% overlap on fixed-size chunking so sentences at boundaries are not lost. Keep tables and code blocks intact.

**Contextual retrieval** improves chunk quality: prepend a short, model-generated description of where the chunk sits in its document ("This section of the 2026 travel policy covers reimbursement limits for international flights") before embedding. It materially reduces retrieval failures for chunks that are meaningless out of context, at a one-time cost that caching makes cheap.

**Metadata** (source, section, document version, effective date, access level, language) is as important as the text. It enables filtering (only current policies; only documents this user may see), freshness ranking and citations.`,
    },
    {
      heading: 'Embeddings, indexes, hybrid search and reranking',
      body: `**Embeddings** turn text into vectors for similarity search. Two rules architects forget: the embedding model used at query time must be the same (same model, same version, same preprocessing) as at index time, and changing it requires re-embedding the whole corpus. A mismatch produces an index that "works" but returns irrelevant chunks, which is the most common cause of the confident-wrong-answer regression after a refresh.

**Hybrid search** combines dense vectors with lexical (BM25) search. Vectors capture meaning; lexical search catches exact identifiers, part numbers, error codes and rare terms that embeddings blur. Fuse the two result lists (reciprocal rank fusion is common) before reranking. For most enterprise corpora hybrid beats either alone.

**Reranking** takes the top 20–100 candidates and rescores them against the query with a cross-encoder or a small model, then sends the top few to Claude. It raises precision at low cost and lets you keep retrieval recall high without stuffing the prompt.

**Index operations**: version the index; rebuild atomically and swap, rather than mutating in place; keep the previous version for rollback; run a retrieval eval against the labelled query set before promoting a new index. Access control belongs in the retrieval filter, not in the prompt.`,
    },
    {
      heading: 'Freshness, citations and the official sample',
      body: `**Freshness.** Documents change. Decide the re-indexing cadence by how fast the source changes and how costly staleness is: event-driven re-indexing for policies and prices, nightly for knowledge articles, weekly for archives. Track document version and effective date in metadata, filter out superseded versions, and expose "last indexed" so operators can see lag. Invalidate or re-embed only the changed documents where the index supports it.

**Citations.** Claude supports citations natively: pass sources as \`document\` or \`search_result\` content blocks with \`citations: {enabled: true}\` and the response carries citation blocks that point at the exact passages used. Citations make answers auditable, let the UI link to sources and allow a deterministic check: a claim without a supporting citation is flagged. Do not send Claude's own cited text back as user content with citation arrays attached; strip citations when replaying.

**The official sample.** A RAG system suddenly returns confident but incorrect answers after a document refresh; latency and model version are unchanged. The first place to investigate is the retrieval and indexing step: a broken re-index, mismatched embedding model, lost metadata filters, or stale chunks being served. Model weights do not silently change; sampling parameters are not accepted on current models and would not be triggered by a refresh; the context window did not shrink. Retrieval metrics on the labelled query set confirm the diagnosis in minutes.`,
    },
  ],
  examples: [
    {
      title: 'Generation with native citations over retrieved passages',
      description:
        'A benefits assistant retrieves the top passages with hybrid search and reranking, then passes them as search_result blocks with citations enabled. The response carries citation blocks that the UI renders as links, and a validation step flags any answer sentence with no citation.',
      language: 'python',
      code: `passages = rerank(query, hybrid_search(query, k=40), top_n=6)   # filter: current versions, user's access level

content = [
    {"type": "search_result", "source": p.url, "title": p.title,
     "content": [{"type": "text", "text": p.text}],
     "citations": {"enabled": True}}
    for p in passages
] + [{"type": "text", "text": question}]

resp = client.messages.create(
    model="claude-opus-5-5", max_tokens=800,
    system="Answer only from the provided search results. If they do not contain the answer, say so.",
    messages=[{"role": "user", "content": content}],
)
cited = [b for b in resp.content if b.type == "text" and getattr(b, "citations", None)]
if not cited:
    flag_for_review(question, resp)       # confident answer with no grounding`,
      takeaway: 'Retrieve wide, rerank narrow, cite natively, and verify grounding deterministically.',
    },
    {
      title: 'The official sample: confident wrong answers after a refresh',
      description:
        'A compliance knowledge base was re-indexed overnight. In the morning the assistant answered fluently but wrongly; p95 latency and the model id were unchanged. Retrieval recall@5 on the labelled query set had fallen from 0.91 to 0.34. The ingestion job had been upgraded to a new embedding model version while the query path still used the old one, so vectors were incompatible. Rolling back the index and pinning the embedding model version in both paths fixed it.',
      takeaway: 'Confident-but-wrong after a document refresh means retrieval is feeding the model bad context; check the index and embedding consistency first.',
    },
    {
      title: 'Mistake: fixed-size chunks that split tables and policies',
      description:
        'An insurer chunked policy PDFs into 512-token windows without overlap. Coverage tables were split across chunks, so questions about limits retrieved half a table and the model inferred the rest. Switching to structural chunking (sections and whole tables), adding 15% overlap for narrative text, and prepending contextual descriptions raised answer accuracy from 78% to 94%.',
      takeaway: 'Chunk along document structure, keep tables whole, and give chunks context so they mean something in isolation.',
    },
    {
      title: 'Access control in the retrieval filter',
      description:
        'A multi-tenant HR assistant initially relied on the prompt: "Only use documents belonging to the user\'s company." A retrieval eval with cross-tenant queries showed leaked passages in 4% of cases before the prompt even ran. The fix applied a tenant and access-level filter inside the vector and lexical queries so unauthorised chunks are never retrieved.',
      takeaway: 'Authorisation belongs in the retrieval query, not in the prompt.',
    },
  ],
  keyPoints: [
    'RAG has an offline half (ingest, chunk, enrich, embed, index) and an online half (retrieve, rerank, assemble, generate, validate); test each independently.',
    'Most RAG failures are retrieval failures; a capable model answers confidently from bad context.',
    'Chunk along structure, keep tables and code intact, use 10–20% overlap for fixed-size chunks, and consider contextual retrieval.',
    'Metadata (version, effective date, access level) enables filtering, freshness and citations; access control goes in the retrieval filter.',
    'Query-time and index-time embedding models must match exactly; changing the model requires re-embedding everything.',
    'Hybrid search (vectors plus BM25) with reranking beats either alone on enterprise corpora.',
    'Version indexes, rebuild atomically, keep rollback, and gate promotion on retrieval metrics (recall@k, MRR).',
    'After a document refresh, confident wrong answers with unchanged model and latency point at retrieval and indexing first.',
  ],
  flashcards: [
    { front: 'What are the two halves of a RAG pipeline?', back: 'Offline: ingest, chunk, enrich with metadata, embed, index. Online: retrieve, rerank, assemble prompt, generate with citations, validate.' },
    { front: 'Why do RAG systems produce confident wrong answers?', back: 'The right passage was not retrieved, and a capable model answers fluently from whatever context it was given.' },
    { front: 'Three chunking strategies?', back: 'Fixed-size with overlap, structural (headings, sections, tables), semantic (split at topic shifts).' },
    { front: 'What is contextual retrieval?', back: 'Prepending a short model-generated description of the chunk\'s place in its document before embedding, so the chunk is meaningful in isolation.' },
    { front: 'Why must the embedding model match between index time and query time?', back: 'Vectors from different models or versions are incompatible; the index returns irrelevant chunks while appearing to work.' },
    { front: 'What does hybrid search add over pure vector search?', back: 'Lexical (BM25) matching of exact identifiers, codes and rare terms that embeddings blur; results are fused before reranking.' },
    { front: 'What is reranking for?', back: 'Rescoring the top 20–100 candidates against the query so only the most relevant few are sent to the model, raising precision without lowering recall.' },
    { front: 'How are citations enabled in the Claude API?', back: 'Pass sources as document or search_result blocks with citations: {enabled: true}; the response includes citation blocks pointing to the passages used.' },
    { front: 'Official sample: RAG returns confident wrong answers after a document refresh, model and latency unchanged. First place to look?', back: 'The retrieval and indexing step: broken re-index, mismatched embeddings, lost metadata filters or stale chunks.' },
    { front: 'Where should tenant access control be enforced in RAG?', back: 'In the retrieval filter (vector and lexical queries), not in the prompt.' },
  ],
  quiz: [
    {
      question:
        'A RAG system suddenly returns confident but incorrect answers after a document refresh, while latency and model version are unchanged. What is the MOST likely first place to investigate?',
      options: [
        'The model weights have silently changed.',
        'The retrieval/indexing step is returning irrelevant or stale chunks.',
        'The temperature setting is too low.',
        'The context window has shrunk.',
      ],
      correct: [1],
      explanation:
        'Confident-but-wrong answers right after a refresh point to retrieval feeding bad context (broken re-index, mismatched embeddings). Weights do not silently change, temperature is not accepted on current models and is unrelated to a refresh, and context windows do not shrink.',
    },
    {
      question:
        'Retrieval recall@5 dropped from 0.91 to 0.34 after an ingestion-job upgrade. The query path was not changed. What is the MOST likely cause?',
      options: [
        'The reranker is too aggressive.',
        'The ingestion job now embeds with a different embedding model version than the query path uses.',
        'The chunks are too large for the model.',
        'Users started asking harder questions overnight.',
      ],
      correct: [1],
      explanation:
        'Embedding mismatch between index and query time produces exactly this silent collapse. Reranking (1) acts after retrieval; chunk size (3) and question difficulty (4) would not change recall overnight on the same labelled set.',
    },
    {
      question: 'Which TWO practices improve retrieval quality on an enterprise policy corpus? (Select two)',
      options: [
        'Hybrid search combining vector and lexical results, followed by reranking.',
        'Fixed 512-token chunks with no overlap that split tables when necessary.',
        'Structural chunking that keeps sections and tables intact, with contextual descriptions prepended.',
        'Sending all 100 candidate chunks to the model to maximise recall.',
      ],
      correct: [0, 2],
      explanation:
        'Hybrid search plus reranking and structure-aware, contextualised chunking are best practice. Splitting tables (2) destroys meaning; sending 100 chunks (4) bloats the prompt and dilutes attention.',
    },
    {
      question:
        'A multi-tenant assistant leaks passages from other tenants in 4% of retrieval evals despite a prompt instruction to use only the user\'s documents. What is the BEST fix?',
      options: [
        'Strengthen the prompt instruction.',
        'Apply tenant and access-level filters inside the retrieval queries so unauthorised chunks are never retrieved.',
        'Ask the model to cite sources so leaks are visible.',
        'Reduce the number of retrieved chunks.',
      ],
      correct: [1],
      explanation:
        'Authorisation is enforced at retrieval, not by instruction. Prompting (1) is advisory; citations (3) reveal but do not prevent leaks; fewer chunks (4) reduces but does not eliminate the problem.',
    },
    {
      question:
        'A team wants auditable answers with links to the exact source passages. Which approach uses the platform most directly?',
      options: [
        'Ask the model to include URLs in its prose.',
        'Pass sources as document or search_result blocks with citations enabled and render the returned citation blocks.',
        'Log the retrieved chunks and let auditors match them manually.',
        'Append the full source text after each answer.',
      ],
      correct: [1],
      explanation:
        'Native citations return structured pointers to passages. Prose URLs (1) can be hallucinated; manual matching (3) does not scale; appending full text (4) is not a citation.',
    },
    {
      question: 'Which index-management practice BEST protects production quality during re-indexing?',
      options: [
        'Mutate the live index in place as documents change.',
        'Build the new index version separately, run the retrieval eval against the labelled query set, then swap atomically with rollback available.',
        'Re-index only when users complain.',
        'Disable retrieval during re-indexing and let the model answer from memory.',
      ],
      correct: [1],
      explanation:
        'Versioned, eval-gated, atomic swaps prevent silent regressions. In-place mutation (1) and complaint-driven refresh (3) invite staleness and breakage; answering from memory (4) causes hallucination.',
    },
  ],
  statements: [
    { text: 'Most RAG quality failures originate in generation rather than retrieval.', isTrue: false, explanation: 'Most originate in retrieval; a capable model answers confidently from whatever context it receives.' },
    { text: 'The embedding model used at query time must match the one used at index time.', isTrue: true, explanation: 'Mismatched vectors produce an index that appears to work but returns irrelevant chunks.' },
    { text: 'Hybrid search fuses dense vector results with lexical (BM25) results before reranking.', isTrue: true, explanation: 'Lexical search catches identifiers and rare terms that embeddings blur.' },
    { text: 'Tenant access control in RAG is best handled by instructing the model to ignore documents from other tenants.', isTrue: false, explanation: 'Access control belongs in the retrieval filter so unauthorised chunks are never retrieved.' },
    { text: 'Claude can return structured citation blocks when sources are passed with citations enabled.', isTrue: true, explanation: 'document and search_result blocks support citations: {enabled: true}.' },
    { text: 'Fixed-size chunking with no overlap is the recommended default for policy documents containing tables.', isTrue: false, explanation: 'Structural chunking that keeps tables intact, with overlap for narrative text, is preferred.' },
    { text: 'A sudden drop in answer quality after a document refresh, with model and latency unchanged, most likely indicates the model was silently updated.', isTrue: false, explanation: 'Model weights do not silently change; investigate retrieval and indexing first.' },
  ],
  resources: [
    { label: 'Citations (Claude docs)', url: 'https://platform.claude.com/docs/en/build-with-claude/citations' },
    { label: 'Introducing Contextual Retrieval (Anthropic)', url: 'https://www.anthropic.com/news/contextual-retrieval' },
    { label: 'Search results content blocks (Claude docs)', url: 'https://platform.claude.com/docs/en/build-with-claude/search-results' },
  ],
};
