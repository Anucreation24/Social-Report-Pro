# Release Notes — Social Report Pro v1.0.0

**Release Date:** July 30, 2026  
**Build Target:** Next.js 16 (App Router + Turbopack)  
**Database Backend:** Supabase Postgres + RLS  
**Production URL:** https://social-report-pro.vercel.app  

---

## Executive Summary

Social Report Pro v1.0.0 is the official Production Release Candidate for the enterprise social analytics & automated agency reporting platform. Built for digital agencies and multi-brand organizations, Social Report Pro bridges direct social API connectivity (Meta Facebook, YouTube, Instagram, TikTok) with file imports (CSV, Excel) and manual data entry into a unified, source-prioritized analytics engine.

---

## Key Features & Platform Highlights

### 1. Multi-Company Agency Hierarchy & Access Control
- Isolated workspace architecture supporting multiple client companies per agency.
- Granular Role-Based Access Control (RBAC): `owner`, `admin`, `marketing_manager`, `viewer`, and `client_viewer`.
- Server-side route permission guards enforcing strict client access restrictions (`/access-denied`).

### 2. Social Platform Connectors & Historical Sync Engine
- Direct OAuth 2.0 integration for Facebook Pages and YouTube Channels.
- AES-256-GCM encrypted token storage with automatic refresh.
- Source Priority Engine: Ensures API data (Rank 1) takes priority over file imports (Ranks 2-3) and manual entries (Rank 4) without double counting.

### 3. Automated Weekly & Monthly Report Generator
- 1-click weekly and monthly performance report creation.
- Immutable snapshot engine capturing point-in-time metrics.
- High-fidelity PDF document rendering and Excel spreadsheet exports.
- Strategic executive summary and recommendation rules.

### 4. Client Portal & Shared Report Links
- White-label Client Portal (`/client/*`) displaying client-facing analytics, post cards, approved reports, and review/approval actions.
- Secure, token-hashed share links (`/shared/reports/[token]`) featuring expiration (1-30 days), revocation, optional password protection, and download controls.

### 5. Universal Data Import Wizard & Reusable Profiles
- Drag-and-drop CSV/XLSX file upload.
- Deterministic heuristic signal platform detection (`platform-detector.ts`) and report category detection.
- Reusable import profiles (`import_profiles`) matching column signatures for instant 1-click ingestion.

### 6. Agency & Client Branding Customization
- White-label brand customization (`/settings/branding`) supporting custom primary/secondary/accent hex colors, logos, footer text, and welcome messages with live preview.

---

## Technical Audit & Verification Results

- **Unit & Integration Test Suite:** 75 / 75 passing (100%).
- **ESLint Code Quality Audit:** 0 Errors.
- **TypeScript Static Analysis:** 0 Errors.
- **Next.js Production Build:** 37 routes generated successfully.
- **Security Audit:** 100% private Supabase storage buckets (`data-imports`, `report-exports`), Row Level Security (RLS) policies on all 12+ tables, SHA-256 token hashing, and server-side authorization checks on all Server Actions.
