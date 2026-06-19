alter table public.waitlist_signups
add column if not exists telegram_handle text;

drop function if exists public.get_invite_by_token(text);

create function public.get_invite_by_token(invite_token text)
returns table (
  id uuid,
  email text,
  telegram_handle text,
  status public.invite_status,
  expires_at timestamptz,
  waitlist_name text,
  waitlist_role text,
  waitlist_building text,
  waitlist_telegram_handle text,
  waitlist_x_handle text,
  waitlist_linkedin text,
  waitlist_website text,
  waitlist_project_url text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    i.id,
    i.email,
    coalesce(i.telegram_handle, w.telegram_handle) as telegram_handle,
    i.status,
    i.expires_at,
    w.name as waitlist_name,
    w.role as waitlist_role,
    w.building as waitlist_building,
    w.telegram_handle as waitlist_telegram_handle,
    w.x_handle as waitlist_x_handle,
    w.linkedin as waitlist_linkedin,
    w.website as waitlist_website,
    w.project_url as waitlist_project_url
  from public.invites i
  left join public.waitlist_signups w on w.invite_id = i.id
  where i.token = invite_token
    and i.status = 'pending'
    and (i.expires_at is null or i.expires_at > now())
  limit 1;
$$;

grant execute on function public.get_invite_by_token(text) to anon, authenticated;
