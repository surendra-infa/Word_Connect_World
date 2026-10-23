import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

const LETTERS = [
  { src: '/letter-w-amber.webp', alt: 'W' },
  { src: '/letter-c-teal.webp', alt: 'C' },
  { src: '/letter-w-green.webp', alt: 'W' },
];

// 3D animated WCW letters (image glyphs): staggered drop-in on mount,
// endless breathing idle, spring reaction on tap, and a slight rock driven
// by device tilt.
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
            <img className="logo-glyph" src={l.src} alt={l.alt} draggable={false} />
          </span>
        </span>
      ))}
    </div>
  );
}
