# /backend/convert_van_locations.py
import geopandas as gpd

input_path = "data/Final_puntos_moviles1.shp"
output_path = "../frontend/public/data/van_locations.geojson"

gdf = gpd.read_file(input_path)
print(gdf.columns)  # optional: see what attributes are in there

gdf.to_file(output_path, driver="GeoJSON")
print("✅ Exported to /frontend/public/data/van_locations.geojson")