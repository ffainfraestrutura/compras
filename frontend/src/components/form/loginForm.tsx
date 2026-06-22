import React, { useState } from "react";
import "./loginForm.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faEye,
  faEyeSlash,
  faLock,
} from "@fortawesome/free-solid-svg-icons";
import {
  TextField,
  Button,
  Box,
  IconButton,
  InputAdornment,
  Snackbar,
  Slide,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

interface LoginFormProps {
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  credentials: { matricula: string; senha: string };
  validated: boolean;
  setValidated: (validated: boolean) => void;
}

export default function LoginForm({
  validated,
  credentials,
  setValidated,
  handleChange,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const navigate = useNavigate();

  const handleError = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const handleClose = (event?: React.SyntheticEvent, reason?: string) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidated(true);

    if (!credentials.matricula || !credentials.senha) return;

    try {
      const response = await fetch("https://compras.painel-telecom.com/backend/public/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          usuario: credentials.matricula,
          password: credentials.senha,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("name", data.nome);
        localStorage.setItem("centro_custo", data.centroDeCusto);
        localStorage.setItem("matricula", data.matricula);
        localStorage.setItem("nivel_acesso", data.nivel_acesso);
        localStorage.setItem("filial", data.codfilial);
        localStorage.setItem("material", data.material)
        const nivelAcesso = localStorage.getItem("nivel_acesso");

        if (nivelAcesso && [4, 5, 6].includes(parseInt(nivelAcesso))) {
          navigate("../Compras/AprovarCompra");
        } else {
          navigate("../Compras/SolicitacaoCompra");
        }
      } else {
        handleError(data.message || "Erro ao realizar login.");
      }
    } catch (error) {
      handleError("Erro ao conectar com o servidor.");
    }
  };

  return (
    <Box component="form" noValidate autoComplete="off" className="login-form" onSubmit={handleSubmit}>
      <div className="fields-container">
        <TextField
          label="Matrícula"
          name="matricula"
          placeholder="Matrícula"
          value={credentials.matricula}
          onChange={handleChange}
          required
          fullWidth
          margin="normal"
          error={validated && !credentials.matricula}
          helperText={validated && !credentials.matricula ? "Informe a sua matrícula." : ""}
          className="field-matricula"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FontAwesomeIcon icon={faUser} />
              </InputAdornment>
            ),
          }}
        />

        <TextField
          label="Senha"
          type={showPassword ? "text" : "password"}
          name="senha"
          placeholder="Senha"
          value={credentials.senha}
          onChange={handleChange}
          required
          fullWidth
          margin="normal"
          error={validated && !credentials.senha}
          helperText={validated && !credentials.senha ? "Informe a sua senha." : ""}
          className="field-senha"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FontAwesomeIcon icon={faLock} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {/* <a href="/auth/ForgotPassword" className="forgotPassword">
          <p>Esqueci minha senha</p>
        </a> */}
      </div>

      <div className="buttons-container">
        <Button variant="contained" color="primary" fullWidth type="submit" sx={{ mt: 2 }}>
          Entrar
        </Button>
        {/* <Button
          variant="contained"
          fullWidth
          type="button"
          sx={{
            mt: 2,
            backgroundColor: "#f5f5f5",
            color: "#1976d2",
            border: "1px solid #1976d2",
            "&:hover": {
              backgroundColor: "#f5f5f5",
            },
          }}
          onClick={() => navigate('/auth/register')}
        >
          Cadastre-se
        </Button> */}
      </div>

      <Snackbar
        open={snackbarOpen}
        message={snackbarMessage}
        autoHideDuration={3000}
        TransitionComponent={Slide}
      />
    </Box>
  );
}
