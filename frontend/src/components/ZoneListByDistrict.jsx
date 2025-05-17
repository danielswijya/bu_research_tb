import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function ZoneListByDistrict({ district }) {
  const [zones, setZones] = useState([]);

  useEffect(() => {
    async function loadZones() {
      const { data, error } = await supabase
        .from('neighborhood_stats')
        .select('zona_id, district, census_population, screened')
        .eq('district', district);

      if (error) {
        console.error('❌ Error fetching zones by district:', error);
        setZones([]);
      } else {
        setZones(data);
      }
    }

    if (district) loadZones();
  }, [district]);

  if (!district) return null;

  return (
    <div
      style={{
        backgroundColor: 'white',
        padding: '10px',
        borderRadius: '8px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        maxHeight: '300px',
        overflowY: 'auto',
      }}
    >
      <h4 style={{ margin: '0 0 10px' }}>Zones in {district}</h4>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {zones.map((z) => (
          <li key={z.zona_id}>
            <strong>{z.zona_id}</strong>: {z.screened ?? 0} screened
          </li>
        ))}
      </ul>
    </div>
  );
}