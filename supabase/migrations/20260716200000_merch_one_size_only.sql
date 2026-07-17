-- Caps are one size only. Tighten constraint if the table already exists
-- with the broader size check from the initial merch migration.

alter table public.merch_interest_signups
  drop constraint if exists merch_interest_signups_size_check;

update public.merch_interest_signups
set size = 'osfa'
where size is distinct from 'osfa';

alter table public.merch_interest_signups
  alter column size set default 'osfa';

alter table public.merch_interest_signups
  add constraint merch_interest_signups_size_check check (size = 'osfa');
