import type { Concept } from '../../types';
import { messagesApiFundamentals } from './messages-api-fundamentals';
import { streamingResponses } from './streaming-responses';
import { visionAndDocuments } from './vision-and-documents';
import { extendedAndAdaptiveThinking } from './extended-and-adaptive-thinking';
import { batchVsRealtime } from './batch-vs-realtime';
import { thirdPartyPlatforms } from './third-party-platforms';
import { errorHandlingAndRetries } from './error-handling-and-retries';
import { sdkAndRestFoundations } from './sdk-and-rest-foundations';
import { claudeAcrossInterfaces } from './claude-across-interfaces';
import { applicationDesignPatterns } from './application-design-patterns';
import { configurationManagement } from './configuration-management';
import { requirementsAndSdlc } from './requirements-and-sdlc';

/** CCDV-F Domain 2: Applications and Integration (33.1%). */
export const applicationsAndIntegrationConcepts: Concept[] = [
  messagesApiFundamentals,
  streamingResponses,
  visionAndDocuments,
  extendedAndAdaptiveThinking,
  batchVsRealtime,
  thirdPartyPlatforms,
  errorHandlingAndRetries,
  sdkAndRestFoundations,
  claudeAcrossInterfaces,
  applicationDesignPatterns,
  configurationManagement,
  requirementsAndSdlc,
];
