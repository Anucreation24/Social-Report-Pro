import { 
  SocialPlatform, 
  SocialPlatformConnector, 
  ProviderCapabilities, 
  AuthorizationInput, 
  AuthorizationResult, 
  CallbackInput, 
  TokenResult, 
  SelectableSocialAccount, 
  ConnectionHealthResult 
} from '../types'
import { ConfigurationMissingError, TokenExchangeError, AccountDiscoveryError } from '../errors'
import { generateOAuthState } from '../oauth-state'

export class InstagramConnector implements SocialPlatformConnector {
  public provider: SocialPlatform = 'instagram'

  private getClientConfig() {
    const clientId = process.env.META_APP_ID
    const clientSecret = process.env.META_APP_SECRET
    const redirectUri = process.env.META_REDIRECT_URI
    const apiVersion = process.env.META_GRAPH_API_VERSION || 'v21.0'

    return { clientId, clientSecret, redirectUri, apiVersion }
  }

  public getCapabilities(): ProviderCapabilities {
    return {
      supportsOAuth: true,
      supportsAccountSelection: true,
      supportsTokenRefresh: false,
      supportsTokenRevocation: true,
      supportsAccountMetrics: true,
      supportsContentMetrics: true,
      supportsHistoricalReports: true,
      requiresProfessionalAccount: true, // Non-negotiable requirement for Instagram API Insights
      requiresAppReview: true
    }
  }

  public async getAuthorizationUrl(input: AuthorizationInput): Promise<AuthorizationResult> {
    const { clientId, redirectUri } = this.getClientConfig()
    if (!clientId) {
      throw new ConfigurationMissingError('instagram', 'META_APP_ID')
    }
    if (!redirectUri) {
      throw new ConfigurationMissingError('instagram', 'META_REDIRECT_URI')
    }

    const state = generateOAuthState(input.userId, input.companyId, 'instagram', input.returnUrl)
    
    // Scopes needed for Instagram Business Account lookup & read-only Insights analytics
    const scopes = [
      'public_profile', 
      'email', 
      'pages_show_list', 
      'pages_read_engagement', 
      'instagram_basic', 
      'instagram_manage_insights'
    ]
    
    const url = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&state=${state}&scope=${encodeURIComponent(scopes.join(','))}`

    return { url, state }
  }

  public async exchangeAuthorizationCode(input: CallbackInput): Promise<TokenResult> {
    const { clientId, clientSecret, redirectUri } = this.getClientConfig()
    if (!clientId || !clientSecret || !redirectUri) {
      throw new ConfigurationMissingError('instagram', 'META credentials')
    }

    const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&client_secret=${clientSecret}&code=${input.code}`

    const res = await fetch(tokenUrl)
    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}))
      throw new TokenExchangeError(
        'instagram', 
        errorJson?.error?.message || 'Failed to exchange Instagram authorization code.',
        res.status
      )
    }

    const data = await res.json()
    const shortLivedToken = data.access_token

    // Exchange short-lived token for long-lived user access token
    const longLivedUrl = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${shortLivedToken}`
    
    const longRes = await fetch(longLivedUrl)
    if (!longRes.ok) {
      throw new TokenExchangeError('instagram', 'Failed to retrieve Instagram long-lived access token.')
    }

    const longData = await longRes.json()
    
    return {
      accessToken: longData.access_token,
      expiresIn: longData.expires_in || 5184000,
      scopes: ['pages_show_list', 'pages_read_engagement', 'instagram_basic', 'instagram_manage_insights']
    }
  }

  public async refreshAccessToken(): Promise<TokenResult> {
    throw new Error('Instagram does not support standard OAuth refresh tokens. Long-lived access tokens are extended through Graph API.')
  }

  public async revokeAccess(accessToken: string): Promise<void> {
    const revokeUrl = `https://graph.facebook.com/me/permissions?access_token=${accessToken}`
    const res = await fetch(revokeUrl, { method: 'DELETE' })
    if (!res.ok) {
      console.warn('Failed to revoke Instagram permissions on Meta servers.')
    }
  }

  public async getAvailableAccounts(accessToken: string): Promise<SelectableSocialAccount[]> {
    // 1. Fetch pages administrated by user
    const pagesUrl = `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token&access_token=${accessToken}`
    const pagesRes = await fetch(pagesUrl)
    if (!pagesRes.ok) {
      const err = await pagesRes.json().catch(() => ({}))
      throw new AccountDiscoveryError('instagram', err?.error?.message || 'Failed to fetch linked Pages.')
    }

    const pagesData = await pagesRes.json()
    const pages = pagesData.data || []
    
    const igAccounts: SelectableSocialAccount[] = []

    // 2. For each Page, query if there is a linked Instagram Business Account
    for (const page of pages) {
      const igUrl = `https://graph.facebook.com/v21.0/${page.id}?fields=instagram_business_account{id,name,username,profile_picture_url}&access_token=${page.access_token}`
      const igRes = await fetch(igUrl)
      if (igRes.ok) {
        const igData = await igRes.json()
        const igBiz = igData.instagram_business_account
        if (igBiz) {
          igAccounts.push({
            id: igBiz.id,
            name: igBiz.name || igBiz.username,
            username: igBiz.username,
            profileImageUrl: igBiz.profile_picture_url || '',
            accountType: 'business',
            accountUrl: `https://instagram.com/${igBiz.username}`,
            capabilities: {
              analytics: true,
              posts: false
            },
            providerMetadata: {
              facebookPageId: page.id,
              pageAccessToken: page.access_token
            }
          })
        }
      }
    }

    return igAccounts
  }

  public async validateConnection(accessToken: string): Promise<ConnectionHealthResult> {
    const debugUrl = `https://graph.facebook.com/me?fields=id&access_token=${accessToken}`
    try {
      const res = await fetch(debugUrl)
      if (res.ok) {
        return { status: 'valid' }
      }
      const err = await res.json().catch(() => ({}))
      if (err?.error?.code === 190) {
        return { status: 'expired', message: 'Instagram user token expired or invalid.' }
      }
      return { status: 'provider_error', message: err?.error?.message }
    } catch (e: unknown) {
      return { status: 'unknown', message: e instanceof Error ? e.message : 'Unknown transport error.' }
    }
  }
}
