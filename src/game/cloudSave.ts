// Device-keyed cloud backup. The game is sign-in free: progress lives in
// localStorage, and a row in the `device_saves` table mirrors it so a cleared
// app data / reinstall on the same device can be recovered via a restore code.
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Cloud backup is optional: if the env vars are missing (e.g. a local build
// without a .env), the game still runs with on-device saving only instead of
// crashing at startup.
const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

const DEVICE_KEY = 'wordlink-device-id';

// The restore code is the last 4 characters of the device id — short and easy
// to type into a settings dialog after reinstalling.
export function getDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = crypto.randomUUID().replace(/-/g, '');
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return 'unknown-device';
  }
}

export function getRestoreCode(): string {
  return getDeviceId().slice(-6).toUpperCase();
}

export type CloudSave = {
  playerSeed: number;
  levelIndex: number;
  score: number;
  coins: number;
  foundByLevel: Record<number, string[]>;
  hintedByLevel: Record<number, string[]>;
};

export async function uploadSave(save: CloudSave): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('device_saves').upsert(
      {
        device_id: getDeviceId(),
        player_seed: save.playerSeed,
        level: save.levelIndex,
        coins: save.coins,
        stars: save.score,
        stats: {
          foundByLevel: save.foundByLevel,
          hintedByLevel: save.hintedByLevel,
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'device_id' },
    );
    return !error;
  } catch {
    return false;
  }
}

export async function downloadSave(): Promise<CloudSave | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('device_saves')
      .select('player_seed, level, coins, stars, stats')
      .eq('device_id', getDeviceId())
      .maybeSingle();
    if (error || !data) return null;
    const stats = (data.stats ?? {}) as {
      foundByLevel?: Record<number, string[]>;
      hintedByLevel?: Record<number, string[]>;
    };
    return {
      playerSeed: data.player_seed,
      levelIndex: data.level,
      score: data.stars,
      coins: data.coins,
      foundByLevel: stats.foundByLevel ?? {},
      hintedByLevel: stats.hintedByLevel ?? {},
    };
  } catch {
    return null;
  }
}

// Restore by code: lets a player recover a save on a fresh install (or a new
// device) by typing the code shown in settings on the original install.
export async function restoreByCode(code: string): Promise<CloudSave | null> {
  if (!supabase) return null;
  const clean = code.trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(clean)) return null;
  try {
    const { data, error } = await supabase
      .from('device_saves')
      .select('device_id, player_seed, level, coins, stars, stats')
      .eq('device_id', getDeviceId().slice(0, -6) + clean)
      .maybeSingle();
    if (error || !data) return null;
    const stats = (data.stats ?? {}) as {
      foundByLevel?: Record<number, string[]>;
      hintedByLevel?: Record<number, string[]>;
    };
    // Adopt the restored save: the entered code becomes this device's id.
    try {
      localStorage.setItem(DEVICE_KEY, data.device_id);
    } catch {
      // ignore
    }
    return {
      playerSeed: data.player_seed,
      levelIndex: data.level,
      score: data.stars,
      coins: data.coins,
      foundByLevel: stats.foundByLevel ?? {},
      hintedByLevel: stats.hintedByLevel ?? {},
    };
  } catch {
    return null;
  }
}
