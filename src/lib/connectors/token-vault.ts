import crypto from 'crypto'

/**
 * Validates the encryption configuration at startup.
 * Returns true if valid, false or throws if invalid.
 */
export function validateEncryptionConfig(): boolean {
  const key = process.env.TOKEN_ENCRYPTION_KEY
  if (!key) {
    console.error('CRITICAL: TOKEN_ENCRYPTION_KEY is missing from environment.')
    return false
  }
  if (key.length < 32) {
    console.warn('WARNING: TOKEN_ENCRYPTION_KEY is less than 32 characters. It will be hashed for safety.')
  }
  return true
}

/**
 * Encrypts raw token text using AES-256-GCM.
 * Output format: v1:iv_hex:tag_hex:ciphertext_hex
 */
export function encryptToken(text: string): string {
  if (!text) {
    throw new Error('Cannot encrypt empty or null token text')
  }

  const key = process.env.TOKEN_ENCRYPTION_KEY
  if (!key) {
    throw new Error('TOKEN_ENCRYPTION_KEY is not configured')
  }

  // Derive a secure 32-byte key from the configured key using SHA-256
  const secureKey = crypto.createHash('sha256').update(key).digest()
  const iv = crypto.randomBytes(12) // GCM standard IV size is 12 bytes

  const cipher = crypto.createCipheriv('aes-256-gcm', secureKey, iv)
  
  let ciphertext = cipher.update(text, 'utf8', 'hex')
  ciphertext += cipher.final('hex')

  const tag = cipher.getAuthTag().toString('hex')

  return `v1:${iv.toString('hex')}:${tag}:${ciphertext}`
}

/**
 * Decrypts cipher text back into plain text token.
 */
export function decryptToken(encryptedText: string): string {
  if (!encryptedText) {
    throw new Error('Cannot decrypt empty cipher text')
  }

  const key = process.env.TOKEN_ENCRYPTION_KEY
  if (!key) {
    throw new Error('TOKEN_ENCRYPTION_KEY is not configured')
  }

  const parts = encryptedText.split(':')
  if (parts.length !== 4 || parts[0] !== 'v1') {
    throw new Error('Invalid or unsupported encryption format version')
  }

  const ivHex = parts[1]
  const tagHex = parts[2]
  const ciphertextHex = parts[3]

  const secureKey = crypto.createHash('sha256').update(key).digest()
  const iv = Buffer.from(ivHex, 'hex')
  const tag = Buffer.from(tagHex, 'hex')

  const decipher = crypto.createDecipheriv('aes-256-gcm', secureKey, iv)
  decipher.setAuthTag(tag)

  let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
