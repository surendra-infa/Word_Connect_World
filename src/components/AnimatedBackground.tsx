import { useEffect, useMemo, useRef, useState } from 'react';
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

type Layer = { key: number; theme: Theme; visible: boolean };

type Props = { theme: Theme };

// Static gradient background with a couple of slow-floating soft orbs only.
// When the level (and therefore the theme) changes, the outgoing gradient
// fades into the new one over a second instead of snapping.
export default function AnimatedBackground({ theme }: Props) {
  // Orbs are generated once per mount; positions stay stable so the
  // background never "jumps" while the player is mid-swipe.
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

  const [layers, setLayers] = useState<Layer[]>([{ key: 0, theme, visible: true }]);
  const nextKey = useRef(1);

  // Stack the new gradient on top, hidden; the next frame fades it in over
  // the old one (mounting it visible directly would skip the transition).
  useEffect(() => {
    setLayers((prev) => {
      if (prev[prev.length - 1].theme === theme) return prev;
      return [...prev.slice(-1), { key: nextKey.current++, theme, visible: false }];
    });
  }, [theme]);

  useEffect(() => {
    const top = layers[layers.length - 1];
    if (!top || top.visible) return;
    const raf = requestAnimationFrame(() =>
      setLayers((prev) =>
        prev.map((l) => (l.key === top.key ? { ...l, visible: true } : l)),
      ),
    );
    return () => cancelAnimationFrame(raf);
  }, [layers]);

  // Drop the old layer once its fade is done.
  useEffect(() => {
    if (layers.length < 2) return;
    const t = window.setTimeout(() => {
      setLayers((prev) => (prev.length > 1 ? prev.slice(1) : prev));
    }, 1200);
    return () => window.clearTimeout(t);
  }, [layers]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Gradient layers, crossfading on theme change */}
      {layers.map((l) => (
        <div
          key={l.key}
          className={[
            'absolute inset-0 transition-opacity duration-1000 ease-in-out',
            l.visible ? 'opacity-100' : 'opacity-0',
          ].join(' ')}
          style={{
            backgroundImage: `linear-gradient(160deg, ${l.theme.bgFrom}, ${l.theme.bgVia} 50%, ${l.theme.bgTo})`,
          }}
        />
      ))}

      {/* Just 3 very slow, very soft orbs for subtle life */}
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
