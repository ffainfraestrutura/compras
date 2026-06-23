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
import useDetalhesSolicitacao from "../../../../hooks/useDetalhesSolicitacao";
import { FiCheck, FiEye } from "react-icons/fi";

export default function Index() {
    const { cod_compra } = useParams();
    const [loading, setLoading] = useState(false);
    const [quantidades, setQuantidades] = useState({});
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [openItens, setOpenItens] = useState(false);


    const [selectedItem, setSelectedItem] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalItem, setModalItem] = useState(null);
    const [justificativa, setJustificativa] = useState("");
    // Adicione estado para armazenar os itens agrupados do modal
    const [itensAgrupados, setItensAgrupados] = useState([]);
    const [loadingItensAgrupados, setLoadingItensAgrupados] = useState(false);

    const navigate = useNavigate();

    // Função para abrir o modal e buscar os itens agrupados
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


    const {
        dataDetails,
        loading: loadingSolicitacao,
        error,
    } = useDetalhesSolicitacao(cod_compra);

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


    const openModal = (item) => {
        setModalItem(item);
        setJustificativa("");
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setModalItem(null);
        setJustificativa("");
    };

    const handleCloseItens = () => {
        setOpenItens(false);
        setSelectedItem(null);
    };

    const handleSubmit = async () => {
        // Validação básica para garantir que temos um item
        if (!modalItem) return;

        try {
            setLoading(true);
            const payload = {
                id: modalItem.id,
                quantidade: quantidades[modalItem.id], // A nova quantidade do estado
                justificativa_edicao: justificativa,
            };

            await axios.put(
                // Removi a barra final, é uma boa prática
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

            // ✨ PASSO MAIS IMPORTANTE: Recarrega os dados da grid! ✨
            await window.location.reload();

        } catch (error) {
            console.error(error);
            // Mensagem de erro mais específica, se possível
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

    const handleSnackbarClose = () => {
        setSnackbarOpen(false);
    };

    const dataWithActions = dataDetails.map((item) => ({
        ...item,
        Quantidade: (
            <Box display="flex" height="100%" alignItems="center" gap={1}>
                <Tooltip
                    title={
                        (quantidades[item.id] ?? item.quantidade) > item.quantidade
                            ? "Não pode ser maior que a quantidade original"
                            : ""
                    }
                    placement="top"
                >
                    <TextField
                        label="Quantidade"
                        type="number"
                        variant="standard"
                        fullWidth
                        value={quantidades[item.id] ?? item.quantidade}
                        onChange={(e) => {
                            let value = Number(e.target.value);
                            handleQuantidadeChange(item.id, value);
                            if (value > item.quantidade) {
                                value = item.quantidade;
                                handleQuantidadeChange(item.id, value);
                            }
                        }}
                        inputProps={{ min: 1, max: item.quantidade }}
                        error={(quantidades[item.id] ?? item.quantidade) > item.quantidade}
                    />
                </Tooltip>
            </Box>
        ),
        Editar: (
            <Box display="flex" height={"100%"} alignItems="center" gap={1}>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => openModal(item)}
                >
                    <FiCheck />
                </Button>
            </Box>
        ),
        ...(localStorage.getItem('nivel_acesso') != 7 && {
            "Itens Agrupados": (
                <Box display="flex" height="100%" alignItems="center" gap={1}>
                    <Tooltip title="Visualizar">
                        <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenItens(item)}
                            sx={{
                                backgroundColor: "rgba(25, 118, 210, 0.1)",
                                "&:hover": { backgroundColor: "rgba(25, 118, 210, 0.2)" },
                                transition: "background-color 0.3s ease",
                            }}
                        >
                            <FiEye />
                        </IconButton>
                    </Tooltip>
                </Box>
            ),
        }),

    }));

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
                        data={dataWithActions || []}
                        loading={loadingSolicitacao || loading}
                        error={error}
                        initialPageSize={10}
                        hiddenIndexes={[1, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36]}
                    />
                </CardContent>
            </Card>

            {/* Modal de justificativa */}
            <Dialog
                open={modalOpen}
                onClose={closeModal}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                    Justificativa de Alteração
                </DialogTitle>
                <DialogContent>
                    {modalItem && (
                        <Box
                            display="flex"
                            flexDirection="column"
                            gap={3}
                            mt={1}
                        >
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
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2
                                    }
                                }}
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
                            {/* CABEÇALHO (não rola) */}
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
                                    <>
                                        {itensAgrupados.map((i, idx) => (
                                            <Paper key={idx} sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
                                                <Typography><strong>Cod. Compra:</strong> {i.cod_compra}</Typography>
                                                <Typography><strong>Quantidade:</strong> {i.quantidade}</Typography>
                                            </Paper>
                                        ))}
                                    </>
                                )}
                            </Box>

                            {/* RODAPÉ (não rola) */}
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
