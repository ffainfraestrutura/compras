import {
    Typography,
    Button,
    Grid,
    Paper,
    Divider,
    Box,
    TextField,
    Container,
    FormControl,
    MenuItem,
    InputLabel,
    Select,
} from "@mui/material";

import { FiInfo, FiPackage, FiFileText, FiPhone, FiMapPin } from "react-icons/fi";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import CustomSnackbar from "../../../../components/SnackBar/SnackBar";
import { useNavigate } from "react-router-dom";

export default function CadastroFornecedor({ onSubmit }) {
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [errors, setErrors] = useState({}); // Estado para controlar erros de validação

    const estadoRef = useRef();
    const razaoSocialRef = useRef();
    const cepRef = useRef();
    const statusRef = useRef();
    const obsRef = useRef();
    const nomeContatoRef = useRef();
    const telefoneContatoRef = useRef();
    const emailContatoRef = useRef();
    const categoriaRef = useRef();
    const ativoRef = useRef();
    const nomeFantasiaRef = useRef();
    const cnpjRef = useRef();
    const inscricaoEstadualRef = useRef();
    const telefoneRef = useRef();
    const emailRef = useRef();
    const siteRef = useRef();
    const enderecoRef = useRef();
    const cidadeRef = useRef();

    // Campos obrigatórios
    const requiredFields = [
        'razao_social',
        'cnpj', 
        'inscricao_estadual',
        'cep',
        'ativo',
        'nome_fantasia'
    ];

    const handleSnackbarClose = () => {
        setSnackbarOpen(false);
    };

    const showSnackbar = (message) => {
        setSnackbarMessage(message);
        setSnackbarOpen(true);
    };

    const validateForm = (formData) => {
        const newErrors = {};
        
        requiredFields.forEach(field => {
            if (!formData[field] || formData[field].toString().trim() === '') {
                newErrors[field] = 'Campo obrigatório';
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const renderInput = (
        label,
        ref,
        multiline = false,
        select = false,
        options = [],
        { placeholder, maxLength, format, fieldName } = {} // Adicionei fieldName para identificar o campo
    ) => {
        const hasError = errors[fieldName];
        
        return (
            <Box py={1}>
                {select ? (
                    <FormControl fullWidth size="small" error={hasError}>
                        <InputLabel>{label}</InputLabel>
                        <Select
                            label={label}
                            defaultValue=""
                            inputRef={ref}
                            error={hasError}
                            MenuProps={{
                                anchorOrigin: {
                                    vertical: "bottom",
                                    horizontal: "left",
                                },
                                transformOrigin: {
                                    vertical: "top",
                                    horizontal: "left",
                                },
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
                        error={hasError}
                        helperText={hasError}
                        placeholder={placeholder}
                        inputProps={{
                            maxLength: maxLength
                        }}
                    />
                )}
            </Box>
        );
    };

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
            estado: estadoRef.current?.value || "",
            cep: cepRef.current?.value || "",
            nome_contato: nomeContatoRef.current?.value || "",
            telefone_contato: telefoneContatoRef.current?.value || "",
            email_contato: emailContatoRef.current?.value || "",
            categoria: categoriaRef.current?.value || "",
            ativo: ativoRef.current?.value || "",
            razao_social: razaoSocialRef.current?.value || "",
            nome_fantasia: nomeFantasiaRef.current?.value || "",
            cnpj: cnpjRef.current?.value || "",
            status: statusRef.current?.value || "",
            obs: obsRef.current?.value || "",
            inscricao_estadual: inscricaoEstadualRef.current?.value || "",
            telefone: telefoneRef.current?.value || "",
            email: emailRef.current?.value || "",
            site: siteRef.current?.value || "",
            endereco: enderecoRef.current?.value || "",
            cidade: cidadeRef.current?.value || "",
        };

        console.log(formData);

        // Validação dos campos obrigatórios
        if (!validateForm(formData)) {
            showSnackbar("Preencha os campos obrigatórios.");
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/fornecedores`,
                formData,
                {
                    headers: {
                        Authorization: localStorage.getItem("token"),
                    },
                }
            );

            console.log("Formulário enviado:", response.data);
            showSnackbar("Fornecedor cadastrado com sucesso!");
            
            // Limpa os erros após sucesso
            setErrors({});

            
        } catch (error) {
            console.error("Erro ao enviar solicitação:", error);
            showSnackbar("Erro ao cadastrar fornecedor. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            <Box>
                <Paper elevation={3} sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" mb={3}>
                        <FiInfo size={24} />
                        <Typography variant="h5" fontWeight="bold" ml={1}>
                            Cadastrar Fornecedor
                        </Typography>
                    </Box>

                    <Section title="Informações Básicas" icon={<FiFileText />}>
                        <Grid item xs={12} required>
                            {renderInput("Razão Social", razaoSocialRef, false, false, [], {
                                fieldName: 'razao_social'
                            })}
                        </Grid>
                        <Grid item xs={12}>
                            {renderInput("Nome Fantasia", nomeFantasiaRef)}
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
                                        {renderInput("CNPJ", cnpjRef, false, false, [], {
                                            placeholder: '00.000.000/0000-00',
                                            maxLength: 18,
                                            format: 'cnpj',
                                            fieldName: 'cnpj'
                                        })}
                                    </Grid>
                                    <Grid item xs={12} sx={{ flexGrow: 1 }}>
                                        {renderInput("Inscrição Estadual", inscricaoEstadualRef, false, false, [], {
                                            placeholder: '000.000.000.000',
                                            maxLength: 14,
                                            fieldName: 'inscricao_estadual'
                                        })}
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
                                        {renderInput("Categoria", categoriaRef)}
                                    </Grid>
                                    <Grid item xs={12} sx={{ flexGrow: 1 }}>
                                        {renderInput("Status", ativoRef, false, true, [
                                            { label: "Ativo", value: 1 },
                                            { label: "Inativo", value: 0 },
                                        ], {
                                            fieldName: 'ativo'
                                        })}
                                    </Grid>
                                </Grid>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            {renderInput("Observação", obsRef, true)}
                        </Grid>
                    </Section>

                    <Section title="Informações de Contato" icon={<FiPhone />}>
                        <Grid
                            container
                            spacing={2}
                            sx={{ justifyContent: "space-between" }}
                        >
                            <Grid item sx={{ flexGrow: 1 }}>
                                {renderInput("Telefone", telefoneRef)}
                                {renderInput("Email", emailRef)}
                            </Grid>

                            <Grid item sx={{ flexGrow: 1 }}>
                                {renderInput("Site", siteRef)}
                                {renderInput("Nome Contato", nomeContatoRef)}
                            </Grid>

                            <Grid item sx={{ flexGrow: 1 }}>
                                {renderInput("Email Contato", emailContatoRef)}
                                {renderInput("Telefone Contato", telefoneContatoRef)}
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
                                {renderInput("Endereço", enderecoRef)}
                                {renderInput("CEP", cepRef, false, false, [], {
                                    fieldName: 'cep',
                                    maxLength: 10,
                                })}
                            </Grid>

                            <Grid item sx={{ flexGrow: 1 }}>
                                {renderInput("Estado", estadoRef)}
                                {renderInput("Cidade", cidadeRef)}
                            </Grid>
                        </Grid>
                    </Section>
                    
                    <Grid display="flex" justifyContent="flex-end" mt={3} sx={{ gap: 2 }}>
                        <Button
                            variant="outlined"
                            onClick={() => navigate("/Cadastros/Fornecedores")}
                            disabled={loading}
                        >
                            Voltar
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? "Salvando..." : "Cadastrar"}
                        </Button>
                    </Grid>
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