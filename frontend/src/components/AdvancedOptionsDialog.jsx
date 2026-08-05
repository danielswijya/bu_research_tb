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
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  MenuItem,
  Checkbox,
  ListItemText,
} from '@mui/material';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import AddIcon from '@mui/icons-material/Add';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

export default function AdvancedOptionsDialog({
  open,
  onClose,
  initialNameTokens,
  initialDistrictTokens,
  onApplyFilters,
  availableDistricts,
}) {
  const [nameInput, setNameInput] = useState('');
  const [nameTokens, setNameTokens] = useState(initialNameTokens || []);
  const [districtTokens, setDistrictTokens] = useState(initialDistrictTokens || []);

  useEffect(() => {
    setNameTokens(initialNameTokens || []);
    setDistrictTokens(initialDistrictTokens || []);
  }, [initialNameTokens, initialDistrictTokens]);

  const handleAddToken = (tokenType, input, setInput, setTokens) => {
    if (input.trim() !== '') {
      setTokens((prev) => [...new Set([...prev, input.trim()])]);
      setInput('');
    }
  };

  const handleDeleteToken = (tokenToDelete, setTokens) => {
    setTokens((prev) => prev.filter((token) => token !== tokenToDelete));
  };

  const handleDistrictChange = (event) => {
    const {
      target: { value },
    } = event;
    setDistrictTokens(typeof value === 'string' ? value.split(',') : value);
  };

  const handleApply = () => {
    onApplyFilters({
      nameTokens,
      districtTokens,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ sx: { borderRadius: 3, boxShadow: 3 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: '#f0fdfa', borderBottom: '1px solid #0f766e', color: '#333' }}>
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

        {/* District Filter - Replaced with a multi-select dropdown */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>Filter by District</Typography>
          <FormControl fullWidth size="small">
            <InputLabel id="district-multi-checkbox-label">District</InputLabel>
            <Select
              labelId="district-multi-checkbox-label"
              id="district-multi-checkbox"
              multiple
              value={districtTokens}
              onChange={handleDistrictChange}
              input={<OutlinedInput label="District" />}
              renderValue={(selected) => selected.join(', ')}
              MenuProps={MenuProps}
            >
              {availableDistricts.map((name) => (
                <MenuItem key={name} value={name}>
                  <Checkbox checked={districtTokens.includes(name)} />
                  <ListItemText primary={name} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined" color="secondary">Cancel</Button>
        <Button onClick={handleApply} variant="contained" color="primary">Apply Filters</Button>
      </DialogActions>
    </Dialog>
  );
}