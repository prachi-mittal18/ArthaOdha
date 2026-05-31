import React, { useState, useContext, useEffect } from "react";
import toast from "react-hot-toast";

import axios from "axios";

import GeneralContext from "./GeneralContext";
import UserContext from "./UserContext";

import { Tooltip, Grow } from "@mui/material";

import {
  BarChartOutlined,
  KeyboardArrowDown,
  KeyboardArrowUp,
  MoreHoriz,
} from "@mui/icons-material";

import { watchlist } from "../data/data";
import { DoughnutChart } from "./DoughnutChart";

const WatchList = () => {
  const [watchlistData, setWatchlistData] = useState(watchlist);
  const [searchTerm, setSearchTerm] = useState("");
  const { prices } = useContext(UserContext);

  useEffect(() => {
    if (Object.keys(prices).length > 0) {
      setWatchlistData((prevData) =>
        prevData.map((stock) => {
          if (prices[stock.name]) {
            const newPrice = Number(prices[stock.name]);
            return {
              ...stock,
              isDown: newPrice < stock.price,
              price: newPrice,
            };
          }
          return stock;
        })
      );
    }
  }, [prices]);

  const filteredWatchlist = watchlistData.filter((stock) =>
    stock.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const labels = filteredWatchlist.map((s) => s.name);
  const data = {
    labels,
    datasets: [
      {
        label: "Price",
        data: filteredWatchlist.map((stock) => stock.price),
        backgroundColor: [
          "rgba(255, 99, 132, 0.5)",
          "rgba(54, 162, 235, 0.5)",
          "rgba(255, 206, 86, 0.5)",
          "rgba(75, 192, 192, 0.5)",
          "rgba(153, 102, 255, 0.5)",
          "rgba(255, 159, 64, 0.5)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="watchlist-container" style={{ display: "flex", flexDirection: "column", height: "100vh", borderRight: "1px solid #eee" }}>
      <div className="search-container">
        <input
          type="text"
          name="search"
          id="search"
          placeholder="Search eg:infy, bse, nifty fut weekly, gold mcx"
          className="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <span className="counts"> {filteredWatchlist.length} / 50</span>
      </div>

      <ul className="list" style={{ flex: 1, overflowY: "auto", borderBottom: "1px solid #eee" }}>
        {filteredWatchlist.map((stock, index) => {
          return <WatchListItem stock={stock} key={index} />;
        })}
      </ul>

      <div className="watchlist-graph-container" style={{ padding: "20px" }}>
        <DoughnutChart data={data} />
      </div>
    </div>
  );
};

export default WatchList;

const WatchListItem = ({ stock }) => {
  const [showWatchlistActions, setShowWatchlistActions] = useState(false);

  const handleMouseEnter = (e) => {
    setShowWatchlistActions(true);
  };

  const handleMouseLeave = (e) => {
    setShowWatchlistActions(false);
  };

  return (
    <li onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} style={{ padding: "14px 10px", borderBottom: "1px solid #f3f3f3" }}>
      <div className="item">
        <p className={stock.isDown ? "down" : "up"} style={{ fontWeight: "600", fontSize: "0.95rem" }}>{stock.name}</p>
        <div className="itemInfo">
          <span className="percent">{stock.percent}</span>
          {stock.isDown ? (
            <KeyboardArrowDown className="down" />
          ) : (
            <KeyboardArrowUp className="down" />
          )}
          <span className="price">{stock.price}</span>
        </div>
      </div>
      {showWatchlistActions && <WatchListActions uid={stock.name} />}
    </li>
  );
};

const WatchListActions = ({ uid }) => {
  const generalContext = useContext(GeneralContext);

  const buttonStyle = {
    padding: "4px 8px",
    margin: "0 2px",
    border: "none",
    borderRadius: "3px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "11px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    verticalAlign: "middle",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
  };

  const handleBuyClick = () => {
    generalContext.openBuyWindow(uid);
  };

  const handleSellClick = () => {
    generalContext.openSellWindow(uid);
  };

  const handleAnalyticsClick = () => {
    toast(`Loading detailed charts for ${uid}...`, { icon: '📊' });
  };

  const handleMoreClick = () => {
    toast(`Advanced options for ${uid} coming soon!`, { icon: '⚙️' });
  };

  return (
    <span className="actions">
      <span>
        <Tooltip
          title="Buy (B)"
          placement="top"
          arrow
          TransitionComponent={Grow}
        >
          <button 
            className="buy" 
            style={{ ...buttonStyle, backgroundColor: "#4184f3", color: "white" }}
            onClick={handleBuyClick}
          >
            Buy
          </button>
        </Tooltip>
        <Tooltip
          title="Sell (S)"
          placement="top"
          arrow
          TransitionComponent={Grow}
        >
          <button 
            className="sell" 
            style={{ ...buttonStyle, backgroundColor: "#ff5722", color: "white" }}
            onClick={handleSellClick}
          >
            Sell
          </button>
        </Tooltip>
        <Tooltip
          title="Analytics (A)"
          placement="top"
          arrow
          TransitionComponent={Grow}
        >
          <button 
            className="action" 
            style={{ ...buttonStyle, backgroundColor: "#e0e0e0", color: "#444" }}
            onClick={handleAnalyticsClick}
          >
            <BarChartOutlined className="icon" />
          </button>
        </Tooltip>
        <Tooltip 
          title="More" 
          placement="top" 
          arrow 
          TransitionComponent={Grow}
        >
          <button 
            className="action" 
            style={{ ...buttonStyle, backgroundColor: "#e0e0e0", color: "#444" }}
            onClick={handleMoreClick}
          >
            <MoreHoriz className="icon" />
          </button>
        </Tooltip>
      </span>
    </span>
  );
};
