import React, { useState, useEffect } from "react";
import {
  Grid,
  TextField,
  Button,
  Paper,
  Typography,
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { CloudUpload, Lock } from "lucide-react";
import * as XLSX from "xlsx";
import useFornecedores from "../../../hooks/useFornecedores";
import CustomSnackbar from "../../../components/SnackBar/SnackBar";

// ─── FileUpload ──────────────────────────────────────────────────────────────
const FileUpload = ({ cod_material, forn, arquivoAtual, handleArquivoChange }) => {
  const [preview, setPreview] = useState("");

  useEffect(() => {
    if (arquivoAtual) setPreview(arquivoAtual);
  }, [arquivoAtual]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      handleArquivoChange(cod_material, forn, "arquivo", file);
    }
  };

  return (
    <Box>
      <Button variant="contained" component="label" startIcon={<CloudUpload size={16} />}>
        Selecionar Arquivo
        <input type="file" hidden onChange={handleFileChange} />
      </Button>
      {preview && (
        <Box sx={{ mt: 1 }}>
          {typeof preview === "string" && (preview.startsWith("http") || preview.includes("/")) ? (
            <a href={preview} target="_blank" rel="noopener noreferrer">
              📄 Visualizar Proposta
            </a>
          ) : (
            <Typography variant="body2">Arquivo selecionado</Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

// ─── FornecedorReadOnly ───────────────────────────────────────────────────────
const FornecedorReadOnly = ({ nomeFornecedor }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      border: "1px solid rgba(0,0,0,0.23)",
      borderRadius: 1,
      px: 2,
      py: 1.5,
      bgcolor: "#f5f5f5",
      minHeight: 56,
      gap: 1,
    }}
  >
    <Lock size={14} color="#888" />
    <Box>
      <Typography variant="caption" color="textSecondary" sx={{ display: "block", lineHeight: 1 }}>
        Fornecedor
      </Typography>
      <Typography variant="body1" sx={{ fontWeight: 500 }}>
        {nomeFornecedor || "Carregando..."}
      </Typography>
    </Box>
  </Box>
);

// ─── Index ────────────────────────────────────────────────────────────────────
const Index = () => {
  const navigate = useNavigate();
  let { cod_compra, cnpj: cnpjFromUrl = "" } = useParams();

  // VALORES FIXOS PARA TESTE - remove depois
  if (!cod_compra) cod_compra = 'TE00OW';
  if (!cnpjFromUrl) cnpjFromUrl = '36665949000158';

  const SLOT = "Fornecedor I";

  const [materiais, setMateriais] = useState([]);
  const [cotacoes, setCotacoes] = useState({});
  const { fornecedores: dataFornecedores } = useFornecedores();

  const [fornecedorId, setFornecedorId] = useState(null);
  const [fornecedorNome, setFornecedorNome] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [podeFinalizarProcesso, setPodeFinalizarProcesso] = useState(false);
  const [salvandoCotacao, setSalvandoCotacao] = useState(false);
  const [finalizandoProcesso, setFinalizandoProcesso] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [file, setFile] = useState(null);

  const showSnackbar = (msg) => { setSnackbarMessage(msg); setSnackbarOpen(true); };
  const handleSnackbarClose = () => setSnackbarOpen(false);
  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => { setFile(null); setOpenModal(false); };
  const handleImportChange = (e) => setFile(e.target.files[0]);

  // ── Resolve fornecedor pelo CNPJ da URL
  useEffect(() => {
    if (!dataFornecedores?.length || !cnpjFromUrl) return;

    const cnpjLimpo = cnpjFromUrl.replace(/[^\d]/g, "").padStart(14, "0");
    const fornecedorEncontrado = dataFornecedores.find((f) => {
      const cnpjF = String(f.cnpj || "").replace(/[^\d]/g, "").padStart(14, "0");
      return cnpjF === cnpjLimpo;
    });

    if (fornecedorEncontrado) {
      setFornecedorId(fornecedorEncontrado.id);
      setFornecedorNome(fornecedorEncontrado.nome_fantasia);
    } else {
      showSnackbar(`Fornecedor com CNPJ ${cnpjFromUrl} não encontrado.`);
    }
  }, [dataFornecedores, cnpjFromUrl]);

  // ── Chamada ao endpoint público: materiais + histórico + cotações
  useEffect(() => {
    const fetchData = async () => {
      if (!cod_compra || !cnpjFromUrl) return;

      setLoading(true);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/public-index-cotacao/${cod_compra}/${cnpjFromUrl}`
        );
        console.log(response)

        const { materiais: materiaisData, cotacoes: cotacoesData, dados_historicos } = response.data;

        // Monta estrutura de cotações com histórico e fornecedor fixo
        const novasCotacoes = {};
        materiaisData.forEach((mat) => {
          const cod = mat.cod_material;
          const hist = dados_historicos?.[cod] || {};

          novasCotacoes[cod] = {
            ultima_compra: hist.ultima_compra || 0,
            media_historica: hist.media_historica || 0,
            media_6_meses: hist.media_6_meses || 0,
          };

          // Procura cotação existente para este material (já filtrada pelo backend para o fornecedor)
          const cot = cotacoesData?.find((c) => c.cod_material === cod);
          if (cot) {
            novasCotacoes[cod][SLOT] = {
              nomeFornecedor: fornecedorId, // será preenchido em efeito posterior se necessário
              preco: cot.preco || "",
              tipoFrete: cot.tipo_frete || "",
              condPgto: cot.cond_pgto || "",
              condEntrega: cot.cond_entrega || "",
              ipi: cot.ipi || "",
              icms: cot.icms || "",
              valorFrete: cot.valor_frete || "",
              obs: cot.obs || "",
              qtdParcela: cot.qtd_parcelas || "",
              datasParcelas: cot.datasParcelas
                ? JSON.parse(cot.datasParcelas).map((d) => d.dias || "")
                : [],
              arquivo: cot.arquivo,
            };
          }
        });

        setMateriais(materiaisData);
        setCotacoes(novasCotacoes);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
        showSnackbar("Erro ao carregar dados: " + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [cod_compra, cnpjFromUrl]);

  // Depois de carregar fornecedorId, preencher o nome no slot das cotações
  useEffect(() => {
    if (!fornecedorId || Object.keys(cotacoes).length === 0) return;

    setCotacoes((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((cod) => {
        if (updated[cod]?.[SLOT]) {
          updated[cod][SLOT] = {
            ...updated[cod][SLOT],
            nomeFornecedor: fornecedorId,
          };
        }
      });
      return updated;
    });
  }, [fornecedorId, cotacoes]);

  // ── Verificar se pode finalizar (todos os materiais têm preço)
  useEffect(() => {
    if (loading || !materiais.length) return;

    const todos = materiais.every((mat) => {
      const f = cotacoes[mat.cod_material]?.[SLOT];
      return f && f.preco && f.preco !== "";
    });
    setPodeFinalizarProcesso(todos && materiais.length > 0);
  }, [cotacoes, materiais, loading]);

  const handleChange = (cod_material, campo, valor) => {
    setCotacoes((prev) => {
      const next = {
        ...prev,
        [cod_material]: {
          ...prev[cod_material],
          [SLOT]: {
            ...prev[cod_material]?.[SLOT],
            [campo]: valor,
          },
        },
      };

      if (campo === "qtdParcela") {
        const qtdNova = parseInt(valor) || 0;
        const parcelasAtuais = prev[cod_material]?.[SLOT]?.datasParcelas || [];
        if (qtdNova < parcelasAtuais.length) {
          next[cod_material][SLOT].datasParcelas = parcelasAtuais.slice(0, qtdNova);
        } else if (qtdNova > parcelasAtuais.length) {
          next[cod_material][SLOT].datasParcelas = [
            ...parcelasAtuais,
            ...Array(qtdNova - parcelasAtuais.length).fill(""),
          ];
        }
      }
      return next;
    });
  };

  const handleArquivoChange = (cod_material, forn, campo, valor) => {
    setCotacoes((prev) => ({
      ...prev,
      [cod_material]: {
        ...prev[cod_material],
        [forn]: { ...prev[cod_material]?.[forn], [campo]: valor },
      },
    }));
  };

  // ── Importar planilha
  const handleImport = async () => {
    if (!file) { alert("Selecione um arquivo primeiro!"); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames.find((n) => n.toLowerCase() === "cotacao");
      if (!sheetName) { alert("A aba 'cotacao' não foi encontrada!"); return; }
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

      const tipoFreteMap = { 1: "CIF", 2: "FOB", CIF: "CIF", FOB: "FOB" };
      const condPgtoMap = { 1: "PIX", 2: "BOLETO", 3: "A VISTA", 4: "PARCELADO", PIX: "PIX", BOLETO: "BOLETO", "A VISTA": "A VISTA", PARCELADO: "PARCELADO" };

      const novas = { ...cotacoes };

      rows.forEach((row, idx) => {
        const codigo = String(row["Código do Material"] || "").replace(/^'/, "").trim();
        if (!novas[codigo]) {
          console.warn(`Material ${codigo} não encontrado (linha ${idx + 1})`);
          return;
        }

        const preco = parseFloat(row["Preço Unitário"]) || 0;
        const tipoFrete = tipoFreteMap[String(row["Tipo de Frete"] || "").toUpperCase().trim()] || "";
        const condPgto = condPgtoMap[String(row["Condição Pgto"] || "").toUpperCase().trim()] || "";
        const valorFrete = parseFloat(row["Valor do Frete"]) || 0;
        const condEntrega = String(row["Prazo de Entrega"] || "").trim();
        const ipi = parseFloat(row["IPI"]) || 0;
        const icms = parseFloat(row["ICMS"]) || 0;
        const obs = row["OBS"] || "";
        const qtdParcela = parseInt(row["Qtd. Parcelas"]) || 0;
        const datasParcelas = qtdParcela > 0
          ? Array.from({ length: qtdParcela }, (_, i) => String(row[`${i + 1}º Parcela`] || "").trim())
          : [];

        novas[codigo] = {
          ...novas[codigo],
          [SLOT]: {
            ...novas[codigo][SLOT],
            nomeFornecedor: fornecedorId,
            preco, tipoFrete, condPgto, valorFrete, condEntrega, ipi, icms, obs,
            qtdParcela: qtdParcela || "",
            datasParcelas,
          },
        };
      });

      setCotacoes(novas);
      showSnackbar("Dados importados com sucesso!");
      handleCloseModal();
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = "https://compras.painel-telecom.com/modelo_cotacao.xlsx";
    link.download = "modelo_cotacao.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Salvar cotação
  const handleSalvarCotacao = async () => {
    setSalvandoCotacao(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      const todasCotacoes = [];

      Object.keys(cotacoes).forEach((cod_material) => {
        const f = cotacoes[cod_material]?.[SLOT];
        if (f && f.nomeFornecedor && f.preco) {
          const arquivoKey = `${cod_material}_${f.nomeFornecedor}`;
          if (f.arquivo instanceof File) formData.append(`arquivos[${arquivoKey}]`, f.arquivo);
          todasCotacoes.push({
            cod_material,
            fornecedor: f.nomeFornecedor,
            preco: parseFloat(f.preco) || 0,
            tipoFrete: f.tipoFrete || "",
            condPgto: f.condPgto || "",
            condEntrega: f.condEntrega || "",
            ipi: parseFloat(f.ipi) || 0,
            icms: parseFloat(f.icms) || 0,
            valorFrete: parseFloat(f.valorFrete) || 0,
            qtdParcela: parseInt(f.qtdParcela) || 1,
            datasParcelas: f.datasParcelas || [],
            obs: f.obs || "",
            arquivo: f.arquivo instanceof File ? null : f.arquivo || null,
            slot: SLOT,
          });
        }
      });

      if (todasCotacoes.length === 0) {
        showSnackbar("Nenhuma cotação válida para salvar.");
        setSalvandoCotacao(false);
        return;
      }

      formData.append("cotacoes", JSON.stringify(todasCotacoes));

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/cotacaoCompra/${cod_compra}`,
        formData,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
      );

      if (response.status === 200 || response.status === 201) {
        showSnackbar("Cotação salva com sucesso!");
      } else {
        showSnackbar("Erro ao salvar a cotação.");
      }
    } catch (err) {
      showSnackbar("Erro ao salvar: " + (err.response?.data?.message || err.message));
    } finally {
      setSalvandoCotacao(false);
    }
  };

  // ── Finalizar processo
  const handleFinalizarProcesso = async () => {
    if (!podeFinalizarProcesso) {
      showSnackbar("Preencha o preço de todos os materiais antes de finalizar.");
      return;
    }
    setFinalizandoProcesso(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/cotacao/${cod_compra}/finalizar`,
        {},
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );
      if (response.status === 200 || response.status === 201) {
        showSnackbar("Processo de cotação finalizado com sucesso!");
        setTimeout(() => navigate("../../", { replace: true }), 2000);
      } else {
        showSnackbar("Erro ao finalizar o processo.");
      }
    } catch (err) {
      showSnackbar("Erro ao finalizar: " + (err.response?.data?.message || err.message));
    } finally {
      setFinalizandoProcesso(false);
    }
  };

  const handlePreview = () => {
    handleSalvarCotacao();
    navigate("../preview", { state: { materiais, cotacoes, cod_compra } });
  };

  // ── Loading / Error
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Carregando dados da cotação...</Typography>
      </Box>
    );
  }

  if (error) return <Typography color="error">Erro ao carregar materiais: {error}</Typography>;
  if (!materiais.length) return <Typography>Nenhum material encontrado para a compra {cod_compra}</Typography>;

  return (
    <Paper sx={{ p: 3 }}>
      {/* Cabeçalho */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Cotação de Materiais — Compra: {cod_compra}
          </Typography>
          {fornecedorNome && (
            <Chip
              icon={<Lock size={12} />}
              label={`Fornecedor: ${fornecedorNome}`}
              color="primary"
              size="small"
            />
          )}
        </Box>

        {/* <Box sx={{ display: "flex", gap: 2 }}>
          <Button variant="contained" onClick={handleOpenModal}>
            Importar Cotação
          </Button>
          <Button variant="contained" color="success" onClick={handleDownload}>
            Baixar Planilha
          </Button>
        </Box> */}
      </Box>

      {/* Alertas */}
      <Box sx={{ mb: 3 }}>
        {!podeFinalizarProcesso && (
          <Alert severity="warning">
            Após preencher todos os campos não se esqueça de salvar a cotação.
          </Alert>
        )}
        {podeFinalizarProcesso && (
          <Alert severity="success">
            Todos os materiais estão cotados. Você pode finalizar o processo!
          </Alert>
        )}
      </Box>

      {/* Materiais */}
      {materiais.map((mat) => {
        const qtd = mat.quantidade || 0;
        const fornecedorData = cotacoes[mat.cod_material]?.[SLOT] || {};
        const totalCompra = (parseFloat(fornecedorData.preco || 0) * qtd);

        return (
          <Paper
            key={mat.cod_material}
            sx={{ p: 2, mt: 4, border: "2px solid #1976d2", borderRadius: 2 }}
            elevation={3}
          >
            {/* Título do material */}
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", color: "#1976d2", flexGrow: 1 }}>
                Material: {mat.cod_material} — {mat.descricao}
              </Typography>
              <Chip
                label={fornecedorData.preco ? "✓ Cotado" : "Pendente"}
                color={fornecedorData.preco ? "success" : "error"}
                size="small"
              />
            </Box>

            {/* Unidade e Quantidade */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={2}>
                <TextField label="Unidade" value={mat.unid} disabled fullWidth />
              </Grid>
              <Grid item xs={2}>
                <TextField label="Qtd" value={qtd} disabled fullWidth />
              </Grid>
            </Grid>

            {/* Formulário único do fornecedor */}
            <Paper sx={{ p: 2, mt: 2, background: "#fafafa", border: "1px solid #ddd" }}>
  
              <Grid container spacing={2}>
                {/* Fornecedor */}
                <Grid item xs={12} md={6} width={'30%'}>
                  <FornecedorReadOnly nomeFornecedor={fornecedorNome} />
                </Grid>

                {/* Preço unitário */}
                <Grid item xs={12} md={6} width={'30%'}>
                  <TextField
                    label="Preço Unit. (R$)"
                    type="number"
                    fullWidth
                    value={fornecedorData.preco || ""}
                    onChange={(e) => handleChange(mat.cod_material, "preco", e.target.value)}
                    inputProps={{ min: 0 }}
                  />
                </Grid>

                {/* Total */}
                <Grid item xs={12} md={6} width={'30%'}>
                  <TextField
                    label="Total Item (R$)"
                    value={totalCompra ? totalCompra.toFixed(2) : ""}
                    fullWidth
                    disabled
                  />
                </Grid>

                {/* Tipo de Frete */}
                <Grid item xs={12} md={6} width={'30%'}>
                  <FormControl fullWidth>
                    <InputLabel>Tipo de Frete</InputLabel>
                    <Select
                      value={fornecedorData.tipoFrete || ""}
                      onChange={(e) => handleChange(mat.cod_material, "tipoFrete", e.target.value)}
                    >
                      <MenuItem value="CIF">CIF</MenuItem>
                      <MenuItem value="FOB">FOB</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Cond. Pagamento */}
                <Grid item xs={12} md={6} width={'30%'}>
                  <FormControl fullWidth>
                    <InputLabel>Cond. Pagamento</InputLabel>
                    <Select
                      value={fornecedorData.condPgto || ""}
                      onChange={(e) => handleChange(mat.cod_material, "condPgto", e.target.value)}
                    >
                      <MenuItem value="PARCELADO">PARCELADO</MenuItem>
                      <MenuItem value="A VISTA">À VISTA</MenuItem>
                      <MenuItem value="BOLETO">BOLETO</MenuItem>
                      <MenuItem value="PIX">PIX</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Parcelas (opcional) */}
                {(fornecedorData.condPgto === "PARCELADO" || fornecedorData.condPgto === "BOLETO") && (
                  <>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Qtd. Parcelas"
                        type="number"
                        fullWidth
                        value={fornecedorData.condPgto === "BOLETO" ? 1 : fornecedorData.qtdParcela || ""}
                        onChange={(e) => handleChange(mat.cod_material, "qtdParcela", e.target.value)}
                        disabled={fornecedorData.condPgto === "BOLETO"}
                      />
                    </Grid>
                    {Array.from({
                      length: fornecedorData.condPgto === "BOLETO" ? 1 : Number(fornecedorData.qtdParcela) || 0,
                    }).map((_, i) => (
                      <Grid item xs={12} md={6} key={i}>
                        <TextField
                          label={`Dias p/ ${i + 1}ª Parcela`}
                          fullWidth
                          value={fornecedorData.datasParcelas?.[i] || ""}
                          onChange={(e) => {
                            const novas = [...(fornecedorData.datasParcelas || [])];
                            novas[i] = e.target.value;
                            handleChange(mat.cod_material, "datasParcelas", novas);
                          }}
                        />
                      </Grid>
                    ))}
                  </>
                )}

                {/* Prazo de Entrega */}
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Prazo de Entrega (Dias)"
                    fullWidth
                    value={fornecedorData.condEntrega || ""}
                    onChange={(e) => handleChange(mat.cod_material, "condEntrega", e.target.value)}
                  />
                </Grid>

                {/* Valor Frete */}
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Valor do Frete (R$)"
                    type="number"
                    fullWidth
                    value={fornecedorData.valorFrete || ""}
                    onChange={(e) => handleChange(mat.cod_material, "valorFrete", e.target.value)}
                    disabled={fornecedorData.tipoFrete === "CIF"}
                    inputProps={{ min: 0 }}
                  />
                </Grid>

                {/* Observação (linha inteira) */}
                <Grid item xs={12} minWidth={'100%'}>
                  <TextField
                    label="Observação"
                    fullWidth
                    multiline
                    rows={3}
                    value={fornecedorData.obs || ""}
                    onChange={(e) => handleChange(mat.cod_material, "obs", e.target.value)}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Paper>
        );
      })}

      {/* Upload de Proposta */}
      {fornecedorId && materiais.length > 0 && (
        <Paper sx={{ p: 3, backgroundColor: "#fafafa", mt: 3 }}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold" }}>
            📎 Anexar Proposta
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Faça o upload da sua proposta comercial
          </Typography>
          <FileUpload
            cod_material={materiais[0]?.cod_material}
            forn={SLOT}
            arquivoAtual={cotacoes[materiais[0]?.cod_material]?.[SLOT]?.arquivo || ""}
            handleArquivoChange={(cod_material, forn, campo, valor) => {
              materiais.forEach((mat) => handleArquivoChange(mat.cod_material, SLOT, campo, valor));
            }}
          />
        </Paper>
      )}

      {/* Ações */}
      <Grid container spacing={2} sx={{ mt: 4 }}>
        <Grid item>
          <Button variant="outlined" onClick={() => navigate("../../")}>
            Voltar
          </Button>
        </Grid>
        <Grid item>
          <Button variant="outlined" onClick={handlePreview}>
            Preview
          </Button>
        </Grid>
        <Grid item sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSalvarCotacao}
            disabled={salvandoCotacao}
          >
            {salvandoCotacao ? "Salvando..." : "Salvar Cotação"}
          </Button>
          {/* <Button
            variant="contained"
            color="success"
            onClick={async () => {
              await handleSalvarCotacao();
              await handleFinalizarProcesso();
            }}
            disabled={!podeFinalizarProcesso || finalizandoProcesso}
          >
            {finalizandoProcesso ? "Finalizando..." : "Finalizar Processo"}
          </Button> */}
        </Grid>
      </Grid>

      {/* Modal Importar */}
      <Dialog open={openModal} onClose={handleCloseModal}>
        <DialogTitle>Importar Cotação</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Selecione o arquivo Excel (.xlsx) para importar:
          </Typography>
          <TextField
            type="file"
            fullWidth
            inputProps={{ accept: ".xlsx,.xls" }}
            onChange={handleImportChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cancelar</Button>
          <Button variant="contained" color="primary" onClick={handleImport}>
            Enviar
          </Button>
        </DialogActions>
      </Dialog>

      <CustomSnackbar open={snackbarOpen} onClose={handleSnackbarClose} message={snackbarMessage} />
    </Paper>
  );
};

export default Index;