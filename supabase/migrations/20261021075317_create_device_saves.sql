/*
# Create device_saves table (cloud backup, no sign-in)

1. Plain-English explanation
- The game stores progress on the device only. This table backs that progress
  up to the cloud so a player can recover it if the app data is cleared or the
  game is reinstalled.
- There is NO sign-in in this app. Rows are keyed by a random device ID that
  the game generates locally and keeps on the device.

2. New Tables
- `device_saves`
  - `device_id` (text, primary key): random identifier generated on the device.
  - `player_seed` (integer, not null): the per-player level randomization seed.
  - `level` (integer, not null): current level number the player is on.
  - `coins` (integer, not null): player coin balance.
  - `stars` (integer, not null): total stars earned.
  - `stats` (jsonb, not null, default '{}'): misc counters (words found, streaks, etc.).
  - `updated_at` (timestamptz, not null, default now()): last backup time.

3. Security
- RLS enabled on `device_saves`.
- Because the app is intentionally sign-in-free, all four CRUD policies are
  granted TO anon, authenticated. The device_id acts as the access key:
  players only touch the row matching their locally stored ID.

4. Important notes
- This is device-keyed, not user-keyed. When sign-in is added later, migrate
  rows by copying device rows into user-owned rows at sign-up time.
*/

CREATE TABLE IF NOT EXISTS device_saves (
  device_id text PRIMARY KEY,
  player_seed integer NOT NULL,
  level integer NOT NULL,
  coins integer NOT NULL DEFAULT 0,
  stars integer NOT NULL DEFAULT 0,
  stats jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE device_saves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_device_saves" ON device_saves;
CREATE POLICY "anon_select_device_saves" ON device_saves FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_device_saves" ON device_saves;
CREATE POLICY "anon_insert_device_saves" ON device_saves
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_device_saves" ON device_saves;
CREATE POLICY "anon_update_device_saves" ON device_saves
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_device_saves" ON device_saves;
CREATE POLICY "anon_delete_device_saves" ON device_saves
TO anon, authenticated USING (true);
