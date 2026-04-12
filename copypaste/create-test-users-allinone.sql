-- =====================================================
-- AdCure Portal - Test gebruikers aanmaken
-- Plak dit in: Supabase Dashboard → SQL Editor
-- =====================================================

-- Stap 1: Auth users aanmaken (alleen als ze nog niet bestaan)
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud
)
SELECT
  gen_random_uuid(),
  'admin@adcure.agency',
  crypt('Admin123!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"AdCure Admin"}'::jsonb,
  now(),
  now(),
  'authenticated',
  'authenticated'
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'admin@adcure.agency'
);

INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud
)
SELECT
  gen_random_uuid(),
  'client@test.com',
  crypt('Client123!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Test Klant"}'::jsonb,
  now(),
  now(),
  'authenticated',
  'authenticated'
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'client@test.com'
);

-- Stap 2: Public users koppelen (UUID automatisch opgehaald)
INSERT INTO public.users (id, organization_id, email, full_name, role)
SELECT 
  au.id,
  '00000000-0000-0000-0000-000000000001',
  'admin@adcure.agency',
  'AdCure Admin',
  'agency_admin'
FROM auth.users au
WHERE au.email = 'admin@adcure.agency'
AND NOT EXISTS (SELECT 1 FROM public.users WHERE email = 'admin@adcure.agency');

INSERT INTO public.users (id, organization_id, email, full_name, role)
SELECT 
  au.id,
  '00000000-0000-0000-0000-000000000002',
  'client@test.com',
  'Test Klant',
  'client'
FROM auth.users au
WHERE au.email = 'client@test.com'
AND NOT EXISTS (SELECT 1 FROM public.users WHERE email = 'client@test.com');

-- Stap 3: Wallet aanmaken voor test client
INSERT INTO public.wallets (organization_id, balance_cents, currency)
SELECT '00000000-0000-0000-0000-000000000002', 103001, 'EUR'
WHERE NOT EXISTS (
  SELECT 1 FROM public.wallets 
  WHERE organization_id = '00000000-0000-0000-0000-000000000002'
);

-- Verificatie: alles correct?
SELECT u.email, u.role, o.name as organisatie, w.balance_cents
FROM public.users u
JOIN public.organizations o ON o.id = u.organization_id
LEFT JOIN public.wallets w ON w.organization_id = u.organization_id;
