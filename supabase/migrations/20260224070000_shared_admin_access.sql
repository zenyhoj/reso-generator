-- ============================================================
-- Migration: Shared Admin Access for Resolutions
-- Allows all Approved Admins and Secretaries to manage all resolutions
-- ============================================================

-- 1. Tighten RLS on resolutions for shared access
DROP POLICY IF EXISTS "Users can view their own resolutions" ON public.resolutions;
DROP POLICY IF EXISTS "Users can update their own resolutions" ON public.resolutions;
DROP POLICY IF EXISTS "Users can delete their own resolutions" ON public.resolutions;
DROP POLICY IF EXISTS "Approved secretaries and admins can update resolutions" ON public.resolutions;
DROP POLICY IF EXISTS "Approved secretaries and admins can delete resolutions" ON public.resolutions;

-- SELECT: own resolutions OR ANY approved admin/secretary
CREATE POLICY "Users can view resolutions"
  ON public.resolutions FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
        AND p.status = 'approved'
        AND p.role IN ('admin', 'bod_secretary')
    )
  );

-- UPDATE: own resolutions OR ANY approved admin/secretary
CREATE POLICY "Approved secretaries and admins can update any resolution"
  ON public.resolutions FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.status = 'approved'
        AND p.role IN ('admin', 'bod_secretary')
    )
  );

-- DELETE: own resolutions OR ANY approved admin/secretary
CREATE POLICY "Approved secretaries and admins can delete any resolution"
  ON public.resolutions FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.status = 'approved'
        AND p.role IN ('admin', 'bod_secretary')
    )
  );


-- ============================================================
-- 2. Wording Proposals (Shared Access)
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can read wording proposals" ON public.resolution_wording_proposals;

CREATE POLICY "Users can view wording proposals"
  ON public.resolution_wording_proposals FOR SELECT
  TO authenticated
  USING (
    -- Can see own proposals
    auth.uid() = user_id
    -- Resolution owner can see proposals for their resolution
    OR EXISTS (
      SELECT 1 FROM public.resolutions r
      WHERE r.id = resolution_wording_proposals.resolution_id
        AND r.user_id = auth.uid()
    )
    -- Admins and Secretaries can see all
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
        AND p.status = 'approved'
        AND p.role IN ('admin', 'bod_secretary')
    )
  );
