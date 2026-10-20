import { useMemo } from 'react';
import type { Theme } from '@/game/themes';

type Props = { theme: Theme };

type Orb = {
  id: number;
  size: number;
  left: string;
  top: string;
  delay: string;
  duration: string;
  variant: 'a' | 'b';
};

type Spark = {
  id: number;
  left: string;
  size: number;
  delay: string;
  duration: string;
  drift: string;
};

// Animated vibrant background: a slow shifting multi-color gradient, rotating
// aurora sheens, floating glowing orbs and rising sparkles. Purely decorative
// (pointer-events-none).
export default function AnimatedBackground({ theme }: Props) {
  const orbs = useMemo<Orb[]>(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        id: i,
        size: 120 + Math.round(Math.random() * 240),
        left: `${Math.round(Math.random() * 75)}%`,
        top: `${Math.round(Math.random() * 75)}%`,
        delay: `${(Math.random() * 16).toFixed(2)}s`,
        duration: `${(14 + Math.random() * 12).toFixed(2)}s`,
        variant: (i % 2 === 0 ? 'a' : 'b') as Orb['variant'],
      })),
    [],
  );

  const sparks = useMemo<Spark[]>(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        left: `${Math.round(Math.random() * 100)}%`,
        size: 2 + Math.round(Math.random() * 4),
        delay: `${(Math.random() * 18).toFixed(2)}s`,
        duration: `${(12 + Math.random() * 14).toFixed(2)}s`,
        drift: `${Math.round(Math.random() * 60 - 30)}px`,
      })),
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Layer 1: slow shifting multi-color gradient */}
      <div
        className="absolute inset-0 animate-bg-shift"
        style={{
          backgroundImage: `linear-gradient(135deg, ${theme.bgFrom}, ${theme.bgVia}, ${theme.bgTo}, ${theme.bgVia}, ${theme.bgFrom})`,
          backgroundSize: '300% 300%',
        }}
      />

      {/* Layer 2: rotating aurora sheens (vibrant diagonal color sweeps) */}
      <div className="absolute inset-[-30%] animate-spin-slow opacity-60">
        <div
          className="absolute left-[8%] top-[5%] h-[55%] w-[65%] rounded-full blur-3xl"
          style={{
            background: `radial-gradient(ellipse at center, ${theme.glow1}, transparent 65%)`,
          }}
        />
        <div
          className="absolute right-[5%] bottom-[8%] h-[50%] w-[60%] rounded-full blur-3xl"
          style={{
            background: `radial-gradient(ellipse at center, ${theme.glow2}, transparent 65%)`,
          }}
        />
      </div>

      {/* Layer 3: drifting aurora band */}
      <div
        className="absolute inset-x-[-20%] top-[18%] h-[45%] animate-aurora opacity-40 blur-3xl"
        style={{
          background: `linear-gradient(100deg, transparent, ${theme.glow2} 35%, ${theme.glow1} 60%, transparent)`,
        }}
      />

      {/* Layer 4: floating glowing orbs */}
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

      {/* Layer 5: rising sparkles */}
      {sparks.map((s) => (
        <div
          key={s.id}
          className="absolute top-full animate-rise animate-pulse-soft rounded-full"
          style={{
            left: s.left,
            width: s.size,
            height: s.size,
            backgroundColor: theme.accentSoft,
            boxShadow: `0 0 6px 1px ${theme.accentSoft}`,
            animationDelay: s.delay,
            animationDuration: s.duration,
            ['--tw-translate-x' as string]: s.drift,
          }}
        />
      ))}

      {/* Subtle vignette for depth */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.35) 100%)',
        }}
      />
    </div>
  );
}
