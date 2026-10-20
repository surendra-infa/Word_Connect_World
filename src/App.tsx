import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, RotateCcw, Trash2 } from 'lucide-react';
import TopBar from '@/components/TopBar';
import WordSlot from '@/components/WordSlot';
import LetterCircle from '@/components/LetterCircle';
import FoundGrid from '@/components/FoundGrid';
import FlyingWord from '@/components/FlyingWord';
import LevelCompleteModal from '@/components/LevelCompleteModal';
import HintBar from '@/components/HintBar';
import AnimatedBackground from '@/components/AnimatedBackground';
import ProgressBar from '@/components/ProgressBar';
import { LEVELS, TOTAL_LEVELS, levelTargetWords, type Level } from '@/game/levels';
import { shuffle } from '@/game/puzzle';
import { themeForLevel, type Theme } from '@/game/themes';

const STORAGE_KEY = 'wordlink-progress-v1';
const HINT_COST = 20;
const AD_ALERT_MS = 2200;
const AUTO_HINT_SECONDS = 30;
const AUTO_HINT_TICK_MS = 1000;

// Level progress is percent-based: each discovered word contributes by length.
export function wordProgressPercent(len: number): number {
  if (len <= 3) return 15;
  if (len === 4) return 20;
  return 25; // 5 and 6 letter words
}

// Progress rounds up to 100 once it reaches 95, so the last few stray
// points never block advancing to the next level.
const COMPLETE_THRESHOLD = 95;

function wordsProgressPercent(words: string[]): number {
  const sum = words.reduce((sum, w) => sum + wordProgressPercent(w.length), 0);
  return sum >= COMPLETE_THRESHOLD ? 100 : sum;
}

type Saved = {
  levelIndex: number;
  score: number;
  coins: number;
  foundByLevel: Record<number, string[]>;
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
        return parsed;
      }
    }
  } catch {
    // ignore corrupt storage
  }
  return { levelIndex: 0, score: 0, coins: 50, foundByLevel: {} };
}

export default function App() {
  const saved = useRef<Saved>(loadProgress());

  const [levelIndex, setLevelIndex] = useState(saved.current.levelIndex);
  const [score, setScore] = useState(saved.current.score);
  const [coins, setCoins] = useState(saved.current.coins);
  const [foundByLevel, setFoundByLevel] = useState<Record<number, string[]>>(
    saved.current.foundByLevel,
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

  // Hint state: a word being hinted at + which letter positions are revealed.
  const [hint, setHint] = useState<{ word: string; revealed: number[] } | null>(null);
  const [adAlert, setAdAlert] = useState(false);
  // Hints used this level (manual + auto) — drives the star rating.
  const [hintsUsed, setHintsUsed] = useState(0);

  // Auto-hint: counts down while idle; reaching 0 reveals a free letter.
  const [autoCountdown, setAutoCountdown] = useState<number | null>(null);

  const level: Level = LEVELS[Math.min(levelIndex, TOTAL_LEVELS - 1)];
  const targetWords = useMemo(() => levelTargetWords(level), [level]);
  const targetSet = useMemo(() => new Set(targetWords), [targetWords]);
  const theme: Theme = useMemo(() => themeForLevel(level.id), [level.id]);

  const found = foundByLevel[level.id] ?? [];
  const foundCount = found.length;
  const levelProgress = Math.min(100, wordsProgressPercent(found));
  const isFinal = levelIndex >= TOTAL_LEVELS - 1;
  const stars = hintsUsed === 0 ? 3 : hintsUsed === 1 ? 2 : 1;

  // Persist progress
  useEffect(() => {
    const data: Saved = { levelIndex, score, coins, foundByLevel };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore quota errors
    }
  }, [levelIndex, score, coins, foundByLevel]);

  // Initialize / re-initialize letters when level changes
  useEffect(() => {
    setLetters(shuffle(level.letters));
    setPicked([]);
    setUsed(level.letters.map(() => false));
    setStatus('idle');
    setMessage('');
    setLevelScoreStart(score);
    setLevelCoins(0);
    setShowComplete(false);
    setHint(null);
    setHintsUsed(0);
    setAutoCountdown(AUTO_HINT_SECONDS);
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

  // Reveals an entire unfound word — shared by manual + auto hint.
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
    setAutoCountdown(AUTO_HINT_SECONDS);
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
    const earned =
      (word.length <= 3 ? 20 : word.length === 4 ? 25 : 30) +
      (word.length === level.letters.length ? 50 : 0);
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

    // Level completes when weighted progress reaches 100% (95% rounds up).
    if (wordsProgressPercent(newFound) >= 100 && !showComplete) {
      const bonus = level.masteryBonus;
      setCoins((c) => c + bonus);
      setLevelCoins((c) => c + bonus);
      window.setTimeout(() => {
        setShowComplete(true);
        setAutoCountdown(null);
      }, 800);
    }
  }

  function nextLevel() {
    if (isFinal) {
      // restart from level 1, keep coins
      setLevelIndex(0);
      setFoundByLevel({});
      setScore(0);
    } else {
      setLevelIndex((i) => Math.min(i + 1, TOTAL_LEVELS - 1));
    }
  }

  function useHint() {
    if (showComplete) return;

    if (coins < HINT_COST) {
      setAdAlert(true);
      window.setTimeout(() => setAdAlert(false), AD_ALERT_MS);
      return;
    }

    setHint((prev) => revealHintWord(found, prev));
    setCoins((c) => Math.max(0, c - HINT_COST));
    setHintsUsed((n) => n + 1);
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
          // Fire a free auto-hint this tick (no coins, no star penalty).
          setHint((prev) => revealHintWord(found, prev));
          return AUTO_HINT_SECONDS;
        }
        return c - 1;
      });
    }, AUTO_HINT_TICK_MS);

    return () => window.clearInterval(id);
  }, [showComplete, status, autoCountdown === null, found, revealHintWord]);

  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden font-sans text-white">
      <AnimatedBackground theme={theme} />

      {flyingWord && <FlyingWord word={flyingWord} onDone={() => setFlyingWord(null)} />}

      {showComplete && (
        <LevelCompleteModal
          levelNumber={level.id}
          totalLevels={TOTAL_LEVELS}
          foundCount={foundCount}
          totalWords={targetWords.length}
          score={score - levelScoreStart}
          coinsEarned={levelCoins}
          isFinal={isFinal}
          stars={stars}
          onNext={nextLevel}
        />
      )}

      {adAlert && <AdAlert theme={theme} />}

      <div className="relative z-10 mx-auto flex h-[100dvh] w-full max-w-md flex-col">
        <TopBar
          score={score}
          coins={coins}
          level={level.id}
          onShuffle={doShuffle}
          theme={theme}
        />

        <main className="flex min-h-0 flex-1 flex-col px-4">
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
            total={targetWords.length}
            theme={theme}
            lastFound={lastFound}
          />
        </main>

        <HintBar
          coins={coins}
          hintCost={HINT_COST}
          hint={hint}
          onUseHint={useHint}
          theme={theme}
          autoHintCountdown={autoCountdown}
        />
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
