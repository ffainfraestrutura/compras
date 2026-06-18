// src/pages/compras/index.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

export default function Index() {
  // Redireciona para uma das subpáginas
  return <Navigate to="/auth" replace />;
}