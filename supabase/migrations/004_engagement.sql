-- Phase 2: play counts + global leaderboards.
-- Apply in Supabase: SQL Editor -> paste -> Run. Safe to re-run (idempotent).

-- ── Play counts ──────────────────────────────────────────────────────────────
-- Anyone (incl. logged-out players) can bump the count on a PUBLIC game only.
-- SECURITY DEFINER lets it write past RLS for just this narrow operation.
create or replace function increment_game_plays(gid uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update games set plays = plays + 1 where id = gid and visibility = 'public';
$$;

grant execute on function increment_game_plays(uuid) to anon, authenticated;

-- ── Leaderboards ─────────────────────────────────────────────────────────────
create table if not exists scores (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games (id) on delete cascade,
  name text not null default 'anon',
  score integer not null,
  created_at timestamptz not null default now()
);

create index if not exists scores_game_idx on scores (game_id, score desc);

alter table scores enable row level security;

-- Anyone can read the leaderboard of a published game.
drop policy if exists "scores_public_read" on scores;
create policy "scores_public_read" on scores for select using (
  exists (
    select 1 from games g where g.id = scores.game_id and g.visibility = 'public'
  )
);

-- Submit a score to a PUBLIC game. Validates the game, clamps the score, and
-- trims the name server-side. Writes go only through this function (no direct
-- insert policy), so the rules can't be bypassed.
create or replace function submit_score(gid uuid, player text, pts integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_name text;
begin
  if not exists (select 1 from games where id = gid and visibility = 'public') then
    return; -- ignore scores for private / missing games
  end if;
  clean_name := nullif(btrim(left(coalesce(player, ''), 24)), '');
  insert into scores (game_id, name, score)
  values (gid, coalesce(clean_name, 'anon'), greatest(0, least(coalesce(pts, 0), 1000000000)));
end;
$$;

grant execute on function submit_score(uuid, text, integer) to anon, authenticated;
