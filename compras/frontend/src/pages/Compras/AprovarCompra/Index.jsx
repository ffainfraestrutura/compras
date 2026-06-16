import axios from "axios";
import { Fragment, useEffect, useState, useMemo, useCallback } from "react";
import {
    Backdrop,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    FormControl,
    IconButton,
    InputLabel,
    ListItemText,
    MenuItem,
    OutlinedInput,
    Paper,
    Select,
    TextField,
    Tooltip,
    Typography
} from "@mui/material";
import { FiAlertTriangle, FiArrowLeft, FiCheck, FiCheckSquare, FiEye, FiSend, FiSquare, FiX, FiPlus } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import CustomSnackbar from "../../../components/SnackBar/SnackBar";
import DataGrid from "../../../components/DataGrid/DataGrid";
import Modal from "../../../components/Modal/Modal";

// ─── Caches Globais ─────────────────────────────────────────────────────────
let solicitacoesCache = null;
let ultimaBuscaSolicitacoes = 0;
let fornecedoresCache = null;
let ultimaBuscaFornecedores = 0;
let fornecedoresRecomendadosCache = {};
let itensAgrupadosCache = {};
const TEMPO_CACHE = 30000; // 30 segundos

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
    slotProps: {
        paper: {
            style: {
                maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
                width: 250,
            },
        },
    },
};

export default function Index() {
    const navigate = useNavigate();
    const nivelAcesso = Number(localStorage.getItem("nivel_acesso"));
    const userLevel = parseInt(localStorage.getItem("nivel_acesso"));

    const [loading, setLoading] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [groupBy, setGroupBy] = useState(() => {
        // Recupera do sessionStorage para persistir entre navegações
        return sessionStorage.getItem("groupBy_preference") || "cod_compra";
    });
    const [solicitacoes, setSolicitacoes] = useState([]);
    const [loadingSolicitacao, setLoadingSolicitacao] = useState(false);
    const [error, setError] = useState(null);

    const [selectedMaterials, setSelectedMaterials] = useState({});

    const [modalEnvioOpen, setModalEnvioOpen] = useState(false);
    const [cotacaoParaEnviar, setCotacaoParaEnviar] = useState(null);
    const [selectedFornecedor1, setSelectedFornecedor1] = useState([]);
    const [selectedFornecedor2, setSelectedFornecedor2] = useState([]);
    const [fornecedores, setFornecedores] = useState({
        recomendados: [],
        todos: []
    });
    const [loadingFornecedores, setLoadingFornecedores] = useState(false);

    const [openJustificativa, setOpenJustificativa] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const [openItens, setOpenItens] = useState(false);
    const [itensAgrupados, setItensAgrupados] = useState([]);
    const [loadingItensAgrupados, setLoadingItensAgrupados] = useState(false);

    const [approvalModalOpen, setApprovalModalOpen] = useState(false);
    const [approvalItem, setApprovalItem] = useState(null);
    const [approvalStatus, setApprovalStatus] = useState(null);
    const [approvalJustificativa, setApprovalJustificativa] = useState("");

    const [backProcessOpen, setBackProcessOpen] = useState(false);
    const [backItem, setBackItem] = useState(null);
    const [justificativaVolta, setJustificativaVolta] = useState("");
    const [selectedBackLevel, setSelectedBackLevel] = useState("");

    const [returnModalOpen, setReturnModalOpen] = useState(false);
    const [returnData, setReturnData] = useState([]);
    const [returnComment, setReturnComment] = useState("");

    const niveisUsuarios = [
        { nivel: 1, nome: "Solicitante" },
        { nivel: 7, nome: "Gerente" },
        { nivel: 2, nome: "Setor de Material" },
        { nivel: 3, nome: "Setor de Compra" },
        { nivel: 4, nome: "Gerente Administrativo" },
        { nivel: 5, nome: "Diretor Administrativo" },
        { nivel: 6, nome: "CFO" },
    ];

    const showSnackbar = useCallback((message) => {
        setSnackbarMessage(message);
        setSnackbarOpen(true);
    }, []);

    const handleSnackbarClose = useCallback(() => setSnackbarOpen(false), []);

    // ======================================
    // Funções com Cache para Fornecedores
    // ======================================

    const fetchFornecedoresRecomendados = useCallback(async (codCompra) => {
        const agora = Date.now();
        
        // Verifica cache
        if (fornecedoresRecomendadosCache[codCompra] && 
            (agora - (fornecedoresRecomendadosCache[codCompra].timestamp || 0)) < TEMPO_CACHE) {
            return fornecedoresRecomendadosCache[codCompra].data;
        }
        
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/fornecedores_recomendados`,
                {
                    params: { cod_compra: codCompra },
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                }
            );
            
            // Salva no cache
            fornecedoresRecomendadosCache[codCompra] = {
                data: response.data || [],
                timestamp: agora
            };
            
            return response.data || [];
        } catch (error) {
            console.error("Erro ao buscar fornecedores recomendados:", error);
            showSnackbar("Erro ao carregar fornecedores recomendados");
            return [];
        }
    }, [showSnackbar]);

    const fetchFornecedoresTodos = useCallback(async () => {
        const agora = Date.now();
        
        // Verifica cache
        if (fornecedoresCache && (agora - ultimaBuscaFornecedores) < TEMPO_CACHE) {
            return fornecedoresCache;
        }
        
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/fornecedores`,
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );
            
            fornecedoresCache = response.data || [];
            ultimaBuscaFornecedores = agora;
            
            return fornecedoresCache;
        } catch (error) {
            console.error("Erro ao buscar todos os fornecedores:", error);
            showSnackbar("Erro ao carregar todos os fornecedores");
            return [];
        }
    }, [showSnackbar]);

    const fetchFornecedores = useCallback(async (item) => {
        setLoadingFornecedores(true);
        try {
            const codCompra = item?.cod_compra || item?.["Codigo"] || item?.["Código"] || item?.codigo;

            if (!codCompra) {
                console.error('cod_compra não encontrado');
                showSnackbar("Erro: Código da compra não identificado");
                setFornecedores({ recomendados: [], todos: [] });
                setLoadingFornecedores(false);
                return;
            }

            const [recomendados, todos] = await Promise.all([
                fetchFornecedoresRecomendados(codCompra),
                fetchFornecedoresTodos()
            ]);

            setFornecedores({ recomendados, todos });
        } catch (error) {
            console.error("Erro ao buscar fornecedores:", error);
            showSnackbar("Erro ao carregar fornecedores");
        } finally {
            setLoadingFornecedores(false);
        }
    }, [fetchFornecedoresRecomendados, fetchFornecedoresTodos, showSnackbar]);

    // ======================================
    // Funções do Modal de Envio
    // ======================================

    const handleOpenModalEnvio = useCallback((item) => {
        const codCompra = item?.cod_compra || item?.["Codigo"];
        if (!codCompra) {
            console.error('Item não contém cod_compra:', item);
            showSnackbar("Erro: Não foi possível identificar o código da compra");
            return;
        }

        setCotacaoParaEnviar(item);
        setSelectedFornecedor1([]);
        setSelectedFornecedor2([]);
        setModalEnvioOpen(true);
        fetchFornecedores(item);
    }, [fetchFornecedores, showSnackbar]);

    const handleCloseModalEnvio = useCallback(() => {
        setCotacaoParaEnviar(null);
        setSelectedFornecedor1([]);
        setSelectedFornecedor2([]);
        setModalEnvioOpen(false);
    }, []);

    const handleConfirmarEnvio = useCallback(async () => {
        if (selectedFornecedor1.length === 0 && selectedFornecedor2.length === 0) {
            showSnackbar("Selecione pelo menos um fornecedor");
            return;
        }

        const codCompra = cotacaoParaEnviar?.cod_compra || cotacaoParaEnviar?.["Codigo"];

        const fornecedoresSelecionados = [];

        const selectedRecomendados = fornecedores.recomendados
            .filter(f => selectedFornecedor1.includes(f.nome_fantasia || f.nome || f.id))
            .map(f => ({ id: f.id, nome: f.nome_fantasia || f.nome }));

        const selectedTodos = fornecedores.todos
            .filter(f => selectedFornecedor2.includes(f.nome_fantasia || f.nome || f.id))
            .map(f => ({ id: f.id, nome: f.nome_fantasia || f.nome }));

        fornecedoresSelecionados.push(...selectedRecomendados, ...selectedTodos);

        if (fornecedoresSelecionados.length === 0) {
            showSnackbar("Erro ao identificar fornecedores selecionados");
            return;
        }

        handleCloseModalEnvio();

        try {
            setLoading(true);
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/enviar-cotacao-fornecedores`,
                { cod_compra: codCompra, fornecedores: fornecedoresSelecionados },
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );

            if (response.data.success) {
                const enviados = response.data.enviados.length;
                const falhas = response.data.falhas.length;
                if (falhas === 0) {
                    showSnackbar(`Cotação enviada com sucesso para ${enviados} fornecedor(es)!`);
                } else {
                    showSnackbar(`Enviado para ${enviados} fornecedor(es). ${falhas} emails não enviados.`);
                }
            } else {
                showSnackbar(response.data.message || "Erro ao enviar cotações");
            }
        } catch (error) {
            console.error("Erro ao enviar:", error);
            showSnackbar(error.response?.data?.message || "Erro ao enviar cotações");
        } finally {
            setLoading(false);
        }
    }, [selectedFornecedor1, selectedFornecedor2, fornecedores, cotacaoParaEnviar, handleCloseModalEnvio, showSnackbar]);

    // ======================================
    // Funções de Seleção com useCallback
    // ======================================

    const getUniqueKey = useCallback((item) => {
        const codCotacao = item.cod_compra;
        const codMaterial = item['Código'] || item.cod_material;
        return `${codCotacao}_${codMaterial}`;
    }, []);

    const handleSelectAll = useCallback(() => {
        if (selectedMaterials.all) {
            setSelectedMaterials({});
        } else {
            const allSelected = {};
            solicitacoes.forEach(item => {
                const key = getUniqueKey(item);
                allSelected[key] = true;
            });
            allSelected.all = true;
            setSelectedMaterials(allSelected);
        }
    }, [selectedMaterials, solicitacoes, getUniqueKey]);

    const handleSelectMaterial = useCallback((item) => {
        const key = getUniqueKey(item);
        setSelectedMaterials(prev => {
            const newState = { ...prev };
            if (newState[key]) {
                delete newState[key];
                delete newState.all;
            } else {
                newState[key] = true;
                const allSelected = solicitacoes.every(solicitacao => {
                    const itemKey = getUniqueKey(solicitacao);
                    return newState[itemKey];
                });
                if (allSelected) newState.all = true;
            }
            return newState;
        });
    }, [getUniqueKey, solicitacoes]);

    const handleGroupCotacoes = useCallback(async () => {
        const selectedKeys = Object.keys(selectedMaterials).filter(key => key !== 'all' && selectedMaterials[key]);

        if (selectedKeys.length < 2) {
            showSnackbar("Selecione pelo menos dois materiais para agrupar.");
            return;
        }

        try {
            setLoading(true);
            const materiaisSelecionados = solicitacoes.filter(item => {
                const key = getUniqueKey(item);
                return selectedKeys.includes(key);
            });

            const codigosCompra = [...new Set(materiaisSelecionados.map(item => item.cod_compra).filter(Boolean))];
            const codigosCotacao = [...new Set(materiaisSelecionados.map(item => item.cod_cotacao).filter(Boolean))];
            const codigosMaterial = [...new Set(materiaisSelecionados.map(item => item['Código'] || item.cod_material))];

            const payload = {
                codigos_compra: codigosCompra,
                codigos_cotacao: codigosCotacao,
                codigos_material: codigosMaterial,
                itens_selecionados: materiaisSelecionados.map(item => ({
                    cod_compra: item.cod_compra,
                    cod_cotacao: item.cod_cotacao,
                    cod_material: item['Código'] || item.cod_material,
                    quantidade: item.quantidade,
                    descricao: item.descricao
                }))
            };

            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/agrupar-cotacoes`,
                payload,
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );

            if (response.data.success) {
                showSnackbar("Cotações agrupadas com sucesso!");
                setSelectedMaterials({});
                // Limpa cache após ação
                solicitacoesCache = null;
                setTimeout(() => window.location.reload(), 1500);
            } else {
                showSnackbar(response.data.message || "Erro ao agrupar cotações");
            }
        } catch (error) {
            console.error("Erro:", error);
            showSnackbar(error.response?.data?.message || "Erro ao agrupar cotações");
        } finally {
            setLoading(false);
        }
    }, [selectedMaterials, solicitacoes, getUniqueKey, showSnackbar]);

    // ======================================
    // Busca dados COM CACHE
    // ======================================

    useEffect(() => {
        const fetchData = async () => {
            setLoadingSolicitacao(true);
            setError(null);
            
            const agora = Date.now();
            
            // Verifica cache para o groupBy atual
            const cacheKey = `solicitacoes_${groupBy}`;
            if (solicitacoesCache && solicitacoesCache.key === cacheKey && 
                (agora - ultimaBuscaSolicitacoes) < TEMPO_CACHE) {
                setSolicitacoes(solicitacoesCache.data);
                setLoadingSolicitacao(false);
                return;
            }
            
            try {
                const endpoint = groupBy === "cod_compra"
                    ? `${import.meta.env.VITE_API_URL}/aprovarcompra`
                    : `${import.meta.env.VITE_API_URL}/aprovarcompra/agrupado_material`;

                const response = await axios.get(endpoint, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                });
                
                // Salva no cache
                solicitacoesCache = {
                    key: cacheKey,
                    data: response.data,
                    timestamp: agora
                };
                ultimaBuscaSolicitacoes = agora;
                
                setSolicitacoes(response.data);
                setSelectedMaterials({});
            } catch (err) {
                console.error(err);
                setError("Erro ao buscar dados");
            } finally {
                setLoadingSolicitacao(false);
            }
        };

        fetchData();
    }, [groupBy]);

    // Salva preferência do groupBy
    useEffect(() => {
        sessionStorage.setItem("groupBy_preference", groupBy);
    }, [groupBy]);

    // ======================================
    // Funções Modais com useCallback
    // ======================================

    const handleOpenJustificativa = useCallback(async (item) => {
        try {
            const codCompra = item.cod_compra || item["Codigo"];
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/historico/${codCompra}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setSelectedItem(response.data);
            setOpenJustificativa(true);
        } catch (error) {
            console.error("Erro ao buscar histórico:", error);
        }
    }, []);

    const handleOpenApprovalModal = useCallback((item, status) => {
        setApprovalItem(item);
        setApprovalStatus(status);
        setApprovalJustificativa("");
        setApprovalModalOpen(true);
    }, []);

    const handleCloseApprovalModal = useCallback(() => {
        setApprovalItem(null);
        setApprovalStatus(null);
        setApprovalJustificativa("");
        setApprovalModalOpen(false);
    }, []);

    const handleSubmitApproval = useCallback(async () => {
        if (!approvalJustificativa.trim()) {
            showSnackbar("Informe uma justificativa para continuar.");
            return;
        }
        try {
            setLoading(true);
            const camposAceite = {
                2: { aceite: "aceite_material", justificativa: "justificativa_material", matricula: "matricula_material" },
                3: { aceite: "aceite_compra", justificativa: "justificativa_compra", matricula: "matricula_compra" },
                4: { aceite: "aceite_diretor", justificativa: "justificativa_diretor", matricula: "matricula_diretor" },
                5: { aceite: "aceite_diretor", justificativa: "justificativa_diretor", matricula: "matricula_diretor" },
                6: { aceite: "aceite_diretor", justificativa: "justificativa_diretor", matricula: "matricula_diretor" },
                7: { aceite: "aceite_gerente", justificativa: "justificativa_gerente", matricula: "matricula_gerente" }
            };
            const campos = camposAceite[nivelAcesso];
            if (!campos) {
                showSnackbar("Permissão inválida para atualizar esta solicitação.");
                return;
            }

            const payload = {
                cod_compra: approvalItem.cod_compra || approvalItem["Codigo"],
                cod_cotacao: approvalItem.cod_cotacao,
                [campos.aceite]: approvalStatus,
                [campos.justificativa]: approvalJustificativa,
                [campos.matricula]: localStorage.getItem("matricula")
            };
            await axios.put(`${import.meta.env.VITE_API_URL}/aprovarcompra`, payload, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            showSnackbar("Decisão registrada com sucesso!");
            handleCloseApprovalModal();
            // Limpa cache após ação
            solicitacoesCache = null;
            window.location.reload();
        } catch (error) {
            console.error(error.response?.data || error.message);
            showSnackbar("Erro ao registrar decisão!");
        } finally {
            setLoading(false);
        }
    }, [approvalItem, approvalJustificativa, approvalStatus, nivelAcesso, handleCloseApprovalModal, showSnackbar]);

    const handleOpenBackProcess = useCallback(async (item) => {
        try {
            setLoading(true);
            const codCompra = item.cod_compra || item["Codigo"];
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/retornos/${codCompra}`, {
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
    }, []);

    const handleCloseBackProcess = useCallback(() => {
        setBackItem(null);
        setBackProcessOpen(false);
    }, []);

    const handleSubmitRetorno = useCallback(async () => {
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
                cod_compra: backItem.cod_compra || backItem["Codigo"],
                setor_destino: selectedBackLevel,
                justificativa: justificativaVolta
            };
            await axios.put(`${import.meta.env.VITE_API_URL}/retornarprocesso`, payload, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            showSnackbar("Solicitação retornada com sucesso!");
            handleCloseBackProcess();
            solicitacoesCache = null;
            window.location.reload();
        } catch (error) {
            console.error(error.response?.data || error.message);
            showSnackbar("Erro ao retornar solicitação!");
        } finally {
            setLoading(false);
        }
    }, [backItem, selectedBackLevel, justificativaVolta, handleCloseBackProcess, showSnackbar]);

    const handleOpenReturnModal = useCallback(async (codCompra) => {
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
    }, [showSnackbar]);

    const handleCloseReturnModal = useCallback(() => {
        setReturnData([]);
        setReturnComment("");
        setReturnModalOpen(false);
    }, []);

    const handleSubmitFinalizarRetorno = useCallback(async (codigos) => {
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
            solicitacoesCache = null;
            window.location.reload();
        } catch (error) {
            console.error(error.response?.data || error.message);
            showSnackbar("Erro ao registrar resposta!");
        } finally {
            setLoading(false);
        }
    }, [returnComment, handleCloseReturnModal, showSnackbar]);

    const handleOpenItens = useCallback(async (item) => {
        setSelectedItem(item);
        setOpenItens(true);
        setLoadingItensAgrupados(true);

        const codMaterial = item['Código'] || item.cod_material;
        const agora = Date.now();
        
        // Verifica cache
        if (itensAgrupadosCache[codMaterial] && 
            (agora - (itensAgrupadosCache[codMaterial].timestamp || 0)) < TEMPO_CACHE) {
            setItensAgrupados(itensAgrupadosCache[codMaterial].data);
            setLoadingItensAgrupados(false);
            return;
        }

        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/itens_agrupados`, {
                params: { cod_material: codMaterial },
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            const data = response.data.data || [];
            
            // Salva no cache
            itensAgrupadosCache[codMaterial] = {
                data: data,
                timestamp: agora
            };
            
            setItensAgrupados(data);
        } catch (error) {
            console.error(error);
            showSnackbar("Erro ao carregar itens agrupados");
            setItensAgrupados([]);
        } finally {
            setLoadingItensAgrupados(false);
        }
    }, [showSnackbar]);

    const handleCloseItens = useCallback(() => {
        setOpenItens(false);
        setSelectedItem(null);
    }, []);

    const handleViewCotacao = useCallback(async (item) => {
        try {
            const codCotacao = item.cod_cotacao;
            if (!codCotacao) {
                showSnackbar("Nenhuma cotação encontrada para este item.");
                return;
            }

            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/cotacao/${codCotacao}`,
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );

            const rawData = response.data;
            if (rawData && rawData.length > 0) {
                const cotacoesExistentes = {};
                const slots = ["Fornecedor I", "Fornecedor II", "Fornecedor III", "Fornecedor IV", "Fornecedor V"];

                rawData.forEach((cotacao) => {
                    if (!cotacoesExistentes[cotacao.cod_material]) {
                        cotacoesExistentes[cotacao.cod_material] = {
                            ultima_compra: cotacao.ultima_compra || 0,
                            media_historica: cotacao.media_historica || 0,
                            media_6_meses: cotacao.media_6_meses || 0,
                            fornecedores: []
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
                        datasParcelas: JSON.parse(cotacao.datasParcelas || '[]').map(d => d.dias || ""),
                    });
                });

                Object.keys(cotacoesExistentes).forEach((cod_material) => {
                    const materialData = cotacoesExistentes[cod_material];
                    materialData.fornecedores.forEach((fornData, index) => {
                        if (index < slots.length) materialData[slots[index]] = fornData;
                    });
                    delete materialData.fornecedores;
                });

                const materiais = [...new Map(
                    rawData.map(item => [
                        item.cod_material,
                        {
                            cod_material: item.cod_material,
                            descricao: item.descricao || item.cod_material,
                            quantidade: item.quantidade || 1,
                            unid: item.unid || "UN",
                        },
                    ])
                ).values()];

                const summary = {};
                rawData.forEach(item => {
                    const key = `Fornecedor ${item.fornecedor_id}`;
                    const quantidade = item.quantidade || 1;
                    summary[key] = (summary[key] || 0) + item.preco * quantidade;
                });

                navigate("CotarCompra/preview", {
                    state: {
                        materiais,
                        cotacoes: cotacoesExistentes,
                        summary,
                        cod_compra: item.cod_compra || item["Codigo"]
                    }
                });
            }
        } catch (error) {
            console.error("Erro ao buscar cotação:", error);
            showSnackbar("Erro ao carregar cotação.");
        }
    }, [navigate, showSnackbar]);

    // ======================================
    // Configurações da Tabela (com useMemo para performance)
    // ======================================

    const tituloTabela = useMemo(() => {
        if (nivelAcesso === 3) return "Realizar Cotações";
        if (nivelAcesso > 3 && nivelAcesso !== 7) return "Aprovar Cotação";
        return "Aprovar Solicitações";
    }, [nivelAcesso]);

    let hiddenIndexes = useMemo(() => {
        let indexes = groupBy === 'cod_material'
            ? [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]
            : [2, 4, 5, 6, 7, 8, 9, 10];

        indexes = indexes.filter((index) => {
            if (userLevel === 3) return index !== 3 && index !== 4;
            if ([4, 5, 6].includes(userLevel)) return index !== 3 && index !== 4 && index !== 5;
            return true;
        });

        if (['4', '5', '6'].includes(userLevel)) {
            indexes = [5, 6, 7, 8, 9, 10, 11];
        }
        return indexes;
    }, [groupBy, userLevel]);

    const actionColumnName = useMemo(() => {
        return [2, 4, 5, 6].includes(nivelAcesso)
            ? "Aprovar"
            : nivelAcesso === 3 ? "Realizar Cotação" : "Ações";
    }, [nivelAcesso]);

    const opcoesParaUsuario = useMemo(() => {
        return niveisUsuarios.filter((u) => {
            if (userLevel === 7) return u.nivel === 1;
            if (userLevel >= 2 && userLevel <= 6) {
                return u.nivel < userLevel || u.nivel === 7;
            }
            return false;
        });
    }, [userLevel]);

    const niveisOrdenados = useMemo(() => {
        const ordemDesejada = [1, 7, 2, 3, 4, 5, 6];
        return [...opcoesParaUsuario].sort((a, b) => 
            ordemDesejada.indexOf(a.nivel) - ordemDesejada.indexOf(b.nivel)
        );
    }, [opcoesParaUsuario]);

    // Construção da tabela com useMemo
    const dataWithActions = useMemo(() => {
        return solicitacoes.map((item) => {
            const uniqueKey = getUniqueKey(item);
            const isSelected = !!selectedMaterials[uniqueKey];

            return {
                ...item,
                'Ver Detalhes': (
                    <Tooltip title="Visualizar">
                        <IconButton size="small" color="primary" onClick={() => navigate(`../DetalhesCompra/${item["Codigo"] || item.cod_compra}`)}>
                            <FiEye />
                        </IconButton>
                    </Tooltip>
                ),
                'Ver Itens': (
                    <Tooltip title="Visualizar">
                        <IconButton size="small" color="primary" onClick={() => navigate(`../ver-itens/${item["Codigo"] || item.cod_compra}`)}>
                            <FiEye />
                        </IconButton>
                    </Tooltip>
                ),
                ...(groupBy !== 'cod_material' && nivelAcesso > 3 && nivelAcesso !== 7 && {
                    "Aprovar Cotação": (
                        <Tooltip title="Visualizar">
                            <IconButton size="small" color="primary" onClick={() => handleViewCotacao(item)}>
                                <FiEye />
                            </IconButton>
                        </Tooltip>
                    )
                }),
                ...(groupBy !== 'cod_compra' && {
                    "Ver Solicitação": (
                        <Box display="flex" height="100%" alignItems="center" gap={1}>
                            <Tooltip title="Visualizar">
                                <IconButton size="small" color="primary" onClick={() => handleOpenItens(item)}>
                                    <FiEye />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    ),
                }),
                ...(groupBy !== 'cod_material' && {
                    Perguntar: item.resposta_destino ? (
                        <Tooltip title="Processo Respondido">
                            <IconButton size="small" sx={{ color: "success.main" }} onClick={() => handleOpenReturnModal(item["Codigo"] || item.cod_compra)}>
                                <FiCheck />
                            </IconButton>
                        </Tooltip>
                    ) : item.status == null ? (
                        <Tooltip title="Voltar Processo">
                            <IconButton size="small" color="primary" onClick={() => handleOpenBackProcess(item)}>
                                <FiArrowLeft />
                            </IconButton>
                        </Tooltip>
                    ) : (
                        <Tooltip title="Ver Justificativa de Retorno">
                            <IconButton size="small" sx={{ color: "warning.main" }} onClick={() => handleOpenReturnModal(item["Codigo"] || item.cod_compra)}>
                                <FiAlertTriangle />
                            </IconButton>
                        </Tooltip>
                    )
                }),
                ...(![4, 5, 6].includes(nivelAcesso) && groupBy === 'cod_compra' && {
                    [actionColumnName]: nivelAcesso === 3 ? (
                        groupBy === 'cod_compra' ? (
                            <Button onClick={() => navigate(`./CotarCompra/${item.cod_compra || item["Codigo"]}`)} variant="contained" color="success" fullWidth>
                                <FiSend />
                            </Button>
                        ) : null
                    ) : item.finalizado == null && item.status == null ? (
                        <Box display="flex" gap={1}>
                            <Button variant="contained" color="success" onClick={() => handleOpenApprovalModal(item, 1)}>
                                <FiCheck />
                            </Button>
                            <Button variant="contained" color="error" onClick={() => handleOpenApprovalModal(item, 0)}>
                                <FiX />
                            </Button>
                        </Box>
                    ) : item.status != null ? (
                        <Box display="flex" gap={1}>
                            <Button variant="contained" color="success" disabled><FiCheck /></Button>
                            <Button variant="contained" color="error" disabled><FiX /></Button>
                        </Box>
                    ) : (
                        <Button variant="contained" color="success">Aprovado pelo CFO</Button>
                    )
                }),
                ...(nivelAcesso == 2 && {
                    "Checado": (
                        <>
                            <Checkbox
                                checked={item['checado']}
                                onChange={() => handleSelectMaterial(item)}
                                size="small"
                            />
                            <span>{item['checado'] ? "checado" : "não checado"}</span>
                        </>
                    )
                }),
                ...(groupBy === 'cod_material' && nivelAcesso === 3 && {
                    "Selecionar": (
                        <Checkbox
                            checked={isSelected}
                            onChange={() => handleSelectMaterial(item)}
                            size="small"
                        />
                    )
                }),
                ...(nivelAcesso === 3 && {
                    "Enviar Cotação": (
                        <Button
                            onClick={() => handleOpenModalEnvio(item)}
                            variant="contained"
                            color="primary"
                            fullWidth
                        >
                            <FiSend />
                        </Button>
                    )
                }),
            };
        });
    }, [solicitacoes, groupBy, nivelAcesso, selectedMaterials, getUniqueKey, navigate, 
        handleViewCotacao, handleOpenItens, handleOpenReturnModal, handleOpenBackProcess,
        handleOpenApprovalModal, handleSelectMaterial, handleOpenModalEnvio, actionColumnName]);

    const selectedCount = Object.keys(selectedMaterials).filter(key => key !== 'all' && selectedMaterials[key]).length;

    return (
        <div>
            <Card>
                <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h5">{tituloTabela}</Typography>
                        <Box display="flex" gap={2} alignItems="center">
                            {groupBy === 'cod_material' && nivelAcesso === 3 && (
                                <>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={handleSelectAll}
                                    >
                                        {selectedMaterials.all ? "Desmarcar Todos" : "Selecionar Todos"}
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        startIcon={<FiPlus />}
                                        onClick={handleGroupCotacoes}
                                        disabled={selectedCount < 2}
                                    >
                                        Agrupar Cotações ({selectedCount})
                                    </Button>
                                </>
                            )}
                            {nivelAcesso === 3 && (
                                <FormControl variant="outlined" sx={{ minWidth: 200 }}>
                                    <InputLabel id="groupby-label">Agrupar por</InputLabel>
                                    <Select
                                        labelId="groupby-label"
                                        value={groupBy}
                                        onChange={(e) => setGroupBy(e.target.value)}
                                        label="Agrupar por"
                                    >
                                        <MenuItem value="cod_compra">Pedidos</MenuItem>
                                        <MenuItem value="cod_material">Materiais</MenuItem>
                                    </Select>
                                </FormControl>
                            )}
                        </Box>
                    </Box>

                    <DataGrid
                        data={dataWithActions || []}
                        loading={loadingSolicitacao}
                        error={error}
                        hiddenIndexes={hiddenIndexes}
                        initialPageSize={10}
                    />
                </CardContent>
            </Card>

            {/* MODAIS - Mantidos iguais ao original */}
            {/* ... (todos os modais permanecem iguais) ... */}
            
            {/* Modal Envio */}
            <Dialog open={modalEnvioOpen} onClose={handleCloseModalEnvio} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box display="flex" alignItems="center" gap={1}>
                        <FiSend />
                        Enviar Cotação - {cotacaoParaEnviar?.cod_compra || cotacaoParaEnviar?.["Codigo"]}
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                        <DialogContentText>
                            Selecione os fornecedores para participar desta cotação:
                        </DialogContentText>

                        <FormControl fullWidth disabled={loadingFornecedores}>
                            <InputLabel id="fornecedor1-label">
                                {loadingFornecedores ? 'Carregando...' : 'Fornecedores Recomendados'}
                            </InputLabel>
                            <Select
                                labelId="fornecedor1-label"
                                multiple
                                value={selectedFornecedor1}
                                onChange={(e) => setSelectedFornecedor1(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                                input={<OutlinedInput label="Fornecedores Recomendados" />}
                                renderValue={(selected) => selected.join(', ')}
                                MenuProps={MenuProps}
                            >
                                {fornecedores.recomendados?.map((fornecedor) => {
                                    const nome = fornecedor.nome_fantasia || fornecedor.nome || fornecedor.id;
                                    const selected = selectedFornecedor1.includes(nome);
                                    return (
                                        <MenuItem key={nome} value={nome}>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                {selected ? <FiCheckSquare style={{ color: '#1976d2', fontSize: 20 }} /> : <FiSquare style={{ fontSize: 20 }} />}
                                                <ListItemText primary={nome} />
                                            </Box>
                                        </MenuItem>
                                    );
                                })}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth disabled={loadingFornecedores}>
                            <InputLabel id="fornecedor2-label">
                                {loadingFornecedores ? 'Carregando...' : 'Todos os Fornecedores'}
                            </InputLabel>
                            <Select
                                labelId="fornecedor2-label"
                                multiple
                                value={selectedFornecedor2}
                                onChange={(e) => setSelectedFornecedor2(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                                input={<OutlinedInput label="Todos os Fornecedores" />}
                                renderValue={(selected) => selected.join(', ')}
                                MenuProps={MenuProps}
                            >
                                {fornecedores.todos?.map((fornecedor) => {
                                    const nome = fornecedor.nome_fantasia || fornecedor.nome || fornecedor.id;
                                    const selected = selectedFornecedor2.includes(nome);
                                    return (
                                        <MenuItem key={nome} value={nome}>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                {selected ? <FiCheckSquare style={{ color: '#1976d2', fontSize: 20 }} /> : <FiSquare style={{ fontSize: 20 }} />}
                                                <ListItemText primary={nome} />
                                            </Box>
                                        </MenuItem>
                                    );
                                })}
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseModalEnvio} color="inherit">Cancelar</Button>
                    <Button onClick={handleConfirmarEnvio} variant="contained" color="primary" startIcon={<FiSend />}>Confirmar</Button>
                </DialogActions>
            </Dialog>

            {/* Loading Backdrop */}
            <Backdrop open={loading} sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <CircularProgress color="inherit" />
            </Backdrop>

            {/* Snackbar */}
            <CustomSnackbar open={snackbarOpen} onClose={handleSnackbarClose} message={snackbarMessage} />

            {/* Modal Justificativa */}
            <Modal open={openJustificativa} onClose={() => setOpenJustificativa(false)}>
                <Box sx={{ p: 4, maxWidth: 700, mx: "auto", bgcolor: "background.paper", borderRadius: 3, boxShadow: 3 }}>
                    {selectedItem && (
                        <>
                            <Typography variant="h5" mb={3} fontWeight="bold" color="primary.main" textAlign="center">
                                Histórico da Solicitação
                            </Typography>
                            {selectedItem.length > 0 ? (
                                selectedItem.map((evento, index) => (
                                    <Paper key={index} elevation={1} sx={{ p: 3, mb: 2.5, borderRadius: 2, borderLeft: "5px solid", borderColor: "primary.light", bgcolor: "grey.50" }}>
                                        <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                                            {evento.tipo} - {evento.etapa}
                                        </Typography>
                                        <Typography variant="body2" mb={1}><strong>Data:</strong> {evento.data}</Typography>
                                        <Typography variant="body2" mb={1}><strong>Responsável:</strong> {evento.responsavel_nome} ({evento.responsavel_matricula})</Typography>
                                        <Typography variant="body2" sx={{ whiteSpace: "pre-line", color: "text.secondary" }}>{evento.detalhes}</Typography>
                                    </Paper>
                                ))
                            ) : (
                                <Typography textAlign="center" color="text.secondary">Nenhum histórico encontrado.</Typography>
                            )}
                            <Box display="flex" justifyContent="center" mt={3}>
                                <Button variant="contained" color="primary" onClick={() => setOpenJustificativa(false)}>Fechar</Button>
                            </Box>
                        </>
                    )}
                </Box>
            </Modal>

            {/* Modal Aprovação */}
            <Modal open={approvalModalOpen} title={approvalStatus === 1 ? "Aprovar Solicitação" : "Reprovar Solicitação"} onClose={handleCloseApprovalModal}>
                <Box display="flex" flexDirection="column" gap={2}>
                    <Typography>
                        {`Você está prestes a ${approvalStatus === 1 ? "aprovar" : "reprovar"} a solicitação `}
                        <strong>{approvalItem?.['Cod. Compra'] || approvalItem?.cod_compra}</strong>
                    </Typography>
                    <TextField
                        label="Justificativa"
                        multiline
                        rows={4}
                        fullWidth
                        value={approvalJustificativa}
                        onChange={(e) => setApprovalJustificativa(e.target.value)}
                        placeholder="Informe o motivo da decisão"
                    />
                    <Box display="flex" justifyContent="flex-end" gap={2} mt={1}>
                        <Button variant="outlined" onClick={handleCloseApprovalModal}>Cancelar</Button>
                        <Button variant="contained" color={approvalStatus === 1 ? "success" : "error"} onClick={handleSubmitApproval}>Confirmar</Button>
                    </Box>
                </Box>
            </Modal>

            {/* Modal Voltar Processo */}
            <Modal open={backProcessOpen} title="Retornar Processo" onClose={handleCloseBackProcess}>
                <Box display="flex" flexDirection="column" gap={2} p={2}>
                    {returnData.length !== 0 ? (
                        returnData.map((item, index) => (
                            <Fragment key={index}>
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
                            </Fragment>
                        ))
                    ) : (
                        <>
                            <Typography>Para quem você deseja retornar o processo?</Typography>
                            <Select size="small" sx={{ minWidth: 200 }} value={selectedBackLevel} onChange={(e) => setSelectedBackLevel(e.target.value)}>
                                <MenuItem value=""><em>Selecione</em></MenuItem>
                                {niveisOrdenados.map(u => (<MenuItem key={u.nivel} value={u.nivel}>{u.nome}</MenuItem>))}
                            </Select>
                            <TextField
                                label="Justificativa"
                                value={justificativaVolta}
                                onChange={(e) => setJustificativaVolta(e.target.value)}
                                multiline
                                rows={4}
                                fullWidth
                                placeholder="Digite a justificativa da alteração..."
                            />
                            <Box display="flex" justifyContent="flex-end" gap={2} mt={1}>
                                <Button variant="outlined" onClick={handleCloseBackProcess}>Cancelar</Button>
                                <Button variant="contained" onClick={handleSubmitRetorno}>Confirmar</Button>
                            </Box>
                        </>
                    )}
                </Box>
            </Modal>

            {/* Modal Justificativa de Retorno */}
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
                        <Button variant="contained" color="primary" onClick={() => handleSubmitFinalizarRetorno(returnData.map(item => item.cod_compra).join(','))}>Salvar resposta</Button>
                    </Box>
                </Box>
            </Modal>

            {/* Modal Itens */}
            <Modal open={openItens} onClose={handleCloseItens}>
                <Box sx={{ p: 4, maxWidth: 600, mx: "auto", bgcolor: "background.paper", borderRadius: 3, boxShadow: 3, maxHeight: 600, display: 'flex', flexDirection: 'column' }}>
                    {selectedItem && (
                        <>
                            <Box>
                                <Typography variant="h6" mb={2} textAlign="center">Item - {selectedItem['Código'] || selectedItem.cod_material}</Typography>
                                <Typography variant="subtitle1" mb={2} textAlign="center">
                                    Total do Item - {itensAgrupados.length > 0 ? itensAgrupados[0].total_quantidade : 0}
                                </Typography>
                            </Box>
                            <Box sx={{ overflowY: 'auto', flexGrow: 1, my: 2 }}>
                                {loadingItensAgrupados ? (
                                    <Box display="flex" justifyContent="center" my={2}><CircularProgress size={24} /></Box>
                                ) : itensAgrupados.length === 0 ? (
                                    <Typography textAlign="center" color="text.secondary">Nenhum item encontrado.</Typography>
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
                                <Button variant="contained" color="primary" onClick={handleCloseItens}>Fechar</Button>
                            </Box>
                        </>
                    )}
                </Box>
            </Modal>
        </div>
    );
}