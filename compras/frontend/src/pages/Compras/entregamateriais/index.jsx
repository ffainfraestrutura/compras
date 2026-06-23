import axios from "axios";
import { useEffect, useState } from "react";
import {
  Backdrop,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Tooltip,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
} from "@mui/material";
import {
  FiEye,
  FiEdit,
  FiTrash2,
  FiDownload,
  FiPlus,
  FiSearch,
  FiRefreshCw,
  FiFilter,
  FiX,
  FiRewind,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import CustomSnackbar from "../../../components/SnackBar/SnackBar";
import DataGrid from "../../../components/DataGrid/DataGrid";
import ExportExcel from "../../../components/Button/ExportExcel/ExportExcel";
import Modal from "../../../components/Modal/Modal";

export default function NotasFiscais() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Estados para dados
  const [notasFiscais, setNotasFiscais] = useState([]);
  const [loadingNotas, setLoadingNotas] = useState(false);
  const [error, setError] = useState(null);

  // Estados para filtros
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroFornecedor, setFiltroFornecedor] = useState("");
  const [filtroNumero, setFiltroNumero] = useState("");
  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");

  // Estados para modais
  const [openDetalhes, setOpenDetalhes] = useState(false);
  const [notaSelecionada, setNotaSelecionada] = useState(null);
  const [itensNota, setItensNota] = useState([]);
  const [fornecedorInfo, setFornecedorInfo] = useState(null);

  const [openConfirmarExclusao, setOpenConfirmarExclusao] = useState(false);
  const [notaParaExcluir, setNotaParaExcluir] = useState(null);

  // Novos estados para modais de Observação e Anexo
  const [openModalObs, setOpenModalObs] = useState(false);
  const [obsConteudo, setObsConteudo] = useState("");
  const [obsTitulo, setObsTitulo] = useState("");

  const [openModalAnexo, setOpenModalAnexo] = useState(false);
  const [anexoUrl, setAnexoUrl] = useState(null);
  const [anexoTitulo, setAnexoTitulo] = useState("");

  const [fornecedores, setFornecedores] = useState([]);

  // ======================================
  // Buscar notas fiscais
  const fetchNotasFiscais = async () => {
    setLoadingNotas(true);
    setError(null);
    try {
      const params = new URLSearchParams();

      if (filtroStatus !== "todos") params.append('status', filtroStatus);
      if (filtroFornecedor) params.append('fornecedor_id', filtroFornecedor);
      if (filtroNumero) params.append('numero', filtroNumero);
      if (filtroDataInicio) params.append('data_inicio', filtroDataInicio);
      if (filtroDataFim) params.append('data_fim', filtroDataFim);

      const url = `${import.meta.env.VITE_API_URL}/notasfiscais${params.toString() ? `?${params.toString()}` : ''}`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotasFiscais(response.data.data || response.data || []);
    } catch (err) {
      console.error("Erro ao buscar notas fiscais:", err);
      setError("Erro ao carregar notas fiscais");
    } finally {
      setLoadingNotas(false);
    }
  };

  // Buscar fornecedores para filtro
  const fetchFornecedores = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/fornecedores`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFornecedores(response.data || []);
    } catch (err) {
      console.error("Erro ao buscar fornecedores:", err);
    }
  };

  // ======================================
  // useEffect
  useEffect(() => {
    fetchNotasFiscais();
    fetchFornecedores();
  }, []);

  // ======================================
  // Snackbar
  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => setSnackbarOpen(false);

  // ======================================
  // Funções para Modais
  const handleOpenDetalhes = async (nota) => {
    setLoading(true);
    try {
      // Buscar detalhes da nota
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/notasfiscais/${nota.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNotaSelecionada(response.data.data || response.data);
      setItensNota(response.data.data?.itens || response.data?.itens || []);

      // Buscar informações do fornecedor se existir
      if (response.data.data?.fornecedor_id || response.data?.fornecedor_id) {
        const fornecedorId = response.data.data?.fornecedor_id || response.data?.fornecedor_id;
        const fornecedorResponse = await axios.get(
          `${import.meta.env.VITE_API_URL}/fornecedores/${fornecedorId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setFornecedorInfo(fornecedorResponse.data);
      }

      setOpenDetalhes(true);
    } catch (err) {
      console.error("Erro ao buscar detalhes:", err);
      showSnackbar("Erro ao carregar detalhes da nota fiscal");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDetalhes = () => {
    setOpenDetalhes(false);
    setNotaSelecionada(null);
    setItensNota([]);
    setFornecedorInfo(null);
  };

  // Funções para modal de Observação
  const handleOpenObs = (nota) => {
    if (!nota.obs || nota.obs.trim() === "") {
      showSnackbar("Não há observações para esta nota fiscal");
      return;
    }
    
    setObsTitulo(`Observações - Nota Fiscal #${nota.numero}`);
    setObsConteudo(nota.obs);
    setOpenModalObs(true);
  };

  const handleCloseObs = () => {
    setOpenModalObs(false);
    setObsConteudo("");
    setObsTitulo("");
  };

  // Funções para modal de Anexo
  const handleOpenAnexo = (nota) => {
    if (!nota.anexo_url && !nota.anexo) {
      showSnackbar("Não há anexo disponível para esta nota fiscal");
      return;
    }

    const url = nota.anexo_url || `${import.meta.env.VITE_API_URL}/notas-fiscais/${nota.id}/anexo`;
    setAnexoTitulo(`Anexo - Nota Fiscal #${nota.numero}`);
    setAnexoUrl(url);
    setOpenModalAnexo(true);
  };

  const handleCloseAnexo = () => {
    setOpenModalAnexo(false);
    setAnexoUrl(null);
    setAnexoTitulo("");
  };

  const handleOpenExcluir = (nota) => {
    setNotaParaExcluir(nota);
    setOpenConfirmarExclusao(true);
  };

  const handleCloseExcluir = () => {
    setOpenConfirmarExclusao(false);
    setNotaParaExcluir(null);
  };

  const handleConfirmarExclusao = async () => {
    if (!notaParaExcluir) return;

    setLoading(true);
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/notasfiscais/${notaParaExcluir.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showSnackbar("Nota fiscal excluída com sucesso");
      fetchNotasFiscais();
      handleCloseExcluir();
    } catch (err) {
      console.error("Erro ao excluir nota fiscal:", err);
      showSnackbar(err.response?.data?.error || "Erro ao excluir nota fiscal");
    } finally {
      setLoading(false);
    }
  };

  // ======================================
  // Funções auxiliares
  const handleLimparFiltros = () => {
    setFiltroStatus("todos");
    setFiltroFornecedor("");
    setFiltroNumero("");
    setFiltroDataInicio("");
    setFiltroDataFim("");
  };

  const handleAplicarFiltros = () => {
    fetchNotasFiscais();
  };

  const handleDownloadAnexo = async (nota) => {
    if (!nota.anexo_url && !nota.anexo) {
      showSnackbar("Nenhum anexo disponível para download");
      return;
    }

    try {
      const url = nota.anexo_url || `${import.meta.env.VITE_API_URL}/notas-fiscais/${nota.id}/anexo`;
      window.open('./compras/backend/public/' . url, '_blank');
    } catch (err) {
      console.error("Erro ao baixar anexo:", err);
      showSnackbar("Erro ao baixar anexo");
    }
  };

  // Navegar para tela de cadastro
  const handleNovaNota = () => {
    navigate("/Compras/entregamateriais/cadastrar");
  };

  // Navegar para tela de edição
  const handleEditarNota = (notaId) => {
    navigate(`/Compras/entregamateriais/editar/${notaId}`);
  };

  // ======================================
  // Formatar dados para DataGrid
  const getStatusChip = (status) => {
    const config = {
      pendente: { color: "warning", label: "Pendente" },
      recebida: { color: "success", label: "Recebida" },
      cancelada: { color: "error", label: "Cancelada" },
    };

    const cfg = config[status] || { color: "default", label: status };
    return <Chip label={cfg.label} color={cfg.color} size="small" />;
  };

  const dataWithActions = notasFiscais.map((nota) => ({
    ...nota,
    "Anexo": nota.anexo_url || nota.anexo ? (
      <Box display="flex" gap={1}>
        <Tooltip title="Visualizar Anexo">
          <IconButton
            size="small"
            color="primary"
            onClick={() => handleOpenAnexo(nota)}
          >
            <FiEye />
          </IconButton>
        </Tooltip>
      </Box>
    ) : null,
    "Observação": nota.obs && nota.obs.trim() !== "" ? (
      <Box display="flex" gap={1}>
        <Tooltip title="Visualizar Observação">
          <IconButton
            size="small"
            color="primary"
            onClick={() => handleOpenObs(nota)}
          >
            <FiEye />
          </IconButton>
        </Tooltip>
      </Box>
    ) : null,
    "Status": getStatusChip(nota.status),
    "Ações": (
      <Box display="flex" gap={1}>
        <Tooltip title="Editar">
          <IconButton
            size="small"
            color="info"
            onClick={() => handleEditarNota(nota.id)}
            disabled={nota.status === 'recebida' || nota.status === 'cancelada'}
          >
            <FiEdit />
          </IconButton>
        </Tooltip>

        {nota.anexo_url || nota.anexo ? (
          <Tooltip title="Baixar Anexo">
            <IconButton
              size="small"
              color="secondary"
              onClick={() => handleDownloadAnexo(nota)}
            >
              <FiDownload />
            </IconButton>
          </Tooltip>
        ) : null}
      </Box>
    ),
  }));

  // Colunas a serem ocultadas no DataGrid
  const hiddenColumns = [7, 9, 10, 11, 12, 13];

  return (
    <div>
      <Card>
        <CardContent>
          {/* Cabeçalho com título e botão nova nota */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
          >
            <Typography variant="h5">Notas Fiscais</Typography>

            <Button
              variant="contained"
              startIcon={<FiPlus />}
              onClick={handleNovaNota}
            >
              Nova Nota Fiscal
            </Button>
          </Box>

          {/* Filtros */}
          <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" mb={2}>
              Filtros
            </Typography>

            <Box display="flex" flexWrap="wrap" gap={2}>
              {/* Status */}
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filtroStatus}
                  label="Status"
                  onChange={(e) => setFiltroStatus(e.target.value)}
                >
                  <MenuItem value="todos">Todos</MenuItem>
                  <MenuItem value="pendente">Pendente</MenuItem>
                  <MenuItem value="recebida">Recebida</MenuItem>
                  <MenuItem value="cancelada">Cancelada</MenuItem>
                </Select>
              </FormControl>

              {/* Fornecedor */}
              <Autocomplete
                size="small"
                sx={{ minWidth: 200 }}
                options={[{ id: "", nome_fantasia: "Todos" }, ...fornecedores]}
                getOptionLabel={(option) => option.nome_fantasia}
                value={fornecedores.find(f => f.id === filtroFornecedor) ||
                  { id: "", nome_fantasia: "Todos" }}
                onChange={(event, newValue) => {
                  setFiltroFornecedor(newValue ? newValue.id : "");
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Fornecedor"
                    variant="outlined"
                  />
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />

              {/* Número da NF */}
              <TextField
                size="small"
                label="Número NF"
                value={filtroNumero}
                onChange={(e) => setFiltroNumero(e.target.value)}
                sx={{ width: 150 }}
              />

              {/* Data Início */}
              <TextField
                size="small"
                label="Data Início"
                type="date"
                value={filtroDataInicio}
                onChange={(e) => setFiltroDataInicio(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />

              {/* Data Fim */}
              <TextField
                size="small"
                label="Data Fim"
                type="date"
                value={filtroDataFim}
                onChange={(e) => setFiltroDataFim(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />

              {/* Botões de ação dos filtros */}
              <Box display="flex" gap={1} alignItems="center">
                <Button
                  variant="contained"
                  startIcon={<FiSearch />}
                  onClick={handleAplicarFiltros}
                >
                  Filtrar
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<FiRefreshCw />}
                  onClick={handleLimparFiltros}
                >
                  Limpar
                </Button>

                <ExportExcel
                  data={notasFiscais.map(
                    ({ created_at, updated_at, anexo_url, anexo, chave_acesso, id, tipo, modelo, matricula, ...resto }) => resto
                  )}
                  fileName="relatorio_notas_fiscais"
                />
              </Box>
            </Box>
          </Paper>

          {/* DataGrid */}
          <DataGrid
            data={dataWithActions || []}
            loading={loadingNotas}
            error={error}
            hiddenIndexes={hiddenColumns}
            initialPageSize={10}
          />
        </CardContent>
      </Card>

      {/* ================== MODAIS ================== */}

      {/* Modal de Detalhes (mantido original) */}
      <Dialog
        open={openDetalhes}
        onClose={handleCloseDetalhes}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Nota Fiscal #{notaSelecionada?.numero}
          <Typography variant="body2" color="text.secondary">
            Série: {notaSelecionada?.serie}
          </Typography>
        </DialogTitle>

        <DialogContent dividers>
          {notaSelecionada && (
            <>
              {/* Informações da Nota */}
              <Box mb={3}>
                <Typography variant="subtitle1" fontWeight="bold" mb={2}>
                  Informações da Nota
                </Typography>

                <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Status:</Typography>
                    {getStatusChip(notaSelecionada.status)}
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary">Data Emissão:</Typography>
                    <Typography variant="body1">
                      {new Date(notaSelecionada.data_emissao).toLocaleDateString()}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary">Data Entrada:</Typography>
                    <Typography variant="body1">
                      {new Date(notaSelecionada.data_entrada).toLocaleDateString()}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary">Valor Total:</Typography>
                    <Typography variant="body1" fontWeight="bold">
                      R$ {parseFloat(notaSelecionada.valor_total || 0).toFixed(2)}
                    </Typography>
                  </Box>
                </Box>

                {/* Fornecedor */}
                {fornecedorInfo && (
                  <Box mt={2}>
                    <Typography variant="body2" color="text.secondary">Fornecedor:</Typography>
                    <Typography variant="body1">{fornecedorInfo.nome}</Typography>
                    {fornecedorInfo.cnpj && (
                      <Typography variant="body2" color="text.secondary">
                        CNPJ: {fornecedorInfo.cnpj}
                      </Typography>
                    )}
                  </Box>
                )}

                {/* Observações */}
                {notaSelecionada.obs && (
                  <Box mt={2}>
                    <Typography variant="body2" color="text.secondary">Observações:</Typography>
                    <Typography variant="body1">{notaSelecionada.obs}</Typography>
                  </Box>
                )}
              </Box>

              {/* Itens da Nota */}
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" mb={2}>
                  Itens da Nota ({itensNota.length})
                </Typography>

                {itensNota.length === 0 ? (
                  <Typography textAlign="center" color="text.secondary">
                    Nenhum item encontrado.
                  </Typography>
                ) : (
                  <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                    {itensNota.map((item, index) => (
                      <Paper
                        key={index}
                        sx={{
                          p: 2,
                          mb: 2,
                          borderRadius: 2,
                          bgcolor: 'grey.50',
                        }}
                      >
                        <Box display="flex" justifyContent="space-between" alignItems="start">
                          <Box>
                            <Typography fontWeight="bold">
                              {item.codigo_material} - {item.descricao}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Quantidade: {item.quantidade} {item.unidade_medida}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Valor Unitário: R$ {parseFloat(item.valor_unitario || 0).toFixed(2)}
                            </Typography>
                            {item.numero_lote && (
                              <Typography variant="body2" color="text.secondary">
                                Lote: {item.numero_lote}
                              </Typography>
                            )}
                          </Box>
                          <Typography variant="h6" color="primary">
                            R$ {parseFloat(item.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Typography>
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                )}
              </Box>
            </>
          )}
        </DialogContent>

        <DialogActions>
          {notaSelecionada?.anexo_url && (
            <Button
              startIcon={<FiDownload />}
              onClick={() => window.open(notaSelecionada.anexo_url, '_blank')}
            >
              Baixar Anexo
            </Button>
          )}
          <Button onClick={handleCloseDetalhes}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Confirmação de Exclusão (mantido original) */}
      <Dialog
        open={openConfirmarExclusao}
        onClose={handleCloseExcluir}
      >
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir a nota fiscal{" "}
            <strong>{notaParaExcluir?.numero}</strong>?
            {notaParaExcluir?.status === 'recebida' && (
              <Typography color="error" variant="body2" mt={1}>
                Notas recebidas não podem ser excluídas.
              </Typography>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseExcluir}>Cancelar</Button>
          <Button
            onClick={handleConfirmarExclusao}
            color="error"
            variant="contained"
            disabled={notaParaExcluir?.status === 'recebida'}
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Observações (usando seu componente Modal) */}
      <Modal
        open={openModalObs}
        title={obsTitulo}
        onClose={handleCloseObs}
        buttons={
          <Button onClick={handleCloseObs} variant="contained">
            Fechar
          </Button>
        }
      >
        <Box sx={{ p: 2 }}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              bgcolor: 'grey.50',
              borderRadius: 2,
              minHeight: 100,
              maxHeight: 400,
              overflowY: 'auto'
            }}
          >
            <Typography variant="body1" whiteSpace="pre-wrap">
              {obsConteudo}
            </Typography>
          </Paper>
        </Box>
      </Modal>

      {/* Modal de Anexo (usando seu componente Modal) */}
      <Modal
        open={openModalAnexo}
        title={anexoTitulo}
        onClose={handleCloseAnexo}
        buttons={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              onClick={() => window.open(anexoUrl, '_blank')}
              variant="contained"
              startIcon={<FiDownload />}
            >
              Baixar
            </Button>
            <Button onClick={handleCloseAnexo} variant="outlined">
              Fechar
            </Button>
          </Box>
        }
      >
        <Box sx={{ p: 2, textAlign: 'center' }}>
          {anexoUrl ? (
            <Box>
              <Typography variant="body1" gutterBottom>
                O anexo está disponível para visualização.
              </Typography>
              <Button
                variant="contained"
                startIcon={<FiEye />}
                onClick={() => window.open(anexoUrl, '_blank')}
                sx={{ mt: 2 }}
              >
                Abrir Anexo em Nova Aba
              </Button>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Se o arquivo não abrir automaticamente, clique no botão "Baixar".
              </Typography>
            </Box>
          ) : (
            <Typography variant="body1" color="text.secondary">
              Nenhum anexo disponível para esta nota fiscal.
            </Typography>
          )}
        </Box>
      </Modal>

      {/* Backdrop de Loading */}
      <Backdrop
        open={loading}
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      {/* Snackbar */}
      <CustomSnackbar
        open={snackbarOpen}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
      />
    </div>
  );
}