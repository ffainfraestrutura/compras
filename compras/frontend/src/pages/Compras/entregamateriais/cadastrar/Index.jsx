import axios from "axios";
import { useState, useEffect } from "react";
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
} from "@mui/material";
import {
  FiPlus,
  FiTrash2,
  FiSave,
  FiArrowLeft,
  FiUpload,
  FiX,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import CustomSnackbar from "../../../../components/SnackBar/SnackBar";

// Componente de Upload - SIMPLIFICADO
const FileUpload = ({
  arquivoAtual,
  handleArquivoChange,
  disabled = false,
  error = false,
  errorMessage = "",
}) => {
  const [preview, setPreview] = useState("");
  const [file, setFile] = useState(null);

  useEffect(() => {
    if (arquivoAtual instanceof File) {
      setFile(arquivoAtual);
      setPreview(arquivoAtual.name);
    } else {
      setFile(null);
      setPreview("");
    }
  }, [arquivoAtual]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(selectedFile.name);
      handleArquivoChange(selectedFile);
    }
  };

  const handleRemoverAnexo = () => {
    setFile(null);
    setPreview("");
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
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              component="label"
              size="small"
              startIcon={<FiUpload />}
              disabled={disabled}
            >
              Alterar
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
          Selecionar Arquivo PDF *
          <input
            type="file"
            accept=".pdf"
            hidden
            onChange={handleFileChange}
          />
        </Button>
      )}
      
      <Typography variant="caption" color="text.secondary" display="block" mt={1}>
        Tamanho máximo: 5MB | Apenas PDF | Campo obrigatório
      </Typography>
      
      {error && errorMessage && (
        <Typography variant="caption" color="error" display="block" mt={1}>
          {errorMessage}
        </Typography>
      )}
    </Box>
  );
};

export default function CadastrarNotaFiscal() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [erros, setErros] = useState({});
  const [anexoError, setAnexoError] = useState(false);
  const [anexoErrorMessage, setAnexoErrorMessage] = useState("");

  // Estados para dados
  const [fornecedores, setFornecedores] = useState([]);
  const [materiais, setMateriais] = useState([]);
  const [loadingDados, setLoadingDados] = useState(false);

  // Formulário principal
  const [formData, setFormData] = useState({
    numero: "",
    serie: "",
    fornecedor_id: "",
    data_emissao: new Date().toISOString().split('T')[0],
    data_entrada: new Date().toISOString().split('T')[0],
    obs: "",
    matricula: localStorage.getItem("matricula") || "",
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

  // Anexo
  const [anexo, setAnexo] = useState(null);

  // ======================================
  // Buscar dados iniciais
  useEffect(() => {
    fetchDadosIniciais();
  }, []);

  const fetchDadosIniciais = async () => {
    setLoadingDados(true);
    try {
      const fornecedoresRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/fornecedores`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFornecedores(fornecedoresRes.data || []);

      const materiaisRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/materiais-unificados`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMateriais(Array.isArray(materiaisRes.data) ? materiaisRes.data : materiaisRes.data.data || []);
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
      showSnackbar("Erro ao carregar dados iniciais");
    } finally {
      setLoadingDados(false);
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
    setAnexoError(false);
    setAnexoErrorMessage("");
  };

  // ======================================
  // Validação - CORRIGIDA
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

    // Validação do anexo - CORREÇÃO PRINCIPAL
    if (!anexo) {
      setAnexoError(true);
      setAnexoErrorMessage("O anexo é obrigatório");
      temErro = true;
    } else if (!(anexo instanceof File)) {
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
  // Submissão do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();

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

      // Adicionar anexo
      formDataToSend.append('anexo', anexo);

      // Enviar requisição
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/notasfiscais`,
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
        showSnackbar("Nota fiscal cadastrada com sucesso!");
        setTimeout(() => navigate("/Compras/entregamateriais"), 1500);
      } else {
        showSnackbar(response.data.error || "Erro ao cadastrar nota fiscal");
      }

    } catch (err) {
      console.error("Erro ao enviar nota fiscal:", err);
      
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const backendErrors = err.response.data.errors;
        
        // Tratar erros específicos do anexo vindos do backend
        if (backendErrors.anexo) {
          setAnexoError(true);
          setAnexoErrorMessage(Array.isArray(backendErrors.anexo) ? backendErrors.anexo[0] : backendErrors.anexo);
        }
        
        setErros(backendErrors);
        showSnackbar("Erros de validação encontrados");
      } else if (err.response?.data?.error) {
        showSnackbar("Erro: " + err.response.data.error);
      } else if (err.response?.status === 409) {
        showSnackbar("Esta nota fiscal já está cadastrada no sistema");
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
  // Cálculos
  const calcularTotalItem = (item) => {
    return (parseFloat(item.quantidade) || 0) * (parseFloat(item.valor_unitario) || 0);
  };

  const calcularTotalNota = () => {
    return itens.reduce((total, item) => total + calcularTotalItem(item), 0);
  };

  // ======================================
  // Render
  if (loadingDados) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">Cadastrar Nota Fiscal</Typography>
        <Button variant="outlined" startIcon={<FiArrowLeft />} onClick={() => navigate("/Compras/entregamateriais")}>
          Voltar para Listagem
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>Importante:</strong> O anexo da nota fiscal (PDF) é obrigatório para cadastro. Tamanho máximo: 5MB.
      </Alert>

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
                      disabled={loading}
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
                      disabled={loading}
                    />
                  </Grid>
                  <Grid item xs={12} sx={{minWidth: '30%'}}>
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
                          disabled={loading}
                        />
                      )}
                      disabled={loading}
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
                      disabled={loading}
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
                      disabled={loading}
                    />
                  </Grid>
                  <Grid item xs={12} sx={{minWidth: "100%"}}>
                    <TextField 
                      label="Observações" 
                      name="obs" 
                      value={formData.obs} 
                      onChange={handleFormChange} 
                      fullWidth 
                      multiline 
                      rows={3} 
                      size="small" 
                      disabled={loading}
                    />
                  </Grid>
                  
                  {/* SEÇÃO DE ANEXO */}
                  <Grid item xs={12} sx={{minWidth: "100%"}}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" mb={1} fontWeight="bold">
                      📎 Anexar Nota Fiscal (PDF) *
                    </Typography>
                    
                    <FileUpload
                      arquivoAtual={anexo}
                      handleArquivoChange={handleAnexoChange}
                      disabled={loading}
                      error={anexoError}
                      errorMessage={anexoErrorMessage}
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
                    disabled={loading}
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
                      {itens.length > 1 && !loading && (
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={() => handleRemoveItem(index)}
                        >
                          <FiTrash2 />
                        </IconButton>
                      )}
                    </Box>
                    <Grid container spacing={2} >
                      <Grid item xs={12} sx={{minWidth: "23%"}}>
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
                              disabled={loading}
                            />
                          )}
                          disabled={loading}
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
                          disabled={loading}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField 
                          label="Unidade" 
                          value={item.unid} 
                          fullWidth 
                          size="small" 
                          InputProps={{ readOnly: true }} 
                          disabled={loading}
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
                          disabled={loading}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField 
                          label="Número do Lote" 
                          value={item.numero_lote} 
                          onChange={(e) => handleItemChange(index, 'numero_lote', e.target.value)} 
                          fullWidth 
                          size="small" 
                          disabled={loading}
                        />
                      </Grid>
                      <Grid item xs={12} sx={{minWidth: "100%"}}>
                        <TextField 
                          label="Descrição" 
                          value={item.descricao} 
                          fullWidth 
                          size="small" 
                          multiline 
                          InputProps={{ readOnly: true }} 
                          disabled={loading}
                        />
                      </Grid>
                      <Grid item xs={12} sx={{minWidth: "100%"}}>
                        <TextField 
                          label="Observações do Item" 
                          value={item.obs} 
                          onChange={(e) => handleItemChange(index, 'obs', e.target.value)} 
                          fullWidth 
                          size="small" 
                          multiline 
                          rows={2} 
                          disabled={loading}
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
                disabled={loading}
              >
                {loading ? "Salvando..." : "Salvar Nota Fiscal"}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>

      <CustomSnackbar 
        open={snackbarOpen} 
        onClose={() => setSnackbarOpen(false)} 
        message={snackbarMessage} 
      />
    </Box>
  );
}