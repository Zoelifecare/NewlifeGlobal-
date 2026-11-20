-- New Life Global — core schema
-- Conventions: uuid PKs, timestamptz, text + CHECK instead of enums (easier to evolve),
-- publishable rows carry status + published_at (future published_at = scheduled).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- helpers
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------- people & access
create table public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  full_name      text not null default '' check (char_length(full_name) <= 120),
  email          text,
  avatar_url     text,
  is_prayer_team boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table public.media_assets (
  id                uuid primary key default gen_random_uuid(),
  bucket            text not null default 'media',
  path              text unique,                       -- storage path; null for external embeds
  external_url      text,                              -- YouTube / Instagram / remote image
  kind              text not null check (kind in ('image','video','audio','embed','document')),
  mime_type         text,
  size_bytes        bigint check (size_bytes is null or size_bytes between 0 and 52428800),
  width             int,
  height            int,
  alt_text          text not null default '' check (char_length(alt_text) <= 300),
  caption           text,
  credit            text,
  source_url        text,
  permission_status text not null default 'pending'
                    check (permission_status in ('owner_approved','licensed','embed_only','pending')),
  permission_note   text,
  category          text,
  created_by        uuid references public.profiles (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint media_has_location check (path is not null or external_url is not null)
);
create index media_assets_category_idx on public.media_assets (category);

create table public.ministries (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name             text not null check (char_length(name) between 2 and 120),
  tagline          text,
  summary          text,
  description      text,
  image_id         uuid references public.media_assets (id) on delete set null,
  meeting_schedule text,
  location         text,
  contact_email    text,
  activities       text[] not null default '{}',
  join_url         text,
  sort_order       int not null default 0,
  status           text not null default 'draft' check (status in ('draft','published','archived')),
  published_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index ministries_public_idx on public.ministries (status, published_at, sort_order);

create table public.user_roles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  role        text not null check (role in ('super_admin','content_editor','ministry_manager')),
  ministry_id uuid references public.ministries (id) on delete cascade,
  created_at  timestamptz not null default now(),
  constraint ministry_scope check (
    (role = 'ministry_manager' and ministry_id is not null) or
    (role <> 'ministry_manager' and ministry_id is null))
);
create unique index user_roles_unique on public.user_roles (user_id, role, coalesce(ministry_id, '00000000-0000-0000-0000-000000000000'::uuid));
create index user_roles_user_idx on public.user_roles (user_id);

-- ---------------------------------------------------------------- site configuration
create table public.site_settings (
  key        text primary key check (key ~ '^[a-z0-9_.]+$'),
  value      jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

create table public.homepage_sections (
  id         uuid primary key default gen_random_uuid(),
  key        text not null unique,          -- 'hero','chapters','discover','messages','events','ministries','global','testimonies','invitation'
  kicker     text,
  title      text,
  body       text,
  data       jsonb not null default '{}'::jsonb,   -- section-specific config (slides, CTA labels, featured ids, media ids)
  sort_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- people
create table public.leadership (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name         text not null check (char_length(name) between 2 and 120),
  title        text not null,
  role_group   text not null default 'pastor' check (role_group in ('pastor','leader','staff')),
  bio          text,
  photo_id     uuid references public.media_assets (id) on delete set null,
  email        text,
  instagram    text,
  needs_review boolean not null default false,   -- bio not yet confirmed by owner
  sort_order   int not null default 0,
  status       text not null default 'draft' check (status in ('draft','published','archived')),
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.ministry_leaders (
  ministry_id   uuid not null references public.ministries (id) on delete cascade,
  leadership_id uuid not null references public.leadership (id) on delete cascade,
  role_title    text,
  sort_order    int not null default 0,
  primary key (ministry_id, leadership_id)
);

-- ---------------------------------------------------------------- messages
create table public.sermon_categories (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  name       text not null,
  sort_order int not null default 0
);

create table public.sermons (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title         text not null check (char_length(title) between 2 and 200),
  speaker_id    uuid references public.leadership (id) on delete set null,
  speaker_name  text,                              -- for guest speakers
  description   text,
  scripture     text,
  series        text,
  category_id   uuid references public.sermon_categories (id) on delete set null,
  video_url     text,
  audio_url     text,
  thumbnail_id  uuid references public.media_assets (id) on delete set null,
  duration_min  int check (duration_min is null or duration_min > 0),
  preached_on   date,
  is_featured   boolean not null default false,
  source_note   text,                              -- e.g. 'New Life Bible Church Rwanda YouTube'
  status        text not null default 'draft' check (status in ('draft','published','archived')),
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  search        tsvector generated always as (
                  to_tsvector('english', coalesce(title,'') || ' ' || coalesce(speaker_name,'') || ' ' ||
                                         coalesce(scripture,'') || ' ' || coalesce(series,'') || ' ' || coalesce(description,''))) stored
);
create index sermons_public_idx on public.sermons (status, published_at desc);
create index sermons_search_idx on public.sermons using gin (search);
create index sermons_category_idx on public.sermons (category_id);

-- ---------------------------------------------------------------- events
create table public.events (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title            text not null check (char_length(title) between 2 and 200),
  summary          text,
  description      text,
  category         text,
  starts_at        timestamptz not null,
  ends_at          timestamptz,
  venue            text,
  address          text,
  registration_url text,
  image_id         uuid references public.media_assets (id) on delete set null,
  is_featured      boolean not null default false,
  status           text not null default 'draft' check (status in ('draft','published','archived')),
  published_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint event_time_order check (ends_at is null or ends_at >= starts_at)
);
create index events_public_idx on public.events (status, published_at, starts_at);

-- ---------------------------------------------------------------- gallery
create table public.gallery_categories (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  name       text not null,
  sort_order int not null default 0
);

create table public.gallery_items (
  id           uuid primary key default gen_random_uuid(),
  media_id     uuid not null references public.media_assets (id) on delete cascade,
  category_id  uuid references public.gallery_categories (id) on delete set null,
  ministry_id  uuid references public.ministries (id) on delete set null,
  event_id     uuid references public.events (id) on delete set null,
  title        text,
  caption      text,
  sort_order   int not null default 0,
  status       text not null default 'draft' check (status in ('draft','published','archived')),
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index gallery_items_public_idx on public.gallery_items (status, published_at, category_id, sort_order);

-- ---------------------------------------------------------------- announcements
create table public.announcements (
  id           uuid primary key default gen_random_uuid(),
  title        text not null check (char_length(title) between 2 and 200),
  body         text,
  link_url     text,
  link_label   text,
  is_pinned    boolean not null default false,
  expires_at   timestamptz,
  status       text not null default 'draft' check (status in ('draft','published','archived')),
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------- private submissions
create table public.prayer_requests (
  id             uuid primary key default gen_random_uuid(),
  name           text check (name is null or char_length(name) <= 120),
  email          text check (email is null or (char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  request        text not null check (char_length(request) between 3 and 4000),
  may_contact    boolean not null default false,
  status         text not null default 'new' check (status in ('new','praying','followed_up','answered','archived')),
  internal_notes text,
  assigned_to    uuid references public.profiles (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index prayer_requests_status_idx on public.prayer_requests (status, created_at desc);

create table public.contact_messages (
  id             uuid primary key default gen_random_uuid(),
  kind           text not null default 'contact' check (kind in ('contact','visit')),
  name           text not null check (char_length(name) between 1 and 120),
  email          text not null check (char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone          text check (phone is null or char_length(phone) <= 40),
  subject        text check (subject is null or char_length(subject) <= 200),
  message        text not null check (char_length(message) between 1 and 4000),
  visit_date     date,
  party_size     int check (party_size is null or party_size between 1 and 50),
  status         text not null default 'new' check (status in ('new','read','replied','archived')),
  internal_notes text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index contact_messages_status_idx on public.contact_messages (status, created_at desc);

create table public.newsletter_subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text not null check (char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  name       text check (name is null or char_length(name) <= 120),
  status     text not null default 'subscribed' check (status in ('subscribed','unsubscribed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index newsletter_email_unique on public.newsletter_subscribers (lower(email));

-- ---------------------------------------------------------------- operations
create table public.audit_logs (
  id         bigint generated always as identity primary key,
  actor_id   uuid,
  action     text not null,
  table_name text not null,
  record_id  text,
  summary    text,
  changed    text[],
  created_at timestamptz not null default now()
);
create index audit_logs_created_idx on public.audit_logs (created_at desc);

create table public.rate_limits (
  key          text primary key,
  window_start timestamptz not null default now(),
  hits         int not null default 0
);

-- ---------------------------------------------------------------- updated_at triggers
do $$
declare t text;
begin
  foreach t in array array['profiles','media_assets','ministries','homepage_sections','leadership','sermons',
                           'events','gallery_items','announcements','prayer_requests','contact_messages',
                           'newsletter_subscribers'] loop
    execute format('create trigger %I_updated_at before update on public.%I
                    for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------- auto-set published_at
create or replace function public.stamp_published_at() returns trigger
language plpgsql as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['ministries','leadership','sermons','events','gallery_items','announcements'] loop
    execute format('create trigger %I_stamp_published before insert or update on public.%I
                    for each row execute function public.stamp_published_at()', t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------- new auth user -> profile
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
