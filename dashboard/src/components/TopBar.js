import React, { useContext } from "react";
import UserContext from "./UserContext";
import Menu from "./Menu";

const TopBar = () => {
  const { prices } = useContext(UserContext);

  const indices = {
    nifty: prices["NIFTY 50"] || 18000.0,
    sensex: prices["SENSEX"] || 60000.0,
  };

  // Mock opening values to determine if the index is "Up" or "Down"
  const openingValues = { nifty: 18000.0, sensex: 60000.0 };

  const niftyClass = indices.nifty >= openingValues.nifty ? "up" : "down";
  const sensexClass = indices.sensex >= openingValues.sensex ? "up" : "down";

  return (
    <div className="topbar-container">
      <div className="indices-container">
        <div className="nifty">
          <p className="index">NIFTY 50</p>
          <p className={`index-points ${niftyClass}`}>{indices.nifty.toFixed(2)}</p>
          <p className={`percent ${niftyClass}`}>
            {(((indices.nifty - openingValues.nifty) / openingValues.nifty) * 100).toFixed(2)}%
          </p>
        </div>
        <div className="sensex">
          <p className="index">SENSEX</p>
          <p className={`index-points ${sensexClass}`}>{indices.sensex.toFixed(2)}</p>
          <p className={`percent ${sensexClass}`}>
            {(((indices.sensex - openingValues.sensex) / openingValues.sensex) * 100).toFixed(2)}%
          </p>
        </div>
      </div>
      <Menu />
    </div>
  );
};

export default TopBar;
