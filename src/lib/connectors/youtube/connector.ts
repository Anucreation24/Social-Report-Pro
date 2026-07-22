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

export class YoutubeConnector implements SocialPlatformConnector {
  public provider: SocialPlatform = 'youtube'

  private getClientConfig() {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = process.env.GOOGLE_REDIRECT_URI

    return { clientId, clientSecret, redirectUri }
  }

  public getCapabilities(): ProviderCapabilities {
    return {
      supportsOAuth: true,
      supportsAccountSelection: true,
      supportsTokenRefresh: true,
      supportsTokenRevocation: true,
      supportsAccountMetrics: true,
      supportsContentMetrics: true,
      supportsHistoricalReports: true,
      requiresProfessionalAccount: false,
      requiresAppReview: false
    }
  }

  public async getAuthorizationUrl(input: AuthorizationInput): Promise<AuthorizationResult> {
    const { clientId, redirectUri } = this.getClientConfig()
    if (!clientId) {
      throw new ConfigurationMissingError('youtube', 'GOOGLE_CLIENT_ID')
    }
    if (!redirectUri) {
      throw new ConfigurationMissingError('youtube', 'GOOGLE_REDIRECT_URI')
    }

    const state = generateOAuthState(input.userId, input.companyId, 'youtube', input.returnUrl)

    const scopes = [
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/yt-analytics.readonly',
      'openid',
      'email'
    ]

    // Using prompt=consent & access_type=offline forces Google to return a refresh token
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=${encodeURIComponent(scopes.join(' '))}&state=${state}&access_type=offline&prompt=consent`

    return { url, state }
  }

  public async exchangeAuthorizationCode(input: CallbackInput): Promise<TokenResult> {
    const { clientId, clientSecret, redirectUri } = this.getClientConfig()
    if (!clientId || !clientSecret || !redirectUri) {
      throw new ConfigurationMissingError('youtube', 'Google API credentials')
    }

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        code: input.code
      }).toString()
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new TokenExchangeError('youtube', err?.error_description || 'Failed to exchange Google OAuth code.', res.status)
    }

    const data = await res.json()
    
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      scopes: (data.scope || '').split(' ')
    }
  }

  public async refreshAccessToken(refreshToken: string): Promise<TokenResult> {
    const { clientId, clientSecret } = this.getClientConfig()
    if (!clientId || !clientSecret) {
      throw new ConfigurationMissingError('youtube', 'Google API credentials')
    }

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      }).toString()
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new TokenExchangeError('youtube', err?.error_description || 'Failed to refresh YouTube access token.', res.status)
    }

    const data = await res.json()

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken, // Google may not send a new refresh token if it's still valid
      expiresIn: data.expires_in,
      scopes: (data.scope || '').split(' ')
    }
  }

  public async revokeAccess(accessToken: string): Promise<void> {
    const res = await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
    if (!res.ok) {
      console.warn('Failed to cleanly revoke Google OAuth token permissions on Google server.')
    }
  }

  public async getAvailableAccounts(accessToken: string): Promise<SelectableSocialAccount[]> {
    // Queries the YouTube Data API channels endpoint
    const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&mine=true`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new AccountDiscoveryError('youtube', err?.error?.message || 'Failed to discover YouTube channels.', res.status)
    }

    const data = await res.json()
    interface YoutubeChannelNode {
      id: string
      snippet?: {
        title?: string
        customUrl?: string
        thumbnails?: {
          default?: {
            url?: string
          }
        }
      }
      contentDetails?: {
        relatedPlaylists?: {
          uploads?: string
        }
      }
    }
    const items = (data.items || []) as YoutubeChannelNode[]

    return items.map((item) => ({
      id: item.id,
      name: item.snippet?.title || 'YouTube Channel',
      username: item.snippet?.customUrl || `@channel_${item.id}`,
      profileImageUrl: item.snippet?.thumbnails?.default?.url || '',
      accountType: 'channel',
      accountUrl: `https://youtube.com/${item.snippet?.customUrl || 'channel/' + item.id}`,
      capabilities: {
        analytics: true,
        posts: false
      },
      providerMetadata: {
        uploadsPlaylistId: item.contentDetails?.relatedPlaylists?.uploads
      }
    }))
  }

  public async validateConnection(accessToken: string): Promise<ConnectionHealthResult> {
    // Basic test query to validate credentials
    const testUrl = 'https://www.googleapis.com/oauth2/v3/tokeninfo'
    try {
      const res = await fetch(`${testUrl}?access_token=${accessToken}`)
      if (res.ok) {
        return { status: 'valid' }
      }
      const err = await res.json().catch(() => ({}))
      if (res.status === 400 && err?.error_description?.includes('Invalid Value')) {
        return { status: 'expired', message: 'Google access token is invalid or expired.' }
      }
      return { status: 'provider_error', message: err?.error_description || 'Google API verification error.' }
    } catch (e: unknown) {
      return { status: 'unknown', message: e instanceof Error ? e.message : 'Unknown transport error.' }
    }
  }

  // Analytics Extensions
  public getAnalyticsCapabilities() {
    return getYoutubeAnalyticsCapabilities()
  }

  public async fetchAccountMetrics(connectionId: string, accessToken: string, providerAccountId: string, range: DateRange) {
    return fetchYoutubeAccountMetrics(accessToken, providerAccountId, range)
  }

  public async fetchContent(connectionId: string, accessToken: string, providerAccountId: string, range: DateRange) {
    return fetchYoutubeContent(accessToken, providerAccountId, range)
  }

  public async fetchContentMetrics(connectionId: string, accessToken: string, providerAccountId: string, providerContentIds: string[], range: DateRange) {
    return fetchYoutubeContentMetrics(accessToken, providerAccountId, providerContentIds, range)
  }
}

import {
  getYoutubeAnalyticsCapabilities,
  fetchYoutubeAccountMetrics,
  fetchYoutubeContent,
  fetchYoutubeContentMetrics
} from './analytics'
import { DateRange } from '@/lib/analytics/types'

