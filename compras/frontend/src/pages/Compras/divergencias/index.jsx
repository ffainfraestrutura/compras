import axios from "axios";
import { useEffect, useState } from "react";
import {
  Backdrop,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Paper,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import {
  FiRefreshCw,
  FiPackage,
  FiChevronDown,
  FiChevronUp,
  FiCheck,
} from "react-icons/fi";

import CustomSnackbar from "../../../components/SnackBar/SnackBar";

// Componente para linha expansível
function RowExpansivel(props) {
  const { grupo, isExpanded, onToggle, onConfirmar } = props;
  const { itens, materiais, diferenca_total } = grupo;
  
  // Status colors
  const getStatusCompraColor = (status) => {
    switch (status) {
      case "aguardando_diretoria": return "error";
      case "pendencia_gestor": return "warning";
      case "em_analise": return "info";
      default: return "default";
    }
  };

  const getStatusCompraText = (status) => {
    switch (status) {
      case "aguardando_diretoria": return "Aguardando Diretoria";
      case "pendencia_gestor": return "Pendência Gestor";
      case "em_analise": return "Em Análise";
      default: return status;
    }
  };

  // Formatar data
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR').slice(0, 5);
  };

  // Formatar moeda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value || 0);
  };

  return (
    <>
      <TableRow hover sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={onToggle}
          >
            {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Typography variant="body2" fontWeight="bold">
            {grupo.ids_pedidos[0] || 'N/A'}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2">
            {grupo.ids_notas[0] || 'N/A'}
          </Typography>
        </TableCell>
        <TableCell>
          <Chip
            label={getStatusCompraText(grupo.status_compra)}
            color={getStatusCompraColor(grupo.status_compra)}
            size="small"
          />
        </TableCell>
        <TableCell>
          <Typography variant="body2">
            {grupo.total_itens} itens
          </Typography>
        </TableCell>
        <TableCell>
          <Typography 
            variant="body2" 
            fontWeight="bold"
            color={diferenca_total > 0 ? "error.main" : diferenca_total < 0 ? "success.main" : "text.primary"}
          >
            {formatCurrency(diferenca_total)}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="caption">
            {formatDate(grupo.created_at)}
          </Typography>
        </TableCell>
        <TableCell>
          <Button
            variant="contained"
            size="small"
            color="primary"
            startIcon={<FiCheck />}
            onClick={() => onConfirmar(grupo.grupo_id)}
            sx={{ minWidth: 180 }}
          >
            Confirmar Relacionamento
          </Button>
        </TableCell>
      </TableRow>
      
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2, p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                Itens da Associação ({itens.length} itens)
              </Typography>
              
              <Table size="small" sx={{ mt: 1 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#e9ecef' }}>
                    <TableCell><strong>Material</strong></TableCell>
                    <TableCell align="center"><strong>Qtd Pedido</strong></TableCell>
                    <TableCell align="center"><strong>Qtd Nota</strong></TableCell>
                    <TableCell align="center"><strong>Dif. Qtd</strong></TableCell>
                    <TableCell align="right"><strong>Dif. Valor</strong></TableCell>
                    <TableCell align="center"><strong>Status</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {itens.map((item, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {item.cod_material}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">
                          {item.qtd_ped}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">
                          {item.qtd_nf}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography 
                          color={item.delta_qtd > 0 ? "error" : item.delta_qtd < 0 ? "warning" : "success"}
                          fontWeight="bold"
                        >
                          {item.delta_qtd > 0 ? `+${item.delta_qtd}` : item.delta_qtd}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography 
                          color={item.delta_valor > 0 ? "error" : item.delta_valor < 0 ? "success" : "text.primary"}
                          fontWeight="bold"
                        >
                          {formatCurrency(item.delta_valor)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={item.status_item}
                          color={
                            item.status_item === 'OK' ? 'success' :
                            item.status_item === 'EXCEDENTE' ? 'error' :
                            item.status_item === 'PARCIAL' ? 'warning' : 'default'
                          }
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {/* Linha de total */}
                  <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                    <TableCell colSpan={4}>
                      <Typography variant="body2" fontWeight="bold">
                        TOTAL
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography 
                        variant="body2" 
                        fontWeight="bold"
                        color={diferenca_total > 0 ? "error.main" : diferenca_total < 0 ? "success.main" : "text.primary"}
                      >
                        {formatCurrency(diferenca_total)}
                      </Typography>
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              
              {/* IDs completos */}
              <Box sx={{ mt: 2, p: 1, bgcolor: 'white', borderRadius: 1 }}>
                <Typography variant="caption" color="textSecondary">
                  <strong>IDs Pedidos:</strong> {grupo.ids_pedidos.join(', ')}
                </Typography>
                <br />
                <Typography variant="caption" color="textSecondary">
                  <strong>IDs Notas:</strong> {grupo.ids_notas.join(', ')}
                </Typography>
              </Box>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export default function AssociacoesPendentes() {
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarType, setSnackbarType] = useState("success");
  
  // Dados da API
  const [associacoes, setAssociacoes] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});
  
  // Estado para o diálogo de confirmação
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [grupoToConfirm, setGrupoToConfirm] = useState(null);

  // Snackbar
  const showSnackbar = (message, type = "success") => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarOpen(true);
  };
  const handleSnackbarClose = () => setSnackbarOpen(false);

  // Buscar dados
  const fetchAssociacoes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/associacoes/pendentes`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setAssociacoes(response.data.associacoes || []);
        // Resetar linhas expandidas
        console.log(response)
        setExpandedRows({});
      }
    } catch (error) {
      console.error("Erro ao buscar associações:", error);
      showSnackbar("Erro ao carregar associações pendentes", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssociacoes();
  }, []);

  // Toggle para expandir/recolher linha
  const toggleRow = (grupoId) => {
    setExpandedRows(prev => ({
      ...prev,
      [grupoId]: !prev[grupoId]
    }));
  };

  // Expandir/recolher todas
  const toggleAllRows = () => {
    if (Object.keys(expandedRows).length === associacoes.length) {
      // Se todas estão expandidas, recolher todas
      setExpandedRows({});
    } else {
      // Expandir todas
      const allExpanded = {};
      associacoes.forEach(grupo => {
        allExpanded[grupo.grupo_id] = true;
      });
      setExpandedRows(allExpanded);
    }
  };

  // Abrir diálogo de confirmação
  const handleOpenConfirmDialog = (grupoId) => {
    setGrupoToConfirm(grupoId);
    setConfirmDialogOpen(true);
  };

  // Fechar diálogo de confirmação
  const handleCloseConfirmDialog = () => {
    setConfirmDialogOpen(false);
    setGrupoToConfirm(null);
  };

  // Confirmar relacionamento
  const handleConfirmarRelacionamento = async () => {
    if (!grupoToConfirm) return;
    
    setConfirming(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/associacoes/finalizar`,
        {
          grupo_id: grupoToConfirm
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        showSnackbar("Relacionamento confirmado com sucesso!", "success");
        
        // Remover o grupo da lista
        setAssociacoes(prev => prev.filter(grupo => grupo.grupo_id !== grupoToConfirm));
        
        // Remover da lista de expandidos se existir
        if (expandedRows[grupoToConfirm]) {
          const newExpandedRows = { ...expandedRows };
          delete newExpandedRows[grupoToConfirm];
          setExpandedRows(newExpandedRows);
        }
      } else {
        showSnackbar(response.data.message || "Erro ao confirmar relacionamento", "error");
      }
    } catch (error) {
      console.error("Erro ao confirmar relacionamento:", error);
      showSnackbar(
        error.response?.data?.message || "Erro ao confirmar relacionamento", 
        "error"
      );
    } finally {
      setConfirming(false);
      handleCloseConfirmDialog();
    }
  };

  // Contar quantas estão expandidas
  const expandedCount = Object.values(expandedRows).filter(Boolean).length;

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight="bold" color="black">
            Associações Pendentes
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Clique na seta para expandir e ver os detalhes
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button 
            variant="outlined" 
            size="small"
            onClick={toggleAllRows}
            disabled={associacoes.length === 0}
          >
            {expandedCount === associacoes.length ? 'Recolher Todas' : 'Expandir Todas'}
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<FiRefreshCw />}
            onClick={fetchAssociacoes}
            disabled={loading}
            size="small"
          >
            Atualizar
          </Button>
        </Box>
      </Box>

      {/* Contador */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2}>
            <Box sx={{ color: 'primary.main' }}>
              <FiPackage size={24} />
            </Box>
            <Box>
              <Typography variant="body1" fontWeight="bold">
                {associacoes.length} grupos de associação
              </Typography>
              {/* <Typography variant="caption">
                {expandedCount} expandidos • {associacoes.length - expandedCount} recolhidos
              </Typography> */}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Tabela Expansível */}
      <Paper sx={{ p: 2 }}>
        {associacoes.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography color="textSecondary">
              {loading ? "Carregando..." : "Nenhuma associação pendente encontrada"}
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                  <TableCell width="50"></TableCell>
                  <TableCell><strong>Pedido</strong></TableCell>
                  <TableCell><strong>Nota Fiscal</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Itens</strong></TableCell>
                  <TableCell><strong>Diferença Total</strong></TableCell>
                  <TableCell><strong>Data Criação</strong></TableCell>
                  <TableCell><strong>Ação</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {associacoes.map((grupo) => (
                  <RowExpansivel
                    key={grupo.grupo_id}
                    grupo={grupo}
                    isExpanded={!!expandedRows[grupo.grupo_id]}
                    onToggle={() => toggleRow(grupo.grupo_id)}
                    onConfirmar={handleOpenConfirmDialog}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Dica */}
      <Box mt={2} textAlign="center">
        <Typography variant="caption" color="textSecondary">
          💡 Clique na seta para expandir os detalhes de cada associação
        </Typography>
      </Box>

      {/* Diálogo de Confirmação */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCloseConfirmDialog}
      >
        <DialogTitle>Confirmar Relacionamento</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja confirmar este relacionamento?
            <br />
            <br />
            Esta ação irá validar a associação entre pedido(s) e nota(s) fiscal(is) e 
            não poderá ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCloseConfirmDialog}
            disabled={confirming}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmarRelacionamento}
            variant="contained"
            color="primary"
            disabled={confirming}
            startIcon={confirming ? <CircularProgress size={20} /> : <FiCheck />}
          >
            {confirming ? 'Confirmando...' : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Backdrop e Snackbar */}
      <Backdrop
        open={loading}
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      <CustomSnackbar
        open={snackbarOpen}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
        severity={snackbarType}
      />
    </Box>
  );
}