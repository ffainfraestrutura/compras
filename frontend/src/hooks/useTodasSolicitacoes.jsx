// hooks/useTodasSolicitacoes.js (versão simples otimizada)
import { useEffect, useState } from "react";
import axios from "axios";

export default function useTodasSolicitacoes() {
    const [getSolicitacao, setSolicitacao] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const URL_API = import.meta.env.VITE_API_URL + "/todassolicitacoes";

    useEffect(() => {
        let isMounted = true;
        
        const fetchData = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem("token");
                
                // Adicionar timeout para não travar
                const response = await axios.get(URL_API, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                
                if (isMounted) {
                    setSolicitacao(response.data);
                    setError(null);
                }
            } catch (err) {
                console.error("Erro ao buscar solicitações:", err);
                if (isMounted) {
                    setError(err);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };
        
        fetchData();
        
        return () => {
            isMounted = false;
        };
    }, [URL_API]);
    

    return {
        getSolicitacao,
        setSolicitacao,
        loading,
        error,
    };
}