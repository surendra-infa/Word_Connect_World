import { Star } from 'lucide-react';
import type { Theme } from '@/game/themes';

type Props = {
  progress: number; // 0–100 weighted percent
  foundCount: number;
  remainingCount: number;
  theme: Theme;
  stars: number; // 1–3, based on hints used this level
};

const SEGMENTS = 10;

export default function ProgressBar({ progress, foundCount, remainingCount, theme, stars }: Props) {
  const pct = Math.min(100, Math.round(progress));
  const complete = pct >= 100;

  return (
    <div className="shrink-0 px-2 pt-1">
      {/* Header: percentage badge, star rating, words counter */}
      <div className="mb-1.5 flex items-center justify-between">
        <span
          className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.7rem] font-extrabold tabular-nums"
          style={{
            backgroundColor: `${theme.accent}22`,
            color: theme.accentSoft,
            boxShadow: `inset 0 0 0 1px ${theme.accent}55, 0 0 10px ${theme.accent}44`,
          }}
        >
          <span
            className="inline-block h-1.5 w-1.5 rounded-full animate-pulse-soft"
            style={{
              backgroundColor: theme.accentSoft,
              boxShadow: `0 0 6px ${theme.accentSoft}`,
            }}
          />
          {pct}%
        </span>

        {/* Live star rating */}
        <span className="flex items-center gap-0.5" title={`${stars} star${stars === 1 ? '' : 's'} pace`}>
          {[1, 2, 3].map((s) => {
            const earned = s <= stars;
            return (
              <Star
                key={s}
                className={[
                  'h-4 w-4 transition-all duration-300',
                  earned ? 'scale-110' : 'scale-90',
                ].join(' ')}
                style={{
                  color: earned ? theme.accentSoft : 'rgba(255,255,255,0.22)',
                  fill: earned ? theme.accent : 'transparent',
                  filter: earned ? `drop-shadow(0 0 4px ${theme.accent})` : undefined,
                }}
              />
            );
          })}
        </span>

        <span className="text-[0.7rem] font-semibold text-white/45">
          {remainingCount > 0
            ? `${remainingCount} word${remainingCount === 1 ? '' : 's'} to go`
            : `${foundCount} found`}
        </span>
      </div>

      {/* XP-style track */}
      <div
        className={`relative h-5 rounded-full ${complete ? 'animate-complete-glow' : ''}`}
        style={
          {
            backgroundColor: 'rgba(0,0,0,0.35)',
            boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5), inset 0 -1px 1px rgba(255,255,255,0.06)',
            ['--bar-glow' as string]: `${theme.accent}66`,
          } as React.CSSProperties
        }
      >
        {/* Inner rail ring */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-full ring-1 ring-white/10" />

        {/* Flowing gradient fill with shimmer + gloss */}
        <div
          className="absolute inset-y-[3px] left-[3px] overflow-hidden rounded-full animate-gradient-flow transition-[width] duration-700 ease-out"
          style={{
            width: `calc(${pct}% - 6px)`,
            minWidth: pct > 0 ? 10 : 0,
            backgroundImage: `linear-gradient(90deg, ${theme.accentSoft}, ${theme.accent}, ${theme.accentStrong}, ${theme.accent})`,
            backgroundSize: '250% 100%',
            boxShadow: `0 0 14px ${theme.accent}cc, 0 0 5px ${theme.accentSoft}`,
          }}
        >
          {/* Moving shimmer sweep */}
          <div
            className="absolute inset-0 animate-shimmer"
            style={{
              backgroundImage:
                'linear-gradient(100deg, transparent 20%, rgba(255,255,255,0.55) 50%, transparent 80%)',
              backgroundSize: '200% 100%',
            }}
          />
          {/* Glossy top highlight */}
          <div
            className="absolute inset-x-0 top-0 h-1/2 rounded-full"
            style={{
              background:
                'linear-gradient(to bottom, rgba(255,255,255,0.5), transparent)',
            }}
          />
          {/* Segment dividers inside the fill */}
          <div className="absolute inset-0 flex">
            {Array.from({ length: SEGMENTS - 1 }, (_, i) => (
              <div key={i} className="h-full flex-1 border-r border-black/25" />
            ))}
          </div>
        </div>

        {/* Segment ticks on the empty track */}
        <div className="absolute inset-0 flex px-1.5">
          {Array.from({ length: SEGMENTS }, (_, i) => (
            <div key={i} className="flex-1 border-r border-white/5 last:border-0" />
          ))}
        </div>

        {/* Glowing orb at the fill head */}
        {pct > 0 && !complete && (
          <div
            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 animate-pulse-soft rounded-full transition-[left] duration-700 ease-out"
            style={{
              left: `${pct}%`,
              backgroundColor: '#fff',
              boxShadow: `0 0 10px 2px ${theme.accentSoft}, 0 0 20px 4px ${theme.accent}88`,
            }}
          />
        )}

        {/* Celebration burst at 100% */}
        {complete && (
          <>
            <div
              className="absolute -right-1 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full"
              style={{
                backgroundColor: '#fff',
                boxShadow: `0 0 16px 4px ${theme.accentSoft}, 0 0 36px 10px ${theme.accent}99`,
              }}
            />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="absolute top-1/2 h-1.5 w-1.5 animate-spark-burst rounded-full"
                style={{
                  left: `${88 + (i % 3) * 4}%`,
                  backgroundColor: i % 2 === 0 ? theme.accentSoft : '#fff',
                  animationDelay: `${i * 120}ms`,
                  boxShadow: `0 0 8px 2px ${theme.accentSoft}`,
                }}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
