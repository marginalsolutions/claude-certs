import type { Concept } from '../../types';

import { businessPromptFundamentals } from './business-prompt-fundamentals';
import { taskDecomposition } from './task-decomposition';
import { iteratingOnPrompts } from './iterating-on-prompts';
import { evaluatingOutputs } from './evaluating-outputs';
import { factCheckingAndHumanReview } from './fact-checking-and-human-review';
import { shapingAndFormattingOutputs } from './shaping-and-formatting-outputs';
import { claudeProductFeatures } from './claude-product-features';
import { choosingAModelTier } from './choosing-a-model-tier';
import { contextAndMemoryInClaude } from './context-and-memory-in-claude';
import { analyzingRequirementsWithClaude } from './analyzing-requirements-with-claude';
import { integratingClaudeIntoWorkflows } from './integrating-claude-into-workflows';
import { communicatingValueAndLimits } from './communicating-value-and-limits';
import { configuringProjects } from './configuring-projects';
import { connectorsAndKnowledgeSources } from './connectors-and-knowledge-sources';
import { appropriateUseAndGovernance } from './appropriate-use-and-governance';
import { dataSensitivityAndPrivacy } from './data-sensitivity-and-privacy';
import { troubleshootingPoorOutputs } from './troubleshooting-poor-outputs';
import { optimizingWorkflows } from './optimizing-workflows';

/** Claude Certified Associate – Foundations (CCAO-F): all seven domains. */
export const associateConcepts: Concept[] = [
  // Domain 1: Prompting and Task Execution
  businessPromptFundamentals,
  taskDecomposition,
  iteratingOnPrompts,
  // Domain 2: Output Evaluation and Validation
  evaluatingOutputs,
  factCheckingAndHumanReview,
  shapingAndFormattingOutputs,
  // Domain 3: Product and Model Selection
  claudeProductFeatures,
  choosingAModelTier,
  contextAndMemoryInClaude,
  // Domain 4: Workflow Integration and Solution Design
  analyzingRequirementsWithClaude,
  integratingClaudeIntoWorkflows,
  communicatingValueAndLimits,
  // Domain 5: Configuration and Knowledge Management
  configuringProjects,
  connectorsAndKnowledgeSources,
  // Domain 6: Governance, Risk, and Responsible Use
  appropriateUseAndGovernance,
  dataSensitivityAndPrivacy,
  // Domain 7: Troubleshooting and Optimization
  troubleshootingPoorOutputs,
  optimizingWorkflows,
];
