import { useRoutes, useLocation } from "react-router-dom";
import routes from "~react-pages";
import Layout from "./components/layout";
import ProtectedRoute from "./pages/Auth/ProtectedRoutes";
import { ModalProvider } from "./context/ModalContext";

export default function App() {
  const location = useLocation();
  const isPublicRoute = 
    location.pathname.startsWith("/auth") || 
    location.pathname === "/auth" ||
    location.pathname.startsWith("/public_route") ||
    location.pathname === "/public_route";

  const element = useRoutes(routes) ?? <div>Página não encontrada</div>;

  if (isPublicRoute) return element;

  return (
    <ModalProvider>
      <ProtectedRoute>
        <Layout>{element}</Layout>
      </ProtectedRoute>
    </ModalProvider>
  );
}