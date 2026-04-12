-- =====================================================
-- AdCure Portal - Test Ad Accounts aanmaken
-- Plak dit in: Supabase Dashboard → SQL Editor
-- =====================================================

INSERT INTO public.ad_accounts (
  organization_id, name, account_id, platform, currency, timezone, fee_percentage, status, balance_cents
) VALUES
(
  '00000000-0000-0000-0000-000000000002',
  'Test Business Campaign',
  '123456789012345',
  'meta',
  'EUR',
  'Europe/Amsterdam',
  5.00,
  'active',
  151500
),
(
  '00000000-0000-0000-0000-000000000002',
  'Google Ads Account',
  '987-654-3210',
  'google',
  'EUR',
  'Europe/Amsterdam',
  3.00,
  'active',
  75000
),
(
  '00000000-0000-0000-0000-000000000002',
  'TikTok Campaign',
  'TT-99887766',
  'tiktok',
  'USD',
  'America/New_York',
  4.50,
  'disabled',
  0
);

-- Verificatie
SELECT name, platform, fee_percentage, status, balance_cents 
FROM public.ad_accounts 
WHERE organization_id = '00000000-0000-0000-0000-000000000002';
