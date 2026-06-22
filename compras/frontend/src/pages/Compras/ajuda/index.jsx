import axios from "axios";
import { useEffect, useState } from "react";
import {
  Backdrop,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  Chip,
  CardActions,
  CardMedia,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  FiSearch,
  FiRefreshCw,
  FiDownload,
  FiExternalLink,
  FiBook,
  FiFileText,
  FiVideo,
  FiHelpCircle,
} from "react-icons/fi";
import CustomSnackbar from "../../../components/SnackBar/SnackBar";

export default function SistemaAjuda() {
  const token = localStorage.getItem("token");
  const userNivelAcesso = parseInt(localStorage.getItem("nivel_acesso") || "1");

  // Estados para dados
  const [modulosAjuda, setModulosAjuda] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estados para filtros
  const [filtroNivel, setFiltroNivel] = useState("todos");
  const [filtroTitulo, setFiltroTitulo] = useState("");

  // Estados para feedback
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // ======================================
  // Buscar módulos de ajuda
  const fetchModulosAjuda = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filtroNivel !== "todos") params.append('nivel_acesso', filtroNivel);
      if (filtroTitulo) params.append('titulo', filtroTitulo);

      const url = `${import.meta.env.VITE_API_URL}/ajuda/modulos${params.toString() ? `?${params.toString()}` : ''}`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Filtrar módulos que o usuário tem permissão para ver
      const modulosFiltrados = (response.data.data || response.data || [])
        .filter(modulo => modulo.nivel_acesso <= userNivelAcesso);

      setModulosAjuda(modulosFiltrados);
    } catch (err) {
      console.error("Erro ao buscar módulos de ajuda:", err);
      setError("Erro ao carregar módulos de ajuda");
      showSnackbar("Erro ao carregar módulos de ajuda");
    } finally {
      setLoading(false);
    }
  };

  // ======================================
  // useEffect
  useEffect(() => {
    fetchModulosAjuda();
  }, []);

  // ======================================
  // Snackbar
  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => setSnackbarOpen(false);

  // ======================================
  // Funções auxiliares
  const handleLimparFiltros = () => {
    setFiltroNivel("todos");
    setFiltroTitulo("");
    fetchModulosAjuda();
  };

  const handleAplicarFiltros = () => {
    fetchModulosAjuda();
  };

  const getNivelAcessoChip = (nivel) => {
    const config = {
      1: { color: "success", label: "Básico" },
      2: { color: "warning", label: "Intermediário" },
      3: { color: "error", label: "Avançado" },
      4: { color: "primary", label: "Administrador" },
    };

    const cfg = config[nivel] || { color: "default", label: `Nível ${nivel}` };
    return <Chip label={cfg.label} color={cfg.color} size="small" sx={{ mb: 1 }} />;
  };

  const getIconByTitle = (titulo) => {
    const tituloLower = titulo.toLowerCase();

    if (tituloLower.includes('tutorial') || tituloLower.includes('guia')) {
      return <FiBook size={24} />;
    } else if (tituloLower.includes('video') || tituloLower.includes('vídeo')) {
      return <FiVideo size={24} />;
    } else if (tituloLower.includes('manual')) {
      return <FiFileText size={24} />;
    } else {
      return <FiHelpCircle size={24} />;
    }
  };

  const handleAbrirPDF = (modulo) => {
    if (!modulo.url_pdf) {
      showSnackbar("PDF não disponível para este módulo");
      return;
    }
    window.open(`https://ffasip.ddns.net:4545/compras/ajuda/${modulo.url_pdf}`, '_blank');
  };

  const handleDownloadPDF = async (modulo) => {
    if (!modulo.url_pdf) {
      showSnackbar("PDF não disponível para download");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(
        `https://ffasip.ddns.net:4545/compras/ajuda/${modulo.url_pdf}`,
        {
          responseType: 'blob',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Criar blob e fazer download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = `${modulo.titulo.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showSnackbar("Download iniciado com sucesso!");
    } catch (error) {
      console.error("Erro ao fazer download:", error);
      showSnackbar("Erro ao fazer download do arquivo");
    } finally {
      setLoading(false);
    }
  };

  // ======================================
  // Renderização
  return (
    <div>
      <Card>
        <CardContent>
          {/* Cabeçalho */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
          >
            <Typography variant="h5">Ajuda</Typography>
          </Box>

          {/* Cards dos Módulos - MODIFICADO PARA 4 CARDS POR LINHA */}
          {loading ? (
            <Box display="flex" justifyContent="center" py={8}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box textAlign="center" py={8}>
              <Typography color="error">{error}</Typography>
              <Button
                variant="outlined"
                onClick={fetchModulosAjuda}
                sx={{ mt: 2 }}
              >
                Tentar Novamente
              </Button>
            </Box>
          ) : modulosAjuda.length === 0 ? (
            <Box textAlign="center" py={8}>
              <Typography variant="h6" color="text.secondary">
                Nenhum módulo de ajuda encontrado
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Tente ajustar os filtros ou entre em contato com o administrador
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {modulosAjuda.map((modulo) => (
                <Grid
                  item
                  xs={12}  // 1 card em telas extra pequenas (celular)
                  sm={6}   // 2 cards em telas pequenas (tablet pequeno)
                  md={4}   // 3 cards em telas médias (tablet grande)
                  lg={3}   // 4 cards em telas grandes (desktop)
                  xl={3}   // 4 cards em telas extra grandes
                  key={modulo.id}
                  sx={{ display: 'flex' }}
                >
                  <Card
                    sx={{
                      width: '100%',
                      width: 280,
                      height: 220, // Altura fixa para todos os cards
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 6,
                      }
                    }}
                  >
                    <CardContent sx={{ 
                      flexGrow: 1, 
                      display: 'flex', 
                      flexDirection: 'column',
                      overflow: 'auto'
                    }}>
                      {/* Título */}
                      <Typography variant="h6" gutterBottom sx={{ 
                        minHeight: 64, // Altura mínima para títulos
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {modulo.titulo}
                      </Typography>

                      {/* Nível de Acesso */}
                      {/* <Box sx={{ mb: 1 }}>
                        {getNivelAcessoChip(modulo.nivel_acesso)}
                      </Box> */}

                      {/* Descrição */}
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 2,
                          flexGrow: 1,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {modulo.descricao}
                      </Typography>

                      {/* Indicador de PDF */}
                      {modulo.url_pdf && (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            mt: 2,
                            p: 1,
                            bgcolor: 'grey.50',
                            borderRadius: 1
                          }}
                        >
                          <FiFileText style={{ marginRight: 8 }} />
                          <Typography variant="caption">
                            Documento PDF disponível
                          </Typography>
                        </Box>
                      )}
                    </CardContent>

                    {/* Ações do Card */}
                    <CardActions sx={{ p: 2, pt: 0, gap: 1 }}>
                      {modulo.url_pdf ? (
                        <>
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<FiExternalLink />}
                            onClick={() => handleAbrirPDF(modulo)}
                            sx={{ flex: 1 }}
                          >
                            Abrir
                          </Button>
                          
                          <Tooltip title="Download">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleDownloadPDF(modulo)}
                              sx={{ 
                                border: '1px solid',
                                borderColor: 'primary.main',
                                borderRadius: 1
                              }}
                            >
                              <FiDownload />
                            </IconButton>
                          </Tooltip>
                        </>
                      ) : (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ width: '100%', textAlign: 'center', py: 1 }}
                        >
                          Sem documento disponível
                        </Typography>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {/* Contador de resultados */}
          {!loading && !error && modulosAjuda.length > 0 && (
            <Box mt={3} pt={2} borderTop={1} borderColor="divider">
              <Typography variant="body2" color="text.secondary">
                Mostrando {modulosAjuda.length} módulo(s) de ajuda
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Backdrop de Loading */}
      <Backdrop
        open={loading}
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      {/* Snackbar */}
      <CustomSnackbar
        open={snackbarOpen}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
      />
    </div>
  );
}