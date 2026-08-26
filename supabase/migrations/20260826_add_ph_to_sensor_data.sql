-- Node 2 memakai sensor pH tanah, sedangkan Node 1 tetap memakai soil_moisture.
-- Jalankan migrasi ini pada database Supabase yang sudah ada sebelum deploy web.
alter table if exists public.sensor_data
  add column if not exists ph numeric(4, 2);

comment on column public.sensor_data.ph is 'Pembacaan pH tanah dari Wemos Node 2.';
