import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from 'react-leaflet';
import { useEffect, useState } from 'react';
import { Alert, Collapse } from '@mui/material';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../../lib/supabaseClient';

import SidebarSelector from '../components/SwipeableEdgeDrawer';
import DistrictFilter from '../components/DistrictFilter';
import L from 'leaflet';

export default function MapPage() {
  const [zoneData, setZoneData] = useState(null);
  const [vanData, setVanData] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [neighborhoodStats, setNeighborhoodStats] = useState([]);
  const [siteData, setSiteData] = useState([]);

  // Define a simple icon generator
const createIcon = (color) =>
  new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

// Customize by Site_Type
const siteTypeIcons = {
  'Large Market': createIcon('blue'),
  'Clinic': createIcon('green'),
  'School': createIcon('orange'),
  'Other': createIcon('red'),
};


  const handleShowAlert = () => {
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  useEffect(() => {
    fetch('/data/residential_zones.geojson')
      .then(res => res.json())
      .then(setZoneData);

      // Fetches the Van locations
    // fetch('/data/van_locations.geojson')
    //   .then(res => res.json())
    //   .then(setVanData);

    const fetchData = async () => {
      const { data: neighborhoods } = await supabase
        .from('neighborhood_stats')
        .select('Zona_ID, Rank, census_population, district');

      const { data: sites } = await supabase
        .from('site_data')
        .select('Zona_ID, Screening_Location_ID, lat, lon, Site_Type, total_screened, total_diagnosed');
      
      // Aggregate the Location Data from Multiple Dates into one 

      const siteMap = new Map();

      sites.forEach((site) => {
      const key = site.Screening_Location_ID;

      if (!siteMap.has(key)) {
        // Make it 0 if there is no Data
        siteMap.set(key, {
          ...site,
          total_screened: site.total_screened || 0,
          total_diagnosed: site.total_diagnosed || 0,
        });
      // Add it if there is Data exists
      } else {
        const existing = siteMap.get(key);
        siteMap.set(key, {
          ...existing,
          total_screened: existing.total_screened + (site.total_screened || 0),
          total_diagnosed: existing.total_diagnosed + (site.total_diagnosed || 0),
        });
      }
    });

      setNeighborhoodStats(neighborhoods || []);
      setSiteData(Array.from(siteMap.values()));
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

      {siteData.map((site, index) => {
      const position = [site.lat, site.lon];
      const icon = siteTypeIcons[site.Site_Type] || siteTypeIcons['Other'];

      return (
        <Marker key={index} position={position} icon={icon}>
          <Popup>
            <strong>Zone ID:</strong> {site.Zona_ID}<br />
            <strong>Screening ID:</strong> {site.Screening_Location_ID}<br />
            <strong>Type:</strong> {site.Site_Type}<br />
            <strong>Total Screened:</strong> {site.total_screened}<br />
            <strong>Total Diagnosed:</strong> {site.total_diagnosed}
          </Popup>
        </Marker>
      );
      })}
    </MapContainer>

    {/* Sidebar stays positioned relative (over map) */}
    <div style={{ position: 'relative', zIndex: 10 }}>
      <SidebarSelector onConfirm={handleShowAlert} siteData={siteData} />
    </div>
  </div>
);
}