-- Front desk wants therapist columns in a specific, fixed order (not
-- alphabetical by code) — the order they're used to from before the roster
-- moved into the database: Nithin, Deepak, Bintu (male), then
-- Sreeja Mol, Seeta, Asha (female).
alter table public.therapists
  add column if not exists sort_order integer not null default 100;

update public.therapists set sort_order = 1 where code = 'NT02'; -- Nithin
update public.therapists set sort_order = 2 where code = 'DP03'; -- Deepak
update public.therapists set sort_order = 3 where code = 'BN08'; -- Bintu
update public.therapists set sort_order = 4 where code = 'SM05'; -- Sreeja Mol
update public.therapists set sort_order = 5 where code = 'CR08'; -- Seeta
update public.therapists set sort_order = 6 where code = 'AS12'; -- Asha
