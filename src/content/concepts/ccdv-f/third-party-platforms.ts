import type { Concept } from '../../types';

export const thirdPartyPlatforms: Concept = {
  id: 'third-party-platforms',
  title: 'Third-Party Platforms',
  summary:
    'Running Claude through Amazon Bedrock, Google Cloud Vertex AI, Microsoft Foundry and Claude Platform on AWS: what changes in auth, model ids, feature availability and billing, and when an enterprise picks each.',
  certs: ['ccdv-f', 'ccar-p'],
  domains: ['ccdv-f-2', 'ccar-p-3', 'ccar-p-1'],
  tags: ['bedrock', 'vertex', 'foundry', 'aws', 'enterprise', 'api'],
  difficulty: 'intermediate',
  sections: [
    {
      heading: 'Why enterprises use a cloud platform',
      body: `The first-party Claude API is the reference surface: every feature lands there first and the SDKs default to it. Enterprises nevertheless often call Claude through their cloud provider because:

- **Procurement and billing.** Spend flows through an existing AWS, Google Cloud or Azure account and can draw down committed-spend agreements.
- **Identity.** Access is governed by IAM roles, service accounts or Entra ID rather than a separate API key.
- **Data boundaries.** Traffic stays inside the cloud's network perimeter, in a chosen region, under the cloud's compliance attestations.
- **Platform tooling.** Logging, guardrail services, VPC endpoints and monitoring the team already runs.

The price for that is lag and a feature subset: partner-operated platforms release models on their own schedule and expose only some API features. The exam wants you to know which features are missing where, how model ids and auth differ, and how to choose.`,
    },
    {
      heading: 'Amazon Bedrock',
      body: `Claude in Amazon Bedrock is partner operated. The modern integration uses the **Mantle** client, which speaks the Messages API shape against a Bedrock endpoint:

- Python: \`pip install "anthropic[bedrock]"\` → \`AnthropicBedrockMantle()\`; TypeScript: \`@anthropic-ai/bedrock-sdk\`.
- Auth: the standard AWS credential chain (env keys, profiles, instance roles) and IAM policies. A region is required (\`AWS_REGION\` or \`aws_region=\`); the SDK no longer falls back to \`us-east-1\`.
- Model ids carry a provider prefix: \`anthropic.claude-opus-5-5\`. Sending the bare first-party id returns a 400.
- A legacy Bedrock integration (\`InvokeModel\` / \`Converse\` with ARN-style ids such as \`anthropic.claude-3-5-sonnet-20241022-v2:0\`) still exists with a different request shape and an \`anthropic_version\` body field.

Not available on Bedrock: Message Batches, Files API, Models API, web search, web fetch, code execution, Agent Skills, server-side fallbacks, message threads and Managed Agents. Caching, thinking and effort, structured outputs, token counting, tool search and citations work.`,
    },
    {
      heading: 'Google Cloud Vertex AI and Microsoft Foundry',
      body: `**Vertex AI** (Google operated; the docs call it "Claude Models on Google Cloud (Google managed)"):

- Python: \`anthropic[vertex]\` → \`AnthropicVertex(project_id=..., region=...)\`; TypeScript: \`@anthropic-ai/vertex-sdk\`.
- Auth is Google **Application Default Credentials** (\`gcloud auth application-default login\` locally, a service account in production) with the Vertex AI IAM roles.
- Model ids have **no provider prefix**; older dated ids used \`@\` before the date (\`claude-3-5-sonnet-v2@20241022\`).
- Missing: Batches, Files, Models API, web fetch, code execution, Skills, fallbacks. Web search is the basic version only.

A separate **Anthropic-managed** offering on Google Cloud ("Claude Models on Google Cloud (Anthropic managed)") behaves like the first-party API with Google credentials; it is not Vertex AI and uses a different client.

**Microsoft Foundry**: Claude is deployed as model deployments inside Azure, authenticated with Entra ID or an API key, using the \`AnthropicFoundry\` client. Deployments are either "Hosted on Anthropic" (near first-party parity, including Files and code execution) or "Hosted on Azure" (a narrower set). Batches and the Models API are not offered on Foundry.`,
    },
    {
      heading: 'Claude Platform on AWS',
      body: `Claude Platform on AWS is **Anthropic-operated** access to the Claude Developer Platform through AWS infrastructure. It is not Bedrock, and the two coexist.

- Client: \`AnthropicAWS()\` (Python \`anthropic[aws]\`, TypeScript \`@anthropic-ai/aws-sdk\`), used exactly like \`Anthropic()\`.
- Auth: SigV4 with the AWS credential chain, IAM policies, and billing through AWS Marketplace. Requires \`AWS_REGION\` and \`ANTHROPIC_AWS_WORKSPACE_ID\`.
- Model ids are the **bare** first-party strings (\`claude-opus-5-5\`).
- Feature parity with the first-party API on the same day, including Batches, Files, Models API, server tools and Managed Agents (with a few Managed Agents caveats).

When the requirement is "AWS billing and IAM" rather than "the Bedrock ecosystem", this is the option that keeps the full feature set.`,
    },
    {
      heading: 'Choosing a platform',
      body: `| Need | Pick |
|---|---|
| Newest features and models immediately, simplest setup | First-party Claude API |
| AWS billing and IAM with full API parity (Batches, Files, Managed Agents) | Claude Platform on AWS |
| Already standardised on Bedrock tooling (Guardrails, VPC endpoints, Converse) and can live without Batches/Files/server tools | Amazon Bedrock |
| Google Cloud commitments, ADC-based identity, Vertex monitoring | Vertex AI (or the Anthropic-managed Google Cloud offering for parity) |
| Azure commitments and Entra ID | Microsoft Foundry (prefer Hosted on Anthropic deployments for features) |

Design for portability: isolate the client construction and the model id in one configuration module so switching platforms is a config change, keep request bodies to features available on every platform you target, and check the platform availability table before promising a feature. Prompt caches, rate limits and quotas are per platform, so a multi-cloud deployment does not share them.`,
    },
  ],
  examples: [
    {
      title: 'One code path, three platforms',
      description:
        'A vendor ships the same product to customers on AWS and Google Cloud. Client construction and model id come from configuration; everything else is the shared Messages API shape.',
      language: 'python',
      code: `import os
from anthropic import Anthropic, AnthropicBedrockMantle, AnthropicVertex, AnthropicAWS

def make_client():
    match os.environ["CLAUDE_PLATFORM"]:
        case "bedrock":
            return AnthropicBedrockMantle(aws_region="us-west-2"), "anthropic.claude-opus-5-5"
        case "vertex":
            return AnthropicVertex(project_id=os.environ["GCP_PROJECT"], region="us-east5"), "claude-opus-5-5"
        case "aws":
            return AnthropicAWS(), "claude-opus-5-5"   # AWS_REGION + ANTHROPIC_AWS_WORKSPACE_ID
        case _:
            return Anthropic(), "claude-opus-5-5"

client, model = make_client()
resp = client.messages.create(model=model, max_tokens=1024,
                              messages=[{"role": "user", "content": "Hello"}])`,
      takeaway: 'Only the client and the model id string differ; keep them in config.',
    },
    {
      title: 'Mistake: first-party model id on Bedrock',
      description:
        'A team copied a working snippet into their Bedrock service and every call failed with a 400 about the model. Bedrock ids need the anthropic. prefix. Conversely, the same prefixed id sent to the first-party API returns a 404.',
      language: 'text',
      code: `Platform                 Model id
Claude API               claude-opus-5-5
Claude Platform on AWS   claude-opus-5-5
Amazon Bedrock           anthropic.claude-opus-5-5
Vertex AI                claude-opus-5-5   (older: claude-3-5-sonnet-v2@20241022)
Microsoft Foundry        your deployment name`,
      takeaway: 'Bedrock is the platform with the provider prefix; everywhere else uses bare ids or deployment names.',
    },
    {
      title: 'Mistake: planning a Batches backfill on Vertex',
      description:
        'An architecture review assumed a 50% batch discount for a nightly backfill running on Vertex AI. The Batches API is not available there. The options were to run the backfill against the first-party API (or Claude Platform on AWS) or accept full price synchronously on Vertex.',
      language: 'text',
      code: `Feature              1P   P-AWS  Bedrock  Vertex  Foundry
Message Batches      yes  yes    no       no      no
Files API            yes  yes    no       no      yes*
Models API           yes  yes    no       no      no
Web search           yes  yes    no       basic   yes
Code execution       yes  yes    no       no      yes*
Prompt caching       yes  yes    yes      yes     yes
Adaptive thinking    yes  yes    yes      yes     yes
* Hosted on Anthropic deployments only`,
      takeaway: 'Check feature availability per platform before committing to a design.',
    },
  ],
  keyPoints: [
    'Enterprises pick cloud platforms for billing, IAM, data boundaries and existing tooling; the cost is release lag and a feature subset.',
    'Bedrock: AnthropicBedrockMantle client, AWS credential chain, region required, model ids prefixed anthropic. (e.g. anthropic.claude-opus-5-5).',
    'Vertex AI: AnthropicVertex(project_id, region), Application Default Credentials, no prefix on model ids.',
    'Foundry: Azure deployments with Entra ID or API key; Hosted on Anthropic deployments have more features than Hosted on Azure.',
    'Claude Platform on AWS: Anthropic-operated, SigV4 and IAM, AWS Marketplace billing, bare model ids, same-day feature parity.',
    'Batches, Files and Models APIs are only on the Claude API and Claude Platform on AWS (Files also on Foundry Hosted on Anthropic).',
    'Caches, rate limits and quotas are per platform; isolate client and model id in configuration for portability.',
  ],
  flashcards: [
    { front: 'How are Claude model ids written on Amazon Bedrock?', back: 'With the provider prefix, e.g. anthropic.claude-opus-5-5.' },
    { front: 'Which client class targets modern Bedrock?', back: 'AnthropicBedrockMantle (Python anthropic[bedrock], TypeScript @anthropic-ai/bedrock-sdk).' },
    { front: 'How does the Vertex AI client authenticate?', back: 'Google Application Default Credentials (gcloud auth application-default login or a service account) with project_id and region.' },
    { front: 'Do Vertex model ids use a provider prefix?', back: 'No. Current ids are bare; older dated ids used @ before the date.' },
    { front: 'What is Claude Platform on AWS?', back: 'Anthropic-operated access to the full Claude Developer Platform through AWS with SigV4, IAM and Marketplace billing; bare model ids; same-day parity. Not Bedrock.' },
    { front: 'Which platforms offer the Message Batches API?', back: 'The Claude API and Claude Platform on AWS only.' },
    { front: 'Which Foundry deployment type has more features?', back: 'Hosted on Anthropic (Files, code execution, Skills); Hosted on Azure returns 400 for those.' },
    { front: 'Name four features missing on Bedrock.', back: 'Any of: Batches, Files API, Models API, web search, web fetch, code execution, Skills, server-side fallbacks, Managed Agents.' },
    { front: 'Are prompt caches shared across platforms?', back: 'No. Caches, rate limits and quotas are per platform.' },
  ],
  quiz: [
    {
      question:
        'An enterprise must bill Claude usage through AWS and control access with IAM, and it also needs the Message Batches API and Files API. Which option fits best?',
      options: [
        'Amazon Bedrock with the Mantle client.',
        'Claude Platform on AWS.',
        'Vertex AI with a service account.',
        'The first-party API with keys stored in AWS Secrets Manager.',
      ],
      correct: [1],
      explanation:
        'Claude Platform on AWS gives AWS billing and IAM with full first-party parity including Batches and Files. Bedrock lacks both APIs, Vertex is a different cloud, and the first-party API does not bill through AWS.',
    },
    {
      question: 'A snippet that works against the first-party API fails on Bedrock with a 400 referencing the model. What is the most likely cause?',
      options: [
        'Bedrock requires a beta header for current models.',
        'The model id lacks the anthropic. provider prefix.',
        'max_tokens is too high for Bedrock.',
        'Bedrock does not support the Messages API shape.',
      ],
      correct: [1],
      explanation:
        'Bedrock model ids are prefixed with anthropic.; the Mantle client speaks the Messages API shape, and no beta header or max_tokens change is involved.',
    },
    {
      question: 'Which TWO are correct about Google Cloud Vertex AI? (Select two)',
      options: [
        'Authentication uses Application Default Credentials and IAM.',
        'Model ids are prefixed with google.',
        'The Message Batches API is unavailable there.',
        'It is operated by Anthropic.',
      ],
      correct: [0, 2],
      explanation:
        'Vertex uses ADC and lacks Batches. Model ids have no prefix, and Vertex is Google operated (the Anthropic-managed Google Cloud offering is a separate platform).',
    },
    {
      question: 'A team needs server-side web search and code execution in an agent and is choosing between Bedrock and the first-party API. Which statement is accurate?',
      options: [
        'Both platforms offer web search and code execution.',
        'Bedrock offers neither; the first-party API offers both.',
        'Bedrock offers code execution but not web search.',
        'Neither platform offers server-side tools.',
      ],
      correct: [1],
      explanation:
        'Web search, web fetch and code execution are not available on Bedrock. They are available on the Claude API and Claude Platform on AWS.',
    },
    {
      question: 'What is the best way to keep an application portable across the Claude API, Bedrock and Vertex?',
      options: [
        'Hard-code the Bedrock model id since it is the most specific.',
        'Isolate client construction and the model id in configuration and use only features available on all target platforms.',
        'Use the Files API everywhere to standardise input.',
        'Rely on a shared prompt cache across platforms.',
      ],
      correct: [1],
      explanation:
        'Client and model id are the platform-specific parts. Files is not on Bedrock or Vertex, and caches are not shared across platforms.',
    },
  ],
  statements: [
    { text: 'Claude Platform on AWS is another name for Amazon Bedrock.', isTrue: false, explanation: 'They are different: Claude Platform on AWS is Anthropic operated with full parity and bare ids; Bedrock is partner operated with a feature subset and prefixed ids.' },
    { text: 'Bedrock model ids use the anthropic. prefix.', isTrue: true, explanation: 'For example anthropic.claude-opus-5-5; the bare id returns a 400 on Bedrock.' },
    { text: 'Vertex AI authenticates with an Anthropic API key.', isTrue: false, explanation: 'It uses Google Application Default Credentials and IAM.' },
    { text: 'Prompt caching and adaptive thinking are available on Bedrock, Vertex and Foundry.', isTrue: true, explanation: 'Core Messages features are broadly available; the gaps are Batches, Files, Models API and most server tools.' },
    { text: 'The Message Batches API is available on Microsoft Foundry.', isTrue: false, explanation: 'Batches are only on the Claude API and Claude Platform on AWS.' },
    { text: 'Rate limits and prompt caches are shared across all platforms for one organisation.', isTrue: false, explanation: 'Each platform has its own quotas and caches.' },
    { text: 'Foundry deployments hosted on Anthropic support the Files API while those hosted on Azure do not.', isTrue: true, explanation: 'Hosted on Azure deployments return a 400 for Files, code execution and Skills.' },
  ],
  resources: [
    { label: 'Claude in Amazon Bedrock', url: 'https://platform.claude.com/docs/en/build-with-claude/claude-in-amazon-bedrock' },
    { label: 'Claude on Vertex AI', url: 'https://platform.claude.com/docs/en/build-with-claude/claude-on-vertex-ai' },
    { label: 'Claude in Microsoft Foundry', url: 'https://platform.claude.com/docs/en/build-with-claude/claude-in-microsoft-foundry' },
    { label: 'Claude Platform on AWS', url: 'https://platform.claude.com/docs/en/build-with-claude/claude-platform-on-aws' },
  ],
};
