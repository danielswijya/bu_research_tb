import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {Tooltip, Alert,Collapse,Box,Typography,Table,TableBody,TableCell,TableContainer,TableHead,TableRow,Paper,Button, Dialog, DialogActions, DialogTitle, DialogContent} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import ExportCSVButton from '../components/ExportFunction';


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
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching tickets:', error);
    } else {
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
      })
      .eq('id', ticket.id);

    if (error) {
      console.error('❌ Update failed:', error);
    } else {
      console.log('✅ Updated ticket:', ticket);
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
    }
  };

  const handleSaveAll = async () => {
    for (let ticket of editableFields) {
      await supabase
        .from('tickets')
        .update({
          screened_count: ticket.screened_count,
          positive_count: ticket.positive_count,
        })
        .eq('id', ticket.id);
    }
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 5000);
  };

    const handleDeleteAll = async () => {
    const ids = editableFields.map(t => t.id); // ✅ get all ticket IDs

    if (ids.length === 0) {
      console.warn("No tickets to delete.");
      return;
    }

    const { error } = await supabase
      .from('tickets')
      .delete()
      .in('id', ids); // ✅ valid where clause

    if (error) {
      console.error('❌ Error deleting all tickets:', error);
    } else {
      console.log('✅ All tickets deleted');
      await fetchTickets(); // refresh table
      setOpenDeleteDialog(false);
    }
  };


  return (
    <TableContainer component={Paper} sx={{ maxWidth: 800, margin: 'auto', mt: 4 }}>
      <Typography variant="h6" align="center" sx={{ mt: 2 }}>
        Submitted Tickets
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: { xs: 2, sm: 3 }, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Save All">
            <Button variant="contained" color="success" size="small" onClick={handleSaveAll}>
              <SaveIcon />
            </Button>
          </Tooltip>

          <Tooltip title="Delete All Tickets">
            <Button variant="outlined" color="error" size="small" onClick={() => setOpenDeleteDialog(true)}>
              <DeleteIcon />
            </Button>
          </Tooltip>
        </Box>

        <ExportCSVButton />
      </Box>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Screening ID</TableCell>
            <TableCell>Screened</TableCell>
            <TableCell>Positive</TableCell>
            <TableCell>Date Created</TableCell>
            <TableCell>Save</TableCell>
            <TableCell>Delete</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {editableFields.map((ticket, index) => (
            <TableRow key={index}>
              <TableCell>{ticket.Screening_Location_ID}</TableCell>
              <TableCell>
                <input
                  type="number"
                  value={ticket.screened_count ?? ''}
                  onChange={(e) => handleChange(index, 'screened_count', e.target.value === '' ? null : parseInt(e.target.value))}
                  style={{ width: '80px' }}
                />
              </TableCell>
              <TableCell>
                <input
                  type="number"
                  value={ticket.positive_count ?? ''}
                  onChange={(e) => handleChange(index, 'positive_count', e.target.value === '' ? null : parseInt(e.target.value))}
                  style={{ width: '80px' }}
                />
              </TableCell>
              <TableCell>
                {ticket.created_at ? new Date(ticket.created_at).toLocaleString() : 'N/A'}
              </TableCell>
              <TableCell>
                <Button variant="text" color="primary" size="small" onClick={() => handleSave(ticket)} >
                  <SaveIcon />
                </Button>
              </TableCell>
              <TableCell>
                <Button variant='text' size="small" color="error" onClick={() => handleDelete(ticket.id)}>
                  <CloseIcon />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

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
    </TableContainer>
  );
}