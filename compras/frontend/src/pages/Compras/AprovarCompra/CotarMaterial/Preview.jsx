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
} from '@mui/material';
import * as XLSX from 'xlsx';

const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

const MapaCotacao = ({ materiais, cotacoes, summary, cod_compra }) => {
    const fornecedores = ['Fornecedor I', 'Fornecedor II', 'Fornecedor III', 'Fornecedor IV', 'Fornecedor V'];
    console.log(cod_compra)
    return (
        <Paper elevation={3} sx={{ p: 3 }}>
            {/* Cabeçalho da empresa */}
            {/* <img src="/src/assets/images/logo.png" alt="" className="logo-image" /> */}
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
                        RUA TANAGRA, 42, OLARIA - RIO DE JANEIRO/RJ - CEP 21031-560
                    </Typography>
                    <Typography variant="body2">
                        CNPJ 08.375.450/0001-70 I.E. 78536357 I.M. 409534-0
                    </Typography>
                    <Typography variant="body2">
                        FONE (21) 3836-2323
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
                            {fornecedores.map((forn, index) => (
                                <TableCell
                                    key={forn}
                                    colSpan={2}
                                    align="center"
                                    sx={{
                                        fontWeight: 'bold',
                                        backgroundColor: index === 0 ? '#e8f4fd' : index === 1 ? '#fff2e8' : '#f0f8e8'
                                    }}
                                >
                                    {forn.toUpperCase()}
                                </TableCell>
                            ))}
                            <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#ffe8e8' }}>
                                ÚLTIMA COMPRA
                            </TableCell>
                        </TableRow>
                        <TableRow sx={{ backgroundColor: '#f8f8f8' }}>
                            <TableCell colSpan={5}></TableCell>
                            {fornecedores.map((forn, index) => (
                                <React.Fragment key={forn}>
                                    <TableCell
                                        align="center"
                                        sx={{
                                            fontWeight: 'bold',
                                            fontSize: '0.7rem',
                                            backgroundColor: index === 0 ? '#e8f4fd' : index === 1 ? '#fff2e8' : '#f0f8e8'
                                        }}
                                    >
                                        PREÇO
                                    </TableCell>
                                    <TableCell
                                        align="center"
                                        sx={{
                                            fontWeight: 'bold',
                                            fontSize: '0.7rem',
                                            backgroundColor: index === 0 ? '#e8f4fd' : index === 1 ? '#fff2e8' : '#f0f8e8'
                                        }}
                                    >
                                        TOTAL
                                    </TableCell>
                                </React.Fragment>
                            ))}
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
                                <TableCell sx={{ fontSize: '0.75rem' }}>{mat.descricao}</TableCell>
                                <TableCell align="center">{mat.unid}</TableCell>
                                <TableCell align="center">{mat.quantidade || 0}</TableCell>
                                {fornecedores.map((forn, fornIndex) => {
                                    const preco = parseFloat(cotacoes[mat.cod_material]?.[forn]?.preco || 0);
                                    const total = preco * (mat.quantidade || 0);
                                    return (
                                        <React.Fragment key={forn}>
                                            <TableCell
                                                align="right"
                                                sx={{
                                                    backgroundColor: fornIndex === 0 ? '#f8fcff' : fornIndex === 1 ? '#fffaf8' : '#f8fff8'
                                                }}
                                            >
                                                {formatCurrency(preco)}
                                            </TableCell>
                                            <TableCell
                                                align="right"
                                                sx={{
                                                    fontWeight: 'bold',
                                                    backgroundColor: fornIndex === 0 ? '#f8fcff' : fornIndex === 1 ? '#fffaf8' : '#f8fff8'
                                                }}
                                            >
                                                {formatCurrency(total)}
                                            </TableCell>
                                        </React.Fragment>
                                    );
                                })}
                                <TableCell align="right" sx={{ backgroundColor: '#fff8f8' }}>
                                    R$ -
                                </TableCell>
                            </TableRow>
                        ))}

                        <TableRow sx={{ backgroundColor: '#f0f0f0' }}>
                            <TableCell colSpan={5} align="right" sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                                TOTAL
                            </TableCell>
                            {fornecedores.map((forn, index) => (
                                <TableCell
                                    key={forn}
                                    colSpan={2}
                                    align="right"
                                    sx={{
                                        fontWeight: 'bold',
                                        fontSize: '0.85rem',
                                        backgroundColor: index === 0 ? '#e8f4fd' : index === 1 ? '#fff2e8' : '#f0f8e8'
                                    }}
                                >
                                    {formatCurrency(summary.supplierTotals[forn])}
                                </TableCell>
                            ))}
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
                                const fornecedorData = materiais.length > 0 ? cotacoes[materiais[0].cod_material]?.[forn] : null;
                                const condicoesPagamento = fornecedorData?.condPgto || '-';

                                return (
                                    <TableCell
                                        key={forn}
                                        colSpan={2}
                                        align="center"
                                        sx={{
                                            fontSize: '0.75rem',
                                            backgroundColor: index === 0 ? '#e8f4fd' : index === 1 ? '#fff2e8' : '#f0f8e8'
                                        }}
                                    >
                                        {condicoesPagamento}
                                    </TableCell>
                                );
                            })}
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
                                const fornecedorData = materiais.length > 0 ? cotacoes[materiais[0].cod_material]?.[forn] : null;
                                const tipoFrete = fornecedorData?.tipoFrete || '-';

                                return (
                                    <TableCell
                                        key={forn}
                                        colSpan={2}
                                        align="center"
                                        sx={{
                                            fontSize: '0.75rem',
                                            backgroundColor: index === 0 ? '#e8f4fd' : index === 1 ? '#fff2e8' : '#f0f8e8'
                                        }}
                                    >
                                        {tipoFrete}
                                    </TableCell>
                                );
                            })}
                            <TableCell align="center" sx={{ fontSize: '0.75rem', backgroundColor: '#ffe8e8' }}>
                                -
                            </TableCell>
                        </TableRow>

                        <TableRow sx={{ backgroundColor: '#f0f0f0' }}>
                            <TableCell colSpan={5} align="center" sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                                VALOR DO FRETE
                            </TableCell>
                            {fornecedores.map((forn, index) => {
                                const fornecedorData = materiais.length > 0 ? cotacoes[materiais[0].cod_material]?.[forn] : null;
                                const valorFrete = fornecedorData?.valorFrete || '0';

                                return (<TableCell
                                    key={forn}
                                    colSpan={2}
                                    align="center"
                                    sx={{
                                        fontSize: '0.85rem',
                                        backgroundColor: index === 0 ? '#e8f4fd' : index === 1 ? '#fff2e8' : '#f0f8e8'
                                    }}
                                >
                                    {formatCurrency(valorFrete)}
                                </TableCell>)

                            })}
                            <TableCell align="center" sx={{ fontSize: '0.85rem', backgroundColor: '#ffe8e8' }}>
                                R$ -
                            </TableCell>
                        </TableRow>


                        {/* Condições de Entrega */}
                        <TableRow sx={{ backgroundColor: '#f0f0f0' }}>
                            <TableCell colSpan={5} align="center" sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                                CONDIÇÕES DE ENTREGA
                            </TableCell>
                            {fornecedores.map((forn, index) => {
                                const fornecedorData = materiais.length > 0 ? cotacoes[materiais[0].cod_material]?.[forn] : null;
                                const condicoesEntrega = fornecedorData?.condEntrega || '-';

                                return (
                                    <TableCell
                                        key={forn}
                                        colSpan={2}
                                        align="center"
                                        sx={{
                                            fontSize: '0.75rem',
                                            backgroundColor: index === 0 ? '#e8f4fd' : index === 1 ? '#fff2e8' : '#f0f8e8'
                                        }}
                                    >
                                        {condicoesEntrega}
                                    </TableCell>
                                );
                            })}
                            <TableCell align="center" sx={{ fontSize: '0.75rem', backgroundColor: '#ffe8e8' }}>
                                -
                            </TableCell>
                        </TableRow>

                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
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

        const fornecedores = ['Fornecedor I', 'Fornecedor II', 'Fornecedor III', 'Fornecedor IV', 'Fornecedor V'];
        const supplierTotals = { 'Fornecedor I': 0, 'Fornecedor II': 0, 'Fornecedor III': 0, 'Fornecedor IV': 0, 'Fornecedor V': 0 };

        materiais.forEach((mat) => {
            fornecedores.forEach((forn) => {
                supplierTotals[forn] += parseFloat(cotacoes[mat.cod_material]?.[forn]?.preco || 0) * (mat.quantidade || 0);
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
            materiais.length > 0
                ? cotacoes[materiais[0].cod_material]?.[bestSupplierKey] || {}
                : {};

        setSummary({
            supplierTotals,
            bestPrice: bestPrice === Infinity ? 0 : bestPrice,
            bestSupplierKey,
            bestSupplierName: bestSupplierKey,
            bestSupplierData,
        });
    }, [materiais, cotacoes]);

    const handleGoBack = () => {
        navigate(`../${cod_compra}`, {
            state: { initialCotacoes: cotacoes },
        });
    };

    const exportToExcel = () => {
        if (!materiais || !cotacoes || !summary) return;

        const fornecedores = ['Fornecedor I', 'Fornecedor II', 'Fornecedor III', 'Fornecedor IV', 'Fornecedor V'];

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
            headers.push(`${forn} - PREÇO`);
            headers.push(`${forn} - TOTAL`);
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
                const preco = parseFloat(cotacoes[mat.cod_material]?.[forn]?.preco || 0);
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
            totalRow.push(summary.supplierTotals[forn]);
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

        // Estilizando cabeçalhos (negrito, centralizado, cor de fundo)
        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let C = 0; C <= range.e.c; ++C) {
            const cell_address = XLSX.utils.encode_cell({ c: C, r: 6 }); // cabeçalho da tabela (linha 7)
            if (!ws[cell_address]) continue;
            ws[cell_address].s = {
                font: { bold: true, sz: 12 },
                alignment: { horizontal: 'center', vertical: 'center' },
                fill: { fgColor: { rgb: 'F0F0F0' } }
            };
        }

        // Estilizando totais
        const totalLine = range.e.r; // última linha
        for (let C = 0; C <= range.e.c; ++C) {
            const cell_address = XLSX.utils.encode_cell({ c: C, r: totalLine });
            if (!ws[cell_address]) continue;
            ws[cell_address].s = {
                font: { bold: true },
                alignment: { horizontal: 'right', vertical: 'center' },
                fill: { fgColor: { rgb: 'E8F4FD' } }
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
                        Voltar e Editar Cotação
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
                            }
                        }}
                    >
                        Exportar para Excel
                    </Button>
                </Grid>
            </Grid>

            <MapaCotacao materiais={materiais} cotacoes={cotacoes} summary={summary} />
            <OrdemCompra materiais={materiais} cotacoes={cotacoes} bestSupplierKey={summary.bestSupplierKey} />
        </Box>
    );
};

export default CotacaoPreview;