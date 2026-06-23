import {
    Box,
    Button,
    Drawer,
    Typography,
    Divider,
    Card,
    CardContent,
    IconButton,
    TextField,
    Autocomplete,
    CircularProgress,
    LinearProgress,
    Chip,
    Alert,
    Snackbar,
} from "@mui/material";
import { FiMinus, FiPlus, FiTrash2, FiUpload, FiFile, FiX, FiPaperclip, FiAlertCircle } from "react-icons/fi";
import { useState, useRef } from "react";
import * as XLSX from 'xlsx';

const MAX_FILES = 3;
const MAX_SIZE_MB = 20;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = ["pdf", "xlsx", "xls", "jpg", "jpeg", "png"];
const ALLOWED_TYPES_DESCRIPTION = "PDF, XLSX, XLS, JPG, JPEG, PNG";

function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExt(filename) {
    return filename.split(".").pop().toLowerCase();
}

// Função para converter XLS para XLSX
async function convertXlsToXlsx(file) {
    return new Promise((resolve, reject) => {
        if (!file.name.toLowerCase().endsWith('.xls')) {
            resolve(file);
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { 
                    type: 'array',
                    cellDates: true,
                    cellNF: false,
                    cellText: false
                });
                
                const xlsxData = XLSX.write(workbook, { 
                    type: 'array', 
                    bookType: 'xlsx',
                    bookSST: false
                });
                
                const newFileName = file.name.replace(/\.xls$/i, '.xlsx');
                const convertedFile = new File([xlsxData], newFileName, {
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                });
                
                resolve(convertedFile);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

function FileUploadSection({ arquivos, onAddFiles, onRemoveFile, uploadProgress, isConverting, setIsConverting }) {
    const inputRef = useRef(null);
    const [dragOver, setDragOver] = useState(false);
    const [erroArquivo, setErroArquivo] = useState("");
    const [showWarning, setShowWarning] = useState(false);
    const [rejectedFiles, setRejectedFiles] = useState([]);

    const validarEAdicionarArquivos = async (novos) => {
        setErroArquivo("");
        const lista = Array.from(novos);
        const disponiveis = MAX_FILES - arquivos.length;

        if (disponiveis === 0) {
            setErroArquivo(`⚠️ Limite de ${MAX_FILES} arquivos atingido.`);
            return;
        }

        const paraAdicionar = lista.slice(0, disponiveis);
        const erros = [];
        const rejected = [];
        const arquivosParaConverter = [];
        const arquivosValidos = [];

        for (const file of paraAdicionar) {
            const ext = getFileExt(file.name);
            
            if (!ALLOWED_TYPES.includes(ext)) {
                const errorMsg = `"${file.name}": Tipo não permitido. Formatos aceitos: ${ALLOWED_TYPES_DESCRIPTION}`;
                erros.push(errorMsg);
                rejected.push({ name: file.name, reason: `Formato .${ext.toUpperCase()} não permitido.` });
                continue;
            }
            
            if (file.size > MAX_SIZE_BYTES) {
                const errorMsg = `"${file.name}": Tamanho máximo é ${MAX_SIZE_MB}MB.`;
                erros.push(errorMsg);
                rejected.push({ name: file.name, reason: `Arquivo excede ${MAX_SIZE_MB}MB` });
                continue;
            }
            
            if (ext === 'xls') {
                arquivosParaConverter.push(file);
            } else {
                arquivosValidos.push(file);
            }
        }

        if (erros.length) {
            setErroArquivo(erros.join(" "));
            setRejectedFiles(rejected);
            setShowWarning(true);
        }

        if (arquivosValidos.length) {
            onAddFiles(arquivosValidos);
        }

        if (arquivosParaConverter.length > 0 && setIsConverting) {
            setIsConverting(true);
            
            try {
                const convertedFiles = await Promise.all(
                    arquivosParaConverter.map(file => convertXlsToXlsx(file))
                );
                onAddFiles(convertedFiles);
            } catch (error) {
                console.error('Erro na conversão:', error);
                setErroArquivo(`Erro ao processar arquivo(s): ${error.message}`);
                setShowWarning(true);
            } finally {
                setIsConverting(false);
            }
        }
        
        if (inputRef.current) inputRef.current.value = "";
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        validarEAdicionarArquivos(e.dataTransfer.files);
    };

    const handleChange = (e) => {
        validarEAdicionarArquivos(e.target.files);
    };

    const handleCloseWarning = () => {
        setShowWarning(false);
        setRejectedFiles([]);
    };

    const extColor = (ext) => {
        const map = {
            pdf: "#e53935",
            xlsx: "#2e7d32",
            xls: "#ff9800",
            jpg: "#6a1b9a", 
            jpeg: "#6a1b9a", 
            png: "#6a1b9a",
        };
        return map[ext] || "#455a64";
    };

    const getFileIcon = (ext) => {
        if (ext === 'pdf') return '📄';
        if (ext === 'xlsx') return '📊';
        if (ext === 'xls') return '📊';
        if (['jpg', 'jpeg', 'png'].includes(ext)) return '🖼️';
        return '📎';
    };

    return (
        <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, display: "flex", alignItems: "center", gap: 0.5 }}>
                <FiPaperclip size={14} />
                Anexos
                <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                    (até {MAX_FILES} arquivos · máx. {MAX_SIZE_MB}MB cada)
                </Typography>
            </Typography>

            {/* Zona de drop */}
            {arquivos.length < MAX_FILES && (
                <Box
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    sx={{
                        border: `2px dashed`,
                        borderColor: dragOver ? "primary.main" : "divider",
                        borderRadius: 2,
                        p: 2.5,
                        textAlign: "center",
                        cursor: "pointer",
                        bgcolor: dragOver ? "primary.50" : "grey.50",
                        transition: "all 0.2s",
                        "&:hover": { borderColor: "primary.main", bgcolor: "primary.50" },
                        mb: 1.5,
                    }}
                >
                    <FiUpload size={22} color="#90a4ae" />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Arraste arquivos aqui ou <Typography component="span" color="primary" sx={{ fontWeight: 600 }}>clique para selecionar</Typography>
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                        PDF, XLS, XLSX, JPG, PNG — {arquivos.length}/{MAX_FILES} adicionados
                    </Typography>
                    <input
                        ref={inputRef}
                        type="file"
                        multiple
                        accept=".pdf,.xls,.xlsx,.jpg,.jpeg,.png"
                        style={{ display: "none" }}
                        onChange={handleChange}
                    />
                </Box>
            )}

            {isConverting && (
                <Box sx={{ mb: 2 }}>
                    <LinearProgress />
                </Box>
            )}

            {/* Mensagem de erro */}
            {erroArquivo && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setErroArquivo("")}>
                    <Typography variant="body2">{erroArquivo}</Typography>
                </Alert>
            )}

            {/* Snackbar para arquivos rejeitados */}
            <Snackbar
                open={showWarning}
                autoHideDuration={6000}
                onClose={handleCloseWarning}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert 
                    onClose={handleCloseWarning} 
                    severity="warning" 
                    variant="filled"
                    sx={{ width: '100%', borderRadius: 2 }}
                >
                    <Typography variant="subtitle2" fontWeight="bold">
                        Arquivos rejeitados:
                    </Typography>
                    {rejectedFiles.map((file, idx) => (
                        <Typography key={idx} variant="caption" component="div" sx={{ mt: 0.5 }}>
                            • {file.name}: {file.reason}
                        </Typography>
                    ))}
                </Alert>
            </Snackbar>

            {/* Lista de arquivos */}
            {arquivos.map((file, idx) => {
                const ext = getFileExt(file.name);
                const progress = uploadProgress?.[idx];
                
                return (
                    <Box
                        key={idx}
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            p: 1.2,
                            mb: 1,
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: "divider",
                            bgcolor: "background.paper",
                        }}
                    >
                        <Box
                            sx={{
                                width: 36,
                                height: 36,
                                borderRadius: 1.5,
                                bgcolor: extColor(ext),
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                            }}
                        >
                            <Typography variant="body2" sx={{ color: "#fff" }}>
                                {getFileIcon(ext)}
                            </Typography>
                        </Box>

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                                {file.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {formatBytes(file.size)}
                            </Typography>
                            {progress !== undefined && progress < 100 && (
                                <LinearProgress
                                    variant="determinate"
                                    value={progress}
                                    sx={{ mt: 0.5, height: 3, borderRadius: 2 }}
                                />
                            )}
                        </Box>

                        <Chip
                            label={ext.toUpperCase()}
                            size="small"
                            sx={{
                                bgcolor: extColor(ext),
                                color: "#fff",
                                fontSize: "0.6rem",
                                height: 20,
                                fontWeight: 700,
                            }}
                        />

                        <IconButton size="small" onClick={() => onRemoveFile(idx)} sx={{ color: "error.main", flexShrink: 0 }}>
                            <FiX size={14} />
                        </IconButton>
                    </Box>
                );
            })}
        </Box>
    );
}

function DetailsDrawer({
    open,
    onClose,
    onConfirm,
    dados = [],
    title,
    subtitle,
    confirmButtonText = "Confirmar",
    cancelButtonText = "Voltar",
    quantityField = "quantidade",
    visibleFields = [],
    onUpdateItem,
    onRemoveItem,
    filiais = [],
    ccustos = [],
    loading = false,
}) {
    const [justificativa, setJustificativa] = useState("");
    const [filialSelecionada, setFilialSelecionada] = useState(null);
    const [errorFilial, setErrorFilial] = useState(false);
    const [ccustoSelecionada, setCcustoSelecionada] = useState(null);
    const [errorCcusto, setErrorCcusto] = useState(false);
    const [arquivos, setArquivos] = useState([]);
    const [uploadProgress, setUploadProgress] = useState({});
    const [isConverting, setIsConverting] = useState(false);

    const totalItens = dados.reduce(
        (total, item) => total + Number(item[quantityField] || 1),
        0
    );

    const handleQuantityChange = (item, change) => {
        const current = Number(item[quantityField] || 1);
        const updated = Math.max(1, current + change);
        onUpdateItem({ ...item, [quantityField]: updated });
    };

    const handleAddFiles = (novos) => {
        setArquivos((prev) => [...prev, ...novos]);
    };

    const handleRemoveFile = (idx) => {
        setArquivos((prev) => prev.filter((_, i) => i !== idx));
        setUploadProgress((prev) => {
            const copia = { ...prev };
            delete copia[idx];
            return copia;
        });
    };

    const handleConfirm = () => {
        let hasError = false;
        if (!filialSelecionada) { setErrorFilial(true); hasError = true; }
        if (!ccustoSelecionada) { setErrorCcusto(true); hasError = true; }
        if (hasError) return;

        onConfirm(justificativa, filialSelecionada, ccustoSelecionada, arquivos);
    };

    const filiaisArray = Array.isArray(filiais) ? filiais : [];
    const ccustoArray = Array.isArray(ccustos) ? ccustos : [];

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    width: { xs: "100%", sm: 500 },
                    p: 3,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                },
            }}
        >
            <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
                {/* Cabeçalho */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>{title}</Typography>
                    <Typography variant="body2" color="text.secondary">{subtitle}</Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Filial */}
                <Box sx={{ mb: 3 }}>
                    <Autocomplete
                        options={filiaisArray}
                        getOptionLabel={(option) => option?.nome || option?.descricao || option?.fantasia || ""}
                        value={filialSelecionada}
                        onChange={(_, newValue) => { setFilialSelecionada(newValue); setErrorFilial(false); }}
                        loading={loading}
                        loadingText="Carregando filiais..."
                        noOptionsText="Nenhuma filial encontrada"
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Filial para compra *"
                                fullWidth
                                required
                                error={errorFilial}
                                helperText={errorFilial && "Selecione uma filial"}
                                InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                        <>{loading && <CircularProgress size={20} />}{params.InputProps.endAdornment}</>
                                    ),
                                }}
                            />
                        )}
                        isOptionEqualToValue={(option, value) => option?.id === value?.id}
                        disabled={loading}
                    />
                </Box>

                {/* Centro de Custo */}
                <Box sx={{ mb: 3 }}>
                    <Autocomplete
                        options={ccustoArray}
                        getOptionLabel={(option) => option?.nome || option?.descricao || ""}
                        value={ccustoSelecionada}
                        onChange={(_, newValue) => { setCcustoSelecionada(newValue); setErrorCcusto(false); }}
                        loading={loading}
                        loadingText="Carregando centros de custo..."
                        noOptionsText="Nenhum centro de custo encontrado"
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Centro de Custo para compra *"
                                fullWidth
                                required
                                error={errorCcusto}
                                helperText={errorCcusto && "Selecione um Centro de Custo"}
                                InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                        <>{loading && <CircularProgress size={20} />}{params.InputProps.endAdornment}</>
                                    ),
                                }}
                            />
                        )}
                        isOptionEqualToValue={(option, value) => option?.id === value?.id}
                        disabled={loading}
                    />
                </Box>

                {/* Resumo */}
                <Card sx={{ mb: 3, bgcolor: "#f5f5f5" }}>
                    <CardContent>
                        <Typography variant="subtitle2" gutterBottom>Resumo</Typography>
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                            <Typography><strong>Total de itens:</strong> {dados.length}</Typography>
                            <Typography><strong>Quantidade total:</strong> {totalItens}</Typography>
                        </Box>
                    </CardContent>
                </Card>

                {/* Justificativa */}
                <TextField
                    label="Justificativa *"
                    multiline
                    minRows={3}
                    value={justificativa}
                    onChange={(e) => setJustificativa(e.target.value)}
                    fullWidth
                    required
                    sx={{ mb: 3 }}
                />

                {/* Upload de Arquivos */}
                <FileUploadSection
                    arquivos={arquivos}
                    onAddFiles={handleAddFiles}
                    onRemoveFile={handleRemoveFile}
                    uploadProgress={uploadProgress}
                    isConverting={isConverting}
                    setIsConverting={setIsConverting}
                />

                {/* Lista de itens */}
                {dados.length > 0 ? (
                    <Box sx={{ maxHeight: 300, overflowY: "auto", pr: 1 }}>
                        {dados.map((item, idx) => (
                            <Card key={item.id || idx} sx={{ mb: 2 }}>
                                <CardContent sx={{ p: 2 }}>
                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <IconButton onClick={() => onRemoveItem(item)} color="error" size="small">
                                            <FiTrash2 />
                                        </IconButton>

                                        <Box sx={{ flex: 1, px: 2 }}>
                                            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 1 }}>
                                                {visibleFields.map(({ key, label }) =>
                                                    item[key] ? (
                                                        <Typography key={key} variant="body2">
                                                            <strong>{label}:</strong> {String(item[key])}
                                                        </Typography>
                                                    ) : null
                                                )}
                                            </Box>
                                        </Box>

                                        <Box sx={{ bgcolor: "primary.main", color: "white", px: 1, py: 0.5, borderRadius: 2, display: "flex", alignItems: "center", gap: 1 }}>
                                            <IconButton size="small" sx={{ color: "white" }} onClick={() => handleQuantityChange(item, -1)}>
                                                <FiMinus />
                                            </IconButton>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {item[quantityField] || 1}
                                            </Typography>
                                            <IconButton size="small" sx={{ color: "white" }} onClick={() => handleQuantityChange(item, 1)}>
                                                <FiPlus />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                ) : (
                    <Box sx={{ textAlign: "center", py: 4 }}>
                        <Typography variant="h6" color="text.secondary">Nenhum item disponível</Typography>
                    </Box>
                )}
            </Box>

            {/* Ações */}
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 4, pt: 2, borderTop: "1px solid #e0e0e0" }}>
                <Button variant="outlined" onClick={onClose}>{cancelButtonText}</Button>
                <Button
                    variant="contained"
                    onClick={handleConfirm}
                    disabled={
                        dados.length === 0 ||
                        justificativa.trim() === "" ||
                        !filialSelecionada ||
                        !ccustoSelecionada ||
                        loading ||
                        isConverting
                    }
                >
                    {confirmButtonText}
                </Button>
            </Box>
        </Drawer>
    );
}

export default DetailsDrawer;