import { NO_VERIFIED_PREVIOUS_VERSION_NOTICE } from '../../shared/regulatoryImpactContract.js'

export function getRegulatoryChangePresentation(changeSummary) {
  const hasVerifiedComparison =
    changeSummary?.comparisonMode === 'verified_change_comparison' &&
    typeof changeSummary.previousRequirement === 'string' &&
    changeSummary.previousRequirement.trim().length > 0

  if (hasVerifiedComparison) {
    return {
      hasVerifiedComparison: true,
      title: 'What Changed / 发生了什么变化',
      notice: null,
      previousRequirement: changeSummary.previousRequirement,
    }
  }

  return {
    hasVerifiedComparison: false,
    title: 'What the New Source Introduces / 新文件提出了什么',
    notice: NO_VERIFIED_PREVIOUS_VERSION_NOTICE,
    previousRequirement: null,
  }
}
