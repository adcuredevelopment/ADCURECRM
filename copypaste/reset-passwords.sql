-- =====================================================
-- AdCure Portal - Wachtwoorden resetten
-- Plak dit in: Supabase Dashboard → SQL Editor
-- URL: https://supabase.com/dashboard/project/inacrhrrwpmajlizjnum/sql/new
-- =====================================================

UPDATE auth.users
SET encrypted_password = crypt('Admin123!', gen_salt('bf'))
WHERE email = 'admin@adcure.agency';

UPDATE auth.users
SET encrypted_password = crypt('Client123!', gen_salt('bf'))
WHERE email = 'client@test.com';

-- Verificatie
SELECT email, created_at FROM auth.users 
WHERE email IN ('admin@adcure.agency', 'client@test.com');
