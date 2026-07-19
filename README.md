# Social Report Pro

Social Report Pro is a multi-company social media analytics and reporting SaaS platform. It connects business social media accounts, aggregates analytics, tracks performance KPIs, and generates weekly and monthly marketing reports.

Initially supported platforms:
- Facebook Pages
- Instagram Professional Accounts
- YouTube Channels
- TikTok Creator & Business Accounts

---

## 🛠️ Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database & Auth**: Supabase PostgreSQL & Auth (SSR-ready)
- **Forms & Validation**: React Hook Form, Zod
- **Icons**: Lucide React
- **Charts**: Recharts

---

## 🚀 Getting Started Locally

### 1. Clone & Set Up Directory
Clone the repository and install dependencies:
```bash
git clone https://github.com/Anucreation24/Social-Report-Pro.git
cd social-report-pro
npm install
```

### 2. Environment Configuration
Create a `.env.local` file in the root of the project using the template below:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

NEXT_PUBLIC_APP_URL=http://localhost:3000

# Social Auth Connectors (Stage 2 Placeholders)
META_APP_ID=
META_APP_SECRET=
META_REDIRECT_URI=http://localhost:3000/api/auth/callback/facebook

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback/google

TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=
TIKTOK_REDIRECT_URI=http://localhost:3000/api/auth/callback/tiktok

TOKEN_ENCRYPTION_KEY=super-secret-key-at-least-32-chars-long!!
CRON_SECRET=cron-secret-token-here
```

### 3. Database Migration Setup
Since the project is using a dedicated Supabase instance, you must execute the database migrations schema to create the required tables, helper functions, triggers, and Row Level Security (RLS) policies.

Copy and paste the SQL statements from the migration file [20260719000000_init_schema.sql](file:///C:/Users/Skyfall/.gemini/antigravity/scratch/social-report-pro/supabase/migrations/20260719000000_init_schema.sql) directly into your Supabase project **SQL Editor** and click **Run**.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```text
src/
├── app/                  # App Router Pages & Layouts
│   ├── (auth)/           # Auth Routes (Login, Register, Forgot Password, Reset)
│   ├── (dashboard)/      # Protected Dashboard & Analytics Switcher Pages
│   ├── onboarding/       # Company & Workspace Setup Flow
│   ├── layout.tsx        # App Root layout
│   └── page.tsx          # Product landing page
├── components/           # Reusable Components
│   └── providers/        # Context Providers (CompanyProvider)
├── features/             # Business Domain Features
│   ├── auth/             # Authentication State & Actions
│   └── companies/        # Multi-Company Actions & Configurations
├── lib/                  # Shared Utility Libraries
│   ├── supabase/         # Supabase client, server, and middleware SSR configs
│   ├── permissions.ts    # Role access permission guard helper
│   └── audit.ts          # Action Audit Logging Module
```

---

---

## 🔒 Security Architecture
- **Row Level Security (RLS)**: Enabled across all tables. Tenant isolation prevents companies from reading or writing other companies' data.
- **Role Enforcement**: User actions are constrained by company roles (`owner`, `admin`, `marketing_manager`, `viewer`). Enforced both via server actions and database RLS.
- **Audit Trails**: Security actions are recorded in `audit_logs` with automated token/credential redaction.
- **Browser Storage Security**: Browser Local Storage only maintains the non-secret UI state (`activeCompanyId`), whilst Session Storage is entirely empty. All session authentication uses encrypted secure cookies, and API secret keys are isolated exclusively on the server.

---

## ⚙️ Settings Module & Appearance Theme
- **Profile Configuration**: View account emails, update full names, customize avatars, and configure personal timezones.
- **Company Management**: Owners and administrators can edit active company identity settings or soft-delete (archive) companies.
- **Report & Notification Defaults**: Establish automated output preferences and customize in-app warning parameters.
- **Theme Switcher**: Integrates `next-themes` to support Light, Dark, and System default appearance preferences seamlessly across the dashboard layout shell.

---

## 🏛️ Database Migrations
1. **Initial Migration**: `supabase/migrations/20260719000000_init_schema.sql` establishes the initial SQL database structure and `handle_onboarding` RPC function.
2. **Settings & Company Management Migration**: `supabase/migrations/20260719120000_stage1_settings_and_company_management.sql` establishes `updated_at` triggers, `create_additional_company` RPC function, and extra policies.

To apply database tables, copy and paste the SQL content from **both** migration files into your Supabase **SQL Editor** and click **Run**.

---

## 🧪 Testing Commands
Run node permission tests:
```bash
npm run test
```
Run eslint validation check:
```bash
npm run lint
```
Run typescript check:
```bash
npm run typecheck
```
Build the production bundle:
```bash
npm run build
```
