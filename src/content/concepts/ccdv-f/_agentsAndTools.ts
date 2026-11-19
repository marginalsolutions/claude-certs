import type { Concept } from '../../types';
import { workflowsVsAgents } from './workflows-vs-agents';
import { agenticLoop } from './agentic-loop';
import { orchestrationPatterns } from './orchestration-patterns';
import { claudeAgentSdk } from './claude-agent-sdk';
import { agentConstructionOptions } from './agent-construction-options';
import { agentFrameworks } from './agent-frameworks';
import { agentMemoryPatterns } from './agent-memory-patterns';
import { toolUseFundamentals } from './tool-use-fundamentals';
import { clientVsServerTools } from './client-vs-server-tools';
import { mcpFundamentals } from './mcp-fundamentals';
import { buildingMcpServers } from './building-mcp-servers';
import { toolsVsSkillsVsMcp } from './tools-vs-skills-vs-mcp';

/** CCDV-F Domain 1 (Agents and Workflows) and Domain 8 (Tools and MCPs). */
export const agentsAndToolsConcepts: Concept[] = [
  workflowsVsAgents,
  agenticLoop,
  orchestrationPatterns,
  claudeAgentSdk,
  agentConstructionOptions,
  agentFrameworks,
  agentMemoryPatterns,
  toolUseFundamentals,
  clientVsServerTools,
  mcpFundamentals,
  buildingMcpServers,
  toolsVsSkillsVsMcp,
];
