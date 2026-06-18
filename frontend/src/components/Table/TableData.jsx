// src/components/DataGrid/CustomDataGrid.jsx
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
import "./TableData.css";

const normalizeRows = (rows) =>
  rows.map((row, idx) => ({
    id: row.id ?? row._id ?? row.key ?? idx + 1,
    ...row,
  }));

function CustomDataGrid({
  columns = [],
  data = [],
  loading = false,
  setSelectedValues,
  selectedValues,
  onRowClick,
  initialPageSize = 10,
  hideFooter = false,
  autoHeight = true,
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

  const displayedColumns = useMemo(() => {
    if (!columns.length) return [];
    
    return columns.map((col) => {
      const sampleValue = data.length > 0 ? data[0][col.field] : null;
      const isReactElement = React.isValidElement(sampleValue);
      
      return {
        field: col.field,
        headerName: col.headerName || col.field,
        width: col.width,
        flex: col.flex,
        minWidth: col.minWidth || 50,
        sortable: col.sortable !== false && !isReactElement,
        filterable: false,
        align: col.align || 'left',
        headerAlign: col.headerAlign || 'left',
        renderCell: isReactElement ? (params) => params.value : col.renderCell,
      };
    });
  }, [columns, data]);

  const selectionProps =
    selectedValues !== undefined && typeof setSelectedValues === "function"
      ? {
          checkboxSelection: true,
          selectionModel: selectedValues.map((row) => row.id),
          onRowSelectionModelChange: (selection) => {
            const selectedRows = normalizedRows.filter((row) =>
              selection.includes(row.id)
            );
            setSelectedValues(selectedRows);
          },
        }
      : {};

  const pageCount = Math.max(1, Math.ceil(normalizedRows.length / rowsPerPage));
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentPageRows = useMemo(
    () => normalizedRows.slice(startIndex, startIndex + rowsPerPage),
    [normalizedRows, startIndex, rowsPerPage]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, rowsPerPage]);

  useEffect(() => {
    if (currentPage > pageCount) setCurrentPage(1);
  }, [pageCount, currentPage]);

  if (loading) {
    return (
      <Box className="loading-container">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="error-container">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  const isEmpty = normalizedRows.length === 0;

  return (
    <Box className="data-grid-container">
      {/* Barra de controle */}
      <Box className="control-bar">
        <Box className="rows-per-page">
          <Typography variant="body2">Linhas por página:</Typography>
          <Select
            size="small"
            value={rowsPerPage}
            onChange={(e) => setRowsPerPage(e.target.value)}
          >
            {[5, 10, 25, 50, 100].map((size) => (
              <MenuItem key={size} value={size}>
                {size}
              </MenuItem>
            ))}
          </Select>
        </Box>

        <Box className="search-box">
          <TextField
            label="Buscar"
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </Box>
      </Box>

      {/* Tabela ou mensagem de vazio */}
      {isEmpty ? (
        <Typography className="no-data">Nenhum dado para exibir.</Typography>
      ) : (
        <>
          <DataGrid
            rows={currentPageRows}
            columns={displayedColumns}
            rowCount={normalizedRows.length}
            paginationMode="server"
            autoHeight={autoHeight}
            hideFooter={hideFooter}
            localeText={ptBR.components.MuiDataGrid.defaultProps.localeText}
            disableColumnFilter
            disableColumnSelector
            disableColumnMenu
            className="custom-data-grid"
            disableRowSelectionOnClick
            onRowClick={(params) => onRowClick?.(params.row)}
            sx={{ cursor: onRowClick ? "pointer" : "default" }}
            {...selectionProps}
          />

          {/* Paginação */}
          {!hideFooter && (
            <Pagination
              count={pageCount}
              page={currentPage}
              onChange={(_, value) => setCurrentPage(value)}
              color="primary"
              className="pagination"
            />
          )}
        </>
      )}
    </Box>
  );
}

export default CustomDataGrid;