import React from "react";
import "./content.css";

export default function Content({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div style={style} className="main-container">
      {children}
    </div>
  );
}
