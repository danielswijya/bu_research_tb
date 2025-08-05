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
  // FIX: Change to initialDistrictTokens to match parent component
  initialDistrictTokens,
  // FIX: Change to onApplyFilters to pass the new districtTokens
  onApplyFilters,
}) {
  const [nameInput, setNameInput] = useState('');
  const [zonaIdInput, setZonaIdInput] = useState('');
  // FIX: New state for District input
  const [districtInput, setDistrictInput] = useState('');

  const [nameTokens, setNameTokens] = useState(initialNameTokens || []);
  const [zonaIdTokens, setZonaIdTokens] = useState(initialZonaIdTokens || []);
  // FIX: New state for District tokens
  const [districtTokens, setDistrictTokens] = useState(initialDistrictTokens || []);

  useEffect(() => {
    setNameTokens(initialNameTokens || []);
    setZonaIdTokens(initialZonaIdTokens || []);
    // FIX: Sync state with initialDistrictTokens prop
    setDistrictTokens(initialDistrictTokens || []);
  }, [initialNameTokens, initialZonaIdTokens, initialDistrictTokens]);

  const handleAddToken = (tokenType, input, setInput, setTokens) => {
    if (input.trim() !== '') {
      setTokens((prev) => [...new Set([...prev, input.trim()])]);
      setInput('');
    }
  };

  const handleDeleteToken = (tokenToDelete, setTokens) => {
    setTokens((prev) => prev.filter((token) => token !== tokenToDelete));
  };

  const handleApply = () => {
    onApplyFilters({
      nameTokens,
      zonaIdTokens,
      // FIX: Pass districtTokens
      districtTokens,
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
          <Typography variant="subtitle1" gutterBottom>Filter by Zona Name (Case-insensitive includes with)</Typography>
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
                onDelete={() => handleDeleteToken(token, setNameTokens)}
                color="primary"
                variant="outlined"
                size="small"
              />
            ))}
          </Stack>
        </Box>


        {/* District Filter */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>Filter by District (Case-insensitive includes with)</Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="Add District token"
            value={districtInput}
            onChange={(e) => setDistrictInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddToken('district', districtInput, setDistrictInput, setDistrictTokens);
                e.preventDefault();
              }
            }}
            InputProps={{
              endAdornment: (
                <Button onClick={() => handleAddToken('district', districtInput, setDistrictInput, setDistrictTokens)} size="small">
                  <AddIcon />
                </Button>
              ),
            }}
          />
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
            {districtTokens.map((token, index) => (
              <Chip
                key={index}
                label={token}
                onDelete={() => handleDeleteToken(token, setDistrictTokens)}
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