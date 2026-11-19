import type { Concept } from '../../types';

import { businessProblemToAiSolution } from './business-problem-to-ai-solution';
import { endToEndArchitectureDesign } from './end-to-end-architecture-design';
import { architecturalPatternsWorkflowAgenticAugmented } from './architectural-patterns-workflow-agentic-augmented';
import { multiAgentSystemDesign } from './multi-agent-system-design';
import { problemDecompositionForArchitects } from './problem-decomposition-for-architects';
import { enterpriseModelSelection } from './enterprise-model-selection';
import { systemPromptAndTemplateDesign } from './system-prompt-and-template-design';
import { promptingTechniquesForArchitects } from './prompting-techniques-for-architects';
import { contextWindowAndTokenStrategy } from './context-window-and-token-strategy';
import { capabilityBloatAndLeastPrivilege } from './capability-bloat-and-least-privilege';
import { authenticationAndAuthorizationDesign } from './authentication-and-authorization-design';
import { accuracyLatencyTradeoffs } from './accuracy-latency-tradeoffs';
import { observabilityAtScale } from './observability-at-scale';
import { ragPipelineDesign } from './rag-pipeline-design';
import { retrievalStrategiesByDataShape } from './retrieval-strategies-by-data-shape';
import { integrationProtocolsMcpApiCliA2a } from './integration-protocols-mcp-api-cli-a2a';

/**
 * CCAR-P Domain 1 (Solution Design & Architecture), Domain 2 (Claude Models,
 * Prompting & Context Engineering) and Domain 3 (Integration).
 */
export const ccarpDesignAndIntegrationConcepts: Concept[] = [
  // Domain 1: Solution Design & Architecture
  businessProblemToAiSolution,
  endToEndArchitectureDesign,
  architecturalPatternsWorkflowAgenticAugmented,
  multiAgentSystemDesign,
  problemDecompositionForArchitects,
  // Domain 2: Claude Models, Prompting & Context Engineering
  enterpriseModelSelection,
  systemPromptAndTemplateDesign,
  promptingTechniquesForArchitects,
  contextWindowAndTokenStrategy,
  // Domain 3: Integration
  capabilityBloatAndLeastPrivilege,
  authenticationAndAuthorizationDesign,
  accuracyLatencyTradeoffs,
  observabilityAtScale,
  ragPipelineDesign,
  retrievalStrategiesByDataShape,
  integrationProtocolsMcpApiCliA2a,
];
