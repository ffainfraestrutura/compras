import { useEffect, useState } from "react";
import axios from "axios";

export default function useFiliais() {
  const [filiais, setFiliais] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const URL_API = import.meta.env.VITE_API_URL + "/filiais";

  useEffect(() => {
    setLoading(true);
    axios
      .get(URL_API)
      .then((response) => setFiliais(response.data))
      .catch((err) => {
        console.error("Erro ao buscar filiais:", err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [URL_API]);

  return { filiais, loading, error };
}
