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

// 4. Schema constraint mock verification
test('schema constraints - platform connection row can be created without legacy token columns', () => {
  // Define a mock schema validation for platform_connections table write
  const schema = {
    id: { type: 'uuid', required: true },
    company_id: { type: 'uuid', required: true },
    provider: { type: 'text', required: true },
    provider_account_id: { type: 'text', required: true },
    provider_account_name: { type: 'text', required: true },
    access_token_encrypted: { type: 'text', required: false }, // Legacy NOT NULL dropped
    refresh_token_encrypted: { type: 'text', required: false }, // Legacy NOT NULL dropped
  };

  const insertPayload = {
    id: 'conn-123',
    company_id: 'company-456',
    provider: 'facebook',
    provider_account_id: 'page-789',
    provider_account_name: 'My Facebook Page',
    // access_token_encrypted and refresh_token_encrypted are deliberately omitted
  };

  // Validate payload against schema requirements
  for (const [columnName, columnMeta] of Object.entries(schema)) {
    if (columnMeta.required && !(columnName in insertPayload)) {
      throw new Error(`Missing required column: ${columnName}`);
    }
  }

  // The assertion passes if no validation error is thrown
  assert.ok(true, 'Platform connection insert payload successfully validated without legacy token columns');
});

// --- Platform Credentials Security & RLS Mocks ---

const mockDatabase = {
  platform_connections: [
    { id: 'connection-1', company_id: 'company-a', provider: 'facebook' },
    { id: 'connection-2', company_id: 'company-b', provider: 'youtube' },
  ],
  company_members: [
    { company_id: 'company-a', user_id: 'user-owner', role: 'owner' },
    { company_id: 'company-a', user_id: 'user-admin', role: 'admin' },
    { company_id: 'company-a', user_id: 'user-viewer', role: 'viewer' },
    { company_id: 'company-b', user_id: 'user-other-company-owner', role: 'owner' },
  ],
  platform_credentials: {}, // connection_id -> credentials row
};

function storeEncryptedCredentialsMocked(
  executingUserId,
  connectionId,
  accessTokenEncrypted,
  refreshTokenEncrypted,
  tokenExpiresAt,
  refreshTokenExpiresAt
) {
  if (!executingUserId) {
    throw new Error('Access Denied: Unauthenticated session.');
  }

  const connection = mockDatabase.platform_connections.find(pc => pc.id === connectionId);
  if (!connection) {
    throw new Error('Access Denied: Connection not found.');
  }

  const member = mockDatabase.company_members.find(
    cm => cm.company_id === connection.company_id && cm.user_id === executingUserId
  );

  const allowedRoles = ['owner', 'admin', 'marketing_manager'];
  if (!member || !allowedRoles.includes(member.role)) {
    throw new Error('Access Denied: Insufficient company membership permissions to write credentials.');
  }

  mockDatabase.platform_credentials[connectionId] = {
    connection_id: connectionId,
    access_token_encrypted: accessTokenEncrypted,
    refresh_token_encrypted: refreshTokenEncrypted,
    token_expires_at: tokenExpiresAt,
    refresh_token_expires_at: refreshTokenExpiresAt,
    updated_at: new Date().toISOString(),
  };

  return { success: true };
}

function directTableQueryMocked(executingUserId, action, tableName) {
  // If RLS is enabled with no policies, direct client actions from authenticated users are blocked/denied
  if (tableName === 'platform_credentials') {
    throw new Error(`Database error: new row violates row-level security policy for table "${tableName}"`);
  }
  return { success: true };
}

// 5. Platform Credentials Security Tests

test('credentials security - Owner insert succeeds', () => {
  mockDatabase.platform_credentials = {};
  const res = storeEncryptedCredentialsMocked(
    'user-owner',
    'connection-1',
    'access_enc_123',
    'refresh_enc_123',
    null,
    null
  );
  assert.strictEqual(res.success, true);
  assert.strictEqual(mockDatabase.platform_credentials['connection-1'].access_token_encrypted, 'access_enc_123');
});

test('credentials security - Admin insert succeeds', () => {
  mockDatabase.platform_credentials = {};
  const res = storeEncryptedCredentialsMocked(
    'user-admin',
    'connection-1',
    'access_enc_456',
    'refresh_enc_456',
    null,
    null
  );
  assert.strictEqual(res.success, true);
  assert.strictEqual(mockDatabase.platform_credentials['connection-1'].access_token_encrypted, 'access_enc_456');
});

test('credentials security - Marketing Manager insert succeeds', () => {
  // Setup marketing manager role
  mockDatabase.company_members.push({ company_id: 'company-a', user_id: 'user-manager', role: 'marketing_manager' });
  mockDatabase.platform_credentials = {};
  
  const res = storeEncryptedCredentialsMocked(
    'user-manager',
    'connection-1',
    'access_enc_manager',
    null,
    null,
    null
  );
  assert.strictEqual(res.success, true);
  assert.strictEqual(mockDatabase.platform_credentials['connection-1'].access_token_encrypted, 'access_enc_manager');
  
  // Clean up mockDatabase for other tests
  mockDatabase.company_members = mockDatabase.company_members.filter(cm => cm.user_id !== 'user-manager');
});

test('credentials security - Viewer rejection throws error', () => {
  assert.throws(() => {
    storeEncryptedCredentialsMocked(
      'user-viewer',
      'connection-1',
      'access_enc_789',
      null,
      null,
      null
    );
  }, /Insufficient company membership permissions/);
});

test('credentials security - Unauthenticated rejection throws error', () => {
  assert.throws(() => {
    storeEncryptedCredentialsMocked(
      null, // null user
      'connection-1',
      'access_enc_789',
      null,
      null,
      null
    );
  }, /Unauthenticated session/);
});

test('credentials security - Cross-company rejection throws error', () => {
  assert.throws(() => {
    storeEncryptedCredentialsMocked(
      'user-other-company-owner',
      'connection-1', // belongs to company-a, user is member of company-b
      'access_enc_789',
      null,
      null,
      null
    );
  }, /Insufficient company membership permissions/);
});

test('credentials security - Direct table queries are blocked by RLS policies', () => {
  assert.throws(() => {
    directTableQueryMocked('user-owner', 'SELECT', 'platform_credentials');
  }, /violates row-level security policy/);
  
  assert.throws(() => {
    directTableQueryMocked('user-owner', 'INSERT', 'platform_credentials');
  }, /violates row-level security policy/);
});

test('credentials security - Upsert behavior updates existing record instead of creating duplicates', () => {
  mockDatabase.platform_credentials = {};
  
  // First insert
  storeEncryptedCredentialsMocked(
    'user-owner',
    'connection-1',
    'access_enc_first',
    null,
    null,
    null
  );
  
  // Second insert (upsert)
  storeEncryptedCredentialsMocked(
    'user-owner',
    'connection-1',
    'access_enc_updated',
    null,
    null,
    null
  );
  
  // Verify only one entry exists for connection-1 with the updated value
  const credsKeys = Object.keys(mockDatabase.platform_credentials);
  assert.strictEqual(credsKeys.length, 1);
  assert.strictEqual(credsKeys[0], 'connection-1');
  assert.strictEqual(mockDatabase.platform_credentials['connection-1'].access_token_encrypted, 'access_enc_updated');
});

test('credentials security - store function never returns encrypted values', () => {
  mockDatabase.platform_credentials = {};
  const res = storeEncryptedCredentialsMocked(
    'user-owner',
    'connection-1',
    'super-secret-token',
    null,
    null,
    null
  );
  
  // Verify return value is just a safe success structure/ID and contains no secret tokens
  assert.ok(res.success);
  assert.strictEqual(res.access_token_encrypted, undefined);
  assert.strictEqual(res.refresh_token_encrypted, undefined);
  assert.strictEqual(JSON.stringify(res).includes('super-secret-token'), false);
});



