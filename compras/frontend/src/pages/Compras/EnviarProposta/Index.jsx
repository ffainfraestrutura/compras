import axios from "axios";
import { useEffect, useState } from "react";
import {
    Backdrop,
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    CircularProgress,
    IconButton,
    Paper,
    Select,
    TextField,
    Tooltip,
    Typography
} from "@mui/material";
import { FiAlertTriangle, FiArrowLeft, FiCheck, FiEye, FiSend, FiFileText } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


import CustomSnackbar from "../../../components/SnackBar/SnackBar";
import DataGrid from "../../../components/DataGrid/DataGrid";
import Modal from "../../../components/Modal/Modal";

export default function Index() {
    const navigate = useNavigate();
    const nivelAcesso = Number(localStorage.getItem("nivel_acesso"));
    const [data, setData] = useState({
        filial: 3,
        detalhes: []
    });

    const [loading, setLoading] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");

    const [openJustificativa, setOpenJustificativa] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [itensAgrupados, setItensAgrupados] = useState([]);
    const [loadingItensAgrupados, setLoadingItensAgrupados] = useState(false);
    const [openItens, setOpenItens] = useState(false);
    const [selectedMaterials, setSelectedMaterials] = useState([]); // Agora armazena cod_material selecionados


    const [approvalModalOpen, setApprovalModalOpen] = useState(false);
    const [approvalItem, setApprovalItem] = useState(null);
    const [approvalStatus, setApprovalStatus] = useState(null);
    const [approvalJustificativa, setApprovalJustificativa] = useState("");

    const [groupBy, setGroupBy] = useState("cod_compra");
    const [solicitacoes, setSolicitacoes] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]); // <- NOVO
    const [loadingSolicitacao, setLoadingSolicitacao] = useState(false);
    const [error, setError] = useState(null);

    // ========= FETCH =========
    useEffect(() => {
        const fetchData = async () => {
            setLoadingSolicitacao(true);
            setError(null);
            try {
                const endpoint = `${import.meta.env.VITE_API_URL}/aprovarcompra/agrupado_material`;
                const response = await axios.get(endpoint, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                });
                setSolicitacoes(response.data);
            } catch (err) {
                console.error(err);
                setError("Erro ao buscar dados");
            } finally {
                setLoadingSolicitacao(false);
            }
        };
        fetchData();
    }, [groupBy]);

    const handleCloseItens = () => {
        setOpenItens(false);
        setSelectedItem(null);
    };

    // ========= CHECKBOX CORRIGIDO =========
    const handleCheckboxChange = (item, checked) => {
        if (checked) {
            // Adiciona apenas este item (já que está agrupado)
            setSelectedItems(prev => {
                // Verifica se o item já não está na lista
                const alreadyExists = prev.some(selectedItems =>
                    selectedItems.cod_material === item['Código']
                );
                if (alreadyExists) {
                    return prev;
                }
                return [...prev, item];
            });
        } else {
            // Remove apenas este item
            setSelectedItems(prev => prev.filter(selectedItems =>
                selectedItems['Código'] !== item['Código']
            ));
        }

    };
    useEffect(() => {
        console.log("Selecionados:", selectedItems);
    }, [selectedItems]);

    // Verifica se um material está selecionado
    const isMaterialSelected = (codMaterial) => {
        return selectedItems.some(item => item['Código'] === codMaterial);
    };

    const handleCloseJustificativa = () => setOpenJustificativa(false);

    const fetchDetalhesEFilial = async (cod_compra) => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            // 1️⃣ Busca detalhes da compra do primeiro material (ou de todos, se quiser)
            const detalhesRes = await axios.get(
                `${import.meta.env.VITE_API_URL}/relatoriogeral/detalhescompra/${cod_compra}`,
                { headers }
            );
            const detalhesData = detalhesRes.data;

            // 2️⃣ Pega o id da filial a partir dos detalhes
            const filialId = detalhesData[0]?.filial_id || materiais[0].filial_id;

            // 3️⃣ Busca os dados da filial
            const filialRes = await axios.get(`${import.meta.env.VITE_API_URL}/filiais/${filialId}`, { headers });
            const filialData = filialRes.data;


            setData({ filial: filialData, detalhes: detalhesData });
        } catch (err) {
            console.error(err);
        }
    };

    const detalhesMaterial = async (cod_material) => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const detalhesRes = await axios.get(
                `${import.meta.env.VITE_API_URL}/detalhes/material/${cod_material}`,
                { headers }
            );
            return detalhesRes.data; // 🔹 retorna os detalhes
        } catch (err) {
            console.error(err);
            return null; // em caso de erro, retorna null
        }
    };



    // ========= EXPORTAR PDF =========
    const handleExportPDF = async () => {
        if (selectedItems.length === 0) {
            setSnackbarMessage("Nenhum item selecionado para exportar.");
            setSnackbarOpen(true);
            return;
        }
        fetchDetalhesEFilial(selectedItems[0].cod_compra);

        const detalhesMateriais = await Promise.all(
            selectedItems.map(item => detalhesMaterial(item['Código']))
        );
        console.log(detalhesMateriais)


        const doc = new jsPDF();

        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text("FFA INFRAESTRUTURA E SERVIÇOS LTDA", 105, 20, { align: "center" });

        doc.setLineWidth(0.5);
        doc.line(14, 25, 196, 25);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);

        let y = 32;

        const complemento = data.filial?.complemento ? `, ${data.filial.complemento}` : "";

        const linhas = [
            `${data.filial?.endereco}, ${data.filial?.numero}`,
            `${data.filial?.bairro} - ${data.filial?.cidade}/${data.filial?.estado}${complemento}`,
            `CEP: ${data.filial?.cep}`,
            `CNPJ: ${data.filial?.CNPJ}`,
            `Telefone: ${data.filial?.telefone}`,
            `${data.filial?.mail}`
        ];

        linhas.forEach(linha => {
            doc.text(linha, 14, y);
            y += 6;
        });

        doc.setLineWidth(0.5);
        doc.line(14, y + 5, 196, y + 5);

        const columns = ["Código", "Descrição", "Quantidade", "Unidade", "Valor Unitário", "Valor Total"];
        const rows = selectedItems.map((item, index) => {
            const detalhe = detalhesMateriais[index] || {};

            return [
                item['Código'] || item.cod_material || "",
                item.descricao || item["Descrição"] || "",
                item.quantidade || "",
                detalhe[0].unid || "",
            ];
        });

        autoTable(doc, {
            startY: 53,
            head: [columns],
            body: rows,
            styles: { fontSize: 10, cellPadding: 3 },
            headStyles: { fillColor: [22, 160, 133] },
        });


        doc.save("materiais_selecionados.pdf");
    };

    // ========= SNACKBAR =========
    const handleSnackbarClose = () => setSnackbarOpen(false);

    const handleOpenJustificativa = async (item) => {
        console.log(item["cod_compra"])
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/historico/${item["cod_compra"]}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setSelectedItem(response.data);
            setOpenJustificativa(true);
        } catch (error) {
            console.error("Erro ao buscar histórico:", error);
        }
    };

    const handleOpenItens = async (item) => {
            setSelectedItem(item);
            setOpenItens(true);
            setLoadingItensAgrupados(true);
    
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/itens_agrupados`,
                    {
                        params: { cod_material: item['Código'] },
                        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                    }
                );
    
                setItensAgrupados(response.data.data || []);
            } catch (error) {
                console.error(error);
                showSnackbar("Erro ao carregar itens agrupados");
                setItensAgrupados([]);
            } finally {
                setLoadingItensAgrupados(false);
            }
        };

    // ========= TABELA =========
    const dataWithActions = solicitacoes.map((item) => ({
        ...item,
        Justificativa: (
            <Tooltip title="Visualizar">
                <IconButton size="small" color="primary" onClick={() => handleOpenJustificativa(item)}>
                    <FiEye />
                </IconButton>
            </Tooltip>
        ),
        "Ver Solicitação": (
            <Box display="flex" height="100%" alignItems="center" gap={1}>
                <Tooltip title="Visualizar">
                    <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenItens(item)}
                        sx={{
                            backgroundColor: "rgba(25, 118, 210, 0.1)",
                            "&:hover": { backgroundColor: "rgba(25, 118, 210, 0.2)" },
                            transition: "background-color 0.3s ease",
                        }}
                    >
                        <FiEye />
                    </IconButton>
                </Tooltip>
            </Box>
        ),
        '': (
            <Checkbox
                size="small"
                color="primary"
                checked={isMaterialSelected(item['Código'])}
                onChange={(e) => handleCheckboxChange(item, e.target.checked)}
            />
        ),
    }));

    return (
        <div>
            <Card>
                <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h5">
                            Enviar Proposta
                        </Typography>

                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<FiFileText />}
                            onClick={handleExportPDF}
                            disabled={selectedItems.length === 0}
                        >
                            Exportar Selecionados
                        </Button>
                    </Box>

                    <DataGrid
                        data={dataWithActions || []}
                        loading={loadingSolicitacao}
                        error={error}
                        hiddenIndexes={[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18,]}
                        initialPageSize={10}
                    />
                </CardContent>
            </Card>

            <Backdrop
                open={loading}
                sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
            >
                <CircularProgress color="inherit" />
            </Backdrop>

            <CustomSnackbar
                open={snackbarOpen}
                onClose={handleSnackbarClose}
                message={snackbarMessage}
            />

            {/* Modal Justificativa */}
            <Modal open={openJustificativa} onClose={handleCloseJustificativa}>
                <Box
                    sx={{
                        p: 4,
                        maxWidth: 700,
                        mx: "auto",
                        bgcolor: "background.paper",
                        borderRadius: 3,
                        boxShadow: 3
                    }}
                >
                    {selectedItem && (
                        <>
                            <Typography
                                variant="h5"
                                mb={3}
                                fontWeight="bold"
                                color="primary.main"
                                textAlign="center"
                            >
                                Histórico da Solicitação
                            </Typography>

                            {selectedItem.length > 0 ? (
                                selectedItem.map((evento, index) => (
                                    <Paper
                                        key={index}
                                        elevation={1}
                                        sx={{
                                            p: 3,
                                            mb: 2.5,
                                            borderRadius: 2,
                                            borderLeft: "5px solid",
                                            borderColor: "primary.light",
                                            bgcolor: "grey.50"
                                        }}
                                    >
                                        <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                                            {evento.tipo} - {evento.etapa}
                                        </Typography>
                                        <Typography variant="body2" mb={1}>
                                            <strong>Data:</strong> {evento.data}
                                        </Typography>
                                        <Typography variant="body2" mb={1}>
                                            <strong>Responsável:</strong>{" "}
                                            {evento.responsavel_nome} ({evento.responsavel_matricula})
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{ whiteSpace: "pre-line", color: "text.secondary" }}
                                        >
                                            {evento.detalhes}
                                        </Typography>
                                    </Paper>
                                ))
                            ) : (
                                <Typography textAlign="center" color="text.secondary">
                                    Nenhum histórico encontrado.
                                </Typography>
                            )}

                            <Box display="flex" justifyContent="center" mt={3}>
                                <Button variant="contained" color="primary" onClick={handleCloseJustificativa}>
                                    Fechar
                                </Button>
                            </Box>
                        </>
                    )}
                </Box>
            </Modal>


            <Modal open={openItens} onClose={handleCloseItens}>
                <Box sx={{
                    p: 4,
                    maxWidth: 600,
                    mx: "auto",
                    bgcolor: "background.paper",
                    borderRadius: 3,
                    boxShadow: 3,
                    maxHeight: 600,
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {selectedItem && (
                        <>
                            {/* CABEÇALHO (não rola) */}
                            <Box>
                                <Typography variant="h6" mb={2} textAlign="center">
                                    Item - {selectedItem['Código']}
                                </Typography>
                                <Typography variant="subtitle1" mb={2} textAlign="center">
                                    Total do Item - {itensAgrupados.length > 0 ? itensAgrupados[0].total_quantidade : 0}
                                </Typography>
                            </Box>

                            <Box sx={{ overflowY: 'auto', flexGrow: 1, my: 2 }}>
                                {loadingItensAgrupados ? (
                                    <Box display="flex" justifyContent="center" my={2}>
                                        <CircularProgress size={24} />
                                    </Box>
                                ) : itensAgrupados.length === 0 ? (
                                    <Typography textAlign="center" color="text.secondary">
                                        Nenhum item encontrado.
                                    </Typography>
                                ) : (
                                    <>
                                        {itensAgrupados.map((i, idx) => (
                                            <Paper key={idx} sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
                                                <Typography><strong>Cod. Compra:</strong> {i.cod_compra}</Typography>
                                                <Typography><strong>Quantidade:</strong> {i.quantidade}</Typography>
                                            </Paper>
                                        ))}
                                    </>
                                )}
                            </Box>

                            {/* RODAPÉ (não rola) */}
                            <Box display="flex" justifyContent="center" mt={1}>
                                <Button variant="contained" color="primary" onClick={handleCloseItens}>
                                    Fechar
                                </Button>
                            </Box>
                        </>
                    )}
                </Box>
            </Modal>
        </div>
    );
}
