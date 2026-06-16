import { useEffect, useState } from "react";
import axios from "axios";

export default function useCcustos() {
  const [ccustos, setCcustos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const URL_API = import.meta.env.VITE_API_URL + "/ccusto";

  useEffect(() => {
    const token = localStorage.getItem("token");

    setLoading(true);

    axios
      .get(URL_API, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => setCcustos(response.data))
      .catch((err) => {
        console.error("Erro ao buscar ccustos:", err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [URL_API]);

  return { ccustos, loading, error };
}