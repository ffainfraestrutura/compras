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
    Grid,
    IconButton,
    Modal,
    Paper,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import CustomSnackbar from "../../../../components/SnackBar/SnackBar";
import { useNavigate, useParams } from "react-router-dom";
import DataGrid from "../../../../components/DataGrid/DataGrid";
import { FiEye } from "react-icons/fi";
import useDetalhesTodasSolicitacoes from "../../../../hooks/useDetalhesTodasSolicitacoes";

export default function Index() {
    const { cod_compra } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [quantidades, setQuantidades] = useState({});
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [openItens, setOpenItens] = useState(false);

    const [selectedItem, setSelectedItem] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalItem, setModalItem] = useState(null);
    const [justificativa, setJustificativa] = useState("");
    const [loadingItensAgrupados, setLoadingItensAgrupados] = useState(false);
    const [itensAgrupados, setItensAgrupados] = useState([]);

    const {
        dataDetails,
        loading: loadingSolicitacao,
        error,
        setDataDetails, // Assume que seu hook retorna também a função de set
    } = useDetalhesTodasSolicitacoes(cod_compra);

    // Inicializa quantidades
    useEffect(() => {
        if (dataDetails) {
            const initialQuantities = {};
            dataDetails.forEach((item) => {
                initialQuantities[item.id] = item.quantidade;
            });
            setQuantidades(initialQuantities);
        }
    }, [dataDetails]);

    const handleQuantidadeChange = (id, value) => {
        if (value === "") {
            setQuantidades((prev) => ({ ...prev, [id]: "" }));
            return;
        }
        const val = Math.max(Number(value), 1);
        setQuantidades((prev) => ({ ...prev, [id]: val }));
    };

    const handleOpenItens = async (item) => {
        setSelectedItem(item);
        setOpenItens(true);
        setLoadingItensAgrupados(true);

        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/itens_agrupados`,
                {
                    params: { cod_material: item.cod_material },
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
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

    const openModal = (item) => {
        setModalItem(item);
        setJustificativa("");
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        // Reset quantidade para valor original
        if (modalItem) {
            setQuantidades((prev) => ({ ...prev, [modalItem.id]: modalItem.quantidade }));
        }
        setModalItem(null);
        setJustificativa("");
    };

    const handleCloseItens = () => {
        setOpenItens(false);
        setSelectedItem(null);
    };

    const handleSubmit = async () => {
        if (!modalItem) return;

        try {
            setLoading(true);
            const payload = {
                id: modalItem.id,
                quantidade: quantidades[modalItem.id],
                justificativa_edicao: justificativa,
            };

            await axios.put(
                `${import.meta.env.VITE_API_URL}/aprovarcompra/detalhescompra`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            showSnackbar("Item atualizado com sucesso!");
            closeModal();

            // Atualiza os dados localmente sem recarregar a página
            if (setDataDetails && dataDetails) {
                setDataDetails(
                    dataDetails.map((item) =>
                        item.id === modalItem.id
                            ? { ...item, quantidade: quantidades[modalItem.id] }
                            : item
                    )
                );
            }

        } catch (error) {
            console.error(error);
            const errorMessage = error.response?.data?.message || "Erro ao atualizar item";
            showSnackbar(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const showSnackbar = (message) => {
        setSnackbarMessage(message);
        setSnackbarOpen(true);
    };

    const handleSnackbarClose = () => setSnackbarOpen(false);

    function getStatusInfo(item) {
        console.log(item)
        // Se o diretor já aprovou → aprovado
        if (item.finalizado == "1") {
            return { label: "Compra Realizada", color: "success", paradoEm: null };
        }
        if (item.aceite_diretor == "1") {
            return { label: "Aprovado", color: "success", paradoEm: null };
        }

        // Se houver algum NULL → está aguardando
        if (item.aceite_gerente === null) return { label: "Aguardando ", color: "primary", paradoEm: "Gerente" };
        if (item.aceite_material === null) return { label: "Aguardando Setor de ", color: "primary", paradoEm: "Material" };
        if (item.aceite_compra === null) return { label: "Material Sendo ", color: "primary", paradoEm: "Cotado" };
        if (item.aceite_diretor === null) return { label: "Aguardando ", color: "primary", paradoEm: "Aprovação" };

        if (item.aceite_gerente === 0) return { label: "Reprovado ", color: "error", paradoEm: "Gerente" };
        if (item.aceite_material === 0) return { label: "Reprovado", color: "error", paradoEm: "Material" };
        if (item.aceite_compra === 0) return { label: "Reprovado", color: "error", paradoEm: "Compras" };
        if (item.aceite_diretor == 0) return { label: "Reprovado", color: "error", paradoEm: "Diretor" };
        // Caso qualquer outro status incomum
        return { label: "Aguardando", color: "primary", paradoEm: "Desconhecido" };
    }



    const dataWithActions = (dataDetails || []).map((item) => {
        const statusInfo = getStatusInfo(item);

        return {
            ...item,
            Status: (
                <Box display="flex" flexDirection="column" height="100%" justifyContent="center" alignItems="start" gap={0.5}>
                    <Button variant="contained" color={statusInfo.color} size="small">
                        {statusInfo.label} {statusInfo.paradoEm}
                    </Button>
                </Box>
            ),
        };
    });


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
                        <Typography variant="h5" component="h2">
                            Detalhes da Compra
                        </Typography>
                        <Grid item>
                            <Button
                                variant="outlined"
                                color="gray"
                                onClick={() => navigate("../../")}
                            >
                                Voltar
                            </Button>
                        </Grid>
                    </Box>
                    <DataGrid
                        data={dataWithActions}
                        loading={loadingSolicitacao || loading}
                        error={error}
                        hiddenIndexes={[3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35]}
                        initialPageSize={10}
                    />
                </CardContent>
            </Card>

            {/* Modal de justificativa */}
            <Dialog open={modalOpen} onClose={closeModal} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                    Justificativa de Alteração
                </DialogTitle>
                <DialogContent>
                    {modalItem && (
                        <Box display="flex" flexDirection="column" gap={3} mt={1}>
                            <Box display="flex" justifyContent="space-between">
                                <Paper
                                    elevation={2}
                                    sx={{ p: 1, flex: 1, textAlign: 'center', bgcolor: '#f5f5f5' }}
                                >
                                    <Typography variant="subtitle1" color="textSecondary">
                                        Quantidade antiga
                                    </Typography>
                                    <Typography variant="h6" fontWeight="bold">
                                        {modalItem.quantidade}
                                    </Typography>
                                </Paper>
                                <Paper
                                    elevation={2}
                                    sx={{ p: 1, flex: 1, ml: 2, textAlign: 'center', bgcolor: '#e3f2fd' }}
                                >
                                    <Typography variant="subtitle1" color="textSecondary">
                                        Quantidade nova
                                    </Typography>
                                    <Typography variant="h6" fontWeight="bold" color="primary">
                                        {quantidades[modalItem.id] || modalItem.quantidade}
                                    </Typography>
                                </Paper>
                            </Box>
                            <TextField
                                label="Justificativa"
                                value={justificativa}
                                onChange={(e) => setJustificativa(e.target.value)}
                                multiline
                                rows={4}
                                fullWidth
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                placeholder="Digite a justificativa da alteração..."
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={closeModal} variant="outlined">
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        color="primary"
                        sx={{ minWidth: 120 }}
                        disabled={!justificativa.trim() || loading}
                    >
                        Confirmar
                    </Button>
                </DialogActions>
            </Dialog>

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

            {/* Modal de Itens */}
            <Modal open={openItens} onClose={handleCloseItens}>
                <Box sx={{
                    p: 4,
                    maxWidth: 600,
                    mx: "auto",
                    bgcolor: "background.paper",
                    borderRadius: 3,
                    boxShadow: 3,
                    maxHeight: 600,
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {selectedItem && (
                        <>
                            <Box>
                                <Typography variant="h6" mb={2} textAlign="center">
                                    Itens Agrupados - {selectedItem.cod_material}
                                </Typography>
                                <Typography variant="subtitle1" mb={2} textAlign="center">
                                    Total de Itens - {itensAgrupados.length > 0 ? itensAgrupados[0].total_quantidade : 0}
                                </Typography>
                            </Box>
                            <Box sx={{ overflowY: 'auto', flexGrow: 1, my: 2 }}>
                                {loadingItensAgrupados ? (
                                    <Box display="flex" justifyContent="center" my={2}>
                                        <CircularProgress size={24} />
                                    </Box>
                                ) : itensAgrupados.length === 0 ? (
                                    <Typography textAlign="center" color="text.secondary">
                                        Nenhum item encontrado.
                                    </Typography>
                                ) : (
                                    itensAgrupados.map((i, idx) => (
                                        <Paper key={idx} sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
                                            <Typography><strong>Cod. Compra:</strong> {i.cod_compra}</Typography>
                                            <Typography><strong>Quantidade:</strong> {i.quantidade}</Typography>
                                        </Paper>
                                    ))
                                )}
                            </Box>
                            <Box display="flex" justifyContent="center" mt={1}>
                                <Button variant="contained" color="primary" onClick={handleCloseItens}>
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
