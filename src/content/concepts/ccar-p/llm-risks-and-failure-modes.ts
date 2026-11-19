import type { Concept } from '../../types';

export const llmRisksAndFailureModes: Concept = {
  id: 'llm-risks-and-failure-modes',
  title: 'LLM Risks and Failure Modes',
  summary:
    'Name the ways Claude systems fail in production, from hallucination and prompt injection to cascading multi-agent errors and behaviour drift across model releases, and manage them with a risk register that pairs each risk with a control and an owner.',
  certs: ['ccar-p', 'ccdv-f', 'ccao-f', 'ccar-f'],
  domains: ['ccar-p-5', 'ccdv-f-7', 'ccao-f-6', 'ccar-f-5'],
  tags: ['risk', 'hallucination', 'prompt-injection', 'multi-agent', 'governance'],
  difficulty: 'advanced',
  diagram: 'prompt-injection-defense',
  sections: [
    {
      heading: 'Model-level failure modes',
      body: `Some risks come from the nature of language models and will be present in every system regardless of architecture:

- **Hallucination.** Fluent, specific, confident and wrong. Most likely when the model is asked for facts it was not given, when the prompt discourages "I don't know", and for long-tail entities (case numbers, citations, API names). Mitigate with grounding, explicit uncertainty permission, verifiable citations and downstream validation of high-stakes claims.
- **Non-determinism.** The same input can produce different outputs. Sampling parameters are no longer accepted on current models, so you cannot "turn it off". Design for it: structured outputs for shape, evals with repetitions for measurement, idempotent tools for actions.
- **Instruction-following gaps.** Rules buried in very long prompts, contradictory instructions, or examples that conflict with rules are silently ignored some of the time.
- **Capability limits.** Complex multi-step reasoning, precise arithmetic over many figures, and tasks needing knowledge after the training cutoff fail without tools. Give the model a calculator, a search tool or a code sandbox instead of hoping.
- **Behaviour drift across releases.** A new model version under a new id can refuse differently, format differently, use tools more or less eagerly, or respond differently to the same prompt. Model ids are stable, so drift happens when *you* upgrade, which is why every upgrade goes through the eval and a shadow or canary phase.`,
    },
    {
      heading: 'System-level failure modes',
      body: `Other risks appear when the model is wired into tools, data and other agents:

- **Prompt injection.** Direct (the user tries to override the system prompt) or indirect (instructions hidden in a web page, document, email or tool result the model processes). Indirect injection is the more dangerous one in agentic systems because the attacker never talks to the model; they plant text where the model will read it. Defences: treat retrieved content as data, least-privilege tools, approval gates on side effects, output validation, and never placing secrets in the context.
- **Data leakage.** Sensitive data entering the model (PII in prompts), leaving it (model reveals another tenant's data pulled by a shared retrieval index), or persisting where policy forbids (logs, caches, vendor retention). Controls: redaction, tenant-scoped retrieval filters enforced in code, retention settings, log classification.
- **Tool misuse.** The model calls the right tool with wrong parameters, calls a destructive tool when a read would do, or loops on a failing tool. Controls: strict schemas, parameter validation, idempotency keys, iteration and budget caps.
- **Over-reliance and automation bias.** Humans stop checking outputs that are usually right. The system is then only as good as its worst undetected error. Controls: confidence-based routing, mandatory review sampling, UI that shows sources and uncertainty.
- **Cascading failures in multi-agent systems.** One subagent hallucinates a fact; the orchestrator treats it as ground truth; three downstream agents build on it. Errors compound and are hard to trace. Controls: validate subagent outputs at boundaries, keep subagents narrow with explicit output schemas, give the orchestrator the authority and the information to reject or re-run a step, trace every hop, and cap total iterations and spend.`,
    },
    {
      heading: 'Operational and organizational risks',
      body: `- **Availability and rate limits.** 429s and 5xx under load, regional outages. Controls: retries with backoff, rate-limit headroom, queueing, graceful degradation, and where justified a second platform (Bedrock, Vertex, Foundry) for continuity.
- **Cost runaway.** An agent loop with no cap, a lost cache hit rate, a recursive subagent. Controls: per-task budgets, iteration limits, alerts on cost per task.
- **Deprecation.** Models and API features are retired on published schedules. Controls: subscribe to deprecation notices, keep the eval ready, avoid hard-coding ids in many places.
- **Vendor and compliance change.** Terms, data-handling defaults and regional availability evolve. Controls: an owner who reviews changes and a documented data-flow map.
- **Skill erosion and worker impact.** Teams lose the ability to do or check the work the system does. Controls: keep humans in review roles that exercise judgment, invest in training, and be honest in planning about job impact.

Each of these has bitten real deployments. The exam tests whether you can name the failure from a scenario and choose the control that addresses the cause rather than the symptom.`,
    },
    {
      heading: 'The risk register approach',
      body: `Governance means writing risks down and assigning them, not hoping. A **risk register** for an LLM system is a living table, reviewed at each lifecycle gate:

| Field | Example |
|---|---|
| Risk | Indirect prompt injection via vendor emails read by the procurement agent |
| Failure mode | Agent follows embedded instruction to change payment details |
| Likelihood / impact | Medium / High (financial loss, fraud) |
| Existing controls | Data-not-instructions framing; payment tool requires approval gate; output validator flags bank-detail changes |
| Residual risk | Low |
| Detection | Alert on approval-gate volume; weekly review sample |
| Owner | Payments platform lead |
| Review date | Next model upgrade or quarterly |

Rules of thumb: every high-impact risk needs a **preventive** control and a **detective** control; every control has a test (ideally in CI); every risk has a named owner. The register feeds the architecture decision records, the runbooks and the eval set. When a model upgrade or a new tool is proposed, the first question is "which rows change?"

Exam angle: scenarios often describe a symptom and offer options at different layers. Pick the option that addresses the *cause* (remove the capability, validate at the boundary, ground the model) over the one that treats the symptom (bigger model, more logging, a polite instruction).`,
    },
  ],
  examples: [
    {
      title: 'Cascading error in a research pipeline',
      description:
        'A market-research system used a coordinator and four subagents. The "company facts" subagent hallucinated a revenue figure; the coordinator passed it, unverified, to the valuation and recommendation agents, which produced a confident, internally consistent and wrong report. The fix: the facts subagent returns a schema with a source URL per claim, the coordinator rejects claims without sources, and a validator re-fetches a sample of sources before downstream agents run.',
      takeaway: 'Validate at every agent boundary; a single unverified fact compounds across the whole system.',
    },
    {
      title: 'Tenant-scoped retrieval enforced in code',
      description:
        'A multi-tenant support assistant once returned a snippet from another customer\'s contract because the tenant filter lived in the prompt ("only use documents for tenant X"). The filter was moved into the retrieval query so documents from other tenants never enter the context at all.',
      language: 'python',
      code: `def retrieve(query: str, tenant_id: str, k: int = 8):
    # Hard filter at the data layer: the model never sees other tenants' chunks.
    return vector_store.search(
        query=query,
        k=k,
        filter={"tenant_id": {"$eq": tenant_id}},
    )

chunks = retrieve(user_question, tenant_id=session.tenant_id)
context = "\\n\\n".join(f"<doc id='{c.id}'>{c.text}</doc>" for c in chunks)`,
      takeaway: 'Data-leakage controls belong in the data layer, not in instructions to the model.',
    },
    {
      title: 'The upgrade that changed refusal behaviour',
      description:
        'A legal-tech team swapped model ids in production on a Friday to pick up a newer model. Monday\'s dashboards showed refusal rate up fivefold on a category of legitimate contract questions and a different JSON key casing in outputs that broke a parser. Both would have appeared in the nightly eval and a one-week shadow run. The team now treats every model upgrade as a release with eval, shadow and canary phases.',
      takeaway: 'Behaviour drift happens when you upgrade; run the upgrade through the same gates as any release.',
    },
    {
      title: 'A risk register row that changed the architecture',
      description:
        'During design review of an HR assistant, the register listed "model reveals salary data to an employee without entitlement" as High impact. Existing controls were only prompt instructions. The team added entitlement checks in the retrieval tool, an output scanner for salary-shaped numbers, and a weekly sample review by HR. Residual risk moved to Low and the row gained an owner and a test in CI.',
      takeaway: 'Writing the risk down with its controls exposed that the only control was advisory.',
    },
  ],
  keyPoints: [
    'Model-level risks: hallucination, non-determinism, instruction-following gaps, capability limits, behaviour drift across releases.',
    'System-level risks: direct and indirect prompt injection, data leakage, tool misuse, over-reliance, cascading multi-agent failures.',
    'Operational risks: rate limits and outages, cost runaway, deprecations, vendor and compliance change, workforce impact.',
    'Indirect injection is the key agentic threat: the attacker plants instructions where the model will read them.',
    'Cascading failures are controlled by validating at agent boundaries, narrow subagents with schemas, tracing and caps.',
    'Model ids are stable; drift arrives when you upgrade, so upgrades go through eval, shadow and canary like any release.',
    'Maintain a risk register: risk, failure mode, likelihood/impact, preventive and detective controls, residual risk, owner, review date.',
    'Choose controls that address the cause (remove, validate, ground) over those that treat the symptom (bigger model, more logging, polite instruction).',
  ],
  flashcards: [
    { front: 'Direct vs indirect prompt injection?', back: 'Direct: the user tries to override instructions. Indirect: instructions hidden in content the model processes (documents, web pages, tool results).' },
    { front: 'Why is indirect injection the bigger risk in agentic systems?', back: 'The attacker never talks to the model; they plant text where the model will read it, and the agent has tools to act on it.' },
    { front: 'What is a cascading failure in a multi-agent system?', back: 'One agent\'s error is accepted as fact by others and compounds downstream.' },
    { front: 'Three controls for cascading failures?', back: 'Validate outputs at agent boundaries, narrow subagents with explicit schemas, tracing plus iteration and spend caps.' },
    { front: 'What is automation bias / over-reliance?', back: 'Humans stop checking outputs that are usually right, so undetected errors pass through.' },
    { front: 'When does model behaviour drift occur for a pinned model id?', back: 'It does not; drift appears when you upgrade to a new model id, which is why upgrades need eval, shadow and canary.' },
    { front: 'Where should a multi-tenant data filter live?', back: 'In the retrieval query / data layer, so other tenants\' data never reaches the context.' },
    { front: 'Minimum fields of a risk register row?', back: 'Risk, failure mode, likelihood/impact, existing controls, residual risk, detection, owner, review date.' },
    { front: 'Every high-impact risk needs which two kinds of control?', back: 'A preventive control and a detective control, each with a test.' },
    { front: 'Why can\'t non-determinism be switched off on current models?', back: 'Sampling parameters (temperature, top_p, top_k) are rejected; design for variance with structured outputs, evals with repetitions and idempotent tools.' },
  ],
  quiz: [
    {
      question:
        'A procurement agent reads supplier emails and can update payment details. A supplier email contains hidden text instructing the agent to change the bank account for future payments, and the agent complies. Which failure mode is this and which control addresses the CAUSE?',
      options: [
        'Hallucination; add retrieval grounding.',
        'Indirect prompt injection; require human approval for payment-detail changes and treat email content as data, not instructions.',
        'Model drift; pin an older model.',
        'Rate limiting; add retries.',
      ],
      correct: [1],
      explanation:
        'Instructions planted in processed content are indirect injection. An approval gate on the side effect and data framing address the cause. The model did not invent anything (not hallucination), the model did not change (not drift), and rate limits are unrelated.',
    },
    {
      question:
        'In a four-agent analysis pipeline, a final report cites a revenue figure that no source supports. Investigation shows the first subagent produced it and every later agent used it. Which design change MOST reduces recurrence?',
      options: [
        'Use a larger model for the final agent only.',
        'Require each subagent to return claims with sources in a schema and have the coordinator reject or re-run unsourced claims before passing them on.',
        'Add a disclaimer to the report.',
        'Increase max_tokens for all agents.',
      ],
      correct: [1],
      explanation:
        'Cascading failures are stopped by validation at agent boundaries. A bigger final model inherits bad inputs, a disclaimer does not fix correctness, and max_tokens is unrelated.',
    },
    {
      question: 'Which TWO are risks specific to upgrading to a new Claude model id? (Select two)',
      options: [
        'Refusal behaviour and output formatting may change on the same prompts.',
        'The context window of the old model shrinks.',
        'Tool-calling eagerness may differ, changing loop length and cost.',
        'Prompt caching stops working permanently.',
      ],
      correct: [0, 2],
      explanation:
        'New models can differ in refusals, formatting and tool-use behaviour, which is why upgrades go through evals. The old model\'s context does not change, and caching works on the new model (the cache starts cold, not broken).',
    },
    {
      question:
        'A multi-tenant assistant returned a snippet from another customer\'s documents. The prompt says "only use documents belonging to the current tenant". What is the correct fix?',
      options: [
        'Repeat the instruction more forcefully in the system prompt.',
        'Apply the tenant filter in the retrieval query so other tenants\' chunks never enter the context.',
        'Switch to a model with better instruction following.',
        'Log all responses for later review.',
      ],
      correct: [1],
      explanation:
        'Data leakage must be prevented in the data layer. Instructions and model choice are advisory, and logging detects rather than prevents.',
    },
    {
      question:
        'After six months, reviewers approve 99.8% of an AI-drafted insurance decisions without changes, and review time per case has fallen to 8 seconds. What risk does this indicate and what is the BEST response?',
      options: [
        'The system is perfect; remove human review.',
        'Over-reliance / automation bias; introduce confidence-based routing, mandatory deep review of a stratified sample, and track reviewer catch rate.',
        'Hallucination; add retrieval.',
        'Cost runaway; add a budget cap.',
      ],
      correct: [1],
      explanation:
        'Near-universal rubber-stamping with trivial review time is the signature of automation bias. Removing review would entrench it; the other options address different failure modes.',
    },
    {
      question:
        'An architect is asked to present how risks of a new Claude-based system are managed. Which artifact BEST demonstrates governance?',
      options: [
        'A slide stating the model is "state of the art".',
        'A risk register listing each risk with likelihood, impact, preventive and detective controls, residual risk and an owner.',
        'The system prompt.',
        'A list of all available tools.',
      ],
      correct: [1],
      explanation:
        'A register makes risks, controls and accountability explicit and reviewable. Marketing claims, the prompt alone and a tool inventory do not show how risks are managed.',
    },
  ],
  statements: [
    { text: 'Indirect prompt injection requires the attacker to interact with the model directly.', isTrue: false, explanation: 'Indirect injection plants instructions in content the model will process; the attacker never talks to the model.' },
    { text: 'Non-determinism can be eliminated on current models by setting temperature to zero.', isTrue: false, explanation: 'Sampling parameters are rejected on the current API version; design for variance instead.' },
    { text: 'A pinned model id does not change behaviour on its own; drift appears when you upgrade.', isTrue: true, explanation: 'This is why upgrades are treated as releases with eval, shadow and canary phases.' },
    { text: 'Validating subagent outputs at boundaries helps prevent cascading failures in multi-agent systems.', isTrue: true, explanation: 'Errors compound only if downstream agents accept unverified outputs.' },
    { text: 'A tenant-isolation rule in the system prompt is a sufficient data-leakage control for multi-tenant RAG.', isTrue: false, explanation: 'The filter must be enforced in the retrieval query so other tenants\' data never reaches the model.' },
    { text: 'Each high-impact risk in a register should have both a preventive and a detective control.', isTrue: true, explanation: 'Prevention reduces likelihood; detection catches what prevention misses.' },
    { text: 'Reviewers approving nearly all AI outputs in seconds is evidence the system needs no oversight.', isTrue: false, explanation: 'It is the signature of automation bias; oversight should be redesigned, not removed.' },
  ],
  resources: [
    { label: 'Mitigate jailbreaks and prompt injections (Claude docs)', url: 'https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks' },
    { label: 'Reduce hallucinations (Claude docs)', url: 'https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations' },
    { label: 'Model deprecations (Claude docs)', url: 'https://platform.claude.com/docs/en/about-claude/model-deprecations' },
  ],
};
