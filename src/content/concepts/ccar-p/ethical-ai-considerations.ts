import type { Concept } from '../../types';

export const ethicalAiConsiderations: Concept = {
  id: 'ethical-ai-considerations',
  title: 'Ethical AI Considerations',
  summary:
    'Build fairness testing, transparency, accountability and honest treatment of explainability limits into Claude systems, and account for the people the system affects, following Anthropic\'s responsible-use guidance.',
  certs: ['ccar-p', 'ccao-f'],
  domains: ['ccar-p-5', 'ccao-f-6'],
  tags: ['ethics', 'bias', 'fairness', 'transparency', 'accountability', 'responsible-ai'],
  difficulty: 'advanced',
  sections: [
    {
      heading: 'Bias and fairness testing',
      body: `A model can be accurate on average and still treat groups differently. For any system whose outputs affect people (hiring screens, lending, insurance, customer prioritization, content moderation, healthcare triage), fairness is a **tested property**, not an assumption.

How to test it:

- **Define the protected or sensitive attributes** relevant to the domain and jurisdiction (gender, ethnicity, age, disability, language, geography) and the proxies that correlate with them (names, postcodes, dialect).
- **Build counterfactual pairs**: the same case with only the sensitive attribute or proxy changed. Measure whether the decision, score or tone changes. Large flips are a red flag.
- **Stratify the eval set** and report metrics per group: accuracy, false-positive and false-negative rates, approval rates, escalation rates. Equal accuracy with unequal false-negative rates is still unfair.
- **Test the whole pipeline**, not just the model: retrieval can under-represent some groups; routing rules can send one group to review more often; training data for a judge can embed bias.
- **Repeat after every model or prompt change**; fairness properties shift with releases.

Mitigations are architectural as much as prompt-level: remove unnecessary sensitive attributes from inputs, add explicit instructions about irrelevant attributes, route high-impact decisions to humans, and monitor per-group outcomes in production. Fairness metrics can conflict with each other and with accuracy; the architect's job is to make the choice explicit and documented, not to pretend it does not exist.`,
    },
    {
      heading: 'Transparency and disclosure',
      body: `People should know when they are interacting with an AI system, what it can and cannot do, and when a decision affecting them involved one. Practical requirements:

- **Disclose AI involvement** in consumer-facing interactions. Anthropic's Usage Policy requires it for certain deployments, and regional laws increasingly do too (for example chatbot disclosure rules and the EU AI Act for specified systems). Design the disclosure into the UI; do not leave it to the model to mention.
- **Set accurate expectations**: scope, limitations, how to reach a human, how to report a problem. Over-claiming capability is an ethical failure as well as a support-cost problem.
- **Show sources** where the system makes factual claims (citations to retrieved documents) so users can check rather than trust.
- **Publish what matters to affected parties**: for high-impact systems, a plain-language description of purpose, data used, human oversight and recourse.
- **Internal transparency**: documented prompts, model versions, eval results and risk registers so the organization knows what it has deployed. You cannot be accountable for a system you cannot describe.`,
    },
    {
      heading: 'Explainability limits and accountability',
      body: `Be honest about what can be explained. Claude can produce a rationale for an answer, and current models support summarized thinking display, but a generated rationale is itself a model output: it is useful for review and debugging, and it is not a guaranteed causal account of why the model produced the answer. Do not present it to a regulator or a customer as the definitive reason.

What architects *can* provide:

- **Traceability**: the exact prompt version, model id, retrieved documents, tool calls and human decisions behind each output.
- **Grounding**: citations that let a reviewer verify claims independently of the model's rationale.
- **Structured reasons**: for decisions, require the model to output the specific rules or evidence it relied on in a schema, then validate those references against the actual inputs.
- **Contestability**: a path for an affected person to challenge an outcome and have a human re-decide.

**Accountability** means a named human owner for the system's behaviour, with authority to pause it. "The AI decided" is never an acceptable answer. Encode it: an owner on the risk register, an approver for prompt and model changes, an incident process that treats harmful outputs like production incidents, and periodic review of fairness and quality metrics by someone outside the build team.`,
    },
    {
      heading: 'Impact on workers and responsible-use guidance',
      body: `Systems that automate parts of a job change the job. Ethical deployment considers the people doing the work:

- **Be honest in planning** about which tasks change, which disappear and what new work appears (review, exception handling, prompt and eval maintenance). Involve the affected teams in discovery rather than presenting them with a finished system.
- **Design for augmentation where judgment matters**: keep humans in decisions that require accountability, and design review roles that exercise and preserve expertise instead of reducing people to click-through approvers (which also creates automation bias).
- **Invest in skills**: training on how the system works, where it fails and how to challenge it.
- **Measure worker outcomes** alongside system metrics: workload, error-catch rate, satisfaction.

Anthropic's responsible-use guidance frames the boundaries: the **Usage Policy** prohibits certain uses and imposes extra requirements on high-risk and consumer-facing deployments; Anthropic publishes research and guidance on safe deployment, and Claude is trained to decline clearly harmful requests. The architect treats these as the floor, then adds the organization's own policy, sector regulation and the ethical commitments above. Exam angle: options that defer ethics to "the model is trained to be safe" or "we will add a disclaimer" are distractors; the correct options test fairness, build disclosure into the product, keep humans accountable and document everything.`,
    },
  ],
  examples: [
    {
      title: 'Counterfactual fairness test for a résumé screener',
      description:
        'A recruiting platform uses Claude to score résumés against a job description. The team generates counterfactual pairs by swapping names and gendered terms while holding qualifications constant, then measures score differences and shortlist flip rate per attribute. Flip rates above a threshold block release and trigger prompt, input-redaction and routing changes.',
      language: 'python',
      code: `import statistics

def score(resume_text: str) -> float:
    r = client.messages.create(model="claude-opus-5-5", max_tokens=200,
        system=SCREEN_SYSTEM,   # explicitly instructs that name, gender, age, origin are irrelevant
        messages=[{"role": "user", "content": resume_text}],
        output_config={"format": {"type": "json_schema", "schema": SCORE_SCHEMA}})
    return parse_score(r)

flips, deltas = 0, []
for base, variant in counterfactual_pairs:     # same qualifications, swapped name / gendered terms
    s_base, s_var = score(base), score(variant)
    deltas.append(abs(s_base - s_var))
    flips += (s_base >= THRESHOLD) != (s_var >= THRESHOLD)

print("mean |delta|:", statistics.mean(deltas), "shortlist flip rate:", flips / len(counterfactual_pairs))`,
      takeaway: 'Fairness is measured with counterfactuals and per-group metrics, and it gates release like any other metric.',
    },
    {
      title: 'The disclaimer that was not a control',
      description:
        'A lender planned to use AI-generated rationales as the official reason for declined applications, with a footer saying "This explanation was generated by AI". Compliance pointed out the rationale was itself a model output and could not be verified as the actual basis for the decision. The redesign required the model to return the specific policy rules and applicant data points it relied on in a schema, validated against the actual application, with a human adjudicator signing each decline.',
      takeaway: 'A generated rationale is evidence for review, not a certified explanation; validate structured reasons and keep a human accountable.',
    },
    {
      title: 'Disclosure built into the product',
      description:
        'A telecom\'s support chat relied on the model to mention it was an AI "when appropriate". Audits found it did so in 60% of conversations. The team moved disclosure into the UI (a persistent label and an opening message), added a visible "talk to a person" control, and the model prompt was changed to never deny being an AI if asked.',
      takeaway: 'Disclosure is a product requirement implemented in the interface, not a behaviour you hope the model exhibits.',
    },
    {
      title: 'Designing the reviewer role, not just the automation',
      description:
        'A claims team feared the AI triage system would reduce adjusters to approving model output. The architect ran discovery with adjusters, kept them as decision owners on contested and high-value claims, routed routine claims to sampling, and created a rotating "model quality" role that reviews failure patterns and proposes prompt changes. Adjuster error-catch rate and satisfaction became tracked metrics alongside throughput.',
      takeaway: 'Plan the human roles explicitly and measure worker outcomes, not only system efficiency.',
    },
  ],
  keyPoints: [
    'Fairness is tested: counterfactual pairs, per-group metrics (including false-negative and false-positive rates), the whole pipeline, repeated after every change.',
    'Mitigate bias architecturally: remove unnecessary sensitive attributes, explicit irrelevance instructions, human review for high-impact decisions, per-group production monitoring.',
    'Disclose AI involvement in the interface, set accurate expectations, show sources, and document the system internally.',
    'A generated rationale is a model output, not a verified causal explanation; provide traceability, grounding, validated structured reasons and contestability instead.',
    'Accountability needs a named human owner with authority to pause the system, change approval, and an incident process for harmful outputs.',
    'Consider workers: honest planning, augmentation where judgment matters, training, and measured worker outcomes.',
    'Anthropic\'s Usage Policy and responsible-use guidance are the floor; organizational policy and regulation build on them.',
    '"The model is trained to be safe" and "add a disclaimer" are not ethical controls.',
  ],
  flashcards: [
    { front: 'What is a counterfactual fairness test?', back: 'Evaluate the same case with only a sensitive attribute or proxy changed and measure whether the output changes.' },
    { front: 'Why report per-group false-negative rates and not just accuracy?', back: 'Equal accuracy can hide unequal error types; one group may be wrongly rejected far more often.' },
    { front: 'Where should AI disclosure be implemented?', back: 'In the product interface (labels, opening message), not left to the model\'s discretion.' },
    { front: 'Is a model-generated rationale a reliable explanation of why the model answered as it did?', back: 'No. It is a model output useful for review; provide traceability and validated structured reasons instead.' },
    { front: 'What does accountability require in an AI system?', back: 'A named human owner with authority to pause the system, approval for changes, and an incident process.' },
    { front: 'Name three places bias can enter besides the model.', back: 'Retrieval coverage, routing rules, and the judge or training data used in evaluation.' },
    { front: 'What is contestability?', back: 'A path for an affected person to challenge an outcome and have a human re-decide.' },
    { front: 'How should worker impact be handled ethically?', back: 'Honest planning, involvement in discovery, augmentation for judgment tasks, training, and measured worker outcomes.' },
    { front: 'What role does Anthropic\'s Usage Policy play in ethical design?', back: 'It is the floor: prohibited uses and extra requirements for high-risk and consumer-facing deployments; the organization adds its own policy and regulation.' },
    { front: 'Why must fairness tests be repeated after model upgrades?', back: 'Fairness properties shift with model releases and prompt changes.' },
  ],
  quiz: [
    {
      question:
        'A Claude-based résumé screener shows 91% agreement with human recruiters overall. Before release, which check is MOST important from a fairness standpoint?',
      options: [
        'Confirm p95 latency is under 3 seconds.',
        'Run counterfactual pairs that vary names and gendered terms and compare per-group shortlist and false-negative rates.',
        'Increase overall agreement to 95% with a larger model.',
        'Add a disclaimer that AI was used.',
      ],
      correct: [1],
      explanation:
        'Average agreement can hide disparate treatment; counterfactual and per-group testing reveals it. Latency, overall accuracy and disclaimers do not measure fairness.',
    },
    {
      question:
        'A lender wants to send applicants the model\'s free-text rationale as the official reason for a decline. What is the architect\'s BEST advice?',
      options: [
        'Approve; the rationale explains the decision.',
        'Treat the rationale as review evidence only; require structured, validated references to the rules and data relied on, and keep a human adjudicator accountable for each decision.',
        'Use a larger model so the rationale is more accurate.',
        'Remove explanations entirely.',
      ],
      correct: [1],
      explanation:
        'A generated rationale is a model output, not a verified causal explanation. Structured, validated reasons plus human accountability provide a defensible basis. Model size does not change this, and removing explanations fails transparency and contestability.',
    },
    {
      question: 'Which TWO are appropriate transparency measures for a consumer-facing support assistant? (Select two)',
      options: [
        'A persistent interface label and opening message stating the user is interacting with an AI, plus a visible way to reach a person.',
        'Relying on the model to mention it is an AI when it judges appropriate.',
        'Citations to the policy documents the answers are based on.',
        'A hidden footnote in the terms of service.',
      ],
      correct: [0, 2],
      explanation:
        'Disclosure in the interface and verifiable sources are concrete transparency measures. Model-discretion disclosure is unreliable and a buried footnote is not meaningful disclosure.',
    },
    {
      question:
        'An executive says the system needs no ethics review because "Claude is trained to be safe". Which response is MOST accurate?',
      options: [
        'Agree; model safety training covers organizational responsibility.',
        'Model safety training is the floor; the organization still owns fairness testing, disclosure, accountability and regulatory compliance for its specific use.',
        'Ethics reviews are only needed for open-source models.',
        'Add a disclaimer and proceed.',
      ],
      correct: [1],
      explanation:
        'Safety training does not test the organization\'s specific use for bias, nor provide disclosure, ownership or compliance. Disclaimers and provenance of the model do not change this.',
    },
    {
      question:
        'After deployment, a claims triage system has reduced adjusters\' role to approving model output in seconds, and morale and error-catch rate have fallen. Which change addresses BOTH the ethical and the risk problem?',
      options: [
        'Remove adjusters entirely to save cost.',
        'Redesign the human role: adjusters own contested and high-value decisions, sample routine ones, and rotate through a model-quality role; track catch rate and satisfaction.',
        'Add a motivational message to the review screen.',
        'Increase the model\'s effort level.',
      ],
      correct: [1],
      explanation:
        'Meaningful roles preserve expertise and oversight and reduce automation bias. Removing humans increases risk, messaging does not change the role, and effort does not address the human factor.',
    },
    {
      question:
        'A fairness audit six months ago found no disparities. The team has since upgraded the model and rewritten the prompt. What should happen?',
      options: [
        'Nothing; the audit remains valid.',
        'Re-run the fairness tests, because fairness properties shift with model and prompt changes.',
        'Only re-run latency tests.',
        'Ask the new model whether it is biased.',
      ],
      correct: [1],
      explanation:
        'Fairness is a property of the current system and must be re-tested after changes. Latency is unrelated and self-assessment by the model is not evidence.',
    },
  ],
  statements: [
    { text: 'Equal overall accuracy across groups guarantees a system is fair.', isTrue: false, explanation: 'Error types can differ by group; compare false-negative and false-positive rates per group.' },
    { text: 'Counterfactual testing changes only a sensitive attribute or proxy while holding the rest of the case constant.', isTrue: true, explanation: 'This isolates the effect of the attribute on the output.' },
    { text: 'A model-generated rationale is a verified account of why the model produced its answer.', isTrue: false, explanation: 'It is itself a model output; use traceability and validated structured reasons for accountability.' },
    { text: 'AI disclosure should be implemented in the interface rather than left to the model.', isTrue: true, explanation: 'Model-discretion disclosure is unreliable; product-level disclosure is auditable.' },
    { text: 'Anthropic\'s Usage Policy removes the need for an organization\'s own ethical review.', isTrue: false, explanation: 'The policy is the floor; organizations own fairness testing, accountability and compliance for their use.' },
    { text: 'Every high-impact AI system should have a named human owner with authority to pause it.', isTrue: true, explanation: 'Accountability requires a person, not "the AI decided".' },
    { text: 'Bias can enter through retrieval and routing rules, not only through the model.', isTrue: true, explanation: 'Test the whole pipeline.' },
  ],
  resources: [
    { label: 'Anthropic Usage Policy', url: 'https://www.anthropic.com/legal/aup' },
    { label: 'Anthropic Responsible Scaling Policy', url: 'https://www.anthropic.com/responsible-scaling-policy' },
    { label: 'Claude\'s constitution (Anthropic)', url: 'https://www.anthropic.com/news/claudes-constitution' },
  ],
};
