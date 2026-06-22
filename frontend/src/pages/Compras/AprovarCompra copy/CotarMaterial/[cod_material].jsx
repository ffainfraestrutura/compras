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
  DialogContentText,
  DialogActions,
  InputAdornment,
} from "@mui/material";
import { useNavigate, useParams, useLocation } from "react-router-dom";
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
  const { cod_material } = useParams();

  // ADICIONAR:
  const cod_cotacao = location.state?.cod_cotacao || useParams().cod_cotacao;

  // Estados principais
  const [materiais, setMateriais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cotacaoFinalizada, setCotacaoFinalizada] = useState(false);
  const [cotacaoEditavel, setCotacaoEditavel] = useState(true);
  // No seu useState, adicione:
  const [dadosHistoricos, setDadosHistoricos] = useState({});

  const [cotacoes, setCotacoes] = useState(
    () => location.state?.initialCotacoes || {}
  );
  const [cotacaoCodigo, setCotacaoCodigo] = useState(cod_cotacao || null);
  const { fornecedores: dataFornecedores } = useFornecedores();

  // Estados para Snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Estados para controle da finalização
  const [materiaisStatus, setMateriaisStatus] = useState({});
  const [podeFinalizarProcesso, setPodeFinalizarProcesso] = useState(false);
  const [salvandoCotacao, setSalvandoCotacao] = useState(false);
  const [carregandoCotacoes, setCarregandoCotacoes] = useState(true);

  // Estados para diálogo de confirmação
  const [dialogOpen, setDialogOpen] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [file, setFile] = useState(null);

  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => {
    setFile(null);
    setOpenModal(false);
  };
  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };
  const handleSnackbarClose = () => setSnackbarOpen(false);

  const handleDownload = () => {
    const url = "https://ffasip.ddns.net:4545/compras/modelo_cotacao.xlsx"; // Files in public/ are served from root
    const link = document.createElement("a");
    link.href = url;
    link.download = "modelo_cotacao.xlsx";
    document.body.appendChild(link); // Better browser compatibility
    link.click();
    document.body.removeChild(link);
  };

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

  const handleImportChange = (e) => setFile(e.target.files[0]);
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

      // ✅ CORREÇÃO: Criar estrutura inicial baseada nos materiais
      const materialData = {};

      // Inicializa cada material com slots vazios
      materiais.forEach((material) => {
        materialData[material.cod_material] = {
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
      let importCount = 0;
      let warnings = [];

      rows.forEach((row, index) => {
        const codigo = String(row["Código do Material"] || "")
          .replace(/^'/, "") // remove apóstrofe no início
          .trim();

        // ✅ Verifica se o material existe na lista de materiais
        if (!materialData[codigo]) {
          warnings.push(
            `⚠️ Material ${codigo} não encontrado (linha ${index + 1})`
          );
          return;
        }

        const cnpj = String(row["CNPJ do Fornecedor"] || "")
          .replace(/[^\d]/g, "")
          .padStart(14, "0")
          .trim();

        if (!cnpj) {
          warnings.push(`⚠️ Linha ${index + 1}: CNPJ vazio na planilha`);
          return;
        }

        const fornecedor = fornecedoresMap[cnpj];
        if (!fornecedor) {
          warnings.push(
            `⚠️ Fornecedor com CNPJ ${cnpj} não encontrado no banco (linha ${
              index + 1
            })`
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

        const cotacaoAtual = { ...materialData[codigo] };
        const slotLivre = slots.find(
          (s) =>
            !cotacaoAtual[s]?.nomeFornecedor ||
            cotacaoAtual[s].nomeFornecedor === ""
        );

        if (!slotLivre) {
          warnings.push(
            `⚠️ Todos os slots estão preenchidos para ${codigo} (linha ${
              index + 1
            })`
          );
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

        materialData[codigo] = cotacaoAtual;
        importCount++;
      });

      // Mostra warnings se houver
      if (warnings.length > 0) {
        console.warn("Warnings na importação:", warnings);
        alert(
          `Importação concluída com ${warnings.length} avisos. Verifique o console.`
        );
      }

      setCotacoes(materialData);
      showSnackbar(
        `Dados importados com sucesso! ${importCount} cotações processadas.`
      );
      handleCloseModal();
    };

    reader.readAsArrayBuffer(file);
  };

  // Carregar dados do material específico
  useEffect(() => {
    const carregarMaterial = async () => {
      if (!cod_material) return;

      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/cotacaoMaterial/${cod_material}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params: { cod_cotacao },
          }
        );

        if (response.data && response.data.length > 0) {
          const materialData = response.data[0];
          setMateriais([
            {
              cod_cotacao: materialData.cod_cotacao || cod_cotacao,
              cod_material: materialData.cod_material,
              descricao: materialData.descricao,
              unid: materialData.unidade,
              quantidade: materialData.quantidade_total,
            },
          ]);
        } else {
          setError("Material não encontrado");
        }
      } catch (error) {
        console.error("Erro ao carregar material:", error);
        setError("Erro ao carregar dados do material");
      } finally {
        setLoading(false);
      }
    };

    carregarMaterial();
  }, [cod_material]);

  // Carregar cotações existentes para o material
  useEffect(() => {
    const carregarCotacoesExistentes = async () => {
      if (!cod_cotacao) return;

      setCarregandoCotacoes(true);
      try {
        const token = localStorage.getItem("token");

        const response = await axios.get(
          `${
            import.meta.env.VITE_API_URL
          }/cotacaoMaterial/${cod_material}/existentes`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params: { cod_cotacao },
          }
        );

        // Verificar se a resposta é um array (com cotações) ou objeto (sem cotações)
        let cotacoesData = [];
        let dadosHistoricos = null;

        if (Array.isArray(response.data)) {
          // Formato com cotações
          cotacoesData = response.data;

          if (cotacoesData.length > 0) {
            const primeiraCotacao = cotacoesData[0];
            setCotacaoEditavel(primeiraCotacao.editavel !== false);
            setCotacaoFinalizada(primeiraCotacao.editavel === false);

            // Extrair dados históricos da primeira cotação
            dadosHistoricos = {
              ultima_compra: primeiraCotacao.ultima_compra,
              media_historica: primeiraCotacao.media_historica,
              media_6_meses: primeiraCotacao.media_6_meses,
            };
          }
        } else if (response.data && typeof response.data === "object") {
          // Novo formato sem cotações
          cotacoesData = response.data.cotacoes || [];
          dadosHistoricos = response.data.dados_historicos || null;

          // Se não há cotações, assume que é editável
          setCotacaoEditavel(true);
          setCotacaoFinalizada(false);
        }

        // Atualizar dados históricos no estado
        if (dadosHistoricos) {
          setDadosHistoricos((prev) => ({
            ...prev,
            [cod_material]: dadosHistoricos,
          }));
        }

        // Processar cotações existentes
        if (cotacoesData.length > 0) {
          const cotacoesExistentes = {};
          cotacoesExistentes[cod_material] = {};

          const slots = [
            "Fornecedor I",
            "Fornecedor II",
            "Fornecedor III",
            "Fornecedor IV",
            "Fornecedor V",
          ];

          cotacoesData.forEach((cotacao, index) => {
            const slot = slots[index] || slots[0];

            cotacoesExistentes[cod_material][slot] = {
              nomeFornecedor: cotacao.fornecedor_id,
              preco: cotacao.preco || "",
              tipoFrete: cotacao.tipo_frete || "",
              condPgto: cotacao.cond_pgto || "",
              condEntrega: cotacao.cond_entrega || "",
              ipi: cotacao.ipi || "",
              icms: cotacao.icms || "",
              valorFrete: cotacao.valor_frete || "",
              obs: cotacao.obs || "",
              qtdParcela: parseInt(cotacao.qtd_parcelas) || 1,
              datasParcelas: (cotacao.datasParcelas || []).map(
                (d) => d.dias || ""
              ),
              arquivo: cotacao.arquivo,
            };
          });

          setCotacoes((prev) => ({
            ...prev,
            ...cotacoesExistentes,
          }));
        } else {
          // Limpar cotações se não houver dados
          setCotacoes((prev) => {
            const newCotacoes = { ...prev };
            delete newCotacoes[cod_material];
            return newCotacoes;
          });
        }
      } catch (error) {
        console.error("Erro ao carregar cotações existentes:", error);
      } finally {
        setCarregandoCotacoes(false);
      }
    };

    if (materiais.length > 0) {
      carregarCotacoesExistentes();
    }
  }, [cod_cotacao, materiais]);

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
      setPodeFinalizarProcesso(
        todosPossuemTres && materiais.length > 0 && !cotacaoFinalizada
      );
    };

    if (!carregandoCotacoes) {
      verificarStatus();
    }
  }, [cotacoes, materiais, carregandoCotacoes, cotacaoFinalizada]);

  const handlePreview = () => {
    handleOnlySave();
    navigate("../../CotarCompra/preview", { state: { materiais, cotacoes } });
  };

  const handleChange = (cod_material, fornecedor, campo, valor) => {
    if (!cotacaoEditavel) {
      showSnackbar("Esta cotação foi finalizada e não pode ser editada.");
      return;
    }

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

  const handleFornecedorChange = (cod_material, fornecedor, nomeFornecedor) => {
    if (!cotacaoEditavel) {
      showSnackbar("Esta cotação foi finalizada e não pode ser editada.");
      return;
    }

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

  const handleOnlySave = async () => {
    if (!cotacaoEditavel) {
      showSnackbar("Esta cotação foi finalizada e não pode ser editada.");
      return;
    }

    setSalvandoCotacao(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      const todasCotacoes = [];

      // Mesma lógica de construção do FormData do handleSalvarCotacao
      Object.keys(cotacoes).forEach((cod_material_key) => {
        const fornecedores = cotacoes[cod_material_key];
        if (!fornecedores) return;

        Object.keys(fornecedores).forEach((forn) => {
          const f = fornecedores[forn];

          if (f && f.nomeFornecedor && f.preco) {
            const arquivoKey = `${cod_material_key}_${f.nomeFornecedor}`;

            if (f.arquivo instanceof File) {
              formData.append(`arquivos[${arquivoKey}]`, f.arquivo);
            }

            const cotacaoData = {
              cod_material: cod_material_key,
              fornecedor: f.nomeFornecedor,
              preco: parseFloat(f.preco) || 0,
              tipoFrete: f.tipoFrete || "",
              condPgto: f.condPgto || "",
              condEntrega: f.condEntrega || "",
              ipi: parseFloat(f.ipi) || 0,
              icms: parseFloat(f.icms) || 0,
              valorFrete: parseFloat(f.valorFrete) || 0,
              obs: f.obs || "",
              descricao:
                materiais.find((m) => m.cod_material === cod_material_key)
                  ?.descricao || "",
              qtdParcela: parseInt(f.qtdParcela) || 1,
              datasParcelas: f.datasParcelas || [],
              arquivo: f.arquivo instanceof File ? null : f.arquivo || null,
            };

            todasCotacoes.push(cotacaoData);
          }
        });
      });

      if (todasCotacoes.length === 0) {
        showSnackbar("Nenhuma cotação foi preenchida.");
        return;
      }

      formData.append("cotacoes", JSON.stringify(todasCotacoes));

      // Adiciona o cod_cotacao caso exista (pega do state ou do objeto que você usa)
      if (cotacaoCodigo) {
        formData.append("cod_cotacao", cotacaoCodigo);
      }

      const response = await axios.post(
        `${
          import.meta.env.VITE_API_URL
        }/cotacaoMaterial/${cod_material}/salvar`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },

          params: { cotacaoCodigo },
        }
      );

      if (response.status === 200 || response.status === 201) {
        const { codigo_cotacao, finalizada, message } = response.data;
        showSnackbar(message);

        // Atualiza o state com o cod_cotacao retornado
        if (codigo_cotacao) {
          setCotacaoCodigo(codigo_cotacao);
        }

        if (finalizada) {
          setCotacaoFinalizada(true);
          setCotacaoEditavel(false);
        }
      } else {
        showSnackbar("Erro ao salvar a cotação.");
      }
    } catch (error) {
      console.error(error);
      showSnackbar(
        "Erro ao salvar a cotação: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setSalvandoCotacao(false);
    }
  };

  // Salvar cotação para material específico
  // Salvar cotação para material específico
  const handleSalvarCotacao = async () => {
    if (!cotacaoEditavel) {
      showSnackbar("Esta cotação foi finalizada e não pode ser editada.");
      return;
    }

    setSalvandoCotacao(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();

      // Array para armazenar todas as cotações
      const todasCotacoes = [];

      Object.keys(cotacoes).forEach((cod_material_key) => {
        const fornecedores = cotacoes[cod_material_key];
        if (!fornecedores) return;

        Object.keys(fornecedores).forEach((forn) => {
          const f = fornecedores[forn];

          if (f && f.nomeFornecedor && f.preco) {
            // Chave única para o arquivo
            const arquivoKey = `${cod_material_key}_${f.nomeFornecedor}`;

            // Se tem arquivo novo, adiciona no FormData
            if (f.arquivo instanceof File) {
              formData.append(`arquivos[${arquivoKey}]`, f.arquivo);
            }

            // Prepara dados da cotação
            const cotacaoData = {
              cod_material: cod_material_key,
              fornecedor: f.nomeFornecedor,
              preco: parseFloat(f.preco) || 0,
              tipoFrete: f.tipoFrete || "",
              condPgto: f.condPgto || "",
              condEntrega: f.condEntrega || "",
              ipi: parseFloat(f.ipi) || 0,
              icms: parseFloat(f.icms) || 0,
              valorFrete: parseFloat(f.valorFrete) || 0,
              obs: f.obs || "",
              descricao:
                materiais.find((m) => m.cod_material === cod_material_key)
                  ?.descricao || "",
              qtdParcela: parseInt(f.qtdParcela) || 1,
              datasParcelas: f.datasParcelas || [],
              arquivo: f.arquivo,
            };

            todasCotacoes.push(cotacaoData);
          }
        });
      });

      if (todasCotacoes.length === 0) {
        showSnackbar("Nenhuma cotação válida para salvar.");
        return;
      }

      formData.append("cotacoes", JSON.stringify(todasCotacoes));

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/cotacaoMaterial/${cod_material}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },

          params: { cotacaoCodigo },
        }
      );

      if (response.status === 200 || response.status === 201) {
        const { finalizada, count_fornecedores, message } = response.data;
        showSnackbar(message);

        if (finalizada) {
          setCotacaoFinalizada(true);
          setCotacaoEditavel(false);
          setTimeout(() => {
            navigate("../../", { replace: true });
          }, 3000);
        }
      } else {
        showSnackbar("Erro ao salvar a cotação.");
      }
    } catch (error) {
      console.error(error);
      showSnackbar(
        "Erro ao salvar a cotação: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setSalvandoCotacao(false);
    }
  };

  // Confirmar reativação da cotação (se necessário)
  const handleReativarCotacao = () => {
    setDialogOpen(true);
  };

  const confirmarReativacao = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${
          import.meta.env.VITE_API_URL
        }/cotacaoMaterial/${cod_material}/reativar`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        setCotacaoFinalizada(false);
        setCotacaoEditavel(true);
        showSnackbar("Cotação reativada para edição.");
      }
    } catch (error) {
      showSnackbar(
        "Erro ao reativar cotação: " +
          (error.response?.data?.message || error.message)
      );
    }
    setDialogOpen(false);
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

  if (error) return <Typography color="error">{error}</Typography>;
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
          Cotação de Material - Código: {cod_material}
          {cotacaoFinalizada && (
            <Chip
              label="FINALIZADA"
              color="success"
              size="small"
              sx={{ ml: 2 }}
            />
          )}
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
        {cotacaoFinalizada && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Esta cotação foi finalizada e não pode ser editada.
            {cotacaoEditavel === false && (
              <Button
                size="small"
                onClick={handleReativarCotacao}
                sx={{ ml: 2 }}
              >
                Reativar para Edição
              </Button>
            )}
          </Alert>
        )}

        {!cotacaoFinalizada &&
          !podeFinalizarProcesso &&
          materiais.length > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              O material deve ter pelo menos 3 fornecedores cotados para
              finalizar o processo.
            </Alert>
          )}

        {!cotacaoFinalizada && podeFinalizarProcesso && (
          <Alert severity="success" sx={{ mb: 2 }}>
            O material possui pelo menos 3 fornecedores. Você pode finalizar o
            processo!
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

              const historicoMaterial = dadosHistoricos[mat.cod_material] || {};

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
                          fornecedorData.nomeFornecedor
                            ? historicoMaterial.media_historica
                              ? Number(
                                  historicoMaterial.media_historica
                                ).toFixed(2)
                              : ""
                            : ""
                        }
                        disabled
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">R$</InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={2}>
                      <TextField
                        label="Preço Médio (R$) (Ult. 6 meses)"
                        type="number"
                        fullWidth
                        value={
                          fornecedorData.nomeFornecedor
                            ? historicoMaterial.media_6_meses
                              ? Number(historicoMaterial.media_6_meses).toFixed(
                                  2
                                )
                              : ""
                            : ""
                        }
                        disabled
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">R$</InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={2}>
                      <TextField
                        label="Valor Ult. Compra"
                        fullWidth
                        value={
                          fornecedorData.nomeFornecedor
                            ? historicoMaterial.ultima_compra
                              ? Number(historicoMaterial.ultima_compra).toFixed(
                                  2
                                )
                              : ""
                            : ""
                        }
                        disabled
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">R$</InputAdornment>
                          ),
                        }}
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

                    {fornecedorData.condPgto === "PARCELADO" && (
                      <>
                        <Grid item xs={12}>
                          <TextField
                            label="Qtd. Parcelas"
                            type="number"
                            fullWidth
                            value={fornecedorData.qtdParcela || ""}
                            onChange={(e) =>
                              handleChange(
                                mat.cod_material,
                                forn,
                                "qtdParcela",
                                e.target.value
                              )
                            }
                          />
                        </Grid>

                        {Array.from({
                          length: Number(fornecedorData.qtdParcela) || 0,
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
                                novasDatas[index] = e.target.value
                                  ? parseInt(e.target.value)
                                  : 0;
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
            {/* SEÇÃO 2: UPLOAD DE PROPOSTAS - ORGANIZADO POR FORNECEDOR */}
            <Paper sx={{ p: 3, backgroundColor: "#f8fff8", mt: 2 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>
                📎 Anexar Propostas dos Fornecedores
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Faça o upload das propostas comerciais para cada fornecedor (o
                arquivo será aplicado a todos os materiais deste fornecedor)
              </Typography>

              {[
                "Fornecedor I",
                "Fornecedor II",
                "Fornecedor III",
                "Fornecedor IV",
                "Fornecedor V",
              ].map((forn) => {
                const materiaisComFornecedor = materiais.filter((mat) => {
                  const fornecedorData =
                    cotacoes[mat.cod_material]?.[forn] || {};
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
                    sx={{
                      p: 3,
                      mt: 2,
                      backgroundColor: "#f8fff8",
                      fontWeight: "bold",
                    }} // removido border e borderRadius
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
                          handleArquivoChange(
                            mat.cod_material,
                            forn,
                            campo,
                            valor
                          );
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
                  const fornecedorData =
                    cotacoes[mat.cod_material]?.[forn] || {};
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
                    Selecione fornecedores na seção de cotação para habilitar o
                    upload de propostas
                  </Typography>
                </Box>
              )}
            </Paper>
          </Paper>
        );
      })}

      <Grid container spacing={2} sx={{ mt: 4 }}>
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
          <Button
            variant="outlined"
            onClick={handlePreview}
            disabled={Object.keys(cotacoes).length === 0}
          >
            Preview
          </Button>
        </Grid>

        {cotacaoEditavel && (
          <Grid item sx={{ display: "flex", gap: 2 }}>
            {/* Botão Salvar */}
            <Button
              variant="contained"
              color="primary"
              onClick={handleOnlySave}
              disabled={salvandoCotacao}
            >
              {salvandoCotacao ? "Salvando..." : "Salvar Cotação"}
            </Button>

            {/* Botão Finalizar Processo */}
            <Button
              variant="contained"
              color="success"
              onClick={handleSalvarCotacao} // precisa criar essa função
              disabled={salvandoCotacao || !podeFinalizarProcesso}
            >
              {salvandoCotacao ? "Finalizando..." : "Finalizar Processo"}
            </Button>
          </Grid>
        )}
      </Grid>

      {/* Diálogo de Confirmação para Reativação */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Reativar Cotação</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Tem certeza que deseja reativar esta cotação para edição? Isso
            permitirá modificar os dados já finalizados.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} color="primary">
            Cancelar
          </Button>
          <Button onClick={confirmarReativacao} color="primary" autoFocus>
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
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
