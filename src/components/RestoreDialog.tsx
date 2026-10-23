import { useState } from 'react';
import { X, Download } from 'lucide-react';
import type { Theme } from '@/game/themes';
import { restoreByCode, type CloudSave } from '@/game/cloudSave';

type Props = {
  theme: Theme;
  onRestore: (save: CloudSave) => void;
  onClose: () => void;
};

export default function RestoreDialog({ theme, onRestore, onClose }: Props) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function tryRestore() {
    if (code.trim().length !== 6) {
      setError('Enter the 6-character code from your other device.');
      return;
    }
    setBusy(true);
    setError('');
    const remote = await restoreByCode(code);
    setBusy(false);
    if (!remote) {
      setError("Couldn't find a save with that code.");
      return;
    }
    onRestore(remote);
  }

  return (
    <div className="animate-fade-in fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div
        className="w-full max-w-sm animate-pop rounded-3xl p-6 shadow-2xl ring-1"
        style={{
          backgroundImage: `linear-gradient(to bottom right, ${theme.accent}, ${theme.accentStrong})`,
          color: theme.accentInk,
          ['--tw-ring-color' as string]: `${theme.accentSoft}aa`,
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-2xl"
              style={{ backgroundColor: `${theme.accentInk}22` }}
            >
              <Download className="h-5 w-5" />
            </span>
            <h3 className="text-lg font-extrabold">Restore progress</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 opacity-60 transition hover:opacity-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-3 text-sm font-medium leading-relaxed opacity-90">
          Reinstalled or on a new device? Enter the 6-character backup code from your
          previous game to bring back your progress.
        </p>

        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={6}
          placeholder="ABC123"
          className="mt-4 w-full rounded-2xl bg-white/25 px-4 py-3 text-center text-xl font-extrabold tracking-[0.3em] placeholder-white/40 outline-none ring-1 ring-white/30 focus:ring-2 focus:ring-white/60"
          style={{ color: theme.accentInk }}
        />

        {error && (
          <p className="mt-2 text-center text-xs font-bold text-white underline decoration-white/60 underline-offset-2">
            {error}
          </p>
        )}

        <button
          onClick={tryRestore}
          disabled={busy}
          className="mt-4 w-full rounded-full bg-white/90 py-3 text-sm font-extrabold shadow transition hover:bg-white active:scale-95 disabled:opacity-60"
          style={{ color: theme.accentStrong }}
        >
          {busy ? 'Looking up code…' : 'Restore my progress'}
        </button>

        <button
          onClick={onClose}
          className="mt-2 w-full py-2 text-xs font-bold opacity-60 transition hover:opacity-100"
        >
          Start fresh instead
        </button>
      </div>
    </div>
  );
}
