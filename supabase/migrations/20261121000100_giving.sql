-- New Life Global: giving platform (owner feedback, round 3)
--  * Finance Manager role; finance data visible only to super admins and finance managers
--  * Pledges (commitments, not revenue), confirmed donations (verified money), pending giving submissions
--  * Approved payment methods (public instructions) and internal bank account records (masked)
--  * Finance notification settings (super admin) and a notification log with retry state
--  * Reporting function that never mixes pledged, pending and confirmed money

-- ================================================================ finance role
alter table public.user_roles drop constraint if exists user_roles_role_check;
alter table public.user_roles add constraint user_roles_role_check
  check (role in ('super_admin', 'content_editor', 'ministry_manager', 'finance_manager'));

create or replace function public.can_manage_finance() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('super_admin', 'finance_manager'));
$$;
grant execute on function public.can_manage_finance() to anon, authenticated;

-- ================================================================ reference numbers
create sequence if not exists public.giving_ref_seq start 1001;
create or replace function public.next_giving_ref(p_prefix text) returns text
language sql volatile security definer set search_path = public as $$
  select p_prefix || '-' || to_char(now() at time zone 'America/Phoenix', 'YYMM') || '-' || lpad(nextval('public.giving_ref_seq')::text, 5, '0');
$$;

-- ================================================================ designations & payment methods
create table public.giving_designations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique check (char_length(name) between 2 and 80),
  description text,
  is_active   boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Public-facing payment options. Only what the church approves; no secrets here (public read).
create table public.payment_methods (
  id            uuid primary key default gen_random_uuid(),
  kind          text not null check (kind in ('online_link', 'zelle', 'cashapp', 'bank_transfer', 'cash_drop', 'check', 'other')),
  label         text not null check (char_length(label) between 2 and 80),
  description   text,
  instructions  text,                 -- what the visitor does (approved wording)
  handle        text,                 -- e.g. Zelle email/phone or $Cashtag published by the church
  url           text check (url is null or url ~ '^https://'),
  location      text,                 -- cash drop: where at church
  reference_info text,                -- e.g. envelope / memo instructions
  image_id      uuid references public.media_assets (id) on delete set null,
  supports_recurring boolean not null default false,
  is_active     boolean not null default false,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Internal record of the church's receiving accounts. Never public; never full account numbers.
create table public.bank_accounts (
  id             uuid primary key default gen_random_uuid(),
  nickname       text not null check (char_length(nickname) between 2 and 80),
  bank_name      text,
  account_holder text,
  last4          text check (last4 is null or last4 ~ '^[0-9]{4}$'),
  purpose        text,
  notes          text,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ================================================================ pledges, submissions, donations
create table public.pledges (
  id                   uuid primary key default gen_random_uuid(),
  reference            text not null unique default public.next_giving_ref('PL'),
  donor_name           text not null check (char_length(donor_name) between 1 and 120),
  donor_email          text not null check (donor_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(donor_email) <= 254),
  donor_phone          text check (donor_phone is null or char_length(donor_phone) <= 40),
  amount               numeric(12,2) not null check (amount > 0 and amount <= 1000000),
  frequency            text not null default 'one_time' check (frequency in ('one_time', 'weekly', 'monthly', 'quarterly', 'annually')),
  designation_id       uuid references public.giving_designations (id) on delete set null,
  intended_method      text check (intended_method is null or char_length(intended_method) <= 60),
  expected_by          date,
  message              text check (message is null or char_length(message) <= 2000),
  status               text not null default 'new'
                       check (status in ('new', 'acknowledged', 'partially_fulfilled', 'fulfilled', 'cancelled', 'past_due')),
  fulfilled_amount     numeric(12,2) not null default 0,
  internal_notes       text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index pledges_status_idx on public.pledges (status, created_at desc);

-- Things donors tell us (intentions, "I sent it" confirmations, cash drop notices). NOT money received.
create table public.giving_submissions (
  id                 uuid primary key default gen_random_uuid(),
  reference          text not null unique default public.next_giving_ref('GS'),
  kind               text not null check (kind in ('donation_one_time', 'donation_recurring', 'zelle_confirmation',
                                                   'cashapp_confirmation', 'bank_transfer_confirmation', 'cash_drop_notice')),
  donor_name         text check (donor_name is null or char_length(donor_name) <= 120),
  donor_email        text check (donor_email is null or (donor_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(donor_email) <= 254)),
  donor_phone        text check (donor_phone is null or char_length(donor_phone) <= 40),
  amount             numeric(12,2) not null check (amount > 0 and amount <= 1000000),
  frequency          text not null default 'one_time' check (frequency in ('one_time', 'weekly', 'monthly', 'quarterly', 'annually')),
  designation_id     uuid references public.giving_designations (id) on delete set null,
  payment_method_id  uuid references public.payment_methods (id) on delete set null,
  sent_on            date,
  donor_reference    text check (donor_reference is null or char_length(donor_reference) <= 120), -- e.g. the donor's Zelle memo
  message            text check (message is null or char_length(message) <= 2000),
  status             text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  verified_by        uuid references public.profiles (id) on delete set null,
  verified_at        timestamptz,
  internal_notes     text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index giving_submissions_status_idx on public.giving_submissions (status, created_at desc);

-- Confirmed money: recorded by finance after it is received and verified. This is the only revenue table.
create table public.donations (
  id                  uuid primary key default gen_random_uuid(),
  reference           text not null unique default public.next_giving_ref('DN'),
  amount              numeric(12,2) not null check (amount > 0 and amount <= 1000000),
  received_on         date not null default (now() at time zone 'America/Phoenix')::date,
  method              text not null check (method in ('cash', 'check', 'zelle', 'cashapp', 'bank_transfer', 'online', 'other')),
  source              text not null default 'manual_entry' check (source in ('manual_entry', 'cash_drop', 'verified_submission', 'online_provider')),
  designation_id      uuid references public.giving_designations (id) on delete set null,
  donor_name          text check (donor_name is null or char_length(donor_name) <= 120),
  donor_email         text check (donor_email is null or (donor_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(donor_email) <= 254)),
  is_anonymous        boolean not null default false,
  is_recurring        boolean not null default false,
  pledge_id           uuid references public.pledges (id) on delete set null,
  submission_id       uuid unique references public.giving_submissions (id) on delete set null,
  provider_payment_id text unique,
  receipt_number      text check (receipt_number is null or char_length(receipt_number) <= 80),
  notes               text,
  recorded_by         uuid references public.profiles (id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index donations_received_idx on public.donations (received_on desc);
create index donations_pledge_idx on public.donations (pledge_id);

-- ================================================================ notifications
create table public.finance_notification_settings (
  id          int primary key default 1 check (id = 1),
  recipients  text[] not null default '{}',
  enabled_types text[] not null default array['pledge', 'donation_one_time', 'donation_recurring', 'zelle_confirmation',
                                              'cashapp_confirmation', 'bank_transfer_confirmation', 'cash_drop_notice',
                                              'online_payment', 'cash_recorded', 'donation_recorded', 'donor_confirmations'],
  updated_by  uuid references public.profiles (id) on delete set null,
  updated_at  timestamptz not null default now(),
  constraint recipients_valid check (array_length(recipients, 1) is null or array_length(recipients, 1) <= 10)
);
insert into public.finance_notification_settings (id) values (1) on conflict do nothing;

create table public.notification_log (
  id            bigint generated always as identity primary key,
  audience      text not null check (audience in ('finance', 'donor', 'test')),
  type          text not null,
  record_table  text,
  record_id     uuid,
  reference     text,
  recipient     text not null,
  subject       text not null,
  status        text not null default 'queued' check (status in ('queued', 'sent', 'failed')),
  attempts      int not null default 0,
  error         text,
  provider_id   text,
  last_attempt_at timestamptz,
  created_at    timestamptz not null default now()
);
create index notification_log_status_idx on public.notification_log (status, created_at desc);

-- ================================================================ updated_at triggers
do $$
declare t text;
begin
  foreach t in array array['giving_designations', 'payment_methods', 'bank_accounts', 'pledges', 'giving_submissions', 'donations'] loop
    execute format('create trigger %I_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

-- ================================================================ pledge balance maintenance
-- fulfilled_amount = sum of confirmed donations linked to the pledge; status follows unless cancelled.
create or replace function public.refresh_pledge(p_pledge uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_total numeric(12,2); v_amount numeric(12,2); v_status text;
begin
  if p_pledge is null then return; end if;
  select coalesce(sum(amount), 0) into v_total from public.donations where pledge_id = p_pledge;
  select amount, status into v_amount, v_status from public.pledges where id = p_pledge;
  if not found then return; end if;
  update public.pledges set
    fulfilled_amount = v_total,
    status = case
      when v_status = 'cancelled' then 'cancelled'
      when v_total >= v_amount then 'fulfilled'
      when v_total > 0 then 'partially_fulfilled'
      else v_status end
  where id = p_pledge;
end $$;

create or replace function public.donations_refresh_pledge() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then perform public.refresh_pledge(old.pledge_id); end if;
  if tg_op in ('INSERT', 'UPDATE') then perform public.refresh_pledge(new.pledge_id); end if;
  return coalesce(new, old);
end $$;
create trigger donations_pledge_sync after insert or update or delete on public.donations
  for each row execute function public.donations_refresh_pledge();

-- Past due: open pledges whose expected date has passed (called by the finance dashboard)
create or replace function public.mark_past_due_pledges() returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not public.can_manage_finance() then raise exception 'not authorized' using errcode = '42501'; end if;
  update public.pledges set status = 'past_due'
   where status in ('new', 'acknowledged', 'partially_fulfilled')
     and expected_by is not null and expected_by < (now() at time zone 'America/Phoenix')::date
     and fulfilled_amount < amount;
  get diagnostics n = row_count;
  return n;
end $$;

-- Verify a pending submission: finance confirms the money arrived -> one confirmed donation.
create or replace function public.verify_giving_submission(p_submission uuid, p_amount numeric, p_received_on date,
                                                           p_pledge uuid default null, p_notes text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare s public.giving_submissions; v_id uuid; v_method text;
begin
  if not public.can_manage_finance() then raise exception 'not authorized' using errcode = '42501'; end if;
  select * into s from public.giving_submissions where id = p_submission for update;
  if not found then raise exception 'unknown submission' using errcode = '22023'; end if;
  if s.status <> 'pending' then raise exception 'This submission has already been %', s.status using errcode = '22023'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Enter the amount actually received' using errcode = '22023'; end if;
  v_method := case s.kind when 'zelle_confirmation' then 'zelle' when 'cashapp_confirmation' then 'cashapp'
                          when 'bank_transfer_confirmation' then 'bank_transfer' when 'cash_drop_notice' then 'cash' else 'other' end;
  insert into public.donations (amount, received_on, method, source, designation_id, donor_name, donor_email, is_recurring,
                                pledge_id, submission_id, notes, recorded_by)
  values (p_amount, coalesce(p_received_on, (now() at time zone 'America/Phoenix')::date), v_method, 'verified_submission',
          s.designation_id, s.donor_name, s.donor_email, s.frequency <> 'one_time', p_pledge, s.id, left(p_notes, 2000), auth.uid())
  returning id into v_id;
  update public.giving_submissions set status = 'verified', verified_by = auth.uid(), verified_at = now() where id = s.id;
  return v_id;
end $$;

-- ================================================================ reporting (separate buckets, never summed together)
create or replace function public.giving_summary(p_from date default null, p_to date default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_from date := coalesce(p_from, '1900-01-01');
  v_to date := coalesce(p_to, '2999-12-31');
  v_month_start date := date_trunc('month', (now() at time zone 'America/Phoenix'))::date;
begin
  if not public.can_manage_finance() then raise exception 'not authorized' using errcode = '42501'; end if;
  return jsonb_build_object(
    'confirmed_total',   (select coalesce(sum(amount), 0) from donations where received_on between v_from and v_to),
    'confirmed_count',   (select count(*) from donations where received_on between v_from and v_to),
    'confirmed_this_month', (select coalesce(sum(amount), 0) from donations where received_on >= v_month_start),
    'cash_total',        (select coalesce(sum(amount), 0) from donations where method = 'cash' and received_on between v_from and v_to),
    'online_total',      (select coalesce(sum(amount), 0) from donations where method = 'online' and received_on between v_from and v_to),
    'by_method',         (select coalesce(jsonb_object_agg(method, total), '{}'::jsonb) from
                            (select method, sum(amount) total from donations where received_on between v_from and v_to group by method) m),
    'pledged_total',     (select coalesce(sum(amount), 0) from pledges where status <> 'cancelled'),
    'pledge_count',      (select count(*) from pledges where status <> 'cancelled'),
    'pledge_outstanding',(select coalesce(sum(greatest(amount - fulfilled_amount, 0)), 0) from pledges where status not in ('cancelled', 'fulfilled')),
    'pending_count',     (select count(*) from giving_submissions where status = 'pending'),
    'pending_amount',    (select coalesce(sum(amount), 0) from giving_submissions where status = 'pending'),
    'notifications_failed', (select count(*) from notification_log where status = 'failed')
  );
end $$;

-- ================================================================ privileges & RLS
grant select on public.giving_designations, public.payment_methods to anon, authenticated;
grant insert on public.pledges, public.giving_submissions to anon, authenticated;
grant select, insert, update, delete on public.giving_designations, public.payment_methods, public.bank_accounts,
  public.pledges, public.giving_submissions, public.donations, public.finance_notification_settings to authenticated;
grant select, update on public.notification_log to authenticated;
revoke select, update, delete on public.pledges, public.giving_submissions from anon;
revoke all on public.donations, public.bank_accounts, public.finance_notification_settings, public.notification_log from anon;
grant usage on sequence public.giving_ref_seq to anon, authenticated;
grant execute on function public.next_giving_ref(text) to anon, authenticated;
revoke all on function public.verify_giving_submission(uuid, numeric, date, uuid, text), public.giving_summary(date, date),
  public.mark_past_due_pledges(), public.refresh_pledge(uuid) from public;
grant execute on function public.verify_giving_submission(uuid, numeric, date, uuid, text), public.giving_summary(date, date),
  public.mark_past_due_pledges() to authenticated;

do $$
declare t text;
begin
  foreach t in array array['giving_designations', 'payment_methods', 'bank_accounts', 'pledges', 'giving_submissions',
                           'donations', 'finance_notification_settings', 'notification_log'] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- public catalogue: active designations and active payment methods
create policy designations_read on public.giving_designations for select using (is_active or public.can_manage_finance());
create policy designations_write on public.giving_designations for all to authenticated
  using (public.can_manage_finance()) with check (public.can_manage_finance());
create policy payment_methods_read on public.payment_methods for select using (is_active or public.can_manage_finance());
create policy payment_methods_write on public.payment_methods for all to authenticated
  using (public.can_manage_finance()) with check (public.can_manage_finance());

-- finance only
create policy bank_accounts_all on public.bank_accounts for all to authenticated
  using (public.can_manage_finance()) with check (public.can_manage_finance());
create policy donations_all on public.donations for all to authenticated
  using (public.can_manage_finance()) with check (public.can_manage_finance());

-- public may submit a pristine pledge / submission; only finance reads or changes them
create policy pledges_insert on public.pledges for insert to anon, authenticated
  with check (status = 'new' and fulfilled_amount = 0 and internal_notes is null);
create policy pledges_read on public.pledges for select to authenticated using (public.can_manage_finance());
create policy pledges_update on public.pledges for update to authenticated using (public.can_manage_finance()) with check (public.can_manage_finance());
create policy pledges_delete on public.pledges for delete to authenticated using (public.is_admin());

create policy submissions_insert on public.giving_submissions for insert to anon, authenticated
  with check (status = 'pending' and verified_by is null and verified_at is null and internal_notes is null);
create policy submissions_read on public.giving_submissions for select to authenticated using (public.can_manage_finance());
create policy submissions_update on public.giving_submissions for update to authenticated using (public.can_manage_finance()) with check (public.can_manage_finance());
create policy submissions_delete on public.giving_submissions for delete to authenticated using (public.is_admin());

-- a submission can never be flipped to "verified" except through verify_giving_submission()
create or replace function public.guard_submission_verify() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user in ('anon', 'authenticated') and new.status = 'verified' and old.status <> 'verified' then
    raise exception 'Use "Verify received" so the confirmed donation is recorded' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger giving_submissions_guard before update on public.giving_submissions
  for each row execute function public.guard_submission_verify();

-- notification settings: super admin manages, finance managers read
create policy notif_settings_read on public.finance_notification_settings for select to authenticated using (public.can_manage_finance());
create policy notif_settings_write on public.finance_notification_settings for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy notif_log_read on public.notification_log for select to authenticated using (public.can_manage_finance());

-- ================================================================ audit
do $$
declare t text;
begin
  foreach t in array array['giving_designations', 'payment_methods', 'bank_accounts', 'pledges', 'giving_submissions',
                           'donations', 'finance_notification_settings'] loop
    execute format('create trigger %I_audit after insert or update or delete on public.%I
                    for each row execute function public.write_audit_log()', t, t);
  end loop;
end $$;

-- ================================================================ dashboard: finance counts for finance staff
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
    'needs_confirmation', case when public.can_edit_content() then (select count(*) from church_content where status = 'needs_confirmation') end,
    'pledges_new',        case when public.can_manage_finance() then (select count(*) from pledges where status = 'new') end,
    'giving_pending',     case when public.can_manage_finance() then (select count(*) from giving_submissions where status = 'pending') end
  );
end $$;

-- ================================================================ public submission functions
-- The public cannot read pledges/submissions, so these insert and return only the new id + reference.
create or replace function public.submit_pledge(
  p_name text, p_email text, p_phone text, p_amount numeric, p_frequency text, p_designation uuid,
  p_method text, p_expected date, p_message text)
returns table (id uuid, reference text) language plpgsql security definer set search_path = public as $$
begin
  if p_designation is not null and not exists (select 1 from giving_designations d where d.id = p_designation and d.is_active) then
    raise exception 'invalid designation' using errcode = '22023';
  end if;
  return query
  insert into public.pledges (donor_name, donor_email, donor_phone, amount, frequency, designation_id, intended_method, expected_by, message)
  values (left(trim(p_name), 120), lower(trim(p_email)), nullif(left(trim(coalesce(p_phone, '')), 40), ''), round(p_amount, 2),
          coalesce(p_frequency, 'one_time'), p_designation, nullif(left(trim(coalesce(p_method, '')), 60), ''), p_expected,
          nullif(left(trim(coalesce(p_message, '')), 2000), ''))
  returning pledges.id, pledges.reference;
end $$;

create or replace function public.submit_giving(
  p_kind text, p_name text, p_email text, p_phone text, p_amount numeric, p_frequency text, p_designation uuid,
  p_method uuid, p_sent_on date, p_donor_reference text, p_message text)
returns table (id uuid, reference text) language plpgsql security definer set search_path = public as $$
begin
  if p_designation is not null and not exists (select 1 from giving_designations d where d.id = p_designation and d.is_active) then
    raise exception 'invalid designation' using errcode = '22023';
  end if;
  if p_method is not null and not exists (select 1 from payment_methods m where m.id = p_method and m.is_active) then
    raise exception 'invalid payment method' using errcode = '22023';
  end if;
  return query
  insert into public.giving_submissions (kind, donor_name, donor_email, donor_phone, amount, frequency, designation_id,
                                         payment_method_id, sent_on, donor_reference, message)
  values (p_kind, nullif(left(trim(coalesce(p_name, '')), 120), ''), nullif(lower(trim(coalesce(p_email, ''))), ''),
          nullif(left(trim(coalesce(p_phone, '')), 40), ''), round(p_amount, 2), coalesce(p_frequency, 'one_time'), p_designation,
          p_method, p_sent_on, nullif(left(trim(coalesce(p_donor_reference, '')), 120), ''), nullif(left(trim(coalesce(p_message, '')), 2000), ''))
  returning giving_submissions.id, giving_submissions.reference;
end $$;

revoke all on function public.submit_pledge(text, text, text, numeric, text, uuid, text, date, text),
  public.submit_giving(text, text, text, text, numeric, text, uuid, uuid, date, text, text) from public;
grant execute on function public.submit_pledge(text, text, text, numeric, text, uuid, text, date, text),
  public.submit_giving(text, text, text, text, numeric, text, uuid, uuid, date, text, text) to anon, authenticated;

-- ================================================================ templates (inactive, empty: nothing is public until finance approves and activates)
-- Owner decision (round 3): Zelle, Cash App, bank transfer and Cash Drop are shown from the start. Zelle and
-- Cash App use the church phone from Site settings until finance enters a handle; the online link stays
-- hidden until the church has an https giving link.
insert into public.payment_methods (kind, label, description, instructions, sort_order, supports_recurring, is_active)
select * from (values
  ('online_link'::text, 'Give online'::text, 'Card or bank payment through the church''s approved giving provider.'::text, null::text, 1, true, false),
  ('zelle', 'Zelle', 'Send from your banking app with Zelle.', 'Open your banking app, choose Zelle and send your gift to the church number below. Add "Gift" and your designation in the memo.', 2, true, true),
  ('cashapp', 'Cash App', 'Send with Cash App.', 'Open Cash App and send your gift to the church number below. Add "Gift" in the note.', 3, true, true),
  ('bank_transfer', 'Bank transfer', 'Give directly from your bank.', 'Contact the church office for bank transfer details. Account details are shared privately, never on this website.', 4, true, true),
  ('cash_drop', 'Cash Drop', 'Give cash in person at church.', 'Bring your gift to Sunday Service at 3:00 PM, 800 W Galveston St, Chandler, AZ. Ask a member of the welcome team where to give.', 5, false, true)
) v(kind, label, description, instructions, sort_order, supports_recurring, is_active)
where not exists (select 1 from public.payment_methods);
