import React, { useState, useContext, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import UserContext from "./UserContext";
import api from "../api/api";

const Menu = () => {
  const [selectedMenu, setSelectedMenu] = useState(0); //0 is the default value(so it will be on dashboard)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const { username, email } = useContext(UserContext);

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // If the dropdown is open and the click target is NOT inside the dropdownRef element
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleMenuClick = (index) => {
    setSelectedMenu(index);
  };
  const handleProfileClick = (index) => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const handleLogout = (e) => {
    e.stopPropagation();
    api
      .post("/logout")
      .then(() => {
        // Redirect to the main landing page/auth portal on port 3001
        window.location.href = "http://localhost:3001/";
      })
      .catch((err) => console.error("Logout failed", err));
  };

  const menuClass = "menu";
  const activeMenuClass = "menu selected";

  return (
    <div className="menu-container">
      <Link to="/" style={{ textDecoration: "none" }} onClick={() => handleMenuClick(0)}>
        <span className="logo-text">
          Artha<span className="brand-mark">Odha</span>
        </span>
      </Link>
      <div className="menus">
        <ul>
          <li>
            <Link
              style={{ textDecoration: "none" }}
              to="/"
              onClick={() => {
                handleMenuClick(0);
              }}
            >
              <p className={selectedMenu===0? activeMenuClass: menuClass}>Dashboard</p>
            </Link>
          </li>
          <li>
            <Link
              style={{ textDecoration: "none" }}
              to="/orders"
              onClick={() => {
                handleMenuClick(1);
              }}
            >
              <p className={selectedMenu===1? activeMenuClass: menuClass}>Orders</p>
            </Link>
          </li>
          <li>
            <Link
              style={{ textDecoration: "none" }}
              to="/analytics"
              onClick={() => {
                handleMenuClick(6);
              }}
            >
              <p className={selectedMenu===6? activeMenuClass: menuClass}>Analytics</p>
            </Link>
          </li>
          <li>
             <Link
              style={{ textDecoration: "none" }}
              to="/holdings"
              onClick={() => {
                handleMenuClick(2);
              }}
            >
              <p className={selectedMenu===2? activeMenuClass: menuClass}>Holdings</p>
            </Link>
          </li>
          <li>
             <Link
              style={{ textDecoration: "none" }}
              to="/positions"
              onClick={() => {
                handleMenuClick(3);
              }}
            >
              <p className={selectedMenu===3? activeMenuClass: menuClass}>Positions</p>
            </Link>
          </li>
          <li>
             <Link
              style={{ textDecoration: "none" }}
              to="/funds"
              onClick={() => {
                handleMenuClick(4);
              }}
            >
              <p className={selectedMenu===4? activeMenuClass: menuClass}>Funds</p>
            </Link>
          </li>
          <li>
            <Link
              style={{ textDecoration: "none" }}
              to="/apps"
              onClick={() => {
                handleMenuClick(5);
              }}
            >
              <p className={selectedMenu===5? activeMenuClass: menuClass}>Apps</p>
            </Link>
          </li>
        </ul>
        <hr />
        <div 
          className="profile" 
          ref={dropdownRef} 
          onClick={handleProfileClick} 
          style={{ position: "relative" }}
        >
          <div className="avatar">AO</div>
          <p className="username">{username}</p>
          
          {isProfileDropdownOpen && (
            <div className="profile-dropdown" style={{
              position: "absolute",
              top: "100%",
              right: 0,
              backgroundColor: "#fff",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              borderRadius: "8px",
              padding: "20px",
              minWidth: "220px",
              zIndex: 1000,
              marginTop: "12px",
              textAlign: "left"
            }}>
              <p style={{ margin: "0 0 4px 0", fontWeight: "700", color: "#333", fontSize: "16px" }}>{username}</p>
              <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "#888" }}>{email}</p>
              <hr style={{ margin: "0 0 16px 0", border: "0", borderTop: "1px solid #f0f0f0" }} />
              <button 
                onClick={handleLogout} 
                style={{ 
                  width: "100%",
                  padding: "10px", 
                  cursor: "pointer", 
                  fontSize: "14px", 
                  border: "1px solid #e0e0e0", 
                  borderRadius: "6px", 
                  backgroundColor: "#fff",
                  color: "#d32f2f",
                  fontWeight: "600",
                  transition: "all 0.2s"
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Menu;
