import { useEffect, useState } from "react";
import axios from "axios";

export default function useTodasSolicitacoes() {
    const [dataSolicitacao, setDataSolicitacao] = useState([]);
    const [loading, setLoading] = useState(false);
    const [getSolicitacao, setSolicitacao] = useState([]);
    const [error, setError] = useState(null);

    const URL_API = import.meta.env.VITE_API_URL + "/solicitacoesentregues";

    useEffect(() => {
        setLoading(true);
        const token = localStorage.getItem("token");
        axios
            .get(URL_API, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((response) => setSolicitacao(response.data))
            .catch((err) => {
                console.error("Erro ao buscar solicitações:", err);
                setError(err);
            })
            .finally(() => setLoading(false));
            console.log(token)
    }, [URL_API]);

    return {
        dataSolicitacao,
        setDataSolicitacao,
        getSolicitacao,
        setSolicitacao,
        loading,
        error,
    };
}