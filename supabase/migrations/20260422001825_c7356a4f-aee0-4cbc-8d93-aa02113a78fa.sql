-- Recreate profiles_public view with security_definer so it bypasses
-- the restrictive RLS on profiles and exposes only safe public fields.
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public
WITH (security_invoker = off) AS
SELECT
  id,
  user_id,
  name,
  profile_image,
  location,
  created_at
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO anon, authenticated;