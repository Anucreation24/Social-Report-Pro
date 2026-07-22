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

export class FacebookConnector implements SocialPlatformConnector {
  public provider: SocialPlatform = 'facebook'

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
      requiresProfessionalAccount: false,
      requiresAppReview: true
    }
  }

  public async getAuthorizationUrl(input: AuthorizationInput): Promise<AuthorizationResult> {
    const { clientId, redirectUri } = this.getClientConfig()
    if (!clientId) {
      throw new ConfigurationMissingError('facebook', 'META_APP_ID')
    }
    if (!redirectUri) {
      throw new ConfigurationMissingError('facebook', 'META_REDIRECT_URI')
    }

    const state = generateOAuthState(input.userId, input.companyId, 'facebook', input.returnUrl)
    
    // Scopes needed for read-only Page metadata & analytics
    const scopes = ['public_profile', 'email', 'pages_show_list', 'pages_read_engagement', 'pages_read_user_content']
    
    const url = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&state=${state}&scope=${encodeURIComponent(scopes.join(','))}`

    return { url, state }
  }

  public async exchangeAuthorizationCode(input: CallbackInput): Promise<TokenResult> {
    const { clientId, clientSecret, redirectUri } = this.getClientConfig()
    if (!clientId || !clientSecret || !redirectUri) {
      throw new ConfigurationMissingError('facebook', 'META credentials')
    }

    // 1. Exchange authorization code for short-lived user token
    const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&client_secret=${clientSecret}&code=${input.code}`

    const res = await fetch(tokenUrl)
    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}))
      throw new TokenExchangeError(
        'facebook', 
        errorJson?.error?.message || 'Failed to exchange Facebook authorization code.',
        res.status
      )
    }

    const data = await res.json()
    const shortLivedToken = data.access_token

    // 2. Exchange short-lived token for long-lived user access token (approx. 60 days validity)
    const longLivedUrl = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${shortLivedToken}`
    
    const longRes = await fetch(longLivedUrl)
    if (!longRes.ok) {
      throw new TokenExchangeError('facebook', 'Failed to retrieve Facebook long-lived access token.')
    }

    const longData = await longRes.json()
    
    return {
      accessToken: longData.access_token,
      expiresIn: longData.expires_in || 5184000, // Default 60 days
      scopes: ['pages_show_list', 'pages_read_engagement', 'pages_read_user_content']
    }
  }

  public async refreshAccessToken(): Promise<TokenResult> {
    throw new Error('Facebook does not support standard OAuth refresh tokens. Long-lived Page access tokens are non-expiring.')
  }

  public async revokeAccess(accessToken: string): Promise<void> {
    const revokeUrl = `https://graph.facebook.com/me/permissions?access_token=${accessToken}`
    const res = await fetch(revokeUrl, { method: 'DELETE' })
    if (!res.ok) {
      console.warn('Failed to cleanly revoke Facebook token permissions on Meta server.')
    }
  }

  public async getAvailableAccounts(accessToken: string): Promise<SelectableSocialAccount[]> {
    // Fetches the user's administrated pages (Graph API /me/accounts)
    const accountsUrl = `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,username,category,picture,access_token&access_token=${accessToken}`
    
    const res = await fetch(accountsUrl)
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new AccountDiscoveryError('facebook', err?.error?.message || 'Failed to query Facebook accounts.')
    }

    const data = await res.json()
    interface FacebookPageNode {
      id: string
      name: string
      username?: string
      category?: string
      picture?: {
        data?: {
          url?: string
        }
      }
      access_token?: string
    }
    const pages = (data.data || []) as FacebookPageNode[]

    return pages.map((page) => ({
      id: page.id,
      name: page.name,
      username: page.username || page.category,
      profileImageUrl: page.picture?.data?.url || '',
      accountType: 'page',
      accountUrl: `https://facebook.com/${page.id}`,
      capabilities: {
        analytics: true,
        posts: false
      },
      providerMetadata: {
        // Save the Page Access Token. This token has non-expiring validity and is used as the credential
        pageAccessToken: page.access_token,
        category: page.category
      }
    }))
  }

  public async validateConnection(accessToken: string): Promise<ConnectionHealthResult> {
    const debugUrl = `https://graph.facebook.com/me?fields=id,name&access_token=${accessToken}`
    try {
      const res = await fetch(debugUrl)
      if (res.ok) {
        return { status: 'valid' }
      }
      const err = await res.json().catch(() => ({}))
      const code = err?.error?.code
      if (code === 190) {
        return { status: 'expired', message: 'Meta access token has expired or been revoked.' }
      }
      return { status: 'provider_error', message: err?.error?.message || 'Meta Graph API error.' }
    } catch (e: unknown) {
      return { status: 'unknown', message: e instanceof Error ? e.message : 'Unknown transport error.' }
    }
  }

  // Analytics Extensions
  public getAnalyticsCapabilities() {
    return getFacebookAnalyticsCapabilities()
  }

  public async fetchAccountMetrics(connectionId: string, accessToken: string, providerAccountId: string, range: DateRange, providerMetadata?: Record<string, unknown>) {
    return fetchFacebookAccountMetrics(accessToken, providerAccountId, range, providerMetadata)
  }

  public async fetchContent(connectionId: string, accessToken: string, providerAccountId: string, range: DateRange, providerMetadata?: Record<string, unknown>) {
    return fetchFacebookContent(accessToken, providerAccountId, range, providerMetadata)
  }

  public async fetchContentMetrics(connectionId: string, accessToken: string, providerAccountId: string, providerContentIds: string[], range: DateRange, providerMetadata?: Record<string, unknown>) {
    return fetchFacebookContentMetrics(accessToken, providerAccountId, providerContentIds, range, providerMetadata)
  }
}

import {
  getFacebookAnalyticsCapabilities,
  fetchFacebookAccountMetrics,
  fetchFacebookContent,
  fetchFacebookContentMetrics
} from './analytics'
import { DateRange } from '@/lib/analytics/types'

