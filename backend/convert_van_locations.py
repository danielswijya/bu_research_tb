# /backend/convert_van_locations.py
import geopandas as gpd
import os

input_path = "data/Final_puntos_moviles1.shp"
output_path = "../frontend/public/data/van_locations.geojson"

# Confirm file exists
if not os.path.exists(input_path):
    print("❌ Shapefile not found at", input_path)
else:
    gdf = gpd.read_file(input_path)
    print("✅ Shapefile loaded. Columns:", gdf.columns)
    gdf.to_file(output_path, driver="GeoJSON")
    print("✅ Exported to:", output_path)