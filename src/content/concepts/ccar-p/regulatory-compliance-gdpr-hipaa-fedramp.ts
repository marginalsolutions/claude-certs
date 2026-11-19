import type { Concept } from '../../types';

export const regulatoryComplianceGdprHipaaFedramp: Concept = {
  id: 'regulatory-compliance-gdpr-hipaa-fedramp',
  title: 'Regulatory Compliance: GDPR, HIPAA, FedRAMP',
  summary:
    'Translate regulatory obligations into architecture: where inference runs (data residency and inference_geo), how long data is kept (zero data retention vs 30-day default), which agreements must be in place (DPA, BAA), which platform satisfies government requirements, and how audit trails and consent are built in.',
  certs: ['ccar-p', 'ccao-f', 'ccdv-f'],
  domains: ['ccar-p-5', 'ccao-f-6', 'ccdv-f-7'],
  tags: ['compliance', 'gdpr', 'hipaa', 'fedramp', 'data-residency', 'retention', 'governance'],
  difficulty: 'advanced',
  diagram: 'claude-product-surfaces',
  sections: [
    {
      heading: 'From regulation to architecture questions',
      body: `Compliance is not a checkbox at the end; it determines the architecture. Every regulated deployment must answer five questions before design is final:

1. **What data enters the model?** Personal data (GDPR), protected health information (HIPAA), controlled government data (FedRAMP), payment data (PCI DSS), or none of these after redaction?
2. **Where is it processed?** Which region, which legal entity, which platform.
3. **How long is it retained, and by whom?** Your logs, your caches, the vendor's systems.
4. **Which contracts cover it?** Data Processing Agreement (DPA) for GDPR, Business Associate Agreement (BAA) for HIPAA, platform authorizations for government.
5. **Can you prove it?** Audit trails, access controls, consent records, data-flow documentation.

The architect's first lever is **data minimization**: the less regulated data reaches the model, the smaller every downstream obligation. Redact or pseudonymize identifiers before the call where the task allows it (the Associate exam's sample makes this point: anonymize regulated personal data before uploading, consistent with policy). Only when the task genuinely needs the data do the heavier controls below apply.`,
    },
    {
      heading: 'GDPR: residency, retention and rights',
      body: `GDPR applies to personal data of people in the EU/EEA regardless of where the controller sits. Architectural consequences:

- **Lawful basis and purpose limitation**: document why each data element is processed and do not reuse prompts and outputs for unrelated purposes.
- **Data Processing Agreement** with Anthropic (or with the cloud platform when using Bedrock, Vertex AI or Foundry) defining roles as controller and processor.
- **Data residency**: the Claude API supports an \`inference_geo\` request parameter. The default is \`"global"\`; setting \`"us"\` restricts inference to US infrastructure at a price multiplier (currently 1.1x). Check current docs for which geos are offered; where a specific EU residency is required, cloud platforms with EU regions (Bedrock, Vertex AI, Foundry) are the common answer, and the application's own storage must also stay in region. \`inference_geo\` is a Claude API and Claude Platform on AWS feature, not a Bedrock/Vertex/Foundry one.
- **Retention**: by default the Claude API retains inputs and outputs for a limited period (30 days) for trust-and-safety purposes; **Zero Data Retention (ZDR)** is available to eligible organizations by agreement, so prompts and outputs are not stored by Anthropic after the request completes. Your own logs, traces and caches are also "retention" and need their own policies.
- **Data subject rights**: erasure and access requests must be executable, which means knowing every place a prompt or output was stored (logs, vector stores, eval sets, trace backends).
- **Automated decision-making** (Article 22): decisions with legal or similar effect on a person need human involvement and explanation paths; this is a direct design input for human-in-the-loop.`,
    },
    {
      heading: 'HIPAA: PHI handling and BAAs',
      body: `HIPAA governs protected health information handled by covered entities and their business associates in the US. Architectural consequences:

- A **Business Associate Agreement (BAA)** must be in place with every vendor that handles PHI, including Anthropic for the Claude API or the cloud provider when Claude is accessed through Bedrock, Vertex AI or Foundry. No BAA, no PHI, no exceptions. Check which products and features are covered by the BAA; consumer products and some beta features may not be.
- **Minimum necessary**: send only the PHI the task needs. De-identification (Safe Harbor removal of 18 identifier types, or expert determination) takes data out of HIPAA scope entirely when the task permits.
- **Technical safeguards**: encryption in transit and at rest, access controls and audit logs for every system that touches PHI, including your prompt logs, trace backends and eval datasets. Do not export PHI to a third-party observability vendor without a BAA with them too.
- **Retention**: ZDR or equivalent is commonly required by the covered entity's policy; confirm the retention terms in the BAA.
- **Breach notification** obligations mean you must be able to determine what data was in a given request, which argues for structured logging of data categories even when the content itself is not stored.

The exam tests reasoning: a scenario with patient data and a vendor without a BAA has one correct answer (do not send PHI until the BAA exists or the data is de-identified), regardless of how good the model is.`,
    },
    {
      heading: 'FedRAMP and government workloads',
      body: `US federal agencies and their contractors need cloud services authorized under FedRAMP (Moderate or High) and, for some workloads, DoD impact levels or ITAR constraints. The path to Claude in these environments is through the hyperscaler platforms whose government offerings carry the authorizations: Claude models on **Amazon Bedrock** in AWS GovCloud regions and on **Google Cloud Vertex AI** within Google's FedRAMP-authorized boundary. Anthropic also offers government-focused access programs. Always confirm the current authorization level, region and model availability in the platform's official documentation before committing; authorization scopes change and not every model or feature is available in every government region.

Consequences for design:

- Model ids and feature availability differ by platform (Bedrock ids carry an \`anthropic.\` prefix; some Claude API betas are unavailable). Build an abstraction so the same application can target the authorized platform.
- Keep *all* components inside the boundary: vector stores, logs, trace backends, eval tooling, CI runners. A FedRAMP-authorized model behind a non-authorized observability SaaS breaks the boundary.
- Identity and access through the platform's IAM, with audit logging (CloudTrail, Cloud Audit Logs) covering model invocations.
- Document the data flow and the control inheritance for the agency's authorizing official.`,
    },
    {
      heading: 'Audit trails, consent and cross-cutting controls',
      body: `Whatever the regime, three capabilities recur:

- **Audit trail.** Who sent what to the model, when, under which policy, with which result and which human decisions. Store identifiers and classifications even when you do not store content. Make the trail tamper-evident and retained for the period the regulation requires (which can be longer than the content retention you want to minimize; separate the two).
- **Consent and disclosure.** Where consent is the lawful basis, record it and honour withdrawal. Disclose AI involvement to users where required (consumer-facing deployments under Anthropic's Usage Policy, and increasingly under regional AI laws such as the EU AI Act for certain systems).
- **Data-flow map.** One diagram showing every place regulated data travels: client → your service → redaction → model platform (region, retention terms) → logs/traces/caches/evals → human reviewers. Compliance reviews, DPIAs and vendor assessments all start from this map, and so should the architect.

Exam angle: compliance questions reward the answer that *removes* data or *moves the boundary* over the one that adds an instruction. "Tell the model not to retain the data" (an option in the Associate sample) is not a control; retention is a platform and contract property. Likewise, "the model is very accurate" never substitutes for a BAA, a DPA, or an authorization.`,
    },
  ],
  examples: [
    {
      title: 'US-only inference and redaction for a GDPR-scoped workload',
      description:
        'A European insurer processes claim notes that may contain personal data. The service pseudonymizes names and policy numbers before the call, requests US-restricted inference where policy requires a fixed geography, and keeps application logs in-region with content excluded.',
      language: 'python',
      code: `from anthropic import Anthropic
client = Anthropic()

note, mapping = pseudonymize(raw_claim_note)   # replace names / ids with tokens before the call

r = client.messages.create(
    model="claude-opus-5-5",
    max_tokens=800,
    inference_geo="us",                        # default is "global"; "us" restricts inference (1.1x price)
    system=CLAIMS_SYSTEM,
    messages=[{"role": "user", "content": note}],
)
summary = depseudonymize(r.content[0].text, mapping)
audit.log(request_id=r.id, data_categories=["claim_note", "pseudonymized_pii"],
          geo="us", prompt_version=PROMPT_VERSION)   # no content stored`,
      takeaway: 'Minimize first, then constrain where inference runs, and keep the audit trail free of the content you are trying not to retain.',
    },
    {
      title: 'PHI sent before the BAA',
      description:
        'A digital-health startup prototyped a discharge-summary assistant on the Claude API using real patient records to "see if it works". No BAA was in place. The prototype had to be deleted, the incident reported internally, and the project restarted with synthetic and de-identified data. Once the BAA was executed and ZDR confirmed, production was built, with PHI never leaving systems covered by a BAA (including the observability stack).',
      takeaway: 'No BAA means no PHI, including in prototypes; use de-identified or synthetic data until contracts exist.',
    },
    {
      title: 'Broken FedRAMP boundary through observability',
      description:
        'A contractor deployed Claude via Bedrock in GovCloud and correctly kept data, vector store and application inside the boundary, then shipped full prompt traces to a commercial SaaS tracing vendor outside it. The ATO reviewer flagged it. The fix was a self-hosted OTLP collector and backend inside GovCloud and content redaction on spans.',
      takeaway: 'Every component that sees regulated data, including traces and evals, must sit inside the authorized boundary.',
    },
    {
      title: 'Data-flow map as the compliance artifact',
      description:
        'For a DPIA, the architect produced a one-page map: user → web app (EU) → redaction service (EU) → Claude on Vertex AI (europe-west4) → structured logs without content (EU) → sampled human review (EU staff) → eval dataset (de-identified, EU). The DPO signed off in one meeting because every storage point, region and retention period was visible.',
      takeaway: 'The data-flow map is the artifact regulators, DPOs and auditors actually need.',
    },
  ],
  keyPoints: [
    'Compliance decides architecture: what data enters, where it is processed, how long it is retained, under which agreements, and how it is proven.',
    'Data minimization first: redact, pseudonymize or de-identify before the call wherever the task allows.',
    'GDPR: DPA with the processor, residency (inference_geo "global" default, "us" at 1.1x on the Claude API; cloud regions on Bedrock/Vertex/Foundry), retention (30-day default vs Zero Data Retention by agreement), data-subject rights, Article 22 human involvement.',
    'HIPAA: BAA with every vendor touching PHI (including observability), minimum necessary, de-identification, technical safeguards and audit logs.',
    'FedRAMP: Claude via Bedrock (GovCloud) or Vertex AI within authorized boundaries; keep every component (vector store, logs, traces, evals) inside the boundary; confirm current authorization scope.',
    'Your own logs, caches, traces and eval sets are retention and processing too; govern them like the model call.',
    'Instructions to the model ("do not retain this") are not controls; retention and residency are platform and contract properties.',
    'Maintain an audit trail of identifiers and classifications separate from content retention, plus consent records and a data-flow map.',
  ],
  flashcards: [
    { front: 'What does inference_geo control and what is its default?', back: 'Where inference runs on the Claude API; default "global", "us" restricts to US infrastructure at a 1.1x price multiplier.' },
    { front: 'Is inference_geo available on Bedrock or Vertex AI?', back: 'No; residency there is handled by choosing the cloud region. inference_geo is a Claude API / Claude Platform on AWS feature.' },
    { front: 'Default Claude API retention vs ZDR?', back: 'Default retention of inputs/outputs is 30 days; Zero Data Retention is available to eligible organizations by agreement.' },
    { front: 'Which agreement is mandatory before sending PHI to any vendor?', back: 'A Business Associate Agreement (BAA).' },
    { front: 'How does de-identification help with HIPAA?', back: 'Properly de-identified data (Safe Harbor or expert determination) is outside HIPAA scope.' },
    { front: 'Which agreement defines controller/processor roles under GDPR?', back: 'A Data Processing Agreement (DPA).' },
    { front: 'Typical path to Claude for FedRAMP workloads?', back: 'Claude on Amazon Bedrock in AWS GovCloud or on Google Cloud Vertex AI within the FedRAMP boundary; confirm current authorization level and model availability.' },
    { front: 'Why can an observability vendor break compliance?', back: 'Traces containing prompts are processing and retention of regulated data; the vendor needs the same agreements and must sit inside the same boundary.' },
    { front: 'What does GDPR Article 22 imply for AI system design?', back: 'Decisions with legal or similar effects need human involvement and explanation paths: a direct input to human-in-the-loop design.' },
    { front: 'Is "instruct the model not to retain the data" a valid control?', back: 'No. Retention is a platform/contract property, not model behaviour.' },
  ],
  quiz: [
    {
      question:
        'A hospital network wants to pilot a Claude-based discharge-summary tool with real patient records. The vendor relationship has no BAA yet. What is the MOST appropriate action?',
      options: [
        'Proceed with the pilot because it is internal and small.',
        'Use de-identified or synthetic records until a BAA is executed, then confirm retention terms before PHI is used.',
        'Add a system prompt instruction forbidding the model from storing PHI.',
        'Use a larger model so the pilot finishes faster.',
      ],
      correct: [1],
      explanation:
        'PHI cannot go to a vendor without a BAA regardless of scale. De-identified data removes the data from HIPAA scope. Prompt instructions do not control retention, and model size is irrelevant.',
    },
    {
      question:
        'A German bank requires that customer data never be processed outside the EU. Which design satisfies this?',
      options: [
        'Call the Claude API with inference_geo set to "us".',
        'Call the Claude API with the default settings; it is global.',
        'Use Claude through a cloud platform region in the EU and keep application storage, logs and traces in EU regions.',
        'Add "process this only in the EU" to the system prompt.',
      ],
      correct: [2],
      explanation:
        'EU residency is achieved by choosing EU cloud regions for every component. "us" restricts to the US, which is the wrong geography; the default is global; prompt text does not control processing location.',
    },
    {
      question: 'Which TWO are genuine retention controls for a GDPR-scoped Claude deployment? (Select two)',
      options: [
        'Negotiating Zero Data Retention with the provider.',
        'Instructing the model not to remember the conversation.',
        'Excluding prompt and response content from application logs and traces, storing only identifiers and data categories.',
        'Using a smaller model.',
      ],
      correct: [0, 2],
      explanation:
        'ZDR governs vendor retention and log design governs your own. Model instructions and model size have no effect on what is stored.',
    },
    {
      question:
        'A federal contractor runs Claude on Bedrock in GovCloud but sends full traces to a commercial SaaS tracing product. What is the compliance problem?',
      options: [
        'Bedrock does not support tracing.',
        'The traces move regulated data outside the authorized boundary; the observability stack must be inside it or redacted.',
        'Traces slow down inference.',
        'There is no problem because the model call itself is compliant.',
      ],
      correct: [1],
      explanation:
        'Every system that receives regulated data is part of the boundary. The model call being authorized does not cover downstream systems.',
    },
    {
      question:
        'A loan-decisioning system uses Claude to recommend approve/deny. Under GDPR, which design element is REQUIRED by the automated decision-making provisions?',
      options: [
        'Meaningful human involvement in decisions with legal effect and a path for applicants to obtain an explanation and contest the outcome.',
        'Using the largest available model.',
        'Storing every prompt for ten years.',
        'Processing in the US only.',
      ],
      correct: [0],
      explanation:
        'Article 22 requires human involvement and safeguards for solely automated decisions with legal or similar effects. The other options are unrelated or counterproductive.',
    },
    {
      question:
        'A project manager wants to upload a spreadsheet of customer names and account numbers for trend analysis. Policy restricts sharing regulated personal data. What is the MOST appropriate action?',
      options: [
        'Upload the file as-is since the analysis is internal.',
        'Remove or anonymize the personal identifiers before uploading, consistent with policy.',
        'Upload the file but instruct Claude not to retain it.',
        'Skip the analysis entirely.',
      ],
      correct: [1],
      explanation:
        'Minimization satisfies both the policy and the task. Internal use does not waive policy, instructions do not control retention, and the analysis does not require identifiers so skipping it is unnecessary.',
    },
  ],
  statements: [
    { text: 'The default inference_geo on the Claude API is "global".', isTrue: true, explanation: 'Setting "us" restricts inference to US infrastructure at a 1.1x price multiplier.' },
    { text: 'A BAA is optional for small HIPAA pilots that use real patient data.', isTrue: false, explanation: 'Any vendor handling PHI needs a BAA regardless of scale; use de-identified data until one exists.' },
    { text: 'Properly de-identified health data falls outside HIPAA scope.', isTrue: true, explanation: 'Safe Harbor or expert-determination de-identification removes the data from the regulation\'s scope.' },
    { text: 'If the model platform is FedRAMP authorized, the observability vendor used for traces does not need to be.', isTrue: false, explanation: 'Every component that receives regulated data must be inside the authorized boundary.' },
    { text: 'Application logs, caches and eval datasets count as data retention under GDPR.', isTrue: true, explanation: 'They are processing and storage of personal data and need their own retention and access policies.' },
    { text: 'Instructing the model not to retain data is an effective retention control.', isTrue: false, explanation: 'Retention is a platform and contract property; instructions do not change it.' },
    { text: 'Zero Data Retention is available to eligible organizations by agreement rather than being the default.', isTrue: true, explanation: 'The default retains inputs and outputs for a limited period (30 days); ZDR must be arranged.' },
  ],
  resources: [
    { label: 'Data residency / inference_geo (Claude docs)', url: 'https://platform.claude.com/docs/en/build-with-claude/data-residency' },
    { label: 'Anthropic Trust Center', url: 'https://trust.anthropic.com/' },
    { label: 'Claude on Amazon Bedrock (Claude docs)', url: 'https://platform.claude.com/docs/en/build-with-claude/claude-on-amazon-bedrock' },
    { label: 'Claude on Vertex AI (Claude docs)', url: 'https://platform.claude.com/docs/en/build-with-claude/claude-on-vertex-ai' },
  ],
};
