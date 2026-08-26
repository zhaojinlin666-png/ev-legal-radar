import { regulatoryUpdates } from './regulatoryUpdates.js'

export const LEGAL_SOURCE_NOT_VERIFIED = 'LEGAL_SOURCE_NOT_VERIFIED'

const PIPL_SOURCE_URL =
  'https://www.npc.gov.cn/npc/c2/c30834/202108/t20210820_313088.html'
const AUTOMOTIVE_DATA_SOURCE_URL =
  'https://www.cac.gov.cn/2021-08/20/c_1631049984897667.htm'
const PIPL_LAW_ID = 'cn-personal-information-protection-law'
const AUTOMOTIVE_DATA_LAW_ID =
  'cn-automobile-data-security-provisions-trial'

const sourceVerifiedReviewItem = regulatoryUpdates
  .flatMap((update) => update.legalReviewItems)
  .find(
    (item) => item.verificationStatus === 'Source Verified' && item.legalSource,
  )

if (!sourceVerifiedReviewItem) {
  throw new Error('The project does not contain a source-verified review item.')
}

const automotiveSource = sourceVerifiedReviewItem.legalSource

function verifiedProvision({
  lawId,
  lawName,
  article,
  topic,
  requirementSummary,
  sourceUrl,
  sourceAuthority,
  effectiveDate,
  reviewScope,
}) {
  return Object.freeze({
    provisionId: `${lawId}-${article.toLowerCase().replace(/\s+/g, '-')}`,
    lawId,
    lawName,
    jurisdiction: 'China',
    article,
    topic,
    requirementSummary,
    sourceUrl,
    sourceAuthority,
    effectiveDate,
    reviewScope,
    verificationStatus: 'verified',
  })
}

const piplProvision = (details) =>
  verifiedProvision({
    lawId: PIPL_LAW_ID,
    lawName:
      'Personal Information Protection Law of the People\'s Republic of China',
    sourceUrl: PIPL_SOURCE_URL,
    sourceAuthority: 'National People\'s Congress of China',
    effectiveDate: null,
    ...details,
  })

const automotiveDataProvision = (details) =>
  verifiedProvision({
    lawId: AUTOMOTIVE_DATA_LAW_ID,
    lawName: automotiveSource.title,
    sourceUrl: AUTOMOTIVE_DATA_SOURCE_URL,
    sourceAuthority: automotiveSource.issuingAuthorities,
    effectiveDate: automotiveSource.effectiveDate,
    ...details,
  })

/**
 * This registry contains only the provision metadata and summaries supplied by
 * the user as official-source-verified for this iteration. It does not contain
 * model-generated statutory text.
 */
export const LEGAL_KNOWLEDGE_BASE = Object.freeze([
  piplProvision({
    article: 'Article 6',
    topic: 'processing purpose; data minimization',
    requirementSummary:
      'Personal information processing must have a clear and reasonable purpose, be directly related to that purpose, use a method with the least impact on individual rights, and collection must be limited to the minimum scope necessary to achieve the processing purpose.',
    reviewScope: 'substantive processing and minimization requirement',
  }),
  piplProvision({
    article: 'Article 7',
    topic:
      'transparency; processing purpose; processing method; processing scope',
    requirementSummary:
      'Personal information processing must follow openness and transparency, publish processing rules, and clearly state the purpose, method and scope of processing.',
    reviewScope: 'transparency and disclosure requirement',
  }),
  piplProvision({
    article: 'Article 13',
    topic: 'lawful basis for personal information processing',
    requirementSummary:
      'Personal information may be processed only where a statutory lawful basis under Article 13 exists, including consent or another applicable statutory basis.',
    reviewScope: 'lawful-basis requirement',
  }),
  piplProvision({
    article: 'Article 14',
    topic: 'consent',
    requirementSummary:
      'Where processing relies on consent, consent must be voluntarily and explicitly given by the individual on a fully informed basis. Where separate or written consent is legally required, those requirements apply.',
    reviewScope: 'consent requirement',
  }),
  automotiveDataProvision({
    article: 'Article 3',
    topic:
      'automotive data definitions; personal information; sensitive personal information; important data',
    requirementSummary:
      'Defines automotive data, personal information, sensitive personal information and important data. Vehicle trajectory data is expressly included in the definition or examples of sensitive personal information.',
    reviewScope: 'definition and classification',
  }),
  automotiveDataProvision({
    article: 'Article 4',
    topic: 'processing purpose',
    requirementSummary:
      'Automotive data processing must be lawful, legitimate, specific and clear, and directly related to automobile design, production, sale, use or maintenance.',
    reviewScope: 'substantive processing-purpose requirement',
  }),
  automotiveDataProvision({
    article: 'Article 5',
    topic: 'data security obligations',
    requirementSummary: 'Data security obligations.',
    reviewScope: 'data-security requirement',
  }),
  automotiveDataProvision({
    article: 'Article 6',
    topic: 'data minimization; privacy by default',
    requirementSummary:
      'The regulation advocates in-vehicle processing where possible, default non-collection, appropriate precision scope, and anonymization or de-identification where possible.',
    reviewScope: 'minimization and privacy-by-default principles',
  }),
  automotiveDataProvision({
    article: 'Article 7',
    topic:
      'information categories; collection circumstances; processing purpose; processing use; processing method; storage location; retention period; access, copy and delete rights; rights contact information',
    requirementSummary:
      'Requires disclosure of information categories, collection circumstances, processing purpose, use and method, storage location, retention period, access, copy and delete rights, and rights contact information.',
    reviewScope: 'disclosure and transparency requirement',
  }),
  automotiveDataProvision({
    article: 'Article 8',
    topic: 'consent; lawful basis',
    requirementSummary:
      'Processing personal information requires individual consent or another circumstance permitted by laws or administrative regulations.',
    reviewScope: 'consent and lawful-basis requirement',
  }),
  automotiveDataProvision({
    article: 'Article 9',
    topic:
      'sensitive personal information; separate consent; vehicle trajectory; deletion rights',
    requirementSummary:
      'Sensitive personal information processing must satisfy the special requirements of Article 9, including a purpose directly serving the individual, prominent notice of necessity and impact, separate consent, collection-status notice and termination convenience, and deletion upon request within the applicable requirement.',
    reviewScope: 'heightened sensitive-personal-information requirement',
  }),
  automotiveDataProvision({
    article: 'Article 10',
    topic:
      'important data; risk assessment; storage location and retention reporting',
    requirementSummary:
      'Covers important-data risk assessment and reporting of storage location and retention period.',
    reviewScope: 'important-data risk assessment and reporting',
  }),
  automotiveDataProvision({
    article: 'Article 11',
    topic: 'data localization; cross-border transfer of important data',
    requirementSummary:
      'Important data must be stored domestically according to law. Where cross-border provision is genuinely required for business, the required security assessment applies. Cross-border management of personal information that is not important data is governed by applicable laws and administrative regulations.',
    reviewScope: 'important-data localization and cross-border requirement',
  }),
  automotiveDataProvision({
    article: 'Article 17',
    topic: 'complaint; user-rights channel',
    requirementSummary:
      'Automotive data processors must establish convenient complaint or reporting channels and timely handle user complaints.',
    reviewScope: 'complaint and reporting-channel requirement',
  }),
])

const VERIFIED_PROVISIONS_BY_ID = new Map(
  LEGAL_KNOWLEDGE_BASE.filter(
    (provision) => provision.verificationStatus === 'verified',
  ).map((provision) => [provision.provisionId, provision]),
)

function copyProvision(provision) {
  return provision ? { ...provision } : null
}

export function getVerifiedProvisionById(provisionId) {
  return copyProvision(VERIFIED_PROVISIONS_BY_ID.get(provisionId))
}

export function getAllVerifiedProvisions() {
  return [...VERIFIED_PROVISIONS_BY_ID.values()].map(copyProvision)
}

function normalizeOfficialSourceUrl(sourceUrl) {
  try {
    const normalizedUrl = new URL(sourceUrl)
    normalizedUrl.hash = ''
    normalizedUrl.search = ''
    return normalizedUrl.toString()
  } catch {
    return null
  }
}

/**
 * Returns provisions only when both the official URL and the instrument title
 * match a verified local knowledge-base record. Keyword overlap is
 * deliberately insufficient for authority attachment.
 */
export function getVerifiedProvisionsForOfficialSource({ title, sourceUrl }) {
  const normalizedSourceUrl = normalizeOfficialSourceUrl(sourceUrl)

  if (!normalizedSourceUrl || typeof title !== 'string') return []

  return [...VERIFIED_PROVISIONS_BY_ID.values()]
    .filter(
      (provision) =>
        provision.lawName === title &&
        normalizeOfficialSourceUrl(provision.sourceUrl) ===
          normalizedSourceUrl,
    )
    .map(copyProvision)
}

export function isVerifiedLegalSourceMetadata(legalSource) {
  if (!legalSource || typeof legalSource !== 'object') return false

  return [...VERIFIED_PROVISIONS_BY_ID.values()].some(
    (provision) =>
      legalSource.title === provision.lawName &&
      legalSource.article === provision.article &&
      legalSource.issuingAuthorities === provision.sourceAuthority &&
      legalSource.effectiveDate === provision.effectiveDate &&
      legalSource.officialSource === provision.sourceUrl,
  )
}
