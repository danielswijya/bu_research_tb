# Internal Tuberculosis Tracker - Boston University School of Public Health 

A simple, field-friendly app to:

Browse screening sites on a map & a filterable sidebar

Select one or more sites, then confirm how they’ll be screened (Mobile Unit / Backpack)

Create “tickets” for those visits and fill in counts later

Export tickets to CSV

```txt
Supabase (database)
  ├─ filtered_site_data     ← read-only; powers map + sidebar
  ├─ tickets                ← write; selections & visit outcomes (EXP3 reward)
  ├─ site_recommendations   ← EXP3 priority/rank (written by weekly job)
  └─ bandit_state           ← persisted EXP3 weights

frontend (React)
  ├─ Map page (loads filtered_site_data + site_recommendations)
  └─ Sidebar ranks by bandit priority by default (yield toggles still available)

backend (Python)
  ├─ bandit/run_weekly.py   ← EXP3 job (bootstrap + reinforce + publish)
  ├─ ETL helpers (Shapefile → GeoJSON)
  └─ Legacy tests / loaders
```

EXP3 job (optional weekly cron): see [backend/README.md](backend/README.md). Run `bandit/schema.sql` in Supabase once, then:

```bash
python -m backend.bandit.run_weekly --bootstrap-history
python -m backend.bandit.run_weekly
```
## .env API KEYs, Supabase Data Model, Data Structure & Modifications for Database
To consult, kindly look into the Supabase database to look what tables & fields there are. 

It is <strong>essential</strong> to check with that have the SUPABASE KEY & SUPABASE URL as ` VITE_SUPABASE_URL ` & ` VITE_SUPABASE_KEY `


## Data Flow 
Map page fetches rows from `filtered_site_data`, normalizes fields, and passes `siteData` to the right-hand sidebar.

In the sidebar, you filter by method/district/name/yield and select entries.

Click Confirm Selection → EntryConfirmationDialog looks up recent history and lets you pick Mobile Unit / Backpack (existing or new).

On confirm, the sidebar inserts rows into `tickets`.

Tickets table lists those rows, you edit counts and save, then export CSV.

# Quickstart
    

1. **Root**
    ```bash
        python -m venv .venv
        source .venv/bin/activate   # Windows: .venv\Scripts\activate
        pip install -r requirements.txt
    ```

2. **Frontend**
    1.  Set env in `frontend` directory
        ```ini
        VITE_SUPABASE_URL = YOUR_URL
        VITE_SUPABASE_KEY = YOUR_ANON_KEY
        ```
    2. Install & Run
        ```bash
        npm i 
        npm run dev
        ```

