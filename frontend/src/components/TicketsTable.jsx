import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  TableSortLabel,
  TablePagination,
  Checkbox,
  Box,
  Button,
  TextField,
  Typography
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

const headCells = [
  { id: 'status', label: '', disableSort: true },
  { id: 'select', label: '', disableSort: true },
  { id: 'Screening_Location_ID', label: 'Screening ID' },
  { id: 'screened_count', label: 'Screened' },
  { id: 'positive_count', label: 'Positive' },
  { id: 'created_at', label: 'Date Created' },
  { id: 'save', label: 'Save', disableSort: true },
  { id: 'delete', label: 'Delete', disableSort: true },
];

export default function TicketsTable({ tickets = [], onSave, onDelete, onChange }) {
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('created_at');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selected, setSelected] = useState([]);
  const [savedIds, setSavedIds] = useState(new Set());
  const [statusFilter, setStatusFilter] = useState('all');

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = tickets.map((n) => n.id);
      setSelected(newSelected);
    } else {
      setSelected([]);
    }
  };

  const handleClick = (id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];
    if (selectedIndex === -1) {
      newSelected = [...selected, id];
    } else {
      newSelected = selected.filter((item) => item !== id);
    }
    setSelected(newSelected);
  };

  const isSelected = (id) => selected.indexOf(id) !== -1;

  const handleDeleteSelected = () => {
    selected.forEach((id) => onDelete(id));
    setSelected([]);
  };

  const handleSave = (ticket) => {
    onSave(ticket);
    setSavedIds((prev) => new Set(prev).add(ticket.id));
  };

  const filteredTickets = tickets.filter((t) => {
    const isSaved = savedIds.has(t.id);
    if (statusFilter === 'all') return true;
    if (statusFilter === 'incomplete') return !isSaved;
    if (statusFilter === 'saved') return isSaved;
    return true;
  });

  const visibleRows = React.useMemo(
    () => [...filteredTickets].sort(getComparator(order, orderBy)).slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredTickets, order, orderBy, page, rowsPerPage]
  );

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="subtitle1">Filter by Status</Typography>
        <TextField
          select
          size="small"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          SelectProps={{ native: true }}
        >
          <option value="all">All</option>
          <option value="incomplete">Incomplete</option>
          <option value="saved">Saved</option>
        </TextField>
      </Box>

      {selected.length > 0 && (
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="subtitle1">{selected.length} selected</Typography>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDeleteSelected}
          >
            Delete Selected
          </Button>
        </Box>
      )}

      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {headCells.map((headCell) => (
                <TableCell
                  key={headCell.id}
                  sortDirection={orderBy === headCell.id ? order : false}
                >
                  {headCell.disableSort ? (
                    headCell.label
                  ) : headCell.id === 'select' ? (
                    <Checkbox
                      color="primary"
                      indeterminate={selected.length > 0 && selected.length < tickets.length}
                      checked={tickets.length > 0 && selected.length === tickets.length}
                      onChange={handleSelectAllClick}
                      inputProps={{ 'aria-label': 'select all tickets' }}
                    />
                  ) : (
                    <TableSortLabel
                      active={orderBy === headCell.id}
                      direction={orderBy === headCell.id ? order : 'asc'}
                      onClick={(e) => handleRequestSort(e, headCell.id)}
                    >
                      {headCell.label}
                    </TableSortLabel>
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {visibleRows.map((ticket, index) => {
              const isItemSelected = isSelected(ticket.id);
              const isSaved = savedIds.has(ticket.id);
              return (
                <TableRow key={ticket.id || index} selected={isItemSelected}>
                  <TableCell padding="checkbox">
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: isSaved ? '#4caf50' : '#f44336'
                      }}
                    />
                  </TableCell>

                  <TableCell padding="checkbox">
                    <Checkbox
                      color="primary"
                      checked={isItemSelected}
                      onChange={() => handleClick(ticket.id)}
                    />
                  </TableCell>

                  <TableCell>{ticket.Screening_Location_ID}</TableCell>

                  <TableCell>
                    <input
                      type="number"
                      value={ticket.screened_count ?? ''}
                      onChange={(e) => onChange(index, 'screened_count', e.target.value === '' ? null : parseInt(e.target.value))}
                      style={{ width: '80px', padding: '4px 6px', border: '1px solid #ccc', borderRadius: 6, outline: 'none', fontSize: '14px' }}
                    />
                  </TableCell>

                  <TableCell>
                    <input
                      type="number"
                      value={ticket.positive_count ?? ''}
                      onChange={(e) => onChange(index, 'positive_count', e.target.value === '' ? null : parseInt(e.target.value))}
                      style={{ width: '80px', padding: '4px 6px', border: '1px solid #ccc', borderRadius: 6, outline: 'none', fontSize: '14px' }}
                    />
                  </TableCell>

                  <TableCell>
                    {ticket.created_at ? new Date(ticket.created_at).toLocaleString() : 'N/A'}
                  </TableCell>

                  <TableCell>
                    <Tooltip title="Save">
                      <IconButton size="small" color="primary" onClick={() => handleSave(ticket)}>
                        <SaveIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>

                  <TableCell>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => onDelete(ticket.id)}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredTickets.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
}