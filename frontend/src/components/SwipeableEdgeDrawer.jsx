import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Box, Typography, Checkbox, Button } from '@mui/material';
import SidebarFilterControls from './SidebarFilterControls';

export default function SidebarSelector({
  onConfirm,
  siteData,
  onFilter,
  selectedScreeningIds,
  setSelectedScreeningIds,
  selectedMarkerKey,
  setSelectedMarkerKey,
  setHighlightedMarkerKey,
}) {
  const [locations, setLocations] = useState([]);
  const [zoneNames, setZoneNames] = useState(new Map());
  const [flattenedEntries, setFlattenedEntries] = useState([]);
  const [filters, setFilters] = useState({
    selectedZonaIds: [],
    rankByScreened: false,
    rankByDiagnosed: false,
    searchQuery: '',
  });
  const [pulseId, setpulseId] = useState(null);

  const siteZonaIds = useMemo(
    () => new Set(siteData.map((site) => site.Zona_ID)),
    [siteData]
  );

  const visibleEntries = flattenedEntries.filter(
    (entry) =>
      filters.selectedZonaIds.length === 0 ||
      filters.selectedZonaIds.includes(entry.zonaId)
  );

  useEffect(() => {
    fetchLocations();
    fetchZoneNames();
  }, []);

  async function fetchLocations() {
    const { data, error } = await supabase
      .from('neighborhood_stats')
      .select('*');
    if (error) console.error('❌ Supabase fetch error:', error);
    else setLocations(data);
  }

  async function fetchZoneNames() {
    try {
      const response = await fetch('/data/residential_zones.geojson');
      const geojson = await response.json();
      const map = new Map(
        geojson.features.map((f) => [
          Math.floor(f.properties.Zona_ID),
          f.properties.Zone_Nam_1,
        ])
      );
      setZoneNames(map);
    } catch (err) {
      console.error('❌ Error loading geojson:', err);
    }
  }

  // 🔁 Aggregate sidebar entries by screening location
  useEffect(() => {
    if (!locations.length || !siteData.length || zoneNames.size === 0) return;

    const tokens = filters.searchQuery
      .toLowerCase()
      .split(';')
      .map((t) => t.trim())
      .filter(Boolean);

    const hasSearch = tokens.length > 0;

    const filtered = locations
      .filter((loc) => siteZonaIds.has(loc.Zona_ID))
      .filter((loc) => {
        if (!hasSearch) return true;
        const zonaId = Math.floor(loc.Zona_ID).toString();
        const zoneName = (zoneNames.get(Number(zonaId)) || '').toLowerCase();
        return (
          tokens.some((token) => zonaId.startsWith(token)) ||
          tokens.some((token) => zoneName.includes(token))
        );
      })
      .flatMap((loc) => {
        const matchingSites = siteData.filter(
          (site) => site.Zona_ID === loc.Zona_ID
        );

        const siteMap = new Map();

        for (const site of matchingSites) {
          const id = site.Screening_Location_ID;
          if (!siteMap.has(id)) {
            siteMap.set(id, {
              zonaId: loc.Zona_ID,
              rank: loc.Rank,
              screeningId: id,
              populationMedian: loc.total_screened_median ?? 'N/A',
              district: loc.district,
              lat: site.lat,
              lon: site.lon,
              Site_Type: site.Site_Type,
              total_screened: site.total_screened || 0,
              total_diagnosed: site.total_diagnosed || 0,
              markerKey: site.markerKey,
            });
          } else {
            const prev = siteMap.get(id);
            siteMap.set(id, {
              ...prev,
              total_screened:
                prev.total_screened + (site.total_screened || 0),
              total_diagnosed:
                prev.total_diagnosed + (site.total_diagnosed || 0),
            });
          }
        }

        return Array.from(siteMap.values());
      });

    const ranked = [...filtered];
    if (filters.rankByScreened)
      ranked.sort((a, b) => b.total_screened - a.total_screened);
    if (filters.rankByDiagnosed)
      ranked.sort((a, b) => b.total_diagnosed - a.total_diagnosed);

    setFlattenedEntries(ranked);
    onFilter?.(ranked);
  }, [locations, siteData, filters, zoneNames]);

  // 🔁 Scroll and pulse effect
  useEffect(() => {
    if (!selectedMarkerKey || flattenedEntries.length === 0) return;

    const timeout = setTimeout(() => {
      const el = document.getElementById(
        `sidebar-entry-${selectedMarkerKey}`
      );
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });

        setTimeout(() => {
          setpulseId(selectedMarkerKey);
          setTimeout(() => setpulseId(null), 4000);
        }, 200);
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, [selectedMarkerKey, flattenedEntries]);

  const handleConfirm = async () => {
    const inserts = selectedScreeningIds.map((markerKey) => {
      const entry = flattenedEntries.find((e) => e.markerKey === markerKey);
      return { Screening_Location_ID: entry?.screeningId };
    });

    if (inserts.length > 0) {
      const { data, error } = await supabase
        .from('tickets')
        .insert(inserts)
        .select();
      if (error) console.error('❌ Ticket insert error:', error);
      else {
        console.log('✅ Tickets inserted:', data);
        setSelectedScreeningIds([]);
        if (onConfirm) onConfirm();
      }
    }
  };

  const toggleSelection = (markerKey) => {
    setSelectedScreeningIds((prev) =>
      prev.includes(markerKey)
        ? prev.filter((id) => id !== markerKey)
        : [...prev, markerKey]
    );
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: '75px',
        right: 0,
        width: 350,
        height: '83vh',
        bgcolor: 'background.paper',
        borderLeft: '1px solid #ddd',
        borderTopLeftRadius: 14,
        borderBottomLeftRadius: 14,
        overflowY: 'auto',
        px: 2,
        pb: 4,
        zIndex: 1000,
        boxShadow: '-4px 0 12px rgba(0,0,0,0.1)',
      }}
    >
      <SidebarFilterControls
        filters={filters}
        setFilters={setFilters}
        availableZonaIds={[
          ...new Set(siteData.map((site) => site.Zona_ID)),
        ]}
      />

      <Box
        sx={{
          position: 'sticky',
          top: 0,
          bgcolor: 'background.paper',
          zIndex: 1,
          pt: 1,
          pb: 2,
        }}
      >
        <Button
          sx={{ backgroundColor: '#9854CB', color: '#fff', borderRadius: 10 }}
          fullWidth
          variant="contained"
          disabled={selectedScreeningIds.length === 0}
          onClick={handleConfirm}
        >
          Confirm Selection
        </Button>
      </Box>

      {visibleEntries.map((entry, index) => {
        const isSelected = selectedScreeningIds.includes(entry.markerKey);
        const isHighlighted = selectedMarkerKey === entry.markerKey;

        return (
          <Box
            key={entry.markerKey}
            id={`sidebar-entry-${entry.markerKey}`}
            sx={{
              backgroundColor: '#F3F6FB',
              borderLeft: isHighlighted
                ? '4px solid #9854CB'
                : '4px solid transparent',
              border: isSelected
                ? '2px solid #9854CB'
                : '1px solid #ccc',
              borderRadius: 2,
              p: 2,
              mb: 1,
              cursor: 'pointer',
              position: 'relative',
              animation:
                pulseId === entry.markerKey
                  ? 'pulse 1.2s ease-in-out 3'
                  : 'none',
            }}
            onClick={() => {
              toggleSelection(entry.markerKey);
              setSelectedMarkerKey(entry.markerKey);
              setHighlightedMarkerKey(entry.markerKey);
            }}
          >
            <Checkbox
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                toggleSelection(entry.markerKey);
              }}
              sx={{ position: 'absolute', top: 8, right: 8 }}
            />
            <Typography variant="body2">
              {zoneNames.get(entry.zonaId) ?? 'Unknown'}
            </Typography>
            <Typography variant="subtitle2">
              Zona ID: {entry.zonaId}
            </Typography>
            <Typography variant="body2">
              Location ID: {entry.screeningId ?? 'N/A'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {entry.district}
            </Typography>
            <Typography variant="body2">
              Total Screened: {entry.total_screened}
            </Typography>
            <Typography variant="body2">
              Total Diagnosed: {entry.total_diagnosed}
            </Typography>
            <Typography variant="body2">
              Yield Ratio:{' '}
              {entry.total_screened > 0
                ? ((entry.total_diagnosed / entry.total_screened) * 100).toFixed(2)
                : '0.00'}
              %
            </Typography>
            <Typography variant="body2">Type: {entry.Site_Type}</Typography>
          </Box>
        );
      })}

      <style jsx global>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(152, 84, 203, 0.5);
            transform: scale(1);
          }
          30% {
            box-shadow: 0 0 0 12px rgba(152, 84, 203, 0.2);
            transform: scale(1.02);
          }
          60% {
            box-shadow: 0 0 0 0 rgba(152, 84, 203, 0);
            transform: scale(1);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(152, 84, 203, 0);
            transform: scale(1);
          }
        }
      `}</style>
    </Box>
  );
}
