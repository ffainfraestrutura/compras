"use client";
import React from "react";
import LogoImage from "../../assets/images/logo.png";
import "./login.css";
import { useState } from "react";
import LoginForm from "../../components/form/loginForm";
import { CardContent, Card, Divider } from "@mui/material";


export default function Auth() {
  const [validated, setValidated] = useState(false);
  const [credentials, setCredentials] = useState({
    matricula: "",
    senha: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="login-page">
      <main>
        <Card className="card login-card">
          <CardContent>
            <img src={LogoImage} alt="Logo" className="logo-image" />
            <Divider></Divider>
            <LoginForm
              credentials={credentials}
              handleChange={handleChange}
              validated={validated}
              setValidated={setValidated}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
