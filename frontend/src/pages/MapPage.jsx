import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from 'react-leaflet';
import { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import SwipeableEdgeDrawer from '../components/SwipeableEdgeDrawer';

export default function MapPage() {
  const [zoneData, setZoneData] = useState(null);
  const [vanData, setVanData] = useState(null);

  useEffect(() => {
    // Load residential zones
    fetch('/data/residential_zones.geojson')
      .then(res => res.json())
      .then(setZoneData);

    // Load van locations
    fetch('/data/van_locations.geojson')
      .then(res => res.json())
      .then(setVanData);
  }, []);

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative' }}>
      {/* Map Layer */}
      <MapContainer
        center={[-12.05, -77.05]}
        zoom={11}
        style={{
          height: '100%',
          width: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 0
        }}
        attributionControl={false}
      >
        {/* Base tiles */}
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* Residential Zones */}
        {zoneData && (
          <GeoJSON
            data={zoneData}
            onEachFeature={(feature, layer) => {
              const name = feature.properties?.zone_name || 'Unnamed';
              layer.bindPopup(`<strong>${name}</strong>`);
            }}
            style={{
              color: "#3388ff",
              weight: 2,
              fillOpacity: 0.2
            }}
          />
        )}

        {/* Van Locations */}
        {vanData &&
          vanData.features.map((feature, index) => {
            const [lng, lat] = feature.geometry.coordinates;
            const label = feature.properties?.location || `Van #${index + 1}`;

            return (
              <Marker key={index} position={[lat, lng]}>
                <Popup>{label}</Popup>
              </Marker>
            );
          })}
      </MapContainer>

      {/* Swipeable Drawer on top */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        <SwipeableEdgeDrawer />
      </div>
    </div>
  );
}