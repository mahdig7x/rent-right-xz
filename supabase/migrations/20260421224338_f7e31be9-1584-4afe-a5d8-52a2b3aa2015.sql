-- Enable realtime for messages table for instant chat updates
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Enable realtime for bookings table for instant booking status updates
ALTER TABLE public.bookings REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;

-- Add helpful index for items search
CREATE INDEX IF NOT EXISTS idx_items_owner_id ON public.items(owner_id);
CREATE INDEX IF NOT EXISTS idx_items_moderation_status ON public.items(moderation_status);
CREATE INDEX IF NOT EXISTS idx_items_category ON public.items(category);
CREATE INDEX IF NOT EXISTS idx_bookings_renter_id ON public.bookings(renter_id);
CREATE INDEX IF NOT EXISTS idx_bookings_lessor_id ON public.bookings(lessor_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON public.messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);