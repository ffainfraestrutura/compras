import { useEffect, useState } from "react";
import {
  Backdrop,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import axios from "axios";
import CustomSnackbar from "../../../components/SnackBar/SnackBar";
import DetailsDrawer from "../../../components/Drawer/Drawer";
import useMateriais from "../../../hooks/useMateriais";
import useSolicitacoes from "../../../hooks/useSolicitacoes";
import DataGridData from "../../../components/DataGrid/DataGrid";
import useFiliais from "../../../hooks/useFiliais";
import useCcustos from "../../../hooks/useCcusto";
import "./index.css";
import * as XLSX from 'xlsx';
import FileUpload from "../../../components/fileUpload/fileUpload";
import InstrucoesModal from "../../../components/instrucoesModal/instrucoesModal";

export default function Index() {
  const [open, setOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });
  const [gestaoSelecionada, setGestaoSelecionada] = useState("");
  const [quantidades, setQuantidades] = useState({});
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const [gestoesMateriais, setGestoesMateriais] = useState([]);
  const [loadingGestao, setLoadingGestao] = useState(false);
  const [errorGestao, setErrorGestao] = useState(null);

  const filiaisData = useFiliais();
  const filiais = filiaisData.filiais || [];
  const ccustosData = useCcustos();
  const ccustos = ccustosData.ccustos || [];

  const [instrucoesOpen, setInstrucoesOpen] = useState(false);


  const {
    dataMaterials,
    loading: loadingMateriais,
    error,
    refreshMaterials,
  } = useMateriais(gestaoSelecionada);

  const {
    dataSolicitacao,
    setDataSolicitacao,
    handleUpdateItem,
    handleRemoveItem,
    enviarSolicitacoes,
    loading: loadingSolicitacao,
  } = useSolicitacoes();

  // Função para baixar a planilha modelo (direto pelo front-end)
  const downloadModel = () => {
    // Dados do modelo
    const headers = ['Código do Material', 'Quantidade', 'Filial', 'Justificativa'];
    const rows = [];

    // Combinar headers e rows
    const data = [headers, ...rows];

    // Criar uma planilha
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Ajustar largura das colunas
    ws['!cols'] = [
      { wch: 25 }, // Coluna Código do Material
      { wch: 12 }, // Coluna Quantidade
      { wch: 20 }, // Coluna Filial
      { wch: 50 }  // Coluna Justificativa
    ];

    // Criar um workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Modelo_Importacao');

    // Gerar arquivo e fazer download
    XLSX.writeFile(wb, 'modelo_importacao_compras.xlsx');

    showSnackbar('Modelo baixado com sucesso!');
  };

  // Buscar gestões
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
      } catch (err) {
        setErrorGestao("Erro ao carregar gestões de materiais");
      } finally {
        setLoadingGestao(false);
      }
    };

    fetchGestaoMateriais();
  }, []);

  // Ao mudar dataSolicitacao, preenche apenas entradas faltantes e preserva valores já digitados
  useEffect(() => {
    if (!dataSolicitacao || dataSolicitacao.length === 0) {
      setQuantidades({});
      return;
    }

    setQuantidades((prev) => {
      const inicial = {};
      dataSolicitacao.forEach((item) => {
        inicial[item.id] = item.quantidade ?? 1;
      });

      if (Object.keys(prev).length === 0) return inicial;
      return { ...inicial, ...prev };
    });
  }, [dataSolicitacao]);

  const handleGestaoChange = (event) => {
    setGestaoSelecionada(event.target.value);
    setDataSolicitacao([]);
  };

  const showSnackbar = (message) => setSnackbar({ open: true, message });
  const closeSnackbar = () => setSnackbar({ open: false, message: "" });
  const hidePreview = () => setOpen(false);

  const atualizarSolicitacao = () => {
    const novosItens = dataSolicitacao.map((item) => {
      const q =
        quantidades[item.id] === ""
          ? 1
          : quantidades[item.id] ?? item.quantidade ?? 1;
      return {
        ...item,
        quantidade: q,
      };
    });
    setDataSolicitacao(novosItens);
  };

  const showPreview = () => {
    if (dataSolicitacao.length === 0) {
      showSnackbar("Selecione pelo menos um item antes de enviar a solicitação.");
      return;
    }
    atualizarSolicitacao();
    setOpen(true);
  };

  const handleSelectionChange = (novosSelecionados) => {
    setDataSolicitacao((prevSelecionados) => {
      const map = new Map(prevSelecionados.map((i) => [i.id, i]));
      novosSelecionados.forEach((item) => {
        if (!map.has(item.id)) {
          const q =
            quantidades[item.id] === ""
              ? 1
              : quantidades[item.id] ?? item.quantidade ?? 1;
          map.set(item.id, { ...item, quantidade: q });
        }
      });
      return Array.from(map.values());
    });
  };

  const handleQuantidadeChange = (id, value) => {
    if (value === "") {
      setQuantidades((prev) => ({ ...prev, [id]: "" }));
      return;
    }
    const val = Math.max(Number(value), 1);
    setQuantidades((prev) => ({ ...prev, [id]: val }));
  };

  // Handle do upload de arquivo
  const handleUploadSuccess = (response) => {
    console.log('Arquivo importado com sucesso:', response);
    showSnackbar('Arquivo importado com sucesso!');
    setUploadDialogOpen(false);

    if (gestaoSelecionada && refreshMaterials) {
      refreshMaterials();
    } else if (gestaoSelecionada) {
      const currentGestao = gestaoSelecionada;
      setGestaoSelecionada("");
      setTimeout(() => {
        setGestaoSelecionada(currentGestao);
      }, 100);
    }
  };

  const handleUploadError = (error) => {
    console.error('Erro no upload:', error);
    showSnackbar('Erro ao importar arquivo. Verifique o formato e tente novamente.');
  };

  const dataWithQuantity = dataMaterials.map((item) => {
    const itemSolicitacao = dataSolicitacao.find((s) => s.id === item.id);
    return {
      ...item,
      quantidade: itemSolicitacao?.quantidade || 1,
      Quantidade: (
        <Box display="flex" height={"100%"} alignItems="center" gap={1}>
          <TextField
            label="Quantidade"
            type="number"
            variant="standard"
            fullWidth
            value={
              quantidades[item.id] !== undefined
                ? quantidades[item.id]
                : itemSolicitacao?.quantidade ?? 1
            }
            onChange={(e) => handleQuantidadeChange(item.id, e.target.value)}
            inputProps={{ min: 1 }}
          />
        </Box>
      ),
    };
  });

  return (
    <>
      <Card>
        <CardContent>
          <Box className="header-section">
            <Typography variant="h5">Solicitação de Compra</Typography>
            <Box className="header-actions">
              {dataSolicitacao.length > 0 && (
                <Typography
                  variant="body2"
                  color="primary"
                  className="selected-count"
                >
                  {dataSolicitacao.length} item(s) selecionado(s)
                </Typography>
              )}

              <Button
                variant="outlined"
                onClick={() => setInstrucoesOpen(true)}
                sx={{ mr: 1 }}
              >
                Instruções
              </Button>

              {/* Botão para baixar modelo */}
              <Button
                variant="contained"
                color="success"
                onClick={downloadModel}
                sx={{ mr: 1 }}
              >
                Baixar Modelo
              </Button>

              {/* Botão para importar arquivo */}
              <Button
                variant="contained"
                onClick={() => setUploadDialogOpen(true)}
                sx={{ mr: 1 }}
              >
                Importar Compra
              </Button>

              {/* Botão para enviar solicitação */}
              <Button
                variant="contained"
                onClick={showPreview}
                disabled={dataSolicitacao.length === 0}
              >
                Enviar Solicitação
              </Button>
            </Box>
          </Box>

          <FormControl fullWidth className="gestao-select">
            <InputLabel id="gestao-material-label">Gestão de Materiais</InputLabel>
            <Select
              labelId="gestao-material-label"
              value={gestaoSelecionada}
              onChange={handleGestaoChange}
              disabled={loadingGestao}
            >
              <MenuItem value="">
                <em>Selecione uma gestão</em>
              </MenuItem>
              {gestoesMateriais.map((gestao) => (
                <MenuItem key={gestao.id} value={gestao.id}>
                  {gestao.descricao}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {loadingGestao && <Typography color="text.secondary">Carregando gestões...</Typography>}
          {errorGestao && <Typography color="error">{errorGestao}</Typography>}

          {gestaoSelecionada ? (
            <DataGridData
              data={dataWithQuantity || []}
              loading={loadingMateriais}
              error={error}
              hiddenIndexes={[4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]}
              setSelectedValues={handleSelectionChange}
              initialPageSize={10}
              selectedValues={dataSolicitacao}
              onPageChange={atualizarSolicitacao}
            />
          ) : (
            <Typography variant="body2" color="text.secondary" className="empty-message">
              Selecione uma gestão para carregar os materiais.
            </Typography>
          )}
        </CardContent>
      </Card>

      <DetailsDrawer
        open={open}
        onClose={hidePreview}
        onConfirm={(justificativa, filial, ccusto, arquivos) =>
          enviarSolicitacoes(
            justificativa,
            filial,
            ccusto,
            arquivos,
            () => {
              showSnackbar("Solicitações enviadas com sucesso!");
              setTimeout(() => {
                window.location.reload();
              }, 1500);
            },
            (errorMessage) => showSnackbar(errorMessage || "Erro ao enviar solicitações.")
          )
        }
        dados={dataSolicitacao}
        visibleFields={[
          { key: "CodMaterial", label: "Código do Material" },
          { key: "Descricao", label: "Descrição" },
          { key: "Unidade", label: "Unidade" },
        ]}
        title="Confirme sua solicitação"
        subtitle="Reveja os materiais e confirme sua solicitação"
        onUpdateItem={handleUpdateItem}
        onRemoveItem={handleRemoveItem}
        filiais={filiais}
        ccustos={ccustos}
      />

      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Importar Arquivo Excel</DialogTitle>
        <DialogContent>
          <FileUpload
            uploadUrl={`${import.meta.env.VITE_API_URL}/upload/materiais`}
            onSuccess={handleUploadSuccess}
            onError={handleUploadError}
            buttonText="Importar Arquivo"
            title="Selecione um arquivo Excel"
            subtitle="Os dados serão importados e estarão disponíveis para seleção"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>

      <InstrucoesModal
        open={instrucoesOpen}
        onClose={() => setInstrucoesOpen(false)}
        filiais={filiais}
        onDownload={downloadModel}  // Passa a função
      />

      <Backdrop open={loadingSolicitacao} className="loading-backdrop">
        <CircularProgress color="inherit" />
      </Backdrop>

      <CustomSnackbar open={snackbar.open} onClose={closeSnackbar} message={snackbar.message} />
    </>
  );
}