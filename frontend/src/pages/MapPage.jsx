import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from 'react-leaflet';
import { useEffect, useState } from 'react';
import { Alert, Collapse } from '@mui/material';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../../lib/supabaseClient';

import SidebarSelector from '../components/SwipeableEdgeDrawer';
import DistrictFilter from '../components/DistrictFilter';

export default function MapPage() {
  const [zoneData, setZoneData] = useState(null);
  const [vanData, setVanData] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [neighborhoodStats, setNeighborhoodStats] = useState([]);
  const [siteData, setSiteData] = useState([]);

  const handleShowAlert = () => {
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  useEffect(() => {
    fetch('/data/residential_zones.geojson')
      .then(res => res.json())
      .then(setZoneData);

    fetch('/data/van_locations.geojson')
      .then(res => res.json())
      .then(setVanData);

    const fetchData = async () => {
      const { data: neighborhoods } = await supabase
        .from('neighborhood_stats')
        .select('Zona_ID, Rank, census_population, district');

      const { data: sites } = await supabase
        .from('site_data')
        .select('lon, lat, Zona_ID');

      setNeighborhoodStats(neighborhoods || []);
      setSiteData(sites || []);
    };

    fetchData();
  }, []);

  return (
  <div style={{ height: '100vh', width: '100%', position: 'relative', overflow: 'hidden' }}>
    {/* Top Alert */}
    <div style={{
      position: 'absolute',
      top: 20,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000
    }}>
      <Collapse in={showAlert} timeout="auto" unmountOnExit>
        <Alert severity="success" sx={{ width: '90vw', maxWidth: 600 }}>
          Confirmed screening zones!
        </Alert>
      </Collapse>
    </div>

    {/* District Filter Dropdown */}
    <DistrictFilter value={selectedDistrict} onChange={setSelectedDistrict} />

    {/* Map Layer */}
    <MapContainer
      center={[-12.05, -77.05]}
      zoom={11}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width:'100%',
        height:'100%',
        zIndex: 0,
      }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

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

    {/* Sidebar stays positioned relative (over map) */}
    <div style={{ position: 'relative', zIndex: 10 }}>
      <SidebarSelector onConfirm={handleShowAlert} />
    </div>
  </div>
);
}