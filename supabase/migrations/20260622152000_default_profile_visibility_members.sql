alter table public.profiles
  alter column visibility set default 'members'::public.profile_visibility;

comment on column public.profiles.visibility is
  'Profile exposure level. New profiles default to community-only visibility; users must opt in to public discovery.';
