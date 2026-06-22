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
} from "@mui/material";
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiCheck,
  FiEye,
  FiSend,
  FiX,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import CustomSnackbar from "../../../components/SnackBar/SnackBar";
import DataGrid from "../../../components/DataGrid/DataGrid";
import Modal from "../../../components/Modal/Modal";

export default function Index() {
  const navigate = useNavigate();
  const nivelAcesso = Number(localStorage.getItem("nivel_acesso"));

  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const [groupBy, setGroupBy] = useState("cod_compra");
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [loadingSolicitacao, setLoadingSolicitacao] = useState(false);
  const [error, setError] = useState(null);
  // ======================================
  // Modal Justificativa
  const [openJustificativa, setOpenJustificativa] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itensAgrupados, setItensAgrupados] = useState([]);
  const [loadingItensAgrupados, setLoadingItensAgrupados] = useState(false);
  const [openItens, setOpenItens] = useState(false);

  // Modal Aprovação
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [approvalItem, setApprovalItem] = useState(null);
  const [approvalStatus, setApprovalStatus] = useState(null);
  const [approvalJustificativa, setApprovalJustificativa] = useState("");

  // Modal Voltar Processo
  const [backProcessOpen, setBackProcessOpen] = useState(false);
  const [backItem, setBackItem] = useState(null);
  const [justificativaVolta, setJustificativaVolta] = useState("");
  const [selectedBackLevel, setSelectedBackLevel] = useState("");

  // Modal Retorno
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnData, setReturnData] = useState([]);
  const [returnComment, setReturnComment] = useState("");
  const [cotacoes, setCotacoes] = useState("");

  const fetchSolicitacoes = async () => {
    setLoadingSolicitacao(true);
    setError(null);
    try {
      // Define o endpoint baseado no groupBy
      let endpoint;
      if (groupBy === "cod_material") {
        endpoint = `${import.meta.env.VITE_API_URL}/materiais_agrupados`;
      } else {
        endpoint = `${import.meta.env.VITE_API_URL}/materiais_comprados`;
      }

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      setSolicitacoes(response.data);
    } catch (err) {
      console.error(err);
      setError("Erro ao buscar dados");
    } finally {
      setLoadingSolicitacao(false);
    }
  };
  // useEffect só chama a função
  useEffect(() => {
    fetchSolicitacoes();
  }, [groupBy]);

  // ======================================
  // Snackbar
  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };
  const handleSnackbarClose = () => setSnackbarOpen(false);

  const handleCloseItens = () => {
    setOpenItens(false);
    setSelectedItem(null);
  };

  // ======================================
  // Funções Modais
  const handleOpenJustificativa = async (item) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/historico/${item["cod_compra"]}`,
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

  const handleCloseJustificativa = () => setOpenJustificativa(false);

  const handleOpenApprovalModal = (item, status) => {
    console.log(item);
    setApprovalItem(item);
    setApprovalStatus(status);
    setApprovalJustificativa("");
    setApprovalModalOpen(true);
  };
  const handleCloseApprovalModal = () => {
    setApprovalItem(null);
    setApprovalStatus(null);
    setApprovalJustificativa("");
    setApprovalModalOpen(false);
  };

  const handleSubmitApproval = async () => {
    try {
      setLoading(true);
      // Remove essas linhas desnecessárias
      // const camposAceite = { aceite: "entregue", matricula: "matricula_entregue" };
      // const campos = camposAceite[nivelAcesso];

      const payload = {
        cod_compra: approvalItem["cod_compra"],
        cod_cotacao: approvalItem["Código"],
        entregue: 1,
        matricula_entregue: localStorage.getItem("matricula"),
      };
      await axios.put(
        `${import.meta.env.VITE_API_URL}/marcar_entregue`,
        payload,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      showSnackbar("Processo marcado como entregue");
      handleCloseApprovalModal();
      fetchSolicitacoes();
    } catch (error) {
      console.error(error.response?.data || error.message);
      showSnackbar("Erro ao realizar ação!");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBackProcess = async (item) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/retornos/${item["cod_compra"]}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setReturnData(response.data);
      setBackItem(item);
      setJustificativaVolta("");
      setSelectedBackLevel("");
      setBackProcessOpen(true);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  const handleCloseBackProcess = () => {
    setBackItem(null);
    setBackProcessOpen(false);
  };

  const handleOpenReturnModal = async (codCompra) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/retornos/${codCompra}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setReturnData(response.data);
      setReturnComment("");
      setReturnModalOpen(true);
    } catch (error) {
      console.error(error);
      showSnackbar("Erro ao buscar informações de retorno.");
    } finally {
      setLoading(false);
    }
  };
  const handleCloseReturnModal = () => {
    setReturnData([]);
    setReturnComment("");
    setReturnModalOpen(false);
  };

  const handleSubmitFinalizarRetorno = async (codigos) => {
    if (!returnComment.trim()) {
      showSnackbar("Informe uma justificativa para continuar.");
      return;
    }
    try {
      setLoading(true);
      const payload = { cod_compra: codigos, justificativa: returnComment };
      await axios.put(
        `${import.meta.env.VITE_API_URL}/finalizarretorno`,
        payload,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
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

  const handleOpenItens = async (item) => {
    setSelectedItem(item);
    setOpenItens(true);
    setLoadingItensAgrupados(true);

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/itens_agrupados`,
        {
          params: { cod_material: item["Código"] },
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      setItensAgrupados(response.data.data || []);
    } catch (error) {
      console.error(error);
      showSnackbar("Erro ao carregar itens agrupados");
      setItensAgrupados([]);
    } finally {
      setLoadingItensAgrupados(false);
    }
  };

  const handleSubmitRetorno = async () => {
    if (!backItem) {
      showSnackbar("Erro: Nenhuma solicitação selecionada.");
      return;
    }
    if (!selectedBackLevel) {
      showSnackbar("Selecione um setor de destino para retornar o processo.");
      return;
    }
    if (!justificativaVolta.trim()) {
      showSnackbar("A justificativa é obrigatória para retornar o processo.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        cod_compra: backItem["cod_compra"], // 3. Usando o estado "backItem"
        setor_destino: selectedBackLevel,
        justificativa: justificativaVolta,
      };

      await axios.put(
        `${import.meta.env.VITE_API_URL}/retornarprocesso`,
        payload,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      showSnackbar("Solicitação retornada com sucesso!");
      handleCloseBackProcess(); // A função de fechar o modal é chamada aqui, após o sucesso
      window.location.reload();
    } catch (error) {
      console.error(error.response?.data || error.message);
      showSnackbar("Erro ao retornar solicitação!");
    } finally {
      setLoading(false);
    }
  };

  const userLevel = localStorage.getItem("nivel_acesso");

  // ======================================
  // Colunas e Título Dinâmico
  let hiddenIndexes =
    groupBy === "cod_material"
      ? [2, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]
      : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
  const actionColumnName = [2, 4, 5, 6].includes(nivelAcesso)
    ? "Aprovar"
    : nivelAcesso === 3
      ? "Realizar Cotação"
      : "Ações";
  // const viewColumnName =
  //     [2, 4, 5].includes(nivelAcesso)
  //         ? "Ver Itens"
  //         : nivelAcesso === 3
  //             ? "Cotar Material"
  //             : "Ações";

  const dataWithActions = solicitacoes.map((item) => ({
    ...item,
    // Coluna Justificativa
    "Ver Detalhes": (
      <Box display="flex" height="100%" alignItems="center" gap={1}>
        <Tooltip title="Visualizar Detalhes">
          <IconButton
            size="small"
            color="primary"
            onClick={async () => navigate(`../DetalhesCompra/${item["cod_compra"]}`)}
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
    "Ver Cotação": (
      <Tooltip title="Visualizar">
        <IconButton
          size="small"
          color="primary"
          onClick={async () => {
            try {
              const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/cotacao/${item["Código"]}`,
                {
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                  },
                }
              );

              const rawData = response.data;

              if (rawData && rawData.length > 0) {
                const cotacoesExistentes = {};
                const slots = [
                  "Fornecedor I",
                  "Fornecedor II",
                  "Fornecedor III",
                  "Fornecedor IV",
                  "Fornecedor V",
                ];

                // 1. Agrupar cotações por material
                rawData.forEach((cotacao) => {
                  if (!cotacoesExistentes[cotacao.cod_material]) {
                    cotacoesExistentes[cotacao.cod_material] = {
                      ultima_compra: cotacao.ultima_compra || 0,
                      media_historica: cotacao.media_historica || 0,
                      media_6_meses: cotacao.media_6_meses || 0,
                      fornecedores: [],
                    };
                  }

                  cotacoesExistentes[cotacao.cod_material].fornecedores.push({
                    nomeFornecedor: cotacao.fornecedor_id,
                    nome_forncedor: cotacao.nome_fantasia,
                    preco: cotacao.preco || 0,
                    tipoFrete: cotacao.tipo_frete || "",
                    condPgto: cotacao.cond_pgto || "",
                    condEntrega: cotacao.cond_entrega || "",
                    ipi: cotacao.ipi || 0,
                    icms: cotacao.icms || 0,
                    valorFrete: cotacao.valor_frete || 0,
                    obs: cotacao.obs || "",
                    arquivo: cotacao.arquivo,
                    valorTotal: cotacao.total_cotacao,
                  });
                });

                // 2. Mapear fornecedores para slots fixos
                Object.keys(cotacoesExistentes).forEach((cod_material) => {
                  const materialData = cotacoesExistentes[cod_material];
                  const slotsData = {};
                  materialData.fornecedores.forEach((fornData, index) => {
                    if (index < slots.length) {
                      slotsData[slots[index]] = fornData;
                    }
                  });
                  delete materialData.fornecedores;
                  Object.assign(materialData, slotsData);
                });

                // 3. Criar array de materiais únicos
                const materiais = [
                  ...new Map(
                    rawData.map((item) => [
                      item.cod_material,
                      {
                        cod_material: item.cod_material,
                        descricao: item.descricao || item.cod_material,
                        quantidade: item.quantidade || 1,
                        unid: item.unid || "UN",
                      },
                    ])
                  ).values(),
                ];

                // 4. Criar summary com totais por fornecedor
                const summary = {};
                rawData.forEach((item) => {
                  const key = `Fornecedor ${item.fornecedor_id}`;
                  const quantidade = item.quantidade || 1;
                  summary[key] = (summary[key] || 0) + item.preco * quantidade;
                });

                // 5. Navegar para preview com os dados completos
                navigate("../AprovarCompra/CotarCompra/preview", {
                  state: {
                    materiais,
                    cotacoes: cotacoesExistentes,
                    summary,
                    cod_compra: item["cod_compra"],
                  },
                });
              }
            } catch (error) {
              console.error("Erro ao buscar cotação:", error);
            }
          }}
        >
          <FiEye />
        </IconButton>
      </Tooltip>
    ),
    "Marcar como Recebido": (
      <Button
        onClick={() => handleOpenApprovalModal(item, 1)}
        variant="contained"
        color="success"
        fullWidth
      >
        <FiSend />
      </Button>
    ),
  }));

  return (
    <div>
      <Card>
        <CardContent>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h5">Receber Materiais</Typography>
          </Box>

          <DataGrid
            data={dataWithActions || []}
            loading={loadingSolicitacao}
            error={error}
            hiddenIndexes={[3]}
            initialPageSize={10}
          />
        </CardContent>
      </Card>

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
      />

      {/* ================== Modais ================== */}

      {/* Modal Justificativa */}
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

      {/* Modal Aprovação/Reprovação */}
      <Modal
        open={approvalModalOpen}
        title={
          approvalStatus === 1 ? "Finalizar Processo" : "Finalizar Processo"
        }
        onClose={handleCloseApprovalModal}
      >
        <Box display="flex" flexDirection="column" gap={2}>
          <Typography>
            {`Você está prestes a marcar a solicitação como entregue`}
            <strong>{approvalItem?.["Cod. Compra"]}</strong>
          </Typography>
          <Box display="flex" justifyContent="flex-end" gap={2} mt={1}>
            <Button variant="outlined" onClick={handleCloseApprovalModal}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              color={approvalStatus === 1 ? "success" : "error"}
              onClick={handleSubmitApproval}
            >
              Confirmar
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Modal Justificativa de Retorno */}
      <Modal
        open={returnModalOpen}
        title="Justificativa de Retorno"
        onClose={handleCloseReturnModal}
      >
        <Box display="flex" flexDirection="column" gap={2} p={2}>
          {returnData.length === 0 ? (
            <Typography>
              Nenhuma justificativa de retorno encontrada.
            </Typography>
          ) : (
            returnData.map((item, index) => {
              const setor =
                niveisUsuarios.find((u) => u.nivel === item.setor_origem)
                  ?.nome || `Setor ${item.setor_origem}`;
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
                    bgcolor: "grey.50",
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
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                const codigos = returnData
                  .map((item) => item.cod_compra)
                  .join(",");
                handleSubmitFinalizarRetorno(codigos);
                handleCloseReturnModal();
              }}
            >
              Salvar resposta
            </Button>
          </Box>
        </Box>
      </Modal>
      <Modal open={openItens} onClose={handleCloseItens}>
        <Box
          sx={{
            p: 4,
            maxWidth: 600,
            mx: "auto",
            bgcolor: "background.paper",
            borderRadius: 3,
            boxShadow: 3,
            maxHeight: 600,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {selectedItem && (
            <>
              {/* CABEÇALHO (não rola) */}
              <Box>
                <Typography variant="h6" mb={2} textAlign="center">
                  Item - {selectedItem["Código"]}
                </Typography>
                <Typography variant="subtitle1" mb={2} textAlign="center">
                  Total do Item -{" "}
                  {itensAgrupados.length > 0
                    ? itensAgrupados[0].total_quantidade
                    : 0}
                </Typography>
              </Box>

              <Box sx={{ overflowY: "auto", flexGrow: 1, my: 2 }}>
                {loadingItensAgrupados ? (
                  <Box display="flex" justifyContent="center" my={2}>
                    <CircularProgress size={24} />
                  </Box>
                ) : itensAgrupados.length === 0 ? (
                  <Typography textAlign="center" color="text.secondary">
                    Nenhum item encontrado.
                  </Typography>
                ) : (
                  <>
                    {itensAgrupados.map((i, idx) => (
                      <Paper
                        key={idx}
                        sx={{
                          p: 2,
                          mb: 2,
                          borderRadius: 2,
                          bgcolor: "grey.50",
                        }}
                      >
                        <Typography>
                          <strong>Cod. Compra:</strong> {i.cod_compra}
                        </Typography>
                        <Typography>
                          <strong>Quantidade:</strong> {i.quantidade}
                        </Typography>
                      </Paper>
                    ))}
                  </>
                )}
              </Box>

              {/* RODAPÉ (não rola) */}
              <Box display="flex" justifyContent="center" mt={1}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleCloseItens}
                >
                  Fechar
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Modal>
    </div>
  );
}
