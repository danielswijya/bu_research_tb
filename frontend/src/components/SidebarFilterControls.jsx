import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  TextField,
  Typography,
  FormControlLabel,
  Box,
} from '@mui/material';

export default function SidebarFilterControls({ filters, setFilters, availableZonaIds }) {
  return (
    <Accordion
      sx={{
        backgroundColor: '#E6F0FA',
        color: '#333',
        border: '3px solid #9854CB',
        borderRadius: 5,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        mb: 2,
        mt: 1,
      }}
      defaultExpanded
    >
      <AccordionSummary>
        <Typography variant="subtitle1" fontWeight={600}>
          Filter & Search Here
        </Typography>
      </AccordionSummary>

      <AccordionDetails>
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
        </Box>

        {/* Search Input */}
        <TextField
          fullWidth
          placeholder="Search Name or ID (separated by ;)"
          value={filters.searchQuery}
          onChange={(e) =>
            setFilters({ ...filters, searchQuery: e.target.value })
          }
          variant="outlined"
          size="small"
          sx={{
            backgroundColor: '#fff',
            borderRadius: 1,
          }}
        />
      </AccordionDetails>
    </Accordion>
  );
}
