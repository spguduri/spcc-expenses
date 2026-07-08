-- BUG FIX: forecast settings never persisted.
-- The `anon` role (the key the web app uses) had no privileges on
-- forecast_settings, so every save failed with "permission denied for table"
-- and every load returned null — the form always fell back to defaults.
--
-- This grants anon the same access the other tables already have. Run once in
-- the Supabase SQL editor.

grant select, insert, update, delete on public.forecast_settings to anon, authenticated;

-- Ensure a permissive row-level policy exists (matches the app's open,
-- PIN-gated-on-the-client access model used by the other tables).
alter table public.forecast_settings enable row level security;
drop policy if exists "public access" on public.forecast_settings;
create policy "public access" on public.forecast_settings
  for all to anon, authenticated
  using (true) with check (true);
