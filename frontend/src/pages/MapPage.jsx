import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Alert, Collapse } from '@mui/material';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../../lib/supabaseClient';
import SidebarSelector from '../components/SwipeableEdgeDrawer';
import MapLegend from '../components/MapLegend';
import { siteJoinKey } from '../utils/siteJoinKey';
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
    iconCache.set(
      color,
      new L.Icon({
        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
        shadowUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      })
    );
  }
  return iconCache.get(color);
};

function InitialFitBounds({ sites, enabled }) {
  const map = useMap();
  const didFit = useRef(false);

  useEffect(() => {
    if (!enabled || didFit.current || !sites.length) return;
    const bounds = sites
      .filter((s) => s.lat != null && s.lon != null)
      .map((s) => [parseFloat(s.lat), parseFloat(s.lon)]);
    if (!bounds.length) return;
    map.fitBounds(bounds, { padding: [50, 50] });
    didFit.current = true;
  }, [sites, enabled, map]);

  return null;
}

function FlyToController({ target }) {
  const map = useMap();

  useEffect(() => {
    if (!target?.lat || !target?.lon) return;
    const lat = parseFloat(target.lat);
    const lon = parseFloat(target.lon);
    if (Number.isNaN(lat) || Number.isNaN(lon)) return;
    map.flyTo([lat, lon], 16, { duration: 0.45, easeLinearity: 0.25 });
  }, [target, map]);

  return null;
}

const MemoizedMarker = React.memo(
  ({ position, icon, popupContent, markerKey, eventHandlers, refCallback }) => (
    <Marker
      key={markerKey}
      position={position}
      icon={icon}
      ref={refCallback}
      eventHandlers={eventHandlers}
    >
      <Popup>{popupContent}</Popup>
    </Marker>
  )
);

export default function MapPage() {
  const [zoneData, setZoneData] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [siteData, setSiteData] = useState([]);
  const [recommendationsByKey, setRecommendationsByKey] = useState(new Map());
  const [filteredSites, setFilteredSites] = useState([]);
  const [selectedScreeningIds, setSelectedScreeningIds] = useState([]);
  const [highlightedMarkerKey, setHighlightedMarkerKey] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);

  const markerRefs = useRef({});

  useEffect(() => {
    fetch('/data/residential_zones.geojson')
      .then((res) => res.json())
      .then(setZoneData);

    const fetchData = async () => {
      const { data: site_data } = await supabase.from('filtered_site_data').select('*');

      const { data: recommendations, error: recError } = await supabase
        .from('site_recommendations')
        .select(
          'arm_id,location_name,Zona_name,District,lat,lon,priority,rank,updated_at'
        );

      if (recError) {
        console.warn('site_recommendations unavailable:', recError.message);
      }

      const recMap = new Map();
      for (const rec of recommendations || []) {
        const joinKey = siteJoinKey(rec.location_name, rec.Zona_name, rec.District);
        recMap.set(joinKey, {
          arm_id: rec.arm_id,
          priority: rec.priority,
          rank: rec.rank,
          updated_at: rec.updated_at,
        });
      }
      setRecommendationsByKey(recMap);

      const siteMap = new Map();

      for (const site of site_data || []) {
        const key = `${site.lat}_${site.lon}_${site.location_name}`;
        const total_screened = site.n_screened || 0;
        const total_diagnosed = site.n_diagnosed || 0;
        const joinKey = siteJoinKey(site.location_name, site.Zona_name, site.District);
        const bandit = recMap.get(joinKey);
        const rawSiteType = site.site_type ?? site.Site_Type ?? '';
        const siteTypeCanonical = normalizeSiteType(rawSiteType);

        if (!siteMap.has(key)) {
          siteMap.set(key, {
            ...site,
            markerKey: key,
            joinKey,
            total_screened,
            total_diagnosed,
            methods: new Set([site.Screening_performed_by]),
            siteTypeCanonical,
            banditRank: bandit?.rank ?? null,
            banditPriority: bandit?.priority ?? null,
          });
        } else {
          const prev = siteMap.get(key);
          siteMap.set(key, {
            ...prev,
            total_screened: prev.total_screened + total_screened,
            total_diagnosed: prev.total_diagnosed + total_diagnosed,
            methods: new Set([...prev.methods, site.Screening_performed_by]),
            siteTypeCanonical: prev.siteTypeCanonical || siteTypeCanonical,
            banditRank: prev.banditRank ?? bandit?.rank ?? null,
            banditPriority: prev.banditPriority ?? bandit?.priority ?? null,
          });
        }
      }

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

  const focusSite = useCallback((site) => {
    if (!site) return;
    setHighlightedMarkerKey(site.markerKey);
    setFlyTarget({
      lat: site.lat,
      lon: site.lon,
      key: site.markerKey,
      t: Date.now(),
    });
  }, []);

  const displayedSites = useMemo(
    () => (filteredSites.length > 0 ? filteredSites : siteData),
    [filteredSites, siteData]
  );

  return (
    <div className="relative h-[calc(100vh-4rem)] w-full overflow-hidden">
      <div className="pointer-events-none fixed top-20 left-1/2 z-[2000] -translate-x-1/2">
        <Collapse in={showAlert} timeout="auto" unmountOnExit>
          <Alert severity="success">Confirmed screening zones!</Alert>
        </Collapse>
      </div>

      <MapContainer
        center={[-12.05, -77.05]}
        zoom={11}
        className="absolute inset-0 z-0 h-full w-full"
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
            style={{ color: '#0f766e', weight: 1.5, fillOpacity: 0.12 }}
          />
        )}

        {displayedSites.map((site) => {
          const position = [parseFloat(site.lat), parseFloat(site.lon)];
          if (Number.isNaN(position[0]) || Number.isNaN(position[1])) return null;

          const markerKey = site.markerKey;
          const isHighlighted = highlightedMarkerKey === markerKey;
          const isSelected = selectedScreeningIds.includes(markerKey);

          let iconColor = SITE_TYPE_COLOR[site.siteTypeCanonical];
          if (isSelected) iconColor = 'orange';
          else if (isHighlighted) iconColor = 'yellow';
          const icon = getMarkerIcon(iconColor || 'blue');

          return (
            <MemoizedMarker
              key={markerKey}
              markerKey={markerKey}
              position={position}
              icon={icon}
              popupContent={
                <>
                  <strong>Location:</strong> {site.location_name} <br />
                  <strong>District:</strong> {site.District} <br />
                  <strong>Zona:</strong> {site.Zona_name} <br />
                  <strong>Performed by:</strong> {[...site.methods].join(', ')} <br />
                  <strong>Latest Date:</strong> {site.Date} <br />
                  <strong>Total Screened:</strong> {site.total_screened} <br />
                  <strong>Total Diagnosed:</strong> {site.total_diagnosed}
                  {site.banditRank != null && (
                    <>
                      <br />
                      <strong>Recommended rank:</strong> #{site.banditRank}
                    </>
                  )}
                </>
              }
              eventHandlers={{
                click: () => focusSite(site),
              }}
              refCallback={(ref) => {
                if (ref) markerRefs.current[markerKey] = ref;
              }}
            />
          );
        })}

        <InitialFitBounds sites={siteData} enabled={siteData.length > 0} />
        <FlyToController target={flyTarget} />
      </MapContainer>

      <div className="relative z-10">
        <SidebarSelector
          onConfirm={handleShowAlert}
          siteData={siteData}
          recommendationsByKey={recommendationsByKey}
          onFilter={setFilteredSites}
          selectedScreeningIds={selectedScreeningIds}
          setSelectedScreeningIds={setSelectedScreeningIds}
          selectedMarkerKey={highlightedMarkerKey}
          setSelectedMarkerKey={setHighlightedMarkerKey}
          setHighlightedMarkerKey={setHighlightedMarkerKey}
          onFocusSite={focusSite}
        />
      </div>
    </div>
  );
}
