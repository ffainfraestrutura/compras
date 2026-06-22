import { useState } from "react";
import {
    Box,
    Button,
    Typography,
    LinearProgress,
    Alert,
    IconButton,
    Paper,
    Stack,
} from "@mui/material";

import axios from "axios";
import { FiFileText, FiUploadCloud, FiX } from "react-icons/fi";

const FileUpload = ({
    uploadUrl,
    onSuccess,
    onError,
    buttonText = "Importar Arquivo",
    title = "Importação de Arquivo Excel",
    subtitle = "Selecione um arquivo Excel (.xlsx ou .xls) para importar os dados"
}) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Valida o tipo do arquivo
    const validateFileType = (file) => {
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ];
        const fileExtension = file.name.split('.').pop().toLowerCase();

        return validTypes.includes(file.type) &&
            (fileExtension === 'xlsx' || fileExtension === 'xls');
    };

    // Formata o tamanho do arquivo
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Handle de seleção de arquivo
    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        setError(null);
        setSuccess(null);

        if (!file) return;

        if (!validateFileType(file)) {
            setError('Por favor, selecione apenas arquivos Excel (.xlsx ou .xls)');
            setSelectedFile(null);
            event.target.value = '';
            return;
        }

        setSelectedFile(file);
    };

    // Handle de drag and drop
    const handleDragOver = (event) => {
        event.preventDefault();
        event.stopPropagation();
    };

    const handleDrop = (event) => {
        event.preventDefault();
        event.stopPropagation();

        const file = event.dataTransfer.files[0];
        setError(null);
        setSuccess(null);

        if (!file) return;

        if (!validateFileType(file)) {
            setError('Por favor, selecione apenas arquivos Excel (.xlsx ou .xls)');
            setSelectedFile(null);
            return;
        }

        setSelectedFile(file);
    };

    // Upload do arquivo
    const handleUpload = async () => {
        if (!selectedFile) {
            setError('Por favor, selecione um arquivo primeiro');
            return;
        }

        setIsUploading(true);
        setError(null);
        setSuccess(null);
        setUploadProgress(0);

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const token = localStorage.getItem("token");
            const matricula = localStorage.getItem("matricula");

            // Adiciona o solicitante no FormData
            formData.append('solicitante', matricula);

            const response = await axios.post(uploadUrl, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`, // Importante: adicionar "Bearer " antes do token
                },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const percentComplete = (progressEvent.loaded / progressEvent.total) * 100;
                        setUploadProgress(percentComplete);
                    }
                },
            });

            setSuccess('Arquivo importado com sucesso!');
            setSelectedFile(null);
            setUploadProgress(100);

            // Limpa o input file
            const fileInput = document.getElementById('file-upload-input');
            if (fileInput) fileInput.value = '';

            // Callback de sucesso
            if (onSuccess) onSuccess(response.data);

        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Erro ao importar arquivo';
            setError(errorMessage);
            if (onError) onError(err);
        } finally {
            setIsUploading(false);
        }
    };

    // Remove o arquivo selecionado
    const handleRemoveFile = () => {
        setSelectedFile(null);
        setError(null);
        setSuccess(null);
        setUploadProgress(0);
        const fileInput = document.getElementById('file-upload-input');
        if (fileInput) fileInput.value = '';
    };

    return (
        <Box sx={{ mt: 2 }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    {title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {subtitle}
                </Typography>
            </Box>

            <Paper
                variant="outlined"
                sx={{
                    p: 4,
                    textAlign: 'center',
                    cursor: 'pointer',
                    border: '2px dashed',
                    borderColor: selectedFile ? 'success.main' : 'divider',
                    bgcolor: selectedFile ? 'action.hover' : 'background.paper',
                    transition: 'all 0.2s',
                    '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'action.hover',
                    },
                }}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-upload-input')?.click()}
            >
                <input
                    id="file-upload-input"
                    type="file"
                    accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                    onChange={handleFileSelect}
                    disabled={isUploading}
                    style={{ display: 'none' }}
                />

                <FiUploadCloud sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />

                <Typography variant="body1" gutterBottom>
                    {selectedFile ? 'Arquivo selecionado:' : 'Clique ou arraste um arquivo aqui'}
                </Typography>

                {selectedFile && !isUploading && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'action.selected', borderRadius: 1 }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <FiFileText color="primary" />
                            <Typography variant="body2" sx={{ flex: 1 }}>
                                {selectedFile.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {formatFileSize(selectedFile.size)}
                            </Typography>
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveFile();
                                }}
                                disabled={isUploading}
                            >
                                <FiX fontSize="small" />
                            </IconButton>
                        </Stack>
                    </Box>
                )}

                {!selectedFile && (
                    <Typography variant="caption" color="text.secondary">
                        Formatos aceitos: .xlsx, .xls
                    </Typography>
                )}
            </Paper>

            {isUploading && (
                <Box sx={{ mt: 2 }}>
                    <LinearProgress
                        variant="determinate"
                        value={uploadProgress}
                        sx={{ mb: 1 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                        {Math.round(uploadProgress)}% concluído
                    </Typography>
                </Box>
            )}

            {error && (
                <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mt: 2 }} onClose={() => setSuccess(null)}>
                    {success}
                </Alert>
            )}

            <Button
                variant="contained"
                startIcon={<FiUploadCloud />}
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                fullWidth
                sx={{ mt: 3 }}
            >
                {isUploading ? 'Importando...' : buttonText}
            </Button>
        </Box>
    );
};

export default FileUpload;