-- ============================================================================
-- support_tickets + support_messages — customer ↔ clinic threading.
--
-- Distinct from `contact_messages` (the public anon contact form). These
-- tables are for authenticated customers writing to the clinic from inside
-- the portal, with a persistent thread the admin reply UI will surface.
--
-- A trigger on public.users INSERT auto-seeds a welcome ticket so the page
-- is never empty after signup. Welcome attribution is to the clinic name
-- "Kerala Ayurvedic Lifestyle Vaidyasalai" — not Vaidya personally.
-- ============================================================================

-- ── support_tickets ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  topic              TEXT NOT NULL CHECK (topic IN (
                       'treatment','prescription','appointment','order',
                       'billing','welcome','other'
                     )),
  subject            TEXT NOT NULL,
  status             TEXT NOT NULL DEFAULT 'open'
                     CHECK (status IN ('open','awaiting-customer','resolved','closed')),
  last_message_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  unread_by_customer BOOLEAN NOT NULL DEFAULT FALSE,
  unread_by_clinic   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS support_tickets_customer_idx
  ON public.support_tickets (customer_id, status, last_message_at DESC);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "support_tickets: own read"   ON public.support_tickets;
DROP POLICY IF EXISTS "support_tickets: own write"  ON public.support_tickets;
DROP POLICY IF EXISTS "support_tickets: own update" ON public.support_tickets;
DROP POLICY IF EXISTS "support_tickets: admin all"  ON public.support_tickets;

CREATE POLICY "support_tickets: own read"
  ON public.support_tickets FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY "support_tickets: own write"
  ON public.support_tickets FOR INSERT
  WITH CHECK (customer_id = auth.uid());

-- Allow customer to mark their own ticket as resolved + bump last_message_at
-- when they post a reply. Note: this allows status updates too — we trust
-- the server action to only flip to/from valid statuses.
CREATE POLICY "support_tickets: own update"
  ON public.support_tickets FOR UPDATE
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "support_tickets: admin all"
  ON public.support_tickets FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());


-- ── support_messages ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.support_messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id     UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_kind   TEXT NOT NULL CHECK (sender_kind IN ('customer','clinic','system')),
  body          TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS support_messages_ticket_idx
  ON public.support_messages (ticket_id, created_at);

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "support_messages: own ticket read"   ON public.support_messages;
DROP POLICY IF EXISTS "support_messages: own ticket write"  ON public.support_messages;
DROP POLICY IF EXISTS "support_messages: admin all"         ON public.support_messages;

CREATE POLICY "support_messages: own ticket read"
  ON public.support_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = ticket_id AND t.customer_id = auth.uid()
  ));

-- Customer can only INSERT messages with sender_kind='customer' on their own tickets.
CREATE POLICY "support_messages: own ticket write"
  ON public.support_messages FOR INSERT
  WITH CHECK (
    sender_kind = 'customer'
    AND EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_id AND t.customer_id = auth.uid()
    )
  );

CREATE POLICY "support_messages: admin all"
  ON public.support_messages FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());


-- ── trigger: auto-seed welcome ticket for new customers ───────────────────
CREATE OR REPLACE FUNCTION public.grant_welcome_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_ticket_id UUID;
BEGIN
  IF NEW.role = 'customer' THEN
    -- Idempotency: skip if a welcome ticket already exists for this user.
    IF EXISTS (
      SELECT 1 FROM public.support_tickets
      WHERE customer_id = NEW.id AND topic = 'welcome'
    ) THEN
      RETURN NEW;
    END IF;

    INSERT INTO public.support_tickets
      (customer_id, topic, subject, status, unread_by_customer, unread_by_clinic)
    VALUES
      (NEW.id, 'welcome',
       'Welcome to Kerala Ayurvedic Lifestyle Vaidyasalai',
       'open', TRUE, FALSE)
    RETURNING id INTO v_ticket_id;

    INSERT INTO public.support_messages (ticket_id, sender_kind, body)
    VALUES (
      v_ticket_id, 'clinic',
      E'Welcome to Kerala Ayurvedic Lifestyle Vaidyasalai.\n\n'
      'We''re honoured to have you in our practice. Use this space for any '
      'questions about treatments, products, or your daily routine — we''ll '
      'respond within 24 hours on weekdays.\n\n'
      'For urgent matters, message us directly on WhatsApp at +60 11-6504 3436. '
      'Wishing you good health.'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_customer_send_welcome ON public.users;
CREATE TRIGGER on_new_customer_send_welcome
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.grant_welcome_message();
