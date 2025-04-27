import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from 'react-leaflet';
import { useEffect, useState } from 'react';
import { Alert, Collapse } from '@mui/material';
import 'leaflet/dist/leaflet.css';
import SwipeableEdgeDrawer from '../components/SwipeableEdgeDrawer';

export default function MapPage() {
  const [zoneData, setZoneData] = useState(null);
  const [vanData, setVanData] = useState(null);
  const [showAlert, setShowAlert] = useState(false);

  const handleShowAlert = () => {
    setShowAlert(true);
    setTimeout(() => {
      setShowAlert(false);
    }, 3000);
  };

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
      {/* ✨ Alert at top if needed */}
      <div style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}>
        <Collapse in={showAlert} timeout="auto" unmountOnExit>
          <Alert severity="success" sx={{ width: '90vw', maxWidth: 600 }}>
            Confirmed Zipcodes!
          </Alert>
        </Collapse>
      </div>
      
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
        <SwipeableEdgeDrawer onConfirm={handleShowAlert} />
      </div>
    </div>
  );
}