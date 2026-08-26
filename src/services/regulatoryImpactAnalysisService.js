import { z } from 'zod'
import {
  REGULATORY_IMPACT_ANALYSIS_METHOD,
  REGULATORY_IMPACT_CONFIDENCE_LEVELS,
  REGULATORY_IMPACT_LEVELS,
  REGULATORY_IMPACT_SCHEMA_VERSION,
} from '../../shared/regulatoryImpactContract.js'
import { getApiEndpoint } from './apiEndpoint.js'

const impactResultSchema = z
  .object({
    sourceEvidence: z.array(
      z.object({
        evidenceId: z.string(),
        quotation: z.string(),
      }),
    ),
    changeSummary: z.object({
      whatChanged: z.string(),
      newRequirement: z.string(),
      whyItMatters: z.string(),
      evidenceIds: z.array(z.string()),
    }),
    preliminaryImpact: z.object({
      impactLevel: z.enum(REGULATORY_IMPACT_LEVELS),
      reasoning: z.string(),
      confidence: z.enum(REGULATORY_IMPACT_CONFIDENCE_LEVELS),
      evidenceIds: z.array(z.string()),
    }),
    affectedActivities: z.array(
      z.object({
        activity: z.string(),
        reason: z.string(),
        evidenceIds: z.array(z.string()),
      }),
    ),
    suggestedDocuments: z.array(
      z.object({
        documentName: z.string(),
        reason: z.string(),
        evidenceIds: z.array(z.string()),
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
      'Preliminary impact analysis could not reach the local server.',
    )
  }

  let payload

  try {
    payload = await response.json()
  } catch {
    throw new Error(
      'Preliminary impact analysis returned an unreadable response.',
    )
  }

  if (!response.ok) {
    throw new Error(
      typeof payload?.error === 'string'
        ? payload.error
        : 'Preliminary impact analysis failed.',
    )
  }

  const parsedResponse = impactApiResponseSchema.safeParse(payload)

  if (!parsedResponse.success) {
    throw new Error(
      'Preliminary impact analysis returned an invalid response.',
    )
  }

  return parsedResponse.data.result
}
