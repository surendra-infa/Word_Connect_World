import { getFormableWords } from './words';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type Level = {
  id: number;
  name: string;
  letters: string[];
  masteryBonus: number;
  difficulty: Difficulty;
};

// Completion points: each found word adds to the level's 100-point goal.
// 3-letter word = 20 points, 4-letter = 25, 5+ letters = 30. The same rule
// applies on every difficulty, including hard.
export function wordPoints(word: string): number {
  const len = word.length;
  return len <= 3 ? 20 : len === 4 ? 25 : 30;
}

// Words revealed by a hint earn half points.
export function hintWordPoints(word: string): number {
  return Math.floor(wordPoints(word) / 2);
}

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

export const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  easy: '#4ade80',
  medium: '#fbbf24',
  hard: '#f87171',
};

// Seed words (6–7 letters, common, form many sub-words). Procedurally
// generated levels sample from this pool so we can produce thousands of
// unique puzzles without hand-curating each one.
const SEED_POOL: string[] = [
  'GARDEN', 'CASTLE', 'PLANET', 'OCEANS', 'WINDOW', 'MASTER', 'SILVER',
  'GUITAR', 'POCKET', 'FOREST', 'BRIDGE', 'SUMMER', 'WINTER', 'SPRING',
  'AUTUMN', 'ROCKET', 'TEMPLE', 'MARKET', 'DRAGON', 'KNIGHT', 'PIRATE',
  'ISLAND', 'DESERT', 'JUNGLE', 'RIVERS', 'VALLEY', 'MEADOW', 'HARBOR',
  'TUNNEL', 'MARBLE', 'VOLCANO', 'FLOWER', 'SATURN', 'JUPITER', 'WEIGHT',
  'GOLDEN', 'GALAXY', 'BASKET', 'CANDLE', 'DOCTOR', 'FACTORY', 'HEALTH',
  'JOURNEY', 'LADDER', 'MONSTER', 'NUMBERS', 'ORCHARD', 'PENGUIN', 'QUARTZ',
  'RHYTHM', 'TRAVEL', 'WIZARD', 'ZEBRAS', 'ANGELS', 'BUTTON', 'CRYSTAL',
  'DOLPHIN', 'ENGINE', 'FEATHER', 'GIRAFFE', 'HARMONY', 'KINGDOM', 'LANTERN',
  'MAGNETS', 'NOODLE', 'OCTOPUS', 'PUZZLE', 'RAINBOW', 'SHADOW', 'TORNADO',
  'UNICORN', 'VORTEX', 'WHALES', 'CIRCUS', 'BUTTER',
];

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Levels 1–10 are easy so new players learn the mechanics. After that a
// 20-level repeating cycle keeps the pacing varied and prevents more than 3
// hard levels in a row, so players get easier breaks between tough stretches:
//   2 medium, 1 easy, 2 medium, 3 hard, 1 easy, 2 medium, 3 hard, 1 easy,
//   2 medium, 3 hard   -> repeats every 20 levels.
const CYCLE: Difficulty[] = [
  'medium', 'medium', 'easy',
  'medium', 'medium', 'hard', 'hard', 'hard',
  'easy', 'medium', 'medium', 'hard', 'hard', 'hard',
  'easy', 'medium', 'medium', 'hard', 'hard', 'hard',
];
export function difficultyFor(levelNum: number): Difficulty {
  if (levelNum <= 10) return 'easy';
  return CYCLE[(levelNum - 11) % CYCLE.length];
}

// Hard mode uses the same word rules as other levels — every real word that
// can be formed from the letters counts.
export function levelTargetWords(level: Level): string[] {
  return getFormableWords(level.letters);
}

function bonusFor(diff: Difficulty): number {
  return diff === 'easy' ? 15 : diff === 'medium' ? 25 : 40;
}

// A per-player seed rotates which seed words and letter arrangements each
// player sees, so no two players get the same level sequence. Stored on
// device; generated once on first launch.
const PLAYER_SEED_KEY = 'wordlink-player-seed';
function loadPlayerSeed(): number {
  try {
    const raw = localStorage.getItem(PLAYER_SEED_KEY);
    if (raw) {
      const n = Number(raw);
      if (Number.isFinite(n) && n > 0) return n;
    }
  } catch {
    // ignore
  }
  const seed = Math.floor(Math.random() * 1_000_000) + 1;
  try {
    localStorage.setItem(PLAYER_SEED_KEY, String(seed));
  } catch {
    // ignore
  }
  return seed;
}
export const PLAYER_SEED = loadPlayerSeed();

function pickSeed(id: number, _diff: Difficulty, playerSeed: number): string {
  const pool = SEED_POOL;
  // Combine the level id and player seed so each player gets a different
  // rotation through the pool, then step forward to avoid repeating nearby
  // levels.
  const start = (id * 7 + playerSeed * 13) % pool.length;
  return pool[start];
}

function makeLevel(id: number, playerSeed: number): Level {
  const diff = difficultyFor(id);
  const seed = pickSeed(id, diff, playerSeed);
  const letters = seededShuffle(seed.split(''), id * 31 + 7 + playerSeed);
  return {
    id,
    name: seed.charAt(0) + seed.slice(1).toLowerCase(),
    letters,
    masteryBonus: bonusFor(diff),
    difficulty: diff,
  };
}

export const LEVELS: Level[] = Array.from({ length: 2500 }, (_, i) =>
  makeLevel(i + 1, PLAYER_SEED),
);

export function getLevel(index: number): Level {
  return LEVELS[Math.max(0, Math.min(index, LEVELS.length - 1))];
}

export const TOTAL_LEVELS = LEVELS.length;
