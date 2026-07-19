# Social Report Pro — PostgreSQL Database & RLS Model

This document maps out the normalized PostgreSQL database schema, updated_at triggers, Row Level Security (RLS) helpers, and secure RPC transaction functions.

---

## 🗄️ Database Tables Overview

| Table Name | Primary Key | Foreign Keys / References | Description |
| :--- | :--- | :--- | :--- |
| `profiles` | `id` | `auth.users(id)` | User accounts directory (avatar, name, personal timezone). |
| `workspaces` | `id` | `profiles(id)` | Tenant boundary workspace. |
| `workspace_members` | `id` | `workspaces(id)`, `profiles(id)` | Member role mappings (`owner`, `admin`, `member`). |
| `companies` | `id` | `workspaces(id)`, `profiles(id)` | Isolated client companies. |
| `company_members` | `id` | `companies(id)`, `profiles(id)` | Company role permissions (`owner`, `admin`, `marketing_manager`, `viewer`). |
| `company_preferences` | `company_id` | `companies(id)` | Custom reports configurations. |
| `user_preferences` | `user_id` | `profiles(id)` | User workspace settings (theme, notifications). |
| `audit_logs` | `id` | `workspaces(id)`, `companies(id)`, `profiles(id)` | Audit trail table. |

---

## 🛡️ Row Level Security Policies

PostgreSQL RLS policies are enabled across all tables. Tenant isolation is enforced using these security-definer helper functions:

1. **`is_company_member(comp_id)`**:
   Assures the logged-in user (`auth.uid()`) belongs to the company's member directory.

2. **`has_company_role(comp_id, roles[])`**:
   Checks if the user has one of the allowed roles (e.g. `ARRAY['owner', 'admin']` to change settings, or `ARRAY['owner', 'admin', 'marketing_manager']` to edit goals/reports).

---

## 🏗️ Secure RPC Transactions

To protect against orphan rows or incomplete data states (such as a company created without preferences or member mappings), onboarding operations are processed transaction-safely inside PostgreSQL RPCs:

- **`handle_onboarding(...)`**: Used during first-time signup to atomically initialize a workspace, profile mapping, company profile, owner role, default theme, and free subscription.
- **`create_additional_company(...)`**: Used for subsequent company creations. Verifies active workspace admin status before creating a new company profile and owner mapping atomically.
