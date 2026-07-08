-- Adds the T40/T20 `format` dimension to every season-scoped table so each
-- format keeps its own books (transactions, members, custom categories, forecast).
--
-- Run this ONCE in the Supabase SQL editor before deploying the format switcher.
-- Existing rows are backfilled to 'T40' (everything tracked so far has been T40).

alter table public.transactions      add column if not exists format text not null default 'T40';
alter table public.members           add column if not exists format text not null default 'T40';
alter table public.events            add column if not exists format text not null default 'T40';
alter table public.custom_categories add column if not exists format text not null default 'T40';
alter table public.forecast_settings add column if not exists format text not null default 'T40';

-- forecast_settings previously held one row per year. It must now allow one row
-- per (year, format), and the app upserts with onConflict = "year,format".
-- Drop any year-only uniqueness, then add the composite unique key.
alter table public.forecast_settings drop constraint if exists forecast_settings_pkey;
alter table public.forecast_settings drop constraint if exists forecast_settings_year_key;
create unique index if not exists forecast_settings_year_format_key
  on public.forecast_settings (year, format);
