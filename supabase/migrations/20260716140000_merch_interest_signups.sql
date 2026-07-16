create table if not exists public.merch_interest_signups (
  id bigserial primary key,
  name text not null,
  email text not null,
  phone text,
  color text not null,
  quantity integer not null default 1,
  size text not null default 'osfa',
  address_line1 text not null,
  address_line2 text,
  city text not null,
  province text,
  postal_code text not null,
  country text not null default 'Italy',
  notes text,
  status text not null default 'interested',
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint merch_interest_signups_email_lowercase check (email = lower(email)),
  constraint merch_interest_signups_color_check check (
    color in ('navy', 'white', 'sky')
  ),
  constraint merch_interest_signups_quantity_check check (
    quantity >= 1 and quantity <= 20
  ),
  constraint merch_interest_signups_size_check check (
    size = 'osfa'
  ),
  constraint merch_interest_signups_status_check check (
    status in ('interested', 'contacted', 'ordered', 'cancelled')
  ),
  constraint merch_interest_signups_email_color_key unique (email, color)
);

create index if not exists merch_interest_signups_created_at_idx
  on public.merch_interest_signups (created_at desc);

create index if not exists merch_interest_signups_status_idx
  on public.merch_interest_signups (status);

alter table public.merch_interest_signups enable row level security;

drop policy if exists "Admins can read merch interest" on public.merch_interest_signups;
create policy "Admins can read merch interest"
on public.merch_interest_signups for select
using (private.is_platform_admin());

drop policy if exists "Admins can manage merch interest" on public.merch_interest_signups;
create policy "Admins can manage merch interest"
on public.merch_interest_signups for all
using (private.is_platform_admin())
with check (private.is_platform_admin());

grant select, insert, update, delete on public.merch_interest_signups to authenticated;
grant usage, select on sequence public.merch_interest_signups_id_seq to authenticated;
