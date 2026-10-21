// Comprehensive English word list sourced from `an-array-of-english-words`
// (~275k entries). We filter to words of 3–7 letters for this game, since
// puzzles use 6-7 letter seeds and accept shorter formable words.
import raw from 'an-array-of-english-words';

const ALL: string[] = raw as unknown as string[];

// The bundled dictionary is broad but omits some everyday words. Keep a small
// supplemental list for common player expectations and ordinary inflections.
const COMMON_WORDS = [
  'A', 'I', 'AM', 'AN', 'AS', 'AT', 'BE', 'BY', 'DO', 'GO', 'HE', 'IF', 'IN',
  'IS', 'IT', 'ME', 'MY', 'NO', 'OF', 'OH', 'ON', 'OR', 'SO', 'TO', 'UP',
  'US', 'WE',
  'ABLE', 'ABOUT', 'ABOVE', 'AFTER', 'AGAIN', 'ALONG', 'ALSO', 'AMONG', 'AREA',
  'AROUND', 'AWAY', 'BACK', 'BEEN', 'BEFORE', 'BEING', 'BELOW', 'BETWEEN',
  'BOTH', 'BRING', 'BUILT', 'CALLS', 'CAME', 'COME', 'COULD', 'DOES', 'DONE',
  'DOWN', 'EACH', 'EVEN', 'EVER', 'EVERY', 'FIND', 'FIRST', 'FROM', 'GETS',
  'GIVE', 'GIVES', 'GOING', 'GOOD', 'GREAT', 'HAVE', 'HELP', 'HERE', 'HIGH',
  'HOME', 'JUST', 'KEEP', 'KIND', 'KNOW', 'LAST', 'LIFE', 'LIKE', 'LITTLE',
  'LOOK', 'MADE', 'MAKE', 'MANY', 'MORE', 'MOST', 'MUCH', 'MUST', 'NEED',
  'NEVER', 'NEXT', 'ONLY', 'OPEN', 'OTHER', 'OVER', 'PART', 'PLACE', 'PLAY',
  'POINT', 'PUTS', 'READ', 'REAL', 'RIGHT', 'SAID', 'SAME', 'SAYS', 'SEEM',
  'SHOW', 'SMALL', 'SOME', 'SOMETHING', 'SOON', 'STILL', 'SUCH', 'TAKE',
  'THAN', 'THAT', 'THEM', 'THEN', 'THERE', 'THESE', 'THEY', 'THING', 'THINK',
  'THIS', 'THOSE', 'THREE', 'TIME', 'TODAY', 'TOGETHER', 'TOO', 'TURN',
  'UNDER', 'UNTIL', 'VERY', 'WANT', 'WANTS', 'WELL', 'WENT', 'WHAT', 'WHEN',
  'WHERE', 'WHICH', 'WHILE', 'WHOLE', 'WILL', 'WITH', 'WORK', 'WORKS', 'WOULD',
  'YEAR', 'YOUR',
];

const WORD_LIST = [...new Set([...ALL, ...COMMON_WORDS])]
  .map((w) => w.trim().toUpperCase())
  .filter((w) => /^[A-Z]{3,7}$/.test(w))
  .sort();

const WORDS = new Set(WORD_LIST);

export { WORD_LIST, WORDS };

export function isValidWord(word: string): boolean {
  return WORDS.has(word.toUpperCase());
}

const LETTER_FREQ: Record<string, number> = {};
for (const w of WORD_LIST) {
  for (const ch of w) LETTER_FREQ[ch] = (LETTER_FREQ[ch] ?? 0) + 1;
}

export function getFormableWords(letters: string[]): string[] {
  // Levels share the same letter multiset (only shuffled), so cache by the
  // sorted letter key — otherwise startup re-scans the full word list once
  // per level and blocks the first paint for seconds.
  const key = [...letters].sort().join('');
  const cached = formableCache.get(key);
  if (cached) return cached;
  const pool: Record<string, number> = {};
  for (const ch of letters) {
    const k = ch.toUpperCase();
    pool[k] = (pool[k] ?? 0) + 1;
  }
  const out: string[] = [];
  for (const w of WORD_LIST) {
    const need: Record<string, number> = {};
    let ok = true;
    for (const ch of w) {
      need[ch] = (need[ch] ?? 0) + 1;
      if (need[ch] > (pool[ch] ?? 0)) {
        ok = false;
        break;
      }
    }
    if (ok) out.push(w);
  }
  out.sort();
  formableCache.set(key, out);
  return out;
}

const formableCache = new Map<string, string[]>();

export const WORD_COUNT = WORD_LIST.length;
export { LETTER_FREQ };
