-- =====================================================
-- AdCure Portal - Initial Schema
-- Migration: 20260410000001_initial_schema.sql
-- Run this in Supabase SQL Editor
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
-- Links to Supabase auth.users
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
-- WALLETS (Client funds - one per organization)
-- Balances stored in cents to avoid floating point issues
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
-- CRITICAL: fee_percentage is VARIABLE per account (not fixed!)
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
-- type='top_up': Wallet deposit (bank transfer, no fee)
-- type='transfer': Ad account top-up (from wallet or bank transfer, fee applies)
-- type='refund': Money returned to wallet
-- type='adjustment': Manual admin balance correction
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
-- Clients submit → Admin copies to Google Sheet → Supplier creates account
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
-- INVOICES (Auto-generated from completed top-ups)
-- Linked to Moneybird for PDF generation + email
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
-- updated_at trigger function
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ad_accounts_updated_at
  BEFORE UPDATE ON ad_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ad_account_requests_updated_at
  BEFORE UPDATE ON ad_account_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
