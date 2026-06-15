-- User-owned games: cloud save + publish to a public URL.
-- Apply in Supabase: SQL Editor → paste → Run. Safe to re-run (idempotent).

create table if not exists games (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  title text not null default 'Untitled Game',
  prompt text,
  scene text,
  html text not null,
  visibility text not null default 'private' check (visibility in ('private', 'public')),
  plays integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists games_user_idx on games (user_id, created_at desc);
create index if not exists games_public_idx on games (visibility) where visibility = 'public';

alter table games enable row level security;

-- Owners have full control over their own games.
drop policy if exists "games_owner_select" on games;
create policy "games_owner_select" on games for select using (auth.uid() = user_id);

drop policy if exists "games_owner_insert" on games;
create policy "games_owner_insert" on games for insert with check (auth.uid() = user_id);

drop policy if exists "games_owner_update" on games;
create policy "games_owner_update" on games for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "games_owner_delete" on games;
create policy "games_owner_delete" on games for delete using (auth.uid() = user_id);

-- Anyone (including logged-out visitors) can read PUBLISHED games — powers /g/[id].
drop policy if exists "games_public_read" on games;
create policy "games_public_read" on games for select using (visibility = 'public');
