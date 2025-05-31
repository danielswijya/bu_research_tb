import React from 'react';
import { Button } from '@mui/material';
import Papa from 'papaparse';
import { supabase } from '../../lib/supabaseClient';
import DownloadIcon from '@mui/icons-material/Download';

export default function ExportCSVButton() {
const handleExportCSV = async () => {
const { data, error } = await supabase.from('tickets').select('*');

if (error) {
    console.error('❌ Error exporting:', error);
    alert('Failed to export ticket data.');
    return;
}

const csv = Papa.unparse(data);
const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
const url = URL.createObjectURL(blob);

const link = document.createElement('a');
link.href = url;
const now = new Date();
const shortTime = now.toLocaleString('en-GB', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).replace(/[/,: ]/g, '-');

link.setAttribute('download', `tb_tickets_export_${shortTime}.csv`);
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
};

return (
<Button variant="outlined" onClick={handleExportCSV} sx={{ mb: 0, backgroundColor: "#9854CB", color: "#FFFFFF" }}>
    <DownloadIcon />
</Button>
);
}
