-- The customer welcome message and the appointment doctor default still used
-- the previous brand's name and WhatsApp number.

CREATE OR REPLACE FUNCTION public.grant_welcome_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_ticket_id UUID;
BEGIN
  IF NEW.role = 'customer' THEN
    IF EXISTS (
      SELECT 1 FROM public.support_tickets
      WHERE customer_id = NEW.id AND topic = 'welcome'
    ) THEN
      RETURN NEW;
    END IF;

    INSERT INTO public.support_tickets
      (customer_id, topic, subject, status, unread_by_customer, unread_by_clinic)
    VALUES
      (NEW.id, 'welcome', 'Welcome to Ayurvedic Wellness Centre', 'open', TRUE, FALSE)
    RETURNING id INTO v_ticket_id;

    INSERT INTO public.support_messages (ticket_id, sender_kind, body)
    VALUES (
      v_ticket_id, 'clinic',
      E'Welcome to Ayurvedic Wellness Centre.\n\n'
      'We''re honoured to have you in our practice. Use this space for any '
      'questions about treatments, products, or your daily routine — we''ll '
      'respond within 24 hours on weekdays.\n\n'
      'For urgent matters, message us directly on WhatsApp at +6011-6339 3436. '
      'Wishing you good health.'
    );
  END IF;
  RETURN NEW;
END;
$$;

UPDATE public.support_tickets
SET subject = 'Welcome to Ayurvedic Wellness Centre'
WHERE topic = 'welcome' AND subject = 'Welcome to Kerala Ayurvedic Lifestyle Vaidyasalai';

UPDATE public.support_messages
SET body = replace(replace(body,
  'Welcome to Kerala Ayurvedic Lifestyle Vaidyasalai.', 'Welcome to Ayurvedic Wellness Centre.'),
  '+60 11-6504 3436', '+6011-6339 3436')
WHERE body LIKE '%Kerala Ayurvedic Lifestyle Vaidyasalai%' OR body LIKE '%+60 11-6504 3436%';

ALTER TABLE public.appointments ALTER COLUMN doctor_name SET DEFAULT 'our Vaidya';

UPDATE public.appointments
SET doctor_name = 'our Vaidya'
WHERE doctor_name = 'Vaidya AKHIL HS (B.A.M.S)';
