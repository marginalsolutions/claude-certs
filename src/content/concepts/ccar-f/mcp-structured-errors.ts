import type { Concept } from '../../types';

export const mcpStructuredErrors: Concept = {
  id: 'mcp-structured-errors',
  title: 'Structured Error Responses for MCP Tools',
  summary:
    'A tool that fails with "Operation failed" leaves the agent guessing. Return isError with a category (transient, validation, business, permission), an isRetryable flag and a human-readable message so the agent retries, fixes input, explains, or escalates appropriately.',
  certs: ['ccar-f', 'ccdv-f', 'ccar-p'],
  domains: ['ccar-f-2', 'ccar-f-5', 'ccdv-f-8', 'ccar-p-3'],
  tags: ['mcp', 'errors', 'isError', 'retries', 'error-propagation', 'tools'],
  difficulty: 'intermediate',
  diagram: 'tool-use-sequence',
  sections: [
    {
      heading: 'How errors reach the agent',
      body: `In MCP, a tool call returns a result object with \`content\` (an array of content blocks) and an \`isError\` flag. **Tool execution failures are returned as results with \`isError: true\`**, not as protocol-level JSON-RPC errors. The distinction matters: a protocol error means the request itself was malformed or the tool does not exist, and the client handles it; a tool error is something the *model* should see and reason about.

The host passes the result to Claude as a \`tool_result\` block (with \`is_error: true\` on the Messages API). Claude reads the content as text. Whatever you put in that content is the only information the model has about what went wrong and what to do next.

So the question for a tool author is: *what does the agent need to know to recover correctly?* A generic "Operation failed" answers nothing. The agent cannot tell whether to retry, change its input, apologise to the customer, or escalate, so it guesses, and guesses cost tokens and sometimes money.`,
    },
    {
      heading: 'Error categories and what each implies',
      body: `Classify every failure into one of a few categories and say so explicitly:

| Category | Examples | Correct agent reaction |
|---|---|---|
| **Transient** | timeout, 503, rate limit, connection reset | Retry, possibly with backoff; try once more before giving up |
| **Validation** | malformed order id, missing required field | Fix the input (often by re-reading the tool description) and retry; do not retry unchanged |
| **Business** | refund exceeds policy, return window closed | Do not retry; explain to the customer in plain language; consider escalation |
| **Permission** | agent lacks access to this account or action | Do not retry; escalate or ask for authorisation |

Encode the category in a structured field (\`errorCategory\`) and add **\`isRetryable\`** as a boolean so the agent does not have to infer it. Business errors should also carry a **customer-friendly explanation** the agent can relay directly ("Returns are accepted within 30 days of delivery; this order was delivered 45 days ago") so it neither invents a reason nor leaks internal detail.

Returning this metadata prevents the two expensive failure modes: hammering a business or permission error with retries that can never succeed, and abandoning a transient failure that one retry would have fixed.`,
    },
    {
      heading: 'Empty results are not errors',
      body: `A query that succeeds and finds nothing must look different from a query that failed. \`lookup_order(customer_id)\` for a customer with no orders should return a normal result: \`{"orders": []}\` with \`isError: false\`, ideally with a note such as "No orders found for this customer" so the model does not suspect a bug.

If instead the tool raises or returns \`isError: true\` for "not found", the agent treats a valid answer as an **access failure** and makes retry decisions it should not make: trying alternative identifiers, calling the tool again, or telling the customer the system is down. Conversely, a real access failure (the orders service is unreachable) must not be disguised as an empty list, or the agent will confidently tell the customer they have no orders.

Rule: *successful query with no matches* → ordinary result describing the empty set; *could not run the query* → \`isError: true\` with a category.`,
    },
    {
      heading: 'Local recovery in subagents, propagation to the coordinator',
      body: `In a multi-agent system, errors should be **handled as close to their source as possible**. A search subagent that hits a transient timeout should retry locally, perhaps with a narrower query, before telling anyone. Bubbling every hiccup up to the coordinator wastes coordinator context and turns recoverable noise into decisions.

What the subagent should propagate are the failures it **cannot** resolve, and it should propagate them with structure:

- the failure type (category, retryable or not),
- what was attempted (queries tried, retries made),
- **partial results** gathered before the failure,
- what is missing (so the coordinator can annotate coverage gaps).

The coordinator then decides: re-delegate with a different query, substitute another source, or proceed with partial results and flag the gap in the final report. This mirrors the single-agent principle: the information needed for a good recovery decision must travel with the error.`,
    },
  ],
  examples: [
    {
      title: 'process_refund returning structured errors (TypeScript MCP server)',
      description:
        'Each failure path returns isError with a category, a retryable flag and a message. The business-rule case includes text the agent can relay to the customer.',
      language: 'typescript',
      code: `server.registerTool("process_refund", { description: "...", inputSchema: RefundSchema },
  async ({ order_id, amount }) => {
    const fail = (errorCategory: string, isRetryable: boolean, message: string, extra = {}) => ({
      isError: true,
      content: [{ type: "text" as const,
        text: JSON.stringify({ errorCategory, isRetryable, message, ...extra }) }],
    });
    if (!/^ORD-\\d{6}$/.test(order_id))
      return fail("validation", false, "order_id must look like ORD-123456.");
    const order = await orders.get(order_id).catch(() => null);
    if (order === null)
      return fail("transient", true, "Orders service timed out; retry once before escalating.");
    if (daysSince(order.delivered_at) > 30)
      return fail("business", false, "Outside the 30-day return window.",
        { customerMessage: "Returns are accepted within 30 days of delivery; this order was delivered " +
                           daysSince(order.delivered_at) + " days ago." });
    if (amount > order.total)
      return fail("validation", false, \`amount exceeds order total \${order.total}.\`);
    const r = await payments.refund(order_id, amount);
    return { content: [{ type: "text", text: JSON.stringify(r) }] };
  });`,
      takeaway: 'Category, retryable flag and a clear message let the agent pick the right recovery action every time.',
    },
    {
      title: 'The mistake: one generic error for everything',
      description:
        'A team\'s MCP tools all returned "Operation failed" on any exception. The support agent retried a closed-return-window refund four times, then told the customer the system was down. Separately, it retried a 503 only once and gave up. Introducing errorCategory and isRetryable fixed both behaviours without any prompt changes.',
      language: 'text',
      code: `Before:  {"isError": true, "content": [{"type":"text","text":"Operation failed"}]}
         -> agent retries business errors, under-retries transient ones

After:   {"isError": true, "content": [{"type":"text","text":
           "{\\"errorCategory\\":\\"business\\",\\"isRetryable\\":false,
             \\"message\\":\\"Outside the 30-day return window\\",
             \\"customerMessage\\":\\"Returns are accepted within 30 days of delivery.\\"}"}]}
         -> agent explains and offers escalation; no wasted retries`,
      takeaway: 'Uniform errors force the agent to guess; structured metadata lets it decide correctly.',
    },
    {
      title: 'Empty result versus access failure',
      description:
        'lookup_order used to return isError for "no orders found". The agent interpreted that as a broken backend and repeatedly retried. Returning a normal result with an empty list and a note resolved it, while real outages still return a transient error.',
      language: 'python',
      code: `@tool("lookup_order", "Return a customer's orders...", {"customer_id": str})
async def lookup_order(args):
    try:
        orders = await orders_api.list(args["customer_id"])
    except TimeoutError:
        return {"is_error": True, "content": [{"type": "text", "text": json.dumps({
            "errorCategory": "transient", "isRetryable": True,
            "message": "Orders service timed out."})}]}
    if not orders:                       # success, nothing matched
        return {"content": [{"type": "text", "text": json.dumps({
            "orders": [], "note": "No orders found for this customer."})}]}
    return {"content": [{"type": "text", "text": json.dumps({"orders": orders})}]}`,
      takeaway: 'No matches is a successful query, not an error; reserve isError for failures to execute.',
    },
    {
      title: 'A search subagent propagating what it could not fix',
      description:
        'The subagent retried a timeout twice and narrowed its query, then reported the remaining failure with partial results. The coordinator proceeded and annotated the coverage gap instead of failing the whole report.',
      language: 'json',
      code: `{
  "status": "partial",
  "findings": [ { "claim": "...", "source_url": "...", "published": "2026-03-02" } ],
  "unresolved": {
    "errorCategory": "transient",
    "isRetryable": true,
    "attempted": ["query: EU battery recycling targets 2030 (x2, timeout)",
                  "query: EU battery regulation recycling 2030 (timeout)"],
    "missing": "Official EU 2030 recycling target figures"
  }
}`,
      takeaway: 'Recover locally first; propagate only unresolved failures, with what was tried and the partial results.',
    },
  ],
  keyPoints: [
    'MCP tool failures are returned as results with isError: true, which the host passes to Claude as an error tool_result; they are not protocol errors.',
    'Categorise errors: transient (retry), validation (fix input), business (explain, do not retry), permission (escalate).',
    'Include errorCategory, isRetryable and a human-readable message; business errors should carry a customer-friendly explanation.',
    'Generic "Operation failed" responses prevent correct recovery and cause wasted retries or premature abandonment.',
    'A successful query with no matches is an ordinary result (empty list plus note), never isError.',
    'Subagents recover transient failures locally; they propagate only unresolved errors, with attempts made and partial results.',
    'The information needed to make a good recovery decision must travel with the error.',
  ],
  flashcards: [
    { front: 'How does an MCP tool signal a failure to the agent?', back: 'By returning a result with isError: true and descriptive content; not with a JSON-RPC protocol error.' },
    { front: 'Name the four error categories.', back: 'Transient, validation, business, permission.' },
    { front: 'Which categories are retryable without changes?', back: 'Only transient. Validation needs changed input; business and permission are non-retryable.' },
    { front: 'What two structured fields should accompany every error?', back: 'errorCategory and isRetryable (plus a human-readable message).' },
    { front: 'Why add a customerMessage to business errors?', back: 'So the agent can relay an accurate, friendly explanation instead of inventing one or leaking internals.' },
    { front: 'How should lookup_order respond when a customer has no orders?', back: 'A normal result with an empty list and a note; isError false.' },
    { front: 'What happens if "not found" is returned as isError?', back: 'The agent treats a valid empty result as an access failure and makes needless retry decisions.' },
    { front: 'Where should transient errors be handled in a multi-agent system?', back: 'Locally, in the subagent that encountered them.' },
    { front: 'What should a subagent include when propagating an unresolved error?', back: 'Failure type, what was attempted, partial results, and what is missing.' },
    { front: 'Why is "Operation failed" harmful?', back: 'It gives the agent no basis to choose between retry, input fix, explanation or escalation.' },
  ],
  quiz: [
    {
      question:
        'The support agent retries a refund five times when the return window has closed, then tells the customer the system is down. All MCP tools return the message "Operation failed" on any error. What is the most effective fix?',
      options: [
        'Add "do not retry more than once" to the system prompt.',
        'Return structured errors with errorCategory, isRetryable: false and a customer-friendly explanation for business rule violations.',
        'Increase the tool timeout so refunds succeed more often.',
        'Catch all exceptions in the agent harness and end the conversation.',
      ],
      correct: [1],
      explanation:
        'The agent lacks information to distinguish a policy violation from an outage. Structured metadata tells it not to retry and what to say. A blanket retry limit also under-retries real transient failures; timeouts are unrelated; ending the conversation abandons the customer.',
    },
    {
      question:
        'lookup_order returns isError: true with "No orders found" when a customer has none. The agent repeatedly retries with variant identifiers. Which change is correct?',
      options: [
        'Return a successful result containing an empty orders list and a note that no orders exist.',
        'Return errorCategory "transient" so the agent retries with backoff.',
        'Return errorCategory "permission" so the agent escalates.',
        'Remove the customer_id parameter so the tool cannot be called that way.',
      ],
      correct: [0],
      explanation:
        'No matches is a successful query, not a failure. Labelling it transient or permission makes the agent behave as if something is broken, and removing the parameter removes a legitimate capability.',
    },
    {
      question: 'Which TWO fields make an MCP error response actionable for an agent? (Select two)',
      options: [
        'A stack trace of the server exception.',
        'errorCategory indicating transient, validation, business or permission.',
        'isRetryable indicating whether an unchanged retry can succeed.',
        'The server process id for debugging.',
      ],
      correct: [1, 2],
      explanation:
        'Category and retryability drive the recovery decision. Stack traces and process ids are noise for the model and may leak internal details.',
    },
    {
      question:
        'In a research system, a search subagent hits a timeout and immediately reports the failure to the coordinator, which aborts the whole report. What is the better design?',
      options: [
        'Have the coordinator retry the subagent from scratch up to ten times.',
        'Have the subagent retry locally (possibly with a narrower query) and, only if still failing, report the error with what it attempted and any partial results so the coordinator can proceed and flag the gap.',
        'Remove timeouts from the search tool.',
        'Have the search subagent call the synthesis subagent directly with whatever it has.',
      ],
      correct: [1],
      explanation:
        'Local recovery plus structured propagation with partial results preserves coordinator context and keeps the report going. Blind coordinator retries are expensive, removing timeouts risks hangs, and subagent-to-subagent calls break hub-and-spoke routing.',
    },
    {
      question: 'A tool returns {"errorCategory": "validation", "isRetryable": false, "message": "order_id must match ORD-nnnnnn"}. What should the agent do?',
      options: [
        'Retry the identical call after a short delay.',
        'Correct the order id format based on the message and call again.',
        'Escalate to a human because the error is non-retryable.',
        'Tell the customer their order does not exist.',
      ],
      correct: [1],
      explanation:
        'Validation errors are fixed by changing the input, which is why isRetryable is false for an unchanged retry. Escalation is for permission or policy issues, and the error says nothing about the order not existing.',
    },
  ],
  statements: [
    { text: 'MCP tool execution failures should be returned as results with isError: true rather than as JSON-RPC protocol errors.', isTrue: true, explanation: 'Protocol errors are for malformed requests; tool errors are information the model should reason about.' },
    { text: 'A generic "Operation failed" message is acceptable because the agent will ask the user what to do.', isTrue: false, explanation: 'Uniform errors prevent appropriate recovery decisions; the agent guesses, retries wrongly or gives up.' },
    { text: 'Business rule violations should be marked non-retryable and include a customer-friendly explanation.', isTrue: true, explanation: 'Retrying cannot change policy, and the explanation lets the agent communicate accurately.' },
    { text: 'A query that finds no matching records should return isError: true so the agent knows something is wrong.', isTrue: false, explanation: 'Nothing is wrong. Return a normal result with an empty set so the agent does not treat it as an access failure.' },
    { text: 'Subagents should forward every error immediately to the coordinator for centralised handling.', isTrue: false, explanation: 'Transient errors should be recovered locally; only unresolved failures are propagated, with partial results.' },
    { text: 'Including what was attempted alongside an unresolved error helps the coordinator avoid repeating failed queries.', isTrue: true, explanation: 'It also lets the coordinator annotate coverage gaps in the final output.' },
    { text: 'Transient errors such as timeouts should be flagged isRetryable: true.', isTrue: true, explanation: 'A retry, often with backoff, has a reasonable chance of succeeding.' },
  ],
  resources: [
    { label: 'MCP specification: tools and error handling', url: 'https://modelcontextprotocol.io/specification/latest/server/tools' },
    { label: 'Tool use: handling tool results and errors', url: 'https://platform.claude.com/docs/en/agents-and-tools/tool-use/implement-tool-use' },
    { label: 'Agent SDK custom tools (in-process MCP servers)', url: 'https://platform.claude.com/docs/en/agent-sdk/custom-tools' },
  ],
};
