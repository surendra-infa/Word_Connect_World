import type { Theme } from '@/game/themes';
import { DIFFICULTY_COLOR, DIFFICULTY_LABEL, type Difficulty } from '@/game/levels';
import { Star, Coins, Volume2, VolumeX, Settings } from 'lucide-react';

type Props = {
  score: number;
  coins: number;
  level: number;
  difficulty: Difficulty;
  theme: Theme;
  soundOn: boolean;
  onToggleSound: () => void;
  onOpenStarConversion: () => void;
  onOpenSettings: () => void;
};

// Two-column layout: left side has score + level + difficulty (left-aligned,
// away from center punch-hole cameras), right side has coins + settings +
// sound. The level number is no longer centered so it can't be hidden
// behind a camera hole.
export default function TopBar({
  score,
  coins,
  level,
  difficulty,
  theme,
  soundOn,
  onToggleSound,
  onOpenStarConversion,
  onOpenSettings,
}: Props) {
  const diffColor = DIFFICULTY_COLOR[difficulty];

  return (
    <header className="flex shrink-0 items-start justify-between gap-2 px-4 pt-6 pb-3">
      {/* Left cluster: score, level, difficulty — all left-aligned */}
      <div className="flex flex-col gap-1.5">
        <button
          onClick={onOpenStarConversion}
          className="flex cursor-pointer items-center gap-2 rounded-full bg-white/10 px-3 py-2 backdrop-blur-md ring-1 ring-white/15 transition hover:bg-white/15 active:scale-95"
          aria-label="Convert stars to coins"
        >
          <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
          <span className="text-sm font-semibold tabular-nums text-white">{score}</span>
        </button>
        <div className="flex items-center gap-2 pl-1">
          <span className="text-[0.6rem] font-semibold uppercase tracking-widest text-white/45">
            Lv
          </span>
          <span
            className="text-sm font-extrabold leading-none text-white"
            style={{ textShadow: `0 1px 8px ${theme.accentSoft}55` }}
          >
            {level}
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-[0.55rem] font-bold uppercase tracking-wider leading-none"
            style={{
              color: diffColor,
              backgroundColor: `${diffColor}1f`,
              boxShadow: `inset 0 0 0 1px ${diffColor}55`,
            }}
          >
            {DIFFICULTY_LABEL[difficulty]}
          </span>
        </div>
      </div>

      {/* Right cluster: coins, settings, sound — right-aligned */}
      <div className="flex flex-col items-end gap-1.5">
        <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2 backdrop-blur-md ring-1 ring-white/15">
          <Coins className="h-4 w-4" style={{ fill: theme.accentSoft, color: theme.accentSoft }} />
          <span
            key={coins}
            className="animate-pop min-w-[2ch] text-right text-sm font-bold tabular-nums text-white"
          >
            {coins}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenSettings}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15 transition hover:bg-white/15 active:scale-90"
            aria-label="Open settings"
          >
            <Settings className="h-4 w-4 text-white/85" />
          </button>
          <button
            onClick={onToggleSound}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15 transition hover:bg-white/15 active:scale-90"
            aria-label={soundOn ? 'Turn sound off' : 'Turn sound on'}
          >
            {soundOn ? (
              <Volume2 className="h-4 w-4 text-white/85" />
            ) : (
              <VolumeX className="h-4 w-4 text-white/45" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
