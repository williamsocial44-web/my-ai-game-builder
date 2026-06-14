create table if not exists game_catalog (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  keywords text[] default '{}',
  genre text,
  subgenre text,
  visual_theme text,
  color_palette text,
  platform text default 'both',
  era text,
  mechanic text,
  build_hint text,
  story_arc text,
  mood text,
  dimension text default '2D',
  tags text[] default '{}',
  confidence integer default 8
);

create index if not exists idx_game_catalog_genre on game_catalog(genre);
create index if not exists idx_game_catalog_platform on game_catalog(platform);
create index if not exists idx_game_catalog_era on game_catalog(era);

create table if not exists catalog_lessons (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  category text not null,
  lesson text not null,
  genre text,
  platform text,
  confidence integer default 8,
  times_applied integer default 0,
  active boolean default true
);

create index if not exists idx_catalog_lessons_category on catalog_lessons(category);
create index if not exists idx_catalog_lessons_genre on catalog_lessons(genre);
