-- Phase 3: the learning loop — seeded lessons + play-session metrics.
-- Apply in Supabase: SQL Editor → paste → Run. Safe to re-run (idempotent).

-- ── Lessons: make text unique so seeding + auto-extraction stay deduped ───────
create unique index if not exists learned_lessons_lesson_key on learned_lessons (lesson);
create unique index if not exists catalog_lessons_lesson_key on catalog_lessons (lesson);

-- Strong starter lessons so the generator is smart on day one (before any
-- auto-extracted lessons accumulate). These mirror what consistently makes a
-- single-file browser game feel great.
insert into learned_lessons (category, lesson, confidence, times_confirmed) values
  ('gameplay', 'Give the player something to do within 2 seconds of clicking Start — no long intros.', 9, 5),
  ('gameplay', 'Difficulty must ramp: increase speed/spawn-rate every 15-30s so arcade games never feel flat.', 9, 5),
  ('visual',   'Every impactful moment needs juice: particle burst, screen shake, and a color flash.', 9, 5),
  ('visual',   'Pick ONE bold accent color per game and use it consistently for all interactive elements.', 8, 4),
  ('audio',    'Add short procedural Web Audio blips for hit, score, and game-over — silence feels broken.', 8, 4),
  ('gameplay', 'Always show score/progress and a clear win or lose state; end screens must offer instant restart.', 9, 5),
  ('performance', 'Use requestAnimationFrame with delta-time capped at 0.05 and pool objects to hold 60fps.', 8, 4),
  ('genre',    'Idle/clicker games need visible big numbers and at least 3 upgrades that change the feel.', 8, 3),
  ('genre',    'Puzzle games need an undo or retry and a satisfying clear animation on success.', 7, 3),
  ('prompt_interpretation', 'When the idea is vague, default to the most fun, fast-feedback interpretation rather than literal.', 8, 3)
on conflict (lesson) do nothing;

insert into catalog_lessons (category, lesson, genre, confidence) values
  ('visual',   'Neon games read best on near-black backgrounds with heavy box-shadow glow on moving elements.', 'arcade', 8),
  ('gameplay', 'Endless runners hook players with a single tap/jump input and a rising-speed score chase.', 'platformer', 8),
  ('gameplay', 'Tower defense feels best when each tower has a clearly different role and enemies telegraph their path.', 'tower_defense', 7),
  ('genre',    'Card battlers need readable card text, a visible deck/discard count, and clear turn structure.', 'card', 7),
  ('visual',   'Mobile-targeted games must put on-screen touch controls at the bottom corners, never tiny.', null, 8)
on conflict (lesson) do nothing;

-- ── Play sessions: real engagement metric (how long people actually play) ─────
create table if not exists game_sessions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games (id) on delete cascade,
  duration_ms integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists game_sessions_game_idx on game_sessions (game_id);

alter table game_sessions enable row level security;

-- Owners can read the sessions for their own games (powers the Insights dashboard).
drop policy if exists "sessions_owner_read" on game_sessions;
create policy "sessions_owner_read" on game_sessions for select
  using (exists (select 1 from games g where g.id = game_id and g.user_id = auth.uid()));

-- Anyone playing a PUBLIC game can log a session length. SECURITY DEFINER writes
-- past RLS for just this narrow, validated insert.
create or replace function record_game_session(gid uuid, ms integer)
returns void
language sql
security definer
set search_path = public
as $$
  insert into game_sessions (game_id, duration_ms)
  select gid, greatest(coalesce(ms, 0), 0)
  where exists (select 1 from games where id = gid and visibility = 'public');
$$;

grant execute on function record_game_session(uuid, integer) to anon, authenticated;
