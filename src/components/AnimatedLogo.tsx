import { useEffect, useRef, useState } from 'react';

// Full WCW 3D logo. Idle: subtle breathing. Tap: spring bounce.
// Removed device-tilt listener — it caused the logo to jitter during
// gameplay because phone sensor events fire continuously while swiping.
export default function AnimatedLogo() {
  const [tapped, setTapped] = useState(false);
  const tapTimer = useRef<number | null>(null);

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
      onPointerDown={onTap}
      role="img"
      aria-label="Word Connect World"
    >
      <span className="logo-letter">
        <span className="logo-bob">
          <img
            className="logo-glyph"
            src="/wcw-logo-3d-full.webp"
            alt="WCW"
            draggable={false}
          />
        </span>
      </span>
    </div>
  );
}
