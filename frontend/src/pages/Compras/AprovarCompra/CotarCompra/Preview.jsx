import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Grid,
    Box,
    Divider,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    IconButton,
    TextField,
    Alert,
    Backdrop,
} from '@mui/material';
import axios from 'axios';
import * as XLSX from 'xlsx';
import "./Preview.css";
import { FiCheck, FiX } from 'react-icons/fi';
import Modal from '../../../../components/Modal/Modal';

const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

// Modal de Detalhes do Fornecedor com botões de aprovação
const FornecedorDetailsModal = ({ open, onClose, fornecedorId, fornecedorNome, cod_compra, material, onAprovacao }) => {
    const [fornecedor, setFornecedor] = useState(null);
    const [loading, setLoading] = useState(false);
    const [justificativaModal, setJustificativaModal] = useState({ open: false, status: null });
    const [justificativa, setJustificativa] = useState("");
    const [loadingAprovacao, setLoadingAprovacao] = useState(false);

    const nivelAcesso = Number(localStorage.getItem("nivel_acesso"));
    const isAprovacao = [4, 5, 6].includes(nivelAcesso);

    useEffect(() => {
        if (open && fornecedorId) {
            fetchFornecedorDetails();
        }
    }, [open, fornecedorId]);

    const fetchFornecedorDetails = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/fornecedores/${fornecedorId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setFornecedor(response.data);
        } catch (error) {
            console.error('Erro ao carregar dados do fornecedor:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenJustificativa = (status) => {
        setJustificativaModal({ open: true, status });
        setJustificativa("");
    };

    const handleCloseJustificativa = () => {
        setJustificativaModal({ open: false, status: null });
        setJustificativa("");
    };

    const handleAprovarFornecedor = async () => {
        if (!justificativa.trim()) {
            alert("Informe uma justificativa para continuar.");
            return;
        }

        const { status } = justificativaModal;

        try {
            setLoadingAprovacao(true);

            const camposAceite = {
                4: { aceite: "aceite_diretor", justificativa: "justificativa_diretor", matricula: "matricula_diretor" },
                5: { aceite: "aceite_diretor", justificativa: "justificativa_diretor", matricula: "matricula_diretor" },
                6: { aceite: "aceite_diretor", justificativa: "justificativa_diretor", matricula: "matricula_diretor" }
            };

            const campos = camposAceite[nivelAcesso];

            // DEPOIS
        const payload = {
            cod_compra: cod_compra,
            cod_cotacao: material?.cod_cotacao,
            [campos.aceite]: status,
            [campos.justificativa]: justificativa,
            [campos.matricula]: localStorage.getItem("matricula"),
            fornecedorId: fornecedorId,
            cod_materiais: material?.cod_materiais || [], // array vazio = aprova todos do fornecedor
        };

            // console.log("Payload de aprovação:", payload);
            // console.log("Fornecedor selecionado:", {
            //     fornecedorId,
            //     nome: fornecedorNome,
            //     material: material?.cod_material
            // });

            await axios.put(`${import.meta.env.VITE_API_URL}/aprovarcompra`, payload, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });

            if (onAprovacao) {
                onAprovacao({
                    fornecedorId,
                    material: material?.cod_material,
                    status: status === 1 ? 'aprovado' : 'reprovado',
                    justificativa,
                    nomeFornecedor: fornecedorNome
                });
            }

            alert(`Fornecedor ${status === 1 ? 'aprovado' : 'reprovado'} com sucesso!`);
            handleCloseJustificativa();
            onClose();
            window.location.href = '../';

        } catch (error) {
            console.error("Erro ao processar decisão:", error);
            alert(error.response?.data?.error || "Erro ao processar decisão!");
        } finally {
            setLoadingAprovacao(false);
        }

    };

    return (
        <>
            <Modal
                open={open}
                onClose={onClose}
                title={`Dados do Fornecedor - ${fornecedorNome || ''}`}
            >
                <Box sx={{ minWidth: 600, width: '100%' }}>
                    {loading ? (
                        <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
                            <CircularProgress />
                        </Box>
                    ) : fornecedor ? (
                        <Box sx={{ maxHeight: '70vh', overflowY: 'auto', pr: 1 }} >
                            <Grid container spacing={3}>
                                {isAprovacao && (
                                    <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center', minWidth: '96%' }}>
                                        <Button
                                            variant="contained"
                                            color="success"
                                            size="large"
                                            startIcon={<FiCheck />}
                                            onClick={() => handleOpenJustificativa(1)}
                                            sx={{ minWidth: 200 }}
                                            disabled={
                                                (nivelAcesso === 4 && (material?.valor_total_cotacao ?? 0) >= 5000) ||
                                                (nivelAcesso === 5 && (material?.valor_total_cotacao ?? 0) >= 50000)
                                            }
                                        >
                                            Aprovar Cotação
                                        </Button>
                                        <Button
                                            variant="contained"
                                            color="error"
                                            size="large"
                                            startIcon={<FiX />}
                                            onClick={() => handleOpenJustificativa(0)}
                                            sx={{ minWidth: 200 }}
                                            disabled={
                                                (nivelAcesso === 4 && (material?.valor_total_cotacao ?? 0) >= 5000) ||
                                                (nivelAcesso === 5 && (material?.valor_total_cotacao ?? 0) >= 50000)
                                            }
                                        >
                                            Reprovar Cotação
                                        </Button>
                                    </Box>
                                )}
                                <Grid item xs={12} md={6} sx={{ minWidth: '47%' }}>
                                    <Card variant="outlined" >
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                Informações da Empresa
                                            </Typography>
                                            <Divider sx={{ mb: 2 }} />

                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="subtitle2" color="text.secondary">
                                                    Razão Social
                                                </Typography>
                                                <Typography variant="body1" fontWeight="medium">
                                                    {fornecedor.razao_social}
                                                </Typography>
                                            </Box>

                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="subtitle2" color="text.secondary">
                                                    Nome Fantasia
                                                </Typography>
                                                <Typography variant="body1" fontWeight="medium">
                                                    {fornecedor.nome_fantasia || 'Não informado'}
                                                </Typography>
                                            </Box>

                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="subtitle2" color="text.secondary">
                                                    CNPJ
                                                </Typography>
                                                <Typography variant="body1" fontWeight="medium">
                                                    {fornecedor.cnpj || 'Não informado'}
                                                </Typography>
                                            </Box>

                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="subtitle2" color="text.secondary">
                                                    Inscrição Estadual
                                                </Typography>
                                                <Typography variant="body1" fontWeight="medium">
                                                    {fornecedor.inscricao_estadual || 'Não informada'}
                                                </Typography>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                <Grid item xs={12} md={6} sx={{ minWidth: '47%' }}>
                                    <Card variant="outlined">
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                Contato
                                            </Typography>
                                            <Divider sx={{ mb: 2 }} />

                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="subtitle2" color="text.secondary">
                                                    Telefone
                                                </Typography>
                                                <Typography variant="body1" fontWeight="medium">
                                                    {fornecedor.telefone || 'Não informado'}
                                                </Typography>
                                            </Box>

                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="subtitle2" color="text.secondary">
                                                    E-mail
                                                </Typography>
                                                <Typography variant="body1" fontWeight="medium">
                                                    {fornecedor.email || 'Não informado'}
                                                </Typography>
                                            </Box>

                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="subtitle2" color="text.secondary">
                                                    Site
                                                </Typography>
                                                <Typography variant="body1" fontWeight="medium">
                                                    {fornecedor.site || 'Não informado'}
                                                </Typography>
                                            </Box>

                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="subtitle2" color="text.secondary">
                                                    Categoria
                                                </Typography>
                                                <Typography variant="body1" fontWeight="medium">
                                                    {fornecedor.categoria || 'Não informada'}
                                                </Typography>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                <Grid item xs={12} md={6} sx={{ minWidth: '47%' }}>
                                    <Card variant="outlined">
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                Endereço
                                            </Typography>
                                            <Divider sx={{ mb: 2 }} />

                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="subtitle2" color="text.secondary">
                                                    Endereço
                                                </Typography>
                                                <Typography variant="body1" fontWeight="medium">
                                                    {fornecedor.endereco || 'Não informado'}
                                                </Typography>
                                            </Box>

                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="subtitle2" color="text.secondary">
                                                    Cidade/Estado
                                                </Typography>
                                                <Typography variant="body1" fontWeight="medium">
                                                    {`${fornecedor.cidade || ''}${fornecedor.cidade && fornecedor.estado ? '/' : ''}${fornecedor.estado || ''}` || 'Não informado'}
                                                </Typography>
                                            </Box>

                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="subtitle2" color="text.secondary">
                                                    CEP
                                                </Typography>
                                                <Typography variant="body1" fontWeight="medium">
                                                    {fornecedor.cep || 'Não informado'}
                                                </Typography>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                <Grid item xs={12} md={6} sx={{ minWidth: '47%' }}>
                                    <Card variant="outlined">
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                Contato Principal
                                            </Typography>
                                            <Divider sx={{ mb: 2 }} />

                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="subtitle2" color="text.secondary">
                                                    Nome do Contato
                                                </Typography>
                                                <Typography variant="body1" fontWeight="medium">
                                                    {fornecedor.nome_contato || 'Não informado'}
                                                </Typography>
                                            </Box>

                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="subtitle2" color="text.secondary">
                                                    Telefone do Contato
                                                </Typography>
                                                <Typography variant="body1" fontWeight="medium">
                                                    {fornecedor.telefone_contato || 'Não informado'}
                                                </Typography>
                                            </Box>

                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="subtitle2" color="text.secondary">
                                                    E-mail do Contato
                                                </Typography>
                                                <Typography variant="body1" fontWeight="medium">
                                                    {fornecedor.email_contato || 'Não informado'}
                                                </Typography>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {fornecedor.observacoes && (
                                    <Grid item xs={12}>
                                        <Card variant="outlined" sx={{ minWidth: '100%' }}>
                                            <CardContent>
                                                <Typography variant="h6" gutterBottom>
                                                    Observações
                                                </Typography>
                                                <Divider sx={{ mb: 2 }} />
                                                <Typography variant="body1" color="text.secondary">
                                                    {fornecedor.observacoes}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                )}

                                <Grid item xs={12} sx={{ minWidth: '98%' }}>
                                    <Card variant="outlined" >
                                        <CardContent>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Box>
                                                    <Typography variant="h6" gutterBottom>
                                                        Status
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Data de Cadastro: {new Date(fornecedor.data_cadastro).toLocaleDateString('pt-BR')}
                                                    </Typography>
                                                </Box>
                                                <Chip
                                                    label={fornecedor.ativo ? "ATIVO" : "INATIVO"}
                                                    color={fornecedor.ativo ? "success" : "error"}
                                                    variant="outlined"
                                                />
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </Box>
                    ) : (
                        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                            <Typography color="text.secondary">
                                Fornecedor não encontrado
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Modal>

            <Modal
                open={justificativaModal.open}
                onClose={handleCloseJustificativa}
                title={justificativaModal.status === 1 ? "Aprovar Cotação" : "Reprovar Cotação"}
            >
                <Box sx={{ minWidth: 500, width: '100%' }}>
                    <Box sx={{ mt: 2 }}>
                        <TextField
                            label="Justificativa"
                            value={justificativa}
                            onChange={(e) => setJustificativa(e.target.value)}
                            multiline
                            rows={4}
                            fullWidth
                            placeholder={`Digite a justificativa para ${justificativaModal.status === 1 ? 'aprovação' : 'reprovação'} deste fornecedor...`}
                        />
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
                        <Button onClick={handleCloseJustificativa} variant="outlined">
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleAprovarFornecedor}
                            variant="contained"
                            color={justificativaModal.status === 1 ? "success" : "error"}
                            disabled={!justificativa.trim() || loadingAprovacao}
                            startIcon={justificativaModal.status === 1 ? <FiCheck /> : <FiX />}
                            sx={{ minWidth: 200 }}
                        >
                            {justificativaModal.status === 1 ? "Confirmar Aprovação" : "Confirmar Reprovação"}
                        </Button>
                    </Box>
                </Box>
            </Modal>

            <Backdrop
                open={loadingAprovacao}
                sx={{
                    color: '#fff',
                    zIndex: (theme) => theme.zIndex.drawer + 1
                }}
            >
                <CircularProgress color="inherit" />
            </Backdrop>
        </>
    );
};

// Componente da Ordem de Compra (igual ao mapa de cotação, mas só com o fornecedor aprovado)
const OrdemCompra = ({ materiais, cotacoes, fornecedorAprovado, cod_compra }) => {
    const [data, setData] = useState({
        filial: 3,
        detalhes: []
    });
    console.log(cotacoes)

    useEffect(() => {
        if (materiais && materiais.length > 0) {
            const fetchDetalhesEFilial = async () => {
                try {
                    const token = localStorage.getItem('token');
                    const headers = { Authorization: `Bearer ${token}` };

                    const detalhesRes = await axios.get(
                        `${import.meta.env.VITE_API_URL}/relatoriogeral/detalhescompra/${cod_compra}`,
                        { headers }
                    );
                    const detalhesData = detalhesRes.data;

                    const filialId = detalhesData[0]?.filial_id || materiais[0].filial_id;
                    const filialRes = await axios.get(`${import.meta.env.VITE_API_URL}/filiais/${filialId}`, { headers });
                    const filialData = filialRes.data;

                    setData({ filial: filialData, detalhes: detalhesData });
                } catch (err) {
                    console.error(err);
                }
            };

            fetchDetalhesEFilial();
        }
    }, [materiais]);

    if (!fornecedorAprovado) return null;

    return (
        <Paper className="preview-container ordem-compra-preview" elevation={3} sx={{ p: 3, mt: 3 }}>
            {/* Cabeçalho da Ordem de Compra */}
            <Box sx={{ textAlign: 'center', mb: 3, borderBottom: '2px solid #000', pb: 2 }}>
                <Typography variant="h5" align="center" gutterBottom sx={{
                    fontWeight: 'bold',
                    backgroundColor: '#f5f5f5',
                    p: 1,
                    border: '1px solid #000',
                    mb: 2
                }}>
                    ORDEM DE COMPRA - {fornecedorAprovado.nomeFornecedor?.toUpperCase()}
                </Typography>
            </Box>

            {/* Informações da empresa */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid>
                    <Typography variant="body2">
                        FFA INFRAESTRUTURA E SERVIÇO LTDA
                    </Typography>
                    <Typography variant="body2">
                        {data.filial?.endereco}, {data.filial?.numero}
                        {data.filial?.complemento ? `, ${data.filial.complemento}` : ''} - {data.filial?.bairro} - {data.filial?.cidade}/{data.filial?.estado} - CEP {data.filial?.cep}
                    </Typography>
                    <Typography variant="body2">
                        CNPJ: {data.filial?.CNPJ}
                        {data.filial?.insc_estadual ? ` I.E. ${data.filial.insc_estadual}` : ''}
                        {data.filial?.insc_municipal ? ` I.M. ${data.filial.insc_municipal}` : ''}
                    </Typography>
                    <Typography variant="body2">
                        TELEFONE: {data.filial?.telefone}
                        {data.filial?.telefone2 ? ` / ${data.filial.telefone2}` : ''}
                    </Typography>
                    <Typography variant="body2">
                        {data.filial?.mail}
                    </Typography>
                </Grid>
            </Grid>

            <TableContainer component={Paper} sx={{ border: '1px solid #000' }}>
                <Table size="small" sx={{ '& .MuiTableCell-root': { border: '1px solid #000', fontSize: '0.75rem' } }}>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: '#f0f0f0' }}>
                            <TableCell align="center" sx={{ fontWeight: 'bold', width: '50px' }}>ITEM</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', width: '80px' }}>CÓDIGO</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', minWidth: '250px' }}>DESCRIÇÃO</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', width: '50px' }}>UNID</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', width: '60px' }}>QTDE</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#f1f8e9' }} colSpan={2}>
                                {fornecedorAprovado.nomeFornecedor?.toUpperCase()}
                            </TableCell>
                        </TableRow>
                        <TableRow sx={{ backgroundColor: '#f8f8f8' }}>
                            <TableCell colSpan={5}></TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '0.7rem', backgroundColor: '#f1f8e9' }}>
                                PREÇO
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '0.7rem', backgroundColor: '#f1f8e9' }}>
                                TOTAL
                            </TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {materiais.map((mat, index) => {
                            const preco = parseFloat(cotacoes[mat.cod_material]?.[fornecedorAprovado.chaveOriginal]?.preco || 0);
                            const total = preco * (mat.quantidade || 0);

                            return (
                                <TableRow key={mat.cod_material}>
                                    <TableCell align="center">{index + 1}</TableCell>
                                    <TableCell align="center">{mat.cod_material}</TableCell>
                                    <TableCell sx={{ fontSize: '0.75rem' }}>
                                        {mat.descricao}
                                    </TableCell>
                                    <TableCell align="center">{mat.unid}</TableCell>
                                    <TableCell align="center">{mat.quantidade || 0}</TableCell>
                                    <TableCell align="right" sx={{ backgroundColor: '#f8fff8' }}>
                                        {formatCurrency(preco)}
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold', backgroundColor: '#f8fff8' }}>
                                        {formatCurrency(total)}
                                    </TableCell>
                                </TableRow>
                            );
                        })}

                        {/* Linha de totais */}
                        <TableRow sx={{ backgroundColor: '#f0f0f0' }}>
                            <TableCell colSpan={5} align="right" sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                                TOTAL GERAL
                            </TableCell>
                            <TableCell colSpan={2} align="right" sx={{ fontWeight: 'bold', fontSize: '0.85rem', backgroundColor: '#f1f8e9' }}>
                                {formatCurrency(fornecedorAprovado.valor_total || 0)}
                            </TableCell>
                        </TableRow>

                        {/* Condições de Pagamento */}
                        <TableRow sx={{ backgroundColor: '#f0f0f0' }}>
                            <TableCell colSpan={5} align="center" sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                                CONDIÇÕES DE PAGAMENTO
                            </TableCell>
                            <TableCell colSpan={2} align="center" sx={{ fontSize: '0.75rem', backgroundColor: '#f1f8e9' }}>
                                {fornecedorAprovado.data?.condPgto || '-'}
                                {fornecedorAprovado.data?.qtdParcela > 1 ? ` ${fornecedorAprovado.data?.qtdParcela}x` : ''}
                            </TableCell>
                        </TableRow>

                        {/* Tipo de Frete */}
                        <TableRow sx={{ backgroundColor: '#f0f0f0' }}>
                            <TableCell colSpan={5} align="center" sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                                TIPO DE FRETE
                            </TableCell>
                            <TableCell colSpan={2} align="center" sx={{ fontSize: '0.75rem', backgroundColor: '#f1f8e9' }}>
                                {fornecedorAprovado.data?.tipoFrete || '-'}
                            </TableCell>
                        </TableRow>

                        {/* Valor do Frete */}
                        <TableRow sx={{ backgroundColor: '#f0f0f0' }}>
                            <TableCell colSpan={5} align="center" sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                                VALOR DO FRETE
                            </TableCell>
                            <TableCell colSpan={2} align="center" sx={{ fontSize: '0.85rem', backgroundColor: '#f1f8e9' }}>
                                {fornecedorAprovado.data?.valorFrete ? formatCurrency(Number(fornecedorAprovado.data.valorFrete)) : '-'}
                            </TableCell>
                        </TableRow>

                        {/* Prazo de Entrega */}
                        <TableRow sx={{ backgroundColor: '#f0f0f0' }}>
                            <TableCell colSpan={5} align="center" sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                                PRAZO DE ENTREGA
                            </TableCell>
                            <TableCell colSpan={2} align="center" sx={{ fontSize: '0.75rem', backgroundColor: '#f1f8e9' }}>
                                {fornecedorAprovado.data?.condEntrega || fornecedorAprovado.prazo_entrega || '-'}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Observações */}
            {fornecedorAprovado.data?.obs && (
                <Box sx={{ mt: 3, p: 2, bgcolor: '#fff3e0', border: '1px solid #ffb74d', borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#e65100' }}>
                        OBSERVAÇÕES DO FORNECEDOR:
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                        {fornecedorAprovado.data.obs}
                    </Typography>
                </Box>
            )}
        </Paper>
    );
};

// Componente de Fornecedores Aprovados
const FornecedoresAprovados = ({ cotacoes, materiais, cod_compra }) => {
    const [fornecedoresAprovados, setFornecedoresAprovados] = useState([]);
    const [temFornecedorAprovado, setTemFornecedorAprovado] = useState(false);

    useEffect(() => {
        if (!cotacoes || !materiais || materiais.length === 0) return;

        const fornecedoresAprovadosList = [];
        const fornecedoresMap = new Map();

        materiais.forEach(mat => {
            const cotacaoMaterial = cotacoes[mat.cod_material];
            if (cotacaoMaterial) {
                Object.keys(cotacaoMaterial).forEach(key => {
                    if (key.startsWith('Fornecedor ') && cotacaoMaterial[key]) {
                        const fornecedorData = cotacaoMaterial[key];
                        const status = fornecedorData.status?.toLowerCase();

                        if (status === 'aprovado' && !fornecedoresMap.has(key)) {
                            fornecedoresMap.set(key, true);

                            const fornecedorInfo = {
                                chaveOriginal: key,
                                nomeFornecedor: fornecedorData.nome_forncedor || key,
                                fornecedorId: fornecedorData.nomeFornecedor,
                                cnpj: fornecedorData.cnpj,
                                valor_total: fornecedorData.valor_total,
                                prazo_entrega: fornecedorData.prazo_entrega,
                                data: fornecedorData
                            };

                            fornecedoresAprovadosList.push(fornecedorInfo);
                        }
                    }
                });
            }
        });

        setFornecedoresAprovados(fornecedoresAprovadosList);
        setTemFornecedorAprovado(fornecedoresAprovadosList.length > 0);

    }, [cotacoes, materiais]);

    if (!temFornecedorAprovado) return null;

    return (
        <>
            {/* Ordem de Compra para cada fornecedor aprovado */}
            {fornecedoresAprovados.map((fornecedor, index) => (
                <Box key={index} sx={{ mb: 4 }}>
                    <OrdemCompra
                        materiais={materiais}
                        cotacoes={cotacoes}
                        fornecedorAprovado={fornecedor}
                        cod_compra={cod_compra}
                    />
                </Box>
            ))}
        </>
    );
};

const MapaCotacao = ({ materiais, cotacoes, summary }) => {
    console.log(cotacoes)
    const location = useLocation();
    const { cod_compra } = location.state || {};

    const [openFornecedorModal, setOpenFornecedorModal] = useState(false);
    const [selectedFornecedorId, setSelectedFornecedorId] = useState(null);
    const [selectedFornecedorNome, setSelectedFornecedorNome] = useState("");
    const [selectedMaterial, setSelectedMaterial] = useState("");

    // CORREÇÃO: Extrai TODOS os fornecedores únicos pelo NOME REAL (nome_forncedor)
    const fornecedores = React.useMemo(() => {
        const fornecedoresMap = new Map();

        if (materiais && cotacoes) {
            materiais.forEach(mat => {
                const cotacaoMaterial = cotacoes[mat.cod_material];
                if (cotacaoMaterial) {
                    // Itera sobre todas as chaves (Fornecedor I, II, III, etc.)
                    Object.keys(cotacaoMaterial).forEach(key => {
                        if (key.startsWith('Fornecedor ') && cotacaoMaterial[key]) {
                            const fornecedorData = cotacaoMaterial[key];
                            const nomeReal = fornecedorData.nome_forncedor;
                            const fornecedorId = fornecedorData.nomeFornecedor;

                            // Usa o nome real como chave única
                            if (nomeReal && !fornecedoresMap.has(nomeReal)) {
                                fornecedoresMap.set(nomeReal, {
                                    nomeFornecedor: nomeReal,
                                    fornecedorId: fornecedorId,
                                });
                            }
                        }
                    });
                }
            });
        }

        // Ordenar fornecedores por nome para consistência
        return Array.from(fornecedoresMap.values()).sort((a, b) =>
            a.nomeFornecedor.localeCompare(b.nomeFornecedor)
        );
    }, [materiais, cotacoes]);

    // Função para encontrar o preço de um fornecedor em um material específico
    const getPrecoFornecedor = (materialCotacoes, nomeFornecedor) => {
        if (!materialCotacoes) return null;
        for (const key of Object.keys(materialCotacoes)) {
            if (key.startsWith('Fornecedor ') && materialCotacoes[key]?.nome_forncedor === nomeFornecedor) {
                return materialCotacoes[key];
            }
        }
        return null;
    };

    const [openItens, setOpenItens] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [itensAgrupados, setItensAgrupados] = useState([]);
    const [loadingItensAgrupados, setLoadingItensAgrupados] = useState(false);
    const [data, setData] = useState({
        filial: 3,
        detalhes: []
    });

    const [openParcelas, setOpenParcelas] = useState(false);
    const [parcelas, setParcelas] = useState([]);

    const handleOpenFornecedor = (fornecedorId, fornecedorNome, material) => {
        setSelectedFornecedorId(fornecedorId);
        setSelectedFornecedorNome(fornecedorNome);
        setSelectedMaterial({
            ...material,
            cod_compra: materiais[0]?.cod_compra,
            cod_cotacao: material?.cod_cotacao,
            valor_total_cotacao: cotacoes.valorTotal
        });
        setOpenFornecedorModal(true);
    };

    const handleCloseFornecedor = () => {
        setOpenFornecedorModal(false);
        setSelectedFornecedorId(null);
        setSelectedFornecedorNome("");
    };

    const handleOpenParcelas = (fornecedorData, fornNome) => {
        if (fornecedorData) {
            setParcelas(fornecedorData.datasParcelas || []);
            setSelectedFornecedorNome(fornNome);
            setOpenParcelas(true);
        }
    };

    const handleCloseParcelas = () => {
        setOpenParcelas(false);
        setParcelas([]);
        setSelectedFornecedorNome("");
    };

    const handleOpenItens = async (item) => {
        setSelectedItem(item);
        setOpenItens(true);
        setLoadingItensAgrupados(true);

        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/itens_agrupados`,
                {
                    params: { cod_material: item.cod_material },
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                }
            );

            setItensAgrupados(response.data.data || []);
        } catch (error) {
            console.error('Erro ao carregar itens agrupados:', error);
            setItensAgrupados([]);
        } finally {
            setLoadingItensAgrupados(false);
        }
    };

    const handleCloseItens = () => {
        setOpenItens(false);
        setSelectedItem(null);
        setItensAgrupados([]);
    };

    useEffect(() => {
        if (materiais && materiais.length > 0) {
            const fetchDetalhesEFilial = async () => {
                try {
                    const token = localStorage.getItem('token');
                    const headers = { Authorization: `Bearer ${token}` };

                    const detalhesRes = await axios.get(
                        `${import.meta.env.VITE_API_URL}/relatoriogeral/detalhescompra/${cod_compra}`,
                        { headers }
                    );
                    const detalhesData = detalhesRes.data;

                    const filialId = detalhesData[0]?.filial_id || materiais[0].filial_id;
                    const filialRes = await axios.get(`${import.meta.env.VITE_API_URL}/filiais/${filialId}`, { headers });
                    const filialData = filialRes.data;

                    setData({ filial: filialData, detalhes: detalhesData });
                } catch (err) {
                    console.error(err);
                }
            };

            fetchDetalhesEFilial();
        }
    }, [materiais]);

    // Recalcular supplierTotals baseado nos fornecedores reais
    const supplierTotals = React.useMemo(() => {
        const totals = {};
        fornecedores.forEach(forn => {
            totals[forn.nomeFornecedor] = 0;
        });

        materiais.forEach(mat => {
            const cotacaoMaterial = cotacoes[mat.cod_material];
            if (cotacaoMaterial) {
                fornecedores.forEach(forn => {
                    const fornData = getPrecoFornecedor(cotacaoMaterial, forn.nomeFornecedor);
                    const preco = parseFloat(fornData?.preco || 0);
                    totals[forn.nomeFornecedor] += preco * (mat.quantidade || 0);
                });
            }
        });

        return totals;
    }, [materiais, cotacoes, fornecedores]);

    // Cores dinâmicas baseadas na quantidade de fornecedores
    const coresFundo = ["#e8f4fd", "#fff2e8", "#f0f8e8", "#f8e8fd", "#e8fdf8", "#fde8e8", "#e8fde8", "#fde8fd", "#e8e8fd", "#fde8fd"];
    const coresLinhas = ["#f8fcff", "#fffaf8", "#f8fff8", "#fcf8ff", "#f8fffc", "#fff8f8", "#f8fff8", "#fff8fc", "#f8f8ff", "#fff8fc"];

    return (
        <>
            {/* MAPA DE COTAÇÃO - PRIMEIRO */}
            <Paper className="preview-container" elevation={3} sx={{ p: 3 }}>
                <Box sx={{ textAlign: 'center', mb: 3, borderBottom: '2px solid #000', pb: 2 }}>
                    <Typography variant="h5" align="center" gutterBottom sx={{
                        fontWeight: 'bold',
                        backgroundColor: '#f5f5f5',
                        p: 1,
                        border: '1px solid #000',
                        mb: 2
                    }}>
                        MAPA DE COTAÇÃO
                    </Typography>
                </Box>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid>
                        <Typography variant="body2">
                            FFA INFRAESTRUTURA E SERVIÇO LTDA
                        </Typography>
                        <Typography variant="body2">
                            {data.filial?.endereco}, {data.filial?.numero}
                            {data.filial?.complemento ? `, ${data.filial.complemento}` : ''} - {data.filial?.bairro} - {data.filial?.cidade}/{data.filial?.estado} - CEP {data.filial?.cep}
                        </Typography>
                        <Typography variant="body2">
                            CNPJ: {data.filial?.CNPJ}
                            {data.filial?.insc_estadual ? ` I.E. ${data.filial.insc_estadual}` : ''}
                            {data.filial?.insc_municipal ? ` I.M. ${data.filial.insc_municipal}` : ''}
                        </Typography>
                        <Typography variant="body2">
                            TELEFONE: {data.filial?.telefone}
                            {data.filial?.telefone2 ? ` / ${data.filial.telefone2}` : ''}
                        </Typography>
                        <Typography variant="body2">
                            {data.filial?.mail}
                        </Typography>
                    </Grid>
                </Grid>

                <TableContainer component={Paper} sx={{ border: '1px solid #000', overflowX: 'auto' }}>
                    <Table size="small" sx={{
                        '& .MuiTableCell-root': { border: '1px solid #000', fontSize: '0.75rem' },
                        minWidth: 800 + (fornecedores.length * 100)
                    }}>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: '#f0f0f0' }}>
                                <TableCell align="center" sx={{ fontWeight: 'bold', width: '50px' }}>ITEM</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 'bold', width: '80px' }}>CÓDIGO</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 'bold', minWidth: '250px' }}>DESCRIÇÃO</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 'bold', width: '50px' }}>UNID</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 'bold', width: '60px' }}>QTDE</TableCell>
                                {fornecedores.map((forn, index) => {
                                    const corFundo = coresFundo[index % coresFundo.length];

                                    return (
                                        <TableCell
                                            key={forn.nomeFornecedor}
                                            colSpan={2}
                                            align="center"
                                            sx={{
                                                fontWeight: 'bold',
                                                backgroundColor: corFundo,
                                                cursor: 'pointer',
                                                '&:hover': {
                                                    backgroundColor: '#e0e0e0',
                                                    textDecoration: 'underline'
                                                }
                                            }}
                                            // onClick={() => handleOpenFornecedor(forn.fornecedorId, forn.nomeFornecedor, {
                                            //     ...materiais[0],
                                            //     cod_compra: cod_compra,
                                            //     cod_cotacao: materiais[0]?.cod_cotacao
                                            // })}
                                        >
                                            {forn.nomeFornecedor.toUpperCase()}
                                        </TableCell>
                                    );
                                })}
                                <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#ffe8e8' }}>
                                    ÚLTIMA COMPRA
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#ffe8e8' }}>
                                    MÉDIA HISTORICO
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#ffe8e8' }}>
                                    MÉDIA ULT. 6 MESES
                                </TableCell>
                            </TableRow>
                            <TableRow sx={{ backgroundColor: '#f8f8f8' }}>
                                <TableCell colSpan={5}></TableCell>
                                {fornecedores.map((forn, index) => {
                                    const corFundo = coresFundo[index % coresFundo.length];

                                    return (
                                        <React.Fragment key={forn.nomeFornecedor}>
                                            <TableCell
                                                align="center"
                                                sx={{
                                                    fontWeight: 'bold',
                                                    fontSize: '0.7rem',
                                                    backgroundColor: corFundo
                                                }}
                                            >
                                                PREÇO
                                            </TableCell>
                                            <TableCell
                                                align="center"
                                                sx={{
                                                    fontWeight: 'bold',
                                                    fontSize: '0.7rem',
                                                    backgroundColor: corFundo
                                                }}
                                            >
                                                TOTAL
                                            </TableCell>
                                        </React.Fragment>
                                    );
                                })}
                                <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '0.7rem', backgroundColor: '#ffe8e8' }}>
                                    PREÇO
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '0.7rem', backgroundColor: '#ffe8e8' }}>
                                    PREÇO
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '0.7rem', backgroundColor: '#ffe8e8' }}>
                                    PREÇO
                                </TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {materiais.map((mat, index) => {
                                const cotacaoMaterial = cotacoes[mat.cod_material] || {};

                                return (
                                    <TableRow key={mat.cod_material}>
                                        <TableCell align="center">{index + 1}</TableCell>
                                        <TableCell align="center">{mat.cod_material}</TableCell>
                                        <TableCell
                                            sx={{
                                                fontSize: '0.75rem',
                                                cursor: 'pointer',
                                                '&:hover': {
                                                    backgroundColor: '#f5f5f5',
                                                    textDecoration: 'underline'
                                                }
                                            }}
                                            onClick={() => handleOpenItens(mat)}
                                        >
                                            {mat.descricao}
                                        </TableCell>
                                        <TableCell align="center">{mat.unid}</TableCell>
                                        <TableCell align="center">{mat.quantidade || 0}</TableCell>

                                        {fornecedores.map((forn, fornIndex) => {
                                            const fornData = getPrecoFornecedor(cotacaoMaterial, forn.nomeFornecedor);
                                            const preco = parseFloat(fornData?.preco || 0);
                                            const total = preco * (mat.quantidade || 0);
                                            const corFundo = coresLinhas[fornIndex % coresLinhas.length];
                                            const temCotacao = fornData !== null;

                                            // Verifica se este fornecedor está aprovado neste material
                                            const isAprovado = fornData?.status?.toLowerCase() === "aprovado";

                                            return (
                                                <React.Fragment key={forn.nomeFornecedor}>
                                                    <TableCell
                                                        align="right"
                                                        sx={{
                                                            backgroundColor: isAprovado ? "#d4edda" : corFundo,
                                                            fontWeight: isAprovado ? "bold" : "normal"
                                                        }}
                                                    >
                                                        {temCotacao ? formatCurrency(preco) : "-"}
                                                        {isAprovado && (
                                                            <Chip label="✓" size="small" color="success" sx={{ ml: 0.5, height: 14, fontSize: 8, minWidth: 18 }} />
                                                        )}
                                                    </TableCell>
                                                    <TableCell
                                                        align="right"
                                                        sx={{
                                                            fontWeight: "bold",
                                                            backgroundColor: isAprovado ? "#d4edda" : corFundo
                                                        }}
                                                    >
                                                        {temCotacao ? formatCurrency(total) : "-"}
                                                    </TableCell>
                                                </React.Fragment>
                                            );
                                        })}

                                        <TableCell align="right" sx={{ backgroundColor: '#fff8f8' }}>
                                            {cotacaoMaterial.ultima_compra
                                                ? formatCurrency(cotacaoMaterial.ultima_compra)
                                                : 'R$ -'}
                                        </TableCell>
                                        <TableCell align="right" sx={{ backgroundColor: '#fff8f8' }}>
                                            {cotacaoMaterial.media_historica
                                                ? formatCurrency(cotacaoMaterial.media_historica)
                                                : 'R$ -'}
                                        </TableCell>
                                        <TableCell align="right" sx={{ backgroundColor: '#fff8f8' }}>
                                            {cotacaoMaterial.media_6_meses
                                                ? formatCurrency(cotacaoMaterial.media_6_meses)
                                                : 'R$ -'}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}

                            <TableRow sx={{ backgroundColor: '#f0f0f0' }}>
                                <TableCell colSpan={5} align="right" sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                                    TOTAL
                                </TableCell>
                                {fornecedores.map((forn, index) => {
                                    const corFundo = coresFundo[index % coresFundo.length];
                                    const total = supplierTotals[forn.nomeFornecedor] || 0;

                                    return (
                                        <TableCell
                                            key={forn.nomeFornecedor}
                                            colSpan={2}
                                            align="right"
                                            sx={{
                                                fontWeight: 'bold',
                                                fontSize: '0.85rem',
                                                backgroundColor: corFundo
                                            }}
                                        >
                                            {formatCurrency(total)}
                                        </TableCell>
                                    );
                                })}
                                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.85rem', backgroundColor: '#ffe8e8' }}>
                                    R$ -
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.85rem', backgroundColor: '#ffe8e8' }}>
                                    R$ -
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.85rem', backgroundColor: '#ffe8e8' }}>
                                    R$ -
                                </TableCell>
                            </TableRow>

                            <TableRow sx={{ backgroundColor: '#f0f0f0' }}>
                                <TableCell colSpan={5} align="center" sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                                    CONDIÇÕES DE PAGAMENTO
                                </TableCell>
                                {fornecedores.map((forn, index) => {
                                    // Procura o primeiro material que tem este fornecedor
                                    let fornecedorData = null;
                                    for (const mat of materiais) {
                                        const data = getPrecoFornecedor(cotacoes[mat.cod_material], forn.nomeFornecedor);
                                        if (data) {
                                            fornecedorData = data;
                                            break;
                                        }
                                    }

                                    let condicoesPagamento = "-";
                                    if (fornecedorData) {
                                        if (fornecedorData.condPgto?.toUpperCase() === "A VISTA") {
                                            condicoesPagamento = "A VISTA";
                                        } else if (fornecedorData.qtdParcela > 1) {
                                            condicoesPagamento = `${fornecedorData.condPgto} ${fornecedorData.qtdParcela}x`;
                                        } else {
                                            condicoesPagamento = fornecedorData.condPgto ?? "-";
                                        }
                                    }

                                    const isAvista = fornecedorData?.condPgto?.toUpperCase() === "A VISTA";
                                    const corFundo = coresFundo[index % coresFundo.length];

                                    return (
                                        <TableCell
                                            key={forn.nomeFornecedor}
                                            colSpan={2}
                                            align="center"
                                            sx={{
                                                fontSize: '0.75rem',
                                                backgroundColor: corFundo,
                                                cursor: isAvista ? 'default' : 'pointer',
                                                '&:hover': isAvista
                                                    ? {}
                                                    : {
                                                        backgroundColor: '#f5f5f5',
                                                        textDecoration: 'underline'
                                                    }
                                            }}
                                            onClick={() => {
                                                if (!isAvista) handleOpenParcelas(fornecedorData, forn.nomeFornecedor);
                                            }}
                                        >
                                            {condicoesPagamento}
                                        </TableCell>
                                    );
                                })}
                                <TableCell align="center" sx={{ fontSize: '0.75rem', backgroundColor: '#ffe8e8' }}>
                                    -
                                </TableCell>
                                <TableCell align="center" sx={{ fontSize: '0.75rem', backgroundColor: '#ffe8e8' }}>
                                    -
                                </TableCell>
                                <TableCell align="center" sx={{ fontSize: '0.75rem', backgroundColor: '#ffe8e8' }}>
                                    -
                                </TableCell>
                            </TableRow>

                            <TableRow sx={{ backgroundColor: '#f0f0f0' }}>
                                <TableCell colSpan={5} align="center" sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                                    TIPO DE FRETE
                                </TableCell>
                                {fornecedores.map((forn, index) => {
                                    let fornecedorData = null;
                                    for (const mat of materiais) {
                                        const data = getPrecoFornecedor(cotacoes[mat.cod_material], forn.nomeFornecedor);
                                        if (data) {
                                            fornecedorData = data;
                                            break;
                                        }
                                    }
                                    const tipoFrete = fornecedorData?.tipoFrete || '-';
                                    const corFundo = coresFundo[index % coresFundo.length];

                                    return (
                                        <TableCell
                                            key={forn.nomeFornecedor}
                                            colSpan={2}
                                            align="center"
                                            sx={{
                                                fontSize: '0.75rem',
                                                backgroundColor: corFundo
                                            }}
                                        >
                                            {tipoFrete}
                                        </TableCell>
                                    );
                                })}
                                <TableCell align="center" sx={{ fontSize: '0.75rem', backgroundColor: '#ffe8e8' }}>
                                    -
                                </TableCell>
                                <TableCell align="center" sx={{ fontSize: '0.75rem', backgroundColor: '#ffe8e8' }}>
                                    -
                                </TableCell>
                                <TableCell align="center" sx={{ fontSize: '0.75rem', backgroundColor: '#ffe8e8' }}>
                                    -
                                </TableCell>
                            </TableRow>

                            <TableRow sx={{ backgroundColor: '#f0f0f0' }}>
                                <TableCell colSpan={5} align="center" sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                                    VALOR DO FRETE
                                </TableCell>
                                {fornecedores.map((forn, index) => {
                                    let fornecedorData = null;
                                    for (const mat of materiais) {
                                        const data = getPrecoFornecedor(cotacoes[mat.cod_material], forn.nomeFornecedor);
                                        if (data) {
                                            fornecedorData = data;
                                            break;
                                        }
                                    }
                                    const valorFrete = fornecedorData?.valorFrete ?? 'Não Informado';
                                    const parsedFrete = Number(valorFrete);
                                    const valorExibido = !isNaN(parsedFrete)
                                        ? formatCurrency(parsedFrete)
                                        : valorFrete;
                                    const corFundo = coresFundo[index % coresFundo.length];

                                    return (
                                        <TableCell
                                            key={forn.nomeFornecedor}
                                            colSpan={2}
                                            align="center"
                                            sx={{
                                                fontSize: '0.85rem',
                                                backgroundColor: corFundo
                                            }}
                                        >
                                            {fornecedorData ? valorExibido : "-"}
                                        </TableCell>
                                    );
                                })}
                                <TableCell align="center" sx={{ fontSize: '0.85rem', backgroundColor: '#ffe8e8' }}>
                                    R$ -
                                </TableCell>
                                <TableCell align="center" sx={{ fontSize: '0.85rem', backgroundColor: '#ffe8e8' }}>
                                    R$ -
                                </TableCell>
                                <TableCell align="center" sx={{ fontSize: '0.85rem', backgroundColor: '#ffe8e8' }}>
                                    R$ -
                                </TableCell>
                            </TableRow>

                            <TableRow sx={{ backgroundColor: '#f0f0f0' }}>
                                <TableCell colSpan={5} align="center" sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                                    PRAZO
                                </TableCell>
                                {fornecedores.map((forn, index) => {
                                    let fornecedorData = null;
                                    for (const mat of materiais) {
                                        const data = getPrecoFornecedor(cotacoes[mat.cod_material], forn.nomeFornecedor);
                                        if (data) {
                                            fornecedorData = data;
                                            break;
                                        }
                                    }
                                    const condicoesEntrega = fornecedorData?.condEntrega || '-';
                                    const corFundo = coresFundo[index % coresFundo.length];

                                    return (
                                        <TableCell
                                            key={forn.nomeFornecedor}
                                            colSpan={2}
                                            align="center"
                                            sx={{
                                                fontSize: '0.75rem',
                                                backgroundColor: corFundo
                                            }}
                                        >
                                            {condicoesEntrega}
                                        </TableCell>
                                    );
                                })}
                                <TableCell align="center" sx={{ fontSize: '0.75rem', backgroundColor: '#ffe8e8' }}>
                                    -
                                </TableCell>
                                <TableCell align="center" sx={{ fontSize: '0.75rem', backgroundColor: '#ffe8e8' }}>
                                    -
                                </TableCell>
                                <TableCell align="center" sx={{ fontSize: '0.75rem', backgroundColor: '#ffe8e8' }}>
                                    -
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* FORNECEDORES APROVADOS - DEPOIS DO MAPA DE COTAÇÃO */}
            <FornecedoresAprovados
                cotacoes={cotacoes}
                materiais={materiais}
                cod_compra={cod_compra}
            />

            {/* MODAIS - SEMPRE POR ÚLTIMO */}
            <FornecedorDetailsModal
                open={openFornecedorModal}
                onClose={handleCloseFornecedor}
                fornecedorId={selectedFornecedorId}
                fornecedorNome={selectedFornecedorNome}
                cod_compra={cod_compra}
                material={selectedMaterial}
                onAprovacao={() => { }}
            />

            <Modal open={openItens} onClose={handleCloseItens}>
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    p: 4,
                    maxWidth: 600,
                    width: '90%',
                    bgcolor: "background.paper",
                    borderRadius: 3,
                    boxShadow: 24,
                    maxHeight: '80vh',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {selectedItem && (
                        <>
                            <Box>
                                <Typography variant="h6" mb={2} textAlign="center" sx={{ fontWeight: 'bold' }}>
                                    Itens Agrupados - {selectedItem.cod_material}
                                </Typography>
                                <Typography variant="subtitle1" mb={2} textAlign="center" color="primary">
                                    <strong>Total de Itens:</strong> {itensAgrupados.length > 0 ? itensAgrupados[0].total_quantidade : 0}
                                </Typography>
                                <Typography variant="body2" mb={2} textAlign="center" color="text.secondary">
                                    <strong>Descrição:</strong> {selectedItem.descricao}
                                </Typography>
                            </Box>

                            <Box sx={{ overflowY: 'auto', flexGrow: 1, my: 2 }}>
                                {loadingItensAgrupados ? (
                                    <Box display="flex" justifyContent="center" my={4}>
                                        <CircularProgress size={40} />
                                        <Typography ml={2} variant="body1">Carregando itens...</Typography>
                                    </Box>
                                ) : itensAgrupados.length === 0 ? (
                                    <Box textAlign="center" py={4}>
                                        <Typography variant="body1" color="text.secondary">
                                            Nenhum item agrupado encontrado.
                                        </Typography>
                                    </Box>
                                ) : (
                                    <>
                                        {itensAgrupados.map((item, idx) => (
                                            <Paper key={idx} sx={{
                                                p: 2,
                                                mb: 2,
                                                borderRadius: 2,
                                                bgcolor: 'grey.50',
                                                border: '1px solid #e0e0e0'
                                            }}>
                                                <Grid container spacing={2}>
                                                    <Grid item xs={6}>
                                                        <Typography variant="body2">
                                                            <strong>Cod. Cotação:</strong> {item.cod_cotacao}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item xs={6}>
                                                        <Typography variant="body2">
                                                            <strong>Quantidade:</strong> {item.quantidade}
                                                        </Typography>
                                                    </Grid>
                                                </Grid>
                                            </Paper>
                                        ))}
                                    </>
                                )}
                            </Box>

                            <Box display="flex" justifyContent="center" mt={2}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleCloseItens}
                                    sx={{ minWidth: 120 }}
                                >
                                    Fechar
                                </Button>
                            </Box>
                        </>
                    )}
                </Box>
            </Modal>

            <Dialog open={openParcelas} onClose={handleCloseParcelas} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: "bold", bgcolor: "#f5f7fa" }}>
                    Condições de Pagamento -{" "}
                    <span style={{ color: "#1976d2" }}>{selectedFornecedorNome}</span>
                </DialogTitle>

                <DialogContent dividers>
                    {parcelas.length > 0 ? (
                        <>
                            <Typography
                                variant="subtitle1"
                                gutterBottom
                                sx={{ fontWeight: "bold", mb: 2 }}
                            >
                                Quantidade de parcelas:{" "}
                                <strong style={{ color: "#1976d2" }}>{parcelas.length}</strong>
                            </Typography>

                            <List>
                                {parcelas.map((dias, index) => (
                                    <React.Fragment key={index}>
                                        <ListItem
                                            sx={{
                                                borderRadius: 2,
                                                mb: 1,
                                                bgcolor: index % 2 === 0 ? "#f9f9f9" : "#eef6fc",
                                            }}
                                        >
                                            <ListItemText
                                                primary={`Parcela ${index + 1}`}
                                                secondary={`${dias} dias após a compra`}
                                                primaryTypographyProps={{ fontWeight: "bold" }}
                                            />
                                        </ListItem>
                                        {index < parcelas.length - 1 && <Divider />}
                                    </React.Fragment>
                                ))}
                            </List>
                        </>
                    ) : (
                        <Typography variant="body2" color="text.secondary" align="center">
                            Não foram informados os detalhes desse parcelamento
                        </Typography>
                    )}
                </DialogContent>

                <DialogActions sx={{ p: 2, bgcolor: "#f5f7fa" }}>
                    <Button
                        onClick={handleCloseParcelas}
                        variant="contained"
                        color="primary"
                        sx={{ textTransform: "none", borderRadius: 2 }}
                    >
                        Fechar
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
const MelhoresFornecedores = ({ materiais, cotacoes, summary, cod_compra }) => {
    const [activeTab, setActiveTab] = useState('geral');
    const [selecoes, setSelecoes] = useState({}); // { cod_material: { criterio: 'preco'|'frete'|'prazo', fornecedor: {...} } }
    const [justificativaModal, setJustificativaModal] = useState({ open: false, tipo: null }); // 'aprovar' ou 'reprovar'
    const [justificativa, setJustificativa] = useState("");
    const [loadingAprovacao, setLoadingAprovacao] = useState(false);

    const nivelAcesso = Number(localStorage.getItem("nivel_acesso"));
    const isAprovacao = [4, 5, 6].includes(nivelAcesso);

    const formatCurrencyLocal = (v) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

    const parseDias = (str) => {
        if (!str) return 999;
        const m = String(str).match(/\d+/);
        return m ? parseInt(m[0]) : 999;
    };

    // Calcula, para cada material, qual fornecedor tem melhor preço, frete e prazo
    const analiseItens = React.useMemo(() => {
        if (!materiais || !cotacoes) return [];

        return materiais.map(mat => {
            const cot = cotacoes[mat.cod_material] || {};
            const opcoes = [];

            Object.keys(cot).forEach(key => {
                if (!key.startsWith('Fornecedor ')) return;
                const d = cot[key];
                if (!d || !d.nome_forncedor) return;
                opcoes.push({
                    chaveOriginal: key,
                    nome: d.nome_forncedor,
                    fornecedorId: d.nomeFornecedor,
                    cod_cotacao: d.cod_cotacao,
                    preco: parseFloat(d.preco) || 0,
                    frete: parseFloat(d.valorFrete) || 0,
                    prazo: parseDias(d.condEntrega),
                    condEntrega: d.condEntrega || '-',
                    condPgto: d.condPgto || '-',
                    subtotal: (parseFloat(d.preco) || 0) * (mat.quantidade || 0),
                    status: d.status,
                });
            });

            if (!opcoes.length) return { ...mat, opcoes: [], bestPreco: null, bestFrete: null, bestPrazo: null };

            const minPreco = Math.min(...opcoes.map(x => x.preco));
            const minFrete = Math.min(...opcoes.map(x => x.frete));
            const minPrazo = Math.min(...opcoes.map(x => x.prazo));

            return {
                ...mat,
                opcoes,
                bestPreco: opcoes.find(x => x.preco === minPreco),
                bestFrete: opcoes.find(x => x.frete === minFrete),
                bestPrazo: opcoes.find(x => x.prazo === minPrazo),
            };
        });
    }, [materiais, cotacoes]);

    // Inicializa seleções com melhor preço como padrão
    useEffect(() => {
        if (!analiseItens.length) return;
        const inicial = {};
        analiseItens.forEach(item => {
            if (item.bestPreco) {
                inicial[item.cod_material] = { criterio: 'preco', fornecedor: item.bestPreco };
            }
        });
        setSelecoes(prev => {
            // Só inicializa itens que ainda não têm seleção
            const merged = { ...inicial };
            Object.keys(prev).forEach(k => { if (prev[k]) merged[k] = prev[k]; });
            return merged;
        });
    }, [analiseItens]);

    const totalSelecionado = Object.values(selecoes).reduce((s, sel) => s + (sel.fornecedor?.subtotal || 0), 0);

    // Agrupa as seleções por fornecedor para exibir resumo
    const resumoPorFornecedor = React.useMemo(() => {
        const mapa = {};
        Object.entries(selecoes).forEach(([codMaterial, sel]) => {
            const nome = sel.fornecedor?.nome;
            if (!nome) return;
            if (!mapa[nome]) mapa[nome] = { nome, fornecedorId: sel.fornecedor.fornecedorId, cod_cotacao: sel.fornecedor.cod_cotacao, itens: [], frete: sel.fornecedor.frete };
            const mat = materiais.find(m => m.cod_material === codMaterial);
            mapa[nome].itens.push({ ...mat, ...sel.fornecedor });
        });
        return Object.values(mapa);
    }, [selecoes, materiais]);

    const handleAprovar = async () => {
        if (!justificativa.trim()) {
            alert("Informe uma justificativa para continuar.");
            return;
        }

        try {
            setLoadingAprovacao(true);
            const token = localStorage.getItem('token');
            const matricula = localStorage.getItem('matricula');

            // Envia uma aprovação por fornecedor, com os códigos de material de cada item selecionado
            for (const grupo of resumoPorFornecedor) {
                const codMateriais = grupo.itens.map(it => it.cod_material);

                const payload = {
                    cod_compra,
                    cod_cotacao: grupo.cod_cotacao,
                    aceite_diretor: 1,
                    justificativa_diretor: justificativa,
                    matricula_diretor: matricula,
                    fornecedorId: grupo.fornecedorId,
                    cod_materiais: codMateriais,        
                };

                await axios.put(`${import.meta.env.VITE_API_URL}/aprovarcompra`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            alert("Cotação aprovada com sucesso!");
            setJustificativaModal({ open: false, tipo: null });
            window.location.href = '../';
        } catch (error) {
            console.error("Erro ao aprovar:", error);
            alert(error.response?.data?.error || "Erro ao processar aprovação!");
        } finally {
            setLoadingAprovacao(false);
        }
    };

    const handleReprovar = async () => {
        if (!justificativa.trim()) {
            alert("Informe uma justificativa para continuar.");
            return;
        }

        try {
            setLoadingAprovacao(true);
            const token = localStorage.getItem('token');
            const matricula = localStorage.getItem('matricula');

            // Envia uma reprovação por fornecedor, com os códigos de material de cada item selecionado
            for (const grupo of resumoPorFornecedor) {
                const codMateriais = grupo.itens.map(it => it.cod_material);

                const payload = {
                    cod_compra,
                    cod_cotacao: grupo.cod_cotacao,
                    aceite_diretor: 0,  // REPROVADO
                    justificativa_diretor: justificativa,
                    matricula_diretor: matricula,
                    fornecedorId: grupo.fornecedorId,
                    cod_materiais: codMateriais,        
                };

                await axios.put(`${import.meta.env.VITE_API_URL}/aprovarcompra`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            alert("Cotação reprovada com sucesso!");
            setJustificativaModal({ open: false, tipo: null });
            window.location.href = '../';
        } catch (error) {
            console.error("Erro ao reprovar:", error);
            alert(error.response?.data?.error || "Erro ao processar reprovação!");
        } finally {
            setLoadingAprovacao(false);
        }
    };

    const TABS = [
        { id: 'selecao', label: 'Selecionar melhores itens' },
    ];

    // Aba principal — tabela de seleção item a item
    const renderSelecaoTab = () => {
        const selecionarTodos = (criterio) => {
            const novas = {};
            analiseItens.forEach(item => {
                const forn = criterio === 'preco' ? item.bestPreco
                    : criterio === 'frete' ? item.bestFrete
                        : item.bestPrazo;
                if (forn) novas[item.cod_material] = { criterio, fornecedor: forn };
            });
            setSelecoes(prev => ({ ...prev, ...novas }));
        };

        return (
            <Box>

                <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                <TableCell sx={{ fontWeight: 500, fontSize: '0.75rem' }}>#</TableCell>
                                <TableCell sx={{ fontWeight: 500, fontSize: '0.75rem' }}>Código</TableCell>
                                <TableCell sx={{ fontWeight: 500, fontSize: '0.75rem', minWidth: 180 }}>Descrição</TableCell>
                                <TableCell sx={{ fontWeight: 500, fontSize: '0.75rem' }} align="center">Qtde</TableCell>

                                {/* Header clicável — Melhor Preço */}
                                <TableCell
                                    align="center"
                                    onClick={() => selecionarTodos('preco')}
                                    sx={{
                                        fontWeight: 500,
                                        fontSize: '0.75rem',
                                        minWidth: 140,
                                        cursor: 'pointer',
                                        userSelect: 'none',
                                        backgroundColor: '#EAF3DE',
                                        '&:hover': { backgroundColor: '#d4ead9' },
                                        transition: 'background .15s',
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                        Melhor preço
                                    </Box>
                                </TableCell>

                                {/* Header clicável — Melhor Prazo */}
                                <TableCell
                                    align="center"
                                    onClick={() => selecionarTodos('prazo')}
                                    sx={{
                                        fontWeight: 500,
                                        fontSize: '0.75rem',
                                        minWidth: 140,
                                        cursor: 'pointer',
                                        userSelect: 'none',
                                        backgroundColor: '#FAEEDA',
                                        '&:hover': { backgroundColor: '#f5e0c0' },
                                        transition: 'background .15s',
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                        Melhor prazo
                                    </Box>
                                </TableCell>

                                <TableCell sx={{ fontWeight: 500, fontSize: '0.75rem' }} align="center">Selecionado</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {analiseItens.map((item, idx) => {
                                const sel = selecoes[item.cod_material];
                                return (
                                    <TableRow key={item.cod_material} hover>
                                        <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{idx + 1}</TableCell>
                                        <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{item.cod_material}</TableCell>
                                        <TableCell sx={{ fontSize: '0.75rem' }}>{item.descricao}</TableCell>
                                        <TableCell align="center" sx={{ fontSize: '0.75rem' }}>{item.quantidade} {item.unid}</TableCell>

                                        {/* Célula — Melhor preço */}
                                        <TableCell
                                            align="center"
                                            onClick={() => item.bestPreco && setSelecoes(prev => ({
                                                ...prev,
                                                [item.cod_material]: { criterio: 'preco', fornecedor: item.bestPreco }
                                            }))}
                                            sx={{
                                                cursor: item.bestPreco ? 'pointer' : 'default',
                                                backgroundColor: sel?.criterio === 'preco' ? '#EAF3DE' : undefined,
                                                outline: sel?.criterio === 'preco' ? '2px solid #3B6D11' : undefined,
                                                outlineOffset: '-2px',
                                                transition: 'background .15s',
                                                '&:hover': item.bestPreco ? { backgroundColor: '#d4ead9' } : {}
                                            }}
                                        >
                                            {item.bestPreco ? (
                                                <Box>
                                                    <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                                        {item.bestPreco.nome}
                                                    </Typography>
                                                    <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.8rem' }}>
                                                        {formatCurrencyLocal(item.bestPreco.preco)}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                                                        sub: {formatCurrencyLocal(item.bestPreco.subtotal)}
                                                    </Typography>
                                                </Box>
                                            ) : '—'}
                                        </TableCell>

                                        {/* Célula — Melhor prazo */}
                                        <TableCell
                                            align="center"
                                            onClick={() => item.bestPrazo && setSelecoes(prev => ({
                                                ...prev,
                                                [item.cod_material]: { criterio: 'prazo', fornecedor: item.bestPrazo }
                                            }))}
                                            sx={{
                                                cursor: item.bestPrazo ? 'pointer' : 'default',
                                                backgroundColor: sel?.criterio === 'prazo' ? '#FAEEDA' : undefined,
                                                outline: sel?.criterio === 'prazo' ? '2px solid #BA7517' : undefined,
                                                outlineOffset: '-2px',
                                                transition: 'background .15s',
                                                '&:hover': item.bestPrazo ? { backgroundColor: '#f5e0c0' } : {}
                                            }}
                                        >
                                            {item.bestPrazo ? (
                                                <Box>
                                                    <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                                        {item.bestPrazo.nome}
                                                    </Typography>
                                                    <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.8rem' }}>
                                                        {item.bestPrazo.condEntrega == '-' ? 1 : item.bestPrazo.condEntrega} Dia(s)
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                                                        item: {formatCurrencyLocal(item.bestPrazo.preco)}
                                                    </Typography>
                                                </Box>
                                            ) : '—'}
                                        </TableCell>

                                        {/* Badge do selecionado */}
                                        <TableCell align="center">
                                            {sel ? (
                                                <Chip
                                                    label={sel.fornecedor.nome}
                                                    size="small"
                                                    sx={{
                                                        fontSize: 11,
                                                        bgcolor: sel.criterio === 'preco' ? '#EAF3DE' : sel.criterio === 'frete' ? '#E6F1FB' : '#FAEEDA',
                                                        color: sel.criterio === 'preco' ? '#27500A' : sel.criterio === 'frete' ? '#0C447C' : '#633806',
                                                    }}
                                                />
                                            ) : '—'}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}

                            {/* Linha de total */}
                            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                <TableCell colSpan={4} align="right" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                                    Total selecionado (itens)
                                </TableCell>
                                <TableCell colSpan={4} align="right" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                                    {formatCurrencyLocal(totalSelecionado)}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Botão de aprovação/reprovação */}
                {isAprovacao && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button
                            variant="contained"
                            color="success"
                            size="large"
                            startIcon={<FiCheck />}
                            disabled={
                                Object.keys(selecoes).length === 0 ||
                                (nivelAcesso === 4 && totalSelecionado >= 5000) ||
                                (nivelAcesso === 5 && totalSelecionado >= 50000)
                            }
                            onClick={() => setJustificativaModal({ open: true, tipo: 'aprovar' })}
                            sx={{ minWidth: 220 }}
                        >
                            Aprovar seleção ({Object.keys(selecoes).length} itens)
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            size="large"
                            startIcon={<FiX />}
                            disabled={
                                Object.keys(selecoes).length === 0 ||
                                (nivelAcesso === 4 && totalSelecionado >= 5000) ||
                                (nivelAcesso === 5 && totalSelecionado >= 50000)
                            }
                            onClick={() => setJustificativaModal({ open: true, tipo: 'reprovar' })}
                            sx={{ minWidth: 220 }}
                        >
                            Reprovar pedido
                        </Button>
                    </Box>
                )}
            </Box>
        );
    };

    const tabContent = {
        selecao: renderSelecaoTab(),
    };

    return (
        <>
            <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
                <Typography variant="h6" align="center" gutterBottom sx={{
                    fontWeight: 'bold', backgroundColor: '#f5f5f5',
                    p: 1, border: '1px solid #000', mb: 3
                }}>
                    ANÁLISE MELHORES
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                    {TABS.map(tab => (
                        <Button key={tab.id} variant={activeTab === tab.id ? 'contained' : 'outlined'}
                            size="small" onClick={() => setActiveTab(tab.id)}
                            sx={activeTab === tab.id ? { backgroundColor: '#185FA5' } : {}}
                        >
                            {tab.label}
                        </Button>
                    ))}
                </Box>

                {tabContent[activeTab]}
            </Paper>

            {/* Modal de justificativa */}
            <Modal open={justificativaModal.open} onClose={() => setJustificativaModal({ open: false, tipo: null })} 
                   title={justificativaModal.tipo === 'aprovar' ? "Aprovar seleção de cotação" : "Reprovar pedido"}>
                <Box sx={{ minWidth: 500 }}>
                    <Alert severity={justificativaModal.tipo === 'aprovar' ? "info" : "warning"} sx={{ mb: 2, fontSize: '0.8rem' }}>
                        {justificativaModal.tipo === 'aprovar' 
                            ? `Aprovando ${Object.keys(selecoes).length} item(ns) de ${resumoPorFornecedor.length} fornecedor(es) — total: ${formatCurrencyLocal(totalSelecionado)}`
                            : `Você está reprovando este pedido. Todos os fornecedores selecionados serão reprovados.`
                        }
                    </Alert>
                    <TextField
                        label="Justificativa"
                        value={justificativa}
                        onChange={e => setJustificativa(e.target.value)}
                        multiline rows={4} fullWidth
                        placeholder={`Digite a justificativa para ${justificativaModal.tipo === 'aprovar' ? 'aprovação' : 'reprovação'}...`}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
                        <Button onClick={() => setJustificativaModal({ open: false, tipo: null })} variant="outlined">Cancelar</Button>
                        <Button 
                            onClick={justificativaModal.tipo === 'aprovar' ? handleAprovar : handleReprovar} 
                            variant="contained" 
                            color={justificativaModal.tipo === 'aprovar' ? "success" : "error"}
                            disabled={!justificativa.trim() || loadingAprovacao}
                            startIcon={loadingAprovacao ? <CircularProgress size={16} color="inherit" /> : (justificativaModal.tipo === 'aprovar' ? <FiCheck /> : <FiX />)}
                            sx={{ minWidth: 200 }}
                        >
                            {justificativaModal.tipo === 'aprovar' ? "Confirmar aprovação" : "Confirmar reprovação"}
                        </Button>
                    </Box>
                </Box>
            </Modal>

            <Backdrop open={loadingAprovacao} sx={{ color: '#fff', zIndex: t => t.zIndex.drawer + 1 }}>
                <CircularProgress color="inherit" />
            </Backdrop>
        </>
    );
};

const CotacaoPreview = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { materiais, cotacoes, cod_compra: stateCodCompra } = location.state || {};
    const [summary, setSummary] = useState(null);

    useEffect(() => {
        document.documentElement.lang = 'pt-BR';

        const metaGoogle = document.createElement('meta');
        metaGoogle.name = 'google';
        metaGoogle.content = 'notranslate';

        const metaLanguage = document.createElement('meta');
        metaLanguage.httpEquiv = 'Content-Language';
        metaLanguage.content = 'pt-BR';

        document.head.appendChild(metaGoogle);
        document.head.appendChild(metaLanguage);

        document.body.setAttribute('translate', 'no');
        document.body.classList.add('notranslate');
    }, []);

    // Obtém cod_compra de forma robusta: primeiro do estado, depois do primeiro material
    const cod_compra = stateCodCompra || (materiais && materiais.length > 0 ? materiais[0].cod_compra : null);

    useEffect(() => {
        if (!materiais || !cotacoes) return;

        const fornecedoresMap = new Map();
        materiais.forEach((mat) => {
            const cotacaoMaterial = cotacoes[mat.cod_material];
            if (cotacaoMaterial) {
                Object.keys(cotacaoMaterial).forEach(key => {
                    if (key.startsWith('Fornecedor ') && cotacaoMaterial[key]) {
                        const fornecedorData = cotacaoMaterial[key];
                        const nomeFornecedor = fornecedorData.nome_forncedor || key;
                        const fornecedorId = fornecedorData.nomeFornecedor;

                        fornecedoresMap.set(key, {
                            chaveOriginal: key,
                            nomeFornecedor: nomeFornecedor,
                            fornecedorId: fornecedorId
                        });
                    }
                });
            }
        });

        const fornecedores = Array.from(fornecedoresMap.values());
        const supplierTotals = {};

        fornecedores.forEach(forn => {
            supplierTotals[forn.chaveOriginal] = 0;
        });

        materiais.forEach((mat) => {
            fornecedores.forEach((forn) => {
                supplierTotals[forn.chaveOriginal] += parseFloat(cotacoes[mat.cod_material]?.[forn.chaveOriginal]?.preco || 0) * (mat.quantidade || 0);
            });
        });

        let bestPrice = Infinity;
        let bestSupplierKey = null;

        Object.entries(supplierTotals).forEach(([forn, total]) => {
            if (total > 0 && total < bestPrice) {
                bestPrice = total;
                bestSupplierKey = forn;
            }
        });

        const bestSupplierData =
            materiais.length > 0 && bestSupplierKey
                ? cotacoes[materiais[0].cod_material]?.[bestSupplierKey] || {}
                : {};

        let bestSupplierName = bestSupplierKey;
        if (bestSupplierKey) {
            const fornecedorVencedor = fornecedores.find(f => f.chaveOriginal === bestSupplierKey);
            if (fornecedorVencedor) {
                bestSupplierName = fornecedorVencedor.nomeFornecedor;
            }
        }

        setSummary({
            supplierTotals,
            bestPrice: bestPrice === Infinity ? 0 : bestPrice,
            bestSupplierKey,
            bestSupplierName,
            bestSupplierData,
        });
    }, [materiais, cotacoes]);

    if (!materiais || !cotacoes)
        return <Typography>Dados da cotação não encontrados. Volte e preencha o formulário.</Typography>;

    if (!summary) return <Typography>Calculando...</Typography>;

    return (
        <Box sx={{ p: 2, backgroundColor: '#ffffff' }}>
            <Grid container justifyContent="space-between" sx={{ mb: 2 }}>
                <Grid item>
                    <Button
                        variant="outlined"
                        onClick={() => navigate(-1)}
                        sx={{
                            border: '1px solid #000',
                            color: '#000',
                            '&:hover': {
                                backgroundColor: '#f0f0f0'
                            }
                        }}
                    >
                        Voltar
                    </Button>
                </Grid>
                <Grid item>
                    <Button
                        variant="contained"
                        onClick={() => {
                            // Função exportToExcel aqui
                            if (!materiais || !cotacoes || !summary) return;

                            const fornecedoresMap = new Map();
                            materiais.forEach((mat) => {
                                const cotacaoMaterial = cotacoes[mat.cod_material];
                                if (cotacaoMaterial) {
                                    Object.keys(cotacaoMaterial).forEach(key => {
                                        if (key.startsWith('Fornecedor ') && cotacaoMaterial[key]) {
                                            const fornecedorData = cotacaoMaterial[key];
                                            const nomeFornecedor = fornecedorData.nome_forncedor || key;

                                            fornecedoresMap.set(key, {
                                                chaveOriginal: key,
                                                nomeFornecedor: nomeFornecedor
                                            });
                                        }
                                    });
                                }
                            });
                            const fornecedores = Array.from(fornecedoresMap.values());

                            const excelData = [];

                            excelData.push(['FFA INFRAESTRUTURA E SERVIÇO LTDA']);
                            excelData.push(['RUA TANAGRA, 42, OLARIA - RIO DE JANEIRO/RJ - CEP 21031-560']);
                            excelData.push(['CNPJ 08.375.450/0001-70 I.E. 78536357 I.M. 409534-0']);
                            excelData.push(['FONE (21) 3836-2323']);
                            excelData.push([]);
                            excelData.push(['MAPA DE COTAÇÃO']);
                            excelData.push([]);

                            const headers = ['ITEM', 'CÓDIGO', 'DESCRIÇÃO', 'UNID', 'QTDE'];
                            fornecedores.forEach(forn => {
                                headers.push(`${forn.nomeFornecedor} - PREÇO`);
                                headers.push(`${forn.nomeFornecedor} - TOTAL`);
                            });
                            headers.push('ÚLTIMA COMPRA');
                            excelData.push(headers);

                            materiais.forEach((mat, index) => {
                                const row = [
                                    index + 1,
                                    mat.cod_material,
                                    mat.descricao,
                                    mat.unid,
                                    mat.quantidade || 0
                                ];

                                fornecedores.forEach(forn => {
                                    const preco = parseFloat(cotacoes[mat.cod_material]?.[forn.chaveOriginal]?.preco || 0);
                                    const total = preco * (mat.quantidade || 0);
                                    row.push(preco);
                                    row.push(total);
                                });

                                row.push('-');
                                excelData.push(row);
                            });

                            const totalRow = ['', '', '', '', 'TOTAL'];
                            fornecedores.forEach(forn => {
                                totalRow.push('');
                                totalRow.push(summary.supplierTotals[forn.chaveOriginal] || 0);
                            });
                            totalRow.push('-');
                            excelData.push(totalRow);

                            const wb = XLSX.utils.book_new();
                            const ws = XLSX.utils.aoa_to_sheet(excelData);

                            const colWidths = [
                                { wch: 6 },   // ITEM
                                { wch: 12 },  // CÓDIGO
                                { wch: 40 },  // DESCRIÇÃO
                                { wch: 6 },   // UNID
                                { wch: 8 },   // QTDE
                            ];
                            fornecedores.forEach(() => {
                                colWidths.push({ wch: 15 }); // PREÇO
                                colWidths.push({ wch: 15 }); // TOTAL
                            });
                            colWidths.push({ wch: 15 }); // ÚLTIMA COMPRA
                            ws['!cols'] = colWidths;

                            XLSX.utils.book_append_sheet(wb, ws, 'Mapa de Cotação');

                            const dataAtual = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
                            const nomeArquivo = `Mapa_Cotacao_${cod_compra || 'Preview'}_${dataAtual}.xlsx`;
                            XLSX.writeFile(wb, nomeArquivo);
                        }}
                        sx={{
                            backgroundColor: '#28a745',
                            color: '#fff',
                            '&:hover': {
                                backgroundColor: '#218838'
                            },
                            marginRight: 2
                        }}
                    >
                        Exportar para Excel
                    </Button>

                    <Button
                        variant="contained"
                        onClick={async () => {
                            if (!materiais || !cotacoes || !summary) return;

                            try {
                                const fornecedoresMap = new Map();
                                materiais.forEach((mat) => {
                                    const cotacaoMaterial = cotacoes[mat.cod_material];
                                    if (cotacaoMaterial) {
                                        Object.keys(cotacaoMaterial).forEach(key => {
                                            if (key.startsWith('Fornecedor ') && cotacaoMaterial[key]) {
                                                const fornecedorData = cotacaoMaterial[key];
                                                const nomeFornecedor = fornecedorData.nome_forncedor || key;

                                                fornecedoresMap.set(key, {
                                                    chaveOriginal: key,
                                                    nomeFornecedor: nomeFornecedor
                                                });
                                            }
                                        });
                                    }
                                });
                                const fornecedores = Array.from(fornecedoresMap.values());

                                const printElement = document.createElement('div');
                                printElement.style.position = 'absolute';
                                printElement.style.left = '-9999px';
                                printElement.style.top = '0';
                                printElement.style.backgroundColor = 'white';
                                printElement.style.width = '210mm';
                                printElement.style.padding = '10mm';
                                printElement.style.fontFamily = 'Arial, sans-serif';

                                document.body.appendChild(printElement);

                                printElement.innerHTML = `
                                    <div style="font-family: Arial, sans-serif; font-size: 12px;">
                                        <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px;">
                                            <h2 style="margin: 0; padding: 10px; background-color: #f5f5f5; border: 1px solid #000; font-weight: bold;">
                                                MAPA DE COTAÇÃO
                                            </h2>
                                        </div>

                                        <div style="margin-bottom: 20px; font-size: 11px;">
                                            <p style="margin: 2px 0;">FFA INFRAESTRUTURA E SERVIÇO LTDA</p>
                                            <p style="margin: 2px 0;">RUA TANAGRA, 42, OLARIA - RIO DE JANEIRO/RJ - CEP 21031-560</p>
                                            <p style="margin: 2px 0;">CNPJ 08.375.450/0001-70 I.E. 78536357 I.M. 409534-0</p>
                                            <p style="margin: 2px 0;">FONE (21) 3836-2323</p>
                                        </div>

                                        <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 9px;">
                                            <thead>
                                                <tr style="background-color: #f0f0f0;">
                                                    <th style="border: 1px solid #000; padding: 4px; text-align: center; font-weight: bold;">ITEM</th>
                                                    <th style="border: 1px solid #000; padding: 4px; text-align: center; font-weight: bold;">CÓDIGO</th>
                                                    <th style="border: 1px solid #000; padding: 4px; text-align: center; font-weight: bold; min-width: 200px;">DESCRIÇÃO</th>
                                                    <th style="border: 1px solid #000; padding: 4px; text-align: center; font-weight: bold;">UNID</th>
                                                    <th style="border: 1px solid #000; padding: 4px; text-align: center; font-weight: bold;">QTDE</th>
                                                    ${fornecedores.map((forn, index) => {
                                    const cores = ['#e8f4fd', '#fff2e8', '#f0f8e8', '#f8e8fd', '#e8fdf8'];
                                    const corFundo = cores[index % cores.length];
                                    return `<th colspan="2" style="border: 1px solid #000; padding: 4px; text-align: center; font-weight: bold; background-color: ${corFundo};">${forn.nomeFornecedor.toUpperCase()}</th>`;
                                }).join('')}
                                                    <th style="border: 1px solid #000; padding: 4px; text-align: center; font-weight: bold; background-color: #ffe8e8;">ÚLTIMA COMPRA</th>
                                                </tr>
                                                <tr style="background-color: #f8f8f8;">
                                                    <td colspan="5" style="border: 1px solid #000;"></td>
                                                    ${fornecedores.map((forn, index) => {
                                    const cores = ['#e8f4fd', '#fff2e8', '#f0f8e8', '#f8e8fd', '#e8fdf8'];
                                    const corFundo = cores[index % cores.length];
                                    return `
                                                            <td style="border: 1px solid #000; padding: 4px; text-align: center; font-weight: bold; background-color: ${corFundo}; font-size: 8px;">PREÇO</td>
                                                            <td style="border: 1px solid #000; padding: 4px; text-align: center; font-weight: bold; background-color: ${corFundo}; font-size: 8px;">TOTAL</td>
                                                        `;
                                }).join('')}
                                                    <td style="border: 1px solid #000; padding: 4px; text-align: center; font-weight: bold; background-color: #ffe8e8; font-size: 8px;">PREÇO</td>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${materiais.map((mat, index) => `
                                                    <tr>
                                                        <td style="border: 1px solid #000; padding: 4px; text-align: center;">${index + 1}</td>
                                                        <td style="border: 1px solid #000; padding: 4px; text-align: center;">${mat.cod_material}</td>
                                                        <td style="border: 1px solid #000; padding: 4px; font-size: 8px;">${mat.descricao}</td>
                                                        <td style="border: 1px solid #000; padding: 4px; text-align: center;">${mat.unid}</td>
                                                        <td style="border: 1px solid #000; padding: 4px; text-align: center;">${mat.quantidade || 0}</td>
                                                        ${fornecedores.map((forn, fornIndex) => {
                                    const preco = parseFloat(cotacoes[mat.cod_material]?.[forn.chaveOriginal]?.preco || 0);
                                    const total = preco * (mat.quantidade || 0);
                                    const cores = ['#f8fcff', '#fffaf8', '#f8fff8', '#fcf8ff', '#f8fffc'];
                                    const corFundo = cores[fornIndex % cores.length];
                                    return `
                                                                <td style="border: 1px solid #000; padding: 4px; text-align: right; background-color: ${corFundo};">${formatCurrency(preco)}</td>
                                                                <td style="border: 1px solid #000; padding: 4px; text-align: right; font-weight: bold; background-color: ${corFundo};">${formatCurrency(total)}</td>
                                                            `;
                                }).join('')}
                                                        <td style="border: 1px solid #000; padding: 4px; text-align: right; background-color: #fff8f8;">
                                                            ${cotacoes[mat.cod_material]?.ultima_compra
                                        ? formatCurrency(cotacoes[mat.cod_material].ultima_compra)
                                        : 'R$ -'}
                                                        </td>
                                                    </tr>
                                                `).join('')}

                                                <tr style="background-color: #f0f0f0;">
                                                    <td colspan="5" style="border: 1px solid #000; padding: 4px; text-align: right; font-weight: bold;">TOTAL</td>
                                                    ${fornecedores.map((forn, index) => {
                                            const cores = ['#e8f4fd', '#fff2e8', '#f0f8e8', '#f8e8fd', '#e8fdf8'];
                                            const corFundo = cores[index % cores.length];
                                            return `<td colspan="2" style="border: 1px solid #000; padding: 4px; text-align: right; font-weight: bold; background-color: ${corFundo};">${formatCurrency(summary.supplierTotals[forn.chaveOriginal])}</td>`;
                                        }).join('')}
                                                    <td style="border: 1px solid #000; padding: 4px; text-align: right; font-weight: bold; background-color: #ffe8e8;">R$ -</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                `;

                                const html2pdf = (await import('html2pdf.js')).default;
                                html2pdf().from(printElement.innerHTML).set({
                                    margin: 10,
                                    filename: `Mapa_Cotacao_${cod_compra || 'Preview'}.pdf`,
                                    html2canvas: { scale: 2 },
                                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
                                }).save();

                                if (printElement && printElement.parentNode) {
                                    printElement.parentNode.removeChild(printElement);
                                }
                            } catch (error) {
                                console.error('Erro ao gerar PDF:', error);
                                alert('Ocorreu um erro ao gerar o PDF. Por favor, tente novamente.');
                            }
                        }}
                        sx={{
                            backgroundColor: '#a72828ff',
                            color: '#fff',
                            '&:hover': {
                                backgroundColor: '#882121ff'
                            }
                        }}
                    >
                        Exportar para PDF
                    </Button>
                </Grid>
            </Grid>

            <MapaCotacao materiais={materiais} cotacoes={cotacoes} summary={summary} />
            <MelhoresFornecedores
                materiais={materiais}
                cotacoes={cotacoes}
                summary={summary}
                cod_compra={cod_compra}
            />
        </Box>
    );
};

export default CotacaoPreview;