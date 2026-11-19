import type { Concept } from '../../types';

export const authenticationAndAuthorizationDesign: Concept = {
  id: 'authentication-and-authorization-design',
  title: 'Authentication and Authorization Design',
  summary:
    'Propagate the end user\'s identity through the agent to every tool, authenticate MCP servers with OAuth, separate service identities from user identities, authorise per call, audit everything, and find the common gap: an agent acting with over-broad service credentials.',
  certs: ['ccar-p', 'ccar-f', 'ccdv-f'],
  domains: ['ccar-p-3', 'ccar-p-5', 'ccar-f-2', 'ccdv-f-7', 'ccdv-f-8'],
  tags: ['authentication', 'authorization', 'oauth', 'mcp', 'identity', 'audit', 'security'],
  difficulty: 'advanced',
  sections: [
    {
      heading: 'Three identities in every agent system',
      body: `An agent request involves at least three identities, and designs go wrong when they are conflated:

1. **The end user**: the human (or system) on whose behalf the agent acts. Their permissions should bound what the agent can do for them.
2. **The agent or application service identity**: the credentials the application uses to call Claude and to reach backend systems. This identity is usually powerful.
3. **Tool and MCP server identities**: each external system has its own authentication, often a separate token per server.

The common gap: the agent reaches every tool with its own powerful service credential, so the model can retrieve or change data the end user is not allowed to see. Authorisation then depends entirely on the model "deciding" to stay within the user's scope, which is not a security boundary. Prompt injection, a confused user or a model mistake turns the agent into a privilege-escalation path.

The principle: **the agent must never be able to do more for a user than that user could do directly.**`,
    },
    {
      heading: 'Propagating user identity to tools',
      body: `Design so that each tool call carries, and is checked against, the end user's identity:

- **Authenticate the user at the edge** (your application), then pass a user context (subject id, roles, tenant) to the tool layer out of band. Never let the model supply the identity as a tool argument; the model's input is untrusted.
- **Per-call authorisation** in each tool handler: check that this user may perform this action on this resource. Row-level filters (only this customer's orders), tenant isolation, and role checks live here.
- **Token exchange or on-behalf-of flows** where backend systems support them: exchange the user's token for a downstream token scoped to that user, so the backend enforces its own authorisation.
- **Scoped service credentials** where user tokens are impossible: give the agent a service identity whose permissions are no wider than the union of what its users may do, and still filter by user in the handler.

Claude's API has a \`metadata.user_id\` field for an opaque, hashed identifier used for abuse detection; it is not an authorisation mechanism. Authorisation happens in your tool layer.`,
    },
    {
      heading: 'Authenticating MCP servers',
      body: `MCP separates the transport from the authorisation model, and remote servers over Streamable HTTP use **OAuth 2.1**: the MCP client obtains a token for the server, typically through an authorization server the enterprise already runs, and presents it on each request. Design considerations:

- **Who is the OAuth subject?** For user-facing agents, the token should represent the end user (delegated authorisation), so the MCP server applies that user's permissions. For back-office automation, a service principal with narrow scopes.
- **Scopes.** Request the minimum scopes the role needs; a read-only agent should hold read-only scopes even if the server offers more.
- **Token handling.** Store tokens in a secrets manager, rotate them, and never place them in prompts, tool descriptions or logs.
- **Remote MCP via the MCP connector.** When Claude connects to a remote MCP server server-side (beta \`mcp-client-2025-11-20\`, \`mcp_servers\` with \`authorization_token\` and an \`mcp_toolset\` entry), your application supplies the token; obtaining and refreshing it per user is still your responsibility. The connector is first-party (and Claude Platform on AWS) only.
- **Local stdio servers** (Claude Code \`.mcp.json\`, Agent SDK) run with the host process's identity and environment; treat their credentials like any other secret and prefer project-scoped configuration that does not embed secrets in files committed to the repository.

Review MCP servers as dependencies: who runs them, what they can reach, what they log.`,
    },
    {
      heading: 'Auditing, common gaps and the exam angle',
      body: `**Audit trail.** Every tool call should be logged with the end-user identity, the agent identity, the tool, the arguments (redacted where sensitive), the authorisation decision and the outcome. This supports incident response, compliance (who accessed which record), and the capability reviews described in the least-privilege concept.

**Gaps that appear in architecture reviews:**

| Gap | Symptom | Fix |
|---|---|---|
| Over-broad service credential | Agent can read any customer's data | User-scoped tokens or per-call user authorisation in handlers |
| Identity from model arguments | Tool takes customer_id from the model | Derive identity from the authenticated session |
| Shared API key across environments | Dev prompts hit production data | Separate keys and identities per environment; Admin API for key management |
| Secrets in prompts or tool descriptions | Tokens visible in traces | Secrets manager; inject at the handler, never in model-visible text |
| No per-call check in MCP server | Server trusts any caller with the base token | OAuth with scopes; per-request authorisation inside the server |
| Missing audit of tool calls | Cannot answer "who did what" | Structured tool-call log with user and agent identity |

Exam stems describe an agent architecture and ask for the security gap or its fix. Look for the agent acting with its own powerful credentials, identity supplied by the model, or missing per-call authorisation. The best answers propagate user identity and enforce authorisation in the tool layer; distractors rely on the prompt ("only access the current customer's data"), on logging alone, or on model size.`,
    },
  ],
  examples: [
    {
      title: 'User context propagated out of band to tool handlers',
      description:
        'A healthcare scheduling agent authenticates the patient at the web edge, then runs the tool loop with a user context object. Tool handlers receive the context from the application, not from the model, and filter every query by patient id and role. The model can ask for "appointments" but can only ever see the authenticated patient\'s records.',
      language: 'typescript',
      code: `type UserCtx = { subject: string; roles: string[]; tenant: string };

async function runTool(name: string, input: unknown, ctx: UserCtx) {
  switch (name) {
    case "list_appointments":
      // identity comes from ctx (verified JWT), never from model input
      return db.appointments.find({ patientId: ctx.subject, tenant: ctx.tenant });
    case "cancel_appointment": {
      const { appointmentId } = input as { appointmentId: string };
      const appt = await db.appointments.get(appointmentId);
      if (!appt || appt.patientId !== ctx.subject) return { error: "not_authorized" };
      audit.log({ user: ctx.subject, tool: name, appointmentId, decision: "allow" });
      return db.appointments.cancel(appointmentId);
    }
    default:
      return { error: "unknown_tool" };
  }
}`,
      takeaway: 'Identity flows from the verified session to the handler; every call is authorised and audited against that identity.',
    },
    {
      title: 'Mistake: one admin service account for the whole agent',
      description:
        'A bank\'s internal assistant used a single database service account with read access to all customer tables. The system prompt said "Only discuss the current customer." A staff member asked about a celebrity customer and the agent complied, because nothing but the prompt stood in the way. The remediation introduced token exchange: the staff member\'s SSO token is exchanged for a downstream token scoped to the accounts they are assigned, and the database enforces row-level security on that identity.',
      takeaway: 'An over-broad service credential plus a prompt is not authorisation; scope credentials to the user and enforce in the data layer.',
    },
    {
      title: 'Remote MCP server with per-user OAuth token via the MCP connector',
      description:
        'An HR assistant uses a remote HR MCP server. The application runs an OAuth flow for each employee against the corporate identity provider, obtains a token with read-only HR scopes for that employee, and passes it to the connector. The HR server enforces the employee\'s permissions on every tool call.',
      language: 'python',
      code: `token = oauth.exchange_for_user(employee_sso_token, audience="hr-mcp", scopes=["hr.read"])

resp = client.beta.messages.create(
    model="claude-opus-5-5", max_tokens=1024,
    betas=["mcp-client-2025-11-20"],
    mcp_servers=[{"type": "url", "url": "https://hr-mcp.corp.example/mcp",
                  "name": "hr", "authorization_token": token}],   # per-user, read-only scopes
    tools=[{"type": "mcp_toolset", "mcp_server_name": "hr"}],
    system=HR_ASSISTANT_PROMPT,
    messages=[{"role": "user", "content": question}],
)`,
      takeaway: 'The token the MCP server receives should represent the end user with minimal scopes; the server, not the model, enforces permissions.',
    },
    {
      title: 'Shared API key across environments',
      description:
        'A team used one Anthropic API key and one CRM token in development, staging and production. A developer testing a prompt against staging data accidentally triggered account updates in production because the CRM token was production-scoped. The fix created separate keys and service identities per environment via the Admin API and secrets manager, with production credentials unavailable to developer machines.',
      takeaway: 'Separate identities and secrets per environment; development must not be able to reach production systems.',
    },
  ],
  keyPoints: [
    'Three identities: end user, agent/application service identity, tool and MCP server identities. Do not conflate them.',
    'The agent must never be able to do more for a user than the user could do directly.',
    'Propagate the authenticated user context out of band to tool handlers; never take identity from model-supplied arguments.',
    'Authorise per tool call in the handler (row-level, tenant, role); use token exchange or on-behalf-of flows where backends support them.',
    'Remote MCP servers use OAuth 2.1; request minimal scopes and make the token represent the end user for user-facing agents.',
    'The MCP connector takes an authorization_token per server; obtaining and refreshing it is the application\'s job. It is first-party only.',
    'Keep secrets in a secrets manager, out of prompts, tool descriptions and logs; separate keys and identities per environment.',
    'Audit every tool call with user identity, agent identity, arguments (redacted), decision and outcome.',
  ],
  flashcards: [
    { front: 'What is the most common authorisation gap in agent architectures?', back: 'The agent reaches tools with its own over-broad service credential, so the model can access data the end user is not allowed to see.' },
    { front: 'Where should the end user\'s identity come from in a tool handler?', back: 'From the verified session or token passed out of band by the application, never from model-supplied arguments.' },
    { front: 'What is the governing principle for agent authorisation?', back: 'The agent must never be able to do more for a user than that user could do directly.' },
    { front: 'How do remote MCP servers over Streamable HTTP authenticate clients?', back: 'OAuth 2.1 tokens, typically issued by the enterprise authorization server, presented on each request with minimal scopes.' },
    { front: 'What is metadata.user_id in the Claude API for?', back: 'An opaque, hashed identifier for abuse detection; it is not an authorisation mechanism.' },
    { front: 'Which parameters configure a remote MCP server in the MCP connector?', back: 'mcp_servers entries (type url, url, name, authorization_token) plus an mcp_toolset referencing the server name, under beta mcp-client-2025-11-20.' },
    { front: 'What must a tool-call audit record contain?', back: 'End-user identity, agent identity, tool name, redacted arguments, authorisation decision and outcome.' },
    { front: 'Why separate API keys and service identities per environment?', back: 'So development and staging cannot reach production data or trigger production side effects.' },
    { front: 'What is token exchange (on-behalf-of) used for in agent systems?', back: 'Exchanging the user\'s token for a downstream token scoped to that user so backends enforce their own authorisation.' },
  ],
  quiz: [
    {
      question:
        'An internal banking assistant uses one database service account with read access to all customer tables, and the system prompt says "Only discuss the current customer." Which is the MOST significant security gap?',
      options: [
        'The system prompt is too short.',
        'Authorisation depends on the model obeying the prompt; the service credential lets the agent read any customer\'s data.',
        'The database account should also have write access for completeness.',
        'The assistant should use a larger model to interpret the prompt more reliably.',
      ],
      correct: [1],
      explanation:
        'A prompt is not an authorisation boundary. The fix is user-scoped credentials or per-call authorisation. Prompt length (1) and model size (4) do not change what the credential permits; adding write access (3) widens the gap.',
    },
    {
      question:
        'A tool named get_customer_orders takes customer_id as an argument supplied by the model. What is the BEST change?',
      options: [
        'Ask the model in the system prompt to only pass the current customer\'s id.',
        'Derive the customer id from the authenticated session in the handler and remove it from the model-facing schema.',
        'Log every customer_id passed so misuse can be detected.',
        'Encrypt the customer_id argument.',
      ],
      correct: [1],
      explanation:
        'Model-supplied identity is untrusted input. Prompting (1) is advisory, logging (3) is detective, and encryption (4) does not prevent the model from naming another customer.',
    },
    {
      question: 'Which TWO practices are correct for authenticating a remote MCP server used by a user-facing agent? (Select two)',
      options: [
        'Obtain an OAuth token that represents the end user with the minimum scopes the role needs.',
        'Embed the server token in the system prompt so the model can present it.',
        'Have the MCP server authorise each request against the token\'s subject and scopes.',
        'Use one long-lived admin token shared by all users for simplicity.',
      ],
      correct: [0, 2],
      explanation:
        'Delegated, minimally scoped tokens plus server-side per-request authorisation is the correct design. Tokens in prompts (2) leak into traces and model output; a shared admin token (4) is the over-broad credential gap.',
    },
    {
      question:
        'A developer testing prompts against staging accidentally updated production CRM records. What was the root cause?',
      options: [
        'The model hallucinated a production endpoint.',
        'Credentials and service identities were shared across environments, so staging could reach production.',
        'Prompt caching replayed a production request.',
        'The developer used the wrong model id.',
      ],
      correct: [1],
      explanation:
        'Environment separation of keys and identities prevents this class of incident. Caching (3) does not replay requests; model id (4) and hallucination (1) do not grant access to production.',
    },
    {
      question:
        'Compliance asks "which agent, acting for which employee, accessed this record last Tuesday?" Which design element answers this?',
      options: [
        'The model\'s thinking content.',
        'A structured tool-call audit log recording end-user identity, agent identity, tool, redacted arguments, decision and outcome.',
        'The prompt-caching usage fields.',
        'The MCP server\'s tool descriptions.',
      ],
      correct: [1],
      explanation:
        'Only a per-call audit trail with both identities answers the question. Thinking content (1), usage fields (3) and tool descriptions (4) contain no access records.',
    },
  ],
  statements: [
    { text: 'An agent acting with a powerful service credential is adequately secured if the system prompt restricts it to the current user\'s data.', isTrue: false, explanation: 'The prompt is advisory; the credential defines what is possible. Scope credentials to the user or authorise per call.' },
    { text: 'Remote MCP servers over Streamable HTTP use OAuth 2.1 for authorization.', isTrue: true, explanation: 'The MCP specification adopts OAuth 2.1 for HTTP transports.' },
    { text: 'metadata.user_id in the Messages API enforces per-user authorisation on tool calls.', isTrue: false, explanation: 'It is an opaque identifier for abuse detection; authorisation is enforced in your tool layer.' },
    { text: 'Tool handlers should derive identity from the authenticated session rather than from model-supplied arguments.', isTrue: true, explanation: 'Model input is untrusted and can be manipulated.' },
    { text: 'The MCP connector in the Messages API accepts an authorization_token per server, and the application is responsible for obtaining and refreshing it.', isTrue: true, explanation: 'Claude connects server-side, but token lifecycle is the application\'s job.' },
    { text: 'Using one API key for development, staging and production simplifies operations without meaningful risk.', isTrue: false, explanation: 'Shared credentials let non-production code reach production data and side effects; separate identities per environment.' },
    { text: 'Secrets may be placed in tool descriptions because the model needs them to call external APIs.', isTrue: false, explanation: 'Secrets belong in the handler via a secrets manager; model-visible text appears in traces and can be exfiltrated.' },
  ],
  resources: [
    { label: 'MCP authorization specification', url: 'https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization' },
    { label: 'MCP connector (Claude docs)', url: 'https://platform.claude.com/docs/en/agents-and-tools/mcp-connector' },
    { label: 'Admin API (Claude docs)', url: 'https://platform.claude.com/docs/en/build-with-claude/administration-api' },
    { label: 'MCP in Claude Code', url: 'https://code.claude.com/docs/en/mcp' },
  ],
};
