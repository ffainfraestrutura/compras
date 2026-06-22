import axios from "axios";
import { useEffect, useState, useMemo } from "react";
import {
    Backdrop,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Grid,
    Typography,
    Chip,
    IconButton,
    InputAdornment,
    TextField,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Switch,
    FormControlLabel,
    Collapse,
    Divider,
    Radio,
    RadioGroup,
    FormControl,
    FormLabel,
    Alert
} from "@mui/material";
import {
    FiCheck,
    FiAlertTriangle,
    FiXOctagon,
    FiShoppingCart,
    FiFileText,
    FiRefreshCw,
    FiSave,
    FiSearch,
    FiChevronDown,
    FiChevronUp,
    FiUsers,
    FiDollarSign,
    FiSend,
    FiInfo
} from "react-icons/fi";
import { MdHistory } from "react-icons/md";
import { BsBoxSeam } from "react-icons/bs";
import CustomSnackbar from "../../../components/SnackBar/SnackBar";

// --- CONFIGURAÇÃO DA API ---
const API_URL = import.meta.env.VITE_API_URL;

// Helper seguro para números
const safeParseFloat = (value) => {
    if (value === undefined || value === null) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const cleanValue = value.replace(/[^\d,-]/g, '').replace(',', '.');
        const number = parseFloat(cleanValue);
        return isNaN(number) ? 0 : number;
    }
    return 0;
};

const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(safeParseFloat(value));
};

// --- LINHA DA TABELA (Sub-componente) ---
function RowResult({ row, fornecedorEscolhido, onSelecionarFornecedor }) {
    const [open, setOpen] = useState(false);

    const getStatusChip = () => {
        if (row.status === "FORNECEDOR_ERRADO") return <Chip icon={<FiXOctagon />} label="Fornecedor Err." color="error" size="small" />;
        if (row.status === "EXCEDENTE") return <Chip icon={<FiXOctagon />} label="Qtd Maior" color="error" size="small" />;
        if (row.status === "PRECO_DIVERGENTE") return <Chip icon={<FiDollarSign />} label="Preço Maior" color="error" size="small" />;
        if (row.status === "PARCIAL") return <Chip icon={<FiAlertTriangle />} label="Qtd Menor" color="warning" size="small" />;
        return <Chip icon={<FiCheck />} label="OK" color="success" size="small" variant="outlined" />;
    };

    // Verifica se há múltiplos fornecedores no pedido
    const temMultiplosFornecedores = row.fornecedoresPedido && row.fornecedoresPedido.length > 1;
    const fornecedorSelecionado = fornecedorEscolhido[row.sku];

    return (
        <>
            <TableRow hover sx={{ '& > *': { borderBottom: 'unset' }, bgcolor: row.status === "FORNECEDOR_ERRADO" ? '#ffebee' : 'inherit' }}>
                <TableCell>
                    <IconButton size="small" onClick={() => setOpen(!open)}>
                        {open ? <FiChevronUp /> : <FiChevronDown />}
                    </IconButton>
                </TableCell>
                <TableCell component="th" scope="row">
                    <Typography variant="caption" fontWeight="bold">{row.sku}</Typography>
                    <Typography variant="caption" display="block" noWrap sx={{ maxWidth: 150 }}>{row.produto}</Typography>
                    {!row.fornecedorMatch && (
                        <Typography variant="caption" color="error" fontWeight="bold">Diverg. CNPJ</Typography>
                    )}
                    {temMultiplosFornecedores && !fornecedorSelecionado && (
                        <Typography variant="caption" color="warning" fontWeight="bold" display="block">
                            Selecione o fornecedor
                        </Typography>
                    )}
                </TableCell>

                {/* DADOS PEDIDO */}
                <TableCell align="center" sx={{ bgcolor: '#e3f2fd20' }}>{row.qtdPedido}</TableCell>
                <TableCell align="right" sx={{ bgcolor: '#e3f2fd20' }}>{formatCurrency(row.valUnitPedido)}</TableCell>
                <TableCell align="right" sx={{ bgcolor: '#e3f2fd20', fontWeight: 'bold' }}>{formatCurrency(row.valTotalPedido)}</TableCell>

                {/* DADOS NOTA */}
                <TableCell align="center" sx={{ bgcolor: '#fff3e020' }}>{row.qtdNota}</TableCell>
                <TableCell align="right" sx={{ bgcolor: '#fff3e020' }}>{formatCurrency(row.valUnitNota)}</TableCell>
                <TableCell align="right" sx={{ bgcolor: '#fff3e020', fontWeight: 'bold' }}>{formatCurrency(row.valTotalNota)}</TableCell>

                <TableCell align="center" sx={{ fontWeight: 'bold', color: row.deltaQtd !== 0 ? (row.deltaQtd > 0 ? 'error.main' : 'warning.main') : 'success.main' }}>
                    {row.deltaQtd > 0 ? `+${row.deltaQtd}` : row.deltaQtd}
                </TableCell>

                <TableCell align="right" sx={{ fontWeight: 'bold', color: row.deltaValor > 0.01 ? 'error.main' : (row.deltaValor < -0.01 ? 'success.main' : 'text.primary') }}>
                    {row.deltaValor > 0 ? '+' : ''}{formatCurrency(row.deltaValor)}
                </TableCell>

                <TableCell align="center">{getStatusChip()}</TableCell>
            </TableRow>

            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={11}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 2, p: 2, bgcolor: '#f8f9fa', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                            <Grid container spacing={2}>
                                {/* Análise Financeira */}
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" gutterBottom>Análise Financeira</Typography>
                                    <Box p={2} border="1px dashed #bdbdbd" borderRadius={1}>
                                        <Typography variant="body2" display="flex" justifyContent="space-between">
                                            <span>Esperado (Pedido):</span> <strong>{formatCurrency(row.valTotalPedido)}</strong>
                                        </Typography>
                                        <Typography variant="body2" display="flex" justifyContent="space-between" mt={1}>
                                            <span>Realizado (Nota):</span> <strong>{formatCurrency(row.valTotalNota)}</strong>
                                        </Typography>
                                        <Divider sx={{ my: 1 }} />
                                        <Typography variant="body2" display="flex" justifyContent="space-between" color={row.deltaValor > 0 ? 'error.main' : 'success.main'} fontWeight="bold">
                                            <span>Diferença:</span>
                                            <span>{formatCurrency(row.deltaValor)}</span>
                                        </Typography>
                                    </Box>
                                </Grid>

                                {/* Fornecedores do Pedido com Seleção Manual */}
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Fornecedores do Pedido
                                        {temMultiplosFornecedores && (
                                            <Chip size="small" label="Múltiplos" color="warning" sx={{ ml: 1 }} />
                                        )}
                                    </Typography>
                                    <Box p={2} border="1px dashed #bdbdbd" borderRadius={1}>
                                        {row.fornecedoresPedido && row.fornecedoresPedido.length > 0 ? (
                                            <FormControl component="fieldset" fullWidth>
                                                {temMultiplosFornecedores && (
                                                    <FormLabel component="legend" sx={{ fontSize: '0.75rem', mb: 1 }}>
                                                        Selecione o fornecedor correto:
                                                    </FormLabel>
                                                )}
                                                <RadioGroup
                                                    value={fornecedorSelecionado || ''}
                                                    onChange={(e) => onSelecionarFornecedor(row.sku, e.target.value)}
                                                >
                                                    {row.fornecedoresPedido.map((forn, idx) => (
                                                        <Box
                                                            key={idx}
                                                            display="flex"
                                                            alignItems="center"
                                                            justifyContent="space-between"
                                                            mb={1}
                                                            pb={1}
                                                            borderBottom={idx < row.fornecedoresPedido.length - 1 ? '1px solid #eee' : 'none'}
                                                        >
                                                            <Box display="flex" alignItems="center">
                                                                <Radio
                                                                    value={forn.cnpj}
                                                                    size="small"
                                                                    disabled={!temMultiplosFornecedores} // se não houver múltiplos, não precisa selecionar
                                                                />
                                                                <Box>
                                                                    <Typography variant="body2" fontWeight="bold">
                                                                        {forn.nome || 'Fornecedor não informado'}
                                                                    </Typography>
                                                                    <Typography variant="caption" color="textSecondary">
                                                                        {forn.cnpj || ''}
                                                                    </Typography>
                                                                </Box>
                                                            </Box>
                                                            {forn.cnpj === row.fornecedorNotaCNPJ && (
                                                                <Chip label="NF" size="small" color="info" sx={{ height: 20, fontSize: '0.65rem' }} />
                                                            )}
                                                        </Box>
                                                    ))}
                                                </RadioGroup>
                                            </FormControl>
                                        ) : (
                                            <Typography variant="caption" color="textSecondary">
                                                Nenhum fornecedor vinculado a este pedido.
                                            </Typography>
                                        )}
                                    </Box>
                                </Grid>

                                {/* Fornecedores Cotados (já existente) */}
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" gutterBottom>Fornecedores Cotados</Typography>
                                    <Box p={2} border="1px dashed #bdbdbd" borderRadius={1} maxHeight={150} overflow="auto">
                                        {row.cotacoes && row.cotacoes.length > 0 ? (
                                            row.cotacoes.map((cot, idx) => (
                                                <Box
                                                    key={idx}
                                                    display="flex"
                                                    justifyContent="space-between"
                                                    alignItems="center"
                                                    mb={1}
                                                    pb={1}
                                                    borderBottom={idx < row.cotacoes.length - 1 ? '1px solid #eee' : 'none'}
                                                >
                                                    <Box>
                                                        <Typography variant="body2" fontWeight="bold">
                                                            {cot.fornecedor_nome || 'Fornecedor não informado'}
                                                        </Typography>
                                                        <Typography variant="caption" color="textSecondary">
                                                            {cot.fornecedor_cnpj || ''}
                                                        </Typography>
                                                    </Box>
                                                    <Box textAlign="right">
                                                        <Typography variant="body2" fontWeight="bold">
                                                            {formatCurrency(cot.valor_unitario || 0)}
                                                        </Typography>
                                                        <Typography variant="caption" color="textSecondary">
                                                            {cot.prazo_entrega ? `Entrega: ${cot.prazo_entrega} dias` : ''}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            ))
                                        ) : (
                                            <Typography variant="caption" color="textSecondary">
                                                Nenhuma cotação encontrada para este material.
                                            </Typography>
                                        )}
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
}

// --- COMPONENTE PRINCIPAL ---
export default function AssociacaoNotasReal() {
    const [pedidosDisponiveis, setPedidosDisponiveis] = useState([]);
    const [notasDisponiveis, setNotasDisponiveis] = useState([]);
    const [loading, setLoading] = useState(false);

    const [codigosCompraSelecionados, setCodigosCompraSelecionados] = useState([]);
    const [notasSelecionadas, setNotasSelecionadas] = useState([]);
    const [notificarGestorSaldo, setNotificarGestorSaldo] = useState(true);

    // Estado para armazenar o fornecedor escolhido manualmente por SKU
    const [fornecedorEscolhido, setFornecedorEscolhido] = useState({});

    const [searchPedido, setSearchPedido] = useState("");
    const [searchNota, setSearchNota] = useState("");

    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarType, setSnackbarType] = useState("success");

    // --- BUSCA DE DADOS (GET) ---
    const fetchDados = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`${API_URL}/associacao/dados`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setPedidosDisponiveis(response.data.data.pedidos || []);
                setNotasDisponiveis(response.data.data.notas || []);
            }
        } catch (error) {
            console.error("Erro ao buscar dados:", error);
            setSnackbarMessage("Erro ao carregar pedidos e notas. Verifique a conexão.");
            setSnackbarType("error");
            setSnackbarOpen(true);
        } finally {
            setLoading(false);
        }
    };

    // Carrega ao iniciar
    useEffect(() => {
        fetchDados();
    }, []);

    // --- LÓGICA DE CÁLCULO (Local) ---
    const conciliacao = useMemo(() => {
        // 1. Filtra os arrays originais pelos IDs selecionados
        const pedidosFiltrados = pedidosDisponiveis.filter(p => codigosCompraSelecionados.includes(p.codigo_compra));
        const notasFiltradas = notasDisponiveis.filter(n => notasSelecionadas.includes(n.id));

        // 2. Lista única de SKUs
        const todosSkus = new Set([
            ...pedidosFiltrados.map(p => p.sku),
            ...notasFiltradas.flatMap(n => n.itens.map(i => i.sku))
        ]);

        const resultado = [];
        let statusGeral = "APROVADO";
        let totalPedidos = 0;
        let totalNotas = 0;

        todosSkus.forEach(sku => {
            // Agrupa dados do Pedido
            const itensPed = pedidosFiltrados.filter(p => p.sku === sku);
            const qtdPedido = itensPed.reduce((acc, curr) => acc + safeParseFloat(curr.qtd), 0);
            const valTotalPed = itensPed.reduce((acc, curr) => acc + (safeParseFloat(curr.qtd) * safeParseFloat(curr.valor_unitario)), 0);
            totalPedidos += valTotalPed;

            // Agrupa dados da Nota
            const itensNota = notasFiltradas.flatMap(n => n.itens).filter(i => i.sku === sku);
            const qtdNota = itensNota.reduce((acc, curr) => acc + safeParseFloat(curr.qtd), 0);
            const valTotalNota = itensNota.reduce((acc, curr) => acc + (safeParseFloat(curr.qtd) * safeParseFloat(curr.valor_unitario)), 0);
            totalNotas += valTotalNota;

            const unitarioNota = qtdNota > 0 ? valTotalNota / qtdNota : 0;
            const unitarioPedido = qtdPedido > 0 ? valTotalPed / qtdPedido : 0;

            // Cálculos
            const deltaQtd = qtdNota - qtdPedido;
            const deltaValor = valTotalNota - valTotalPed;

            // --- NOVO: Extrair lista de fornecedores dos pedidos (sem duplicatas) ---
            const fornecedoresMap = new Map();
            itensPed.forEach(item => {
                if (item.fornecedor_cnpj && !fornecedoresMap.has(item.fornecedor_cnpj)) {
                    fornecedoresMap.set(item.fornecedor_cnpj, {
                        cnpj: item.fornecedor_cnpj,
                        nome: item.fornecedor_nome || 'Fornecedor não informado'
                    });
                }
            });
            const fornecedoresPedido = Array.from(fornecedoresMap.values());

            // --- LÓGICA DE FORNECEDOR MATCH considerando a escolha manual ---
            const fornecedorEscolhidoParaSku = fornecedorEscolhido[sku];
            const fornecedorPedCNPJ = fornecedorEscolhidoParaSku || (itensPed[0]?.fornecedor_cnpj);
            const fornecedorPedNome = itensPed[0]?.fornecedor_nome;

            // Cotações de todos os pedidos
            const cotacoesItem = itensPed.flatMap(p => p.cotacoes || []);

            // Acha a nota de origem deste item
            const notaOrigem = notasFiltradas.find(n => n.itens.some(i => i.sku === sku));
            const fornecedorNotaCNPJ = notaOrigem?.fornecedor_cnpj;
            const fornecedorNotaNome = notaOrigem?.fornecedor_nome;

            // Se tem pedido e tem nota, os CNPJs devem bater (usando o escolhido ou o primeiro)
            const fornecedorMatch = (!fornecedorPedCNPJ || !fornecedorNotaCNPJ) ? true : (fornecedorPedCNPJ === fornecedorNotaCNPJ);

            const nomeProduto = itensPed[0]?.produto || itensNota[0]?.produto || "Produto Desconhecido";

            let statusItem = "OK";

            // Só processa se houver item em algum dos lados
            if (qtdPedido > 0 || qtdNota > 0) {
                if (!fornecedorMatch) {
                    statusItem = "FORNECEDOR_ERRADO";
                } else if (Math.abs(deltaQtd) > 0.01) {
                    if (deltaQtd > 0) {
                        statusItem = "EXCEDENTE";
                    } else {
                        statusItem = "PARCIAL";
                    }
                } else if (Math.abs(unitarioNota - unitarioPedido) > 0.01) {
                    statusItem = "PRECO_DIVERGENTE";
                }

                resultado.push({
                    sku,
                    produto: nomeProduto,
                    qtdPedido,
                    valUnitPedido: unitarioPedido,
                    valTotalPedido: valTotalPed,
                    qtdNota,
                    valUnitNota: unitarioNota,
                    valTotalNota: valTotalNota,
                    deltaQtd,
                    deltaValor,
                    fornecedorPedido: fornecedorPedNome,
                    fornecedorNota: fornecedorNotaNome,
                    fornecedorNotaCNPJ, // para uso no front
                    fornecedorMatch,
                    fornecedoresPedido, // lista para seleção manual
                    cotacoes: cotacoesItem,
                    status: statusItem,
                    cod_material: sku
                });
            }
        });

        // LÓGICA DO STATUS GERAL
        const temItemDiretoria = resultado.some(item =>
            item.status === "FORNECEDOR_ERRADO" ||
            item.status === "EXCEDENTE" ||
            item.status === "PRECO_DIVERGENTE"
        );

        const temItemGestor = resultado.some(item => item.status === "PARCIAL");

        if (temItemDiretoria) {
            statusGeral = "DIRETORIA";
        } else if (temItemGestor && notificarGestorSaldo) {
            statusGeral = "GESTOR";
        } else {
            statusGeral = "APROVADO";
        }

        return { itens: resultado, statusFinal: statusGeral, totalPedidos, totalNotas };
    }, [pedidosDisponiveis, notasDisponiveis, codigosCompraSelecionados, notasSelecionadas, notificarGestorSaldo, fornecedorEscolhido]);

    // --- HANDLERS ---
    const toggleCodigoCompra = (codigo) => {
        setCodigosCompraSelecionados(prev => prev.includes(codigo) ? prev.filter(c => c !== codigo) : [...prev, codigo]);
        // Ao mudar pedidos, resetar escolhas de fornecedor (opcional, para evitar escolhas órfãs)
        setFornecedorEscolhido({});
    };

    const toggleNota = (id) => {
        setNotasSelecionadas(prev => prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]);
        // Resetar escolhas ao mudar notas também (opcional)
        setFornecedorEscolhido({});
    };

    const handleSelecionarFornecedor = (sku, cnpj) => {
        setFornecedorEscolhido(prev => ({ ...prev, [sku]: cnpj }));
    };

    // --- ENVIO DE DADOS (POST) ---
    const handleSubmit = async () => {
        if (codigosCompraSelecionados.length === 0) {
            setSnackbarMessage("Selecione pelo menos um pedido de compra");
            setSnackbarType("warning");
            setSnackbarOpen(true);
            return;
        }

        if (notasSelecionadas.length === 0) {
            setSnackbarMessage("Selecione pelo menos uma nota fiscal");
            setSnackbarType("warning");
            setSnackbarOpen(true);
            return;
        }

        // Verificar se há itens com múltiplos fornecedores sem seleção
        const itensSemSelecao = conciliacao.itens.filter(item =>
            item.fornecedoresPedido && item.fornecedoresPedido.length > 1 && !fornecedorEscolhido[item.sku]
        );
        if (itensSemSelecao.length > 0) {
            setSnackbarMessage("Existem itens com múltiplos fornecedores. Selecione um fornecedor para cada antes de prosseguir.");
            setSnackbarType("warning");
            setSnackbarOpen(true);
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem("token");

            const payload = {
                itens_conciliados: conciliacao.itens,
                status_sugerido: conciliacao.statusFinal,
                flg_notificar_gestor: notificarGestorSaldo,
                ids_pedidos_compra: codigosCompraSelecionados,
                ids_notas_fiscais: notasSelecionadas
            };

            const response = await axios.post(`${API_URL}/associacao/confirmar`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setSnackbarMessage("Associação salva com sucesso!");
                setSnackbarType("success");
                setSnackbarOpen(true);

                setCodigosCompraSelecionados([]);
                setNotasSelecionadas([]);
                setFornecedorEscolhido({});
                fetchDados();
            }

        } catch (error) {
            console.error("Erro ao salvar:", error);
            setSnackbarMessage(
                error.response?.data?.message ||
                "Erro ao salvar associação. Tente novamente."
            );
            setSnackbarType("error");
            setSnackbarOpen(true);
        } finally {
            setLoading(false);
        }
    };

    // --- FILTROS VISUAIS ---
    const pedidosAgrupados = Object.values(pedidosDisponiveis.reduce((acc, curr) => {
        if (!acc[curr.codigo_compra]) acc[curr.codigo_compra] = [];
        acc[curr.codigo_compra].push(curr);
        return acc;
    }, {})).filter(grupo => {
        const termo = searchPedido.toLowerCase();
        const codigo = String(grupo[0].codigo_compra).toLowerCase();
        const fornecedor = String(grupo[0].fornecedor_nome || "").toLowerCase();
        return codigo.includes(termo) || fornecedor.includes(termo);
    });

    const notasFiltradasList = notasDisponiveis.filter(nota => {
        const termo = searchNota.toLowerCase();
        const numero = String(nota.numero).toLowerCase();
        const fornecedor = String(nota.fornecedor_nome || "").toLowerCase();
        return numero.includes(termo) || fornecedor.includes(termo);
    });

    const getStatusColor = (status) => {
        switch (status) {
            case "DIRETORIA": return "error";
            case "GESTOR": return "warning";
            case "APROVADO": return "success";
            default: return "default";
        }
    };

    const getActionButton = () => {
        switch (conciliacao.statusFinal) {
            case "DIRETORIA":
                return (
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={handleSubmit}
                        disabled={conciliacao.itens.length === 0 || loading}
                        startIcon={<FiSend />}
                    >
                        Enviar para Diretoria
                    </Button>
                );
            case "GESTOR":
                return (
                    <Button
                        variant="contained"
                        color="warning"
                        onClick={handleSubmit}
                        disabled={conciliacao.itens.length === 0 || loading}
                        startIcon={<BsBoxSeam />}
                    >
                        Enviar para Gestor
                    </Button>
                );
            case "APROVADO":
            default:
                return (
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSubmit}
                        disabled={conciliacao.itens.length === 0 || loading}
                        startIcon={loading ? <CircularProgress size={20} /> : <FiSave />}
                    >
                        {loading ? "Processando..." : "Confirmar Relacionamento"}
                    </Button>
                );
        }
    };

    return (
        <Box sx={{ p: 3, bgcolor: '#f4f6f8', minHeight: '100vh' }}>

            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h5" color="textPrimary" fontWeight="bold">Relacionamento Fiscal</Typography>
                    <Typography variant="body2" color="textSecondary">Conferência de Pedidos, Notas e Cotações</Typography>
                </Box>
            </Box>

            {/* PAINEL SUPERIOR: RECONCILIAÇÃO */}
            <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
                {/* RESUMO */}
                <Grid container spacing={4} alignItems="center" mb={3}>
                    <Grid item xs={12} md={5}>
                        <Box sx={{ p: 2, bgcolor: '#e3f2fd', borderRadius: 2, border: '1px solid #90caf9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box display="flex" alignItems="center" gap={2}>
                                <Box sx={{ bgcolor: 'white', p: 1, borderRadius: '50%' }}><FiShoppingCart color="#1976d2" /></Box>
                                <Box>
                                    <Typography variant="caption" color="primary" fontWeight="bold">PEDIDOS</Typography>
                                    <Typography variant="h6">{codigosCompraSelecionados.length} <span style={{ fontSize: '0.8rem', color: '#666' }}>selecionados</span></Typography>
                                </Box>
                            </Box>
                            <Typography variant="subtitle1" fontWeight="bold">{formatCurrency(conciliacao.totalPedidos)}</Typography>
                        </Box>
                    </Grid>

                    <Grid item xs={12} md={2} display="flex" justifyContent="center">
                        <Chip label="VS" sx={{ fontWeight: 'bold' }} />
                    </Grid>

                    <Grid item xs={12} md={5}>
                        <Box sx={{ p: 2, bgcolor: '#f3e5f5', borderRadius: 2, border: '1px solid #ce93d8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box display="flex" alignItems="center" gap={2}>
                                <Box sx={{ bgcolor: 'white', p: 1, borderRadius: '50%' }}><FiFileText color="#9c27b0" /></Box>
                                <Box>
                                    <Typography variant="caption" color="secondary" fontWeight="bold">NOTAS FISCAIS</Typography>
                                    <Typography variant="h6">{notasSelecionadas.length} <span style={{ fontSize: '0.8rem', color: '#666' }}>selecionadas</span></Typography>
                                </Box>
                            </Box>
                            <Typography variant="subtitle1" fontWeight="bold">{formatCurrency(conciliacao.totalNotas)}</Typography>
                        </Box>
                    </Grid>
                </Grid>

                {/* TABELA DE RESULTADO */}
                <TableContainer component={Paper} variant="outlined" sx={{ mb: 3, maxHeight: 400 }}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ width: 40 }} />
                                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Material</TableCell>

                                <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: '#e3f2fd', color: '#1565c0' }}>Qtd Ped</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: '#e3f2fd', color: '#1565c0' }}>Unit.</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: '#e3f2fd', color: '#1565c0' }}>Total</TableCell>

                                <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: '#fff3e0', color: '#e65100' }}>Qtd NF</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: '#fff3e0', color: '#e65100' }}>Unit.</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: '#fff3e0', color: '#e65100' }}>Total</TableCell>

                                <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Dif. Qtd</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Dif. R$</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {conciliacao.itens.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={11} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                        Selecione pedidos e notas para iniciar a conciliação.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                conciliacao.itens.map((row) => (
                                    <RowResult
                                        key={row.sku}
                                        row={row}
                                        fornecedorEscolhido={fornecedorEscolhido}
                                        onSelecionarFornecedor={handleSelecionarFornecedor}
                                    />
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* ACTIONS */}
                <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                    <Box display="flex" alignItems="center" gap={2}>
                        <Typography variant="body2" fontWeight="bold">Encaminhamento:</Typography>
                        <Chip
                            label={conciliacao.statusFinal === "DIRETORIA" ? "Aprovação Diretoria" : conciliacao.statusFinal === "GESTOR" ? "Notificar Gestor" : "Concluir Entrada"}
                            color={getStatusColor(conciliacao.statusFinal)}
                            variant="filled"
                        />
                    </Box>
                    <Box display="flex" alignItems="center" gap={3}>
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            p: 1.5,
                            bgcolor: conciliacao.itens.some(item => item.status !== "OK") ? '#ffebee' : '#e8f5e9',
                            borderRadius: 1,
                            border: `1px solid ${conciliacao.itens.some(item => item.status !== "OK") ? '#ffcdd2' : '#c8e6c9'}`
                        }}>
                            <FiInfo color={conciliacao.itens.some(item => item.status !== "OK") ? '#f44336' : '#4caf50'} />
                            <Typography variant="body2" sx={{
                                color: conciliacao.itens.some(item => item.status !== "OK") ? '#f44336' : '#4caf50'
                            }}>
                                {conciliacao.itens.some(item => item.status !== "OK")
                                    ? "Divergência detectada. Verifique os itens acima."
                                    : "Todos os itens estão OK!"}
                            </Typography>
                        </Box>

                        <Box sx={{ border: '1px dashed #bdbdbd', borderRadius: 1, px: 2, py: 0.5 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={notificarGestorSaldo}
                                        onChange={(e) => setNotificarGestorSaldo(e.target.checked)}
                                        size="small"
                                        color="warning"
                                    />
                                }
                                label={<Typography variant="caption">Notificar Gestor se faltar item?</Typography>}
                            />
                        </Box>

                        <Button
                            variant="outlined"
                            onClick={() => {
                                setCodigosCompraSelecionados([]);
                                setNotasSelecionadas([]);
                                setFornecedorEscolhido({});
                            }}
                            sx={{
                                color: 'text.secondary'
                            }}
                        >
                            Cancelar
                        </Button>

                        {getActionButton()}
                    </Box>
                </Box>
            </Paper>

            {/* LISTAS LADO A LADO */}
            <Grid container spacing={3} sx={{ height: 550 }}>
                {/* LISTA PEDIDOS */}
                <Grid item xs={12} md={6} sx={{ height: '100%', width: '48%' }}>
                    <Paper variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#fcfcfc' }}>
                        <Box p={2} borderBottom="1px solid #eee">
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <Box display="flex" alignItems="center" gap={1}>
                                    <FiShoppingCart color="#1976d2" />
                                    <Typography variant="subtitle1" fontWeight="bold">Pedidos de Compra</Typography>
                                </Box>
                                <Chip label={pedidosAgrupados.length} size="small" />
                            </Box>
                            <TextField
                                fullWidth size="small" placeholder="Buscar Pedido, Fornecedor..."
                                value={searchPedido} onChange={(e) => setSearchPedido(e.target.value)}
                                InputProps={{ startAdornment: <InputAdornment position="start"><FiSearch color="gray" /></InputAdornment>, sx: { bgcolor: 'white' } }}
                            />
                        </Box>
                        <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
                            {pedidosAgrupados.length === 0 ? (
                                <Typography variant="caption" display="block" align="center" mt={4}>Nenhum pedido encontrado.</Typography>
                            ) : (
                                pedidosAgrupados.map((grupo, idx) => {
                                    const codigo = grupo[0].codigo_compra;
                                    const isSelected = codigosCompraSelecionados.includes(codigo);
                                    const totalGrupo = grupo.reduce((acc, curr) => acc + (safeParseFloat(curr.qtd) * safeParseFloat(curr.valor_unitario)), 0);
                                    return (
                                        <Card key={idx} variant="outlined" onClick={() => toggleCodigoCompra(codigo)} sx={{ mb: 1.5, cursor: 'pointer', borderColor: isSelected ? 'primary.main' : 'divider', bgcolor: isSelected ? 'primary.50' : 'white', '&:hover': { borderColor: 'primary.light' } }}>
                                            <CardContent sx={{ pb: '16px !important', pt: 1.5 }}>
                                                <Box display="flex" justifyContent="space-between">
                                                    <Typography fontWeight="bold" color={isSelected ? 'primary' : 'inherit'}>{codigo}</Typography>
                                                    <Typography variant="caption" color="textSecondary">{grupo[0].fornecedor_nome}</Typography>
                                                </Box>
                                                <Box display="flex" justifyContent="space-between" mt={0.5}>
                                                    <Typography variant="caption">{grupo.length} itens</Typography>
                                                    <Typography variant="body2" fontWeight="bold">{formatCurrency(totalGrupo)}</Typography>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    )
                                })
                            )}
                        </Box>
                    </Paper>
                </Grid>

                {/* LISTA NOTAS */}
                <Grid item xs={12} md={6} sx={{ height: '100%', width: '49%' }}>
                    <Paper variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#fcfcfc' }}>
                        <Box p={2} borderBottom="1px solid #eee">
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <Box display="flex" alignItems="center" gap={1}>
                                    <FiFileText color="#9c27b0" />
                                    <Typography variant="subtitle1" fontWeight="bold">Notas Fiscais</Typography>
                                </Box>
                                <Chip label={notasFiltradasList.length} size="small" />
                            </Box>
                            <TextField
                                fullWidth size="small" placeholder="Buscar NF, Fornecedor..."
                                value={searchNota} onChange={(e) => setSearchNota(e.target.value)}
                                InputProps={{ startAdornment: <InputAdornment position="start"><FiSearch color="gray" /></InputAdornment>, sx: { bgcolor: 'white' } }}
                            />
                        </Box>
                        <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
                            {notasFiltradasList.length === 0 ? (
                                <Typography variant="caption" display="block" align="center" mt={4}>Nenhuma nota encontrada.</Typography>
                            ) : (
                                notasFiltradasList.map((nota) => {
                                    const isSelected = notasSelecionadas.includes(nota.id);
                                    const totalNota = nota.itens.reduce((acc, curr) => acc + (safeParseFloat(curr.qtd) * safeParseFloat(curr.valor_unitario)), 0);
                                    return (
                                        <Card key={nota.id} variant="outlined" onClick={() => toggleNota(nota.id)} sx={{ mb: 1.5, cursor: 'pointer', borderColor: isSelected ? 'secondary.main' : 'divider', bgcolor: isSelected ? 'secondary.50' : 'white', '&:hover': { borderColor: 'secondary.light' } }}>
                                            <CardContent sx={{ pb: '16px !important', pt: 1.5 }}>
                                                <Box display="flex" justifyContent="space-between">
                                                    <Typography fontWeight="bold" color={isSelected ? 'secondary' : 'inherit'}>NF {nota.numero}</Typography>
                                                    <Typography variant="caption" color="textSecondary">{nota.fornecedor_nome}</Typography>
                                                </Box>
                                                <Box display="flex" justifyContent="space-between" mt={0.5}>
                                                    <Chip label="XML" size="small" sx={{ height: 20, fontSize: '0.65rem' }} />
                                                    <Typography variant="body2" fontWeight="bold">{formatCurrency(totalNota)}</Typography>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    )
                                })
                            )}
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            <Backdrop open={loading} sx={{ color: '#fff', zIndex: 9999 }}><CircularProgress color="inherit" /></Backdrop>

            <CustomSnackbar
                open={snackbarOpen}
                onClose={() => setSnackbarOpen(false)}
                message={snackbarMessage}
                severity={snackbarType}
            />
        </Box>
    );
}