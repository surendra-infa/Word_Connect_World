import type { Theme } from '@/game/themes';
import { DIFFICULTY_COLOR, DIFFICULTY_LABEL, type Difficulty } from '@/game/levels';
import { Star, Coins } from 'lucide-react';

type Props = {
  score: number;
  coins: number;
  level: number;
  difficulty: Difficulty;
  onShuffle: () => void;
  theme: Theme;
};

export default function TopBar({ score, coins, level, difficulty, onShuffle, theme }: Props) {
  return (
    <header className="flex shrink-0 items-center justify-between gap-2 px-4 pt-3 pb-2">
      <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 backdrop-blur-md ring-1 ring-white/15">
        <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
        <span className="text-sm font-semibold tabular-nums text-white">{score}</span>
      </div>

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

      <div className="flex items-center gap-2">
        <button
          onClick={onShuffle}
          className="rounded-full bg-white/10 p-2.5 text-white/80 ring-1 ring-white/15 transition active:scale-90 hover:bg-white/15"
          aria-label="Shuffle letters"
        >
          <ShuffleIcon />
        </button>
        <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2 backdrop-blur-md ring-1 ring-white/15">
          <Coins className="h-4 w-4" style={{ fill: theme.accentSoft, color: theme.accentSoft }} />
          <span
            key={coins}
            className="animate-pop min-w-[2ch] text-right text-sm font-bold tabular-nums text-white"
          >
            {coins}
          </span>
        </div>
      </div>
    </header>
  );
}

function ShuffleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 3h5v5" />
      <path d="M4 20 21 3" />
      <path d="M21 16v5h-5" />
      <path d="m15 15 6 6" />
      <path d="M4 4l5 5" />
    </svg>
  );
}
