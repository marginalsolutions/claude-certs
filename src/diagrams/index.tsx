import type { ComponentType } from 'react';
import {
  AgenticLoop,
  ClaudeMdHierarchy,
  ContextWindow,
  McpArchitecture,
  ModelTiers,
  OrchestrationPatterns,
  PromptCachingDiagram,
  RequestAnatomy,
  ToolUseSequence,
  WorkflowVsAgent,
} from './set1';
import {
  BatchVsRealtime,
  ClaudeProductSurfaces,
  CoordinatorSubagents,
  EscalationDecision,
  EvalLoop,
  HooksLifecycle,
  LayeredGuardrails,
  PromptInjectionDefense,
  RagPipeline,
  StructuredOutputFlow,
} from './set2';

interface Meta {
  title: string;
  caption: string;
  component: ComponentType;
}

/**
 * Every diagram a concept can reference via `Concept.diagram`.
 * Add a new one here and in set1/set2 (or a new file).
 */
export const diagrams: Record<string, Meta> = {
  'agentic-loop': {
    title: 'The agentic loop',
    caption: 'Request, inspect stop_reason, execute the requested tool, append the result, repeat until end_turn.',
    component: AgenticLoop,
  },
  'workflow-vs-agent': {
    title: 'Workflow vs agent',
    caption: 'In a workflow your code decides the path; in an agent the model decides it from tool results.',
    component: WorkflowVsAgent,
  },
  'orchestration-patterns': {
    title: 'Orchestration patterns',
    caption: 'Prompt chaining, routing, parallelization, orchestrator-workers and evaluator-optimizer.',
    component: OrchestrationPatterns,
  },
  'prompt-caching': {
    title: 'Prompt caching prefix',
    caption: 'A stable prefix up to the breakpoint is written once and read cheaply; volatile content goes after it.',
    component: PromptCachingDiagram,
  },
  'context-window': {
    title: 'The context window as a budget',
    caption: 'System, tools, history and the new turn share one window with the output. Tool results grow fastest.',
    component: ContextWindow,
  },
  'mcp-architecture': {
    title: 'MCP architecture',
    caption: 'A host runs one MCP client per server; servers expose tools, resources and prompts over stdio or HTTP.',
    component: McpArchitecture,
  },
  'tool-use-sequence': {
    title: 'Tool use message sequence',
    caption: 'The five-step exchange between your application and the API when Claude calls a tool.',
    component: ToolUseSequence,
  },
  'claude-md-hierarchy': {
    title: 'CLAUDE.md and settings hierarchy',
    caption: 'Managed, user, project and local scopes, plus the modular project files Claude Code loads.',
    component: ClaudeMdHierarchy,
  },
  'request-anatomy': {
    title: 'Anatomy of a Messages request',
    caption: 'The fields you send and the fields you must read back.',
    component: RequestAnatomy,
  },
  'model-tiers': {
    title: 'Model tiers',
    caption: 'Haiku, Sonnet, Opus and Fable along the speed/cost vs capability axis.',
    component: ModelTiers,
  },
  'prompt-injection-defense': {
    title: 'Prompt injection and defense in depth',
    caption: 'Untrusted content can carry instructions; layered controls stop them from becoming actions.',
    component: PromptInjectionDefense,
  },
  'rag-pipeline': {
    title: 'RAG pipeline',
    caption: 'Offline indexing and online retrieval, with the design choices that matter most.',
    component: RagPipeline,
  },
  'eval-loop': {
    title: 'Evaluation loop',
    caption: 'Eval set, candidate, grading, metrics, diagnosis, and production feedback.',
    component: EvalLoop,
  },
  'batch-vs-realtime': {
    title: 'Batch vs realtime',
    caption: 'When the Message Batches API is the right call and when it is not.',
    component: BatchVsRealtime,
  },
  'hooks-lifecycle': {
    title: 'Hook lifecycle',
    caption: 'PreToolUse and PostToolUse hooks wrap each tool call with deterministic rules.',
    component: HooksLifecycle,
  },
  'claude-product-surfaces': {
    title: 'Claude product surfaces',
    caption: 'The same models reach users through claude.ai, Claude Code, the API and cloud platforms.',
    component: ClaudeProductSurfaces,
  },
  'escalation-decision': {
    title: 'Escalation decision flow',
    caption: 'When a support agent should resolve autonomously and when it must hand off.',
    component: EscalationDecision,
  },
  'layered-guardrails': {
    title: 'Layered guardrails',
    caption: 'Governance, input, capability, model and output layers, with monitoring around all of them.',
    component: LayeredGuardrails,
  },
  'coordinator-subagents': {
    title: 'Coordinator and subagents',
    caption: 'Hub-and-spoke delegation with isolated context, scoped tools and structured results.',
    component: CoordinatorSubagents,
  },
  'structured-output-flow': {
    title: 'Structured output flow',
    caption: 'Schema-constrained generation, semantic validation, retry with feedback, and human routing.',
    component: StructuredOutputFlow,
  },
};

export const diagramIds = Object.keys(diagrams);
export const diagramMeta: Record<string, { title: string; caption: string }> = Object.fromEntries(
  Object.entries(diagrams).map(([k, v]) => [k, { title: v.title, caption: v.caption }]),
);

export function Diagram({ id }: { id: string }) {
  const d = diagrams[id];
  if (!d) return <p className="muted small">Diagram "{id}" is not registered.</p>;
  const C = d.component;
  return (
    <div className="diagram">
      <C />
    </div>
  );
}
