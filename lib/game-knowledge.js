import { retrieveGameContext } from "./catalog/retrieve";
import { retrieveFromDB, getDBLessons } from "./catalog/retrieve-db";
import { POPULARITY_DNA } from "./popularity-dna";

const ARCHETYPE_RULES = [
  {
    id: "3d_fps",
    keywords: [
      "fps",
      "first person",
      "doom",
      "wolfenstein",
      "raycast",
      "3d maze",
      "3d shooter",
    ],
  },
  {
    id: "3d_racing",
    keywords: ["3d race", "3d driving", "racing 3d", "outrun", "pole position"],
  },
  {
    id: "3d_world",
    keywords: [
      "3d",
      "three dimensional",
      "webgl",
      "minecraft",
      "voxel",
      "first person walk",
      "open world",
    ],
  },
  {
    id: "isometric",
    keywords: ["isometric", "diablo", "tactics", "crpg", "top-down rpg"],
  },
  {
    id: "tower_defense",
    keywords: ["tower defense", "td", "towers", "waves of enemies", "path defense"],
  },
  {
    id: "platformer",
    keywords: ["platform", "jump", "mario", "metroid", "side scroll", "runner"],
  },
  {
    id: "shooter",
    keywords: [
      "shooter",
      "shoot",
      "bullet hell",
      "space invaders",
      "galaga",
      "top-down shoot",
    ],
  },
  {
    id: "racing",
    keywords: ["racing", "race car", "driving", "drift", "lap", "speedway"],
  },
  {
    id: "puzzle",
    keywords: [
      "puzzle",
      "match 3",
      "match-3",
      "sokoban",
      "tetris",
      "logic",
      "brain",
    ],
  },
  {
    id: "word",
    keywords: ["word", "wordle", "spelling", "crossword", "hangman", "letter"],
  },
  {
    id: "card",
    keywords: ["card", "deck", "poker", "blackjack", "solitaire", "hearthstone"],
  },
  {
    id: "idle",
    keywords: ["idle", "clicker", "incremental", "cookie", "prestige", "tap"],
  },
  {
    id: "rpg",
    keywords: [
      "rpg",
      "dungeon",
      "quest",
      "turn based",
      "inventory",
      "level up",
      "adventure",
    ],
  },
  {
    id: "fighting",
    keywords: ["fighting", "fighter", "street fighter", "mortal kombat", "combo"],
  },
  {
    id: "rhythm",
    keywords: ["rhythm", "music", "dance", "beat", "guitar hero", "tiles"],
  },
  {
    id: "sports",
    keywords: ["soccer", "football", "basketball", "tennis", "golf", "sports"],
  },
  {
    id: "simulation",
    keywords: ["sim", "simulation", "tycoon", "city builder", "farm sim", "life"],
  },
  {
    id: "strategy",
    keywords: ["strategy", "rts", "chess", "checkers", "civilization", "4x"],
  },
  {
    id: "board",
    keywords: ["board game", "monopoly", "snakes and ladders", "dice", "tile map"],
  },
  {
    id: "snake",
    keywords: ["snake", "worm", "slither"],
  },
  {
    id: "breakout",
    keywords: ["breakout", "arkanoid", "brick", "paddle", "pong"],
  },
  {
    id: "roguelike",
    keywords: ["roguelike", "rogue", "permadeath", "procedural dungeon"],
  },
  {
    id: "horror",
    keywords: ["horror", "survival horror", "escape room", "haunted"],
  },
  {
    id: "sandbox",
    keywords: ["sandbox", "creative", "build", "craft", "paint", "draw"],
  },
  {
    id: "metroidvania",
    keywords: ["metroidvania", "hollow knight", "ori", "ability gate", "interconnected rooms"],
  },
  {
    id: "bullet_heaven",
    keywords: ["bullet heaven", "vampire survivors", "auto attack", "horde survive", "auto shoot"],
  },
  {
    id: "visual_novel",
    keywords: ["visual novel", "dating sim", "vn", "dialogue choices", "romance story"],
  },
  {
    id: "stealth",
    keywords: ["stealth", "sneak", "vision cone", "guard", "hide", "shadow", "ninja"],
  },
  {
    id: "moba",
    keywords: ["moba", "league of legends", "lanes", "minions", "nexus", "dota"],
  },
  {
    id: "auto_battler",
    keywords: ["auto battler", "auto chess", "autochess", "tft", "teamfight"],
  },
  {
    id: "endless_runner",
    keywords: ["endless runner", "subway surfers", "temple run", "auto run", "runner"],
  },
];

const BLUEPRINTS = {
  "3d_fps": `3D FPS / MAZE (no libraries): Use canvas raycasting (DDA algorithm). Map is 2D grid of walls. Player has x,y,angle. Cast rays per screen column, find wall distance, draw vertical strips scaled by distance. Add floor/ceiling gradient. WASD move, mouse or arrows turn. Enemies as billboard sprites at map positions. Shoot on click/space. HUD: crosshair, health, ammo. Win: reach exit or clear enemies.`,

  "3d_racing": `3D RACING (pseudo-3D): Canvas with road segments as trapezoids (OutRun style). Road curves by offsetting segment centers. Player car sprite at bottom. Obstacles and scenery as scaled sprites on sides. Left/right steer, accelerate. Score = distance. Difficulty = faster curves and traffic.`,

  "3d_world": `3D WORLD (WebGL inline): Use raw WebGL on canvas — no Three.js. Define minimal shaders for colored triangles. Build scene from cubes/planes as vertex buffers. Camera with yaw/pitch, WASD move. Simple lighting via vertex colors. Blocky aesthetic works great. Keep geometry under 200 triangles. Touch: virtual joystick + look buttons.`,

  isometric: `ISOMETRIC: Canvas 2D with iso projection: screenX = (x-y)*tileW/2, screenY = (x+y)*tileH/2. Tile grid map. Click tile to move or interact. DOM overlay for inventory/stats. Characters drawn as colored diamond-base sprites. Pathfinding on grid (BFS).`,

  tower_defense: `TOWER DEFENSE: Canvas or DOM grid path. Enemies follow waypoint path each wave. Click empty tile near path to place tower. Towers auto-target nearest enemy in range. Tower types: damage, slow, splash. Economy from kills. Wave counter. Lose if too many leak. Upgrade button on selected tower.`,

  platformer: `PLATFORMER: Canvas with gravity, velocity, AABB collision against tile rectangles. Coyote time + jump buffer. Moving platforms as rects. Collectibles, spikes, goal flag. Camera follows player. Double jump if prompt implies it. Touch: left/right/jump buttons.`,

  shooter: `SHOOTER: Canvas top-down or side-view. Player ship/character moves freely. Enemies spawn on timer from edges. Bullet pool array — reuse objects. Collision circles or rects. Powerups drop on kill. Screen shake on hit. Wave escalation. Score + lives HUD.`,

  racing: `RACING (2D): Top-down or behind-car view on canvas. Track as polyline or tile circuit. Player velocity + friction + steer. Lap counter, checkpoint gates in order. AI opponents with simple follow-path. Minimap corner. Countdown start.`,

  puzzle: `PUZZLE: DOM grid preferred for match-3, sudoku, sliding tiles. Click/tap to interact. Clear win check each move. Hint button optional. Animated CSS transitions on swaps. For physics puzzles use canvas with static bodies and one interactive element.`,

  word: `WORD GAME: DOM keyboard grid (Wordle-style) or letter rack. Virtual keyboard always visible. Color feedback: correct position, wrong position, absent. 6 guesses or lives. Word list hardcoded array of 50+ common 5-letter words. Shake animation on invalid.`,

  card: `CARD GAME: DOM card elements as styled divs with rank/suit text or unicode. Hand fanned with CSS transform. Deck pile, discard pile. Click to play/draw. Opponent AI with simple rule-based decisions. Mana/energy bar if CCG style.`,

  idle: `IDLE/CLICKER: DOM panels — big click target, currency counter, upgrade list. Each upgrade button shows cost and effect. Exponential cost scaling. Passive income per second tick via setInterval. Prestige layer if prompt implies long progression. Number formatting (K, M, B).`,

  rpg: `RPG/ADVENTURE: DOM for dialogue, choices, inventory list. Canvas or DOM for battle view. Turn order: player chooses attack/item/flee, then enemy acts. Stats: HP, MP, ATK, DEF. XP bar, level up overlay. Branching story with 3-5 nodes minimum.`,

  fighting: `FIGHTING: Canvas two characters facing. Health bars top. Keyboard: arrow keys combos (down-down+punch = special). Hitboxes on attack frames. Knockback velocity. Round timer. Best of 3. Touch: 4 attack buttons + block.`,

  rhythm: `RHYTHM: Lanes (4) with notes falling. Timing windows: perfect/good/miss. Score combo multiplier. Keys DFJK or tap lanes. Note spawn synced to BPM constant. Hit particles. Song as procedural beep pattern if no audio files.`,

  sports: `SPORTS: Canvas field with boundaries. Ball physics: velocity + bounce damping. Player vs AI or timing challenge. Score display. Simple rules (first to N points, timed match). Swipe or arrow to move/hit.`,

  simulation: `SIMULATION: DOM dashboard with resource counters, action buttons, event log. Tick loop every second updating resources. Random events. Goals as checklist. Progress bars. Charts via canvas mini-bars. Clear win when target reached.`,

  strategy: `STRATEGY: Grid board canvas or DOM. Select unit → click valid tile to move. Turn-based: player phase then AI phase. Unit types with move range highlighting. Capture win condition or eliminate all. Undo not needed.`,

  board: `BOARD GAME: DOM grid of cells. Dice roll button. Token pieces animate with CSS transition. Turn indicator. Rules enforced in JS (snakes, ladders, monopoly-lite, etc). 2-4 players or player vs AI.`,

  snake: `SNAKE: Canvas grid. Snake as array of segments. Direction queue to prevent reverse. Food random placement. Speed increases every N food. Wall or wrap mode. Score = length.`,

  breakout: `BREAKOUT: Canvas paddle bottom, ball velocity, brick grid top. AABB bounce physics. Powerups fall: multiball, wide paddle. Lives system. Clear all bricks to win.`,

  roguelike: `ROGUELIKE: DOM or canvas dungeon grid. Fog of war. Random room generation (rooms + corridors). Permadeath. Potions, weapons as pickups. Turn-based move into enemy to attack. Floor descent stairs.`,

  horror: `HORROR: Slow movement, limited visibility (darkness overlay with small light circle around player). Jump scare as flash image div. Collect items to escape. Tension via audio stings on Web Audio. Timer pressure.`,

  sandbox: `SANDBOX: Click/drag to place or paint grid cells. Palette of block types. Clear/reset button. Simple creative goal optional (build shape matching silhouette). Grid snap.`,

  metroidvania: `METROIDVANIA: Side-scroll interconnected rooms on canvas. Player has move + one ability (dash/double-jump). Some doors locked until ability gained. Room transitions via edge collision — fade out/in. Map drawn as small grid in corner showing visited rooms. Enemy respawn on re-enter.`,

  "bullet_heaven": `BULLET HEAVEN (Vampire Survivors style): Top-down canvas. Player auto-attacks nearest enemy each second. Enemies spawn from edges, escalate in count. Gems drop on kill — collect by proximity. XP bar fills, triggers level-up pause screen with 3 upgrade choices (more damage, speed, area, multishot). Timer counts up. Boss at 5 min.`,

  "visual_novel": `VISUAL NOVEL: DOM layout. Character portrait left (colored div or CSS shape), text box bottom 200px, speaker name above text. Text types out 30ms per char — click to skip/advance. Choices appear as 2-3 buttons after dialogue ends. Track relationship variable. 3 possible endings based on choices.`,

  stealth: `STEALTH: Top-down canvas. Guards as rects with vision cone (arc drawn ahead). If player enters cone, alert state triggers — red cone, guard chases. Hide spots as dark rects — player invisible inside. Player move silent when walking slow (shift). Alert meter drains when out of sight. Mission: reach exit.`,

  fighting: `FIGHTING: Canvas two characters facing. Health bars top left and right. Four attacks: light punch (fast, low dmg), heavy punch (slow, high dmg), kick, special (build meter). Hitbox rectangles per attack frame. Knockback velocity on hit. Round timer 60s. Best of 3 rounds. Guard reduces damage 70%.`,

  moba: `MOBA (simplified): Canvas top-down. Two bases on opposite ends. 3 lanes with towers. Minions spawn from base each 8s and walk lanes. Player hero moves with WASD, clicks to target/attack. 3 abilities on Q/W/E with cooldowns shown. Destroy enemy base to win. Kill score tracked.`,

  "auto_battler": `AUTO BATTLER: DOM grid (4×7 bench + 4×4 board). Drag units from bench to board. Prep phase 30s — buy units from 5-card shop (cost 1-3 gold). Battle phase: units auto-attack nearest enemy. HP pools, damage on loss. Round counter, player HP, gold income shown. Synergy bonuses from same-type units.`,

  endless_runner: `ENDLESS RUNNER: Canvas side-scroll. Player fixed at x=120. 3 lanes, swap with up/down arrow. Obstacles scroll from right. Gap must always exist. Coins in patterns. Speed increases 0.1 per 10 coins. Jump with space. Distance score. Double jump if prompt implies. Mobile: swipe gestures.`,

  "top_down_rpg": `TOP-DOWN RPG: Canvas tile grid. Player moves with WASD, pushes against NPC to talk. DOM dialogue box appears with typewriter text. Battle triggers on enemy contact — turn-based overlay appears. Stats: HP, ATK, DEF. XP bar, level up on milestone. Chest objects give items. Door opens with key item.`,

  "clicker_defense": `CLICKER DEFENSE (hybrid): Canvas for play area, DOM sidebar. Click enemies to deal damage. Gold drops — click to collect. Spend gold on auto-towers from sidebar. Towers auto-fire at nearest enemy in range. Waves escalate. Boss every 5 waves. Upgrade tower damage/range/speed.`,

  other: `GENERAL: Analyze the prompt for core verb (shoot, jump, match, collect, race, build, guess, fight, explore). Pick ONE primary mechanic done excellently. Match rendering to mechanic. Ship complete loop in under 450 lines.`,
};

export const SEED_LESSONS = [
  // Core principles
  { category: "gameplay", lesson: "One polished mechanic beats five half-implemented features every time.", confidence: 9 },
  { category: "visual", lesson: "Always theme the HUD to match the game — never use plain system fonts for score.", confidence: 9 },
  { category: "prompt_interpretation", lesson: "If user asks for GTA or Minecraft, build the closest fun single-screen version — never refuse.", confidence: 10 },
  { category: "prompt_interpretation", lesson: "Famous game requests mean replicate the FEEL and LOOP — never copy names, art, or characters.", confidence: 10 },
  { category: "prompt_interpretation", lesson: "Combine multiple genres if prompt asks — e.g. roguelike + deckbuilder or platformer + metroidvania.", confidence: 8 },
  { category: "prompt_interpretation", lesson: "VR/AR requests become mouse-look + reticle interaction — immersive enough in browser.", confidence: 7 },
  { category: "performance", lesson: "Use requestAnimationFrame for all canvas games — never setInterval for render loops.", confidence: 9 },
  { category: "performance", lesson: "Reuse bullet and particle objects from pools — never create arrays in the draw loop.", confidence: 8 },
  { category: "performance", lesson: "Cap particle count at 50 and recycle — unlimited particles crash mobile browsers.", confidence: 8 },
  { category: "audio", lesson: "Procedural Web Audio blips on jump, hit, collect, and game over make games feel 3x more alive.", confidence: 9 },
  { category: "audio", lesson: "Rhythm games should sync spawn rate to BPM constant — 120 BPM is a safe default.", confidence: 7 },
  { category: "audio", lesson: "Create AudioContext only on first user gesture — browsers block autoplay audio.", confidence: 9 },
  { category: "audio", lesson: "Game over needs a descending tone, win needs an ascending arpeggio — 3 notes each is enough.", confidence: 8 },
  { category: "visual", lesson: "Match color palette to game mood — horror uses desaturated reds, candy games use bright pastels.", confidence: 9 },
  { category: "visual", lesson: "Use CSS box-shadow and text-shadow for neon glow — faster than canvas glow and looks great.", confidence: 8 },
  { category: "visual", lesson: "Silhouette art like Limbo reads as premium — black shapes on muted gradient background.", confidence: 7 },
  { category: "visual", lesson: "Pseudo-3D racing with trapezoid road segments looks impressive with minimal code.", confidence: 7 },
  { category: "visual", lesson: "Raycast FPS on canvas with colored wall strips feels like real 3D without WebGL complexity.", confidence: 7 },
  { category: "visual", lesson: "Isometric games draw tiles back-to-front sorted by x+y — depth looks correct automatically.", confidence: 8 },
  { category: "visual", lesson: "Horror games: vignette overlay + limited light radius around player creates instant tension.", confidence: 8 },
  { category: "visual", lesson: "Sports games use green pitch or wood court colors — instantly signals genre to players.", confidence: 7 },
  { category: "visual", lesson: "Particle bursts on item collection make casual games feel juicy — 8 particles per event.", confidence: 8 },
  { category: "visual", lesson: "Screen shake on impact — translate canvas by 3-5px for 4 frames — adds enormous punch.", confidence: 9 },
  { category: "visual", lesson: "Flash enemy red on hit for 3 frames — instant readable damage feedback.", confidence: 9 },
  { category: "visual", lesson: "Score popup animation: spawn +N text at collection point, float up, fade out over 1 second.", confidence: 8 },
  { category: "visual", lesson: "Neon games: draw shapes twice — once large blurred for glow, once sharp on top.", confidence: 7 },
  { category: "visual", lesson: "Title screen background should animate subtly — parallax stars, floating particles, pulse.", confidence: 8 },

  // Platformer
  { category: "gameplay", lesson: "Add coyote time and jump buffer to every platformer — players feel the difference instantly.", confidence: 8 },
  { category: "genre", lesson: "Platformer: coyote time = allow jump 6 frames after walking off edge. Jump buffer = queue jump 6 frames before landing.", confidence: 9 },
  { category: "genre", lesson: "Platformer: variable jump height — cut velocity when button released early for responsive feel.", confidence: 8 },
  { category: "genre", lesson: "Platformer: moving platforms need the player to inherit platform velocity or they slide off.", confidence: 8 },
  { category: "genre", lesson: "Endless runner: 3 lanes, obstacle gaps must always be passable — never two full lanes blocked.", confidence: 8 },

  // Shooter
  { category: "genre", lesson: "Shooters need escalating spawn rates — boredom kills arcade games faster than difficulty.", confidence: 8 },
  { category: "genre", lesson: "Bullet hell: enemy bullets should be large and brightly colored — hard to dodge unseen bullets.", confidence: 8 },
  { category: "genre", lesson: "Twin-stick shooters: aim direction independent of move direction — right stick or mouse aim.", confidence: 8 },
  { category: "genre", lesson: "Top-down shooter: give player an i-frame dash on spacebar — avoids cheap deaths.", confidence: 8 },
  { category: "genre", lesson: "FPS raycast: use DDA (digital differential analysis) — much faster than naive ray stepping.", confidence: 9 },
  { category: "genre", lesson: "Space shooter: enemies should have attack patterns not random fire — pattern > random.", confidence: 8 },

  // Puzzle
  { category: "gameplay", lesson: "Puzzle games must validate moves and animate before next input — no instant state jumps.", confidence: 8 },
  { category: "genre", lesson: "Match-3: cascade animations after clears feel rewarding — animate each level of cascade.", confidence: 8 },
  { category: "genre", lesson: "Sokoban: always include undo (Z key) — without it a dead end requires full restart.", confidence: 9 },
  { category: "genre", lesson: "Physics puzzles: use pre-computed solutions for level validation — never rely on floating point exactness.", confidence: 7 },
  { category: "genre", lesson: "Sliding tile puzzles: highlight valid moves, show win state clearly, play sound on lock.", confidence: 8 },

  // Word
  { category: "gameplay", lesson: "Word games need a visible on-screen keyboard — mobile players cannot type blindly.", confidence: 9 },
  { category: "genre", lesson: "Wordle-style: color feedback must be: green = correct position, yellow = wrong position, gray = absent.", confidence: 10 },
  { category: "genre", lesson: "Wordle: validate guess is a real word from the list before accepting — reject invalid words with shake.", confidence: 9 },
  { category: "genre", lesson: "Word games: animate letters one by one on reveal, not all at once — 100ms stagger.", confidence: 8 },

  // Card
  { category: "genre", lesson: "Card games: fan the hand with CSS rotate transforms — flat rows look like a spreadsheet.", confidence: 7 },
  { category: "genre", lesson: "Card games: hover to expand a card from hand — readability is essential.", confidence: 8 },
  { category: "genre", lesson: "Deckbuilder roguelike: show card costs and player energy clearly at all times.", confidence: 9 },
  { category: "genre", lesson: "Poker: rank hands in order: pair < two pair < three-of-a-kind < straight < flush < full house < four-of-a-kind < straight flush.", confidence: 9 },

  // Idle
  { category: "gameplay", lesson: "Idle games need visible progression within 30 seconds or players leave before the hook lands.", confidence: 8 },
  { category: "genre", lesson: "Idle: format big numbers — K for thousand, M for million, B for billion, T for trillion.", confidence: 9 },
  { category: "genre", lesson: "Idle: show cost of next upgrade and current income/sec prominently — players need to plan.", confidence: 8 },
  { category: "genre", lesson: "Idle clicker: the big click target should pulse or animate — reward clicking visually.", confidence: 8 },

  // RPG
  { category: "genre", lesson: "Turn-based RPG: show damage numbers above enemies when hit — float up and fade.", confidence: 9 },
  { category: "genre", lesson: "RPG: HP bars should turn red when below 25% — adds urgency without popup.", confidence: 8 },
  { category: "genre", lesson: "Roguelike: procedural dungeon = rooms connected by corridors, place enemies and loot per room.", confidence: 8 },
  { category: "gameplay", lesson: "Roguelike runs need random room rewards and permadeath — each run feels fresh.", confidence: 8 },
  { category: "genre", lesson: "Bullet heaven = auto-attack + XP gems + level-up choice screen — Vampire Survivors formula.", confidence: 8 },
  { category: "genre", lesson: "Action RPG isometric: camera fixed at 45° — tile draw order must be y-sorted.", confidence: 8 },

  // Strategy / TD
  { category: "gameplay", lesson: "Tower defense: show tower range circle on hover before placing — prevents frustration.", confidence: 8 },
  { category: "genre", lesson: "Tower defense: enemy HP bars above each enemy — always visible, essential feedback.", confidence: 9 },
  { category: "genre", lesson: "RTS: box-select units by dragging — never require click per unit.", confidence: 8 },
  { category: "genre", lesson: "Auto battler: show synergy bonus clearly when placing unit — immediate visual feedback.", confidence: 8 },

  // Racing
  { category: "gameplay", lesson: "Racing games need countdown 3-2-1-GO and lap counter visible from first frame of race.", confidence: 7 },
  { category: "genre", lesson: "Racing: rubber-band AI catches up when player leads — keeps race tense to finish.", confidence: 8 },
  { category: "genre", lesson: "Pseudo-3D racer: road segment offset for curves should be smooth — linear interpolation not snap.", confidence: 8 },

  // Fighting
  { category: "gameplay", lesson: "Fighting games need 3-4 distinct attacks with visible windup frames — telegraph matters.", confidence: 8 },
  { category: "genre", lesson: "Fighting: health bars top screen, one per player side, deplete toward center.", confidence: 9 },
  { category: "genre", lesson: "Fighting: knockback velocity makes hits feel weighty — slide opponent back on hit.", confidence: 8 },
  { category: "genre", lesson: "Fighting: super move / special requires input combo — never just one button.", confidence: 7 },

  // Rhythm
  { category: "gameplay", lesson: "Rhythm games: generous timing windows early, tighten slightly as combo grows.", confidence: 7 },
  { category: "genre", lesson: "Rhythm: show PERFECT / GREAT / GOOD / MISS popup at hit zone — player needs timing feedback.", confidence: 9 },
  { category: "genre", lesson: "Rhythm: combo multiplier displayed large — losing combo should feel dramatic.", confidence: 8 },

  // Horror
  { category: "genre", lesson: "Horror: silence is scarier than constant music — use ambient drone, not soundtrack.", confidence: 8 },
  { category: "genre", lesson: "Horror: footstep audio cues when enemies approach — builds dread before they arrive.", confidence: 8 },
  { category: "genre", lesson: "Survival horror: inventory limited to 6 slots forces meaningful choices.", confidence: 7 },

  // Simulation
  { category: "genre", lesson: "Simulation dashboards: tick resources every second, show +N/s on generators.", confidence: 8 },
  { category: "genre", lesson: "City builder: start small — one house, one road, show happiness from frame 1.", confidence: 8 },
  { category: "genre", lesson: "Farming sim: day cycle required — show sunrise/sunset timer at all times.", confidence: 8 },
  { category: "genre", lesson: "Life sim: needs meters for hunger, energy, social — all visible, all decay over time.", confidence: 8 },

  // Visual novel
  { category: "genre", lesson: "Visual novels need portrait boxes, speaker names, and 2-3 branching choice buttons.", confidence: 8 },
  { category: "genre", lesson: "Visual novel: typewriter text effect at 30ms per char — skip on click.", confidence: 8 },
  { category: "genre", lesson: "Narrative game: choices must visibly affect something — even mood or tone, not just stats.", confidence: 9 },

  // Stealth
  { category: "gameplay", lesson: "Stealth games show vision cones from guards — player instantly understands detection.", confidence: 8 },
  { category: "genre", lesson: "Stealth: alert states — unaware → suspicious → alert — each needs distinct visual cue.", confidence: 9 },

  // Sports
  { category: "genre", lesson: "Sports: always show scoreboard and timer prominently — game score is the entire tension.", confidence: 9 },
  { category: "genre", lesson: "Physics sports: ball must have spin and bounce damping — pure elastic bounce feels fake.", confidence: 8 },

  // MOBA / party
  { category: "genre", lesson: "MOBA simplified = 3 lanes, minions tick, hero abilities on cooldown, destroy base.", confidence: 7 },
  { category: "genre", lesson: "Battle royale = shrinking safe zone + loot + elimination — works even as top-down 2D.", confidence: 8 },
  { category: "genre", lesson: "Metroidvania = interconnected rooms with ability-gated paths — one screen can demo this.", confidence: 7 },

  // Mobile
  { category: "gameplay", lesson: "Mobile games need thumb-reachable controls in bottom corners — never top-only buttons.", confidence: 9 },
  { category: "genre", lesson: "Mobile game: touch buttons need 56px minimum tap target — 48px is too small for fat fingers.", confidence: 9 },
  { category: "genre", lesson: "Mobile swipe detection: track touchstart and touchend delta — 30px threshold for swipe.", confidence: 8 },

  // Research-backed: Game Feel / Juice
  { category: "gameplay", lesson: "Hit stop (freeze game 2–4 frames on big hits) is the single most effective technique for making hits feel physical — Celeste, Hollow Knight, Street Fighter all use it.", confidence: 10 },
  { category: "gameplay", lesson: "Squash-and-stretch on jump: scaleY 1.3 on launch, scaleY 0.7 scaleX 1.3 on land for 4 frames. Players won't notice it consciously but instantly feel the difference.", confidence: 9 },
  { category: "gameplay", lesson: "Pitch-randomize repeated sounds by ±10–15% to prevent machine-gun fatigue — same sound plays 100x/session without annoying players.", confidence: 9 },
  { category: "visual", lesson: "Floating score text: spawn '+N' at event location, float upward, fade out over 0.8s. Size 14px for minor, 32px+ for major events.", confidence: 9 },
  { category: "visual", lesson: "Enemy color flash: white flash for 1–3 frames on hit, red vignette pulse at critical health — instant readable feedback without HUD clutter.", confidence: 9 },

  // Research-backed: First 10 seconds
  { category: "gameplay", lesson: "First 10 seconds rule: player must INTERACT within 3s, achieve first WIN within 30s, experience core loop within 2 minutes. Never open with a static title and nothing moving.", confidence: 10 },
  { category: "gameplay", lesson: "Power Fantasy Rule: the first action should feel like the MOST EXCITING version of the core loop, not the simplest. Front-load the fun.", confidence: 9 },
  { category: "gameplay", lesson: "New discovery or reward every 60 seconds for the first 10 minutes — not every 5 minutes. Retention drops dramatically when nothing new appears.", confidence: 9 },

  // Research-backed: Progression
  { category: "gameplay", lesson: "Never empty the XP bar on level-up: start the next level already 15% filled. Completing a bar that immediately refills a bit feels like momentum, not reset.", confidence: 9 },
  { category: "gameplay", lesson: "Pre-level rush: when progress bar reaches 80%, subtly increase reward rate to create a momentum surge toward the milestone.", confidence: 8 },
  { category: "gameplay", lesson: "Show locked content as silhouettes — curiosity from unknown is stronger than knowing exactly what's ahead. Dark outlines of future weapons/levels drive engagement.", confidence: 8 },

  // Research-backed: Platformers
  { category: "genre", lesson: "Platformer: non-parabolic gravity is essential — apply 1.5–2.5x gravity on DESCENT vs ascent. Standard parabola feels floaty and dead.", confidence: 10 },
  { category: "genre", lesson: "Platformer: instant respawn (<1 second) is critical for hard games. Every animation frame added to death recovery is subtracted from practice time.", confidence: 9 },
  { category: "genre", lesson: "Platformer level design: each level = one-sentence mechanic concept (barrel cannons, mine carts, wall-jump walls). Introduce safe, escalate, test mastery, end. Never overstay.", confidence: 9 },

  // Research-backed: Shooters
  { category: "genre", lesson: "Shooter: aggression feedback loop — killing enemies should give back resources (health, ammo) to mechanically FORCE aggressive play. Retreating = starving. Doom Eternal's genius.", confidence: 10 },
  { category: "genre", lesson: "Shooter enemy design: orthogonal differentiation — charge vs range × projectile vs hitscan = 4 archetypes, each forcing different player behavior. Not 'stronger goblin'.", confidence: 9 },
  { category: "genre", lesson: "Space Invaders escalation: enemies speed up as numbers decrease. Closer to winning = harder. Synchronized audio speedup. Dynamic difficulty through attrition.", confidence: 9 },
  { category: "genre", lesson: "Bullet heaven (Vampire Survivors style): reward cadence every few seconds minimum, level-up choice screen every ~60s, build synergies between auto-attacks.", confidence: 9 },

  // Research-backed: Horror
  { category: "genre", lesson: "Horror tension formula: 70% tension-building (nothing happens), 20% scare/release, 10% recovery. Jumpscare without buildup = nuisance, not fear.", confidence: 10 },
  { category: "genre", lesson: "Horror: strategic silence — cut ALL audio 3–5 seconds before a major scare. Absence of sound creates more dread than any sound effect. Free and extremely effective.", confidence: 10 },
  { category: "genre", lesson: "Horror resource scarcity: set supplies at 60–70% of comfort level. Running low on ammo is more frightening than having none (adaptation vs agonizing rationing).", confidence: 9 },
  { category: "genre", lesson: "Horror: anticipation generates MORE fear than the actual threat. Player's imagination fills gaps better than any monster design. Slow reveal > full reveal.", confidence: 9 },

  // Research-backed: Roguelikes
  { category: "genre", lesson: "Roguelike hook is SYNERGY DISCOVERY — two items interacting unexpectedly, character becoming 5x more powerful than intended. Design-in 'broken build' moments as the reward.", confidence: 10 },
  { category: "genre", lesson: "Roguelike: show enemy intent (what enemy will do next turn) for card/turn-based games. Creates visible puzzle from imperfect solution. Slay the Spire's core tension.", confidence: 9 },
  { category: "genre", lesson: "Roguelike death screen: show run stats, best item, 'key moment' highlight. Converts failure into data and encourages next run. Never just 'YOU DIED'.", confidence: 9 },
  { category: "genre", lesson: "Roguelike reward cadence: meaningful choice (new power, upgrade, item) every 60–90 seconds. Never let 2+ minutes pass without a meaningful decision point.", confidence: 9 },

  // Research-backed: RPG
  { category: "genre", lesson: "RPG hook: identity fantasy — 'who do I want to be?' is the real question. Give meaningful character creation choice early. Even 2 options (knight vs rogue) creates ownership.", confidence: 9 },
  { category: "genre", lesson: "RPG: 3 parallel progression tracks minimum — mechanical (get stronger) + cosmetic (look cooler) + narrative (world changes around player). Even text changes count.", confidence: 9 },

  // Research-backed: Simulation/Cozy
  { category: "genre", lesson: "Simulation: compounding feedback loop — every action generates 3 new possible actions. Stardew Valley: water crops → sell → buy seeds → get gifts → get recipes → new goals. No stopping point.", confidence: 9 },
  { category: "genre", lesson: "Cozy/sim: no fail state removes sympathetic nervous system stress response. Player feels SAFE and engaged. Stardew: you pass out but never lose the farm.", confidence: 8 },

  // Research-backed: Racing
  { category: "genre", lesson: "Racing speed sensation: edge vignette blur activating above 70% max speed is the most effective speed technique. Also: FOV widen 10–15° at max speed. Purely visual, free to implement.", confidence: 9 },
  { category: "genre", lesson: "Racing drift: always attach a MECHANICAL REWARD to drift (speed boost charge). Drift = visual spectacle + earned reward. Mario Kart's 3-tier sparks build anticipation.", confidence: 9 },

  // Research-backed: Strategy
  { category: "genre", lesson: "Strategy: pre-show consequences before commitment — show tower range, hit percentage, projected growth. Seeing the result before acting is highest-value UX pattern in strategy.", confidence: 9 },
  { category: "genre", lesson: "Strategy: never have filler turns where player has nothing meaningful to decide. Every turn must present at minimum one interesting choice.", confidence: 9 },

  // Research-backed: Rhythm
  { category: "genre", lesson: "Rhythm: note patterns are choreography — movement to hit note A should naturally put player in position for note B. Bad patterns create awkward collisions that shatter flow state.", confidence: 9 },
  { category: "genre", lesson: "Rhythm: escalating BPM — start sessions slow, increase tempo gradually. Players don't consciously notice the increase; they just feel themselves getting faster. Maximum flow.", confidence: 8 },

  // Research-backed: Fighting
  { category: "genre", lesson: "Fighting: three-tier hit audio — light tap / solid thwack / deep boom. Fighting game sound team iterates hundreds of impact sounds to find gut-response. Even 3 samples triple perceived quality.", confidence: 9 },
  { category: "genre", lesson: "Fighting: character silhouette must be readable WITHOUT color or detail. Dhalsim's stretchy limbs, Zangief's bulk. If silhouette is ambiguous, readability fails at combat speed.", confidence: 9 },
];

export const CORE_GAME_KNOWLEDGE = `GAMECRAFT MASTER KNOWLEDGE — you know how to build every major game type in a single HTML file.

PROMPT INTERPRETATION:
Read the user's prompt and identify: (1) core verb — what does the player DO? (2) perspective — top-down, side-view, first-person, isometric? (3) win condition. If they ask for a famous game (Minecraft, Fortnite, Zelda, etc.), build the closest playable single-file version — never say impossible. If vague, pick the most fun interpretation and commit fully.

RENDERING DECISION TREE — pick exactly one:
- Canvas 2D: movement, physics, projectiles, particles, animation, tile maps, snake, breakout, platformers, top-down action
- Canvas raycasting: first-person 3D maze/shooter (DDA algorithm, vertical wall strips)
- Canvas pseudo-3D: racing games (trapezoid road segments, scaled roadside sprites)
- Raw WebGL (inline shaders, no libraries): blocky 3D worlds, rotating cubes, simple 3D scenes under 200 triangles
- Isometric canvas: tactics, city builders, RPG exploration on diamond grid
- DOM/CSS: card games, word games, idle/clicker UIs, visual novels, board games, turn-based menus, inventory screens
- Hybrid: DOM for HUD/menus + canvas for gameplay (best for RPG, tower defense, complex UIs)

2D GAME UI STANDARDS:
- HUD bar: top or bottom, semi-transparent background rgba(0,0,0,0.5), themed border
- Health: hearts or segmented bar with color shift green→yellow→red
- Score: large readable numbers, pop animation on change
- Mobile touch controls: fixed position circles bottom-left (dpad) and bottom-right (action buttons), min 48px tap targets
- Title screen: game name large, tagline, Start button prominent, controls summary below
- Game over overlay: dim backdrop, final score, Restart button, best score if tracked in variable
- Pause: P key or pause button freezes update loop, shows overlay

3D WITHOUT LIBRARIES:
- Raycaster FPS: 2D map array, player x/y/angle, cast rays, draw vertical lines per column — looks like Wolfenstein
- Pseudo-3D racer: road segments as trapezoids narrowing to horizon, curves shift segment offset
- WebGL minimal: getContext('webgl'), compile inline vertex/fragment shaders as strings, draw TRIANGLES with position+color attributes, matrix math for camera — blocky Minecraft-style worlds are achievable
- Isometric: project grid (x,y) to screen with iso math, draw tiles back-to-front

PHYSICS PATTERNS (canvas):
- Platformer: gravity constant, velocity += gravity, position += velocity, AABB vs tile rects, ground check
- Top-down: velocity with friction multiplier 0.92, no gravity
- Ball/paddle: reflect velocity on collision, normalize and multiply by speed
- Bullet pool: array of {x,y,vx,vy,active}, spawn inactive bullet on fire, deactivate on hit

AUDIO (Web Audio API):
Create AudioContext on first user click. Oscillator + GainNode for each sound. Jump: short rising tone. Hit: noise burst. Collect: pleasant chime. Game over: descending tone. Keep volumes low (gain 0.1-0.3).

GENRE QUICK REFERENCE:
Arcade shooter: player center/bottom, enemies from top, bullet pool, waves
Platformer: tiles, gravity, jump, collectibles, goal
Puzzle: click/tap grid, match logic, win check
Word: letter grid + keyboard, color feedback
Card: DOM cards, hand, deck, AI opponent
Idle: click target, upgrades, passive tick, big numbers
TD: enemy path, place towers, waves, economy
RPG: dialogue choices, stats, turn combat, inventory DOM
Racing: track, steer, lap counter, AI opponents
Fighting: two fighters, health bars, attack buttons, hitboxes
Rhythm: falling notes, timing windows, combo score
Roguelike: dungeon grid, fog of war, permadeath, loot
Horror: darkness overlay, limited vision, collect to escape
Simulation: resource ticks, buttons, goals, event log
Sports: ball physics, boundaries, score, simple AI
Strategy: grid, select unit, move range, turn phases
Board: cell grid, dice, tokens, turn order
Sandbox: paint/place grid, palette, creative freedom

WHEN USER ASKS FOR 3D:
Default to the simplest 3D that delivers the fantasy: racing→pseudo-3D, shooter/maze→raycaster, building/exploration→WebGL cubes, tactics→isometric. Never output a flat 2D game when they explicitly asked for 3D.

SCOPE: Under 450 lines. One genre, one mechanic, executed brilliantly. Cut features before cutting polish.

POPULARITY LAWS (apply to every game):
1. First win within 30s — cannot fail in first 30s
2. Every action needs feedback within 50ms
3. Screen shake 2-6px on hits. Particles on kills/collect. Hit flash 2-3 frames white.
4. Hit stop: freeze 2-4 frames on impactful hits
5. Score counter pops/pulses on change — never silent
6. Sound on every action (jump, hit, collect, die, levelup) — pitch randomize ±12%
7. Game over shows score + restart button instantly
8. Difficulty ramps: 0-30s easy, 30s-3min moderate, 3min+ hard
9. Core loop fun without rewards — raw action must feel good
10. "One more run" — near-miss, next milestone always visible`;

export function detectGameArchetype(prompt) {
  const p = (prompt || "").toLowerCase();

  for (const rule of ARCHETYPE_RULES) {
    if (rule.keywords.some((kw) => p.includes(kw))) {
      return rule.id;
    }
  }
  return "other";
}

export async function buildGameBlueprint(prompt) {
  const archetype = detectGameArchetype(prompt);
  const blueprint = BLUEPRINTS[archetype] || BLUEPRINTS.other;
  const catalog = retrieveGameContext(prompt);
  const dbCatalog = await retrieveFromDB(prompt).catch(() => null);
  const extra = dbCatalog ? `\n\n${dbCatalog}` : "";
  return `DETECTED GAME TYPE: ${archetype}\nIMPLEMENTATION BLUEPRINT — follow this exactly:\n${blueprint}\n\n${catalog}${extra}`;
}
