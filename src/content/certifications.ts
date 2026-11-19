import type { Certification } from './types';

/**
 * Exam blueprints transcribed from the official Anthropic exam guides
 * (Version 1.0, effective July 2026). Weights are the approximate share of
 * scored items per domain. Anthropic has announced updated guides for
 * 17 November 2026 and updated exam content from 7 December 2026, so check the
 * Partner Academy for the latest version.
 */
export const certifications: Certification[] = [
  {
    id: 'ccao-f',
    code: 'CCAO-F',
    name: 'Claude Certified Associate – Foundations',
    shortName: 'Associate',
    level: 'Foundations',
    role: 'Associate',
    tagline: 'Apply Claude to business and productivity work with minimal guidance.',
    description:
      'Validates that you can use Claude (Projects, Artifacts, research, connectors, Skills) to complete structured business tasks, evaluate outputs critically, pick the right product features and model tier, follow governance rules, and know when to escalate technical work to Developers and Architects.',
    audience:
      'Operations, marketing, project management, education, communications and other knowledge workers who use Claude as a core productivity tool. Not aimed at developers building against the API.',
    items: 60,
    minutes: 120,
    passingScore: 720,
    priceUsd: 99,
    validityMonths: 12,
    recommendedExperience: [
      'Regular, hands-on experience using Claude in a professional setting',
      'Foundational understanding of structured problem-solving, workflow design and digital tools',
      'Practical understanding of AI limitations: hallucinations, context constraints, data sensitivity',
    ],
    domains: [
      {
        id: 'ccao-f-1',
        number: 1,
        name: 'Prompting and Task Execution',
        weight: 14,
        objectives: [
          'Create effective prompts for business and technical tasks',
          'Apply task decomposition techniques to structure complex requests',
          'Iterate prompts to improve output quality',
          'Adapt prompting strategies based on task type (analysis, research, drafting, brainstorming)',
        ],
      },
      {
        id: 'ccao-f-2',
        number: 2,
        name: 'Output Evaluation and Validation',
        weight: 21,
        objectives: [
          'Evaluate Claude-generated outputs for accuracy and completeness',
          'Identify hallucinations, inconsistencies, and biases in responses',
          'Apply fact-checking and validation techniques',
          'Determine when human review or additional verification is required',
          'Edit, adapt, refine, and compare outputs for the intended audience',
          'Organize and curate information and select appropriate output formats (artifacts, inline, structured data)',
        ],
      },
      {
        id: 'ccao-f-3',
        number: 3,
        name: 'Product and Model Selection',
        weight: 12,
        objectives: [
          'Select appropriate Claude product features (Projects, research mode, chat, artifacts)',
          'Differentiate between Claude model types (Haiku, Sonnet, Opus)',
          'Align model selection with task requirements (cost, speed, quality)',
          'Understand and manage context limitations and memory considerations (when to restart, summarize, or persist)',
        ],
      },
      {
        id: 'ccao-f-4',
        number: 4,
        name: 'Workflow Integration and Solution Design',
        weight: 16,
        objectives: [
          'Apply Claude to analyze requirements and use cases',
          'Leverage Claude for research, planning, and process optimization',
          'Use Claude to support solution design, development, and iteration',
          'Integrate Claude into existing workflows to augment or redesign them',
          "Communicate Claude's value and limitations to stakeholders",
        ],
      },
      {
        id: 'ccao-f-5',
        number: 5,
        name: 'Configuration and Knowledge Management',
        weight: 12,
        objectives: [
          'Configure Claude Projects with instructions and knowledge sources',
          'Manage uploaded knowledge and connectors (e.g., Google Drive, Gmail)',
          'Create effective system-level instructions',
          'Inform, maintain, and update Claude configurations, knowledge sources, and instructions',
        ],
      },
      {
        id: 'ccao-f-6',
        number: 6,
        name: 'Governance, Risk, and Responsible Use',
        weight: 15,
        objectives: [
          'Identify appropriate and inappropriate use cases',
          'Apply data sensitivity, regulatory, and privacy considerations',
          'Follow organizational AI policies and governance standards',
          'Understand the ethical implications of AI usage',
        ],
      },
      {
        id: 'ccao-f-7',
        number: 7,
        name: 'Troubleshooting and Optimization',
        weight: 10,
        objectives: [
          'Identify, diagnose, and resolve issues with underperforming prompts or poor outputs',
          'Adjust approach based on feedback and results',
          'Optimize workflows for efficiency and effectiveness',
        ],
      },
    ],
  },
  {
    id: 'ccdv-f',
    code: 'CCDV-F',
    name: 'Claude Certified Developer – Foundations',
    shortName: 'Developer',
    level: 'Foundations',
    role: 'Developer',
    tagline: 'Build, integrate and ship production-grade Claude applications, agents and workflows.',
    description:
      'Validates that you can integrate Claude through the API and SDKs (streaming, errors, multi-format input), build agents with the Agent SDK and custom loops, operate Claude Code, write prompts and manage context, run evals and debug failures, choose model tiers and control cost, apply secure-by-design principles, and build tools and MCP servers.',
    audience:
      'AI/ML engineers, technical leads and senior software engineers with 1–5 years of engineering experience and at least six months of hands-on Claude or LLM work. Proficient in Python and/or TypeScript.',
    items: 53,
    minutes: 120,
    passingScore: 720,
    priceUsd: 125,
    validityMonths: 12,
    recommendedExperience: [
      'One to five years of software engineering experience',
      'At least six months hands-on with Claude or comparable LLM systems',
      'Proficiency in Python and/or TypeScript',
      'Fluency with REST APIs and CLI tools',
      'Working understanding of LLM fundamentals, agents, context management and MCP',
    ],
    domains: [
      {
        id: 'ccdv-f-1',
        number: 1,
        name: 'Agents and Workflows',
        weight: 14.7,
        objectives: [
          'Decide between a workflow and an agent; structure manager/supervisor hierarchies; use subagents',
          'Construct agents with the Claude Agent SDK, custom loops and harnesses, managed vs self-hosted deployment, and hooks',
          'Apply agent patterns (tool-use loops, subagents, memory, context-window management) and frameworks (Strands, LangGraph, PydanticAI)',
        ],
        skills: [
          {
            name: 'Agent Architecture',
            weight: 4.5,
            description:
              'Principles, patterns, and tradeoffs of agent and workflow architecture, including the decision criteria for using a workflow versus an agent, the structure of manager/supervisor hierarchies, and the role of subagents in improving task execution.',
          },
          {
            name: 'Agent Construction with Claude',
            weight: 5.3,
            description:
              'Methods, tools, and platforms for constructing Claude agents, including the Claude Agent SDK, custom agent loops and harnesses, managed agent deployment models (self-hosted vs. Anthropic-hosted), and hooks for deterministic actions.',
          },
          {
            name: 'Agent Patterns and Frameworks',
            weight: 4.9,
            description:
              'Common agent design patterns (tool-use loops, sub-agents, memory, context-window management) and agentic abstraction frameworks (e.g., Strands, LangGraph, PydanticAI) for building agents and workflows for multi-step tasks.',
          },
        ],
      },
      {
        id: 'ccdv-f-2',
        number: 2,
        name: 'Applications and Integration',
        weight: 33.1,
        objectives: [
          'Derive functional and infrastructure requirements from business requirements and solution architecture',
          'Apply systems life cycle concepts to develop, implement, operate and maintain Claude systems',
          'Use Claude API mechanics: messages, tools, streaming, vision, thinking, caching, third-party vendors, batch vs realtime',
          'Apply software engineering foundations: REST, JSON, async, version control, SDLC, code review, refactoring',
          'Design Claude applications across interfaces: content boundaries, schema design, session hygiene, plugin management',
          'Manage configuration: CLAUDE.md, settings.json, model version pinning, prompt versioning, plugin dependencies',
        ],
        skills: [
          {
            name: 'Understanding Requirements',
            weight: 3.4,
            description: 'Functional and infrastructure requirements based on business requirements and solution architecture.',
          },
          {
            name: 'Systems Life Cycle',
            weight: 2.8,
            description:
              'Systems life cycle management concepts and frameworks used to develop, implement, operate, and maintain IT systems.',
          },
          {
            name: 'Claude API Mechanics',
            weight: 6.8,
            description:
              'Claude API behavior and mechanics, including messages, tools, streaming, vision, thinking, caching, invoking Claude through third-party vendors, Messages API data access patterns, batch API use, and tradeoffs between realtime and batch API selection.',
          },
          {
            name: 'Software Engineering Foundations',
            weight: 7.4,
            description:
              'Core software engineering principles and practices, including REST APIs, JSON, asynchronous programming, version control, SDLC integration, code review, and small- and large-scale refactoring.',
          },
          {
            name: 'Claude Application Design',
            weight: 8.6,
            description:
              'Design considerations for building Claude applications, including how Claude interprets instructions across interfaces (Claude Code, Desktop, claude.ai, API, SDKs), content boundaries, schema design, session hygiene, and plugin management.',
          },
          {
            name: 'Configuration Management',
            weight: 4.1,
            description:
              'Configuration management for Claude system components, including CLAUDE.md files, settings.json, model version pinning, prompt versioning, and plugin dependencies.',
          },
        ],
      },
      {
        id: 'ccdv-f-3',
        number: 3,
        name: 'Claude Code',
        weight: 3.1,
        objectives: [
          'Operate Claude Code: Rules, Skills, Commands, Agents, Agent Memory; sessions, slash commands, headless/streaming/auto mode; CLAUDE.md hierarchy; settings.json',
        ],
        skills: [
          {
            name: 'Claude Code Operation',
            weight: 3.1,
            description:
              'Claude Code core components (Rules, Skills, Commands, Agents, Agent Memory), features (session management, built-in and custom slash commands, headless mode, streaming mode, auto-mode), the CLAUDE.md hierarchy, repository initialization, and settings.json configuration.',
          },
        ],
      },
      {
        id: 'ccdv-f-4',
        number: 4,
        name: 'Eval, Testing, and Debugging',
        weight: 2.6,
        objectives: [
          'Identify error types, select recovery strategies, analyze traces for failure modes, and isolate problems between integration layer and model output',
        ],
        skills: [
          {
            name: 'Debugging and Error Handling',
            weight: 2.6,
            description:
              'Debugging and error handling techniques for Claude applications, including error type identification, recovery strategy selection, trace analysis to identify failure modes, and problem origin isolation between the integration layer and model output.',
          },
        ],
      },
      {
        id: 'ccdv-f-5',
        number: 5,
        name: 'Model Selection and Optimization',
        weight: 16.8,
        objectives: [
          'Explain LLM fundamentals: tokens, context windows, sampling, non-determinism, next-token generation; fast mode, extended/adaptive thinking, effort; zero/one/few-shot prompting',
          'Apply technical fundamentals: integrating with SDKs that wrap REST APIs, websockets',
          'Choose between Opus, Sonnet and Haiku; weigh quality/latency/cost; handle breaking behavior changes across releases',
          'Manage tokens and cost: usage tracking, cost modeling, prompt caching and cache checkpoints',
        ],
        skills: [
          {
            name: 'LLM Fundamentals',
            weight: 5.2,
            description:
              'Basic understanding of LLMs (tokens, context windows, sampling, non-determinism, next-token generation), model options (fast mode, extended thinking, adaptive thinking, effort levels), and fundamental prompting techniques (zero-shot, single-shot, multi-shot).',
          },
          {
            name: 'Technical Fundamentals',
            weight: 6.1,
            description:
              'Foundational technical concepts supporting AI application development, including basic engineering practices (integrating with SDKs that wrap REST APIs, websockets).',
          },
          {
            name: 'Model Selection and Tradeoffs',
            weight: 2.7,
            description:
              'Claude model capabilities (Opus vs. Sonnet vs. Haiku use cases, adaptive thinking support), tradeoffs across quality/latency/cost parameters, and breaking behavior changes across model releases when selecting models for tasks.',
          },
          {
            name: 'Cost and Token Management',
            weight: 2.8,
            description:
              'Token budgeting and cost management techniques for Claude applications, including token usage tracking, cost modeling, and caching techniques (prompt caching, cache check-pointing) for cost optimization.',
          },
        ],
      },
      {
        id: 'ccdv-f-6',
        number: 6,
        name: 'Prompt and Context Engineering',
        weight: 11,
        objectives: [
          'Manage context and memory: window management, preventing drift and bloat (pruning, compaction), isolating context with subagents',
          'Engineer prompts: instruction clarity, few-shot, system vs user placement, output constraints, iterative refinement, input sanitization',
          'Handle output: structured output patterns, response validation, defensive parsing, skepticism toward confident output',
        ],
        skills: [
          {
            name: 'Context Engineering',
            weight: 3.8,
            description:
              'Context and memory management techniques for Claude applications, including context window management, prevention of context drift and bloat (tool output pruning, compaction), and context isolation through subagents or multi-step agentic workflows.',
          },
          {
            name: 'Prompt Engineering',
            weight: 4.6,
            description:
              'Prompt engineering principles and methods (instruction clarity, few-shot examples, system versus user placement, output constraints, prompt and instruction placement across components, iterative refinement, prompt adjustment, input sanitization) when writing and iterating on prompts for Claude.',
          },
          {
            name: 'Output Handling',
            weight: 2.6,
            description:
              'Established patterns and techniques for producing, validating, and consuming Claude output, including structured output patterns, response validation, defensive parsing, and skepticism toward confident output.',
          },
        ],
      },
      {
        id: 'ccdv-f-7',
        number: 7,
        name: 'Security and Safety',
        weight: 8.1,
        objectives: [
          'Apply AI application security: prompt injection, jailbreak defense, untrusted input, data leakage, PII, authn/authz',
          'Deploy safely: content policy, guardrail layering, secure-by-design, least privilege',
          'Use hooks as guardrails to prevent destructive actions',
          'Manage identity, secrets and API keys across environments',
        ],
        skills: [
          {
            name: 'AI Application Security',
            weight: 3.2,
            description:
              'Data privacy and security best practices, including prompt injection awareness and mitigation, jailbreak defense, untrusted input handling, data leakage prevention, PII handling, and ensuring authentication, authorization, confidentiality, privacy, and integrity.',
          },
          {
            name: 'Guardrails and Safe Deployment',
            weight: 2.3,
            description:
              'Safe and responsible deployment practices (content policy, guardrail layering) and secure-by-design principles (privacy, identity and access management, least privilege).',
          },
          {
            name: 'Claude Hooks',
            weight: 1.0,
            description:
              'Leveraging hooks for guardrails and safety controls to prevent destructive actions within Claude applications.',
          },
          {
            name: 'Identity, Secrets, and Key Management',
            weight: 1.6,
            description:
              'Managing secrets, credentials, and API keys across Claude development and production environments, including identity validation and authentication, access approval and level verification, and authorized access monitoring.',
          },
        ],
      },
      {
        id: 'ccdv-f-8',
        number: 8,
        name: 'Tools and MCPs',
        weight: 10.6,
        objectives: [
          'Implement tools: function calling, descriptions, error handling, client vs server tools, approval patterns, tool set construction',
          'Develop MCP servers: authoring, deployment, resources/tools/prompts, stdio vs sockets, client vs server',
          'Weigh built-in tools vs custom tools vs Skills vs MCP for a given use case',
        ],
        skills: [
          {
            name: 'Tool Implementation',
            weight: 4.4,
            description:
              'Tool implementation practices for Claude applications, including tool use and function calling, configuration for external system interaction, tool description writing, error handling, tool usage patterns (agentic harness dispatch, client-side vs. server-side tools, approval patterns), and tool set construction best practices.',
          },
          {
            name: 'MCP Server Development',
            weight: 2.1,
            description:
              'MCP server development practices, including server authoring, deployment, integration with Claude applications, MCP resources, tools, and prompts, and communication patterns (stdio, sockets, client vs. server).',
          },
          {
            name: 'Agentic Customization',
            weight: 4.1,
            description:
              'Tradeoffs among built-in Tools, custom Tools, Skills, and MCPs for selecting and applying the appropriate approach for a given use case.',
          },
        ],
      },
    ],
  },
  {
    id: 'ccar-f',
    code: 'CCAR-F',
    name: 'Claude Certified Architect – Foundations',
    shortName: 'Architect (Foundations)',
    level: 'Foundations',
    role: 'Architect',
    tagline: 'Make informed tradeoff decisions across Claude Code, the Agent SDK, the API and MCP.',
    description:
      'A scenario-based exam. Every question is framed by one of six realistic production scenarios (support agents, multi-agent research, Claude Code in CI/CD, developer tooling, structured extraction). You must show practical judgment about architecture, configuration and tradeoffs, not just recall.',
    audience:
      'Solution architects with 6+ months building with the Claude API, Agent SDK, Claude Code and MCP who design and implement production applications.',
    items: 60,
    minutes: 120,
    passingScore: 720,
    priceUsd: 125,
    validityMonths: 12,
    recommendedExperience: [
      'Building agentic applications with the Agent SDK: orchestration, subagents, tools, hooks',
      'Customizing Claude Code with CLAUDE.md, Skills, MCP servers and plan mode',
      'Designing MCP tool and resource interfaces',
      'Engineering prompts for reliable structured output with JSON schemas and few-shot examples',
      'Managing context across long documents, multi-turn conversations and multi-agent handoffs',
      'Integrating Claude Code into CI/CD for review, test generation and PR feedback',
    ],
    scenarios: [
      {
        title: 'Customer Support Resolution Agent',
        description:
          'An Agent SDK agent handles returns, billing disputes and account issues via MCP tools (get_customer, lookup_order, process_refund, escalate_to_human). Target: 80%+ first-contact resolution while knowing when to escalate.',
        primaryDomains: ['ccar-f-1', 'ccar-f-2', 'ccar-f-5'],
      },
      {
        title: 'Code Generation with Claude Code',
        description:
          'A team uses Claude Code for generation, refactoring, debugging and documentation, with custom slash commands, CLAUDE.md configuration and plan mode vs direct execution decisions.',
        primaryDomains: ['ccar-f-3', 'ccar-f-5'],
      },
      {
        title: 'Multi-Agent Research System',
        description:
          'A coordinator delegates to subagents that search the web, analyze documents, synthesize findings and generate cited reports.',
        primaryDomains: ['ccar-f-1', 'ccar-f-2', 'ccar-f-5'],
      },
      {
        title: 'Developer Productivity with Claude',
        description:
          'An Agent SDK agent helps engineers explore unfamiliar codebases, understand legacy systems and generate boilerplate using built-in tools (Read, Write, Bash, Grep, Glob) plus MCP servers.',
        primaryDomains: ['ccar-f-2', 'ccar-f-3', 'ccar-f-1'],
      },
      {
        title: 'Claude Code for Continuous Integration',
        description:
          'Claude Code runs in CI/CD for automated code review, test generation and PR feedback, with prompts designed for actionable output and minimal false positives.',
        primaryDomains: ['ccar-f-3', 'ccar-f-4'],
      },
      {
        title: 'Structured Data Extraction',
        description:
          'A system extracts information from unstructured documents, validates against JSON schemas, handles edge cases gracefully and feeds downstream systems.',
        primaryDomains: ['ccar-f-4', 'ccar-f-5'],
      },
    ],
    domains: [
      {
        id: 'ccar-f-1',
        number: 1,
        name: 'Agentic Architecture & Orchestration',
        weight: 27,
        objectives: [
          '1.1 Design and implement agentic loops for autonomous task execution',
          '1.2 Orchestrate multi-agent systems with coordinator-subagent patterns',
          '1.3 Configure subagent invocation, context passing, and spawning',
          '1.4 Implement multi-step workflows with enforcement and handoff patterns',
          '1.5 Apply Agent SDK hooks for tool call interception and data normalization',
          '1.6 Design task decomposition strategies for complex workflows',
          '1.7 Manage session state, resumption, and forking',
        ],
      },
      {
        id: 'ccar-f-2',
        number: 2,
        name: 'Tool Design & MCP Integration',
        weight: 18,
        objectives: [
          '2.1 Design effective tool interfaces with clear descriptions and boundaries',
          '2.2 Implement structured error responses for MCP tools',
          '2.3 Distribute tools appropriately across agents and configure tool choice',
          '2.4 Integrate MCP servers into Claude Code and agent workflows',
          '2.5 Select and apply built-in tools (Read, Write, Edit, Bash, Grep, Glob) effectively',
        ],
      },
      {
        id: 'ccar-f-3',
        number: 3,
        name: 'Claude Code Configuration & Workflows',
        weight: 20,
        objectives: [
          '3.1 Configure CLAUDE.md files with appropriate hierarchy, scoping, and modular organization',
          '3.2 Create and configure custom slash commands and skills',
          '3.3 Apply path-specific rules for conditional convention loading',
          '3.4 Determine when to use plan mode vs direct execution',
          '3.5 Apply iterative refinement techniques for progressive improvement',
          '3.6 Integrate Claude Code into CI/CD pipelines',
        ],
      },
      {
        id: 'ccar-f-4',
        number: 4,
        name: 'Prompt Engineering & Structured Output',
        weight: 20,
        objectives: [
          '4.1 Design prompts with explicit criteria to improve precision and reduce false positives',
          '4.2 Apply few-shot prompting to improve output consistency and quality',
          '4.3 Enforce structured output using tool use and JSON schemas',
          '4.4 Implement validation, retry, and feedback loops for extraction quality',
          '4.5 Design efficient batch processing strategies',
          '4.6 Design multi-instance and multi-pass review architectures',
        ],
      },
      {
        id: 'ccar-f-5',
        number: 5,
        name: 'Context Management & Reliability',
        weight: 15,
        objectives: [
          '5.1 Manage conversation context to preserve critical information across long interactions',
          '5.2 Design effective escalation and ambiguity resolution patterns',
          '5.3 Implement error propagation strategies across multi-agent systems',
          '5.4 Manage context effectively in large codebase exploration',
          '5.5 Design human review workflows and confidence calibration',
          '5.6 Preserve information provenance and handle uncertainty in multi-source synthesis',
        ],
      },
    ],
  },
  {
    id: 'ccar-p',
    code: 'CCAR-P',
    name: 'Claude Certified Architect – Professional',
    shortName: 'Architect (Professional)',
    level: 'Professional',
    role: 'Architect',
    tagline: 'Design, evaluate, govern and communicate end-to-end Claude solutions at enterprise scale.',
    description:
      'The senior credential. Covers translating business problems into architectures, model and prompt strategy, integration (RAG, auth, observability, MCP vs API vs agent-to-agent), evaluation and optimization, governance and compliance, stakeholder communication across the lifecycle, and enabling developer teams.',
    audience:
      'Experienced solution architects and technical leads who own the design, delivery and governance of production Claude systems and communicate decisions to business stakeholders.',
    items: 63,
    minutes: 120,
    passingScore: 720,
    priceUsd: 175,
    validityMonths: 12,
    recommendedExperience: [
      'Built and operated at least one end-to-end Claude solution including RAG, evaluation and observability',
      'Practice in architectural decision-making: model selection, integration protocols, security tradeoffs',
      'Experience running discovery and communicating architecture to stakeholders',
    ],
    domains: [
      {
        id: 'ccar-p-1',
        number: 1,
        name: 'Solution Design & Architecture',
        weight: 17,
        objectives: [
          'Translate business problems into Claude-based AI solutions',
          'Design end-to-end architectures (input → processing → output → feedback loops)',
          'Select appropriate architectural patterns (workflow, agentic, augmented LLM)',
          'Design multi-agent systems and orchestration strategies',
          'Apply decomposition techniques for complex problem solving',
          'Align solutions to business value pillars (efficiency, transformation, productivity, cost, performance SLAs)',
        ],
      },
      {
        id: 'ccar-p-2',
        number: 2,
        name: 'Claude Models, Prompting & Context Engineering',
        weight: 13,
        objectives: [
          'Select appropriate Claude models based on trade-offs',
          'Design system prompts, templates, and guardrails',
          'Apply prompt engineering techniques (zero-shot, few-shot, chain-of-thought)',
          'Optimize context windows and manage token usage',
          'Implement prompt reuse strategies (caching, modular prompts, Skills)',
        ],
      },
      {
        id: 'ccar-p-3',
        number: 3,
        name: 'Integration',
        weight: 19,
        objectives: [
          'Evaluate tool/agent configuration for capability bloat',
          'Analyze authentication and authorization requirements to identify security gaps',
          'Evaluate accuracy-latency trade-offs and justify configuration decisions',
          'Analyze observability challenges and select monitoring strategies at scale',
          'Design a RAG pipeline with appropriate chunking and indexing strategies',
          'Apply retrieval strategies matched to data shape and query pattern',
          'Evaluate connection protocols and select the appropriate integration mechanism (MCP, API/CLI, agent-to-agent)',
          'Evaluate progressive discovery vs. monolithic context strategy',
        ],
      },
      {
        id: 'ccar-p-4',
        number: 4,
        name: 'Evaluation, Testing & Optimization',
        weight: 16,
        objectives: [
          'Define evaluation metrics (accuracy, latency, cost, safety, security)',
          'Design evaluation datasets and test frameworks using mixed methodologies',
          'Conduct A/B testing and iterative improvements',
          'Diagnose system issues (prompt failure, hallucinations, model mismatch)',
          'Optimize token usage, latency, and cost-performance trade-offs',
          'Monitor system performance using logging and observability tools',
        ],
      },
      {
        id: 'ccar-p-5',
        number: 5,
        name: 'Governance, Safety & Risk Management',
        weight: 14,
        objectives: [
          'Implement guardrails and safety controls',
          'Identify risks, limitations, and failure modes of LLM systems',
          'Apply human-in-the-loop validation strategies',
          'Ensure compliance with regulations (e.g., GDPR, HIPAA, FedRAMP)',
          'Address ethical AI considerations (bias, fairness, transparency)',
        ],
      },
      {
        id: 'ccar-p-6',
        number: 6,
        name: 'Stakeholder Communication & Lifecycle Management',
        weight: 14,
        objectives: [
          'Conduct structured discovery and requirement gathering',
          'Communicate architectural decisions and trade-offs',
          'Manage stakeholder feedback loops and expectation alignment (including SLAs)',
          'Document architectures and provide implementation guidance',
          'Support lifecycle phases (discovery, design, handoff, monitoring, iteration)',
        ],
      },
      {
        id: 'ccar-p-7',
        number: 7,
        name: 'Developer Productivity & Operational Enablement',
        weight: 7,
        objectives: [
          'Configure Claude tools and environments for teams (e.g., Claude Code)',
          'Improve developer workflows using AI-assisted tooling',
          'Support debugging and operational issue resolution',
        ],
      },
    ],
  },
];

export const certById = (id: string) => certifications.find((c) => c.id === id);
export const domainById = (id: string) => {
  for (const c of certifications) {
    const d = c.domains.find((d) => d.id === id);
    if (d) return { cert: c, domain: d };
  }
  return undefined;
};
