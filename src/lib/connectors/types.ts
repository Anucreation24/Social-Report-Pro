export type SocialPlatform = 'facebook' | 'instagram' | 'youtube' | 'tiktok'

export interface ProviderCapabilities {
  supportsOAuth: boolean
  supportsAccountSelection: boolean
  supportsTokenRefresh: boolean
  supportsTokenRevocation: boolean
  supportsAccountMetrics: boolean
  supportsContentMetrics: boolean
  supportsHistoricalReports: boolean
  requiresProfessionalAccount: boolean
  requiresAppReview: boolean
}

export interface AuthorizationInput {
  userId: string
  companyId: string
  returnUrl: string
}

export interface AuthorizationResult {
  url: string
  state: string
}

export interface CallbackInput {
  code: string
  state: string
  userId: string
}

export interface TokenResult {
  accessToken: string
  refreshToken?: string
  expiresIn?: number // in seconds
  refreshTokenExpiresIn?: number // in seconds
  scopes: string[]
  providerUserId?: string
}

export interface SelectableSocialAccount {
  id: string
  name: string
  username?: string
  profileImageUrl?: string
  accountType?: string
  accountUrl?: string
  capabilities: Record<string, boolean>
  providerMetadata?: Record<string, unknown>
}

export interface ConnectionHealthResult {
  status: 'valid' | 'expired' | 'expiring_soon' | 'missing_scope' | 'revoked' | 'provider_error' | 'unknown'
  message?: string
}

export interface SocialPlatformConnector {
  provider: SocialPlatform
  getCapabilities(): ProviderCapabilities
  getAuthorizationUrl(input: AuthorizationInput): Promise<AuthorizationResult>
  exchangeAuthorizationCode(input: CallbackInput): Promise<TokenResult>
  refreshAccessToken(refreshToken: string): Promise<TokenResult>
  revokeAccess(accessToken: string): Promise<void>
  getAvailableAccounts(accessToken: string): Promise<SelectableSocialAccount[]>
  validateConnection(accessToken: string): Promise<ConnectionHealthResult>
}
