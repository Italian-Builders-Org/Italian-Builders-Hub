drop policy if exists "Users can create their own profile" on public.profiles;

create policy "Admins can create profiles directly"
on public.profiles for insert
with check (private.is_platform_admin());

comment on policy "Admins can create profiles directly" on public.profiles
is 'Members must be created through accept_invite(); direct profile creation is admin-only.';
