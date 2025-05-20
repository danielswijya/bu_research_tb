import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Box, Typography, Checkbox, Button, useTheme, TextField } from '@mui/material';

export default function SidebarSelector({ onConfirm, siteData }) {
  const [locations, setLocations] = useState([]);
  const [selectedZonaIds, setSelectedZonaIds] = useState([]);
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const siteZonaIds = new Set(siteData.map(site => site.Zona_ID));

  const filteredLocations = locations
    .filter((loc) => siteZonaIds.has(loc.Zona_ID))
    .filter((loc) =>
      loc.Zona_ID.toString().includes(searchQuery.trim())
    );

  useEffect(() => {
    fetchLocations();
  }, []);

  async function fetchLocations() {
    const { data, error } = await supabase
      .from('neighborhood_stats')
      .select('*');

    if (error) {
      console.error('❌ Supabase fetch error:', error);
    } else {
      setLocations(data);
    }
  }

  const handleConfirm = async () => {

    const inserts = selectedZonaIds.flatMap((zonaId) => {
    const matchingSites = siteData.filter((s) => s.Zona_ID === zonaId);
    const firstSite = matchingSites[0]; // ✅ Only one site per zone
    if (firstSite) {
      return [{
        Screening_Location_ID: firstSite.Screening_Location_ID,
      }];
    }
    return [];
  });



    if (inserts.length > 0) {
      const { data, error } = await supabase
        .from('tickets')
        .insert(inserts)
        .select();

      if (error) {
        console.error('❌ Ticket insert error:', error);
      } else {
        console.log('✅ Tickets inserted:', data);
        setSelectedZonaIds([]);
        if (onConfirm) onConfirm();
      }
    }
  };

  const toggleSelection = (zonaId) => {
    setSelectedZonaIds((prev) =>
      prev.includes(zonaId)
        ? prev.filter((z) => z !== zonaId)
        : [...prev, zonaId]
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
      <Typography variant="h6" sx={{ mt: 3, mb: 2, fontWeight: 600 }}>
        Select Zones
      </Typography>

      <TextField
        label="Search Zona ID"
        variant="outlined"
        size="small"
        fullWidth
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 2 }}
      />

      <Box sx={{ position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 1, pt: 1, pb: 2 }}>
        <Button
          fullWidth
          variant="contained"
          disabled={selectedZonaIds.length === 0}
          onClick={handleConfirm}
        >
          Confirm Selection
        </Button>
      </Box>

      {filteredLocations.map((loc) => {
        const zonaId = loc.Zona_ID;
        const isSelected = selectedZonaIds.includes(zonaId);
        const matchingSite = siteData.find((s) => s.Zona_ID === zonaId);

        const handleCheckboxClick = (e) => {
          e.stopPropagation();
          toggleSelection(zonaId);
        };

        return (
          <Box
            key={zonaId}
            sx={{
              border: isSelected ? '2px solid' : '1px solid',
              borderColor: isSelected ? 'primary.main' : 'divider',
              borderRadius: 2,
              p: 2,
              mb: 1,
              cursor: 'pointer',
              position: 'relative',
            }}
            onClick={() => toggleSelection(zonaId)}
          >
            <Checkbox
              checked={isSelected}
              onChange={handleCheckboxClick}
              sx={{ position: 'absolute', top: 8, right: 8 }}
            />
            <Typography variant="body2">Rank: {loc.Rank}</Typography>
            <Typography variant="subtitle2">Zona ID: {loc.Zona_ID}</Typography>
            <Typography variant="body2">Screening ID: {matchingSite?.Screening_Location_ID ?? 'N/A'}</Typography>
            <Typography variant="body2">
              Population Median: {loc.total_screened_median ?? 'N/A'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {loc.district}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}