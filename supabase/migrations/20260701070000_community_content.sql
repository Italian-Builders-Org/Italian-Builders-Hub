create table public.community_content (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  source_url text not null unique,
  provider text,
  content_type text not null default 'video',
  description text,
  tags text[] not null default '{}',
  author_label text,
  image_url text,
  og_image_url text,
  is_original boolean not null default false,
  is_public boolean not null default true,
  sort_order integer not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_content_slug_format check (slug ~ '^[a-z0-9][a-z0-9-]{2,100}$'),
  constraint community_content_source_url_http check (source_url ~* '^https?://')
);

create index community_content_public_idx
on public.community_content (is_public, sort_order, created_at desc);

create index community_content_tags_idx
on public.community_content using gin (tags);

create trigger community_content_touch_updated_at
before update on public.community_content
for each row execute function public.touch_updated_at();

alter table public.community_content enable row level security;

create policy "Public community content is readable"
on public.community_content for select
using (is_public = true or private.is_platform_admin());

create policy "Admins can manage community content"
on public.community_content for all
using (private.is_platform_admin())
with check (private.is_platform_admin());

grant select on public.community_content to anon, authenticated;
grant insert, update, delete on public.community_content to authenticated;

insert into public.community_content (
  title,
  slug,
  source_url,
  provider,
  content_type,
  description,
  tags,
  author_label,
  image_url,
  og_image_url,
  is_original,
  is_public,
  sort_order
)
values (
  'Hermes Agent',
  'hermes-agent',
  'https://www.youtube.com/watch?v=iAnPGbdWQX8',
  'YouTube',
  'video',
  'Italian Builders original content about Hermes Agent.',
  array['Italian Builders Original', 'Hermes Agent', 'AI Agents'],
  'Italian Builders',
  'https://i.ytimg.com/vi/iAnPGbdWQX8/hqdefault.jpg',
  'https://i.ytimg.com/vi/iAnPGbdWQX8/hqdefault.jpg',
  true,
  true,
  10
)
on conflict (source_url) do update set
  title = excluded.title,
  slug = excluded.slug,
  provider = excluded.provider,
  content_type = excluded.content_type,
  description = excluded.description,
  tags = excluded.tags,
  author_label = excluded.author_label,
  image_url = excluded.image_url,
  og_image_url = excluded.og_image_url,
  is_original = excluded.is_original,
  is_public = excluded.is_public,
  sort_order = excluded.sort_order;
