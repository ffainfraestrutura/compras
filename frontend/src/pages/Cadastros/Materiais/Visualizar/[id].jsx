import {
  Typography,
  Grid,
  Paper,
  Divider,
  Box,
  TextField,
  FormControl,
  Button,
  MenuItem,
} from "@mui/material";
import { FiInfo, FiPackage, FiFileText } from "react-icons/fi";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import CustomSnackbar from "../../../../components/SnackBar/SnackBar";

// 🔧 Componente Section movido para fora
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

// 🔧 Componente RenderInput movido para fora
const RenderInput = ({
  label,
  field,
  multiline = false,
  select = false,
  options = [],
  data,
  isEditing,
  onChange,
}) => (
  <Box py={1}>
    <TextField
      label={label}
      value={data[field] ?? ""}
      onChange={(e) => onChange(field, e.target.value)}
      fullWidth
      size="small"
      multiline={multiline}
      select={select}
      rows={multiline ? 3 : 1}
      disabled={!isEditing}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !multiline) e.preventDefault();
      }}
    >
      {select &&
        options.map((opt, idx) => (
          <MenuItem key={idx} value={opt.value ?? opt}>
            {opt.label ?? opt}
          </MenuItem>
        ))}
    </TextField>
  </Box>
);

export default function VisualizarMaterialPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_API_URL;

  const [data, setData] = useState({});
  const [unidades, setUnidades] = useState([]);
  const [centrosCusto, setCentrosCusto] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [materialRes, undRes, ccRes] = await Promise.all([
        axios.get(`${API_BASE}/materiais/${id}`, { headers }),
        axios.get(`${API_BASE}/unidades`, { headers }),
        axios.get(`${API_BASE}/centrocusto`, { headers }),
      ]);

      setData(materialRes.data || {});
      setUnidades(undRes.data || []);
      setCentrosCusto(ccRes.data || []);
      console.log(materialRes);
    } catch (err) {
      console.error(err);
      alert("Erro ao carregar os dados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [id]);

  const handleSnackbarClose = () => setSnackbarOpen(false);

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  // 🔧 Atualiza apenas o campo alterado
  const handleFieldChange = (field, value) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      await axios.put(`${API_BASE}/materiais/${id}`, data, { headers });

      setIsEditing(false);
      showSnackbar("Registro atualizado com sucesso!");
    } catch (err) {
      console.error("Erro ao atualizar:", err);
      alert("Erro ao atualizar registro.");
    }
  };

  return (
    <Box>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <FiInfo size={24} />
          <Typography variant="h5" fontWeight="bold" ml={1}>
            Visualização do Material
          </Typography>
        </Box>

        {/* Informações Básicas */}
        <Section title="Informações Básicas" icon={<FiFileText />}>
          <Grid item xs={12}>
            <RenderInput
              label="Descrição"
              field="descricao"
              data={data}
              isEditing={isEditing}
              onChange={handleFieldChange}
            />
          </Grid>
          <Grid>
            <FormControl fullWidth>
              <Grid
                container
                spacing={2}
                sx={{ justifyContent: "space-between" }}
              >
                <Grid item sx={{ flexGrow: 1 }}>
                  <RenderInput
                    label="Unidade"
                    field="unid"
                    select={true}
                    options={unidades.map((u) => ({
                      value: u.descricao,
                      label: u.descricao,
                    }))}
                    data={data}
                    isEditing={isEditing}
                    onChange={handleFieldChange}
                  />
                </Grid>
                <Grid item sx={{ flexGrow: 1 }}>
                  <RenderInput
                    label="Status"
                    field="status"
                    select={true}
                    options={[
                      { label: "Ativo", value: "1" },
                      { label: "Inativo", value: "0" },
                    ]}
                    data={data}
                    isEditing={isEditing}
                    onChange={handleFieldChange}
                  />
                </Grid>
              </Grid>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <RenderInput
              label="Observação"
              field="obs"
              multiline={true}
              data={data}
              isEditing={isEditing}
              onChange={handleFieldChange}
            />
          </Grid>
        </Section>

        {/* Detalhes */}
        <Section title="Detalhes do Material" icon={<FiPackage />}>
          <Grid container spacing={2} sx={{ justifyContent: "space-between" }}>
            <Grid item sx={{ flexGrow: 1 }}>
              <RenderInput
                label="Marca"
                field="marca"
                data={data}
                isEditing={isEditing}
                onChange={handleFieldChange}
              />
              <RenderInput
                label="Modelo"
                field="modelo"
                data={data}
                isEditing={isEditing}
                onChange={handleFieldChange}
              />
            </Grid>
            <Grid item sx={{ flexGrow: 1 }}>
              <RenderInput
                label="EAN"
                field="ean"
                data={data}
                isEditing={isEditing}
                onChange={handleFieldChange}
              />
              <RenderInput
                label="Subgrupo"
                field="sub_grupo"
                select={true}
                options={[
                  { value: 2, label: "FERRAMENTAL - VIVO" },
                  { value: 3, label: "EPI/EPC - PROPRIO" },
                  { value: 5, label: "CABO FIBRA OPTICA - CLARO" },
                  { value: 6, label: "CABO METALICO - CLARO" },
                  { value: 7, label: "MISCELÂNEO - CLARO" },
                  { value: 8, label: "CABO FIBRA OPTICA - VIVO" },
                  { value: 9, label: "CABO METÁLICO - VIVO" },
                  { value: 10, label: "MISCELÂNEO - VIVO" },
                  { value: 11, label: "MISCELÂNEO - PROPRIO" },
                  { value: 12, label: "MICELÂNEO CLARO IAT" },
                  { value: 13, label: "MODEM TIM" },
                  { value: 14, label: "MODEM LIGGA" },
                  { value: 15, label: "ITEM LOCADO" },
                  { value: 16, label: "MISCELANEO LIGGA" },
                  { value: 18, label: "MISCELÂNEO IHS" },
                ]}
                data={data}
                isEditing={isEditing}
                onChange={handleFieldChange}
              />
            </Grid>
            <Grid item sx={{ flexGrow: 1 }}>
              <RenderInput
                label="Qtd. Estoque"
                field="saldo"
                data={data}
                isEditing={isEditing}
                onChange={handleFieldChange}
              />
              <RenderInput
                label="Patrimônio"
                field="patrimonio"
                data={data}
                isEditing={isEditing}
                onChange={handleFieldChange}
              />
            </Grid>
          </Grid>
          <Grid item xs={12} sx={{ flexGrow: 1 }}>
            <RenderInput
              label="Gestão de Material"
              field="centrocusto"
              select={true}
              options={centrosCusto.map((item) => ({
                value: item.descricao,
                label: item.descricao,
              }))}
              data={data}
              isEditing={isEditing}
              onChange={handleFieldChange}
            />
          </Grid>
        </Section>

        {/* Botões */}
        <Box display="flex" justifyContent="flex-end" mt={3} sx={{ gap: 2 }}>
          {isEditing ? (
            <>
              <Button
                variant="outlined"
                onClick={() => {
                  setIsEditing(false);
                  fetchAll();
                }}
              >
                Cancelar
              </Button>
              <Button variant="contained" onClick={handleSubmit}>
                Enviar
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outlined"
                onClick={() => navigate("/Cadastros/Materiais")}
              >
                Voltar
              </Button>
              <Button variant="contained" onClick={() => setIsEditing(true)}>
                Editar
              </Button>
            </>
          )}
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
