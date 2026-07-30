# Security Policy — Social Report Pro

Social Report Pro takes application security, data isolation, and cryptographic integrity seriously. This document outlines our security architecture, data handling practices, and disclosure procedures.

---

## 1. Security Architecture & Isolation

### Company & Client Data Isolation
- **Row Level Security (RLS):** Every database table (`companies`, `platform_connections`, `analytics_snapshots`, `content_items`, `content_metrics`, `data_import_batches`, `generated_reports`, `report_share_links`, `branding_settings`, `company_invitations`, `in_app_notifications`) is protected by Supabase RLS policies.
- **Server Action Permission Verification:** All server actions invoke `verifyCompanyPermission(companyId, allowedRoles)` to verify user membership and role privileges before executing any database operation.
- **Client Route Permission Guard:** Client users with the `client_viewer` role are restricted from visiting agency administration pages (`/connections`, `/imports/new`, `/manual-entry/new`, `/settings`, `/reports/generate`, `/members`) via server-side checks and redirected to `/access-denied`.

### Storage Security
- **Private Buckets:** Storage buckets `data-imports` and `report-exports` are strictly private. Public URL access is disabled.
- **Folder Isolation:** Storage objects are partitioned by company ID (`{companyId}/...`).
- **Short-Lived Signed URLs:** File downloads are served via short-lived signed URLs generated on-demand for authorized sessions only.

---

## 2. Cryptographic Security & Secrets Handling

- **OAuth Tokens:** Refresh tokens and access tokens are encrypted at rest using AES-256-GCM authenticated encryption before persistence.
- **Share Links & Invitation Tokens:** Raw security tokens are generated via `crypto.randomBytes(32)` and never stored in plain text. Only SHA-256 token hashes (`token_hash`) are persisted.
- **Password Protection:** Optional share link passwords are hashed using SHA-256 prior to comparison.
- **Environment Variables:** All secrets (`SUPABASE_SERVICE_ROLE_KEY`, `ENCRYPTION_KEY`, `FACEBOOK_APP_SECRET`, `YOUTUBE_CLIENT_SECRET`) are stored in secure environment variables and never exposed to the client bundle.

---

## 3. Vulnerability Reporting & Disclosure

If you discover a potential security vulnerability in Social Report Pro, please report it immediately to our security team:

- **Email:** `security@socialreportpro.com`
- **Response Time:** We acknowledge reports within 24 hours and aim to release fixes within 72 hours for critical findings.
