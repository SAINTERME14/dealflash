
-- ============ SUPPORT TICKETS ============
CREATE TYPE public.support_ticket_status AS ENUM ('open', 'in_progress', 'waiting_user', 'resolved', 'closed');
CREATE TYPE public.support_ticket_priority AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE public.support_ticket_category AS ENUM ('payment', 'listing', 'account', 'kyc', 'technical', 'other');

CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category public.support_ticket_category NOT NULL DEFAULT 'other',
  priority public.support_ticket_priority NOT NULL DEFAULT 'normal',
  status public.support_ticket_status NOT NULL DEFAULT 'open',
  assignee_id UUID,
  related_listing_id UUID,
  related_ticket_id UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.support_ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  is_admin_reply BOOLEAN NOT NULL DEFAULT false,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their tickets" ON public.support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all tickets" ON public.support_tickets FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users create tickets" ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins update tickets" ON public.support_tickets FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users update their own open tickets" ON public.support_tickets FOR UPDATE USING (auth.uid() = user_id AND status IN ('open', 'waiting_user'));

CREATE POLICY "Users view messages of their tickets" ON public.support_ticket_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND (t.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "Users post messages on their tickets" ON public.support_ticket_messages FOR INSERT WITH CHECK (
  auth.uid() = author_id AND EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND (t.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);

CREATE TRIGGER trg_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_support_ticket_resolution()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status IN ('resolved', 'closed') AND (OLD.status IS NULL OR OLD.status NOT IN ('resolved', 'closed')) THEN
    NEW.resolved_at := now();
  ELSIF NEW.status NOT IN ('resolved', 'closed') THEN
    NEW.resolved_at := NULL;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_support_ticket_resolution BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.handle_support_ticket_resolution();

CREATE INDEX idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_assignee ON public.support_tickets(assignee_id) WHERE assignee_id IS NOT NULL;
CREATE INDEX idx_support_ticket_messages_ticket ON public.support_ticket_messages(ticket_id, created_at);

-- ============ NOTIFICATIONS ============
CREATE TYPE public.notification_type AS ENUM (
  'ticket_purchased', 'ticket_validated', 'ticket_expired',
  'booking_requested', 'booking_confirmed', 'booking_cancelled',
  'message_received', 'kyc_status_changed', 'listing_featured',
  'support_reply', 'admin_announcement'
);

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type public.notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update their notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete their notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins create notifications" ON public.notifications FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read, created_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_ticket_messages;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.support_ticket_messages REPLICA IDENTITY FULL;

-- ============ PERFORMANCE INDEXES ============
CREATE INDEX IF NOT EXISTS idx_listings_status_created ON public.listings(status, created_at DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_listings_featured ON public.listings(is_featured, featured_priority DESC, featured_until) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_listings_seller ON public.listings(seller_id, status);
CREATE INDEX IF NOT EXISTS idx_listings_category ON public.listings(category_id, status);
CREATE INDEX IF NOT EXISTS idx_listings_subcategory ON public.listings(subcategory_id) WHERE subcategory_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tickets_buyer ON public.tickets(buyer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_seller ON public.tickets(seller_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON public.favorites(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_unread ON public.messages(recipient_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_thread ON public.messages(sender_id, recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_seller ON public.appointments(seller_id, status);
CREATE INDEX IF NOT EXISTS idx_appointments_buyer ON public.appointments(buyer_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_seller ON public.bookings(seller_id, slot_date);
CREATE INDEX IF NOT EXISTS idx_admin_tasks_status ON public.admin_tasks(status, position);
CREATE INDEX IF NOT EXISTS idx_admin_tasks_assignee ON public.admin_tasks(assignee_id) WHERE assignee_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);
