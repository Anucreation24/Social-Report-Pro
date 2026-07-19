# Browser Storage & Session Security Audit

This document reports the findings of a security audit performed on the browser storage mechanisms and session parameters used by **Social Report Pro**.

---

## 🔍 Audit Summary

| Storage Location | Configured Keys / Contents | Secret Exposure Risks | Purpose |
| :--- | :--- | :--- | :--- |
| **Local Storage** | `activeCompanyId` (UUID string) | None (Non-secret UX key) | Remembers selected active company across page reloads. |
| **Session Storage** | *None (Empty)* | None | N/A |
| **Cookies** | `sb-access-token` / `sb-refresh-token` | None (Standard Supabase HTTPOnly-configured SSR cookies) | Maintains authentication session securely. |

---

## 🛡️ Key Authorization Rules

1. **Local Storage is Never Used for Authorization**:
   - The value `activeCompanyId` is strictly a user-experience preference.
   - The server verifies workspace and company membership for **every single request** (via Server Actions, Middleware, and Database Row Level Security).
   - If an attacker tampers with the `activeCompanyId` key to reference another company, all subsequent reads and writes will be rejected by PostgreSQL RLS.

2. **No Secret Tokens Stored in Browser**:
   - Third-party social platform connection OAuth tokens (Facebook, Instagram, YouTube, TikTok) are **never** returned or stored in client-side local or session storage.
   - All access and refresh tokens are encrypted on the server using `TOKEN_ENCRYPTION_KEY` and saved securely in `platform_connections` table.

3. **Public vs Server-Only Configs**:
   - Environment variables such as `SUPABASE_SERVICE_ROLE_KEY`, `META_APP_SECRET`, `GOOGLE_CLIENT_SECRET`, and `TOKEN_ENCRYPTION_KEY` are isolated on the server and never bundled into the client build.

---

## 💻 Manual Inspection Guide

To verify storage items inside your browser manually, follow these instructions:

### Inspect Local Storage
1. Open your browser **Developer Tools** (F12 or Right Click -> Inspect).
2. Click the **Application** (Chrome/Edge) or **Storage** (Firefox) tab.
3. In the left sidebar, expand **Local Storage** and select your application domain (e.g. `http://localhost:3000`).
4. Assert that `activeCompanyId` is the **only** custom key present.

### Inspect Session Storage
1. Under Developer Tools, expand **Session Storage** in the left sidebar.
2. Select your application domain.
3. Assert that it is **entirely empty**.

### Inspect Session Cookies
1. Expand **Cookies** in the left sidebar.
2. Assert that only standard session keys prefixed with `sb-` (for Supabase Auth) are listed.
