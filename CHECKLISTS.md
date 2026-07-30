# Production Checklists — Social Report Pro v1.0.0

---

## 1. Production Deployment Checklist

- [ ] **Environment Secrets Verification:**
  - `NEXT_PUBLIC_SUPABASE_URL` configured.
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` configured.
  - `SUPABASE_SERVICE_ROLE_KEY` configured.
  - `ENCRYPTION_KEY` configured (32-byte hex key for AES-256-GCM).
  - `NEXT_PUBLIC_APP_URL` set to production domain (`https://social-report-pro.vercel.app`).
  - `FACEBOOK_APP_ID` & `FACEBOOK_APP_SECRET` configured in Vercel environment.
  - `YOUTUBE_CLIENT_ID` & `YOUTUBE_CLIENT_SECRET` configured in Vercel environment.
- [ ] **Database Migrations:**
  - Apply all SQL migration scripts in chronological order (`20260719000000_init_schema.sql` through `20260728000000_stage46_agency_client_portal.sql`).
  - Verify `NOTIFY pgrst, 'reload schema'` reloads Supabase PostgREST schema cache.
- [ ] **Storage Buckets Initialization:**
  - Create private bucket `data-imports`.
  - Create private bucket `report-exports`.
  - Verify RLS policies on `storage.objects`.
- [ ] **Build & Quality Verification:**
  - Run `npm run test` (100% pass).
  - Run `npm run lint` (0 errors).
  - Run `npm run typecheck` (0 errors).
  - Run `npm run build` (Clean Next.js production compilation).

---

## 2. Backup Checklist

- [ ] **Database Backup:**
  - Schedule daily automated Supabase point-in-time recovery (PITR) backups.
  - Take manual pre-deployment SQL dump (`pg_dump`).
- [ ] **Storage Objects Backup:**
  - Verify storage mirror for `data-imports` and `report-exports`.

---

## 3. Rollback Checklist

- [ ] **Vercel Instant Rollback:**
  - If a production build fails post-deployment, trigger instant 1-click deployment rollback in Vercel dashboard to previous deployment commit.
- [ ] **Database Rollback:**
  - In case of a database issue, restore database to pre-deployment snapshot via Supabase PITR timestamp restore.

---

## 4. Disaster Recovery Checklist

- [ ] **Primary Region Failover:**
  - Monitor Vercel Edge Network and Supabase region health metrics.
- [ ] **Key Rotation Plan:**
  - Document procedure to re-encrypt stored OAuth tokens using a new `ENCRYPTION_KEY` if key compromise is suspected.
