import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Alert, Collapse, Box, Typography, Paper, Dialog, DialogActions, DialogTitle, DialogContent, Button } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import ExportCSVButton from '../components/ExportFunction';
import TicketsTable from '../components/TicketsTable';

export default function TicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [editableFields, setEditableFields] = useState([]);
  const [showAlert, setShowAlert] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      // FIX: Change order by column from 'created_at' to 'selected_date'
      .order('selected_date', { ascending: false });

    if (error) {
      console.error('❌ Error fetching tickets:', error);
    } else {
      setTickets(data);
      setEditableFields(data);
      console.log("✅ Tickets fetched successfully:", data); // Add for debugging
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
        // Ensure other fields that might be updated are also included if they are editable
        // selected_method_type: ticket.selected_method_type, // Example if you make this editable
        // selected_date: ticket.selected_date, // Example if you make this editable
        // Zona_name: ticket.Zona_name, // Example if you make this editable
        // District: ticket.District, // Example if you make this editable
      })
      .eq('id', ticket.id);

    if (error) {
      console.error('❌ Update failed:', error);
    } else {
      console.log('✅ Updated ticket:', ticket);
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
    if (error) {
      console.error('❌ Delete failed:', error);
    } else {
      console.log(`🗑️ Deleted ticket with ID ${id}`);
      setEditableFields((prev) => prev.filter((t) => t.id !== id));
      // No need to fetchTickets here if the local state update is sufficient
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

      if (error) {
        console.error('❌ Batch update failed for ticket:', ticket.id, error);
        return null; // Return null for failed updates
      }
      return { ...ticket, saved: true }; // Return updated ticket for successful ones
    });

    const results = await Promise.all(updatePromises);
    const successfulUpdates = results.filter(Boolean); // Filter out nulls (failed updates)

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
    if (error) {
      console.error('❌ Error deleting all tickets:', error);
    } else {
      console.log('✅ All tickets deleted');
      // After deleting all, immediately fetch updated list (should be empty)
      await fetchTickets();
      setOpenDeleteDialog(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', mt: 4 }}>
      <Typography variant="h6" align="center" sx={{ mb: 2 }}>
        Submitted Tickets
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, mb: 2 }}>
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
    </Box>
  );
}