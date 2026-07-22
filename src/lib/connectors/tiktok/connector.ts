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

export class TiktokConnector implements SocialPlatformConnector {
  public provider: SocialPlatform = 'tiktok'

  private getClientConfig() {
    const clientKey = process.env.TIKTOK_CLIENT_KEY
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET
    const redirectUri = process.env.TIKTOK_REDIRECT_URI

    return { clientKey, clientSecret, redirectUri }
  }

  public getCapabilities(): ProviderCapabilities {
    return {
      supportsOAuth: true,
      supportsAccountSelection: true,
      supportsTokenRefresh: true,
      supportsTokenRevocation: false,
      supportsAccountMetrics: true,
      supportsContentMetrics: true,
      supportsHistoricalReports: false,
      requiresProfessionalAccount: false,
      requiresAppReview: true
    }
  }

  public async getAuthorizationUrl(input: AuthorizationInput): Promise<AuthorizationResult> {
    const { clientKey, redirectUri } = this.getClientConfig()
    if (!clientKey) {
      throw new ConfigurationMissingError('tiktok', 'TIKTOK_CLIENT_KEY')
    }
    if (!redirectUri) {
      throw new ConfigurationMissingError('tiktok', 'TIKTOK_REDIRECT_URI')
    }

    const state = generateOAuthState(input.userId, input.companyId, 'tiktok', input.returnUrl)
    
    // Developer scopes for profile information and video performance details
    const scopes = ['user.info.basic', 'video.list']
    
    const url = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&scope=${encodeURIComponent(
      scopes.join(',')
    )}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&response_type=code`

    return { url, state }
  }

  public async exchangeAuthorizationCode(input: CallbackInput): Promise<TokenResult> {
    const { clientKey, clientSecret, redirectUri } = this.getClientConfig()
    if (!clientKey || !clientSecret || !redirectUri) {
      throw new ConfigurationMissingError('tiktok', 'TikTok developer credentials')
    }

    const res = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code: input.code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
      }).toString()
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new TokenExchangeError('tiktok', err?.error_description || 'Failed to exchange TikTok authorization code.', res.status)
    }

    const data = await res.json()
    
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      refreshTokenExpiresIn: data.refresh_expires_in,
      scopes: (data.scope || '').split(','),
      providerUserId: data.open_id
    }
  }

  public async refreshAccessToken(refreshToken: string): Promise<TokenResult> {
    const { clientKey, clientSecret } = this.getClientConfig()
    if (!clientKey || !clientSecret) {
      throw new ConfigurationMissingError('tiktok', 'TikTok developer credentials')
    }

    const res = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      }).toString()
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new TokenExchangeError('tiktok', err?.error_description || 'Failed to refresh TikTok access token.', res.status)
    }

    const data = await res.json()

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresIn: data.expires_in,
      refreshTokenExpiresIn: data.refresh_expires_in,
      scopes: (data.scope || '').split(',')
    }
  }

  public async revokeAccess(): Promise<void> {
    // TikTok revoke API isn't globally uniform, so we handle it cleanly by marking it disconnected client-side.
    console.warn('Revoke API call omitted for TikTok since connection handles clean disconnection client-side.')
  }

  public async getAvailableAccounts(accessToken: string): Promise<SelectableSocialAccount[]> {
    // Queries the user/info endpoint of TikTok's API
    const url = 'https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,username'
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new AccountDiscoveryError('tiktok', err?.error?.message || 'Failed to query TikTok profile.', res.status)
    }

    const data = await res.json()
    const user = data.data?.user

    if (!user) {
      throw new AccountDiscoveryError('tiktok', 'TikTok profile response is empty.')
    }

    return [{
      id: user.open_id,
      name: user.display_name || user.username || 'TikTok Account',
      username: user.username || 'tiktok_user',
      profileImageUrl: user.avatar_url || '',
      accountType: 'creator',
      accountUrl: `https://www.tiktok.com/@${user.username}`,
      capabilities: {
        analytics: true,
        posts: false
      },
      providerMetadata: {
        unionId: user.union_id
      }
    }]
  }

  public async validateConnection(accessToken: string): Promise<ConnectionHealthResult> {
    const testUrl = 'https://open.tiktokapis.com/v2/user/info/?fields=open_id'
    try {
      const res = await fetch(testUrl, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (res.ok) {
        return { status: 'valid' }
      }
      const err = await res.json().catch(() => ({}))
      if (err?.error?.code === 'access_token_invalid' || res.status === 401) {
        return { status: 'expired', message: 'TikTok access token has expired or is invalid.' }
      }
      return { status: 'provider_error', message: err?.error?.message || 'TikTok Open API error.' }
    } catch (e: unknown) {
      return { status: 'unknown', message: e instanceof Error ? e.message : 'Unknown transport error.' }
    }
  }

  // Analytics Extensions
  public getAnalyticsCapabilities() {
    return getTiktokAnalyticsCapabilities()
  }

  public async fetchAccountMetrics(connectionId: string, accessToken: string, providerAccountId: string, range: DateRange) {
    return fetchTiktokAccountMetrics(accessToken, providerAccountId, range)
  }

  public async fetchContent(connectionId: string, accessToken: string, providerAccountId: string, range: DateRange) {
    return fetchTiktokContent(accessToken, providerAccountId, range)
  }

  public async fetchContentMetrics(connectionId: string, accessToken: string, providerAccountId: string, providerContentIds: string[], range: DateRange) {
    return fetchTiktokContentMetrics(accessToken, providerAccountId, providerContentIds, range)
  }
}

import {
  getTiktokAnalyticsCapabilities,
  fetchTiktokAccountMetrics,
  fetchTiktokContent,
  fetchTiktokContentMetrics
} from './analytics'
import { DateRange } from '@/lib/analytics/types'

