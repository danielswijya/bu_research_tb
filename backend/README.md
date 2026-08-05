# Backend (Python helpers) — TB Tracker

This folder contains Python tools for data prep, imports, and the **EXP3 site recommendation** job.

```txt
backend/
    bandit/
        exp3.py           # EXP3 algorithm (real outcomes)
        arms.py           # Stable arm_id from location/zona/district
        supabase_io.py    # Read sites/tickets; write ranks + state
        run_weekly.py     # CLI: bootstrap / reinforce / publish ranks
        schema.sql        # Run once in Supabase SQL editor
    copy_of_demo.py       # Research notebook export (LinUCB + toy EXP3)
    convert_*.py          # Shapefile → GeoJSON ETL
    supabase_insert.py    # Legacy REST insert example
    main.py               # Legacy Postgres smoke test
```

## EXP3 recommendations

The React map ranks sites by `site_recommendations.priority` / `rank` produced by this job.
Historical `filtered_site_data` can bootstrap the model; saved `tickets` (`screened_count`, `positive_count`) reinforce it on later runs.

### 1. Create tables

Run [`bandit/schema.sql`](bandit/schema.sql) in the Supabase SQL editor once.

### 2. Env

In the repo root `.env` (or shell):

```ini
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_API_KEY=YOUR_SERVICE_ROLE_OR_KEY_WITH_WRITE_ACCESS
```

The service role key is preferred so the job can upsert `bandit_state` and `site_recommendations` under RLS.

### 3. Run

From the repo root with the venv active:

```bash
# First run — seed from historical visits, then publish ranks
python -m backend.bandit.run_weekly --bootstrap-history

# Later runs — apply new saved ticket outcomes, republish ranks
python -m backend.bandit.run_weekly

# Preview top-10 without writing
python -m backend.bandit.run_weekly --dry-run
```

### 4. Weekly cron (optional)

Linux/macOS crontab example (Mondays 06:00):

```cron
0 6 * * 1 cd /path/to/bu_research_tb && .venv/bin/python -m backend.bandit.run_weekly
```

Windows: Task Scheduler → weekly → same command.

Suggestions do **not** refresh by themselves; the job must run (cron or manual) after the team records ticket counts.

## Other helpers

- **Convert Shapefiles → GeoJSON for map layers**
- **Legacy** `supabase_insert.py` / `main.py` against older recommendation tables
