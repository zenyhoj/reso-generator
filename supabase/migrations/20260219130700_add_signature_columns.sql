-- Migration: Add digital signature columns to profiles table

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS bod_chairman_sig_url text,
ADD COLUMN IF NOT EXISTS bod_vice_chairman_sig_url text,
ADD COLUMN IF NOT EXISTS bod_secretary_sig_url text,
ADD COLUMN IF NOT EXISTS bod_member_1_sig_url text,
ADD COLUMN IF NOT EXISTS bod_member_2_sig_url text,
ADD COLUMN IF NOT EXISTS bod_member_3_sig_url text,
ADD COLUMN IF NOT EXISTS general_manager_sig_url text;

COMMENT ON COLUMN public.profiles.bod_chairman_sig_url IS 'URL for BOD Chairman digital signature';
COMMENT ON COLUMN public.profiles.bod_vice_chairman_sig_url IS 'URL for BOD Vice-Chairman digital signature';
COMMENT ON COLUMN public.profiles.bod_secretary_sig_url IS 'URL for BOD Secretary digital signature';
COMMENT ON COLUMN public.profiles.bod_member_1_sig_url IS 'URL for BOD Member 1 digital signature';
COMMENT ON COLUMN public.profiles.bod_member_2_sig_url IS 'URL for BOD Member 2 digital signature';
COMMENT ON COLUMN public.profiles.bod_member_3_sig_url IS 'URL for BOD Member 3 digital signature';
COMMENT ON COLUMN public.profiles.general_manager_sig_url IS 'URL for General Manager digital signature';
