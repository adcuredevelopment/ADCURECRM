-- Check welke auth users er al bestaan
SELECT id, email, created_at 
FROM auth.users 
WHERE email IN ('admin@adcure.agency', 'client@test.com');
