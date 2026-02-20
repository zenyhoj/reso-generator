-- Migration: Add footer text columns to resolutions table

ALTER TABLE public.resolutions
ADD COLUMN IF NOT EXISTS footer_approved_text TEXT,
ADD COLUMN IF NOT EXISTS footer_adopted_text TEXT,
ADD COLUMN IF NOT EXISTS footer_certified_text TEXT;

COMMENT ON COLUMN public.resolutions.footer_approved_text IS 'Custom text for the "Unanimously approved" section';
COMMENT ON COLUMN public.resolutions.footer_adopted_text IS 'Custom text for the "Adopted this..." section';
COMMENT ON COLUMN public.resolutions.footer_certified_text IS 'Custom text for the "We hereby certify..." section';
