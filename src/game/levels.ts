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

function bonusFor(diff: Difficulty): number {
  return diff === 'easy' ? 15 : diff === 'medium' ? 25 : 40;
}

// Levels 1–10 are easy so new players learn the mechanics.
function pickSeed(id: number, diff: Difficulty): string {
  const pool = SEED_POOL;
  const start = (id * 7 + 13) % pool.length;
  return pool[start];
}

function makeLevel(id: number): Level {
  const diff = difficultyFor(id);
  const seed = pickSeed(id, diff);
  const letters = seededShuffle(seed.split(''), id * 31 + 7);
  return {
    id,
    name: seed.charAt(0) + seed.slice(1).toLowerCase(),
    letters,
    masteryBonus: bonusFor(diff),
    difficulty: diff,
  };
}

export const LEVELS: Level[] = Array.from({ length: 2500 }, (_, i) => makeLevel(i + 1));

export function getLevel(index: number): Level {
  return LEVELS[Math.max(0, Math.min(index, LEVELS.length - 1))];
}

export const TOTAL_LEVELS = LEVELS.length;
