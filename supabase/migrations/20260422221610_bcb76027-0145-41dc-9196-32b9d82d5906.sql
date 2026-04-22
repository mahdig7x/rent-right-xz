-- Allow admins to delete reports
CREATE POLICY "Admins can delete reports"
ON public.reports
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));