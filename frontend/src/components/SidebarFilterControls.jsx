import { Accordion, AccordionSummary, AccordionDetails, Switch, Select, MenuItem, TextField, Typography, FormControlLabel, Autocomplete} from '@mui/material';

export default function SidebarFilterControls({ filters, setFilters, availableZonaIds }) {
return (
    <Accordion sx={{backgroundColor: '#F3F6FB', color:'#333', border: '2px solid #9854CB', borderRadius: 2,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',marginBottom: 2, marginTop:5,}} defaultExpanded>
    <AccordionSummary>
        <Typography>Filter & Search</Typography>
    </AccordionSummary>
    <AccordionDetails>
        {/* 1. Multi-select Zona ID */}
        {/* <Autocomplete
            multiple
            options={availableZonaIds}
            getOptionLabel={(option) => option.toString()}
            value={filters.selectedZonaIds}
            onChange={(event, newValue) => {
                setFilters({ ...filters, selectedZonaIds: newValue });
            }}
            renderInput={(params) => (
                <TextField {...params} label="Select Zona IDs" placeholder="Start typing..." />
            )}
        /> */}


        {/* 2. Switches for Rankings */}
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

        {/* 3. Search input field */}
        <TextField
            fullWidth
            label= "Search Name or ID with(;) "
            value={filters.searchQuery}
            onChange={(e) => setFilters({...filters, searchQuery:e.target.value})}
            variant='outlined'
            size='small'
            sx={{mt:2}}
        />
    </AccordionDetails>
    </Accordion>
);
}
