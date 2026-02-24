-- Migration: Add wording proposal table for draft review workflow

CREATE TABLE IF NOT EXISTS public.resolution_wording_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resolution_id uuid NOT NULL REFERENCES public.resolutions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section text NOT NULL CHECK (section IN ('whereas', 'resolved')),
  clause_index integer NOT NULL CHECK (clause_index >= 0),
  original_text text NOT NULL,
  suggested_text text NOT NULL,
  note text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS resolution_wording_proposals_resolution_id_idx
  ON public.resolution_wording_proposals(resolution_id);

CREATE INDEX IF NOT EXISTS resolution_wording_proposals_user_id_idx
  ON public.resolution_wording_proposals(user_id);

ALTER TABLE public.resolution_wording_proposals ENABLE ROW LEVEL SECURITY;

-- Drop policies first so re-running is safe
DROP POLICY IF EXISTS "Authenticated users can read wording proposals" ON public.resolution_wording_proposals;
DROP POLICY IF EXISTS "Authenticated users can create their wording proposals" ON public.resolution_wording_proposals;
DROP POLICY IF EXISTS "Users can update their pending wording proposals" ON public.resolution_wording_proposals;
DROP POLICY IF EXISTS "Users can delete their pending wording proposals" ON public.resolution_wording_proposals;

CREATE POLICY "Authenticated users can read wording proposals"
  ON public.resolution_wording_proposals
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create their wording proposals"
  ON public.resolution_wording_proposals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their pending wording proposals"
  ON public.resolution_wording_proposals
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their pending wording proposals"
  ON public.resolution_wording_proposals
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending');
