create or replace function public.protect_profile_platform_role()
returns trigger
language plpgsql
set search_path = public, private, pg_temp
as $$
declare
  can_manage_profile_admin_fields boolean := (
    private.is_platform_admin()
    or current_user not in ('anon', 'authenticated')
  );
begin
  if tg_op = 'INSERT' then
    if new.platform_role is null then
      new.platform_role = 'member';
    end if;

    if new.platform_role <> 'member' and not can_manage_profile_admin_fields then
      raise exception 'Only platform admins can assign platform roles.';
    end if;

    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.platform_role is distinct from old.platform_role and not can_manage_profile_admin_fields then
      raise exception 'Only platform admins can change platform roles.';
    end if;

    if new.email is distinct from old.email and not can_manage_profile_admin_fields then
      raise exception 'Only platform admins can change profile email.';
    end if;
  end if;

  return new;
end;
$$;

comment on function public.protect_profile_platform_role()
is 'Enforces durable platform roles: roles are never inferred from profiles.email, non-admin inserts stay members, and non-admin updates cannot change platform_role or email.';
