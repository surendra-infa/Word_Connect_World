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

// Difficulty per the spec: levels 1–10 easy, then repeating 15-level blocks
// of 5 easy → 5 medium → 5 hard up to 1000.
function difficultyFor(levelNum: number): Difficulty {
  if (levelNum <= 10) return 'easy';
  const idx = (levelNum - 11) % 15;
  if (idx < 5) return 'easy';
  if (idx < 10) return 'medium';
  return 'hard';
}

function goalFor(diff: Difficulty, formableCount: number): number {
  // Easy: reach ~60% of formable words (min 5). Medium: 75%. Hard: 100%.
  if (diff === 'easy') return Math.max(5, Math.round(formableCount * 0.6));
  if (diff === 'medium') return Math.max(7, Math.round(formableCount * 0.78));
  return Math.max(8, formableCount);
}

function bonusFor(diff: Difficulty): number {
  return diff === 'easy' ? 15 : diff === 'medium' ? 25 : 40;
}

function makeLevel(id: number): Level {
  const diff = difficultyFor(id);
  const seed = SEED_POOL[(id * 7 + 13) % SEED_POOL.length];
  const letters = seededShuffle(seed.split(''), id * 31 + 7);
  const formable = getFormableWords(letters);
  // Ensure the level has a rich set of formable words; if a seed produces
  // too few, fall back to a known-rich seed.
  let finalLetters = letters;
  let formableCount = formable.length;
  if (formableCount < 11) {
    const fallback = 'GARDEN';
    finalLetters = seededShuffle(fallback.split(''), id * 31 + 7);
    formableCount = getFormableWords(finalLetters).length;
  }
  const goal = goalFor(diff, formableCount);
  return {
    id,
    name: seed.charAt(0) + seed.slice(1).toLowerCase(),
    letters: finalLetters,
    goal,
    masteryBonus: bonusFor(diff),
    difficulty: diff,
  };
}

export const LEVELS: Level[] = Array.from({ length: 1000 }, (_, i) => makeLevel(i + 1));

export function getLevel(index: number): Level {
  return LEVELS[Math.max(0, Math.min(index, LEVELS.length - 1))];
}

export function levelTargetWords(level: Level): string[] {
  return getFormableWords(level.letters);
}

export const TOTAL_LEVELS = LEVELS.length;
