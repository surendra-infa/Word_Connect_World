import { useState } from 'react';
import { Copy, Check, Map as MapIcon, RotateCcw, X, Save } from 'lucide-react';
import { getRestoreCode } from '@/game/cloudSave';

type Props = {
  onReplayTutorial: () => void;
  onOpenMap: () => void;
  onClose: () => void;
};

export default function SettingsModal({ onReplayTutorial, onOpenMap, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const code = getRestoreCode();

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Clipboard can be blocked; the code is visible either way.
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="animate-pop absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div
        className="animate-pop relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-slate-800 to-slate-900 p-6 shadow-2xl ring-1 ring-white/20"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/60 transition hover:bg-white/20 hover:text-white active:scale-90"
          aria-label="Close settings"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-xl font-extrabold text-white">Settings</h2>

        {/* Backup code */}
        <section className="mt-4 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
          <div className="flex items-center gap-2">
            <Save className="h-4 w-4 text-white/70" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white/80">
              Backup code
            </h3>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-white/55">
            Write this down. Enter it after reinstalling to recover your progress.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 rounded-xl bg-white/10 px-4 py-2.5 text-center text-lg font-extrabold tracking-[0.3em] text-white ring-1 ring-white/15">
              {code}
            </code>
            <button
              onClick={copyCode}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15 transition hover:bg-white/15 active:scale-90"
              aria-label="Copy backup code"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-400" />
              ) : (
                <Copy className="h-4 w-4 text-white/80" />
              )}
            </button>
          </div>
          {copied && (
            <p className="mt-1.5 text-center text-xs font-semibold text-emerald-400">Copied!</p>
          )}
        </section>

        {/* Level map */}
        <button
          onClick={onOpenMap}
          className="mt-3 flex w-full items-center gap-3 rounded-2xl bg-white/5 px-4 py-3.5 text-left ring-1 ring-white/10 transition hover:bg-white/10 active:scale-[0.98]"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
            <MapIcon className="h-5 w-5 text-white/80" />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-bold text-white">Level map</span>
            <span className="block text-xs text-white/55">Replay any level you've passed</span>
          </span>
        </button>

        {/* Replay tutorial */}
        <button
          onClick={onReplayTutorial}
          className="mt-3 flex w-full items-center gap-3 rounded-2xl bg-white/5 px-4 py-3.5 text-left ring-1 ring-white/10 transition hover:bg-white/10 active:scale-[0.98]"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
            <RotateCcw className="h-5 w-5 text-white/80" />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-bold text-white">How to play</span>
            <span className="block text-xs text-white/55">See the tutorial again</span>
          </span>
        </button>
      </div>
    </div>
  );
}
