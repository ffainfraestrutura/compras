import {
    Typography,
    Grid,
    Paper,
    Divider,
    Box,
    TextField,
    Container,
    Button,
} from '@mui/material';

import { FiInfo, FiFileText, FiMap, FiMapPin } from 'react-icons/fi';
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function VisualizarFilialPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const API_BASE = import.meta.env.VITE_API_URL;

    const [data, setData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    const requiredFields = ['descricao', 'cnpj', 'cep', 'telefone'];

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const res = await axios.get(`${API_BASE}/filiais/${id}`, { headers });
            setData(res.data);
        } catch (err) {
            console.error(err);
            setError("Erro ao carregar os dados.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const renderInput = (label, field, multiline = false, select = false, options = [], disabled = false) => (
        <Box py={1}>
            <TextField
                label={label}
                value={String(data[field] ?? '')}
                onChange={(e) =>
                    isEditing && setData((prev) => ({ ...prev, [field]: e.target.value }))
                }
                fullWidth
                size="small"
                multiline={multiline}
                select={select}
                rows={multiline ? 3 : 1}
                SelectProps={{ native: true }}
                required={requiredFields.includes(field)}
                disabled={disabled || !isEditing}
                error={requiredFields.includes(field) && isEditing && !data[field]}
                helperText={
                    requiredFields.includes(field) && isEditing && !data[field]
                        ? 'Campo obrigatório'
                        : ''
                }
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

    const Section = ({ title, icon, children }) => (
        <Box mb={2}>
            <Box bgcolor="#f5f5f5" px={2} py={1} display="flex" alignItems="center" borderRadius={1}>
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
        const hasEmptyRequired = requiredFields.some((field) => !data[field]);
        if (hasEmptyRequired) {
            alert('Preencha todos os campos obrigatórios.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            await axios.put(`${API_BASE}/filiais/${id}`, data, { headers });

            setIsEditing(false);
        } catch (err) {
            console.error('Erro ao atualizar registro:', err);
            alert('Erro ao atualizar registro.');
        }
    };

    return (
        <Container maxWidth="md">
            <Box>
                <Paper elevation={3} sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" mb={3}>
                        <FiInfo size={24} />
                        <Typography variant="h5" fontWeight="bold" ml={1}>
                            Visualização da Filial
                        </Typography>
                    </Box>

                    <Section title="Dados da Filial" icon={<FiFileText />}>
                        <Grid spacing={2} fullWidth >
                            <Grid item xs={12} >
                                {renderInput('Descrição', 'descricao')}
                            </Grid>
                            <Grid container xs={6} sx={{ justifyContent: "space-between" }}>
                                <Grid item sx={{ minWidth: "58vh" }}>
                                    {renderInput('CNPJ', 'CNPJ')}
                                </Grid>
                                <Grid item sx={{ minWidth: "58vh" }}>
                                    {renderInput('Telefone', 'telefone')}
                                </Grid>
                            </Grid>
                            <Grid container xs={6} sx={{ justifyContent: "space-between" }}>
                                <Grid item sx={{ minWidth: "38vh" }}>
                                    {renderInput('CEP', 'cep')}
                                </Grid>
                                <Grid item sx={{ minWidth: "38vh" }}>
                                    {renderInput('Email', 'mail')}
                                </Grid>
                                <Grid item sx={{ minWidth: "38vh" }}>
                                    {renderInput('Status', 'visivel', false, true, [
                                        { label: 'Ativo', value: '1' },
                                        { label: 'Inativo', value: '0' },
                                    ])}
                                </Grid>
                            </Grid>
                        </Grid>
                    </Section>
                    <Section title="Endereço" icon={<FiMapPin />}>
                        <Grid spacing={2}>
                            <Grid item xs={6}>
                                {renderInput('Razão Social', 'razsocial')}
                            </Grid>
                            <Grid xs={6} >
                                <Grid container sx={{ justifyContent: "space-between" }}>
                                    <Grid item sx={{ minWidth: "58vh" }}>
                                        {renderInput('Telefone Secundário', 'telefone2')}
                                    </Grid>
                                    <Grid tem sx={{ minWidth: "58vh" }}>
                                        {renderInput('Número', 'numero')}
                                    </Grid>
                                </Grid>
                            </Grid>
                            <Grid item xs={12}>
                                {renderInput('Endereço', 'endereco')}
                            </Grid>
                            <Grid item xs={8}>
                                {renderInput('Complemento', 'complemento')}
                            </Grid>
                            <Grid container item xs={6} sx={{ justifyContent: "space-between", minWidth: '50vh' }}>
                                <Grid item sx={{ minWidth: "38vh" }}>
                                    {renderInput('Bairro', 'bairro')}
                                </Grid>
                                <Grid item sx={{ minWidth: "38vh" }}>
                                    {renderInput('Cidade', 'cidade')}
                                </Grid>
                                <Grid item sx={{ minWidth: "38vh" }}>
                                    {renderInput('Estado', 'estado')}
                                </Grid>
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
                                        fetchData();
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
                                <Button variant="outlined" onClick={() => navigate('/Cadastros/Filiais')}>
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
        </Container>
    );
}
