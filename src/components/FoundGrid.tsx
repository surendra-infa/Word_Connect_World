import { useEffect, useState } from 'react';
import { wordPoints, hintWordPoints } from '@/game/levels';
import type { Theme } from '@/game/themes';

type Props = {
  words: string[];
  hinted: string[];
  theme: Theme;
  lastFound: string | null;
};

export default function FoundGrid({ words, hinted, theme, lastFound }: Props) {
  const [landing, setLanding] = useState<string | null>(null);

  useEffect(() => {
    if (!lastFound) return;
    setLanding(lastFound);
    const t = window.setTimeout(() => setLanding(null), 500);
    return () => window.clearTimeout(t);
  }, [lastFound]);

  return (
    <section className="mt-2 flex max-h-40 min-h-0 flex-1 flex-col rounded-2xl bg-white/5 p-2.5 shadow-[0_-1px_0_rgba(255,255,255,0.15)] ring-2 ring-white/25">
      <div className="mb-1.5 flex shrink-0 items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-white/50">
          Found words
        </h2>
        <span className="text-xs font-semibold text-white/40">
          {words.length} word{words.length === 1 ? '' : 's'}
        </span>
      </div>

      {words.length === 0 ? (
        <p className="text-sm text-white/40">
          Words you find will land here.
        </p>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pr-1">
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
                  className="flex h-7 w-7 items-center justify-center rounded-full px-1 text-xs font-bold uppercase"
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
                +{hinted.includes(w) ? hintWordPoints(w) : wordPoints(w)}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
