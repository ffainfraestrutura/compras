import {
    Typography,
    Grid,
    Paper,
    Divider,
    Box,
    TextField,
    Container,
    FormControl,
    Button,
} from "@mui/material";

import { FiInfo, FiPackage, FiFileText, FiPhone, FiMapPin } from "react-icons/fi";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import CustomSnackbar from "../../../../components/SnackBar/SnackBar";

// 🔧 Componente RenderInput movido para fora
const RenderInput = ({
    label,
    field,
    multiline = false,
    select = false,
    options = [],
    data,
    isEditing,
    onChange
}) => (
    <Box py={1}>
        <TextField
            label={label}
            value={String(data[field] ?? "")}
            onChange={(e) => onChange(field, e.target.value)}
            fullWidth
            size="small"
            multiline={multiline}
            select={select}
            rows={multiline ? 3 : 1}
            SelectProps={{ native: true }}
            disabled={!isEditing}
        >
            {select && (
                <>
                    <option value=""></option>
                    {options.map((opt, idx) => (
                        <option key={idx} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </>
            )}
        </TextField>
    </Box>
);

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

export default function VisualizarMaterialPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const API_BASE = import.meta.env.VITE_API_URL;

    const [data, setData] = useState({});
    const [unidades, setUnidades] = useState([]);
    const [centrosCusto, setCentrosCusto] = useState([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    const fetchAll = async () => {
        try {
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };

            const [fornecedorRes] = await Promise.all([
                axios.get(`${API_BASE}/fornecedores/${id}`, { headers }),
            ]);

            setData(fornecedorRes.data);
        } catch (err) {
            console.error(err);
            setError("Erro ao carregar os dados.");
        } finally {
            setLoading(false);
        }
    };

    const handleSnackbarClose = () => {
        setSnackbarOpen(false);
    };

    const showSnackbar = (message) => {
        setSnackbarMessage(message);
        setSnackbarOpen(true);
    };

    useEffect(() => {
        fetchAll();
    }, [id]);

    // 🔧 Handler para mudanças de campo
    const handleFieldChange = (field, value) => {
        setData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        try {
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };

            await axios.put(`${API_BASE}/fornecedores/${id}`, data, { headers });

            setIsEditing(false);
            showSnackbar("Registro atualizado com sucesso");
        } catch (err) {
            console.error("Erro ao atualizar registro:", err);
            alert("Erro ao atualizar registro.");
        }
    };

    return (
        <Box>
            <Box>
                <Paper elevation={3} sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" mb={3}>
                        <FiInfo size={24} />
                        <Typography variant="h5" fontWeight="bold" ml={1}>
                            Visualização do Fornecedor
                        </Typography>
                    </Box>

                    <Section title="Informações Básicas" icon={<FiFileText />}>
                        <Grid item xs={12} required>
                            <RenderInput
                                label="Razão Social"
                                field="razao_social"
                                data={data}
                                isEditing={isEditing}
                                onChange={handleFieldChange}
                            />
                        </Grid>
                        <Grid item xs={12} required>
                            <RenderInput
                                label="Nome Fantasia"
                                field="nome_fantasia"
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
                                    required
                                >
                                    <Grid item xs={12} sx={{ flexGrow: 1 }}>
                                        <RenderInput
                                            label="CNPJ"
                                            field="cnpj"
                                            data={data}
                                            isEditing={isEditing}
                                            onChange={handleFieldChange}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sx={{ flexGrow: 1 }}>
                                        <RenderInput
                                            label="Inscrição Estadual"
                                            field="inscricao_estadual"
                                            data={data}
                                            isEditing={isEditing}
                                            onChange={handleFieldChange}
                                        />
                                    </Grid>
                                </Grid>
                            </FormControl>
                        </Grid>
                        <Grid>
                            <FormControl fullWidth>
                                <Grid
                                    container
                                    spacing={2}
                                    sx={{ justifyContent: "space-between" }}
                                >
                                    <Grid item xs={12} sx={{ flexGrow: 1 }}>
                                        <RenderInput
                                            label="Categoria"
                                            field="categoria"
                                            data={data}
                                            isEditing={isEditing}
                                            onChange={handleFieldChange}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sx={{ flexGrow: 1 }}>
                                        <RenderInput
                                            label="Status"
                                            field="ativo"
                                            select={true}
                                            options={[
                                                { label: "Ativo", value: 1 },
                                                { label: "Inativo", value: 0 },
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
                                field="Observacoes"
                                multiline={true}
                                data={data}
                                isEditing={isEditing}
                                onChange={handleFieldChange}
                            />
                        </Grid>
                    </Section>

                    <Section title="Informações de Contato" icon={<FiPhone />}>
                        <Grid
                            container
                            spacing={2}
                            sx={{ justifyContent: "space-between" }}
                        >
                            <Grid item sx={{ flexGrow: 1 }}>
                                <RenderInput
                                    label="Telefone"
                                    field="telefone"
                                    data={data}
                                    isEditing={isEditing}
                                    onChange={handleFieldChange}
                                />
                                <RenderInput
                                    label="Email"
                                    field="email"
                                    data={data}
                                    isEditing={isEditing}
                                    onChange={handleFieldChange}
                                />
                            </Grid>

                            <Grid item sx={{ flexGrow: 1 }}>
                                <RenderInput
                                    label="Site"
                                    field="site"
                                    data={data}
                                    isEditing={isEditing}
                                    onChange={handleFieldChange}
                                />
                                <RenderInput
                                    label="Nome Contato"
                                    field="nome_contato"
                                    data={data}
                                    isEditing={isEditing}
                                    onChange={handleFieldChange}
                                />
                            </Grid>

                            <Grid item sx={{ flexGrow: 1 }}>
                                <RenderInput
                                    label="Email Contato"
                                    field="email_contato"
                                    data={data}
                                    isEditing={isEditing}
                                    onChange={handleFieldChange}
                                />
                                <RenderInput
                                    label="Telefone Contato"
                                    field="telefone_contato"
                                    data={data}
                                    isEditing={isEditing}
                                    onChange={handleFieldChange}
                                />
                            </Grid>
                        </Grid>
                    </Section>

                    <Section title="Informações de Endereço" icon={<FiMapPin />}>
                        <Grid
                            container
                            spacing={2}
                            sx={{ justifyContent: "space-between" }}
                        >
                            <Grid item sx={{ flexGrow: 1 }}>
                                <RenderInput
                                    label="Endereço"
                                    field="endereco"
                                    data={data}
                                    isEditing={isEditing}
                                    onChange={handleFieldChange}
                                />
                                <RenderInput
                                    label="CEP"
                                    field="cep"
                                    data={data}
                                    isEditing={isEditing}
                                    onChange={handleFieldChange}
                                />
                            </Grid>

                            <Grid item sx={{ flexGrow: 1 }}>
                                <RenderInput
                                    label="Estado"
                                    field="estado"
                                    data={data}
                                    isEditing={isEditing}
                                    onChange={handleFieldChange}
                                />
                                <RenderInput
                                    label="Cidade"
                                    field="cidade"
                                    data={data}
                                    isEditing={isEditing}
                                    onChange={handleFieldChange}
                                />
                            </Grid>

                        </Grid>
                    </Section>

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
                                    onClick={() => navigate("/Cadastros/Fornecedores")}
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
            </Box>
            <CustomSnackbar
                open={snackbarOpen}
                onClose={handleSnackbarClose}
                message={snackbarMessage}
            />
        </Box>
    );
}