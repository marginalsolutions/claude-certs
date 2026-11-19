import type { Concept } from '../../types';

// Domain 4: Evaluation, Testing & Optimization
import { definingEvaluationMetrics } from './defining-evaluation-metrics';
import { designingEvalDatasetsAndFrameworks } from './designing-eval-datasets-and-frameworks';
import { abTestingAndIterativeImprovement } from './ab-testing-and-iterative-improvement';
import { diagnosingSystemIssues } from './diagnosing-system-issues';
import { optimizingCostLatencyPerformance } from './optimizing-cost-latency-performance';
import { monitoringAndObservabilityTools } from './monitoring-and-observability-tools';
// Domain 5: Governance, Safety & Risk Management
import { guardrailsAndSafetyControls } from './guardrails-and-safety-controls';
import { llmRisksAndFailureModes } from './llm-risks-and-failure-modes';
import { humanInTheLoopStrategies } from './human-in-the-loop-strategies';
import { regulatoryComplianceGdprHipaaFedramp } from './regulatory-compliance-gdpr-hipaa-fedramp';
import { ethicalAiConsiderations } from './ethical-ai-considerations';
// Domain 6: Stakeholder Communication & Lifecycle Management
import { structuredDiscoveryAndRequirements } from './structured-discovery-and-requirements';
import { communicatingArchitectureDecisions } from './communicating-architecture-decisions';
import { stakeholderFeedbackAndSlas } from './stakeholder-feedback-and-slas';
import { documentationAndImplementationGuidance } from './documentation-and-implementation-guidance';
import { lifecycleManagement } from './lifecycle-management';
// Domain 7: Developer Productivity & Operational Enablement
import { enablingTeamsWithClaudeCode } from './enabling-teams-with-claude-code';
import { aiAssistedDeveloperWorkflows } from './ai-assisted-developer-workflows';

export const ccarpEvalGovernanceLifecycleConcepts: Concept[] = [
  definingEvaluationMetrics,
  designingEvalDatasetsAndFrameworks,
  abTestingAndIterativeImprovement,
  diagnosingSystemIssues,
  optimizingCostLatencyPerformance,
  monitoringAndObservabilityTools,
  guardrailsAndSafetyControls,
  llmRisksAndFailureModes,
  humanInTheLoopStrategies,
  regulatoryComplianceGdprHipaaFedramp,
  ethicalAiConsiderations,
  structuredDiscoveryAndRequirements,
  communicatingArchitectureDecisions,
  stakeholderFeedbackAndSlas,
  documentationAndImplementationGuidance,
  lifecycleManagement,
  enablingTeamsWithClaudeCode,
  aiAssistedDeveloperWorkflows,
];
