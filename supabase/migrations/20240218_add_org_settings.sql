-- Migration to add organization settings to profiles table

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS bod_chairman TEXT,
ADD COLUMN IF NOT EXISTS bod_vice_chairman TEXT,
ADD COLUMN IF NOT EXISTS bod_member_1 TEXT,
ADD COLUMN IF NOT EXISTS bod_member_2 TEXT,
ADD COLUMN IF NOT EXISTS bod_member_3 TEXT,
ADD COLUMN IF NOT EXISTS general_manager TEXT;
