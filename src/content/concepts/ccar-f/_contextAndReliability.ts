import type { Concept } from '../../types';
import { preservingCriticalContext } from './preserving-critical-context';
import { escalationAndAmbiguityPatterns } from './escalation-and-ambiguity-patterns';
import { errorPropagationInMultiAgentSystems } from './error-propagation-in-multi-agent-systems';
import { contextInLargeCodebaseExploration } from './context-in-large-codebase-exploration';
import { humanReviewAndConfidenceCalibration } from './human-review-and-confidence-calibration';
import { provenanceAndUncertaintyInSynthesis } from './provenance-and-uncertainty-in-synthesis';

/** CCAR-F Domain 5: Context Management & Reliability. */
export const ccarfContextAndReliabilityConcepts: Concept[] = [
  preservingCriticalContext,
  escalationAndAmbiguityPatterns,
  errorPropagationInMultiAgentSystems,
  contextInLargeCodebaseExploration,
  humanReviewAndConfidenceCalibration,
  provenanceAndUncertaintyInSynthesis,
];
