import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

const LETTERS = [
  { ch: 'W', from: '#fcd34d', to: '#f59e0b', depth: '#b45309' },
  { ch: 'C', from: '#6ee7b7', to: '#10b981', depth: '#047857' },
  { ch: 'W', from: '#7dd3fc', to: '#0ea5e9', depth: '#0369a1' },
];

// 3D animated WCW letters: staggered drop-in on mount, endless breathing
// idle, spring reaction on tap, and a slight rock driven by device tilt.
export default function AnimatedLogo() {
  const [tapped, setTapped] = useState(false);
  const [tilt, setTilt] = useState(0);
  const tapTimer = useRef<number | null>(null);

  useEffect(() => {
    function onTilt(e: DeviceOrientationEvent) {
      const gamma = e.gamma ?? 0;
      setTilt(Math.max(-1, Math.min(1, gamma / 30)));
    }
    window.addEventListener('deviceorientation', onTilt);
    return () => window.removeEventListener('deviceorientation', onTilt);
  }, []);

  useEffect(() => {
    return () => {
      if (tapTimer.current !== null) window.clearTimeout(tapTimer.current);
    };
  }, []);

  function onTap() {
    setTapped(true);
    if (tapTimer.current !== null) window.clearTimeout(tapTimer.current);
    tapTimer.current = window.setTimeout(() => setTapped(false), 700);
  }

  return (
    <div
      className={`logo-stage${tapped ? ' logo-spring' : ''}`}
      style={{ '--logo-tilt': tilt } as CSSProperties}
      onPointerDown={onTap}
      role="img"
      aria-label="Word Connect World"
    >
      {LETTERS.map((l, i) => (
        <span key={i} className="logo-letter" style={{ animationDelay: `${i * 150}ms` }}>
          <span
            className="logo-bob"
            style={{
              animationDelay: `${650 + i * 280}ms`,
              animationDuration: `${3.2 + i * 0.4}s`,
            }}
          >
            <span
              className="logo-glyph"
              style={
                {
                  color: l.from,
                  textShadow: `0 1px 0 ${l.depth}, 0 2px 0 ${l.depth}, 0 3px 0 ${l.depth}, 0 4px 0 ${l.depth}, 0 6px 10px ${l.depth}99`,
                } as CSSProperties
              }
            >
              {l.ch}
            </span>
          </span>
        </span>
      ))}
    </div>
  );
}
