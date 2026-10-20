import { useEffect, useState } from 'react';
import type { Theme } from '@/game/themes';

type Props = {
  words: string[];
  total: number;
  theme: Theme;
  lastFound: string | null;
};

export default function FoundGrid({ words, total, theme, lastFound }: Props) {
  const [landing, setLanding] = useState<string | null>(null);

  useEffect(() => {
    if (!lastFound) return;
    setLanding(lastFound);
    const t = window.setTimeout(() => setLanding(null), 500);
    return () => window.clearTimeout(t);
  }, [lastFound]);

  return (
    <section className="mt-2 flex min-h-0 flex-1 flex-col rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
      <div className="mb-2 flex shrink-0 items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-white/50">
          Found words
        </h2>
        <span className="text-xs font-semibold text-white/40">
          {words.length} / {total}
        </span>
      </div>

      {words.length === 0 ? (
        <p className="text-sm text-white/40">
          Words you find will land here.
        </p>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto pr-1">
          {words.map((w) => (
            <div
              key={w}
              className={[
                'flex items-center gap-1',
                landing === w ? 'animate-chip-land' : '',
              ].join(' ')}
            >
              {w.split('').map((ch, i) => (
                <span
                  key={i}
                  className="flex h-8 w-8 items-center justify-center rounded-full px-1 text-sm font-bold uppercase"
                  style={{
                    backgroundColor: theme.chipBg,
                    color: theme.chipText,
                    boxShadow: `inset 0 0 0 1px ${theme.chipRing}`,
                  }}
                >
                  {ch}
                </span>
              ))}
              <span className="ml-1.5 text-[0.65rem] font-semibold uppercase tracking-wide text-white/30">
                +{w.length <= 3 ? 20 : w.length === 4 ? 25 : 30}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
