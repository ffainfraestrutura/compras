import "./navOption.css";
import React, { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretDown, faCaretRight } from "@fortawesome/free-solid-svg-icons";
import { Divider, Paper, Tooltip } from "@mui/material";
import { useNavigate } from "react-router-dom";

type NavOptionProps = {
  icon: any;
  text: string;
  menuToggled: boolean;
  submenus?: Array<{
    Title: string;
    Route: string;
  }>;
};

export default function NavOption({ icon, text, menuToggled, submenus }: NavOptionProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const textRef = useRef<HTMLParagraphElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    if (textRef.current) {
      setIsTruncated(textRef.current.scrollWidth > textRef.current.clientWidth);
    }
  }, [text]);

  return (
    <div
      className="menu-option-container"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div className={`menu-option ${menuToggled ? "toggled" : ""}`}>
        <FontAwesomeIcon className="menu-option-icon" icon={icon} />
        <Tooltip title={isTruncated ? text : ""} arrow placement="top">
          <p ref={textRef} className="menu-option-text">{text}</p>
        </Tooltip>
        {submenus && submenus.length > 0 && !menuToggled && (
          <FontAwesomeIcon icon={open ? faCaretDown : faCaretRight} />
        )}
      </div>

      {submenus && open && (
        <Paper
          className={`${menuToggled ? "submenu-container-toggled" : "submenu-container"}`}
          elevation={3}
        >
          {menuToggled && (
            <>
              <div className="submenu-title"><p>{text}</p></div>
              <Divider />
            </>
          )}
          {submenus.map((submenu, index) => (
            <div
              key={index}
              className="submenu-item"
              onClick={() => {
                navigate(submenu.Route);
                setOpen(false);
              }}
            >
              {submenu.Title}
            </div>
          ))}
        </Paper>
      )}
    </div>
  );
}
