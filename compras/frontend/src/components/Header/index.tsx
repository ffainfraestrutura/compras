import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faUser } from "@fortawesome/free-solid-svg-icons";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import "./header.css";
import React from "react";

type HeaderProps = {
  setMenuToggled: React.Dispatch<React.SetStateAction<boolean>>;
  className?: string;
};

export default function Header({ setMenuToggled, className }: HeaderProps) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const capitalizeFirst = (str: string) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const getNome = () => {
    return "Usuário";
  };

  const nome = getNome();
  return (
    <header className={`header ${className}`}>
      <FontAwesomeIcon
        icon={faBars}
        className="menu-toggle"
        onClick={() => setMenuToggled((prev) => !prev)}
      />

      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          list: {
            "aria-labelledby": "basic-button",
          },
        }}
      >
        <MenuItem>Sair</MenuItem>
  
      </Menu>
    </header>
  );
}
