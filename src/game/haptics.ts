// Haptic feedback via the web Vibration API (works in the Capacitor Android
// WebView; the VIBRATE permission is already in the manifest). Browsers and
// iOS silently ignore it, so every call is safe everywhere.
type Pattern = number | number[];

function vibrate(pattern: Pattern) {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    // Haptics are enhancement only; never break gameplay.
  }
}

/** Soft tick when a letter is picked (one per pick, never in loops). */
export function hapticTick() {
  vibrate(8);
}

/** Light tap when a word lands or a hint reveals. */
export function hapticLight() {
  vibrate(14);
}

/** Double-tap error for a wrong or too-short word. */
export function hapticError() {
  vibrate([18, 60, 18]);
}

/** Rising success buzz for level complete / daily bonus claim. */
export function hapticSuccess() {
  vibrate([20, 70, 20, 70, 40]);
}
