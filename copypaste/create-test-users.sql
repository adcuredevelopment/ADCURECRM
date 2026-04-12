-- =====================================================
-- AdCure Portal - Test Gebruikers Aanmaken
-- Plak dit in: Supabase Dashboard → SQL Editor
-- URL: https://supabase.com/dashboard/project/inacrhrrwpmajlizjnum/sql/new
-- =====================================================

-- Stap 1: Maak agency admin aan via auth.users
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
) VALUES (
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
) ON CONFLICT (email) DO NOTHING
RETURNING id, email;

-- Stap 2: Maak test client aan via auth.users
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
) VALUES (
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
) ON CONFLICT (email) DO NOTHING
RETURNING id, email;

-- =====================================================
-- Na stap 1 en 2: kopieer de UUIDs die je terugkrijgt
-- Run dan stap 3 hieronder met de echte UUIDs
-- =====================================================

-- Stap 3: Haal de UUIDs op van de zojuist aangemaakte users
SELECT id, email FROM auth.users WHERE email IN ('admin@adcure.agency', 'client@test.com');
