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
    Grid,
    LinearProgress,
    Alert
} from "@mui/material";
import { FiAlertTriangle, FiArrowLeft, FiCheck, FiEye, FiSend, FiX, FiUpload, FiDownload, FiTrash2, FiInfo } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import CustomSnackbar from "../../../components/SnackBar/SnackBar";
import DataGrid from "../../../components/DataGrid/DataGrid";
import Modal from "../../../components/Modal/Modal";
import DrawerDetalhes from "../../../components/Drawer/DrawerDetalhes";

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
    // Estados para Upload de Documentos
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [uploadItem, setUploadItem] = useState(null);
    const [arquivo1, setArquivo1] = useState(null);
    const [arquivo2, setArquivo2] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [documentosExistentes, setDocumentosExistentes] = useState([]);
    const [loadingDocumentos, setLoadingDocumentos] = useState(false);

    // ======================================
    // Modal Justificativa
    const [openJustificativa, setOpenJustificativa] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [itensAgrupados, setItensAgrupados] = useState([]);
    const [loadingItensAgrupados, setLoadingItensAgrupados] = useState(false);
    const [openItens, setOpenItens] = useState(false);

    // Modal Envio para Gestor
    const [gestorModalOpen, setGestorModalOpen] = useState(false);
    const [gestorItem, setGestorItem] = useState(null);
    const [dataPrevista, setDataPrevista] = useState(null);

    // Modal Envio para Financeiro
    const [financeiroModalOpen, setFinanceiroModalOpen] = useState(false);
    const [financeiroItem, setFinanceiroItem] = useState(null);

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

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [itemDetalhes, setItemDetalhes] = useState(null);

    const fetchSolicitacoes = async () => {
        setLoadingSolicitacao(true);
        setError(null);
        try {
            const endpoint =
                groupBy === "cod_compra"
                    ? `${import.meta.env.VITE_API_URL}/finalizadas`
                    : `${import.meta.env.VITE_API_URL}/aprovarcompra/agrupado_material`;

            const response = await axios.get(endpoint, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
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

    const stopPropagation = (e) => e.stopPropagation();

    // ======================================
    // Funções para Upload de Documentos (COM BOTÕES DESABILITADOS)
    const handleOpenUploadModal = async (item) => {
        setUploadItem(item);
        setArquivo1(null);
        setArquivo2(null);
        setUploadProgress(0);

        // Buscar documentos já existentes
        await listarDocumentos(item["cod_compra"]);
        setUploadModalOpen(true);
    };

    const handleCloseUploadModal = () => {
        setUploadModalOpen(false);
        setUploadItem(null);
        setArquivo1(null);
        setArquivo2(null);
        setDocumentosExistentes([]);
    };

    const listarDocumentos = async (codCompra) => {
        try {
            setLoadingDocumentos(true);
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/documentos/listar/${codCompra}`,
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );

            if (response.data.success) {
                setDocumentosExistentes(response.data.data);
            }
        } catch (error) {
            console.error("Erro ao listar documentos:", error);
            showSnackbar("Erro ao carregar documentos");
        } finally {
            setLoadingDocumentos(false);
        }
    };

    const handleFileChange = (event, fileNumber) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validar tamanho (máximo 10MB)
        if (file.size > 10 * 1024 * 1024) {
            showSnackbar("Arquivo muito grande. Tamanho máximo: 10MB");
            return;
        }

        // Validar tipo
        const tiposPermitidos = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png'];
        const extensao = file.name.split('.').pop().toLowerCase();

        if (!tiposPermitidos.includes(extensao)) {
            showSnackbar("Tipo de arquivo não permitido. Use: PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, PNG");
            return;
        }

        // Verificar se já existe documento na posição
        const documentoExistente = documentosExistentes.find(doc => doc.ordem === fileNumber);

        if (documentoExistente) {
            // Se existir, não permite selecionar
            showSnackbar(`Já existe um documento na posição ${fileNumber}. Exclua o existente primeiro se desejar substituí-lo.`);
            return;
        }

        // Se não existir, adicionar normalmente
        if (fileNumber === 1) {
            setArquivo1(file);
        } else {
            setArquivo2(file);
        }
    };

    const handleRowClick = (row) => {
        setSelectedItem(row);
        setDrawerOpen(true);
    };

    const handleUpload = async () => {
        if (!arquivo1 && !arquivo2) {
            showSnackbar("Selecione pelo menos um arquivo para enviar");
            return;
        }

        const formData = new FormData();
        formData.append('cod_compra', uploadItem["cod_compra"]);

        if (arquivo1) {
            formData.append('arquivo_1', arquivo1);
        }
        if (arquivo2) {
            formData.append('arquivo_2', arquivo2);
        }

        try {
            setLoading(true);
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/upload/documentos`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                        'Content-Type': 'multipart/form-data'
                    },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(percentCompleted);
                    }
                }
            );

            if (response.data.success) {
                showSnackbar("Documentos enviados com sucesso!");
                await listarDocumentos(uploadItem["cod_compra"]); // Recarregar lista
                setArquivo1(null);
                setArquivo2(null);
                setUploadProgress(0);
            }
        } catch (error) {
            console.error("Erro no upload:", error);
            showSnackbar("Erro ao enviar documentos: " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (documento) => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/documentos/download/${documento.id}`,
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                    responseType: 'blob'
                }
            );

            // Criar link para download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', documento.nome_original);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Erro ao baixar:", error);
            showSnackbar("Erro ao baixar documento");
        }
    };

    const handleExcluirDocumento = async (id) => {
        if (!window.confirm("Tem certeza que deseja excluir este documento?")) {
            return;
        }

        try {
            setLoading(true);
            await axios.delete(
                `${import.meta.env.VITE_API_URL}/documentos/${id}`,
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );

            showSnackbar("Documento excluído com sucesso!");
            await listarDocumentos(uploadItem["cod_compra"]);
        } catch (error) {
            console.error("Erro ao excluir:", error);
            showSnackbar("Erro ao excluir documento");
        } finally {
            setLoading(false);
        }
    };

    // Funções auxiliares para verificar se pode fazer upload
    const podeUploadPosicao1 = () => {
        return !documentosExistentes.some(doc => doc.ordem === 1);
    };

    const podeUploadPosicao2 = () => {
        return !documentosExistentes.some(doc => doc.ordem === 2);
    };

    const totalDocumentos = () => {
        return documentosExistentes.length;
    };

    // ======================================
    // Funções para Envio ao Gestor
    const handleOpenGestorModal = (item) => {
        setGestorItem(item);
        setGestorModalOpen(true);
    };

    const handleCloseGestorModal = () => {
        setGestorItem(null);
        setGestorModalOpen(false);
    };

    const handleSubmitGestor = async () => {
        try {
            setLoading(true);

            // Verificar se existem documentos anexados
            // if (documentosExistentes.length === 0) {
            //     showSnackbar("É necessário anexar pelo menos um documento antes de enviar para o Financeiro");
            //     setLoading(false);
            //     return;
            // }

            const payload = {
                finalizado: 1,
                cod_compra: gestorItem["cod_compra"],
                justificativa_cfo: dataPrevista,
                matricula_finalizado: localStorage.getItem("matricula")
            };

            const response = await axios.post(`${import.meta.env.VITE_API_URL}/enviar/material`, payload, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });

            showSnackbar("Material marcado como comprado!");
            setDataPrevista(null)
            handleCloseGestorModal();
            fetchSolicitacoes();
        } catch (error) {
            console.error("Erro ao enviar para financeiro:", error);
            showSnackbar("Erro ao enviar: " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    // ======================================
    // Funções para Envio ao Financeiro
    const handleOpenFinanceiroModal = async (item) => {
        setFinanceiroItem(item);

        // Buscar documentos para verificar se existem
        await listarDocumentos(item["cod_compra"]);

        setFinanceiroModalOpen(true);
    };

    const handleCloseFinanceiroModal = () => {
        setFinanceiroItem(null);
        setFinanceiroModalOpen(false);
    };

    const handleSubmitFinanceiro = async () => {
        try {
            setLoading(true);

            // Verificar se existem documentos anexados
            if (documentosExistentes.length === 0) {
                showSnackbar("É necessário anexar pelo menos um documento antes de enviar para o Financeiro");
                setLoading(false);
                return;
            }

            const payload = {
                cod_compra: financeiroItem["cod_compra"],
                cod_cotacao: financeiroItem["Código"],
                matricula: localStorage.getItem("matricula")
            };

            const response = await axios.post(`${import.meta.env.VITE_API_URL}/enviar/financeiro`, payload, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });

            showSnackbar("Solicitação enviada para o Financeiro com sucesso!");
            handleCloseFinanceiroModal();
            fetchSolicitacoes();
        } catch (error) {
            console.error("Erro ao enviar para financeiro:", error);
            showSnackbar("Erro ao enviar para o Financeiro: " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    // ======================================
    // Funções Modais (mantidas do código original)
    const handleOpenJustificativa = async (item) => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/historico/${item["cod_compra"]}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setSelectedItem(response.data);
            setOpenJustificativa(true);
        } catch (error) {
            console.error("Erro ao buscar histórico:", error);
        }
    };

    const handleCloseJustificativa = () => setOpenJustificativa(false);

    const handleOpenBackProcess = async (item) => {
        try {
            setLoading(true);
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/retornos/${item["cod_compra"]}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
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
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/retornos/${codCompra}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
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
            await axios.put(`${import.meta.env.VITE_API_URL}/finalizarretorno`, payload, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            showSnackbar("Resposta registrada com sucesso!");
            handleCloseReturnModal();
            window.location.reload()
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
                `${import.meta.env.VITE_API_URL}/itens_agrupados_adm`,
                {
                    params: { cod_material: item['Código'] },
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
                cod_compra: backItem["cod_compra"],
                setor_destino: selectedBackLevel,
                justificativa: justificativaVolta
            };

            await axios.put(`${import.meta.env.VITE_API_URL}/retornarprocesso`, payload, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });

            showSnackbar("Solicitação retornada com sucesso!");
            handleCloseBackProcess();
            window.location.reload();

        } catch (error) {
            console.error(error.response?.data || error.message);
            showSnackbar("Erro ao retornar solicitação!");
        } finally {
            setLoading(false);
        }
    }

    const niveisUsuarios = [
        { nivel: 1, nome: "Solicitante" },
        { nivel: 2, nome: "Setor de Material" },
        { nivel: 3, nome: "Setor de Compra" },
        { nivel: 4, nome: "Gestor de Material" },
        { nivel: 5, nome: "Financeiro" },
    ];

    const userLevel = localStorage.getItem("nivel_acesso")
    const opcoesParaUsuario = niveisUsuarios.filter((u) => u.nivel < userLevel);

    // ======================================
    // Colunas e Título Dinâmico
    const tituloTabela = "Cotações Aprovadas";
    let hiddenIndexes = groupBy === 'cod_material' ? [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];


    const dataWithActions = solicitacoes.map((item) => ({
        ...item,
        "Ver Detalhes": (
            <Box onClick={stopPropagation} display="flex" height="100%" alignItems="center" gap={1}>
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
        // Botão para Upload de Documentos
        "Documentos": (
            <Box onClick={stopPropagation}>
                <Tooltip title="Gerenciar Documentos (máx. 2)">
                    <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenUploadModal(item)}
                    >
                        <FiUpload />
                    </IconButton>
                </Tooltip>
            </Box>
        ),
        // Botão Enviar para Gestor de Material
        "Marcar como comprado":
            <Box onClick={stopPropagation}>
                <Button 
                    onClick={() => handleOpenGestorModal(item)}
                    variant="contained"
                    color="primary"
                    size="small"
                    fullWidth
                    sx={{ fontSize: '0.75rem' }}
                >
                    <FiSend style={{ marginRight: 4 }} />
                </Button>
            </Box>

        // Botão Enviar para Financeiro
        // "Enviar Financeiro":
        //     <Button
        //         onClick={() => handleOpenFinanceiroModal(item)}
        //         variant="contained"
        //         color="success"
        //         size="small"
        //         fullWidth
        //         sx={{ fontSize: '0.75rem' }}
        //     >
        //         <FiSend style={{ marginRight: 4 }} /> Financeiro
        //     </Button>
    }));

    return (
        <div>
            <Card>
                <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h5">{tituloTabela}</Typography>
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

            <Backdrop open={loading} sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <CircularProgress color="inherit" />
            </Backdrop>

            <CustomSnackbar open={snackbarOpen} onClose={handleSnackbarClose} message={snackbarMessage} />

            {/* ================== MODAIS ================== */}

            {/* MODAL DE UPLOAD DE DOCUMENTOS COM BOTÕES DESABILITADOS */}
            <Modal open={uploadModalOpen} title="Gerenciar Documentos" onClose={handleCloseUploadModal}>
                <Box sx={{ p: 2, minWidth: 500, maxWidth: 600 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        <strong>Compra:</strong> {uploadItem?.['Cod. Compra'] || uploadItem?.['cod_compra']}
                    </Typography>

                    {/* <Alert severity="info" sx={{ mb: 2 }}>
                        <strong>Limite: 2 documentos no total.</strong> Cada posição (Documento 1 e Documento 2) pode ter apenas um arquivo. 
                        Para substituir um documento, exclua o existente primeiro.
                    </Alert> */}

                    {/* Documentos já existentes */}
                    {loadingDocumentos ? (
                        <Box display="flex" justifyContent="center" my={2}>
                            <CircularProgress size={24} />
                        </Box>
                    ) : documentosExistentes.length > 0 ? (
                        <Box sx={{ mt: 2, mb: 3 }}>
                            <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                                Documentos Atuais:
                            </Typography>
                            {documentosExistentes.map((doc) => (
                                <Paper key={doc.id} sx={{ p: 1, mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '4px solid', borderColor: doc.ordem === 1 ? 'primary.main' : 'secondary.main' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                                        <Typography variant="caption" sx={{ minWidth: 60, fontWeight: 'bold' }}>
                                            {doc.ordem === 1 ? '📄 Doc 1' : '📄 Doc 2'}
                                        </Typography>
                                        <Typography variant="body2" noWrap sx={{ maxWidth: 180 }}>
                                            {doc.nome_original}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            ({(doc.tamanho / 1024).toFixed(2)} KB)
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Tooltip title="Download">
                                            <IconButton size="small" onClick={() => handleDownload(doc)}>
                                                <FiDownload />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Excluir">
                                            <IconButton size="small" color="error" onClick={() => handleExcluirDocumento(doc.id)}>
                                                <FiTrash2 />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </Paper>
                            ))}
                        </Box>
                    ) : (
                        <Paper sx={{ p: 2, mt: 2, mb: 2 }}>
                            <Typography variant="body2">
                                ℹ️ Nenhum documento anexado ainda. Você pode anexar até 2 documentos.
                            </Typography>
                        </Paper>
                    )}

                    {/* Upload de novos arquivos */}
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                        Selecionar novos documentos:
                    </Typography>

                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} md={6}>
                            <Button
                                variant="outlined"
                                component="label"
                                fullWidth
                                startIcon={<FiUpload />}
                                sx={{ height: 56 }}
                                disabled={!podeUploadPosicao1()}
                            >
                                Documento 1
                                <input
                                    type="file"
                                    hidden
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                                    onChange={(e) => handleFileChange(e, 1)}
                                />
                            </Button>
                            {!podeUploadPosicao1() && (
                                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                    Posição ocupada - exclua para substituir
                                </Typography>
                            )}
                            {arquivo1 && (
                                <Typography variant="caption" display="block" sx={{ mt: 1 }} noWrap>
                                    Selecionado: {arquivo1.name}
                                </Typography>
                            )}
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Button
                                variant="outlined"
                                component="label"
                                fullWidth
                                startIcon={<FiUpload />}
                                sx={{ height: 56 }}
                                disabled={!podeUploadPosicao2()}
                            >
                                Documento 2
                                <input
                                    type="file"
                                    hidden
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                                    onChange={(e) => handleFileChange(e, 2)}
                                />
                            </Button>
                            {!podeUploadPosicao2() && (
                                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                    Posição ocupada - exclua para substituir
                                </Typography>
                            )}
                            {arquivo2 && (
                                <Typography variant="caption" display="block" sx={{ mt: 1 }} noWrap>
                                    Selecionado: {arquivo2.name}
                                </Typography>
                            )}
                        </Grid>
                    </Grid>

                    {uploadProgress > 0 && uploadProgress < 100 && (
                        <Box sx={{ mt: 2 }}>
                            <LinearProgress variant="determinate" value={uploadProgress} />
                            <Typography variant="caption" align="center" display="block">
                                {uploadProgress}% concluído
                            </Typography>
                        </Box>
                    )}

                    <Box display="flex" justifyContent="flex-end" gap={2} sx={{ mt: 3 }}>
                        <Button variant="outlined" onClick={handleCloseUploadModal}>
                            Fechar
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleUpload}
                            disabled={(!arquivo1 && !arquivo2) || loading}
                        >
                            {loading ? <CircularProgress size={24} /> : "Enviar Documentos"}
                        </Button>
                    </Box>
                </Box>
            </Modal>

            {/* MODAL ENVIAR PARA GESTOR DE MATERIAL */}
            <Modal open={gestorModalOpen} title="Enviar para Gestor de Material" onClose={handleCloseGestorModal}>
                <Box sx={{ p: 2, minWidth: 400 }}>
                    <Typography gutterBottom>
                        Você está prestes a marcar a compra: <strong>{gestorItem?.['Cod. Compra'] || gestorItem?.['cod_compra']}</strong> como comprada.
                    </Typography>

                    <Typography gutterBottom sx={{ mt: 2, color: 'text.secondary' }}>
                        Informe a data prevista para chegada do material
                    </Typography>

                    {/* Campo de Data */}
                    <TextField
                        type="date"
                        label="Data Prevista"
                        value={dataPrevista}
                        onChange={(e) => setDataPrevista(e.target.value)}
                        fullWidth
                        sx={{ mt: 2, mb: 2 }}
                        InputLabelProps={{
                            shrink: true,
                        }}
                    />

                    <Box display="flex" justifyContent="flex-end" gap={2} sx={{ mt: 3 }}>
                        <Button variant="outlined" onClick={handleCloseGestorModal}>
                            Cancelar
                        </Button>
                        <Button variant="contained" color="primary" onClick={handleSubmitGestor}>
                            Confirmar
                        </Button>
                    </Box>
                </Box>
            </Modal>

            {/* MODAL ENVIAR PARA FINANCEIRO */}
            <Modal open={financeiroModalOpen} title="Enviar para Financeiro" onClose={handleCloseFinanceiroModal}>
                <Box sx={{ p: 2, minWidth: 400 }}>
                    <Typography gutterBottom>
                        Você está prestes a enviar a solicitação <strong>{financeiroItem?.['Cod. Compra'] || financeiroItem?.['cod_compra']}</strong> para o <strong>Financeiro</strong>.
                    </Typography>

                    {/* Verificação de documentos */}
                    {documentosExistentes.length === 0 ? (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            ⚠️ Nenhum documento foi anexado. É obrigatório anexar pelo menos 1 documento antes de enviar para o Financeiro.
                        </Alert>
                    ) : (
                        <Alert severity="success" sx={{ mt: 2 }}>
                            ✓ {documentosExistentes.length} de 2 documento(s) anexado(s)
                        </Alert>
                    )}

                    <Box display="flex" justifyContent="flex-end" gap={2} sx={{ mt: 3 }}>
                        <Button variant="outlined" onClick={handleCloseFinanceiroModal}>
                            Cancelar
                        </Button>
                        <Button
                            variant="contained"
                            color="success"
                            onClick={handleSubmitFinanceiro}
                            disabled={loading || documentosExistentes.length === 0}
                        >
                            {loading ? <CircularProgress size={24} /> : "Confirmar Envio"}
                        </Button>
                    </Box>
                </Box>
            </Modal>

            {/* Modal Justificativa (mantido do original) */}
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

            {/* Modal Voltar Processo (mantido do original) */}
            <Modal open={backProcessOpen} title={"Retornar Processo"} onClose={handleCloseBackProcess}>
                <Box display="flex" flexDirection="column" gap={2} p={2}>
                    {returnData.length !== 0 ? (
                        returnData.map((item, index) => (
                            <Box key={index}>
                                <Paper elevation={1} sx={{ p: 2, mb: 2, borderRadius: 2, borderLeft: '5px solid', borderColor: 'primary.main', alignSelf: 'flex-start', maxWidth: '80%' }}>
                                    <Typography variant="subtitle2" fontWeight="bold" color="primary.dark">
                                        {item.nome_origem} - {niveisUsuarios.find(u => u.nivel === item.setor_origem)?.nome || `Setor ${item.setor_origem}`}
                                    </Typography>
                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line', color: 'text.primary' }}>{item.justificativa_origem}</Typography>
                                </Paper>

                                <Paper elevation={1} sx={{ p: 2, mb: 2, borderRadius: 2, borderRight: '5px solid', borderColor: 'success.main', alignSelf: 'flex-end', maxWidth: '80%' }}>
                                    <Typography variant="subtitle2" fontWeight="bold" color="success.dark" textAlign="right">
                                        {item.nome_destino} - {niveisUsuarios.find(u => u.nivel === item.setor_destino)?.nome || `Setor ${item.setor_destino}`}
                                    </Typography>
                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line', color: 'text.primary', textAlign: 'right' }}>{item.resposta_destino}</Typography>
                                </Paper>
                            </Box>
                        ))
                    ) : (
                        <>
                            <Typography>Para quem você deseja retornar o processo?</Typography>
                            <Select size="small" sx={{ minWidth: 200 }} value={selectedBackLevel} onChange={(e) => setSelectedBackLevel(e.target.value)}>
                                <MenuItem value=""><em>Selecione</em></MenuItem>
                                {opcoesParaUsuario.map(u => (<MenuItem key={u.nivel} value={u.nivel}>{u.nome}</MenuItem>))}
                            </Select>
                            <TextField
                                label="Justificativa"
                                value={justificativaVolta}
                                onChange={(e) => setJustificativaVolta(e.target.value)}
                                multiline
                                rows={4}
                                fullWidth
                                placeholder="Digite a justificativa da alteração..."
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                            <Box display="flex" justifyContent="flex-end" gap={2} mt={1}>
                                <Button variant="outlined" onClick={handleCloseBackProcess}>Cancelar</Button>
                                <Button variant="contained" onClick={handleSubmitRetorno}>Confirmar</Button>
                            </Box>
                        </>
                    )}
                </Box>
            </Modal>

            {/* Modal Justificativa de Retorno (mantido do original) */}
            <Modal open={returnModalOpen} title="Justificativa de Retorno" onClose={handleCloseReturnModal}>
                <Box display="flex" flexDirection="column" gap={2} p={2}>
                    {returnData.length === 0 ? (
                        <Typography>Nenhuma justificativa de retorno encontrada.</Typography>
                    ) : (
                        returnData.map((item, index) => {
                            const setor = niveisUsuarios.find(u => u.nivel === item.setor_origem)?.nome || `Setor ${item.setor_origem}`;
                            return (
                                <Paper key={index} elevation={1} sx={{ p: 2, mb: 2, borderRadius: 2, borderLeft: '5px solid', borderColor: 'info.main', bgcolor: 'grey.50' }}>
                                    <Typography variant="subtitle2" fontWeight="bold">{item.nome_origem} - {setor}</Typography>
                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line', color: 'text.secondary' }}>{item.justificativa_origem}</Typography>
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
                        <Button variant="outlined" onClick={handleCloseReturnModal}>Fechar</Button>
                        <Button variant="contained" color="primary" onClick={() => { const codigos = returnData.map(item => item.cod_compra).join(','); handleSubmitFinalizarRetorno(codigos); }}>Salvar resposta</Button>
                    </Box>
                </Box>
            </Modal>

            <DrawerDetalhes
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                item={selectedItem}
                solicitacoes={solicitacoes}
            />

            {/* Modal Itens Agrupados */}
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
                                    Item - {selectedItem['Código']}
                                </Typography>
                                <Typography variant="subtitle1" mb={2} textAlign="center">
                                    Total do Item - {itensAgrupados.length > 0 ? itensAgrupados[0].total_quantidade : 0}
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