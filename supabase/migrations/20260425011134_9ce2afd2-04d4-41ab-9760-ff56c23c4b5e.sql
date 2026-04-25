-- 1) Add hidden flag
ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS hidden boolean NOT NULL DEFAULT false;

-- 2) Replace SELECT policy: hide hidden reviews from public
DROP POLICY IF EXISTS "Reviews viewable by everyone" ON public.reviews;

CREATE POLICY "Reviews viewable when not hidden"
ON public.reviews
FOR SELECT
USING (
  hidden = false
  OR auth.uid() = reviewer_id
  OR public.has_role(auth.uid(), 'admin')
);

-- 3) Allow admins to update reviews (e.g., toggle hidden)
CREATE POLICY "Admins can update reviews"
ON public.reviews
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));