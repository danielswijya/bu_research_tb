import requests
from dotenv import load_dotenv
import os
import json

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_API_KEY = os.getenv("SUPABASE_API_KEY")

def insert_row(data):
    url = f"{SUPABASE_URL}/rest/v1/fake_recommendations"

    headers = {
        "apikey": SUPABASE_API_KEY,
        "Authorization": f"Bearer {SUPABASE_API_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

    response = requests.post(url, headers=headers, json=data)

    if response.status_code == 201:
        print("✅ Inserted:", response.json())
    else:
        print("❌ Failed:", response.status_code, response.text)
        
        

def insert_zones(data_list):
    url = f"{SUPABASE_URL}/rest/v1/zones" 
    headers = {
        "apikey": SUPABASE_API_KEY,
        "Authorization": f"Bearer {SUPABASE_API_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

    response = requests.post(url, headers=headers, json=data_list)

    if response.status_code in [200, 201]:
        print("✅ Bulk insert successful:", response.json())
    else:
        print("❌ Bulk insert failed:", response.status_code, response.text)


def parse_geojson(file_path):
    with open(file_path) as f:
        geojson = json.load(f)

    payload = []
    for feature in geojson["features"]:
        p = feature["properties"]
        if p.get("Zona_ID") and p.get("District") and (p.get("Zone_Nam_1") or p.get("Name")):
            payload.append({
                "zone_id": int(p["Zona_ID"]),
                "zone_name": p.get("Zone_Nam_1") or p.get("Name"),
                "district": p["District"],
                "screened": int(p.get("screened") or 0),
                "priority": None,
                "rank": None
            })
    return payload


if __name__ == "__main__":
    base_dir = os.path.dirname(__file__)
    file_path = os.path.abspath(os.path.join(base_dir, "..", "..", "bu_research_tb", "frontend", "public", "data", "residential_zones.geojson"))

    zones_data = parse_geojson(file_path)
    insert_zones(zones_data)