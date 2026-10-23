import { useCallback, useEffect, useRef, useState } from 'react';
import type { Theme } from '@/game/themes';

type Props = {
  letters: string[];
  used: boolean[];
  onPick: (index: number) => void;
  onUndo: () => void;
  onSwipeEnd: () => void;
  theme: Theme;
  // Changes whenever a fresh set of letters arrives; triggers the cascade-in.
  entranceId: number;
};

type Pt = { x: number; y: number };

export default function LetterCircle({
  letters,
  used,
  onPick,
  onUndo,
  onSwipeEnd,
  theme,
  entranceId,
}: Props) {
  const n = letters.length;
  const containerRef = useRef<HTMLDivElement>(null);
  const swipingRef = useRef(false);
  const pickedRef = useRef<number[]>([]);

  // Render state for the glowing trace line (mirrors App's picked order).
  const [path, setPath] = useState<number[]>([]);
  const [cursor, setCursor] = useState<Pt | null>(null);

  // Cascade-in plays once per entranceId, then disables itself so toggling
  // used/traced states mid-word never replays the entrance.
  const [entranceActive, setEntranceActive] = useState(false);
  useEffect(() => {
    if (entranceId === 0) return;
    setEntranceActive(true);
    const t = window.setTimeout(
      () => setEntranceActive(false),
      420 + letters.length * 45 + 120,
    );
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entranceId]);

  // RAF throttle for cursor updates — avoids re-rendering on every
  // pointermove event (which can fire 100+ times/sec) and prevents
  // the whole component tree from churning during a swipe.
  const rafRef = useRef<number | null>(null);
  const pendingCursorRef = useRef<Pt | null>(null);

  const flushCursor = useCallback(() => {
    rafRef.current = null;
    setCursor(pendingCursorRef.current);
  }, []);

  const scheduleCursorUpdate = useCallback((pt: Pt | null) => {
    pendingCursorRef.current = pt;
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(flushCursor);
    }
  }, [flushCursor]);

  const centers: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    centers.push({
      x: 50 + 34 * Math.cos(angle),
      y: 50 + 34 * Math.sin(angle),
    });
  }

  function hitTest(px: number, py: number): number {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return -1;
    let best = -1;
    let bestDist = Infinity;
    for (let i = 0; i < centers.length; i++) {
      const dx = (centers[i].x / 100) * rect.width - (px / 100) * rect.width;
      const dy = (centers[i].y / 100) * rect.height - (py / 100) * rect.height;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    // Tile diameter is 16% of the container height; add slack for fingers.
    const radius = rect.height * (0.08 + 0.04);
    return bestDist <= radius ? best : -1;
  }

  function pointToPct(e: React.PointerEvent): Pt | null {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return null;
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    };
  }

  function onPointerDown(e: React.PointerEvent) {
    const pt = pointToPct(e);
    if (!pt) return;
    const idx = hitTest(pt.x, pt.y);
    if (idx === -1) return;
    swipingRef.current = true;
    pickedRef.current = [idx];
    setPath([idx]);
    setCursor(centers[idx]);
    onPick(idx);
    containerRef.current?.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!swipingRef.current) return;
    const pt = pointToPct(e);
    if (!pt) return;
    scheduleCursorUpdate(pt);
    const idx = hitTest(pt.x, pt.y);
    if (idx === -1) return;
    const picked = pickedRef.current;
    // Retracing over the previous letter undoes it (standard swipe UX).
    if (picked.length >= 2 && idx === picked[picked.length - 2]) {
      pickedRef.current = picked.slice(0, -1);
      setPath(pickedRef.current);
      onUndo();
      return;
    }
    if (picked.includes(idx) || used[idx]) return;
    pickedRef.current = [...picked, idx];
    setPath(pickedRef.current);
    onPick(idx);
  }

  function onPointerUp() {
    if (!swipingRef.current) return;
    swipingRef.current = false;
    pickedRef.current = [];
    setPath([]);
    setCursor(null);
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    onSwipeEnd();
  }

  // Build the trace polyline: centers of picked letters + live finger point.
  const points = path.map((i) => centers[i]);
  if (cursor && path.length > 0) points.push(cursor);
  const linePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
  return (
    <div
      ref={containerRef}
      className="relative mx-auto aspect-square h-full max-h-full w-auto max-w-full touch-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div
        className="absolute inset-[10%] rounded-full ring-1"
        style={{
          backgroundColor: 'rgba(255,255,255,0.05)',
          ['--tw-ring-color' as string]: 'rgba(255,255,255,0.1)',
        }}
      />

      {/* Glowing connection trace (drawn beneath the tiles) */}
      {path.length > 0 && (
        <svg
          className="pointer-events-none absolute inset-0 z-[5] h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* Wide soft glow */}
          <polyline
            points={linePoints}
            fill="none"
            stroke={theme.accentSoft}
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.28}
            style={{ filter: `drop-shadow(0 0 3px ${theme.accentSoft})` }}
          />
          {/* Bright core line */}
          <polyline
            points={linePoints}
            fill="none"
            stroke={theme.accent}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.95}
            style={{ filter: `drop-shadow(0 0 2px ${theme.accent})` }}
          />
        </svg>
      )}

      <div className="pointer-events-none absolute inset-0 rounded-full">
        {letters.map((ch, i) => {
          const x = centers[i].x;
          const y = centers[i].y;
          const isUsed = used[i];
          const isTraced = path.includes(i);
          const styleProps: React.CSSProperties = {
            left: `${x}%`,
            top: `${y}%`,
            transform: `translate(-50%, -50%) scale(${isTraced ? 1.12 : 1})`,
            backgroundImage: isUsed
              ? undefined
              : `linear-gradient(to bottom, #ffffff, ${theme.accentSoft}33)`,
            color: isUsed ? undefined : theme.bgVia,
            boxShadow: isTraced
              ? `0 0 18px ${theme.accentSoft}, 0 0 34px ${theme.accentSoft}88, 0 6px 16px rgba(0,0,0,0.35)`
              : undefined,
            ['--tw-ring-color' as string]: isTraced
              ? theme.accent
              : isUsed
                ? 'rgba(255,255,255,0.05)'
                : 'rgba(255,255,255,0.6)',
          };
          return (
            <div
              key={entranceId ? `${entranceId}-${i}` : `${ch}-${i}`}
              className={[
                'absolute flex aspect-square h-[16%] items-center justify-center rounded-full text-[clamp(1rem,4.4vh,1.5rem)] font-extrabold transition-all duration-150 select-none z-10',
                entranceActive && entranceId && !isUsed ? 'animate-tile-in' : '',
                isUsed
                  ? 'scale-90 bg-white/5 text-white/20 ring-1'
                  : isTraced
                    ? 'bg-white ring-2'
                    : 'shadow-xl shadow-black/30 ring-1',
              ].join(' ')}
              style={{
                ...styleProps,
                ...(entranceActive && entranceId && !isUsed
                  ? { animationDelay: `${i * 45}ms` }
                  : {}),
              }}
            >
              {ch}
            </div>
          );
        })}
      </div>
    </div>
  );
}
