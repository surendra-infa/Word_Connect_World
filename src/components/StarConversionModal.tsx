import { useState } from 'react';
import { Coins, Star, X } from 'lucide-react';
import type { Theme } from '@/game/themes';

type Props = {
  stars: number;
  theme: Theme;
  onClose: () => void;
  onConvert: (amount: number) => void;
};

export default function StarConversionModal({ stars, theme, onClose, onConvert }: Props) {
  const [amount, setAmount] = useState<number>(stars);

  const canConvert = amount > 0 && amount <= stars;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="animate-pop absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="animate-pop relative w-full max-w-sm overflow-hidden rounded-3xl bg-gradient-to-b from-slate-800 to-slate-900 p-6 text-center shadow-2xl ring-1 ring-white/20">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/60 transition hover:bg-white/20 hover:text-white active:scale-90"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="pointer-events-none absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-amber-400/30 blur-3xl" />

        <div className="relative">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-b from-amber-300 to-amber-500 shadow-xl shadow-amber-900/40 ring-2 ring-amber-200/70">
            <Star className="h-10 w-10 fill-amber-950 text-amber-950" strokeWidth={2.5} />
          </div>

          <p className="text-xs font-semibold uppercase tracking-widest text-amber-200/80">
            Convert stars
          </p>
          <h2 className="mt-1 text-2xl font-extrabold text-white">Stars to Coins</h2>
          <p className="mt-1 text-sm text-white/60">
            Trade your stars for coins at a 1:1 rate.
          </p>

          <div className="mt-5 flex items-center justify-between rounded-xl bg-amber-400/15 px-4 py-3 ring-1 ring-amber-300/30">
            <span className="flex items-center gap-2 text-sm font-semibold text-amber-100">
              <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
              Stars available
            </span>
            <span className="text-lg font-extrabold tabular-nums text-amber-200">{stars}</span>
          </div>

          <div className="mt-3">
            <label className="mb-1.5 block text-left text-xs font-semibold uppercase tracking-wider text-white/50">
              Amount to convert
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAmount((a) => Math.max(0, a - 10))}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white/80 ring-1 ring-white/15 transition hover:bg-white/20 active:scale-90"
                aria-label="Minus 10"
              >
                -10
              </button>
              <input
                type="number"
                min={0}
                max={stars}
                value={amount}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (Number.isNaN(v)) return;
                  setAmount(Math.max(0, Math.min(stars, Math.floor(v))));
                }}
                className="min-w-0 flex-1 rounded-xl bg-white/10 px-3 py-2.5 text-center text-lg font-bold tabular-nums text-white ring-1 ring-white/15 outline-none transition focus:bg-white/15 focus:ring-amber-300/50"
              />
              <button
                onClick={() => setAmount((a) => Math.min(stars, a + 10))}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white/80 ring-1 ring-white/15 transition hover:bg-white/20 active:scale-90"
                aria-label="Plus 10"
              >
                +10
              </button>
            </div>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => setAmount(stars)}
                className="flex-1 rounded-lg bg-white/5 py-1.5 text-xs font-semibold text-white/70 ring-1 ring-white/10 transition hover:bg-white/10 active:scale-95"
              >
                All ({stars})
              </button>
              <button
                onClick={() => setAmount(Math.floor(stars / 2))}
                className="flex-1 rounded-lg bg-white/5 py-1.5 text-xs font-semibold text-white/70 ring-1 ring-white/10 transition hover:bg-white/10 active:scale-95"
              >
                Half
              </button>
              <button
                onClick={() => setAmount(0)}
                className="flex-1 rounded-lg bg-white/5 py-1.5 text-xs font-semibold text-white/70 ring-1 ring-white/10 transition hover:bg-white/10 active:scale-95"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
            <span className="flex items-center gap-2 text-sm font-semibold text-white/70">
              <Coins className="h-4 w-4" style={{ fill: theme.accentSoft, color: theme.accentSoft }} />
              You receive
            </span>
            <span
              className="text-lg font-extrabold tabular-nums"
              style={{ color: theme.accentSoft }}
            >
              +{canConvert ? amount : 0}
            </span>
          </div>

          <button
            onClick={() => {
              if (!canConvert) return;
              onConvert(amount);
              onClose();
            }}
            disabled={!canConvert}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-extrabold text-white shadow-lg transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              backgroundImage: `linear-gradient(to right, ${theme.accent}, ${theme.accentStrong})`,
              color: theme.accentInk,
              boxShadow: `0 10px 25px -8px ${theme.accentStrong}66`,
            }}
          >
            <Coins className="h-5 w-5" />
            Convert {canConvert ? amount : 0} star{canConvert && amount === 1 ? '' : 's'}
          </button>
        </div>
      </div>
    </div>
  );
}
