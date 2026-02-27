-- ============================================================
-- Add finalization metadata for resolutions
-- ============================================================

ALTER TABLE public.resolutions
ADD COLUMN IF NOT EXISTS finalized_at timestamptz,
ADD COLUMN IF NOT EXISTS finalized_by uuid REFERENCES public.profiles(id);

-- Backfill existing final rows that already have signed PDFs
UPDATE public.resolutions
SET
  finalized_at = COALESCE(finalized_at, updated_at, created_at),
  finalized_by = COALESCE(finalized_by, user_id)
WHERE status = 'final'
  AND signed_pdf_url IS NOT NULL
  AND btrim(signed_pdf_url) <> '';
