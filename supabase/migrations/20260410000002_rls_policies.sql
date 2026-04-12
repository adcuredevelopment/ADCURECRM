-- =====================================================
-- AdCure Portal - Row Level Security Policies
-- Migration: 20260410000002_rls_policies.sql
-- CRITICAL: Run AFTER initial_schema.sql
-- These policies enforce multi-tenant data isolation
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
-- Helper functions (SECURITY DEFINER to bypass RLS)
-- These run as the function owner, not the calling user
-- =====================================================

-- Get the organization_id of the currently authenticated user
CREATE OR REPLACE FUNCTION auth.user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM public.users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Get the role of the currently authenticated user
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- =====================================================
-- ORGANIZATIONS policies
-- Clients see only their org; admins see all
-- =====================================================
CREATE POLICY "Users can view own organization"
  ON organizations FOR SELECT
  USING (id = auth.user_organization_id());

CREATE POLICY "Agency can view all organizations"
  ON organizations FOR SELECT
  USING (auth.user_role() = 'agency_admin');

CREATE POLICY "Agency can manage all organizations"
  ON organizations FOR ALL
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
-- Clients see only their own wallet; admins see all
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
-- Clients see only their org's accounts; admins see all
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
-- Clients see transactions for their own wallet only
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
-- Clients see and create their own requests; admins manage all
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
-- Clients see their own invoices; admins see all
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
