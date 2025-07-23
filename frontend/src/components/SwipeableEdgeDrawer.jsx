import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Box, Typography, Checkbox, Button } from '@mui/material';
import SidebarFilterControls from './SidebarFilterControls';
import MethodBadges from './ScreeningMethodBadge';

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
  const [flattenedEntries, setFlattenedEntries] = useState([]);
  const [zoneNames, setZoneNames] = useState(new Map());
  const [pulseId, setpulseId] = useState(null);

  const [filters, setFilters] = useState({
    selectedTypes: [],
    selectedZonaIds: [],
    rankByScreened: false,
    rankByDiagnosed: false,
    rankByYield: false,
    yieldRange: [0, 100],
    nameTokens: [],
    zonaIdTokens: [],
    locationIdTokens: [],
  });

  useEffect(() => {
    fetchZoneNames();
  }, []);

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

  useEffect(() => {
    if (!siteData.length || zoneNames.size === 0) return;

    const [minYield, maxYield] = filters.yieldRange;

    const filtered = siteData.filter((site) => {
      const yieldRatio =
        site.total_screened > 0
          ? (site.total_diagnosed / site.total_screened) * 100
          : 0;

      const inYieldRange = yieldRatio >= minYield && yieldRatio <= maxYield;

      const siteType = [...(site.methods || [])].join(', ').toLowerCase();
      const siteTypeMatch =
        filters.selectedTypes.length === 0 ||
        filters.selectedTypes.some((type) =>
          siteType.includes(type.toLowerCase())
        );

      const zonaIdStr = site.Zona_ID?.toString() || '';
      const zoneName = (site.Zona_name || '').toLowerCase();
      const locationName = (site.location_name || '').toLowerCase();

      const nameMatch =
        filters.nameTokens.length === 0 ||
        filters.nameTokens.some((token) =>
          zoneName.includes(token.toLowerCase())
        );

      const zonaIdMatch =
        filters.zonaIdTokens.length === 0 ||
        filters.zonaIdTokens.some((token) => zonaIdStr.startsWith(token));

      const locationIdMatch =
        filters.locationIdTokens.length === 0 ||
        filters.locationIdTokens.some((token) =>
          locationName.includes(token.toLowerCase())
        );

      return (
        inYieldRange &&
        siteTypeMatch &&
        nameMatch &&
        zonaIdMatch &&
        locationIdMatch
      );
    });

    const ranked = [...filtered];
    if (filters.rankByScreened)
      ranked.sort((a, b) => b.total_screened - a.total_screened);
    if (filters.rankByDiagnosed)
      ranked.sort((a, b) => b.total_diagnosed - a.total_diagnosed);
    if (filters.rankByYield)
      ranked.sort(
        (a, b) =>
          (b.total_diagnosed / b.total_screened || 0) -
          (a.total_diagnosed / a.total_screened || 0)
      );

    setFlattenedEntries(ranked);
    onFilter?.(ranked);
  }, [siteData, filters, zoneNames]);

  useEffect(() => {
    if (!selectedMarkerKey || flattenedEntries.length === 0) return;

    const timeout = setTimeout(() => {
      const el = document.getElementById(`sidebar-entry-${selectedMarkerKey}`);
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
      return { Screening_Location_ID: entry?.id || null };
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
        availableZonaIds={[...new Set(siteData.map((s) => s.Zona_ID))]}
        availableSiteTypes={[...new Set(siteData.flatMap((s) => [...(s.methods || [])]))]}
      />

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ textAlign: 'center', width: '100%', my: 2 }}
      >
        Select locations below & Press "Confirm Selection"
      </Typography>

      <Button
        sx={{ backgroundColor: '#9854CB', color: '#fff', borderRadius: 10, mb: 2 }}
        fullWidth
        variant="contained"
        disabled={selectedScreeningIds.length === 0}
        onClick={handleConfirm}
      >
        Confirm Selection
      </Button>

      {flattenedEntries.map((entry) => {
        const isSelected = selectedScreeningIds.includes(entry.markerKey);
        const isHighlighted = selectedMarkerKey === entry.markerKey;
        const yieldRatio = entry.total_screened > 0
          ? (entry.total_diagnosed / entry.total_screened) * 100
          : 0;

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
                  ? 'pulse 1.4s ease-in-out 7'
                  : 'none',
            }}
            onClick={() => {
              toggleSelection(entry.markerKey);
              setSelectedMarkerKey(entry.markerKey);
              setHighlightedMarkerKey(entry.markerKey);
            }}
          >
            <MethodBadges methods={entry.methods} />

            <Box
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 10,
                pointerEvents: 'auto',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Checkbox
                checked={isSelected}
                onChange={() => toggleSelection(entry.markerKey)}
              />
            </Box>

            <Typography variant="body2" sx={{ wordBreak: 'break-word', whiteSpace: 'normal', mr: 3 }}>
              Location Name: {entry.location_name || 'Unknown'}
            </Typography>
            <Typography variant="subtitle2">
              Zona: {entry.Zona_name || 'N/A'}
            </Typography>
            <Typography variant="body2">District: {entry.District || 'N/A'}</Typography>
            <Typography variant="body2">Total Screened: {entry.total_screened}</Typography>
            <Typography variant="body2">Total Diagnosed: {entry.total_diagnosed}</Typography>
            <Typography variant="body2">Yield: {yieldRatio.toFixed(2)}%</Typography>
            <Typography variant="body2">
              Performed by: {[...(entry.methods || [])].join(', ')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Date: {entry.Date || 'N/A'}
            </Typography>
          </Box>
        );
      })}

      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(152, 84, 203, 0.5); transform: scale(1); }
          50% { box-shadow: 0 0 0 10px rgba(152, 84, 203, 0.15); transform: scale(1.05); }
          100% { box-shadow: 0 0 0 0 rgba(152, 84, 203, 0); transform: scale(1); }
        }
      `}</style>
    </Box>
  );
}
