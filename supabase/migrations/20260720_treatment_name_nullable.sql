-- Internal staff bookings (Vaidya quick-consultation from the schedule grid,
-- and the 5 generic duration-only options) intentionally omit a treatment,
-- but appointments.treatment_name was still NOT NULL, so those inserts fail.
alter table public.appointments
  alter column treatment_name drop not null;
