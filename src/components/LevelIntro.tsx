import { useEffect, useRef } from 'react';
import type { Theme } from '@/game/themes';
import { DIFFICULTY_COLOR, DIFFICULTY_LABEL, type Level } from '@/game/levels';

type Props = {
  level: Level;
  theme: Theme;
  isFinal: boolean;
  onStart: () => void;
};

const DURATION_MS = 2600;

// Full-screen chapter card shown when a new level begins. Shows only the
// level number and difficulty — never the level name, which is the puzzle's
// answer (the seed word itself).
export default function LevelIntro({ level, theme, isFinal, onStart }: Props) {
  const startRef = useRef(onStart);
  startRef.current = onStart;

  useEffect(() => {
    const t = window.setTimeout(() => startRef.current(), DURATION_MS);
    return () => window.clearTimeout(t);
  }, [level.id]);

  return (
    <div
      className="animate-fade-out-slow pointer-events-none fixed inset-0 z-[60] flex items-center justify-center overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(160deg, ${theme.bgFrom}, ${theme.bgVia} 50%, ${theme.bgTo})`,
      }}
      role="presentation"
    >
      <div
        className="pointer-events-none absolute h-72 w-72 rounded-full blur-3xl animate-pulse-soft"
        style={{
          backgroundColor: theme.glow1,
          top: '18%',
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      />

      <div className="relative flex flex-col items-center px-8 text-center">
        <p className="animate-rise-in text-xs font-bold uppercase tracking-[0.35em] text-white/55">
          {isFinal ? 'Final Level' : 'Level'}
        </p>
        <h1
          key={level.id}
          className="animate-count-up mt-2 text-8xl font-black tabular-nums text-white"
          style={{ textShadow: `0 6px 40px ${theme.accentSoft}66` }}
        >
          {level.id}
        </h1>

        <div
          className="mt-5 h-px w-16 animate-rise-in"
          style={{
            backgroundColor: theme.accent,
            boxShadow: `0 0 12px 2px ${theme.accentSoft}`,
            animationDelay: '200ms',
          }}
        />

        <div
          className="mt-3 flex items-center gap-2 animate-rise-in"
          style={{ animationDelay: '300ms' }}
        >          <span
            className="rounded-full px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wider"
            style={{
              color: DIFFICULTY_COLOR[level.difficulty],
              backgroundColor: `${DIFFICULTY_COLOR[level.difficulty]}1f`,
              boxShadow: `inset 0 0 0 1px ${DIFFICULTY_COLOR[level.difficulty]}55`,
            }}
          >
            {DIFFICULTY_LABEL[level.difficulty]}
          </span>
        </div>
      </div>
    </div>
  );
}
