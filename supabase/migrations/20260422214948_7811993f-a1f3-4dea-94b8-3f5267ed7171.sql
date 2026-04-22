-- 1. Super admins table (immutable list of permanent admins)
CREATE TABLE IF NOT EXISTS public.super_admins (
  user_id uuid PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view super admins"
  ON public.super_admins FOR SELECT
  TO authenticated
  USING (true);

-- Seed the two permanent super admins
INSERT INTO public.super_admins (user_id) VALUES
  ('6e4d7fb9-33f7-4cdd-a7ca-9961f6c596cf'),
  ('843a39f8-c291-4b17-9c69-e4ac70f083a3')
ON CONFLICT (user_id) DO NOTHING;

-- Ensure they have admin role
INSERT INTO public.user_roles (user_id, role) VALUES
  ('6e4d7fb9-33f7-4cdd-a7ca-9961f6c596cf', 'admin'),
  ('843a39f8-c291-4b17-9c69-e4ac70f083a3', 'admin')
ON CONFLICT DO NOTHING;

-- 2. Helper function
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = _user_id)
$$;

-- 3. Trigger to protect super admins from losing their admin role
CREATE OR REPLACE FUNCTION public.protect_super_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.role = 'admin' AND public.is_super_admin(OLD.user_id) THEN
    RAISE EXCEPTION 'Cannot remove admin role from a super admin';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS protect_super_admin_role_trigger ON public.user_roles;
CREATE TRIGGER protect_super_admin_role_trigger
  BEFORE DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_super_admin_role();

-- 4. Prevent self-removal of admin role (any admin can't delete their own admin)
CREATE OR REPLACE FUNCTION public.prevent_self_admin_removal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.role = 'admin' AND OLD.user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot remove your own admin role';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS prevent_self_admin_removal_trigger ON public.user_roles;
CREATE TRIGGER prevent_self_admin_removal_trigger
  BEFORE DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_admin_removal();