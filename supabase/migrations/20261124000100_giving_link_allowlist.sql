-- The online (card) giving link may only point to the church's approved provider (Zeffy).
-- Even a signed-in admin cannot save a link to any other site; changes are still audited.
alter table public.payment_methods drop constraint if exists payment_methods_online_link_allowlist;
alter table public.payment_methods add constraint payment_methods_online_link_allowlist
  check (kind <> 'online_link' or url is null or url ~ '^https://(www\.)?zeffy\.com/');
