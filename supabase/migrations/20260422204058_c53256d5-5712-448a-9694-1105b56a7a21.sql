ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS renter_returned_at timestamptz,
  ADD COLUMN IF NOT EXISTS lessor_returned_at timestamptz;

CREATE OR REPLACE FUNCTION public.auto_complete_booking()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.renter_returned_at IS NOT NULL
     AND NEW.lessor_returned_at IS NOT NULL
     AND NEW.status = 'confirmed' THEN
    NEW.status := 'completed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_complete_booking ON public.bookings;
CREATE TRIGGER trg_auto_complete_booking
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.auto_complete_booking();