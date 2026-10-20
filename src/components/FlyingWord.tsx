import { useEffect } from 'react';

type Props = {
  word: string;
  onDone: () => void;
};

export default function FlyingWord({ word, onDone }: Props) {
  useEffect(() => {
    const t = window.setTimeout(onDone, 720);
    return () => window.clearTimeout(t);
  }, [onDone]);

  return (
    <div className="pointer-events-none fixed inset-0 z-40">
      <div className="animate-fly absolute left-1/2 top-28 -translate-x-1/2">
        <div className="flex gap-1">
          {word.split('').map((ch, i) => (
            <span
              key={i}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-b from-amber-200 to-amber-400 text-xl font-extrabold text-amber-950 shadow-2xl shadow-amber-900/40 ring-1 ring-amber-100/70"
            >
              {ch}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
