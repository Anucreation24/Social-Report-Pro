import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { executePlatformSync } from '@/lib/analytics/sync-engine'

export async function GET(request: NextRequest) {
  // 1. Verify CRON_SECRET authorization
  const authHeader = request.headers.get('authorization')
  const cronSecretHeader = request.headers.get('x-cron-secret')
  const expectedSecret = process.env.CRON_SECRET

  // If CRON_SECRET is configured, enforce strict match; in local dev fallback if not set.
  if (expectedSecret) {
    const isBearerMatch = authHeader === `Bearer ${expectedSecret}`
    const isHeaderMatch = cronSecretHeader === expectedSecret
    if (!isBearerMatch && !isHeaderMatch) {
      return NextResponse.json({ error: 'Unauthorized cron request.' }, { status: 401 })
    }
  }

  try {
    const supabase = await createClient()

    // 2. Query all active connections needing daily sync
    const { data: connections, error: connErr } = await supabase
      .from('platform_connections')
      .select('id, company_id, provider')
      .in('connection_status', ['connected', 'awaiting_account_selection'])

    if (connErr || !connections || connections.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active connections found for daily sync.',
        processedCount: 0
      })
    }

    const results = []

    // 3. Process each connection safely
    for (const conn of connections) {
      try {
        const res = await executePlatformSync(supabase, {
          companyId: conn.company_id,
          connectionId: conn.id,
          jobType: 'scheduled',
          daysToFetch: 3 // Fetch last 3 days to cover time zone boundaries
        })
        results.push({ connectionId: conn.id, provider: conn.provider, success: res.success })
      } catch (err: unknown) {
        console.error(`Cron sync failed for connection ${conn.id}:`, err)
        results.push({ connectionId: conn.id, provider: conn.provider, success: false, error: err instanceof Error ? err.message : 'Failed' })
      }
    }

    return NextResponse.json({
      success: true,
      processedCount: connections.length,
      results
    })
  } catch (err: unknown) {
    console.error('Daily cron API error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal cron error' },
      { status: 500 }
    )
  }
}
