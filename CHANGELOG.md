# Changelog — Social Report Pro

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-07-30

### Added
- **Stage 1 — Core Foundation**: Multi-company workspace architecture, Supabase auth integration, user profile management, company members & role-based permissions (`owner`, `admin`, `marketing_manager`, `viewer`).
- **Stage 2 — Social Connector Framework**: Official Facebook Graph API & YouTube Data API OAuth connectors, token encryption via AES-256-GCM, connector state management, and connection health diagnostics.
- **Stage 3 — Historical Analytics Sync Engine**: Incremental snapshot sync engine (`analytics_snapshots`, `content_items`, `content_metrics`), error log tracking (`sync_jobs`, `sync_logs`), and deduplicated metrics aggregation (`audience_total`, `views`, `engagements`, `reach`, `impressions`).
- **Stage 4 — Professional Report Generator**: Automated weekly & monthly report generator, immutable report snapshot engine, PDF rendering (`@react-pdf/renderer`), Excel spreadsheet generation (`exceljs`), and report history library.
- **Stage 4.5 — Manual Data Import & Manual KPI Entry**: CSV and XLSX upload parser (`papaparse`, `exceljs`), manual KPI entry form, manual content performance form, unit normalization engine, date parser, fuzzy column auto-mapping, deduplication checksums, and source priority hierarchy (Rank 1 API > Rank 2 CSV > Rank 3 Excel > Rank 4 Manual).
- **Stage 4.6 — Agency & Client Portal + Universal Import Wizard**:
  - Simplified Client Portal (`/client/*`) with dedicated `client_viewer` role and server-side route permission guards ([/access-denied](file:///C:/Users/Skyfall/.gemini/antigravity/scratch/social-report-pro/src/app/access-denied/page.tsx)).
  - Agency Operations Hub (`/agency`) and Client Directory (`/clients`).
  - Client Invitations with SHA-256 token hashing (`/invitations/accept`).
  - Hashed Secure Report Share Links (`/shared/reports/[token]`) with expiration, revocation, password protection, and download controls.
  - Universal Import Wizard (`/imports/new`) featuring automatic platform signal detector (`platform-detector.ts`), report type detector (`report-type-detector.ts`), and reusable import profiles (`import_profiles`).
  - Agency & Client Branding engine (`branding-engine.ts`) with custom colors, logos, and live preview ([/settings/branding](file:///C:/Users/Skyfall/.gemini/antigravity/scratch/social-report-pro/src/app/\(dashboard\)/settings/branding/page.tsx)).
  - Client Report Review & Approval workflow (`client_report_reviews`, `client_report_comments`).
  - In-App Notifications system (`in_app_notifications`).
- **Production QA Sprint**: Modernized Next.js proxy convention (`src/proxy.ts`), updated dependencies, performed RLS and storage security audits, verified zero ESLint / TypeScript errors, and passed 100% of 75 automated unit and integration tests.

### Fixed
- Fixed Facebook impressions permission fallback display notice.
- Fixed React Compiler `setState` in effect warnings across dashboard & report components.
- Fixed TypeScript type safety across Server Actions and Client Components.
