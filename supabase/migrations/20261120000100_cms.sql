-- New Life Global: CMS round 2 (owner feedback 2026-11-20)
--  * Church Identity content with draft / submit / approve / publish workflow
--  * Version history + restore for identity content and site settings
--  * Audit log keeps previous/new values and the outcome (submitted / published / restored)
--  * Sermon publication rules enforced in the database
--  * Ministry managers manage their ministry's events; featured ministries; album descriptions/visibility

-- ================================================================ schema additions
alter table public.ministries add column if not exists is_featured boolean not null default false;

alter table public.events add column if not exists ministry_id uuid references public.ministries (id) on delete set null;
create index if not exists events_ministry_idx on public.events (ministry_id);

alter table public.gallery_categories
  add column if not exists description text,
  add column if not exists is_visible boolean not null default true,
  add column if not exists cover_media_id uuid references public.media_assets (id) on delete set null;

alter table public.leadership add column if not exists publish_sermons_anywhere boolean not null default false;

alter table public.sermons
  add column if not exists location text,
  add column if not exists preached_in_arizona boolean not null default false,
  add column if not exists preacher_verified boolean not null default false,
  add column if not exists location_verified boolean not null default false;

alter table public.audit_logs
  add column if not exists old_values jsonb,
  add column if not exists new_values jsonb,
  add column if not exists outcome text;

-- ================================================================ church identity content
create table public.church_content (
  key               text primary key check (key ~ '^[a-z0-9_]+$'),
  label             text not null,
  sort_order        int not null default 0,
  requires_approval boolean not null default true,   -- mission, vision, beliefs, story: super admin approves
  draft             jsonb not null default '{}'::jsonb, -- { "title": "...", "body": "...", "items": [{ "title": "...", "text": "..." }] }
  published         jsonb,                            -- what the public website shows (null = nothing public)
  status            text not null default 'draft'
                    check (status in ('draft', 'pending', 'published', 'needs_confirmation')),
  review_note       text,
  submitted_by      uuid references public.profiles (id) on delete set null,
  submitted_at      timestamptz,
  approved_by       uuid references public.profiles (id) on delete set null,
  published_at      timestamptz,
  updated_by        uuid references public.profiles (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create trigger church_content_updated_at before update on public.church_content
  for each row execute function public.set_updated_at();

-- Public read model: only published values, never drafts or review notes.
-- (A plain view runs with its owner's rights, so anon reads it without touching the base table.)
create view public.published_church_content as
  select key, published, published_at from public.church_content where published is not null;

create table public.content_versions (
  id          bigint generated always as identity primary key,
  entity      text not null,             -- 'church_content' | 'site_settings'
  entity_key  text not null,
  data        jsonb not null,
  event       text not null check (event in ('saved', 'submitted', 'published', 'restored', 'rejected')),
  actor_id    uuid,
  note        text,
  created_at  timestamptz not null default now()
);
create index content_versions_lookup on public.content_versions (entity, entity_key, created_at desc);

-- ================================================================ privileges + RLS
grant select on public.published_church_content to anon, authenticated;
revoke all on public.church_content, public.content_versions from anon;
grant select, insert, update on public.church_content to authenticated;
grant select on public.content_versions to authenticated;

alter table public.church_content enable row level security;
alter table public.content_versions enable row level security;

create policy church_content_read on public.church_content for select to authenticated using (public.is_staff());
create policy church_content_insert on public.church_content for insert to authenticated with check (public.is_admin());
create policy church_content_update on public.church_content for update to authenticated
  using (public.can_edit_content()) with check (public.can_edit_content());
-- no delete policy: identity entries are never deleted, only edited

create policy content_versions_read on public.content_versions for select to authenticated using (public.can_edit_content());
-- versions are written only by security-definer triggers/functions

-- Editors may only change the draft and move it to "draft"/"pending". Publishing an approval-required
-- entry, or touching approval fields, is reserved for super admins (via the functions below).
create or replace function public.guard_church_content() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user not in ('anon', 'authenticated') or public.is_admin() then
    return new;
  end if;
  if new.key is distinct from old.key or new.requires_approval is distinct from old.requires_approval
     or new.approved_by is distinct from old.approved_by then
    raise exception 'Only a super admin can change this field' using errcode = '42501';
  end if;
  if old.requires_approval and (new.published is distinct from old.published or new.status = 'published') then
    raise exception 'This content must be approved by a super admin before it is published' using errcode = '42501';
  end if;
  if new.status not in ('draft', 'pending', 'published', 'needs_confirmation') then
    raise exception 'Invalid status' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger church_content_guard before update on public.church_content
  for each row execute function public.guard_church_content();

-- save a draft (editors); records a version
create or replace function public.save_church_content_draft(p_key text, p_draft jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.can_edit_content() then raise exception 'not authorized' using errcode = '42501'; end if;
  if p_draft is null or jsonb_typeof(p_draft) <> 'object' or length(p_draft::text) > 40000 then
    raise exception 'invalid content' using errcode = '22023';
  end if;
  update public.church_content
     set draft = p_draft, updated_by = auth.uid(),
         status = case when status = 'pending' then 'draft' else case when status = 'published' then 'draft' else status end end
   where key = p_key;
  if not found then raise exception 'unknown content key' using errcode = '22023'; end if;
  insert into public.content_versions (entity, entity_key, data, event, actor_id) values ('church_content', p_key, p_draft, 'saved', auth.uid());
end $$;

-- submit for approval (editors)
create or replace function public.submit_church_content(p_key text, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_draft jsonb;
begin
  if not public.can_edit_content() then raise exception 'not authorized' using errcode = '42501'; end if;
  update public.church_content
     set status = 'pending', submitted_by = auth.uid(), submitted_at = now(), review_note = left(p_note, 1000)
   where key = p_key returning draft into v_draft;
  if not found then raise exception 'unknown content key' using errcode = '22023'; end if;
  insert into public.content_versions (entity, entity_key, data, event, actor_id, note)
  values ('church_content', p_key, v_draft, 'submitted', auth.uid(), left(p_note, 1000));
end $$;

-- publish (approval-required: super admin only; others: content editors)
create or replace function public.publish_church_content(p_key text)
returns void language plpgsql security definer set search_path = public as $$
declare v_row public.church_content;
begin
  select * into v_row from public.church_content where key = p_key for update;
  if not found then raise exception 'unknown content key' using errcode = '22023'; end if;
  if v_row.requires_approval and not public.is_admin() then
    raise exception 'This content must be approved by a super admin' using errcode = '42501';
  end if;
  if not v_row.requires_approval and not public.can_edit_content() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if coalesce(v_row.draft ->> 'body', '') = '' and coalesce(jsonb_array_length(v_row.draft -> 'items'), 0) = 0 then
    raise exception 'Nothing to publish: the draft is empty' using errcode = '22023';
  end if;
  update public.church_content
     set published = v_row.draft, status = 'published', published_at = now(),
         approved_by = case when v_row.requires_approval then auth.uid() else approved_by end,
         review_note = null, updated_by = auth.uid()
   where key = p_key;
  insert into public.content_versions (entity, entity_key, data, event, actor_id)
  values ('church_content', p_key, v_row.draft, 'published', auth.uid());
end $$;

-- send back to the editor (super admin)
create or replace function public.reject_church_content(p_key text, p_note text)
returns void language plpgsql security definer set search_path = public as $$
declare v_draft jsonb;
begin
  if not public.is_admin() then raise exception 'not authorized' using errcode = '42501'; end if;
  update public.church_content set status = 'draft', review_note = left(p_note, 1000)
   where key = p_key returning draft into v_draft;
  if not found then raise exception 'unknown content key' using errcode = '22023'; end if;
  insert into public.content_versions (entity, entity_key, data, event, actor_id, note)
  values ('church_content', p_key, v_draft, 'rejected', auth.uid(), left(p_note, 1000));
end $$;

-- unpublish (super admin): removes it from the public site, keeps the draft
create or replace function public.unpublish_church_content(p_key text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not authorized' using errcode = '42501'; end if;
  update public.church_content set published = null, status = 'draft' where key = p_key;
end $$;

-- restore an earlier version into the draft (editors); publishing it again follows the normal workflow
create or replace function public.restore_content_version(p_version bigint)
returns text language plpgsql security definer set search_path = public as $$
declare v public.content_versions;
begin
  if not public.can_edit_content() then raise exception 'not authorized' using errcode = '42501'; end if;
  select * into v from public.content_versions where id = p_version;
  if not found then raise exception 'unknown version' using errcode = '22023'; end if;
  if v.entity = 'church_content' then
    update public.church_content set draft = v.data, status = 'draft', updated_by = auth.uid() where key = v.entity_key;
  elsif v.entity = 'site_settings' then
    update public.site_settings set value = v.data, updated_by = auth.uid() where key = v.entity_key;
  end if;
  insert into public.content_versions (entity, entity_key, data, event, actor_id, note)
  values (v.entity, v.entity_key, v.data, 'restored', auth.uid(), 'from version ' || v.id);
  return v.entity_key;
end $$;

revoke all on function public.save_church_content_draft(text, jsonb), public.submit_church_content(text, text),
  public.publish_church_content(text), public.reject_church_content(text, text), public.unpublish_church_content(text),
  public.restore_content_version(bigint) from public;
grant execute on function public.save_church_content_draft(text, jsonb), public.submit_church_content(text, text),
  public.publish_church_content(text), public.reject_church_content(text, text), public.unpublish_church_content(text),
  public.restore_content_version(bigint) to authenticated;

-- site settings: every change is versioned
create or replace function public.version_site_settings() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and new.value is not distinct from old.value then return new; end if;
  insert into public.content_versions (entity, entity_key, data, event, actor_id)
  values ('site_settings', new.key, coalesce(old.value, new.value), 'saved', auth.uid());
  return new;
end $$;
create trigger site_settings_version after update on public.site_settings
  for each row execute function public.version_site_settings();

-- ================================================================ audit log: previous / new values + outcome
create or replace function public.write_audit_log() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_new jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) end;
  v_old jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) end;
  v_row jsonb := coalesce(v_new, v_old);
  v_changed text[];
  v_summary text;
  v_private boolean := tg_table_name in ('prayer_requests', 'contact_messages', 'newsletter_subscribers', 'profiles');
  v_before jsonb;
  v_after jsonb;
  v_outcome text;
begin
  if auth.uid() is null then          -- public form submissions are not "admin activity"
    return coalesce(new, old);
  end if;
  if tg_op = 'UPDATE' then
    select array_agg(k) into v_changed
    from jsonb_object_keys(v_new) k
    where k not in ('updated_at', 'search') and v_new -> k is distinct from v_old -> k;
    if v_changed is null then return new; end if;
  end if;
  -- private tables: only the column names, never the text
  if not v_private then
    if tg_op = 'UPDATE' then
      select jsonb_object_agg(k, v_old -> k), jsonb_object_agg(k, v_new -> k) into v_before, v_after
      from unnest(v_changed) k;
    elsif tg_op = 'INSERT' then v_after := v_new - 'search';
    else v_before := v_old - 'search';
    end if;
    -- keep the log compact
    if length(coalesce(v_before::text, '')) > 20000 then v_before := jsonb_build_object('truncated', true); end if;
    if length(coalesce(v_after::text, '')) > 20000 then v_after := jsonb_build_object('truncated', true); end if;
  end if;
  v_outcome := case
    when tg_op = 'UPDATE' and (v_new ->> 'status') is distinct from (v_old ->> 'status') then
      case v_new ->> 'status' when 'published' then 'published' when 'pending' then 'submitted for approval'
                              when 'archived' then 'archived' when 'draft' then 'moved to draft' else v_new ->> 'status' end
    when tg_op = 'INSERT' and v_new ->> 'status' = 'published' then 'published'
    else null end;
  v_summary := case when v_private then null
                    else coalesce(v_row ->> 'title', v_row ->> 'name', v_row ->> 'label', v_row ->> 'key', v_row ->> 'path') end;
  insert into public.audit_logs (actor_id, action, table_name, record_id, summary, changed, old_values, new_values, outcome)
  values (auth.uid(), lower(tg_op), tg_table_name, coalesce(v_row ->> 'id', v_row ->> 'key'),
          left(v_summary, 200), v_changed, v_before, v_after, v_outcome);
  return coalesce(new, old);
end $$;

create trigger church_content_audit after insert or update or delete on public.church_content
  for each row execute function public.write_audit_log();

-- ================================================================ sermon publication rules
-- 1. Pastor Charles' sermons (leaders flagged publish_sermons_anywhere) may be published wherever he preached.
-- 2. Other preachers only when the sermon was preached at the Arizona church.
-- 3. Preacher and location must be verified before publication; unverified sermons stay unpublished.
create or replace function public.enforce_sermon_policy() returns trigger
language plpgsql set search_path = public as $$
declare v_anywhere boolean := false;
begin
  if new.status <> 'published' then return new; end if;
  if not new.preacher_verified or not new.location_verified then
    raise exception 'sermon_policy: verify the preacher and the preaching location before publishing' using errcode = '23514';
  end if;
  if new.speaker_id is not null then
    select publish_sermons_anywhere into v_anywhere from public.leadership where id = new.speaker_id;
  end if;
  if not coalesce(v_anywhere, false) and not new.preached_in_arizona then
    raise exception 'sermon_policy: only sermons preached at the Arizona church can be published for this preacher' using errcode = '23514';
  end if;
  return new;
end $$;
create trigger sermons_policy before insert or update on public.sermons
  for each row execute function public.enforce_sermon_policy();

-- ================================================================ events: ministry managers manage their ministry's events
drop policy if exists events_insert on public.events;
drop policy if exists events_update on public.events;
drop policy if exists events_delete on public.events;
create policy events_insert on public.events for insert to authenticated
  with check (public.can_edit_content() or (ministry_id is not null and public.can_manage_ministry(ministry_id)));
create policy events_update on public.events for update to authenticated
  using (public.can_edit_content() or (ministry_id is not null and public.can_manage_ministry(ministry_id)))
  with check (public.can_edit_content() or (ministry_id is not null and public.can_manage_ministry(ministry_id)));
create policy events_delete on public.events for delete to authenticated
  using (public.can_edit_content() or (ministry_id is not null and public.can_manage_ministry(ministry_id)));

-- albums: hidden albums are not public
drop policy if exists gallery_categories_read on public.gallery_categories;
create policy gallery_categories_read on public.gallery_categories for select using (is_visible or public.is_staff());

-- dashboard: add pending approvals
create or replace function public.dashboard_counts() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_staff() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'sermons_published',  (select count(*) from sermons where public.is_live(status, published_at)),
    'events_upcoming',    (select count(*) from events where public.is_live(status, published_at) and coalesce(ends_at, starts_at) >= now()),
    'announcements_live', (select count(*) from announcements where public.is_live(status, published_at) and (expires_at is null or expires_at > now())),
    'gallery_items',      (select count(*) from gallery_items where public.is_live(status, published_at)),
    'messages_unread',    case when public.can_edit_content() then (select count(*) from contact_messages where status = 'new') end,
    'prayer_pending',     case when public.can_read_prayer() then (select count(*) from prayer_requests where status = 'new') end,
    'approvals_pending',  case when public.can_edit_content() then (select count(*) from church_content where status = 'pending') end,
    'needs_confirmation', case when public.can_edit_content() then (select count(*) from church_content where status = 'needs_confirmation') end
  );
end $$;
