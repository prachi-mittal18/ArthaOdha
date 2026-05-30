import React, { useState, useContext } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";
import GeneralContext from "./GeneralContext";
import UserContext from "./UserContext";
import toast from "react-hot-toast";
import "./BuyActionWindow.css"; // Reusing styles, you can add .sell-window classes here

const SellActionWindow = ({ uid }) => {
  const [stockQuantity, setStockQuantity] = useState(1);
  const [stockPrice, setStockPrice] = useState(0.0);
  const generalContext = useContext(GeneralContext);
  const { refreshUserData, refreshHoldings } = useContext(UserContext);

  const handleSellClick = () => {
    api
      .post(
        "/newOrder",
        {
          name: uid,
          qty: stockQuantity,
          price: stockPrice,
          mode: "SELL",
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
    <div className="buy-window-container sell-window" id="sell-window">
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
            />
          </fieldset>
        </div>
      </div>

      <div className="buttons">
        <span>Proceeds: ₹{(stockQuantity * stockPrice).toFixed(2)}</span>
        <div>
          <Link className="btn btn-red" onClick={handleSellClick}>
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