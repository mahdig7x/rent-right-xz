
-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ENUM types
CREATE TYPE public.item_condition AS ENUM ('new', 'like_new', 'good', 'fair');
CREATE TYPE public.item_status AS ENUM ('available', 'booked', 'unavailable');
CREATE TYPE public.moderation_status AS ENUM ('approved', 'pending_review', 'flagged', 'suspended');
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'rejected', 'cancelled', 'completed', 'failed');
CREATE TYPE public.payment_type AS ENUM ('rental', 'insurance', 'refund', 'compensation');
CREATE TYPE public.payment_status AS ENUM ('pending', 'successful', 'failed', 'refunded');
CREATE TYPE public.report_status AS ENUM ('submitted', 'under_review', 'resolved', 'rejected', 'escalated');
CREATE TYPE public.report_resolution AS ENUM ('warning_issued', 'listing_suspended', 'user_suspended', 'insurance_transferred', 'no_action', 'escalated');
CREATE TYPE public.admin_action_type AS ENUM ('listing_approved', 'listing_flagged', 'listing_suspended', 'report_resolved', 'report_rejected', 'report_escalated', 'user_suspended', 'user_activated', 'insurance_transferred');
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  location TEXT DEFAULT '',
  profile_image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email, profile_image)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- USER ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ITEMS
CREATE TABLE public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  price_per_day NUMERIC(10,2) NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  condition item_condition NOT NULL DEFAULT 'good',
  status item_status NOT NULL DEFAULT 'available',
  moderation_status moderation_status NOT NULL DEFAULT 'pending_review',
  moderation_note TEXT,
  images TEXT[] DEFAULT '{}',
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved items viewable by everyone" ON public.items FOR SELECT USING (moderation_status = 'approved' OR owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Auth users can create items" ON public.items FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update own items" ON public.items FOR UPDATE USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can delete own items" ON public.items FOR DELETE USING (auth.uid() = owner_id);

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON public.items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- BOOKINGS
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  renter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lessor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status booking_status NOT NULL DEFAULT 'pending',
  total_price NUMERIC(10,2) NOT NULL,
  insurance_amount NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own bookings" ON public.bookings FOR SELECT USING (auth.uid() = renter_id OR auth.uid() = lessor_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Auth users can create bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = renter_id);
CREATE POLICY "Involved parties can update bookings" ON public.bookings FOR UPDATE USING (auth.uid() = renter_id OR auth.uid() = lessor_id OR public.has_role(auth.uid(), 'admin'));

-- MESSAGES
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Auth users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Receivers can update message read status" ON public.messages FOR UPDATE USING (auth.uid() = receiver_id);

-- REVIEWS
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewed_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews viewable by everyone" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Auth users can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Reviewers can update own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = reviewer_id);

-- REPORTS
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  item_id UUID REFERENCES public.items(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  status report_status NOT NULL DEFAULT 'submitted',
  evidence TEXT[] DEFAULT '{}',
  admin_note TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  resolution report_resolution,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own reports" ON public.reports FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Auth users can create reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update reports" ON public.reports FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- PAYMENTS
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  payment_type payment_type NOT NULL,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND (b.renter_id = auth.uid() OR b.lessor_id = auth.uid()))
  OR public.has_role(auth.uid(), 'admin')
);

-- ADMIN ACTIONS LOG
CREATE TABLE public.admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type admin_action_type NOT NULL,
  target_id TEXT NOT NULL,
  target_label TEXT NOT NULL,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view actions" ON public.admin_actions FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can create actions" ON public.admin_actions FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- STORAGE for item images
INSERT INTO storage.buckets (id, name, public) VALUES ('item-images', 'item-images', true);
CREATE POLICY "Anyone can view item images" ON storage.objects FOR SELECT USING (bucket_id = 'item-images');
CREATE POLICY "Auth users can upload item images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'item-images' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete own item images" ON storage.objects FOR DELETE USING (bucket_id = 'item-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- INDEXES
CREATE INDEX idx_items_owner ON public.items(owner_id);
CREATE INDEX idx_items_category ON public.items(category);
CREATE INDEX idx_items_status ON public.items(moderation_status);
CREATE INDEX idx_bookings_renter ON public.bookings(renter_id);
CREATE INDEX idx_bookings_lessor ON public.bookings(lessor_id);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX idx_messages_created ON public.messages(created_at);
