// src/components/DataGrid/DataGridData.jsx
import React, { useState, useMemo, useEffect } from "react";
import {
  Box,
  CircularProgress,
  Pagination,
  Select,
  MenuItem,
  Typography,
  TextField,
} from "@mui/material";
import { ptBR } from "@mui/x-data-grid/locales";
import { DataGrid } from "@mui/x-data-grid";
import "./DataGrid.css";

// ---- Helpers ----
const formatHeader = (key) =>
  key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());

const generateColumns = (data, hiddenIndexes) => {
  if (!data.length) return [];

  return Object.keys(data[0])
    .map((key) => {
      const sampleValue = data[0][key];
      const commonProps = {
        field: key,
        headerName: formatHeader(key),
        flex: 1,
        minWidth: key === 'Status' ? 210 : 50
      };

      return React.isValidElement(sampleValue)
        ? {
          ...commonProps,
          sortable: false,
          filterable: false,
          renderCell: (params) => params.value,
        }
        : commonProps;
    })
    .filter((_, idx) => !hiddenIndexes.includes(idx));
};

const normalizeRows = (rows) =>
  rows.map((row, idx) => ({
    id: row.id ?? row._id ?? row.key ?? idx + 1,
    ...row,
  }));

function DataGridData({
  hiddenIndexes = [],
  initialPageSize = 10,
  data = [],
  loading = false,
  setSelectedValues,
  selectedValues,
  onRowClick,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(initialPageSize);
  const [searchQuery, setSearchQuery] = useState("");
  const [error] = useState(null);

  const filteredRows = useMemo(() => {
    if (!searchQuery) return data;
    const q = searchQuery.toLowerCase().trim();
    return data.filter((row) =>
      Object.values(row).some(
        (value) => value != null && String(value).toLowerCase().includes(q)
      )
    );
  }, [data, searchQuery]);

  const normalizedRows = useMemo(
    () => normalizeRows(filteredRows),
    [filteredRows]
  );

  const displayedColumns = useMemo(
    () => generateColumns(data, hiddenIndexes),
    [data, hiddenIndexes]
  );

  const pageCount = Math.max(1, Math.ceil(normalizedRows.length / rowsPerPage));
  const startIndex = (currentPage - 1) * rowsPerPage;

  const currentPageRows = useMemo(
    () => normalizedRows.slice(startIndex, startIndex + rowsPerPage),
    [normalizedRows, startIndex, rowsPerPage]
  );

  const selectionProps =
    selectedValues !== undefined && typeof setSelectedValues === "function"
      ? {
        checkboxSelection: true,
        selectionModel: selectedValues.map((row) => row.id),
        onRowSelectionModelChange: (selection) => {
          const selectedIds = Array.from(selection.ids);
          const selectedRows = normalizedRows.filter((row) =>
            selectedIds.includes(row.id)
          );
          setSelectedValues(selectedRows);
        },
      }
      : {};

  useEffect(() => {
    if (currentPage > pageCount) setCurrentPage(1);
  }, [pageCount, currentPage]);

  if (loading)
    return (
      <Box className="loading-container">
        <CircularProgress />
      </Box>
    );

  if (error)
    return (
      <Box className="error-container">
        <Typography color="error">{error}</Typography>
      </Box>
    );

  const isEmpty = normalizedRows.length === 0;

  return (
    <Box className="data-grid-container">
      {/* Barra de controle */}
      <Box className="control-bar">
        {/* Linhas por página */}
        <Box className="rows-per-page">
          <Typography variant="body2">Linhas por página:</Typography>
          <Select
            size="small"
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(e.target.value);
              setCurrentPage(1);
            }}
          >
            {[5, 10, 25, 50, 100].map((size) => (
              <MenuItem key={size} value={size}>
                {size}
              </MenuItem>
            ))}
          </Select>
        </Box>

        {/* Campo de busca */}
        <Box className="search-box">
          <TextField
            label="Buscar"
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </Box>
      </Box>

      {/* Tabela ou mensagem de vazio */}
      {isEmpty ? (
        <Typography className="no-data">Nenhum dado para exibir.</Typography>
      ) : (
        <>
          <DataGrid
            id={"table"}
            rows={currentPageRows}
            columns={displayedColumns}
            rowCount={normalizedRows.length}
            paginationMode="server"
            autoHeight
            hideFooter
            localeText={ptBR.components.MuiDataGrid.defaultProps.localeText}
            disableColumnFilter
            className="custom-data-grid"
            disableRowSelectionOnClick
            onRowClick={(params) => onRowClick?.(params.row)} // 👈 adicione aqui
            sx={{ cursor: onRowClick ? "pointer" : "default" }} // 👈 cursor de ponteiro
            {...selectionProps}
          />

          {/* Paginação */}
          <Pagination
            count={pageCount}
            page={currentPage}
            onChange={(_, value) => setCurrentPage(value)}
            color="primary"
            className="pagination"
          />
        </>
      )}
    </Box>
  );
}

export default DataGridData;