import { useEffect, useState } from "react";
import axios from "axios";

export default function useCotacaoMaterial(cod_material) {
    const [materiais, setMateriais] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!cod_material) return; 
        setLoading(true);
        const token = localStorage.getItem("token");
        axios
            .get(`${import.meta.env.VITE_API_URL}/cotacaoMaterial/${cod_material}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((response) => {
                if (Array.isArray(response.data)) setMateriais(response.data);
            })
            .catch((err) => {
                console.error("Erro ao buscar materiais:", err);
                setError(err);
            })
            .finally(() => setLoading(false));
    }, [cod_material]);

    return {
        materiais,
        loading,
        error,
    };
}
