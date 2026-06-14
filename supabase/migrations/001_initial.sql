create table if not exists game_generations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  prompt text,
  genre text,
  mode text,
  output_length integer,
  token_count integer,
  model text,
  success boolean,
  rating integer,
  user_feedback text,
  visual_quality text,
  fun_rating integer,
  worked_first_try boolean,
  genre_accurate boolean,
  notable_success boolean,
  visual_theme text,
  lessons text
);

create table if not exists learned_lessons (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  category text,
  lesson text,
  confidence integer,
  times_confirmed integer default 1,
  active boolean default true,
  source_generation_id uuid
);
