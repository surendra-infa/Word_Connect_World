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
// generated levels sample from this pool so we can produce 1000 unique
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

// Levels 1–10 are easy so new players learn the mechanics. After that the
// game alternates in 5-level blocks: 5 medium, 5 hard, 5 medium, ...
export function difficultyFor(levelNum: number): Difficulty {
  if (levelNum <= 10) return 'easy';
  return Math.floor((levelNum - 11) / 5) % 2 === 0 ? 'medium' : 'hard';
}

// Hard mode uses the same word rules as other levels — every real word that
// can be formed from the letters counts.
export function levelTargetWords(level: Level): string[] {
  return getFormableWords(level.letters);
}

function goalFor(diff: Difficulty, targetCount: number): number {
  // Easy: ~60% of available words (any count). Medium: at most 35.
  // Hard: at most 25 (of only 4+ letter words).
  if (diff === 'easy') return Math.max(5, Math.round(targetCount * 0.6));
  if (diff === 'medium') return Math.min(35, Math.max(8, targetCount));
  return Math.min(25, Math.max(10, targetCount));
}

function bonusFor(diff: Difficulty): number {
  return diff === 'easy' ? 15 : diff === 'medium' ? 25 : 40;
}

const MIN_WORDS: Record<Difficulty, number> = { easy: 11, medium: 18, hard: 15 };

function targetsFor(letters: string[]): string[] {
  return getFormableWords(letters);
}

function makeLevel(id: number): Level {
  const diff = difficultyFor(id);
  const seed = SEED_POOL[(id * 7 + 13) % SEED_POOL.length];
  let letters = seededShuffle(seed.split(''), id * 31 + 7);
  let targets = targetsFor(letters);
  // If a seed produces too few valid words for this difficulty, fall back to
  // a known-rich seed.
  if (targets.length < MIN_WORDS[diff]) {
    letters = seededShuffle('GARDEN'.split(''), id * 31 + 7);
    targets = targetsFor(letters);
  }
  return {
    id,
    name: seed.charAt(0) + seed.slice(1).toLowerCase(),
    letters,
    goal: goalFor(diff, targets.length),
    masteryBonus: bonusFor(diff),
    difficulty: diff,
  };
}

export const LEVELS: Level[] = Array.from({ length: 1000 }, (_, i) => makeLevel(i + 1));

export function getLevel(index: number): Level {
  return LEVELS[Math.max(0, Math.min(index, LEVELS.length - 1))];
}

export const TOTAL_LEVELS = LEVELS.length;
