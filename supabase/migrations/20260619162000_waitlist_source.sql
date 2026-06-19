alter table public.waitlist_signups
add column if not exists source text not null default 'Website Waitlist';

create index if not exists waitlist_signups_source_created_idx
on public.waitlist_signups (source, created_at desc);
