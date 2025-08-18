import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect, useState, useRef, useMemo } from 'react';
import { Alert, Collapse } from '@mui/material';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../../lib/supabaseClient';

import SidebarSelector from '../components/SwipeableEdgeDrawer';
import MapLegend from '../components/MapLegend';
import L from 'leaflet';
import React from 'react';

const normalizeSiteType = (t = '') => {
  const s = String(t).trim().toLowerCase();
  if (!s || s === 'na' || s === 'n/a') return '';
  if (s.includes('community')) return 'Community (General)';
  if (s.includes('health')) return 'Health Facility';
  return t.trim();
};

const SITE_TYPE_COLOR = {
  'Community (General)': 'green',
  'Health Facility': 'blue',
};

const iconCache = new Map();
const getMarkerIcon = (color) => {
  if (!iconCache.has(color)) {
    iconCache.set(color, new L.Icon({
      iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    }));
  }
  return iconCache.get(color);
};

function AutoZoom({ sites }) {
  const map = useMap();

  useEffect(() => {
    if (!sites.length) return;
    const bounds = sites.map((s) => [s.lat, s.lon]);
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [sites]);

  return null;
}

const MemoizedMarker = React.memo(({ position, icon, popupContent, markerKey, eventHandlers, refCallback }) => (
  <Marker
    key={markerKey}
    position={position}
    icon={icon}
    ref={refCallback}
    eventHandlers={eventHandlers}
  >
    <Popup>{popupContent}</Popup>
  </Marker>
));

export default function MapPage() {
  const [zoneData, setZoneData] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [neighborhoodStats, setNeighborhoodStats] = useState([]);
  const [siteData, setSiteData] = useState([]);
  const [filteredSites, setFilteredSites] = useState([]);
  const [selectedScreeningIds, setSelectedScreeningIds] = useState([]);
  const [highlightedMarkerKey, setHighlightedMarkerKey] = useState(null);
  const [filters, setFilters] = useState({
    selectedTypes: [],
    selectedZonaIds: [],
    rankByScreened: false,
    rankByDiagnosed: false,
    rankByYield: false,
    yieldRange: [0, 100],
    searchQuery: '',
  });

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
        .from('filtered_site_data')
        .select('*');

      const siteMap = new Map();

      for (const site of site_data) {
        const key = `${site.lat}_${site.lon}_${site.location_name}`;
        const total_screened = site.n_screened || 0;
        const total_diagnosed = site.n_diagnosed || 0;

        const rawSiteType = site.site_type ?? site.Site_Type ?? '';
        const siteTypeCanonical = normalizeSiteType(rawSiteType);

        if (!siteMap.has(key)) {
          siteMap.set(key, {
            ...site,
            markerKey: key,
            total_screened,
            total_diagnosed,
            methods: new Set([site.Screening_performed_by]),
            siteTypeCanonical,
          });
        } else {
          const prev = siteMap.get(key);
          siteMap.set(key, {
            ...prev,
            total_screened: prev.total_screened + total_screened,
            total_diagnosed: prev.total_diagnosed + total_diagnosed,
            methods: new Set([...prev.methods, site.Screening_performed_by]),
            // Fixed: Explicitly retain or update the siteTypeCanonical property
            siteTypeCanonical: prev.siteTypeCanonical || siteTypeCanonical,
          });
        }
      }

      setNeighborhoodStats(neighborhoods || []);
      setSiteData(Array.from(siteMap.values()));
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (highlightedMarkerKey && markerRefs.current[highlightedMarkerKey]) {
      markerRefs.current[highlightedMarkerKey].openPopup();
    }
  }, [highlightedMarkerKey]);

  const handleShowAlert = () => {
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  const displayedSites = useMemo(() => (
    filteredSites.length > 0 ? filteredSites : siteData
  ), [filteredSites, siteData]);

  return (
    <div style={{ height: '91vh', width: '100%', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 2000, pointerEvents: "none" }}>
        <Collapse in={showAlert} timeout="auto" unmountOnExit>
          <Alert severity="success">Confirmed screening zones!</Alert>
        </Collapse>
      </div>

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
          const position = [parseFloat(site.lat), parseFloat(site.lon)];
          const markerKey = site.markerKey;
          const isHighlighted = highlightedMarkerKey === markerKey;
          const isSelected = selectedScreeningIds.includes(markerKey);
          const yieldRatio = site.total_screened > 0
            ? (site.total_diagnosed / site.total_screened) * 100
            : 0;

          const [minYield, maxYield] = filters.yieldRange;
          const inRange = yieldRatio >= minYield && yieldRatio <= maxYield;
          const districtMatches = !selectedDistrict || site.District === selectedDistrict;
          if (!inRange || !districtMatches) return null;

          let iconColor = SITE_TYPE_COLOR[site.siteTypeCanonical]
          if (isSelected) {
            iconColor = 'orange';
          } else if (isHighlighted) {
            iconColor = 'yellow';
          }
          const icon = getMarkerIcon(iconColor);

          return (
            <MemoizedMarker
              key={markerKey}
              markerKey={markerKey}
              position={position}
              icon={icon}
              popupContent={(
                <>
                  <strong>Location:</strong> {site.location_name} <br />
                  <strong>District:</strong> {site.District} <br />
                  <strong>Zona:</strong> {site.Zona_name} <br />
                  <strong>Performed by:</strong> {[...site.methods].join(', ')} <br />
                  <strong>Latest Date:</strong> {site.Date} <br />
                  <strong>Total Screened:</strong> {site.total_screened} <br />
                  <strong>Total Diagnosed:</strong> {site.total_diagnosed}
                </>
              )}
              eventHandlers={{
                click: () => {
                  setHighlightedMarkerKey(prev =>
                    prev === markerKey ? null : markerKey
                  );
                },
              }}
              refCallback={(ref) => {
                if (ref) markerRefs.current[markerKey] = ref;
              }}
            />
          );
        })}

        <AutoZoom sites={displayedSites} />
      </MapContainer>

      <div style={{ position: 'relative', zIndex: 10 }}>
        <SidebarSelector
          filters={filters}
          setFilters={setFilters}
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