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
    Modal,
    Paper,
    TextField,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Alert,
    Chip
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { FiX, FiPlus, FiUploadCloud, FiDownload, FiFile, FiTrash2, FiPaperclip } from "react-icons/fi";
import CustomSnackbar from "../../../components/SnackBar/SnackBar";
import useDetalhesTodasSolicitacao from "../../../hooks/useDetalhesTodasSolicitacoes";
import CustomDataGrid from "../../../components/Table/TableData";
import { FilePen } from "lucide-react";
import DataGridData from "../../../components/DataGrid/DataGrid";
import useMateriais from "../../../hooks/useMateriais";

export default function Index() {
    const { cod_compra } = useParams();
    const [loading, setLoading] = useState(false);
    const [quantidades, setQuantidades] = useState({});
    const [novaQuantidade, setNovaQuantidade] = useState("");
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [openItens, setOpenItens] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalItem, setModalItem] = useState(null);
    const [justificativa, setJustificativa] = useState("");
    const [itensAgrupados, setItensAgrupados] = useState([]);
    const [loadingItensAgrupados, setLoadingItensAgrupados] = useState(false);

    // Estado local dos dados da tabela (evita reload da página)
    const [localData, setLocalData] = useState([]);

    // States para o modal de remoção
    const [removeModalOpen, setRemoveModalOpen] = useState(false);
    const [itemToRemove, setItemToRemove] = useState(null);
    const [justificativaRemocao, setJustificativaRemocao] = useState("");

    // States para o modal de adição
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [gestaoId, setGestaoId] = useState("");
    const [gestaoSelecionada, setGestaoSelecionada] = useState("");
    const [gestoesMateriais, setGestoesMateriais] = useState([]);
    const [loadingGestao, setLoadingGestao] = useState(false);
    const [errorGestao, setErrorGestao] = useState(null);
    const [itensSelecionados, setItensSelecionados] = useState([]);
    const [quantidadesAdd, setQuantidadesAdd] = useState({});
    const [confirmAddOpen, setConfirmAddOpen] = useState(false);
    const [centroCustoPrimeiroItem, setCentroCustoPrimeiroItem] = useState(null);
    const [descricaoCentroCusto, setDescricaoCentroCusto] = useState("");
    
    // NOVO: Estado para materiais filtrados
    const [materiaisFiltrados, setMateriaisFiltrados] = useState([]);

    // STATES PARA ANEXOS
    const [anexosModalOpen, setAnexosModalOpen] = useState(false);
    const [anexos, setAnexos] = useState([]);
    const [loadingAnexos, setLoadingAnexos] = useState(false);
    const [uploadingAnexos, setUploadingAnexos] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [limitesAnexos, setLimitesAnexos] = useState(null);

    const navigate = useNavigate();

    const {
        dataDetails,
        loading: loadingSolicitacao,
        error,
    } = useDetalhesTodasSolicitacao(cod_compra);

    const {
        dataMaterials,
        loading: loadingMateriais,
        error: errorMateriais,
    } = useMateriais(gestaoId);

    // FUNÇÕES PARA ANEXOS
    const carregarAnexos = async () => {
        setLoadingAnexos(true);
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/uploads/listar/${cod_compra}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            setAnexos(response.data.data || []);
        } catch (error) {
            console.error('Erro ao carregar anexos:', error);
            showSnackbar('Erro ao carregar anexos');
        } finally {
            setLoadingAnexos(false);
        }
    };

    const verificarLimitesAnexos = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/uploads/limites/${cod_compra}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            setLimitesAnexos(response.data.data);
        } catch (error) {
            console.error('Erro ao verificar limites:', error);
        }
    };

    // CORREÇÃO PRINCIPAL: Remover Content-Type do header
    const handleUploadAnexos = async () => {
        if (selectedFiles.length === 0) {
            showSnackbar('Selecione pelo menos um arquivo');
            return;
        }

        const formData = new FormData();
        formData.append('cod_compra', cod_compra);
        selectedFiles.forEach(file => {
            formData.append('files[]', file);
        });

        setUploadingAnexos(true);
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/uploads/multiplo`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                        // NÃO COLOCAR Content-Type - o axios define automaticamente com o boundary correto
                    }
                }
            );

            console.log('Resposta upload:', response.data);

            if (response.data.success) {
                showSnackbar(response.data.message || 'Upload realizado com sucesso!');
                await carregarAnexos();
                await verificarLimitesAnexos();
                setSelectedFiles([]);
            } else {
                showSnackbar(response.data.message || 'Erro no upload');
            }
        } catch (error) {
            console.error('Erro detalhado no upload:', error);
            console.error('Resposta do erro:', error.response?.data);
            
            const errorMessage = error.response?.data?.message || 
                                error.response?.data?.errors || 
                                'Erro ao fazer upload';
            showSnackbar(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
        } finally {
            setUploadingAnexos(false);
        }
    };

    const handleDownloadAnexo = async (anexo) => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/uploads/download/hash/${anexo.nome_hash}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    },
                    responseType: 'blob'
                }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', anexo.nome_original);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Erro no download:', error);
            showSnackbar('Erro ao baixar arquivo');
        }
    };

    const handleRemoverAnexo = async (id) => {
        if (!window.confirm('Tem certeza que deseja remover este anexo?')) return;

        try {
            await axios.delete(
                `${import.meta.env.VITE_API_URL}/uploads/documento/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            showSnackbar('Anexo removido com sucesso!');
            await carregarAnexos();
            await verificarLimitesAnexos();
        } catch (error) {
            console.error('Erro ao remover anexo:', error);
            showSnackbar('Erro ao remover anexo');
        }
    };

    const formatarTamanho = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Validação de arquivos
    const validarArquivos = (files) => {
        const MAX_FILES = 3;
        const MAX_SIZE_MB = 20;
        const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
        const ALLOWED_TYPES = ["pdf", "xlsx", "xls", "jpg", "jpeg", "png"];
        
        const validFiles = [];
        const errors = [];
        
        const disponiveis = MAX_FILES - anexos.length;
        const paraAdicionar = Array.from(files).slice(0, disponiveis);
        
        for (const file of paraAdicionar) {
            const ext = file.name.split('.').pop().toLowerCase();
            
            if (!ALLOWED_TYPES.includes(ext)) {
                errors.push(`"${file.name}": Tipo não permitido. Formatos aceitos: PDF, XLS, XLSX, JPG, PNG`);
                continue;
            }
            
            if (file.size > MAX_SIZE_BYTES) {
                errors.push(`"${file.name}": Tamanho máximo é ${MAX_SIZE_MB}MB.`);
                continue;
            }
            
            validFiles.push(file);
        }
        
        return { validFiles, errors };
    };

    // Sincroniza localData quando o hook retorna dados pela primeira vez
    useEffect(() => {
        if (dataDetails) {
            setLocalData(dataDetails);

            const initialQuantities = {};
            dataDetails.forEach((item) => {
                initialQuantities[item.id] = item.quantidade;
            });
            setQuantidades(initialQuantities);

            if (dataDetails.length > 0 && dataDetails[0].centro_custo) {
                const centroCusto = dataDetails[0].centro_custo;
                setCentroCustoPrimeiroItem(centroCusto);
                console.log('Centro de custo do primeiro item:', centroCusto);
            }
        }
    }, [dataDetails]);

    // FILTRA os materiais pelo centro_custo
    useEffect(() => {
        if (dataMaterials && dataMaterials.length > 0 && centroCustoPrimeiroItem) {
            console.log('Todos materiais:', dataMaterials);
            console.log('Filtrando por centro_custo:', centroCustoPrimeiroItem);
            
            const filtrados = dataMaterials.filter(item => {
                const centroCustoItem = item.centro_custo || item.centrocusto || item.CentroCusto;
                return String(centroCustoItem) === String(centroCustoPrimeiroItem);
            });
            
            console.log('Materiais filtrados:', filtrados);
            setMateriaisFiltrados(filtrados);
        } else {
            setMateriaisFiltrados([]);
        }
    }, [dataMaterials, centroCustoPrimeiroItem]);

    // Buscar gestões e encontrar o ID correspondente ao centro_custo
    useEffect(() => {
        const fetchGestaoMateriais = async () => {
            setLoadingGestao(true);
            setErrorGestao(null);
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/centrocusto`,
                    {
                        headers: {
                            Authorization: localStorage.getItem("token"),
                        },
                    }
                );
                setGestoesMateriais(response.data);

                if (centroCustoPrimeiroItem && response.data.length > 0) {
                    const gestaoEncontrada = response.data.find(
                        (gestao) =>
                            String(gestao.id) === String(centroCustoPrimeiroItem) ||
                            String(gestao.codigo) === String(centroCustoPrimeiroItem) ||
                            gestao.descricao === centroCustoPrimeiroItem
                    );

                    if (gestaoEncontrada) {
                        setGestaoId(String(gestaoEncontrada.id));
                        setGestaoSelecionada(gestaoEncontrada.descricao);
                        setDescricaoCentroCusto(gestaoEncontrada.descricao);
                        console.log('Gestão encontrada:', gestaoEncontrada);
                    } else {
                        setGestaoId(String(centroCustoPrimeiroItem));
                        setGestaoSelecionada(String(centroCustoPrimeiroItem));
                        setDescricaoCentroCusto(String(centroCustoPrimeiroItem));
                    }
                }
            } catch (err) {
                setErrorGestao("Erro ao carregar gestões de materiais");
                console.error(err);
            } finally {
                setLoadingGestao(false);
            }
        };

        if (addModalOpen && centroCustoPrimeiroItem) {
            fetchGestaoMateriais();
        }
    }, [addModalOpen, centroCustoPrimeiroItem]);

    // Carregar anexos quando o modal abrir
    useEffect(() => {
        if (anexosModalOpen && cod_compra) {
            carregarAnexos();
            verificarLimitesAnexos();
        }
    }, [anexosModalOpen, cod_compra]);

    // Função para abrir o modal de edição
    const openEditModal = (item) => {
        setModalItem(item);
        setNovaQuantidade(item.quantidade.toString());
        setJustificativa("");
        setModalOpen(true);
    };

    // Função para abrir o modal de remoção
    const openRemoveModal = (item) => {
        setItemToRemove(item);
        setJustificativaRemocao("");
        setRemoveModalOpen(true);
    };

    const closeRemoveModal = () => {
        setRemoveModalOpen(false);
        setItemToRemove(null);
        setJustificativaRemocao("");
    };

    const openAddModal = () => {
        setItensSelecionados([]);
        setQuantidadesAdd({});
        setAddModalOpen(true);
    };

    const closeAddModal = () => {
        setAddModalOpen(false);
        setItensSelecionados([]);
        setQuantidadesAdd({});
        setConfirmAddOpen(false);
    };

    // Remover item → atualiza localData diretamente
    const handleRemoveItem = async () => {
        if (!itemToRemove) return;

        if (!justificativaRemocao.trim()) {
            showSnackbar("Por favor, informe uma justificativa para a remoção!");
            return;
        }

        try {
            setLoading(true);
            const payload = {
                id: itemToRemove.id,
                justificativa_remocao: justificativaRemocao,
            };

            await axios.delete(
                `${import.meta.env.VITE_API_URL}/aprovarcompra/detalhescompra/${itemToRemove.id}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                    data: payload,
                }
            );

            setLocalData((prev) => prev.filter((item) => item.id !== itemToRemove.id));

            showSnackbar("Item removido com sucesso!");
            closeRemoveModal();
        } catch (error) {
            console.error(error);
            const errorMessage = error.response?.data?.message || "Erro ao remover item";
            showSnackbar(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Adicionar itens → usa retorno da API para atualizar localData
    const handleConfirmAddItems = async () => {
        if (itensSelecionados.length === 0) {
            showSnackbar("Selecione pelo menos um item para adicionar!");
            return;
        }

        try {
            setLoading(true);

            const itensParaAdicionar = itensSelecionados.map((item) => ({
                cod_compra: cod_compra,
                cod_material: item.CodMaterial,
                quantidade: quantidadesAdd[item.id] || item.quantidade || 1,
            }));

            await axios.post(
                `${import.meta.env.VITE_API_URL}/aprovarcompra/detalhescompra/lista`,
                { itens: itensParaAdicionar },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            const recarregarDados = async () => {
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/relatoriogeral/detalhescompra/${cod_compra}`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                        },
                    }
                );
                setLocalData(response.data);
            };

            await recarregarDados();

            showSnackbar(`${itensParaAdicionar.length} item(ns) adicionado(s) com sucesso!`);
            closeAddModal();
        } catch (error) {
            console.error(error);
            const errorMessage = error.response?.data?.message || "Erro ao adicionar itens";
            showSnackbar(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectionChange = (novosSelecionados) => {
        setItensSelecionados(novosSelecionados);

        const novasQuantidades = { ...quantidadesAdd };
        novosSelecionados.forEach((item) => {
            if (!novasQuantidades[item.id]) {
                novasQuantidades[item.id] = 1;
            }
        });
        setQuantidadesAdd(novasQuantidades);
    };

    const handleQuantidadeAddChange = (id, value) => {
        const val = Math.max(Number(value), 1);
        setQuantidadesAdd((prev) => ({ ...prev, [id]: val }));

        setItensSelecionados((prev) =>
            prev.map((item) => (item.id === id ? { ...item, quantidade: val } : item))
        );
    };

    const showPreview = () => {
        if (itensSelecionados.length === 0) {
            showSnackbar("Selecione pelo menos um item antes de adicionar.");
            return;
        }
        setConfirmAddOpen(true);
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

    const handleCloseItens = () => {
        setOpenItens(false);
        setSelectedItem(null);
    };

    const closeModal = () => {
        setModalOpen(false);
        setModalItem(null);
        setNovaQuantidade("");
        setJustificativa("");
    };

    // Editar quantidade → atualiza localData diretamente
    const handleSubmitEdit = async () => {
        if (!modalItem) return;

        const quantidadeNova = parseInt(novaQuantidade);
        const quantidadeAntiga = modalItem.quantidade;

        if (quantidadeNova < 1) {
            showSnackbar("A quantidade deve ser pelo menos 1!");
            return;
        }

        if (quantidadeNova === quantidadeAntiga) {
            showSnackbar("A quantidade não foi alterada!");
            return;
        }

        if (!justificativa.trim()) {
            showSnackbar("Por favor, informe uma justificativa!");
            return;
        }

        try {
            setLoading(true);
            const payload = {
                id: modalItem.id,
                quantidade: quantidadeNova,
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

            setLocalData((prev) =>
                prev.map((item) =>
                    item.id === modalItem.id
                        ? { ...item, quantidade: quantidadeNova }
                        : item
                )
            );

            showSnackbar("Item atualizado com sucesso!");
            closeModal();
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

    const handleSnackbarClose = () => {
        setSnackbarOpen(false);
    };

    // Prepara os dados para o DataGrid de adição usando materiais filtrados
    const dataWithQuantity = (materiaisFiltrados || []).map((item) => {
        const itemSelecionado = itensSelecionados.find((s) => s.id === item.id);
        return {
            ...item,
            quantidade: itemSelecionado?.quantidade || 1,
            Quantidade: (
                <Box display="flex" height={"100%"} alignItems="center" gap={1}>
                    <TextField
                        label="Quantidade"
                        type="number"
                        variant="standard"
                        fullWidth
                        value={quantidadesAdd[item.id] || 1}
                        onChange={(e) => handleQuantidadeAddChange(item.id, e.target.value)}
                        inputProps={{ min: 1 }}
                    />
                </Box>
            ),
        };
    });

    const columns = [
        { field: "cod_material", headerName: "Cód. Material", width: 170 },
        { field: "descricao", headerName: "Descrição", width: 540 },
        { field: "quantidade", headerName: "Quantidade", width: 170 },
        { field: "unidade", headerName: "Unidade", width: 130 },
        {
            field: "Editar",
            headerName: "Editar",
            width: 150,
            sortable: false,
            renderCell: (params) => (
                <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={() => openEditModal(params.row)}
                >
                    <FilePen style={{ marginRight: 4 }} /> Editar
                </Button>
            ),
        },
        {
            field: "Remover",
            headerName: "Remover",
            width: 150,
            sortable: false,
            renderCell: (params) => (
                <Button
                    variant="contained"
                    color="error"
                    size="small"
                    onClick={() => openRemoveModal(params.row)}
                >
                    <FiX style={{ marginRight: 4 }} /> Remover
                </Button>
            ),
        },
    ];

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
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                            <Typography variant="h5" component="h2">
                                Detalhes da Compra
                            </Typography>
                            {anexos.length > 0 && (
                                <Chip 
                                    label={`${anexos.length} anexo(s)`} 
                                    size="small" 
                                    color="primary" 
                                    variant="outlined"
                                    onClick={() => setAnexosModalOpen(true)}
                                    sx={{ cursor: 'pointer' }}
                                />
                            )}
                        </Box>
                        <Box sx={{ display: "flex", gap: 2 }}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => setAnexosModalOpen(true)}
                                startIcon={<FiUploadCloud />}
                                disabled={!centroCustoPrimeiroItem}
                            >
                                Adicionar Anexos
                            </Button>
                            <Button
                                variant="contained"
                                color="success"
                                onClick={openAddModal}
                                startIcon={<FiPlus />}
                                disabled={!centroCustoPrimeiroItem}
                            >
                                Adicionar Itens
                            </Button>
                            <Button
                                variant="outlined"
                                color="gray"
                                onClick={() => navigate(-1)}
                            >
                                Voltar
                            </Button>
                        </Box>
                    </Box>

                    <CustomDataGrid
                        columns={columns}
                        data={localData}
                        loading={loadingSolicitacao || loading}
                        initialPageSize={10}
                    />
                </CardContent>
            </Card>

            {/* Modal de Anexos */}
            <Dialog open={anexosModalOpen} onClose={() => setAnexosModalOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight: "bold", textAlign: "center" }}>
                    Anexos da Compra
                    <IconButton
                        onClick={() => setAnexosModalOpen(false)}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <FiX />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    {/* Informações de limites */}
                    {limitesAnexos && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            <Typography variant="body2">
                                <strong>Limites:</strong> Máximo de 3 arquivos por compra (20MB cada)
                            </Typography>
                            <Typography variant="body2">
                                Arquivos atuais: {limitesAnexos.documentos_atuais} / {limitesAnexos.limite_maximo_arquivos}
                            </Typography>
                        </Alert>
                    )}

                    {/* Área de upload */}
                    {limitesAnexos?.pode_adicionar !== false && (
                        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Adicionar novos anexos
                            </Typography>
                            
                            <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
                                <Button
                                    variant="contained"
                                    component="label"
                                    startIcon={<FiUploadCloud />}
                                    disabled={uploadingAnexos || limitesAnexos?.arquivos_restantes === 0}
                                >
                                    Selecionar Arquivos
                                    <input
                                        type="file"
                                        hidden
                                        multiple
                                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                                        onChange={(e) => {
                                            const files = Array.from(e.target.files);
                                            const { validFiles, errors } = validarArquivos(files);
                                            if (errors.length > 0) {
                                                errors.forEach(err => showSnackbar(err));
                                            }
                                            setSelectedFiles(prev => [...prev, ...validFiles]);
                                        }}
                                        disabled={uploadingAnexos || limitesAnexos?.arquivos_restantes === 0}
                                    />
                                </Button>
                                
                                {selectedFiles.length > 0 && (
                                    <>
                                        <Typography variant="body2">
                                            {selectedFiles.length} arquivo(s) selecionado(s)
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            onClick={handleUploadAnexos}
                                            disabled={uploadingAnexos}
                                        >
                                            {uploadingAnexos ? <CircularProgress size={24} /> : 'Enviar'}
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            onClick={() => setSelectedFiles([])}
                                            disabled={uploadingAnexos}
                                        >
                                            Limpar
                                        </Button>
                                    </>
                                )}
                            </Box>

                            {/* Lista de arquivos selecionados */}
                            {selectedFiles.length > 0 && (
                                <Box sx={{ mt: 2 }}>
                                    {selectedFiles.map((file, idx) => (
                                        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <FiPaperclip size={16} />
                                            <Typography variant="body2">{file.name}</Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                ({formatarTamanho(file.size)})
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            )}
                        </Paper>
                    )}

                    {/* Lista de anexos existentes */}
                    <Typography variant="subtitle2" gutterBottom>
                        Anexos ({anexos.length})
                    </Typography>

                    {loadingAnexos ? (
                        <CircularProgress size={24} />
                    ) : anexos.length === 0 ? (
                        <Alert severity="info">
                            Nenhum anexo encontrado para esta compra.
                        </Alert>
                    ) : (
                        <List>
                            {anexos.map((anexo) => (
                                <ListItem
                                    key={anexo.id}
                                    sx={{
                                        border: '1px solid #e0e0e0',
                                        borderRadius: 1,
                                        mb: 1,
                                        '&:hover': {
                                            bgcolor: '#f5f5f5'
                                        }
                                    }}
                                >
                                    <Box mr={2}>
                                        <FiFile size={24} />
                                    </Box>
                                    <ListItemText
                                        primary={anexo.nome_original}
                                        secondary={
                                            <Typography component="span" variant="caption">
                                                {formatarTamanho(anexo.tamanho)} • 
                                                Enviado em: {new Date(anexo.created_at).toLocaleDateString('pt-BR')}
                                            </Typography>
                                        }
                                    />
                                    <ListItemSecondaryAction>
                                        <IconButton
                                            edge="end"
                                            onClick={() => handleDownloadAnexo(anexo)}
                                            sx={{ mr: 1 }}
                                            title="Download"
                                        >
                                            <FiDownload />
                                        </IconButton>
                                        <IconButton
                                            edge="end"
                                            onClick={() => handleRemoverAnexo(anexo.id)}
                                            title="Remover"
                                        >
                                            <FiTrash2 />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAnexosModalOpen(false)} variant="outlined">
                        Fechar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Modal de edição */}
            <Dialog open={modalOpen} onClose={closeModal} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: "bold", textAlign: "center" }}>
                    Editar Quantidade
                </DialogTitle>
                <DialogContent>
                    {modalItem && (
                        <Box display="flex" flexDirection="column" gap={3} mt={1}>
                            <Box display="flex" justifyContent="space-between" gap={2}>
                                <Paper
                                    elevation={2}
                                    sx={{ p: 2, flex: 1, textAlign: "center", bgcolor: "#f5f5f5" }}
                                >
                                    <Typography variant="subtitle1" color="textSecondary">
                                        Quantidade Original
                                    </Typography>
                                    <Typography variant="h6" fontWeight="bold">
                                        {modalItem.quantidade}
                                    </Typography>
                                </Paper>
                                <Paper
                                    elevation={2}
                                    sx={{ p: 2, flex: 1, textAlign: "center", bgcolor: "#e3f2fd" }}
                                >
                                    <Typography variant="subtitle1" color="textSecondary">
                                        Nova Quantidade
                                    </Typography>
                                    <TextField
                                        type="number"
                                        value={novaQuantidade}
                                        onChange={(e) => setNovaQuantidade(parseInt(e.target.value))}
                                        inputProps={{
                                            min: 1,
                                            style: {
                                                fontSize: "1.25rem",
                                                fontWeight: "bold",
                                                textAlign: "center",
                                            },
                                        }}
                                        variant="outlined"
                                        sx={{ width: 120, "& input": { textAlign: "center" } }}
                                    />
                                </Paper>
                            </Box>

                            <TextField
                                label="Justificativa"
                                value={justificativa}
                                onChange={(e) => setJustificativa(e.target.value)}
                                multiline
                                rows={4}
                                fullWidth
                                required
                                placeholder="Digite a justificativa para a alteração da quantidade..."
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={closeModal} variant="outlined">
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmitEdit}
                        variant="contained"
                        color="primary"
                        sx={{ minWidth: 120 }}
                        disabled={
                            !justificativa.trim() ||
                            loading ||
                            parseInt(novaQuantidade) === modalItem?.quantidade
                        }
                    >
                        {loading ? <CircularProgress size={24} /> : "Salvar"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Modal de Remoção */}
            <Dialog
                open={removeModalOpen}
                onClose={closeRemoveModal}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle
                    sx={{ fontWeight: "bold", textAlign: "center", color: "error.main" }}
                >
                    Remover Item
                </DialogTitle>
                <DialogContent>
                    {itemToRemove && (
                        <Box display="flex" flexDirection="column" gap={3} mt={1}>
                            <Paper elevation={2} sx={{ p: 2, bgcolor: "#ffebee" }}>
                                <Typography variant="subtitle1" color="error" gutterBottom>
                                    Atenção!
                                </Typography>
                                <Typography variant="body1">
                                    Você está prestes a remover o seguinte item da compra:
                                </Typography>
                                <Box sx={{ mt: 2, p: 2, bgcolor: "white", borderRadius: 1 }}>
                                    <Typography>
                                        <strong>Código:</strong> {itemToRemove.cod_material}
                                    </Typography>
                                    <Typography>
                                        <strong>Descrição:</strong> {itemToRemove.descricao}
                                    </Typography>
                                    <Typography>
                                        <strong>Quantidade:</strong> {itemToRemove.quantidade}
                                    </Typography>
                                    <Typography>
                                        <strong>Unidade:</strong> {itemToRemove.unidade}
                                    </Typography>
                                </Box>
                                <Typography variant="body2" color="error" sx={{ mt: 2 }}>
                                    Esta ação não poderá ser desfeita!
                                </Typography>
                            </Paper>

                            <TextField
                                label="Justificativa para Remoção"
                                value={justificativaRemocao}
                                onChange={(e) => setJustificativaRemocao(e.target.value)}
                                multiline
                                rows={4}
                                fullWidth
                                required
                                placeholder="Digite a justificativa para a remoção deste item..."
                                error={justificativaRemocao.trim() === ""}
                                helperText={
                                    justificativaRemocao.trim() === ""
                                        ? "Justificativa é obrigatória"
                                        : ""
                                }
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={closeRemoveModal} variant="outlined">
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleRemoveItem}
                        variant="contained"
                        color="error"
                        sx={{ minWidth: 120 }}
                        disabled={!justificativaRemocao.trim() || loading}
                    >
                        {loading ? <CircularProgress size={24} /> : "Remover"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Modal de Adição de Itens */}
            <Dialog
                open={addModalOpen}
                onClose={closeAddModal}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: "bold", textAlign: "center" }}>
                    Adicionar Itens à Compra
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <FormControl fullWidth sx={{ mb: 3 }}>
                            <InputLabel id="gestao-material-label">Centro de Custo</InputLabel>
                            <Select
                                labelId="gestao-material-label"
                                value={descricaoCentroCusto || centroCustoPrimeiroItem || ""}
                                disabled={true}
                                sx={{ bgcolor: "#f5f5f5" }}
                            >
                                <MenuItem value={descricaoCentroCusto || centroCustoPrimeiroItem}>
                                    {descricaoCentroCusto || centroCustoPrimeiroItem}
                                </MenuItem>
                            </Select>
                            {centroCustoPrimeiroItem && (
                                <Typography
                                    variant="caption"
                                    color="textSecondary"
                                    sx={{ mt: 1 }}
                                >
                                    Buscando materiais com centro de custo:{" "}
                                    <strong>{centroCustoPrimeiroItem}</strong>
                                </Typography>
                            )}
                        </FormControl>

                        {loadingGestao && (
                            <Typography color="text.secondary">Carregando gestões...</Typography>
                        )}
                        {errorGestao && (
                            <Typography color="error">{errorGestao}</Typography>
                        )}
                        {loadingMateriais && (
                            <Typography color="text.secondary">Carregando materiais...</Typography>
                        )}
                        {errorMateriais && (
                            <Typography color="error">{errorMateriais}</Typography>
                        )}

                        {gestaoId ? (
                            <DataGridData
                                data={dataWithQuantity || []}
                                loading={loadingMateriais}
                                error={errorMateriais}
                                hiddenIndexes={[4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]}
                                setSelectedValues={handleSelectionChange}
                                initialPageSize={10}
                                selectedValues={itensSelecionados}
                                checkboxSelection={true}
                            />
                        ) : (
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ textAlign: "center", py: 4 }}
                            >
                                {centroCustoPrimeiroItem
                                    ? "Carregando gestão correspondente..."
                                    : "Nenhum item encontrado na compra para definir o centro de custo."}
                            </Typography>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={closeAddModal} variant="outlined">
                        Cancelar
                    </Button>
                    <Button
                        onClick={showPreview}
                        variant="contained"
                        color="primary"
                        disabled={itensSelecionados.length === 0 || loading || !gestaoId}
                    >
                        {itensSelecionados.length > 0
                            ? `Adicionar ${itensSelecionados.length} Item(ns)`
                            : "Selecionar Itens"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Modal de Confirmação de Adição */}
            <Dialog
                open={confirmAddOpen}
                onClose={() => setConfirmAddOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: "bold", textAlign: "center" }}>
                    Confirmar Adição de Itens
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        Revise os itens selecionados abaixo:
                    </Typography>

                    <Paper
                        sx={{ p: 2, bgcolor: "#f5f5f5", maxHeight: 400, overflow: "auto" }}
                    >
                        {itensSelecionados.map((item) => (
                            <Box
                                key={item.id}
                                sx={{ mb: 2, p: 1, bgcolor: "white", borderRadius: 1 }}
                            >
                                <Grid container spacing={2}>
                                    <Grid item xs={3}>
                                        <Typography variant="caption" color="textSecondary">
                                            Código:
                                        </Typography>
                                        <Typography variant="body2">{item.CodMaterial}</Typography>
                                    </Grid>
                                    <Grid item xs={7}>
                                        <Typography variant="caption" color="textSecondary">
                                            Descrição:
                                        </Typography>
                                        <Typography variant="body2">{item.Descricao}</Typography>
                                    </Grid>
                                    <Grid item xs={2}>
                                        <Typography variant="caption" color="textSecondary">
                                            Quantidade:
                                        </Typography>
                                        <Typography variant="body2" fontWeight="bold">
                                            {quantidadesAdd[item.id] || 1}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Box>
                        ))}
                    </Paper>

                    <Paper
                        elevation={0}
                        sx={{ p: 2, mt: 2, bgcolor: "#e8f5e9", borderRadius: 2 }}
                    >
                        <Typography variant="body2" color="textSecondary">
                            <strong>Centro de Custo:</strong>{" "}
                            {centroCustoPrimeiroItem}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                            <strong>Total de itens:</strong> {itensSelecionados.length} item(ns)
                        </Typography>
                    </Paper>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setConfirmAddOpen(false)} variant="outlined">
                        Voltar
                    </Button>
                    <Button
                        onClick={handleConfirmAddItems}
                        variant="contained"
                        color="success"
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} /> : "Confirmar Adição"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Modal de Itens Agrupados */}
            <Modal open={openItens} onClose={handleCloseItens}>
                <Box
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 500,
                        bgcolor: "background.paper",
                        borderRadius: 3,
                        boxShadow: 24,
                        p: 4,
                    }}
                >
                    {selectedItem && (
                        <>
                            <Typography variant="h6" mb={2} textAlign="center">
                                Itens Agrupados - {selectedItem.cod_material}
                            </Typography>

                            {loadingItensAgrupados ? (
                                <Box display="flex" justifyContent="center" my={4}>
                                    <CircularProgress />
                                </Box>
                            ) : itensAgrupados.length === 0 ? (
                                <Typography
                                    textAlign="center"
                                    color="text.secondary"
                                    py={4}
                                >
                                    Nenhum item encontrado.
                                </Typography>
                            ) : (
                                <Box sx={{ maxHeight: 400, overflowY: "auto" }}>
                                    {itensAgrupados.map((item, idx) => (
                                        <Paper key={idx} sx={{ p: 2, mb: 2, bgcolor: "grey.50" }}>
                                            <Typography>
                                                <strong>Cód. Compra:</strong> {item.cod_compra}
                                            </Typography>
                                            <Typography>
                                                <strong>Quantidade:</strong> {item.quantidade}
                                            </Typography>
                                        </Paper>
                                    ))}
                                </Box>
                            )}

                            <Box display="flex" justifyContent="center" mt={3}>
                                <Button variant="contained" onClick={handleCloseItens}>
                                    Fechar
                                </Button>
                            </Box>
                        </>
                    )}
                </Box>
            </Modal>

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
        </div>
    );
}