# Stage 2 Acceptance Checklist

Use this document to verify completion of all **Social Platform Connector Framework** requirements.

---

## 1. Connector Abstractions
* [x] Standard `SocialPlatformConnector` contract defined.
* [x] Connector Registry implemented.
* [x] Centralized Meta API Graph versions config.
* [x] Provider capability mapping.
* [x] Configured vs Not Configured environmental state checks.

## 2. Security & Credentials Vault
* [x] **AES-256-GCM** encryption for access & refresh tokens.
* [x] Hashed secure 32-byte key derivation.
* [x] Unique IV nonces for identical plaintexts.
* [x] Version header support (`v1:...`) for key rotation.
* [x] Server-side credential isolation in `platform_credentials`.
* [x] Database security-definer helper checking user role before credential extraction.
* [x] Plaintext tokens never exposed to client bundles, network responses, or browser storage.

## 3. Signed OAuth State
* [x] State binds `userId`, `companyId`, `provider`, `nonce`, and `expiresAt`.
* [x] Signed with SHA-256 HMAC utilizing `OAUTH_STATE_SECRET`.
* [x] State expires in 15 minutes.
* [x] Mismatched users, expired timestamps, or tampered states rejected.

## 4. Connections UI & Workflow
* [x] Premium cards for Facebook, Instagram, YouTube, and TikTok.
* [x] Visually distinct connection status badges.
* [x] Discovered account details display (profiles, handles, thumbnails).
* [x] Manual validate connection trigger.
* [x] Safe disconnect trigger and credential purge.
* [x] Awaiting account selection redirects.
* [x] Tenant RLS isolation.

## 5. Account Selection Flow
* [x] Dynamic `/connections/[provider]/select-account` route.
* [x] Server-side validation of selected account against discovered accounts.
* [x] Single selected primary account constraint via partial unique database index.

## 6. Testing & Quality Gates
* [x] **12 new unit tests** for encryption, state verification, and capabilities.
* [x] All 31 test suites passing successfully.
* [x] **0 ESLint errors** reported.
* [x] **0 TypeScript errors** reported.
* [x] Production next build completed.
