import React, { useContext } from "react";
import api from "../api/api";
import UserContext from "./UserContext";
import Menu from "./Menu";

const TopBar = () => {
  const { prices } = useContext(UserContext);

  const indices = {
    nifty: prices["NIFTY 50"] || 18000.0,
    sensex: prices["SENSEX"] || 60000.0,
  };

  const handleLogout = () => {
    api
      .post("/logout")
      .then(() => {
        // Redirect to the main landing page/auth portal on port 3001
        window.location.href = "http://localhost:3001/";
      })
      .catch((err) => console.error("Logout failed", err));
  };

  return (
    <div className="topbar-container">
      <div className="indices-container">
        <div className="nifty">
          <p className="index">NIFTY 50</p>
          <p className="index-points">{indices.nifty} </p>
          <p className="percent"></p>
        </div>
        <div className="sensex">
          <p className="index">SENSEX</p>
          <p className="index-points">{indices.sensex}</p>
          <p className="percent"></p>
        </div>
      </div>
      <button onClick={handleLogout}>Logout</button>
      <Menu />
    </div>
  );
};

export default TopBar;
