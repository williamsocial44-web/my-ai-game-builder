-- =============================================================================
-- GameCraft platform — core relational schema, RLS, and provisioning triggers.
-- Apply in Supabase: SQL Editor → paste → Run. Safe to re-run (idempotent).
--
-- This is the spec's profiles / projects / generations model, plus the two
-- pieces the bare DDL needs to actually work end-to-end:
--   1. a trigger that creates a profile row whenever a new auth user signs up
--      (otherwise projects.user_id → profiles.id can never be satisfied), and
--   2. WITH CHECK clauses on the write policies (USING alone does not gate INSERT).
-- =============================================================================

create extension if not exists "uuid-ossp";

-- ── profiles ────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id                       uuid references auth.users on delete cascade not null primary key,
  email                    text not null,
  premium_status           boolean default false not null,
  session_generation_count int default 0 not null,
  stripe_customer_id       text,
  created_at               timestamptz default now() not null,
  updated_at               timestamptz default now() not null
);

-- ── projects ────────────────────────────────────────────────────────────────
-- current_state_json is the single source of truth for a project's game. It
-- holds { engine: 'html' | 'phaser', html?, declarative?, metadata } so the same
-- table backs both runtimes (see types/engine.ts → ProjectState).
create table if not exists public.projects (
  id                 uuid default uuid_generate_v4() primary key,
  user_id            uuid references public.profiles(id) on delete cascade not null,
  title              text not null default 'Untitled Game',
  current_state_json jsonb not null default '{}'::jsonb,
  style_guide_url    text,
  created_at         timestamptz default now() not null,
  updated_at         timestamptz default now() not null
);

create index if not exists projects_user_idx on public.projects (user_id, updated_at desc);

-- ── generations ─────────────────────────────────────────────────────────────
-- An append-only ledger of every billable model/asset call, for usage metering.
create table if not exists public.generations (
  id              uuid default uuid_generate_v4() primary key,
  project_id      uuid references public.projects(id) on delete cascade not null,
  user_id         uuid references public.profiles(id) on delete cascade not null,
  generation_type text not null,
  cost_credits    numeric(6, 4) not null,
  created_at      timestamptz default now() not null
);

create index if not exists generations_user_idx on public.generations (user_id, created_at desc);

-- ── row-level security ───────────────────────────────────────────────────────
alter table public.profiles    enable row level security;
alter table public.projects    enable row level security;
alter table public.generations enable row level security;

-- profiles: a user fully owns their own row. WITH CHECK gates UPDATE so a user
-- can never repoint a row at someone else's id. (Rows are created by the trigger
-- below, which is SECURITY DEFINER and bypasses RLS.)
drop policy if exists "profiles_self_all" on public.profiles;
create policy "profiles_self_all" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- projects: a user fully owns their own projects.
drop policy if exists "projects_owner_all" on public.projects;
create policy "projects_owner_all" on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- generations: read-only to the owner; writes happen server-side via the
-- service role (which bypasses RLS), keeping the usage ledger tamper-proof.
drop policy if exists "generations_owner_select" on public.generations;
create policy "generations_owner_select" on public.generations
  for select using (auth.uid() = user_id);

-- ── auto-provision a profile for every new auth user ─────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for any users that already existed before this migration.
insert into public.profiles (id, email)
select u.id, coalesce(u.email, '')
from auth.users u
on conflict (id) do nothing;

-- ── keep updated_at fresh ────────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists projects_touch on public.projects;
create trigger projects_touch before update on public.projects
  for each row execute function public.touch_updated_at();

-- ── usage metering helper ────────────────────────────────────────────────────
-- Atomically bump a user's session generation count and return the new value,
-- so the free-tier paywall can be enforced server-side without a race.
create or replace function public.increment_generation_count(uid uuid)
returns int
language sql
security definer
set search_path = public
as $$
  update public.profiles
     set session_generation_count = session_generation_count + 1
   where id = uid
  returning session_generation_count;
$$;

grant execute on function public.increment_generation_count(uuid) to authenticated;
