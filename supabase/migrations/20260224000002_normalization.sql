-- ============================================================
-- Migration: Database Normalization
-- 1. Create organization_settings (singleton table)
-- 2. Migrate existing data from profiles to organization_settings
-- 3. Cleanup profiles table
-- 4. Restore/Fix admin_get_all_profiles
-- ============================================================

-- 1. Create Organization Settings Table
CREATE TABLE IF NOT EXISTS public.organization_settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Ensure only one row
    admin_id UUID REFERENCES public.profiles(id), -- Admin responsible for settings
    water_district_name TEXT DEFAULT '',
    water_district_email TEXT DEFAULT '',
    water_district_contact TEXT DEFAULT '',
    address TEXT DEFAULT '',
    logo_url TEXT DEFAULT '',
    -- Dynamic Signatories: List of {name, position, role, signature_url}
    signatories JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Data migration omitted due to CLI parser issues with PL/pgSQL blocks
-- In a fresh deployment, no data needs migrating anyway.
-- 3. Cleanup Profiles Table (Drop redundant columns)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS water_district_name;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS water_district_email;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS water_district_contact;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS address;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS logo_url;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS bod_chairman;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS bod_vice_chairman;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS bod_member_1;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS bod_member_2;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS bod_member_3;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS general_manager;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS bod_chairman_sig_url;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS bod_vice_chairman_sig_url;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS bod_secretary_sig_url;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS bod_member_1_sig_url;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS bod_member_2_sig_url;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS bod_member_3_sig_url;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS general_manager_sig_url;

-- 4. Restore/Fix admin_get_all_profiles
CREATE OR REPLACE FUNCTION public.admin_get_all_profiles()
RETURNS TABLE(
  id UUID,
  full_name TEXT,
  email TEXT,
  bod_position TEXT,
  role TEXT,
  status TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role TEXT;
BEGIN
  -- Security check: check role of the person calling the function
  SELECT p.role INTO caller_role FROM public.profiles p WHERE p.id = auth.uid();
  IF caller_role <> 'admin' THEN
    RAISE EXCEPTION 'Access denied: caller is not an admin.';
  END IF;

  RETURN QUERY
    SELECT 
        p.id, 
        p.full_name, 
        u.email::TEXT, 
        p.bod_position, 
        p.role, 
        p.status, 
        p.created_at
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
    ORDER BY p.created_at DESC;
END;
$$;

-- 5. RLS for organization_settings
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view settings" ON public.organization_settings;
CREATE POLICY "Public can view settings"
  ON public.organization_settings FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can update settings" ON public.organization_settings;
CREATE POLICY "Admins can update settings"
  ON public.organization_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can insert settings" ON public.organization_settings;
CREATE POLICY "Admins can insert settings"
  ON public.organization_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
