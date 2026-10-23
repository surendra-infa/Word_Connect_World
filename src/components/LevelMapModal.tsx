import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Lock, Star, X } from 'lucide-react';
import type { Theme } from '@/game/themes';
type Props = {
  currentLevelId: number;
  totalLevels: number;
  starsByLevel: Record<number, number>;
  theme: Theme;
  onSelectLevel: (index: number) => void;
  onClose: () => void;
};

const PAGE_SIZE = 30;

export default function LevelMapModal({
  currentLevelId,
  totalLevels,
  starsByLevel,
  theme,
  onSelectLevel,
  onClose,
}: Props) {
  const lastPage = Math.ceil(totalLevels / PAGE_SIZE) - 1;
  const [page, setPage] = useState(Math.floor((currentLevelId - 1) / PAGE_SIZE));

  const levels = useMemo(() => {
    const start = page * PAGE_SIZE + 1;
    const end = Math.min(start + PAGE_SIZE - 1, totalLevels);
    const out: number[] = [];
    for (let i = start; i <= end; i++) out.push(i);
    return out;
  }, [page, totalLevels]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="animate-pop absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="animate-pop relative flex max-h-[80vh] w-full max-w-sm flex-col overflow-hidden rounded-3xl bg-gradient-to-b from-slate-800 to-slate-900 shadow-2xl ring-1 ring-white/20">
        <div className="flex shrink-0 items-center justify-between px-5 pt-5">
          <h2 className="text-xl font-extrabold text-white">Level map</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/60 transition hover:bg-white/20 hover:text-white active:scale-90"
            aria-label="Close level map"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="shrink-0 px-5 pt-1 text-xs text-white/55">
          Completed levels show your stars. Replay any level you've reached.
        </p>

        <div className="grid min-h-0 flex-1 grid-cols-5 content-start gap-2.5 overflow-y-auto p-5">
          {levels.map((id) => {
            const reached = id <= currentLevelId;
            const isCurrent = id === currentLevelId;
            const earned = Math.min(3, starsByLevel[id] ?? 0);
            return (
              <button
                key={id}
                onClick={() => reached && onSelectLevel(id - 1)}
                disabled={!reached}
                className={[
                  'relative flex aspect-square flex-col items-center justify-center rounded-2xl text-sm font-extrabold transition active:scale-90',
                  isCurrent
                    ? 'ring-2'
                    : reached
                      ? 'ring-1'
                      : 'cursor-not-allowed ring-1',
                ].join(' ')}
                style={
                  isCurrent
                    ? {
                        backgroundImage: `linear-gradient(to bottom, ${theme.accent}, ${theme.accentStrong})`,
                        color: theme.accentInk,
                        ['--tw-ring-color' as string]: theme.accentSoft,
                        boxShadow: `0 0 16px ${theme.accent}66`,
                      }
                    : reached
                      ? {
                          backgroundColor: 'rgba(255,255,255,0.08)',
                          color: 'rgba(255,255,255,0.85)',
                          ['--tw-ring-color' as string]: 'rgba(255,255,255,0.18)',
                        }
                      : {
                          backgroundColor: 'rgba(255,255,255,0.03)',
                          color: 'rgba(255,255,255,0.3)',
                          ['--tw-ring-color' as string]: 'rgba(255,255,255,0.08)',
                        }
                }
                aria-label={
                  reached ? `Play level ${id}` : `Level ${id} is locked`
                }
              >
                {reached ? id : <Lock className="h-4 w-4" />}
                {reached && earned > 0 && (
                  <span className="absolute -bottom-1 flex gap-0.5">
                    {Array.from({ length: earned }, (_, s) => (
                      <Star
                        key={s}
                        className="h-3 w-3"
                        style={{
                          color: '#fcd34d',
                          fill: '#fbbf24',
                          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))',
                        }}
                      />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center justify-between border-t border-white/10 px-5 py-3">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15 transition hover:bg-white/15 active:scale-90 disabled:opacity-30"
            aria-label="Previous levels"
          >
            <ChevronLeft className="h-4 w-4 text-white/80" />
          </button>
          <span className="text-xs font-semibold tabular-nums text-white/60">
            Levels {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalLevels)} of{' '}
            {totalLevels}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
            disabled={page >= lastPage}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15 transition hover:bg-white/15 active:scale-90 disabled:opacity-30"
            aria-label="Next levels"
          >
            <ChevronRight className="h-4 w-4 text-white/80" />
          </button>
        </div>
      </div>
    </div>
  );
}
