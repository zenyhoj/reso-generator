-- Migration: Repair profiles table by adding missing columns idempotently

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS water_district_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS water_district_email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS water_district_contact text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bod_chairman text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bod_vice_chairman text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bod_secretary text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bod_member_1 text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bod_member_2 text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bod_member_3 text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS general_manager text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signature_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bod_chairman_sig_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bod_vice_chairman_sig_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bod_secretary_sig_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bod_member_1_sig_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bod_member_2_sig_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bod_member_3_sig_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS general_manager_sig_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS public_key text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bod_position text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- Fix the role check constraint to include new roles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role = ANY (ARRAY['admin'::text, 'bod_secretary'::text, 'bod_member'::text, 'staff'::text, 'viewer'::text]));

-- Ensure defaults to prevent null crashes in some UI logic
ALTER TABLE public.profiles ALTER COLUMN water_district_name SET DEFAULT '';
ALTER TABLE public.profiles ALTER COLUMN full_name SET DEFAULT '';
ALTER TABLE public.profiles ALTER COLUMN bod_position SET DEFAULT '';
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'bod_member';
ALTER TABLE public.profiles ALTER COLUMN status SET DEFAULT 'pending';
