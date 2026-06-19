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
set search_path = public, private, pg_temp
as $$
  with invite as (
    select i.*
    from public.invites i
    where i.token = invite_token
      and i.status = 'pending'
      and (i.expires_at is null or i.expires_at > now())
    limit 1
  ),
  authorized as (
    select
      i.*,
      (
        private.is_platform_admin()
        or (
          auth.uid() is not null
          and i.email is not null
          and auth.email() is not null
          and lower(auth.email()) = lower(i.email)
        )
      ) as can_view_prefill
    from invite i
  )
  select
    case when i.can_view_prefill then i.id else null end as id,
    case when i.can_view_prefill then i.email else null end as email,
    case
      when i.can_view_prefill then coalesce(i.telegram_handle, w.telegram_handle)
      else null
    end as telegram_handle,
    i.status,
    i.expires_at,
    case when i.can_view_prefill then w.name else null end as waitlist_name,
    case when i.can_view_prefill then w.role else null end as waitlist_role,
    case when i.can_view_prefill then w.building else null end as waitlist_building,
    case when i.can_view_prefill then w.telegram_handle else null end as waitlist_telegram_handle,
    case when i.can_view_prefill then w.x_handle else null end as waitlist_x_handle,
    case when i.can_view_prefill then w.linkedin else null end as waitlist_linkedin,
    case when i.can_view_prefill then w.website else null end as waitlist_website,
    case when i.can_view_prefill then w.project_url else null end as waitlist_project_url
  from authorized i
  left join public.waitlist_signups w on w.invite_id = i.id;
$$;

create or replace function public.accept_invite(
  invite_token text,
  profile_username text,
  profile_full_name text,
  profile_headline text,
  profile_bio text,
  profile_telegram_handle text,
  profile_role text,
  profile_languages text[],
  profile_skills text[] default '{}',
  profile_looking_for text[] default '{}',
  profile_website_url text default null,
  profile_linkedin_url text default null,
  profile_x_url text default null,
  profile_github_url text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  current_profile public.profiles;
  invite_row public.invites;
  user_id uuid := auth.uid();
  user_email text := auth.email();
begin
  if user_id is null then
    raise exception 'You must be signed in to accept an invite.';
  end if;

  select *
  into invite_row
  from public.invites
  where token = invite_token
    and status = 'pending'
    and (expires_at is null or expires_at > now())
  for update;

  if invite_row.id is null then
    raise exception 'Invite is invalid, expired, or already used.';
  end if;

  if invite_row.email is not null and (
    user_email is null or lower(user_email) <> lower(invite_row.email)
  ) then
    raise exception 'Sign in with the email address this invite was sent to.';
  end if;

  insert into public.profiles (
    id,
    username,
    full_name,
    headline,
    bio,
    telegram_handle,
    email,
    role,
    languages,
    skills,
    looking_for,
    website_url,
    linkedin_url,
    x_url,
    github_url,
    onboarding_completed
  )
  values (
    user_id,
    lower(profile_username),
    profile_full_name,
    profile_headline,
    profile_bio,
    coalesce(nullif(profile_telegram_handle, ''), invite_row.telegram_handle),
    coalesce(user_email, invite_row.email),
    profile_role,
    coalesce(profile_languages, '{}'),
    coalesce(profile_skills, '{}'),
    coalesce(profile_looking_for, '{}'),
    profile_website_url,
    profile_linkedin_url,
    profile_x_url,
    profile_github_url,
    true
  )
  on conflict (id) do update set
    username = excluded.username,
    full_name = excluded.full_name,
    headline = excluded.headline,
    bio = excluded.bio,
    telegram_handle = excluded.telegram_handle,
    email = excluded.email,
    role = excluded.role,
    languages = excluded.languages,
    skills = excluded.skills,
    looking_for = excluded.looking_for,
    website_url = excluded.website_url,
    linkedin_url = excluded.linkedin_url,
    x_url = excluded.x_url,
    github_url = excluded.github_url,
    onboarding_completed = true,
    updated_at = now()
  returning *
  into current_profile;

  update public.invites
  set
    status = 'accepted',
    accepted_by = user_id,
    accepted_at = now()
  where id = invite_row.id;

  return current_profile;
end;
$$;

grant execute on function public.get_invite_by_token(text) to anon, authenticated;
grant execute on function public.accept_invite(text, text, text, text, text, text, text, text[], text[], text[], text, text, text, text) to authenticated;
