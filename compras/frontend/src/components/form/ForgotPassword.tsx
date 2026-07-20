import React, { useState } from "react";
import {
    TextField,
    Button,
    Box,
    Snackbar,
    Slide,
    InputAdornment,
    IconButton,
} from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faIdCard, faLock, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

export default function ForgotPassword() {
    const [formData, setFormData] = useState({
        matricula: "",
        cpf: "",
        password: "",
        confirmPassword: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleClose = () => setSnackbarOpen(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.matricula || !formData.cpf || !formData.password) {
            setSnackbarMessage("Preencha todos os campos obrigatórios.");
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
                "https://ffasip.ddns.net:4545/compras/backend/public/api/forgot-password",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({
                        matricula: formData.matricula,
                        cpf: formData.cpf,
                        password: formData.password,
                    }),
                }
            );

            const data = await response.json();

            if (response.ok) {
                setSnackbarMessage("Senha alterada com sucesso! Faça login novamente.");
                setSnackbarOpen(true);
                setFormData({ matricula: "", cpf: "", password: "", confirmPassword: "" });
            } else {
                setSnackbarMessage(data.message || "Erro ao alterar a senha.");
                setSnackbarOpen(true);
            }
        } catch (error) {
            console.error("Erro de conexão:", error);
            setSnackbarMessage("Erro ao conectar com o servidor.");
            setSnackbarOpen(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            component="form"
            onSubmit={handleSubmit}
            className="forgot-form"
            sx={{ maxWidth: 400, margin: "auto", mt: 5 }}
        >
            <TextField
                label="Matrícula"
                name="matricula"
                value={formData.matricula}
                onChange={handleChange}
                fullWidth
                margin="normal"
                required
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <FontAwesomeIcon icon={faUser} />
                        </InputAdornment>
                    ),
                }}
            />

            <TextField
                label="CPF"
                name="cpf"
                value={formData.cpf}
                onChange={handleChange}
                fullWidth
                margin="normal"
                required
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <FontAwesomeIcon icon={faIdCard} />
                        </InputAdornment>
                    ),
                }}
            />

            <TextField
                label="Nova Senha"
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                fullWidth
                margin="normal"
                required
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <FontAwesomeIcon icon={faLock} />
                        </InputAdornment>
                    ),
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton onClick={() => setShowPassword(!showPassword)}>
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
                value={formData.confirmPassword}
                onChange={handleChange}
                fullWidth
                margin="normal"
                required
            />

            <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                sx={{ mt: 2 }}
                disabled={loading}
            >
                {loading ? "Alterando..." : "Alterar Senha"}
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
