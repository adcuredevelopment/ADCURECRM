-- =====================================================
-- AdCure Portal - RLS Policies (Fixed for Supabase SQL Editor)
-- Run this in: Supabase Dashboard → SQL Editor
-- =====================================================

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
-- Helper functions in public schema (Supabase compatible)
-- =====================================================
CREATE OR REPLACE FUNCTION public.user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM public.users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- =====================================================
-- ORGANIZATIONS policies
-- =====================================================
DROP POLICY IF EXISTS "Users can view own organization" ON organizations;
DROP POLICY IF EXISTS "Agency can view all organizations" ON organizations;
DROP POLICY IF EXISTS "Agency can manage all organizations" ON organizations;

CREATE POLICY "Users can view own organization"
  ON organizations FOR SELECT
  USING (id = public.user_organization_id());

CREATE POLICY "Agency can view all organizations"
  ON organizations FOR SELECT
  USING (public.user_role() = 'agency_admin');

CREATE POLICY "Agency can manage all organizations"
  ON organizations FOR ALL
  USING (public.user_role() = 'agency_admin');

-- =====================================================
-- USERS policies
-- =====================================================
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Agency can view all users" ON users;
DROP POLICY IF EXISTS "Agency can manage all users" ON users;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Agency can view all users"
  ON users FOR SELECT
  USING (public.user_role() = 'agency_admin');

CREATE POLICY "Agency can manage all users"
  ON users FOR ALL
  USING (public.user_role() = 'agency_admin');

-- =====================================================
-- WALLETS policies
-- =====================================================
DROP POLICY IF EXISTS "Clients can view own wallet" ON wallets;
DROP POLICY IF EXISTS "Agency can view all wallets" ON wallets;
DROP POLICY IF EXISTS "Agency can manage all wallets" ON wallets;

CREATE POLICY "Clients can view own wallet"
  ON wallets FOR SELECT
  USING (organization_id = public.user_organization_id());

CREATE POLICY "Agency can view all wallets"
  ON wallets FOR SELECT
  USING (public.user_role() = 'agency_admin');

CREATE POLICY "Agency can manage all wallets"
  ON wallets FOR ALL
  USING (public.user_role() = 'agency_admin');

-- =====================================================
-- AD ACCOUNTS policies
-- =====================================================
DROP POLICY IF EXISTS "Clients can view own ad accounts" ON ad_accounts;
DROP POLICY IF EXISTS "Agency can view all ad accounts" ON ad_accounts;
DROP POLICY IF EXISTS "Agency can manage all ad accounts" ON ad_accounts;

CREATE POLICY "Clients can view own ad accounts"
  ON ad_accounts FOR SELECT
  USING (organization_id = public.user_organization_id());

CREATE POLICY "Agency can view all ad accounts"
  ON ad_accounts FOR SELECT
  USING (public.user_role() = 'agency_admin');

CREATE POLICY "Agency can manage all ad accounts"
  ON ad_accounts FOR ALL
  USING (public.user_role() = 'agency_admin');

-- =====================================================
-- TRANSACTIONS policies
-- =====================================================
DROP POLICY IF EXISTS "Clients can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Clients can create own transactions" ON transactions;
DROP POLICY IF EXISTS "Agency can view all transactions" ON transactions;
DROP POLICY IF EXISTS "Agency can manage all transactions" ON transactions;

CREATE POLICY "Clients can view own transactions"
  ON transactions FOR SELECT
  USING (
    wallet_id IN (
      SELECT id FROM wallets WHERE organization_id = public.user_organization_id()
    )
  );

CREATE POLICY "Clients can create own transactions"
  ON transactions FOR INSERT
  WITH CHECK (
    wallet_id IN (
      SELECT id FROM wallets WHERE organization_id = public.user_organization_id()
    )
  );

CREATE POLICY "Agency can view all transactions"
  ON transactions FOR SELECT
  USING (public.user_role() = 'agency_admin');

CREATE POLICY "Agency can manage all transactions"
  ON transactions FOR ALL
  USING (public.user_role() = 'agency_admin');

-- =====================================================
-- AD ACCOUNT REQUESTS policies
-- =====================================================
DROP POLICY IF EXISTS "Clients can view own requests" ON ad_account_requests;
DROP POLICY IF EXISTS "Clients can create requests" ON ad_account_requests;
DROP POLICY IF EXISTS "Agency can view all requests" ON ad_account_requests;
DROP POLICY IF EXISTS "Agency can manage all requests" ON ad_account_requests;

CREATE POLICY "Clients can view own requests"
  ON ad_account_requests FOR SELECT
  USING (organization_id = public.user_organization_id());

CREATE POLICY "Clients can create requests"
  ON ad_account_requests FOR INSERT
  WITH CHECK (organization_id = public.user_organization_id());

CREATE POLICY "Agency can view all requests"
  ON ad_account_requests FOR SELECT
  USING (public.user_role() = 'agency_admin');

CREATE POLICY "Agency can manage all requests"
  ON ad_account_requests FOR ALL
  USING (public.user_role() = 'agency_admin');

-- =====================================================
-- INVOICES policies
-- =====================================================
DROP POLICY IF EXISTS "Clients can view own invoices" ON invoices;
DROP POLICY IF EXISTS "Agency can view all invoices" ON invoices;
DROP POLICY IF EXISTS "Agency can manage all invoices" ON invoices;

CREATE POLICY "Clients can view own invoices"
  ON invoices FOR SELECT
  USING (organization_id = public.user_organization_id());

CREATE POLICY "Agency can view all invoices"
  ON invoices FOR SELECT
  USING (public.user_role() = 'agency_admin');

CREATE POLICY "Agency can manage all invoices"
  ON invoices FOR ALL
  USING (public.user_role() = 'agency_admin');

-- =====================================================
-- INDEXES (Performance)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_wallets_org ON wallets(organization_id);
CREATE INDEX IF NOT EXISTS idx_ad_accounts_org ON ad_accounts(organization_id);
CREATE INDEX IF NOT EXISTS idx_ad_accounts_status ON ad_accounts(status);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ad_account_requests_org ON ad_account_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_ad_account_requests_status ON ad_account_requests(status);
CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_transaction ON invoices(transaction_id);
