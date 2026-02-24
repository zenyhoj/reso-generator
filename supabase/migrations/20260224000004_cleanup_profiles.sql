-- ============================================================
-- Migration: Final Cleanup of Profiles Table
-- Drops all remaining organization-related columns
-- ============================================================

ALTER TABLE public.profiles 
  DROP COLUMN IF EXISTS water_district_name,
  DROP COLUMN IF EXISTS water_district_email,
  DROP COLUMN IF EXISTS water_district_contact,
  DROP COLUMN IF EXISTS address,
  DROP COLUMN IF EXISTS logo_url,
  DROP COLUMN IF EXISTS bod_chairman,
  DROP COLUMN IF EXISTS bod_vice_chairman,
  DROP COLUMN IF EXISTS bod_secretary,
  DROP COLUMN IF EXISTS bod_member_1,
  DROP COLUMN IF EXISTS bod_member_2,
  DROP COLUMN IF EXISTS bod_member_3,
  DROP COLUMN IF EXISTS general_manager,
  DROP COLUMN IF EXISTS bod_chairman_sig_url,
  DROP COLUMN IF EXISTS bod_vice_chairman_sig_url,
  DROP COLUMN IF EXISTS bod_secretary_sig_url,
  DROP COLUMN IF EXISTS bod_member_1_sig_url,
  DROP COLUMN IF EXISTS bod_member_2_sig_url,
  DROP COLUMN IF EXISTS bod_member_3_sig_url,
  DROP COLUMN IF EXISTS general_manager_sig_url;

-- Ensure the role check constraint is up to date
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role = ANY (ARRAY['admin'::text, 'bod_secretary'::text, 'bod_member'::text, 'staff'::text, 'viewer'::text]));
