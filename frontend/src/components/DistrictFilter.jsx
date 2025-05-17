import { useEffect, useState } from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { supabase } from '../../lib/supabaseClient';

export default function DistrictFilter({ value, onChange }) {
  const [districts, setDistricts] = useState([]);

  useEffect(() => {
    async function loadDistricts() {
      const { data, error } = await supabase
        .from('zones')
        .select('district');

      if (!error && data) {
        const unique = [...new Set(data.map((d) => d.district).filter(Boolean))];
        console.log('✅ Loaded districts:', unique);
        setDistricts(unique);
      } else {
        console.error('❌ District load error:', error);
      }
    }

    loadDistricts();
  }, []);

  return (
    <Box sx={{ position: 'absolute', top: 20, left: 55, zIndex: 1000, width: 220 }}>
      <FormControl fullWidth size="small">
        <InputLabel>District</InputLabel>
        <Select
          value={value || ''}
          label="District"
          onChange={(e) => onChange(e.target.value)}
        >
          {districts.map((district) => (
            <MenuItem key={district} value={district}>
              {district}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}