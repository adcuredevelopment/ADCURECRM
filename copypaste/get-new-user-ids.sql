-- Haal UUIDs op van de nieuwe gebruikers
SELECT id, email FROM auth.users 
WHERE email IN ('admin@adcure.agency', 'client@test.com');
