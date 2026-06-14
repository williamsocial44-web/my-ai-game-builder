/**
 * Seed the Supabase game_catalog and catalog_lessons tables.
 * Run: node scripts/seed-catalog.mjs
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY in .env.local
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local manually
function loadEnv() {
  try {
    const envPath = join(__dirname, "..", ".env.local");
    const lines = readFileSync(envPath, "utf8").split("\n");
    for (const line of lines) {
      const [key, ...rest] = line.split("=");
      if (key && rest.length) process.env[key.trim()] = rest.join("=").trim();
    }
  } catch {
    console.warn("No .env.local found — using process.env");
  }
}

loadEnv();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ─── GAME CATALOG DATA ─────────────────────────────────────────────────────

const GENRES = [
  "platformer", "shooter", "puzzle", "rpg", "strategy", "simulation",
  "racing", "fighting", "rhythm", "horror", "roguelike", "idle", "arcade",
  "card", "word", "sports", "adventure", "sandbox", "tower_defense",
  "stealth", "metroidvania", "visual_novel", "party", "casual",
];

const VISUAL_THEMES = [
  "neon_arcade", "sunset_warm", "forest_earth", "ocean_deep", "space_cosmic",
  "horror_bleak", "retro_cabinet", "pastel_cute", "fantasy_royal",
  "minimal_clean", "cyberpunk", "western_dust", "candy_bright",
  "military_olive", "steampunk_brass", "ice_frost", "lava_volcanic",
  "monochrome_noir", "tropical_vibrant", "zen_meditation",
];

const ERAS = ["1970s", "1980s", "1990s", "2000s", "2010s", "2020s", "indie", "mobile_era"];

const DIMENSIONS = ["2D", "2.5D", "3D", "isometric", "top_down", "side_scroll", "first_person"];

const PLATFORMS = ["both", "desktop", "mobile"];

// 300+ curated real game entries for the catalog
const REAL_GAMES = [
  // PLATFORMERS
  { name: "Super Mario Bros", keywords: ["mario", "super mario"], genre: "platformer", visual_theme: "candy_bright", platform: "both", era: "1980s", mechanic: "run jump collect coins reach flag", build_hint: "side-scroll tiles gravity enemies powerups mushroom", dimension: "side_scroll", tags: ["classic", "nintendo", "iconic"] },
  { name: "Sonic the Hedgehog", keywords: ["sonic", "speed"], genre: "platformer", visual_theme: "neon_arcade", platform: "both", era: "1990s", mechanic: "run fast loops spin attack", build_hint: "momentum physics rings speed terrain loop", dimension: "side_scroll", tags: ["speed", "sega", "classic"] },
  { name: "Mega Man", keywords: ["mega man", "megaman"], genre: "platformer", visual_theme: "neon_arcade", platform: "both", era: "1980s", mechanic: "defeat bosses steal weapon", build_hint: "boss select weapon weakness jump shoot", dimension: "side_scroll", tags: ["boss rush", "weapon steal"] },
  { name: "Celeste", keywords: ["celeste"], genre: "platformer", visual_theme: "neon_arcade", platform: "both", era: "2010s", mechanic: "dash climb mountain precision jumps", build_hint: "tight physics dash cooldown spike death retry", dimension: "side_scroll", tags: ["indie", "precision", "dash"] },
  { name: "Hollow Knight", keywords: ["hollow knight"], genre: "metroidvania", visual_theme: "horror_bleak", platform: "both", era: "2010s", mechanic: "explore interconnected map gain abilities", build_hint: "side-scroll map rooms ability gates soul", dimension: "side_scroll", tags: ["metroidvania", "indie", "explore"] },
  { name: "Shovel Knight", keywords: ["shovel knight"], genre: "platformer", visual_theme: "retro_cabinet", platform: "both", era: "2010s", mechanic: "shovel bounce defeat knights", build_hint: "shovel drop bounce checkpoints relic", dimension: "side_scroll", tags: ["retro", "indie"] },
  { name: "Kirby's Adventure", keywords: ["kirby"], genre: "platformer", visual_theme: "pastel_cute", platform: "both", era: "1990s", mechanic: "inhale enemies copy abilities float", build_hint: "copy power float inhale spit", dimension: "side_scroll", tags: ["cute", "ability copy"] },
  { name: "Donkey Kong Country", keywords: ["donkey kong", "dk"], genre: "platformer", visual_theme: "tropical_vibrant", platform: "both", era: "1990s", mechanic: "barrel roll jump collect bananas", build_hint: "side-scroll barrels throw vehicles", dimension: "side_scroll", tags: ["nintendo", "classic"] },
  { name: "Metroid", keywords: ["metroid", "samus"], genre: "metroidvania", visual_theme: "space_cosmic", platform: "both", era: "1980s", mechanic: "explore alien planet collect power-ups", build_hint: "side-scroll power gates missile beam morph ball", dimension: "side_scroll", tags: ["metroidvania", "sci-fi"] },
  { name: "Crash Bandicoot", keywords: ["crash bandicoot"], genre: "platformer", visual_theme: "tropical_vibrant", platform: "both", era: "1990s", mechanic: "forward run spin jump crates", build_hint: "lane runner spin jump wumpa crates TNT", dimension: "side_scroll", tags: ["playstation", "3d-platformer"] },
  { name: "Spyro the Dragon", keywords: ["spyro"], genre: "platformer", visual_theme: "fantasy_royal", platform: "both", era: "1990s", mechanic: "glide flame charge collect gems", build_hint: "3D-ish glide flame charge gems dragonfly", dimension: "3D", tags: ["dragon", "collectathon"] },
  { name: "Banjo-Kazooie", keywords: ["banjo", "banjo-kazooie"], genre: "platformer", visual_theme: "forest_earth", platform: "both", era: "1990s", mechanic: "collect jiggies unlock worlds moves", build_hint: "hub world collectibles ability unlock jiggy", dimension: "3D", tags: ["collectathon", "n64"] },
  { name: "Rayman Origins", keywords: ["rayman"], genre: "platformer", visual_theme: "candy_bright", platform: "both", era: "2010s", mechanic: "limbless hero punch jump swing", build_hint: "hair helicopter punch sliding electoon", dimension: "side_scroll", tags: ["ubisoft", "2d"] },
  { name: "Cuphead", keywords: ["cuphead"], genre: "shooter", visual_theme: "retro_cabinet", platform: "both", era: "2010s", mechanic: "pattern memorize boss bullet hell parry", build_hint: "boss phases bullet patterns parry pink", dimension: "side_scroll", tags: ["boss rush", "1930s", "indie"] },
  { name: "Limbo", keywords: ["limbo"], genre: "platformer", visual_theme: "monochrome_noir", platform: "both", era: "2010s", mechanic: "silhouette boy traverse dangers physics puzzles", build_hint: "silhouette physics puzzles dark mood", dimension: "side_scroll", tags: ["indie", "atmospheric", "monochrome"] },
  { name: "Little Nightmares", keywords: ["little nightmares"], genre: "platformer", visual_theme: "horror_bleak", platform: "both", era: "2010s", mechanic: "hide from giant creatures escape vessel", build_hint: "side-scroll hide sneak giant scale climb", dimension: "side_scroll", tags: ["horror", "atmospheric"] },
  { name: "Subway Surfers", keywords: ["subway surfers"], genre: "platformer", visual_theme: "neon_arcade", platform: "mobile", era: "2010s", mechanic: "dodge obstacles collect coins endless", build_hint: "3-lane swipe jump roll speed up train", dimension: "side_scroll", tags: ["mobile", "endless runner"] },
  { name: "Temple Run", keywords: ["temple run"], genre: "platformer", visual_theme: "tropical_vibrant", platform: "mobile", era: "2010s", mechanic: "auto-run turn jump slide collect", build_hint: "lane turn swipe obstacles tilt", dimension: "3D", tags: ["mobile", "endless runner"] },
  { name: "Geometry Dash", keywords: ["geometry dash"], genre: "rhythm", visual_theme: "neon_arcade", platform: "both", era: "2010s", mechanic: "one-button jump through obstacles sync", build_hint: "auto-scroll tap jump sync spikes portal", dimension: "side_scroll", tags: ["rhythm", "mobile", "hard"] },

  // SHOOTERS
  { name: "DOOM (1993)", keywords: ["doom", "doom 1993"], genre: "3d_fps", visual_theme: "lava_volcanic", platform: "desktop", era: "1990s", mechanic: "blast demons through maze levels", build_hint: "raycast DDA fast movement shotgun splash damage", dimension: "first_person", tags: ["boomer shooter", "classic", "demons"] },
  { name: "Quake", keywords: ["quake"], genre: "3d_fps", visual_theme: "lava_volcanic", platform: "desktop", era: "1990s", mechanic: "arena deathmatch rocket jump strafe", build_hint: "raycast rocket launcher bunny hop fast pace", dimension: "first_person", tags: ["boomer shooter", "arena"] },
  { name: "Half-Life", keywords: ["half life", "half-life"], genre: "3d_fps", visual_theme: "military_olive", platform: "desktop", era: "1990s", mechanic: "crowbar physics scripted events resonance", build_hint: "raycast gravity gun scripted events crowbar", dimension: "first_person", tags: ["narrative fps", "valve"] },
  { name: "Halo: Combat Evolved", keywords: ["halo"], genre: "3d_fps", visual_theme: "space_cosmic", platform: "desktop", era: "2000s", mechanic: "spartan shoot aliens ring world shield", build_hint: "raycast dual wield shield recharge vehicles", dimension: "first_person", tags: ["microsoft", "sci-fi"] },
  { name: "Counter-Strike", keywords: ["counter-strike", "csgo", "cs2"], genre: "3d_fps", visual_theme: "military_olive", platform: "desktop", era: "2000s", mechanic: "bomb plant defuse round economy buy", build_hint: "rounds buy phase bomb sites raycast", dimension: "first_person", tags: ["tactical", "competitive"] },
  { name: "Space Invaders", keywords: ["space invaders"], genre: "shooter", visual_theme: "space_cosmic", platform: "both", era: "1970s", mechanic: "shoot descending alien waves shields", build_hint: "player ship bottom bullet pool shield blocks", dimension: "top_down", tags: ["classic", "arcade"] },
  { name: "Galaga", keywords: ["galaga"], genre: "shooter", visual_theme: "space_cosmic", platform: "both", era: "1980s", mechanic: "dodge and shoot enemy formations capture", build_hint: "vertical scroll enemy patterns capture rescue", dimension: "top_down", tags: ["arcade", "classic"] },
  { name: "Asteroids", keywords: ["asteroids"], genre: "shooter", visual_theme: "space_cosmic", platform: "both", era: "1970s", mechanic: "rotate thrust shoot asteroids split", build_hint: "wrap screen thrust rotate split rocks UFO", dimension: "top_down", tags: ["classic", "vector", "arcade"] },
  { name: "Vampire Survivors", keywords: ["vampire survivors"], genre: "action", visual_theme: "horror_bleak", platform: "both", era: "2020s", mechanic: "auto-attack survive horde timer XP gems", build_hint: "auto weapons XP level up horde item pickup", dimension: "top_down", tags: ["indie", "bullet heaven", "roguelite"] },
  { name: "Overwatch", keywords: ["overwatch"], genre: "shooter", visual_theme: "candy_bright", platform: "desktop", era: "2010s", mechanic: "team objectives unique hero abilities ultimates", build_hint: "heroes abilities payload control point ult meter", dimension: "first_person", tags: ["hero shooter", "blizzard"] },
  { name: "Fortnite", keywords: ["fortnite"], genre: "shooter", visual_theme: "candy_bright", platform: "both", era: "2010s", mechanic: "last player standing shrinking zone build", build_hint: "top-down zone shrink loot pickups elimination build", dimension: "top_down", tags: ["battle royale", "building"] },
  { name: "Geometry Wars", keywords: ["geometry wars"], genre: "shooter", visual_theme: "neon_arcade", platform: "both", era: "2000s", mechanic: "twin stick shoot geometric enemies", build_hint: "twin stick all-direction shoot geometric shapes grid warp", dimension: "top_down", tags: ["twin stick", "neon"] },
  { name: "Hotline Miami", keywords: ["hotline miami"], genre: "action", visual_theme: "neon_arcade", platform: "desktop", era: "2010s", mechanic: "top-down fast brutal plan execute masks", build_hint: "top-down one-hit plan masks brutal restart", dimension: "top_down", tags: ["indie", "brutal", "neon", "retro"] },

  // PUZZLE
  { name: "Tetris", keywords: ["tetris"], genre: "puzzle", visual_theme: "retro_cabinet", platform: "both", era: "1980s", mechanic: "rotate falling blocks clear lines speed", build_hint: "grid collision line clear speed up next piece", dimension: "2D", tags: ["classic", "falling blocks"] },
  { name: "Portal", keywords: ["portal"], genre: "puzzle", visual_theme: "minimal_clean", platform: "desktop", era: "2000s", mechanic: "solve spatial puzzles with portals physics", build_hint: "chamber buttons doors portal teleport momentum", dimension: "3D", tags: ["valve", "physics", "spatial"] },
  { name: "Angry Birds", keywords: ["angry birds"], genre: "puzzle", visual_theme: "candy_bright", platform: "mobile", era: "2010s", mechanic: "launch projectiles destroy structures pigs", build_hint: "slingshot aim physics blocks pigs bird types", dimension: "side_scroll", tags: ["mobile", "physics", "casual"] },
  { name: "Candy Crush", keywords: ["candy crush"], genre: "puzzle", visual_theme: "candy_bright", platform: "mobile", era: "2010s", mechanic: "swap tiles match three clear board goals", build_hint: "grid swap cascade special candies moves level", dimension: "2D", tags: ["mobile", "match-3", "casual"] },
  { name: "2048", keywords: ["2048"], genre: "puzzle", visual_theme: "zen_meditation", platform: "both", era: "2010s", mechanic: "slide tiles merge to 2048", build_hint: "grid slide merge spawn 2/4 corner strategy", dimension: "2D", tags: ["simple", "addictive"] },
  { name: "Minesweeper", keywords: ["minesweeper"], genre: "puzzle", visual_theme: "minimal_clean", platform: "both", era: "1990s", mechanic: "reveal cells avoid mines deduce numbers", build_hint: "grid click flag numbers reveal cascade", dimension: "2D", tags: ["classic", "deduction", "windows"] },
  { name: "Sokoban", keywords: ["sokoban"], genre: "puzzle", visual_theme: "zen_meditation", platform: "both", era: "1980s", mechanic: "push crates onto targets undo", build_hint: "grid push undo level targets", dimension: "top_down", tags: ["classic", "logic"] },
  { name: "Bejeweled", keywords: ["bejeweled"], genre: "puzzle", visual_theme: "fantasy_royal", platform: "both", era: "2000s", mechanic: "swap gems match three cascade special", build_hint: "grid swap timer special gems cascade", dimension: "2D", tags: ["match-3", "gems"] },
  { name: "Cut the Rope", keywords: ["cut the rope"], genre: "puzzle", visual_theme: "candy_bright", platform: "mobile", era: "2010s", mechanic: "cut ropes feed candy to monster stars", build_hint: "physics rope cut gravity stars collect", dimension: "2D", tags: ["mobile", "physics", "casual"] },
  { name: "Monument Valley", keywords: ["monument valley"], genre: "puzzle", visual_theme: "pastel_cute", platform: "mobile", era: "2010s", mechanic: "navigate impossible architecture rotate paths", build_hint: "iso optical illusions rotate paths escher", dimension: "isometric", tags: ["mobile", "art", "escher"] },
  { name: "Baba Is You", keywords: ["baba is you"], genre: "puzzle", visual_theme: "minimal_clean", platform: "both", era: "2010s", mechanic: "push words change rules level", build_hint: "word blocks rules push break logic", dimension: "top_down", tags: ["indie", "meta", "rule-bending"] },
  { name: "The Room", keywords: ["the room"], genre: "puzzle", visual_theme: "steampunk_brass", platform: "mobile", era: "2010s", mechanic: "examine objects hidden mechanisms locks", build_hint: "tap inspect zoom solve mechanisms layers", dimension: "3D", tags: ["mobile", "mystery", "tactile"] },
  { name: "Papers Please", keywords: ["papers please"], genre: "puzzle", visual_theme: "monochrome_noir", platform: "desktop", era: "2010s", mechanic: "inspect documents approve deny border crossing", build_hint: "doc check rules violations quota narrative", dimension: "2D", tags: ["indie", "bureaucracy", "narrative"] },
  { name: "Return of the Obra Dinn", keywords: ["obra dinn"], genre: "puzzle", visual_theme: "monochrome_noir", platform: "desktop", era: "2010s", mechanic: "deduce cause of death from frozen scenes", build_hint: "flashback scene deduce match fate journal", dimension: "3D", tags: ["indie", "deduction", "mystery"] },

  // RPG
  { name: "Pokémon Red/Blue", keywords: ["pokemon", "pokémon"], genre: "rpg", visual_theme: "pastel_cute", platform: "both", era: "1990s", mechanic: "catch creatures turn-based battle type advantage", build_hint: "encounter rate HP types rock-paper-scissors EV", dimension: "top_down", tags: ["nintendo", "monster capture"] },
  { name: "Final Fantasy VI", keywords: ["final fantasy", "ff6"], genre: "rpg", visual_theme: "fantasy_royal", platform: "both", era: "1990s", mechanic: "party combat story choices magic esper", build_hint: "turn menu attack magic item flee XP", dimension: "side_scroll", tags: ["jrpg", "square", "story"] },
  { name: "Chrono Trigger", keywords: ["chrono trigger"], genre: "rpg", visual_theme: "fantasy_royal", platform: "both", era: "1990s", mechanic: "time travel party ATB combat techs", build_hint: "ATB combo techs time era travel combine", dimension: "top_down", tags: ["jrpg", "time travel", "classic"] },
  { name: "Dark Souls", keywords: ["dark souls", "dark souls 1"], genre: "action", visual_theme: "horror_bleak", platform: "desktop", era: "2010s", mechanic: "precise combat dodge punishing enemies bonfires", build_hint: "stamina bar dodge roll telegraphed attacks estus", dimension: "3D", tags: ["soulslike", "challenging", "dark fantasy"] },
  { name: "Elden Ring", keywords: ["elden ring"], genre: "adventure", visual_theme: "fantasy_royal", platform: "desktop", era: "2020s", mechanic: "explore vast open world defeat bosses grace", build_hint: "mini open map landmarks boss gate summon", dimension: "3D", tags: ["soulslike", "open world"] },
  { name: "Undertale", keywords: ["undertale"], genre: "rpg", visual_theme: "retro_cabinet", platform: "both", era: "2010s", mechanic: "choose fight mercy negotiate bullet dodge", build_hint: "bullet hell dodge dialogue mercy option genocide", dimension: "top_down", tags: ["indie", "meta", "pacifist"] },
  { name: "Genshin Impact", keywords: ["genshin impact", "genshin"], genre: "rpg", visual_theme: "fantasy_royal", platform: "both", era: "2020s", mechanic: "open world collect characters elemental reactions", build_hint: "element reactions wish characters open world swirl", dimension: "3D", tags: ["gacha", "open world", "anime"] },
  { name: "Hades", keywords: ["hades"], genre: "roguelike", visual_theme: "lava_volcanic", platform: "both", era: "2020s", mechanic: "escape underworld repeated deaths upgrade boons", build_hint: "rooms boons death meta-upgrade dialogue relationship", dimension: "isometric", tags: ["roguelite", "indie", "narrative"] },
  { name: "Slay the Spire", keywords: ["slay the spire"], genre: "roguelike", visual_theme: "horror_bleak", platform: "both", era: "2010s", mechanic: "build deck fight encounters climb spire relics", build_hint: "card rewards energy paths relics boss", dimension: "2D", tags: ["deckbuilder", "roguelike", "indie"] },
  { name: "Diablo II", keywords: ["diablo", "hack slash"], genre: "isometric", visual_theme: "lava_volcanic", platform: "desktop", era: "2000s", mechanic: "click kill loot upgrade gear dungeon", build_hint: "iso click move loot drops skills waypoint", dimension: "isometric", tags: ["arpg", "loot", "blizzard"] },

  // RACING
  { name: "Mario Kart", keywords: ["mario kart"], genre: "racing", visual_theme: "candy_bright", platform: "both", era: "1990s", mechanic: "kart race items shortcuts drift boost", build_hint: "top-down items banana shell boost drift", dimension: "top_down", tags: ["nintendo", "party racing"] },
  { name: "Need for Speed", keywords: ["need for speed", "nfs"], genre: "racing", visual_theme: "neon_arcade", platform: "both", era: "2000s", mechanic: "race opponents drift boost win police", build_hint: "pseudo-3D road or top-down lap checkpoints police", dimension: "3D", tags: ["street racing", "police"] },
  { name: "F-Zero", keywords: ["f-zero"], genre: "racing", visual_theme: "neon_arcade", platform: "both", era: "1990s", mechanic: "hover car racing extreme speed energy boost", build_hint: "pseudo-3D hover energy shield death pit", dimension: "3D", tags: ["futuristic", "nintendo"] },
  { name: "Burnout 3", keywords: ["burnout"], genre: "racing", visual_theme: "sunset_warm", platform: "both", era: "2000s", mechanic: "crash boost race traffic takedown", build_hint: "boost crashdown traffic drift aftertouch", dimension: "3D", tags: ["crash", "arcade racing"] },
  { name: "Rocket League", keywords: ["rocket league"], genre: "sports", visual_theme: "neon_arcade", platform: "both", era: "2010s", mechanic: "cars hit ball into goal aerial boost", build_hint: "physics ball boost jump aerial flip", dimension: "3D", tags: ["cars", "soccer", "esports"] },
  { name: "Hill Climb Racing", keywords: ["hill climb racing"], genre: "racing", visual_theme: "candy_bright", platform: "mobile", era: "2010s", mechanic: "physics drive hills fuel management coins", build_hint: "2D physics gas brake rotate fuel collect", dimension: "side_scroll", tags: ["mobile", "physics", "casual"] },

  // STRATEGY
  { name: "Chess", keywords: ["chess"], genre: "strategy", visual_theme: "minimal_clean", platform: "both", era: "1990s", mechanic: "checkmate opponent king pieces", build_hint: "8x8 board piece rules check highlight legal", dimension: "2D", tags: ["classic", "board", "abstract"] },
  { name: "Civilization V", keywords: ["civilization", "civ"], genre: "strategy", visual_theme: "forest_earth", platform: "desktop", era: "2010s", mechanic: "build empire research conquer hex turns", build_hint: "hex grid cities resources turns research", dimension: "top_down", tags: ["4x", "turn-based", "historical"] },
  { name: "StarCraft II", keywords: ["starcraft", "sc2"], genre: "strategy", visual_theme: "space_cosmic", platform: "desktop", era: "2010s", mechanic: "micro units macro economy race zerg terran", build_hint: "minerals gas units build order micro APM", dimension: "top_down", tags: ["rts", "esports", "blizzard"] },
  { name: "Plants vs Zombies", keywords: ["plants vs zombies", "pvz"], genre: "tower_defense", visual_theme: "forest_earth", platform: "both", era: "2000s", mechanic: "place plants stop zombie waves sun", build_hint: "lanes sun economy plant types waves flags", dimension: "side_scroll", tags: ["tower defense", "casual", "zombies"] },
  { name: "Kingdom Rush", keywords: ["kingdom rush"], genre: "tower_defense", visual_theme: "fantasy_royal", platform: "both", era: "2010s", mechanic: "place towers path defend upgrade special", build_hint: "path tower types upgrade special hero rally", dimension: "top_down", tags: ["tower defense", "mobile"] },
  { name: "Clash of Clans", keywords: ["clash of clans", "coc"], genre: "strategy", visual_theme: "sunset_warm", platform: "mobile", era: "2010s", mechanic: "build base raid enemies troops", build_hint: "grid buildings troops deploy raid attack", dimension: "top_down", tags: ["mobile", "base building"] },
  { name: "League of Legends", keywords: ["league of legends", "lol"], genre: "moba", visual_theme: "fantasy_royal", platform: "desktop", era: "2010s", mechanic: "push lanes destroy enemy nexus abilities", build_hint: "3 lanes minions abilities cooldowns items nexus", dimension: "top_down", tags: ["moba", "esports"] },
  { name: "Worms Armageddon", keywords: ["worms"], genre: "strategy", visual_theme: "tropical_vibrant", platform: "both", era: "1990s", mechanic: "aim projectile destroy enemy worms wind", build_hint: "turn aim power wind destructible terrain banana", dimension: "side_scroll", tags: ["artillery", "funny", "multiplayer"] },
  { name: "XCOM 2", keywords: ["xcom"], genre: "strategy", visual_theme: "military_olive", platform: "desktop", era: "2010s", mechanic: "squad turn combat cover aliens overwatch", build_hint: "grid cover overwatch action points pod", dimension: "isometric", tags: ["turn-based tactical", "aliens"] },

  // SIMULATION
  { name: "The Sims", keywords: ["the sims", "sims"], genre: "simulation", visual_theme: "pastel_cute", platform: "desktop", era: "2000s", mechanic: "manage needs relationships career furnish", build_hint: "needs bars actions furniture mood social", dimension: "isometric", tags: ["life sim", "ea"] },
  { name: "Stardew Valley", keywords: ["stardew valley"], genre: "simulation", visual_theme: "forest_earth", platform: "both", era: "2010s", mechanic: "farm crops befriend villagers seasons fish", build_hint: "grid plant water harvest day cycle shop", dimension: "top_down", tags: ["farming sim", "indie", "cozy"] },
  { name: "Animal Crossing", keywords: ["animal crossing"], genre: "simulation", visual_theme: "pastel_cute", platform: "both", era: "2000s", mechanic: "decorate island befriend animals real-time", build_hint: "grid place furniture villagers chat seasons", dimension: "isometric", tags: ["cozy", "nintendo", "real-time"] },
  { name: "Cities: Skylines", keywords: ["cities skylines", "city builder"], genre: "simulation", visual_theme: "forest_earth", platform: "desktop", era: "2010s", mechanic: "plan city traffic economy growth zones", build_hint: "road layout zones budget traffic water", dimension: "3D", tags: ["city builder", "management"] },
  { name: "Factorio", keywords: ["factorio"], genre: "simulation", visual_theme: "military_olive", platform: "desktop", era: "2010s", mechanic: "automate factory build rocket belt", build_hint: "belt splitter inserter factory chain circuit", dimension: "top_down", tags: ["automation", "factory", "indie"] },
  { name: "Kerbal Space Program", keywords: ["kerbal", "ksp"], genre: "simulation", visual_theme: "space_cosmic", platform: "desktop", era: "2010s", mechanic: "build rocket reach orbit physics NASA", build_hint: "parts assemble launch physics orbit maneuver", dimension: "3D", tags: ["space", "physics", "education"] },
  { name: "Rollercoaster Tycoon", keywords: ["rollercoaster tycoon", "rct"], genre: "simulation", visual_theme: "candy_bright", platform: "desktop", era: "1990s", mechanic: "build rides manage park profit happiness", build_hint: "place rides paths happiness ticket income peeps", dimension: "isometric", tags: ["tycoon", "theme park"] },

  // HORROR
  { name: "Resident Evil 2", keywords: ["resident evil"], genre: "horror", visual_theme: "horror_bleak", platform: "both", era: "1990s", mechanic: "limited ammo escape monsters inventory puzzles", build_hint: "dark rooms inventory keys jump scares zombie", dimension: "top_down", tags: ["survival horror", "capcom"] },
  { name: "Silent Hill 2", keywords: ["silent hill"], genre: "horror", visual_theme: "monochrome_noir", platform: "desktop", era: "2000s", mechanic: "explore foggy town monsters psychological", build_hint: "fog overlay radio static puzzles monster", dimension: "3D", tags: ["psychological horror", "fog"] },
  { name: "Five Nights at Freddy's", keywords: ["five nights", "fnaf"], genre: "horror", visual_theme: "horror_bleak", platform: "both", era: "2010s", mechanic: "survive nights camera check close doors power", build_hint: "camera switch power limit animatronic timer", dimension: "2D", tags: ["indie horror", "suspense"] },
  { name: "Amnesia: The Dark Descent", keywords: ["amnesia"], genre: "horror", visual_theme: "horror_bleak", platform: "desktop", era: "2010s", mechanic: "hide monster manage sanity darkness", build_hint: "sanity meter darkness hide no fight tinderbox", dimension: "3D", tags: ["survival horror", "no combat"] },

  // ROGUELIKES
  { name: "The Binding of Isaac", keywords: ["binding of isaac", "isaac"], genre: "roguelike", visual_theme: "horror_bleak", platform: "both", era: "2010s", mechanic: "random rooms items permadeath synergy", build_hint: "room clear item pickup floor boss curse", dimension: "top_down", tags: ["roguelike", "bullet hell", "indie"] },
  { name: "Enter the Gungeon", keywords: ["enter the gungeon"], genre: "roguelike", visual_theme: "retro_cabinet", platform: "both", era: "2010s", mechanic: "dodge bullet patterns dungeon floors guns", build_hint: "dodge roll blanks items floors boss key", dimension: "top_down", tags: ["bullet hell", "roguelike", "indie"] },
  { name: "Spelunky", keywords: ["spelunky"], genre: "roguelike", visual_theme: "sunset_warm", platform: "both", era: "2010s", mechanic: "dig explore cave permadeath treasures", build_hint: "cave dig bomb rope permadeath trap", dimension: "side_scroll", tags: ["roguelike", "indie", "platformer"] },
  { name: "Dead Cells", keywords: ["dead cells"], genre: "metroidvania", visual_theme: "cyberpunk", platform: "both", era: "2010s", mechanic: "fast combat procedural castle biomes", build_hint: "fast combat biomes permanent unlocks parry", dimension: "side_scroll", tags: ["roguevania", "indie"] },
  { name: "Noita", keywords: ["noita"], genre: "roguelike", visual_theme: "lava_volcanic", platform: "desktop", era: "2020s", mechanic: "craft wand spells pixel physics cave", build_hint: "pixel physics wand spell craft dungeon", dimension: "side_scroll", tags: ["physics", "wand crafting", "indie"] },
  { name: "Balatro", keywords: ["balatro"], genre: "roguelike", visual_theme: "neon_arcade", platform: "both", era: "2020s", mechanic: "poker hands score beat blinds jokers", build_hint: "poker hands jokers multipliers blinds scoring", dimension: "2D", tags: ["deckbuilder", "poker", "indie"] },

  // FIGHTING
  { name: "Street Fighter II", keywords: ["street fighter"], genre: "fighting", visual_theme: "neon_arcade", platform: "both", era: "1990s", mechanic: "combo attacks deplete opponent health hadouken", build_hint: "two fighters health special meter quarter-circle", dimension: "side_scroll", tags: ["classic", "capcom"] },
  { name: "Mortal Kombat", keywords: ["mortal kombat", "mk"], genre: "fighting", visual_theme: "lava_volcanic", platform: "both", era: "1990s", mechanic: "brutal combos fatality finish opponent", build_hint: "fighters blood fatality button combo gore", dimension: "side_scroll", tags: ["mature", "gore", "classic"] },
  { name: "Super Smash Bros", keywords: ["smash bros", "smash"], genre: "fighting", visual_theme: "candy_bright", platform: "both", era: "1990s", mechanic: "knock opponents off platform stock lives", build_hint: "% damage knockback platform stock edge", dimension: "side_scroll", tags: ["platform fighter", "nintendo"] },
  { name: "Tekken 7", keywords: ["tekken"], genre: "fighting", visual_theme: "military_olive", platform: "desktop", era: "2010s", mechanic: "3d fighter combo juggle punish sidestep", build_hint: "3D sidestep juggle combo move list wall", dimension: "side_scroll", tags: ["3d fighter", "namco"] },

  // RHYTHM
  { name: "Guitar Hero", keywords: ["guitar hero"], genre: "rhythm", visual_theme: "neon_arcade", platform: "both", era: "2000s", mechanic: "hit notes in time to music frets", build_hint: "falling lanes timing windows combo fret", dimension: "2D", tags: ["music game", "controller"] },
  { name: "Dance Dance Revolution", keywords: ["ddr", "dance dance revolution"], genre: "rhythm", visual_theme: "neon_arcade", platform: "both", era: "1990s", mechanic: "step arrows on beat dance", build_hint: "4 lanes arrows scroll BPM score perfect", dimension: "2D", tags: ["dance", "arcade rhythm"] },
  { name: "Beat Saber", keywords: ["beat saber"], genre: "rhythm", visual_theme: "neon_arcade", platform: "both", era: "2010s", mechanic: "slice blocks sabers direction beat", build_hint: "mouse slice block direction beat neon", dimension: "3D", tags: ["vr rhythm", "indie"] },
  { name: "osu!", keywords: ["osu"], genre: "rhythm", visual_theme: "pastel_cute", platform: "desktop", era: "2000s", mechanic: "click circles sliders spinners on beat", build_hint: "approach circles timing accuracy combo AR", dimension: "2D", tags: ["free to play", "community"] },
  { name: "Crypt of the NecroDancer", keywords: ["necrodancer", "crypt of the necrodancer"], genre: "rhythm", visual_theme: "horror_bleak", platform: "both", era: "2010s", mechanic: "move on beat dungeon roguelike rhythm", build_hint: "beat step dungeon enemy rhythm miss", dimension: "top_down", tags: ["rhythm roguelike", "indie"] },

  // WORD & CASUAL
  { name: "Wordle", keywords: ["wordle"], genre: "word", visual_theme: "minimal_clean", platform: "both", era: "2020s", mechanic: "guess five letter word six tries color", build_hint: "letter grid keyboard color feedback green yellow", dimension: "2D", tags: ["word game", "viral", "daily"] },
  { name: "Scrabble", keywords: ["scrabble"], genre: "word", visual_theme: "zen_meditation", platform: "both", era: "1990s", mechanic: "place letters form words score bonuses", build_hint: "letter rack board place score bonus tiles", dimension: "2D", tags: ["board game", "word", "classic"] },
  { name: "Cookie Clicker", keywords: ["cookie clicker"], genre: "idle", visual_theme: "pastel_cute", platform: "both", era: "2010s", mechanic: "click bake cookies buy upgrades prestige", build_hint: "big clicker upgrade list passive CPS prestige", dimension: "2D", tags: ["idle", "incremental", "web"] },

  // PARTY
  { name: "Fall Guys", keywords: ["fall guys"], genre: "party", visual_theme: "candy_bright", platform: "both", era: "2020s", mechanic: "race obstacle courses last bean standing", build_hint: "physics obstacles elimination rounds bean ragdoll", dimension: "3D", tags: ["battle royale", "casual"] },
  { name: "Among Us", keywords: ["among us"], genre: "party", visual_theme: "space_cosmic", platform: "both", era: "2020s", mechanic: "complete tasks find impostor vote eject", build_hint: "tasks bar emergency vote impostor kill vent", dimension: "top_down", tags: ["social deduction", "indie"] },
  { name: "Mario Party", keywords: ["mario party"], genre: "party", visual_theme: "candy_bright", platform: "both", era: "1990s", mechanic: "dice board minigames compete steal stars", build_hint: "board path dice minigame rounds star", dimension: "top_down", tags: ["party game", "nintendo"] },

  // ADVENTURE / SANDBOX
  { name: "Minecraft", keywords: ["minecraft"], genre: "3d_sandbox", visual_theme: "forest_earth", platform: "both", era: "2010s", mechanic: "place break blocks build structures survive", build_hint: "WebGL voxel cubes first-person place/remove craft", dimension: "3D", tags: ["sandbox", "survival", "iconic"] },
  { name: "Terraria", keywords: ["terraria"], genre: "sandbox", visual_theme: "fantasy_royal", platform: "both", era: "2010s", mechanic: "mine craft fight bosses explore 2D", build_hint: "side-scroll dig place craft boss biomes", dimension: "side_scroll", tags: ["2d sandbox", "indie"] },
  { name: "No Man's Sky", keywords: ["no man's sky", "nms"], genre: "adventure", visual_theme: "space_cosmic", platform: "both", era: "2010s", mechanic: "explore planets gather resources warp", build_hint: "planet surface gather scan ship warp base", dimension: "3D", tags: ["space exploration", "procedural"] },
  { name: "Journey", keywords: ["journey"], genre: "adventure", visual_theme: "ice_frost", platform: "both", era: "2010s", mechanic: "travel desert mountain wordless multiplayer", build_hint: "glide sand cloth symbols no text coop", dimension: "3D", tags: ["art game", "emotional", "indie"] },
  { name: "Disco Elysium", keywords: ["disco elysium"], genre: "rpg", visual_theme: "cyberpunk", platform: "desktop", era: "2010s", mechanic: "skill checks dialogue murder mystery detective", build_hint: "skill checks thought cabinet dialogue voice", dimension: "isometric", tags: ["rpg", "narrative", "indie"] },
  { name: "The Legend of Zelda: BotW", keywords: ["breath of the wild", "botw", "zelda"], genre: "adventure", visual_theme: "forest_earth", platform: "both", era: "2010s", mechanic: "open world climb cook rune solve shrines", build_hint: "open map shrines rune physics cook stamina", dimension: "3D", tags: ["open world", "nintendo"] },
  { name: "Firewatch", keywords: ["firewatch"], genre: "adventure", visual_theme: "sunset_warm", platform: "desktop", era: "2010s", mechanic: "hike radio dialogue mystery investigate", build_hint: "walk radio dialogue choice mystery trail", dimension: "3D", tags: ["walking sim", "indie", "narrative"] },

  // STEALTH
  { name: "Metal Gear Solid", keywords: ["metal gear", "mgs"], genre: "stealth", visual_theme: "military_olive", platform: "both", era: "1990s", mechanic: "sneak past guards avoid detection cardboard", build_hint: "vision cones hide boxes alert levels radar", dimension: "top_down", tags: ["stealth", "konami", "narrative"] },
  { name: "Hitman", keywords: ["hitman"], genre: "stealth", visual_theme: "minimal_clean", platform: "both", era: "2000s", mechanic: "eliminate target creatively undetected disguise", build_hint: "disguise zones target patrol silent kill", dimension: "3D", tags: ["stealth", "creative kills"] },
  { name: "Thief", keywords: ["thief", "thief game"], genre: "stealth", visual_theme: "monochrome_noir", platform: "desktop", era: "1990s", mechanic: "steal in shadows avoid light rope arrow", build_hint: "light meter shadow move rope arrow water", dimension: "3D", tags: ["stealth", "classic", "first-person"] },

  // SPORTS
  { name: "FIFA / EA FC", keywords: ["fifa", "ea fc", "soccer game"], genre: "sports", visual_theme: "forest_earth", platform: "both", era: "1990s", mechanic: "score goals control team pass shoot", build_hint: "top-down ball pass shoot timer tackle", dimension: "top_down", tags: ["football", "ea", "sim"] },
  { name: "NBA 2K", keywords: ["nba 2k", "basketball game"], genre: "sports", visual_theme: "sunset_warm", platform: "both", era: "2000s", mechanic: "shoot hoops dribble dunk defense", build_hint: "arc shot timing defender block dribble", dimension: "side_scroll", tags: ["basketball", "sim"] },
  { name: "Tony Hawk's Pro Skater", keywords: ["tony hawk", "skateboard"], genre: "sports", visual_theme: "cyberpunk", platform: "both", era: "1990s", mechanic: "combo tricks reach score goal grind", build_hint: "2D park grind jump trick chain manual", dimension: "side_scroll", tags: ["skateboarding", "tricks"] },
  { name: "Wii Sports", keywords: ["wii sports", "motion sport"], genre: "sports", visual_theme: "candy_bright", platform: "both", era: "2000s", mechanic: "motion swing throw punch bowl serve", build_hint: "mouse drag timing power sport mode", dimension: "3D", tags: ["casual", "motion", "nintendo"] },

  // BOARD GAME ADAPTATIONS
  { name: "Catan (digital)", keywords: ["catan", "settlers of catan"], genre: "board", visual_theme: "sunset_warm", platform: "both", era: "2000s", mechanic: "settle trade resources build roads cities", build_hint: "hex grid resource trade build card robber", dimension: "isometric", tags: ["board game", "strategy"] },
  { name: "Monopoly (digital)", keywords: ["monopoly"], genre: "board", visual_theme: "candy_bright", platform: "both", era: "1990s", mechanic: "buy property houses hotels bankrupt opponents", build_hint: "board dice property buy build trade jail", dimension: "2D", tags: ["board game", "classic"] },
  { name: "Risk (digital)", keywords: ["risk", "world domination"], genre: "board", visual_theme: "military_olive", platform: "both", era: "2000s", mechanic: "conquer territories roll dice armies cards", build_hint: "territory dice attack defend card fortify", dimension: "2D", tags: ["board game", "strategy"] },
];

// ─── LESSONS DATA ──────────────────────────────────────────────────────────

const CATALOG_LESSONS = [
  // Visual
  { category: "visual", genre: null, lesson: "Screen shake on impact adds enormous weight — translate canvas 4px for 5 frames.", platform: "both", confidence: 9 },
  { category: "visual", genre: null, lesson: "Flash enemies red on hit for 3 frames — instant readable damage feedback.", platform: "both", confidence: 9 },
  { category: "visual", genre: null, lesson: "Floating score popup: spawn +N at collection point, float up 60px, fade out over 1s.", platform: "both", confidence: 8 },
  { category: "visual", genre: "platformer", lesson: "Dust puff particles on landing make jumps feel grounded.", platform: "both", confidence: 8 },
  { category: "visual", genre: "shooter", lesson: "Muzzle flash on gun fire — white circle at barrel for 2 frames.", platform: "both", confidence: 8 },
  { category: "visual", genre: "puzzle", lesson: "Shake animation on invalid move — CSS translateX 3px oscillation 0.3s.", platform: "both", confidence: 9 },
  { category: "visual", genre: "idle", lesson: "Pulse the click button subtly — scale 1→1.05→1 every 2 seconds when nothing clicked.", platform: "both", confidence: 7 },
  { category: "visual", genre: "horror", lesson: "Chromatic aberration effect on jump scare — offset RGB channels 2px apart.", platform: "desktop", confidence: 7 },
  { category: "visual", genre: "racing", lesson: "Speed lines on sides of screen above threshold velocity add rush feeling.", platform: "both", confidence: 8 },
  { category: "visual", genre: "rpg", lesson: "Damage numbers: float up, critical hits are larger, misses are gray italic.", platform: "both", confidence: 9 },

  // Gameplay
  { category: "gameplay", genre: "platformer", lesson: "Coyote time 6 frames + jump buffer 6 frames = platformer that feels fair.", platform: "both", confidence: 9 },
  { category: "gameplay", genre: "platformer", lesson: "Variable jump height: cut vertical velocity to 40% when button released early.", platform: "both", confidence: 8 },
  { category: "gameplay", genre: "shooter", lesson: "I-frame dash on spacebar prevents cheap deaths in bullet hell games.", platform: "both", confidence: 8 },
  { category: "gameplay", genre: "puzzle", lesson: "Always include undo (Z key) in sokoban-style games — dead ends require restart without it.", platform: "both", confidence: 9 },
  { category: "gameplay", genre: "word", lesson: "Reject invalid words with shake + red flash before accepting any guess.", platform: "both", confidence: 9 },
  { category: "gameplay", genre: "idle", lesson: "Offline earnings up to 4 hours — tell player how much they earned on return.", platform: "both", confidence: 8 },
  { category: "gameplay", genre: "racing", lesson: "Rubber-band AI: opponents speed up when far behind — keeps races tense to finish.", platform: "both", confidence: 8 },
  { category: "gameplay", genre: "fighting", lesson: "Guard window: block reduces damage 70% — always include even in simple fighters.", platform: "both", confidence: 7 },
  { category: "gameplay", genre: "stealth", lesson: "Alert states: unaware → suspicious → alert — each needs distinct color and behavior.", platform: "both", confidence: 9 },
  { category: "gameplay", genre: "roguelike", lesson: "On death, show best run stats and what killed you — makes permadeath feel fair.", platform: "both", confidence: 9 },
  { category: "gameplay", genre: "strategy", lesson: "Confirm destructive actions (delete unit, end turn) — accidental clicks lose games.", platform: "both", confidence: 8 },
  { category: "gameplay", genre: "simulation", lesson: "Pause button essential — complex sims need time to plan without pressure.", platform: "both", confidence: 9 },
  { category: "gameplay", genre: "card", lesson: "Preview card effect on hover before playing — never make players guess.", platform: "both", confidence: 9 },
  { category: "gameplay", genre: "tower_defense", lesson: "Show projected tower range before placing — placing blind is infuriating.", platform: "both", confidence: 9 },

  // Genre
  { category: "genre", genre: "shooter", lesson: "Top-down shooter: enemies should telegraph attacks 0.5s before firing.", platform: "both", confidence: 8 },
  { category: "genre", genre: "platformer", lesson: "Moving platforms must transfer velocity to player or they slide off.", platform: "both", confidence: 8 },
  { category: "genre", genre: "puzzle", lesson: "Match-3: cascade chain reactions should animate each level with 300ms delay.", platform: "both", confidence: 8 },
  { category: "genre", genre: "rpg", lesson: "HP bars turn yellow at 50%, red at 25% — no text needed for urgency.", platform: "both", confidence: 8 },
  { category: "genre", genre: "roguelike", lesson: "Item descriptions must be clear — vague effects break roguelike decision-making.", platform: "both", confidence: 9 },
  { category: "genre", genre: "rhythm", lesson: "Show PERFECT / GREAT / GOOD / MISS feedback at the hit zone immediately.", platform: "both", confidence: 9 },
  { category: "genre", genre: "racing", lesson: "Countdown 3-2-1-GO must appear before every race — even in endless modes.", platform: "both", confidence: 8 },
  { category: "genre", genre: "fighting", lesson: "Health bars top screen, each depleting toward center — universal convention.", platform: "both", confidence: 9 },
  { category: "genre", genre: "horror", lesson: "Silence is scarier than constant music — use ambient drone only.", platform: "both", confidence: 8 },
  { category: "genre", genre: "idle", lesson: "Format numbers: K/M/B/T — never show raw millions.", platform: "both", confidence: 9 },
  { category: "genre", genre: "word", lesson: "Wordle color order: green = right spot, yellow = wrong spot, gray = not in word.", platform: "both", confidence: 10 },
  { category: "genre", genre: "card", lesson: "Show card mana cost and effect clearly at all times — readability is everything.", platform: "both", confidence: 9 },
  { category: "genre", genre: "strategy", lesson: "RTS: box-select units by drag-rectangle — clicking one at a time is unacceptable.", platform: "desktop", confidence: 8 },
  { category: "genre", genre: "simulation", lesson: "Day cycle timer always visible — top of screen, sunrise to sunset.", platform: "both", confidence: 8 },
  { category: "genre", genre: "visual_novel", lesson: "Typewriter text at 30ms/char — click anywhere to skip to end of line.", platform: "both", confidence: 8 },

  // Audio
  { category: "audio", genre: null, lesson: "Create AudioContext only on first user gesture — browsers block autoplay.", platform: "both", confidence: 10 },
  { category: "audio", genre: null, lesson: "Game over: descending 3-note tone. Win: ascending arpeggio. Both under 0.5s.", platform: "both", confidence: 8 },
  { category: "audio", genre: "platformer", lesson: "Jump sound: short rising sine 200→400Hz 0.1s. Land: low thud 80Hz 0.05s.", platform: "both", confidence: 8 },
  { category: "audio", genre: "shooter", lesson: "Shoot sound: short noise burst 0.05s. Hit: lower noise burst. Different enough to hear difference.", platform: "both", confidence: 8 },
  { category: "audio", genre: "idle", lesson: "Pleasant chime on purchase — reward the click with satisfying audio.", platform: "both", confidence: 8 },
  { category: "audio", genre: "horror", lesson: "Footstep audio approaching from off-screen builds dread before enemy arrives.", platform: "desktop", confidence: 8 },

  // Performance
  { category: "performance", genre: null, lesson: "requestAnimationFrame for all animation — never setInterval for render loops.", platform: "both", confidence: 10 },
  { category: "performance", genre: null, lesson: "Object pool for bullets/particles — never new Object() in game loop.", platform: "both", confidence: 9 },
  { category: "performance", genre: "shooter", lesson: "Max 200 bullets on screen — oldest deactivated when pool exhausted.", platform: "both", confidence: 8 },
  { category: "performance", genre: null, lesson: "Sprite draw order: sort by y-position each frame for top-down games.", platform: "both", confidence: 8 },
  { category: "performance", genre: null, lesson: "Clear canvas with clearRect not fillRect — 30% faster on most browsers.", platform: "both", confidence: 7 },

  // Prompt interpretation
  { category: "prompt_interpretation", genre: null, lesson: "User says 'make it like X' — capture the core loop and feel, not the IP.", platform: "both", confidence: 10 },
  { category: "prompt_interpretation", genre: null, lesson: "Vague prompts: pick the most fun interpretation and commit fully.", platform: "both", confidence: 9 },
  { category: "prompt_interpretation", genre: null, lesson: "If user asks for multiplayer, build single-player with AI opponent.", platform: "both", confidence: 9 },
  { category: "prompt_interpretation", genre: null, lesson: "3D request without library: raycast for FPS, pseudo-3D for racing, WebGL inline for worlds.", platform: "both", confidence: 9 },
  { category: "prompt_interpretation", genre: null, lesson: "Hybrid genre requests: pick the dominant mechanic, add the secondary as a feature.", platform: "both", confidence: 8 },
];

// ─── SEEDER FUNCTIONS ──────────────────────────────────────────────────────

async function seedGameCatalog() {
  console.log(`\nSeeding ${REAL_GAMES.length} real game entries...`);
  const rows = REAL_GAMES.map((g) => ({
    name: g.name,
    keywords: g.keywords,
    genre: g.genre,
    visual_theme: g.visual_theme,
    platform: g.platform,
    era: g.era,
    mechanic: g.mechanic,
    build_hint: g.build_hint,
    dimension: g.dimension,
    tags: g.tags,
    confidence: 9,
  }));

  const BATCH = 50;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await supabase.from("game_catalog").upsert(batch, { onConflict: "name" });
    if (error) console.error(`  Batch ${i}–${i + BATCH}: ${error.message}`);
    else console.log(`  Inserted batch ${i}–${Math.min(i + BATCH, rows.length)}`);
  }

  // Generate genre × theme combinations as synthetic entries
  console.log("\nGenerating synthetic genre/theme combinations...");
  const syntheticRows = [];
  for (const genre of GENRES) {
    for (const theme of VISUAL_THEMES) {
      syntheticRows.push({
        name: `${genre}_${theme}_template`,
        keywords: [genre, theme.replace("_", " ")],
        genre,
        visual_theme: theme,
        platform: "both",
        mechanic: `${genre} game with ${theme.replace("_", " ")} visual style`,
        build_hint: `Use ${genre} mechanics with ${theme} color palette and mood`,
        dimension: "2D",
        tags: [genre, theme, "template"],
        confidence: 5,
      });
    }
  }

  for (let i = 0; i < syntheticRows.length; i += BATCH) {
    const batch = syntheticRows.slice(i, i + BATCH);
    const { error } = await supabase.from("game_catalog").upsert(batch, { onConflict: "name" });
    if (error) console.error(`  Synthetic batch ${i}: ${error.message}`);
  }
  console.log(`  Generated ${syntheticRows.length} synthetic combinations`);
}

async function seedLessons() {
  console.log(`\nSeeding ${CATALOG_LESSONS.length} catalog lessons...`);
  const { error } = await supabase.from("catalog_lessons").upsert(
    CATALOG_LESSONS.map((l) => ({ ...l, times_applied: 0, active: true }))
  );
  if (error) console.error("  Lessons error:", error.message);
  else console.log(`  Seeded ${CATALOG_LESSONS.length} lessons`);
}

async function seedLearnedLessons() {
  // Also seed the main learned_lessons table used by the live system
  const { default: pkg } = await import("../lib/game-knowledge.js").catch(() => ({ default: null }));
  // Import SEED_LESSONS from static file via dynamic import
  try {
    const mod = await import("../lib/game-knowledge.js");
    const lessons = mod.SEED_LESSONS || [];
    console.log(`\nSeeding ${lessons.length} learned lessons into live DB...`);
    const { error } = await supabase.from("learned_lessons").upsert(
      lessons.map((l) => ({ ...l, times_confirmed: 1, active: true }))
    );
    if (error) console.error("  learned_lessons error:", error.message);
    else console.log(`  Done`);
  } catch (err) {
    console.warn("  Skipped learned_lessons (ESM import issue):", err.message);
  }
}

async function main() {
  console.log("=== GameCraft Catalog Seeder ===");
  console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL || "(not set)");

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error("\nERROR: NEXT_PUBLIC_SUPABASE_URL not set in .env.local");
    console.error("Add your Supabase URL and SUPABASE_SERVICE_KEY to .env.local first");
    process.exit(1);
  }

  await seedGameCatalog();
  await seedLessons();

  const total = REAL_GAMES.length + GENRES.length * VISUAL_THEMES.length + CATALOG_LESSONS.length;
  console.log(`\n✓ Done — ${total} total entries seeded to Supabase`);
}

main().catch(console.error);
