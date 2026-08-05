import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  Typography,
  FormControlLabel,
  FormGroup,
  Checkbox,
  Box,
  Stack,
  Chip,
  Slider,
  Button,
  Badge,
} from '@mui/material';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import React, { useState } from 'react';
import AdvancedOptionsDialog from './AdvancedOptionsDialog';

export default function SidebarFilterControls({ filters, setFilters, availableSiteTypes, availableDistricts }) {
  const [openAdvancedFilter, setOpenAdvancedFilter] = useState(false);

  const handleApplyAdvancedFilters = ({ nameTokens, districtTokens }) => {
    setFilters((prev) => ({
      ...prev,
      nameTokens,
      districtTokens,
      zonaIdTokens: [], // FIX: Clear out zonaIdTokens on advanced filter apply
    }));
  };

  const handleMethodTypeChange = (event) => {
    const { name, checked } = event.target;
    setFilters((prev) => {
      if (checked) {
        return {
          ...prev,
          selectedTypes: [...prev.selectedTypes, name],
        };
      } else {
        return {
          ...prev,
          selectedTypes: prev.selectedTypes.filter((type) => type !== name),
        };
      }
    });
  };

  const activeFiltercount =
    (filters.nameTokens?.length || 0) +
    (filters.districtTokens?.length || 0);

  return (
    <Accordion
      sx={{
        backgroundColor: '#f0fdfa',
        color: '#333',
        border: '2px solid #0f766e',
        borderRadius: 3,
        boxShadow: '0 4px 12px rgba(15,23,42,0.06)',
        mb: 2,
        mt: 1,
        overflow: 'hidden',
        transition: 'box-shadow 0.3s ease-in-out, transform 0.3s ease-in-out',
        '&:hover': {
          boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
          transform: 'translateY(-2px)',
        },
      }}
      defaultExpanded
    >
      <AccordionSummary>
        <Typography variant="subtitle1" fontWeight={700}>
          Filter & Search Here 
        </Typography>
        <FilterAltIcon/>
      </AccordionSummary>

      <AccordionDetails>
        {/* Screening Method Filter */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" gutterBottom>
            Filter by Screening Method
          </Typography>
          <FormGroup sx={{ flexDirection: 'row', gap: 1 }}>
            {availableSiteTypes.map((type) => (
              <FormControlLabel
                key={type}
                control={
                  <Checkbox
                    size="small"
                    checked={filters.selectedTypes.includes(type)}
                    onChange={handleMethodTypeChange}
                    name={type}
                  />
                }
                label={type}
              />
            ))}
          </FormGroup>
        </Box>
        
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
          {/* Chip for selected Screening Methods */}
          {filters.selectedTypes.map((token, index) => (
            <Chip
              key={`type-${index}`}
              label={`Method: ${token}`}
              onDelete={() =>
                setFilters((prev) => ({
                  ...prev,
                  selectedTypes: prev.selectedTypes.filter((t) => t !== token),
                }))
              }
              color="primary"
              variant="outlined"
              size="small"
            />
          ))}

          {filters.nameTokens?.map((token, index) => (
            <Chip
              key={`name-${index}`}
              label={`Name: ${token}`}
              onDelete={() =>
                setFilters((prev) => ({
                  ...prev,
                  nameTokens: prev.nameTokens.filter((t) => t !== token),
                }))
              }
              color="primary"
              variant="outlined"
              size="small"
            />
          ))}

          {/* Removed the Zona ID filter chips entirely */}
          {filters.districtTokens?.map((token, index) => (
            <Chip
              key={`district-${index}`}
              label={`District: ${token}`}
              onDelete={() =>
                setFilters((prev) => ({
                  ...prev,
                  districtTokens: prev.districtTokens.filter((t) => t !== token),
                }))
              }
              color="info"
              variant="outlined"
              size="small"
            />
          ))}
        </Stack>

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

        <Badge
          color="primary"
          badgeContent={activeFiltercount}
          invisible={activeFiltercount === 0}
        >
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

        <Box sx={{ my: 2 }}>
          <Typography variant="body2" gutterBottom>
            Filter by Yield Ratio
          </Typography>
          <Slider
            value={filters.yieldRange}
            onChange={(e, newVal) =>
              setFilters((prev) => ({ ...prev, yieldRange: newVal }))
            }
            valueLabelDisplay="auto"
            min={0}
            max={3}
            step={0.01}
            valueLabelFormat={(val) => `${val.toFixed(2)}%`}
            marks={[
              { value: 0, label: '0%' },
              { value: 0.5, label: '0.5%' },
              { value: 1, label: '1%' },
              { value: 1.5, label: '1.5%' },
              { value: 2, label: '2%' },
              { value: 2.5, label: '2.5%' },
              { value: 3, label: '3%' },
              { value: 3.5, label: '3.5%' },
              { value: 4, label: '4%' },
              { value: 4.5, label: '4.5%' },
              { value: 5, label: '5%' },
              { value: 5.5, label: '5.5%' },
              { value: 6, label: '6%' },
              { value: 6.5, label: '6.5%' },
              { value: 7, label: '7%' },
              { value: 7.5, label: '7.5%' },
              { value: 8, label: '8%' },
              { value: 8.5, label: '8.5%' },
              { value: 9, label: '9%' },
              { value: 9.5, label: '9.5%' },
              { value: 10, label: '10%' }
            ]}
            sx={{ mt: 1.5 }}
          />
        </Box>
      </AccordionDetails>

      <AdvancedOptionsDialog
        open={openAdvancedFilter}
        onClose={() => setOpenAdvancedFilter(false)}
        initialNameTokens={filters.nameTokens}
        initialDistrictTokens={filters.districtTokens}
        onApplyFilters={handleApplyAdvancedFilters}
        availableDistricts={availableDistricts}
      />
    </Accordion>
  );
}