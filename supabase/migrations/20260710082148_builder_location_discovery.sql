alter table public.profiles
add column if not exists municipality_istat_code text,
add column if not exists province_code text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_municipality_istat_code_fkey'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
    add constraint profiles_municipality_istat_code_fkey
    foreign key (municipality_istat_code)
    references public.italian_cities(istat_code)
    on delete set null;
  end if;
end $$;

alter table public.profiles
drop constraint if exists profiles_province_code_format;

alter table public.profiles
add constraint profiles_province_code_format
check (province_code is null or province_code ~ '^[A-Z]{2}$');

comment on column public.profiles.municipality_istat_code is
  'ISTAT code from public.italian_cities for deterministic member discovery by comune.';

comment on column public.profiles.province_code is
  'Italian provincia code inferred from public.italian_cities for member discovery filters.';

create index if not exists profiles_visibility_location_idx
on public.profiles (visibility, province_code, municipality_istat_code, city)
where city is not null or province_code is not null or municipality_istat_code is not null;

create or replace function public.infer_profile_city_coordinates()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  normalized_country text;
  normalized_city text;
  matched_city public.italian_cities%rowtype;
  should_infer_coordinates boolean := false;
begin
  new.municipality_istat_code := nullif(trim(coalesce(new.municipality_istat_code, '')), '');
  new.province_code := nullif(upper(trim(coalesce(new.province_code, ''))), '');

  if new.municipality_istat_code is not null then
    select c.*
    into matched_city
    from public.italian_cities c
    where c.istat_code = new.municipality_istat_code
    limit 1;

    if found then
      new.city := matched_city.name;
      new.country := 'Italy';
      new.latitude := matched_city.latitude;
      new.longitude := matched_city.longitude;
      new.province_code := matched_city.province_code;
      return new;
    end if;

    new.municipality_istat_code := null;
    new.province_code := null;
  end if;

  normalized_country := lower(trim(coalesce(new.country, '')));
  normalized_city := public.normalize_italian_city_search(new.city);

  if normalized_city = '' then
    new.municipality_istat_code := null;
    new.province_code := null;
    return new;
  end if;

  if normalized_country not in ('', 'italy', 'italia', 'it') then
    new.municipality_istat_code := null;
    new.province_code := null;
    return new;
  end if;

  if tg_op = 'INSERT' then
    should_infer_coordinates := new.latitude is null or new.longitude is null;
  else
    should_infer_coordinates := (
      new.latitude is null
      or new.longitude is null
      or (
        (
          new.city is distinct from old.city
          or new.country is distinct from old.country
          or new.province_code is distinct from old.province_code
        )
        and new.latitude is not distinct from old.latitude
        and new.longitude is not distinct from old.longitude
      )
    );
  end if;

  select c.*
  into matched_city
  from public.italian_cities c
  where c.search_name = normalized_city
    and (new.province_code is null or c.province_code = new.province_code)
    and not exists (
      select 1
      from public.italian_cities duplicate
      where duplicate.search_name = c.search_name
        and (new.province_code is null or duplicate.province_code = new.province_code)
        and duplicate.istat_code <> c.istat_code
    )
  limit 1;

  if found then
    new.municipality_istat_code := matched_city.istat_code;
    new.province_code := matched_city.province_code;

    if should_infer_coordinates then
      new.city := matched_city.name;
      new.country := 'Italy';
      new.latitude := matched_city.latitude;
      new.longitude := matched_city.longitude;
    end if;
  else
    new.municipality_istat_code := null;
    new.province_code := null;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_infer_city_coordinates on public.profiles;
create trigger profiles_infer_city_coordinates
before insert or update of city, country, latitude, longitude, municipality_istat_code, province_code on public.profiles
for each row execute function public.infer_profile_city_coordinates();

with unique_city_coordinates as (
  select max(istat_code) as istat_code, search_name
  from public.italian_cities
  group by search_name
  having count(*) = 1
)
update public.profiles profile
set
  municipality_istat_code = city.istat_code,
  province_code = city.province_code,
  city = city.name,
  country = 'Italy',
  latitude = coalesce(profile.latitude, city.latitude),
  longitude = coalesce(profile.longitude, city.longitude)
from unique_city_coordinates unique_city
join public.italian_cities city on city.istat_code = unique_city.istat_code
where public.normalize_italian_city_search(profile.city) = unique_city.search_name
  and lower(trim(coalesce(profile.country, ''))) in ('', 'italy', 'italia', 'it')
  and (
    profile.municipality_istat_code is null
    or profile.province_code is null
    or profile.latitude is null
    or profile.longitude is null
  );
