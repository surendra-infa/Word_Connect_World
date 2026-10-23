import { useEffect, useState } from 'react';
import { Hand, Trophy, Star } from 'lucide-react';
import type { Theme } from '@/game/themes';

type Props = {
  theme: Theme;
  onDone: () => void;
};

const STEPS = [
  {
    icon: Hand,
    title: 'Swipe to connect',
    body: 'Drag your finger across the letters to link them into words. Words need at least 3 letters — release to submit.',
  },
  {
    icon: Trophy,
    title: 'Fill the meter',
    body: 'Every word you find adds points to the level meter. Reach 100% and the level is complete. Longer words are worth more.',
  },
  {
    icon: Star,
    title: 'Keep your stars',
    body: 'Finish a level with no hints to earn 3 stars. Every hint-revealed letter (paid or free) costs one star — lose all 3 after three letters!',
  },
];

export default function Tutorial({ theme, onDone }: Props) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];

  useEffect(() => {
    try {
      localStorage.setItem('wordlink-tutorial-done', '1');
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="mx-4 mb-8 w-full max-w-sm animate-pop rounded-3xl p-6 shadow-2xl ring-1"
        style={{
          backgroundImage: `linear-gradient(to bottom right, ${theme.accent}, ${theme.accentStrong})`,
          color: theme.accentInk,
          boxShadow: `0 24px 60px -12px ${theme.accentStrong}88`,
          ['--tw-ring-color' as string]: `${theme.accentSoft}aa`,
        }}
      >
        <div className="flex items-center gap-3">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${theme.accentInk}22` }}
          >
            <current.icon className="h-6 w-6" />
          </span>
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-widest opacity-70">
              Step {step + 1} of {STEPS.length}
            </p>
            <h3 className="text-lg font-extrabold leading-tight">{current.title}</h3>
          </div>
        </div>

        <p className="mt-4 text-sm font-medium leading-relaxed opacity-90">{current.body}</p>

        <div className="mt-5 flex items-center justify-between">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === step ? 20 : 8,
                  backgroundColor: i === step ? theme.accentInk : `${theme.accentInk}44`,
                }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="rounded-full px-4 py-2 text-sm font-bold opacity-70 transition hover:opacity-100"
              >
                Back
              </button>
            )}
            <button
              onClick={() => (step < STEPS.length - 1 ? setStep((s) => s + 1) : onDone())}
              className="rounded-full bg-white/90 px-5 py-2 text-sm font-extrabold shadow transition hover:bg-white active:scale-95"
              style={{ color: theme.accentStrong }}
            >
              {step < STEPS.length - 1 ? 'Next' : 'Play'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
