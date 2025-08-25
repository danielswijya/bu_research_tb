import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  Collapse,
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  Grid
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import ExportCSVButton from '../components/ExportFunction';
import TicketsTable from '../components/TicketsTable';
import DashboardLayout from '../layouts/DashboardLayout';
import TBDashboardStatCard from '../components/TBDashboardStatCard';
import TBAnalyticsLineChart from '../components/TBAnalyticsLineChart';
import BarOverviewCard from '../components/BarOverviewCard';

export default function TBTicketsDashboard() {
  const [tickets, setTickets] = useState([]);
  const [editableFields, setEditableFields] = useState([]);
  const [showAlert, setShowAlert] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  useEffect(() => { fetchTickets(); }, []);

  const fetchTickets = async () => {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .order('selected_date', { ascending: false });

    if (!error) {
      setTickets(data);
      setEditableFields(data);
    }
  };

  const handleChange = (index, field, value) => {
    const updated = [...editableFields];
    updated[index][field] = value;
    setEditableFields(updated);
  };

  const handleSave = async (ticket) => {
    const { error } = await supabase
      .from('tickets')
      .update({
        screened_count: ticket.screened_count,
        positive_count: ticket.positive_count,
        saved: true,
      })
      .eq('id', ticket.id);

    if (!error) {
      setEditableFields((prev) =>
        prev.map((t) =>
          t.id === ticket.id
            ? { ...t, saved: true }
            : t
        )
      );
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 5000);
    }
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('tickets').delete().eq('id', id);
    if (!error) {
      setEditableFields((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const handleSaveAll = async () => {
    const updatePromises = editableFields.map(async (ticket) => {
      const { error } = await supabase
        .from('tickets')
        .update({
          screened_count: ticket.screened_count,
          positive_count: ticket.positive_count,
          saved: true,
        })
        .eq('id', ticket.id);

      if (!error) {
        return { ...ticket, saved: true };
      }
      return null;
    });

    const results = await Promise.all(updatePromises);
    const successfulUpdates = results.filter(Boolean);

    setEditableFields((prev) =>
      prev.map((t) => {
        const updated = successfulUpdates.find((u) => u.id === t.id);
        return updated ? updated : t;
      })
    );

    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 5000);
  };

  const handleDeleteAll = async () => {
    const ids = editableFields.map((t) => t.id);
    if (ids.length === 0) return;
    const { error } = await supabase.from('tickets').delete().in('id', ids);
    if (!error) {
      await fetchTickets();
      setOpenDeleteDialog(false);
    }
  };

  // For line chart (monthly)
  const monthlyScreenings = Array(12).fill(0);
  const monthlyPositives = Array(12).fill(0);
  tickets.forEach(t => {
    if (t.selected_date) {
      const month = new Date(t.selected_date).getMonth();
      monthlyScreenings[month] += t.screened_count || 0;
      monthlyPositives[month] += t.positive_count || 0;
    }
  });

  // For bar chart (yield rates per screening date)
  const sortedTickets = [...tickets].sort((a, b) => new Date(a.selected_date) - new Date(b.selected_date));
  const dateMap = {};
  sortedTickets.forEach(t => {
    if (t.selected_date && t.screened_count && t.positive_count !== undefined) {
      const date = new Date(t.selected_date).toLocaleDateString();
      if (!dateMap[date]) dateMap[date] = { screened: 0, positive: 0 };
      dateMap[date].screened += t.screened_count;
      dateMap[date].positive += t.positive_count;
    }
  });
  const screeningDates = Object.keys(dateMap);
  const yieldRates = screeningDates.map(date =>
    dateMap[date].screened
      ? +(dateMap[date].positive / dateMap[date].screened * 100).toFixed(2)
      : 0
  );

  // All-time totals
  const totalScreenings = tickets.reduce((sum, t) => sum + (t.screened_count || 0), 0);
  const totalPositives = tickets.reduce((sum, t) => sum + (t.positive_count || 0), 0);

  // Per-date stats for chip/extra
  const dateStats = {};
  tickets.forEach(t => {
    if (t.selected_date) {
      const date = new Date(t.selected_date).toLocaleDateString();
      if (!dateStats[date]) dateStats[date] = { screened: 0, positive: 0, locations: new Set(), visits: 0 };
      dateStats[date].screened += t.screened_count || 0;
      dateStats[date].positive += t.positive_count || 0;
      if (t.location_name) dateStats[date].locations.add(t.location_name);
      dateStats[date].visits += 1;
    }
  });
  const allDates = Object.keys(dateStats).sort((a, b) => new Date(a) - new Date(b));
  const lastDate = allDates[allDates.length - 1];
  const prevDate = allDates[allDates.length - 2];
  const lastScreenings = lastDate ? dateStats[lastDate].screened : 0;
  const prevScreenings = prevDate ? dateStats[prevDate].screened : 0;
  const lastPositives = lastDate ? dateStats[lastDate].positive : 0;
  const prevPositives = prevDate ? dateStats[prevDate].positive : 0;

  // For subtext: show the new screenings/positives for the latest date
  const newScreeningsText = lastDate ? `You made ${lastScreenings} new screenings` : '';
  const newPositivesText = lastDate ? `You made ${lastPositives} new positives` : '';

  const uniqueLocations = new Set(tickets.map(t => t.location_name).filter(Boolean));
  const totalLocations = uniqueLocations.size;
  const prevLocations = new Set(sortedTickets.slice(0, -1).map(t => t.location).filter(Boolean)).size;

  const totalVisits = tickets.length;
  const prevVisits = tickets.length > 1 ? tickets.length - 1 : 0;

  return (
    <DashboardLayout>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          mb: 2,
          fontFamily: 'Inter, Roboto, Arial, sans-serif',
          color: '#222',
        }}
      >
        TB Dashboard
      </Typography>

      {/* Top Number Cards */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <TBDashboardStatCard
            title="Total Screenings"
            count={totalScreenings} // all-time total
            previousCount={prevScreenings} // previous date
            currentDateCount={lastScreenings} // most recent date
            subText={newScreeningsText}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TBDashboardStatCard
            title="Total TB Positives"
            count={totalPositives}
            previousCount={prevPositives}
            currentDateCount={lastPositives}
            subText={newPositivesText}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TBDashboardStatCard
            title="Total Locations"
            count={totalLocations}
            previousCount={prevLocations}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TBDashboardStatCard
            title="Total Visits"
            count={totalVisits}
            previousCount={prevVisits}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Analytics Graph */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <TBAnalyticsLineChart
            monthlyScreenings={monthlyScreenings}
            monthlyPositives={monthlyPositives}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <BarOverviewCard
            screeningDates={screeningDates}
            yieldRates={yieldRates}
          />
        </Grid>
      </Grid>

      {/* Recent Orders Table */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          boxShadow: '0 1px 4px 0 rgba(0,0,0,0.04)',
          p: 0,
          mb: 4,
          bgcolor: '#fff',
          border: '1px solid #e5e7eb',
          maxWidth: 1200,
          mx: 'auto',
        }}
      >
        <Box sx={{ p: 2, pb: 1, borderBottom: '1px solid #e5e7eb' }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              fontFamily: 'Inter, Roboto, Arial, sans-serif',
              color: '#222',
              fontSize: 16,
            }}
          >
            Recent TB Tickets
          </Typography>
        </Box>
        <Box sx={{ px: 2, pt: 2, pb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="contained" color="success" size="small" onClick={handleSaveAll} startIcon={<SaveIcon />}>
                Save All
              </Button>
              <Button variant="outlined" color="error" size="small" onClick={() => setOpenDeleteDialog(true)} startIcon={<DeleteIcon />}>
                Delete All
              </Button>
            </Box>
            <ExportCSVButton />
          </Box>
          <TicketsTable
            tickets={editableFields}
            onSave={handleSave}
            onDelete={handleDelete}
            onChange={handleChange}
          />
        </Box>
      </Paper>
      {showAlert && (
        <Box sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999 }}>
          <Collapse in={showAlert}>
            <Alert severity="success" sx={{ minWidth: 250 }}>
              ✔️Ticket(s) saved successfully!
            </Alert>
          </Collapse>
        </Box>
      )}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Delete All Tickets?</DialogTitle>
        <DialogContent>
          Are you sure you want to delete all submitted tickets? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDeleteAll}>
            Delete All
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}