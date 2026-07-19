/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('assert');
const test = require('node:test');
const crypto = require('crypto');

// 1. Token Encryption Implementation Mimic (AES-256-GCM)
function encryptToken(text, key) {
  if (!text) throw new Error('Cannot encrypt empty or null token text');
  if (!key) throw new Error('TOKEN_ENCRYPTION_KEY is not configured');

  const secureKey = crypto.createHash('sha256').update(key).digest();
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv('aes-256-gcm', secureKey, iv);
  
  let ciphertext = cipher.update(text, 'utf8', 'hex');
  ciphertext += cipher.final('hex');

  const tag = cipher.getAuthTag().toString('hex');

  return `v1:${iv.toString('hex')}:${tag}:${ciphertext}`;
}

function decryptToken(encryptedText, key) {
  if (!encryptedText) throw new Error('Cannot decrypt empty cipher text');
  if (!key) throw new Error('TOKEN_ENCRYPTION_KEY is not configured');

  const parts = encryptedText.split(':');
  if (parts.length !== 4 || parts[0] !== 'v1') {
    throw new Error('Invalid or unsupported encryption format version');
  }

  const ivHex = parts[1];
  const tagHex = parts[2];
  const ciphertextHex = parts[3];

  const secureKey = crypto.createHash('sha256').update(key).digest();
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', secureKey, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// 2. OAuth State Security Mimic
function generateOAuthState(userId, companyId, provider, returnUrl, secret) {
  if (!secret) throw new Error('OAuth state secret is not configured');

  const payload = {
    userId,
    companyId,
    provider,
    returnUrl,
    nonce: crypto.randomBytes(16).toString('hex'),
    expiresAt: Date.now() + 15 * 60 * 1000, // Valid for 15 minutes
  };

  const serialized = JSON.stringify(payload);
  const hmac = crypto.createHmac('sha256', secret).update(serialized).digest('hex');

  return `${Buffer.from(serialized).toString('base64url')}.${hmac}`;
}

function verifyOAuthState(stateString, expectedProvider, currentUserId, secret) {
  if (!secret) throw new Error('OAuth state secret is not configured');
  if (!stateString) throw new Error('Empty state parameter');

  const parts = stateString.split('.');
  if (parts.length !== 2) throw new Error('Malformed state parameter');

  const base64Payload = parts[0];
  const receivedHmac = parts[1];

  const serialized = Buffer.from(base64Payload, 'base64url').toString('utf8');
  const computedHmac = crypto.createHmac('sha256', secret).update(serialized).digest('hex');

  if (computedHmac !== receivedHmac) {
    throw new Error('OAuth state signature verification failed (tampering detected)');
  }

  const payload = JSON.parse(serialized);

  if (Date.now() > payload.expiresAt) {
    throw new Error('OAuth state session has expired');
  }

  if (payload.provider !== expectedProvider) {
    throw new Error('Social platform provider mismatch');
  }

  if (payload.userId !== currentUserId) {
    throw new Error('OAuth session bound user mismatch');
  }

  return payload;
}

// Connector Capability mapping mock
const platformCapabilities = {
  facebook: {
    supportsOAuth: true,
    supportsAccountSelection: true,
    supportsTokenRefresh: false,
    supportsTokenRevocation: true,
    requiresProfessionalAccount: false,
  },
  instagram: {
    supportsOAuth: true,
    supportsAccountSelection: true,
    supportsTokenRefresh: false,
    supportsTokenRevocation: true,
    requiresProfessionalAccount: true,
  },
  youtube: {
    supportsOAuth: true,
    supportsAccountSelection: true,
    supportsTokenRefresh: true,
    supportsTokenRevocation: true,
    requiresProfessionalAccount: false,
  },
  tiktok: {
    supportsOAuth: true,
    supportsAccountSelection: true,
    supportsTokenRefresh: true,
    supportsTokenRevocation: false,
    requiresProfessionalAccount: false,
  }
};

// --- Test Suites ---

// 1. Encryption and Decryption Tests
test('token encryption - encrypt / decrypt round trip works', () => {
  const key = 'my-super-secret-encryption-key-phrase';
  const token = 'facebook_long_lived_page_token_123456';
  
  const cipher = encryptToken(token, key);
  const plain = decryptToken(cipher, key);
  
  assert.strictEqual(plain, token);
  assert.ok(cipher.startsWith('v1:'));
});

test('token encryption - produces different ciphertexts for same plaintext', () => {
  const key = 'my-super-secret-encryption-key-phrase';
  const token = 'secret_access_token';
  
  const cipher1 = encryptToken(token, key);
  const cipher2 = encryptToken(token, key);
  
  assert.notStrictEqual(cipher1, cipher2);
});

test('token encryption - rejects tampered auth tag', () => {
  const key = 'my-super-secret-encryption-key-phrase';
  const token = 'secret_access_token';
  const cipher = encryptToken(token, key);
  
  const parts = cipher.split(':');
  // Tamper tag
  parts[2] = parts[2].substring(0, parts[2].length - 2) + 'ff';
  const tamperedCipher = parts.join(':');
  
  assert.throws(() => {
    decryptToken(tamperedCipher, key);
  });
});

test('token encryption - rejects wrong key', () => {
  const token = 'secret_access_token';
  const cipher = encryptToken(token, 'key-one');
  
  assert.throws(() => {
    decryptToken(cipher, 'key-two');
  });
});

test('token encryption - rejects empty token', () => {
  assert.throws(() => {
    encryptToken('', 'some-key');
  });
});

// 2. OAuth State Verification Tests
test('oauth state - signs and verifies successfully', () => {
  const secret = 'my-oauth-state-signing-secret';
  const state = generateOAuthState('user123', 'company456', 'youtube', 'http://localhost/connections', secret);
  
  const payload = verifyOAuthState(state, 'youtube', 'user123', secret);
  
  assert.strictEqual(payload.userId, 'user123');
  assert.strictEqual(payload.companyId, 'company456');
  assert.strictEqual(payload.provider, 'youtube');
  assert.strictEqual(payload.returnUrl, 'http://localhost/connections');
});

test('oauth state - rejects expired state', () => {
  const secret = 'my-oauth-state-signing-secret';
  // Generate a mock payload that is already expired
  const payload = {
    userId: 'user123',
    companyId: 'company456',
    provider: 'youtube',
    returnUrl: 'http://localhost/connections',
    nonce: 'random',
    expiresAt: Date.now() - 1000 // Expired 1 second ago
  };

  const serialized = JSON.stringify(payload);
  const hmac = crypto.createHmac('sha256', secret).update(serialized).digest('hex');
  const state = `${Buffer.from(serialized).toString('base64url')}.${hmac}`;
  
  assert.throws(() => {
    verifyOAuthState(state, 'youtube', 'user123', secret);
  }, /expired/);
});

test('oauth state - detects state signature tampering', () => {
  const secret = 'my-oauth-state-signing-secret';
  const state = generateOAuthState('user123', 'company456', 'youtube', 'http://localhost/connections', secret);
  
  const parts = state.split('.');
  // Tamper the signature part
  parts[1] = parts[1].substring(0, parts[1].length - 2) + 'ab';
  const tamperedState = parts.join('.');
  
  assert.throws(() => {
    verifyOAuthState(tamperedState, 'youtube', 'user123', secret);
  }, /tampering detected/);
});

test('oauth state - rejects wrong user callback bind', () => {
  const secret = 'my-oauth-state-signing-secret';
  const state = generateOAuthState('user123', 'company456', 'youtube', 'http://localhost/connections', secret);
  
  assert.throws(() => {
    verifyOAuthState(state, 'youtube', 'different_user', secret);
  }, /user mismatch/);
});

test('oauth state - rejects wrong provider callback bind', () => {
  const secret = 'my-oauth-state-signing-secret';
  const state = generateOAuthState('user123', 'company456', 'youtube', 'http://localhost/connections', secret);
  
  assert.throws(() => {
    verifyOAuthState(state, 'facebook', 'user123', secret);
  }, /provider mismatch/);
});

// 3. Provider Capabilities Mapping Tests
test('capabilities - matches instagram professional account requirement', () => {
  assert.strictEqual(platformCapabilities.instagram.requiresProfessionalAccount, true);
  assert.strictEqual(platformCapabilities.facebook.requiresProfessionalAccount, false);
});

test('capabilities - matches youtube refresh token support', () => {
  assert.strictEqual(platformCapabilities.youtube.supportsTokenRefresh, true);
  assert.strictEqual(platformCapabilities.facebook.supportsTokenRefresh, false);
});
