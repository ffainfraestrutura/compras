import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import axios from "axios";
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
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Collapse,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiFile,
  FiFileText,
  FiXCircle,
  FiCheck,
  FiX,
  FiChevronUp,
} from "react-icons/fi";
import useDetalhesTodasSolicitacoes from "../../../hooks/useDetalhesTodasSolicitacoes";
import CustomSnackbar from "../../../components/SnackBar/SnackBar";

// ─── Constantes ───────────────────────────────────────────────────────────────
const TEMPO_CACHE = 30_000; // 30 segundos
const NIVEIS_PERMITIDOS = [2, 1];

const NIVEL_CONFIG = {
  1: {
    aceiteKey: "aceite_gerente",
    justificativaKey: "justificativa_gerente",
    matriculaKey: "matricula_gerente",
    label: "Gerente",
  },
  2: {
    aceiteKey: "aceite_material",
    justificativaKey: "justificativa_material",
    matriculaKey: "matricula_material",
    label: "Gestor Material",
  },
};

// ─── Helpers (fora do componente — não recriam a cada render) ─────────────────

function formatarDataBR(data) {
  if (!data) return "N/A";
  try {
    const d = new Date(data);
    if (isNaN(d.getTime())) return "N/A";
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  } catch {
    return "N/A";
  }
}

function formatCurrency(value) {
  const num = parseFloat(value);
  if (isNaN(num)) return "R$ 0,00";
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatBytes(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function nivelPermitido() {
  const nivel = parseInt(localStorage.getItem("nivel_acesso") ?? "0", 10);
  return NIVEIS_PERMITIDOS.includes(nivel);
}

function extColor(ext) {
  const map = {
    pdf: "#e53935",
    doc: "#1565c0", docx: "#1565c0",
    xls: "#2e7d32", xlsx: "#2e7d32",
    jpg: "#6a1b9a", jpeg: "#6a1b9a", png: "#6a1b9a",
  };
  return map[(ext || "").toLowerCase()] || "#455a64";
}

function processarCotacao(rawData) {
  if (!rawData || rawData.length === 0) return null;

  const fornecedoresUnicos = new Map();
  rawData.forEach((cotacao) => {
    if (!fornecedoresUnicos.has(cotacao.fornecedor_id)) {
      fornecedoresUnicos.set(cotacao.fornecedor_id, {
        id: cotacao.fornecedor_id,
        nome: cotacao.nome_fantasia,
      });
    }
  });

  const listaFornecedores = Array.from(fornecedoresUnicos.values());
  const cotacoesExistentes = {};

  rawData.forEach((cotacao) => {
    if (!cotacoesExistentes[cotacao.cod_material]) {
      cotacoesExistentes[cotacao.cod_material] = {
        ultima_compra: cotacao.ultima_compra || 0,
        media_historica: cotacao.media_historica || 0,
        media_6_meses: cotacao.media_6_meses || 0,
        fornecedores: {},
      };
    }
    cotacoesExistentes[cotacao.cod_material].fornecedores[cotacao.fornecedor_id] = {
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
      status: cotacao.status || "",
      datasParcelas: JSON.parse(cotacao.datasParcelas || "[]").map((d) => d.dias || ""),
      qtdParcela: cotacao.qtd_parcela || 0,
    };
  });

  const materiais = [
    ...new Map(
      rawData.map((item) => [
        item.cod_material,
        {
          cod_material: item.cod_material,
          descricao: item.descricao || item.cod_material,
          quantidade: item.quantidade || 1,
          unid: item.unid || "UN",
        },
      ])
    ).values(),
  ];

  return { cotacoesExistentes, materiais, rawData, fornecedores: listaFornecedores };
}

// ─── Hook customizado: fila de aprovação com cache ──────────────────────────────────────
function useFilaAprovacao() {
  const nivelAcesso = Number(localStorage.getItem("nivel_acesso"));
  const isPerfilAutorizado = nivelAcesso === 1 || nivelAcesso === 2;

  const [filaAprovacao, setFilaAprovacao] = useState(null);
  const [carregandoFila, setCarregandoFila] = useState(false);

  // Cache local ao hook
  const cacheRef = useRef({ lista: null, timestamp: 0 });

  // Função para carregar dados (com cache)
  const carregarDados = useCallback(async (forceRefresh = false) => {
    if (!isPerfilAutorizado) {
      setFilaAprovacao([]);
      setCarregandoFila(false);
      return;
    }

    const agora = Date.now();
    
    // Verifica cache (se não for force refresh)
    if (!forceRefresh && cacheRef.current.lista && (agora - cacheRef.current.timestamp) < TEMPO_CACHE) {
      setFilaAprovacao(cacheRef.current.lista);
      setCarregandoFila(false);
      return;
    }

    setCarregandoFila(true);
    
    const controller = new AbortController();
    
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/aprovarcompra`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          timeout: 10000,
          signal: controller.signal,
        }
      );
      
      const lista = Array.isArray(response.data) ? response.data : [];
      
      // Atualiza cache
      cacheRef.current = { 
        lista, 
        timestamp: Date.now() 
      };
      
      setFilaAprovacao(lista);
    } catch (error) {
      if (!axios.isCancel(error)) {
        console.error("Erro ao buscar fila de aprovação:", error);
        
        // Em caso de erro, tenta usar cache mesmo que expirado
        if (cacheRef.current.lista) {
          setFilaAprovacao(cacheRef.current.lista);
        } else {
          setFilaAprovacao([]);
        }
      }
    } finally {
      setCarregandoFila(false);
    }
  }, [isPerfilAutorizado]);

  // Carrega dados na montagem
  useEffect(() => {
    carregarDados(false);
  }, [carregarDados]);

  const invalidarCache = useCallback(() => {
    cacheRef.current = { lista: null, timestamp: 0 };
    // Força recarregamento dos dados
    carregarDados(true);
  }, [carregarDados]);

  return { filaAprovacao, carregandoFila, invalidarCache };
}

// ─── Painel de Aprovação ──────────────────────────────────────────────────────
function AprovacaoPanel({ item, onSuccess, onError, filaAprovacao, carregandoFila }) {
  const nivelAcesso = Number(localStorage.getItem("nivel_acesso"));
  const isPerfilAutorizado = nivelAcesso === 1 || nivelAcesso === 2;
  const config = NIVEL_CONFIG[nivelAcesso];
  const codCompra = item?.["Cod. Compra"] ?? item?.["cod_compra"];

  const [aberto, setAberto] = useState(false);
  const [decisao, setDecisao] = useState(null);
  const [justificativa, setJustificativa] = useState("");
  const [loading, setLoading] = useState(false);

  // Verifica se item está na fila
  const itemNaFila = useMemo(() => {
    if (!filaAprovacao || !Array.isArray(filaAprovacao)) return false;
    if (carregandoFila) return false;
    
    return filaAprovacao.some(
      (s) => String(s.cod_compra ?? s["Codigo"] ?? "") === String(codCompra ?? "")
    );
  }, [filaAprovacao, codCompra, carregandoFila]);

  // Verifica se o item já foi processado
  const jaProcessado = useMemo(() => {
    if (!item) return false;
    const configAtual = NIVEL_CONFIG[nivelAcesso];
    if (!configAtual) return true;
    
    const aceiteValue = item[configAtual.aceiteKey];
    return aceiteValue !== null && aceiteValue !== undefined;
  }, [item, nivelAcesso]);

  // Não mostra se não autorizado, sem config, ou já processado
  if (!isPerfilAutorizado || !config || jaProcessado) return null;

  // Mostra loading enquanto verifica
  if (carregandoFila) {
    return (
      <Card variant="outlined" sx={{ mb: 2.5, borderColor: "warning.main" }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1}>
            <CircularProgress size={20} />
            <Typography variant="body2" color="warning.dark">Verificando pendências...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Não mostra se não está na fila
  if (!itemNaFila) return null;

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
    
    const controller = new AbortController();
    
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
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          signal: controller.signal,
        }
      );
      
      onSuccess(decisao === 1 ? "Solicitação aprovada com sucesso!" : "Solicitação reprovada.");
      handleCancelar();
      
      // Aguarda um momento e recarrega a página para atualizar todos os dados
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (err) {
      if (!axios.isCancel(err)) {
        onError(err.response?.data?.message || "Erro ao registrar decisão.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 2.5,
        borderColor: aberto ? (decisao === 1 ? "success.main" : "error.main") : "warning.main",
        transition: "border-color 0.2s",
      }}
    >
      <CardContent sx={{ pb: "12px !important" }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={aberto ? 1.5 : 0}>
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
            <Button variant="outlined" size="small" onClick={handleCancelar} disabled={loading}>
              Cancelar
            </Button>
            <Button
              variant="contained" 
              size="small" 
              color={decisao === 1 ? "success" : "error"}
              onClick={handleConfirmar} 
              disabled={loading}
              startIcon={loading ? <CircularProgress size={14} color="inherit" /> : decisao === 1 ? <FiCheck /> : <FiX />}
            >
              {loading ? "Enviando..." : "Confirmar"}
            </Button>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
}

// ─── Card de Documentos ───────────────────────────────────────────────────────
function CardDocumentos({ codCompra }) {
  const [documentos, setDocumentos] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (!codCompra) return;
    
    const controller = new AbortController();
    setLoadingDocs(true);

    axios
      .get(`${import.meta.env.VITE_API_URL}/uploads/listar/${codCompra}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        signal: controller.signal,
      })
      .then((res) => setDocumentos(res.data?.data ?? []))
      .catch((err) => { 
        if (!axios.isCancel(err)) setErro("Não foi possível carregar os documentos."); 
      })
      .finally(() => setLoadingDocs(false));

    return () => controller.abort();
  }, [codCompra]);

  if (!nivelPermitido()) return null;

  return (
    <Card sx={{ mb: 2.5 }}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={500} color="primary" gutterBottom>
          📎 Documentos Anexados
        </Typography>
        
        {loadingDocs ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1 }}>
            <CircularProgress size={16} />
          </Box>
        ) : erro ? (
          <Typography variant="body2" color="error">{erro}</Typography>
        ) : documentos.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Nenhum documento anexado a esta compra.
          </Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1 }}>
            {documentos.map((doc) => {
              const ext = doc.extensao || (doc.nome_original || "").split(".").pop();
              const cor = extColor(ext);
              const downloadUrl = `${import.meta.env.VITE_API_URL}/documentos/download/${doc.id}`;
              
              return (
                <Box
                  key={doc.id}
                  sx={{
                    display: "flex", 
                    alignItems: "center", 
                    gap: 1.5, 
                    p: 1.5,
                    borderRadius: 2, 
                    border: "1px solid", 
                    borderColor: "divider",
                    bgcolor: "grey.50", 
                    "&:hover": { bgcolor: "grey.100" }, 
                    transition: "background 0.15s",
                  }}
                >
                  <Box sx={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: 1.5, 
                    bgcolor: cor, 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    flexShrink: 0 
                  }}>
                    <FiFile size={18} color="#fff" />
                  </Box>
                  
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={500} noWrap>
                      {doc.nome_original}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center", mt: 0.3 }}>
                      <Typography variant="caption" color="text.secondary">
                        {formatBytes(doc.tamanho)}
                      </Typography>
                      {doc.data_upload && (
                        <>
                          <Typography variant="caption" color="text.disabled">·</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatarDataBR(doc.data_upload)}
                          </Typography>
                        </>
                      )}
                    </Box>
                  </Box>
                  
                  <Chip 
                    label={ext.toUpperCase()} 
                    size="small" 
                    sx={{ 
                      bgcolor: cor, 
                      color: "#fff", 
                      fontSize: "0.6rem", 
                      fontWeight: 700, 
                      height: 20, 
                      flexShrink: 0 
                    }} 
                  />
                  
                  <Tooltip title="Baixar documento">
                    <IconButton 
                      size="small" 
                      component="a" 
                      href={downloadUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      sx={{ color: "primary.main", flexShrink: 0 }}
                    >
                      <FiDownload size={16} />
                    </IconButton>
                  </Tooltip>
                </Box>
              );
            })}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Timeline de Eventos ──────────────────────────────────────────────────────
const TimelineEventos = React.memo(function TimelineEventos({ eventos }) {
  const getDotColor = (evento) => {
    const etapa = (evento.etapa || "").toLowerCase();
    const tipo = (evento.tipo || "").toLowerCase();
    const status = (evento.status || "").toLowerCase();
    
    if (status.includes("recus") || status.includes("reprov") || 
        etapa.includes("recus") || etapa.includes("reprov") || 
        tipo.includes("recus") || tipo.includes("reprov")) {
      return "error.main";
    }
    if (status.includes("aprov") || etapa.includes("aprov") || tipo.includes("aprov")) {
      return "success.main";
    }
    return "primary.main";
  };

  return (
    <Box sx={{ mt: 1 }}>
      {eventos.map((evento, index) => {
        const isLast = index === eventos.length - 1;
        const dotColor = getDotColor(evento);
        
        return (
          <Box key={index} sx={{ display: "flex", gap: 1.5 }}>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Box sx={{ 
                width: 10, 
                height: 10, 
                borderRadius: "50%", 
                bgcolor: dotColor, 
                mt: "4px", 
                flexShrink: 0 
              }} />
              {!isLast && <Box sx={{ 
                width: "1px", 
                flex: 1, 
                bgcolor: "divider", 
                my: "4px", 
                minHeight: 20 
              }} />}
            </Box>
            
            <Box sx={{ pb: isLast ? 0 : 2.5, flex: 1 }}>
              <Box sx={{ 
                display: "flex", 
                alignItems: "flex-start", 
                justifyContent: "space-between", 
                gap: 1, 
                mb: 0.5 
              }}>
                <Typography variant="body2" fontWeight={500}>
                  {evento.tipo}{evento.etapa ? ` — ${evento.etapa}` : ""}
                </Typography>
                
                {evento.status && (
                  <Chip
                    label={evento.status.toUpperCase()} 
                    size="small"
                    color={
                      ["aprovado"].includes((evento.status || "").toLowerCase()) ? "success"
                      : ["recusado", "reprovado"].includes((evento.status || "").toLowerCase()) ? "error"
                      : "default"
                    }
                    sx={{ fontSize: 10 }}
                  />
                )}
              </Box>
              
              <Typography variant="caption" color="text.secondary">
                {evento.filial_nome && evento.filial_nome !== "undefined"
                  ? evento.filial_nome
                  : (() => {
                      const data = formatarDataBR(evento.data || evento.data_hora);
                      const responsavel = evento.responsavel_nome || evento.responsavel;
                      const matricula = evento.responsavel_matricula;
                      let texto = data;
                      if (responsavel) { 
                        texto += ` · ${responsavel}`; 
                        if (matricula) texto += ` (${matricula})`; 
                      }
                      return texto;
                    })()
                }
              </Typography>
              
              {evento.detalhes && (
                <Box sx={{ mt: 1, p: 1.25, bgcolor: "grey.100", borderRadius: 1.5 }}>
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
});

// ─── Mapa de Cotação ──────────────────────────────────────────────────────────
const CardCotacao = React.memo(function CardCotacao({ cotacaoData }) {
  if (!cotacaoData) return null;
  
  const { materiais, cotacoesExistentes, fornecedores } = cotacaoData;
  const coresFundo = ["#e8f4fd", "#fff2e8", "#f0f8e8", "#f8e8fd", "#e8fdf8", "#fde8e8"];
  const coresLinhas = ["#f8fcff", "#fffaf8", "#f8fff8", "#fcf8ff", "#f8fffc", "#fff8f8"];

  const supplierTotals = useMemo(() => {
    const totals = {};
    fornecedores.forEach((forn) => { totals[forn.id] = 0; });
    materiais.forEach((mat) => {
      const materialFornecedores = cotacoesExistentes[mat.cod_material]?.fornecedores || {};
      fornecedores.forEach((forn) => {
        const preco = parseFloat(materialFornecedores[forn.id]?.preco || 0);
        totals[forn.id] += preco * (mat.quantidade || 0);
      });
    });
    return totals;
  }, [materiais, cotacoesExistentes, fornecedores]);

  return (
    <Card sx={{ mb: 2.5 }}>
      <CardContent sx={{ p: "0 !important" }}>
        <Box sx={{ textAlign: "center", borderBottom: "2px solid #000", p: 2 }}>
          <Typography variant="h6" sx={{ 
            fontWeight: "bold", 
            backgroundColor: "#f5f5f5", 
            px: 3, 
            py: 1, 
            border: "1px solid #000", 
            display: "inline-block" 
          }}>
            MAPA DE COTAÇÃO
          </Typography>
        </Box>
        
        <Box sx={{ p: 2 }}>
          <TableContainer component={Paper} sx={{ border: "1px solid #000", overflowX: "auto" }}>
            <Table size="small" sx={{ 
              "& .MuiTableCell-root": { border: "1px solid #000", fontSize: "0.65rem" }, 
              minWidth: 800 + (fornecedores.length * 100) 
            }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f0f0f0" }}>
                  <TableCell align="center" sx={{ fontWeight: "bold", width: 35 }}>ITEM</TableCell>
                  <TableCell align="center" sx={{ fontWeight: "bold", width: 70 }}>CÓDIGO</TableCell>
                  <TableCell align="center" sx={{ fontWeight: "bold", minWidth: 200 }}>DESCRIÇÃO</TableCell>
                  <TableCell align="center" sx={{ fontWeight: "bold", width: 45 }}>UNID</TableCell>
                  <TableCell align="center" sx={{ fontWeight: "bold", width: 50 }}>QTDE</TableCell>
                  
                  {fornecedores.map((forn, i) => (
                    <TableCell key={forn.id} colSpan={2} align="center" sx={{ 
                      fontWeight: "bold", 
                      backgroundColor: coresFundo[i % coresFundo.length] 
                    }}>
                      {forn.nome.toUpperCase()}
                    </TableCell>
                  ))}
                  
                  <TableCell align="center" sx={{ fontWeight: "bold", backgroundColor: "#ffe8e8" }}>ÚLTIMA<br />COMPRA</TableCell>
                  <TableCell align="center" sx={{ fontWeight: "bold", backgroundColor: "#ffe8e8" }}>MÉDIA<br />HIST.</TableCell>
                  <TableCell align="center" sx={{ fontWeight: "bold", backgroundColor: "#ffe8e8" }}>MÉDIA<br />6 MESES</TableCell>
                </TableRow>
                
                <TableRow sx={{ backgroundColor: "#f8f8f8" }}>
                  <TableCell colSpan={5} />
                  {fornecedores.map((forn, i) => (
                    <React.Fragment key={forn.id}>
                      <TableCell align="center" sx={{ 
                        fontWeight: "bold", 
                        fontSize: "0.55rem", 
                        backgroundColor: coresFundo[i % coresFundo.length] 
                      }}>PREÇO</TableCell>
                      <TableCell align="center" sx={{ 
                        fontWeight: "bold", 
                        fontSize: "0.55rem", 
                        backgroundColor: coresFundo[i % coresFundo.length] 
                      }}>TOTAL</TableCell>
                    </React.Fragment>
                  ))}
                  <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "0.55rem", backgroundColor: "#ffe8e8" }}>PREÇO</TableCell>
                  <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "0.55rem", backgroundColor: "#ffe8e8" }}>PREÇO</TableCell>
                  <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "0.55rem", backgroundColor: "#ffe8e8" }}>PREÇO</TableCell>
                </TableRow>
              </TableHead>
              
              <TableBody>
                {materiais.map((mat, index) => {
                  const materialFornecedores = cotacoesExistentes[mat.cod_material]?.fornecedores || {};
                  
                  return (
                    <TableRow key={mat.cod_material}>
                      <TableCell align="center">{index + 1}</TableCell>
                      <TableCell align="center">{mat.cod_material}</TableCell>
                      <TableCell>{mat.descricao}</TableCell>
                      <TableCell align="center">{mat.unid}</TableCell>
                      <TableCell align="center">{mat.quantidade || 0}</TableCell>
                      
                      {fornecedores.map((forn, i) => {
                        const fornData = materialFornecedores[forn.id];
                        const preco = parseFloat(fornData?.preco || 0);
                        const isAprovado = (fornData?.status || "").toLowerCase() === "aprovado";
                        
                        return (
                          <React.Fragment key={forn.id}>
                            <TableCell align="right" sx={{ 
                              backgroundColor: isAprovado ? "#d4edda" : coresLinhas[i % coresLinhas.length], 
                              fontWeight: isAprovado ? "bold" : "normal" 
                            }}>
                              {fornData !== undefined ? formatCurrency(preco) : "-"}
                              {isAprovado && <Chip label="✓" size="small" color="success" sx={{ 
                                ml: 0.5, 
                                height: 14, 
                                fontSize: 8, 
                                minWidth: 18 
                              }} />}
                            </TableCell>
                            <TableCell align="right" sx={{ 
                              fontWeight: "bold", 
                              backgroundColor: isAprovado ? "#d4edda" : coresLinhas[i % coresLinhas.length] 
                            }}>
                              {fornData !== undefined ? formatCurrency(preco * (mat.quantidade || 0)) : "-"}
                            </TableCell>
                          </React.Fragment>
                        );
                      })}
                      
                      <TableCell align="right" sx={{ backgroundColor: "#fff8f8" }}>
                        {cotacoesExistentes[mat.cod_material]?.ultima_compra ? formatCurrency(cotacoesExistentes[mat.cod_material].ultima_compra) : "R$ -"}
                      </TableCell>
                      <TableCell align="right" sx={{ backgroundColor: "#fff8f8" }}>
                        {cotacoesExistentes[mat.cod_material]?.media_historica ? formatCurrency(cotacoesExistentes[mat.cod_material].media_historica) : "R$ -"}
                      </TableCell>
                      <TableCell align="right" sx={{ backgroundColor: "#fff8f8" }}>
                        {cotacoesExistentes[mat.cod_material]?.media_6_meses ? formatCurrency(cotacoesExistentes[mat.cod_material].media_6_meses) : "R$ -"}
                      </TableCell>
                    </TableRow>
                  );
                })}
                
                <TableRow sx={{ backgroundColor: "#f0f0f0" }}>
                  <TableCell colSpan={5} align="right" sx={{ fontWeight: "bold" }}>TOTAL</TableCell>
                  {fornecedores.map((forn, i) => (
                    <TableCell key={forn.id} colSpan={2} align="right" sx={{ 
                      fontWeight: "bold", 
                      backgroundColor: coresFundo[i % coresFundo.length] 
                    }}>
                      {formatCurrency(supplierTotals[forn.id] || 0)}
                    </TableCell>
                  ))}
                  <TableCell align="right" sx={{ fontWeight: "bold", backgroundColor: "#ffe8e8" }}>R$ -</TableCell>
                  <TableCell align="right" sx={{ fontWeight: "bold", backgroundColor: "#ffe8e8" }}>R$ -</TableCell>
                  <TableCell align="right" sx={{ fontWeight: "bold", backgroundColor: "#ffe8e8" }}>R$ -</TableCell>
                </TableRow>
                
                {[
                  { label: "CONDIÇÕES DE PAGAMENTO", render: (fd) => fd ? (fd.condPgto?.toUpperCase() === "A VISTA" ? "A VISTA" : fd.qtdParcela > 1 ? `${fd.condPgto} ${fd.qtdParcela}x` : fd.condPgto ?? "-") : "-" },
                  { label: "TIPO DE FRETE", render: (fd) => fd?.tipoFrete || "-" },
                  { label: "VALOR DO FRETE", render: (fd) => { if (!fd) return "-"; const val = Number(fd?.valorFrete ?? ""); return !isNaN(val) ? formatCurrency(val) : fd?.valorFrete || "Não Informado"; } },
                  { label: "PRAZO", render: (fd) => fd?.condEntrega || "-" },
                ].map(({ label, render }) => (
                  <TableRow key={label} sx={{ backgroundColor: "#f0f0f0" }}>
                    <TableCell colSpan={5} align="center" sx={{ fontWeight: "bold" }}>{label}</TableCell>
                    {fornecedores.map((forn, i) => {
                      let fd = null;
                      for (const mat of materiais) {
                        const matForn = cotacoesExistentes[mat.cod_material]?.fornecedores?.[forn.id];
                        if (matForn) { fd = matForn; break; }
                      }
                      return (
                        <TableCell key={forn.id} colSpan={2} align="center" sx={{ backgroundColor: coresFundo[i % coresFundo.length] }}>
                          {render(fd)}
                        </TableCell>
                      );
                    })}
                    <TableCell align="center" sx={{ backgroundColor: "#ffe8e8" }}>-</TableCell>
                    <TableCell align="center" sx={{ backgroundColor: "#ffe8e8" }}>-</TableCell>
                    <TableCell align="center" sx={{ backgroundColor: "#ffe8e8" }}>-</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </CardContent>
    </Card>
  );
});

// ─── Ordem de Compra ──────────────────────────────────────────────────────────
const CardOrdemCompra = React.memo(function CardOrdemCompra({ cotacaoData }) {
  if (!cotacaoData) return null;
  
  const { materiais, cotacoesExistentes, fornecedores } = cotacaoData;

  const fornecedoresAprovados = useMemo(() => {
    const aprovadosMap = new Map();
    
    fornecedores.forEach((forn) => {
      const materiaisAprovados = [];
      let valorTotalGeral = 0;
      
      materiais.forEach((mat) => {
        const fd = cotacoesExistentes[mat.cod_material]?.fornecedores?.[forn.id];
        if (fd && (fd.status || "").toLowerCase() === "aprovado") {
          const preco = parseFloat(fd.preco || 0);
          materiaisAprovados.push({ material: mat, dados: fd, totalItem: preco * (mat.quantidade || 0) });
          valorTotalGeral += preco * (mat.quantidade || 0);
        }
      });
      
      if (materiaisAprovados.length > 0) {
        aprovadosMap.set(forn.id, {
          fornecedorId: forn.id,
          nomeFornecedor: forn.nome,
          dados: materiaisAprovados[0].dados,
          valor_total: valorTotalGeral,
          materiais: materiaisAprovados,
        });
      }
    });
    
    return Array.from(aprovadosMap.values());
  }, [materiais, cotacoesExistentes, fornecedores]);

  if (fornecedoresAprovados.length === 0) return null;

  return (
    <>
      {fornecedoresAprovados.map((fornAprovado) => {
        const fd = fornAprovado.dados;
        
        return (
          <Card key={fornAprovado.fornecedorId} sx={{ mb: 2.5 }}>
            <CardContent sx={{ p: "0 !important" }}>
              <Box sx={{ textAlign: "center", borderBottom: "2px solid #000", p: 2 }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: "bold", 
                  backgroundColor: "#f5f5f5", 
                  px: 3, 
                  py: 1, 
                  border: "1px solid #000", 
                  display: "inline-block" 
                }}>
                  ORDEM DE COMPRA — {fornAprovado.nomeFornecedor.toUpperCase()}
                </Typography>
              </Box>
              
              <Box sx={{ p: 2 }}>
                <TableContainer component={Paper} sx={{ border: "1px solid #000", overflowX: "auto" }}>
                  <Table size="small" sx={{ 
                    "& .MuiTableCell-root": { border: "1px solid #000", fontSize: "0.75rem" }, 
                    minWidth: 600 
                  }}>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: "#f0f0f0" }}>
                        <TableCell align="center" sx={{ fontWeight: "bold", width: 40 }}>ITEM</TableCell>
                        <TableCell align="center" sx={{ fontWeight: "bold", width: 80 }}>CÓDIGO</TableCell>
                        <TableCell align="center" sx={{ fontWeight: "bold", minWidth: 220 }}>DESCRIÇÃO</TableCell>
                        <TableCell align="center" sx={{ fontWeight: "bold", width: 50 }}>UNID</TableCell>
                        <TableCell align="center" sx={{ fontWeight: "bold", width: 55 }}>QTDE</TableCell>
                        <TableCell align="center" sx={{ fontWeight: "bold", backgroundColor: "#f1f8e9" }} colSpan={2}>
                          {fornAprovado.nomeFornecedor.toUpperCase()}
                        </TableCell>
                      </TableRow>
                      <TableRow sx={{ backgroundColor: "#f8f8f8" }}>
                        <TableCell colSpan={5} />
                        <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "0.4rem", backgroundColor: "#f1f8e9" }}>PREÇO</TableCell>
                        <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "0.4rem", backgroundColor: "#f1f8e9" }}>TOTAL</TableCell>
                      </TableRow>
                    </TableHead>
                    
                    <TableBody>
                      {fornAprovado.materiais.map((item, index) => {
                        const preco = parseFloat(item.dados.preco || 0);
                        
                        return (
                          <TableRow key={item.material.cod_material}>
                            <TableCell align="center">{index + 1}</TableCell>
                            <TableCell align="center">{item.material.cod_material}</TableCell>
                            <TableCell>{item.material.descricao}</TableCell>
                            <TableCell align="center">{item.material.unid}</TableCell>
                            <TableCell align="center">{item.material.quantidade || 0}</TableCell>
                            <TableCell align="right" sx={{ backgroundColor: "#f8fff8" }}>{formatCurrency(preco)}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: "bold", backgroundColor: "#f8fff8" }}>
                              {formatCurrency(preco * (item.material.quantidade || 0))}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      
                      <TableRow sx={{ backgroundColor: "#f0f0f0" }}>
                        <TableCell colSpan={5} align="right" sx={{ fontWeight: "bold", fontSize: "0.85rem" }}>
                          TOTAL GERAL
                        </TableCell>
                        <TableCell colSpan={2} align="right" sx={{ 
                          fontWeight: "bold", 
                          fontSize: "0.85rem", 
                          backgroundColor: "#f1f8e9" 
                        }}>
                          {formatCurrency(fornAprovado.valor_total)}
                        </TableCell>
                      </TableRow>
                      
                      {[
                        { label: "CONDIÇÕES DE PAGAMENTO", value: `${fd?.condPgto || "-"}${fd?.qtdParcela > 1 ? ` ${fd.qtdParcela}x` : ""}` },
                        { label: "TIPO DE FRETE", value: fd?.tipoFrete || "-" },
                        { label: "VALOR DO FRETE", value: fd?.valorFrete ? formatCurrency(Number(fd.valorFrete)) : "-" },
                        { label: "PRAZO DE ENTREGA", value: fd?.condEntrega || "-" },
                      ].map(({ label, value }) => (
                        <TableRow key={label} sx={{ backgroundColor: "#f0f0f0" }}>
                          <TableCell colSpan={5} align="center" sx={{ fontWeight: "bold", fontSize: "0.85rem" }}>
                            {label}
                          </TableCell>
                          <TableCell colSpan={2} align="center" sx={{ fontSize: "0.75rem", backgroundColor: "#f1f8e9" }}>
                            {value}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                {fd?.arquivo && (
                  <Box sx={{ mt: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                    <FiFileText size={14} color="#555" />
                    <Typography variant="caption" color="text.secondary">Anexo:</Typography>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      component="a" 
                      href={fd.arquivo} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      sx={{ fontSize: 12, textTransform: "none" }}
                    >
                      Visualizar Proposta
                    </Button>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        );
      })}
    </>
  );
});

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function Index() {
  const { cod_compra } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [historico, setHistorico] = useState([]);
  const [historicoMultiplo, setHistoricoMultiplo] = useState(false);
  const [rawCotacao, setRawCotacao] = useState(null);
  const [loadingCotacao, setLoadingCotacao] = useState(false);

  const contentRef = useRef(null);
  const { dataDetails, loading: loadingSolicitacao } = useDetalhesTodasSolicitacoes(cod_compra);

  // Hook com cache para fila de aprovação
  const { filaAprovacao, carregandoFila, invalidarCache } = useFilaAprovacao();

  const primeiroItem = dataDetails?.length > 0 ? dataDetails[0] : null;
  const temAceiteMaterial = primeiroItem?.aceite_material == 1;
  const codCotacao = primeiroItem?.cod_cotacao ?? null;

  // Processa dados de cotação com memoização
  const cotacaoData = useMemo(() => processarCotacao(rawCotacao), [rawCotacao]);

  // Busca histórico
  useEffect(() => {
    if (!cod_compra) return;
    
    const controllerHistorico = new AbortController();

    const fetchHistorico = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/historico/${cod_compra}`,
          { 
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }, 
            signal: controllerHistorico.signal 
          }
        );
        
        const data = response.data || [];
        if (data.length > 0 && data[0]?.cod_compra && Array.isArray(data[0]?.historico)) {
          setHistoricoMultiplo(true);
          setHistorico(data);
        } else {
          setHistoricoMultiplo(false);
          setHistorico(data);
        }
      } catch (err) {
        if (!axios.isCancel(err)) console.error("Erro ao buscar histórico:", err);
      }
    };

    fetchHistorico();
    return () => controllerHistorico.abort();
  }, [cod_compra]);

  // Busca cotação
  useEffect(() => {
    if (!temAceiteMaterial || !codCotacao) return;
    
    const controller = new AbortController();
    setLoadingCotacao(true);

    axios
      .get(`${import.meta.env.VITE_API_URL}/cotacao/${codCotacao}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        signal: controller.signal,
      })
      .then((res) => setRawCotacao(res.data))
      .catch((err) => { 
        if (!axios.isCancel(err)) console.error("Erro ao buscar cotação:", err); 
      })
      .finally(() => setLoadingCotacao(false));

    return () => controller.abort();
  }, [temAceiteMaterial, codCotacao]);

  // Exporta PDF com lazy loading
  const handleExportPDF = useCallback(async () => {
    if (!contentRef.current) return;
    
    setLoading(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      
      const canvas = await html2canvas(contentRef.current, { 
        scale: 2, 
        logging: false, 
        useCORS: true 
      });
      
      const pdf = new jsPDF({ 
        orientation: "portrait", 
        unit: "px", 
        format: [canvas.width, canvas.height] 
      });
      
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`detalhes_compra_${cod_compra}.pdf`);
    } catch {
      showSnackbar("Erro ao gerar PDF");
    } finally {
      setLoading(false);
    }
  }, [cod_compra]);

  const showSnackbar = useCallback((message) => { 
    setSnackbarMessage(message); 
    setSnackbarOpen(true); 
  }, []);

  const handleAprovacaoSuccess = useCallback((msg) => {
    invalidarCache(); // Invalida cache para forçar recarregamento
    showSnackbar(msg || "Ação realizada com sucesso!");
  }, [invalidarCache, showSnackbar]);

  function getStatusInfo(item) {
    if (item.aceite_gerente === 0) return { label: "Reprovado Gerente", color: "error", icon: <FiXCircle /> };
    if (item.aceite_material === 0) return { label: "Reprovado Material", color: "error", icon: <FiXCircle /> };
    if (item.aceite_compra === 0) return { label: "Reprovado Compras", color: "error", icon: <FiXCircle /> };
    if (item.aceite_diretor == 0) return { label: "Reprovado Diretor", color: "error", icon: <FiXCircle /> };
    if (item.entregue == "1") return { label: "Material Entregue", color: "success", icon: <FiCheckCircle /> };
    if (item.finalizado == "1") return { label: "Compra Realizada", color: "success", icon: <FiCheckCircle /> };
    if (item.aceite_diretor == "1") return { label: "Aprovado", color: "success", icon: <FiCheckCircle /> };
    if (item.aceite_gerente === null) return { label: "Aguardando Gerente", color: "warning", icon: <FiClock /> };
    if (item.aceite_material === null) return { label: "Aguardando Material", color: "warning", icon: <FiClock /> };
    if (item.aceite_compra === null) return { label: "Material Sendo Cotado", color: "warning", icon: <FiClock /> };
    if (item.aceite_diretor === null) return { label: "Aguardando Aprovação", color: "warning", icon: <FiClock /> };
    return { label: "Aguardando", color: "default", icon: <FiClock /> };
  }

  const statusGeral = primeiroItem ? getStatusInfo(primeiroItem) : null;

  return (
    <Box ref={contentRef} sx={{ p: 3 }}>
      {/* Cabeçalho */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 2.5 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 1.5 }}>
          <FiArrowLeft />
        </IconButton>
        
        <Box>
          <Typography variant="h5" color="black" fontWeight={500}>
            Detalhes da Compra
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Solicitado em {formatarDataBR(primeiroItem?.data_solicitacao)}
            {primeiroItem?.departamento && ` · ${primeiroItem.departamento}`}
          </Typography>
        </Box>
        
        {statusGeral && (
          <Chip 
            icon={statusGeral.icon} 
            label={statusGeral.label} 
            color={statusGeral.color} 
            size="small" 
            sx={{ ml: "auto", fontWeight: 500 }} 
          />
        )}
        
        <Button 
          variant="contained" 
          startIcon={<FiDownload />} 
          onClick={handleExportPDF} 
          sx={{ ml: 2 }} 
          disabled={loading} 
          color="error"
        >
          Exportar PDF
        </Button>
      </Box>

      {/* Painel de Aprovação */}
      <AprovacaoPanel
        item={primeiroItem}
        onSuccess={handleAprovacaoSuccess}
        onError={showSnackbar}
        filaAprovacao={filaAprovacao}
        carregandoFila={carregandoFila}
      />

      {/* Dados da Compra */}
      <Card sx={{ mb: 2.5 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={500} color="primary" gutterBottom>
            📋 Dados da Compra
          </Typography>
          
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Código
              </Typography>
              <Typography variant="body2" fontWeight={500} sx={{ mt: 0.5 }}>
                #{cod_compra}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Data da Solicitação
              </Typography>
              <Typography variant="body2" fontWeight={500} sx={{ mt: 0.5 }}>
                {formatarDataBR(primeiroItem?.data_solicitacao)}
              </Typography>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Itens
          </Typography>
          
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
            {dataDetails?.length > 0 ? (
              dataDetails.map((item, index) => (
                <Chip
                  key={item.id || index}
                  label={`Item: ${item["Descrição"] || item.nome || `Item ${index + 1}`}${item.codigo_material || item.codmat || item.cod_material ? ` · Código: ${item.codigo_material || item.codmat || item.cod_material}` : ""}${item.quantidade ? ` · Quantidade: ${item.quantidade}${item.unidade ? ` ${item.unidade}` : ""}` : ""}`}
                  variant="outlined" 
                  size="small" 
                  sx={{ fontWeight: 500, fontSize: 10 }}
                />
              ))
            ) : (
              <Box sx={{ margin: "auto" }}>
                <CircularProgress />
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Documentos */}
      <CardDocumentos codCompra={cod_compra} />

      {/* Histórico */}
      <Card sx={{ mb: 2.5 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={500} color="primary" gutterBottom>
            📜 Histórico
          </Typography>
          
          {historico.length > 0 ? (
            historicoMultiplo ? (
              historico.map((grupo, grupoIndex) => (
                <Box key={grupo.cod_compra} sx={{ mb: grupoIndex < historico.length - 1 ? 3 : 0 }}>
                  <Box sx={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 1, 
                    mb: 1.5, 
                    p: 1, 
                    bgcolor: "primary.50", 
                    borderRadius: 1.5, 
                    border: "1px solid", 
                    borderColor: "primary.200" 
                  }}>
                    <FiFileText size={14} color="#1976d2" />
                    <Typography variant="caption" fontWeight={600} color="primary.main">
                      Compra #{grupo.cod_compra}
                    </Typography>
                  </Box>
                  
                  <TimelineEventos eventos={grupo.historico} />
                  
                  {grupoIndex < historico.length - 1 && <Divider sx={{ mt: 3 }} />}
                </Box>
              ))
            ) : (
              <TimelineEventos eventos={historico} />
            )
          ) : (
            <Box sx={{ margin: "auto" }}>
              <CircularProgress />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Cotação */}
      {loadingCotacao ? (
        <Card sx={{ mb: 2.5 }}>
          <CardContent sx={{ display: "flex", alignItems: "center", gap: 2, py: "20px !important" }}>
            <CircularProgress size={18} />
            <Typography variant="body2" color="text.secondary">
              Carregando cotação...
            </Typography>
          </CardContent>
        </Card>
      ) : (
        temAceiteMaterial && cotacaoData && <CardCotacao cotacaoData={cotacaoData} />
      )}

      {/* Ordem de Compra */}
      {cotacaoData && <CardOrdemCompra cotacaoData={cotacaoData} />}

      {/* Backdrop de loading */}
      <Backdrop open={loading} sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <CircularProgress color="inherit" />
      </Backdrop>

      {/* Snackbar para notificações */}
      <CustomSnackbar 
        open={snackbarOpen} 
        onClose={() => setSnackbarOpen(false)} 
        message={snackbarMessage} 
      />
    </Box>
  );
}