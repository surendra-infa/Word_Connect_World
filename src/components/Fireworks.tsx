import { useEffect, useMemo, useState } from 'react';

type Particle = {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  color: string;
  size: number;
};

const COLORS = ['#fcd34d', '#f87171', '#6ee7b7', '#7dd3fc', '#f472b6', '#fb923c', '#a78bfa'];

type Burst = { id: number; x: number; y: number; particles: Particle[] };

function makeBurst(id: number, x: number, y: number): Burst {
  const count = 22;
  const particles: Particle[] = [];
  const color = COLORS[id % COLORS.length];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.2;
    const speed = 60 + Math.random() * 50;
    particles.push({
      id,
      x,
      y,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      color,
      size: 4 + Math.random() * 4,
    });
  }
  return { id, x, y, particles };
}

export default function Fireworks() {
  const [bursts, setBursts] = useState<Burst[]>([]);

  useEffect(() => {
    let idCounter = 0;
    const timers: number[] = [];

    function fire() {
      const x = 15 + Math.random() * 70;
      const y = 12 + Math.random() * 45;
      const id = idCounter++;
      setBursts((prev) => [...prev, makeBurst(id, x, y)]);
      timers.push(
        window.setTimeout(() => {
          setBursts((prev) => prev.filter((b) => b.id !== id));
        }, 1500),
      );
    }

    fire();
    timers.push(window.setTimeout(fire, 350));
    timers.push(window.setTimeout(fire, 750));
    timers.push(window.setTimeout(fire, 1100));
    timers.push(window.setTimeout(fire, 1500));
    timers.push(window.setTimeout(fire, 1900));

    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

  const flash = useMemo(() => ({ opacity: 1 }), []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {bursts.map((burst) => (
        <div key={burst.id} className="absolute" style={{ left: `${burst.x}%`, top: `${burst.y}%` }}>
          {burst.particles.map((p, i) => (
            <span
              key={i}
              className="firework-particle"
              style={
                {
                  '--fw-dx': `${p.dx}px`,
                  '--fw-dy': `${p.dy}px`,
                  '--fw-size': `${p.size}px`,
                  backgroundColor: p.color,
                  boxShadow: `0 0 8px ${p.color}`,
                  width: p.size,
                  height: p.size,
                  opacity: flash.opacity,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      ))}
    </div>
  );
}
