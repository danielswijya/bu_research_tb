// WIP starter layout for dashboard-style Tickets page
// Inspired by MUI v7 dashboard template: https://github.com/mui/material-ui/tree/v7.1.0/docs/data/material/getting-started/templates/dashboard

import React, { useEffect, useState } from 'react';
import {
Box,
Grid,
Paper,
Typography,
Button,
Container,
Divider,
CircularProgress,
} from '@mui/material';
import { supabase } from '../../lib/supabaseClient';
import Chart from './components/Chart'; // Placeholder for line/bar chart
import SummaryCard from './components/SummaryCard'; // Custom component you'll define
import TicketsTable from './components/TicketsTable'; // Modular table with edit/save/delete

export default function DashboardTicketsPage() {
const [tickets, setTickets] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
fetchTickets();
}, []);

const fetchTickets = async () => {
setLoading(true);
const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: false });

if (!error) setTickets(data);
setLoading(false);
};

const totalScreened = tickets.reduce((sum, t) => sum + (t.screened_count || 0), 0);
const totalPositive = tickets.reduce((sum, t) => sum + (t.positive_count || 0), 0);

return (
<Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
    <Grid container spacing={3}>
    {/* Header */}
    <Grid item xs={12}>
        <Typography variant="h5" fontWeight={600}>Dashboard</Typography>
    </Grid>

    {/* Summary Cards */}
    <Grid item xs={12} md={6} lg={3}>
        <SummaryCard title="Total Screened" value={totalScreened} color="info" />
    </Grid>
    <Grid item xs={12} md={6} lg={3}>
        <SummaryCard title="Total Diagnosed" value={totalPositive} color="error" />
    </Grid>

    {/* Chart placeholder */}
    <Grid item xs={12} md={8}>
        <Paper sx={{ p: 2, height: 300 }}>
        <Chart data={tickets} />
        </Paper>
    </Grid>

    {/* Table with full ticket data */}
    <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
            Recent Submissions
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {loading ? <CircularProgress /> : <TicketsTable tickets={tickets} refresh={fetchTickets} />}
        </Paper>
    </Grid>
    </Grid>
</Container>
);
}
