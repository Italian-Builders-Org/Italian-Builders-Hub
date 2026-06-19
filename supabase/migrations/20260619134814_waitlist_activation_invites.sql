alter table public.waitlist_signups
add column if not exists status text not null default 'pending',
add column if not exists activated_at timestamptz,
add column if not exists activated_by uuid references public.profiles(id) on delete set null,
add column if not exists invite_id uuid references public.invites(id) on delete set null,
add column if not exists invite_email_sent_at timestamptz,
add column if not exists invite_email_error text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'waitlist_signups_status_check'
      and conrelid = 'public.waitlist_signups'::regclass
  ) then
    alter table public.waitlist_signups
    add constraint waitlist_signups_status_check
    check (status in ('pending', 'active'));
  end if;
end $$;

create index if not exists waitlist_signups_status_created_idx
on public.waitlist_signups (status, created_at desc);

create index if not exists waitlist_signups_invite_id_idx
on public.waitlist_signups (invite_id);
