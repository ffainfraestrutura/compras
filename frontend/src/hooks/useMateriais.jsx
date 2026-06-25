import { useEffect, useState } from "react";
import axios from "axios";

export default function useMateriais(gestaoMaterial = null) {
  const [dataMaterials, setDataMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const URL_API = import.meta.env.VITE_API_URL + "/materiais";

  useEffect(() => {
    if (gestaoMaterial === null || gestaoMaterial === undefined) {
      setDataMaterials([]);
      setLoading(false);
      return;
    }
    const fetchMateriais = async () => {
      setLoading(true);
      setError(false);

      try {
        const token = localStorage.getItem("token");

        const response = await axios.get(URL_API, {
          params: { gestaoDescricao: gestaoMaterial },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setDataMaterials(response.data);
      } catch (err) {
        console.error("Erro ao buscar materiais:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchMateriais();
  }, [gestaoMaterial]);

  return { dataMaterials, setDataMaterials, loading, error };
}