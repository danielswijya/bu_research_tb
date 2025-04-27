import requests
from config import SUPABASE_URL, SUPABASE_API_KEY

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