import type { Concept } from '../../types';

export const dataPrivacyAndPii: Concept = {
  id: 'data-privacy-and-pii',
  title: 'Data Privacy and PII',
  summary:
    'Minimize, redact or tokenize personal data before it reaches the model, choose retention settings deliberately, understand the regulatory frame (GDPR, HIPAA), and close the leakage paths through logs, prompts and tool results.',
  certs: ['ccdv-f', 'ccar-f', 'ccar-p', 'ccao-f'],
  domains: ['ccdv-f-7', 'ccdv-f-2', 'ccar-f-5', 'ccar-p-5', 'ccar-p-3', 'ccao-f-6'],
  tags: ['security', 'privacy', 'pii', 'gdpr', 'hipaa', 'data-retention', 'compliance'],
  difficulty: 'intermediate',
  sections: [
    {
      heading: 'The four goals and what PII means here',
      body: `Security objectives for a Claude application are the classic ones, applied to a new data path:

- **Authentication**: knowing who the user or workload is before any model call is made on their behalf.
- **Authorization**: letting that identity do only what it is permitted to, derived from your session, never from model output.
- **Confidentiality**: data reaches only the parties that should see it, including the model provider, logs, tools and other users.
- **Integrity**: data and instructions are not altered in transit or by injected content.

**Personally identifiable information (PII)** is anything that identifies a person directly (name, email, phone, government ID, account number) or indirectly in combination (date of birth plus postcode). Regulated subsets carry extra obligations: health data (HIPAA in the US), payment card data (PCI DSS), financial records, and data about children.

The reason PII needs special handling with LLMs is that prompts are an unusually leaky data path: text goes to a third party, gets copied into logs and traces, may be summarized or quoted by the model, flows into tool calls, and is easy to paste anywhere. Privacy by design means deciding, for every field, whether the model needs it at all.`,
    },
    {
      heading: 'Minimize, redact, tokenize',
      body: `In order of preference:

1. **Minimize.** Do not send what the task does not need. A sentiment classifier does not need the customer's name; a refund-eligibility check needs the amount and date, not the card number. Select fields in code before building the prompt.
2. **Redact or anonymize.** Replace PII with category markers (\`[NAME]\`, \`[EMAIL]\`) before sending. Use a deterministic PII detector or a cheap model pass, then verify on a sample; regex alone misses free-text identifiers.
3. **Tokenize (pseudonymize).** Replace each real value with a stable token (\`CUST_7f3a\`) and keep the mapping in your system. The model can reason about "CUST_7f3a's three orders" and you re-identify on output. This preserves utility that redaction destroys, while the model never sees the real identity.
4. **Generalize.** Ages instead of birth dates; city instead of street address.

Apply the same treatment to **tool results** and **retrieved documents**: a database row or a ticket pulled into context is as much a disclosure as the user's message. PostToolUse hooks and tool-side field selection are the deterministic places to do this.

For the Associate exam the same idea appears as "redact or anonymize sensitive data before sharing it with Claude"; for the Developer and Architect exams you are expected to know *where* in the pipeline to do it and that the mapping for re-identification stays inside your trust boundary.`,
    },
    {
      heading: 'Retention, residency and regulation',
      body: `**Retention.** By default Anthropic's API retains inputs and outputs for a limited period (30 days is the standard figure to remember) for abuse monitoring, and API data is not used to train models. Organizations with the appropriate agreement can be approved for **zero data retention (ZDR)**, where prompts and completions are not stored after the response is served. Some newer models are "Covered Models" that *require* 30-day retention and are not available under ZDR without explicit authorization; a request from a ZDR organization to such a model returns a 400. Choose retention per workspace deliberately, and check it before debugging a mysterious 400 after a model upgrade.

**Platform choice.** On Amazon Bedrock, Google Cloud Vertex AI and Microsoft Foundry, requests and retained data stay within your cloud provider's environment, which matters for data residency and for organizations that already have compliance agreements (for example a BAA) with that provider.

**Regulation.** Know the shape, not the statute text:

- **GDPR** (EU): lawful basis, data minimization, purpose limitation, data subject rights (access, erasure), transfer restrictions, processor agreements (a DPA with Anthropic or your cloud provider).
- **HIPAA** (US health): protected health information requires a Business Associate Agreement with any processor, minimum necessary use, access controls and audit trails.
- **FedRAMP** and sector rules (financial services, children's data) add authorization and residency requirements.

Compliance is a system property: the model provider's commitments (trust center, DPA, BAA availability) are necessary, and your own minimization, access control, logging hygiene and retention choices are what make the deployment compliant. The Architect Professional exam (ccar-p-5) tests this framing.`,
    },
    {
      heading: 'Leakage paths and how to close them',
      body: `PII leaks from LLM applications through predictable channels:

| Path | How it leaks | Control |
|---|---|---|
| **Logs and traces** | Full prompts and responses written to application logs, observability tools, error reports | Redact before logging; structured logging with PII fields hashed; access-controlled, short-retention log stores |
| **Prompts** | PII placed in a cached system prompt or shared context visible to other requests or users | Keep user data in the user turn; never share a context across tenants |
| **Tool results** | Over-broad queries pull every column, including PII the task never needed | Tool-side field selection; PostToolUse redaction |
| **Model output** | The model quotes or infers personal data, or includes it in a summary sent to the wrong recipient | Output filters; schema that excludes PII fields; authorization check on recipients |
| **Few-shot examples** | Real customer data used as examples | Synthetic examples only |
| **Agent transcripts and memory** | Long-lived session history or memory files store PII indefinitely | Retention limits; redaction on write; per-tenant isolation |
| **Prompt injection** | Injected instructions exfiltrate data via tools | Least privilege, hooks, output filtering (see the injection concept) |

Two habits close most of these: treat *every* copy of a prompt or response (logs, caches, transcripts, evals datasets) as a data store subject to the same policy as the primary database, and run a periodic sample review that searches those stores for PII that should not be there.`,
    },
  ],
  examples: [
    {
      title: 'Tokenizing PII before the call, re-identifying after',
      description:
        'A support summarizer needs to reason about which customer did what, but the model does not need real names or emails. The app replaces identifiers with stable tokens, calls Claude, then maps tokens back for the human agent.',
      language: 'python',
      code: `import re, hashlib

def tokenize(text: str, vault: dict[str, str]) -> str:
    def sub(match):
        raw = match.group(0)
        tok = "PII_" + hashlib.sha256(raw.lower().encode()).hexdigest()[:8]
        vault[tok] = raw                    # mapping stays inside your system
        return tok
    text = re.sub(r"[\\w.+-]+@[\\w-]+\\.[\\w.]+", sub, text)        # emails
    text = re.sub(r"\\b\\+?\\d[\\d\\s().-]{8,}\\d\\b", sub, text)       # phone numbers
    return text

vault: dict[str, str] = {}
safe_ticket = tokenize(ticket_text, vault)
resp = client.messages.create(model="claude-opus-5-5", max_tokens=400,
                              system="Summarize the ticket. Identifiers like PII_xxxx are opaque labels.",
                              messages=[{"role": "user", "content": f"<ticket>{safe_ticket}</ticket>"}])
summary = resp.content[0].text if resp.stop_reason == "end_turn" else ""
for tok, raw in vault.items():
    summary = summary.replace(tok, raw)     # re-identify only inside the trust boundary`,
      takeaway: 'Tokenization keeps utility and keeps real identities out of the prompt, logs and provider storage.',
    },
    {
      title: 'The mistake: full prompts in the observability pipeline',
      description:
        'A team logged every request and response to their tracing tool for debugging. Three months later a compliance review found customer addresses and health details searchable by every engineer. The remediation redacts before logging, hashes identifiers for correlation, and sets a 14-day retention on the trace store.',
      language: 'python',
      code: `def log_request(user_id: str, prompt: str, response: str, usage) -> None:
    logger.info(
        "claude_call",
        extra={
            "user_hash": hashlib.sha256(user_id.encode()).hexdigest()[:16],  # correlate without identifying
            "prompt_redacted": redact_pii(prompt),
            "response_redacted": redact_pii(response),
            "input_tokens": usage.input_tokens,
            "output_tokens": usage.output_tokens,
        },
    )
# trace store: access limited to on-call group; retention 14 days; PII scan weekly`,
      takeaway: 'Every copy of a prompt is a data store; logs need the same redaction, access control and retention as the database.',
    },
    {
      title: 'Choosing retention and platform for a healthcare workload',
      description:
        'A hospital group wants Claude to draft discharge summaries from clinical notes. The architecture review covers: a BAA with the platform provider, minimum-necessary data in prompts, a dedicated workspace with the retention setting required by policy, audit logging of every call, and human sign-off on every summary. They also check that their chosen model is available under their retention configuration before building.',
      language: 'yaml',
      code: `workload: discharge-summary-drafting
data_class: PHI (HIPAA)
provider_agreements: BAA in place with chosen platform
platform: cloud-provider offering within existing compliance boundary
workspace: clinical-prod (dedicated keys, spend limits, retention per policy)
prompt_data: minimum necessary; patient identifiers tokenized; no SSN/MRN sent
logging: redacted prompts, hashed patient ref, 30-day access-controlled store
human_review: clinician approves every summary before it enters the record
model_check: confirm model availability under the workspace retention setting (ZDR vs 30-day)`,
      takeaway: 'Compliance is the combination of provider agreements, platform choice, minimization, logging hygiene, retention and human review.',
    },
    {
      title: 'Tool results that over-share',
      description:
        'An agent\'s `get_customer` tool returned the full customer record, including date of birth and partial card number, for a request that only needed the loyalty tier. The fix selects fields on the tool side and adds a PostToolUse hook that redacts anything resembling a card or ID number as a second layer.',
      language: 'typescript',
      code: `// tool side: return only what tasks need
async function getCustomer(id: string, fields: Array<"tier" | "region" | "since">) {
  const row = await db.customers.findById(id);
  return Object.fromEntries(fields.map((f) => [f, row[f]]));
}

// second layer: PostToolUse redaction of anything that slipped through
const PII_PATTERNS = [/\\b\\d{4}[ -]?\\d{4}[ -]?\\d{4}[ -]?\\d{4}\\b/g, /\\b\\d{3}-\\d{2}-\\d{4}\\b/g];
export function redactToolResult(text: string): string {
  return PII_PATTERNS.reduce((t, re) => t.replace(re, "[REDACTED]"), text);
}`,
      takeaway: 'Minimize at the tool, redact as a backstop; two independent layers for data that must not reach the model.',
    },
  ],
  keyPoints: [
    'Goals: authentication, authorization, confidentiality, integrity; privacy is a design decision about which fields the model ever sees.',
    'Prefer minimize > redact/anonymize > tokenize (pseudonymize with an internal mapping) > generalize; apply the same to tool results and retrieved documents.',
    'Anthropic API data is not used for training; standard retention is limited (30 days to remember), with zero data retention available by agreement. Some Covered Models require 30-day retention and return 400 under ZDR.',
    'Bedrock, Vertex AI and Foundry keep data within your cloud provider\'s boundary, which helps residency and existing compliance agreements.',
    'GDPR: minimization, lawful basis, subject rights, DPAs. HIPAA: BAA, minimum necessary, access controls, audit. Compliance is a system property, not a provider checkbox.',
    'Leakage paths: logs/traces, shared prompts, tool results, model output, real-data examples, transcripts and memory, injection. Each needs its own control.',
    'Redact before logging, hash identifiers for correlation, limit access and retention on every store that holds prompts or responses.',
    'Never use real customer data in few-shot examples or eval sets without anonymization.',
  ],
  flashcards: [
    { front: 'Name the four security goals for a Claude application.', back: 'Authentication, authorization, confidentiality, integrity (with privacy as the design discipline around confidentiality).' },
    { front: 'What is the order of preference for handling PII before a model call?', back: 'Minimize, then redact/anonymize, then tokenize (pseudonymize), then generalize.' },
    { front: 'What is tokenization (pseudonymization) in this context?', back: 'Replacing real identifiers with stable opaque tokens and keeping the mapping inside your system so the model reasons about tokens and you re-identify on output.' },
    { front: 'Does Anthropic train on API inputs and outputs?', back: 'No; API data is not used for training. Standard retention is limited (30 days), with zero data retention available by agreement.' },
    { front: 'What is zero data retention (ZDR)?', back: 'An arrangement where prompts and completions are not stored after the response is served; some Covered Models require 30-day retention and are unavailable under ZDR without authorization.' },
    { front: 'Why might a request return 400 after switching to a newer model in a ZDR organization?', back: 'The model may be a Covered Model requiring 30-day retention; check the retention configuration before debugging the payload.' },
    { front: 'What does HIPAA require from a processor handling PHI?', back: 'A Business Associate Agreement, minimum-necessary use, access controls and audit trails.' },
    { front: 'Name four GDPR principles relevant to LLM apps.', back: 'Data minimization, purpose limitation, lawful basis, data subject rights (access, erasure), plus processor agreements and transfer restrictions.' },
    { front: 'Why are third-party platforms (Bedrock, Vertex AI, Foundry) relevant to privacy?', back: 'Data stays within your cloud provider\'s environment, supporting residency and existing compliance agreements.' },
    { front: 'List five PII leakage paths in LLM applications.', back: 'Logs/traces, shared or cached prompts, over-broad tool results, model output to wrong recipients, real-data few-shot examples (also transcripts/memory and injection).' },
    { front: 'How should identifiers appear in logs?', back: 'Hashed for correlation, with prompts and responses redacted, in an access-controlled store with short retention.' },
  ],
  quiz: [
    {
      question:
        'A sentiment classifier receives full support tickets including names, emails and order numbers. Which change BEST reduces privacy risk without hurting the task?',
      options: [
        'Ask the model to ignore personal data in its answer.',
        'Strip or tokenize identifiers in code before building the prompt, since sentiment does not depend on them.',
        'Encrypt the tickets at rest in your database.',
        'Switch to a smaller model that remembers less.',
      ],
      correct: [1],
      explanation:
        'Minimization at the source removes the data from the prompt, logs and provider storage. A prompt instruction does not prevent disclosure, encryption at rest does not affect what is sent, and model size is irrelevant.',
    },
    {
      question:
        'An engineering team logs full prompts and responses to a shared tracing tool. A compliance audit flags it. Which TWO remediations are appropriate? (Select two)',
      options: [
        'Redact PII before logging and hash user identifiers for correlation.',
        'Disable logging entirely so no debugging data exists.',
        'Restrict access to the trace store and set a short retention period.',
        'Move the logs to the system prompt so they are cached.',
      ],
      correct: [0, 2],
      explanation:
        'Redaction plus access and retention controls keep debugging possible while meeting policy. Disabling all logging removes auditability, and the last option is nonsensical and harmful.',
    },
    {
      question: 'A hospital wants to use Claude to draft summaries from clinical notes. Which element is a hard prerequisite?',
      options: [
        'A Business Associate Agreement with the platform provider, plus minimum-necessary data handling and audit logging.',
        'Using the largest model available for accuracy.',
        'Placing patient records in the system prompt for caching efficiency.',
        'Turning off all logging to avoid storing PHI.',
      ],
      correct: [0],
      explanation:
        'HIPAA requires a BAA and minimum-necessary use with access controls and audit trails. Model size is not a compliance control, records in the system prompt are a leakage path, and HIPAA requires audit logs, not their absence.',
    },
    {
      question:
        'A ZDR organization migrates to a newer model and every request returns 400 invalid_request_error with no obvious payload problem. What should they check first?',
      options: [
        'Whether max_tokens exceeds the model limit.',
        'Whether the model is a Covered Model requiring 30-day retention that their retention configuration does not meet.',
        'Whether the API key has expired.',
        'Whether the system prompt is too long.',
      ],
      correct: [1],
      explanation:
        'Some newer models require 30-day retention and are unavailable under ZDR without authorization; the error is a 400 on every request. The other causes would produce different errors or would not affect every request uniformly.',
    },
    {
      question: 'Which approach preserves the model\'s ability to reason about distinct customers while keeping their identities out of the prompt?',
      options: [
        'Redacting every identifier to [REDACTED].',
        'Tokenizing identifiers to stable opaque tokens with an internal mapping for re-identification.',
        'Sending identifiers but asking the model not to repeat them.',
        'Sending only the first three letters of each name.',
      ],
      correct: [1],
      explanation:
        'Stable tokens keep referential structure without disclosure. Uniform redaction loses the ability to distinguish customers, prompt pleas are not controls, and partial names remain identifying.',
    },
    {
      question: 'Which statement about Anthropic API data handling is correct?',
      options: [
        'API inputs are used to train future models unless you opt out.',
        'API data is not used for training; retention is limited and zero data retention is available by agreement.',
        'All data is retained indefinitely for compliance.',
        'Retention settings cannot differ between workspaces.',
      ],
      correct: [1],
      explanation: 'API data is not used for training, standard retention is limited (30 days), and ZDR can be arranged; retention can be configured per workspace.',
    },
  ],
  statements: [
    { text: 'Asking the model not to repeat personal data is an adequate privacy control.', isTrue: false, explanation: 'The data has already been disclosed to the provider and the logs; minimize or tokenize before the call.' },
    { text: 'Tool results and retrieved documents should be treated as disclosures subject to the same PII rules as user messages.', isTrue: true, explanation: 'Anything entering the context goes to the provider and into transcripts and logs.' },
    { text: 'Anthropic uses API inputs and outputs to train its models by default.', isTrue: false, explanation: 'API data is not used for training.' },
    { text: 'Some newer models require 30-day data retention and are unavailable under zero data retention without authorization.', isTrue: true, explanation: 'Requests from a non-compliant retention configuration return 400.' },
    { text: 'Using a cloud-provider platform such as Bedrock or Vertex AI can help meet data residency requirements.', isTrue: true, explanation: 'Requests and retained data stay within the provider\'s environment.' },
    { text: 'A Business Associate Agreement alone makes a HIPAA workload compliant.', isTrue: false, explanation: 'The BAA is necessary; minimum-necessary use, access controls, audit trails and your own logging hygiene complete the picture.' },
    { text: 'Real customer records are acceptable as few-shot examples if the prompt is internal.', isTrue: false, explanation: 'Examples are sent on every call and persist in logs; use synthetic data.' },
    { text: 'Hashing user identifiers in logs allows correlation without storing the identifier.', isTrue: true, explanation: 'A one-way hash supports debugging and joins while reducing exposure.' },
  ],
  resources: [
    { label: 'Anthropic Trust Center', url: 'https://trust.anthropic.com' },
    { label: 'Anthropic Privacy Policy', url: 'https://www.anthropic.com/legal/privacy' },
    { label: 'Claude on Amazon Bedrock', url: 'https://platform.claude.com/docs/en/build-with-claude/claude-on-amazon-bedrock' },
    { label: 'Claude on Vertex AI', url: 'https://platform.claude.com/docs/en/build-with-claude/claude-on-vertex-ai' },
  ],
};
