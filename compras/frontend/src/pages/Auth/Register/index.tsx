import React from "react";
import RegisterForm from "../../../components/form/RegisterForm";
import LogoImage from "../../../assets/images/logo.png";
import { Card, CardContent, Divider } from "@mui/material";

export default function Index() {
    return (
        <div className="login-page">
            <main>
                <Card className="card login-card">
                    <CardContent>
                        <img src={LogoImage} alt="Logo" className="logo-image" />
                        <Divider sx={{ my: 2 }} />
                        <RegisterForm />
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
