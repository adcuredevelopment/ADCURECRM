-- =====================================================
-- AdCure Portal - Performance Indexes
-- Migration: 20260410000003_indexes.sql
-- Run AFTER schema and RLS migrations
-- =====================================================

-- Users indexes
CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);

-- Wallets indexes
CREATE INDEX idx_wallets_org ON wallets(organization_id);

-- Ad accounts indexes
CREATE INDEX idx_ad_accounts_org ON ad_accounts(organization_id);
CREATE INDEX idx_ad_accounts_status ON ad_accounts(status);
CREATE INDEX idx_ad_accounts_platform ON ad_accounts(platform);

-- Transactions indexes (most queried table)
CREATE INDEX idx_transactions_wallet ON transactions(wallet_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_ad_account ON transactions(ad_account_id) WHERE ad_account_id IS NOT NULL;

-- Ad account requests indexes
CREATE INDEX idx_ad_account_requests_org ON ad_account_requests(organization_id);
CREATE INDEX idx_ad_account_requests_status ON ad_account_requests(status);

-- Invoices indexes
CREATE INDEX idx_invoices_org ON invoices(organization_id);
CREATE INDEX idx_invoices_transaction ON invoices(transaction_id);
CREATE INDEX idx_invoices_status ON invoices(status);
