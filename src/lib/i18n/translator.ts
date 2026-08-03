import { SupportedLanguageCode, PdfMode } from './languages'
import { GeneratedReportSnapshot, ExecutiveSummaryStatement, ReportRecommendation, SingleMetricResult } from '@/lib/reports/types'

// ============================================================================
// Dictionary Map for Report Headings, Metrics & UI Labels
// ============================================================================

export interface I18nDictionary {
  reportTitle: string
  executiveSummary: string
  overallPerformance: string
  platformComparison: string
  audienceGrowth: string
  viewsAndReach: string
  impressions: string
  engagements: string
  topContent: string
  lowestContent: string
  recommendations: string
  dataAvailability: string
  performanceGrade: string
  preparedBy: string
  reportingPeriod: string
  comparisonPeriod: string
  generatedAt: string
  version: string
  metrics: {
    audienceTotal: string
    impressions: string
    reach: string
    views: string
    engagements: string
    likes: string
    comments: string
    shares: string
    contentPublished: string
    engagementRate: string
    watchTimeSeconds: string
  }
  priorities: {
    high: string
    medium: string
    low: string
  }
  status: {
    connected: string
    notConnected: string
    permissionLimited: string
    noData: string
    achieved: string
    inProgress: string
    missed: string
  }
}

const EN_DICTIONARY: I18nDictionary = {
  reportTitle: 'Social Media Performance Report',
  executiveSummary: 'Executive Summary',
  overallPerformance: 'Overall KPI Performance',
  platformComparison: 'Platform Comparison',
  audienceGrowth: 'Audience & Followers Growth',
  viewsAndReach: 'Views & Total Reach',
  impressions: 'Total Impressions',
  engagements: 'Viewer Interactions & Engagement',
  topContent: 'Top Performing Content',
  lowestContent: 'Content Requiring Review',
  recommendations: 'Strategic Recommendations',
  dataAvailability: 'Data Availability & Audit Log',
  performanceGrade: 'Executive Performance Grade',
  preparedBy: 'Prepared By',
  reportingPeriod: 'Reporting Period',
  comparisonPeriod: 'Comparison Period',
  generatedAt: 'Generated At',
  version: 'Version',
  metrics: {
    audienceTotal: 'Total Followers',
    impressions: 'Total Impressions',
    reach: 'Total Reach',
    views: 'Video Views',
    engagements: 'Total Engagements',
    likes: 'Likes & Reactions',
    comments: 'Comments',
    shares: 'Shares',
    contentPublished: 'Content Published',
    engagementRate: 'Engagement Rate',
    watchTimeSeconds: 'Watch Time (Seconds)'
  },
  priorities: {
    high: 'HIGH PRIORITY',
    medium: 'MEDIUM PRIORITY',
    low: 'LOW PRIORITY'
  },
  status: {
    connected: 'Connected',
    notConnected: 'Not Connected',
    permissionLimited: 'Permission Limited',
    noData: 'No Data Available',
    achieved: 'Achieved',
    inProgress: 'In Progress',
    missed: 'Missed'
  }
}

const SI_DICTIONARY: I18nDictionary = {
  reportTitle: 'සමාජ මාධ්‍ය කාර්යසාධන වාර්තාව',
  executiveSummary: 'විධායක සාරාංශය',
  overallPerformance: 'සමස්ත KPI කාර්යසාධනය',
  platformComparison: 'ප්ලැට්ෆෝම් සැසඳීම',
  audienceGrowth: 'ප්‍රේක්ෂක සහ අනුගාමිකයින්ගේ වර්ධනය',
  viewsAndReach: 'නැරඹුම් සහ මුළු ළඟාවීම',
  impressions: 'මුළු ඉම්ප්‍රෙෂන්ස් ගණන',
  engagements: 'ප්‍රේක්ෂක ප්‍රතිචාර සහ නිරතවීම්',
  topContent: 'ඉහළම කාර්යසාධනය සහිත අන්තර්ගතය',
  lowestContent: 'සලකා බැලිය යුතු අන්තර්ගතය',
  recommendations: 'උපායමාර්ගික නිර්දේශ',
  dataAvailability: 'දත්ත ලබාගැනීමේ සහ විගණන ලොගය',
  performanceGrade: 'විධායක කාර්යසාධන ශ්‍රේණිය',
  preparedBy: 'පිළියෙල කළේ',
  reportingPeriod: 'වාර්තාකරණ කාලසීමාව',
  comparisonPeriod: 'සංසන්දනාත්මක කාලසීමාව',
  generatedAt: 'ජනනය කළ දිනය',
  version: 'සංශෝධනය',
  metrics: {
    audienceTotal: 'මුළු අනුගාමිකයින්',
    impressions: 'මුළු ඉම්ප්‍රෙෂන්ස්',
    reach: 'මුළු ළඟාවීම',
    views: 'වීඩියෝ නැරඹුම්',
    engagements: 'මුළු ප්‍රතිචාර',
    likes: 'ලයික්ස් සහ ප්‍රතිචාර',
    comments: 'අදහස් දැක්වීම්',
    shares: 'බෙදාගැනීම්',
    contentPublished: 'ප්‍රකාශිත අන්තර්ගතයන්',
    engagementRate: 'නිරතවීමේ ප්‍රතිශතය',
    watchTimeSeconds: 'නැරඹූ කාලය (තත්පර)'
  },
  priorities: {
    high: 'ඉහළ ප්‍රමුඛතාව',
    medium: 'මධ්‍යම ප්‍රමුඛතාව',
    low: 'අඩු ප්‍රමුඛතාව'
  },
  status: {
    connected: 'සම්බන්ධිතයි',
    notConnected: 'සම්බන්ධ කර නැත',
    permissionLimited: 'අවසර සීමිතයි',
    noData: 'දත්ත නොමැත',
    achieved: 'සාර්ථකයි',
    inProgress: 'ක්‍රියාත්මකයි',
    missed: 'අතපසු විය'
  }
}

/**
 * Returns localized dictionary for given language code with English fallback.
 */
export function getDictionary(lang: SupportedLanguageCode): I18nDictionary {
  if (lang === 'si') return SI_DICTIONARY
  return EN_DICTIONARY
}

// ============================================================================
// AI Sentence & Natural Language Translator Engine
// ============================================================================

/**
 * Translates executive statements to Sinhala while preserving numeric metrics.
 */
export function translateStatementText(text: string, targetLang: SupportedLanguageCode): string {
  if (!text || targetLang === 'en') return text

  if (targetLang === 'si') {
    let t = text
    // Replace common English phrases with natural Sinhala phrases
    t = t.replace(/Audience total reached/gi, 'සමස්ත ප්‍රේක්ෂක සංඛ්‍යාව ළඟා විය')
    t = t.replace(/followers/gi, 'අනුගාමිකයින්')
    t = t.replace(/Total impressions recorded across all networks/gi, 'සියලුම ජාල හරහා මුළු ඉම්ප්‍රෙෂන්ස් සටහන් විය')
    t = t.replace(/Total video views accumulated/gi, 'එක්රැස් වූ මුළු වීඩියෝ නැරඹුම් ප්‍රමාණය')
    t = t.replace(/Viewer engagements recorded/gi, 'සටහන් වූ ප්‍රේක්ෂක ප්‍රතිචාර ප්‍රමාණය')
    t = t.replace(/Overall engagement rate stands at/gi, 'සමස්ත ප්‍රතිචාර ප්‍රතිශතය වන්නේ')
    t = t.replace(/Published/gi, 'ප්‍රකාශයට පත් කරන ලදී')
    t = t.replace(/content posts across connected channels/gi, 'සම්බන්ධිත නාලිකා හරහා පෝස්ට්')
    t = t.replace(/Strong growth trajectory observed/gi, 'ශක්තිමත් වර්ධන ප්‍රවණතාවයක් නිරීක්ෂණය විය')
    t = t.replace(/Consistent publishing schedule maintained/gi, 'ස්ථාවර ප්‍රකාශන කාලසටහනක් පවත්වා ගෙන යන ලදී')
    t = t.replace(/High viewer interactions detected/gi, 'ඉහළ ප්‍රේක්ෂක අන්තර්ක්‍රියාකාරිත්වයක් හඳුනා ගන්නා ලදී')
    t = t.replace(/No active social connections available/gi, 'සක්‍රිය සමාජ මාධ්‍ය සම්බන්ධතා නොමැත')
    return t
  }

  return text
}

/**
 * Translates recommendation title & details to Sinhala.
 */
export function translateRecommendationText(text: string, targetLang: SupportedLanguageCode): string {
  if (!text || targetLang === 'en') return text

  if (targetLang === 'si') {
    let t = text
    t = t.replace(/Increase Publishing Consistency/gi, 'ප්‍රකාශන ස්ථාවරභාවය වැඩි කරන්න')
    t = t.replace(/Focus Content Strategy on High-Performing Channels/gi, 'ඉහළ කාර්යසාධනයක් සහිත නාලිකා කෙරෙහි අවධානය යොමු කරන්න')
    t = t.replace(/Optimize Video Content Length & First 3-Second Hook/gi, 'වීඩියෝ අන්තර්ගතයේ මුල් තත්පර 3 ආකර්ෂණීය කරන්න')
    t = t.replace(/Leverage Short-Form Vertical Videos/gi, 'කෙටි සිරස් වීඩියෝ භාවිතය වැඩි කරන්න')
    t = t.replace(/Encourage Viewer Comments and Direct Interaction/gi, 'ප්‍රේක්ෂක අදහස් දැක්වීම් සහ සෘජු සම්බන්ධතා දිරිමත් කරන්න')
    t = t.replace(/Cross-Promote Content Across Connected Platforms/gi, 'සම්බන්ධිත ප්ලැට්ෆෝම් හරහා අන්තර්ගතය ප්‍රවර්ධනය කරන්න')
    t = t.replace(/Maintain regular posting cadence/gi, 'නොකඩවා පෝස්ට් පළ කිරීමේ කාලසටහනක් පවත්වා ගන්න')
    t = t.replace(/Replicate topics from top performing posts/gi, 'ඉහළම ප්‍රතිචාර ලැබුණු පෝස්ට් වල මාතෘකා නැවත භාවිත කරන්න')
    return t
  }

  return text
}

// ============================================================================
// Snapshot Translation Orchestration
// ============================================================================

/**
 * Produces a translated, clone of GeneratedReportSnapshot.
 * Supports single target language or bilingual (English + Target) display.
 */
export function translateReportSnapshot(
  snapshot: GeneratedReportSnapshot,
  targetLang: SupportedLanguageCode = 'en',
  mode: PdfMode = 'single'
): GeneratedReportSnapshot {
  if (targetLang === 'en' && mode === 'single') {
    return snapshot
  }

  const dict = getDictionary(targetLang)
  const isBilingual = mode === 'bilingual' || targetLang === 'si'

  // Format header helper
  const fmtText = (enText: string, localizedText: string): string => {
    if (mode === 'bilingual') return `${enText} / ${localizedText}`
    return targetLang === 'si' ? localizedText : enText
  }

  const translated: GeneratedReportSnapshot = JSON.parse(JSON.stringify(snapshot))

  // 1. Report Metadata Title
  if (targetLang === 'si') {
    translated.report.title = fmtText(snapshot.report.title, snapshot.report.title.replace(/Weekly/gi, 'සතිපතා').replace(/Monthly/gi, 'මාසික').replace(/Performance Report/gi, 'කාර්යසාධන වාර්තාව'))
  }

  // 2. Localize Metric Card Labels
  const metricKeys: Array<keyof GeneratedReportSnapshot['overall']> = [
    'audienceTotal', 'impressions', 'reach', 'views', 'engagements', 'engagementRate', 'watchTimeSeconds', 'contentPublished'
  ]

  metricKeys.forEach(mKey => {
    const item = translated.overall[mKey] as SingleMetricResult
    if (item && dict.metrics[mKey as keyof typeof dict.metrics]) {
      const locLabel = dict.metrics[mKey as keyof typeof dict.metrics]
      item.unit = fmtText(item.unit || item.metricName, locLabel)
    }
  })

  // 3. Localize Executive Summary Statements
  if (Array.isArray(translated.executiveSummary)) {
    translated.executiveSummary = translated.executiveSummary.map((stmt: ExecutiveSummaryStatement) => {
      const transStatement = translateStatementText(stmt.statement, targetLang)
      return {
        ...stmt,
        statement: isBilingual && targetLang === 'si' ? `${stmt.statement}\n(${transStatement})` : transStatement
      }
    })
  }

  // 4. Localize Recommendations
  if (Array.isArray(translated.recommendations)) {
    translated.recommendations = translated.recommendations.map((rec: ReportRecommendation) => {
      const transTitle = translateRecommendationText(rec.title, targetLang)
      const transRec = translateRecommendationText(rec.recommendation, targetLang)

      return {
        ...rec,
        title: isBilingual && targetLang === 'si' ? `${rec.title} / ${transTitle}` : transTitle,
        recommendation: isBilingual && targetLang === 'si' ? `${rec.recommendation}\n(${transRec})` : transRec
      }
    })
  }

  // 5. Localize Platform Names & Notes
  if (translated.notes) {
    if (translated.notes.executiveSummaryNotes) {
      translated.notes.executiveSummaryNotes = translateStatementText(translated.notes.executiveSummaryNotes, targetLang)
    }
    if (translated.notes.marketingNotes) {
      translated.notes.marketingNotes = translateStatementText(translated.notes.marketingNotes, targetLang)
    }
    if (translated.notes.recommendationsNotes) {
      translated.notes.recommendationsNotes = translateRecommendationText(translated.notes.recommendationsNotes, targetLang)
    }
  }

  return translated
}
