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
    Modal,
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
} from '@mui/material';
import axios from 'axios';
import * as XLSX from 'xlsx';
import "./Preview.css";


const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

// Modal de Detalhes do Fornecedor
const FornecedorDetailsModal = ({ open, onClose, fornecedorId }) => {
    const [fornecedor, setFornecedor] = useState(null);
    const [loading, setLoading] = useState(false);

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

    if (!open) return null;

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '90%',
                maxWidth: 800,
                maxHeight: '90vh',
                bgcolor: 'background.paper',
                borderRadius: 2,
                boxShadow: 24,
                p: 0,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}>
                {/* Cabeçalho do Modal */}
                <Box sx={{
                    p: 3,
                    borderBottom: 1,
                    borderColor: 'divider',
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box>
                            <Typography variant="h5" fontWeight="bold">
                                Dados do Fornecedor
                            </Typography>
                            {fornecedor && (
                                <Typography variant="subtitle1">
                                    {fornecedor.nome_fantasia || fornecedor.razao_social}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                    <IconButton onClick={onClose} sx={{ color: 'white' }}>
                    </IconButton>
                </Box>

                {/* Conteúdo do Modal */}
                <Box sx={{ p: 3, overflowY: 'auto', flex: 1  }}>
                    {loading ? (
                        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                            <CircularProgress />
                        </Box>
                    ) : fornecedor ? (
                        <Grid container spacing={3}>
                            {/* Informações Principais */}
                            <Grid item xs={12} md={6} sx={{ width: '47%' }}>
                                <Card variant="outlined">
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

                            {/* Contato */}
                            <Grid item xs={12} md={6} sx={{ width: '47%' }}>
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

                            {/* Endereço */}
                            <Grid item xs={12} md={6} sx={{ width: '47%' }}>
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

                            {/* Contato Principal */}
                            <Grid item xs={12} md={6} sx={{ width: '47%' }}>
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

                            {/* Observações */}
                            {fornecedor.observacoes && (
                                <Grid item xs={12} sx={{ width: '47%' }}>
                                    <Card variant="outlined">
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

                            {/* Status */}
                            <Grid item xs={12} sx={{ width: '100%' }}>
                                <Card variant="outlined" sx={{ minWidth: '100%' }}>
                                    <CardContent sx={{ minWidth: '100%' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: '100%' }}>
                                            <Box >
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
                    ) : (
                        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                            <Typography color="text.secondary">
                                Fornecedor não encontrado
                            </Typography>
                        </Box>
                    )}
                </Box>

                {/* Rodapé do Modal */}
                <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'flex-end' }}>
                    <Button onClick={onClose} variant="contained">
                        Fechar
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};

const MapaCotacao = ({ materiais, cotacoes, summary }) => {
    const location = useLocation();
    const { cod_compra } = location.state || {};
    
    // Estados para modais
    const [openFornecedorModal, setOpenFornecedorModal] = useState(false);
    const [selectedFornecedorId, setSelectedFornecedorId] = useState(null);
    const [selectedFornecedorNome, setSelectedFornecedorNome] = useState("");
    
    // Extrair os fornecedores únicos dos dados de cotações
    const fornecedores = React.useMemo(() => {
        const fornecedoresMap = new Map();
        
        if (materiais && cotacoes) {
            materiais.forEach(mat => {
                const cotacaoMaterial = cotacoes[mat.cod_material];
                if (cotacaoMaterial) {
                    Object.keys(cotacaoMaterial).forEach(key => {
                        if (key.startsWith('Fornecedor ') && cotacaoMaterial[key]) {
                            const fornecedorData = cotacaoMaterial[key];
                            const nomeFornecedor = fornecedorData.nome_forncedor || key;
                            const fornecedorId = fornecedorData.nomeFornecedor; // ID do fornecedor
                            
                            fornecedoresMap.set(key, {
                                chaveOriginal: key,
                                nomeFornecedor: nomeFornecedor,
                                fornecedorId: fornecedorId,
                                data: fornecedorData
                            });
                        }
                    });
                }
            });
        }
        
        return Array.from(fornecedoresMap.values());
    }, [materiais, cotacoes]);

    // Estados para outros modais
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

    // Função para abrir modal do fornecedor
    const handleOpenFornecedor = (fornecedorId, fornecedorNome) => {
        setSelectedFornecedorId(fornecedorId);
        setSelectedFornecedorNome(fornecedorNome);
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

    // Função para abrir o modal e buscar os itens agrupados
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

    return (
        <>
            <Paper elevation={3} sx={{ p: 3 }}>
                {/* Cabeçalho da empresa */}
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

                {/* Informações do mapa */}
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
                                {fornecedores.map((forn, index) => {
                                    const cores = ['#e8f4fd', '#fff2e8', '#f0f8e8', '#f8e8fd', '#e8fdf8'];
                                    const corFundo = cores[index % cores.length];

                                    return (
                                        <TableCell
                                            key={forn.chaveOriginal}
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
                                            onClick={() => handleOpenFornecedor(forn.fornecedorId, forn.nomeFornecedor)}
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
                                    const cores = ['#e8f4fd', '#fff2e8', '#f0f8e8', '#f8e8fd', '#e8fdf8'];
                                    const corFundo = cores[index % cores.length];

                                    return (
                                        <React.Fragment key={forn.chaveOriginal}>
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
                            {materiais.map((mat, index) => (
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
                                        const preco = parseFloat(cotacoes[mat.cod_material]?.[forn.chaveOriginal]?.preco || 0);
                                        const total = preco * (mat.quantidade || 0);
                                        const cores = ['#f8fcff', '#fffaf8', '#f8fff8', '#fcf8ff', '#f8fffc'];
                                        const corFundo = cores[fornIndex % cores.length];
                                        
                                        return (
                                            <React.Fragment key={forn.chaveOriginal}>
                                                <TableCell
                                                    align="right"
                                                    sx={{
                                                        backgroundColor: corFundo
                                                    }}
                                                >
                                                    {formatCurrency(preco)}
                                                </TableCell>
                                                <TableCell
                                                    align="right"
                                                    sx={{
                                                        fontWeight: 'bold',
                                                        backgroundColor: corFundo
                                                    }}
                                                >
                                                    {formatCurrency(total)}
                                                </TableCell>
                                            </React.Fragment>
                                        );
                                    })}
                                    {/* Última compra */}
                                    <TableCell align="right" sx={{ backgroundColor: '#fff8f8' }}>
                                        {cotacoes[mat.cod_material]?.ultima_compra
                                            ? formatCurrency(cotacoes[mat.cod_material].ultima_compra)
                                            : 'R$ -'}
                                    </TableCell>

                                    {/* Média histórica */}
                                    <TableCell align="right" sx={{ backgroundColor: '#fff8f8' }}>
                                        {cotacoes[mat.cod_material]?.media_historica
                                            ? formatCurrency(cotacoes[mat.cod_material].media_historica)
                                            : 'R$ -'}
                                    </TableCell>

                                    {/* Média últimos 6 meses */}
                                    <TableCell align="right" sx={{ backgroundColor: '#fff8f8' }}>
                                        {cotacoes[mat.cod_material]?.media_6_meses
                                            ? formatCurrency(cotacoes[mat.cod_material].media_6_meses)
                                            : 'R$ -'}
                                    </TableCell>
                                </TableRow>
                            ))}

                            {/* Linha de totais */}
                            <TableRow sx={{ backgroundColor: '#f0f0f0' }}>
                                <TableCell colSpan={5} align="right" sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                                    TOTAL
                                </TableCell>
                                {fornecedores.map((forn, index) => {
                                    const cores = ['#e8f4fd', '#fff2e8', '#f0f8e8', '#f8e8fd', '#e8fdf8'];
                                    const corFundo = cores[index % cores.length];

                                    return (
                                        <TableCell
                                            key={forn.chaveOriginal}
                                            colSpan={2}
                                            align="right"
                                            sx={{
                                                fontWeight: 'bold',
                                                fontSize: '0.85rem',
                                                backgroundColor: corFundo
                                            }}
                                        >
                                            {summary.supplierTotals[forn.chaveOriginal] ? formatCurrency(summary.supplierTotals[forn.chaveOriginal]) : 'R$ -'}
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

                            {/* Condições de Pagamento */}
                            <TableRow sx={{ backgroundColor: '#f0f0f0' }}>
                                <TableCell colSpan={5} align="center" sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                                    CONDIÇÕES DE PAGAMENTO
                                </TableCell>
                                {fornecedores.map((forn, index) => {
                                    const fornecedorData = cotacoes[materiais[0].cod_material]?.[forn.chaveOriginal];

                                    // Regra: se for A VISTA, mostra só "A VISTA"
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
                                    const cores = ['#e8f4fd', '#fff2e8', '#f0f8e8', '#f8e8fd', '#e8fdf8'];
                                    const corFundo = cores[index % cores.length];

                                    return (
                                        <TableCell
                                            key={forn.chaveOriginal}
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
                                            // só abre modal se não for A VISTA
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

                            {/* Tipo de Frete */}
                            <TableRow sx={{ backgroundColor: '#f0f0f0' }}>
                                <TableCell colSpan={5} align="center" sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                                    TIPO DE FRETE
                                </TableCell>
                                {fornecedores.map((forn, index) => {
                                    const fornecedorData = cotacoes[materiais[0].cod_material]?.[forn.chaveOriginal];
                                    const tipoFrete = fornecedorData?.tipoFrete || '-';
                                    const cores = ['#e8f4fd', '#fff2e8', '#f0f8e8', '#f8e8fd', '#e8fdf8'];
                                    const corFundo = cores[index % cores.length];

                                    return (
                                        <TableCell
                                            key={forn.chaveOriginal}
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
                                    const fornecedorData = cotacoes[materiais[0].cod_material]?.[forn.chaveOriginal];
                                    const valorFrete = fornecedorData?.valorFrete ?? 'Não Informado';
                                    const parsedFrete = Number(valorFrete);
                                    const valorExibido = !isNaN(parsedFrete)
                                        ? formatCurrency(parsedFrete)
                                        : valorFrete;
                                    const cores = ['#e8f4fd', '#fff2e8', '#f0f8e8', '#f8e8fd', '#e8fdf8'];
                                    const corFundo = cores[index % cores.length];

                                    return (
                                        <TableCell
                                            key={forn.chaveOriginal}
                                            colSpan={2}
                                            align="center"
                                            sx={{
                                                fontSize: '0.85rem',
                                                backgroundColor: corFundo
                                            }}
                                        >
                                            {valorExibido}
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

                            {/* Condições de Entrega */}
                            <TableRow sx={{ backgroundColor: '#f0f0f0' }}>
                                <TableCell colSpan={5} align="center" sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                                    PRAZO
                                </TableCell>
                                {fornecedores.map((forn, index) => {
                                    const fornecedorData = cotacoes[materiais[0].cod_material]?.[forn.chaveOriginal];
                                    const condicoesEntrega = fornecedorData?.condEntrega || '-';
                                    const cores = ['#e8f4fd', '#fff2e8', '#f0f8e8', '#f8e8fd', '#e8fdf8'];
                                    const corFundo = cores[index % cores.length];

                                    return (
                                        <TableCell
                                            key={forn.chaveOriginal}
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

            {/* Modal de Detalhes do Fornecedor */}
            <FornecedorDetailsModal 
                open={openFornecedorModal}
                onClose={handleCloseFornecedor}
                fornecedorId={selectedFornecedorId}
            />

            {/* Modal de Itens Agrupados */}
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
                            {/* CABEÇALHO (não rola) */}
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

                            {/* CONTEÚDO ROLÁVEL */}
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

                            {/* RODAPÉ (não rola) */}
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

// --- Novo Componente: Análise dos Melhores Fornecedores ---
const MelhoresFornecedores = ({ materiais, cotacoes, summary }) => {
    // Estados para o modal do fornecedor
    const [openFornecedorModal, setOpenFornecedorModal] = useState(false);
    const [selectedFornecedorId, setSelectedFornecedorId] = useState(null);
    const [selectedFornecedorNome, setSelectedFornecedorNome] = useState("");

    // Extrair os fornecedores únicos dos dados de cotações
    const fornecedores = React.useMemo(() => {
        const fornecedoresMap = new Map();
        
        if (materiais && cotacoes) {
            materiais.forEach(mat => {
                const cotacaoMaterial = cotacoes[mat.cod_material];
                if (cotacaoMaterial) {
                    Object.keys(cotacaoMaterial).forEach(key => {
                        if (key.startsWith('Fornecedor ') && cotacaoMaterial[key]) {
                            const fornecedorData = cotacaoMaterial[key];
                            const nomeFornecedor = fornecedorData.nome_forncedor || key;
                            const fornecedorId = fornecedorData.nomeFornecedor; // ID do fornecedor
                            
                            fornecedoresMap.set(key, {
                                chaveOriginal: key,
                                nomeFornecedor: nomeFornecedor,
                                fornecedorId: fornecedorId,
                                data: fornecedorData
                            });
                        }
                    });
                }
            });
        }
        
        return Array.from(fornecedoresMap.values());
    }, [materiais, cotacoes]);

    // Funções para abrir/fechar modal do fornecedor
    const handleOpenFornecedor = (fornecedorId, fornecedorNome) => {
        setSelectedFornecedorId(fornecedorId);
        setSelectedFornecedorNome(fornecedorNome);
        setOpenFornecedorModal(true);
    };

    const handleCloseFornecedor = () => {
        setOpenFornecedorModal(false);
        setSelectedFornecedorId(null);
        setSelectedFornecedorNome("");
    };

    const getAnalysis = () => {
        const analysis = {};

        fornecedores.forEach(forn => {
            const fornecedorData = forn.data;

            const nomeFantasia = forn.nomeFornecedor;

            const valorFrete = parseFloat(fornecedorData.valorFrete ?? "Não Informado");

            const condEntrega = fornecedorData.condEntrega;
            const condPgto = fornecedorData.condPgto;
            const precoHistorico = parseFloat(fornecedorData.precoHistorico || 0);

            const totalComFrete = summary.supplierTotals[forn.chaveOriginal] + (isNaN(valorFrete) ? 0 : valorFrete);

            const diasEntrega = parseInt(
                (typeof condEntrega === "string" ? condEntrega.match(/\d+/)?.[0] : null) || 30
            );

            const diasPagamento = parseInt(
                (typeof condPgto === "string" ? condPgto.match(/\d+/)?.[0] : null) || 30
            );

            const qtdParcela = fornecedorData.qtdParcela || 1;
            const valorParcela = totalComFrete / qtdParcela;

            analysis[forn.chaveOriginal] = {
                nomeFantasia,
                fornecedorId: forn.fornecedorId,
                totalComFrete,
                valorFrete,
                diasEntrega,
                diasPagamento,
                precoHistorico,
                totalSemFrete: summary.supplierTotals[forn.chaveOriginal],
                qtdParcela,
                valorParcela
            };
        });

        return analysis;
    };

    const analysis = getAnalysis();

    // Encontrar os melhores em cada categoria
    const getBestInCategory = (category) => {
        const validSuppliers = Object.entries(analysis).filter(([key, data]) => {
            if (category === 'totalComFrete' || category === 'totalSemFrete') {
                return data[category] > 0;
            }
            return true;
        });

        if (validSuppliers.length === 0) return null;

        let bestSupplier = validSuppliers[0];

        validSuppliers.forEach(([key, data]) => {
            switch (category) {
                case 'totalComFrete':
                case 'totalSemFrete':
                case 'valorFrete':
                case 'precoHistorico':
                    if (data[category] < bestSupplier[1][category] && data[category] > 0) {
                        bestSupplier = [key, data];
                    }
                    break;
                case 'diasEntrega':
                    if (data[category] < bestSupplier[1][category]) {
                        bestSupplier = [key, data];
                    }
                    break;
                case 'pagamento':
                    if (data.qtdParcela > bestSupplier[1].qtdParcela) {
                        bestSupplier = [key, data];
                    } else if (data.qtdParcela === bestSupplier[1].qtdParcela) {
                        if (data.totalComFrete < bestSupplier[1].totalComFrete) {
                            bestSupplier = [key, data];
                        }
                    }
                    break;
            }
        });

        return bestSupplier;
    };

    const bestTotal = getBestInCategory('totalComFrete');
    const bestFrete = getBestInCategory('valorFrete');
    const bestEntrega = getBestInCategory('diasEntrega');
    const bestPagamento = getBestInCategory('pagamento');
    const bestHistorico = getBestInCategory('precoHistorico');

    return (
        <>
            <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
                <Typography variant="h6" align="center" gutterBottom sx={{
                    fontWeight: 'bold',
                    backgroundColor: '#f5f5f5',
                    p: 1,
                    border: '1px solid #000',
                    mb: 3
                }}>
                    ANÁLISE DOS MELHORES FORNECEDORES
                </Typography>

                <Grid container spacing={3}>
                    {/* Melhor Total com Frete */}
                    <Grid item xs={12} md={6} lg={3}>
                        <Card sx={{ 
                            height: '100%', 
                            border: '1px solid #28a745',
                            cursor: 'pointer',
                            '&:hover': {
                                boxShadow: 6,
                                transform: 'translateY(-2px)',
                                transition: 'all 0.2s ease-in-out'
                            }
                        }}
                        onClick={() => bestTotal && handleOpenFornecedor(bestTotal[1].fornecedorId, bestTotal[1].nomeFantasia)}
                        >
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Chip
                                        label="MELHOR TOTAL"
                                        color="success"
                                        size="small"
                                        sx={{ fontWeight: 'bold' }}
                                    />
                                </Box>
                                {bestTotal ? (
                                    <>
                                        <Typography variant="h6" sx={{ 
                                            fontWeight: 'bold', 
                                            color: '#28a745',
                                            cursor: 'pointer',
                                            '&:hover': {
                                                textDecoration: 'underline'
                                            }
                                        }}>
                                            {bestTotal[1].nomeFantasia}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Total com Frete: <strong>{formatCurrency(bestTotal[1].totalComFrete)}</strong>
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Total sem Frete: <strong>{formatCurrency(bestTotal[1].totalSemFrete)}</strong>
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Valor do Frete: <strong>{formatCurrency(bestTotal[1].valorFrete)}</strong>
                                        </Typography>
                                    </>
                                ) : (
                                    <Typography variant="body2">Nenhum fornecedor disponível</Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Melhor Frete */}
                    <Grid item xs={12} md={6} lg={3}>
                        <Card sx={{ 
                            height: '100%', 
                            border: '1px solid #17a2b8',
                            cursor: 'pointer',
                            '&:hover': {
                                boxShadow: 6,
                                transform: 'translateY(-2px)',
                                transition: 'all 0.2s ease-in-out'
                            }
                        }}
                        onClick={() => bestFrete && handleOpenFornecedor(bestFrete[1].fornecedorId, bestFrete[1].nomeFantasia)}
                        >
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Chip
                                        label="MELHOR FRETE"
                                        sx={{ backgroundColor: '#17a2b8', color: 'white', fontWeight: 'bold' }}
                                        size="small"
                                    />
                                </Box>
                                {bestFrete ? (
                                    <>
                                        <Typography variant="h6" sx={{ 
                                            fontWeight: 'bold', 
                                            color: '#17a2b8',
                                            cursor: 'pointer',
                                            '&:hover': {
                                                textDecoration: 'underline'
                                            }
                                        }}>
                                            {bestFrete[1].nomeFantasia}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Valor do Frete: <strong>{formatCurrency(bestFrete[1].valorFrete)}</strong>
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Total com Frete: <strong>{formatCurrency(bestFrete[1].totalComFrete)}</strong>
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Prazo de Entrega: <strong>{bestFrete[1].diasEntrega} dias</strong>
                                        </Typography>
                                    </>
                                ) : (
                                    <Typography variant="body2">Nenhum fornecedor disponível</Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Entrega Mais Rápida */}
                    <Grid item xs={12} md={6} lg={3}>
                        <Card sx={{ 
                            height: '100%', 
                            border: '1px solid #997302ff',
                            cursor: 'pointer',
                            '&:hover': {
                                boxShadow: 6,
                                transform: 'translateY(-2px)',
                                transition: 'all 0.2s ease-in-out'
                            }
                        }}
                        onClick={() => bestEntrega && handleOpenFornecedor(bestEntrega[1].fornecedorId, bestEntrega[1].nomeFantasia)}
                        >
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Chip
                                        label="ENTREGA MAIS RÁPIDA"
                                        sx={{ backgroundColor: '#ffc107', color: 'black', fontWeight: 'bold' }}
                                        size="small"
                                    />
                                </Box>
                                {bestEntrega ? (
                                    <>
                                        <Typography variant="h6" sx={{ 
                                            fontWeight: 'bold', 
                                            color: '#ffc107',
                                            cursor: 'pointer',
                                            '&:hover': {
                                                textDecoration: 'underline'
                                            }
                                        }}>
                                            {bestEntrega[1].nomeFantasia}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Prazo de Entrega: <strong>{bestEntrega[1].diasEntrega} dias</strong>
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Total: <strong>{formatCurrency(bestEntrega[1].totalComFrete)}</strong>
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Valor do Frete: <strong>{formatCurrency(bestEntrega[1].valorFrete)}</strong>
                                        </Typography>
                                    </>
                                ) : (
                                    <Typography variant="body2">Nenhum fornecedor disponível</Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Melhor Prazo de Pagamento */}
                    <Grid item xs={12} md={6} lg={3}>
                        <Card sx={{ 
                            height: '100%', 
                            border: '1px solid #6f42c1',
                            cursor: 'pointer',
                            '&:hover': {
                                boxShadow: 6,
                                transform: 'translateY(-2px)',
                                transition: 'all 0.2s ease-in-out'
                            }
                        }}
                        onClick={() => bestPagamento && handleOpenFornecedor(bestPagamento[1].fornecedorId, bestPagamento[1].nomeFantasia)}
                        >
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Chip
                                        label="MELHOR PAGAMENTO"
                                        sx={{ backgroundColor: '#6f42c1', color: 'white', fontWeight: 'bold' }}
                                        size="small"
                                    />
                                </Box>
                                {bestPagamento ? (
                                    <>
                                        <Typography variant="h6" sx={{ 
                                            fontWeight: 'bold', 
                                            color: '#6f42c1',
                                            cursor: 'pointer',
                                            '&:hover': {
                                                textDecoration: 'underline'
                                            }
                                        }}>
                                            {bestPagamento[1].nomeFantasia}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Parcelas: <strong>{bestPagamento[1].qtdParcela || 1}x</strong>
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Valor da parcela:{" "}
                                            <strong>{formatCurrency(bestPagamento[1].totalComFrete / (bestPagamento[1].qtdParcela || 1))}</strong>
                                        </Typography>
                                    </>
                                ) : (
                                    <Typography variant="body2">Nenhum fornecedor disponível</Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Melhor Preço Histórico */}
                    <Grid item xs={12} md={6} lg={3}>
                        <Card sx={{ 
                            height: '100%', 
                            border: '1px solid #dc3545',
                            cursor: 'pointer',
                            '&:hover': {
                                boxShadow: 6,
                                transform: 'translateY(-2px)',
                                transition: 'all 0.2s ease-in-out'
                            }
                        }}
                        onClick={() => bestHistorico && handleOpenFornecedor(bestHistorico[1].fornecedorId, bestHistorico[1].nomeFantasia)}
                        >
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Chip
                                        label="MELHOR HISTÓRICO"
                                        color="error"
                                        size="small"
                                        sx={{ fontWeight: 'bold' }}
                                    />
                                </Box>
                                {bestHistorico ? (
                                    <>
                                        <Typography variant="h6" sx={{ 
                                            fontWeight: 'bold', 
                                            color: '#dc3545',
                                            cursor: 'pointer',
                                            '&:hover': {
                                                textDecoration: 'underline'
                                            }
                                        }}>
                                            {bestHistorico[1].nomeFantasia}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Preço Histórico: <strong>{formatCurrency(bestHistorico[1].precoHistorico)}</strong>
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Total Atual: <strong>{formatCurrency(bestHistorico[1].totalComFrete)}</strong>
                                        </Typography>
                                    </>
                                ) : (
                                    <Typography variant="body2">Nenhum fornecedor disponível</Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Resumo Geral */}
                    <Grid item xs={12}>
                        <Card sx={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', minWidth: '100%' }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                                    RESUMO DA ANÁLISE
                                </Typography>

                                <Grid container spacing={2} fullWidth>
                                    {fornecedores.map(forn =>
                                        materiais.map(mat => {
                                            const fornecedorData = cotacoes[mat.cod_material]?.[forn.chaveOriginal];

                                            if (!fornecedorData || !fornecedorData.obs && !fornecedorData.arquivo) return null;

                                            return (
                                                <Grid item xs={12} key={`${mat.cod_material}-${forn.chaveOriginal}`}>
                                                    <Paper sx={{ 
                                                        p: 2, 
                                                        background: '#fff', 
                                                        border: '1px solid #ddd',
                                                        cursor: 'pointer',
                                                        '&:hover': {
                                                            boxShadow: 3,
                                                            backgroundColor: '#f9f9f9'
                                                        }
                                                    }}
                                                    onClick={() => handleOpenFornecedor(forn.fornecedorId, forn.nomeFornecedor)}
                                                    >
                                                        <Typography variant="subtitle1" sx={{ 
                                                            fontWeight: 'bold', 
                                                            mb: 1,
                                                            color: 'primary.main',
                                                            '&:hover': {
                                                                textDecoration: 'underline'
                                                            }
                                                        }}>
                                                            {forn.nomeFornecedor}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Material: <strong>{mat.descricao}</strong>
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Observação: <strong>{fornecedorData.obs ?? 'Sem Observação'}</strong>
                                                        </Typography>

                                                        {fornecedorData.arquivo && (
                                                            <Box sx={{ mt: 1 }}>
                                                                <Button
                                                                    variant="outlined"
                                                                    size="small"
                                                                    component="a"
                                                                    href={fornecedorData.arquivo}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    Visualizar Proposta
                                                                </Button>
                                                            </Box>
                                                        )}
                                                    </Paper>
                                                </Grid>
                                            );
                                        })
                                    )}
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Paper>

            {/* Modal de Detalhes do Fornecedor */}
            <FornecedorDetailsModal 
                open={openFornecedorModal}
                onClose={handleCloseFornecedor}
                fornecedorId={selectedFornecedorId}
            />
        </>
    );
};

// --- Componente Ordem de Compra ---
const OrdemCompra = ({ materiais, cotacoes, bestSupplierKey }) => {
    if (!bestSupplierKey) return null;

    const bestSupplierData = materiais.length
        ? cotacoes[materiais[0].cod_material]?.[bestSupplierKey] || {}
        : {};

    const totalBruto = materiais.reduce(
        (acc, mat) =>
            acc + parseFloat(cotacoes[mat.cod_material]?.[bestSupplierKey]?.preco || 0) * (mat.quantidade || 0),
        0
    );
    
    return null;
};

// --- Componente Principal do Preview ---
const CotacaoPreview = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { materiais, cotacoes } = location.state || {};
    const [summary, setSummary] = useState(null);

    const cod_compra = materiais && materiais.length > 0 ? materiais[0].cod_compra : null;

    useEffect(() => {
        if (!materiais || !cotacoes) return;

        // Extrair fornecedores únicos
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

        // Inicializar totais para cada fornecedor
        fornecedores.forEach(forn => {
            supplierTotals[forn.chaveOriginal] = 0;
        });

        // Calcular totais
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

        // Encontrar o nome do fornecedor vencedor
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

    const handleGoBack = () => {
        navigate(-1, {
            state: { initialCotacoes: cotacoes },
        });
    };

    const exportToPDF = async () => {
        if (!materiais || !cotacoes || !summary) return;

        try {
            // Extrair fornecedores únicos
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

            // Criar elemento temporário para renderizar o conteúdo
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
                    <!-- Cabeçalho -->
                    <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px;">
                        <h2 style="margin: 0; padding: 10px; background-color: #f5f5f5; border: 1px solid #000; font-weight: bold;">
                            MAPA DE COTAÇÃO
                        </h2>
                    </div>

                    <!-- Informações da empresa -->
                    <div style="margin-bottom: 20px; font-size: 11px;">
                        <p style="margin: 2px 0;">FFA INFRAESTRUTURA E SERVIÇO LTDA</p>
                        <p style="margin: 2px 0;">RUA TANAGRA, 42, OLARIA - RIO DE JANEIRO/RJ - CEP 21031-560</p>
                        <p style="margin: 2px 0;">CNPJ 08.375.450/0001-70 I.E. 78536357 I.M. 409534-0</p>
                        <p style="margin: 2px 0;">FONE (21) 3836-2323</p>
                    </div>

                    <!-- Tabela principal -->
                    <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 9px;">
                        <!-- Cabeçalho da tabela -->
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

                            <!-- Linha de totais -->
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

                    <!-- Assinaturas -->
                    <div id="assinaturas" style="display: flex; margin-top: 150px;">
                        <div>
                            <div style="border-top: 1px solid #000; width: 435px; margin-bottom: 25px"></div>
                            <div>Nome:</div>
                            <div style="border-top: 1px solid #000; width: 400px; margin-bottom: 25px; margin-left: 35px"></div>
                            <div>CPF / RG:</div>
                            <div style="border-top: 1px solid #000; width: 380px; margin-left: 55px"></div>
                        </div>
                    </div>
                </div>
            `;

            const html2pdf = (await import('html2pdf.js')).default;
            html2pdf().from(printElement.innerHTML).set({
                margin: 10,
                filename: `Mapa_Cotacao_${materiais[0].cod_compra || 'Preview'}.pdf`,
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
            }).save();

        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            alert('Ocorreu um erro ao gerar o PDF. Por favor, tente novamente.');
        } finally {
            if (printElement && printElement.parentNode) {
                printElement.parentNode.removeChild(printElement);
            }
        }
    };

    const exportToExcel = () => {
        if (!materiais || !cotacoes || !summary) return;

        // Extrair fornecedores únicos
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

        // Preparar dados para o Excel
        const excelData = [];

        // Cabeçalho da empresa
        excelData.push(['FFA INFRAESTRUTURA E SERVIÇO LTDA']);
        excelData.push(['RUA TANAGRA, 42, OLARIA - RIO DE JANEIRO/RJ - CEP 21031-560']);
        excelData.push(['CNPJ 08.375.450/0001-70 I.E. 78536357 I.M. 409534-0']);
        excelData.push(['FONE (21) 3836-2323']);
        excelData.push([]);
        excelData.push(['MAPA DE COTAÇÃO']);
        excelData.push([]);

        // Cabeçalhos da tabela
        const headers = ['ITEM', 'CÓDIGO', 'DESCRIÇÃO', 'UNID', 'QTDE'];
        fornecedores.forEach(forn => {
            headers.push(`${forn.nomeFornecedor} - PREÇO`);
            headers.push(`${forn.nomeFornecedor} - TOTAL`);
        });
        headers.push('ÚLTIMA COMPRA');
        excelData.push(headers);

        // Dados dos materiais
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

            row.push('-'); // Última compra
            excelData.push(row);
        });

        // Linha de totais
        const totalRow = ['', '', '', '', 'TOTAL'];
        fornecedores.forEach(forn => {
            totalRow.push('');
            totalRow.push(summary.supplierTotals[forn.chaveOriginal] || 0);
        });
        totalRow.push('-');
        excelData.push(totalRow);

        // Criar workbook e worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(excelData);

        // Definir largura das colunas
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

        // Estilizando cabeçalhos
        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let C = 0; C <= range.e.c; ++C) {
            const cell_address = XLSX.utils.encode_cell({ c: C, r: 6 });
            if (!ws[cell_address]) continue;
            ws[cell_address].s = {
                font: { bold: true, sz: 12 },
                alignment: { horizontal: 'center', vertical: 'center' },
                fill: { fgColor: { rgb: 'F0F0F0' } }
            };
        }

        // Adicionar worksheet ao workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Mapa de Cotação');

        // Salvar arquivo
        const dataAtual = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
        const nomeArquivo = `Mapa_Cotacao_${cod_compra || 'Preview'}_${dataAtual}.xlsx`;
        XLSX.writeFile(wb, nomeArquivo);
    };

    if (!materiais || !cotacoes)
        return <Typography>Dados da cotação não encontrados. Volte e preencha o formulário.</Typography>;

    if (!summary) return <Typography>Calculando...</Typography>;

    return (
        <Box sx={{ p: 2, backgroundColor: '#ffffff' }}>
            <Grid container justifyContent="space-between" sx={{ mb: 2 }}>
                <Grid item>
                    <Button
                        variant="outlined"
                        onClick={handleGoBack}
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
                        onClick={exportToExcel}
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
                        onClick={exportToPDF}
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
            <MelhoresFornecedores materiais={materiais} cotacoes={cotacoes} summary={summary} />
            {/* <OrdemCompra materiais={materiais} cotacoes={cotacoes} bestSupplierKey={summary.bestSupplierKey} /> */}
        </Box>
    );
};

export default CotacaoPreview;