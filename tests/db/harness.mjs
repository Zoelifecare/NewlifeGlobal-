// Embedded Postgres (PGlite) with Supabase-compatible auth/storage stubs,
// so the real migrations + RLS policies can be tested without Docker.
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const SUPABASE_STUBS = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}'::jsonb);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid);
  alter table storage.objects enable row level security;
  grant usage on schema storage to anon, authenticated;
  grant select, insert, update, delete on storage.objects to anon, authenticated;
`;

export async function createDb() {
  const db = new PGlite({ extensions: { pgcrypto } });
  await db.exec(SUPABASE_STUBS);
  const dir = path.join(root, "supabase", "migrations");
  for (const f of (await readdir(dir)).filter((x) => x.endsWith(".sql")).sort()) {
    await db.exec(await readFile(path.join(dir, f), "utf8"));
  }
  await db.exec(await readFile(path.join(root, "supabase", "seed.sql"), "utf8"));
  return db;
}

/** Create an auth user (+ profile via trigger) and optional roles. Returns the user id. */
export async function makeUser(db, email, roles = [], opts = {}) {
  const { rows } = await db.query("insert into auth.users (id, email) values (gen_random_uuid(), $1) returning id", [email]);
  const id = rows[0].id;
  for (const r of roles) {
    await db.query("insert into public.user_roles (user_id, role, ministry_id) values ($1, $2, $3)", [id, r.role ?? r, r.ministryId ?? null]);
  }
  if (opts.prayerTeam) await db.query("update public.profiles set is_prayer_team = true where id = $1", [id]);
  return id;
}

/** Run `fn` as a Supabase role (anon / authenticated with a user id) inside a rolled-back-on-error transaction. */
export async function as(db, who, fn) {
  return db.transaction(async (tx) => {
    if (who === "anon") {
      await tx.exec("set local role anon");
      await tx.query("select set_config('request.jwt.claim.sub', '', true)");
    } else {
      await tx.exec("set local role authenticated");
      await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [who]);
    }
    return fn(tx);
  });
}

/** Expect a promise to reject (permission / check violation); returns the error message. */
export async function rejects(p) {
  try { await p; } catch (e) { return String(e.message); }
  throw new Error("expected the statement to fail, but it succeeded");
}
