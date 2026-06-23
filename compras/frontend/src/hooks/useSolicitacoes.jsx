import { useEffect, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

export default function useSolicitacoes(gestaoMaterial) {
  const [dataSolicitacao, setDataSolicitacao] = useState([]);
  const [loading, setLoading] = useState(false);
  const [getSolicitacao, setSolicitacao] = useState([]);
  const [error, setError] = useState(null);

  const URL_API = API + "/aprovarcompra";

  useEffect(() => {
    setLoading(true);
    const token = localStorage.getItem("token");
    axios
      .get(URL_API, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => setSolicitacao(response.data))
      .catch((err) => {
        console.error("Erro ao buscar solicitacoes:", err);
        setError(err);
      })
      .finally(() => setLoading(false));
  }, [URL_API, gestaoMaterial]);

  const handleUpdateItem = (updatedItem) => {
    setDataSolicitacao((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );
  };

  const updateItemField = (id, field, value) => {
    setDataSolicitacao((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveItem = (itemToRemove) => {
    setDataSolicitacao((prev) =>
      prev.filter((item) => item.id !== itemToRemove.id)
    );
  };

  const enviarSolicitacoes = async (
    justificativa,
    filial,
    ccusto,
    arquivos = [],
    onSuccess,
    onError
  ) => {
    if (!filial) {
      onError?.("Selecione uma filial para compra");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const codCompra = Math.floor(Date.now() / 1000)
        .toString(36)
        .toUpperCase();

      // 1. Envia cada item da solicitacao
      for (const item of dataSolicitacao) {
        await axios.post(
          API + "/solcompra",
          {
            cod_material: item["CodMaterial"],
            solicitante: localStorage.getItem("matricula"),
            quantidade: item.quantidade,
            cod_compra: codCompra,
            ccusto: ccusto.descricao,
            justificativa_solicitante: justificativa,
            filial_id: filial.idtbfilial,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      // 2. Envia arquivos (se houver)
      const listaArquivos = Array.from(arquivos ?? []).filter(
        (f) => f instanceof File
      );

      console.log("=== DEBUG UPLOAD ===");
      console.log("arquivos recebidos:", arquivos);
      console.log("listaArquivos filtrados:", listaArquivos);
      console.log("cod_compra:", codCompra);

      if (listaArquivos.length > 0) {
        const formData = new FormData();
        formData.append("cod_compra", codCompra);

        listaArquivos.forEach((file) => {
          formData.append("files[]", file, file.name);
        });

        // Loga entradas do FormData para confirmar que os arquivos estao la
        for (const [key, value] of formData.entries()) {
          console.log(
            key,
            value instanceof File
              ? `File(${value.name}, ${value.size}B, ${value.type})`
              : value
          );
        }
        console.log("====================");

        const uploadRes = await axios.post(
          API + "/uploads/multiplo",
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              // SEM Content-Type — browser define o boundary automaticamente
            },
          }
        );

        console.log("Resposta upload:", uploadRes.data);

        if (!uploadRes.data?.success) {
          console.warn("Upload parcial:", uploadRes.data);
          onSuccess?.({
            aviso: "Solicitacao enviada, mas houve falha em alguns anexos.",
          });
          return;
        }
      }

      setDataSolicitacao([]);
      onSuccess?.();
    } catch (err) {
      console.error("Erro ao enviar solicitacoes:", err);

      const mensagem =
        err?.response?.data?.message ||
        err?.response?.data?.errors ||
        "Erro ao enviar solicitacoes";

      onError?.(Array.isArray(mensagem) ? mensagem.join("; ") : mensagem);
    } finally {
      setLoading(false);
    }
  };

  return {
    dataSolicitacao,
    setDataSolicitacao,
    handleUpdateItem,
    updateItemField,
    handleRemoveItem,
    enviarSolicitacoes,
    getSolicitacao,
    setSolicitacao,
    loading,
    error,
  };
}