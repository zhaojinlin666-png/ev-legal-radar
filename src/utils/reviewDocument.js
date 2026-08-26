import { createReviewResult } from '../models/reviewResult.js'

const ANALYSIS_METHOD = 'Rule-based preliminary review'

function normalizeText(text) {
  return text.toLocaleLowerCase().replace(/\s+/g, ' ').trim()
}

function createTextSegments(text) {
  const normalizedLineEndings = text.replace(/\r\n?/g, '\n')
  const blocks = normalizedLineEndings
    .split(/\n\s*\n/)
    .map((block) => block.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean)
  const lines = normalizedLineEndings
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const lineWindows = lines.map((line, index) =>
    lines.slice(index, index + 3).join(' '),
  )

  return [...new Set([...blocks, ...lines, ...lineWindows])]
}

function getMatches(text, keywords) {
  return keywords.filter((keyword) => text.includes(normalizeText(keyword)))
}

function findBestEvidence(segments, rule) {
  const scoredSegments = segments.map((segment) => {
    const normalizedSegment = normalizeText(segment)
    const directMatches = getMatches(normalizedSegment, rule.keywords.direct)
    const contextualMatches = getMatches(
      normalizedSegment,
      rule.keywords.contextual,
    )

    return {
      segment,
      score: directMatches.length * 3 + contextualMatches.length,
    }
  })

  const bestMatch = scoredSegments.sort((a, b) => b.score - a.score)[0]

  if (!bestMatch || bestMatch.score === 0) return ''

  if (bestMatch.segment.length <= 360) return bestMatch.segment

  return `${bestMatch.segment.slice(0, 357).trim()}…`
}

function classifyResult(normalizedText, rule) {
  const directMatches = getMatches(normalizedText, rule.keywords.direct)
  const contextualMatches = getMatches(
    normalizedText,
    rule.keywords.contextual,
  )

  if (
    directMatches.length > 0 &&
    (contextualMatches.length > 0 || directMatches.length > 1)
  ) {
    return {
      status: 'Found',
      confidence: 'High',
      requiresHumanReview: false,
    }
  }

  if (directMatches.length > 0 || contextualMatches.length > 0) {
    return {
      status: 'Further Review Required',
      confidence: 'Medium',
      requiresHumanReview: true,
    }
  }

  return {
    status: 'Potential Gap',
    confidence: 'Medium',
    requiresHumanReview: true,
  }
}

function createObservation(status, rule) {
  if (status === 'Found') {
    return `基于当前规则匹配，文本中识别到与“${rule.title}”相关的较明确表述。该结果仅用于初步筛查，建议人工复核其完整性和适用性。`
  }

  if (status === 'Further Review Required') {
    return `当前文本中识别到可能与“${rule.title}”相关的间接或模糊表述，但简单文本规则无法可靠判断其是否完整，建议人工复核。`
  }

  return `当前文本中未识别到与“${rule.title}”相关的足够明确表述。可能需要进一步核查其他文件或完整业务场景，并建议人工复核。`
}

function createPracticalReviewFields(status, rule) {
  const issueSummary =
    status === 'Found'
      ? `当前文本中识别到与“${rule.title}”相关的表述，其完整性仍待人工复核。`
      : status === 'Further Review Required'
        ? `当前文本中可能存在与“${rule.title}”相关的表述，但仅凭规则匹配无法可靠判断。`
        : `当前文本中未识别到与“${rule.title}”相关的足够明确表述。`

  return {
    issueSummary,
    riskReason:
      '规则驱动的文本匹配仅反映当前上传文本的表述情况，可能需要结合完整文件和实际业务场景进一步确认。',
    suggestedRevision:
      '建议在人工核查相关事实后，再根据实际情况判断是否需要完善相关文本表述。',
    suggestedNextStep:
      '建议由法律专业人员结合完整文本和实际业务场景进一步复核。',
  }
}

export function ruleBasedReview(text, rules) {
  const normalizedText = normalizeText(text)
  const segments = createTextSegments(text)

  return rules.map((rule) => {
    const classification = classifyResult(normalizedText, rule)
    const matchedEvidence = findBestEvidence(segments, rule)
    const practicalReviewFields = createPracticalReviewFields(
      classification.status,
      rule,
    )

    return createReviewResult({
      ruleId: rule.id,
      title: rule.title,
      status: classification.status,
      evidence:
        classification.status === 'Potential Gap'
          ? '在当前上传文档中未发现足够明确的相关表述。'
          : matchedEvidence,
      observation: createObservation(classification.status, rule),
      legalBasis: rule.legalBasis,
      legalArticle: rule.legalArticle,
      legalAuthorityStatus: rule.legalAuthorityStatus,
      legalAuthorities: rule.legalAuthorities,
      riskLevel: rule.riskLevel,
      analysisMethod: ANALYSIS_METHOD,
      confidence: classification.confidence,
      requiresHumanReview: classification.requiresHumanReview,
      ...practicalReviewFields,
    })
  })
}
