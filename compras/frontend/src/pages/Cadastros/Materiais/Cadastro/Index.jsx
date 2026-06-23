import {
  Typography,
  Button,
  Grid,
  Paper,
  Divider,
  Box,
  TextField,
  FormControl,
  MenuItem,
  InputLabel,
  Select,
} from "@mui/material";

import { FiInfo, FiPackage, FiFileText } from "react-icons/fi";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import CustomSnackbar from "../../../../components/SnackBar/SnackBar";
import { useNavigate } from "react-router-dom";

// ✅ Defina as URLs fora do componente para evitar recriação a cada render
const API_URL_CCUSTO = import.meta.env.VITE_API_URL + "/centrocusto";
const API_URL_UND = import.meta.env.VITE_API_URL + "/unidades";

export default function CadastroMaterial({ onSubmit }) {
  const navigate = useNavigate();

  const [rowsCCusto, setRowsCCusto] = useState([]);
  const [rowsUND, setRowsUND] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const descricaoRef = useRef();
  const unidRef = useRef();
  const centrocustoRef = useRef();
  const statusRef = useRef();
  const obsRef = useRef();
  const marcaRef = useRef();
  const modeloRef = useRef();
  const eanRef = useRef();
  const subGrupoRef = useRef();
  const respMaterialRef = useRef();
  const patrimonioRef = useRef();

  // ✅ useEffect sem dependências, executa só uma vez
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const [ccustoRes, undRes] = await Promise.all([
          axios.get(API_URL_CCUSTO, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(API_URL_UND, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        // ✅ Normaliza os dados
        setRowsCCusto(
          ccustoRes.data.map((item, index) => ({ ...item, id: index + 1 }))
        );
        setRowsUND(
          undRes.data.map((item, index) => ({ ...item, id: item.id ?? `temp-${index}` }))
        );
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
        showSnackbar("Erro ao carregar dados. Tente novamente.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => setSnackbarOpen(false);

  // 🔧 Componente reutilizável para inputs
  const renderInput = (label, ref, multiline = false, select = false, options = []) => (
    <Box py={1}>
      {select ? (
        <FormControl fullWidth size="small">
          <InputLabel>{label}</InputLabel>
          <Select
            label={label}
            defaultValue=""
            inputRef={ref}
            MenuProps={{
              anchorOrigin: { vertical: "bottom", horizontal: "left" },
              transformOrigin: { vertical: "top", horizontal: "left" },
            }}
          >
            <MenuItem value="">
              <em>Selecionar</em>
            </MenuItem>
            {options.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ) : (
        <TextField
          fullWidth
          size="small"
          label={label}
          inputRef={ref}
          multiline={multiline}
          rows={multiline ? 3 : 1}
        />
      )}
    </Box>
  );

  // 🔧 Seção com título e ícone
  const Section = ({ title, icon, children }) => (
    <Box mb={2}>
      <Box
        bgcolor="#f5f5f5"
        px={2}
        py={1}
        display="flex"
        alignItems="center"
        borderRadius={1}
      >
        {icon}
        <Typography variant="subtitle1" fontWeight="bold" ml={1}>
          {title}
        </Typography>
      </Box>
      <Divider sx={{ my: 1 }} />
      <Box p={2}>{children}</Box>
    </Box>
  );

  const handleSubmit = async () => {
    const formData = {
      descricao: descricaoRef.current?.value || "",
      unid: unidRef.current?.value || "",
      centrocusto: centrocustoRef.current?.value || "",
      status: statusRef.current?.value || "",
      obs: obsRef.current?.value || "",
      marca: marcaRef.current?.value || "",
      modelo: modeloRef.current?.value || "",
      ean: eanRef.current?.value || "",
      sub_grupo: subGrupoRef.current?.value || "",
      resp_material: respMaterialRef.current?.value || "",
      patrimonio: patrimonioRef.current?.value || "",
    };

    // ⚠️ Validação básica
    if (!formData.descricao || !formData.unid || !formData.centrocusto || !formData.status) {
      showSnackbar("Preencha os campos obrigatórios.");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/materiais`, formData, {
        headers: { Authorization: localStorage.getItem("token") },
      });
      showSnackbar("Material cadastrado com sucesso!");
    } catch (error) {
      console.error("Erro ao enviar solicitação:", error);
      showSnackbar("Erro ao enviar solicitação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <FiInfo size={24} />
          <Typography variant="h5" fontWeight="bold" ml={1}>
            Cadastro de Material
          </Typography>
        </Box>

        <Section title="Informações Básicas" icon={<FiFileText />}>
          <Grid>
            <TextField fullWidth size="small" label="Descrição *" inputRef={descricaoRef} />
          </Grid>

          <Grid>
            <FormControl fullWidth>
              <Grid container spacing={2}>
                <Grid item xs={6} sx={{minWidth: '49%'}}>
                  {renderInput(
                    "Unidade *",
                    unidRef,
                    false,
                    true,
                    rowsUND.map((item) => ({
                      label: item.descricao,
                      value: item.descricao,
                    }))
                  )}
                </Grid>
                <Grid item xs={6} sx={{minWidth: '49%'}}>
                  {renderInput("Status *", statusRef, false, true, [
                    { label: "Ativo", value: 1 },
                    { label: "Inativo", value: 0 },
                  ])}
                </Grid>
              </Grid>
            </FormControl>
          </Grid>

          <Grid>{renderInput("Observação", obsRef, true)}</Grid>
        </Section>

        <Section title="Detalhes do Material" icon={<FiPackage />}>
          <Grid container spacing={2}>
            <Grid item xs={4} sx={{minWidth: '32%'}}>
              {renderInput("Marca", marcaRef)}
              {renderInput("Modelo", modeloRef)}
            </Grid>
            <Grid item xs={4} sx={{minWidth: '32%'}}>
              {renderInput("EAN", eanRef)}
              {renderInput("Subgrupo", subGrupoRef)}
            </Grid>
            <Grid item xs={4} sx={{minWidth: '32%'}}>
              {renderInput("Responsável", respMaterialRef)}
              {renderInput("Patrimônio", patrimonioRef)}
            </Grid>
          </Grid>

          <Grid mt={2}>
            {renderInput(
              "Gestão de Material *",
              centrocustoRef,
              false,
              true,
              rowsCCusto.map((item) => ({
                label: item.descricao,
                value: item.id,
              }))
            )}
          </Grid>
        </Section>

        <Box display="flex" justifyContent="flex-end" mt={3}>
          <Button
            variant="outlined"
            sx={{ mr: 2 }}
            onClick={() => navigate("..")} 
          >
            Voltar
          </Button>
          <Button variant="contained" onClick={handleSubmit} disabled={loading}>
            {loading ? "Enviando..." : "Cadastrar"}
          </Button>
        </Box>
      </Paper>

      <CustomSnackbar
        open={snackbarOpen}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
      />
    </Box>
  );
}
