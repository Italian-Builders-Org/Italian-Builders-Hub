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

  if exists (
    select 1
    from public.profiles p
    where p.id = user_id
  ) then
    raise exception 'You are already signed in with an approved member account. Sign out before accepting a different invite.';
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

grant execute on function public.accept_invite(text, text, text, text, text, text, text, text[], text[], text[], text, text, text, text) to authenticated;
