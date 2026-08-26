import {
  LEGAL_SOURCE_NOT_VERIFIED,
  isVerifiedLegalSourceMetadata,
} from './legalKnowledgeBase.js'
import {
  attachVerifiedLegalAuthorities,
  getLegalAuthorityCitationMetadata,
  getMappedVerifiedLegalAuthorities,
} from './ruleLegalAuthorityMap.js'

export { LEGAL_SOURCE_NOT_VERIFIED, isVerifiedLegalSourceMetadata }

// Backward-compatible display alias. New code should use
// LEGAL_SOURCE_NOT_VERIFIED directly.
export const NO_SPECIFIC_VERIFIED_PROVISION = LEGAL_SOURCE_NOT_VERIFIED

export const LEGAL_ISSUE_TYPES = Object.freeze([
  'personal-information',
  'processing-purpose',
  'processing-method',
  'sensitive-personal-information',
  'vehicle-location-trajectory-data',
  'important-data',
  'data-retention',
  'data-storage-location',
  'cross-border-data-transfer',
  'user-rights',
  'third-party-sharing',
  'collection-scenarios',
  'rights-channel',
  'consent',
  'separate-consent',
  'data-security-obligations',
])

export const getVerifiedLegalAuthorities = getMappedVerifiedLegalAuthorities
export const getCitationMetadata = getLegalAuthorityCitationMetadata
export const attachVerifiedLegalEvidence = attachVerifiedLegalAuthorities

