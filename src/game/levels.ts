import { getFormableWords } from './words';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type Level = {
  id: number;
  name: string;
  letters: string[];
  goal: number;
  masteryBonus: number;
  difficulty: Difficulty;
};

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
// generated levels sample from this pool so we can produce 2500 unique
// puzzles without hand-curating each one.
const SEED_POOL: string[] = [
  'GARDEN', 'CASTLE', 'PLANET', 'OCEANS', 'WINDOW', 'MASTER', 'SILVER',
  'GUITAR', 'POCKET', 'FOREST', 'BRIDGE', 'SUMMER', 'WINTER', 'SPRING',
  'AUTUMN', 'ROCKET', 'TEMPLE', 'BLOOMS', 'KITCHEN', 'MARKET', 'DRAGON',
  'KNIGHT', 'PIRATE', 'ISLAND', 'DESERT', 'JUNGLE', 'MANTLE', 'RIVERS',
  'VALLEY', 'MEADOW', 'HARBOR', 'TUNNEL', 'MARBLE', 'PRAIRIE', 'GLACIER',
  'VOLCANO', 'COMETS', 'FLOWER', 'NEPTUNE', 'SATURN', 'JUPITER', 'WEIGHT',
  'GOLDEN', 'STELLAR', 'CHAMPION', 'GALAXY', 'BASKET', 'CANDLE', 'DOCTOR',
  'ELEPHANT', 'FACTORY', 'GHOSTS', 'HEALTH', 'INKWELL', 'JOURNEY', 'KEYWORD',
  'LADDER', 'MONSTER', 'NUMBERS', 'ORCHARD', 'PENGUIN', 'QUARTZ', 'RHYTHM',
  'SANDWICH', 'TRAVEL', 'UMBRELLA', 'VOCAL', 'WIZARD', 'XYLOPHONE', 'YACHTS',
  'ZEBRAS', 'ANGELS', 'BUTTON', 'CRYSTAL', 'DOLPHIN', 'ENGINE', 'FEATHER',
  'GIRAFFE', 'HARMONY', 'IGLOOS', 'JELLYF', 'KINGDOM', 'LANTERN', 'MAGNETS',
  'NOODLE', 'OCTOPUS', 'PUZZLE', 'QUOKKA', 'RAINBOW', 'SHADOW', 'TORNADO',
  'UNICORN', 'VORTEX', 'WHALES', 'CIRCUS', 'PLANET', 'BUTTER', 'GARDEN',
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

function goalFor(diff: Difficulty, targetCount: number): number {
  // Words a player must find to complete the level. Easy: ~60% of available
  // words (can exceed 35 on word-rich seeds). Medium: 60%, never more than 35.
  // Hard: 40%, never more than 20 — and always fewer than half the available
  // words, so more words remain unfound than found at completion.
  if (diff === 'easy') return Math.min(targetCount, Math.max(5, Math.round(targetCount * 0.6)));
  if (diff === 'medium') {
    return Math.min(targetCount, 35, Math.max(8, Math.round(targetCount * 0.6)));
  }
  return Math.min(targetCount, 20, Math.max(4, Math.floor(targetCount * 0.4)));
}

function bonusFor(diff: Difficulty): number {
  return diff === 'easy' ? 15 : diff === 'medium' ? 25 : 40;
}

// Cap on total findable words per difficulty: easy is uncapped, medium never
// exceeds 35, hard stays lean (6-letter seeds, at most 40 findable words).
const MAX_WORDS: Record<Difficulty, number> = { easy: Infinity, medium: 35, hard: 40 };
const MIN_WORDS: Record<Difficulty, number> = { easy: 11, medium: 18, hard: 10 };

// Hard levels draw only from 6-letter seeds so fewer words can be formed,
// keeping the hidden-vocabulary-heavy feel the user asked for.
const SIX_LETTER_SEEDS = SEED_POOL.filter((s) => s.length === 6);

const countCache = new Map<string, number>();
function wordCountFor(letters: string[]): number {
  const key = [...letters].sort().join('');
  let n = countCache.get(key);
  if (n === undefined) {
    n = getFormableWords(letters).length;
    countCache.set(key, n);
  }
  return n;
}

function targetsFor(letters: string[]): string[] {
  return getFormableWords(letters);
}

// Picks a seed whose findable-word count fits the difficulty's band, scanning
// from a per-level offset for variety. Falls back to the leanest seed in the
// pool when nothing fits the band exactly.
function pickSeed(id: number, diff: Difficulty): string {
  const pool = diff === 'hard' ? SIX_LETTER_SEEDS : SEED_POOL;
  const min = MIN_WORDS[diff];
  const max = MAX_WORDS[diff];
  const start = (id * 7 + 13) % pool.length;
  for (let i = 0; i < pool.length; i++) {
    const seed = pool[(start + i) % pool.length];
    const count = wordCountFor(seed.split(''));
    if (count >= min && count <= max) return seed;
  }
  let best = pool[0];
  let bestCount = Infinity;
  for (const seed of pool) {
    const count = wordCountFor(seed.split(''));
    if (count < bestCount) {
      best = seed;
      bestCount = count;
    }
  }
  return best;
}

function makeLevel(id: number): Level {
  const diff = difficultyFor(id);
  const seed = pickSeed(id, diff);
  const letters = seededShuffle(seed.split(''), id * 31 + 7);
  const targets = targetsFor(letters);
  return {
    id,
    name: seed.charAt(0) + seed.slice(1).toLowerCase(),
    letters,
    goal: goalFor(diff, targets.length),
    masteryBonus: bonusFor(diff),
    difficulty: diff,
  };
}

export const LEVELS: Level[] = Array.from({ length: 2500 }, (_, i) => makeLevel(i + 1));

export function getLevel(index: number): Level {
  return LEVELS[Math.max(0, Math.min(index, LEVELS.length - 1))];
}

export const TOTAL_LEVELS = LEVELS.length;
