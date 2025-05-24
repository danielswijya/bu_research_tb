import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Box, Typography, Checkbox, Button, useTheme } from '@mui/material';
import SidebarFilterControls from './SidebarFilterControls';

export default function SidebarSelector({ onConfirm, siteData, onFilter, selectedScreeningIds, setSelectedScreeningIds }) {
  const [locations, setLocations] = useState([]);
  const [zoneNames, setZoneNames] = useState(new Map());
  const [flattenedEntries, setFlattenedEntries] = useState([]);
  const [filters, setFilters] = useState({ selectedZonaIds: [], rankByScreened: false, rankByDiagnosed: false, searchQuery: '' });

  const siteZonaIds = useMemo(() => new Set(siteData.map(site => site.Zona_ID)), [siteData]);
  const visibleEntries = flattenedEntries.filter(entry =>
    filters.selectedZonaIds.length === 0 || filters.selectedZonaIds.includes(entry.zonaId)
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
        geojson.features.map(f => [Math.floor(f.properties.Zona_ID), f.properties.Zone_Nam_1])
      );
      setZoneNames(map);
    } catch (err) {
      console.error('❌ Error loading geojson:', err);
    }
  }

  useEffect(() => {
    if (!locations.length || !siteData.length || zoneNames.size === 0) return;

    const filtered = locations
      .filter(loc => siteZonaIds.has(loc.Zona_ID))
      .filter(loc => {
        const zonaId = Math.floor(loc.Zona_ID);
        const zoneName = zoneNames.get(zonaId) || '';
        const query = filters.searchQuery.trim().toLowerCase();
        return zonaId.toString().startsWith(query)|| zoneName.toLowerCase().includes(query);
      })
      .flatMap(loc => {
        const matchingSites = siteData.filter(site => site.Zona_ID === loc.Zona_ID);
        return matchingSites.map(site => ({
          zonaId: loc.Zona_ID,
          rank: loc.Rank,
          screeningId: site.Screening_Location_ID,
          populationMedian: loc.total_screened_median ?? 'N/A',
          district: loc.district,
          lat: site.lat,
          lon: site.lon,
          Site_Type: site.Site_Type,
          total_screened: site.total_screened,
          total_diagnosed: site.total_diagnosed
        }));
      });

    const ranked = [...filtered];
    if (filters.rankByScreened) ranked.sort((a, b) => b.total_screened - a.total_screened);
    if (filters.rankByDiagnosed) ranked.sort((a, b) => b.total_diagnosed - a.total_diagnosed);

    setFlattenedEntries(ranked);
    onFilter?.(ranked);
  }, [locations, siteData, filters, zoneNames]);

  const handleConfirm = async () => {
    const inserts = selectedScreeningIds.map(screeningId => ({ Screening_Location_ID: screeningId }));
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

  const toggleSelection = (screeningId) => {
    setSelectedScreeningIds(prev =>
      prev.includes(screeningId)
        ? prev.filter(id => id !== screeningId)
        : [...prev, screeningId]
    );
  };

  return (
    <Box sx={{ position: 'fixed', top: '75px', right: 0, width: 350, height: '83vh', bgcolor: 'background.paper', borderLeft: '1px solid #ddd', borderTopLeftRadius: 14, borderBottomLeftRadius: 14, overflowY: 'auto', px: 2, pb: 4, zIndex: 1000, boxShadow: '-4px 0 12px rgba(0,0,0,0.1)' }}>
      <SidebarFilterControls
        filters={filters}
        setFilters={setFilters}
        availableZonaIds={Array.from(new Set(siteData.map(site => site.Zona_ID)))}
      />

      <Box sx={{ position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 1, pt: 1, pb: 2 }}>
        <Button
          fullWidth
          variant="contained"
          disabled={selectedScreeningIds.length === 0}
          onClick={handleConfirm}
        >
          Confirm Selection
        </Button>
      </Box>

      {visibleEntries.map((entry, index) => {
        const isSelected = selectedScreeningIds.includes(entry.screeningId);
        return (
          <Box
            key={`${entry.screeningId}-${entry.zonaId}-${index}`}
            sx={{ border: isSelected ? '2px solid' : '1px solid', borderColor: isSelected ? 'primary.main' : 'divider', borderRadius: 2, p: 2, mb: 1, cursor: 'pointer', position: 'relative' }}
            onClick={() => toggleSelection(entry.screeningId)}
          >
            <Checkbox
              checked={isSelected}
              onChange={(e) => { e.stopPropagation(); toggleSelection(entry.screeningId); }}
              sx={{ position: 'absolute', top: 8, right: 8 }}
            />
            <Typography variant="body2">{zoneNames.get(entry.zonaId) ?? 'Unknown'}</Typography>
            <Typography variant="subtitle2">Zona ID: {entry.zonaId}</Typography>
            <Typography variant="body2">Location ID: {entry.screeningId ?? 'N/A'}</Typography>
            <Typography variant="caption" color="text.secondary">{entry.district}</Typography>
            <Typography variant='body2'>Total Screened: {entry.total_screened}</Typography>
            <Typography variant='body2'>Total Diagnosed: {entry.total_diagnosed}</Typography>
            <Typography variant='body2'>Yield Ratio: {(entry.total_screened > 0 ? ((entry.total_diagnosed / entry.total_screened) * 100).toFixed(3) : '0.000')}%</Typography>
            <Typography variant='body2'>Type: {entry.Site_Type}</Typography>
          </Box>
        );
      })}
    </Box>
  );
}
