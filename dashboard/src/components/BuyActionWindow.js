import React, { useState, useContext, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";
import GeneralContext from "./GeneralContext";
import UserContext from "./UserContext";
import toast from "react-hot-toast";
import "./BuyActionWindow.css";

const BuyActionWindow = ({ uid }) => {
  const [stockQuantity, setStockQuantity] = useState(1);
  const [stockPrice, setStockPrice] = useState(0.0);
  const [orderType, setOrderType] = useState("MARKET");
  const generalContext = useContext(GeneralContext);
  const { balance, refreshUserData, refreshHoldings, prices } = useContext(UserContext);

  const windowRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (windowRef.current && !windowRef.current.contains(event.target)) {
        generalContext.closeBuyWindow();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [generalContext]);

  useEffect(() => {
    const livePrice = Number(prices[uid]);
    // If it's a Market order, always sync with the live ticker
    if (livePrice && orderType === "MARKET") {
      setStockPrice(livePrice);
    }
  }, [uid, prices, orderType]);

  const handleBuyClick = () => {
    const totalCost = stockQuantity * stockPrice;
    if (stockQuantity <= 0) return toast.error("Quantity must be greater than 0");
    if (totalCost > balance) return toast.error("Insufficient funds");

    api
      .post(
        "/newOrder",
        {
          name: uid,
          qty: stockQuantity,
          price: stockPrice,
          mode: "BUY",
          orderType: orderType,
        }
      )
      .then(() => {
        toast.success(`Bought ${stockQuantity} shares of ${uid}`);
        refreshUserData();
        refreshHoldings();
        generalContext.closeBuyWindow();
      })
      .catch((err) => {
        const msg = err.response?.data?.message || "Buy order failed";
        toast.error(msg);
      });
  };

  const handleCancelClick = () => {
    generalContext.closeBuyWindow();
  };

  return (
    <div className="buy-window-container" id="buy-window" draggable="true" ref={windowRef}>
      <div className="window-header">
        <p>Buy {uid}</p>
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
              id="qty"
              onChange={(e) => setStockQuantity(e.target.value)}
              value={stockQuantity}
            />
          </fieldset>
          <fieldset>
            <legend>Price</legend>
            <input
              type="number"
              name="price"
              id="price"
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
        <span style={{ fontSize: "12px", color: "#666" }}>Margin required ₹{(stockQuantity * stockPrice).toFixed(2)}</span>
        <div style={{ display: "flex", gap: "10px" }}>
          <Link className="btn btn-blue" onClick={handleBuyClick}>
            Buy
          </Link>
          <Link to="" className="btn btn-grey" onClick={handleCancelClick}>
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BuyActionWindow;
