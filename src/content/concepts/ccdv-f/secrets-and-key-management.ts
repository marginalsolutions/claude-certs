import type { Concept } from '../../types';

export const secretsAndKeyManagement: Concept = {
  id: 'secrets-and-key-management',
  title: 'Secrets and Key Management',
  summary:
    'Keep API keys and credentials out of code, prompts and configs: use per-environment, per-workspace keys with least-privilege scope, store them in environment variables or secret managers, rotate them, prefer workload identity where possible, and monitor who uses them.',
  certs: ['ccdv-f', 'ccar-f', 'ccar-p'],
  domains: ['ccdv-f-7', 'ccdv-f-2', 'ccar-f-2', 'ccar-p-3', 'ccar-p-5'],
  tags: ['security', 'secrets', 'api-keys', 'iam', 'workspaces', 'admin-api', 'mcp'],
  difficulty: 'intermediate',
  sections: [
    {
      heading: 'Where keys live and where they never go',
      body: `An Anthropic API key authenticates your *organization* (scoped to a workspace) and is billed to it. Anyone who holds it can spend your budget and read your data flows. Treat it like a production database password.

Never put a key:

- **In client-side code** (browser JavaScript, mobile apps, desktop binaries). Anything shipped to users is extractable. Calls to Claude go through *your* backend, which holds the key and enforces authentication, authorization, rate limits and logging.
- **In prompts or messages.** A key in the system prompt is readable by anyone who can induce the model to repeat it, and it lands in logs and transcripts. Managed Agents documentation is explicit: do not put API keys in the system prompt or user messages as a workaround; they persist in the session's event history.
- **In source control**, including example files, notebooks, test fixtures and \`.mcp.json\`.
- **In logs or error messages.** Redact \`Authorization\` headers and anything matching \`sk-ant-\`.

Where keys belong:

- **Environment variables** read at startup (\`ANTHROPIC_API_KEY\` is what the SDKs read by default), injected by the platform rather than committed in files.
- **Secret managers** (AWS Secrets Manager, GCP Secret Manager, Azure Key Vault, HashiCorp Vault, or your CI provider's secret store) with access controlled by IAM and every read audited.
- **Platform identity** where possible (see Workload Identity Federation below), which removes the long-lived key entirely.`,
    },
    {
      heading: 'Workspaces, scoping and the Admin API',
      body: `The Claude Console organizes an organization into **workspaces**. Each workspace has its own API keys, spend limits, rate limits and usage reporting. This is the primary least-privilege tool for keys:

- **One workspace per environment** (development, staging, production) and often per application or team. A leaked dev key cannot spend the production budget, and production usage is visible on its own.
- **One key per service**, named for its purpose, so revocation is surgical and usage is attributable.
- Workspace roles (\`workspace_user\`, \`workspace_developer\`, \`workspace_admin\`, \`workspace_billing\`) control who can create or see keys.

The **Admin API** (\`/v1/organizations/*\`, exposed in the SDKs as \`client.beta.organization\`) manages this programmatically with a separate admin key (\`sk-ant-admin...\`): create workspaces, add members, list and update API keys (for example setting \`status: "inactive"\` to revoke one), read usage and cost reports, manage service accounts and federation. Admin keys do not work on the Messages API, and workspace keys do not work on the Admin API, which is itself a useful separation.

Operational practices:

- **Rotate** on a schedule and immediately on suspected exposure: create the new key, deploy it, then deactivate the old one. Rotation is painless only if keys are injected from a secret store rather than baked into images.
- **Scope** by workspace and by role; grant \`workspace_developer\` rather than org admin for day-to-day work.
- **Monitor** usage per key and per workspace; alert on spend spikes, use from unexpected regions, or calls outside business hours. Usage and cost reports from the Admin API feed this.`,
    },
    {
      heading: 'Workload Identity Federation and other credential types',
      body: `Long-lived API keys are a liability because they can be copied. **Workload Identity Federation (WIF)** lets a workload authenticate with a short-lived token from an identity provider it already has (a cloud provider, CI system or Kubernetes) instead of a stored key. An admin creates a *federation issuer* (the trusted IdP) and *federation rules* that map a workload identity to a service account and a scope such as \`workspace:developer\`; the client is pointed at the rule and exchanges its platform token for an Anthropic token automatically, refreshing before expiry. Nothing secret is stored, and access is revoked by changing the rule.

Credential options, and when to use each:

| Credential | Use for |
|---|---|
| Workspace API key | Servers and services that cannot use federation; stored in a secret manager |
| Workload Identity Federation | CI pipelines, cloud workloads and containers with a platform identity |
| Interactive OAuth sign-in | A developer's own machine (never copied to servers) |
| Admin API key / org:admin OAuth | Organization management only |
| Third-party platform credentials | Bedrock, Vertex AI and Foundry use the cloud provider's IAM instead of Anthropic keys |

On third-party platforms, apply the same discipline with the provider's tools: IAM roles rather than static access keys, scoped per environment, with CloudTrail or Cloud Audit Logs monitoring.`,
    },
    {
      heading: 'Secrets in agent configurations',
      body: `Agents introduce new places for secrets to leak.

**MCP server configs.** A \`.mcp.json\` committed to a repository must not contain tokens. Claude Code supports environment-variable expansion in \`.mcp.json\` (\`\${VAR}\` and \`\${VAR:-default}\`) so the file references \`\${GITHUB_TOKEN}\` and the real value comes from the developer's or CI's environment. The same applies to \`settings.json\` \`env\` blocks: configuration can name a variable, never its value.

**Agent sandboxes and prompt injection.** If a credential is inside the sandbox or the context window, a successful injection can read it and send it somewhere. **Managed Agents vaults** address this directly: credentials (\`mcp_oauth\`, \`static_bearer\`, \`environment_variable\`) are stored by Anthropic and injected into outbound requests *at egress*. The sandbox sees an opaque placeholder, substitution happens only for the credential's allowed hosts, and secret fields are write-only. Where vaults do not fit, keep the secret host-side behind a custom tool your orchestrator executes.

**Claude Code hooks and tool output.** A PostToolUse hook can redact credential-like strings from file reads and command output before they enter the transcript. Combine with \`.gitignore\`-style deny rules so the agent cannot read \`.env\` files in the first place.

**Logging.** Agent transcripts are rich logs; scrub them. A key that appears once in a tool result is now in every downstream log sink.`,
    },
  ],
  examples: [
    {
      title: 'Backend holds the key; the browser never does',
      description:
        'A startup shipped a web app that called the Messages API directly from React with the key in the bundle. Within days the key was scraped and used for someone else\'s workload. The fix moved calls behind an authenticated backend route that reads the key from the environment, applies per-user rate limits and logs usage.',
      language: 'typescript',
      code: `// server.ts (runs on your backend, not in the browser)
import Anthropic from "@anthropic-ai/sdk";
const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment

app.post("/api/chat", requireAuth, rateLimit({ perUser: 60 }), async (req, res) => {
  const msg = await client.messages.create({
    model: "claude-opus-5-5",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: String(req.body.text).slice(0, 8000) }],
  });
  audit.log({ user: req.user.id, tokens: msg.usage });
  res.json({ text: msg.content.find((b) => b.type === "text")?.text ?? "" });
});`,
      takeaway: 'Clients authenticate to your backend; only the backend authenticates to Anthropic.',
    },
    {
      title: 'Per-environment workspaces and key rotation via the Admin API',
      description:
        'A platform team provisions a workspace per environment and automates rotation: create a new key in the Console or via their secret-manager workflow, roll it out, then deactivate the old key with the Admin API. Usage reports per workspace feed their spend alerts.',
      language: 'python',
      code: `import anthropic

admin = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_ADMIN_KEY"])  # sk-ant-admin..., never a workspace key

# One workspace per environment
prod = admin.beta.organization.workspaces.create(name="payments-prod")
admin.beta.organization.workspaces.members.add(
    prod.id, user_id=DEPLOYER_USER_ID, workspace_role="workspace_developer"
)

# Rotation: after the new key is live in the secret manager, retire the old one
for key in admin.beta.organization.api_keys.list(workspace_id=prod.id):
    if key.name == "payments-api-2026-q3":
        admin.beta.organization.api_keys.update(key.id, status="inactive")`,
      takeaway: 'Workspaces isolate blast radius and budget; the Admin API makes rotation and revocation routine.',
    },
    {
      title: 'The mistake: a token in .mcp.json',
      description:
        'A developer committed `.mcp.json` with a GitHub token so teammates could use the MCP server. The token was found by a scanner and revoked. The fixed file references an environment variable, and each developer sets it locally; CI injects it from its secret store.',
      language: 'json',
      code: `{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "\${GITHUB_TOKEN}"
      }
    }
  }
}`,
      takeaway: 'Config names the variable; the environment supplies the value.',
    },
    {
      title: 'Workload Identity Federation for CI',
      description:
        'A CI pipeline ran nightly evals with a long-lived API key stored as a CI secret that had not been rotated in a year. The team switched to WIF: an admin registered the CI provider as a federation issuer and a rule mapping the pipeline\'s identity to a service account with workspace:developer scope. The SDK exchanges the CI token automatically, so no Anthropic key is stored anywhere.',
      language: 'bash',
      code: `# CI job environment (no ANTHROPIC_API_KEY anywhere)
export ANTHROPIC_FEDERATION_RULE_ID=fdrl_...      # maps this CI identity -> service account
export ANTHROPIC_FEDERATION_TOKEN_FILE=/var/run/ci/oidc_token   # short-lived token from the CI provider

# The SDK/CLI performs the token exchange and refreshes before expiry
python run_evals.py   # anthropic.Anthropic() constructed with no arguments`,
      takeaway: 'Short-lived federated identity removes the stored secret and makes revocation a rule change.',
    },
  ],
  keyPoints: [
    'API keys never go in client-side code, prompts, source control, MCP configs or logs; they are read from environment variables or a secret manager on the backend.',
    'Use one Console workspace per environment (dev/staging/prod) and one named key per service for isolation, attribution and surgical revocation.',
    'The Admin API (client.beta.organization, sk-ant-admin keys) manages workspaces, members, API keys (deactivate to revoke), usage/cost reports, service accounts and federation; admin keys cannot call the Messages API.',
    'Rotate keys on a schedule and immediately on exposure: create, deploy, then deactivate the old key.',
    'Scope access with workspace roles (workspace_developer for day-to-day work) and monitor usage per key and workspace.',
    'Workload Identity Federation exchanges a platform identity token for short-lived access via federation issuers and rules, eliminating stored keys for CI and cloud workloads.',
    'Use ${VAR} expansion in .mcp.json and settings.json so configs reference variables, not values.',
    'In Managed Agents, vault credentials are injected at egress and never visible in the sandbox; do not paste keys into prompts as a workaround.',
  ],
  flashcards: [
    { front: 'Why must API keys never be in browser or mobile code?', back: 'Anything shipped to users can be extracted; calls must go through your backend, which holds the key and enforces auth and limits.' },
    { front: 'Which environment variable do the Anthropic SDKs read by default?', back: 'ANTHROPIC_API_KEY.' },
    { front: 'What is a Console workspace and why use several?', back: 'An isolation unit with its own keys, spend and rate limits, and usage reporting; one per environment or app limits blast radius and makes usage attributable.' },
    { front: 'How do you revoke an API key programmatically?', back: 'Admin API: client.beta.organization.api_keys.update(key_id, status="inactive").' },
    { front: 'Can an Admin API key call the Messages API?', back: 'No. Admin keys work only on /v1/organizations endpoints; workspace keys work only on the Messages and related APIs.' },
    { front: 'Describe a safe key rotation sequence.', back: 'Create the new key, deploy it from the secret store, verify traffic, then deactivate the old key.' },
    { front: 'What is Workload Identity Federation?', back: 'Authenticating a workload with a short-lived token from its own identity provider via a federation issuer and rule mapped to a service account, instead of a stored API key.' },
    { front: 'How do you keep tokens out of a committed .mcp.json?', back: 'Reference environment variables with ${VAR} (or ${VAR:-default}) expansion; the environment supplies the value.' },
    { front: 'How do Managed Agents vaults protect credentials?', back: 'Credentials are stored by Anthropic and injected at egress; the sandbox sees only a placeholder, so injected code cannot read them.' },
    { front: 'Name three monitoring signals for key misuse.', back: 'Spend spikes per key/workspace, use from unexpected regions, calls at unexpected times or volumes.' },
    { front: 'Which workspace role suits day-to-day development?', back: 'workspace_developer, rather than org-level admin.' },
  ],
  quiz: [
    {
      question:
        'A mobile app calls the Messages API directly with an embedded API key so the team can avoid running a server. What is the MOST appropriate change?',
      options: [
        'Obfuscate the key in the binary.',
        'Route requests through an authenticated backend that holds the key, enforces per-user limits and logs usage.',
        'Rotate the embedded key weekly.',
        'Use a workspace with a low spend limit so leaks are cheap.',
      ],
      correct: [1],
      explanation:
        'Any key shipped to clients is extractable; only a backend can keep it secret and enforce authorization. Obfuscation and rotation do not change that, and a spend limit merely caps the damage.',
    },
    {
      question: 'Which TWO practices best apply least privilege to API keys? (Select two)',
      options: [
        'One organization-wide key shared by all services for simplicity.',
        'Separate Console workspaces for development, staging and production, each with its own keys.',
        'Granting workspace_developer rather than organization admin to engineers who only need to build.',
        'Storing the production key in the project README so new hires can find it.',
      ],
      correct: [1, 2],
      explanation: 'Workspace separation and minimal roles limit blast radius. A shared key and a key in documentation do the opposite.',
    },
    {
      question: 'A nightly CI job uses a long-lived API key stored as a CI secret. Which option removes the stored secret entirely?',
      options: [
        'Encrypt the secret with a second key stored in the same CI system.',
        'Use Workload Identity Federation so the job exchanges its CI identity token for short-lived access.',
        'Move the key into the Dockerfile as a build argument.',
        'Paste the key into the agent\'s system prompt so it is available at runtime.',
      ],
      correct: [1],
      explanation:
        'WIF replaces the stored key with a federated short-lived token. Encrypting in place still stores a secret, build arguments leak into image layers, and prompts are logged and readable.',
    },
    {
      question: 'A developer needs to share an MCP server configuration that requires a token. How should .mcp.json be written?',
      options: [
        'Include the token; .mcp.json is local and never committed.',
        'Reference the token as ${GITHUB_TOKEN} in the env block and have each environment supply it.',
        'Base64-encode the token in the file.',
        'Put the token in CLAUDE.md instead.',
      ],
      correct: [1],
      explanation:
        'Project .mcp.json is typically committed, and Claude Code expands environment variables in it. Encoding is not encryption, and CLAUDE.md is both committed and read into the prompt.',
    },
    {
      question: 'Which statement about Admin API keys is correct?',
      options: [
        'They can be used to call the Messages API with elevated rate limits.',
        'They manage organization resources such as workspaces and API keys but cannot call the Messages API.',
        'They are the same as workspace keys with an admin flag.',
        'They are required for prompt caching.',
      ],
      correct: [1],
      explanation: 'Admin credentials work only on /v1/organizations endpoints; the separation is deliberate.',
    },
    {
      question: 'During an incident, a production key is suspected leaked. What is the correct order of operations?',
      options: [
        'Deactivate the key immediately, then create and deploy a new one.',
        'Create a new key, deploy it from the secret manager, verify traffic, then deactivate the old key.',
        'Wait for the usage report to confirm misuse before acting.',
        'Rotate the Admin key instead.',
      ],
      correct: [1],
      explanation:
        'Create-deploy-then-revoke avoids an outage while still closing the exposure quickly; if misuse is active and severe, revoke first and accept the outage. Waiting for reports and rotating an unrelated key do not address the leak.',
    },
  ],
  statements: [
    { text: 'It is acceptable to place an API key in the system prompt if the application is internal.', isTrue: false, explanation: 'Keys in prompts land in logs and transcripts and can be exfiltrated by injection; use environment variables or vaults.' },
    { text: 'Each Console workspace has its own API keys, spend limits and usage reporting.', isTrue: true, explanation: 'This is what makes per-environment workspaces an effective isolation boundary.' },
    { text: 'An Admin API key can be used to send messages to Claude.', isTrue: false, explanation: 'Admin keys work only on organization management endpoints.' },
    { text: 'Workload Identity Federation lets a CI job authenticate without a stored Anthropic API key.', isTrue: true, explanation: 'A federation issuer and rule map the workload identity to a service account; tokens are short-lived.' },
    { text: 'Claude Code expands ${VAR} references in .mcp.json from the environment.', isTrue: true, explanation: 'This keeps tokens out of committed configuration.' },
    { text: 'Managed Agents vault credentials are copied into the sandbox as environment variables.', isTrue: false, explanation: 'The sandbox sees only a placeholder; the real value is substituted at egress for allowed hosts.' },
    { text: 'Rotating a key means deactivating the old key before the new one is deployed.', isTrue: false, explanation: 'Normal rotation deploys the new key first to avoid an outage; immediate revocation is for active, severe misuse.' },
    { text: 'Secret managers and IAM-controlled environment injection are preferred over committing keys to private repositories.', isTrue: true, explanation: 'Private repositories are copied, forked and scanned; secret stores provide access control and audit.' },
  ],
  resources: [
    { label: 'Authentication overview (Claude docs)', url: 'https://platform.claude.com/docs/en/manage-claude/authentication' },
    { label: 'Workspaces', url: 'https://platform.claude.com/docs/en/manage-claude/workspaces' },
    { label: 'Admin API: Workload Identity Federation', url: 'https://platform.claude.com/docs/en/manage-claude/wif-admin-api' },
    { label: 'Claude Code MCP configuration', url: 'https://code.claude.com/docs/en/mcp' },
  ],
};
