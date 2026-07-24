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
import { useNavigate, useParams, useLocation } from "react-router-dom";
import useCotacao from "../../../../hooks/useCotacao";
import useFornecedores from "../../../../hooks/useFornecedores";
import axios from "axios";
import CustomSnackbar from "../../../../components/SnackBar/SnackBar";
import { CloudUpload } from "lucide-react";
import * as XLSX from "xlsx";

const FileUpload = ({
  cod_material,
  forn,
  arquivoAtual,
  handleArquivoChange,
  fornecedorSelecionado,
}) => {
  const [preview, setPreview] = useState("");

  useEffect(() => {
    // Se já existe arquivo vindo do backend, carrega no preview
    if (arquivoAtual) {
      setPreview(arquivoAtual);
    }
  }, [arquivoAtual]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Cria preview temporário local
      const fileURL = URL.createObjectURL(file);
      setPreview(fileURL);

      // Sobe para o pai (vai salvar junto com os outros campos)
      handleArquivoChange(cod_material, forn, "arquivo", file);
    }
  };

  return (
    <Box>
      <Button variant="contained" component="label" startIcon={<CloudUpload />}>
        Selecionar Arquivo
        <input type="file" hidden onChange={handleFileChange} />
      </Button>

      {/* Preview do arquivo */}
      {preview && (
        <Box sx={{ mt: 2 }}>
          {typeof preview === "string" &&
          (preview.startsWith("http") || preview.includes("/")) ? (
            <a href={preview} target="_blank" rel="noopener noreferrer">
              📄 Visualizar Proposta
            </a>
          ) : (
            <Typography variant="body2">
              {typeof preview === "string" ? preview : "Arquivo selecionado"}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cod_compra } = useParams();
  const { materiais, loading, error } = useCotacao(cod_compra);

  const [cotacoes, setCotacoes] = useState(
    () => location.state?.initialCotacoes || {}
  );
  const { fornecedores: dataFornecedores } = useFornecedores();

  // Estados para Snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Estados para controle da finalização
  const [materiaisStatus, setMateriaisStatus] = useState({});
  const [podeFinalizarProcesso, setPodeFinalizarProcesso] = useState(false);
  const [salvandoCotacao, setSalvandoCotacao] = useState(false);
  const [finalizandoProcesso, setFinalizandoProcesso] = useState(false);
  const [carregandoCotacoes, setCarregandoCotacoes] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [file, setFile] = useState(null);

  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => {
    setFile(null);
    setOpenModal(false);
  };

  const handleImportChange = (e) => setFile(e.target.files[0]);

  const handleImport = async () => {
    if (!file) {
      alert("Selecione um arquivo primeiro!");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      // 🔹 Busca especificamente a aba 'cotacao'
      const sheetName = workbook.SheetNames.find(
        (name) => name.toLowerCase() === "cotacao"
      );

      if (!sheetName) {
        alert("A aba 'cotacao' não foi encontrada no arquivo!");
        return;
      }

      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      // 🔹 Mapas de correlação
      const tipoFreteMap = {
        1: "CIF",
        2: "FOB",
        CIF: "CIF",
        FOB: "FOB",
      };

      const condPgtoMap = {
        1: "PIX",
        2: "BOLETO",
        3: "A VISTA",
        4: "PARCELADO",
        PIX: "PIX",
        BOLETO: "BOLETO",
        "A VISTA": "A VISTA",
        PARCELADO: "PARCELADO",
      };

      // 🔹 Cria cópia do estado atual
      const novasCotacoes = { ...cotacoes };

      // 🔹 Limpa todos os slots antes da importação
      console.log(novasCotacoes);
      Object.keys(novasCotacoes).forEach((codigo) => {
        novasCotacoes[codigo] = {
          ...novasCotacoes[codigo],
          "Fornecedor I": {},
          "Fornecedor II": {},
          "Fornecedor III": {},
          "Fornecedor IV": {},
          "Fornecedor V": {},
        };
      });

      // 🔹 Cria um mapa de CNPJs limpos e normalizados dos fornecedores
      const fornecedoresMap = {};
      dataFornecedores.forEach((f) => {
        const cnpjLimpo = String(f.cnpj || "")
          .replace(/[^\d]/g, "")
          .padStart(14, "0")
          .trim();
        if (cnpjLimpo) fornecedoresMap[cnpjLimpo] = f;
      });

      // 🔹 Percorre todas as linhas da planilha
      rows.forEach((row, index) => {
        const codigo = String(row["Código do Material"] || "")
          .replace(/^'/, "") // remove apóstrofe no início
          .trim();
        if (!novasCotacoes[codigo]) {
          console.warn(
            `⚠️ Material ${codigo} não encontrado (linha ${index + 1})`
          );
          return;
        }

        const cnpj = String(row["CNPJ do Fornecedor"] || "")
          .replace(/[^\d]/g, "")
          .padStart(14, "0")
          .trim();

        if (!cnpj) {
          console.warn(`⚠️ Linha ${index + 1}: CNPJ vazio na planilha`);
          return;
        }

        const fornecedor = fornecedoresMap[cnpj];
        if (!fornecedor) {
          console.warn(
            `⚠️ Fornecedor com CNPJ ${cnpj} não encontrado no banco`
          );
          return;
        }

        const preco = parseFloat(row["Preço Unitário"]) || 0;
        const tipoFreteValor = String(row["Tipo de Frete"] || "")
          .toUpperCase()
          .trim();
        const tipoFrete = tipoFreteMap[tipoFreteValor] || "";
        const condPgtoValor = String(row["Condição Pgto"] || "")
          .toUpperCase()
          .trim();
        const condPgto = condPgtoMap[condPgtoValor] || "";
        const valorFrete = parseFloat(row["Valor do Frete"]) || 0;
        const condEntrega = String(row["Prazo de Entrega"] || "").trim();
        const ipi = parseFloat(row["IPI"]) || 0;
        const icms = parseFloat(row["ICMS"]) || 0;
        const obs = row["OBS"] || "";

        const qtdParcela = parseInt(row["Qtd. Parcelas"]) || 0;
        const datasParcelas = [];

        if (qtdParcela > 0) {
          for (let i = 1; i <= qtdParcela; i++) {
            const nomeColuna = `${i}º Parcela`;
            const valorParcela = row[nomeColuna]
              ? String(row[nomeColuna]).trim()
              : "";
            datasParcelas.push(valorParcela);
          }
        }

        // 🔹 Identifica slots disponíveis
        const slots = [
          "Fornecedor I",
          "Fornecedor II",
          "Fornecedor III",
          "Fornecedor IV",
          "Fornecedor V",
        ];

        const cotacaoAtual = { ...novasCotacoes[codigo] };
        const slotLivre = slots.find(
          (s) =>
            !cotacaoAtual[s]?.nomeFornecedor ||
            cotacaoAtual[s].nomeFornecedor === ""
        );

        if (!slotLivre) {
          console.warn(`⚠️ Todos os slots estão preenchidos para ${codigo}`);
          return;
        }

        // 🔹 Adiciona fornecedor com todas as informações
        cotacaoAtual[slotLivre] = {
          nomeFornecedor: fornecedor.id,
          preco,
          tipoFrete,
          valorFrete,
          condEntrega,
          ipi,
          icms,
          obs,
          condPgto,
          qtdParcela: qtdParcela > 0 ? qtdParcela : "",
          datasParcelas,
        };

        novasCotacoes[codigo] = cotacaoAtual;
      });

      setCotacoes(novasCotacoes);
      showSnackbar("Dados importados com sucesso!");
      handleCloseModal();
    };

    reader.readAsArrayBuffer(file);
  };

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };
  const handleSnackbarClose = () => setSnackbarOpen(false);

  const handleArquivoChange = (cod_material, fornecedor, campo, valor) => {
    setCotacoes((prev) => ({
      ...prev,
      [cod_material]: {
        ...prev[cod_material],
        [fornecedor]: {
          ...prev[cod_material]?.[fornecedor],
          [campo]: valor,
        },
      },
    }));
  };

  // Carregar cotações existentes ao montar o componente
  useEffect(() => {
    const carregarCotacoesExistentes = async () => {
      if (!cod_compra) return;

      setCarregandoCotacoes(true);
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/cotacao/${cod_compra}/existentes`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log(response);

        const { cotacoes = [], dados_historicos = {} } = response.data;

        if (cotacoes.length > 0 || Object.keys(dados_historicos).length > 0) {
          const cotacoesExistentes = {};
          const slots = [
            "Fornecedor I",
            "Fornecedor II",
            "Fornecedor III",
            "Fornecedor IV",
            "Fornecedor V",
          ];

          // Primeiro, inicializa todos os materiais com dados históricos
          Object.keys(dados_historicos).forEach((cod_material) => {
            const historico = dados_historicos[cod_material];
            cotacoesExistentes[cod_material] = {
              ultima_compra: historico.ultima_compra || 0,
              media_historica: historico.media_historica || 0,
              media_6_meses: historico.media_6_meses || 0,
              fornecedores: [],
            };
          });

          // Agrupa cotações por material
          cotacoes.forEach((cotacao) => {
            // Se o material não existe ainda (não tinha histórico), cria
            if (!cotacoesExistentes[cotacao.cod_material]) {
              cotacoesExistentes[cotacao.cod_material] = {
                ultima_compra: 0,
                media_historica: 0,
                media_6_meses: 0,
                fornecedores: [],
              };
            }

            cotacoesExistentes[cotacao.cod_material].fornecedores.push({
              nomeFornecedor: cotacao.fornecedor_id,
              preco: cotacao.preco || "",
              tipoFrete: cotacao.tipo_frete || "",
              condPgto: cotacao.cond_pgto || "",
              condEntrega: cotacao.cond_entrega || "",
              ipi: cotacao.ipi || "",
              icms: cotacao.icms || "",
              valorFrete: cotacao.valor_frete || "",
              obs: cotacao.obs || "",
              qtdParcela: cotacao.qtd_parcelas || "",
              datasParcelas: JSON.parse(cotacao.datasParcelas || "[]").map(
                (d) => d.dias || ""
              ),
              arquivo: cotacao.arquivo,
            });
          });

          // Converte os fornecedores em slots fixos
          Object.keys(cotacoesExistentes).forEach((cod_material) => {
            const materialData = cotacoesExistentes[cod_material];
            const slotsData = {};

            materialData.fornecedores.forEach((fornData, index) => {
              if (index < slots.length) {
                slotsData[slots[index]] = fornData;
              }
            });

            delete materialData.fornecedores;
            Object.assign(materialData, slotsData);
          });

          setCotacoes((prev) => ({
            ...prev,
            ...cotacoesExistentes,
          }));
        }
      } catch (error) {
        console.error("Erro ao carregar cotações existentes:", error);
      } finally {
        setCarregandoCotacoes(false);
      }
    };

    carregarCotacoesExistentes();
  }, [cod_compra]);

  // Verificar status dos materiais
  useEffect(() => {
    const verificarStatus = () => {
      const status = {};
      let todosPossuemTres = true;

      materiais.forEach((material) => {
        const fornecedores = cotacoes[material.cod_material] || {};
        const count = Object.keys(fornecedores)
          .map((f) => fornecedores[f])
          .filter((f) => f && f.nomeFornecedor && f.preco).length;

        status[material.cod_material] = {
          count,
          temTres: count >= 3,
        };

        if (count < 3) {
          todosPossuemTres = false;
        }
      });

      setMateriaisStatus(status);
      setPodeFinalizarProcesso(todosPossuemTres && materiais.length > 0);
    };

    if (!carregandoCotacoes) {
      verificarStatus();
    }
  }, [cotacoes, materiais, carregandoCotacoes]);

  const handlePreview = () => {
    handleSalvarCotacao();
    navigate("../preview", { state: { materiais, cotacoes, cod_compra } });
  };

  const handleChange = (cod_material, fornecedor, campo, valor) => {
    setCotacoes((prev) => {
      const novoState = {
        ...prev,
        [cod_material]: {
          ...prev[cod_material],
          [fornecedor]: {
            ...prev[cod_material]?.[fornecedor],
            [campo]: valor,
          },
        },
      };

      // Se estiver alterando a quantidade de parcelas, ajustar o array datasParcelas
      if (campo === "qtdParcela") {
        const qtdNova = parseInt(valor) || 0;
        const parcelasAtuais =
          prev[cod_material]?.[fornecedor]?.datasParcelas || [];

        // Se diminuiu a quantidade, cortar o array
        if (qtdNova < parcelasAtuais.length) {
          novoState[cod_material][fornecedor].datasParcelas =
            parcelasAtuais.slice(0, qtdNova);
        }
        // Se aumentou, preencher com strings vazias
        else if (qtdNova > parcelasAtuais.length) {
          novoState[cod_material][fornecedor].datasParcelas = [
            ...parcelasAtuais,
            ...Array(qtdNova - parcelasAtuais.length).fill(""),
          ];
        }
      }

      return novoState;
    });
  };

  const handleDownload = () => {
    const url = "https://compras.painel-telecom.com/modelo_cotacao.xlsx"; // Files in public/ are served from root
    const link = document.createElement("a");
    link.href = url;
    link.download = "modelo_cotacao.xlsx";
    document.body.appendChild(link); // Better browser compatibility
    link.click();
    document.body.removeChild(link);
  };

  const handleFornecedorChange = (cod_material, fornecedor, nomeFornecedor) => {
    setCotacoes((prev) => ({
      ...prev,
      [cod_material]: {
        ...prev[cod_material],
        [fornecedor]: {
          ...prev[cod_material]?.[fornecedor],
          nomeFornecedor,
        },
      },
    }));
  };

  // Salvar cotação SEM finalizar processo
  const handleSalvarCotacao = async () => {
    setSalvandoCotacao(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();

      // Array para armazenar todas as cotações
      const todasCotacoes = [];

      Object.keys(cotacoes).forEach((cod_material) => {
        const fornecedores = cotacoes[cod_material];
        if (!fornecedores) return;

        Object.keys(fornecedores).forEach((slotFornecedor) => {
          // "Fornecedor I", "Fornecedor II", etc.
          const f = fornecedores[slotFornecedor];

          // ✅ SÓ processa se tiver fornecedor selecionado E preço
          if (f && f.nomeFornecedor && f.preco) {
            // ✅ Chave única para o arquivo (material + fornecedor REAL)
            const arquivoKey = `${cod_material}_${f.nomeFornecedor}`;

            // ✅ Se tem arquivo novo (File object), adiciona no FormData
            if (f.arquivo instanceof File) {
              console.log(
                `Adicionando arquivo para ${f.nomeFornecedor}: ${arquivoKey}`,
                f.arquivo
              );
              formData.append(`arquivos[${arquivoKey}]`, f.arquivo);
            }

            // ✅ Prepara dados da cotação APENAS para fornecedor com dados
            const cotacaoData = {
              cod_material,
              fornecedor: f.nomeFornecedor, // ID do fornecedor real
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
              // ✅ Envia URL do arquivo existente ou null se for novo
              arquivo: f.arquivo instanceof File ? null : f.arquivo || null,
              // ✅ Mantém a informação do slot para referência
              slot: slotFornecedor,
            };

            todasCotacoes.push(cotacaoData);
            console.log(
              `Cotação preparada para: ${f.nomeFornecedor} - Material: ${cod_material}`
            );
          } else {
            console.log(
              `Fornecedor ${slotFornecedor} ignorado - sem dados suficientes`
            );
          }
        });
      });

      // ✅ Adiciona apenas cotações válidas
      if (todasCotacoes.length === 0) {
        showSnackbar("Nenhuma cotação válida para salvar.");
        setSalvandoCotacao(false);
        return;
      }

      formData.append("cotacoes", JSON.stringify(todasCotacoes));

      console.log("=== DADOS ENVIADOS PARA COTAÇÃO ===");
      console.log("Total de cotações:", todasCotacoes.length);
      todasCotacoes.forEach((cotacao, index) => {
        console.log(`Cotação ${index + 1}:`, {
          material: cotacao.cod_material,
          fornecedor: cotacao.fornecedor,
          preco: cotacao.preco,
          temArquivo: cotacao.arquivo !== null,
        });
      });

      console.log("Arquivos no FormData:");
      for (let pair of formData.entries()) {
        if (pair[1] instanceof File) {
          console.log(pair[0], pair[1].name);
        } else {
          console.log(pair[0], pair[1]);
        }
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/cotacaoCompra/${cod_compra}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 200 || response.status === 201) {
        showSnackbar("Cotação salva com sucesso!");
      } else {
        showSnackbar("Erro ao salvar a cotação.");
      }
    } catch (error) {
      console.error("Erro completo:", error);
      console.error("Response:", error.response?.data);
      showSnackbar(
        "Erro ao salvar a cotação: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setSalvandoCotacao(false);
    }
  };

  // Finalizar processo de cotação
  const handleFinalizarProcesso = async () => {
    if (!podeFinalizarProcesso) {
      showSnackbar(
        "Todos os materiais devem ter pelo menos 3 fornecedores cotados para finalizar o processo."
      );
      return;
    }

    setFinalizandoProcesso(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/cotacao/${cod_compra}/finalizar`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200 || response.status === 201) {
        showSnackbar("Processo de cotação finalizado com sucesso!");
        setTimeout(() => {
          navigate("../../", { replace: true });
        }, 2000);
      } else {
        showSnackbar("Erro ao finalizar o processo.");
      }
    } catch (error) {
      console.error(error);
      if (error.response?.data?.materiais_insuficientes) {
        showSnackbar(error.response.data.message);
      } else {
        showSnackbar(
          "Erro ao finalizar processo: " +
            (error.response?.data?.message || error.message)
        );
      }
    } finally {
      setFinalizandoProcesso(false);
    }
  };

  if (loading || carregandoCotacoes)
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );

  if (error)
    return <Typography color="error">Erro ao carregar materiais</Typography>;
  if (!materiais.length)
    return <Typography>Nenhum material encontrado</Typography>;

  return (
    <Paper sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h5" gutterBottom>
          Cotação de Materiais - Código da Compra: {cod_compra}
        </Typography>

        <Box sx={{ display: "flex", gap: 2 }}>
          <Button variant="contained" onClick={handleOpenModal}>
            Importar Cotação
          </Button>
          <Button variant="contained" color="success" onClick={handleDownload}>
            Baixar Planilha
          </Button>
        </Box>
      </Box>

      {/* Alertas de Status */}
      <Box sx={{ mb: 3 }}>
        {!podeFinalizarProcesso && materiais.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Para finalizar o processo, todos os materiais devem ter pelo menos 3
            fornecedores cotados.
          </Alert>
        )}

        {podeFinalizarProcesso && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Todos os materiais possuem pelo menos 3 fornecedores. Você pode
            finalizar o processo!
          </Alert>
        )}
      </Box>

      {materiais.map((mat) => {
        const qtd = mat.quantidade || 0;
        const status = materiaisStatus[mat.cod_material] || {
          count: 0,
          temTres: false,
        };

        return (
          <Paper
            key={mat.cod_material}
            sx={{ p: 2, mt: 4, border: "2px solid #1976d2", borderRadius: 2 }}
            elevation={3}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Typography
                variant="h6"
                sx={{ fontWeight: "bold", color: "#1976d2", flexGrow: 1 }}
              >
                Material: {mat.cod_material} - {mat.descricao}
              </Typography>

              <Chip
                label={`${status.count}/3 fornecedores`}
                color={
                  status.temTres
                    ? "success"
                    : status.count >= 2
                    ? "warning"
                    : "error"
                }
                size="small"
              />
            </Box>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={2}>
                <TextField
                  label="Unidade"
                  value={mat.unid}
                  disabled
                  fullWidth
                />
              </Grid>
              <Grid item xs={2}>
                <TextField label="Qtd" value={qtd} disabled fullWidth />
              </Grid>
            </Grid>

            {[
              "Fornecedor I",
              "Fornecedor II",
              "Fornecedor III",
              "Fornecedor IV",
              "Fornecedor V",
            ].map((forn) => {
              const fornecedorData = cotacoes[mat.cod_material]?.[forn] || {};
              const precoUnit = parseFloat(fornecedorData.preco || 0);
              const totalCompra = precoUnit * qtd;

              return (
                <Paper
                  key={forn}
                  sx={{
                    p: 2,
                    mt: 2,
                    background: "#fafafa",
                    border: "1px solid #ddd",
                    width: "100%",
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: "bold", mb: 1 }}
                  >
                    {forn}
                  </Typography>

                  {/* Primeira Linha */}
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <FormControl fullWidth sx={{ minWidth: 210 }}>
                        <InputLabel>Fornecedor</InputLabel>
                        <Select
                          value={fornecedorData.nomeFornecedor || ""}
                          onChange={(e) =>
                            handleFornecedorChange(
                              mat.cod_material,
                              forn,
                              e.target.value
                            )
                          }
                        >
                          {(dataFornecedores || []).map((f) => (
                            <MenuItem key={f.id} value={f.id}>
                              {f.nome_fantasia}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={2}>
                      <TextField
                        label="Preço Médio (R$)"
                        type="number"
                        fullWidth
                        value={
                          fornecedorData.nomeFornecedor &&
                          fornecedorData.preco &&
                          cotacoes[mat.cod_material]?.media_historica
                            ? parseFloat(
                                cotacoes[mat.cod_material].media_historica
                              ).toFixed(2)
                            : ""
                        }
                        disabled
                      />
                    </Grid>

                    <Grid item xs={2}>
                      <TextField
                        label="Preço Médio (R$) (Ult. 6 meses)"
                        type="number"
                        fullWidth
                        value={
                          fornecedorData.nomeFornecedor &&
                          fornecedorData.preco &&
                          cotacoes[mat.cod_material]?.media_6_meses
                            ? parseFloat(
                                cotacoes[mat.cod_material].media_6_meses
                              ).toFixed(2)
                            : ""
                        }
                        disabled
                      />
                    </Grid>

                    <Grid item xs={2}>
                      <TextField
                        label="Valor Ult. Compra"
                        fullWidth
                        value={
                          fornecedorData.nomeFornecedor &&
                          fornecedorData.preco &&
                          cotacoes[mat.cod_material]?.ultima_compra
                            ? parseFloat(
                                cotacoes[mat.cod_material].ultima_compra
                              ).toFixed(2)
                            : ""
                        }
                        disabled
                      />
                    </Grid>
                  </Grid>

                  {/* Segunda Linha */}
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        label="Preço Unit. (R$)"
                        type="number"
                        fullWidth
                        value={fornecedorData.preco || ""}
                        onChange={(e) =>
                          handleChange(
                            mat.cod_material,
                            forn,
                            "preco",
                            e.target.value
                          )
                        }
                        inputProps={{ min: 0 }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        label="Total Item (R$)"
                        value={totalCompra ? totalCompra.toFixed(2) : ""}
                        fullWidth
                        disabled
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <FormControl fullWidth sx={{ minWidth: 210 }}>
                        <InputLabel
                          id={`tipoFrete-label-${mat.cod_material}-${forn}`}
                        >
                          Tipo de Frete
                        </InputLabel>
                        <Select
                          labelId={`tipoFrete-label-${mat.cod_material}-${forn}`}
                          value={fornecedorData.tipoFrete || ""}
                          onChange={(e) =>
                            handleChange(
                              mat.cod_material,
                              forn,
                              "tipoFrete",
                              e.target.value
                            )
                          }
                        >
                          <MenuItem value="CIF">CIF</MenuItem>
                          <MenuItem value="FOB">FOB</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                      <FormControl fullWidth sx={{ minWidth: 210 }}>
                        <InputLabel
                          id={`condPgto-label-${mat.cod_material}-${forn}`}
                        >
                          Cond. Pagamento
                        </InputLabel>
                        <Select
                          labelId={`condPgto-label-${mat.cod_material}-${forn}`}
                          value={fornecedorData.condPgto || ""}
                          onChange={(e) =>
                            handleChange(
                              mat.cod_material,
                              forn,
                              "condPgto",
                              e.target.value
                            )
                          }
                        >
                          <MenuItem value="PARCELADO">PARCELADO</MenuItem>
                          <MenuItem value="A VISTA">À VISTA</MenuItem>
                          <MenuItem value="BOLETO">BOLETO</MenuItem>
                          <MenuItem value="PIX">PIX</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    {(fornecedorData.condPgto === "PARCELADO" ||
                      fornecedorData.condPgto === "BOLETO") && (
                      <>
                        <Grid item xs={12}>
                          <TextField
                            label="Qtd. Parcelas"
                            type="number"
                            fullWidth
                            value={
                              fornecedorData.condPgto === "BOLETO"
                                ? 1
                                : fornecedorData.qtdParcela || ""
                            }
                            onChange={(e) => {
                              // Se for BOLETO, força 1 parcela, senão usa o valor digitado
                              const value =
                                fornecedorData.condPgto === "BOLETO"
                                  ? 1
                                  : e.target.value;
                              handleChange(
                                mat.cod_material,
                                forn,
                                "qtdParcela",
                                value
                              );
                            }}
                            disabled={fornecedorData.condPgto === "BOLETO"}
                          />
                        </Grid>

                        {Array.from({
                          length:
                            fornecedorData.condPgto === "BOLETO"
                              ? 1
                              : Number(fornecedorData.qtdParcela) || 0,
                        }).map((_, index) => (
                          <Grid item xs={12} key={index}>
                            <TextField
                              label={`Dias para ${index + 1}º Parcela`}
                              fullWidth
                              value={
                                fornecedorData.datasParcelas?.[index] || ""
                              }
                              onChange={(e) => {
                                const novasDatas = [
                                  ...(fornecedorData.datasParcelas || []),
                                ];
                                novasDatas[index] = e.target.value;
                                handleChange(
                                  mat.cod_material,
                                  forn,
                                  "datasParcelas",
                                  novasDatas
                                );
                              }}
                            />
                          </Grid>
                        ))}
                      </>
                    )}

                    <Grid item xs={12}>
                      <TextField
                        label="Prazo de Entrega (Dias)"
                        fullWidth
                        value={fornecedorData.condEntrega || ""}
                        onChange={(e) =>
                          handleChange(
                            mat.cod_material,
                            forn,
                            "condEntrega",
                            e.target.value
                          )
                        }
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        label="IPI (%)"
                        type="number"
                        fullWidth
                        value={fornecedorData.ipi || ""}
                        onChange={(e) =>
                          handleChange(
                            mat.cod_material,
                            forn,
                            "ipi",
                            e.target.value
                          )
                        }
                        inputProps={{ min: 0 }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        label="ICMS (%)"
                        type="number"
                        fullWidth
                        value={fornecedorData.icms || ""}
                        onChange={(e) =>
                          handleChange(
                            mat.cod_material,
                            forn,
                            "icms",
                            e.target.value
                          )
                        }
                        inputProps={{ min: 0 }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        label="Valor do Frete (R$)"
                        type="number"
                        fullWidth
                        value={fornecedorData.valorFrete || ""}
                        onChange={(e) =>
                          handleChange(
                            mat.cod_material,
                            forn,
                            "valorFrete",
                            e.target.value
                          )
                        }
                        disabled={fornecedorData.tipoFrete == "CIF"}
                        inputProps={{ min: 0 }}
                      />
                    </Grid>

                    <Grid item xs={12} sx={{ minWidth: "100%" }}>
                      <TextField
                        label="Observação"
                        fullWidth
                        multiline
                        rows={3}
                        value={fornecedorData.obs || ""}
                        onChange={(e) =>
                          handleChange(
                            mat.cod_material,
                            forn,
                            "obs",
                            e.target.value
                          )
                        }
                      />
                    </Grid>
                  </Grid>
                </Paper>
              );
            })}
          </Paper>
        );
      })}
      {/* SEÇÃO 2: UPLOAD DE PROPOSTAS - ORGANIZADO POR FORNECEDOR */}
      <Paper sx={{ p: 3, backgroundColor: "#fafafa", mt: 2 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>
          📎 Anexar Propostas dos Fornecedores
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Faça o upload das propostas comerciais para cada fornecedor (o arquivo
          será aplicado a todos os materiais deste fornecedor)
        </Typography>

        {[
          "Fornecedor I",
          "Fornecedor II",
          "Fornecedor III",
          "Fornecedor IV",
          "Fornecedor V",
        ].map((forn) => {
          const materiaisComFornecedor = materiais.filter((mat) => {
            const fornecedorData = cotacoes[mat.cod_material]?.[forn] || {};
            return fornecedorData.nomeFornecedor;
          });

          const primeiroMaterial = materiaisComFornecedor[0];
          const fornecedorData = primeiroMaterial
            ? cotacoes[primeiroMaterial.cod_material]?.[forn]
            : {};
          const fornecedorId = fornecedorData.nomeFornecedor;

          if (!fornecedorId) return null;

          const nomeFornecedor =
            dataFornecedores?.find((f) => f.id === fornecedorId)
              ?.nome_fantasia || fornecedorId;

          return (
            <Paper
              key={`proposta-${forn}`}
              sx={{ p: 3, mt: 2, fontWeight: "bold" }} // removido border e borderRadius
            >
              {forn}
              <FileUpload
                cod_material={primeiroMaterial.cod_material}
                forn={forn}
                arquivoAtual={fornecedorData.arquivo || ""}
                handleArquivoChange={(
                  cod_material,
                  fornecedor,
                  campo,
                  valor
                ) => {
                  materiaisComFornecedor.forEach((mat) => {
                    handleArquivoChange(mat.cod_material, forn, campo, valor);
                  });
                }}
                fornecedorSelecionado={fornecedorId}
              />
            </Paper>
          );
        })}

        {[
          "Fornecedor I",
          "Fornecedor II",
          "Fornecedor III",
          "Fornecedor IV",
          "Fornecedor V",
        ].every((forn) => {
          const temFornecedor = materiais.some((mat) => {
            const fornecedorData = cotacoes[mat.cod_material]?.[forn] || {};
            return fornecedorData.nomeFornecedor;
          });
          return !temFornecedor;
        }) && (
          <Box
            sx={{
              textAlign: "center",
              p: 4,
              bgcolor: "#f9f9f9",
              borderRadius: 1,
            }}
          >
            <Typography variant="body1" color="textSecondary">
              Selecione fornecedores na seção de cotação para habilitar o upload
              de propostas
            </Typography>
          </Box>
        )}
      </Paper>

      <Grid container spacing={2} sx={{ mt: 4 }}>
        {/* Botões à esquerda */}
        <Grid item>
          <Button
            variant="outlined"
            color="gray"
            onClick={() => navigate("../../")}
          >
            Voltar
          </Button>
        </Grid>

        <Grid item>
          <Button variant="outlined" onClick={handlePreview}>
            Preview
          </Button>
        </Grid>

        <Grid item sx={{ display: "flex", gap: 2 }}>
          {/* Botão Salvar */}
          <Button
            variant="contained"
            color="primary"
            onClick={async () => {
              try {
                await handleSalvarCotacao();
              } catch (error) {
                console.error("Erro ao salvar:", error);
              }
            }}
            disabled={salvandoCotacao}
          >
            {salvandoCotacao ? "Salvando..." : "Salvar Cotação"}
          </Button>

          {/* Botão Finalizar */}
          <Button
            variant="contained"
            color="success"
            onClick={async () => {
              try {
                await handleSalvarCotacao(); // garante que salvou antes
                await handleFinalizarProcesso();
              } catch (error) {
                console.error("Erro ao finalizar:", error);
              }
            }}
            disabled={!podeFinalizarProcesso || finalizandoProcesso}
          >
            {finalizandoProcesso ? "Finalizando..." : "Finalizar Processo"}
          </Button>
        </Grid>
      </Grid>
      {/* Modal para importar cotação */}
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

      {/* Componente Snackbar */}
      <CustomSnackbar
        open={snackbarOpen}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
      />
    </Paper>
  );
};

export default Index;
