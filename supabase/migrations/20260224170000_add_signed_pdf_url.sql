-- Add signed_pdf_url to resolutions
ALTER TABLE public.resolutions ADD COLUMN IF NOT EXISTS signed_pdf_url TEXT;

-- Create storage bucket for signed resolutions if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('signed-resolutions', 'signed-resolutions', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for the bucket
CREATE POLICY "Public signed resolutions access"
ON storage.objects FOR SELECT
USING (bucket_id = 'signed-resolutions');

CREATE POLICY "Admin and Secretary can upload signed resolutions"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'signed-resolutions' AND
    auth.uid() IN (
        SELECT id FROM public.profiles WHERE role IN ('admin', 'bod_secretary')
    )
);

CREATE POLICY "Admin and Secretary can update signed resolutions"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'signed-resolutions' AND
    auth.uid() IN (
        SELECT id FROM public.profiles WHERE role IN ('admin', 'bod_secretary')
    )
);

CREATE POLICY "Admin and Secretary can delete signed resolutions"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'signed-resolutions' AND
    auth.uid() IN (
        SELECT id FROM public.profiles WHERE role IN ('admin', 'bod_secretary')
    )
);
