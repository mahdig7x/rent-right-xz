-- 1) Hide PII in profiles: split policy so emails/phones only readable by owner or admin
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON public.profiles;

CREATE POLICY "Public profile fields viewable by all"
ON public.profiles FOR SELECT
USING (true);
-- Note: We'll use a public view to expose only safe fields and update client code to use it.

-- Create a safe public view excluding email and phone
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker=on) AS
SELECT id, user_id, name, location, profile_image, created_at
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- Replace the broad SELECT with owner+admin only on the base table for sensitive access
DROP POLICY IF EXISTS "Public profile fields viewable by all" ON public.profiles;

CREATE POLICY "Owner or admin can view full profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 2) Lock down user_roles to prevent privilege escalation
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- 3) Tighten storage upload to require user-owned folder prefix
DROP POLICY IF EXISTS "Authenticated users can upload item images" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can upload images" ON storage.objects;

CREATE POLICY "Users upload to own folder in item-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'item-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
