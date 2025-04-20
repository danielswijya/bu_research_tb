# /backend/convert_residential_zones.py
import geopandas as gpd

input_path = "data/Combined_residential_zones1.shp"
output_path = "../frontend/public/data/residential_zones.geojson"

gdf = gpd.read_file(input_path)

# Optional: just keep relevant columns
print(gdf.columns)  # See what fields are available
# gdf = gdf[["zone_id", "zone_name", "geometry"]]  # Adjust based on available data

gdf.to_file(output_path, driver="GeoJSON")
print("✅ Exported to /frontend/public/data/residential_zones.geojson")