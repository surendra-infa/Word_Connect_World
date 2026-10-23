import { Gift } from 'lucide-react';
import type { Theme } from '@/game/themes';

type Props = {
  day: number;
  reward: number;
  theme: Theme;
  onClaim: () => void;
};

const WEEK = [
  { day: 1, coins: 25 },
  { day: 2, coins: 40 },
  { day: 3, coins: 60 },
  { day: 4, coins: 85 },
  { day: 5, coins: 115 },
  { day: 6, coins: 150 },
  { day: 7, coins: 250 },
];

export function dailyRewardFor(day: number): { day: number; reward: number } {
  const idx = ((day - 1) % 7 + 7) % 7;
  return { day: idx + 1, reward: WEEK[idx].coins };
}

export function isBonusDayComplete(day: number): boolean {
  return ((day - 1) % 7 + 7) % 7 === 6;
}

export default function DailyBonusModal({
  day,
  reward,
  theme,
  onClaim,
}: Props) {
  const dayIdx = ((day - 1) % 7 + 7) % 7;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="animate-fade-in absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className="animate-pop relative w-full max-w-sm rounded-3xl p-6 text-center shadow-2xl ring-1"
        style={{
          backgroundImage: `linear-gradient(to bottom, ${theme.accent}, ${theme.accentStrong})`,
          color: theme.accentInk,
          ['--tw-ring-color' as string]: `${theme.accentSoft}aa`,
          boxShadow: `0 24px 60px -12px ${theme.accentStrong}88`,
        }}
      >
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full shadow-lg"
          style={{ backgroundColor: `${theme.accentInk}22` }}
        >
          <Gift className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-extrabold">Daily bonus!</h2>
        <p className="mt-1 text-sm font-medium opacity-80">
          Day {dayIdx + 1} of 7 — come back tomorrow to keep the streak going.
        </p>

        <div className="mt-4 grid grid-cols-7 gap-1.5">
          {WEEK.map((d, i) => (
            <div
              key={d.day}
              className="flex flex-col items-center gap-0.5 rounded-lg py-1.5"
              style={{
                backgroundColor: i <= dayIdx ? `${theme.accentInk}33` : `${theme.accentInk}11`,
              }}
            >
              <span className="text-[0.55rem] font-bold uppercase opacity-70">{d.day}</span>
              <span className="text-[0.6rem] font-extrabold tabular-nums">{d.coins}</span>
            </div>
          ))}
        </div>

        <button
          onClick={onClaim}
          className="mt-5 w-full rounded-full bg-white/90 py-3 text-sm font-extrabold shadow transition hover:bg-white active:scale-95"
          style={{ color: theme.accentStrong }}
        >
          Claim {reward} coins
        </button>
      </div>
    </div>
  );
}
