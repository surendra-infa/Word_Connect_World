export type Puzzle = {
  letters: string[];
  validWords: string[];
};

const PUZZLES: Puzzle[] = [
  {
    letters: ['C', 'A', 'S', 'T', 'L', 'E'],
    validWords: [
      'ACE', 'ACT', 'ALE', 'ALT', 'ATE', 'CAT', 'CEL', 'EAT', 'LAC', 'LEA',
      'LET', 'SAC', 'SAT', 'SEA', 'SET', 'TEC', 'TEA', 'TEL',
      'CAST', 'CASE', 'CELT', 'EAST', 'EATS', 'LACE', 'LASE', 'LATE', 'SALE',
      'SALT', 'SEAT', 'SLAT', 'TAEL', 'TALE', 'TEAL', 'TEAS', 'LATS', 'ALES',
      'ALTS', 'CELS', 'LETS',
      'SCALE', 'SLATE', 'STALE', 'STEAL', 'TALES', 'LEAST',
      'CASTLE',
    ],
  },
  {
    letters: ['P', 'L', 'A', 'N', 'E', 'T'],
    validWords: [
      'APE', 'APT', 'ATE', 'EAT', 'LAP', 'LET', 'NAP', 'NET', 'PAL', 'PAN',
      'PAT', 'PEA', 'PEN', 'PET', 'TAP', 'TEA', 'TEN',
      'ANTE', 'NEAP', 'PANE', 'PANT', 'PEAT', 'PLAN', 'PLAT', 'TANE', 'TAPE',
      'TEAL', 'LANE', 'LEAN', 'LEAP', 'LENT', 'NEAT', 'PALE', 'PEAL', 'TALC',
      'PLATE', 'PLANE', 'PLANT', 'LEAPT', 'PETAL', 'TEPAL', 'PLEAT', 'PLENA',
      'PLANET',
    ],
  },
  {
    letters: ['G', 'A', 'R', 'D', 'E', 'N'],
    validWords: [
      'AGE', 'ARE', 'DAG', 'DAN', 'EAR', 'ERA', 'GAD', 'GAR', 'GEL', 'NAG',
      'RAD', 'RAG', 'RED', 'AND', 'ANE', 'DAR', 'DEN', 'EAR', 'EGG',
      'DARE', 'DEAR', 'DARN', 'DRAG', 'EARL', 'GAGE', 'GEAR', 'GRAD', 'NARD',
      'NEAR', 'NERD', 'RAGE', 'RAGA', 'RAND', 'RANG', 'READ', 'DEAN', 'AGED',
      'DANE', 'GRED',
      'ANGRY', 'GRADE', 'GRAND', 'RANGE', 'GADER',
      'GARDEN', 'GANDER', 'GRENDA',
    ],
  },
];

export function getPuzzle(index: number): Puzzle {
  return PUZZLES[index % PUZZLES.length];
}

export function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
