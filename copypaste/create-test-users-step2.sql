-- =====================================================
-- AdCure Portal - Test Gebruikers Koppelen (Stap 2)
-- Vervang de UUIDs hieronder met de echte UUIDs uit stap 3
-- =====================================================

-- Vervang deze waarden met de UUIDs uit de vorige query:
DO $$
DECLARE
  agency_uuid UUID := 'PLAK-HIER-AGENCY-UUID';
  client_uuid UUID := 'PLAK-HIER-CLIENT-UUID';
BEGIN

  -- Koppel agency admin aan organisatie
  INSERT INTO public.users (id, organization_id, email, full_name, role)
  VALUES (
    agency_uuid,
    '00000000-0000-0000-0000-000000000001',
    'admin@adcure.agency',
    'AdCure Admin',
    'agency_admin'
  ) ON CONFLICT DO NOTHING;

  -- Koppel client aan organisatie
  INSERT INTO public.users (id, organization_id, email, full_name, role)
  VALUES (
    client_uuid,
    '00000000-0000-0000-0000-000000000002',
    'client@test.com',
    'Test Klant',
    'client'
  ) ON CONFLICT DO NOTHING;

  -- Wallet aanmaken voor test client (€1030,01)
  INSERT INTO public.wallets (organization_id, balance_cents, currency)
  VALUES ('00000000-0000-0000-0000-000000000002', 103001, 'EUR')
  ON CONFLICT DO NOTHING;

END $$;

-- Verificatie: check of alles correct staat
SELECT u.email, u.role, o.name as organisatie, w.balance_cents
FROM public.users u
JOIN public.organizations o ON o.id = u.organization_id
LEFT JOIN public.wallets w ON w.organization_id = u.organization_id;
