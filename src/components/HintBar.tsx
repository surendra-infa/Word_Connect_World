import { Lightbulb } from 'lucide-react';
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
  const canAfford = coins >= hintCost;

  return (
    <div className="mt-auto shrink-0 px-4 pb-4 pt-2">
      <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
        <button
          onClick={onUseHint}
          className={[
            'flex h-14 w-14 shrink-0 flex-col items-center justify-center gap-0.5 rounded-full font-bold transition active:scale-95',
            canAfford
              ? 'shadow-lg ring-1 hover:brightness-105'
              : 'bg-white/10 text-white/50 ring-1 ring-white/10',
          ].join(' ')}
          style={
            canAfford
              ? {
                  backgroundImage: `linear-gradient(to bottom, ${theme.accent}, ${theme.accentStrong})`,
                  color: theme.accentInk,
                  boxShadow: `0 8px 20px -6px ${theme.accentStrong}66`,
                  ['--tw-ring-color' as string]: theme.accentSoft,
                }
              : undefined
          }
          aria-label="Use hint"
        >
          <Lightbulb className="h-5 w-5" strokeWidth={2.5} />
          <span className="text-[0.7rem] font-extrabold">Hint</span>
        </button>

        <div className="flex-1">
          {hint ? (
            <div className="flex flex-wrap items-center gap-1.5">
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
                one more word to find
              </span>
            </div>
          ) : autoHintCountdown !== null && autoHintCountdown > 0 ? (
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-white/55">
                Reveal a letter for{' '}
                <span className="font-bold" style={{ color: theme.accentSoft }}>
                  {hintCost} coins
                </span>
                .
              </p>
              <span
                className="flex h-7 min-w-[2.5rem] items-center justify-center rounded-full px-2 text-xs font-bold tabular-nums"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  color: theme.accentSoft,
                  boxShadow: `inset 0 0 0 1px ${theme.accent}40`,
                }}
                title="Auto-hint countdown"
              >
                {autoHintCountdown}s
              </span>
            </div>
          ) : (
            <p className="text-sm text-white/55">
              Reveal a letter in an unfound word for{' '}
              <span className="font-bold" style={{ color: theme.accentSoft }}>
                {hintCost} coins
              </span>
              .
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
