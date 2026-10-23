import { useMemo } from 'react';
import type { Theme } from '@/game/themes';

type Orb = {
  id: number;
  size: number;
  left: string;
  top: string;
  delay: string;
  duration: string;
  variant: 'a' | 'b';
};

// Static gradient background with a couple of slow-floating soft orbs only.
// Removed aurora sweeps, spinning layers, sparkles, and vignette to keep
// gameplay rock-steady — no moving layers that shimmer during interaction.
export default function AnimatedBackground({ theme }: Props) {
  const orbs = useMemo<Orb[]>(
    () =>
      Array.from({ length: 3 }, (_, i) => ({
        id: i,
        size: 180 + Math.round(Math.random() * 160),
        left: `${Math.round(Math.random() * 70)}%`,
        top: `${Math.round(Math.random() * 70)}%`,
        delay: `${(Math.random() * 10).toFixed(2)}s`,
        duration: `${(22 + Math.random() * 10).toFixed(2)}s`,
        variant: (i % 2 === 0 ? 'a' : 'b') as Orb['variant'],
      })),
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Layer 1: static gradient — no animation, no shifting */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(160deg, ${theme.bgFrom}, ${theme.bgVia} 50%, ${theme.bgTo})`,
        }}
      />

      {/* Layer 2: just 3 very slow, very soft orbs for subtle life */}
      {orbs.map((o) => (
        <div
          key={o.id}
          className={[
            'absolute rounded-full blur-3xl',
            o.variant === 'a' ? 'animate-float-orb' : 'animate-float-orb-2',
          ].join(' ')}
          style={{
            width: o.size,
            height: o.size,
            left: o.left,
            top: o.top,
            backgroundColor: o.variant === 'a' ? theme.glow1 : theme.glow2,
            animationDelay: o.delay,
            animationDuration: o.duration,
          }}
        />
      ))}
    </div>
  );
}

type Props = { theme: Theme };
