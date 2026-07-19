# OAuth State Security Architecture

This document describes the security patterns implemented in Stage 2 to secure third-party redirects and prevent CSRF and Session Hijacking.

---

## 1. Attack Vectors Prevented
1. **CSRF (Cross-Site Request Forgery)**: An attacker tricks a logged-in user into completing an OAuth callback using the attacker's authorization code, binding the victim's social account to the attacker's company dashboard.
2. **State Tampering**: Manipulating state parameters to override target companies or users.
3. **Session Replay**: Re-submitting an already used state parameter.
4. **Open Redirects**: External actors injecting malicious redirect links into the state parameters.

---

## 2. Secure Signed State Payload
The `generateOAuthState` helper creates a cryptographically signed payload binding:
```typescript
interface OAuthStatePayload {
  userId: string        // Currently authenticated Supabase User ID
  companyId: string     // Active Company context UUID
  provider: string      // 'facebook' | 'instagram' | 'youtube' | 'tiktok'
  returnUrl: string     // Safe, verified return URL
  nonce: string         // Cryptographically secure random nonce
  expiresAt: number     // Unix timestamp (15 minutes expiry)
}
```

---

## 3. Cryptographic Signature
1. The payload is JSON-serialized.
2. A HMAC-SHA256 signature is calculated using the server-only `OAUTH_STATE_SECRET`.
3. The state parameter is formatted as:
   `Base64Url(Payload).HMAC_Hex`

---

## 4. Verification Controls
During the callback:
1. **Signature Match**: We re-compute the HMAC signature. Any tampered payload character fails matching.
2. **Expiration check**: Rejects states older than 15 minutes.
3. **User Binding check**: Asserts that the authenticated Supabase user ID matches the `userId` embedded in the state payload.
4. **Provider check**: Asserts that the callback matches the state's intended provider.
5. **Role Check**: Re-verifies that the user still has membership permissions for the target `companyId` in the database.
