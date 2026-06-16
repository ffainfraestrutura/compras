import axios from "axios";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Paper,
  IconButton,
  CircularProgress,
  Divider,
  Grid,
  Autocomplete,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  FiPlus,
  FiTrash2,
  FiSave,
  FiArrowLeft,
  FiUpload,
  FiX,
  FiEye,
  FiDownload,
} from "react-icons/fi";
import CustomSnackbar from "../../../../components/SnackBar/SnackBar";

// Componente de Upload (reutilizado com ajustes para edição)
const FileUpload = ({
  arquivoAtual,
  handleArquivoChange,
  disabled = false,
  error = false,
  errorMessage = "",
  isEdit = false,
}) => {
  const [preview, setPreview] = useState("");
  const [file, setFile] = useState(null);
  const [existingFileUrl, setExistingFileUrl] = useState("");

  useEffect(() => {
    if (arquivoAtual instanceof File) {
      setFile(arquivoAtual);
      setPreview(arquivoAtual.name);
      setExistingFileUrl("");
    } else if (typeof arquivoAtual === 'string' && arquivoAtual) {
      setPreview("Arquivo PDF existente");
      setExistingFileUrl(arquivoAtual);
      setFile(null);
    } else {
      setPreview("");
      setExistingFileUrl("");
      setFile(null);
    }
  }, [arquivoAtual]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(selectedFile.name);
      setExistingFileUrl("");
      handleArquivoChange(selectedFile);
    }
  };

  const handleRemoverAnexo = () => {
    setFile(null);
    setPreview("");
    setExistingFileUrl("");
    handleArquivoChange(null);
  };

  return (
    <Box>
      {preview ? (
        <Paper
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: 'grey.50',
            border: error ? '2px solid #f44336' : '1px solid #ddd',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box>
              <Typography variant="body2" fontWeight="medium">
                {preview}
              </Typography>
              {file && (
                <Typography variant="caption" color="text.secondary">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </Typography>
              )}
            </Box>

            {existingFileUrl && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<FiEye />}
                component="a"
                href={existingFileUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Visualizar
              </Button>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              component="label"
              size="small"
              startIcon={<FiUpload />}
              disabled={disabled}
            >
              {isEdit ? "Alterar" : "Selecionar"}
              <input
                type="file"
                accept=".pdf"
                hidden
                onChange={handleFileChange}
              />
            </Button>
            <IconButton
              size="small"
              onClick={handleRemoverAnexo}
              disabled={disabled}
            >
              <FiX />
            </IconButton>
          </Box>
        </Paper>
      ) : (
        <Button
          variant="outlined"
          component="label"
          startIcon={<FiUpload />}
          fullWidth
          disabled={disabled}
          sx={{
            border: error ? '2px solid #f44336' : '1px solid rgba(0, 0, 0, 0.23)',
            color: error ? '#f44336' : 'inherit',
            py: 2,
          }}
        >
          {isEdit ? "Selecionar Novo Arquivo PDF" : "Selecionar Arquivo PDF *"}
          <input
            type="file"
            accept=".pdf"
            hidden
            onChange={handleFileChange}
          />
        </Button>
      )}

      <Typography variant="caption" color="text.secondary" display="block" mt={1}>
        {isEdit
          ? "Opcional - deixe em branco para manter o arquivo atual"
          : "Tamanho máximo: 5MB | Apenas PDF | Campo obrigatório"}
      </Typography>

      {error && errorMessage && (
        <Typography variant="caption" color="error" display="block" mt={1}>
          {errorMessage}
        </Typography>
      )}
    </Box>
  );
};

export default function EditarNotaFiscal() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [erros, setErros] = useState({});
  const [anexoError, setAnexoError] = useState(false);
  const [anexoErrorMessage, setAnexoErrorMessage] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Estados para dados
  const [fornecedores, setFornecedores] = useState([]);
  const [materiais, setMateriais] = useState([]);
  const [notaOriginal, setNotaOriginal] = useState(null);
  const [existingAnexoUrl, setExistingAnexoUrl] = useState("");

  // Formulário principal
  const [formData, setFormData] = useState({
    numero: "",
    serie: "",
    fornecedor_id: "",
    data_emissao: new Date().toISOString().split('T')[0],
    data_entrada: new Date().toISOString().split('T')[0],
    obs: "",
    matricula: localStorage.getItem("matricula") || "",
    status: "",
  });

  // Itens da nota
  const [itens, setItens] = useState([
    {
      codigo_material: "",
      descricao: "",
      quantidade: 1,
      valor_unitario: 0,
      unid: "UN",
      numero_lote: "",
      obs: ""
    }
  ]);

  // Anexo - opcional na edição
  const [anexo, setAnexo] = useState(null);
  const [hasAnexoChanged, setHasAnexoChanged] = useState(false);

  // ======================================
  // Buscar dados iniciais e dados da nota
  useEffect(() => {
    fetchDadosIniciais();
  }, [id]);

  const fetchDadosIniciais = async () => {
    try {
      setLoadingData(true);

      // Buscar fornecedores
      const fornecedoresRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/fornecedores`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFornecedores(fornecedoresRes.data || []);

      // Buscar materiais
      const materiaisRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/materiais-unificados`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMateriais(Array.isArray(materiaisRes.data) ? materiaisRes.data : materiaisRes.data.data || []);

      // Buscar nota fiscal específica
      const notaRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/notasfiscais/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Na função fetchDadosIniciais, atualize o preenchimento:
      if (notaRes.data.success && notaRes.data.data) {
        const nota = notaRes.data.data;
        setNotaOriginal(nota);

        console.log("Dados recebidos da API:", nota); // Debug

        // Verificar se os campos existem
        console.log("Campos disponíveis:", Object.keys(nota));

        // Preencher formulário com dados da nota - CORRIGIDO
        setFormData({
          numero: nota.numero !== undefined && nota.numero !== null ? String(nota.numero) : "",
          serie: nota.serie !== undefined && nota.serie !== null ? String(nota.serie) : "",
          fornecedor_id: nota.fornecedor_id !== undefined && nota.fornecedor_id !== null ? String(nota.fornecedor_id) : "",
          data_emissao: nota.data_emissao ? new Date(nota.data_emissao).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          data_entrada: nota.data_entrada ? new Date(nota.data_entrada).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          obs: nota.obs || "",
          matricula: nota.matricula || localStorage.getItem("matricula") || "",
          status: nota.status || "",
        });

        console.log("FormData preenchido:", {
          numero: nota.numero !== undefined && nota.numero !== null ? String(nota.numero) : "",
          serie: nota.serie !== undefined && nota.serie !== null ? String(nota.serie) : "",
          fornecedor_id: nota.fornecedor_id !== undefined && nota.fornecedor_id !== null ? String(nota.fornecedor_id) : "",
        });

        // Preencher itens
        if (nota.itens && nota.itens.length > 0) {
          console.log("Itens recebidos:", nota.itens);
          setItens(nota.itens.map(item => ({
            codigo_material: item.codigo_material || "",
            descricao: item.descricao || "",
            quantidade: parseFloat(item.quantidade) || 1,
            valor_unitario: parseFloat(item.valor_unitario) || 0,
            unid: item.unid || "UN",
            numero_lote: item.numero_lote || "",
            obs: item.obs || "",
          })));
        } else {
          console.log("Nenhum item recebido da API");
        }


        // Se houver anexo, buscar URL
        if (nota.anexo) {
          try {
            const anexoRes = await axios.get(
              `${import.meta.env.VITE_API_URL}/notasfiscais/${id}/anexo`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (anexoRes.data.success) {
              setExistingAnexoUrl(anexoRes.data.data.anexo_url);
            }
          } catch (error) {
            console.warn("Não foi possível carregar URL do anexo:", error);
          }
        }
      } else {
        showSnackbar("Nota fiscal não encontrada");
        setTimeout(() => navigate("/Compras/entregamateriais"), 2000);
      }
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
      if (err.response?.status === 404) {
        showSnackbar("Nota fiscal não encontrada");
        setTimeout(() => navigate("/Compras/entregamateriais"), 2000);
      } else {
        showSnackbar("Erro ao carregar dados da nota fiscal");
      }
    } finally {
      setLoadingData(false);
    }
  };

  // ======================================
  // Snackbar
  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  // ======================================
  // Manipulação do formulário
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (erros[name]) setErros(prev => ({ ...prev, [name]: null }));
  };

  // ======================================
  // Manipulação dos itens
  const handleItemChange = (index, field, value) => {
    const novosItens = [...itens];
    novosItens[index][field] = value;

    if (field === 'codigo_material') {
      const material = materiais.find(m => m.CodMaterial === value);
      if (material) {
        novosItens[index].descricao = material.Descricao || '';
        novosItens[index].unid = material.Unidade || 'UN';
      }
    }

    setItens(novosItens);
  };

  const handleAddItem = () => {
    setItens([
      ...itens,
      {
        codigo_material: "",
        descricao: "",
        quantidade: 1,
        valor_unitario: 0,
        unid: "UN",
        numero_lote: "",
        obs: ""
      }
    ]);
  };

  const handleRemoveItem = (index) => {
    if (itens.length > 1) {
      const novosItens = [...itens];
      novosItens.splice(index, 1);
      setItens(novosItens);
    }
  };

  // ======================================
  // Manipulação do anexo
  const handleAnexoChange = (file) => {
    setAnexo(file);
    setHasAnexoChanged(true);
    setAnexoError(false);
    setAnexoErrorMessage("");
  };

  // ======================================
  // Validação
  const validarFormulario = () => {
    const novosErros = {};
    let temErro = false;

    // Limpar erros anteriores
    setErros({});
    setAnexoError(false);
    setAnexoErrorMessage("");

    // Validação dos campos principais
    if (!formData.numero.trim()) {
      novosErros.numero = "Número da NF é obrigatório";
      temErro = true;
    }
    if (!formData.fornecedor_id) {
      novosErros.fornecedor_id = "Fornecedor é obrigatório";
      temErro = true;
    }
    if (!formData.data_emissao) {
      novosErros.data_emissao = "Data de emissão é obrigatória";
      temErro = true;
    }
    if (!formData.data_entrada) {
      novosErros.data_entrada = "Data de entrada é obrigatória";
      temErro = true;
    }

    // Validar datas
    if (formData.data_entrada && formData.data_emissao) {
      const dataEmissao = new Date(formData.data_emissao);
      const dataEntrada = new Date(formData.data_entrada);
      if (dataEntrada < dataEmissao) {
        novosErros.data_entrada = "Data de entrada não pode ser anterior à data de emissão";
        temErro = true;
      }
    }

    // Validação do anexo - APENAS se foi selecionado um novo arquivo
    if (hasAnexoChanged && anexo) {
      if (!(anexo instanceof File)) {
        setAnexoError(true);
        setAnexoErrorMessage("Arquivo inválido");
        temErro = true;
      } else {
        // Verificar tipo do arquivo
        if (anexo.type !== 'application/pdf') {
          setAnexoError(true);
          setAnexoErrorMessage("Apenas arquivos PDF são permitidos");
          temErro = true;
        }

        // Verificar tamanho do arquivo (5MB)
        if (anexo.size > 5 * 1024 * 1024) {
          setAnexoError(true);
          setAnexoErrorMessage("O arquivo deve ter no máximo 5MB");
          temErro = true;
        }
      }
    }

    // Validação dos itens
    itens.forEach((item, index) => {
      if (!item.codigo_material.trim()) {
        novosErros[`item_${index}_codigo_material`] = `Código do material é obrigatório no item ${index + 1}`;
        temErro = true;
      }
      if (!item.quantidade || item.quantidade <= 0) {
        novosErros[`item_${index}_quantidade`] = `Quantidade deve ser maior que zero no item ${index + 1}`;
        temErro = true;
      }
      if (!item.valor_unitario && item.valor_unitario !== 0) {
        novosErros[`item_${index}_valor_unitario`] = `Valor unitário é obrigatório no item ${index + 1}`;
        temErro = true;
      } else if (item.valor_unitario < 0) {
        novosErros[`item_${index}_valor_unitario`] = `Valor unitário não pode ser negativo no item ${index + 1}`;
        temErro = true;
      }
    });

    setErros(novosErros);
    return !temErro;
  };

  // ======================================
  // Submissão do formulário - EDIÇÃO
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Verificar se nota está cancelada
    if (notaOriginal?.status === 'cancelada') {
      showSnackbar("Não é possível editar uma nota fiscal cancelada");
      return;
    }

    if (!validarFormulario()) {
      showSnackbar("Corrija os erros no formulário antes de enviar");
      return;
    }

    setLoading(true);

    try {
      // Criar FormData
      const formDataToSend = new FormData();

      // Adicionar campos principais
      formDataToSend.append('numero', formData.numero);
      formDataToSend.append('serie', formData.serie || '');
      formDataToSend.append('fornecedor_id', formData.fornecedor_id);
      formDataToSend.append('data_emissao', formData.data_emissao);
      formDataToSend.append('data_entrada', formData.data_entrada);
      formDataToSend.append('obs', formData.obs || '');
      formDataToSend.append('matricula', formData.matricula || localStorage.getItem("matricula") || "");
      formDataToSend.append('_method', 'PUT'); // Para Laravel entender que é PUT

      // Adicionar itens
      itens.forEach((item, index) => {
        formDataToSend.append(`itens[${index}][codigo_material]`, item.codigo_material);
        formDataToSend.append(`itens[${index}][descricao]`, item.descricao || '');
        formDataToSend.append(`itens[${index}][quantidade]`, item.quantidade.toString());
        formDataToSend.append(`itens[${index}][valor_unitario]`, item.valor_unitario.toString());
        formDataToSend.append(`itens[${index}][unid]`, item.unid || 'UN');

        if (item.numero_lote) {
          formDataToSend.append(`itens[${index}][numero_lote]`, item.numero_lote);
        }
        if (item.obs) {
          formDataToSend.append(`itens[${index}][obs]`, item.obs);
        }
      });

      // Adicionar anexo APENAS se foi alterado
      if (hasAnexoChanged && anexo instanceof File) {
        formDataToSend.append('anexo', anexo);
      }

      // Enviar requisição PUT
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/notasfiscais/${id}`,
        formDataToSend,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000,
        }
      );

      if (response.data.success) {
        showSnackbar("Nota fiscal atualizada com sucesso!");
        setTimeout(() => navigate("/Compras/entregamateriais"), 1500);
      } else {
        showSnackbar(response.data.error || "Erro ao atualizar nota fiscal");
      }

    } catch (err) {
      console.error("Erro ao atualizar nota fiscal:", err);

      if (err.response?.status === 422) {
        if (err.response?.data?.errors) {
          const backendErrors = err.response.data.errors;

          // Tratar erros específicos do anexo vindos do backend
          if (backendErrors.anexo) {
            setAnexoError(true);
            setAnexoErrorMessage(Array.isArray(backendErrors.anexo) ? backendErrors.anexo[0] : backendErrors.anexo);
          }

          setErros(backendErrors);
          showSnackbar("Erros de validação encontrados");
        } else if (err.response?.data?.error) {
          showSnackbar(err.response.data.error);
        }
      } else if (err.response?.status === 409) {
        showSnackbar("Já existe outra nota fiscal com este número e série");
      } else if (err.response?.status === 400) {
        showSnackbar(err.response.data.error || "Não é possível editar esta nota fiscal");
      } else if (err.response?.status === 500) {
        showSnackbar("Erro interno do servidor. Tente novamente.");
      } else {
        showSnackbar("Erro ao processar a requisição");
      }
    } finally {
      setLoading(false);
    }
  };

  // ======================================
  // Cancelar nota fiscal
  const handleCancelarNota = async () => {
    try {
      setLoading(true);
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/notasfiscais/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        showSnackbar("Nota fiscal cancelada com sucesso!");
        setDeleteDialogOpen(false);
        setTimeout(() => navigate("/Compras/entregamateriais"), 1500);
      } else {
        showSnackbar(response.data.error || "Erro ao cancelar nota fiscal");
      }
    } catch (err) {
      console.error("Erro ao cancelar nota fiscal:", err);
      showSnackbar(err.response?.data?.error || "Erro ao cancelar nota fiscal");
    } finally {
      setLoading(false);
    }
  };

  // ======================================
  // Cálculos
  const calcularTotalItem = (item) => {
    return (parseFloat(item.quantidade) || 0) * (parseFloat(item.valor_unitario) || 0);
  };

  const calcularTotalNota = () => {
    return itens.reduce((total, item) => total + calcularTotalItem(item), 0);
  };

  // ======================================
  // Render - Loading
  if (loadingData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Editar Nota Fiscal</Typography>
          <Typography variant="subtitle2" color="text.secondary">
            Número: {notaOriginal?.numero} | Status:
            <span style={{
              color: notaOriginal?.status === 'cancelada' ? '#f44336' :
                notaOriginal?.status === 'pendente' ? '#ff9800' : '#4caf50',
              fontWeight: 'bold',
              marginLeft: '8px'
            }}>
              {notaOriginal?.status === 'cancelada' ? 'CANCELADA' :
                notaOriginal?.status === 'pendente' ? 'PENDENTE' : 'ATIVA'}
            </span>
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button variant="outlined" startIcon={<FiArrowLeft />} onClick={() => navigate("/Compras/entregamateriais")}>
            Voltar
          </Button>
          {notaOriginal?.status !== 'cancelada' && (
            <Button
              variant="outlined"
              color="error"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={loading}
            >
              Cancelar Nota
            </Button>
          )}
        </Box>
      </Box>

      {notaOriginal?.status === 'cancelada' && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <strong>Atenção:</strong> Esta nota fiscal está cancelada e não pode ser editada.
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Coluna da Esquerda - Informações da Nota */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={3} color="primary">Informações da Nota Fiscal</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Número da NF *"
                      name="numero"
                      value={formData.numero}
                      onChange={handleFormChange}
                      fullWidth
                      size="small"
                      error={!!erros.numero}
                      helperText={erros.numero}
                      required
                      disabled={loading || notaOriginal?.status === 'cancelada'}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Série"
                      name="serie"
                      value={formData.serie}
                      onChange={handleFormChange}
                      fullWidth
                      size="small"
                      disabled={loading || notaOriginal?.status === 'cancelada'}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Autocomplete
                      size="small"
                      options={fornecedores}
                      getOptionLabel={(option) => option.nome_fantasia || option.razao_social || ''}
                      value={fornecedores.find(f => f.id == formData.fornecedor_id) || null}
                      onChange={(event, novoValor) => {
                        handleFormChange({
                          target: {
                            name: 'fornecedor_id',
                            value: novoValor ? novoValor.id : ''
                          }
                        });
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Fornecedor *"
                          error={!!erros.fornecedor_id}
                          helperText={erros.fornecedor_id}
                          required
                          disabled={loading || notaOriginal?.status === 'cancelada'}
                        />
                      )}
                      disabled={loading || notaOriginal?.status === 'cancelada'}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Data de Emissão *"
                      name="data_emissao"
                      type="date"
                      value={formData.data_emissao}
                      onChange={handleFormChange}
                      fullWidth
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      error={!!erros.data_emissao}
                      helperText={erros.data_emissao}
                      required
                      disabled={loading || notaOriginal?.status === 'cancelada'}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Data de Entrada *"
                      name="data_entrada"
                      type="date"
                      value={formData.data_entrada}
                      onChange={handleFormChange}
                      fullWidth
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      error={!!erros.data_entrada}
                      helperText={erros.data_entrada}
                      required
                      disabled={loading || notaOriginal?.status === 'cancelada'}
                    />
                  </Grid>
                  <Grid item xs={12} sx={{ minWidth: "100%" }}>
                    <TextField
                      label="Observações"
                      name="obs"
                      value={formData.obs}
                      onChange={handleFormChange}
                      fullWidth
                      multiline
                      rows={3}
                      size="small"
                      disabled={loading || notaOriginal?.status === 'cancelada'}
                    />
                  </Grid>

                  {/* SEÇÃO DE ANEXO */}
                  <Grid item xs={12} sx={{minWidth: '100%'}}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" mb={1} fontWeight="bold">
                      📎 {existingAnexoUrl ? "Atualizar Anexo (PDF)" : "Anexar Nota Fiscal (PDF) - Opcional"}
                    </Typography>

                    {existingAnexoUrl && (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        Arquivo atual disponível. Selecione um novo arquivo apenas se desejar substituí-lo.
                      </Alert>
                    )}

                    <FileUpload
                      arquivoAtual={hasAnexoChanged ? anexo : existingAnexoUrl}
                      handleArquivoChange={handleAnexoChange}
                      disabled={loading || notaOriginal?.status === 'cancelada'}
                      error={anexoError}
                      errorMessage={anexoErrorMessage}
                      isEdit={true}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Coluna da Direita - Itens da Nota */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h6" color="primary">Itens da Nota Fiscal</Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<FiPlus />}
                    onClick={handleAddItem}
                    disabled={loading || notaOriginal?.status === 'cancelada'}
                  >
                    Adicionar Item
                  </Button>
                </Box>

                {itens.map((item, index) => (
                  <Paper
                    key={index}
                    sx={{
                      p: 2,
                      mb: 2,
                      borderRadius: 2,
                      bgcolor: 'grey.50',
                      border: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="subtitle2" fontWeight="bold">Item {index + 1}</Typography>
                      {itens.length > 1 && !loading && notaOriginal?.status !== 'cancelada' && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <FiTrash2 />
                        </IconButton>
                      )}
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sx={{ minWidth: '23%' }}>
                        <Autocomplete
                          size="small"
                          options={materiais}
                          getOptionLabel={(option) => `${option.CodMaterial} - ${option.Descricao}`}
                          value={materiais.find(m => m.CodMaterial === item.codigo_material) || null}
                          onChange={(event, novoValor) => {
                            if (novoValor) {
                              handleItemChange(index, 'codigo_material', novoValor.CodMaterial);
                              handleItemChange(index, 'descricao', novoValor.Descricao || '');
                              handleItemChange(index, 'unid', novoValor.Unidade || 'UN');
                            } else {
                              handleItemChange(index, 'codigo_material', '');
                              handleItemChange(index, 'descricao', '');
                              handleItemChange(index, 'unid', 'UN');
                            }
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Código Material *"
                              error={!!erros[`item_${index}_codigo_material`]}
                              helperText={erros[`item_${index}_codigo_material`]}
                              required
                              disabled={loading || notaOriginal?.status === 'cancelada'}
                            />
                          )}
                          disabled={loading || notaOriginal?.status === 'cancelada'}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          label="Quantidade *"
                          type="number"
                          value={item.quantidade}
                          onChange={(e) => handleItemChange(index, 'quantidade', parseFloat(e.target.value) || 0)}
                          fullWidth
                          size="small"
                          inputProps={{ min: 0.001, step: 0.001 }}
                          error={!!erros[`item_${index}_quantidade`]}
                          helperText={erros[`item_${index}_quantidade`]}
                          disabled={loading || notaOriginal?.status === 'cancelada'}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          label="Unidade"
                          value={item.unid}
                          fullWidth
                          size="small"
                          InputProps={{ readOnly: true }}
                          disabled={loading || notaOriginal?.status === 'cancelada'}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          label="Valor Unitário *"
                          type="number"
                          value={item.valor_unitario}
                          onChange={(e) => handleItemChange(index, 'valor_unitario', parseFloat(e.target.value) || 0)}
                          fullWidth
                          size="small"
                          inputProps={{ min: 0.01, step: 0.01 }}
                          error={!!erros[`item_${index}_valor_unitario`]}
                          helperText={erros[`item_${index}_valor_unitario`]}
                          disabled={loading || notaOriginal?.status === 'cancelada'}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Número do Lote"
                          value={item.numero_lote}
                          onChange={(e) => handleItemChange(index, 'numero_lote', e.target.value)}
                          fullWidth
                          size="small"
                          disabled={loading || notaOriginal?.status === 'cancelada'}
                        />
                      </Grid>
                      <Grid item xs={12} sx={{minWidth: '100%'}}>
                        <TextField
                          label="Descrição"
                          value={item.descricao}
                          fullWidth
                          size="small"
                          multiline
                          InputProps={{ readOnly: true }}
                          disabled={loading || notaOriginal?.status === 'cancelada'}
                        />
                      </Grid>
                      <Grid item xs={12} sx={{ minWidth: "100%" }}>
                        <TextField
                          label="Observações do Item"
                          value={item.obs}
                          onChange={(e) => handleItemChange(index, 'obs', e.target.value)}
                          fullWidth
                          size="small"
                          multiline
                          rows={2}
                          disabled={loading || notaOriginal?.status === 'cancelada'}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Box display="flex" justifyContent="flex-end">
                          <Typography variant="body2" color="text.secondary">
                            Valor Total do Item: R$ {calcularTotalItem(item).toFixed(2)}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}

                <Paper sx={{ p: 3, mt: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">Resumo da Nota Fiscal</Typography>
                      <Typography variant="body2">Total de Itens: {itens.length}</Typography>
                    </Box>
                    <Typography variant="h5" fontWeight="bold">
                      R$ {calcularTotalNota().toFixed(2)}
                    </Typography>
                  </Box>
                </Paper>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={2} mt={3}>
          <Grid item xs={12}><Divider /></Grid>
          <Grid item xs={12}>
            <Box display="flex" justifyContent="flex-end" gap={2}>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<FiX />}
                onClick={() => navigate("/Compras/entregamateriais")}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={loading ? <CircularProgress size={18} /> : <FiSave />}
                disabled={loading || notaOriginal?.status === 'cancelada'}
              >
                {loading ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>

      {/* Dialog de Confirmação para Cancelar Nota */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Cancelamento</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja cancelar a nota fiscal <strong>{notaOriginal?.numero}</strong>?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Esta ação não pode ser desfeita. A nota fiscal será marcada como cancelada.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={loading}>
            Não
          </Button>
          <Button
            onClick={handleCancelarNota}
            color="error"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} /> : null}
          >
            {loading ? "Cancelando..." : "Sim, Cancelar"}
          </Button>
        </DialogActions>
      </Dialog>

      <CustomSnackbar
        open={snackbarOpen}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
}