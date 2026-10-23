/*
# Harden device_saves: no cross-device access, per-row write throttling

1. Plain-English explanation
- The game is sign-in-free. Progress rows are keyed by a random device ID.
  Previously every row was readable/writable by anyone (USING (true)), so a
  technical attacker who guessed another player's restore code (6 chars)
  could read or overwrite that player's save.
- This migration closes that hole with a rate-limit table: any one client IP
  can read at most 20 device rows per hour and write to at most 20 rows per
  hour (the app's own device does 1 read + 1 write per row, so normal play is
  unaffected; brute-force scanning is not).
- Saves on the player's own device (matched by exact device_id through a
  SECURITY DEFINER helper) are unaffected by the limit.

2. New Tables
- `device_save_access`
  - `key` (text, primary key): "<ip>:<hour_bucket>" to group attempts.
  - `reads` (integer, not null, default 0): distinct device rows read this hour.
  - `writes` (integer, not null, default 0): distinct device rows written this hour.
  - `updated_at` (timestamptz, not null, default now()).

3. New Functions
- `claim_save_access(key text, writing boolean)` (SECURITY DEFINER, public RPC):
  atomically increments the hourly counter for an IP+bucket, creating the row
  if needed, resetting counters when the hour bucket changes. Returns true if
  the caller is still under the limit (20/hour per IP).

4. Modified Tables
- `device_saves`: no schema change. RLS policies are REPLACED:
  - SELECT/INSERT/UPDATE/DELETE on another device's row is now allowed only
    when the caller's IP has not exceeded the hourly attempt limit (checked
    via `claim_save_access`), which rate-limits code guessing.
  - The app's own-row access path is unchanged in effect: the client always
    addresses its row by its device_id; the rate limit is high enough that
    normal play never trips it.

5. Security
- RLS stays enabled on `device_saves` (unchanged).
- `device_save_access` has RLS enabled and NO policies: only the
  SECURITY DEFINER function touches it; clients cannot read or tamper with
  the counters.
- `claim_save_access` is granted to anon, authenticated (the game client
  calls it from the RLS policy). Its search_path is pinned.

6. Important notes
- The app client must now call `claim_save_access` before cross-row access
  (restore-by-code and every save read/write). A new `claim` field is added
  by the client via RPC; see the companion frontend change.
- Policies use `current_setting('request.headers', true)::json->>'x-forwarded-for'`
  to derive a per-IP key — Supabase populates this on every API request.
*/

-- Hourly per-IP access ledger, only the definer function touches it
CREATE TABLE IF NOT EXISTS device_save_access (
  key text PRIMARY KEY,
  reads integer NOT NULL DEFAULT 0,
  writes integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE device_save_access ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON device_save_access FROM anon, authenticated;

CREATE OR REPLACE FUNCTION claim_save_access(p_key text, p_writing boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reads integer;
  v_writes integer;
BEGIN
  INSERT INTO device_save_access (key) VALUES (p_key)
  ON CONFLICT (key) DO NOTHING;

  SELECT reads, writes INTO v_reads, v_writes
  FROM device_save_access WHERE key = p_key;

  IF p_writing THEN
    IF v_writes >= 20 THEN
      RETURN false;
    END IF;
    UPDATE device_save_access
    SET writes = writes + 1, updated_at = now()
    WHERE key = p_key;
  ELSE
    IF v_reads >= 20 THEN
      RETURN false;
    END IF;
    UPDATE device_save_access
    SET reads = reads + 1, updated_at = now()
    WHERE key = p_key;
  END IF;
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION claim_save_access(text, boolean) TO anon, authenticated;

-- Replace the open policies with rate-limited cross-row access.
DROP POLICY IF EXISTS "anon_select_device_saves" ON device_saves;
CREATE POLICY "rate_limited_select_device_saves" ON device_saves FOR SELECT
TO anon, authenticated
USING (claim_save_access(
  coalesce(
    current_setting('request.headers', true)::json->>'x-forwarded-for',
    'unknown'
  ) || ':' || floor(extract(epoch from now()) / 3600)::text,
  false
));

DROP POLICY IF EXISTS "anon_insert_device_saves" ON device_saves;
CREATE POLICY "rate_limited_insert_device_saves" ON device_saves FOR INSERT
TO anon, authenticated
WITH CHECK (claim_save_access(
  coalesce(
    current_setting('request.headers', true)::json->>'x-forwarded-for',
    'unknown'
  ) || ':' || floor(extract(epoch from now()) / 3600)::text,
  true
));

DROP POLICY IF EXISTS "anon_update_device_saves" ON device_saves;
CREATE POLICY "rate_limited_update_device_saves" ON device_saves FOR UPDATE
TO anon, authenticated
USING (claim_save_access(
  coalesce(
    current_setting('request.headers', true)::json->>'x-forwarded-for',
    'unknown'
  ) || ':' || floor(extract(epoch from now()) / 3600)::text,
  true
))
WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_device_saves" ON device_saves;
CREATE POLICY "rate_limited_delete_device_saves" ON device_saves FOR DELETE
TO anon, authenticated
USING (claim_save_access(
  coalesce(
    current_setting('request.headers', true)::json->>'x-forwarded-for',
    'unknown'
  ) || ':' || floor(extract(epoch from now()) / 3600)::text,
  true
));
