import React, { useState, useEffect, useContext } from "react";
import api from "../api/api";
import GeneralContext from "./GeneralContext";
import UserContext from "./UserContext";
import Skeleton from "@mui/material/Skeleton";

const Positions = () => {
  const [allPositions, setAllPositions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get("/allPositions")
      .then((res) => {
        setAllPositions(res.data);
      })
      .catch((err) => {
        console.error("Error fetching positions:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="positions">
        <h3 className="title"><Skeleton width={120} height={30} /></h3>
        <div className="order-table">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Instrument</th>
                <th>Qty.</th>
                <th>Avg.</th>
                <th>LTP</th>
                <th>P&L</th>
                <th>Chg.</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(new Array(5)).map((_, index) => (
                <tr key={index}>
                  <td><Skeleton width={60} /></td>
                  <td><Skeleton width={80} /></td>
                  <td><Skeleton width={40} /></td>
                  <td><Skeleton width={60} /></td>
                  <td><Skeleton width={60} /></td>
                  <td><Skeleton width={60} /></td>
                  <td><Skeleton width={60} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="positions">
      <h3 className="title">Positions ({allPositions.length})</h3>

      <div className="order-table">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Instrument</th>
              <th>Qty.</th>
              <th>Avg.</th>
              <th>LTP</th>
              <th>P&L</th>
              <th>Chg.</th>
            </tr>
          </thead>
          <tbody>
            {allPositions.map((stock, index) => {
              return <PositionRow key={index} stock={stock} />;
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const PositionRow = ({ stock }) => {
  const [showActions, setShowActions] = useState(false);
  const generalContext = useContext(GeneralContext);
  const { prices } = useContext(UserContext);

  const buttonStyle = {
    padding: "2px 8px",
    margin: "0 2px",
    border: "none",
    borderRadius: "3px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "11px",
    color: "white"
  };

  // Use live price from socket if available, otherwise fallback to database price
  const livePrice = Number(prices[stock.name]) || stock.price;
  const curValue = livePrice * stock.qty;
  const isProfit = curValue - stock.avg * stock.qty >= 0.0;
  const profClass = isProfit ? "profit" : "loss";

  return (
    <tr 
      onMouseEnter={() => setShowActions(true)} 
      onMouseLeave={() => setShowActions(false)}
    >
      <td>{stock.product}</td>
      <td className="instrument-cell" style={{ position: "relative", minWidth: "160px" }}>
        {stock.name}
        {showActions && (
          <div 
            className="actions" 
            style={{ 
              position: "absolute", 
              right: 0, 
              top: "50%", 
              transform: "translateY(-50%)", 
              backgroundColor: "#fff", 
              display: "flex", 
              gap: "8px", 
              padding: "5px 10px", 
              zIndex: 10,
              boxShadow: "-4px 0 10px rgba(0,0,0,0.1)"
            }}
          >
            <button className="buy" onClick={() => generalContext.openBuyWindow(stock.name)} style={{ ...buttonStyle, backgroundColor: "#4184f3" }}>Add</button>
            <button className="sell" onClick={() => generalContext.openSellWindow(stock.name)} style={{ ...buttonStyle, backgroundColor: "#ff5722" }}>Exit</button>
          </div>
        )}
      </td>
      <td>{stock.qty}</td>
      <td>{stock.avg ? stock.avg.toFixed(2) : "0.00"}</td>
      <td>{livePrice ? livePrice.toFixed(2) : "0.00"}</td>
      <td className={profClass}>
        {(curValue - stock.avg * stock.qty).toFixed(2)}
      </td>
      <td className={profClass}>
        {((curValue - (stock.avg * stock.qty)) / (stock.avg * stock.qty) * 100).toFixed(2)}%
      </td>
    </tr>
  );
};

export default Positions;
