create or replace function private.is_valid_project_looking_for(value jsonb)
returns boolean
language sql
immutable
as $$
  select case
    when value is null then false
    when jsonb_typeof(value) <> 'array' then false
    when jsonb_array_length(value) > 8 then false
    else coalesce((
      select bool_and(
        jsonb_typeof(item) = 'object'
        and length(btrim(coalesce(item ->> 'tag', ''))) between 1 and 80
        and length(coalesce(item ->> 'message', '')) <= 200
      )
      from jsonb_array_elements(value) as item
    ), true)
  end;
$$;

alter table public.projects
add column if not exists looking_for jsonb not null default '[]'::jsonb;

alter table public.projects
drop constraint if exists projects_looking_for_valid;

alter table public.projects
add constraint projects_looking_for_valid
check (private.is_valid_project_looking_for(looking_for));
