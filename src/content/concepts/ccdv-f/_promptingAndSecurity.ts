import type { Concept } from '../../types';
import { contextEngineering } from './context-engineering';
import { promptEngineeringPrinciples } from './prompt-engineering-principles';
import { fewShotExamples } from './few-shot-examples';
import { structuredOutputAndValidation } from './structured-output-and-validation';
import { inputSanitizationAndContentBoundaries } from './input-sanitization-and-content-boundaries';
import { promptInjectionAndJailbreaks } from './prompt-injection-and-jailbreaks';
import { guardrailsAndSafeDeployment } from './guardrails-and-safe-deployment';
import { hooksAsGuardrails } from './hooks-as-guardrails';
import { secretsAndKeyManagement } from './secrets-and-key-management';
import { dataPrivacyAndPii } from './data-privacy-and-pii';

/**
 * CCDV-F Domain 6 (Prompt and Context Engineering) and Domain 7 (Security and Safety).
 */
export const promptingAndSecurityConcepts: Concept[] = [
  contextEngineering,
  promptEngineeringPrinciples,
  fewShotExamples,
  structuredOutputAndValidation,
  inputSanitizationAndContentBoundaries,
  promptInjectionAndJailbreaks,
  guardrailsAndSafeDeployment,
  hooksAsGuardrails,
  secretsAndKeyManagement,
  dataPrivacyAndPii,
];
