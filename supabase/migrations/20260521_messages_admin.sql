-- =====================================================================
-- Admin Messages / Support Inbox — DB Delta (2026-05-21)
-- =====================================================================
-- Adds staff-only fields to support_tickets:
--   * internal_notes — never shown to the customer
--   * assigned_to_admin_id — which staff member owns this ticket
--
-- Safe to re-run. Apply via Supabase SQL Editor.
-- =====================================================================

ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS internal_notes        TEXT,
  ADD COLUMN IF NOT EXISTS assigned_to_admin_id  UUID REFERENCES public.users(id);

CREATE INDEX IF NOT EXISTS support_tickets_assigned_idx
  ON public.support_tickets(assigned_to_admin_id)
  WHERE assigned_to_admin_id IS NOT NULL;
