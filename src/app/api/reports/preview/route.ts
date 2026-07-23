import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildReportSnapshot } from '@/lib/reports/snapshot-engine'
import { PlatformType, ReportType } from '@/lib/reports/types'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get('companyId')
  const reportType = (searchParams.get('reportType') || 'monthly') as ReportType
  const platformsStr = searchParams.get('platforms')

  if (!companyId) {
    return NextResponse.json({ error: 'companyId is required' }, { status: 400 })
  }

  try {
    const supabase = await createClient()
    const platforms: PlatformType[] = platformsStr
      ? (platformsStr.split(',') as PlatformType[])
      : ['facebook', 'youtube']

    const snapshot = await buildReportSnapshot(supabase, {
      companyId,
      reportType,
      includedPlatforms: platforms
    })

    return NextResponse.json(snapshot)
  } catch (err: unknown) {
    console.error('Report preview API error:', err)
    return NextResponse.json({ error: (err as Error).message || 'Failed to build report preview' }, { status: 500 })
  }
}
