-- Ensure the new columns exist on remote in case the table was created previously without them
ALTER TABLE public.organization_settings
  ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS signatories JSONB DEFAULT '[]'::jsonb;

-- Seed the user's provided default signatories into the organization_settings table
UPDATE public.organization_settings
SET signatories = '[
      {"name": "ELIZABETH A. ENCINADA", "position": "BOD Chairman", "role": "chairman", "signature_url": ""},
      {"name": "FLORIDA A. HORDISTA", "position": "BOD Vice-Chairman", "role": "vice-chairman", "signature_url": ""},
      {"name": "JOANNA CLYDE A. ESPINA", "position": "BOD Secretary", "role": "secretary", "signature_url": ""},
      {"name": "IVAN C. NAKILA", "position": "BOD Member", "role": "member", "signature_url": ""},
      {"name": "JANE R. PLAZA", "position": "BOD Member", "role": "member", "signature_url": ""},
      {"name": "ELISA B. ALIBAY", "position": "General Manager", "role": "gm", "signature_url": ""}
    ]'::jsonb,
    updated_at = now()
WHERE id = 1;

INSERT INTO public.organization_settings (id, signatories)
SELECT 1, '[
      {"name": "ELIZABETH A. ENCINADA", "position": "BOD Chairman", "role": "chairman", "signature_url": ""},
      {"name": "FLORIDA A. HORDISTA", "position": "BOD Vice-Chairman", "role": "vice-chairman", "signature_url": ""},
      {"name": "JOANNA CLYDE A. ESPINA", "position": "BOD Secretary", "role": "secretary", "signature_url": ""},
      {"name": "IVAN C. NAKILA", "position": "BOD Member", "role": "member", "signature_url": ""},
      {"name": "JANE R. PLAZA", "position": "BOD Member", "role": "member", "signature_url": ""},
      {"name": "ELISA B. ALIBAY", "position": "General Manager", "role": "gm", "signature_url": ""}
    ]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.organization_settings WHERE id = 1);
