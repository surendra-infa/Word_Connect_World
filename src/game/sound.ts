// Lightweight synthesized sound engine (Web Audio API) — no audio files.
// Sounds: letter tap, word valid, word invalid, hint, level complete fanfare,
// coin payout. Toggle persisted in localStorage.

const SOUND_KEY = 'wordlink-sound-enabled';

let ctx: AudioContext | null = null;
let enabled = (() => {
  try {
    return localStorage.getItem(SOUND_KEY) !== 'off';
  } catch {
    return true;
  }
})();

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export function isSoundEnabled(): boolean {
  return enabled;
}

export function setSoundEnabled(on: boolean) {
  enabled = on;
  try {
    localStorage.setItem(SOUND_KEY, on ? 'on' : 'off');
  } catch {
    // ignore
  }
  if (on) playTap();
}

type ToneOpts = {
  freq: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
  delay?: number;
  slideTo?: number;
};

function tone({ freq, dur, type = 'sine', gain = 0.08, delay = 0, slideTo }: ToneOpts) {
  const c = getCtx();
  if (!c || !enabled) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export function playTap() {
  tone({ freq: 520, dur: 0.07, type: 'triangle', gain: 0.05 });
}

export function playSelect(position = 0) {
  // Pitch rises with each picked letter position for a satisfying swipe.
  const freq = 440 * Math.pow(2, (position % 8) / 12);
  tone({ freq, dur: 0.08, type: 'triangle', gain: 0.05 });
}

export function playValid() {
  tone({ freq: 523.25, dur: 0.12, type: 'triangle', gain: 0.09 });
  tone({ freq: 659.25, dur: 0.12, type: 'triangle', gain: 0.09, delay: 0.09 });
  tone({ freq: 783.99, dur: 0.18, type: 'triangle', gain: 0.09, delay: 0.18 });
}

export function playInvalid() {
  tone({ freq: 220, dur: 0.16, type: 'sawtooth', gain: 0.04, slideTo: 160 });
}

export function playHint() {
  tone({ freq: 880, dur: 0.1, type: 'sine', gain: 0.06 });
  tone({ freq: 1174.66, dur: 0.14, type: 'sine', gain: 0.06, delay: 0.08 });
}

export function playCoin() {
  tone({ freq: 987.77, dur: 0.08, type: 'square', gain: 0.035 });
  tone({ freq: 1318.51, dur: 0.14, type: 'square', gain: 0.035, delay: 0.07 });
}

export function playFanfare() {
  const seq: Array<[number, number]> = [
    [523.25, 0], [659.25, 0.12], [783.99, 0.24],
    [1046.5, 0.36], [783.99, 0.54], [1046.5, 0.66],
  ];
  for (const [f, d] of seq) {
    tone({ freq: f, dur: 0.22, type: 'triangle', gain: 0.09, delay: d });
  }
  // shimmer on top
  tone({ freq: 1567.98, dur: 0.5, type: 'sine', gain: 0.04, delay: 0.78 });
}

export function playStar() {
  tone({ freq: 1318.51, dur: 0.18, type: 'sine', gain: 0.07, delay: 0 });
  tone({ freq: 1760, dur: 0.22, type: 'sine', gain: 0.05, delay: 0.1 });
}
