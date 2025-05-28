import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect, useState, useRef } from 'react';
import { Alert, Collapse } from '@mui/material';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../../lib/supabaseClient';

import SidebarSelector from '../components/SwipeableEdgeDrawer';
import DistrictFilter from '../components/DistrictFilter';
import L from 'leaflet';

function AutoZoom({ sites }) {
  const map = useMap();

  useEffect(() => {
    if (!sites.length) return;
    const bounds = sites.map((s) => [s.lat, s.lon]);
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [sites]);

  return null;
}

export default function MapPage() {
  const [zoneData, setZoneData] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [neighborhoodStats, setNeighborhoodStats] = useState([]);
  const [siteData, setSiteData] = useState([]);
  const [filteredSites, setFilteredSites] = useState([]);
  const [selectedScreeningIds, setSelectedScreeningIds] = useState([]);
  const [hoveredScreeningId, setHoveredScreeningId] = useState(null);

  const markerRefs = useRef({});

  useEffect(() => {
    fetch('/data/residential_zones.geojson')
      .then(res => res.json())
      .then(setZoneData);

    const fetchData = async () => {
      const { data: neighborhoods } = await supabase
        .from('neighborhood_stats')
        .select('Zona_ID');

      const { data: site_data } = await supabase
        .from('site_data')
        .select('*');

      const siteMap = new Map();
      site_data.forEach((site) => {
        const key = site.Screening_Location_ID;
        if (!siteMap.has(key)) {
          siteMap.set(key, {
            ...site,
            total_screened: site.total_screened || 0,
            total_diagnosed: site.total_diagnosed || 0,
          });
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

  useEffect(() => {
  const marker = markerRefs.current[hoveredScreeningId];
  if (marker) {
    marker.openPopup();
  }

  // Optional: close all other popups
  Object.entries(markerRefs.current).forEach(([id, ref]) => {
    if (id !== String(hoveredScreeningId)) {
      ref?.closePopup();
    }
  });
}, [hoveredScreeningId, markerRefs.current]);


  const handleShowAlert = () => {
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  return (
    <div style={{ height: '100vh', width: '100%', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}>
        <Collapse in={showAlert} timeout="auto" unmountOnExit>
          <Alert severity="success" sx={{ width: '90vw', maxWidth: 600 }}>
            Confirmed screening zones!
          </Alert>
        </Collapse>
      </div>

      <DistrictFilter value={selectedDistrict} onChange={setSelectedDistrict} />

      <MapContainer
        center={[-12.05, -77.05]}
        zoom={11}
        style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '100%', height: '100%', zIndex: 0 }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {zoneData && (
          <GeoJSON
            data={zoneData}
            onEachFeature={(feature, layer) => {
              const name = feature.properties?.zone_name || 'Unnamed';
              layer.bindPopup(`<strong>${name}</strong>`);
            }}
            style={{ color: '#3388ff', weight: 2, fillOpacity: 0.2 }}
          />
        )}

        {(filteredSites.length > 0 ? filteredSites : siteData).map((site) => {
          const position = [site.lat, site.lon];
          const isSelected = selectedScreeningIds.includes(site.Screening_Location_ID);

          const baseColor =
            site.Site_Type === 'Large Market' ? 'blue' :
            site.Site_Type === 'Health facility' ? 'green' :
            'red';

          const iconColor = isSelected ? 'yellow' : baseColor;

          const icon = new L.Icon({
            iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${iconColor}.png`,
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: isSelected ? [40, 60] : [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
            className: isSelected ? 'marker-selected' : '',
          });

          return (
            <Marker key={site.Screening_Location_ID} position={position} icon={icon}
              ref={(ref) => {
                if (ref) markerRefs.current[site.Screening_Location_ID] = ref;
              }}
            >
              <Popup>
                <strong>ID:</strong> {site.screeningId ?? 'N/A'} <br />
              </Popup>
            </Marker>
          );
        })}

        <AutoZoom sites={filteredSites.length > 0 ? filteredSites : siteData} />
      </MapContainer>

      <div style={{ position: 'relative', zIndex: 10 }}>
        <SidebarSelector
          onConfirm={handleShowAlert}
          siteData={siteData}
          onFilter={setFilteredSites}
          selectedScreeningIds={selectedScreeningIds}
          setSelectedScreeningIds={setSelectedScreeningIds}
          setHoveredScreeningId={setHoveredScreeningId}
        />
      </div>
    </div>
  );
}