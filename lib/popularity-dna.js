// Distilled from research into 100+ top games across every genre.
// These principles are injected into every game generation prompt.

export const POPULARITY_DNA = `
═══════════════════════════════════════════════════════
POPULARITY DNA — WHY TOP GAMES HOOK MILLIONS OF PLAYERS
═══════════════════════════════════════════════════════

7 UNIVERSAL LAWS (apply to EVERY game you generate):
1. Fun must come first — the raw action must feel satisfying before any rewards exist
2. Every player action needs immediate feedback within 50ms — zero ambiguity
3. First 30 seconds are everything: first WIN under 30s, "wow" moment under 60s
4. Difficulty must stay just ahead of skill — never behind, never overwhelming
5. Progress must be visible and continuous — always something filling, growing, counting
6. Simplicity at surface, depth below — easy to start, impossible to perfect
7. Every session ends with "just one more" — near-miss, unlockable, or next milestone visible

MANDATORY GAME FEEL (add to EVERY game — no exceptions):
• Screen shake: 2–6px for 0.1–0.3s on hits/explosions. Decay: magnitude *= 0.85/frame
• Particles: 8–15 on kill/collect. Pre-allocate pool of 50, NEVER create in draw loop
• Hit flash: enemy flashes white for 2–3 frames on damage — instant readable feedback
• Floating text: "+100", "COMBO!", "PERFECT!" rises at event location, fades over 0.8s
• Hit stop: freeze game 2–4 frames (33–66ms) on impactful hits — makes them feel physical
• Sound: EVERY action needs a sound. Jump, hit, collect, die, level-up. Pitch randomize ±12%
• Score animation: counter pulses or pops on change — never just updates silently

THE FIRST 10 SECONDS CHECKLIST:
□ Something moving or animated is visible immediately on load (not a static title)
□ Player can interact with something within 3 seconds
□ First success/win moment occurs within 30 seconds
□ New discovery or reward every 60 seconds for first 10 minutes
□ Core loop experienced at least once within 2 minutes
□ Power Fantasy Rule: first action should feel like the MOST EXCITING version of the core loop

DIFFICULTY FORMULA (flow state):
• 0–30s: Cannot fail — pure tutorial, zero punishment
• 30s–3min: 20% difficulty ramp — player succeeds 80% of attempts
• 3–10min: Linear ramp to 60% — flow state begins here
• 10+ min: 60–80% with respites every 3–5 minutes (tension requires release)
• Boss/spike moments at 90% — brief, defined, survivable

PROGRESSION THAT HOOKS:
• Never empty the bar: at level-up, next bar starts 15% filled
• Stack 3 tracks: short (XP, 2–5 min) + medium (level, 10–30 min) + always (high score)
• Pre-level rush: when bar is 80%+, subtly increase reward rate — momentum surge
• Unlock = qualitatively different (new ability/mode), NOT just "+5 HP"
• Show locked content as silhouettes — curiosity > knowing what's ahead

GENRE-SPECIFIC HOOKS (top games in each genre use these):

PLATFORMER: Coyote time 100–150ms after ledge, jump buffer 100–150ms before land, 1.5–2x gravity on descent vs ascent. Squash on land: scaleY 0.7, scaleX 1.3 for 4 frames. Instant respawn (<1s). Each level = one mechanic introduced safe → escalated → mastery tested.

SHOOTER: Aggression reward loop — killing gives back resources (ammo, health, armor) to FORCE engaging. Enemy orthogonal differentiation: charge vs range × projectile vs hitscan = 4 archetypes forcing different responses. Space Invaders escalation: enemies speed up as numbers drop — closer to winning = harder.

HORROR: 70% tension-building (nothing happens), 20% release (scare), 10% recovery. Silence before scares: cut all audio 3–5s before event — absence creates more dread than noise. Resource scarcity at 60–70% of comfort — never 0%, never 100%. Anticipation generates MORE fear than the actual threat.

ROGUELIKE: Synergy discovery is the core hook — two items interacting unexpectedly = eureka dopamine spike. Show enemy intent (what they'll do next turn) — creates visible puzzle from imperfect solutions. Meaningful choice every 60–90 seconds. Reward cadence never lapses. Death screen = stats + best item + encourage next run (never punitive).

RPG: Identity fantasy — "who do I want to be?" is the real question. 3 parallel progression tracks: mechanical (get stronger) + cosmetic (look cooler) + narrative (world changes). World must react: NPCs change, areas remember, choices have visible consequence. Named characters with personality = emotional investment multiplier.

STRATEGY: "One more turn" via chained deferred rewards — the action you take now pays off in 5 turns, but that payoff reveals a new problem. Always visible horizon: completing goal reveals next goal before player feels the absence. Pre-show consequences before commitment: show hit %, growth trajectory, tower range circle.

TOWER DEFENSE: Enemy mechanical differentiation — NOT more HP, different required response (flies bypass ground, armored needs pierce). Tower synergies: adjacent towers that boost each other reward systemic thinking. Pre-wave announcement (10s planning window) = brief agency moment. Economy from kills creates tactical decision layer.

IDLE/CLICKER: First automation within 3–5 minutes — player becomes MANAGER not clicker. Variable ratio schedule (golden cookie, random crits) — uncertainty is more compelling than fixed rewards. Prestige: transforms loss (reset) into investment (permanent multiplier). Offline accumulation: returning to stockpile = powerful reward.

PUZZLE: Zeigarnik Effect is the core hook — brain stores incomplete tasks in active working memory. Solution must feel INEVITABLE in retrospect ("of course!"). Cascade animation after multi-clears escalates response (more particles, pitch rise, screen shake). Speed ramp: 2% faster per level compounds beautifully.

WORD/SOCIAL: Shareable result without spoiling answer (Wordle emoji grid). Streak = loss aversion. Dual-brain engagement: language + logic cortex = higher dopamine. Reward partial progress — every guess informative even when wrong.

RACING: Speed sensation = edge vignette blur above 70% max speed + FOV increase 10–15° at max. Drift = spectacle (car sideways) + mechanical reward (boost charge). Rubber band AI: keep NPCs within 3–8s of player through midpoint. Every track = one-sentence identity rule. Instant restart for time trials.

FIGHTING: Hit stop 3–8 frames on contact — most important juice element. Three-tier hit audio (tap/thwack/boom). 25–30% health threshold marked visually — signals comeback drama. Character silhouette readable without color. Low-health = comeback narrative, not hopelessness.

RHYTHM: Music controls the pace — player surrenders control and achieves flow. Note patterns are choreography: movement to hit A puts player in position for B. Instant restart <0.5s. Perfect/Good/Miss: 3 tier hit quality. Escalating BPM (players don't notice tempo increase — they just feel faster).

SIMULATION/COZY: Compounding feedback loop — every action generates 3 new possible actions. Nested daily + seasonal + long-term loops. No fail state = parasympathetic response (calm vs anxiety). Visible world change: player must SEE their mark on the world accumulating.

SPORTS: Single core mechanic with depth (power swing bar, drift timing). 2–5 minute natural session length. First goal/score within 60s. Celebration oversizing: every score = camera cut + crowd reaction + UI fanfare. Dual audience: accessible surface, hidden optimization depth.

SANDBOX: Emergent narrative from system interactions — stories no designer wrote. Progression bottleneck chain: Resource A → Tool B → Resource C → Structure D. Show immediate visible change from every player action. Day/night cycle = rhythm and tension without punishment.

WHAT SEPARATES TOP GAMES FROM MEDIOCRE:
1. Core loop fun WITHOUT rewards — strip rewards, is raw action satisfying for 3 minutes? If no, fix this first.
2. Emotional resonance — specific emotion, not just "entertaining": Tension→Release (action/horror) | Curiosity→Discovery (exploration) | Competence→Pride (puzzle) | Creative Expression→Ownership (sandbox)
3. Polish before complexity — controls feel → visual feedback → audio → visual quality → more features. In that order.
4. 5-second screenshot test — can someone understand "what do I do?" from a screenshot alone?
5. The world reacts — even minimal reactivity (NPC comment, door opens, score acknowledgment) makes players feel their presence matters

VIRAL FORMULA (build this in when possible):
• Shareable output: score format designed to share ("I scored 847 — beat that!")
• Social frustration loop: failures worth sharing as much as triumphs (Flappy Bird)
• Artificial scarcity or ritual: daily challenge, one-per-session creates appointment
• "One more run" architecture: roguelikes, daily puzzles, leaderboards, procedural generation
`;
