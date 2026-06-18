import React, { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { CircularProgress, Box } from "@mui/material";
import axios from "axios";

function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // URL base do backend do .env
  const API_URL = import.meta.env.VITE_API_URL;

  const logout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        // Tenta fazer logout no backend
        await axios.post(`${API_URL}/logout`, {}, {
          headers: {
            Authorization: `Bearer ${token}`
          },
        }).catch(() => {
          console.log("Erro no logout backend - continuando logout local");
        });
      }
    } catch (error) {
      console.error("Erro ao deslogar no backend:", error);
    } finally {
      // SEMPRE remove o token e limpa headers
      localStorage.removeItem("token");
      delete axios.defaults.headers.common["Authorization"];
      setIsAuthenticated(false);
      setLoading(false);
    }
  };

  const handleAuthError = async () => {
    console.log('Erro de autenticação detectado');
    await logout();
  };

  const verifyToken = async (token) => {
    try {
      const response = await axios.get(`${API_URL}/verify-token`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Token válido - usuário autenticado');
      setIsAuthenticated(true);
      setLoading(false);

    } catch (error) {
      console.error("Token inválido ou expirado:", error);

      localStorage.removeItem("token");
      delete axios.defaults.headers.common["Authorization"];

      setIsAuthenticated(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      console.log('Iniciando verificação de autenticação...');
      const token = localStorage.getItem("token");

      if (!token) {
        console.log('Nenhum token encontrado - redirecionando para login');
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      console.log('Token encontrado - verificando validade...');
      await verifyToken(token);
    };

    checkAuth();
  }, []);

  // Interceptor para capturar respostas 401/403 globalmente
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const status = error.response?.status;

        if ((status === 401 || status === 403) && !window.location.pathname.includes('/auth')) {
          console.log(`Erro ${status} detectado - fazendo logout automático`);

          if (!error.config?.url?.includes('/logout') && !error.config?.url?.includes('/verify-token')) {
            await handleAuthError();
            navigate("/auth", { replace: true });
          }
          location.reload(true);
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [navigate]);

  console.log('ProtectedRoute - Estado atual:', {
    loading,
    isAuthenticated,
    hasToken: !!localStorage.getItem("token")
  });

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (isAuthenticated === false) {
    return <Navigate to="/auth" replace />;
  }

  if (isAuthenticated === true) {
    return children ?? <div>Componente não definido!</div>;
  }

  // fallback
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <CircularProgress />
    </Box>
  );
}

export default ProtectedRoute;
