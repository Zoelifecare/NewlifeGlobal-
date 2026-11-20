-- New Life Global — authorization helpers, Row Level Security, rate limiting, audit log

-- ================================================================ helper functions
-- SECURITY DEFINER so they can read user_roles regardless of the caller's RLS; fixed search_path.
create or replace function public.has_role(p_role text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid() and role = p_role);
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid());
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select public.has_role('super_admin');
$$;

create or replace function public.can_edit_content() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles
                 where user_id = auth.uid() and role in ('super_admin','content_editor'));
$$;

create or replace function public.can_manage_ministry(p_ministry uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.can_edit_content() or exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'ministry_manager' and ministry_id = p_ministry);
$$;

create or replace function public.can_read_prayer() returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin() or (public.is_staff() and exists (
    select 1 from public.profiles where id = auth.uid() and is_prayer_team));
$$;

-- Public visibility rule shared by every publishable table
create or replace function public.is_live(p_status text, p_published_at timestamptz) returns boolean
language sql stable as $$
  select p_status = 'published' and p_published_at is not null and p_published_at <= now();
$$;

-- ================================================================ table privileges
-- (Supabase grants these by default; stated explicitly so the intent is reviewable.)
grant usage on schema public to anon, authenticated;
grant select on public.site_settings, public.homepage_sections, public.ministries, public.ministry_leaders,
                public.leadership, public.sermon_categories, public.sermons, public.events,
                public.gallery_categories, public.gallery_items, public.announcements, public.media_assets
  to anon, authenticated;
grant insert on public.prayer_requests, public.contact_messages, public.newsletter_subscribers to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
revoke all on public.rate_limits from anon, authenticated;
revoke insert, update, delete on public.audit_logs from anon, authenticated;
-- anon can never read private submissions, even if a policy were mis-written
revoke select, update, delete on public.prayer_requests, public.contact_messages, public.newsletter_subscribers,
                                 public.profiles, public.user_roles, public.audit_logs from anon;

-- ================================================================ enable RLS everywhere
do $$
declare t text;
begin
  foreach t in array array['profiles','user_roles','site_settings','homepage_sections','media_assets','ministries',
                           'ministry_leaders','leadership','sermon_categories','sermons','events',
                           'gallery_categories','gallery_items','announcements','prayer_requests',
                           'contact_messages','newsletter_subscribers','audit_logs','rate_limits'] loop
    -- ENABLE (not FORCE): the table owner used by SECURITY DEFINER helpers must bypass RLS,
    -- otherwise has_role() -> user_roles policy -> is_admin() -> has_role() would recurse.
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- ================================================================ publishable content
-- sermons, events, announcements, leadership: public reads live rows; staff read all; editors write.
do $$
declare t text;
begin
  foreach t in array array['sermons','events','announcements','leadership'] loop
    execute format($f$
      create policy %1$s_read on public.%1$I for select
        using (public.is_live(status, published_at) or public.is_staff());
      create policy %1$s_insert on public.%1$I for insert to authenticated
        with check (public.can_edit_content());
      create policy %1$s_update on public.%1$I for update to authenticated
        using (public.can_edit_content()) with check (public.can_edit_content());
      create policy %1$s_delete on public.%1$I for delete to authenticated
        using (public.can_edit_content());
    $f$, t);
  end loop;
end $$;

-- ministries: ministry managers may edit (not create/delete) their own ministry
create policy ministries_read on public.ministries for select
  using (public.is_live(status, published_at) or public.is_staff());
create policy ministries_insert on public.ministries for insert to authenticated
  with check (public.can_edit_content());
create policy ministries_update on public.ministries for update to authenticated
  using (public.can_manage_ministry(id)) with check (public.can_manage_ministry(id));
create policy ministries_delete on public.ministries for delete to authenticated
  using (public.can_edit_content());

-- ministry managers may not publish/unpublish or rename the slug of their ministry: enforce in trigger
-- SECURITY INVOKER so current_user is the API role; trusted backends (SQL editor, service role) are not restricted.
create or replace function public.guard_ministry_manager_update() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user in ('anon', 'authenticated') and not public.can_edit_content() then
    if new.slug is distinct from old.slug or new.status is distinct from old.status
       or new.published_at is distinct from old.published_at or new.sort_order is distinct from old.sort_order then
      raise exception 'Ministry managers cannot change slug, status, publication date or order'
        using errcode = '42501';
    end if;
  end if;
  return new;
end $$;
create trigger ministries_manager_guard before update on public.ministries
  for each row execute function public.guard_ministry_manager_update();

create policy ministry_leaders_read on public.ministry_leaders for select using (true);
create policy ministry_leaders_write on public.ministry_leaders for all to authenticated
  using (public.can_manage_ministry(ministry_id)) with check (public.can_manage_ministry(ministry_id));

-- gallery: editors, or a ministry manager for items tied to their ministry
create policy gallery_items_read on public.gallery_items for select
  using (public.is_live(status, published_at) or public.is_staff());
create policy gallery_items_insert on public.gallery_items for insert to authenticated
  with check (public.can_edit_content() or (ministry_id is not null and public.can_manage_ministry(ministry_id)));
create policy gallery_items_update on public.gallery_items for update to authenticated
  using (public.can_edit_content() or (ministry_id is not null and public.can_manage_ministry(ministry_id)))
  with check (public.can_edit_content() or (ministry_id is not null and public.can_manage_ministry(ministry_id)));
create policy gallery_items_delete on public.gallery_items for delete to authenticated
  using (public.can_edit_content() or (ministry_id is not null and public.can_manage_ministry(ministry_id)));

-- lookup tables
do $$
declare t text;
begin
  foreach t in array array['sermon_categories','gallery_categories'] loop
    execute format($f$
      create policy %1$s_read on public.%1$I for select using (true);
      create policy %1$s_write on public.%1$I for all to authenticated
        using (public.can_edit_content()) with check (public.can_edit_content());
    $f$, t);
  end loop;
end $$;

-- media metadata: readable (it backs public images); any staff may upload; editors or uploader may edit
create policy media_read on public.media_assets for select using (true);
create policy media_insert on public.media_assets for insert to authenticated
  with check (public.is_staff() and (created_by is null or created_by = auth.uid()));
create policy media_update on public.media_assets for update to authenticated
  using (public.can_edit_content() or (public.is_staff() and created_by = auth.uid()))
  with check (public.can_edit_content() or (public.is_staff() and created_by = auth.uid()));
create policy media_delete on public.media_assets for delete to authenticated
  using (public.can_edit_content() or (public.is_staff() and created_by = auth.uid()));

-- site configuration
create policy site_settings_read on public.site_settings for select using (true);
create policy site_settings_write on public.site_settings for all to authenticated
  using (public.can_edit_content()) with check (public.can_edit_content());

create policy homepage_read on public.homepage_sections for select using (is_visible or public.is_staff());
create policy homepage_write on public.homepage_sections for all to authenticated
  using (public.can_edit_content()) with check (public.can_edit_content());

-- ================================================================ private submissions
-- anon/authenticated may INSERT a pristine row; nobody but authorised staff may read it.
create policy prayer_insert on public.prayer_requests for insert to anon, authenticated
  with check (status = 'new' and internal_notes is null and assigned_to is null);
create policy prayer_read on public.prayer_requests for select to authenticated using (public.can_read_prayer());
create policy prayer_update on public.prayer_requests for update to authenticated
  using (public.can_read_prayer()) with check (public.can_read_prayer());
create policy prayer_delete on public.prayer_requests for delete to authenticated using (public.is_admin());

create policy contact_insert on public.contact_messages for insert to anon, authenticated
  with check (status = 'new' and internal_notes is null);
create policy contact_read on public.contact_messages for select to authenticated using (public.can_edit_content());
create policy contact_update on public.contact_messages for update to authenticated
  using (public.can_edit_content()) with check (public.can_edit_content());
create policy contact_delete on public.contact_messages for delete to authenticated using (public.is_admin());

create policy newsletter_insert on public.newsletter_subscribers for insert to anon, authenticated
  with check (status = 'subscribed');
create policy newsletter_read on public.newsletter_subscribers for select to authenticated using (public.can_edit_content());
create policy newsletter_update on public.newsletter_subscribers for update to authenticated
  using (public.can_edit_content()) with check (public.can_edit_content());
create policy newsletter_delete on public.newsletter_subscribers for delete to authenticated using (public.is_admin());

-- ================================================================ people & roles
create policy profiles_read on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_staff());
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

create or replace function public.guard_profile_update() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.is_prayer_team is distinct from old.is_prayer_team
     and current_user in ('anon', 'authenticated') and not public.is_admin() then
    raise exception 'Only a super admin can change prayer-team access' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_update();

create policy user_roles_read on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy user_roles_write on public.user_roles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- never remove the last super admin
create or replace function public.guard_last_super_admin() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.role = 'super_admin' and
     (tg_op = 'DELETE' or new.role <> 'super_admin') and
     (select count(*) from public.user_roles where role = 'super_admin') <= 1 then
    raise exception 'Cannot remove the last super admin' using errcode = '42501';
  end if;
  return coalesce(new, old);
end $$;
create trigger user_roles_last_admin before update or delete on public.user_roles
  for each row execute function public.guard_last_super_admin();

-- ================================================================ audit log
create policy audit_read on public.audit_logs for select to authenticated using (public.is_admin());
-- no insert/update/delete policies: rows are written only by the trigger below (security definer)

create or replace function public.write_audit_log() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_new jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) end;
  v_old jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) end;
  v_row jsonb := coalesce(v_new, v_old);
  v_changed text[];
  v_summary text;
begin
  if auth.uid() is null then          -- public form submissions are not "admin activity"
    return coalesce(new, old);
  end if;
  if tg_op = 'UPDATE' then
    select array_agg(k) into v_changed
    from jsonb_object_keys(v_new) k
    where k not in ('updated_at','search') and v_new -> k is distinct from v_old -> k;
    if v_changed is null then return new; end if;
  end if;
  -- never copy private text (prayer requests, messages) into the log: only the column names
  v_summary := case when tg_table_name in ('prayer_requests','contact_messages','newsletter_subscribers','profiles')
                    then null
                    else coalesce(v_row ->> 'title', v_row ->> 'name', v_row ->> 'key', v_row ->> 'path') end;
  insert into public.audit_logs (actor_id, action, table_name, record_id, summary, changed)
  values (auth.uid(), lower(tg_op), tg_table_name,
          coalesce(v_row ->> 'id', v_row ->> 'key'), left(v_summary, 200), v_changed);
  return coalesce(new, old);
end $$;

do $$
declare t text;
begin
  foreach t in array array['user_roles','site_settings','homepage_sections','media_assets','ministries',
                           'ministry_leaders','leadership','sermon_categories','sermons','events',
                           'gallery_categories','gallery_items','announcements','prayer_requests',
                           'contact_messages','newsletter_subscribers','profiles'] loop
    execute format('create trigger %I_audit after insert or update or delete on public.%I
                    for each row execute function public.write_audit_log()', t, t);
  end loop;
end $$;

-- ================================================================ rate limiting
-- Fixed-window counter. Returns true when the request is allowed.
create or replace function public.check_rate_limit(p_key text, p_max int, p_window_seconds int)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_hits int;
begin
  if p_key is null or char_length(p_key) > 200 or p_max < 1 or p_window_seconds < 1 then
    return false;
  end if;
  insert into public.rate_limits as r (key, window_start, hits) values (p_key, now(), 1)
  on conflict (key) do update
    set hits = case when r.window_start < now() - make_interval(secs => p_window_seconds) then 1 else r.hits + 1 end,
        window_start = case when r.window_start < now() - make_interval(secs => p_window_seconds) then now() else r.window_start end
  returning hits into v_hits;
  -- opportunistic cleanup
  delete from public.rate_limits where window_start < now() - interval '1 day';
  return v_hits <= p_max;
end $$;
revoke all on function public.check_rate_limit(text, int, int) from public;
grant execute on function public.check_rate_limit(text, int, int) to anon, authenticated;

-- dashboard counters for staff (avoids exposing rows; respects role)
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
    'prayer_pending',     case when public.can_read_prayer() then (select count(*) from prayer_requests where status = 'new') end
  );
end $$;
grant execute on function public.dashboard_counts() to authenticated;
