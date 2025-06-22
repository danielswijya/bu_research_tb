// frontend/src/components/AdvancedOptionsDialog.jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Chip,
  Stack,
  Box,
  Typography,
} from '@mui/material';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import AddIcon from '@mui/icons-material/Add';

export default function AdvancedOptionsDialog({
  open,
  onClose,
  initialNameTokens,
  initialZonaIdTokens,
  initialLocationIdTokens,
  onApplyFilters,
}) {
  const [nameInput, setNameInput] = useState('');
  const [zonaIdInput, setZonaIdInput] = useState('');
  const [locationIdInput, setLocationIdInput] = useState('');

  const [nameTokens, setNameTokens] = useState(initialNameTokens || []);
  const [zonaIdTokens, setZonaIdTokens] = useState(initialZonaIdTokens || []);
  const [locationIdTokens, setLocationIdTokens] = useState(initialLocationIdTokens || []);

  useEffect(() => {
    setNameTokens(initialNameTokens || []);
    setZonaIdTokens(initialZonaIdTokens || []);
    setLocationIdTokens(initialLocationIdTokens || []);
  }, [initialNameTokens, initialZonaIdTokens, initialLocationIdTokens]);

  const handleAddToken = (tokenType, input, setInput, setTokens) => {
    if (input.trim() !== '') {
      setTokens((prev) => [...new Set([...prev, input.trim()])]);
      setInput('');
    }
  };

  const handleDeleteToken = (tokenType, tokenToDelete, setTokens) => {
    setTokens((prev) => prev.filter((token) => token !== tokenToDelete));
  };

  const handleApply = () => {
    onApplyFilters({
      nameTokens,
      zonaIdTokens,
      locationIdTokens,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ sx: { borderRadius: 3, boxShadow: 3 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: '#E6F0FA', borderBottom: '1px solid #9854CB', color: '#333' }}>
        <FilterAltIcon />
        <Typography variant="h6" fontWeight={600}>Advanced Filters</Typography>
      </DialogTitle>
      <DialogContent dividers sx={{ pt: 2 }}>
        {/* Zone Name Filter */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>Filter by Zone Name (Case-insensitive includes with)</Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="Add Zone Name token"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddToken('name', nameInput, setNameInput, setNameTokens);
                e.preventDefault();
              }
            }}
            InputProps={{
              endAdornment: (
                <Button onClick={() => handleAddToken('name', nameInput, setNameInput, setNameTokens)} size="small">
                  <AddIcon />
                </Button>
              ),
            }}
          />
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
            {nameTokens.map((token, index) => (
              <Chip
                key={index}
                label={token}
                onDelete={() => handleDeleteToken('name', token, setNameTokens)}
                color="primary"
                variant="outlined"
                size="small"
              />
            ))}
          </Stack>
        </Box>

        {/* Zona ID Filter */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>Filter by Zona ID (Numerical Prefix Match)</Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="Add Zona ID token"
            value={zonaIdInput}
            onChange={(e) => setZonaIdInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddToken('zonaId', zonaIdInput, setZonaIdInput, setZonaIdTokens);
                e.preventDefault();
              }
            }}
            InputProps={{
              endAdornment: (
                <Button onClick={() => handleAddToken('zonaId', zonaIdInput, setZonaIdInput, setZonaIdTokens)} size="small">
                  <AddIcon />
                </Button>
              ),
            }}
          />
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
            {zonaIdTokens.map((token, index) => (
              <Chip
                key={index}
                label={token}
                onDelete={() => handleDeleteToken('zonaId', token, setZonaIdTokens)}
                color="secondary"
                variant="outlined"
                size="small"
              />
            ))}
          </Stack>
        </Box>

        {/* Location ID Filter */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>Filter by Location ID (Numerical Prefix Match)</Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="Add Location ID token"
            value={locationIdInput}
            onChange={(e) => setLocationIdInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddToken('locationId', locationIdInput, setLocationIdInput, setLocationIdTokens);
                e.preventDefault();
              }
            }}
            InputProps={{
              endAdornment: (
                <Button onClick={() => handleAddToken('locationId', locationIdInput, setLocationIdInput, setLocationIdTokens)} size="small">
                  <AddIcon />
                </Button>
              ),
            }}
          />
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
            {locationIdTokens.map((token, index) => (
              <Chip
                key={index}
                label={token}
                onDelete={() => handleDeleteToken('locationId', token, setLocationIdTokens)}
                color="info"
                variant="outlined"
                size="small"
              />
            ))}
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined" color="secondary">Cancel</Button>
        <Button onClick={handleApply} variant="contained" sx={{ backgroundColor: '#9854CB', color: '#fff' }}>Apply Filters</Button>
      </DialogActions>
    </Dialog>
  );
}