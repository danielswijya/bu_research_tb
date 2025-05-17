import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {Alert, Collapse, Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button} from '@mui/material';

export default function TicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [editableFields, setEditableFields] = useState([]);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .order('date_created', { ascending: false });

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
      .eq('screening_id', ticket.screening_id);

    if (error) {
      console.error('❌ Update failed:', error);
    } else {
      console.log('✅ Updated ticket:', ticket);
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 5000)
    }
  };

  const handleDelete = async (screening_id) => {
  const { error } = await supabase
    .from('tickets')
    .delete()
    .eq('screening_id', screening_id);

  if (error) {
    console.error('❌ Delete failed:', error);
  } else {
    console.log(`🗑️ Deleted ticket for screening_id ${screening_id}`);
    // Update frontend state
    const updated = editableFields.filter(t => t.screening_id !== screening_id);
    setEditableFields(updated);
  }
};


  return (
    <TableContainer component={Paper} sx={{ maxWidth: 800, margin: 'auto', mt: 4 }}>
      <Typography variant="h6" align="center" sx={{ mt: 2 }}>
        Submitted Tickets
      </Typography>

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
              <TableCell>{ticket.screening_id}</TableCell>
              <TableCell>
                <input
                  type="number"
                  value={ticket.screened_count}
                  onChange={(e) => handleChange(index, 'screened_count', parseInt(e.target.value))}
                  style={{ width: '80px' }}
                />
              </TableCell>
              <TableCell>
                <input
                  type="number"
                  value={ticket.positive_count}
                  onChange={(e) => handleChange(index, 'positive_count', parseInt(e.target.value))}
                  style={{ width: '80px' }}
                />
              </TableCell>
              <TableCell>{new Date(ticket.date_created).toLocaleString()}</TableCell>
              <TableCell>
                <Button size="small" onClick={() => handleSave(ticket)}>Save</Button>
              </TableCell>
              <TableCell>
                <Button size='small'color='error' onClick={()=> handleDelete(ticket.screening_id)}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {showAlert && (
        <div style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 9999
        }}>
          <Collapse in={showAlert}>
            <Alert severity="success" sx={{ minWidth: 250 }}>
              Ticket saved successfully!
            </Alert>
          </Collapse>
        </div>
      )}
    </TableContainer>
  );
}
