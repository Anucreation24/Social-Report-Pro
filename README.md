# Social Report Pro — Production Release Candidate v1.0.0

**Social Report Pro** is an enterprise-grade social media analytics aggregation, historical sync, and white-label report generation engine built for digital marketing agencies and multi-company brand managers.

- **Production Deployment:** [https://social-report-pro.vercel.app](https://social-report-pro.vercel.app)
- **GitHub Repository:** [https://github.com/Anucreation24/Social-Report-Pro.git](https://github.com/Anucreation24/Social-Report-Pro.git)
- **Supabase Backend:** [https://utqcgethipyrnmmicdbb.supabase.co](https://utqcgethipyrnmmicdbb.supabase.co)

---

## Key Features

### 🏢 Multi-Company Agency Architecture
- Manage multiple client companies within a single agency workspace.
- Granular Role-Based Access Control (RBAC): `owner`, `admin`, `marketing_manager`, `viewer`, `client_viewer`.
- Strict company & client data isolation enforced via Supabase Row Level Security (RLS) policies and server-side route permission guards (`/access-denied`).

### 🔗 Social Platform Connectors & Sync Engine
- Direct OAuth 2.0 API connections for **Facebook Pages** and **YouTube Channels**.
- Connectors for **Instagram** and **TikTok**.
- AES-256-GCM authenticated encryption for access and refresh tokens.
- Source Priority Hierarchy: Ensures API data (Rank 1) takes priority over file imports (Ranks 2-3) and manual entries (Rank 4) without double counting.

### 📥 Universal Import Wizard & Reusable Profiles
- Drag-and-drop file import supporting `.csv` and `.xlsx` up to 10 MB.
- Heuristic platform signal detector (`platform-detector.ts`) automatically detecting Facebook, Instagram, YouTube, and TikTok exports with confidence scores.
- Report category detector (`account_summary` vs `content_performance`).
- Reusable import profiles (`import_profiles`) matching column signatures for instant 1-click ingestion.

### 📝 Manual Data Import & KPI Entry
- Safe fallback modules for manual KPI entry and manual post content metrics.
- Comprehensive unit normalizer supporting standard numbers, percentages, thousand multipliers (`K`, `M`, `B`), currency, and time durations (`MM:SS`, `HH:MM:SS`).

### 📄 Automated Report Generator & Snapshots
- 1-click weekly and monthly performance report generation.
- Immutable report snapshot engine capturing point-in-time metrics.
- High-fidelity PDF downloads (`@react-pdf/renderer`) and Excel spreadsheet exports (`exceljs`).
- Automated strategic executive summaries and prioritized recommendation engine.

### 👥 Client Portal & Shared Report Links
- Dedicated white-label Client Portal (`/client/*`) displaying performance overviews, top post cards, approved reports, and review actions.
- Cryptographically secure hashed report share links (`/shared/reports/[token]`) supporting expiration (1, 7, 30 days), revocation, optional password protection, and download controls.
- Client report review & approval workflow (`approved`, `revision_requested`, internal vs client-visible notes).

### 🎨 White-Label Branding System
- Brand customization (`/settings/branding`) supporting primary/secondary/accent hex colors, company logos, custom footer text, and welcome messages with a live preview simulator.
- Precedence hierarchy: Company Specific Branding > Agency Default Branding > System Fallback.

---

## Tech Stack & Architecture

- **Framework:** Next.js 16 (App Router + Turbopack + `src/proxy.ts` modernization)
- **UI & Styling:** React 19, Vanilla TailwindCSS v4, Lucide Icons, Recharts
- **Database & Auth:** Supabase PostgreSQL + Supabase Auth + Row Level Security (RLS)
- **File Parsing & Generation:** PapaParse (CSV), ExcelJS (Spreadsheets), @react-pdf/renderer (PDF Documents)
- **Testing & Quality:** Node Test Runner + tsx (75/75 passing), ESLint (0 errors), TypeScript (0 errors)

---

## Installation & Setup

### Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0
- Supabase Project

### Environment Configuration
Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ENCRYPTION_KEY=32_byte_hex_encryption_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret
```

### Local Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run unit and integration tests
npm run test

# Run TypeScript type check
npm run typecheck

# Run ESLint audit
npm run lint

# Build production bundle
npm run build
```

---

## Database Migrations

Apply all SQL migrations located in `supabase/migrations/` in chronological order:

1. `20260719000000_init_schema.sql` — Core schemas and member roles.
2. `20260719120000_stage1_settings_and_company_management.sql` — Workspace settings.
3. `20260719130000_stage2_connector_framework.sql` — OAuth connection tables.
4. `20260719140000_fix_stage2_connector_schema.sql` — Platform connection updates.
5. `20260719150000_fix_legacy_token_constraints.sql` — Token security updates.
6. `20260719160000_fix_credentials_rls.sql` — Credential encryption policies.
7. `20260719170000_add_store_encrypted_credentials_rpc.sql` — Token RPC function.
8. `20260722000000_stage3_historical_sync_engine.sql` — Analytics snapshots & content tables.
9. `20260722120000_repair_sync_engine_schema_and_rls.sql` — Analytics RLS policies.
10. `20260723000000_repair_stage3_missing_columns.sql` — Provider columns & indexes.
11. `20260723120000_stage4_report_generator.sql` — Generated reports tables.
12. `20260727120000_stage45_manual_import.sql` — Import batches & provenance columns.
13. `20260728000000_stage46_agency_client_portal.sql` — Share links, import profiles, branding, invitations, and notifications.

---

## License

Copyright © 2026 Social Report Pro. All rights reserved.
