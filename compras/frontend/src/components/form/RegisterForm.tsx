import React, { useState } from "react";
import { Box, TextField, Button, Snackbar, Slide, InputAdornment, IconButton } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faLock, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom"; // React Router

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    matricula: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [validated, setValidated] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleClose = () => setSnackbarOpen(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidated(true);

    if (!formData.matricula || !formData.password || !formData.confirmPassword) {
      setSnackbarMessage("Preencha todos os campos.");
      setSnackbarOpen(true);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setSnackbarMessage("As senhas não coincidem.");
      setSnackbarOpen(true);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        "https://ffasip.ddns.net:4545/compras/backend/public/api/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            matricula: formData.matricula,
            password: formData.password,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSnackbarMessage("Usuário cadastrado com sucesso!");
        setSnackbarOpen(true);
        setFormData({ matricula: "", password: "", confirmPassword: "" });
        setTimeout(() => navigate("./compras/auth/"), 1500);
      } else {
        setSnackbarMessage(data.message || "Erro ao cadastrar usuário.");
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error(error);
      setSnackbarMessage("Erro ao conectar com o servidor.");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" noValidate autoComplete="off" onSubmit={handleSubmit}>
      <TextField
        label="Matrícula"
        name="matricula"
        placeholder="Matrícula"
        value={formData.matricula}
        onChange={handleChange}
        required
        fullWidth
        margin="normal"
        error={validated && !formData.matricula}
        helperText={validated && !formData.matricula ? "Informe a sua matrícula." : ""}
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
        name="password"
        placeholder="Senha"
        value={formData.password}
        onChange={handleChange}
        required
        fullWidth
        margin="normal"
        error={validated && !formData.password}
        helperText={validated && !formData.password ? "Informe a sua senha." : ""}
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

      <TextField
        label="Confirmar Senha"
        type={showPassword ? "text" : "password"}
        name="confirmPassword"
        placeholder="Confirme a senha"
        value={formData.confirmPassword}
        onChange={handleChange}
        required
        fullWidth
        margin="normal"
        error={validated && formData.password !== formData.confirmPassword}
        helperText={validated && formData.password !== formData.confirmPassword ? "As senhas não coincidem." : ""}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <FontAwesomeIcon icon={faLock} />
            </InputAdornment>
          ),
        }}
      />

      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        sx={{ mt: 2 }}
        disabled={loading}
      >
        {loading ? "Cadastrando..." : "Cadastrar"}
      </Button>

      <Snackbar
        open={snackbarOpen}
        message={snackbarMessage}
        autoHideDuration={3000}
        TransitionComponent={Slide}
        onClose={handleClose}
      />
    </Box>
  );
}
