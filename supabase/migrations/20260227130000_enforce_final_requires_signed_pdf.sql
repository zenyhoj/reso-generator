-- ============================================================
-- Enforce: final resolutions must have a signed PDF URL
-- ============================================================

-- 1) Repair existing inconsistent rows
UPDATE public.resolutions
SET status = 'draft'
WHERE status = 'final'
  AND (signed_pdf_url IS NULL OR btrim(signed_pdf_url) = '');

-- 2) Add integrity constraint
ALTER TABLE public.resolutions
DROP CONSTRAINT IF EXISTS resolutions_final_requires_signed_pdf;

ALTER TABLE public.resolutions
ADD CONSTRAINT resolutions_final_requires_signed_pdf
CHECK (
  status <> 'final'
  OR (signed_pdf_url IS NOT NULL AND btrim(signed_pdf_url) <> '')
);
