import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
  Box,
  Typography,
  Checkbox,
  Button,
  useTheme,
} from '@mui/material';

export default function SidebarSelector({ onConfirm }) {
  const [locations, setLocations] = useState([]);
  const [selectedZonaIds, setSelectedZonaIds] = useState([]);
  const theme = useTheme();

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
    const { data: siteData, error: siteError } = await supabase
      .from('site_data')
      .select('Zona_ID, Screening_Location_ID');

    if (siteError) {
      console.error('❌ Site fetch error:', siteError);
      return;
    }

    const inserts = selectedZonaIds.flatMap((zonaId) => {
      const matchingSites = siteData.filter((s) => s.zona_id === zonaId);
      return matchingSites.map((site) => ({
        Zona_id: zonaId,
        Screening_Location_Id: site.screening_location_id,
        screened_count: 0,
        positive_count: 0,
      }));
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
      top: '75px',                  // Push down below navbar
      right: 0,
      width: 350,
      height: '83vh', // Fill only remaining space
      bgcolor: 'background.paper',
      borderLeft: '1px solid #ddd',
      borderTopLeftRadius: 14,
      borderBottomLeftRadius: 14,
      overflowY: 'auto',            // Allow internal scroll
      px: 2,
      pb: 4,                        // Bottom spacing to prevent cut-off
      zIndex: 1000,
      boxShadow: '-4px 0 12px rgba(0,0,0,0.1)',
    }}
  >

      <Typography variant="h6" sx={{mt: 3, mb: 2,fontWeight: 600,}}>
        Select Zones
      </Typography>

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


      {locations.map((loc) => {
  const zonaId = loc.Zona_ID;
  const isSelected = selectedZonaIds.includes(zonaId);

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
      onClick={() => toggleSelection(zonaId)} // click card
    >
      {/* ✅ Independent Checkbox */}
      <Checkbox
        checked={isSelected}
        onChange={handleCheckboxClick}
        sx={{ position: 'absolute', top: 8, right: 8 }}
      />
            <Typography variant="body2">Rank: {loc.Rank}</Typography>
            <Typography variant="subtitle2">Zona ID: {loc.Zona_ID}</Typography>
            <Typography variant="body2">
              Population: {loc.total_screened_median ?? 'N/A'}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}