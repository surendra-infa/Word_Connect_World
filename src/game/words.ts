// Comprehensive English word list sourced from `an-array-of-english-words`
// (~275k entries). We filter to words of 3–7 letters for this game, since
// puzzles use 6-7 letter seeds and accept shorter formable words.
import raw from 'an-array-of-english-words';

const ALL: string[] = raw as unknown as string[];

const WORD_LIST = ALL
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
  return out.sort();
}

export const WORD_COUNT = WORD_LIST.length;
export { LETTER_FREQ };
