-- =====================================================
-- Stap 1: Verwijder bestaande gebruikers
-- Plak dit in: Supabase Dashboard → SQL Editor
-- =====================================================

-- Verwijder eerst uit public.users (vanwege foreign key)
DELETE FROM public.users 
WHERE email IN ('admin@adcure.agency', 'client@test.com');

-- Verwijder dan uit auth.users
DELETE FROM auth.users 
WHERE email IN ('admin@adcure.agency', 'client@test.com');

-- Verificatie: moet 0 rows teruggeven
SELECT email FROM auth.users 
WHERE email IN ('admin@adcure.agency', 'client@test.com');
