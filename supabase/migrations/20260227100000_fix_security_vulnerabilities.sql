-- ============================================================
-- Migration: Additional Security Hardening
-- 1. Trigger to prevent clients from seting role/status on insert
-- 2. Tighten Resolutions RLS
-- ============================================================

-- 1. Trigger: Force role='bod_member' and status='pending' on INSERT for non-bypass roles
-- This ensures that even if a client bypasses the server action logic, the DB will reset the role.
CREATE OR REPLACE FUNCTION public.force_initial_profile_state()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only enforce if the current role is NOT 'rls_bypass' (service role)
  -- Or if it's an authenticated user (client)
  IF current_setting('role') <> 'rls_bypass' THEN
    NEW.role := 'bod_member';
    NEW.status := 'pending';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_force_initial_profile_state ON public.profiles;
CREATE TRIGGER trg_force_initial_profile_state
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.force_initial_profile_state();

-- 2. Hardened RLS on resolutions
-- Approved members can view ALL resolutions for review/suggestions
-- Only admins and secretaries can CREATE, EDIT, or DELETE
DROP POLICY IF EXISTS "BOD members can view resolutions from their district" ON public.resolutions;
DROP POLICY IF EXISTS "Users can view their own resolutions" ON public.resolutions;
DROP POLICY IF EXISTS "Approved personnel can insert resolutions" ON public.resolutions;
DROP POLICY IF EXISTS "Approved personnel can update resolutions" ON public.resolutions;
DROP POLICY IF EXISTS "Approved personnel can delete resolutions" ON public.resolutions;

CREATE POLICY "Approved members can view all resolutions"
  ON public.resolutions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.status = 'approved'
    )
  );

CREATE POLICY "Secretaries and admins can insert resolutions"
  ON public.resolutions FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.status = 'approved'
        AND p.role IN ('admin', 'bod_secretary')
    )
  );

CREATE POLICY "Secretaries and admins can update resolutions"
  ON public.resolutions FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.status = 'approved'
        AND p.role IN ('admin', 'bod_secretary')
    )
  );

CREATE POLICY "Secretaries and admins can delete resolutions"
  ON public.resolutions FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.status = 'approved'
        AND p.role IN ('admin', 'bod_secretary')
    )
  );
