import React from "react";
import { useState } from "react";
import Header from "../Header";
import Content from "../Content";
import Logo from "../Logo";
import Nav from "../Nav";
import "./layout.css";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [menuToggled, setMenuToggled] = useState(false);

  return (
    <div className="app">
      <div className={`top-grid ${menuToggled ? "menu-toggled" : ""}`}>
        <Logo menuToggled={menuToggled} />
        <Header setMenuToggled={setMenuToggled} />
      </div>
      <div className={`main-grid ${menuToggled ? "menu-toggled" : ""}`}>
        <Nav menuToggled={menuToggled} />
        <Content>{children}</Content>
      </div>
    </div>
  );
}
