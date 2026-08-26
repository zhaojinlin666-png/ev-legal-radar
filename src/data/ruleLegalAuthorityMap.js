import {
  getVerifiedProvisionById,
  LEGAL_SOURCE_NOT_VERIFIED,
} from './legalKnowledgeBase.js'

const PROVISION_IDS = Object.freeze({
  pipl6: 'cn-personal-information-protection-law-article-6',
  pipl7: 'cn-personal-information-protection-law-article-7',
  pipl13: 'cn-personal-information-protection-law-article-13',
  pipl14: 'cn-personal-information-protection-law-article-14',
  automotive3: 'cn-automobile-data-security-provisions-trial-article-3',
  automotive4: 'cn-automobile-data-security-provisions-trial-article-4',
  automotive5: 'cn-automobile-data-security-provisions-trial-article-5',
  automotive6: 'cn-automobile-data-security-provisions-trial-article-6',
  automotive7: 'cn-automobile-data-security-provisions-trial-article-7',
  automotive8: 'cn-automobile-data-security-provisions-trial-article-8',
  automotive9: 'cn-automobile-data-security-provisions-trial-article-9',
  automotive10: 'cn-automobile-data-security-provisions-trial-article-10',
  automotive11: 'cn-automobile-data-security-provisions-trial-article-11',
  automotive17: 'cn-automobile-data-security-provisions-trial-article-17',
})

function conditional(contextKey, provisionIds) {
  return Object.freeze({
    contextKey,
    provisionIds: Object.freeze(provisionIds),
  })
}

function mapping(always, conditionalAuthorities = []) {
  return Object.freeze({
    always: Object.freeze(always),
    conditional: Object.freeze(conditionalAuthorities),
  })
}

/**
 * Explicit rule-to-provision allowlist. Conditional provisions are injected
 * only when the server-trusted rule context expressly enables their predicate.
 */
export const RULE_TO_LEGAL_AUTHORITY_IDS = Object.freeze({
  'information-categories': mapping([PROVISION_IDS.automotive7]),
  'processing-purpose': mapping([
    PROVISION_IDS.pipl6,
    PROVISION_IDS.pipl7,
    PROVISION_IDS.automotive4,
    PROVISION_IDS.automotive7,
  ]),
  'processing-method': mapping(
    [PROVISION_IDS.pipl7, PROVISION_IDS.automotive7],
    [
      conditional('minimizationPrivacyByDefaultContext', [
        PROVISION_IDS.automotive6,
      ]),
    ],
  ),
  'collection-scenarios': mapping([PROVISION_IDS.automotive7]),
  consent: mapping([
    PROVISION_IDS.pipl13,
    PROVISION_IDS.pipl14,
    PROVISION_IDS.automotive8,
  ]),
  'sensitive-personal-information': mapping([
    PROVISION_IDS.automotive3,
    PROVISION_IDS.automotive9,
  ]),
  'vehicle-location-or-trajectory': mapping(
    [PROVISION_IDS.automotive3],
    [
      conditional('vehicleTrajectoryContext', [
        PROVISION_IDS.automotive9,
      ]),
    ],
  ),
  'storage-location': mapping(
    [PROVISION_IDS.automotive7],
    [conditional('importantDataContext', [PROVISION_IDS.automotive11])],
  ),
  'retention-period': mapping([PROVISION_IDS.automotive7]),
  'cross-border-transfer': mapping([], [
    conditional('importantDataContext', [PROVISION_IDS.automotive11]),
  ]),
  'user-rights': mapping(
    [PROVISION_IDS.automotive7, PROVISION_IDS.automotive17],
    [
      conditional('sensitivePersonalInformationContext', [
        PROVISION_IDS.automotive9,
      ]),
    ],
  ),
  'rights-channel': mapping([
    PROVISION_IDS.automotive7,
    PROVISION_IDS.automotive17,
  ]),
  'data-security': mapping(
    [PROVISION_IDS.automotive5],
    [conditional('importantDataContext', [PROVISION_IDS.automotive10])],
  ),
  'important-data': mapping([
    PROVISION_IDS.automotive3,
    PROVISION_IDS.automotive10,
  ]),
  'third-party-sharing': mapping([]),
  'separate-consent': mapping([
    PROVISION_IDS.pipl14,
    PROVISION_IDS.automotive9,
  ]),
  'data-security-obligations': mapping(
    [PROVISION_IDS.automotive5],
    [conditional('importantDataContext', [PROVISION_IDS.automotive10])],
  ),
})

function getMappedProvisionIds(ruleId, legalContext = {}) {
  const ruleMapping = RULE_TO_LEGAL_AUTHORITY_IDS[ruleId]
  if (!ruleMapping) return []

  const conditionalIds = ruleMapping.conditional.flatMap((condition) =>
    legalContext[condition.contextKey] === true ? condition.provisionIds : [],
  )

  return [...new Set([...ruleMapping.always, ...conditionalIds])]
}

export function getMappedVerifiedLegalAuthorities(
  ruleId,
  legalContext = {},
) {
  return getMappedProvisionIds(ruleId, legalContext)
    .map(getVerifiedProvisionById)
    .filter(
      (provision) =>
        provision && provision.verificationStatus === 'verified',
    )
}

export function getLegalAuthorityCitationMetadata(legalAuthorities) {
  if (legalAuthorities.length === 0) {
    return {
      legalBasis: LEGAL_SOURCE_NOT_VERIFIED,
      legalArticle: LEGAL_SOURCE_NOT_VERIFIED,
      legalAuthorityStatus: LEGAL_SOURCE_NOT_VERIFIED,
    }
  }

  return {
    legalBasis: [
      ...new Set(
        legalAuthorities.map((authority) => `《${authority.lawName}》`),
      ),
    ].join('；'),
    legalArticle: legalAuthorities
      .map((authority) => authority.article)
      .join('；'),
    legalAuthorityStatus: 'verified',
  }
}

export function attachVerifiedLegalAuthorities(rule) {
  const legalAuthorities = getMappedVerifiedLegalAuthorities(
    rule.id,
    rule.legalContext,
  )

  return {
    ...rule,
    legalAuthorities,
    ...getLegalAuthorityCitationMetadata(legalAuthorities),
  }
}

