import { useEffect, useState } from 'react';
import { Coins, Flame, Play, Sparkles, Star, Trophy } from 'lucide-react';
import { DIFFICULTY_COLOR, DIFFICULTY_LABEL, type Difficulty } from '@/game/levels';

type Props = {
  levelNumber: number;
  totalLevels: number;
  foundCount: number;
  score: number;
  coinsEarned: number;
  isFinal: boolean;
  stars: number;
  streakBonus: number;
  coinsDoubled: boolean;
  onDoubleCoins: () => void;
  nextDifficulty: Difficulty | null;
  onNext: () => void;
};

export default function LevelCompleteModal({
  levelNumber,
  totalLevels,
  foundCount,
  score,
  coinsEarned,
  isFinal,
  stars,
  streakBonus,
  coinsDoubled,
  onDoubleCoins,
  nextDifficulty,
  onNext,
}: Props) {
  const [adPlaying, setAdPlaying] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') onNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onNext]);

  const pct = 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="animate-pop absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div className="animate-pop relative w-full max-w-sm overflow-hidden rounded-3xl bg-gradient-to-b from-teal-800 to-emerald-900 p-7 text-center shadow-2xl ring-1 ring-white/20">
        <div className="pointer-events-none absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-amber-400/30 blur-3xl" />

        <div className="relative">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-b from-amber-300 to-amber-500 shadow-xl shadow-amber-900/40 ring-2 ring-amber-200/70">
            {isFinal ? (
              <Trophy className="h-10 w-10 text-amber-950" strokeWidth={2.5} />
            ) : (
              <Sparkles className="h-10 w-10 text-amber-950" strokeWidth={2.5} />
            )}
          </div>

          <p className="text-xs font-semibold uppercase tracking-widest text-amber-200/80">
            {isFinal ? 'You finished the game!' : 'Level complete'}
          </p>
          <h2 className="mt-1 text-2xl font-extrabold text-white">
            {isFinal ? 'Champion!' : `Level ${levelNumber}`}
          </h2>
          <p className="mt-1 text-sm text-white/60">
            {isFinal ? (
              `You conquered all ${totalLevels} levels.`
            ) : nextDifficulty ? (
              <>
                Get ready for level {levelNumber + 1}{' '}
                <span
                  className="font-bold uppercase"
                  style={{ color: DIFFICULTY_COLOR[nextDifficulty] }}
                >
                  ({DIFFICULTY_LABEL[nextDifficulty]})
                </span>
              </>
            ) : (
              `Get ready for level ${levelNumber + 1}`
            )}
          </p>

          <div className="mt-4 flex items-center justify-center gap-2">
            {[1, 2, 3].map((s) => {
              const earned = s <= stars;
              return (
                <div
                  key={s}
                  className="animate-pop flex h-12 w-12 items-center justify-center rounded-full ring-2"
                  style={{
                    animationDelay: `${s * 150}ms`,
                    backgroundColor: earned ? 'rgba(251,191,36,0.18)' : 'rgba(255,255,255,0.05)',
                    ['--tw-ring-color' as string]: earned
                      ? 'rgba(252,211,77,0.7)'
                      : 'rgba(255,255,255,0.12)',
                    boxShadow: earned ? '0 0 16px rgba(251,191,36,0.45)' : undefined,
                  }}
                >
                  <Star
                    className="h-6 w-6"
                    style={{
                      color: earned ? '#fcd34d' : 'rgba(255,255,255,0.25)',
                      fill: earned ? '#fbbf24' : 'transparent',
                      filter: earned ? 'drop-shadow(0 0 6px #f59e0b)' : undefined,
                    }}
                  />
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-xs font-semibold text-white/50">
            {stars === 3
              ? 'Flawless — no hints used!'
              : stars === 2
                ? 'Great — just one hint.'
                : 'Solved with a few hints.'}
          </p>

          <div className="mt-5 space-y-2.5">
            <Stat label="Words found" value={String(foundCount)} />
            <Stat label="Completion" value={`${pct}%`} />
            <Stat label="Level score" value={String(score)} />
            <div className="flex items-center justify-between rounded-xl bg-amber-400/15 px-4 py-3 ring-1 ring-amber-300/30">
              <span className="flex items-center gap-2 text-sm font-semibold text-amber-100">
                <Coins className="h-4 w-4 fill-amber-300 text-amber-300" />
                Coins earned
              </span>
              <span className="text-lg font-extrabold tabular-nums text-amber-200">
                +{coinsEarned}
              </span>
            </div>
            {streakBonus > 0 && (
              <div
                className="flex items-center justify-between rounded-xl px-4 py-3 ring-1"
                style={{
                  backgroundColor: 'rgba(248,113,113,0.15)',
                  ['--tw-ring-color' as string]: 'rgba(248,113,113,0.4)',
                }}
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-red-200">
                  <Flame className="h-4 w-4 text-red-300" />
                  Hard mode streak
                </span>
                <span className="text-lg font-extrabold tabular-nums text-red-200">
                  +{streakBonus}
                </span>
              </div>
            )}
          </div>

          {/* Ad doubling reward */}
          <div className="mt-3 space-y-2">
            {!coinsDoubled && (
              <button
                onClick={() => {
                  if (adPlaying) return;
                  setAdPlaying(true);
                  window.setTimeout(() => {
                    setAdPlaying(false);
                    onDoubleCoins();
                  }, 1500);
                }}
                disabled={adPlaying}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-emerald-900/30 ring-1 ring-emerald-300/40 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-70"
              >
                <Play className="h-4 w-4 fill-white" />
                {adPlaying ? 'Ad playing…' : `Watch ad — double coins (+${coinsEarned})`}
              </button>
            )}
          </div>

          <button
            onClick={onNext}
            className="mx-auto mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-b from-amber-300 to-amber-500 text-amber-950 shadow-lg shadow-amber-900/30 ring-1 ring-amber-200/60 transition hover:brightness-105 active:scale-95"
            aria-label={isFinal ? 'Play again' : 'Next level'}
          >
            <ArrowRight />
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-2.5 ring-1 ring-white/10">
      <span className="text-sm font-medium text-white/70">{label}</span>
      <span className="text-base font-bold tabular-nums text-white">{value}</span>
    </div>
  );
}

function ArrowRight() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
