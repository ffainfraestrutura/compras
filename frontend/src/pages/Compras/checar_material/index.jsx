import axios from "axios";
import { Fragment, useEffect, useState } from "react";
import {
    Backdrop,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    TextField,
    Tooltip,
    Typography,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Alert,
    AlertTitle,
    IconButton
} from "@mui/material";
import { FiCheck, FiEye, FiInfo } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import CustomSnackbar from "../../../components/SnackBar/SnackBar";
import CustomDataGrid from "../../../components/Table/TableData";

export default function Index() {
    const navigate = useNavigate();
    
    // Recuperar dados do usuário do localStorage
    const userMatricula = localStorage.getItem("matricula") || 
                         localStorage.getItem("id") || 
                         localStorage.getItem("cod_usuario") || 
                         "USUARIO_SEM_MATRICULA";
                         
    const userName = localStorage.getItem("name") || 
                    localStorage.getItem("user_name") || 
                    localStorage.getItem("nome") || 
                    "USUARIO_SEM_NOME";

    const [loading, setLoading] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [solicitacoes, setSolicitacoes] = useState([]);
    const [loadingSolicitacao, setLoadingSolicitacao] = useState(false);
    const [error, setError] = useState(null);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [selectedCompra, setSelectedCompra] = useState(null);
    const [observacao, setObservacao] = useState("");

    const columns = [
        { field: 'Solicitação', headerName: 'Data da Solicitação', width: 150 },
        { field: 'cod_compra', headerName: 'Cód. Compra', width: 150 },
        { field: 'solicitante', headerName: 'Solicitante', width: 400 },
        { field: 'Ver Detalhes', headerName: 'Ver Detalhes', width: 150, sortable: false },
        { field: 'Modificar Compra', headerName: 'Modificar Compra', width: 150, sortable: false },
        { field: 'Marcar como checado', headerName: 'Marcar como checado', width: 180, sortable: false }
    ];

    const showSnackbar = (message) => {
        setSnackbarMessage(message);
        setSnackbarOpen(true);
    };

    const handleSnackbarClose = () => setSnackbarOpen(false);

    const handleMarcarChecado = (cod_compra) => {
        setSelectedCompra(cod_compra);
        setObservacao("");
        setConfirmDialogOpen(true);
    };

    const handleConfirmChecado = async () => {
        if (!selectedCompra) return;

        // Verificar se tem justificativa
        if (!observacao.trim()) {
            showSnackbar("Por favor, preencha uma justificativa");
            return;
        }

        setLoading(true);
        try {
            // Preparar dados para enviar
            const payload = { 
                cod_compra: selectedCompra,
                justificativa_checado: observacao.trim()
            };


            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/checar-material-marcar`,
                payload,
                {
                    headers: { 
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            showSnackbar(response.data.message || "Compra marcada como checada com sucesso!");
            
            // Recarregar os dados
            await fetchData();
            
            setConfirmDialogOpen(false);
            setSelectedCompra(null);
            setObservacao("");
            
        } catch (error) {
            console.error("Erro completo:", error);
            console.error("Resposta do erro:", error.response?.data);
            
            const errorMessage = error.response?.data?.message || 
                               error.response?.data?.error || 
                               "Erro ao marcar como checado";
            showSnackbar(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const fetchData = async () => {
        setLoadingSolicitacao(true);
        setError(null);
        try {
            const endpoint = `${import.meta.env.VITE_API_URL}/checar-material`;
            const response = await axios.get(endpoint, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            setSolicitacoes(response.data);
            console.log("Dados das solicitações:", response.data);
        } catch (err) {
            console.error(err);
            setError("Erro ao buscar dados");
        } finally {
            setLoadingSolicitacao(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const dataWithActions = solicitacoes.map((item) => {
        const isChecado = item.checado === 1;
        
        return {
            ...item,
            'Ver Detalhes': (
                <Tooltip title="Visualizar">
                    <IconButton 
                        size="small" 
                        color="primary" 
                        onClick={() => navigate(`../DetalhesCompra/${item.cod_compra}`)}
                    >
                        <FiEye />
                    </IconButton>
                </Tooltip>
            ),
            'Modificar Compra': (
                <Tooltip title="Modificar">
                    <IconButton 
                        size="small" 
                        color="primary" 
                        onClick={() => navigate(`../ver-itens/${item.cod_compra}`)}
                    >
                        <FiEye />
                    </IconButton>
                </Tooltip>
            ),
            'Marcar como checado': (
                <Box>
                    <Button
                        variant="contained"
                        color={isChecado ? "success" : "primary"}
                        fullWidth
                        onClick={() => !isChecado && handleMarcarChecado(item.cod_compra)}
                        disabled={isChecado}
                        startIcon={<FiCheck />}
                    >
                        {isChecado ? "Checado" : "Marcar"}
                    </Button>
                </Box>
            ),
        };
    });

    return (
        <div>
            <Card>
                <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h5">Conferir Pedidos</Typography>
                    </Box>

                    <CustomDataGrid
                        columns={columns}
                        data={dataWithActions || []}
                        loading={loadingSolicitacao}
                        error={error}
                    />
                </CardContent>
            </Card>

            <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Confirmar Marcação</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <Alert severity="info" sx={{ mb: 2 }}>
                            <AlertTitle>Informações da Checagem</AlertTitle>
                            <Typography variant="body2">
                                <strong>Compra:</strong> {selectedCompra}<br />
                                <strong>Responsável:</strong> {userName}<br />
                                <strong>Matrícula:</strong> {userMatricula}<br />
                                <strong>Data/Hora:</strong> {new Date().toLocaleString('pt-BR')}
                            </Typography>
                        </Alert>
                        
                        <TextField
                            autoFocus
                            margin="dense"
                            label="Justificativa / Observação *"
                            type="text"
                            fullWidth
                            variant="outlined"
                            multiline
                            rows={4}
                            value={observacao}
                            onChange={(e) => setObservacao(e.target.value)}
                            placeholder="Digite aqui a justificativa ou observação sobre esta conferência..."
                            required
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDialogOpen(false)} variant="outlined">
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleConfirmChecado} 
                        variant="contained" 
                        color="primary"
                        disabled={!observacao.trim()}
                    >
                        Confirmar
                    </Button>
                </DialogActions>
            </Dialog>

            <Backdrop open={loading} sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <CircularProgress color="inherit" />
            </Backdrop>

            <CustomSnackbar open={snackbarOpen} onClose={handleSnackbarClose} message={snackbarMessage} />
        </div>
    );
}