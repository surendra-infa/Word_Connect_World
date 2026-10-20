import type { Theme } from '@/game/themes';

type Props = {
  word: string[];
  status: 'idle' | 'valid' | 'invalid';
  message?: string;
  theme: Theme;
};

export default function WordSlot({ word, status, message, theme }: Props) {
  const label =
    message ??
    (status === 'valid'
      ? 'Nice!'
      : status === 'invalid'
        ? 'Not a word'
        : '');

  return (
    <div className="flex flex-col items-center gap-2 px-6 pt-2">
      <div
        className={[
          'flex min-h-[4rem] items-center justify-center gap-1.5 rounded-2xl px-4 py-3 transition-all duration-200',
          status === 'valid'
            ? 'ring-2'
            : status === 'invalid'
              ? 'animate-shake bg-rose-400/15 ring-2 ring-rose-300/60'
              : 'bg-white/5 ring-1 ring-white/10',
        ].join(' ')}
        style={
          status === 'valid'
            ? {
                backgroundColor: `${theme.accent}33`,
                ['--tw-ring-color' as string]: `${theme.accentSoft}b3`,
              }
            : undefined
        }
      >
        {word.length === 0 ? (
          <span className="text-sm font-medium tracking-widest text-white/30">
            BUILD A WORD
          </span>
        ) : (
          word.map((ch, i) => (
            <span
              key={`${ch}-${i}`}
              className="animate-pop flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-xl font-bold shadow-lg shadow-black/20"
              style={{ color: theme.bgVia }}
            >
              {ch}
            </span>
          ))
        )}
      </div>
      <span
        key={label}
        className={[
          'h-4 text-xs font-semibold transition-opacity duration-150',
          label && status === 'invalid' ? 'animate-emoji-float text-base' : '',
          status === 'valid'
            ? 'text-emerald-200'
            : status === 'invalid'
              ? 'text-amber-200'
              : 'text-white/40',
        ].join(' ')}
      >
        {label}
      </span>
    </div>
  );
}
