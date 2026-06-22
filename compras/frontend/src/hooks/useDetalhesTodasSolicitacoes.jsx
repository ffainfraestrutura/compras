import { useEffect, useState } from "react";
import axios from "axios";

export default function useDetalhesTodasSolicitacao(cod_Compra = null) {
  const [dataDetails, setDataDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!cod_Compra) return;
    console.log(cod_Compra)

    const URL_API = `${import.meta.env.VITE_API_URL}/relatoriogeral/detalhescompra/${cod_Compra}`;
    const token = localStorage.getItem("token");
    setLoading(true);

    axios
      .get(URL_API, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => setDataDetails(response.data))
      .catch((err) => {
        console.error("Erro ao buscar materiais:", err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [cod_Compra]);


  return { dataDetails, setDataDetails, loading, error };
}
