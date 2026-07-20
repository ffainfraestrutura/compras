// components/DrawerDetalhes/DrawerDetalhes.jsx
import { useState, useEffect, useMemo } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Collapse,
    Divider,
    Drawer,
    IconButton,
    TextField,
    Typography,
} from "@mui/material";
import { FiArrowLeft, FiCheck, FiX, FiChevronDown, FiChevronUp } from "react-icons/fi";
import axios from "axios";

// Cache global fora do componente (persiste entre renderizações)
let filaAprovacaoCache = null;
let ultimaBuscaCache = 0;
const TEMPO_CACHE = 30000; // 30 segundos

// ─── HistoricoTimeline ────────────────────────────────────────────────────────
function HistoricoTimeline({ codCompra }) {
    const [historico, setHistorico] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!codCompra) return;
        setLoading(true);
        axios
            .get(`${import.meta.env.VITE_API_URL}/historico/${codCompra}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            })
            .then((res) => {
                const data = res.data;
                if (Array.isArray(data)) setHistorico(data);
                else if (data?.historico) setHistorico(data.historico);
                else setHistorico([]);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [codCompra]);

    if (loading)
        return (
            <Box display="flex" justifyContent="center" py={2}>
                <CircularProgress size={18} />
            </Box>
        );

    if (!historico?.length)
        return (
            <Typography variant="body2" color="text.secondary">
                Nenhum histórico encontrado.
            </Typography>
        );

    const getDotColor = (evento) => {
        const t = [evento.tipo || "", evento.etapa || "", evento.status || ""]
            .join(" ")
            .toLowerCase();
        if (t.includes("recus") || t.includes("reprov")) return "error.main";
        if (t.includes("aprov")) return "success.main";
        return "primary.main";
    };

    return (
        <Box>
            {historico.map((evento, index) => {
                const isLast = index === historico.length - 1;
                return (
                    <Box key={index} display="flex" gap={1.5}>
                        <Box display="flex" flexDirection="column" alignItems="center">
                            <Box
                                sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: "50%",
                                    bgcolor: getDotColor(evento),
                                    mt: "4px",
                                    flexShrink: 0,
                                }}
                            />
                            {!isLast && (
                                <Box
                                    sx={{
                                        width: "1px",
                                        flex: 1,
                                        bgcolor: "divider",
                                        my: "4px",
                                        minHeight: 16,
                                    }}
                                />
                            )}
                        </Box>
                        <Box pb={isLast ? 0 : 2} flex={1}>
                            <Typography variant="body2" fontWeight={500} lineHeight={1.3}>
                                {evento.tipo || "Evento"}
                                {evento.etapa ? ` — ${evento.etapa}` : ""}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {evento.data || evento.data_hora
                                    ? new Date(
                                        evento.data || evento.data_hora
                                    ).toLocaleDateString("pt-BR")
                                    : ""}
                                {evento.responsavel_nome
                                    ? ` · ${evento.responsavel_nome}`
                                    : ""}
                            </Typography>
                            {evento.detalhes && (
                                <Box
                                    sx={{
                                        mt: 0.75,
                                        p: 1,
                                        bgcolor: "grey.100",
                                        borderRadius: 1,
                                    }}
                                >
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ lineHeight: 1.6 }}
                                    >
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusInfo(item) {
    if (!item) return { label: "Carregando...", color: "default", paradoEm: null };

    if (item.status == 0)
        return { label: "Cancelado", color: "error", paradoEm: null };
    if (item.entregue == "1")
        return { label: "Material Recebido", color: "success", paradoEm: null };
    if (item.finalizado == "1")
        return { label: "Material Comprado", color: "success", paradoEm: null };
    if (item.aceite_diretor == "1")
        return { label: "Aprovado pela Diretoria", color: "primary", paradoEm: null };

    if (item.aceite_gerente === 0)
        return { label: "Reprovado", color: "error", paradoEm: "Gerente" };
    if (item.aceite_material === 0)
        return { label: "Reprovado", color: "error", paradoEm: "Gestor Material" };
    if (item.aceite_compra === 0)
        return { label: "Reprovado", color: "error", paradoEm: "Compras" };
    if (item.aceite_diretor == 0)
        return { label: "Reprovado", color: "error", paradoEm: "Diretoria" };

    if (item.aceite_gerente === null)
        return { label: "Aguardando", color: "warning", paradoEm: "Gerente" };
    if (item.aceite_material === null)
        return { label: "Aguardando", color: "warning", paradoEm: "Gestor Material" };
    if (item.aceite_compra === null)
        return { label: "Aguardando", color: "warning", paradoEm: "Cotação" };
    if (item.aceite_diretor === null)
        return { label: "Aguardando", color: "warning", paradoEm: "Diretoria" };

    return { label: "Aguardando", color: "warning", paradoEm: "Desconhecido" };
}

function parseItens(item) {
    const descricao =
        item["descrição"] ||
        item["descricao"] ||
        item["descricao_material"] ||
        item["Materiais"];

    if (!descricao) return [];
    if (typeof descricao === "string" && descricao.includes(","))
        return descricao.split(",").map((d) => ({ descricao: d.trim() }));
    if (Array.isArray(descricao)) return descricao.map((d) => ({ descricao: d }));
    return [{ descricao }];
}

// ─── Mapa: nivelAcesso → qual campo do item indica que É a vez dele ──────────
const NIVEL_CONFIG = {
    1: {
        campo: "aceite_gerente",
        aceiteKey: "aceite_gerente",
        justificativaKey: "justificativa_gerente",
        matriculaKey: "matricula_gerente",
        label: "Gerente",
    },
    2: {
        campo: "aceite_material",
        aceiteKey: "aceite_material",
        justificativaKey: "justificativa_material",
        matriculaKey: "matricula_material",
        label: "Gestor Material",
    },
};

// ─── Painel de Aprovação (simplificado, sem cache próprio) ───────────────────
function AprovacaoPanel({ item, onSuccess, onError, filaAprovacao, carregandoFila }) {
    const nivelAcesso = Number(localStorage.getItem("nivel_acesso"));
    const isPerfilAutorizado = nivelAcesso === 1 || nivelAcesso === 2;
    const config = NIVEL_CONFIG[nivelAcesso];
    const codCompra = item["Cod. Compra"] ?? item["cod_compra"];

    // TODOS OS HOOKS NO TOPO
    const [aberto, setAberto] = useState(false);
    const [decisao, setDecisao] = useState(null);
    const [justificativa, setJustificativa] = useState("");
    const [loading, setLoading] = useState(false);

    // Verifica se o item está na fila (usando os dados já carregados)
    const itemNaFila = useMemo(() => {
        if (!filaAprovacao || !Array.isArray(filaAprovacao)) return false;
        return filaAprovacao.some(
            (s) => String(s.cod_compra ?? s["Codigo"]) === String(codCompra)
        );
    }, [filaAprovacao, codCompra]);

    // SÓ DEPOIS DE TODOS OS HOOKS É QUE FAZEMOS OS RETORNS CONDICIONAIS
    if (!isPerfilAutorizado || !config) return null;
    
    // Mostra loading apenas enquanto carrega pela primeira vez
    if (carregandoFila && !filaAprovacao) return (
        <Card variant="outlined" sx={{ flexShrink: 0, borderColor: "warning.main" }}>
            <CardContent>
                <Box display="flex" alignItems="center" gap={1}>
                    <CircularProgress size={20} />
                    <Typography variant="body2" color="warning.dark">
                        Verificando pendências...
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
    
    if (!itemNaFila) return null;

    // Funções auxiliares
    const handleAbrir = (valor) => {
        setDecisao(valor);
        setJustificativa("");
        setAberto(true);
    };

    const handleCancelar = () => {
        setAberto(false);
        setDecisao(null);
        setJustificativa("");
    };

    const handleConfirmar = async () => {
        if (!justificativa.trim()) {
            onError("Informe uma justificativa para continuar.");
            return;
        }
        try {
            setLoading(true);
            const payload = {
                cod_compra: codCompra,
                cod_cotacao: item.cod_cotacao,
                [config.aceiteKey]: decisao,
                [config.justificativaKey]: justificativa,
                [config.matriculaKey]: localStorage.getItem("matricula"),
            };
            await axios.put(
                `${import.meta.env.VITE_API_URL}/aprovarcompra`,
                payload,
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );
            onSuccess(decisao === 1 ? "Solicitação aprovada com sucesso!" : "Solicitação reprovada.");
            handleCancelar();
        } catch (err) {
            console.error(err);
            onError(err.response?.data?.message || "Erro ao registrar decisão.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card
            variant="outlined"
            sx={{
                flexShrink: 0,
                borderColor: aberto
                    ? decisao === 1 ? "success.main" : "error.main"
                    : "warning.main",
                transition: "border-color 0.2s",
            }}
        >
            <CardContent sx={{ pb: "12px !important" }}>
                <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    mb={aberto ? 1.5 : 0}
                >
                    <Box>
                        <Typography variant="subtitle2" fontWeight={600} color="warning.dark">
                            ⏳ Aguardando sua aprovação
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {config.label}
                        </Typography>
                    </Box>

                    {!aberto && (
                        <Box display="flex" gap={1}>
                            <Button
                                variant="contained" 
                                color="success" 
                                size="small"
                                startIcon={<FiCheck />}
                                onClick={() => handleAbrir(1)}
                                sx={{ minWidth: 100 }}
                            >
                                Aprovar
                            </Button>
                            <Button
                                variant="contained" 
                                color="error" 
                                size="small"
                                startIcon={<FiX />}
                                onClick={() => handleAbrir(0)}
                                sx={{ minWidth: 100 }}
                            >
                                Reprovar
                            </Button>
                        </Box>
                    )}

                    {aberto && (
                        <IconButton size="small" onClick={handleCancelar}>
                            <FiChevronUp />
                        </IconButton>
                    )}
                </Box>

                <Collapse in={aberto}>
                    <Divider sx={{ mb: 1.5 }} />
                    <Typography variant="body2" mb={1} fontWeight={500}>
                        {decisao === 1 ? "✅ Confirmar aprovação" : "❌ Confirmar reprovação"}
                    </Typography>
                    <TextField
                        label="Justificativa"
                        multiline 
                        rows={3} 
                        fullWidth 
                        size="small"
                        value={justificativa}
                        onChange={(e) => setJustificativa(e.target.value)}
                        placeholder="Informe o motivo da decisão..."
                        sx={{ mb: 1.5 }}
                    />
                    <Box display="flex" gap={1} justifyContent="flex-end">
                        <Button 
                            variant="outlined" 
                            size="small" 
                            onClick={handleCancelar} 
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="contained" 
                            size="small"
                            color={decisao === 1 ? "success" : "error"}
                            onClick={handleConfirmar}
                            disabled={loading}
                            startIcon={
                                loading
                                    ? <CircularProgress size={14} color="inherit" />
                                    : decisao === 1 ? <FiCheck /> : <FiX />
                            }
                        >
                            {loading ? "Enviando..." : "Confirmar"}
                        </Button>
                    </Box>
                </Collapse>
            </CardContent>
        </Card>
    );
}

// ─── DrawerDetalhes ───────────────────────────────────────────────────────────
const DrawerDetalhes = ({ open, onClose, item, onAprovacaoSuccess }) => {
    const [itens, setItens] = useState([]);
    const [snackMsg, setSnackMsg] = useState("");
    const [filaAprovacao, setFilaAprovacao] = useState(null);
    const [carregandoFila, setCarregandoFila] = useState(false);

    // Carrega a fila de aprovação ANTES do drawer abrir
    useEffect(() => {
        const nivelAcesso = Number(localStorage.getItem("nivel_acesso"));
        const isPerfilAutorizado = nivelAcesso === 1 || nivelAcesso === 2;
        
        if (!isPerfilAutorizado) return;

        const agora = Date.now();
        
        // Usa cache se ainda estiver válido
        if (filaAprovacaoCache && (agora - ultimaBuscaCache) < TEMPO_CACHE) {
            setFilaAprovacao(filaAprovacaoCache);
            return;
        }

        // Busca a fila em background
        const fetchFila = async () => {
            if (carregandoFila) return;
            
            setCarregandoFila(true);
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/aprovarcompra`,
                    { 
                        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                        timeout: 5000
                    }
                );
                const lista = Array.isArray(response.data) ? response.data : [];
                
                // Atualiza cache global
                filaAprovacaoCache = lista;
                ultimaBuscaCache = agora;
                setFilaAprovacao(lista);
            } catch (error) {
                console.error("Erro ao buscar fila:", error);
                filaAprovacaoCache = [];
                setFilaAprovacao([]);
            } finally {
                setCarregandoFila(false);
            }
        };

        fetchFila();
    }, [open]);

    useEffect(() => {
        if (item) setItens(parseItens(item));
    }, [item]);

    if (!item) return null;

    const statusInfo = getStatusInfo(item);
    const codCompra = item["Cod. Compra"] ?? item["cod_compra"];

    const handleSuccess = (msg) => {
        setSnackMsg(msg);
        // Limpa o cache após uma aprovação/reprovação
        filaAprovacaoCache = null;
        if (onAprovacaoSuccess) onAprovacaoSuccess();
        setTimeout(() => {
            setSnackMsg("");
            onClose();
        }, 1500);
    };

    const handleError = (msg) => setSnackMsg(msg);

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    width: { xs: "100%", sm: 420 },
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                },
            }}
        >
            {/* ── Header ── */}
            <Box
                sx={{
                    p: 2.5,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    flexShrink: 0,
                }}
            >
                <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                >
                    <Box display="flex" alignItems="center" gap={1.5}>
                        <IconButton size="small" onClick={onClose}>
                            <FiArrowLeft />
                        </IconButton>
                        <Box>
                            <Typography variant="h6" fontWeight={500}>
                                Detalhes da Compra
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                #{codCompra}
                            </Typography>
                        </Box>
                    </Box>
                    <Chip
                        label={`${statusInfo.label}${statusInfo.paradoEm
                                ? ` - ${statusInfo.paradoEm}`
                                : ""
                            }`}
                        color={statusInfo.color}
                        size="small"
                        sx={{ fontWeight: 500 }}
                    />
                </Box>
            </Box>

            {/* ── Conteúdo ── */}
            <Box
                sx={{
                    flex: 1,
                    overflowY: "auto",
                    p: 2.5,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                }}
            >
                {/* Feedback inline */}
                {snackMsg && (
                    <Box
                        sx={{
                            p: 1.5,
                            borderRadius: 1,
                            bgcolor: snackMsg.toLowerCase().includes("erro")
                                ? "error.lighter"
                                : "success.lighter",
                            border: "1px solid",
                            borderColor: snackMsg.toLowerCase().includes("erro")
                                ? "error.light"
                                : "success.light",
                        }}
                    >
                        <Typography
                            variant="body2"
                            color={
                                snackMsg.toLowerCase().includes("erro")
                                    ? "error.dark"
                                    : "success.dark"
                            }
                            fontWeight={500}
                        >
                            {snackMsg}
                        </Typography>
                    </Box>
                )}

                {/* ── Painel de Aprovação ── */}
                <AprovacaoPanel
                    item={item}
                    onSuccess={handleSuccess}
                    onError={handleError}
                    filaAprovacao={filaAprovacao}
                    carregandoFila={carregandoFila}
                />

                {/* ── Dados da Compra ── */}
                <Card variant="outlined" sx={{ flexShrink: 0 }}>
                    <CardContent>
                        <Typography
                            variant="subtitle2"
                            fontWeight={600}
                            color="primary"
                            gutterBottom
                        >
                            📋 Dados da Compra
                        </Typography>
                        <Divider sx={{ mb: 1.5 }} />
                        <Box display="flex" flexDirection="column" gap={1.5}>
                            {[
                                { label: "Código", value: codCompra },
                                {
                                    label: "Solicitante",
                                    value:
                                        item["Solicitante"] ??
                                        item["solicitante"] ??
                                        "N/A",
                                },
                                {
                                    label: "Data",
                                    value:
                                        item["Solicitação"] ??
                                        item["Data da Solicitação"] ??
                                        "N/A",
                                },
                                {
                                    label: "Filial",
                                    value:
                                        item["Filial"] ??
                                        item["filial"] ??
                                        "N/A",
                                },
                            ].map(({ label, value }) => (
                                <Box key={label}>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{
                                            textTransform: "uppercase",
                                            letterSpacing: "0.04em",
                                        }}
                                    >
                                        {label}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        fontWeight={500}
                                        sx={{ mt: 0.25 }}
                                    >
                                        {value}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </CardContent>
                </Card>

                {/* ── Itens ── */}
                <Card variant="outlined" sx={{ flexShrink: 0 }}>
                    <CardContent sx={{ pb: "12px !important" }}>
                        <Typography
                            variant="subtitle2"
                            fontWeight={600}
                            color="primary"
                            gutterBottom
                        >
                            📦 Itens
                        </Typography>
                        <Divider sx={{ mb: 1.5 }} />
                        <Box
                            sx={{
                                maxHeight: 140,
                                overflowY: "auto",
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 1,
                                pr: 0.5,
                                "&::-webkit-scrollbar": { width: 4 },
                                "&::-webkit-scrollbar-thumb": {
                                    bgcolor: "divider",
                                    borderRadius: 2,
                                },
                            }}
                        >
                            {itens.length === 0 ? (
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    Nenhum item encontrado.
                                </Typography>
                            ) : (
                                itens.map((it, index) => (
                                    <Chip
                                        key={index}
                                        label={
                                            it.descricao || `Item ${index + 1}`
                                        }
                                        variant="outlined"
                                        size="small"
                                    />
                                ))
                            )}
                        </Box>
                    </CardContent>
                </Card>

                {/* ── Histórico ── */}
                <Card variant="outlined" sx={{ flexShrink: 0 }}>
                    <CardContent sx={{ pb: "12px !important" }}>
                        <Typography
                            variant="subtitle2"
                            fontWeight={600}
                            color="primary"
                            gutterBottom
                        >
                            📜 Histórico
                        </Typography>
                        <Divider sx={{ mb: 1.5 }} />
                        <Box
                            sx={{
                                maxHeight: 260,
                                overflowY: "auto",
                                pr: 0.5,
                                "&::-webkit-scrollbar": { width: 4 },
                                "&::-webkit-scrollbar-thumb": {
                                    bgcolor: "divider",
                                    borderRadius: 2,
                                },
                            }}
                        >
                            <HistoricoTimeline codCompra={codCompra} />
                        </Box>
                    </CardContent>
                </Card>
            </Box>

            {/* ── Footer ── */}
            <Box
                sx={{
                    p: 2,
                    borderTop: "1px solid",
                    borderColor: "divider",
                    flexShrink: 0,
                }}
            >
                <Button variant="outlined" fullWidth onClick={onClose}>
                    Fechar
                </Button>
            </Box>
        </Drawer>
    );
};

export default DrawerDetalhes;