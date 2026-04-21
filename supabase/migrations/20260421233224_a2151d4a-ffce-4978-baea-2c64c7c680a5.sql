-- Tie messages to a specific booking (optional, backward compatible)
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_messages_booking_id ON public.messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_messages_pair ON public.messages(sender_id, receiver_id, created_at DESC);

-- Optional location coordinates for items (for nearby map search)
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS longitude double precision;
CREATE INDEX IF NOT EXISTS idx_items_coords ON public.items(latitude, longitude);