import type { Concept } from '../../types';

export const documentationAndImplementationGuidance: Concept = {
  id: 'documentation-and-implementation-guidance',
  title: 'Documentation and Implementation Guidance',
  summary:
    'Produce the documents an engineering team needs to build and run a Claude system: architecture docs with data-flow and control points, runbooks for the failures that will happen, change logs for prompts and configuration, and a handoff package that makes the system operable without the architect in the room.',
  certs: ['ccar-p', 'ccdv-f'],
  domains: ['ccar-p-6', 'ccdv-f-2'],
  tags: ['documentation', 'runbooks', 'handoff', 'change-management', 'prompts-as-code'],
  difficulty: 'advanced',
  sections: [
    {
      heading: 'Architecture documentation',
      body: `Architecture documentation for an LLM system answers questions that ordinary service docs do not: what does the model see, what can it do, and what stops it doing harm. A complete set:

- **Context and goals**: a link to the requirements brief and the success criteria.
- **System diagram**: components, data stores, external systems, model platform (with region and retention terms), and the request path from input to output to feedback loop.
- **Data-flow map**: every place regulated or sensitive data travels, including logs, traces, caches, eval sets and human reviewers. Compliance reviewers start here.
- **Control points**: where each guardrail layer sits (input filtering, prompt policy, tool allowlist, hooks, output validation, human approval) and what each one catches.
- **Model and prompt inventory**: which model id and effort each step uses, where the prompt lives in the repo, which tools and MCP servers are attached and with what scopes.
- **Interfaces**: tool schemas, output schemas, API contracts with upstream and downstream systems, authentication.
- **ADRs**: the decision history, linked from the sections they affect.
- **Non-functional characteristics**: SLOs, capacity, cost model per task, rate-limit headroom.

Keep it in the repository in plain text or Markdown with diagrams-as-code where possible, so it is versioned with the prompts and reviewed in the same pull requests. A document that lives in a wiki nobody updates is worse than none, because it is confidently wrong.`,
    },
    {
      heading: 'Runbooks',
      body: `A runbook is the document an on-call engineer opens at 3 a.m. It exists for each alert and for each predictable incident type. For a Claude system the catalogue usually includes:

| Incident | Runbook content |
|---|---|
| Elevated 429 / rate limits | Check headroom, which key or workspace, enable queueing or backoff adjustments, contact for limit increase |
| Platform 5xx or outage | Confirm on status page, switch to degraded mode (fallback model, retrieval-only answer), communicate, roll back when recovered |
| Quality drift alert | Pull the daily sample, classify failures (retrieval, prompt, model, grader), check recent changes (prompt version, index refresh, model id), decide freeze or rollback |
| Refusal-rate spike or collapse | Sample refused requests, classify appropriate vs inappropriate, check prompt and model changes, check guardrail health |
| Cost spike | Check cache hit rate, loop iteration counts, new traffic sources, runaway agents; apply budget caps |
| Suspected prompt injection or data leak | Preserve traces, disable affected tool or route, notify security and compliance, follow incident process |
| Truncation increase | Check max_tokens, output length trend, streaming configuration |

Each runbook states: the alert that triggers it, how to confirm, the diagnostic steps in order with the exact queries or dashboards, the remediation options and their side effects, who to notify, and how to close (including adding eval cases). Write them while building, test them in game days, and update them after every incident.`,
    },
    {
      heading: 'Prompt and configuration change logs',
      body: `Prompts, tool descriptions, system configuration and model ids are **code**. They change behaviour and they need the same traceability:

- Store prompts in version control, one file per prompt, with a version identifier that is recorded in every log line and eval result.
- Review prompt changes in pull requests with the eval gate attached; the reviewer sees the diff, the eval delta and the reason.
- Maintain a **change log** per system: date, what changed (prompt, tool, model id, effort, retrieval config, guardrail), why, eval before/after, who approved, rollout plan and rollback trigger. When a stakeholder asks "why did behaviour change last Tuesday?", the answer is in the log.
- Treat model upgrades as entries in the same log, with the shadow and canary results attached.
- Record configuration that lives outside the repo (platform settings such as retention or residency, rate limits, MCP server versions) in the same place, because "nothing changed in the repo" is a common false lead.

This discipline turns the eval and monitoring data into a navigable history and makes audits (internal or regulatory) answerable from records rather than memory.`,
    },
    {
      heading: 'The handoff package',
      body: `Handoff is a lifecycle phase, not an email. The architect hands the system to the team that will run and evolve it, and the package must let them do so without the architect. Contents:

1. Architecture docs and ADRs (above), current and reviewed.
2. The **requirements brief** with success criteria and non-goals, so the team knows what "working" means and what not to build.
3. **Eval suite** with instructions to run it, the current baseline numbers, the noise floor, and the release-blocking thresholds.
4. **Monitoring**: dashboards, alert definitions, and the runbook for each alert.
5. **Operational ownership**: on-call rotation, escalation contacts (engineering, business owner, compliance, platform vendor), and the risk register with owners.
6. **Change process**: how prompts, tools, models and configuration are changed, reviewed, tested and rolled out; the change log.
7. **Known limitations and open risks**, honestly stated, with the current mitigations.
8. **Developer environment guidance**: how to run locally, test credentials and data boundaries (no production data in dev), and team conventions (for example the repository's CLAUDE.md and shared skills if Claude Code is used).
9. A **walkthrough session** recorded, and a period of shadow support where the architect is available but the team drives.

Exam angle: scenarios about handoff reward completeness and operability (evals, runbooks, ownership, change process) over code-only transfers, and reward documentation that is versioned with the system over static documents that drift.`,
    },
  ],
  examples: [
    {
      title: 'Runbook for a quality-drift alert',
      description:
        'The runbook an on-call engineer follows when the daily groundedness score drops below the threshold. It is ordered by likelihood and cost and ends with closing actions that feed the eval.',
      language: 'markdown',
      code: `# RB-07 Quality drift: groundedness below 0.93

Trigger: alert "groundedness_daily < 0.93" (dashboard: ai-platform/quality)

1. Confirm: open the daily sample run; check judge health (agreement job green?). If judge failed -> RB-12.
2. What changed in the last 72h? Check change log: prompt version, model id, retrieval index refresh,
   MCP server version, platform settings. Most drift follows a change.
3. Classify 20 failing cases from the sample:
   - retrieved chunks wrong/stale  -> index or ingestion issue -> page data-platform on-call
   - chunks right, answer ignores them -> prompt regression -> roll back prompt version (see 5)
   - invented specifics -> hallucination class -> check grounding instruction present; escalate to prompt owner
4. If a model id changed: compare with shadow results; roll back model id if not shadow-tested.
5. Rollback: \`deploy prompt --version <previous>\`; confirm next hourly sample recovers.
6. Close: add failing cases to eval set; log incident; update change log; notify business owner.`,
      takeaway: 'A runbook orders diagnosis by likelihood, names the exact actions and closes by improving the eval.',
    },
    {
      title: 'The wiki that lied',
      description:
        'A team inherited a Claude-based contract assistant with a 40-page architecture wiki. During an incident they followed it to a retrieval service that had been replaced eight months earlier; the prompt in the wiki was three versions old. Two hours were lost. The replacement was a docs/ directory in the repository with the current diagram-as-code, the prompt files themselves, and a CI check that fails if a prompt changes without a change-log entry.',
      takeaway: 'Documentation that is not versioned with the system drifts into being confidently wrong.',
    },
    {
      title: 'A change-log entry',
      description:
        'Every behavioural change, including a model upgrade and a platform setting, gets an entry with its eval delta, approval and rollback trigger.',
      language: 'markdown',
      code: `## 2026-10-14  claims-intake v3.4.0
- Change: model claude-sonnet-5 -> claude-sonnet-5-5 for extraction step; prompt extract.md v17 -> v18
  (removed two few-shot examples, added "mark fields not present as null" rule)
- Why: upgrade before 5.0 deprecation; v17 produced empty strings instead of nulls on 4% of cases
- Eval: accuracy 95.1% -> 96.4% (n=400, 2 reps, noise +/-5); null handling 100%; p95 4.1s -> 3.6s;
  cost/claim $0.041 -> $0.033. Shadow 7 days: agreement 98.2%.
- Approved: J. Ortiz (business), R. Chen (eng lead)
- Rollout: canary 10% (2 days) -> 50% -> 100%. Rollback trigger: incorrect-triage weekly > 1.5%
- Config outside repo: none`,
      takeaway: 'A change log makes "why did behaviour change?" answerable from records, including model upgrades.',
    },
    {
      title: 'Handoff that worked',
      description:
        'An architect handed a procurement agent to a platform team using a checklist: repo with prompts and docs, eval suite run live in the session (baseline 91.8%, noise ±4), dashboards and seven runbooks, risk register with owners, change process in CONTRIBUTING.md, a recorded walkthrough, and two weeks of shadow support. Three months later the team shipped a model upgrade through the documented process without contacting the architect.',
      takeaway: 'A handoff is complete when the receiving team can change the system safely without you.',
    },
  ],
  keyPoints: [
    'Architecture docs for LLM systems add a data-flow map, control points, and a model/prompt/tool inventory to the usual diagrams and interfaces.',
    'Keep documentation in the repository, versioned with prompts and config; wiki documents drift and mislead.',
    'Write a runbook per alert and per predictable incident: trigger, confirmation, ordered diagnostics, remediations with side effects, contacts, closing actions.',
    'Prompts, tool descriptions, model ids and effort are code: version them, review with the eval gate, record a version id in every log and eval result.',
    'Maintain a change log covering repo changes, model upgrades and out-of-repo platform settings, with eval before/after, approver, rollout and rollback trigger.',
    'The handoff package includes docs, ADRs, the brief, the eval suite with baselines, monitoring and runbooks, ownership and escalation, the change process, known limitations, dev guidance and a walkthrough.',
    'Handoff is complete when the receiving team can change the system safely without the architect.',
  ],
  flashcards: [
    { front: 'What three LLM-specific sections belong in architecture docs?', back: 'Data-flow map (including logs, traces, evals, reviewers), control points for each guardrail layer, and the model/prompt/tool inventory.' },
    { front: 'Where should architecture documentation live?', back: 'In the repository, versioned with prompts and configuration, reviewed in the same pull requests.' },
    { front: 'What does every runbook contain?', back: 'Trigger, confirmation step, ordered diagnostic steps with exact queries, remediation options and side effects, contacts, closing actions including eval updates.' },
    { front: 'Name five incident types that need runbooks in a Claude system.', back: 'Rate limits, platform outage, quality drift, refusal-rate change, cost spike (also injection/leak, truncation).' },
    { front: 'Why record a prompt version id in every log line?', back: 'So any behaviour change or eval result can be traced to the exact prompt in use.' },
    { front: 'What belongs in a change-log entry?', back: 'Date, what changed (prompt, tool, model, effort, config), why, eval before/after, approver, rollout plan, rollback trigger, out-of-repo config changes.' },
    { front: 'Why log configuration that lives outside the repo?', back: 'Platform settings, rate limits and MCP server versions change behaviour; "nothing changed in the repo" is a false lead otherwise.' },
    { front: 'What is in a handoff package beyond code and docs?', back: 'Eval suite with baselines and thresholds, monitoring and runbooks, ownership and escalation, change process, known limitations, dev guidance, recorded walkthrough, shadow-support period.' },
    { front: 'When is a handoff complete?', back: 'When the receiving team can safely change and operate the system without the architect.' },
  ],
  quiz: [
    {
      question:
        'A platform team is about to receive a Claude-based system from an architect. Which handoff is MOST complete?',
      options: [
        'The source repository and a one-hour demo.',
        'Repository with prompts and docs, eval suite with baseline and thresholds, dashboards and runbooks, risk register with owners, change process, known limitations and a recorded walkthrough with shadow support.',
        'A 40-page wiki and the architect\'s phone number.',
        'The system prompt and the model id.',
      ],
      correct: [1],
      explanation:
        'Operability requires evals, monitoring, runbooks, ownership and a change process. Code alone, static wikis or the prompt text do not let a team change the system safely.',
    },
    {
      question:
        'On-call engineers repeatedly waste time during incidents because the architecture wiki describes components that no longer exist. What is the BEST structural fix?',
      options: [
        'Schedule a quarterly wiki review.',
        'Move documentation into the repository as versioned Markdown and diagrams-as-code, reviewed in the same pull requests as prompt and code changes, with a CI check tying prompt changes to change-log entries.',
        'Add a disclaimer that the wiki may be outdated.',
        'Delete the documentation.',
      ],
      correct: [1],
      explanation:
        'Versioning docs with the system keeps them current by construction. Periodic reviews and disclaimers do not prevent drift, and deleting documentation leaves on-call with nothing.',
    },
    {
      question: 'Which TWO items belong in a prompt/configuration change-log entry? (Select two)',
      options: [
        'Eval results before and after the change, with the noise floor.',
        'The rollback trigger and rollout plan.',
        'The architect\'s favourite model.',
        'A copy of the entire conversation history of a test session.',
      ],
      correct: [0, 1],
      explanation:
        'Eval deltas and rollout/rollback details make the change reviewable and reversible. Personal preferences and raw test transcripts are not change-log content.',
    },
    {
      question:
        'A stakeholder asks why the assistant\'s behaviour changed on a specific Tuesday. The repository shows no commits that week. What is the MOST likely explanation and the documentation gap?',
      options: [
        'The model weights changed; nothing could have been documented.',
        'A configuration change outside the repository (platform setting, model id in deployment config, MCP server version, index refresh) that the change log should have recorded.',
        'The stakeholder is mistaken.',
        'Documentation cannot explain behaviour changes in LLM systems.',
      ],
      correct: [1],
      explanation:
        'Out-of-repo configuration commonly changes behaviour; the change log should cover it. Model weights do not change under a fixed id, and dismissing the stakeholder or the possibility of documentation is unhelpful.',
    },
    {
      question:
        'An on-call engineer receives a "groundedness below threshold" alert at night. Which runbook step should come FIRST?',
      options: [
        'Switch to a larger model.',
        'Confirm the alert is genuine (judge health) and check what changed in the last 72 hours in the change log.',
        'Rewrite the system prompt.',
        'Disable the alert.',
      ],
      correct: [1],
      explanation:
        'Confirming the signal and checking recent changes is the cheapest, most likely path to the cause. Changing models or prompts blindly can worsen the situation, and disabling alerts removes detection.',
    },
    {
      question:
        'Which practice BEST supports regulatory audits of an AI system\'s behaviour over time?',
      options: [
        'Keeping prompts in a shared document that anyone can edit.',
        'Versioned prompts with ids recorded in every log and eval result, plus a change log with approvals and eval deltas.',
        'Relying on the team\'s memory of changes.',
        'Storing full conversation content indefinitely.',
      ],
      correct: [1],
      explanation:
        'Traceable versions and approvals answer audit questions from records. Editable documents and memory are unreliable, and indefinite content storage conflicts with retention minimization.',
    },
  ],
  statements: [
    { text: 'Prompts and tool descriptions should be treated as code with version control and review.', isTrue: true, explanation: 'They change behaviour and need the same traceability and eval gating.' },
    { text: 'A wiki is the best home for architecture documentation because non-engineers can edit it.', isTrue: false, explanation: 'Documentation versioned with the system in the repository stays current; wikis drift.' },
    { text: 'Runbooks should include the exact queries, dashboards and commands to use.', isTrue: true, explanation: 'On-call engineers need actionable steps, not principles.' },
    { text: 'A change log only needs to cover changes committed to the repository.', isTrue: false, explanation: 'Out-of-repo configuration (platform settings, model ids in deployment, MCP versions, index refreshes) must be logged too.' },
    { text: 'A handoff is complete once the code is transferred and the architect has given a demo.', isTrue: false, explanation: 'Completeness means the team can run and change the system safely: evals, runbooks, ownership, change process.' },
    { text: 'Model upgrades should appear in the same change log as prompt changes.', isTrue: true, explanation: 'They change behaviour and need eval, shadow and rollout records.' },
    { text: 'Runbooks should end with closing actions such as adding eval cases.', isTrue: true, explanation: 'This turns incidents into permanent regression tests.' },
  ],
  resources: [
    { label: 'Claude Code: CLAUDE.md and memory', url: 'https://code.claude.com/docs/en/memory' },
    { label: 'Using the Evaluation tool (Claude docs)', url: 'https://platform.claude.com/docs/en/test-and-evaluate/eval-tool' },
  ],
};
