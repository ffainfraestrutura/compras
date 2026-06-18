/**
 * useUploadDocumentos
 *
 * Hook para enviar até 3 arquivos via POST /api/uploads/multiplo
 *
 * Uso:
 *   const { uploadDocumentos, uploading, progresso } = useUploadDocumentos();
 *
 *   // Dentro do onConfirm do DetailsDrawer:
 *   const resultado = await uploadDocumentos(codCompra, arquivos);
 */

import { useState } from "react";
import axios from "axios";

export function useUploadDocumentos() {
    const [uploading, setUploading] = useState(false);
    const [progresso, setProgresso] = useState({});   // { [fileIndex]: 0-100 }
    const [erros, setErros] = useState([]);

    /**
     * @param {string} codCompra  - código da compra gerado após salvar a solicitação
     * @param {File[]} arquivos   - array de File (máx. 3, máx. 20MB cada)
     * @returns {Promise<{success: boolean, data: any[]}>}
     */
    const uploadDocumentos = async (codCompra, arquivos) => {
        if (!arquivos || arquivos.length === 0) {
            return { success: true, data: [] };
        }

        setUploading(true);
        setErros([]);
        setProgresso({});

        try {
            const formData = new FormData();
            formData.append("cod_compra", codCompra);

            arquivos.forEach((file) => {
                formData.append("files[]", file);   // back espera files[]
            });

            const response = await axios.post("/api/uploads/multiplo", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                onUploadProgress: (event) => {
                    if (event.total) {
                        const pct = Math.round((event.loaded * 100) / event.total);
                        // Distribui o progresso global entre todos os arquivos
                        const progressoPorArquivo = {};
                        arquivos.forEach((_, idx) => {
                            progressoPorArquivo[idx] = pct;
                        });
                        setProgresso(progressoPorArquivo);
                    }
                },
            });

            if (response.data?.errors?.length) {
                setErros(response.data.errors.map((e) => e.error || e));
            }

            return {
                success: response.data.success,
                data: response.data.data ?? [],
                message: response.data.message,
            };
        } catch (error) {
            const mensagem =
                error?.response?.data?.message ||
                error?.response?.data?.errors ||
                "Erro ao enviar arquivos.";

            const lista = Array.isArray(mensagem) ? mensagem : [mensagem];
            setErros(lista);

            return { success: false, data: [], message: lista.join("; ") };
        } finally {
            setUploading(false);
        }
    };

    return { uploadDocumentos, uploading, progresso, erros };
}