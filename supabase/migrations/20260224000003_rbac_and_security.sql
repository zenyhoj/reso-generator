-- ============================================================
-- Migration: RBAC roles, approval status, and RLS hardening (CORRECTED)
-- ============================================================

-- 1. Ensure columns exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bod_position TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT;

-- 2. Migrate existing data to new schema values
-- Map 'editor' to 'bod_secretary', 'viewer' or others to 'bod_member'
UPDATE public.profiles SET role = 'bod_secretary' WHERE role = 'editor';
UPDATE public.profiles SET role = 'bod_member' WHERE role NOT IN ('admin', 'bod_secretary') OR role IS NULL;

-- Auto-approve existing users to prevent lockouts during migration
UPDATE public.profiles SET status = 'approved' WHERE status IS NULL;

-- 3. Set defaults and constraints
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'bod_member';
ALTER TABLE public.profiles ALTER COLUMN role SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN status SET DEFAULT 'pending';
ALTER TABLE public.profiles ALTER COLUMN status SET NOT NULL;

-- Add check constraints (idempotently)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'bod_secretary', 'bod_member'));

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_status_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check CHECK (status IN ('pending', 'approved'));

-- ============================================================
-- 4. Trigger: block clients from self-elevating role / status
-- ============================================================
CREATE OR REPLACE FUNCTION public.prevent_role_status_self_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only block if the caller is NOT a service-role (SECURITY DEFINER fns bypass this)
  IF current_setting('role') <> 'rls_bypass' THEN
    IF NEW.role <> OLD.role THEN
      RAISE EXCEPTION 'You cannot change your own role.';
    END IF;
    IF NEW.status <> OLD.status THEN
      RAISE EXCEPTION 'You cannot change your own status.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_status_self_update ON public.profiles;
CREATE TRIGGER trg_prevent_role_status_self_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_status_self_update();

-- ============================================================
-- 5. RLS on profiles
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- 6. SECURITY DEFINER helper: get own profile role+status
--    Called by middleware to check status without exposing others' rows
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_my_profile_status()
RETURNS TABLE(role TEXT, status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
    SELECT p.role, p.status
    FROM public.profiles p
    WHERE p.id = auth.uid();
END;
$$;

-- ============================================================
-- 7. SECURITY DEFINER: admin reads all profiles
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_get_all_profiles()
RETURNS TABLE(
  id UUID,
  full_name TEXT,
  email TEXT,
  bod_position TEXT,
  role TEXT,
  status TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role TEXT;
BEGIN
  SELECT p.role INTO caller_role FROM public.profiles p WHERE p.id = auth.uid();
  IF caller_role <> 'admin' THEN
    RAISE EXCEPTION 'Access denied: caller is not an admin.';
  END IF;

  RETURN QUERY
    SELECT p.id, p.full_name, p.email, p.bod_position, p.role, p.status, p.created_at
    FROM public.profiles p
    ORDER BY p.created_at ASC;
END;
$$;

-- ============================================================
-- 8. SECURITY DEFINER: admin updates a user's role + status
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_update_user(
  target_user_id UUID,
  new_role TEXT,
  new_status TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role TEXT;
BEGIN
  SELECT p.role INTO caller_role FROM public.profiles p WHERE p.id = auth.uid();
  IF caller_role <> 'admin' THEN
    RAISE EXCEPTION 'Access denied: caller is not an admin.';
  END IF;

  IF new_role NOT IN ('admin', 'bod_secretary', 'bod_member') THEN
    RAISE EXCEPTION 'Invalid role value.';
  END IF;

  IF new_status NOT IN ('pending', 'approved') THEN
    RAISE EXCEPTION 'Invalid status value.';
  END IF;

  UPDATE public.profiles
  SET role = new_role, status = new_status, updated_at = now()
  WHERE id = target_user_id;
END;
$$;

-- ============================================================
-- 9. Tighten RLS on resolutions
-- ============================================================

-- Drop existing permissive policies and recreate with role/status checks
DROP POLICY IF EXISTS "Users can view their own resolutions" ON public.resolutions;
DROP POLICY IF EXISTS "Users can insert resolutions" ON public.resolutions;
DROP POLICY IF EXISTS "Users can update their own resolutions" ON public.resolutions;
DROP POLICY IF EXISTS "Users can delete their own resolutions" ON public.resolutions;

-- SELECT: own resolutions OR admin
CREATE POLICY "Users can view their own resolutions"
  ON public.resolutions FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin' AND p.status = 'approved'
    )
  );

-- bod_member can view resolutions they are an officer of (for the review page)
CREATE POLICY "BOD members can view resolutions from their district"
  ON public.resolutions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.status = 'approved'
        AND p.role = 'bod_member'
    )
  );

-- INSERT/UPDATE/DELETE: only approved admin or bod_secretary
CREATE POLICY "Approved secretaries and admins can insert resolutions"
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

CREATE POLICY "Approved secretaries and admins can update resolutions"
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

CREATE POLICY "Approved secretaries and admins can delete resolutions"
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

-- ============================================================
-- 10. Tighten RLS on resolution_wording_proposals
-- ============================================================

-- Replace open SELECT with meaningful check
DROP POLICY IF EXISTS "Authenticated users can read wording proposals" ON public.resolution_wording_proposals;
CREATE POLICY "Authenticated users can read wording proposals"
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
    -- Admins can see all
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin' AND p.status = 'approved'
    )
  );

-- INSERT: only approved users
DROP POLICY IF EXISTS "Authenticated users can create their wording proposals" ON public.resolution_wording_proposals;
CREATE POLICY "Approved users can create wording proposals"
  ON public.resolution_wording_proposals FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.status = 'approved'
    )
  );
