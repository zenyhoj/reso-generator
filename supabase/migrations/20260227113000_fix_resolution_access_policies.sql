-- ============================================================
-- Fix: Resolution access for approved users
-- Goal:
-- 1) Any approved user can read all resolutions
-- 2) Only approved admins/secretaries can create/update/delete
-- ============================================================

ALTER TABLE public.resolutions ENABLE ROW LEVEL SECURITY;

-- Remove legacy/duplicate policy names from previous migrations
DROP POLICY IF EXISTS "Users can view their own resolutions" ON public.resolutions;
DROP POLICY IF EXISTS "BOD members can view resolutions from their district" ON public.resolutions;
DROP POLICY IF EXISTS "Users can view resolutions" ON public.resolutions;
DROP POLICY IF EXISTS "Approved members can view all resolutions" ON public.resolutions;

DROP POLICY IF EXISTS "Users can insert resolutions" ON public.resolutions;
DROP POLICY IF EXISTS "Approved personnel can insert resolutions" ON public.resolutions;
DROP POLICY IF EXISTS "Approved secretaries and admins can insert resolutions" ON public.resolutions;
DROP POLICY IF EXISTS "Secretaries and admins can insert resolutions" ON public.resolutions;

DROP POLICY IF EXISTS "Users can update their own resolutions" ON public.resolutions;
DROP POLICY IF EXISTS "Approved personnel can update resolutions" ON public.resolutions;
DROP POLICY IF EXISTS "Approved secretaries and admins can update resolutions" ON public.resolutions;
DROP POLICY IF EXISTS "Approved secretaries and admins can update any resolution" ON public.resolutions;
DROP POLICY IF EXISTS "Secretaries and admins can update resolutions" ON public.resolutions;

DROP POLICY IF EXISTS "Users can delete their own resolutions" ON public.resolutions;
DROP POLICY IF EXISTS "Approved personnel can delete resolutions" ON public.resolutions;
DROP POLICY IF EXISTS "Approved secretaries and admins can delete resolutions" ON public.resolutions;
DROP POLICY IF EXISTS "Approved secretaries and admins can delete any resolution" ON public.resolutions;
DROP POLICY IF EXISTS "Secretaries and admins can delete resolutions" ON public.resolutions;

CREATE POLICY "Approved users can view all resolutions"
  ON public.resolutions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.status = 'approved'
    )
  );

CREATE POLICY "Approved admins and secretaries can insert resolutions"
  ON public.resolutions FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.status = 'approved'
        AND p.role IN ('admin', 'bod_secretary')
    )
  );

CREATE POLICY "Approved admins and secretaries can update resolutions"
  ON public.resolutions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.status = 'approved'
        AND p.role IN ('admin', 'bod_secretary')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.status = 'approved'
        AND p.role IN ('admin', 'bod_secretary')
    )
  );

CREATE POLICY "Approved admins and secretaries can delete resolutions"
  ON public.resolutions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.status = 'approved'
        AND p.role IN ('admin', 'bod_secretary')
    )
  );
