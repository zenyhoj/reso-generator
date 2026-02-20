-- Migration: Add movant_name and seconder_name to resolutions table

ALTER TABLE public.resolutions
ADD COLUMN IF NOT EXISTS movant_name TEXT,
ADD COLUMN IF NOT EXISTS seconder_name TEXT;

COMMENT ON COLUMN public.resolutions.movant_name IS 'Name of the person who moved the resolution';
COMMENT ON COLUMN public.resolutions.seconder_name IS 'Name of the person who seconded the resolution';
