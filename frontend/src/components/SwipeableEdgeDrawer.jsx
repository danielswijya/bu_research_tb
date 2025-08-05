import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Box, Typography, Checkbox, Button } from '@mui/material';
import SidebarFilterControls from './SidebarFilterControls';
import MethodBadges from './ScreeningMethodBadge';
import EntryConfirmationDialog from './EntryConfirmationDialog';
import { createTheme, ThemeProvider } from '@mui/material/styles';

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
  const customTheme = createTheme({
    typography: {
      allVariants: {
        fontFamily: '"Segoe UI"'
      }
    }
  });

  const [openConfirmationDialog, setOpenConfirmationDialog] = useState(false);
  const [entriesToConfirm, setEntriesToConfirm] = useState([]);

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
    districtTokens: [], // Make sure this is in the state
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

  const latestSiteData = useMemo(() => {
    const uniqueLocations = new Map();

    siteData.forEach((entry) => {
      const methodsArray = Array.isArray(entry.methods)
        ? entry.methods
        : typeof entry.methods === 'string'
        ? entry.methods.split(',').map(m => m.trim())
        : [];

      const hasNAMethod = methodsArray.some(method => method.toLowerCase() === 'na');
      if (hasNAMethod) {
        return;
      }

      let newDate;
      if (entry.Date && typeof entry.Date === 'string' && entry.Date.toLowerCase() !== 'na') {
        newDate = new Date(entry.Date);
      } else {
        return;
      }

      if (isNaN(newDate.getTime())) {
        console.warn(`Invalid Date format for entry (after 'NA' check), skipping: '${entry.Date}'`, entry);
        return;
      }

      const lat = entry.lat !== undefined && entry.lat !== null ? entry.lat : 'unknown_lat';
      const lon = entry.lon !== undefined && entry.lon !== null ? entry.lon : 'unknown_lon';

      const locationNameForId = (entry.location_name || 'Unknown').toLowerCase().trim();
      const zonaNameForId = (entry.Zona_name || 'Unknown').toLowerCase().trim();

      const locationKey = `${locationNameForId}|${zonaNameForId}|${lat}|${lon}`;
      const existingEntry = uniqueLocations.get(locationKey);

      if (!existingEntry) {
        uniqueLocations.set(locationKey, entry);
      } else {
        const existingDate = new Date(existingEntry.Date);
        if (isNaN(existingDate.getTime())) {
          console.warn(`Invalid Date for existing entry, replacing if new date is valid: '${existingEntry.Date}'`, existingEntry);
          if (!isNaN(newDate.getTime())) {
            uniqueLocations.set(locationKey, entry);
          }
          return;
        }

        if (newDate > existingDate) {
          uniqueLocations.set(locationKey, entry);
        }
      }
    });
    return Array.from(uniqueLocations.values());
  }, [siteData]);

  useEffect(() => {
    if (!latestSiteData.length || zoneNames.size === 0) return;

    const [minYield, maxYield] = filters.yieldRange;

    const filtered = latestSiteData.filter((site) => {
      const yieldRatio =
        site.total_screened > 0
          ? (site.total_diagnosed / site.total_screened) * 100
          : 0;

      const inYieldRange = yieldRatio >= minYield && yieldRatio <= maxYield;

      const siteMethodsArray = site.methods instanceof Set
        ? Array.from(site.methods)
        : Array.isArray(site.methods)
        ? site.methods
        : typeof site.methods === 'string'
        ? site.methods.split(',').map(m => m.trim())
        : [];

      const siteTypeMatch =
        filters.selectedTypes.length === 0 ||
        filters.selectedTypes.some((selectedType) =>
          siteMethodsArray.some((siteMethod) =>
            siteMethod.toLowerCase().includes(selectedType.toLowerCase())
          )
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

      // FIX: New district filter logic
      const districtMatch =
        filters.districtTokens.length === 0 ||
        filters.districtTokens.some((token) =>
          (site.District || '').toLowerCase().includes(token.toLowerCase())
        );

      return (
        inYieldRange &&
        siteTypeMatch &&
        nameMatch &&
        zonaIdMatch &&
        districtMatch
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
  }, [latestSiteData, filters, zoneNames]);

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

  const handleInitiateConfirmation = () => {
    const selectedFullEntries = selectedScreeningIds.map(markerKey =>
      flattenedEntries.find(e => e.markerKey === markerKey)
    ).filter(Boolean);

    setEntriesToConfirm(selectedFullEntries);
    setOpenConfirmationDialog(true);
  };

  const handleConfirmSelectionsInDialog = async (confirmedSelections) => {
    if (confirmedSelections.length > 0) {
      const { data, error } = await supabase
        .from('tickets')
        .insert(confirmedSelections)
        .select();

      if (error) console.error('❌ Ticket insert error:', error);
      else {
        console.log('✅ Tickets inserted:', data);
        setSelectedScreeningIds([]);
        setEntriesToConfirm([]);
        setOpenConfirmationDialog(false);
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

  const availableSiteTypes = useMemo(() => {
    const allMethods = siteData.flatMap((s) => {
      const methods = s.methods;
      if (methods instanceof Set) {
        return Array.from(methods);
      }
      if (Array.isArray(methods)) {
        return methods;
      }
      if (typeof methods === 'string') {
        return methods.split(',').map(m => m.trim());
      }
      return [];
    });

    const uniqueMethods = new Set(allMethods.filter(method => typeof method === 'string' && method.toLowerCase() !== 'na'));
    return Array.from(uniqueMethods);
  }, [siteData]);

  // NEW: Memoized list of all unique districts
  const availableDistricts = useMemo(() => {
    return [...new Set(siteData.map(s => s.District))].filter(Boolean);
  }, [siteData]);


  return (
    <ThemeProvider theme={customTheme}>
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
        <Box sx={{ pt: 1.75, pb: 1 }}>
          <SidebarFilterControls
            filters={filters}
            setFilters={setFilters}
            availableSiteTypes={availableSiteTypes}
            // Pass the new availableDistricts prop to the filter controls
            availableDistricts={availableDistricts}
          />
        </Box>
        
        <Typography variant="subtitle1" color="primary.main" sx={{ mt: 0, ml: 1. ,mb:1, textAlign:'right' }}>
          Showing {flattenedEntries.length} results
        </Typography>
      
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ textAlign: 'center', width: '100%', my: 2, ml:3}}
        >
          Select locations below & Press "Confirm Selection"
        </Typography>

        <Button
          sx={{ backgroundColor: '#9854CB', color: '#fff', borderRadius: 10, mb: 2 }}
          fullWidth
          variant="contained"
          disabled={selectedScreeningIds.length === 0}
          onClick={handleInitiateConfirmation}
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

        <EntryConfirmationDialog
          open={openConfirmationDialog}
          onClose={() => setOpenConfirmationDialog(false)}
          selectedEntries={entriesToConfirm}
          onConfirmSelection={handleConfirmSelectionsInDialog}
        />
      </Box>
    </ThemeProvider>
  );
}