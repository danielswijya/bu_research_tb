-- EXP3 site recommendations — run once in the Supabase SQL editor.

create table if not exists public.site_recommendations (
  arm_id text primary key,
  location_name text,
  "Zona_name" text,
  "District" text,
  lat double precision,
  lon double precision,
  priority double precision not null,
  rank integer not null,
  updated_at timestamptz not null default now()
);

create index if not exists site_recommendations_rank_idx
  on public.site_recommendations (rank);

create table if not exists public.bandit_state (
  id text primary key default 'default',
  week_t integer not null default 0,
  n_arms integer not null default 0,
  t_horizon integer not null default 100,
  state jsonb not null default '{}'::jsonb,
  arm_id_order text[] not null default '{}',
  processed_ticket_ids text[] not null default '{}',
  last_processed_at timestamptz,
  updated_at timestamptz not null default now()
);

insert into public.bandit_state (id)
values ('default')
on conflict (id) do nothing;

-- Optional: allow anon read of recommendations for the React app
-- (adjust to your RLS policy preferences)
alter table public.site_recommendations enable row level security;
alter table public.bandit_state enable row level security;

drop policy if exists "Allow anon read site_recommendations" on public.site_recommendations;
create policy "Allow anon read site_recommendations"
  on public.site_recommendations for select
  to anon, authenticated
  using (true);

-- Service role / service key bypasses RLS for the Python job writes.
-- If you use the anon key for the job, add insert/update policies carefully.
