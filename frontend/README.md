# Frontend (React) — TB Tracker

A lightweight React UI that shows a Leaflet map, a filterable right‑hand sidebar, a confirmation dialog, and a tickets table. This guide hopefully explains how the pieces connect and what each file does.

---

## Quick Start

```bash
cd frontend
npm i
npm run dev
```

**Environment (Vite):** create `frontend/.env` with:

```ini
VITE_SUPABASE_URL=YOUR_URL
VITE_SUPABASE_KEY=YOUR_ANON_KEY
```

**Supabase client:** `src/lib/supabaseClient.js`

```js
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**Leaflet styles:** add once (e.g., in `src/main.jsx`):

```js
import 'leaflet/dist/leaflet.css';
```

**Zone lookup file:** place at `public/data/residential_zones.geojson` with properties `Zona_ID` (number) and `Zone_Nam_1` (string).

---

## Directory Structure (frontend)

```txt
frontend/
  public/
    data/residential_zones.geojson     # required for zone name lookup
  src/
    components/
      AdvancedOptionsDialog.jsx        # advanced filters modal
      EntryConfirmationDialog.jsx      # finalize selections → tickets payload
      ExportFunction.jsx               # export tickets to CSV
      MapLegend.jsx                    # Leaflet legend control (optional)
      ScreeningMethodBadge.jsx         # method icons (Mobile / Backpack)
      SidebarFilterControls.jsx        # filter UI (methods, districts, yield, tokens)
      SwipeableEdgeDrawer.jsx          # main sidebar list + selection flow
      TicketsTable.jsx                 # view/edit/save/delete tickets
      ZoneListByDistrict.jsx           # legacy (see below)
    lib/
      supabaseClient.js                # Supabase client (uses Vite env vars)
    pages/
      MapPage.jsx                      # fetch & normalize site data, render map + sidebar
      Tickets.jsx                      # wrapper to render TicketsTable (optional)
```

---

## Data Flow (Frontend)

1. **MapPage** fetches from `filtered_site_data` and **normalizes** records to the shape the sidebar expects.
2. **SwipeableEdgeDrawer** receives `siteData`, renders a list with filters, and handles selection.
3. On **Confirm Selection**, **EntryConfirmationDialog** looks up historical rows and returns a clean payload.
4. **SwipeableEdgeDrawer** inserts confirmed rows into `tickets`.
5. **TicketsTable** shows/edit/saves `tickets`; **ExportFunction** exports CSV.

---

## Contract: `siteData` items expected by the sidebar

Each element in the `siteData` array passed to `SwipeableEdgeDrawer` should have:

| Field             | Type          | Source/Notes                                                                    |          |         |            |
| ----------------- | ------------- | ------------------------------------------------------------------------------- | -------- | ------- | ---------- |
| `Date`            | string        | from `filtered_site_data.Date` (text). Prefer `YYYY-MM-DD` for stable sorting.  |          |         |            |
| `location_name`   | string        | from DB.                                                                        |          |         |            |
| `District`        | string        | from DB.                                                                        |          |         |            |
| `Zona_ID`         | string/number | from DB (sidebar treats as string; ID lookup uses `residential_zones.geojson`). |          |         |            |
| `Zona_name`       | string        | from DB.                                                                        |          |         |            |
| `lat`             | number        | parseFloat of `filtered_site_data.lat`.                                         |          |         |            |
| `lon`             | number        | parseFloat of `filtered_site_data.lon`.                                         |          |         |            |
| `total_screened`  | number        | from `n_screened`.                                                              |          |         |            |
| `total_diagnosed` | number        | from `n_diagnosed`.                                                             |          |         |            |
| `methods`         | string\[]     | split `Screening_performed_by` by comma → trim → filter out `'NA'`.             |          |         |            |
| `markerKey`       | string        | a **stable unique id**, e.g., \`\${location}                                    | \${zona} | \${lat} | \${lon}\`. |

**Example transform (MapPage):**

```js
const { data, error } = await supabase
  .from('filtered_site_data')
  .select('Date, location_name, District, Zona_ID, Zona_name, Screening_performed_by, lat, lon, n_screened, n_diagnosed');

const siteData = (data ?? []).map(r => ({
  ...r,
  lat: parseFloat(r.lat),
  lon: parseFloat(r.lon),
  total_screened: Number(r.n_screened ?? 0),
  total_diagnosed: Number(r.n_diagnosed ?? 0),
  methods: typeof r.Screening_performed_by === 'string'
    ? r.Screening_performed_by.split(',').map(s => s.trim()).filter(s => s && s.toLowerCase() !== 'na')
    : [],
  markerKey: `${(r.location_name||'').toLowerCase()}|${(r.Zona_name||'').toLowerCase()}|${r.lat}|${r.lon}`,
}));
```

---

## Components

### 1) `SwipeableEdgeDrawer.jsx` (sidebar)

* **Inputs:**

  * `siteData` (array of normalized items above)
  * `onFilter` (optional callback when list changes)
  * `selectedScreeningIds`, `setSelectedScreeningIds` (array + setter)
  * `selectedMarkerKey`, `setSelectedMarkerKey`, `setHighlightedMarkerKey`
* **What it does:**

  * Loads `public/data/residential_zones.geojson` to map `Zona_ID → Zone_Nam_1`.
  * Deduplicates multiple records per location, keeping the **latest** by `Date`.
  * Applies filters: method types, district tokens, name tokens, **yield range**.
  * Renders cards with method badges, counts, yield %, and date.
  * Opens **EntryConfirmationDialog** and, on confirm, inserts tickets.
* **Filters state shape:**

  ```js
  {
    selectedTypes: [],
    rankByScreened: false,
    rankByDiagnosed: false,
    rankByYield: false,
    yieldRange: [0, 100],       
    nameTokens: [],
    zonaIdTokens: [],
    locationIdTokens: [],
    districtTokens: [],
  }
  ```

  **Action needed:** in this file, change `yieldRange` default to `[0, 3]` to match the slider max in `SidebarFilterControls.jsx`.

### 2) `SidebarFilterControls.jsx`

* **Inputs:** `filters`, `setFilters`, `availableSiteTypes`, `availableDistricts`.
* **What it does:**

  * Method checkboxes → updates `selectedTypes`.
  * Chips for active filters (methods, names, districts).
  * Toggles for ranking (screened, diagnosed, yield).
  * **Yield slider:** `min=0`, `max=3`, `step=0.01` (displays as `%`).
  * **Advanced Filters** button opens `AdvancedOptionsDialog`.

### 3) `AdvancedOptionsDialog.jsx`

* **Inputs:** `open`, `onClose`, `initialNameTokens`, `initialDistrictTokens`, `onApplyFilters`, `availableDistricts`.
* **What it does:** Adds/removes **Zone Name tokens** and **District(s)**; returns selected tokens to parent.

### 4) `EntryConfirmationDialog.jsx`

* **Inputs:** `open`, `onClose`, `selectedEntries`, `onConfirmSelection`.
* **What it does:** For each selected entry:

  * Looks up historical rows in `filtered_site_data`.
  * Finds latest Mobile Unit / Backpack entries (skips `NA`).
  * Lets the user pick **Existing** or **New** method.
  * Returns a clean payload to parent → parent inserts rows into `tickets`.

### 5) `TicketsTable.jsx`

* **Inputs:** `tickets`, `onSave(updated)`, `onDelete(id)`, `onChange(index, field, value)`.
* **What it does:**

  * Sorts by `selected_date` (newest first), paginates.
  * Edits `screened_count` / `positive_count`; sets `saved=true` on Save.
  * Filter by status (Saved / Incomplete).

**Sample wrapper functions:**

```js
// Save
const onSave = async (updated) => {
  const { error } = await supabase
    .from('tickets')
    .update({
      screened_count: updated.screened_count,
      positive_count: updated.positive_count,
      saved: true,
    })
    .eq('id', updated.id);
  if (error) console.error(error);
};

// Delete
const onDelete = async (id) => {
  const { error } = await supabase.from('tickets').delete().eq('id', id);
  if (error) console.error(error);
};

// OnChange for inputs
const onChange = (idx, field, value) => {
  setTickets((rows) => {
    const next = [...rows];
    next[idx] = { ...next[idx], [field]: value };
    return next;
  });
};
```

### 6) `ExportFunction.jsx`

* **What it does:** Fetches all `tickets` via Supabase, uses Papa Parse to create a CSV, and triggers a browser download.

### 7) `ScreeningMethodBadge.jsx`

* **What it does:** Renders small round icons for methods (Mobile Unit / Backpack) detected in the `methods` array.

### 8) `MapLegend.jsx`

* **What it does:** Adds a static legend control to the Leaflet map. Mount inside your `<MapContainer>`.

---

## MapPage: example skeleton

```jsx
import { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { supabase } from '../lib/supabaseClient';
import SwipeableEdgeDrawer from '../components/SwipeableEdgeDrawer';

export default function MapPage() {
  const [siteData, setSiteData] = useState([]);
  const [selectedScreeningIds, setSelectedScreeningIds] = useState([]);
  const [selectedMarkerKey, setSelectedMarkerKey] = useState(null);
  const [highlightedMarkerKey, setHighlightedMarkerKey] = useState(null);
  const markerRefs = useRef({});

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('filtered_site_data')
        .select('Date, location_name, District, Zona_ID, Zona_name, Screening_performed_by, lat, lon, n_screened, n_diagnosed');
      if (error) { console.error(error); return; }
      const normalized = (data ?? []).map(r => ({
        ...r,
        lat: parseFloat(r.lat),
        lon: parseFloat(r.lon),
        total_screened: Number(r.n_screened ?? 0),
        total_diagnosed: Number(r.n_diagnosed ?? 0),
        methods: typeof r.Screening_performed_by === 'string'
          ? r.Screening_performed_by.split(',').map(s => s.trim()).filter(s => s && s.toLowerCase() !== 'na')
          : [],
        markerKey: `${(r.location_name||'').toLowerCase()}|${(r.Zona_name||'').toLowerCase()}|${r.lat}|${r.lon}`,
      }));
      setSiteData(normalized);
    })();
  }, []);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', height: '100vh' }}>
      <MapContainer center={[-11.95, -77.05]} zoom={12} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {siteData.map(site => (
          <Marker key={site.markerKey} position={[site.lat, site.lon]} ref={ref => { if (ref) markerRefs.current[site.markerKey] = ref; }}>
            <Popup>
              <strong>{site.location_name}</strong><br />
              Zona: {site.Zona_name}<br />
              Yield: {site.total_screened > 0 ? ((site.total_diagnosed/site.total_screened)*100).toFixed(2) : '0.00'}%
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <SwipeableEdgeDrawer
        siteData={siteData}
        onFilter={() => {}}
        selectedScreeningIds={selectedScreeningIds}
        setSelectedScreeningIds={setSelectedScreeningIds}
        selectedMarkerKey={selectedMarkerKey}
        setSelectedMarkerKey={setSelectedMarkerKey}
        setHighlightedMarkerKey={setHighlightedMarkerKey}
      />
    </div>
  );
}
```

---

## Known Pitfalls & Fixes

* **Env vars location**: Vite reads from `frontend/.env`. If you place them at the repo root, configure `envDir` or they won’t be found.

* **`yieldRange`**\*\* default\*\*: In `SwipeableEdgeDrawer.jsx`, default is `[0,100]` but the slider max is 3. 
* **Date parsing**: `Date` is a text column. Prefer `YYYY-MM-DD` strings and when comparing dates, use `new Date(DateString)` defensively.
* **Leaflet markers not showing**: ensure `import 'leaflet/dist/leaflet.css'` is included once, and the map container has a fixed height.
* **Supabase client path**: Many components import via `../../lib/supabaseClient`. Ensure the file path exists exactly (or adjust imports consistently).
* **Long titles overlapping buttons**: card text should use `wordBreak: 'break-word', whiteSpace: 'normal', mr: 3` (already set in the sidebar cards).

---

---

## FAQ

**Where do I change colors/spacing?**  In component `sx` props. All components use MUI; feel free to tweak.

**Can I add a new filter?**  Yes—extend `filters` in the sidebar and add a control in `SidebarFilterControls.jsx`; then include it in the filter predicate in `SwipeableEdgeDrawer.jsx`.

**How do I add a new map layer?**  Convert the source to GeoJSON (using backend ETL if needed), drop it in `public/data/`, and load it with Leaflet as a new layer.
