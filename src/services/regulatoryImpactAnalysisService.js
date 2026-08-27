import { z } from 'zod'
import {
  REGULATORY_IMPACT_ANALYSIS_METHOD,
  REGULATORY_CHANGE_COMPARISON_MODES,
  REGULATORY_IMPACT_CONFIDENCE_LEVELS,
  REGULATORY_IMPACT_EVIDENCE_TYPES,
  REGULATORY_IMPACT_LEVELS,
  REGULATORY_IMPACT_SCHEMA_VERSION,
  REGULATORY_EVIDENCE_GROUNDING_STATUSES,
} from '../../shared/regulatoryImpactContract.js'
import { getApiEndpoint } from './apiEndpoint.js'

const legalBasisSchema = z
  .object({
    sourceTitle: z.string(),
    provision: z.string(),
    excerpt: z.string(),
    excerptType: z.literal('verified requirement summary'),
    sourceUrl: z.string().url(),
    sourceAuthority: z.string(),
    verificationStatus: z.literal('verified'),
  })
  .strict()

const impactResultSchema = z
  .object({
    sourceEvidence: z.array(
      z.object({
        evidenceId: z.string(),
        quotation: z.string(),
        verificationStatus: z.literal('verified'),
      }),
    ),
    evidenceGrounding: z
      .object({
        status: z.enum(REGULATORY_EVIDENCE_GROUNDING_STATUSES),
        verifiedEvidenceCount: z.number().int().min(0),
        rejectedEvidenceCount: z.number().int().min(0),
        affectedPaths: z.array(z.string()),
      })
      .strict(),
    changeSummary: z.object({
      comparisonMode: z.enum(REGULATORY_CHANGE_COMPARISON_MODES),
      previousRequirement: z.string().nullable(),
      newRequirement: z.string(),
      preliminaryInterpretation: z.string(),
      whyItMatters: z.string(),
      evidenceIds: z.array(z.string()),
      legalBasis: z.array(legalBasisSchema),
    }),
    impactAssessment: z.object({
      level: z.enum(REGULATORY_IMPACT_LEVELS),
      rationale: z.string(),
      confidence: z.enum(REGULATORY_IMPACT_CONFIDENCE_LEVELS),
      evidenceIds: z.array(z.string()),
      legalBasis: z.array(legalBasisSchema),
      humanReviewRequired: z.literal(true),
      factors: z.array(
        z.object({
          factor: z.string(),
          assessment: z.string(),
          evidenceType: z.enum(REGULATORY_IMPACT_EVIDENCE_TYPES),
          evidenceIds: z.array(z.string()),
          legalBasis: z.array(legalBasisSchema),
        }),
      ),
    }),
    affectedActivities: z.array(
      z.object({
        activity: z.string(),
        reason: z.string(),
        evidenceIds: z.array(z.string()),
        legalBasis: z.array(legalBasisSchema),
      }),
    ),
    suggestedDocuments: z.array(
      z.object({
        documentName: z.string(),
        reason: z.string(),
        evidenceIds: z.array(z.string()),
        legalBasis: z.array(legalBasisSchema),
      }),
    ),
    reviewTasks: z.array(
      z.object({
        title: z.string(),
        objective: z.string(),
        legalTopic: z.string(),
        suggestedDocument: z.string(),
        priority: z.enum(['High', 'Medium', 'Low']),
        evidenceIds: z.array(z.string()),
        legalBasis: z.array(legalBasisSchema),
      }),
    ),
    legalAuthorityStatus: z.enum([
      'verified',
      'LEGAL_SOURCE_NOT_VERIFIED',
    ]),
    legalAuthorities: z.array(
      z
        .object({
          provisionId: z.string(),
          lawId: z.string(),
          lawName: z.string(),
          jurisdiction: z.string(),
          article: z.string(),
          topic: z.string(),
          requirementSummary: z.string(),
          sourceUrl: z.string().url(),
          sourceAuthority: z.string(),
          effectiveDate: z.string().nullable(),
          reviewScope: z.string(),
          verificationStatus: z.literal('verified'),
        })
        .strict(),
    ),
    analysisMethod: z.literal(REGULATORY_IMPACT_ANALYSIS_METHOD),
    requiresHumanReview: z.literal(true),
  })
  .strict()

const impactApiResponseSchema = z
  .object({
    schemaVersion: z.literal(REGULATORY_IMPACT_SCHEMA_VERSION),
    result: impactResultSchema,
  })
  .strict()

export function createRegulatoryImpactRequestPayload(event) {
  return {
    event: {
      externalId: event.sourceExternalId,
      title: event.title,
      regulator: event.regulator,
      publicationDate: event.publicationDate,
      sourceUrl: event.sourceUrl,
      matchedKeywords: [...(event.matchedKeywords || [])],
      jurisdiction: event.jurisdiction,
      detectionStatus: event.detectionStatus,
      verificationStatus: event.verificationStatus,
      changeType: event.changeType,
    },
  }
}

export async function parseRegulatoryImpactHttpResponse(response) {
  const contentType = response.headers.get('content-type') || ''
  let responseText

  try {
    responseText = await response.text()
  } catch {
    console.error('Regulatory impact response body could not be read.', {
      status: response.status,
      contentType,
    })
    throw new Error(
      'Preliminary impact analysis returned an unreadable response.',
    )
  }

  try {
    return JSON.parse(responseText)
  } catch {
    console.error('Regulatory impact response was not valid JSON.', {
      status: response.status,
      contentType,
      responseLength: responseText.length,
      netlifyRequestId:
        response.headers.get('x-nf-request-id') || undefined,
    })

    if (response.status === 504 || response.status === 502) {
      throw new Error(
        'Preliminary impact analysis service ended before returning a structured response. Please try again.',
      )
    }

    throw new Error(
      'Preliminary impact analysis returned an unreadable response.',
    )
  }
}

export function parseRegulatoryImpactApiPayload(payload) {
  const parsedResponse = impactApiResponseSchema.safeParse(payload)

  if (!parsedResponse.success) {
    throw new Error(
      'Preliminary impact analysis returned an invalid response.',
    )
  }

  return parsedResponse.data.result
}

export async function requestRegulatoryImpactAnalysis(event) {
  let response

  try {
    response = await fetch(getApiEndpoint('regulatory-impact-analysis'), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createRegulatoryImpactRequestPayload(event)),
    })
  } catch {
    throw new Error(
      'Preliminary impact analysis could not reach the server.',
    )
  }

  const payload = await parseRegulatoryImpactHttpResponse(response)

  if (!response.ok) {
    throw new Error(
      typeof payload?.error === 'string'
        ? payload.error
        : 'Preliminary impact analysis failed.',
    )
  }

  return parseRegulatoryImpactApiPayload(payload)
}
