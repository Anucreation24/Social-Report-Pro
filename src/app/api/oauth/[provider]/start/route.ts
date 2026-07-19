import { NextRequest, NextResponse } from 'next/server'
import { connectorRegistry } from '@/lib/connectors/registry'
import { SocialPlatform } from '@/lib/connectors/types'
import { createClient } from '@/lib/supabase/server'
import { verifyCompanyPermission } from '@/lib/permissions'

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ provider: string }> }
) {
  const { provider } = await props.params
  const searchParams = request.nextUrl.searchParams
  const companyId = searchParams.get('companyId')

  if (!companyId) {
    return NextResponse.json({ error: 'companyId query parameter is required.' }, { status: 400 })
  }

  // Validate provider enum
  const validProviders: SocialPlatform[] = ['facebook', 'instagram', 'youtube', 'tiktok']
  if (!validProviders.includes(provider as SocialPlatform)) {
    return NextResponse.json({ error: `Unsupported platform provider: ${provider}` }, { status: 400 })
  }

  try {
    // 1. Resolve authenticated user session
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized session.' }, { status: 401 })
    }

    // 2. Verify company membership and permission rules
    // Owners, Admins, and Marketing Managers are authorized to manage platform connections.
    const permission = await verifyCompanyPermission(companyId, ['owner', 'admin', 'marketing_manager'])
    if (!permission.authorized) {
      return NextResponse.json({ error: permission.error || 'Access denied.' }, { status: 403 })
    }

    // 3. Retrieve connector & start authorization URL creation
    const connector = connectorRegistry.get(provider as SocialPlatform)
    const returnUrl = `${request.nextUrl.origin}/connections`

    const { url } = await connector.getAuthorizationUrl({
      userId: user.id,
      companyId: companyId,
      returnUrl
    })

    // 4. Redirect to the third-party consent screen
    return NextResponse.redirect(url)
  } catch (err: unknown) {
    console.error(`OAuth start flow failed for ${provider}:`, err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error during OAuth initiation.' },
      { status: 500 }
    )
  }
}
