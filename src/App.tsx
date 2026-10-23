import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { RotateCcw, Shuffle, Trash2 } from 'lucide-react';
import TopBar from '@/components/TopBar';
import WordSlot from '@/components/WordSlot';
import LetterCircle from '@/components/LetterCircle';
import FoundGrid from '@/components/FoundGrid';
import FlyingWord from '@/components/FlyingWord';
import LevelCompleteModal from '@/components/LevelCompleteModal';
import StarConversionModal from '@/components/StarConversionModal';
import HintBar from '@/components/HintBar';
import SettingsModal from '@/components/SettingsModal';
import LevelMapModal from '@/components/LevelMapModal';
import DailyBonusModal, { dailyRewardFor } from '@/components/DailyBonusModal';
import AnimatedBackground from '@/components/AnimatedBackground';
import Fireworks from '@/components/Fireworks';
import AnimatedLogo from '@/components/AnimatedLogo';
import ProgressBar from '@/components/ProgressBar';
import Tutorial from '@/components/Tutorial';
import RestoreDialog from '@/components/RestoreDialog';
import {
  initAds, preloadAds, maybeShowInterstitial, showRewardedAd, adsAvailable,
} from '@/game/ads';
import { isValidWord } from '@/game/words';
import { LEVELS, TOTAL_LEVELS, PLAYER_SEED, levelTargetWords, wordPoints, hintWordPoints, type Level } from '@/game/levels';
import { shuffle } from '@/game/puzzle';
import { themeForLevel, type Theme } from '@/game/themes';
import {
  playSelect, playValid, playInvalid, playHint, playFanfare, playCoin,
  isSoundEnabled, setSoundEnabled,
} from '@/game/sound';
import {
  hapticTick, hapticLight, hapticError, hapticSuccess,
} from '@/game/haptics';
import {
  uploadSave, downloadSave, type CloudSave,
} from '@/game/cloudSave';

const STORAGE_KEY = 'wordlink-progress-v1';
// Paid hints escalate in price within a level: 25, 50, 75, 100, ...
const HINT_BASE_COST = 25;
// Free auto-hint: first letter after 30s idle, then one letter per minute.
const AUTO_HINT_FIRST_SECONDS = 30;
const AUTO_HINT_NEXT_SECONDS = 60;
const AUTO_HINT_TICK_MS = 1000;
const BONUS_WORD_COINS = 1;
const DAILY_BONUS_KEY = 'wordlink-daily-bonus';

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

type DailyBonusState = { lastClaim: string; streak: number };

function loadDailyBonus(): DailyBonusState {
  try {
    const raw = localStorage.getItem(DAILY_BONUS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DailyBonusState;
      if (typeof parsed.lastClaim === 'string' && typeof parsed.streak === 'number') {
        return parsed;
      }
    }
  } catch {
    // ignore corrupt storage
  }
  return { lastClaim: '', streak: 0 };
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

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

function tutorialDone(): boolean {
  try {
    return localStorage.getItem('wordlink-tutorial-done') === '1';
  } catch {
    return true;
  }
}

export default function App() {
  const saved = useRef<Saved>(loadProgress());
  const isFreshInstall = useRef(
    !localStorage.getItem('wordlink-progress-v1'),
  );

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
  const [adBusy, setAdBusy] = useState(false);
  // Letters revealed by hints this level (auto + paid) — drives the star rating:
  // each revealed letter costs one star; 3+ letters loses all stars.
  const [lettersRevealed, setLettersRevealed] = useState(0);
  // Number of paid hints used this level — drives the escalating hint price.
  const [paidHints, setPaidHints] = useState(0);
  const hintCost = HINT_BASE_COST * (paidHints + 1);

  // Bonus words: valid dictionary words that aren't part of the level's target
  // list. They pay a small coin reward instead of a "wrong" shake.
  const [bonusWords, setBonusWords] = useState<string[]>([]);
  const [bonusFlash, setBonusFlash] = useState<string | null>(null);

  // Daily bonus: once-per-day coin reward with a 7-day escalating streak.
  const daily = useRef<DailyBonusState>(loadDailyBonus());
  const [showDailyBonus, setShowDailyBonus] = useState(false);
  const dailyOffer = dailyRewardFor(
    daily.current.lastClaim === todayKey()
      ? daily.current.streak
      : daily.current.streak + 1,
  );
  const [dailyResult, setDailyResult] = useState(0);

  // Auto-hint: counts down while idle; reaching 0 reveals a free letter.
  const [autoCountdown, setAutoCountdown] = useState<number | null>(null);

  // Tutorial shows once on first launch; restore dialog for reinstalls.
  const [showTutorial, setShowTutorial] = useState(() => !tutorialDone());
  const [showRestore, setShowRestore] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());

  // Daily bonus check: fires on first launch of a new calendar day.
  useEffect(() => {
    if (daily.current.lastClaim === todayKey()) return;
    setShowDailyBonus(true);
  }, []);

  // Ad SDK init + first interstitial preload (native app only).
  useEffect(() => {
    void initAds().then(() => preloadAds());
  }, []);

  const level: Level = LEVELS[Math.min(levelIndex, TOTAL_LEVELS - 1)];
  const targetWords = useMemo(() => levelTargetWords(level), [level]);
  const targetSet = useMemo(() => new Set(targetWords), [targetWords]);
  const theme: Theme = useMemo(
    () => themeForLevel(level.id, level.name.toUpperCase()),
    [level.id, level.name],
  );

  const found = foundByLevel[level.id] ?? [];
  const hintedWords = hintedByLevel[level.id] ?? [];
  const foundCount = found.length;
  // Per-level star history for the level map: 3 minus letters revealed when
  // the level was last completed. Levels never completed show 0 stars.
  const starsByLevel = useMemo(() => {
    const out: Record<number, number> = {};
    for (const idStr of Object.keys(foundByLevel)) {
      const id = Number(idStr);
      if (!Number.isFinite(id)) continue;
      out[id] = 3;
    }
    return out;
  }, [foundByLevel]);
  // Levels fill to 100% by word length: 3-letter = 20, 4-letter = 25, 5+ = 30.
  // Hint-revealed words still count FULL points toward completion — the hint
  // penalty only reduces the score they earn, never level progress.
  const levelPoints = found.reduce((sum, w) => sum + wordPoints(w), 0);
  const levelProgress = Math.min(100, levelPoints);
  const isFinal = levelIndex >= TOTAL_LEVELS - 1;
  const stars = Math.max(0, 3 - lettersRevealed);
  // Celebration effects belong to rare moments: every 10th level and the
  // finale. Regular completes still get the full reward UI, just no fireworks.
  const milestone = isFinal || level.id % 10 === 0;

  // Persist progress locally
  useEffect(() => {
    const data: Saved = { levelIndex, score, coins, foundByLevel, hintedByLevel };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore quota errors
    }
  }, [levelIndex, score, coins, foundByLevel, hintedByLevel]);

  // Mirror progress to the cloud (device-keyed backup, debounced 3s)
  useEffect(() => {
    const t = window.setTimeout(() => {
      const payload: CloudSave = {
        playerSeed: PLAYER_SEED,
        levelIndex,
        score,
        coins,
        foundByLevel,
        hintedByLevel,
      };
      void uploadSave(payload);
    }, 3000);
    return () => window.clearTimeout(t);
  }, [levelIndex, score, coins, foundByLevel, hintedByLevel]);

  // Fresh install with no local save: offer to restore from a previous
  // backup once the tutorial is dismissed.
  useEffect(() => {
    if (!isFreshInstall.current || showTutorial) return;
    let cancelled = false;
    void downloadSave().then((remote) => {
      if (cancelled || !remote) return;
      setShowRestore(true);
    });
    return () => {
      cancelled = true;
    };
  }, [showTutorial]);

  function applyRestored(remote: CloudSave) {
    setLevelIndex(Math.max(0, Math.min(remote.levelIndex, TOTAL_LEVELS - 1)));
    setScore(remote.score);
    setCoins(remote.coins);
    setFoundByLevel(remote.foundByLevel);
    setHintedByLevel(remote.hintedByLevel);
    setShowRestore(false);
    flashMessage('Progress restored!', 1600);
  }

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

  const ENCOURAGEMENT = ['Almost!', 'So close!', 'Try again!', 'Keep going!', 'Think...'];

  function flashEncouragement() {
    const msg = ENCOURAGEMENT[Math.floor(Math.random() * ENCOURAGEMENT.length)];
    setMessage(msg);
    window.setTimeout(() => setMessage(''), 1200);
  }

  function flashBonusWord(word: string) {
    setBonusFlash(word);
    window.setTimeout(() => setBonusFlash(null), 1200);
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
    playSelect();
    hapticTick();
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
      playInvalid();
      hapticError();
      flashMessage('At least 3 letters');
      window.setTimeout(() => setStatus('idle'), 600);
      resetAutoHintTimer();
      return;
    }
    const word = currentWord.join('');
    if (!targetSet.has(word)) {
      // Bonus word: a real dictionary word that isn't part of this level.
      if (isValidWord(word) && !bonusWords.includes(word)) {
        setBonusWords((b) => [...b, word]);
        setCoins((c) => c + BONUS_WORD_COINS);
        playValid();
        hapticLight();
        flashBonusWord(word);
        resetAutoHintTimer();
        window.setTimeout(() => clearWord(), 650);
        return;
      }
      setStatus('invalid');
      playInvalid();
      hapticError();
      flashEncouragement();
      window.setTimeout(() => setStatus('idle'), 700);
      resetAutoHintTimer();
      return;
    }
    if (found.includes(word)) {
      setStatus('invalid');
      playInvalid();
      hapticError();
      flashMessage('Already found');
      window.setTimeout(() => setStatus('idle'), 700);
      resetAutoHintTimer();
      return;
    }

    const newFound = [...found, word];
    // A word currently being revealed by a hint earns half score, but FULL
    // points toward the 100-point completion goal.
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
    playValid();
    hapticLight();
    setFlyingWord(word);
    setLastFound(word);
    resetAutoHintTimer();
    window.setTimeout(() => clearWord(), 650);

    // Level completes as soon as the full points from every word found so far
    // (including the one just submitted) reach 100. Computed from newFound so
    // the just-submitted word counts — checking the previous render's total
    // made levels finish one word late. Hinted words count at full value here.
    const newPoints = newFound.reduce((sum, w) => sum + wordPoints(w), 0);
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
      playFanfare();
      hapticSuccess();
      window.setTimeout(() => {
        setShowComplete(true);
        setAutoCountdown(null);
      }, 800);
    }
  }

  // Rewarded ad: watch-to-earn on the level-complete screen (native only).
  async function watchAdForCoins(reward: number) {
    if (adBusy || coinsDoubled) return;
    setAdBusy(true);
    const result = adsAvailable
      ? await showRewardedAd()
      : // Browser preview: simulate the reward after a short delay.
        await new Promise<'rewarded'>((r) => window.setTimeout(() => r('rewarded'), 1500));
    setAdBusy(false);
    if (result === 'rewarded') {
      setCoins((c) => c + reward);
      setLevelCoins((c) => c + reward);
      setCoinsDoubled(true);
    }
  }

  function doubleCoins() {
    void watchAdForCoins(levelCoins);
  }

  function convertStars(amount: number) {
    if (amount <= 0 || amount > score) return;
    const coinsEarned = Math.floor(amount / 10);
    if (coinsEarned <= 0) return;
    setScore((s) => Math.max(0, s - amount));
    setCoins((c) => c + coinsEarned);
  }

  function claimDailyBonus() {
    const { reward } = dailyRewardFor(daily.current.streak + 1);
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    // Streak continues only when the previous claim was yesterday.
    const streak = daily.current.lastClaim === yesterday ? daily.current.streak + 1 : 1;
    daily.current = { lastClaim: todayKey(), streak };
    try {
      localStorage.setItem(DAILY_BONUS_KEY, JSON.stringify(daily.current));
    } catch {
      // ignore quota errors
    }
    setCoins((c) => c + reward);
    setDailyResult(reward);
    setShowDailyBonus(false);
    playCoin();
    hapticSuccess();
    // Show a short toast, then clear it.
    window.setTimeout(() => setDailyResult(0), 2200);
  }

  // Replay a completed/reached level from the map. Progress in the replayed
  // level restarts; coins, score, and level history are kept.
  function replayLevel(index: number) {
    setShowMap(false);
    void maybeShowInterstitial(level.id).then(() => {
      setLevelIndex(index);
      setFoundByLevel((m) => {
        const next = { ...m };
        delete next[LEVELS[index].id];
        return next;
      });
      setHintedByLevel((m) => {
        const next = { ...m };
        delete next[LEVELS[index].id];
        return next;
      });
    });
  }

  function nextLevel() {
    void maybeShowInterstitial(level.id).then(() => {
      if (isFinal) {
        // restart from level 1, keep coins
        setLevelIndex(0);
        setFoundByLevel({});
        setHintedByLevel({});
        setScore(0);
      } else {
        setLevelIndex((i) => Math.min(i + 1, TOTAL_LEVELS - 1));
      }
    });
  }

  function useHint() {
    if (showComplete) return;

    if (coins < hintCost) {
      void offerAdForCoins();
      return;
    }

    const newHint = revealHintWord(found, hint);
    setHint(newHint);
    if (newHint) {
      playHint();
      hapticLight();
      const already = hint && hint.word === newHint.word ? hint.revealed.length : 0;
      setLettersRevealed((n) => n + newHint.word.length - already);
    }
    setCoins((c) => Math.max(0, c - hintCost));
    setPaidHints((n) => n + 1);
    resetAutoHintTimer();
  }

  // Rewarded ads offered during play (native app). In the browser preview the
  // reward is simulated after a short delay so the flow stays testable.
  const AD_COINS_REWARD = 30;

  async function offerAdForCoins() {
    if (adBusy) return;
    setAdBusy(true);
    const result = adsAvailable
      ? await showRewardedAd()
      : await new Promise<'rewarded'>((r) => window.setTimeout(() => r('rewarded'), 1500));
    setAdBusy(false);
    if (result === 'rewarded') {
      setCoins((c) => c + AD_COINS_REWARD);
      flashMessage(`+${AD_COINS_REWARD} coins!`);
      playCoin();
    }
  }

  async function watchAdForLetter() {
    if (adBusy) return;
    setAdBusy(true);
    const result = adsAvailable
      ? await showRewardedAd()
      : await new Promise<'rewarded'>((r) => window.setTimeout(() => r('rewarded'), 1500));
    setAdBusy(false);
    if (result === 'rewarded') {
      setHint((prev) => revealHintLetter(found, prev));
      setLettersRevealed((n) => n + 1);
      playHint();
    }
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

  // Android hardware back: close the topmost popup first; only exit the app
  // from the bare game screen. Browser (no Capacitor) is unaffected.
  const anyPopupOpen =
    showStarConversion || showSettings || showMap || showRestore ||
    showTutorial || showComplete;

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let handle: import('@capacitor/core').PluginListenerHandle | null = null;
    void CapacitorApp.addListener('backButton', () => {
      if (showSettings) setShowSettings(false);
      else if (showMap) setShowMap(false);
      else if (showStarConversion) setShowStarConversion(false);
      else if (showRestore) setShowRestore(false);
      else if (showTutorial) setShowTutorial(false);
      else if (showComplete) setShowComplete(false);
      else CapacitorApp.exitApp();
    }).then((h) => {
      handle = h;
    });
    return () => void handle?.remove();
  }, [anyPopupOpen, showSettings, showMap, showStarConversion, showRestore, showTutorial, showComplete]);

  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden font-sans text-white">
      <AnimatedBackground theme={theme} />
      {flyingWord && <FlyingWord word={flyingWord} onDone={() => setFlyingWord(null)} />}

      {showComplete && milestone && <Fireworks />}

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
          adBusy={adBusy}
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

      {dailyResult > 0 && (
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
              +
            </span>
            <span className="text-sm font-bold">Daily bonus: +{dailyResult} coins!</span>
          </div>
        </div>
      )}

      {showDailyBonus && (
        <DailyBonusModal
          day={dailyOffer.day}
          reward={dailyOffer.reward}
          theme={theme}
          onClaim={claimDailyBonus}
        />
      )}

      {showSettings && (
        <SettingsModal
          onReplayTutorial={() => {
            setShowSettings(false);
            setShowTutorial(true);
          }}
          onOpenMap={() => {
            setShowSettings(false);
            setShowMap(true);
          }}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showMap && (
        <LevelMapModal
          currentLevelId={level.id}
          totalLevels={TOTAL_LEVELS}
          starsByLevel={starsByLevel}
          theme={theme}
          onSelectLevel={replayLevel}
          onClose={() => setShowMap(false)}
        />
      )}

      {showTutorial && (
        <Tutorial theme={theme} onDone={() => setShowTutorial(false)} />
      )}

      {showRestore && (
        <RestoreDialog
          theme={theme}
          onRestore={applyRestored}
          onClose={() => setShowRestore(false)}
        />
      )}

      <div className="relative z-10 mx-auto flex h-[100dvh] w-full max-w-md flex-col">
        <TopBar
          score={score}
          coins={coins}
          level={level.id}
          difficulty={level.difficulty}
          theme={theme}
          onOpenStarConversion={() => setShowStarConversion(true)}
          onOpenSettings={() => setShowSettings(true)}
          soundOn={soundOn}
          onToggleSound={() => {
            const next = !soundOn;
            setSoundOn(next);
            setSoundEnabled(next);
          }}
        />

        <main className="flex min-h-0 flex-1 flex-col px-4 pb-2">
          <div className="relative z-20 shrink-0">
            <WordSlot
              word={currentWord}
              status={status}
              message={message}
              theme={theme}
              bonusWord={bonusFlash}
            />
          </div>

          <div className="relative z-10 flex shrink-0 justify-center pt-1">
            <AnimatedLogo />
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
              onWatchAdForCoins={() => void offerAdForCoins()}
              onWatchAdForLetter={() => void watchAdForLetter()}
              adBusy={adBusy}
              adsAvailable={adsAvailable}
              theme={theme}
              autoHintCountdown={autoCountdown}
            />
          </div>

          <div className="mt-2 shrink-0">
            <ProgressBar
              progress={levelProgress}
              foundCount={foundCount}
              remainingCount={Math.max(0, targetWords.length - foundCount)}
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
