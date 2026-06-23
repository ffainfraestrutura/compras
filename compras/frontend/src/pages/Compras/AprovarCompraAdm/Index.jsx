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
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    TextField,
    Tooltip,
    Typography
} from "@mui/material";
import { FiAlertTriangle, FiArrowLeft, FiCheck, FiEye, FiSend, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import CustomSnackbar from "../../../components/SnackBar/SnackBar";
import DataGrid from "../../../components/DataGrid/DataGrid";
import Modal from "../../../components/Modal/Modal";

export default function Index() {
    const navigate = useNavigate();
    const nivelAcesso = Number(localStorage.getItem("nivel_acesso"));

    const [loading, setLoading] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");

    const [groupBy, setGroupBy] = useState("cod_compra");
    const [solicitacoes, setSolicitacoes] = useState([]);
    const [loadingSolicitacao, setLoadingSolicitacao] = useState(false);
    const [error, setError] = useState(null);
    // ======================================
    // Modal Justificativa
    const [openJustificativa, setOpenJustificativa] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [itensAgrupados, setItensAgrupados] = useState([]);
    const [loadingItensAgrupados, setLoadingItensAgrupados] = useState(false);
    const [openItens, setOpenItens] = useState(false);

    // Modal Aprovação
    const [approvalModalOpen, setApprovalModalOpen] = useState(false);
    const [approvalItem, setApprovalItem] = useState(null);
    const [approvalStatus, setApprovalStatus] = useState(null);
    const [approvalJustificativa, setApprovalJustificativa] = useState("");

    // Modal Voltar Processo
    const [backProcessOpen, setBackProcessOpen] = useState(false);
    const [backItem, setBackItem] = useState(null);
    const [justificativaVolta, setJustificativaVolta] = useState("");
    const [selectedBackLevel, setSelectedBackLevel] = useState("");

    // Modal Retorno
    const [returnModalOpen, setReturnModalOpen] = useState(false);
    const [returnData, setReturnData] = useState([]);
    const [returnComment, setReturnComment] = useState("");
    const [cotacoes, setCotacoes] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            setLoadingSolicitacao(true);
            setError(null);
            try {
                const endpoint = `${import.meta.env.VITE_API_URL}/aprovarcompraadm`
                const response = await axios.get(endpoint, {
                    headers:
                        { Authorization: `Bearer ${localStorage.getItem("token")}` }
                });
                console.log(response)
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


    // ======================================
    // Snackbar
    const showSnackbar = (message) => {
        setSnackbarMessage(message);
        setSnackbarOpen(true);
    };
    const handleSnackbarClose = () => setSnackbarOpen(false);

    const handleCloseItens = () => {
        setOpenItens(false);
        setSelectedItem(null);
    };

    // ======================================
    // Funções Modais
    const handleOpenJustificativa = async (item) => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/historico/${item["Cod. Compra"]}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setSelectedItem(response.data);
            setOpenJustificativa(true);
        } catch (error) {
            console.error("Erro ao buscar histórico:", error);
        }
    };

    const handleCloseJustificativa = () => setOpenJustificativa(false);

    const handleOpenApprovalModal = (item, status) => {
        console.log(item)
        setApprovalItem(item);
        setApprovalStatus(status);
        setApprovalJustificativa("");
        setApprovalModalOpen(true);
    };
    const handleCloseApprovalModal = () => {
        setApprovalItem(null);
        setApprovalStatus(null);
        setApprovalJustificativa("");
        setApprovalModalOpen(false);
    };



    const handleSubmitApproval = async () => {
        if (!approvalJustificativa.trim()) {
            showSnackbar("Informe uma justificativa para continuar.");
            return;
        }
        try {
            setLoading(true);
            const camposAceite = {
                2: { aceite: "aceite_material", justificativa: "justificativa_material", matricula: "matricula_material" },
                3: { aceite: "aceite_compra", justificativa: "justificativa_compra", matricula: "matricula_compra" },
                4: { aceite: "aceite_diretor", justificativa: "justificativa_diretor", matricula: "matricula_diretor" },
                5: { aceite: "aceite_diretor", justificativa: "justificativa_diretor", matricula: "matricula_diretor" },
                6: { aceite: "aceite_diretor", justificativa: "justificativa_diretor", matricula: "matricula_diretor" },
                7: { aceite: "aceite_gerente", justificativa: "justificativa_gerente", matricula: "matricula_gerente" }

            };
            const campos = camposAceite[nivelAcesso];
            if (!campos) {
                showSnackbar("Permissão inválida para atualizar esta solicitação.");
                return;
            }
            console.log(approvalItem)
            const payload = {
                cod_compra: approvalItem["cod_compra"],
                cod_cotacao: approvalItem["cod_cotacao"],
                [campos.aceite]: approvalStatus,
                [campos.justificativa]: approvalJustificativa,
                [campos.matricula]: localStorage.getItem("matricula")
            };
            await axios.put(`${import.meta.env.VITE_API_URL}/aprovarcompra`, payload, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            showSnackbar("Decisão registrada com sucesso!");
            handleCloseApprovalModal();
            window.location.reload()
        } catch (error) {
            console.error(error.response?.data || error.message);
            showSnackbar("Erro ao registrar decisão!");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenBackProcess = async (item) => {
        try {
            setLoading(true);
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/retornos/${item["cod_compra"]}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            setReturnData(response.data);
            setBackItem(item);
            setJustificativaVolta("");
            setSelectedBackLevel("");
            setBackProcessOpen(true);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };
    const handleCloseBackProcess = () => {
        setBackItem(null);
        setBackProcessOpen(false);
    };

    const handleOpenReturnModal = async (codCompra) => {
        try {
            setLoading(true);
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/retornos/${codCompra}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            setReturnData(response.data);
            setReturnComment("");
            setReturnModalOpen(true);
        } catch (error) {
            console.error(error);
            showSnackbar("Erro ao buscar informações de retorno.");
        } finally {
            setLoading(false);
        }
    };
    const handleCloseReturnModal = () => {
        setReturnData([]);
        setReturnComment("");
        setReturnModalOpen(false);
    };

    const handleSubmitFinalizarRetorno = async (codigos) => {
        if (!returnComment.trim()) {
            showSnackbar("Informe uma justificativa para continuar.");
            return;
        }
        try {
            setLoading(true);
            const payload = { cod_compra: codigos, justificativa: returnComment };
            await axios.put(`${import.meta.env.VITE_API_URL}/finalizarretorno`, payload, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            showSnackbar("Resposta registrada com sucesso!");
            handleCloseReturnModal();
            window.location.reload()
        } catch (error) {
            console.error(error.response?.data || error.message);
            showSnackbar("Erro ao registrar resposta!");
        } finally {
            setLoading(false);
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


    const handleSubmitRetorno = async () => {
        if (!backItem) {
            showSnackbar("Erro: Nenhuma solicitação selecionada.");
            return;
        }
        if (!selectedBackLevel) {
            showSnackbar("Selecione um setor de destino para retornar o processo.");
            return;
        }
        if (!justificativaVolta.trim()) {
            showSnackbar("A justificativa é obrigatória para retornar o processo.");
            return;
        }

        try {
            setLoading(true);

            const payload = {
                cod_compra: backItem["cod_compra"], // 3. Usando o estado "backItem"
                setor_destino: selectedBackLevel,
                justificativa: justificativaVolta
            };

            await axios.put(`${import.meta.env.VITE_API_URL}/retornarprocesso`, payload, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });

            showSnackbar("Solicitação retornada com sucesso!");
            handleCloseBackProcess(); // A função de fechar o modal é chamada aqui, após o sucesso
            window.location.reload();

        } catch (error) {
            console.error(error.response?.data || error.message);
            showSnackbar("Erro ao retornar solicitação!");
        } finally {
            setLoading(false);
        }
    }

    const niveisUsuarios = [
        { nivel: 1, nome: "Solicitante" },

    ];

    // Converter para número
    const userLevel = parseInt(localStorage.getItem("nivel_acesso"));

    // Lógica personalizada para filtragem
    const opcoesParaUsuario = niveisUsuarios.filter((u) => {
        if (userLevel === 7) {
            // Gerente só vê Solicitante
            return u.nivel === 1;
        } else if (userLevel >= 2 && userLevel <= 6) {
            // Usuários nível 2-6 veem todos abaixo deles + Gerente
            return u.nivel < userLevel || u.nivel === 7;
        }
        // Para outros níveis (se houver), retorna vazio
        return false;
    });

    // Manter a ordem desejada na exibição
    const niveisOrdenados = opcoesParaUsuario.sort((a, b) => {
        const ordemDesejada = [1, 7, 2, 3, 4, 5, 6];
        return ordemDesejada.indexOf(a.nivel) - ordemDesejada.indexOf(b.nivel);
    });
    // ======================================
    // Colunas e Título Dinâmico
    let tituloTabela = nivelAcesso === 3 ? "Realizar Cotações" : "Aprovar Solicitações";
    let hiddenIndexes = groupBy === 'cod_material'
        ? [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]
        : [3, 5, 6, 7, 8, 9, 10, 11, 12];
    if (nivelAcesso > 3) {
        tituloTabela = "Aprovar Cotação";
    }


    if (['4', '5', '6'].includes(userLevel)) {
        hiddenIndexes = [5, 6, 7, 8, 9, 10, 11];
    }

    const actionColumnName =
        [2, 4, 5, 6].includes(nivelAcesso)
            ? "Aprovar"
            : nivelAcesso === 3
                ? "Realizar Cotação"
                : "Ações";
    // const viewColumnName =
    //     [2, 4, 5].includes(nivelAcesso)
    //         ? "Ver Itens"
    //         : nivelAcesso === 3
    //             ? "Cotar Material"
    //             : "Ações";

    const dataWithActions = solicitacoes.map((item) => ({
        ...item,
        Justificativa: (
            <Tooltip title="Visualizar">
                <IconButton size="small" color="primary" onClick={() => handleOpenJustificativa(item)}>
                    <FiEye />
                </IconButton>
            </Tooltip>
        ),
        ...({
            "Ver Itens": (
                <Tooltip title="Visualizar">
                    <IconButton
                        size="small"
                        color="primary"
                        onClick={() => { navigate(`./DetalhesCompra/${item["Cod. Compra"]}`) }}
                    >
                        <FiEye />
                    </IconButton>
                </Tooltip>
            )
        }),
        ...(groupBy != 'cod_compra' && {
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
        }),

        ...(groupBy != 'cod_material' && {
            Perguntar: item.resposta_destino ? (
                <Tooltip title="Processo Respondido">
                    <IconButton
                        size="small"
                        sx={{ color: "success.main" }}
                        onClick={() => handleOpenReturnModal(item["cod_compra"])}
                    >
                        <FiCheck />
                    </IconButton>
                </Tooltip>
            ) : item.status == null ? (
                <Tooltip title="Voltar Processo">
                    <IconButton size="small" color="primary" onClick={() => handleOpenBackProcess(item)}>
                        <FiArrowLeft />
                    </IconButton>
                </Tooltip>
            ) : (
                <Tooltip title="Ver Justificativa de Retorno">
                    <IconButton
                        size="small"
                        sx={{ color: "warning.main" }}
                        onClick={() => handleOpenReturnModal(item["cod_compra"])}
                    >
                        <FiAlertTriangle />
                    </IconButton>
                </Tooltip>
            )
        }),
        [actionColumnName]:
            nivelAcesso === 3 ? (
                groupBy === 'cod_compra' ? (
                    <Button
                        onClick={() => navigate(`./CotarCompra/${item["cod_compra"]}`)}
                        variant="contained"
                        color="success"
                        fullWidth
                        disabled={item.status != null}
                    >
                        <FiSend />
                    </Button>
                ) : (
                    <Button
                        onClick={() => {
                            // MODIFICADO: Agora envia tanto cod_cotacao quanto cod_material
                            const cod_cotacao = item["ANY_VALUE(sc.cod_cotacao)"] ?? item["cod_cotacao"];
                            const cod_material = item["Código"];

                            console.log("Navegando para:", { cod_material, cod_cotacao }); // Debug

                            navigate(`./CotarMaterial/${cod_material}`, {
                                state: {
                                    cod_material: cod_material,
                                    cod_cotacao: cod_cotacao ?? cod_material  // NOVO: Passando cod_cotacao no state
                                }
                            });
                        }}
                        variant="contained"
                        color="success"
                        fullWidth
                    >
                        <FiSend />
                    </Button>
                )
            ) : item.finalizado == null && item.status == null ? (
                <Box display="flex" gap={1}>
                    <Button
                        variant="contained"
                        color="success"
                        onClick={() => handleOpenApprovalModal(item, 1)}
                        disabled={
                            (nivelAcesso === 4 && item.valor_total_cotacao >= 5000) || // Gestor só < 5000
                            (nivelAcesso === 5 && (item.valor_total_cotacao >= 50000))
                        }
                    >
                        <FiCheck />
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => handleOpenApprovalModal(item, 0)}
                        disabled={
                            (nivelAcesso === 4 && item.valor_total_cotacao >= 5000) ||
                            (nivelAcesso === 5 && (item.valor_total_cotacao >= 50000))
                        }
                    >
                        <FiX />
                    </Button>
                </Box>
            ) : item.status != null ? (
                <Box display="flex" gap={1}>
                    <Button variant="contained" color="success" disabled>
                        <FiCheck />
                    </Button>
                    <Button variant="contained" color="error" disabled>
                        <FiX />
                    </Button>
                </Box>
            ) : (
                <Button variant="contained" color="success">
                    Aprovado pelo CFO
                </Button>
            )
    }));

    return (
        <div>
            <Card>
                <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h5">{tituloTabela}</Typography>
                        {nivelAcesso == 3 && (
                            <FormControl variant="outlined" sx={{ minWidth: 200 }}>
                                <InputLabel id="groupby-label">Agrupar por</InputLabel>
                                <Select
                                    labelId="groupby-label"
                                    value={groupBy}
                                    onChange={(e) => setGroupBy(e.target.value)}
                                    label="Agrupar por"
                                >
                                    <MenuItem value="cod_compra">Pedidos</MenuItem>
                                    <MenuItem value="cod_material">Materiais</MenuItem>
                                </Select>
                            </FormControl>
                        )}
                    </Box>

                    <DataGrid
                        data={dataWithActions || []}
                        loading={loadingSolicitacao}
                        error={error}
                        hiddenIndexes={hiddenIndexes}
                        initialPageSize={10}
                    />
                </CardContent>
            </Card>

            <Backdrop open={loading} sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <CircularProgress color="inherit" />
            </Backdrop>

            <CustomSnackbar open={snackbarOpen} onClose={handleSnackbarClose} message={snackbarMessage} />

            {/* ================== Modais ================== */}

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

            {/* Modal Aprovação/Reprovação */}
            <Modal open={approvalModalOpen} title={approvalStatus === 1 ? "Aprovar Solicitação" : "Reprovar Solicitação"} onClose={handleCloseApprovalModal}>
                <Box display="flex" flexDirection="column" gap={2}>
                    <Typography>
                        {`Você está prestes a ${approvalStatus === 1 ? "aprovar" : "reprovar"} a solicitação `}
                        <strong>{approvalItem?.['Cod. Compra']}</strong>
                    </Typography>
                    <TextField
                        label="Justificativa"
                        multiline
                        rows={4}
                        fullWidth
                        value={approvalJustificativa}
                        onChange={(e) => setApprovalJustificativa(e.target.value)}
                        placeholder="Informe o motivo da decisão"
                    />
                    <Box display="flex" justifyContent="flex-end" gap={2} mt={1}>
                        <Button variant="outlined" onClick={handleCloseApprovalModal}>Cancelar</Button>
                        <Button variant="contained" color={approvalStatus === 1 ? "success" : "error"} onClick={handleSubmitApproval}>Confirmar</Button>
                    </Box>
                </Box>
            </Modal>

            {/* Modal Voltar Processo */}
            <Modal open={backProcessOpen} title={"Retornar Processo"} onClose={handleCloseBackProcess}>
                <Box display="flex" flexDirection="column" gap={2} p={2}>
                    {returnData.length !== 0 ? (
                        returnData.map((item, index) => (
                            <>
                                {/* Pergunta (Origem) */}
                                <Paper key={`${index}-origem`} elevation={1} sx={{ p: 2, mb: 2, borderRadius: 2, borderLeft: '5px solid', borderColor: 'primary.main', alignSelf: 'flex-start', maxWidth: '80%' }}>
                                    <Typography variant="subtitle2" fontWeight="bold" color="primary.dark">
                                        {item.nome_origem} - {niveisUsuarios.find(u => u.nivel === item.setor_origem)?.nome || `Setor ${item.setor_origem}`}
                                    </Typography>
                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line', color: 'text.primary' }}>{item.justificativa_origem}</Typography>
                                </Paper>

                                {/* Resposta (Destino) */}
                                <Paper key={`${index}-destino`} elevation={1} sx={{ p: 2, mb: 2, borderRadius: 2, borderRight: '5px solid', borderColor: 'success.main', alignSelf: 'flex-end', maxWidth: '80%' }}>
                                    <Typography variant="subtitle2" fontWeight="bold" color="success.dark" textAlign="right">
                                        {item.nome_destino} - {niveisUsuarios.find(u => u.nivel === item.setor_destino)?.nome || `Setor ${item.setor_destino}`}
                                    </Typography>
                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line', color: 'text.primary', textAlign: 'right' }}>{item.resposta_destino}</Typography>
                                </Paper>
                            </>
                        ))
                    ) : (
                        <>
                            <Typography>Para quem você deseja retornar o processo?</Typography>
                            <Select size="small" sx={{ minWidth: 200 }} value={selectedBackLevel} onChange={(e) => setSelectedBackLevel(e.target.value)}>
                                <MenuItem value=""><em>Selecione</em></MenuItem>
                                {niveisOrdenados.map(u => (<MenuItem key={u.nivel} value={u.nivel}>{u.nome}</MenuItem>))}
                            </Select>
                            <TextField
                                label="Justificativa"
                                value={justificativaVolta}
                                onChange={(e) => setJustificativaVolta(e.target.value)}
                                multiline
                                rows={4}
                                fullWidth
                                placeholder="Digite a justificativa da alteração..."
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                            <Box display="flex" justifyContent="flex-end" gap={2} mt={1}>
                                <Button variant="outlined" onClick={handleCloseBackProcess}>Cancelar</Button>
                                <Button variant="contained" onClick={() => { handleSubmitRetorno(); handleCloseBackProcess(); }}>Confirmar</Button>
                            </Box>
                        </>
                    )}
                </Box>
            </Modal>

            {/* Modal Justificativa de Retorno */}
            <Modal open={returnModalOpen} title="Justificativa de Retorno" onClose={handleCloseReturnModal}>
                <Box display="flex" flexDirection="column" gap={2} p={2}>
                    {returnData.length === 0 ? (
                        <Typography>Nenhuma justificativa de retorno encontrada.</Typography>
                    ) : (
                        returnData.map((item, index) => {
                            const setor = niveisUsuarios.find(u => u.nivel === item.setor_origem)?.nome || `Setor ${item.setor_origem}`;
                            return (
                                <Paper key={index} elevation={1} sx={{ p: 2, mb: 2, borderRadius: 2, borderLeft: '5px solid', borderColor: 'info.main', bgcolor: 'grey.50' }}>
                                    <Typography variant="subtitle2" fontWeight="bold">{item.nome_origem} - {setor}</Typography>
                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line', color: 'text.secondary' }}>{item.justificativa_origem}</Typography>
                                </Paper>
                            );
                        })
                    )}
                    <TextField
                        label="Adicionar resposta sobre o retorno"
                        multiline
                        rows={3}
                        fullWidth
                        value={returnComment}
                        onChange={(e) => setReturnComment(e.target.value)}
                        placeholder="Digite uma resposta..."
                    />
                    <Box display="flex" justifyContent="flex-end" gap={2} mt={1}>
                        <Button variant="outlined" onClick={handleCloseReturnModal}>Fechar</Button>
                        <Button variant="contained" color="primary" onClick={() => { const codigos = returnData.map(item => item.cod_compra).join(','); handleSubmitFinalizarRetorno(codigos); handleCloseReturnModal(); }}>Salvar resposta</Button>
                    </Box>
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
