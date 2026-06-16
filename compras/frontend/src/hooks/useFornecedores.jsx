import axios from "axios";
import { useEffect, useState } from "react";

export default function useFornecedores() {
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const URL_API = import.meta.env.VITE_API_URL + "/fornecedores";

  useEffect(() => {
    setLoading(true);
    axios.get(URL_API)
      .then(res => setFornecedores(res.data))
      .catch(err => {
        console.error(err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [URL_API]);

  return { fornecedores, loading, error };
}
