import React, { useState } from "react";
import { Button, Typography } from "@mui/material";
import axios from "axios";

const FileUpload = ({ cod_material, forn, arquivoAtual, handleFileChange }) => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const token = localStorage.getItem("token");

    const handleSelectFile = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return; // Nenhum arquivo selecionado, faz nada

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("arquivo", file);
            formData.append("cod_material", cod_material);
            formData.append("fornecedor", forn);

            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/uploadProposta`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            // O backend deve retornar a URL/caminho do arquivo salvo
            const caminhoArquivo = response.data?.caminho || null;
            handleFileChange(cod_material, forn, "arquivo", caminhoArquivo);

        } catch (err) {
            console.error("Erro ao enviar arquivo:", err);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div>
            <input
                type="file"
                onChange={handleSelectFile}
                style={{ marginBottom: 8 }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Button
                    variant="contained"
                    size="small"
                    onClick={handleUpload}
                    disabled={!file || uploading}
                >
                    {uploading ? "Enviando..." : "Enviar Proposta"}
                </Button>
                {arquivoAtual && (
                    <Typography variant="body2" color="textSecondary">
                        Arquivo atual: {arquivoAtual.split("/").pop()}
                    </Typography>
                )}
            </div>
        </div>
    );
};

export default FileUpload;
