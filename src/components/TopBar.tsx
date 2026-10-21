import type { Theme } from '@/game/themes';
import { DIFFICULTY_COLOR, DIFFICULTY_LABEL, type Difficulty } from '@/game/levels';
import { Star, Coins, Volume2, VolumeX, CloudUpload, Check } from 'lucide-react';

type Props = {
  score: number;
  coins: number;
  level: number;
  difficulty: Difficulty;
  theme: Theme;
  soundOn: boolean;
  onToggleSound: () => void;
  cloudStatus: 'idle' | 'saving' | 'saved';
  onOpenStarConversion: () => void;
};

export default function TopBar({
  score,
  coins,
  level,
  difficulty,
  theme,
  soundOn,
  onToggleSound,
  cloudStatus,
  onOpenStarConversion,
}: Props) {
  return (
    <header className="flex shrink-0 items-center justify-between gap-2 px-4 pt-3 pb-2">
      <button
        onClick={onOpenStarConversion}
        className="flex cursor-pointer items-center gap-2 rounded-full bg-white/10 px-3 py-2 backdrop-blur-md ring-1 ring-white/15 transition hover:bg-white/15 active:scale-95"
        aria-label="Convert stars to coins"
      >
        <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
        <span className="text-sm font-semibold tabular-nums text-white">{score}</span>
      </button>

      <div className="flex flex-col items-center leading-none">
        <span className="text-[0.6rem] font-semibold uppercase tracking-widest text-white/45">
          Level
        </span>
        <span
          className="text-base font-extrabold text-white"
          style={{ textShadow: `0 1px 8px ${theme.accentSoft}55` }}
        >
          {level}
        </span>
        <span
          className="mt-1 rounded-full px-2 py-0.5 text-[0.55rem] font-bold uppercase tracking-wider"
          style={{
            color: DIFFICULTY_COLOR[difficulty],
            backgroundColor: `${DIFFICULTY_COLOR[difficulty]}1f`,
            boxShadow: `inset 0 0 0 1px ${DIFFICULTY_COLOR[difficulty]}55`,
          }}
        >
          {DIFFICULTY_LABEL[difficulty]}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2 backdrop-blur-md ring-1 ring-white/15">
          <Coins className="h-4 w-4" style={{ fill: theme.accentSoft, color: theme.accentSoft }} />
          <span
            key={coins}
            className="animate-pop min-w-[2ch] text-right text-sm font-bold tabular-nums text-white"
          >
            {coins}
          </span>
        </div>
        <button
          onClick={onToggleSound}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15 transition hover:bg-white/15 active:scale-90"
          aria-label={soundOn ? 'Turn sound off' : 'Turn sound on'}
        >
          {soundOn ? (
            <Volume2 className="h-4 w-4 text-white/85" />
          ) : (
            <VolumeX className="h-4 w-4 text-white/45" />
          )}
        </button>
        {cloudStatus === 'saving' && (
          <CloudUpload className="h-4 w-4 animate-pulse text-white/50" />
        )}
        {cloudStatus === 'saved' && <Check className="h-4 w-4 text-emerald-300" />}
      </div>
    </header>
  );
}
