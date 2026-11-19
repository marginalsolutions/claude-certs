import type { Concept } from '../types';
import { promptCaching } from './ccdv-f/prompt-caching';
import { ccarfContextAndReliabilityConcepts } from './ccar-f/_contextAndReliability';
import { applicationsAndIntegrationConcepts } from './ccdv-f/_applicationsAndIntegration';
import { ccarfAgenticAndToolsConcepts } from './ccar-f/_agenticAndTools';
import { ccarfClaudeCodeAndPromptingConcepts } from './ccar-f/_claudeCodeAndPrompting';
import { promptingAndSecurityConcepts } from './ccdv-f/_promptingAndSecurity';
import { agentsAndToolsConcepts } from './ccdv-f/_agentsAndTools';
import { claudeCodeEvalsModelsConcepts } from './ccdv-f/_claudeCodeEvalsModels';
import { associateConcepts } from './ccao-f/_associate';
import { ccarpDesignAndIntegrationConcepts } from './ccar-p/_designAndIntegration';
import { ccarpEvalGovernanceLifecycleConcepts } from './ccar-p/_evalGovernanceLifecycle';

/**
 * Registry of every concept. Content groups are added here as they land.
 * Order does not matter; pages sort by domain and title.
 */
export const allConcepts: Concept[] = [promptCaching, ...ccarfContextAndReliabilityConcepts, ...applicationsAndIntegrationConcepts, ...ccarfAgenticAndToolsConcepts, ...ccarfClaudeCodeAndPromptingConcepts, ...promptingAndSecurityConcepts, ...agentsAndToolsConcepts, ...claudeCodeEvalsModelsConcepts, ...associateConcepts, ...ccarpDesignAndIntegrationConcepts, ...ccarpEvalGovernanceLifecycleConcepts];
