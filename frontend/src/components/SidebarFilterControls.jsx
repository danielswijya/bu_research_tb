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
Slider
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
        marks={[
            { value: 0, label: '0' },
            { value: 0.2, label: '0.2' },
            { value: 0.4, label: '0.4' },
            { value: 0.6, label: '0.6' },
            { value: 0.8, label: '0.8' },
            { value: 1, label: '1' },
        ]}
        sx={{ mt: 1.5 }}
        />

        </Box>
    </AccordionDetails>
</Accordion>
);
}
