-- Phase 2: play counts.
-- Apply in Supabase: SQL Editor -> paste -> Run. Safe to re-run (idempotent).

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
