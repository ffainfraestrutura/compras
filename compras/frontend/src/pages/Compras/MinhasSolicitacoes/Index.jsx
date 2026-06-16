import axios from "axios";
import { useEffect, useState } from "react";
import {
    Backdrop,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Drawer,
    IconButton,
    MenuItem,
    Paper,
    Select,
    TextField,
    Tooltip,
    Typography
} from "@mui/material";
import { FiAlertTriangle, FiArrowLeft, FiCheck, FiEye, FiTrash } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import CustomSnackbar from "../../../components/SnackBar/SnackBar";
import DataGrid from "../../../components/DataGrid/DataGrid";
import Modal from "../../../components/Modal/Modal";
import useMinhasSolicitacoes from "../../../hooks/useMinhasSolicitacoes";
import DrawerDetalhes from "../../../components/Drawer/DrawerDetalhes";

export default function Index() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");

    // Modal de justificativa visualização
    const [openJustificativa, setOpenJustificativa] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    // Modal de Voltar o processo
    const [backProcessOpen, setBackProcessOpen] = useState(false);
    const [backItem, setBackItem] = useState(false);

    // Modal de retorno
    const [returnModalOpen, setReturnModalOpen] = useState(false);
    const [returnData, setReturnData] = useState([]);
    const [returnComment, setReturnComment] = useState("");
    const [selectedCodCompra, setSelectedCodCompra] = useState(null);

    // Modal Voltar Processo
    const [justificativaVolta, setJustificativaVolta] = useState("");
    const [selectedBackLevel, setSelectedBackLevel] = useState("");

    const [openItens, setOpenItens] = useState(false);

    const { getSolicitacao, loading: loadingSolicitacao, error } = useMinhasSolicitacoes();
    const [modalCancelar, setModalCancelar] = useState({ open: false, item: null });

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [itemDetalhes, setItemDetalhes] = useState(null);

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

    const handleRowClick = (row) => {
        setSelectedItem(row);
        setDrawerOpen(true);
    };

    const stopPropagation = (e) => e.stopPropagation();

    // Snackbar
    const showSnackbar = (message) => {
        setSnackbarMessage(message);
        setSnackbarOpen(true);
    };
    const handleSnackbarClose = () => setSnackbarOpen(false);

    // --- Modal justificativa ---
    const handleOpenJustificativa = async (item) => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/historico/${item["Cod. Compra"]}`,
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
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

    // --- Modal voltar processo ---
    const handleOpenBackProcess = (item) => {
        setBackItem(item);
        setBackProcessOpen(true);
    };
    const handleCloseBackProcess = () => {
        setBackItem(null);
        setBackProcessOpen(false);
    };


    // --- Modal itens ---
    const handleCloseItens = () => {
        setOpenItens(false);
        setSelectedItem(null);
    };

    // --- Modal retorno ---
    const handleCloseReturnModal = () => {
        setReturnData([]);
        setReturnComment("");
        setReturnModalOpen(false);
        setSelectedCodCompra(null);
    };


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

    function DrawerHistorico({ codCompra }) {
        const [historico, setHistorico] = useState([]);
        const [loading, setLoading] = useState(false);

        useEffect(() => {
            if (!codCompra) return;
            setLoading(true);
            axios.get(
                `${import.meta.env.VITE_API_URL}/historico/${codCompra}`,
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            )
                .then((res) => setHistorico(res.data || []))
                .catch(console.error)
                .finally(() => setLoading(false));
        }, [codCompra]);

        if (loading) return <Box display="flex" justifyContent="center" py={2}><CircularProgress size={18} /></Box>;
        if (!historico.length) return <Typography variant="body2" color="text.secondary">Nenhum histórico encontrado.</Typography>;

        const getDotColor = (evento) => {
            const t = [(evento.tipo || ""), (evento.etapa || ""), (evento.status || "")].join(" ").toLowerCase();
            if (t.includes("recus") || t.includes("reprov")) return "error.main";
            if (t.includes("aprov")) return "success.main";
            return "primary.main";
        };

        // Suporta tanto array simples quanto agrupado por cod_compra
        const eventos = historico[0]?.historico ? historico.flatMap((g) => g.historico) : historico;

        return (
            <Box>
                {eventos.map((evento, index) => {
                    const isLast = index === eventos.length - 1;
                    return (
                        <Box key={index} display="flex" gap={1.5}>
                            {/* Linha da timeline */}
                            <Box display="flex" flexDirection="column" alignItems="center">
                                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: getDotColor(evento), mt: "4px", flexShrink: 0 }} />
                                {!isLast && <Box sx={{ width: "1px", flex: 1, bgcolor: "divider", my: "4px", minHeight: 16 }} />}
                            </Box>

                            {/* Conteúdo */}
                            <Box pb={isLast ? 0 : 2} flex={1}>
                                <Typography variant="body2" fontWeight={500} lineHeight={1.3}>
                                    {evento.tipo}{evento.etapa ? ` — ${evento.etapa}` : ""}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {evento.data || evento.data_hora
                                        ? new Date(evento.data || evento.data_hora).toLocaleDateString("pt-BR")
                                        : ""}
                                    {evento.responsavel_nome ? ` · ${evento.responsavel_nome}` : ""}
                                </Typography>
                                {evento.detalhes && (
                                    <Box sx={{ mt: 0.75, p: 1, bgcolor: "grey.100", borderRadius: 1 }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                                            {evento.detalhes}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    );
                })}
            </Box>
        );
    }

    function getStatusInfo(item) {

        if (item.status == 0) {
            return { label: "Cancelado", color: "error", paradoEm: null };
        }
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
        if (item.aceite_diretor == 0) return { label: "Reprovado pela ", color: "error", paradoEm: "Diretoria" };

        // Se houver algum NULL → está aguardando
        if (item.aceite_gerente === null) return { label: "Aguardando ", color: "primary", paradoEm: "Gerente" };
        if (item.aceite_material === null) return { label: "Aguardando ", color: "primary", paradoEm: "Gestor Material" };
        if (item.aceite_compra === null) return { label: "Aguardando ", color: "primary", paradoEm: "Cotação" };
        if (item.aceite_diretor === null) return { label: "Aguardando ", color: "primary", paradoEm: "Diretoria" };

        // Caso qualquer outro status incomum
        return { label: "Aguardando", color: "primary", paradoEm: "Desconhecido" };
    }

    // --- Config tabelas ---
    const niveisUsuarios = [
        { nivel: 1, nome: "Solicitante" },
        { nivel: 2, nome: "Setor de Material" },
        { nivel: 3, nome: "Setor de Compra" },
        { nivel: 4, nome: "Gerente Adm" },
        { nivel: 5, nome: "Diretor Adm" },
        { nivel: 6, nome: "CFO" }
    ];

    const userLevel = parseInt(localStorage.getItem("nivel_acesso"));
    const opcoesParaUsuario = niveisUsuarios.filter((u) => u.nivel < userLevel);
    const canViewStatus = [1, 2, 3, 4, 5, 6, 7].includes(userLevel);


    const dataWithActions = getSolicitacao.map((item) => {
        const statusInfo = getStatusInfo(item);
        const statusText = `${statusInfo.label} ${statusInfo.paradoEm ? `- ${statusInfo.paradoEm}` : ""}`;

        return {
            ...item,
            "Ver Detalhes": (
                <Box onClick={stopPropagation} display="flex" height="100%" alignItems="center" gap={1}>
                    <Tooltip title="Visualizar">
                        <IconButton
                            size="small"
                            color="primary"
                            onClick={(e) => { stopPropagation(e); navigate(`../DetalhesCompra/${item["Cod. Compra"]}`); }}
                            sx={{
                                backgroundColor: "rgba(25, 118, 210, 0.1)",
                                "&:hover": { backgroundColor: "rgba(25, 118, 210, 0.2)" },
                                transition: "background-color 0.3s ease"
                            }}
                            aria-label="Visualizar"
                        >
                            <FiEye />
                        </IconButton>
                    </Tooltip>
                </Box>
            ),

            Responder: item.resposta_destino ? (
                <Box onClick={stopPropagation}>
                    <Tooltip title="Processo Respondido">
                        <IconButton
                            size="small"
                            sx={{ color: "success.main" }}
                            onClick={(e) => { stopPropagation(e); handleOpenReturnModal(item["Cod. Compra"]); }}
                        >
                            <FiCheck />
                        </IconButton>
                    </Tooltip>
                </Box>
            ) : item.status == null || item.status == 0 ? (
                <Box onClick={stopPropagation}>
                    <Tooltip title="Sem novas Perguntas">
                        <IconButton size="small" sx={{ color: "success.main" }} onClick={stopPropagation}>
                            <FiCheck />
                        </IconButton>
                    </Tooltip>
                </Box>
            ) : (
                <Box onClick={stopPropagation}>
                    <Tooltip title="Ver Justificativa de Retorno">
                        <IconButton
                            size="small"
                            sx={{ color: "warning.main" }}
                            onClick={(e) => { stopPropagation(e); handleOpenReturnModal(item["Cod. Compra"]); }}
                        >
                            <FiAlertTriangle />
                        </IconButton>
                    </Tooltip>
                </Box>
            ),

            'Status Material': statusText,

            Cancelar: item.aceite_compra == null && !statusText.includes('Reprovado') && item.status != 0 ? (
                <Box onClick={stopPropagation}>
                    <Tooltip title="Cancelar Solicitação">
                        <IconButton
                            size="small"
                            sx={{ color: "error.main" }}
                            onClick={(e) => { stopPropagation(e); setModalCancelar({ open: true, item }); }}
                        >
                            <FiTrash />
                        </IconButton>
                    </Tooltip>
                </Box>
            ) : (
                <Box onClick={stopPropagation}>
                    <Tooltip title="Não é possivel Cancelar essa solicitação">
                        <IconButton size="small" sx={{ color: "gray.main" }} onClick={stopPropagation}>
                            <FiTrash />
                        </IconButton>
                    </Tooltip>
                </Box>
            ),

            Status: canViewStatus ? (
                <Box onClick={stopPropagation} display="flex" flexDirection="column" height="100%" justifyContent="center" alignItems="start" gap={0.5}>
                    <Button variant="contained" color={statusInfo.color} size="small" onClick={stopPropagation}>
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

    return (
        <div>
            <Card>
                <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                        <Typography variant="h5">Minhas Solicitações</Typography>
                    </Box>

                    <DataGrid
                        data={dataWithActions || []}
                        loading={loadingSolicitacao}
                        error={error}
                        hiddenIndexes={[3, 4, 5, 6, 7, 8, 9, 10, 14]}
                        initialPageSize={10}
                        onRowClick={handleRowClick}
                    />
                </CardContent>
            </Card>

            <Backdrop open={loading} sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <CircularProgress color="inherit" />
            </Backdrop>

            <CustomSnackbar open={snackbarOpen} onClose={handleSnackbarClose} message={snackbarMessage} />

            {/* Modal Justificativa de Retorno */}
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

            <DrawerDetalhes
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                item={selectedItem}
                solicitacoes={getSolicitacao}
            />

            <Modal open={openJustificativa} onClose={handleCloseJustificativa}>
                <Box
                    sx={{
                        p: 4,
                        maxWidth: 700,
                        mx: "auto",
                        bgcolor: "background.paper",
                        borderRadius: 3,
                        boxShadow: 3
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
                                            bgcolor: "grey.50"
                                        }}
                                    >
                                        <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                                            {evento.tipo} - {evento.etapa}
                                        </Typography>
                                        <Typography variant="body2" mb={1}>
                                            <strong>Data:</strong> {evento.data}
                                        </Typography>
                                        <Typography variant="body2" mb={1}>
                                            <strong>Responsável:</strong>{" "}
                                            {evento.responsavel_nome} ({evento.responsavel_matricula})
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
                                <Button variant="contained" color="primary" onClick={handleCloseJustificativa}>
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
