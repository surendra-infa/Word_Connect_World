import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, RotateCcw, Shuffle, Trash2 } from 'lucide-react';
import TopBar from '@/components/TopBar';
import WordSlot from '@/components/WordSlot';
import LetterCircle from '@/components/LetterCircle';
import FoundGrid from '@/components/FoundGrid';
import FlyingWord from '@/components/FlyingWord';
import LevelCompleteModal from '@/components/LevelCompleteModal';
import StarConversionModal from '@/components/StarConversionModal';
import HintBar from '@/components/HintBar';
import AnimatedBackground from '@/components/AnimatedBackground';
import ProgressBar from '@/components/ProgressBar';
import { LEVELS, TOTAL_LEVELS, levelTargetWords, wordPoints, hintWordPoints, type Level } from '@/game/levels';
import { shuffle } from '@/game/puzzle';
import { themeForLevel, type Theme } from '@/game/themes';

const STORAGE_KEY = 'wordlink-progress-v1';
// Paid hints escalate in price within a level: 25, 50, 75, 100, ...
const HINT_BASE_COST = 25;
const AD_ALERT_MS = 2200;
// Free auto-hint: first letter after 30s idle, then one letter per minute.
const AUTO_HINT_FIRST_SECONDS = 30;
const AUTO_HINT_NEXT_SECONDS = 60;
const AUTO_HINT_TICK_MS = 1000;

// Levels complete at 100 points, where each found word adds points by its
// length (3-letter = 20, 4-letter = 25, 5+ = 30). All formable words stay
// valid after completion.

type Saved = {
  levelIndex: number;
  score: number;
  coins: number;
  foundByLevel: Record<number, string[]>;
  hintedByLevel: Record<number, string[]>;
};

function loadProgress(): Saved {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Saved;
      if (
        typeof parsed.levelIndex === 'number' &&
        typeof parsed.score === 'number' &&
        typeof parsed.coins === 'number' &&
        parsed.foundByLevel
      ) {
        return { ...parsed, hintedByLevel: parsed.hintedByLevel ?? {} };
      }
    }
  } catch {
    // ignore corrupt storage
  }
  return { levelIndex: 0, score: 0, coins: 50, foundByLevel: {}, hintedByLevel: {} };
}

export default function App() {
  const saved = useRef<Saved>(loadProgress());

  const [levelIndex, setLevelIndex] = useState(saved.current.levelIndex);
  const [score, setScore] = useState(saved.current.score);
  const [coins, setCoins] = useState(saved.current.coins);
  const [foundByLevel, setFoundByLevel] = useState<Record<number, string[]>>(
    saved.current.foundByLevel,
  );
  // Words found that were revealed by a hint — they earn half points.
  const [hintedByLevel, setHintedByLevel] = useState<Record<number, string[]>>(
    saved.current.hintedByLevel,
  );

  const [letters, setLetters] = useState<string[]>([]);
  const [picked, setPicked] = useState<number[]>([]);
  const [used, setUsed] = useState<boolean[]>([]);
  const [status, setStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [message, setMessage] = useState<string>('');
  const [flyingWord, setFlyingWord] = useState<string | null>(null);
  const [lastFound, setLastFound] = useState<string | null>(null);
  const [showComplete, setShowComplete] = useState(false);
  const [levelCoins, setLevelCoins] = useState(0);
  const [levelScoreStart, setLevelScoreStart] = useState(0);
  const [streakBonus, setStreakBonus] = useState(0);
  // Star-to-coin conversion and ad-doubling are one-time offers per level.
  const [coinsDoubled, setCoinsDoubled] = useState(false);
  const [showStarConversion, setShowStarConversion] = useState(false);

  // Hint state: a word being hinted at + which letter positions are revealed.
  const [hint, setHint] = useState<{ word: string; revealed: number[] } | null>(null);
  const [adAlert, setAdAlert] = useState(false);
  // Letters revealed by hints this level (auto + paid) — drives the star rating:
  // each revealed letter costs one star; 3+ letters loses all stars.
  const [lettersRevealed, setLettersRevealed] = useState(0);
  // Number of paid hints used this level — drives the escalating hint price.
  const [paidHints, setPaidHints] = useState(0);
  const hintCost = HINT_BASE_COST * (paidHints + 1);

  // Auto-hint: counts down while idle; reaching 0 reveals a free letter.
  const [autoCountdown, setAutoCountdown] = useState<number | null>(null);

  const level: Level = LEVELS[Math.min(levelIndex, TOTAL_LEVELS - 1)];
  const targetWords = useMemo(() => levelTargetWords(level), [level]);
  const targetSet = useMemo(() => new Set(targetWords), [targetWords]);
  const theme: Theme = useMemo(() => themeForLevel(level.id), [level.id]);

  const found = foundByLevel[level.id] ?? [];
  const hintedWords = hintedByLevel[level.id] ?? [];
  const foundCount = found.length;
  // Levels fill to 100% by word length: 3-letter = 20, 4-letter = 25, 5+ = 30;
  // hint-revealed words count half.
  const levelPoints = found.reduce(
    (sum, w) => sum + (hintedWords.includes(w) ? hintWordPoints(w) : wordPoints(w)),
    0,
  );
  const levelProgress = Math.min(100, levelPoints);
  const isFinal = levelIndex >= TOTAL_LEVELS - 1;
  const stars = Math.max(0, 3 - lettersRevealed);

  // Persist progress
  useEffect(() => {
    const data: Saved = { levelIndex, score, coins, foundByLevel, hintedByLevel };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore quota errors
    }
  }, [levelIndex, score, coins, foundByLevel, hintedByLevel]);

  // Initialize / re-initialize letters when level changes
  useEffect(() => {
    setLetters(shuffle(level.letters));
    setPicked([]);
    setUsed(level.letters.map(() => false));
    setStatus('idle');
    setMessage('');
    setLevelScoreStart(score);
    setLevelCoins(0);
    setStreakBonus(0);
    setCoinsDoubled(false);
    setShowComplete(false);
    setHint(null);
    setLettersRevealed(0);
    setPaidHints(0);
    setAutoCountdown(AUTO_HINT_FIRST_SECONDS);
    // score is intentionally read at level-entry only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level.id]);

  // Clear hint once the hinted word has been found
  useEffect(() => {
    if (hint && found.includes(hint.word)) {
      setHint(null);
    }
  }, [found, hint]);

  const currentWord = picked.map((i) => letters[i]);

  function flashMessage(msg: string, ms = 1100) {
    setMessage(msg);
    window.setTimeout(() => setMessage(''), ms);
  }

  const ENCOURAGEMENT = ['💪 Almost!', '🤔 So close!', '✨ Try again!', '🌱 Keep going!', '🧠 Think...'];

  function flashEncouragement() {
    const msg = ENCOURAGEMENT[Math.floor(Math.random() * ENCOURAGEMENT.length)];
    setMessage(msg);
    window.setTimeout(() => setMessage(''), 1200);
  }

  // Reveals the next single letter of an unfound word — used by the free
  // auto-hint. Keeps revealing the same word letter by letter; starts a new
  // word (with its first letter) once the current one is fully shown.
  const revealHintLetter = useCallback(
    (foundSnapshot: string[], prev: { word: string; revealed: number[] } | null) => {
      const foundSet = new Set(foundSnapshot);
      const remaining = targetWords.filter((w) => !foundSet.has(w));
      if (remaining.length === 0) return null;

      if (prev && !foundSet.has(prev.word) && prev.revealed.length < prev.word.length) {
        return { word: prev.word, revealed: [...prev.revealed, prev.revealed.length] };
      }
      const word = remaining[Math.floor(Math.random() * remaining.length)];
      return { word, revealed: [0] };
    },
    [targetWords],
  );

  // Reveals an entire unfound word — used by the paid hint.
  const revealHintWord = useCallback(
    (foundSnapshot: string[], prev: { word: string; revealed: number[] } | null) => {
      const foundSet = new Set(foundSnapshot);
      const remaining = targetWords.filter((w) => !foundSet.has(w));
      if (remaining.length === 0) return null;

      // Prefer revealing a word the auto-hint already started showing.
      let word = prev?.word;
      if (!word || foundSet.has(word) || prev!.revealed.length === word!.length) {
        word = remaining[Math.floor(Math.random() * remaining.length)];
      }
      return { word, revealed: word.split('').map((_, i) => i) };
    },
    [targetWords],
  );

  function resetAutoHintTimer() {
    setAutoCountdown(hint ? AUTO_HINT_NEXT_SECONDS : AUTO_HINT_FIRST_SECONDS);
  }

  function pickLetter(index: number) {
    if (used[index] || status !== 'idle' || showComplete) return;
    setUsed((u) => u.map((v, i) => (i === index ? true : v)));
    setPicked((p) => [...p, index]);
    resetAutoHintTimer();
  }

  // Called by LetterCircle when a swipe ends: undo back to `index` if the
  // finger retraced onto an earlier letter, otherwise just stop.
  function swipeEnd() {
    // Word is submitted automatically if long enough; otherwise clear it.
    if (picked.length >= 3) {
      submit();
    } else if (picked.length > 0) {
      clearWord();
    }
  }

  function removeLast() {
    if (picked.length === 0) return;
    const last = picked[picked.length - 1];
    setUsed((u) => u.map((v, i) => (i === last ? false : v)));
    setPicked((p) => p.slice(0, -1));
    setStatus('idle');
    setMessage('');
    resetAutoHintTimer();
  }

  function clearWord() {
    setUsed(letters.map(() => false));
    setPicked([]);
    setStatus('idle');
    setMessage('');
  }

  function doShuffle() {
    if (picked.length > 0) clearWord();
    setLetters((l) => shuffle(l));
    setUsed(letters.map(() => false));
    resetAutoHintTimer();
  }

  function submit() {
    if (picked.length < 3) {
      setStatus('invalid');
      flashMessage('At least 3 letters 🙃');
      window.setTimeout(() => setStatus('idle'), 600);
      resetAutoHintTimer();
      return;
    }
    const word = currentWord.join('');
    if (!targetSet.has(word)) {
      setStatus('invalid');
      flashEncouragement();
      window.setTimeout(() => setStatus('idle'), 700);
      resetAutoHintTimer();
      return;
    }
    if (found.includes(word)) {
      setStatus('invalid');
      flashMessage('Already found 😊');
      window.setTimeout(() => setStatus('idle'), 700);
      resetAutoHintTimer();
      return;
    }

    const newFound = [...found, word];
    // A word currently being revealed by a hint earns half points, toward
    // both score and the 100-point completion goal.
    const isHinted = hint?.word === word;
    if (isHinted) {
      setHintedByLevel((m) => {
        const list = m[level.id] ?? [];
        return list.includes(word) ? m : { ...m, [level.id]: [...list, word] };
      });
    }
    const wordPts = isHinted ? hintWordPoints(word) : wordPoints(word);
    const earned =
      wordPts + (!isHinted && word.length === level.letters.length ? 50 : 0);
    const coinEarned = word.length;
    setScore((s) => s + earned);
    setCoins((c) => c + coinEarned);
    setLevelCoins((c) => c + coinEarned);
    setFoundByLevel((m) => ({
      ...m,
      [level.id]: newFound,
    }));
    setStatus('valid');
    setFlyingWord(word);
    setLastFound(word);
    resetAutoHintTimer();
    window.setTimeout(() => clearWord(), 650);

    // Level completes as soon as the points from every word found so far
    // (including the one just submitted) reach 100. Computed from newFound so
    // the just-submitted word counts — checking the previous render's total
    // made levels finish one word late.
    const hintedSet = new Set([...hintedWords, ...(isHinted ? [word] : [])]);
    const newPoints = newFound.reduce(
      (sum, w) => sum + (hintedSet.has(w) ? hintWordPoints(w) : wordPoints(w)),
      0,
    );
    if (newPoints >= 100 && !showComplete) {
      const bonus = level.masteryBonus;
      setCoins((c) => c + bonus);
      setLevelCoins((c) => c + bonus);
      // Hard-mode streak: finish a hard level with zero revealed letters
      // for an extra coin reward.
      const streak = level.difficulty === 'hard' && lettersRevealed === 0 ? 50 : 0;
      if (streak > 0) {
        setCoins((c) => c + streak);
        setLevelCoins((c) => c + streak);
      }
      setStreakBonus(streak);
      window.setTimeout(() => {
        setShowComplete(true);
        setAutoCountdown(null);
      }, 800);
    }
  }

  function doubleCoins() {
    if (coinsDoubled) return;
    setCoins((c) => c + levelCoins);
    setLevelCoins((c) => c * 2);
    setCoinsDoubled(true);
  }

  function convertStars(amount: number) {
    if (amount <= 0 || amount > score) return;
    const coinsEarned = Math.floor(amount / 10);
    if (coinsEarned <= 0) return;
    setScore((s) => Math.max(0, s - amount));
    setCoins((c) => c + coinsEarned);
  }

  function nextLevel() {
    if (isFinal) {
      // restart from level 1, keep coins
      setLevelIndex(0);
      setFoundByLevel({});
      setHintedByLevel({});
      setScore(0);
    } else {
      setLevelIndex((i) => Math.min(i + 1, TOTAL_LEVELS - 1));
    }
  }

  function useHint() {
    if (showComplete) return;

    if (coins < hintCost) {
      setAdAlert(true);
      window.setTimeout(() => setAdAlert(false), AD_ALERT_MS);
      return;
    }

    const newHint = revealHintWord(found, hint);
    setHint(newHint);
    if (newHint) {
      const already = hint && hint.word === newHint.word ? hint.revealed.length : 0;
      setLettersRevealed((n) => n + newHint.word.length - already);
    }
    setCoins((c) => Math.max(0, c - hintCost));
    setPaidHints((n) => n + 1);
    resetAutoHintTimer();
  }

  // Auto-hint countdown: ticks every second while the player is idle on a
  // non-completed level. Resets on any interaction; fires a free hint at 0.
  useEffect(() => {
    if (showComplete || status === 'valid' || autoCountdown === null) return;

    const id = window.setInterval(() => {
      setAutoCountdown((c) => {
        if (c === null) return null;
        if (c <= 1) {
          // Fire a free auto-hint this tick: reveals one letter (no coins),
          // but each revealed letter costs one star.
          setHint((prev) => revealHintLetter(found, prev));
          setLettersRevealed((n) => n + 1);
          return AUTO_HINT_NEXT_SECONDS;
        }
        return c - 1;
      });
    }, AUTO_HINT_TICK_MS);

    return () => window.clearInterval(id);
  }, [showComplete, status, autoCountdown === null, found, revealHintLetter]);

  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden font-sans text-white">
      <AnimatedBackground theme={theme} />

      {flyingWord && <FlyingWord word={flyingWord} onDone={() => setFlyingWord(null)} />}

      {showComplete && (
        <LevelCompleteModal
          levelNumber={level.id}
          totalLevels={TOTAL_LEVELS}
          foundCount={foundCount}
          score={score - levelScoreStart}
          coinsEarned={levelCoins}
          isFinal={isFinal}
          stars={stars}
          streakBonus={streakBonus}
          coinsDoubled={coinsDoubled}
          onDoubleCoins={doubleCoins}
          nextDifficulty={
            isFinal ? null : LEVELS[Math.min(levelIndex + 1, TOTAL_LEVELS - 1)].difficulty
          }
          onNext={nextLevel}
        />
      )}

      {showStarConversion && (
        <StarConversionModal
          stars={score}
          theme={theme}
          onClose={() => setShowStarConversion(false)}
          onConvert={convertStars}
        />
      )}

      {adAlert && <AdAlert theme={theme} />}

      <div className="relative z-10 mx-auto flex h-[100dvh] w-full max-w-md flex-col">
        <TopBar
          score={score}
          coins={coins}
          level={level.id}
          difficulty={level.difficulty}
          theme={theme}
          onOpenStarConversion={() => setShowStarConversion(true)}
        />

        <main className="flex min-h-0 flex-1 flex-col px-4 pb-2">
          <div className="relative z-20 shrink-0">
            <WordSlot word={currentWord} status={status} message={message} theme={theme} />
          </div>

          <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center py-2">
            <LetterCircle
              letters={letters}
              used={used}
              onPick={pickLetter}
              onUndo={removeLast}
              onSwipeEnd={swipeEnd}
              theme={theme}
            />
          </div>

          <div className="relative z-20 mt-2 flex shrink-0 items-center justify-center gap-3">
            <button
              onClick={doShuffle}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white/80 ring-1 ring-white/15 transition hover:bg-white/15 active:scale-90"
              aria-label="Shuffle letters"
            >
              <Shuffle className="h-5 w-5" />
            </button>
            <button
              onClick={clearWord}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white/80 ring-1 ring-white/15 transition hover:bg-white/15 active:scale-90"
              aria-label="Clear"
            >
              <Trash2 className="h-5 w-5" />
            </button>
            <button
              onClick={removeLast}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white/80 ring-1 ring-white/15 transition hover:bg-white/15 active:scale-90"
              aria-label="Undo last letter"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
            <HintBar
              coins={coins}
              hintCost={hintCost}
              hint={hint}
              onUseHint={useHint}
              theme={theme}
              autoHintCountdown={autoCountdown}
            />
            <button
              onClick={submit}
              disabled={picked.length === 0 || status === 'valid'}
              className="flex h-14 w-14 items-center justify-center rounded-full shadow-lg ring-1 transition hover:brightness-105 active:scale-95 disabled:opacity-40"
              style={{
                backgroundImage: `linear-gradient(to bottom, ${theme.accent}, ${theme.accentStrong})`,
                color: theme.accentInk,
                boxShadow: `0 8px 20px -6px ${theme.accentStrong}55`,
                ['--tw-ring-color' as string]: `${theme.accentSoft}99`,
              }}
              aria-label="Submit word"
            >
              <Check className="h-6 w-6" strokeWidth={3} />
            </button>
          </div>

          <div className="mt-2 shrink-0">
            <ProgressBar
              progress={levelProgress}
              foundCount={foundCount}
              theme={theme}
              stars={stars}
            />
          </div>

          <FoundGrid
            words={found}
            hinted={hintedWords}
            theme={theme}
            lastFound={lastFound}
          />
        </main>
      </div>
    </div>
  );
}

function AdAlert({ theme }: { theme: Theme }) {
  return (
    <div className="fixed inset-x-0 top-20 z-50 flex justify-center px-4">
      <div
        className="animate-pop flex items-center gap-2.5 rounded-2xl px-5 py-3 shadow-2xl ring-1"
        style={{
          backgroundImage: `linear-gradient(to bottom, ${theme.accent}, ${theme.accentStrong})`,
          color: theme.accentInk,
          boxShadow: `0 12px 30px -8px ${theme.accentStrong}66`,
          ['--tw-ring-color' as string]: `${theme.accentSoft}b3`,
        }}
      >
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full text-base font-bold"
          style={{ backgroundColor: `${theme.accentInk}22` }}
        >
          !
        </span>
        <span className="text-sm font-bold">Watch ad for coins</span>
      </div>
    </div>
  );
}
