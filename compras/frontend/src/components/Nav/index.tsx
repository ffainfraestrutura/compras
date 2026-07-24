"use client";
import "./nav.css";
import React, { useState } from "react";
import NavOption from "../navOption/navOption";
import {
  faUser,
  faGear,
  faEnvelope,
  faFileInvoiceDollar,
  faQuestionCircle
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";
import {
  Paper,
  MenuList,
  MenuItem,
  Box,
  Button,
  Stack,
  ClickAwayListener,
  Typography,
  Divider,
} from "@mui/material";

type NavProps = {
  menuToggled: boolean;
  className?: string;
};

export default function Nav({ menuToggled, className = "" }: NavProps) {
  const navigate = useNavigate();
  const userName = localStorage.getItem("name") || "User";
  const userRole = localStorage.getItem("nivel_acesso") || "1";
  const userMatricula = localStorage.getItem("matricula") || "";
  const nivelAcesso = Number(localStorage.getItem("nivel_acesso")) || 1;
  const material = localStorage.getItem('material') === 'true'; // Converte para boolean

  const capitalize = (word: string) =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();

  const parts = userName.trim().split(" ");
  const displayName = `${capitalize(parts[0])} ${capitalize(parts[parts.length - 1])}`;
  let tituloTabela = userRole == "3" ? "Realizar Cotações" : "Aprovar Materiais";
  if (nivelAcesso > 3 && nivelAcesso != 7) {
    tituloTabela = "Aprovar Cotações"
  }

  const rotas = [
    {
      Title: "Solicitações de Compra",
      Icon: faEnvelope,
      roles: ["1", "2", "3", "4", "5", "6", "7"],
      submenus: [
        { Title: tituloTabela, Route: "/Compras/AprovarCompra", roles: ["2", "3", "4", "5", "6", "7"] },
        // { Title: "Aprovar Solicitações", Route: "/Compras/AprovarCompraAdm", roles: ["4"] },
        // {
        //   Title: "Materiais",
        //   Route: "/Cadastros/Materiais",
        //   requiresMaterial: true // ✅ Adiciona flag para exigir material true
        // },
        { 
          Title: "Cotações Aprovadas", 
          Route: "/Compras/Finalizadas", 
          roles: ["3"],
        },
        {
          Title: "Aprovar Solicitações",
          Route: "/Compras/gerente_material",
          roles: ["3"],
          matriculasPermitidas: ["601000", "601014", "089475"]
        },
        { 
          Title: "Conferir Pedidos", 
          Route: "/Compras/checar_material",
          requiresMaterial: true // ✅ Adiciona flag para exigir material true
        },
        { 
          Title: "Receber Materiais", 
          Route: "/Compras/MateriaisComprados" 
        },
        // { Title: "Enviar Proposta", Route: "/Compras/enviarproposta", roles: ["3"] },
        { Title: "Minhas Solicitações", Route: "/Compras/MinhasSolicitacoes" },
        { Title: "Nova Solicitação", Route: "/Compras/SolicitacaoCompra" },
        { Title: "Relatorio Geral", Route: "/Compras/RelatorioGeral" },
      ],
    },
    // {
    //   Title: "Notas Fiscais",
    //   Icon: faFileInvoiceDollar,
    //   roles: ["2", "3", "4", "5", "6"],
    //   submenus: [
    //     { Title: "Cadastro de Notas Fiscais", Route: "/Compras/entregamateriais", roles: ["3"] },
    //     { Title: "Relacionar Notas / Pedidos", Route: "/Compras/associarnotapedido", roles: ["3"] },
    //     { Title: "Notas Fiscais Divergentes", Route: "/Compras/divergencias", roles: ["4", "5", "6", "2"] },
    //   ],
    // },
    // {
    //   Title: "Cadastros",
    //   Icon: faGear,
    //   roles: ["2", "3"],
    //   submenus: [
    //     { Title: "Materiais", Route: "/Cadastros/Materiais" },
    //     // { Title: "Filiais", Route: "/Cadastros/Filiais", roles: ["3"] },
    //     { Title: "Fornecedores", Route: "/Cadastros/Fornecedores" },
    //     { Title: "Usuarios", Route: "/Cadastros/Usuarios", roles: ["2"] }
    //   ],
    // },
    {
      Title: "Cadastros",
      Icon: faGear,
      submenus: [
        { Title: "Materiais", Route: "/Cadastros/Materiais" },
        // { Title: "Filiais", Route: "/Cadastros/Filiais", roles: ["3"] },
        { Title: "Fornecedores", Route: "/Cadastros/Fornecedores" },
        { Title: "Usuarios", Route: "/Cadastros/Usuarios", roles: ["2"] }
      ],
      requiresMaterial: true
    },
    {
      Title: "Ajuda",
      Icon: faQuestionCircle,
      roles: ["1", "2", "3", "4", "5", "6", "7"],
      submenus: [
        { Title: "Ajuda", Route: "/Compras/ajuda" },
      ],
    },
  ];

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openProfileMenu = Boolean(anchorEl);

  const handleProfileClick = (event: React.MouseEvent<HTMLButtonElement>) =>
    setAnchorEl(anchorEl ? null : event.currentTarget);

  const handleProfileClose = () => setAnchorEl(null);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();

    window.location.href = "/auth";
  };

  // Função para verificar se um submenu deve ser exibido
  const shouldShowSubmenu = (submenu: any) => {
    // ✅ VERIFICAÇÃO DA FLAG requiresMaterial
    if (submenu.requiresMaterial === true && !material) {
      return false; // Só mostra se material for true
    }

    // ✅ VERIFICAÇÃO: Array de matrículas permitidas
    if (submenu.matriculasPermitidas) {
      return submenu.matriculasPermitidas.includes(userMatricula);
    }

    // Verifica se há restrição de matrícula específica (formato antigo)
    if (submenu.matriculaEspecifica) {
      return userMatricula === submenu.matriculaEspecifica;
    }

    // Verifica se há restrição de roles
    if (submenu.roles) {
      return submenu.roles.includes(userRole);
    }

    return true;
  };

  return (
    <aside className={`menu-area ${menuToggled ? "toggled-menu" : ""}`}>
      <nav className={`menu-nav ${className}`}>
        {rotas
          .filter(r => !r.roles || r.roles.includes(userRole))
          .map((rota, index) => (
            <NavOption
              key={index}
              menuToggled={menuToggled}
              icon={rota.Icon}
              text={rota.Title}
              submenus={rota.submenus?.filter(sm => shouldShowSubmenu(sm))}
            />
          ))}
      </nav>

      <Stack sx={{ position: "relative", marginTop: 2 }}>
        {openProfileMenu && (
          <ClickAwayListener onClickAway={handleProfileClose}>
            <Paper
              elevation={3}
              sx={{
                position: "absolute",
                bottom: "100%",
                left: 0,
                mt: 1,
                width: "100%",
                minWidth: 200,
                zIndex: 1300,
              }}
            >
              <MenuList>
                <MenuItem onClick={handleLogout}>Sair</MenuItem>
                {menuToggled && (
                  <>
                    <Divider />
                    <Typography sx={{ pl: 2, pt: 0.4, pb: 0.4 }}>
                      {displayName}
                    </Typography>
                  </>
                )}
              </MenuList>
            </Paper>
          </ClickAwayListener>
        )}
        <Box className="ProfileButton">
          <Button
            onClick={handleProfileClick}
            startIcon={<FontAwesomeIcon icon={faUser} />}
            sx={{
              textTransform: "none",
              color: "#000",
              justifyContent: menuToggled ? "center" : "flex-start",
            }}
          >
            {menuToggled ? " " : displayName}
          </Button>
        </Box>
      </Stack>
    </aside>
  );
}