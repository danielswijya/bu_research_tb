import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect, useState, useRef } from 'react';
import { Alert, Collapse } from '@mui/material';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../../lib/supabaseClient';

import SidebarSelector from '../components/SwipeableEdgeDrawer';
import DistrictFilter from '../components/DistrictFilter';
import MapLegend from '../components/MapLegend';
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
  const [selectedMarkerId, setSelectedMarkerId] = useState(null);
  const [highlightedMarkerKey, setHighlightedMarkerKey] = useState(null);

  const markerRefs = useRef({});

  // 🔁 Fetch data and aggregate by Screening_Location_ID
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
            markerKey: key, // ✅ use Screening_Location_ID directly
            total_screened: site.total_screened || 0,
            total_diagnosed: site.total_diagnosed || 0,
          });
        } else {
          const prev = siteMap.get(key);
          siteMap.set(key, {
            ...prev,
            total_screened: prev.total_screened + (site.total_screened || 0),
            total_diagnosed: prev.total_diagnosed + (site.total_diagnosed || 0),
          });
        }
      });

      setNeighborhoodStats(neighborhoods || []);
      setSiteData(Array.from(siteMap.values()));
    };

    fetchData();
  }, []);

  // 🔁 Open popup when sidebar card is clicked
  useEffect(() => {
    if (highlightedMarkerKey && markerRefs.current[highlightedMarkerKey]) {
      markerRefs.current[highlightedMarkerKey].openPopup();
    }
  }, [highlightedMarkerKey]);

  const handleShowAlert = () => {
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  const displayedSites = filteredSites.length > 0 ? filteredSites : siteData;

  return (
    <div style={{ height: '91vh', width: '100%', position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 2000, pointerEvents: "none" }}>
      <Collapse in={showAlert} timeout="auto" unmountOnExit>
        <Alert severity="success">Confirmed screening zones!</Alert>
      </Collapse>
    </div>

      <DistrictFilter value={selectedDistrict} onChange={setSelectedDistrict} />

      <MapContainer
        center={[-12.05, -77.05]}
        zoom={11}
        style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '100%', height: '100%', zIndex: 0 }}
      >
        <MapLegend />
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

        {displayedSites.map((site) => {
          const position = [site.lat, site.lon];
          const markerKey = site.markerKey;
          const isHighlighted = highlightedMarkerKey === markerKey;

          let iconColor;
          if (isHighlighted) {
            iconColor = 'yellow';
          } else if (site.Site_Type === 'Large Market') {
            iconColor = 'blue';
          } else if (site.Site_Type === 'Health facility') {
            iconColor = 'green';
          } else {
            iconColor = 'red';
          }

          const icon = new L.Icon({
            iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${iconColor}.png`,
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
          });

          return (
            <Marker
              key={markerKey}
              position={position}
              icon={icon}
              ref={(ref) => {
                if (ref) markerRefs.current[markerKey] = ref;
              }}
              eventHandlers={{
                click: () => {
                  setHighlightedMarkerKey(prev =>
                    prev === markerKey ? null : markerKey
                  );
                },
              }}
            >
              <Popup>
                <strong>ID:</strong> {site.screeningId} <br />
                <strong>Type:</strong> {site.Site_Type} <br />
                <strong>Total Screened:</strong> {site.total_screened} <br />
                <strong>Total Diagnosed:</strong> {site.total_diagnosed}
              </Popup>
            </Marker>
          );
        })}

        <AutoZoom sites={displayedSites} />
      </MapContainer>

      <div style={{ position: 'relative', zIndex: 10 }}>
        <SidebarSelector
          onConfirm={handleShowAlert}
          siteData={siteData}
          onFilter={setFilteredSites}
          selectedScreeningIds={selectedScreeningIds}
          setSelectedScreeningIds={setSelectedScreeningIds}
          selectedMarkerKey={highlightedMarkerKey}
          setSelectedMarkerKey={setHighlightedMarkerKey}
          setHighlightedMarkerKey={setHighlightedMarkerKey}
        />
      </div>
    </div>
  );
}
