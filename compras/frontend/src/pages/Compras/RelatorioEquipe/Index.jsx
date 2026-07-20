import axios from "axios";
import { useEffect, useState } from "react";
import {
    Backdrop,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    IconButton,
    MenuItem,
    Paper,
    Select,
    TextField,
    Tooltip,
    Typography
} from "@mui/material";
import { FiAlertTriangle, FiArrowDownLeft, FiArrowLeft, FiCheck, FiEye, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import CustomSnackbar from "../../../components/SnackBar/SnackBar";
import DataGrid from "../../../components/DataGrid/DataGrid";
import Modal from "../../../components/Modal/Modal";
import useSolicitacoesEquipe from "../../../hooks/useSolicitacoesEquipe";

export default function Index() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    // Modal de justificativa visualização
    const [openJustificativa, setOpenJustificativa] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    // Modal de aprovação/reprovação
    const [approvalModalOpen, setApprovalModalOpen] = useState(false);
    const [approvalItem, setApprovalItem] = useState(null);
    const [approvalStatus, setApprovalStatus] = useState(null); // 1 = aprovar, 0 = reprovar
    const [approvalJustificativa, setApprovalJustificativa] = useState('');
    const [statusOptions, setStatusOptions] = useState([]);

    // Modal de Voltar o processo
    const [backProcessOpen, setBackProcessOpen] = useState(false);
    const [backItem, setBackItem] = useState(false);


    const { getSolicitacao, loading: loadingSolicitacao, error } = useSolicitacoesEquipe();

    // Snackbar
    const showSnackbar = (message) => {
        setSnackbarMessage(message);
        setSnackbarOpen(true);
    };
    const handleSnackbarClose = () => setSnackbarOpen(false);

    // --- Funções modal justificativa ---
    const handleOpenJustificativa = async (item) => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/historico/${item["Cod. Compra"]}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setSelectedItem(response.data);
            setOpenJustificativa(true);
        } catch (error) {
        }
    };
    const handleCloseJustificativa = () => {
        setOpenJustificativa(false);
        setSelectedItem(null);
    };

    // --- Funções modal justificativa ---
    const handleOpenBackProcess = (item) => {
        setBackItem(item);
        setOpenJustificativa(true);
    };
    const handleCloaseBackProcess = () => {
        setOpenJustificativa(false);
        setBackItem(null);
    };

    // --- Funções modal aprovação/reprovação ---
    const handleOpenApprovalModal = (item, status) => {
        setApprovalItem(item);
        setApprovalStatus(status);
        setApprovalJustificativa('');
        setApprovalModalOpen(true);
    };
    const handleCloseApprovalModal = () => {
        setApprovalModalOpen(false);
        setApprovalItem(null);
        setApprovalStatus(null);
        setApprovalJustificativa('');
    };

    const userLevel = parseInt(localStorage.getItem('nivel_acesso'));

    // Garante que a coluna Status só apareça para níveis 2 ou 3
    const canViewStatus = [2, 3].includes(userLevel);

    // Prepara os dados da tabela
    const dataWithActions = getSolicitacao.map((item) => ({
        ...item,
        'Histórico': (
            <Tooltip title="Visualizar">
                <IconButton size="small" color="primary" onClick={() => handleOpenJustificativa(item)}>
                    <FiEye />
                </IconButton>
            </Tooltip>
        ),
        ...item,
        'Ver Itens': (
            <Box display="flex" height="100%" alignItems="center" gap={1}>
                <Tooltip title="Visualizar">
                    <IconButton
                        size="small"
                        color="primary"
                        onClick={() => navigate(`../DetalhesCompra/${item['Cod. Compra']}`)}
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
    }));

    return (
        <div>
            <Card>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5">Relatório por Equipe</Typography>
                    </Box>

                    <DataGrid
                        data={dataWithActions || []}
                        loading={loadingSolicitacao}
                        error={error}
                        hiddenIndexes={[3, 5, 6, 7, 8, 9, 10, 11, 12]}
                        initialPageSize={10}
                    />
                </CardContent>
            </Card>

            <Backdrop open={loading} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <CircularProgress color="inherit" />
            </Backdrop>

            <CustomSnackbar
                open={snackbarOpen}
                onClose={handleSnackbarClose}
                message={snackbarMessage}
            />

            {/* Modal de Justificativa */}
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
