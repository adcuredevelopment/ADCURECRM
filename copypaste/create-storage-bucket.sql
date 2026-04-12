-- =====================================================
-- AdCure Portal - Supabase Storage Bucket aanmaken
-- Plak dit in: Supabase Dashboard → SQL Editor
-- URL: https://supabase.com/dashboard/project/inacrhrrwpmajlizjnum/sql/new
-- =====================================================

-- Maak de storage bucket aan voor bewijsbestanden
INSERT INTO storage.buckets (id, name, public)
VALUES ('transaction-proofs', 'transaction-proofs', true)
ON CONFLICT DO NOTHING;

-- RLS policy: alleen ingelogde gebruikers mogen uploaden
CREATE POLICY "Authenticated users can upload proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'transaction-proofs');

-- RLS policy: publiek leesbaar (voor bewijs-URL's)
CREATE POLICY "Public read access for proofs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'transaction-proofs');

-- Verificatie
SELECT id, name, public FROM storage.buckets WHERE id = 'transaction-proofs';
