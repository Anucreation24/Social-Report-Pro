'use server'

import { createClient } from '@/lib/supabase/server'
import { verifyCompanyPermission } from '@/lib/permissions'
import { generateAIExecutiveIntelligence } from '@/lib/ai/intelligence-facade'
import { AIExecutiveIntelligenceReport, SummaryLength } from '@/lib/ai/types'

export async function generateAiIntelligenceAction(
  companyId: string,
  summaryLength: SummaryLength = 'medium'
): Promise<{ success: boolean; data: AIExecutiveIntelligenceReport | null; error?: string }> {
  try {
    if (!companyId) return { success: false, data: null, error: 'Missing company ID' }
    const supabase = await createClient()

    const perm = await verifyCompanyPermission(companyId, ['owner', 'admin', 'marketing_manager', 'viewer', 'client_viewer'])
    if (!perm.authorized) {
      return { success: false, data: null, error: perm.error || 'Unauthorized' }
    }

    const report = await generateAIExecutiveIntelligence(supabase, companyId, summaryLength)
    return { success: true, data: report }
  } catch (err) {
    console.error('generateAiIntelligenceAction error:', err)
    return { success: false, data: null, error: (err as Error).message || 'Failed to generate AI intelligence' }
  }
}

export async function saveAiSnapshotAction(
  companyId: string,
  report: AIExecutiveIntelligenceReport
): Promise<{ success: boolean; snapshotId?: string; error?: string }> {
  try {
    if (!companyId || !report) return { success: false, error: 'Missing required parameters' }
    const supabase = await createClient()

    const perm = await verifyCompanyPermission(companyId, ['owner', 'admin', 'marketing_manager'])
    if (!perm.authorized) {
      return { success: false, error: perm.error || 'Unauthorized' }
    }

    const { data: { user } } = await supabase.auth.getUser()

    const today = new Date().toISOString().split('T')[0]

    const { data: snapshot, error: insertErr } = await supabase
      .from('ai_report_snapshots')
      .insert({
        company_id: companyId,
        period_start: today,
        period_end: today,
        report_type: 'executive_ai',
        summary_length: report.summaryLength,
        executive_summary: report.executiveSummary as unknown as Record<string, unknown>,
        growth_analysis: report.growthAnalysis as unknown as Record<string, unknown>,
        platform_scores: report.platformScores as unknown as Record<string, unknown>,
        content_intelligence: report.contentIntelligence as unknown as Record<string, unknown>,
        recommendations: report.recommendations as unknown as Record<string, unknown>,
        posting_time_intelligence: report.postingTimeIntelligence as unknown as Record<string, unknown>,
        trend_detection: report.trendDetection as unknown as Record<string, unknown>,
        forecast: report.forecast as unknown as Record<string, unknown>,
        performance_grade: report.performanceGrade as unknown as Record<string, unknown>,
        executive_kpis: report.executiveKPIs as unknown as Record<string, unknown>,
        created_by: user?.id || null
      })
      .select('id')
      .single()

    if (insertErr) {
      console.error('saveAiSnapshotAction insert error:', insertErr)
      return { success: false, error: insertErr.message }
    }

    return { success: true, snapshotId: snapshot?.id }
  } catch (err) {
    console.error('saveAiSnapshotAction exception:', err)
    return { success: false, error: (err as Error).message || 'Failed to save AI snapshot' }
  }
}

export async function getAiHistoryAction(
  companyId: string
): Promise<{ success: boolean; data: Record<string, unknown>[]; error?: string }> {
  try {
    if (!companyId) return { success: true, data: [] }
    const supabase = await createClient()

    const perm = await verifyCompanyPermission(companyId, ['owner', 'admin', 'marketing_manager', 'viewer', 'client_viewer'])
    if (!perm.authorized) {
      return { success: false, data: [], error: perm.error || 'Unauthorized' }
    }

    const { data, error } = await supabase
      .from('ai_report_snapshots')
      .select(`
        id, company_id, period_start, period_end, report_type, summary_length,
        performance_grade, generated_at, created_at
      `)
      .eq('company_id', companyId)
      .order('generated_at', { ascending: false })

    if (error) {
      console.error('getAiHistoryAction DB error:', error)
      return { success: true, data: [] }
    }

    return { success: true, data: data || [] }
  } catch (err) {
    console.error('getAiHistoryAction exception:', err)
    return { success: true, data: [] }
  }
}
