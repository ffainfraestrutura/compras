import axios from "axios";
import { useEffect, useState } from "react";
import {
  Backdrop,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Select,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  FiAlertTriangle,
  FiArrowDownLeft,
  FiArrowLeft,
  FiCheck,
  FiEye,
  FiTrash,
  FiX,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import CustomSnackbar from "../../../components/SnackBar/SnackBar";
import DataGrid from "../../../components/DataGrid/DataGrid";
import Modal from "../../../components/Modal/Modal";
import useTodasSolicitacoes from "../../../hooks/useTodasSolicitacoes";
import ExportExcel from "../../../components/Button/ExportExcel/ExportExcel";
import DrawerDetalhes from "../../../components/Drawer/DrawerDetalhes";

export default function Index() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Modal de justificativa visualização
  const [openJustificativa, setOpenJustificativa] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedCodCompra, setSelectedCodCompra] = useState(null);

  // Modal de aprovação/reprovação
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [approvalItem, setApprovalItem] = useState(null);
  const [approvalStatus, setApprovalStatus] = useState(null); // 1 = aprovar, 0 = reprovar
  const [approvalJustificativa, setApprovalJustificativa] = useState("");
  const [statusOptions, setStatusOptions] = useState([]);

  // Modal de Voltar o processo
  const [backProcessOpen, setBackProcessOpen] = useState(false);
  const [backItem, setBackItem] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnData, setReturnData] = useState([]);
  const [returnComment, setReturnComment] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [itemDetalhes, setItemDetalhes] = useState(null);

  const [modalCancelar, setModalCancelar] = useState({ open: false, item: null });

  const exportHeaders = [
    { label: "Cód. Compra", key: "cod_compra" },
    { label: "Solicitante", key: "solicitante" },
    { label: "Materiais", key: "descricao" },
    { label: "Justificativa", key: "justificativa" },
    { label: "Data Solicitação", key: "data_solicitacao" },
    {
      label: "Status", key: (item) => {
        const statusInfo = getStatusInfo(item);
        return `${statusInfo.label} ${statusInfo.paradoEm ? `- ${statusInfo.paradoEm}` : ""}`;
      }
    },
    { label: "Gerente", key: "gerente_nome" },
    { label: "Justificativa Gerente", key: "justificativa_gerente" },
    { label: "Gestor de Material", key: "material_nome" },
    { label: "Justificativa Material", key: "justificativa_material" },
    { label: "Comprador", key: "compras_nome" },
    { label: "Justificativa Compras", key: "justificativa_compra" },
    { label: "Diretoria / Gerência", key: "diretor_nome" },
    { label: "Justificativa Diretor / Gerência", key: "justificativa_diretor" },
    { label: "Filial", key: "filial" },
    { label: "Centro de Custo", key: "ccusto" },
    { label: "Preço Unitário", key: "preco_unitario" },
    { label: "Preço Total", key: "preco_total" }
  ];

  const handleCancelar = async (item) => {
    if (!item) return;

    try {
      setLoading(true);
      await axios.put(
        `${import.meta.env.VITE_API_URL}/solicitacoes/${item["Cod. Compra"]}/cancelar`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      console.log(item["Cod. Compra"]);
      setModalCancelar({ open: false, item: null });
      showSnackbar("Solicitação cancelada com sucesso!");

      // Recarrega a lista de solicitações
      // Você pode adicionar aqui a lógica para atualizar a lista
      window.location.reload(); // ou use uma função de refresh

    } catch (error) {
      console.error("Erro ao cancelar:", error);
      showSnackbar("Erro ao cancelar solicitação: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const {
    getSolicitacao,
    loading: loadingSolicitacao,
    error,
  } = useTodasSolicitacoes();

  // Função para determinar o status do item
  function getStatusInfo(item) {
    if (item.status == 0) {
      return { label: "Cancelado", color: "error", paradoEm: null };
    }
    // Se o diretor já aprovou → aprovado / material comprado
    if (item.entregue == "1") {
      return { label: "Material Recebido", color: "success", paradoEm: null };
    }
    if (item.finalizado == "1") {
      return { label: "Material Comprado", color: "success", paradoEm: null };
    }

    if (item.aceite_diretor == "1") {
      return { label: "Aprovado pela Diretoria", color: "primary", paradoEm: null };
    }

    if (item.aceite_gerente === 0) return { label: "Reprovado ", color: "error", paradoEm: "Gerente" };
    if (item.aceite_material === 0) return { label: "Reprovado ", color: "error", paradoEm: "Gestor Material" };
    if (item.aceite_compra === 0) return { label: "Reprovado ", color: "error", paradoEm: "Compras" };
    if (item.aceite_diretor == 0) return { label: "Reprovado ", color: "error", paradoEm: "Diretoria" };

    // Se houver algum NULL → está aguardando
    if (item.aceite_gerente === null) return { label: "Aguardando ", color: "primary", paradoEm: "Gerente" };
    if (item.aceite_material === null) return { label: "Aguardando ", color: "primary", paradoEm: "Gestor Material" };
    if (item.aceite_compra === null) return { label: "Aguardando ", color: "primary", paradoEm: "Cotação" };
    if (item.aceite_diretor === null) return { label: "Aguardando ", color: "primary", paradoEm: "Diretoria" };

    // Caso qualquer outro status incomum
    return { label: "Aguardando", color: "primary", paradoEm: "Desconhecido" };
  }

  // Snackbar
  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };
  const handleSnackbarClose = () => setSnackbarOpen(false);

  // --- Funções modal justificativa ---
  const handleOpenJustificativa = async (item) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/historico/${item["Cod. Compra"]}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setSelectedItem(response.data);
      setOpenJustificativa(true);
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
    }
  };
  const handleCloseJustificativa = () => {
    setOpenJustificativa(false);
    setSelectedItem(null);
  };

  const handleRowClick = (row) => {
    setSelectedItem(row);
    setDrawerOpen(true);
  };

  const stopPropagation = (e) => e.stopPropagation();

  // --- Funções modal justificativa ---
  const handleOpenBackProcess = (item) => {
    setBackItem(item);
    setOpenJustificativa(true);
  };
  const handleCloaseBackProcess = () => {
    setOpenJustificativa(false);
    setBackItem(null);
  };

  const handleSubmitFinalizarRetorno = async () => {
    if (!returnComment.trim()) {
      showSnackbar("Informe uma justificativa para continuar.");
      return;
    }
    try {
      setLoading(true);
      const payload = { cod_compra: selectedCodCompra, justificativa: returnComment };
      await axios.put(`${import.meta.env.VITE_API_URL}/finalizarretorno`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      showSnackbar("Resposta registrada com sucesso!");
      handleCloseReturnModal();
      window.location.reload();
    } catch (error) {
      console.error(error.response?.data || error.message);
      showSnackbar("Erro ao registrar resposta!");
    } finally {
      setLoading(false);
    }
  };

  // --- Funções modal aprovação/reprovação ---
  const handleOpenApprovalModal = (item, status) => {
    setApprovalItem(item);
    setApprovalStatus(status);
    setApprovalJustificativa("");
    setApprovalModalOpen(true);
  };
  const handleCloseApprovalModal = () => {
    setApprovalModalOpen(false);
    setApprovalItem(null);
    setApprovalStatus(null);
    setApprovalJustificativa("");
  };

  const handleCloseReturnModal = () => {
    setReturnData([]);
    setReturnComment("");
    setReturnModalOpen(false);
    setSelectedCodCompra(null);
  };

  const niveisUsuarios = [
    { nivel: 1, nome: "Solicitante" },
    { nivel: 2, nome: "Setor de Material" },
    { nivel: 3, nome: "Setor de Compra" },
    { nivel: 4, nome: "Gerente Adm" },
    { nivel: 5, nome: "Diretor Adm" },
    { nivel: 6, nome: "CFO" }
  ];

  const handleOpenReturnModal = async (cod_compra) => {
    setSelectedCodCompra(cod_compra);

    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/retornos/${cod_compra}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        }
      );


      setReturnData(response.data);
      setReturnComment("");
      setReturnModalOpen(true);
    } catch (error) {
      console.error("Erro ao buscar retornos:", error.response?.data || error.message);
      showSnackbar("Erro ao buscar informações de retorno.");
    } finally {
      setLoading(false);
    }
  };

  const userLevel = parseInt(localStorage.getItem("nivel_acesso"));

  // Garante que a coluna Status só apareça para níveis 2 ou 3
  const canViewStatus = [1, 2, 3, 4, 5, 6, 7].includes(userLevel);

  // Prepara os dados da tabela com a coluna de Status
  
  const dataWithActions = getSolicitacao.map((item) => {
    const statusInfo = getStatusInfo(item);
    const statusText = `${statusInfo.label} ${statusInfo.paradoEm ? `- ${statusInfo.paradoEm}` : ""}`;

    return {
      ...item,
      "Ver Detalhes": (
        <Box onClick={stopPropagation} display="flex" height="100%" alignItems="center" gap={1}>
          <Tooltip title="Visualizar Detalhes">
            <IconButton
              size="small"
              color="primary"
              onClick={async () => navigate(`../DetalhesCompra/${item["Cod. Compra"]}`)}
              sx={{
                backgroundColor: "rgba(25, 118, 210, 0.1)",
                "&:hover": { backgroundColor: "rgba(25, 118, 210, 0.2)" },
                transition: "background-color 0.3s ease",
              }}
              aria-label="Visualizar"
            >
              <FiEye />
            </IconButton>
          </Tooltip>
        </Box>
      ),
      Cancelar: (item.matricula == localStorage.getItem('matricula') || localStorage.getItem('nivel_acesso') == 3)&& item.aceite_compra == null && !statusText.includes('Reprovado') ? (
        <Tooltip onClick={stopPropagation} title="Cancelar Solicitação">
          <IconButton size="small" sx={{ color: "error.main" }}
            onClick={() => setModalCancelar({ open: true, item })}>
            <FiTrash />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip title="Não é possivel Cancelar essa solicitação">
          <IconButton size="small" sx={{ color: "gray.main" }}>
            <FiTrash />
          </IconButton>
        </Tooltip>
      ),
      'Status Material': statusText,
      Responder: (item.status != null && item.matricula_destino == localStorage.getItem('matricula')) ? (
        <Tooltip onClick={stopPropagation} title="Ver Justificativa de Retorno">
          <IconButton
            size="small"
            sx={{ color: "warning.main" }}
            onClick={() => handleOpenReturnModal(item["Cod. Compra"])}
          >
            <FiAlertTriangle />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip title="Sem novas Perguntas">
          <IconButton size="small" sx={{ color: "success.main" }}>
            <FiCheck />
          </IconButton>
        </Tooltip>

      ),
      Status: canViewStatus ? (
        <Box onClick={stopPropagation} display="flex" flexDirection="column" height="100%" justifyContent="center" alignItems="start" gap={0.5}>
          <Button variant="contained" color={statusInfo.color} size="small">
            {statusInfo.label} {statusInfo.paradoEm ? `- ${statusInfo.paradoEm}` : ""}
          </Button>
        </Box>
      ) : (
        <Typography onClick={stopPropagation} variant="body2" color="textSecondary">
          {statusInfo.label} {statusInfo.paradoEm ? `- ${statusInfo.paradoEm}` : ""}
        </Typography>
      ),

    };
  });

  // Ajuste nos índices ocultos para incluir a nova coluna de Status
  // Você pode precisar ajustar esses números dependendo da estrutura dos seus dados
  const hiddenIndexes = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 16];

  return (
    <div>
      <Card>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h5">Relatório Geral</Typography>
            <ExportExcel
              headers={exportHeaders}
              endpoint={`${import.meta.env.VITE_API_URL}/relatorio/relatorio-geral`}
              filename="relatorio_solicitacoes"
              buttonText="Exportar Relatório"
              variant="contained"
              color="success"
              onExportStart={() => console.log("Iniciando exportação...")}
              onExportSuccess={() => showSnackbar("Relatório exportado com sucesso!")}
              onExportError={(error) => showSnackbar("Erro ao exportar: " + error.message)}
            />
          </Box>

          <DataGrid
            data={dataWithActions || []}
            loading={loadingSolicitacao}
            error={error}
            hiddenIndexes={hiddenIndexes}
            initialPageSize={10}
            onRowClick={handleRowClick}
          />
        </CardContent>
      </Card>

      <Backdrop
        open={loading}
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <CircularProgress color="inherit" />
      </Backdrop>


      {/* Modal de Justificativa */}
      <Modal open={openJustificativa} onClose={handleCloseJustificativa}>
        <Box
          sx={{
            p: 4,
            maxWidth: 700,
            mx: "auto",
            bgcolor: "background.paper",
            borderRadius: 3,
            boxShadow: 3,
          }}
        >
          {selectedItem && (
            <>
              <Typography
                variant="h5"
                mb={3}
                fontWeight="bold"
                color="primary.main"
                textAlign="center"
              >
                Histórico da Solicitação
              </Typography>

              {selectedItem.length > 0 ? (
                selectedItem.map((evento, index) => (
                  <Paper
                    key={index}
                    elevation={1}
                    sx={{
                      p: 3,
                      mb: 2.5,
                      borderRadius: 2,
                      borderLeft: "5px solid",
                      borderColor: "primary.light",
                      bgcolor: "grey.50",
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                      {evento.tipo} - {evento.etapa}
                    </Typography>
                    <Typography variant="body2" mb={1}>
                      <strong>Data:</strong> {evento.data}
                    </Typography>
                    <Typography variant="body2" mb={1}>
                      <strong>Responsável:</strong> {evento.responsavel_nome} (
                      {evento.responsavel_matricula})
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ whiteSpace: "pre-line", color: "text.secondary" }}
                    >
                      {evento.detalhes}
                    </Typography>
                  </Paper>
                ))
              ) : (
                <Typography textAlign="center" color="text.secondary">
                  Nenhum histórico encontrado.
                </Typography>
              )}

              <Box display="flex" justifyContent="center" mt={3}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleCloseJustificativa}
                >
                  Fechar
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Modal>

      <Modal open={returnModalOpen} title="Justificativa de Retorno" onClose={handleCloseReturnModal}>
        <Box display="flex" flexDirection="column" gap={2} p={2}>
          {returnData.length === 0 ? (
            <Typography>Nenhuma justificativa de retorno encontrada.</Typography>
          ) : (
            returnData.map((item, index) => {
              const setor =
                niveisUsuarios.find((u) => u.nivel === item.setor_origem)?.nome ||
                `Setor ${item.setor_origem}`;
              return (
                <Paper
                  key={index}
                  elevation={1}
                  sx={{
                    p: 2,
                    mb: 2,
                    borderRadius: 2,
                    borderLeft: "5px solid",
                    borderColor: "info.main",
                    bgcolor: "grey.50"
                  }}
                >
                  <Typography variant="subtitle2" fontWeight="bold">
                    {item.nome_origem} - {setor}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ whiteSpace: "pre-line", color: "text.secondary" }}
                  >
                    {item.justificativa_origem}
                  </Typography>
                </Paper>
              );
            })
          )}
          <TextField
            label="Adicionar resposta sobre o retorno"
            multiline
            rows={3}
            fullWidth
            value={returnComment}
            onChange={(e) => setReturnComment(e.target.value)}
            placeholder="Digite uma resposta..."
          />
          <Box display="flex" justifyContent="flex-end" gap={2} mt={1}>
            <Button variant="outlined" onClick={handleCloseReturnModal}>
              Fechar
            </Button>
            <Button variant="contained" color="primary" onClick={handleSubmitFinalizarRetorno}>
              Salvar resposta
            </Button>
          </Box>
        </Box>
      </Modal>

      <DrawerDetalhes
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        item={selectedItem}
        solicitacoes={getSolicitacao}
      />
      <Dialog
        open={modalCancelar.open}
        onClose={() => setModalCancelar({ open: false, item: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Cancelar Solicitação
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Tem certeza que deseja cancelar a solicitação?{" "}
            Essa ação não poderá ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => setModalCancelar({ open: false, item: null })}
          >
            Voltar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => handleCancelar(modalCancelar.item)}
          >
            Confirmar Cancelamento
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}