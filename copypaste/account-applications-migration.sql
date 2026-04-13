-- =====================================================
-- AdCure Portal - Account Applications Migration
-- Plak dit in: Supabase Dashboard → SQL Editor
-- URL: https://supabase.com/dashboard/project/inacrhrrwpmajlizjnum/sql/new
-- =====================================================

CREATE TABLE IF NOT EXISTS public.account_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  kvk_number TEXT NOT NULL,
  vat_number TEXT NOT NULL,
  iban TEXT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_account_applications_email
  ON public.account_applications(email);

CREATE INDEX IF NOT EXISTS idx_account_applications_status
  ON public.account_applications(status);

CREATE INDEX IF NOT EXISTS idx_account_applications_created
  ON public.account_applications(created_at DESC);

ALTER TABLE public.account_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit application"
  ON public.account_applications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all applications"
  ON public.account_applications FOR SELECT
  USING (public.user_role() = 'agency_admin');

CREATE POLICY "Admins can update applications"
  ON public.account_applications FOR UPDATE
  USING (public.user_role() = 'agency_admin');

SELECT 'account_applications table created successfully' AS status;
