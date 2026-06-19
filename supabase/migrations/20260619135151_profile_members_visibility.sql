do $$
begin
  if not exists (
    select 1
    from pg_enum
    where enumtypid = 'public.profile_visibility'::regtype
      and enumlabel = 'members'
  ) then
    alter type public.profile_visibility add value 'members';
  end if;
end $$;

drop policy if exists "Public profiles are readable" on public.profiles;
drop policy if exists "Visible profiles are readable" on public.profiles;

create policy "Visible profiles are readable"
on public.profiles for select
using (
  visibility = 'public'
  or (
    visibility::text = 'members'
    and auth.uid() is not null
  )
  or id = auth.uid()
  or private.is_platform_admin()
);
