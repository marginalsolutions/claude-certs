import type { Concept } from '../../types';
import { claudeMdHierarchyAndModularity } from './claude-md-hierarchy-and-modularity';
import { customCommandsAndSkills } from './custom-commands-and-skills';
import { pathSpecificRules } from './path-specific-rules';
import { planModeVsDirectExecution } from './plan-mode-vs-direct-execution';
import { iterativeRefinementTechniques } from './iterative-refinement-techniques';
import { claudeCodeInCiCd } from './claude-code-in-ci-cd';
import { precisionPromptsAndFalsePositives } from './precision-prompts-and-false-positives';
import { fewShotForConsistency } from './few-shot-for-consistency';
import { structuredOutputWithToolsAndSchemas } from './structured-output-with-tools-and-schemas';
import { validationRetryAndFeedbackLoops } from './validation-retry-and-feedback-loops';
import { batchProcessingStrategies } from './batch-processing-strategies';
import { multiInstanceAndMultiPassReview } from './multi-instance-and-multi-pass-review';

export const ccarfClaudeCodeAndPromptingConcepts: Concept[] = [
  claudeMdHierarchyAndModularity,
  customCommandsAndSkills,
  pathSpecificRules,
  planModeVsDirectExecution,
  iterativeRefinementTechniques,
  claudeCodeInCiCd,
  precisionPromptsAndFalsePositives,
  fewShotForConsistency,
  structuredOutputWithToolsAndSchemas,
  validationRetryAndFeedbackLoops,
  batchProcessingStrategies,
  multiInstanceAndMultiPassReview,
];
