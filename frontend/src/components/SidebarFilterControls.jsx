import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  TextField,
  Typography,
  FormControlLabel,
  Box,
  Stack,
  Chip,
  Slider,
  Button, 
  Badge,
} from '@mui/material';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import React, { useState } from 'react'; // Import useState
import AdvancedOptionsDialog from './AdvancedOptionsDialog'; // Import the new dialog

export default function SidebarFilterControls({ filters, setFilters, availableZonaIds }) {
  const [openAdvancedFilter, setOpenAdvancedFilter] = useState(false);

  const handleApplyAdvancedFilters = ({ nameTokens, zonaIdTokens, locationIdTokens }) => {
    setFilters((prev) => ({
      ...prev,
      nameTokens,
      zonaIdTokens,
      locationIdTokens,
    }));
  };

//   Filter Calculation for Badge
  const activeFiltercount = 
    (filters.nameTokens && filters.nameTokens.length > 0 ? 1 : 0) +
    (filters.zonaIdTokens && filters.zonaIdTokens.length > 0 ? 1 : 0) +
    (filters.locationIdTokens && filters.locationIdTokens.length > 0 ? 1 : 0);

  return (
    <Accordion
    sx={{
    backgroundColor: '#F6F9FC', 
    color: '#333',
    border: '4px solid #9854CB', 
    borderRadius: 3, 
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)', 
    mb: 2,
    mt: 1,
    overflow: 'hidden',
    transition: 'box-shadow 0.3s ease-in-out, transform 0.3s ease-in-out', 
    '&:hover': { // Hover effect
      boxShadow: '0 8px 20px rgba(0,0,0,0.12)', // Slightly larger, softer shadow on hover
      transform: 'translateY(-2px)', // Very slight lift
    },
    }}
    defaultExpanded
>
      <AccordionSummary>
        <Typography variant="subtitle1" fontWeight={600}>
          Filter & Search Here
        </Typography>
      </AccordionSummary>

      <AccordionDetails>
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
          {filters.selectedTypes?.map((type) => (
            <Chip
              key={type}
              label={type}
              clickable
              color="info"
              size="small"
              onClick={() => console.log('Clicked:', type)}
              onDelete={() => {
                setFilters((prev) => ({
                  ...prev,
                  selectedTypes: prev.selectedTypes.filter((t) => t !== type),
                }));
              }}
            />
          ))}
          {/* Display Advanced Filter Chips */}
          {filters.nameTokens?.map((token, index) => (
            <Chip
              key={`name-${index}`}
              label={`Name: ${token}`}
              onDelete={() => setFilters((prev) => ({
                ...prev,
                nameTokens: prev.nameTokens.filter((t) => t !== token),
              }))}
              color="primary"
              variant="outlined"
              size="small"
            />
          ))}
          {filters.zonaIdTokens?.map((token, index) => (
            <Chip
              key={`zona-${index}`}
              label={`Zona ID: ${token}`}
              onDelete={() => setFilters((prev) => ({
                ...prev,
                zonaIdTokens: prev.zonaIdTokens.filter((t) => t !== token),
              }))}
              color="secondary"
              variant="outlined"
              size="small"
            />
          ))}
          {filters.locationIdTokens?.map((token, index) => (
            <Chip
              key={`location-${index}`}
              label={`Location ID: ${token}`}
              onDelete={() => setFilters((prev) => ({
                ...prev,
                locationIdTokens: prev.locationIdTokens.filter((t) => t !== token),
              }))}
              color="info"
              variant="outlined"
              size="small"
            />
          ))}
        </Stack>

        {/* Ranking Toggles */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={filters.rankByScreened}
                onChange={(e) =>
                  setFilters({ ...filters, rankByScreened: e.target.checked })
                }
              />
            }
            label="Rank by Most Screened"
          />

          <FormControlLabel
            control={
              <Switch
                checked={filters.rankByDiagnosed}
                onChange={(e) =>
                  setFilters({ ...filters, rankByDiagnosed: e.target.checked })
                }
              />
            }
            label="Rank by Most Diagnosed"
          />

          {/* Yield Ratio Switch */}
          <FormControlLabel
            control={
              <Switch
                checked={filters.rankByYield}
                onChange={(e) =>
                  setFilters({ ...filters, rankByYield: e.target.checked })
                }
              />
            }
            label="Rank by Yield Ratio"
          />
        </Box>

        {/* Advanced Filter Button */}
        <Badge color='primary' badgeContent= {activeFiltercount} invisible= {activeFiltercount === 0}>
            <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterAltIcon />}
                onClick={() => setOpenAdvancedFilter(true)}
                sx={{ mb: 2 }}
                >
                Advanced Filters
            </Button>
        </Badge>

        {/* Yield Ratio Range Filter */}
        <Box sx={{ my: 2 }}>
        <Typography variant="body2" gutterBottom>
            Filter by Yield Ratio
        </Typography>
        <Slider
        value={filters.yieldRange}
        onChange={(e, newVal) => setFilters((prev) => ({ ...prev, yieldRange: newVal }))}
        valueLabelDisplay="auto"
        min={0}
        max={1}
        step={0.01}
        valueLabelFormat={(val) => `${val}%`}
        marks={[
            { value: 0, label: '0%' },
            { value: 0.2, label: '0.2%' },
            { value: 0.4, label: '0.4%' },
            { value: 0.6, label: '0.6%' },
            { value: 0.8, label: '0.8%' },
            { value: 1, label: '1%' },
        ]}
        sx={{ mt: 1.5 }}
        />

        </Box>
      </AccordionDetails>

      <AdvancedOptionsDialog
        open={openAdvancedFilter}
        onClose={() => setOpenAdvancedFilter(false)}
        initialNameTokens={filters.nameTokens}
        initialZonaIdTokens={filters.zonaIdTokens}
        initialLocationIdTokens={filters.locationIdTokens}
        onApplyFilters={handleApplyAdvancedFilters}
      />
    </Accordion>
  );
}