import type { Concept } from '../../types';

export const batchProcessingStrategies: Concept = {
  id: 'batch-processing-strategies',
  title: 'Batch Processing Strategies',
  summary:
    'Use the Message Batches API for latency-tolerant work at half price, keep blocking workflows on the synchronous API, schedule submissions to meet SLAs, correlate results with custom_id, resubmit only failures, and refine prompts on a sample before committing a large volume.',
  certs: ['ccar-f', 'ccdv-f', 'ccar-p'],
  domains: ['ccar-f-4', 'ccdv-f-2', 'ccdv-f-5', 'ccar-p-2', 'ccar-p-4'],
  tags: ['batch', 'cost', 'latency', 'api', 'architecture'],
  difficulty: 'intermediate',
  diagram: 'batch-vs-realtime',
  sections: [
    {
      heading: 'What the Batches API offers and what it does not',
      body: `The Message Batches API accepts a file of Messages requests, processes them asynchronously, and returns results for all of them. The terms:

| Property | Value |
|---|---|
| Price | 50% of standard input and output token prices |
| Completion | Most batches finish within an hour; the guarantee is **up to 24 hours** |
| Latency SLA | None. You cannot rely on any particular turnaround inside the 24-hour window |
| Result order | Arbitrary. Each result carries the \`custom_id\` you supplied |
| Features | Most Messages features (vision, tools, caching, structured outputs) work inside a request |
| Not supported | Streaming, and **multi-turn tool calling within a request**: a batch request cannot pause, let you execute a tool and resume |

The last row is the one that trips people up. A single batch request can *include* tool definitions and the model may return a \`tool_use\` block, but the batch cannot run your tool and feed the result back. Anything that needs an agent loop (search, read, act, repeat) is not a batch workload.

Each request is independent. Results are correlated by \`custom_id\`, so choose ids that encode the document or record they belong to (\`invoice-2025-11-00042\`), not sequence numbers.`,
    },
    {
      heading: 'Matching the API to the workflow',
      body: `The decision is about **who is waiting**.

- **Someone is blocked on the result** → synchronous API. A pre-merge review check, a support agent answering a live customer, an extraction a user triggered and is watching. Paying double for a response in seconds is the correct trade.
- **Nobody is waiting** → Batches API. Overnight code-review reports, weekly dependency audits, nightly test generation for the whole repository, back-filling extractions over an archive of 200,000 documents, re-scoring a corpus after a prompt change.

A useful hybrid: run the blocking, per-PR review synchronously and run the broad, repository-wide analysis in a nightly batch. The two have different latency requirements, so they get different APIs.

Exam distractors will offer the batch API for "faster" results (it is not faster), or the synchronous API for a weekly report "to be safe" (it doubles the cost for nothing).`,
    },
    {
      heading: 'Scheduling batches against an SLA',
      body: `Because the processing window is up to 24 hours with no SLA inside it, you plan for the worst case. If you promise results within **N hours** of a document arriving, and a batch may take 24 hours, the longest a document may wait before it is submitted is **N − 24 hours**. That is your maximum submission interval.

Example from the exam guide: a 30-hour SLA. A document that arrives just after a submission waits for the next submission, then up to 24 hours. With submissions every 4 hours: 4 + 24 = 28 hours worst case, inside the SLA. Every 6 hours: 6 + 24 = 30, right at the edge with no margin. Every 8 hours: 32, a breach. So the answer is a 4-hour cadence (or anything ≤ 6 hours if you accept zero margin).

If the SLA is shorter than 24 hours, the Batches API cannot guarantee it at all, regardless of cadence. That is a synchronous workload, or a hybrid where the batch is attempted first and anything not back by a deadline is re-run synchronously.`,
    },
    {
      heading: 'Handling failures and refining first',
      body: `Results arrive per request with a type: \`succeeded\`, \`errored\`, \`canceled\` or \`expired\`. Handle them individually:

- Collect the \`custom_id\`s of every non-succeeded result and **resubmit only those**. Resubmitting the whole batch pays again for the 98% that worked.
- Fix the cause before resubmitting. A document that errored because it exceeded the context limit will fail again unchanged; **chunk it** or summarise it first. An \`invalid_request\` error means the request itself is wrong; a server error is safe to retry as is.
- Results are available for 29 days; fetch and persist them before then.

Before any large batch, **refine the prompt on a sample**. Run 50 to 100 representative documents synchronously (or as a tiny batch), inspect the output, fix the schema and prompt, and repeat until the sample passes validation. Then submit the full volume. A prompt bug discovered after a 200,000-document batch costs a second 200,000-document batch, half-price or not. Iteration is cheap on a sample and expensive at scale.`,
    },
  ],
  examples: [
    {
      title: 'Submitting an overnight extraction batch',
      description:
        'An archive of 40,000 scanned contracts needs structured extraction. Nobody is waiting; the data feeds a quarterly report. The team submits one batch per night with custom_ids keyed to contract ids, polls until it ends, and stores results keyed by custom_id.',
      language: 'python',
      code: `requests = [
    {
        "custom_id": f"contract-{c.id}",
        "params": {
            "model": "claude-opus-5-5",
            "max_tokens": 4096,
            "system": [{"type": "text", "text": EXTRACTION_RULES,
                        "cache_control": {"type": "ephemeral"}}],
            "messages": [{"role": "user", "content": c.text}],
            "output_config": {"format": {"type": "json_schema", "schema": CONTRACT_SCHEMA}},
        },
    }
    for c in contracts
]
batch = client.messages.batches.create(requests=requests)
# later, after processing_status == "ended":
for r in client.messages.batches.results(batch.id):
    if r.result.type == "succeeded":
        store(r.custom_id, r.result.message)
    else:
        failed.append((r.custom_id, r.result.type))`,
      takeaway: 'Batch when nobody is waiting; key everything by custom_id because results arrive in any order.',
    },
    {
      title: 'The mistake: a pre-merge check on the batch API',
      description:
        'To save money, a team moved its pre-merge security review to the Batches API. PRs sat waiting for hours; some reviews arrived after the PR had been merged by an impatient developer. The review was blocking by nature, so it belonged on the synchronous API. They moved it back and kept the batch API for the nightly whole-repository scan.',
      takeaway: 'A blocking workflow cannot tolerate an unbounded wait; the 50% saving is not worth a 24-hour window.',
    },
    {
      title: 'Cadence math for a 30-hour SLA',
      description:
        'A compliance team promises extracted fields within 30 hours of document receipt. The batch window is 24 hours worst case. Submitting every 4 hours gives a 28-hour worst case with 2 hours of margin for polling and storage. Every 8 hours would give 32 hours and breach the SLA.',
      language: 'text',
      code: `worst_case = submission_interval + batch_window
  every 4h:  4 + 24 = 28h  (meets 30h SLA, 2h margin)
  every 6h:  6 + 24 = 30h  (no margin)
  every 8h:  8 + 24 = 32h  (breach)
max_interval = SLA - 24h = 6h  ->  choose <= 4h for margin`,
      takeaway: 'Max submission interval = SLA − 24 h; leave margin.',
    },
    {
      title: 'Resubmitting only failures, chunked',
      description:
        'Of 12,000 documents in a batch, 140 errored. Inspection showed 130 exceeded the context limit (large appendices) and 10 hit transient server errors. The team split the 130 into chunks, resubmitted all 140 as a new batch under the same custom_ids with a suffix, and never re-ran the 11,860 that had succeeded.',
      takeaway: 'Identify failures by custom_id, fix the cause (chunking), and resubmit only those.',
    },
  ],
  keyPoints: [
    'Batches API: 50% price reduction, results within up to 24 hours, no latency SLA, results in arbitrary order keyed by custom_id.',
    'Batch requests cannot do multi-turn tool calling; anything needing an agent loop is a synchronous workload.',
    'Synchronous API for blocking work (pre-merge checks, live users); batch for latency-tolerant work (overnight reports, weekly audits, nightly test generation).',
    'To meet an SLA of N hours, submit at least every N − 24 hours; an SLA under 24 hours cannot be met by batch alone.',
    'Resubmit only failed custom_ids, after fixing the cause (for example chunking oversized documents).',
    'Refine the prompt and schema on a sample before submitting a large batch.',
    'Most Messages features (caching, structured outputs, vision) work inside batch requests; streaming does not.',
  ],
  flashcards: [
    { front: 'How much does the Batches API save?', back: '50% of standard token prices.' },
    { front: 'What is the processing window for a batch?', back: 'Up to 24 hours, most finish within an hour; no latency SLA inside the window.' },
    { front: 'How are batch results correlated with requests?', back: 'By the custom_id you set on each request; results arrive in any order.' },
    { front: 'Can a batch request run a multi-turn tool loop?', back: 'No. The batch cannot pause for you to execute a tool and resume.' },
    { front: 'Pre-merge review check: sync or batch?', back: 'Synchronous. It blocks a developer.' },
    { front: 'Weekly dependency audit: sync or batch?', back: 'Batch. Nobody is waiting on it.' },
    { front: 'Formula for maximum submission interval under an SLA?', back: 'SLA − 24 hours. For a 30-hour SLA, submit at least every 6 hours; 4 hours leaves margin.' },
    { front: 'After a batch, 2% of requests errored. What do you resubmit?', back: 'Only the failed custom_ids, after fixing the cause (such as chunking documents that exceeded the context limit).' },
    { front: 'What should you do before submitting 200,000 documents?', back: 'Refine the prompt and schema on a representative sample until it validates cleanly.' },
    { front: 'How long are batch results retrievable?', back: '29 days after creation.' },
  ],
  quiz: [
    {
      question:
        'A team runs a nightly whole-repository code-quality report and a pre-merge security check on each PR. They want to minimise cost without hurting developers. Which allocation is MOST appropriate?',
      options: [
        'Both on the Batches API to maximise savings.',
        'Both on the synchronous API for consistency.',
        'Nightly report on the Batches API; pre-merge check on the synchronous API.',
        'Pre-merge check on the Batches API; nightly report on the synchronous API.',
      ],
      correct: [2],
      explanation:
        'The report is latency-tolerant and nobody waits for it; the pre-merge check blocks a developer and needs a fast response. The other options either block developers for hours or pay double for a report nobody is waiting on.',
    },
    {
      question:
        'A compliance pipeline promises extracted data within 30 hours of document receipt and uses the Batches API. Which submission cadence guarantees the SLA with margin?',
      options: ['Every 12 hours', 'Every 8 hours', 'Every 4 hours', 'Once per day'],
      correct: [2],
      explanation:
        'Worst case is interval plus 24 hours. 4 + 24 = 28 hours meets the SLA with margin. 8 and 12 hours breach (32 and 36 hours), and once a day gives 48 hours.',
    },
    {
      question:
        'A batch of 10,000 extraction requests completes with 150 errors, mostly "exceeded context length". What should the team do?',
      options: [
        'Resubmit the entire batch with a larger max_tokens.',
        'Identify the failed custom_ids, chunk the oversized documents, and resubmit only those.',
        'Resubmit the whole batch unchanged; errors are usually transient.',
        'Switch the whole workload to the synchronous API.',
      ],
      correct: [1],
      explanation:
        'Only the failures need resubmitting, and oversized inputs must be chunked or they fail again. max_tokens affects output not input, blind resubmission repeats the failure and pays for 9,850 successes again, and the workload is still latency-tolerant.',
    },
    {
      question: 'Which TWO statements about the Message Batches API are correct? (Select two)',
      options: [
        'Results are returned in the order requests were submitted.',
        'A batch request cannot execute tools mid-request and resume with their results.',
        'Pricing is 50% of the standard synchronous price.',
        'Batches guarantee completion within one hour.',
      ],
      correct: [1, 2],
      explanation:
        'No multi-turn tool loops and the 50% discount are core facts. Results arrive in arbitrary order (use custom_id), and the only guarantee is up to 24 hours.',
    },
    {
      question:
        'An architect plans to submit 250,000 documents in a single batch using a newly written extraction prompt. What should happen FIRST?',
      options: [
        'Submit the batch immediately; the 50% discount makes a re-run affordable.',
        'Run the prompt on a representative sample, fix issues, and only then submit the full volume.',
        'Split the batch into 25 batches of 10,000 and submit them all at once.',
        'Use the synchronous API for all 250,000 so errors appear sooner.',
      ],
      correct: [1],
      explanation:
        'Refining on a sample catches prompt and schema problems before they are multiplied by 250,000. Immediate submission risks a full costly re-run, splitting does not catch prompt errors, and synchronous processing doubles the cost of a non-blocking workload.',
    },
    {
      question: 'A product wants summaries delivered to users within 10 minutes of upload. Is the Batches API appropriate?',
      options: [
        'Yes, because most batches complete within an hour.',
        'Yes, if batches are submitted every minute.',
        'No; there is no latency SLA and the window is up to 24 hours, so a blocking 10-minute requirement needs the synchronous API.',
        'No, because batches do not support summarisation.',
      ],
      correct: [2],
      explanation:
        '"Most within an hour" is not a guarantee, and frequent submission does not shorten the 24-hour window. Summarisation is supported; the issue is latency.',
    },
  ],
  statements: [
    { text: 'The Batches API processes requests at 50% of the standard token price.', isTrue: true, explanation: 'The discount applies to both input and output tokens.' },
    { text: 'The Batches API guarantees results within one hour.', isTrue: false, explanation: 'Most batches finish within an hour, but the only guarantee is up to 24 hours with no latency SLA.' },
    { text: 'Batch results arrive in the same order as the submitted requests.', isTrue: false, explanation: 'Order is arbitrary; correlate with custom_id.' },
    { text: 'A single batch request can include tool definitions, but the batch cannot execute a tool and resume the request with its result.', isTrue: true, explanation: 'Multi-turn tool loops are not supported within a batch request.' },
    { text: 'A pre-merge review check is a good candidate for the Batches API because reviews are expensive.', isTrue: false, explanation: 'Pre-merge checks block developers; they belong on the synchronous API.' },
    { text: 'To guarantee a 30-hour SLA with 24-hour batch processing, submitting every 4 hours leaves a 2-hour margin.', isTrue: true, explanation: '4 + 24 = 28 hours worst case.' },
    { text: 'When a few requests in a batch fail, best practice is to resubmit the entire batch.', isTrue: false, explanation: 'Resubmit only the failed custom_ids after fixing the cause.' },
  ],
  resources: [
    { label: 'Message Batches API', url: 'https://platform.claude.com/docs/en/build-with-claude/batch-processing' },
    { label: 'Pricing', url: 'https://claude.com/pricing#api' },
  ],
};
