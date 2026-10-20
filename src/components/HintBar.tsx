import { useState } from 'react';
import { ChevronDown, Lightbulb } from 'lucide-react';
import type { Theme } from '@/game/themes';

type Props = {
  coins: number;
  hintCost: number;
  hint: { word: string; revealed: number[] } | null;
  onUseHint: () => void;
  theme: Theme;
  autoHintCountdown: number | null;
};

export default function HintBar({
  coins,
  hintCost,
  hint,
  onUseHint,
  theme,
  autoHintCountdown,
}: Props) {
  const [open, setOpen] = useState(false);
  const canAfford = coins >= hintCost;
  const hasHint = hint !== null;

  return (
    <div className="relative mt-auto shrink-0 px-4 pb-3 pt-1">
      {/* Popup panel (opens upward, above the button) */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setOpen(false)}
          />
          <div
            className="animate-pop absolute bottom-full left-4 right-4 z-50 mb-2 rounded-2xl bg-white/10 p-4 shadow-2xl ring-1 ring-white/15 backdrop-blur-md"
            style={{ boxShadow: `0 -8px 30px rgba(0,0,0,0.4)` }}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-bold text-white/80">
                <Lightbulb
                  className="h-4 w-4"
                  style={{ color: theme.accentSoft }}
                />
                Hint
              </span>
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums"
                style={{
                  backgroundColor: `${theme.accent}22`,
                  color: theme.accentSoft,
                  boxShadow: `inset 0 0 0 1px ${theme.accent}55`,
                }}
              >
                {hintCost} coins
              </span>
            </div>

            {hint ? (
              <div className="mb-3 flex flex-wrap items-center gap-1.5">
                {hint.word.split('').map((ch, i) => {
                  const shown = hint.revealed.includes(i);
                  return (
                    <span
                      key={i}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold uppercase ring-1 transition"
                      style={
                        shown
                          ? {
                              backgroundColor: `${theme.accent}55`,
                              color: theme.accentSoft,
                              ['--tw-ring-color' as string]: `${theme.accent}66`,
                            }
                          : {
                              backgroundColor: 'rgba(255,255,255,0.05)',
                              color: 'rgba(255,255,255,0.25)',
                              ['--tw-ring-color' as string]: 'rgba(255,255,255,0.1)',
                            }
                      }
                    >
                      {shown ? ch : '·'}
                    </span>
                  );
                })}
                <span className="ml-1 text-xs font-medium text-white/40">
                  type it in to find it!
                </span>
              </div>
            ) : (
              <p className="mb-3 text-sm text-white/60">
                Reveal an entire unfound word for{' '}
                <span className="font-bold" style={{ color: theme.accentSoft }}>
                  {hintCost} coins
                </span>
                .
              </p>
            )}

            <button
              onClick={() => {
                onUseHint();
                setOpen(false);
              }}
              disabled={!canAfford}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-extrabold transition active:scale-[0.98] disabled:opacity-40"
              style={
                canAfford
                  ? {
                      backgroundImage: `linear-gradient(to bottom, ${theme.accent}, ${theme.accentStrong})`,
                      color: theme.accentInk,
                      boxShadow: `0 8px 20px -6px ${theme.accentStrong}66`,
                    }
                  : {
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.5)',
                    }
              }
            >
              <Lightbulb className="h-4 w-4" strokeWidth={2.5} />
              {canAfford ? 'Reveal a word' : 'Not enough coins'}
            </button>
          </div>
        </>
      )}

      {/* Compact button row */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setOpen((o) => !o)}
          className="relative flex h-11 items-center gap-2 rounded-full px-4 text-sm font-bold ring-1 transition active:scale-95"
          style={{
            backgroundColor: hasHint
              ? `${theme.accent}33`
              : 'rgba(255,255,255,0.08)',
            color: hasHint ? theme.accentSoft : 'rgba(255,255,255,0.7)',
            ['--tw-ring-color' as string]: hasHint
              ? `${theme.accent}88`
              : 'rgba(255,255,255,0.15)',
            boxShadow: hasHint ? `0 0 14px ${theme.accent}44` : undefined,
          }}
          aria-label="Open hint panel"
        >
          <Lightbulb className="h-4 w-4" strokeWidth={2.5} />
          Hint
          {autoHintCountdown !== null && autoHintCountdown > 0 && (
            <span
              className="flex h-5 min-w-[1.75rem] items-center justify-center rounded-full px-1 text-[0.65rem] font-extrabold tabular-nums"
              style={{
                backgroundColor: 'rgba(255,255,255,0.12)',
                color: theme.accentSoft,
              }}
              title="Auto-hint countdown"
            >
              {autoHintCountdown}s
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </button>
      </div>
    </div>
  );
}
