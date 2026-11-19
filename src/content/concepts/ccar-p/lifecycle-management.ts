import type { Concept } from '../../types';

export const lifecycleManagement: Concept = {
  id: 'lifecycle-management',
  title: 'Lifecycle Management',
  summary:
    'Support a Claude system through discovery, design, build, handoff, monitoring and iteration; run model upgrades through a playbook with eval, shadow and canary stages; handle deprecations before they become outages; and keep evaluation continuous rather than a launch event.',
  certs: ['ccar-p', 'ccdv-f'],
  domains: ['ccar-p-6', 'ccdv-f-2', 'ccdv-f-5'],
  tags: ['lifecycle', 'model-upgrade', 'deprecation', 'continuous-evaluation', 'operations'],
  difficulty: 'advanced',
  diagram: 'eval-loop',
  sections: [
    {
      heading: 'The phases and their gates',
      body: `A Claude system moves through six phases, and each phase ends with a gate that produces a specific artifact. Skipping gates is how teams end up with a demo in production.

| Phase | Main activities | Gate artifact |
|---|---|---|
| **Discovery** | Interviews, workflow mapping, success criteria, constraints, non-goals, usage-policy and compliance feasibility | Signed requirements brief |
| **Design** | Pattern and model selection, data flow, guardrail layers, human roles, eval and monitoring design, risk register | Architecture docs, ADRs, eval plan |
| **Build** | Prompts, tools, retrieval, integration, eval suite, guardrails, observability; iterate against the eval | Eval at or above release thresholds; red-team results; runbooks |
| **Handoff** | Documentation, training, ownership, change process, shadow support | Handoff package accepted by the operating team |
| **Monitoring** | Dashboards, alerts, sampled review, feedback pipeline, cost attribution | Monthly review against success criteria |
| **Iteration** | Prioritized changes, model upgrades, new capabilities, eval refresh | Each change released through the eval gate with a change-log entry |

The architect's role shifts across phases: leading in discovery and design, guiding in build, enabling in handoff, advising in monitoring and iteration. The artifacts from early phases (brief, ADRs, risk register, eval) are what make the late phases possible; a system with no eval cannot be iterated safely, and a system with no brief cannot be judged.`,
    },
    {
      heading: 'The model upgrade playbook',
      body: `Anthropic releases new models regularly, and a model id you pin today will eventually be deprecated. Upgrading is routine work, but it is a behaviour change and must be treated as a release. The playbook:

1. **Read the migration guidance** for the target model: changed parameters (for example \`budget_tokens\` removed in favour of adaptive thinking and \`output_config.effort\`, prefill and forced \`tool_choice\` no longer accepted, sampling parameters rejected), behavioural notes (refusal patterns, tool-use eagerness, formatting), and pricing.
2. **Fix request shape** first in a branch: anything the new model rejects with a 400 is found by running the eval once.
3. **Run the full eval** on the new model with the current prompts. Compare per metric, including cost per task, latency and refusal rates, using repetitions and the noise floor. Expect some prompts to need simplification: newer models often need fewer instructions and fewer few-shot examples.
4. **Re-run adversarial and fairness tests**; safety behaviour and bias properties shift between releases.
5. **Shadow** on real traffic for a period that covers the weekly cycle; measure agreement and the distribution of differences.
6. **Canary** at 5–10% with automated rollback on the floor metrics, then expand.
7. **Re-calibrate** anything that depends on model behaviour: confidence routers, judge prompts, thresholds.
8. **Record** the upgrade in the change log and ADR, update the model inventory and the runbooks.

Caches are per model, so expect a cold-cache cost bump at cutover. Plan upgrades on a schedule (for example evaluate every new model in the tier within a month of release) rather than waiting for a deprecation notice.`,
    },
    {
      heading: 'Deprecations and platform change',
      body: `Models and some API features are retired on published timelines with advance notice. A deprecation handled late is an outage; handled early it is a planned upgrade.

- **Subscribe** to deprecation notices and release notes; assign an owner to review them monthly.
- **Inventory** every model id and API feature in use, including in evals, judges, routers and batch jobs, not only the main path. Centralize model ids in configuration so a change is one place, not a code search.
- **Map** each deprecated id to its recommended successor and schedule the upgrade playbook well before the retirement date, leaving time for a rollback window.
- **Watch for dependent components**: an LLM judge pinned to a deprecated model breaks the eval exactly when you need it to validate the upgrade; upgrade and re-calibrate the judge first.
- **Platform and compliance change**: third-party platform availability, data-handling defaults, regional offerings and usage-policy terms evolve. The same owner reviews these and updates the data-flow map and risk register.

Exam angle: scenarios reward proactive, scheduled handling (inventory, early evaluation, staged rollout) and the recognition that evals, judges and routers are also consumers of model ids.`,
    },
    {
      heading: 'Continuous evaluation and iteration',
      body: `Evaluation is not a launch event. After handoff the eval has four ongoing jobs:

1. **Gate every change**: prompts, tools, retrieval configuration, models, guardrails. No change reaches production without an eval delta and a change-log entry.
2. **Detect drift**: the nightly run and the daily sampled production judging catch regressions from data changes, traffic shifts and upstream changes even when nothing was deployed.
3. **Grow with reality**: reviewer corrections, incidents and feedback become new cases; saturated or stale cases are retired; the intent mix is compared against production periodically.
4. **Stay healthy**: judge calibration is re-checked against fresh human labels, noise floor is re-computed as the set changes, leakage is audited when prompts gain examples.

Iteration follows the same loop as the build phase (baseline, inspect, hypothesize, change one thing, measure, keep or revert) but at production scale and with production constraints: canaries instead of flips, error budgets that freeze changes when quality dips, and a monthly review with the business owner against the success criteria from the brief. When the criteria are consistently met, the review asks the next question: what is the next workflow, or what non-goal from release one is now worth doing?`,
    },
  ],
  examples: [
    {
      title: 'Model upgrade dry run against the eval',
      description:
        'Before any production change, the team runs the eval suite against the candidate model in a branch to catch request-shape errors (400s) and measure quality, cost and latency deltas. Only the model id and migration-required parameters change in this step.',
      language: 'python',
      code: `import os, json
from anthropic import Anthropic
client = Anthropic()

MODEL = os.environ.get("EVAL_MODEL", "claude-sonnet-5-5")   # candidate passed in by CI

def run_case(case):
    r = client.messages.create(
        model=MODEL,
        max_tokens=1024,
        output_config={"effort": "medium"},     # budget_tokens removed in migration
        system=[{"type": "text", "text": SYSTEM, "cache_control": {"type": "ephemeral"}}],
        messages=[{"role": "user", "content": case["input"]}],
    )
    return {"id": case["id"], "model": r.model, "stop_reason": r.stop_reason,
            "output": r.content[0].text, "usage": r.usage.model_dump()}

results = [run_case(c) for c in load_cases("eval/golden.jsonl")]
json.dump(results, open(f"eval/results/{MODEL}.json", "w"))   # graded and diffed by the report step`,
      takeaway: 'Make the model id a parameter so the same eval validates any candidate before shadow and canary.',
    },
    {
      title: 'The judge that was deprecated first',
      description:
        'A team scheduled an upgrade of its production model two weeks before the old model\'s retirement. Their LLM judge was pinned to the same retiring model. When they ran the eval to validate the upgrade, the judge calls started failing, and the deadline forced an unvalidated cutover that shipped a formatting regression. The inventory now lists every model id by component, and judges are upgraded and re-calibrated before the production model.',
      takeaway: 'Evals, judges and routers consume model ids too; inventory and upgrade them first.',
    },
    {
      title: 'Monthly lifecycle review',
      description:
        'A procurement assistant\'s monthly review compares the success criteria from the brief (cycle time, cost per request, incorrect-approval rate) with the month\'s data, reviews the feedback pipeline and the risk register, confirms eval health (noise floor, judge agreement, saturation), and decides next iterations. In month nine the criteria were consistently met and the review approved tackling a release-one non-goal: non-English supplier documents, starting with discovery.',
      takeaway: 'Lifecycle management means a standing review against the original criteria, with eval health as a first-class item.',
    },
    {
      title: 'Canary with automated rollback',
      description:
        'A model upgrade for a support assistant was shipped to 10% of traffic with rollback wired to two floor metrics: incorrect-resolution rate from the daily review sample and refusal rate from logs. On day two the refusal rate on one intent exceeded the band; the canary rolled back automatically, the team found a prompt phrasing the new model interpreted differently, fixed it, re-ran the eval and re-launched the canary.',
      takeaway: 'Canaries with metric-based rollback make upgrades safe to attempt and cheap to undo.',
    },
  ],
  keyPoints: [
    'Six phases, each with a gate artifact: brief, architecture docs/ADRs/eval plan, passing eval and runbooks, accepted handoff package, monthly review, eval-gated changes with change-log entries.',
    'Model upgrades are releases: read migration guidance, fix request shape, full eval with noise floor, adversarial and fairness re-tests, shadow, canary with rollback, re-calibrate routers and judges, record.',
    'Newer models often need simpler prompts; expect to remove instructions and examples, not add them.',
    'Caches are per model; plan for a cold-cache cost bump at cutover.',
    'Handle deprecations proactively: subscribe to notices, inventory every model id (including judges, routers, batch jobs), centralize ids in config, schedule upgrades well before retirement.',
    'Upgrade and re-calibrate LLM judges before the production model so the eval is available to validate the upgrade.',
    'Continuous evaluation gates changes, detects drift, grows from production failures and stays healthy through re-calibration and leakage audits.',
    'A standing monthly review against the brief\'s success criteria decides iterations and when to tackle former non-goals.',
  ],
  flashcards: [
    { front: 'Six lifecycle phases?', back: 'Discovery, design, build, handoff, monitoring, iteration.' },
    { front: 'Gate artifact at the end of discovery?', back: 'A signed requirements brief with success criteria, constraints and non-goals.' },
    { front: 'First step of the model upgrade playbook?', back: 'Read the migration guidance for parameter changes (e.g. budget_tokens removed, prefill and forced tool_choice unsupported) and behavioural notes.' },
    { front: 'Why shadow and then canary a model upgrade?', back: 'Shadow measures real-traffic differences with no exposure; canary limits blast radius with automated rollback on floor metrics.' },
    { front: 'What must be re-calibrated after a model upgrade?', back: 'Confidence routers, LLM judge prompts and thresholds that depend on model behaviour.' },
    { front: 'Why upgrade the LLM judge before the production model?', back: 'A judge pinned to a retiring model breaks the eval exactly when it is needed to validate the upgrade.' },
    { front: 'How should model ids be managed to ease deprecations?', back: 'Centralize them in configuration and inventory every component that uses one, including evals, judges, routers and batch jobs.' },
    { front: 'Four ongoing jobs of continuous evaluation?', back: 'Gate every change, detect drift, grow from production failures, stay healthy (calibration, noise floor, leakage audits).' },
    { front: 'What cost effect accompanies a model cutover?', back: 'A cold-cache bump, because prompt caches are scoped per model.' },
    { front: 'What does the monthly lifecycle review compare?', back: 'Current data against the brief\'s success criteria, plus feedback pipeline, risk register and eval health.' },
  ],
  quiz: [
    {
      question:
        'An organization receives a deprecation notice: its production model retires in 90 days. Which plan is MOST appropriate?',
      options: [
        'Change the model id in production on the retirement date.',
        'Inventory every component using the id (including the LLM judge and router), upgrade and re-calibrate the judge first, run the full eval and adversarial tests on the successor, shadow, then canary with rollback, all well before the deadline.',
        'Wait for the model to stop working and then fix it.',
        'Switch immediately to the newest model without evaluation to be safe.',
      ],
      correct: [1],
      explanation:
        'A staged, inventoried upgrade with the eval available is the playbook. Flipping on the deadline, waiting for failure or skipping evaluation all risk regressions or outages.',
    },
    {
      question:
        'During a model upgrade, the eval shows accuracy up 2 points but refusal rate on one legitimate intent up fivefold. What should happen NEXT?',
      options: [
        'Ship it; accuracy improved.',
        'Investigate the refusal change (prompt phrasing the new model reads differently, classifier behaviour), fix and re-run the eval before shadow or canary.',
        'Remove refusal rate from the eval.',
        'Downgrade to an older model permanently.',
      ],
      correct: [1],
      explanation:
        'Refusal changes are a known upgrade risk and a floor metric. Shipping or hiding the metric exposes users; permanently avoiding upgrades only defers the deprecation problem.',
    },
    {
      question: 'Which TWO are gate artifacts in the lifecycle? (Select two)',
      options: [
        'A signed requirements brief at the end of discovery.',
        'A handoff package accepted by the operating team.',
        'A marketing announcement.',
        'The architect\'s personal notes.',
      ],
      correct: [0, 1],
      explanation:
        'The brief and the accepted handoff package are phase gates. Announcements and personal notes are not artifacts that let the next phase proceed safely.',
    },
    {
      question:
        'After handoff, the operating team proposes running the eval only before major releases to save cost. What is the architect\'s BEST advice?',
      options: [
        'Agree; evals are only for releases.',
        'Keep the nightly eval and daily sampled production judging: they detect drift from data and traffic changes even when nothing is deployed, and they gate every change, not just major ones.',
        'Replace the eval with user surveys.',
        'Run the eval once a year.',
      ],
      correct: [1],
      explanation:
        'Drift happens without deployments, and small changes regress systems too. Surveys are lagging indicators and yearly runs provide no control.',
    },
    {
      question:
        'A team upgrading from an older model finds that its 40-line system prompt with eight few-shot examples scores lower on the new model than a 12-line version with no examples. What does this illustrate?',
      options: [
        'The new model is worse.',
        'Newer models often need simpler prompts; upgrades should include prompt simplification validated by the eval.',
        'Few-shot examples are always harmful.',
        'The eval is broken.',
      ],
      correct: [1],
      explanation:
        'Prompt simplification is a common upgrade finding. It does not mean the model is worse or that examples are always bad, and the eval is doing its job by showing the difference.',
    },
    {
      question:
        'Nine months after launch, a system consistently meets all success criteria. What should the monthly lifecycle review do?',
      options: [
        'Stop monitoring since the system is proven.',
        'Confirm eval health and metrics, then consider the next iteration, such as a release-one non-goal, starting with discovery.',
        'Replace the model with the newest one without evaluation.',
        'Disband the operating team.',
      ],
      correct: [1],
      explanation:
        'Success is the trigger for planned growth through the same lifecycle, not for removing monitoring, ownership or evaluation.',
    },
  ],
  statements: [
    { text: 'A model upgrade should be treated as a release with eval, shadow and canary stages.', isTrue: true, explanation: 'It is a behaviour change with known risks (refusals, formatting, tool use).' },
    { text: 'Only the production request path needs to be inventoried for model ids before a deprecation.', isTrue: false, explanation: 'Judges, routers, batch jobs and evals also use model ids and can break the upgrade process.' },
    { text: 'Prompt caches carry over when you switch to a new model id.', isTrue: false, explanation: 'Caches are per model; expect a cold-cache cost bump at cutover.' },
    { text: 'Continuous evaluation includes re-checking judge calibration against fresh human labels.', isTrue: true, explanation: 'Judge drift would otherwise silently corrupt the quality signal.' },
    { text: 'Evaluation is primarily a launch activity and can be reduced after handoff.', isTrue: false, explanation: 'Evals gate every change and detect drift; they are continuous.' },
    { text: 'Newer models frequently perform better with simpler prompts and fewer few-shot examples.', isTrue: true, explanation: 'Upgrades should include prompt simplification validated by the eval.' },
    { text: 'The architect\'s role is identical in every lifecycle phase.', isTrue: false, explanation: 'It shifts from leading (discovery, design) to guiding (build), enabling (handoff) and advising (monitoring, iteration).' },
  ],
  resources: [
    { label: 'Model deprecations (Claude docs)', url: 'https://platform.claude.com/docs/en/about-claude/model-deprecations' },
    { label: 'Migrating to newer models (Claude docs)', url: 'https://platform.claude.com/docs/en/about-claude/models/migration-guide' },
    { label: 'Models overview (Claude docs)', url: 'https://platform.claude.com/docs/en/about-claude/models/overview' },
  ],
};
