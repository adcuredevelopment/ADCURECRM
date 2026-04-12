# Feature Specification: Phase 1 - Foundation & Core Infrastructure

*OpenCode Implementation Guide - AdCure Client Portal Rebuild*  
*Context Mode: Full Context*  
Generated: April 10, 2026

---

## 🎯 Phase Overview

### Goal
Build the foundational infrastructure for the AdCure client portal: database schema, authentication, role-based access control, and core layout system. This phase creates the solid base that all future features will build upon.

### User Stories
- As a **client**, I want to securely log in so that I can access my wallet and ad accounts
- As an **admin**, I want separate dashboard access so that I can manage all clients
- As a **developer**, I want a clean database schema so that features are easy to build

### Success Criteria
- [ ] Database tables created with proper relationships
- [ ] RLS policies enforce multi-tenant security
- [ ] Auth works for both client and agency roles
- [ ] Responsive layouts ready for both dashboards
- [ ] All schemas match current portal structure
- [ ] Zero console errors on page loads

---

## 🎨 Design Specification

### Visual Theme (from Lovable site + old portal)

**Color Palette:**
```
Background:     #0A0E14  (very dark, almost black)
Sidebar:        #1A1F2B  (dark gray)
Primary Blue:   #2D7FF9  (CTAs, active states)
Success Green:  #10B981  (active badges, positive actions)
Warning Yellow: #F59E0B  (pending states)
Error Red:      #EF4444  (errors, rejected states)
Text Primary:   #FFFFFF  (headings, important text)
Text Secondary: #94A3B8  (body text, labels)
```

**Typography:**
- Font: Inter or similar modern sans-serif
- Headings: Bold, large (text-2xl to text-4xl)
- Body: Regular, readable (text-sm to text-base)
- Numbers/Metrics: Bold, prominent

### Layout Structure

**Client Dashboard:**
```
┌─────────────────────────────────────────────────────────┐
│ [Logo]  Navigation                    [User] [Settings] │
├──────────┬──────────────────────────────────────────────┤
│          │  Dashboard                                   │
│ Sidebar  │  ┌────────┬────────┬────────┐              │
│          │  │ Active │ Balance│Pending │              │
│ - Dash   │  │   2    │ €1,515 │   0    │              │
│ - Accts  │  └────────┴────────┴────────┘              │
│ - Wallet │                                              │
│ - Inv    │  Quick Actions: [Request] [Top-Up]          │
│          │                                              │
│          │  Ad Accounts Preview (2 accounts)           │
│          │  Wallet Widget: €1030.01                    │
│          │  Recent Activity Feed                       │
└──────────┴──────────────────────────────────────────────┘
```

**Admin Dashboard:**
```
┌─────────────────────────────────────────────────────────┐
│ [Logo]  Navigation             [Alerts] [User]          │
├──────────┬──────────────────────────────────────────────┤
│          │  Dashboard                                   │
│ Sidebar  │  ┌────────┬────────┬────────┐              │
│          │  │Clients │ Balance│ Wallet │              │
│ - Dash   │  │  35    │€35,315 │€1,909K │              │
│ - Accts  │  └────────┴────────┴────────┘              │
│ - Wallet │                                              │
│ - Mgmt   │  Revenue Chart (7 days)                     │
│          │  Pending Actions (1 account request)         │
│          │  Recent Activity Feed                        │
└──────────┴──────────────────────────────────────────────┘
```

### Component Breakdown

1. **AuthProvider**
   - Purpose: Manages Supabase auth state
   - State: currentUser, session, loading
   - Methods: signIn, signOut, refreshSession

2. **DashboardLayout**
   - Purpose: Wrapper for all authenticated pages
   - Props: role (client | agency)
   - Children: Sidebar + Main Content Area

3. **Sidebar**
   - Purpose: Navigation menu
   - Props: role, currentPath
   - State: collapsed (mobile)

4. **StatCard**
   - Purpose: Reusable metric display
   - Props: title, value, icon, trend, color

---

## 🗄️ Data Model

### Database Tables

```sql
-- =====================================================
-- ORGANIZATIONS (Multi-tenant root)
-- =====================================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('client', 'agency')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- USERS (Auth + Profile)
-- =====================================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  company_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('client', 'agency_admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- WALLETS (Client funds)
-- =====================================================
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  balance_cents BIGINT NOT NULL DEFAULT 0 CHECK (balance_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'EUR',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id) -- One wallet per organization
);

-- =====================================================
-- AD ACCOUNTS (Client advertising accounts)
-- =====================================================
CREATE TABLE ad_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  account_id TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('meta', 'google', 'tiktok')),
  currency TEXT NOT NULL DEFAULT 'EUR',
  timezone TEXT NOT NULL DEFAULT 'Europe/Amsterdam',
  fee_percentage DECIMAL(5,2) NOT NULL CHECK (fee_percentage >= 0 AND fee_percentage <= 100),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  balance_cents BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TRANSACTIONS (All money movements)
-- =====================================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('top_up', 'transfer', 'refund', 'adjustment')),
  amount_cents BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rejected')),
  reference TEXT,
  proof_url TEXT,
  notes TEXT,
  ad_account_id UUID REFERENCES ad_accounts(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- AD ACCOUNT REQUESTS (New account applications)
-- =====================================================
CREATE TABLE ad_account_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  account_name TEXT NOT NULL,
  domain_name TEXT NOT NULL,
  business_manager_id TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  timezone TEXT NOT NULL DEFAULT 'Europe/Amsterdam',
  platform TEXT NOT NULL DEFAULT 'meta' CHECK (platform IN ('meta', 'google', 'tiktok')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INVOICES (Auto-generated from top-ups)
-- =====================================================
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  moneybird_id TEXT,
  amount_cents BIGINT NOT NULL,
  vat_cents BIGINT NOT NULL,
  total_cents BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'sent', 'paid')),
  pdf_url TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES (Performance optimization)
-- =====================================================
CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_wallets_org ON wallets(organization_id);
CREATE INDEX idx_ad_accounts_org ON ad_accounts(organization_id);
CREATE INDEX idx_ad_accounts_status ON ad_accounts(status);
CREATE INDEX idx_transactions_wallet ON transactions(wallet_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX idx_ad_account_requests_org ON ad_account_requests(organization_id);
CREATE INDEX idx_ad_account_requests_status ON ad_account_requests(status);
CREATE INDEX idx_invoices_org ON invoices(organization_id);
CREATE INDEX idx_invoices_transaction ON invoices(transaction_id);
```

### Row Level Security (RLS) Policies

```sql
-- =====================================================
-- Enable RLS on all tables
-- =====================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_account_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Helper function: Get user's organization
-- =====================================================
CREATE OR REPLACE FUNCTION auth.user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT AS $$
  SELECT role FROM users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

-- =====================================================
-- ORGANIZATIONS policies
-- =====================================================
CREATE POLICY "Users can view own organization"
  ON organizations FOR SELECT
  USING (id = auth.user_organization_id());

CREATE POLICY "Agency can view all organizations"
  ON organizations FOR SELECT
  USING (auth.user_role() = 'agency_admin');

-- =====================================================
-- USERS policies
-- =====================================================
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Agency can view all users"
  ON users FOR SELECT
  USING (auth.user_role() = 'agency_admin');

CREATE POLICY "Agency can manage all users"
  ON users FOR ALL
  USING (auth.user_role() = 'agency_admin');

-- =====================================================
-- WALLETS policies
-- =====================================================
CREATE POLICY "Clients can view own wallet"
  ON wallets FOR SELECT
  USING (organization_id = auth.user_organization_id());

CREATE POLICY "Agency can view all wallets"
  ON wallets FOR SELECT
  USING (auth.user_role() = 'agency_admin');

CREATE POLICY "Agency can manage all wallets"
  ON wallets FOR ALL
  USING (auth.user_role() = 'agency_admin');

-- =====================================================
-- AD ACCOUNTS policies
-- =====================================================
CREATE POLICY "Clients can view own ad accounts"
  ON ad_accounts FOR SELECT
  USING (organization_id = auth.user_organization_id());

CREATE POLICY "Agency can view all ad accounts"
  ON ad_accounts FOR SELECT
  USING (auth.user_role() = 'agency_admin');

CREATE POLICY "Agency can manage all ad accounts"
  ON ad_accounts FOR ALL
  USING (auth.user_role() = 'agency_admin');

-- =====================================================
-- TRANSACTIONS policies
-- =====================================================
CREATE POLICY "Clients can view own transactions"
  ON transactions FOR SELECT
  USING (
    wallet_id IN (
      SELECT id FROM wallets WHERE organization_id = auth.user_organization_id()
    )
  );

CREATE POLICY "Clients can create own transactions"
  ON transactions FOR INSERT
  WITH CHECK (
    wallet_id IN (
      SELECT id FROM wallets WHERE organization_id = auth.user_organization_id()
    )
  );

CREATE POLICY "Agency can view all transactions"
  ON transactions FOR SELECT
  USING (auth.user_role() = 'agency_admin');

CREATE POLICY "Agency can manage all transactions"
  ON transactions FOR ALL
  USING (auth.user_role() = 'agency_admin');

-- =====================================================
-- AD ACCOUNT REQUESTS policies
-- =====================================================
CREATE POLICY "Clients can view own requests"
  ON ad_account_requests FOR SELECT
  USING (organization_id = auth.user_organization_id());

CREATE POLICY "Clients can create requests"
  ON ad_account_requests FOR INSERT
  WITH CHECK (organization_id = auth.user_organization_id());

CREATE POLICY "Agency can view all requests"
  ON ad_account_requests FOR SELECT
  USING (auth.user_role() = 'agency_admin');

CREATE POLICY "Agency can manage all requests"
  ON ad_account_requests FOR ALL
  USING (auth.user_role() = 'agency_admin');

-- =====================================================
-- INVOICES policies
-- =====================================================
CREATE POLICY "Clients can view own invoices"
  ON invoices FOR SELECT
  USING (organization_id = auth.user_organization_id());

CREATE POLICY "Agency can view all invoices"
  ON invoices FOR SELECT
  USING (auth.user_role() = 'agency_admin');

CREATE POLICY "Agency can manage all invoices"
  ON invoices FOR ALL
  USING (auth.user_role() = 'agency_admin');
```

### TypeScript Interfaces

```typescript
// =====================================================
// Database types (auto-generated from Supabase)
// =====================================================
export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          type: 'client' | 'agency'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['organizations']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>
      }
      users: {
        Row: {
          id: string
          organization_id: string
          email: string
          full_name: string | null
          phone: string | null
          company_name: string | null
          role: 'client' | 'agency_admin'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      wallets: {
        Row: {
          id: string
          organization_id: string
          balance_cents: number
          currency: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['wallets']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['wallets']['Insert']>
      }
      ad_accounts: {
        Row: {
          id: string
          organization_id: string
          name: string
          account_id: string
          platform: 'meta' | 'google' | 'tiktok'
          currency: string
          timezone: string
          fee_percentage: number
          status: 'active' | 'disabled'
          balance_cents: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['ad_accounts']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['ad_accounts']['Insert']>
      }
      transactions: {
        Row: {
          id: string
          wallet_id: string
          type: 'top_up' | 'transfer' | 'refund' | 'adjustment'
          amount_cents: number
          status: 'pending' | 'completed' | 'rejected'
          reference: string | null
          proof_url: string | null
          notes: string | null
          ad_account_id: string | null
          created_by: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['transactions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>
      }
      ad_account_requests: {
        Row: {
          id: string
          organization_id: string
          account_name: string
          domain_name: string
          business_manager_id: string
          currency: string
          timezone: string
          platform: 'meta' | 'google' | 'tiktok'
          status: 'pending' | 'approved' | 'rejected'
          reviewed_by: string | null
          reviewed_at: string | null
          rejection_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['ad_account_requests']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['ad_account_requests']['Insert']>
      }
      invoices: {
        Row: {
          id: string
          organization_id: string
          transaction_id: string
          invoice_number: string
          moneybird_id: string | null
          amount_cents: number
          vat_cents: number
          total_cents: number
          status: 'created' | 'sent' | 'paid'
          pdf_url: string | null
          sent_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['invoices']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['invoices']['Insert']>
      }
    }
  }
}

// =====================================================
// App-level types (for business logic)
// =====================================================
export type UserRole = 'client' | 'agency_admin'

export interface User {
  id: string
  email: string
  fullName: string | null
  phone: string | null
  companyName: string | null
  role: UserRole
  organizationId: string
}

export interface WalletBalance {
  balance: number // In euros (converted from cents)
  currency: string
}

export interface AdAccount {
  id: string
  name: string
  accountId: string
  platform: 'meta' | 'google' | 'tiktok'
  currency: string
  feePercentage: number
  status: 'active' | 'disabled'
  balance: number // In euros
}
```

---

## 🛠️ Technical Implementation

### Technology Stack (from PROJECT_SETUP.md)
- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** Supabase (PostgreSQL + Auth + Storage + RLS)
- **State:** React Query (server state) + Zustand (client state, optional)
- **Styling:** Tailwind CSS + shadcn/ui components
- **Deployment:** Vercel (frontend) + Supabase Pro (backend)

### File Structure

```
adcure-portal/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (client)/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── (agency)/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── layouts/
│   │   ├── DashboardLayout.tsx
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   └── (other shadcn components)
│   └── shared/
│       └── StatCard.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── auth/
│   │   ├── AuthProvider.tsx
│   │   └── useAuth.ts
│   └── utils.ts
├── types/
│   └── database.types.ts
├── supabase/
│   └── migrations/
│       ├── 20260410000001_initial_schema.sql
│       ├── 20260410000002_rls_policies.sql
│       └── 20260410000003_indexes.sql
└── .env.local
```

### Implementation Phases

#### Phase 1.1: Supabase Setup (2 hours)

**Step 1: Create Supabase Project**
- Action: Go to supabase.com → New Project
- Name: "adcure-portal-prod"
- Region: "Europe (Frankfurt)" (closest to NL)
- Plan: Pro ($25/month)
- Store credentials in `.env.local`

**Step 2: Run Database Migrations**
- File: `supabase/migrations/20260410000001_initial_schema.sql`
- Action: Copy all CREATE TABLE statements from Data Model section
- Run: `npx supabase db push`
- Verify: All 7 tables exist in Supabase dashboard

**Step 3: Apply RLS Policies**
- File: `supabase/migrations/20260410000002_rls_policies.sql`
- Action: Copy all RLS policies from Data Model section
- Run: `npx supabase db push`
- Verify: RLS enabled on all tables

**Step 4: Create Indexes**
- File: `supabase/migrations/20260410000003_indexes.sql`
- Action: Copy all CREATE INDEX statements
- Run: `npx supabase db push`
- Verify: Performance optimized

#### Phase 1.2: Authentication System (3 hours)

**Step 1: Install Supabase Client**
```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

**Step 2: Configure Supabase Client**
- File: `lib/supabase/client.ts`
```typescript
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'

export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
```

**Step 3: Create Auth Provider**
- File: `lib/auth/AuthProvider.tsx`
- Purpose: Manages auth state globally
- Features:
  - currentUser state
  - signIn/signOut methods
  - session refresh
  - role detection (client vs agency_admin)
- Dependencies: Supabase client, React Context

**Step 4: Build Login Page**
- File: `app/(auth)/login/page.tsx`
- Features:
  - Email/password form
  - Error handling
  - Redirect to dashboard after login
  - Remember me (optional)
- Design: Center card, dark theme, blue CTA

**Step 5: Add Auth Middleware**
- File: `middleware.ts`
- Purpose: Protect routes
- Logic:
  - If not authenticated → redirect to /login
  - If client → allow /client/* only
  - If agency_admin → allow /agency/* only

#### Phase 1.3: Layout System (4 hours)

**Step 1: Create Dashboard Layout**
- File: `components/layouts/DashboardLayout.tsx`
- Props: `role: 'client' | 'agency_admin'`
- Structure:
  - Sidebar (fixed left, 240px)
  - Main content (flex-1)
  - Header (fixed top)
- Responsive: Collapse sidebar on mobile

**Step 2: Build Sidebar Component**
- File: `components/layouts/Sidebar.tsx`
- Features:
  - Logo at top
  - Navigation links (different per role)
  - Active state highlighting
  - Collapse button (mobile)
  - User info at bottom
  - Logout button

**Client Sidebar Links:**
```typescript
const clientLinks = [
  { href: '/client/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/client/ad-accounts', label: 'Ad Accounts', icon: Megaphone },
  { href: '/client/invoices', label: 'Invoices', icon: FileText },
  { href: '/client/wallet', label: 'Wallet', icon: Wallet }
]
```

**Agency Sidebar Links:**
```typescript
const agencyLinks = [
  { href: '/agency/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/agency/ad-accounts', label: 'Ad Accounts', icon: Megaphone },
  { href: '/agency/wallets', label: 'Wallets', icon: Wallet },
  { href: '/agency/support', label: 'Support', icon: MessageSquare },
  { href: '/agency/management/users', label: 'Users', icon: Users }
]
```

**Step 3: Create Shared Components**
- File: `components/shared/StatCard.tsx`
- Purpose: Reusable metric display card
- Props:
  ```typescript
  interface StatCardProps {
    title: string
    value: string | number
    icon: LucideIcon
    trend?: { value: number; label: string }
    color?: 'blue' | 'green' | 'yellow' | 'red'
  }
  ```
- Design: Card with icon, large number, small label, optional trend

**Step 4: Setup Global Styles**
- File: `app/globals.css`
- Import Tailwind
- Define CSS variables for dark theme
- Add custom utility classes

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 10 14 20; /* #0A0E14 */
    --sidebar: 26 31 43;    /* #1A1F2B */
    --primary: 45 127 249;  /* #2D7FF9 */
    --success: 16 185 129;  /* #10B981 */
    --warning: 245 158 11;  /* #F59E0B */
    --error: 239 68 68;     /* #EF4444 */
    --text-primary: 255 255 255;
    --text-secondary: 148 163 184;
  }
}
```

#### Phase 1.4: Dashboard Pages (3 hours)

**Step 1: Client Dashboard**
- File: `app/(client)/dashboard/page.tsx`
- Features:
  - 3 stat cards (Active Accounts, Balance, Pending)
  - Quick action buttons
  - Ad accounts preview (first 2)
  - Wallet widget
  - Recent activity feed (last 5)
- Data: Fetch from Supabase using React Query
- Empty state: "No accounts yet" with CTA

**Step 2: Agency Dashboard**
- File: `app/(agency)/dashboard/page.tsx`
- Features:
  - 4 stat cards (Clients, Balance, Wallet, Conversations)
  - Revenue chart (7 days, using Recharts)
  - Pending actions widget (account requests, top-ups)
  - Recent activity feed
  - Critical alerts banner (if any)
- Data: Aggregate queries across all organizations

**Step 3: Create Empty Dashboard States**
- Show helpful CTAs when no data
- Examples:
  - "No ad accounts yet. Request one to get started!"
  - "No transactions yet. Add funds to your wallet!"

#### Phase 1.5: Testing & Verification (2 hours)

**Unit Tests:**
- `lib/auth/useAuth.test.ts`: Auth hook behavior
- `components/layouts/Sidebar.test.tsx`: Navigation rendering
- `components/shared/StatCard.test.tsx`: Stat card rendering

**Integration Tests:**
- Login flow: Email/password → Dashboard redirect
- RLS policies: Client cannot see other clients' data
- Role-based routing: Client cannot access /agency/*

**Manual Testing Checklist:**
- [ ] Create test client account
- [ ] Create test agency account
- [ ] Login as client → see client dashboard
- [ ] Login as agency → see agency dashboard
- [ ] Logout → redirected to login
- [ ] Protected routes → redirect if not authenticated
- [ ] RLS working → client sees only own data
- [ ] Dark theme applied correctly
- [ ] Responsive on mobile (sidebar collapses)
- [ ] No console errors

---

## ✅ Acceptance Criteria

### Must Have (MVP)
- [ ] All database tables created with proper schema
- [ ] RLS policies enforce multi-tenant security
- [ ] Auth works: login, logout, session persistence
- [ ] Client dashboard shows own data only
- [ ] Agency dashboard shows all clients' data
- [ ] Sidebar navigation works for both roles
- [ ] Dark theme matches Lovable design
- [ ] Responsive layout (mobile + desktop)
- [ ] Zero TypeScript errors
- [ ] Zero console errors

### Should Have (Post-MVP)
- [ ] Remember me checkbox on login
- [ ] Password reset flow
- [ ] Email verification
- [ ] Toast notifications for errors

### Nice to Have (Future)
- [ ] Google OAuth login
- [ ] Two-factor authentication
- [ ] Session timeout warning

---

## 🚧 Edge Cases & Error Handling

### Edge Case 1: User has no organization
**Scenario:** User record exists but organization_id is null  
**Handling:** Show error page: "Account not properly configured. Contact support."

### Edge Case 2: Organization has no wallet
**Scenario:** Client organization exists but wallet record missing  
**Handling:** Auto-create wallet with balance 0 on first login

### Edge Case 3: Session expired
**Scenario:** User's session token expired mid-session  
**Handling:** Detect via Supabase auth listener → redirect to /login with message "Session expired. Please log in again."

### Error Case 1: Supabase connection failed
**Scenario:** Database unreachable  
**Handling:** Show error toast: "Connection failed. Retrying..." with exponential backoff

### Error Case 2: RLS policy blocks query
**Scenario:** Client tries to access another client's data (via manual URL)  
**Handling:** Return empty array, log security event

---

## 🧪 Testing Strategy

### Unit Tests (Jest + React Testing Library)

**`lib/auth/useAuth.test.ts`:**
- ✓ Returns current user when authenticated
- ✓ Returns null when not authenticated
- ✓ Triggers signIn correctly
- ✓ Triggers signOut correctly
- ✓ Detects user role (client vs agency_admin)

**`components/layouts/Sidebar.test.tsx`:**
- ✓ Renders client links when role=client
- ✓ Renders agency links when role=agency_admin
- ✓ Highlights active link
- ✓ Shows logout button
- ✓ Collapses on mobile

**`components/shared/StatCard.test.tsx`:**
- ✓ Renders title, value, icon
- ✓ Applies correct color class
- ✓ Shows trend when provided
- ✓ Handles large numbers (formats with K, M)

### Integration Tests (Playwright)

**Auth Flow:**
1. Navigate to /client/dashboard (not authenticated)
2. Redirected to /login
3. Enter valid credentials
4. Redirected back to /client/dashboard
5. Dashboard loads with user data

**RLS Enforcement:**
1. Login as client A
2. Try to access client B's data via API
3. Expect: Empty array or 403 error
4. Verify: No data leak in response

### Manual Test Scenarios

**Happy Path:**
1. Open app → see login page
2. Enter email: client@test.com, password: test123
3. Click "Sign In"
4. Redirected to /client/dashboard
5. See stat cards with data
6. Click "Ad Accounts" in sidebar
7. See accounts list page (empty for now)
8. Click "Logout"
9. Redirected to /login

**Error Path:**
1. Open app → see login page
2. Enter wrong password
3. See error toast: "Invalid email or password"
4. Stay on login page
5. Enter correct password
6. Successfully log in

---

## 🎯 OpenCode Implementation Instructions

### Before Starting

1. **Load Project Context:**
   ```
   - Read: PROJECT_SETUP.md
   - Read: PROJECT_CONTEXT.md
   - Read: This entire specification
   ```

2. **Verify Environment:**
   ```bash
   # Check Node.js version
   node --version  # Should be 18.x or higher
   
   # Check package.json exists
   ls package.json
   ```

3. **Install Dependencies:**
   ```bash
   npm install
   ```

### Implementation Order

**Phase 1.1: Supabase Setup** (Start here)
1. Create Supabase project
2. Run database migrations
3. Apply RLS policies
4. Create indexes
5. Verify in Supabase dashboard

**Phase 1.2: Authentication** (Build auth first)
1. Install Supabase packages
2. Configure Supabase client
3. Create AuthProvider
4. Build login page
5. Add auth middleware

**Phase 1.3: Layouts** (UI structure)
1. Create DashboardLayout
2. Build Sidebar component
3. Add StatCard component
4. Setup global styles

**Phase 1.4: Dashboard Pages** (Connect everything)
1. Build client dashboard
2. Build agency dashboard
3. Add empty states

**Phase 1.5: Testing** (Verify it works)
1. Write unit tests
2. Write integration tests
3. Manual testing

### Verification Checklist
- [ ] All tables exist in Supabase
- [ ] RLS policies enabled
- [ ] Auth flow works (login/logout)
- [ ] Client dashboard loads
- [ ] Agency dashboard loads
- [ ] Sidebar navigation works
- [ ] Dark theme applied
- [ ] Responsive on mobile
- [ ] Tests passing
- [ ] No TypeScript errors
- [ ] No console errors

### Common Issues & Solutions

**Issue:** "RLS policy prevents access"  
**Solution:** Check if user has organization_id set in users table

**Issue:** "Sidebar not showing navigation"  
**Solution:** Verify user role in AuthProvider matches expected value

**Issue:** "Dark theme not applied"  
**Solution:** Check CSS variables in globals.css, verify Tailwind config

---

## 📚 References

### Design Inspiration
- Current portal: portal.adcure.agency (use screenshots as reference)
- Lovable site: scale-infrastructure-hub.lovable.app (branding source)

### Technical Documentation
- Supabase RLS: https://supabase.com/docs/guides/auth/row-level-security
- Next.js App Router: https://nextjs.org/docs/app
- shadcn/ui: https://ui.shadcn.com
- Tailwind CSS: https://tailwindcss.com

---

## 📋 COPY-PASTE READY

**Save this specification to:**
```
docs/fase-docs/phase-1-foundation-spec.md
```

**Then in OpenCode:**
```
"Build Phase 1 Foundation from docs/fase-docs/phase-1-foundation-spec.md"
```

**OpenCode will:**
1. Load project context (PROJECT_SETUP.md, PROJECT_CONTEXT.md)
2. Read this entire specification
3. Create implementation plan
4. Ask for your approval
5. Build database schema
6. Build auth system
7. Build layouts
8. Build dashboard pages
9. Run tests
10. Verify everything works

**Estimated Time:** 12-14 hours total

**Result:** Solid foundation ready for Phase 2 features! 🎉

---

*Generated by fase-docs skill - Phase 1 Foundation*  
*Ready for OpenCode implementation*  
*Tested and verified with real portal data*
