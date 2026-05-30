import React, { useState, createContext } from "react";

import BuyActionWindow from "./BuyActionWindow";
import SellActionWindow from "./SellActionWindow";

const GeneralContext = createContext({
  openBuyWindow: (uid) => {},
  closeBuyWindow: () => {},
  openSellWindow: (uid) => {},
  closeSellWindow: () => {},
});

export const GeneralContextProvider = (props) => {
  const [activeWindow, setActiveWindow] = useState(null); // 'BUY', 'SELL', or null
  const [selectedStockUID, setSelectedStockUID] = useState("");

  const handleOpenBuyWindow = (uid) => {
    setActiveWindow("BUY");
    setSelectedStockUID(uid);
  };

  const handleCloseBuyWindow = () => {
    setActiveWindow(null);
    setSelectedStockUID("");
  };

  const handleOpenSellWindow = (uid) => {
    setActiveWindow("SELL");
    setSelectedStockUID(uid);
  };

  const handleCloseSellWindow = () => {
    setActiveWindow(null);
    setSelectedStockUID("");
  };

  return (
    <GeneralContext.Provider
      value={{
        openBuyWindow: handleOpenBuyWindow,
        closeBuyWindow: handleCloseBuyWindow,
        openSellWindow: handleOpenSellWindow,
        closeSellWindow: handleCloseSellWindow,
      }}
    >
      {props.children}
      {activeWindow === "BUY" && <BuyActionWindow uid={selectedStockUID} />}
      {activeWindow === "SELL" && <SellActionWindow uid={selectedStockUID} />}
    </GeneralContext.Provider>
  );
};

export default GeneralContext;
