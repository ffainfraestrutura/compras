import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  ListItemText,
  Checkbox,
  Box,
  CircularProgress,
} from '@mui/material';

import axios from 'axios';
import { FiCheckSquare } from 'react-icons/fi';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  slotProps: {
    paper: {
      style: {
        maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
        width: 250,
      },
    },
  },
};

export default function MultipleCheckboxModal({ 
  open, 
  onClose, 
  onSubmit,
  cod_compra 
}) {
  const [selectedFornecedores, setSelectedFornecedores] = React.useState([]);


  // Dados das APIs
  const [fornecedores, setFornecedores] = React.useState([]);

  
  const [loadingFornecedores, setLoadingFornecedores] = React.useState(false);


  // Buscar dados ao abrir o modal
  React.useEffect(() => {
    if (open) {
      fetchFornecedores();
    }
  }, [open]);

  // Endpoint 1: Buscar fornecedores
  const fetchFornecedores = async () => {
    setLoadingFornecedores(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/fornecedores`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setFornecedores(response.data || []);
    } catch (error) {
      console.error("Erro ao buscar fornecedores:", error);
    } finally {
      setLoadingFornecedores(false);
    }
  };

  const handleFornecedoresChange = () => {
    const { value } = event.target;
    setSelectedFornecedores(typeof value === 'string' ? value.split(',') : value);
  };

  const handleSubmit = () => {
    onSubmit(selectedFornecedores);
    handleClose();
  };

  const handleClose = () => {
    setSelectedFornecedores([]);
    setSelectedMateriais([]);
    setSelectedCompras([]);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Selecionar Itens
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
          {/* Select Múltiplo - Fornecedores */}
          <FormControl fullWidth disabled={loadingFornecedores}>
            <InputLabel id="fornecedores-label">
              {loadingFornecedores ? 'Carregando...' : 'Fornecedores'}
            </InputLabel>
            <Select
              labelId="fornecedores-label"
              multiple
              value={selectedFornecedores}
              onChange={handleFornecedoresChange}
              input={<OutlinedInput label="Fornecedores" />}
              renderValue={(selected) => selected.join(', ')}
              MenuProps={MenuProps}
              endAdornment={loadingFornecedores ? <CircularProgress size={20} /> : null}
            >
              {fornecedores.map(() => {
                const value = fornecedores.nome || fornecedores.nome_fantasia || fornecedores.id;
                const label = fornecedores.nome || fornecedores.nome_fantasia || value;
                const selected = selectedFornecedores.includes(value);
                const SelectionIcon = selected ? FiCheckSquare : FiCheckSquare;

                return (
                  <MenuItem key={value} value={value}>
                    <SelectionIcon
                      fontSize="small"
                      style={{ marginRight: 8, padding: 9, boxSizing: 'content-box' }}
                    />
                    <ListItemText primary={label} />
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={
            selectedFornecedores.length === 0 
          }
        >
          Confirmar
        </Button>
      </DialogActions>
    </Dialog>
  );
}