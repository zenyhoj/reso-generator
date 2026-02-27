-- ============================================================
-- Lock final resolutions from UPDATE/DELETE
-- ============================================================

DROP POLICY IF EXISTS "Approved admins and secretaries can update resolutions" ON public.resolutions;
DROP POLICY IF EXISTS "Approved admins and secretaries can delete resolutions" ON public.resolutions;

CREATE POLICY "Approved admins and secretaries can update non-final resolutions"
  ON public.resolutions FOR UPDATE
  TO authenticated
  USING (
    status <> 'final'
    AND EXISTS (
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

CREATE POLICY "Approved admins and secretaries can delete non-final resolutions"
  ON public.resolutions FOR DELETE
  TO authenticated
  USING (
    status <> 'final'
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.status = 'approved'
        AND p.role IN ('admin', 'bod_secretary')
    )
  );
