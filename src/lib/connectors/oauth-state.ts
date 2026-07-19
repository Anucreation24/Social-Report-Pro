import crypto from 'crypto'

export interface OAuthStatePayload {
  userId: string
  companyId: string
  provider: string
  returnUrl: string
  nonce: string
  expiresAt: number
}

/**
 * Generates a signed, encrypted-like base64url state string binding auth metadata.
 */
export function generateOAuthState(
  userId: string,
  companyId: string,
  provider: string,
  returnUrl: string
): string {
  const secret = process.env.OAUTH_STATE_SECRET || process.env.TOKEN_ENCRYPTION_KEY
  if (!secret) {
    throw new Error('OAuth state secret is not configured')
  }

  const payload: OAuthStatePayload = {
    userId,
    companyId,
    provider,
    returnUrl,
    nonce: crypto.randomBytes(16).toString('hex'),
    expiresAt: Date.now() + 15 * 60 * 1000, // Valid for 15 minutes
  }

  const serialized = JSON.stringify(payload)
  const hmac = crypto.createHmac('sha256', secret).update(serialized).digest('hex')

  return `${Buffer.from(serialized).toString('base64url')}.${hmac}`
}

/**
 * Verifies the OAuth state signature, expiry, provider, and active session properties.
 */
export function verifyOAuthState(
  stateString: string,
  expectedProvider: string,
  currentUserId: string
): OAuthStatePayload {
  const secret = process.env.OAUTH_STATE_SECRET || process.env.TOKEN_ENCRYPTION_KEY
  if (!secret) {
    throw new Error('OAuth state secret is not configured')
  }

  if (!stateString) {
    throw new Error('Empty state parameter')
  }

  const parts = stateString.split('.')
  if (parts.length !== 2) {
    throw new Error('Malformed state parameter')
  }

  const base64Payload = parts[0]
  const receivedHmac = parts[1]

  const serialized = Buffer.from(base64Payload, 'base64url').toString('utf8')
  const computedHmac = crypto.createHmac('sha256', secret).update(serialized).digest('hex')

  if (computedHmac !== receivedHmac) {
    throw new Error('OAuth state signature verification failed (tampering detected)')
  }

  const payload: OAuthStatePayload = JSON.parse(serialized)

  // Verify expiry
  if (Date.now() > payload.expiresAt) {
    throw new Error('OAuth state session has expired')
  }

  // Verify provider matching
  if (payload.provider !== expectedProvider) {
    throw new Error('Social platform provider mismatch')
  }

  // Verify user binding
  if (payload.userId !== currentUserId) {
    throw new Error('OAuth session bound user mismatch')
  }

  return payload
}
