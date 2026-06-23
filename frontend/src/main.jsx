import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import App from './App';
import './index.css';

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
<<<<<<< HEAD
      <BrowserRouter basename="/compras">
=======
      <BrowserRouter basename="/">
>>>>>>> a407070151f2236f6c2396cb7b70326c51b418c0
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
}