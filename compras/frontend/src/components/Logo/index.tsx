import React from "react";
import "./logo.css";
import LogoImage from "../../assets/images/logoWhiteText.png";
type LogoProps = {
  menuToggled: boolean;
};
export default function Logo({ menuToggled, ...props }: LogoProps) {
  return (
    <div className={`logo ${menuToggled ? "toggled-menu" : ""}`}>
      <img src={LogoImage} alt="Logo" className="img" />
    </div>
  );
}
