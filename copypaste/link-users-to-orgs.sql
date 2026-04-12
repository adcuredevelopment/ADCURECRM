-- =====================================================
-- AdCure Portal - Users koppelen aan organisaties
-- Plak dit in: Supabase Dashboard → SQL Editor
-- =====================================================

-- Koppel agency admin aan organisatie
INSERT INTO public.users (id, organization_id, email, full_name, role)
VALUES (
  'a224c51e-8815-4cd6-bd5b-d39d18032af1',
  '00000000-0000-0000-0000-000000000001',
  'admin@adcure.agency',
  'AdCure Admin',
  'agency_admin'
);

-- Koppel client aan organisatie
INSERT INTO public.users (id, organization_id, email, full_name, role)
VALUES (
  '04a1fb09-6837-472f-bde8-7e4972ed63e9',
  '00000000-0000-0000-0000-000000000002',
  'client@test.com',
  'Test Klant',
  'client'
);

-- Wallet aanmaken voor test client (€1030,01)
INSERT INTO public.wallets (organization_id, balance_cents, currency)
VALUES ('00000000-0000-0000-0000-000000000002', 103001, 'EUR')
ON CONFLICT DO NOTHING;

-- Verificatie
SELECT u.email, u.role, o.name as organisatie, w.balance_cents
FROM public.users u
JOIN public.organizations o ON o.id = u.organization_id
LEFT JOIN public.wallets w ON w.organization_id = u.organization_id;
