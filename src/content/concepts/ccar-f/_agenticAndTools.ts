import type { Concept } from '../../types';
import { architectAgenticLoopDesign } from './architect-agentic-loop-design';
import { coordinatorSubagentOrchestration } from './coordinator-subagent-orchestration';
import { workflowEnforcementAndHandoffs } from './workflow-enforcement-and-handoffs';
import { agentSdkHooks } from './agent-sdk-hooks';
import { taskDecompositionStrategies } from './task-decomposition-strategies';
import { sessionStateResumeAndFork } from './session-state-resume-and-fork';
import { toolInterfaceDesign } from './tool-interface-design';
import { mcpStructuredErrors } from './mcp-structured-errors';
import { toolDistributionAndToolChoice } from './tool-distribution-and-tool-choice';
import { mcpServersInClaudeCode } from './mcp-servers-in-claude-code';
import { builtInToolsReadWriteEditBashGrepGlob } from './built-in-tools-read-write-edit-bash-grep-glob';

/**
 * Claude Certified Architect – Foundations
 * Domain 1: Agentic Architecture & Orchestration (ccar-f-1)
 * Domain 2: Tool Design & MCP Integration (ccar-f-2)
 */
export const ccarfAgenticAndToolsConcepts: Concept[] = [
  architectAgenticLoopDesign,
  coordinatorSubagentOrchestration,
  workflowEnforcementAndHandoffs,
  agentSdkHooks,
  taskDecompositionStrategies,
  sessionStateResumeAndFork,
  toolInterfaceDesign,
  mcpStructuredErrors,
  toolDistributionAndToolChoice,
  mcpServersInClaudeCode,
  builtInToolsReadWriteEditBashGrepGlob,
];
