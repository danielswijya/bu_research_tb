# Backend (Python helpers) — TB Tracker

This folder contains **early iteration** of the Python tools for data prep and imports, more specifically for the Shapefiles & GEOJson. The React app can run without these, but they are useful when you need to:

- **Convert Shapefiles → GeoJSON for map layers** 

- **Import or update filtered_site_data rows safely** 

- **Do quick database checks or one‑off maintenance** 

```txt
backend/ 
    data/                   #These are Shapefiles and relating files of Shapefiles given from Researcher

    convert_amd3.py         #This was used to export the Shapefiles of van_locations into a JSON format for the map

    convert_van_locations.py    #This is similar copy for the van_locations Shapefile -> GeoJson

    main.py                #This was a legacy Postgres test (feel free to change if you'd like)

    supabase_insert.py         #This is a legacy example of a REST insert to old tables
```