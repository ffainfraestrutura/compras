// hooks/useMateriaisPorCentroCusto.js
import { useState, useEffect } from 'react';
import axios from 'axios';

const useMateriaisPorCentroCusto = (centroCusto) => {
    const [dataMaterials, setDataMaterials] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMateriais = async () => {
            if (!centroCusto) {
                setDataMaterials([]);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/materiais/por-centro-custo`,
                    {
                        params: { centro_custo: centroCusto },
                        headers: {
                            Authorization: localStorage.getItem("token"),
                        },
                    }
                );
                setDataMaterials(response.data);
            } catch (err) {
                setError("Erro ao carregar materiais");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchMateriais();
    }, [centroCusto]);

    const refreshMaterials = () => {
        if (centroCusto) {
            const fetchMateriais = async () => {
                setLoading(true);
                try {
                    const response = await axios.get(
                        `${import.meta.env.VITE_API_URL}/materiais/por-centro-custo`,
                        {
                            params: { centro_custo: centroCusto },
                            headers: {
                                Authorization: localStorage.getItem("token"),
                            },
                        }
                    );
                    setDataMaterials(response.data);
                } catch (err) {
                    setError("Erro ao carregar materiais");
                } finally {
                    setLoading(false);
                }
            };
            fetchMateriais();
        }
    };

    return { dataMaterials, loading, error, refreshMaterials };
};

export default useMateriaisPorCentroCusto;