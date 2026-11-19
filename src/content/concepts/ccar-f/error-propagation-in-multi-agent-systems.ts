import type { Concept } from '../../types';

export const errorPropagationInMultiAgentSystems: Concept = {
  id: 'error-propagation-in-multi-agent-systems',
  title: 'Error Propagation in Multi-Agent Systems',
  summary:
    'When a subagent fails, the coordinator needs structured error context (failure type, what was attempted, partial results, alternatives) to recover intelligently. Silent suppression and whole-workflow termination are the two anti-patterns.',
  certs: ['ccar-f', 'ccdv-f', 'ccar-p'],
  domains: ['ccar-f-5', 'ccar-f-1', 'ccdv-f-1', 'ccar-p-1'],
  tags: ['multi-agent', 'errors', 'coordinator', 'reliability', 'research-system'],
  difficulty: 'intermediate',
  diagram: 'coordinator-subagents',
  sections: [
    {
      heading: 'Why the coordinator needs more than "it failed"',
      body: `In a coordinator-subagent research system, the coordinator decides what happens after a subagent returns: synthesize, retry, re-plan, or report a gap. It can only make that decision well if the failure report carries decision-relevant information. A bare status such as "search unavailable" tells the coordinator nothing about *what* to do next.

Structured error context has four parts:

| Field | Why the coordinator needs it |
|---|---|
| **Failure type** | A timeout suggests retry; a 403 suggests a different source; a malformed query suggests rephrasing. |
| **What was attempted** | The exact query or document and the parameters, so a retry is a variation, not a repeat. |
| **Partial results** | Three of five sources succeeded; those findings should not be thrown away. |
| **Alternative approaches** | The subagent often knows the obvious fallbacks (a different index, a narrower query, a cached snapshot). |

Compare two reports for the same event. "Error: search unavailable" versus "timeout after 30s on query 'EU AI Act enforcement 2026' against news index; 2 of 4 planned queries completed (results attached); alternatives: retry with date filter, or query the regulator site directly." Only the second lets the coordinator proceed with partial results, retry intelligently, or annotate the final report with a coverage gap.`,
    },
    {
      heading: 'Access failures versus valid empty results',
      body: `The most common mislabeling in agent systems is treating "I could not look" and "I looked and found nothing" as the same thing. They demand opposite responses.

- An **access failure** (timeout, rate limit, auth error, source down) means the question is unanswered. The coordinator should consider retrying, switching source, or flagging the topic as uncovered.
- A **valid empty result** (query succeeded, zero matches) is information. It may mean the topic is genuinely sparse, or the query needs broadening, but it is not a reason to retry the same call.

Report them differently and explicitly: \`{"status": "error", "error_type": "timeout", ...}\` versus \`{"status": "ok", "results": [], "note": "query succeeded; no matches"}\`. The same discipline applies to tools in a support agent: \`lookup_order\` returning "no order found" is a business fact the agent should explain to the customer; a 503 from the order service is a transient failure to retry or escalate. Tool designs that return an error category (\`transient\`, \`validation\`, \`permission\`, \`not_found\`) and an \`isRetryable\` flag make this distinction mechanical rather than inferred.`,
    },
    {
      heading: 'Local recovery first, then propagate what you cannot fix',
      body: `Error handling should happen at the lowest layer that can fix it, and no lower.

**Subagent responsibilities.** Handle transient failures locally: retry with backoff, try the obvious alternative query, fall back to a secondary source. Only propagate errors you genuinely cannot resolve, and when you do, include what you attempted and any partial results. A subagent that gives up on the first timeout wastes the coordinator's attention; a subagent that retries forever hides the problem and burns time.

**Coordinator responsibilities.** Decide across subagents: proceed with partial coverage, re-plan the decomposition, dispatch a different subagent, or ask the user. The coordinator should not re-implement retry logic that the subagent already ran (the report says what was tried), and it should not treat one subagent's failure as fatal for the others.

Two anti-patterns bracket the correct behaviour:

1. **Silent suppression.** Catching the timeout and returning an empty result set marked as success. Recovery is now impossible because nobody knows anything went wrong, and the final report is quietly incomplete. This is the worst outcome because it looks like success.
2. **Whole-workflow termination.** Propagating the raw exception to a top-level handler that aborts the entire research run. Nine good subagent results are discarded because one source timed out, when "proceed with partial results and note the gap" was available.`,
    },
    {
      heading: 'Coverage annotations in the final output',
      body: `Errors that were handled still shape what the system can honestly claim. A synthesis step should receive, alongside the findings, a record of which planned areas were covered, which were partially covered and which failed, and it should carry that into the report.

A **coverage annotation** distinguishes findings that are well supported (multiple sources, all planned queries succeeded) from topic areas with gaps due to unavailable sources. Readers can then weight conclusions appropriately and the team can decide whether to re-run the gaps.

\`\`\`text
## Coverage
- Regulation (EU): 4/4 sources retrieved, findings well supported
- Regulation (US): 1/3 sources retrieved (2 timeouts on gov index); findings preliminary
- Market data: query succeeded, no matching reports for 2026; treated as a genuine gap, not an access failure
\`\`\`

Exam angle: when a question offers "return structured error context including failure type, attempted query, partial results and alternatives," that is the intended answer against generic statuses, suppression and termination. When a report is "coherent but missing a topic," check first whether the coordinator's decomposition omitted it (a planning error) before blaming error handling; subagents that completed successfully on narrow tasks are not the failure point.`,
    },
  ],
  examples: [
    {
      title: 'Mistake: the empty result marked as success',
      description: `A web search subagent wraps its calls in a broad try/except and returns \`{"results": []}\` on any exception. The coordinator sees an empty but successful result, concludes the topic has little coverage, and the final report says "no significant regulatory activity was found." In fact the news index had been timing out all afternoon.

**Fix:** distinguish outcomes. Successful-but-empty stays \`status: ok\` with an explicit note; exceptions become \`status: error\` with type, attempted query and partial results. The coordinator now retries the regulatory queries against a second index and the report is corrected.`,
      language: 'python',
      code: `import time

def search_with_recovery(query: str, client, attempts: int = 3) -> dict:
    partial, last_err = [], None
    for i in range(attempts):
        try:
            hits = client.search(query, timeout=30)
            if not hits:
                return {"status": "ok", "results": [], "note": "query succeeded; no matches"}
            return {"status": "ok", "results": hits}
        except TimeoutError as e:
            last_err = e
            time.sleep(2 ** i)           # local recovery for a transient failure
        except PermissionError as e:
            return {"status": "error", "error_type": "permission", "retryable": False,
                    "attempted": query, "alternatives": ["use public index"]}
    return {"status": "error", "error_type": "timeout", "retryable": True,
            "attempted": query, "attempts": attempts, "partial_results": partial,
            "alternatives": ["add date filter", "query regulator site directly"]}`,
      takeaway: 'Never return failure as success; label empty results and errors differently so the coordinator can act.',
    },
    {
      title: 'Coordinator proceeding with partial results',
      description: `In an Agent SDK research system, the coordinator dispatches four Task calls in parallel. One returns a structured timeout error with two of four queries completed. Instead of aborting, the coordinator passes the two completed findings to synthesis, retries the two missing queries once with the suggested date filter, and, when that also fails, instructs the synthesis agent to mark US regulation as partially covered.

The structured error made three options available (proceed, retry with modification, annotate). A generic status would have left only "abort" or "ignore."`,
      language: 'typescript',
      code: `type SubagentResult =
  | { status: "ok"; findings: Finding[]; coverage: "full" | "partial" }
  | { status: "error"; errorType: "timeout" | "permission" | "malformed_query";
      retryable: boolean; attempted: string; partialResults: Finding[]; alternatives: string[] };

function planNext(r: SubagentResult) {
  if (r.status === "ok") return { action: "synthesize", findings: r.findings, coverage: r.coverage };
  if (r.retryable && r.alternatives.length) {
    return { action: "retry", query: r.alternatives[0], keep: r.partialResults };
  }
  return { action: "synthesize", findings: r.partialResults, coverage: "gap", note: r.errorType };
}`,
      takeaway: 'The coordinator decides across subagents: proceed, retry with a variation, or annotate the gap, never abort everything.',
    },
    {
      title: 'Support agent: not-found versus service down',
      description: `A returns agent calls \`lookup_order("A-99999")\`. In one deployment the tool returns the string "error" for both a nonexistent order and a 503 from the order service. The agent sometimes tells customers their order does not exist during an outage.

**Fix:** the tool returns \`{"errorCategory": "not_found", "isRetryable": false, "message": "No order A-99999 for this customer"}\` or \`{"errorCategory": "transient", "isRetryable": true, "message": "Order service unavailable"}\`. The system prompt says: explain not_found to the customer and ask them to check the number; on transient, retry once, then tell the customer the system is temporarily unavailable and offer escalation.`,
      takeaway: 'An error category and a retryable flag turn "it failed" into a decision the agent can make correctly.',
    },
    {
      title: 'Mistake: one timeout kills the run',
      description: `A research pipeline lets exceptions bubble to a top-level handler that cancels all in-flight subagents and returns an error page. A single flaky source makes 15-minute runs fail about one time in five, and users re-run the whole thing.

**Fix:** subagents catch and locally retry transient failures; unresolved errors are returned as structured results, not raised; the coordinator treats them as inputs to planning. Runs now complete with coverage annotations, and the team can re-run only the gaps.`,
      takeaway: 'Terminating the workflow on a single failure throws away good work; structured errors let the system degrade gracefully.',
    },
  ],
  keyPoints: [
    'Structured error context has four parts: failure type, what was attempted, partial results, and alternative approaches.',
    'Generic statuses such as "search unavailable" hide the information the coordinator needs to choose retry, re-plan, or proceed.',
    'Distinguish access failures (timeouts, auth, rate limits) from valid empty results; they need opposite responses.',
    'Subagents handle transient failures locally (retry, fallback) and propagate only what they cannot resolve, with what was tried and partial results.',
    'The coordinator decides across subagents: proceed with partial coverage, retry with a variation, re-plan, or ask the user.',
    'Anti-pattern 1: silently suppressing errors by returning empty results as success. Anti-pattern 2: terminating the whole workflow on one failure.',
    'Synthesis output should carry coverage annotations marking well-supported findings versus topic areas with gaps due to unavailable sources.',
    'Tool errors with an error category and an isRetryable flag make the agent\'s next step mechanical rather than guessed.',
  ],
  flashcards: [
    { front: 'What four elements make up structured error context from a subagent?', back: 'Failure type, what was attempted (query/parameters), partial results, and potential alternative approaches.' },
    { front: 'Why is a generic "search unavailable" status an anti-pattern?', back: 'It hides the failure type, attempted query and partial results, so the coordinator cannot choose an informed recovery.' },
    { front: 'How should an access failure and a valid empty result be reported?', back: 'Differently and explicitly: error with type for access failures; status ok with empty results and a note for successful queries with no matches.' },
    { front: 'Which failures should a subagent handle locally?', back: 'Transient ones: retry with backoff, try an alternative query or secondary source. Propagate only what it cannot resolve.' },
    { front: 'What is wrong with catching a timeout and returning an empty result set marked as success?', back: 'It suppresses the error; nobody can recover, and the final output is silently incomplete.' },
    { front: 'What is wrong with propagating a subagent exception to a handler that aborts the whole workflow?', back: 'It discards good results from other subagents when proceeding with partial results or retrying was possible.' },
    { front: 'What is a coverage annotation?', back: 'A section of the synthesis output stating which findings are well supported and which topic areas have gaps due to unavailable sources.' },
    { front: 'A final report is coherent but omits a whole sub-topic, and every subagent succeeded. Where do you look first?', back: 'The coordinator\'s task decomposition; the sub-topic was probably never assigned.' },
    { front: 'What two fields in a tool error response let an agent decide what to do next?', back: 'An error category (transient, validation, permission, not_found) and an isRetryable flag.' },
  ],
  quiz: [
    {
      question:
        'A web search subagent times out while researching a complex topic. Which error propagation approach BEST enables intelligent recovery by the coordinator?',
      options: [
        'Return structured error context including failure type, attempted query, partial results and alternative approaches.',
        'Retry with exponential backoff inside the subagent and return a generic "search unavailable" status after retries are exhausted.',
        'Catch the timeout and return an empty result set marked as successful.',
        'Propagate the timeout exception to a top-level handler that terminates the research workflow.',
      ],
      correct: [0],
      explanation:
        'Structured context lets the coordinator retry with a modified query, try an alternative, or proceed with partial results. The generic status hides that information; the empty success suppresses the error; termination throws away recoverable work.',
    },
    {
      question:
        'A document analysis subagent returns {"results": []} both when a query matches nothing and when the document store is unreachable. What is the MOST important change?',
      options: [
        'Add more retries so the store is reached eventually.',
        'Report access failures as errors with a type, and successful empty queries as ok with an explicit note, so the coordinator can respond differently to each.',
        'Have the coordinator treat every empty result as a failure and retry.',
        'Have the subagent escalate to a human whenever it gets an empty result.',
      ],
      correct: [1],
      explanation:
        'The two outcomes require opposite actions, so they must be distinguishable. More retries do not fix the mislabeling; treating valid empties as failures causes needless retries; human escalation for empty results is disproportionate.',
    },
    {
      question:
        'Which TWO behaviours are appropriate for a subagent that hits a transient failure? (Select two)',
      options: [
        'Retry with backoff and try an obvious alternative source before giving up.',
        'If still unresolved, return a structured error with what was attempted and any partial results.',
        'Return the partial results as a complete success to keep the workflow moving.',
        'Raise the exception so the coordinator\'s process exits and the run can be restarted cleanly.',
      ],
      correct: [0, 1],
      explanation:
        'Local recovery first, then honest propagation. Passing partial results off as complete is silent suppression; crashing the coordinator is whole-workflow termination.',
    },
    {
      question:
        'One of four parallel research subagents fails after local retries. The other three succeed. What should the coordinator do?',
      options: [
        'Abort the run and ask the user to try again later.',
        'Discard the failed area and synthesize the three results without mention of the gap.',
        'Synthesize the three results and have the report annotate the fourth area as having a coverage gap, optionally retrying with the suggested alternative first.',
        'Re-run all four subagents to keep the results consistent.',
      ],
      correct: [2],
      explanation:
        'Proceeding with partial results plus an honest coverage annotation preserves good work and informs the reader. Aborting wastes three good results; silently dropping the gap misleads; re-running everything is unnecessary.',
    },
    {
      question:
        'A support agent sometimes tells customers "that order does not exist" during order-service outages. What is the MOST likely cause?',
      options: [
        'The model is hallucinating order statuses.',
        'The lookup_order tool returns the same error representation for not-found and for service failures.',
        'The customer provided an invalid order number format.',
        'The system prompt does not mention outages.',
      ],
      correct: [1],
      explanation:
        'Conflating a business not-found with a transient failure is the classic cause; an error category and retryable flag fix it. Hallucination and format issues would not correlate with outages, and the system prompt cannot help if the tool result is ambiguous.',
    },
    {
      question:
        'After a run, the final report is coherent and every subagent reports success, but an entire sub-topic the user asked about is missing. Where should you look FIRST?',
      options: [
        'The synthesis agent\'s instructions for detecting coverage gaps.',
        'The coordinator\'s task decomposition and the subtasks it actually assigned.',
        'The web search agent\'s query breadth.',
        'The document analysis agent\'s relevance filtering.',
      ],
      correct: [1],
      explanation:
        'Subagents that succeeded on their assigned tasks are not the failure point; a missing sub-topic that nobody was assigned is a decomposition error. The other options blame downstream agents working correctly within scope.',
    },
  ],
  statements: [
    { text: 'A subagent should return an empty result set marked as successful when a source times out, so the workflow can continue.', isTrue: false, explanation: 'That is silent suppression; it makes recovery impossible and the output silently incomplete.' },
    { text: 'Structured error context should include partial results obtained before the failure.', isTrue: true, explanation: 'Partial results let the coordinator proceed rather than discard everything.' },
    { text: 'A successful query that returns zero matches should be reported the same way as a timeout.', isTrue: false, explanation: 'They need opposite responses; label empty results as ok with a note and access failures as errors with a type.' },
    { text: 'Subagents should propagate every error immediately so the coordinator has full control.', isTrue: false, explanation: 'Subagents should recover transient failures locally and propagate only what they cannot resolve.' },
    { text: 'Terminating the entire workflow on a single subagent failure is an anti-pattern.', isTrue: true, explanation: 'It discards recoverable work when proceeding with partial results or retrying was available.' },
    { text: 'Synthesis output should distinguish well-supported findings from topic areas with gaps due to unavailable sources.', isTrue: true, explanation: 'Coverage annotations let readers weight conclusions and let the team re-run only the gaps.' },
    { text: 'A tool error that includes an error category and an isRetryable flag helps the agent choose between retrying and explaining the problem to the user.', isTrue: true, explanation: 'Transient and retryable means retry; validation or not_found means explain and ask for corrected input.' },
  ],
  resources: [
    { label: 'Subagents (Claude Agent SDK docs)', url: 'https://platform.claude.com/docs/en/agent-sdk/subagents' },
    { label: 'How we built our multi-agent research system (Anthropic engineering)', url: 'https://www.anthropic.com/engineering/multi-agent-research-system' },
    { label: 'Handling tool errors (Claude docs)', url: 'https://platform.claude.com/docs/en/agents-and-tools/tool-use/implement-tool-use' },
  ],
};
