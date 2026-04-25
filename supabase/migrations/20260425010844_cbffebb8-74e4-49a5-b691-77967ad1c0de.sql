-- Allow admins to delete any item
CREATE POLICY "Admins can delete any item"
ON public.items
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete reviews (no DELETE policy existed)
CREATE POLICY "Admins can delete reviews"
ON public.reviews
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));