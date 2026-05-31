import React, { useState, useContext, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";
import GeneralContext from "./GeneralContext";
import UserContext from "./UserContext";
import toast from "react-hot-toast";
import "./BuyActionWindow.css"; // Reusing styles, you can add .sell-window classes here

const SellActionWindow = ({ uid }) => {
  const [stockQuantity, setStockQuantity] = useState(1);
  const [stockPrice, setStockPrice] = useState(0.0);
  const [orderType, setOrderType] = useState("MARKET");
  const generalContext = useContext(GeneralContext);
  const { refreshUserData, refreshHoldings, prices } = useContext(UserContext);

  const windowRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (windowRef.current && !windowRef.current.contains(event.target)) {
        generalContext.closeSellWindow();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [generalContext]);

  useEffect(() => {
    const livePrice = Number(prices[uid]);
    // Sync price automatically for Market orders
    if (livePrice && orderType === "MARKET") {
      setStockPrice(livePrice);
    }
  }, [uid, prices, orderType]);

  const handleSellClick = () => {
    api
      .post(
        "/newOrder",
        {
          name: uid,
          qty: stockQuantity,
          price: stockPrice,
          mode: "SELL",
          orderType: orderType,
        }
      )
      .then(() => {
        toast.success(`Sold ${stockQuantity} shares of ${uid}`);
        refreshUserData();
        refreshHoldings();
        generalContext.closeSellWindow();
      })
      .catch((err) => {
        const msg = err.response?.data?.message || "Sell order failed";
        toast.error(msg);
      });
  };

  const handleCancelClick = () => {
    generalContext.closeSellWindow();
  };

  return (
    <div className="buy-window-container sell-window" id="sell-window" ref={windowRef}>
      <div className="window-header">
        <p>Sell {uid}</p>
      </div>

      <div className="order-type-toggle" style={{ padding: "10px 20px", display: "flex", gap: "20px" }}>
        <label style={{ fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
          <input type="radio" value="MARKET" checked={orderType === "MARKET"} onChange={() => setOrderType("MARKET")} />
          <span style={{ marginLeft: "5px" }}>Market</span>
        </label>
        <label style={{ fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
          <input type="radio" value="LIMIT" checked={orderType === "LIMIT"} onChange={() => setOrderType("LIMIT")} />
          <span style={{ marginLeft: "5px" }}>Limit</span>
        </label>
      </div>

      <div className="regular-order">
        <div className="inputs">
          <fieldset>
            <legend>Qty.</legend>
            <input
              type="number"
              name="qty"
              onChange={(e) => setStockQuantity(e.target.value)}
              value={stockQuantity}
            />
          </fieldset>
          <fieldset>
            <legend>Price</legend>
            <input
              type="number"
              name="price"
              step="0.05"
              onChange={(e) => setStockPrice(e.target.value)}
              value={stockPrice}
              disabled={orderType === "MARKET"}
              style={orderType === "MARKET" ? { backgroundColor: "#f5f5f5", cursor: "not-allowed" } : {}}
            />
          </fieldset>
        </div>
      </div>

      <div className="buttons" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 20px", borderTop: "1px solid #eee" }}>
        <span style={{ fontSize: "12px", color: "#666" }}>Proceeds: ₹{(stockQuantity * stockPrice).toFixed(2)}</span>
        <div style={{ display: "flex", gap: "10px" }}>
          <Link className="btn btn-red" onClick={handleSellClick} style={{ backgroundColor: "#ff5722", color: "white", textDecoration: "underline" }}>
            Sell
          </Link>
          <Link to="" className="btn btn-grey" onClick={handleCancelClick}>
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SellActionWindow;