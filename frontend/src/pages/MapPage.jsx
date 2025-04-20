import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import SwipeableEdgeDrawer from '../components/SwipeableEdgeDrawer';

export default function MapPage() {
  const [geoData, setGeoData] = useState(null);

  useEffect(() => {
    fetch('/data/residential_zones.geojson')
      .then(res => res.json())
      .then(setGeoData);
  }, []);

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative' }}>
      {/* Map as background */}
      <MapContainer
        center={[-12.05, -77.05]}
        zoom={11}
        style={{
          height: '100%',
          width: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 0,
        }}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {geoData && (
          <GeoJSON
            data={geoData}
            onEachFeature={(feature, layer) => {
              const name = feature.properties?.zone_name || 'Unnamed';
              layer.bindPopup(`<strong>${name}</strong>`);
            }}
            style={{
              color: "#3388ff",
              weight: 2,
              fillOpacity: 0.2,
            }}
          />
        )}
      </MapContainer>

      {/* Drawer on top of the map */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        <SwipeableEdgeDrawer />
      </div>
    </div>
  );
}