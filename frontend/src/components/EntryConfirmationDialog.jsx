import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress
} from '@mui/material';
import BackpackIcon from '@mui/icons-material/Backpack';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { supabase } from '../../lib/supabaseClient';

export default function EntryConfirmationDialog({
  open,
  onClose,
  selectedEntries,
  onConfirmSelection,
}) {
  const [loading, setLoading] = useState(true);
  const [historicalData, setHistoricalData] = useState({});
  const [selectedOption, setSelectedOption] = useState({});
  const [finalConfirmationPending, setFinalConfirmationPending] = useState(false);

  useEffect(() => {
    if (open && selectedEntries.length > 0) {
      setLoading(true);
      setHistoricalData({});
      setSelectedOption({});
      setFinalConfirmationPending(false);
      fetchHistoricalDataForSelected();
    }
  }, [open, selectedEntries]);

  const fetchHistoricalDataForSelected = async () => {
    const dataPromises = selectedEntries.map(async (entry) => {
      const { data: records, error } = await supabase
        .from('filtered_site_data')
        .select('*')
        .eq('location_name', entry.location_name)
        .eq('Zona_name', entry.Zona_name)
        .eq('District', entry.District)
        .order('Date', { ascending: false });

      if (error) {
        console.error('Dialog: Error fetching historical data:', error);
        return { markerKey: entry.markerKey, mobileUnitData: null, backpackData: null };
      }

      let mobileUnitData = null;
      let backpackData = null;

      for (const record of records) {
        const methods = Array.isArray(record.Screening_performed_by)
          ? record.Screening_performed_by
          : typeof record.Screening_performed_by === 'string'
          ? record.Screening_performed_by.split(',').map(m => m.trim())
          : [];

        const hasNAMethod = methods.some(method => method.toLowerCase() === 'na');
        if (hasNAMethod) {
            continue;
        }

        const recordDate = new Date(record.Date);
        if (isNaN(recordDate.getTime())) {
            continue;
        }

        if (methods.some(m => m.toLowerCase().includes('mobile unit')) && !mobileUnitData) {
          mobileUnitData = {
            ...record,
            methods: methods,
            total_screened: record.n_screened || 0,
            total_diagnosed: record.n_diagnosed || 0,
          };
        }
        if (methods.some(m => m.toLowerCase().includes('backpack')) && !backpackData) {
          backpackData = {
            ...record,
            methods: methods,
            total_screened: record.n_screened || 0,
            total_diagnosed: record.n_diagnosed || 0,
          };
        }

        if (mobileUnitData && backpackData) break;
      }

      return { markerKey: entry.markerKey, mobileUnitData, backpackData };
    });

    const results = await Promise.all(dataPromises);
    const newHistoricalData = {};
    const newSelectedOptions = {};

    results.forEach(result => {
      newHistoricalData[result.markerKey] = {
        mobileUnitData: result.mobileUnitData,
        backpackData: result.backpackData,
      };

      if (result.mobileUnitData) {
          newSelectedOptions[result.markerKey] = 'mobileUnitExisting';
      } else if (result.backpackData) {
          newSelectedOptions[result.markerKey] = 'backpackExisting';
      } else {
          newSelectedOptions[result.markerKey] = 'mobileUnitNew';
      }
    });

    setHistoricalData(newHistoricalData);
    setSelectedOption(newSelectedOptions);
    setLoading(false);
  };

  const handleOptionSelect = (markerKey, option) => {
    setSelectedOption(prev => ({ ...prev, [markerKey]: option }));
  };

  const handleProceedToFinalConfirmation = () => {
    setFinalConfirmationPending(true);
  };

  const handleFinalConfirm = () => {
    const confirmedSelections = selectedEntries.map(entry => {
      const choice = selectedOption[entry.markerKey];
      let selectedMethodType = '';
      let selectedDate;
      let selectedScreenedCount;
      let selectedPositiveCount;
      let selectedZonaName = entry.Zona_name;
      let selectedDistrict = entry.District;

      if (choice === 'mobileUnitExisting') {
        const data = historicalData[entry.markerKey].mobileUnitData;
        selectedMethodType = 'Mobile Unit';
        selectedDate = new Date().toISOString().split('T')[0];
        selectedScreenedCount = null;
        selectedPositiveCount = null;
        selectedZonaName = data.Zona_name;
        selectedDistrict = data.District;
      } else if (choice === 'backpackExisting') {
        const data = historicalData[entry.markerKey].backpackData;
        selectedMethodType = 'Backpack';
        selectedDate = new Date().toISOString().split('T')[0];
        selectedScreenedCount = null;
        selectedPositiveCount = null;
        selectedZonaName = data.Zona_name;
        selectedDistrict = data.District;
      } else if (choice === 'mobileUnitNew') {
        selectedMethodType = 'Mobile Unit';
        selectedDate = new Date().toISOString().split('T')[0];
        selectedScreenedCount = null;
        selectedPositiveCount = null;
      } else if (choice === 'backpackNew') {
        selectedMethodType = 'Backpack';
        selectedDate = new Date().toISOString().split('T')[0];
        selectedScreenedCount = null;
        selectedPositiveCount = null;
      }

      return {
        location_name: entry.location_name,
        Zona_name: selectedZonaName,
        District: selectedDistrict,
        selected_method_type: selectedMethodType,
      };
    });
    onConfirmSelection(confirmedSelections);
    onClose();
  };

  const allSelected = selectedEntries.every(entry => selectedOption[entry.markerKey]);
  const canFinalConfirm = allSelected && finalConfirmationPending;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1, pt: 1.5 }}>
        <Typography variant="h6" align="center">Confirm Entry Details</Typography>
      </DialogTitle>
      <DialogContent dividers sx={{ minHeight: '300px', maxHeight: '60vh', overflowY: 'auto' }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Loading historical data...</Typography>
          </Box>
        ) : (
          <Grid container spacing={2}> {/* Increased spacing between entries */}
            {selectedEntries.map((entry) => {
              const histData = historicalData[entry.markerKey];
              const mobileUnit = histData?.mobileUnitData;
              const backpack = histData?.backpackData;

              return (
                <Grid item xs={12} sm={12} key={entry.markerKey}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      width: '100%',
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row'},
                      justifyContent: 'space-between',
                      alignItems: { xs: 'stretch', sm: 'center' },
                      borderColor: selectedOption[entry.markerKey] ? '#9854CB' : 'initial',
                      borderWidth: selectedOption[entry.markerKey] ? '2px' : '1px',
                      borderRadius: 2,
                    }}
                  >
                    {/* Location Info Box */}
                    <Box sx={{ flexGrow: 1, mr:3, }}>
                        <Typography variant="subtitle1" gutterBottom sx={{ lineHeight: 1.2 }}>
                          {entry.location_name}
                        </Typography>
                        <Typography display="block" variant="caption" color="text.secondary" sx={{ mb: 0.3 }}>
                          Zona: {entry.Zona_name || 'N/A'}
                        </Typography>
                        <Typography display="block" variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                          District: {entry.District || 'N/A'}
                        </Typography>
                    </Box>

                    {/* Options Container */}
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 1, flexShrink: 0, mt: { xs: 1, sm: 0 } }}>
                      {/* Mobile Unit Options */}
                      {mobileUnit ? (
                        <Box
                          sx={{
                            flex: 1,
                            border: '1px solid #ddd',
                            borderRadius: 2,
                            p: 1,
                            width:"100%",
                            cursor: 'pointer',
                            backgroundColor: selectedOption[entry.markerKey] === 'mobileUnitExisting' ? '#e0f2f1' : 'transparent',
                            '&:hover': { backgroundColor: '#f5f5f5' },
                          }}
                          onClick={() => handleOptionSelect(entry.markerKey, 'mobileUnitExisting')}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <LocalShippingIcon sx={{ mr: 0.5, color: 'teal', fontSize: 18 }} />
                            <Typography variant="body2" fontWeight="medium">Mobile Unit</Typography>
                          </Box>
                          <Typography variant="caption" display="block">Latest Visit: {mobileUnit.Date || 'N/A'}</Typography>
                          <Typography variant="caption" display="block">Screened: {mobileUnit.total_screened || 'N/A'}</Typography>
                          <Typography variant="caption" display="block">Positive: {mobileUnit.total_diagnosed || 'N/A'}</Typography>
                        </Box>
                      ) : (
                        <Box
                          sx={{
                            flex: 1,
                            border: '2px dashed grey',
                            borderRadius: 2,
                            p: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            backgroundColor: selectedOption[entry.markerKey] === 'mobileUnitNew' ? '#e0f2f1' : 'transparent',
                            '&:hover': { backgroundColor: '#f5f5f5' },
                            minHeight: '80px',
                          }}
                          onClick={() => handleOptionSelect(entry.markerKey, 'mobileUnitNew')}
                        >
                          <AddCircleOutlineIcon sx={{ fontSize: 30, color: 'text.secondary' }} />
                          <Typography variant="body2" sx={{ mt: 0.5 }}>Mobile Unit (New)</Typography>
                          <Typography variant="caption" color="text.secondary" align="center">
                            No previous Mobile Unit data found.
                          </Typography>
                        </Box>
                      )}

                      {/* Backpack Options */}
                      {backpack ? (
                        <Box
                          sx={{
                            flex: 1,
                            border: '1px solid #ddd',
                            borderRadius: 2,
                            p: 1,
                            width:160,
                            cursor: 'pointer',
                            backgroundColor: selectedOption[entry.markerKey] === 'backpackExisting' ? '#e0f2f1' : 'transparent',
                            '&:hover': { backgroundColor: '#f5f5f5' },
                          }}
                          onClick={() => handleOptionSelect(entry.markerKey, 'backpackExisting')}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5, }}>
                            <BackpackIcon sx={{ mr: 0.5, color: 'orange', fontSize: 18 }} />
                            <Typography variant="body2" fontWeight="medium">Backpack</Typography>
                          </Box>
                          <Typography variant="caption" display="block">Latest Date: {backpack.Date || 'N/A'}</Typography>
                          <Typography variant="caption" display="block">Screened: {backpack.total_screened || 'N/A'}</Typography>
                          <Typography variant="caption" display="block">Positive: {backpack.total_diagnosed || 'N/A'}</Typography>
                        </Box>
                      ) : (
                        <Box
                          sx={{
                            flex: 1,
                            border: '2px dashed grey',
                            borderRadius: 2,
                            p: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            backgroundColor: selectedOption[entry.markerKey] === 'backpackNew' ? '#e0f2f1' : 'transparent',
                            '&:hover': { backgroundColor: '#f5f5f5' },
                            minHeight: '80px',
                          }}
                          onClick={() => handleOptionSelect(entry.markerKey, 'backpackNew')}
                        >
                          <AddCircleOutlineIcon sx={{ fontSize: 30, color: 'text.secondary' }} />
                          <Typography variant="body2" sx={{ mt: 0.5 }}>Backpack (New)</Typography>
                          <Typography variant="caption" color="text.secondary" align="center">
                            No previous Backpack data found.
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        )}
      </DialogContent>
      <DialogActions sx={{ pt: 1.5, pb: 1 }}>
        <Button onClick={onClose} disabled={finalConfirmationPending} sx={{ px: 2, py: 0.8 }}>Cancel</Button>
        {!finalConfirmationPending ? (
          <Button
            onClick={handleProceedToFinalConfirmation}
            disabled={!allSelected || loading}
            variant="contained"
            sx={{ backgroundColor: '#9854CB', '&:hover': { backgroundColor: '#7a3e9c' }, px: 2, py: 0.8 }}
          >
            Proceed to Final Confirmation
          </Button>
        ) : (
          <Button
            onClick={handleFinalConfirm}
            disabled={!allSelected || loading}
            variant="contained"
            color="success"
            sx={{ px: 2, py: 0.8 }}
          >
            Confirm All Selections
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}