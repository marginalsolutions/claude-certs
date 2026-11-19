import type { Concept } from '../../types';

export const diagnosingSystemIssues: Concept = {
  id: 'diagnosing-system-issues',
  title: 'Diagnosing System Issues',
  summary:
    'Tell a prompt failure from a hallucination, a model mismatch, a retrieval failure or a plain integration bug, follow a diagnostic sequence that starts with what changed, and use traces rather than guesses.',
  certs: ['ccar-p', 'ccdv-f', 'ccao-f'],
  domains: ['ccar-p-4', 'ccar-p-3', 'ccdv-f-4', 'ccao-f-7'],
  tags: ['debugging', 'diagnosis', 'rag', 'hallucination', 'tracing'],
  difficulty: 'advanced',
  diagram: 'rag-pipeline',
  sections: [
    {
      heading: 'Five failure classes',
      body: `Most production incidents in Claude systems fall into one of five classes, and each has a different fix. Misclassifying the failure wastes days: teams rewrite prompts to fix retrieval bugs, or upgrade models to fix integration errors.

| Class | What it looks like | Typical cause | Fix lives in |
|---|---|---|---|
| **Prompt failure** | Model ignores a rule, wrong format, wrong tone, misses a step | Ambiguous or conflicting instructions, missing context, instruction buried in a huge prompt, examples contradicting rules | Prompt and context design |
| **Hallucination** | Confident, fluent, specific, and wrong (citations, numbers, API names) | Model asked for facts it does not have; no grounding; no permission to say "I don't know" | Grounding (RAG, tools), explicit uncertainty instructions, validation of claims |
| **Model mismatch** | Task is above the model's capability or below its cost profile; inconsistent reasoning on hard cases; or over-paying for trivial ones | Wrong tier for the task; effort too low; task needs tools the model was not given | Model and effort selection |
| **Retrieval failure** | Answers confident but irrelevant or stale; good on some documents, bad on others | Stale index, broken re-indexing, embedding model mismatch, chunking that splits key facts, filter bugs | Retrieval pipeline |
| **Integration bug** | Errors, truncated output, missing tool results, wrong parameters, timeouts | \`max_tokens\` too low, unhandled \`stop_reason\`, schema mismatch, tool result not returned, retries doubling writes | Application code |

A sixth class worth naming: **grader or metric error**, where the system is fine and the measurement is wrong.`,
    },
    {
      heading: 'The diagnostic sequence',
      body: `Work from the cheapest, most likely cause outward:

1. **What changed?** Model id, prompt version, tool definitions, retrieval index, data refresh, upstream API, traffic mix. Correlate the regression start time with deployments and data jobs. Most incidents are caused by the most recent change.
2. **Reproduce with a trace.** Pull the full request and response for failing cases: system prompt, messages, tool calls and results, retrieved chunks, \`stop_reason\`, \`usage\`. Do not diagnose from the final answer alone.
3. **Check the mechanics before the semantics.** \`stop_reason: max_tokens\` means truncation, not a reasoning failure. \`refusal\` means a safety classifier fired. A missing tool result means your loop broke. 4xx and 5xx errors are integration issues.
4. **Check the inputs the model saw.** For RAG, were the retrieved chunks relevant and current? If the context was wrong, the model was probably right about the context it was given.
5. **Only then look at the model's behaviour.** Does it ignore an instruction that is clearly present (prompt failure)? Does it invent facts not in context (hallucination)? Does it fail only on the hardest cases (capability, consider effort or model)?
6. **Isolate with a minimal reproduction** and fix one thing; re-run the eval.

The official sample question captures the sequence: a RAG system returns confident but incorrect answers right after a document refresh, with model version and latency unchanged. The first place to look is the retrieval/indexing step, because that is what changed and because confident-but-wrong is exactly what a model produces when fed stale or irrelevant chunks. Model weights do not silently change, sampling parameters are not even accepted on current models, and context windows do not shrink.`,
    },
    {
      heading: 'Hallucination vs retrieval vs prompt: telling them apart',
      body: `These three are confused most often. Use the trace:

- If the **retrieved context contains the correct answer** and the model said something else, it is a prompt or model problem. Check whether the instruction to answer only from context is present and unambiguous; check whether the relevant chunk was buried among many irrelevant ones (a context-engineering failure).
- If the **retrieved context does not contain the answer** and the model answered anyway, the primary failure is retrieval (why was the right chunk missing?) and the secondary failure is that the prompt did not give the model permission or instruction to say the information is not available.
- If the **model invents specifics** (a case number, a clause, a function name) that appear nowhere in the context, it is hallucination. Mitigate with grounding, explicit "if not in the context, say so" instructions, requiring citations that can be verified programmatically, and downstream validation of high-stakes claims.
- If the output is **structurally wrong** (bad JSON, missing field), prefer structured outputs (\`output_config.format\`) or a strict tool schema over prompt pleading; that moves the fix from semantics to mechanics.

Capability mismatch shows up as failures concentrated on the hardest cases with the easy ones fine. Before switching models, try raising \`output_config.effort\`; if that fixes it, the task needed more thinking, not a different model.`,
    },
    {
      heading: 'Using traces and evals in diagnosis',
      body: `Diagnosis without data is guessing. The minimum trace for every production request:

- Prompt version id and model id
- Full input (or a hash plus a retrievable copy, subject to retention policy)
- Retrieved chunk ids and scores (for RAG)
- Each tool call with parameters, result and duration
- \`stop_reason\`, \`usage\` (all four token fields), latency
- Any guardrail or validator decision

With traces you can answer "did the right chunk get retrieved?" in seconds. With an eval you can confirm a fix did not break anything else: add the failing cases to the eval set, verify they fail, apply the fix, verify they pass and the rest did not regress. That turns an incident into a permanent regression test.

Exam angle: when options include "the model weights changed", "the context window shrank" or sampling parameters, they are distractors. Current models' context windows and weights do not change under a fixed id, and \`temperature\`, \`top_p\` and \`top_k\` are rejected on the current API version.`,
    },
  ],
  examples: [
    {
      title: 'The document refresh that broke retrieval',
      description:
        'A legal-research assistant started returning confidently wrong citations the morning after a nightly document refresh. Model id, prompt and latency were unchanged. Traces showed the retrieved chunks referenced the old document ids; the refresh job had rebuilt the index with a different embedding model than the query side used, so similarity scores were meaningless. Re-indexing with the matching embedding model fixed it. Nobody touched the prompt.',
      takeaway: 'Confident-but-wrong right after a data change points at retrieval; check what the model was given before blaming the model.',
    },
    {
      title: 'Classifying a failure from the trace',
      description:
        'A triage helper inspects the response mechanics before anyone reads the answer. It separates truncation, refusals, broken tool loops and genuine quality problems so each goes to the right queue.',
      language: 'typescript',
      code: `type Diagnosis = "truncated" | "refused" | "tool_loop_broken" | "needs_quality_review";

function triage(res: Anthropic.Message, toolResultsReturned: number): Diagnosis {
  if (res.stop_reason === "max_tokens") return "truncated";          // integration: raise max_tokens / stream
  if (res.stop_reason === "refusal") return "refused";               // safety classifier; do not retry blindly
  const toolUses = res.content.filter((b) => b.type === "tool_use").length;
  if (toolUses > 0 && toolResultsReturned < toolUses) return "tool_loop_broken"; // integration bug
  return "needs_quality_review";                                      // prompt / retrieval / hallucination
}`,
      takeaway: 'Rule out mechanical causes from stop_reason and tool accounting before investigating semantics.',
    },
    {
      title: 'Rewriting the prompt to fix a max_tokens bug',
      description:
        'A team spent a week adding "be concise" and "always finish your answer" to a report generator because outputs ended mid-sentence. The trace showed stop_reason: max_tokens with max_tokens set to 1024 for a task that needed 3,000 tokens. Raising the limit and streaming the output fixed it in one line. The prompt edits were reverted.',
      takeaway: 'An integration limit looked like a prompt failure; the stop_reason would have said so on day one.',
    },
    {
      title: 'Capability or effort?',
      description:
        'A contract-analysis workflow on Sonnet 5.5 passed simple clauses but failed on multi-clause interaction questions. Before escalating to Opus 5.5 at roughly double the price, the team raised output_config.effort to high for that step only. The hard cases passed. Cost rose 30% on that step rather than 100% across the workflow.',
      language: 'python',
      code: `r = client.messages.create(
    model="claude-sonnet-5-5",
    max_tokens=4096,
    output_config={"effort": "high"},   # try more thinking before a bigger model
    system=ANALYSIS_SYSTEM,
    messages=[{"role": "user", "content": contract_question}],
)`,
      takeaway: 'Failures concentrated on hard cases suggest capability; try effort before changing model tier.',
    },
  ],
  keyPoints: [
    'Five failure classes: prompt failure, hallucination, model mismatch, retrieval failure, integration bug (plus measurement error). Each has a different fix.',
    'Start with "what changed?" and correlate the regression with deployments and data jobs.',
    'Check mechanics first: stop_reason (max_tokens, refusal), tool-result accounting, HTTP errors.',
    'For RAG, inspect retrieved chunks before judging the model; confident-but-wrong after a document refresh points at indexing.',
    'Hallucination is invented specifics absent from the context; mitigate with grounding, permission to say "not available", verifiable citations and downstream validation.',
    'Structural output problems are fixed with structured outputs or strict tool schemas, not prompt pleading.',
    'Failures concentrated on hard cases suggest capability; try raising effort before switching model tier.',
    'Turn every incident into eval cases so the fix becomes a permanent regression test.',
  ],
  flashcards: [
    { front: 'First question in any diagnosis?', back: 'What changed? Correlate the regression with recent deployments, prompt versions, model ids and data jobs.' },
    { front: 'RAG returns confident but wrong answers right after a document refresh; model and latency unchanged. First place to look?', back: 'The retrieval/indexing step: stale or irrelevant chunks, broken re-index, mismatched embeddings.' },
    { front: 'Output ends mid-sentence. What do you check first?', back: 'stop_reason. If it is max_tokens, the fix is the output limit (and streaming), not the prompt.' },
    { front: 'How do you distinguish hallucination from a retrieval failure in a trace?', back: 'Check the retrieved context: if the correct answer was present and ignored, it is prompt/model; if absent and the model answered anyway, retrieval failed and the prompt lacked a "say not available" rule; invented specifics are hallucination.' },
    { front: 'Signature of a model capability mismatch?', back: 'Failures concentrated on the hardest cases while easy cases pass.' },
    { front: 'What to try before upgrading to a larger model for hard-case failures?', back: 'Raise output_config.effort on that step.' },
    { front: 'Why are "temperature too low" and "context window shrank" distractors?', back: 'Sampling parameters are rejected on current models and context windows are fixed per model id; neither changes spontaneously.' },
    { front: 'Minimum fields in a production trace for diagnosis?', back: 'Prompt and model version, full input, retrieved chunk ids, tool calls with results and durations, stop_reason, usage, latency, guardrail decisions.' },
    { front: 'Best fix for malformed JSON output?', back: 'Structured outputs (output_config.format) or a strict tool schema, not more prompt instructions.' },
    { front: 'How do you make an incident fix permanent?', back: 'Add the failing cases to the eval set and confirm they pass after the fix without regressions elsewhere.' },
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
        'Confident-but-wrong answers right after a data change, with model and latency constant, point to retrieval feeding bad context. Model weights do not change under a fixed id, temperature is not accepted on current models, and context windows do not shrink.',
    },
    {
      question:
        'A report generator produces answers that stop mid-sentence. Engineers have added "always complete your answer" to the prompt twice without effect. What should the architect check FIRST?',
      options: [
        'Whether the model needs to be upgraded.',
        'The stop_reason on the truncated responses; max_tokens indicates an output limit, not a prompt problem.',
        'Whether the system prompt is too short.',
        'Whether the retrieval index is stale.',
      ],
      correct: [1],
      explanation:
        'Truncation is a mechanical symptom and stop_reason identifies it directly. Prompt wording, model tier and retrieval cannot fix an output-token limit.',
    },
    {
      question:
        'Traces for a failing support answer show the retrieved chunks did contain the correct policy text, but the model answered from general knowledge instead. Which classification and fix are MOST appropriate?',
      options: [
        'Retrieval failure; rebuild the index.',
        'Prompt or context failure; make the "answer only from provided context" instruction explicit and ensure the relevant chunk is not buried among irrelevant ones.',
        'Integration bug; increase max_tokens.',
        'Hallucination caused by model drift; pin an older model.',
      ],
      correct: [1],
      explanation:
        'The right information reached the model and was ignored, so retrieval did its job. The fix is in instructions and context ordering. max_tokens is unrelated and nothing indicates model drift.',
    },
    {
      question: 'Which TWO are integration bugs rather than model-behaviour problems? (Select two)',
      options: [
        'The agent loop returns only two of three tool results, so the model continues with incomplete data.',
        'The model invents a clause number that does not exist in the contract.',
        'A retry on timeout re-executes a payment tool, double-charging the customer.',
        'The model fails only on the most complex multi-step cases.',
      ],
      correct: [0, 2],
      explanation:
        'Missing tool results and non-idempotent retries are application-code defects. Invented clauses are hallucination; hard-case failures suggest a capability or effort mismatch.',
    },
    {
      question:
        'A contract-analysis step on Sonnet 5.5 fails on multi-clause questions while simple ones pass. Cost is a concern. What is the BEST next step?',
      options: [
        'Switch the entire workflow to Opus 5.5.',
        'Raise output_config.effort for that step and re-run the eval before considering a model change.',
        'Add "think harder" to the system prompt.',
        'Reduce the context to only the first clause.',
      ],
      correct: [1],
      explanation:
        'Effort is the cheapest capability lever and is applied per step. Upgrading the whole workflow is costly and premature, prompt pleading is weaker than the effort control, and truncating context removes the information needed.',
    },
    {
      question:
        'A model returns stop_reason "refusal" on a small fraction of legitimate security-research requests. Which response is MOST appropriate?',
      options: [
        'Retry the identical request in a loop until it succeeds.',
        'Handle the refusal stop reason explicitly, surface it to the user, and consider server-side fallbacks for declined requests.',
        'Treat it as an integration timeout and increase the client timeout.',
        'Ignore it; refusals never affect legitimate traffic.',
      ],
      correct: [1],
      explanation:
        'A refusal is a safety classifier outcome and must be handled as such. Blind retries waste money and may not change the outcome, it is not a timeout, and refusals can affect legitimate dual-use topics.',
    },
  ],
  statements: [
    { text: 'Confident, fluent, specific and wrong is the signature of hallucination or of a model fed bad context.', isTrue: true, explanation: 'The trace tells you which: check whether the context contained the right answer.' },
    { text: 'When a RAG system regresses after a data refresh, the prompt is the most likely cause.', isTrue: false, explanation: 'The most recent change is the retrieval index; investigate it first.' },
    { text: 'stop_reason max_tokens indicates the model decided its answer was complete.', isTrue: false, explanation: 'It indicates truncation at the output limit; end_turn indicates a natural finish.' },
    { text: 'Raising effort is a reasonable step before upgrading model tier when hard cases fail.', isTrue: true, explanation: 'Effort increases thinking depth on the same model at lower cost than a tier change.' },
    { text: 'Context windows can shrink spontaneously between requests to the same model id.', isTrue: false, explanation: 'Context window size is fixed per model; this is a common distractor.' },
    { text: 'Adding failing production cases to the eval set turns an incident fix into a regression test.', isTrue: true, explanation: 'It confirms the fix and prevents the same failure from recurring unnoticed.' },
    { text: 'Malformed JSON is best fixed by repeating the format instruction in capital letters.', isTrue: false, explanation: 'Use structured outputs or a strict tool schema to enforce the shape mechanically.' },
  ],
  resources: [
    { label: 'Reduce hallucinations (Claude docs)', url: 'https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations' },
    { label: 'Structured outputs (Claude docs)', url: 'https://platform.claude.com/docs/en/build-with-claude/structured-outputs' },
    { label: 'Handling stop reasons (Claude docs)', url: 'https://platform.claude.com/docs/en/build-with-claude/handling-stop-reasons' },
  ],
};
