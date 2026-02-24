-- Fix the trigger that prevents role setup from checking globally
CREATE OR REPLACE FUNCTION public.prevent_role_status_self_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- We only want to prevent users from elevating their OWN role/status
  -- This allows admins calling admin_update_user to modify OTHER profiles
  IF NEW.id = auth.uid() THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'You cannot change your own role.';
    END IF;
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'You cannot change your own status.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;
