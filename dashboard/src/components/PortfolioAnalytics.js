import React, { useContext, useMemo, useState, useEffect } from "react";
import UserContext from "./UserContext";
import { DoughnutChart } from "./DoughnutChart";
import { VerticalGraph } from "./VerticalGraph"; // Can be swapped for LineChart
import { LineChart } from "./LineChart";
import api from "../api/api";
import Skeleton from "@mui/material/Skeleton";

const SECTOR_MAP = {
  INFY: "IT", TCS: "IT", WIPRO: "IT", TECHM: "IT", HCLTECH: "IT", KPITTECH: "IT",
  HDFCBANK: "Banking", ICICIBANK: "Banking", AXISBANK: "Banking", KOTAKBANK: "Banking", SBIN: "Banking",
  RELIANCE: "Energy", TATAPOWER: "Energy", ONGC: "Energy", POWERGRID: "Energy", NTPC: "Energy",
  SUNPHARMA: "Pharma", DRREDDY: "Pharma", CIPLA: "Pharma", DIVISLAB: "Pharma",
  MARUTI: "Auto", "M&M": "Auto", TATAMOTORS: "Auto",
  HINDUNILVR: "FMCG", ITC: "FMCG", NESTLEIND: "FMCG", ASIANPAINT: "FMCG",
  TATASTEEL: "Metals", JSWSTEEL: "Metals", HINDALCO: "Metals", COALINDIA: "Metals",
  default: "Others"
};

const PortfolioAnalytics = () => {
  const { allHoldings, isLoading } = useContext(UserContext);
  const [trendData, setTrendData] = useState({ labels: [], data: [] });
  const [isTrendLoading, setIsTrendLoading] = useState(true);

  useEffect(() => {
    api.get("/user/pnl-trend")
      .then(res => {
        console.log("Analytics: Received trend data", res.data);
        setTrendData(res.data);
      })
      .catch(err => console.error("Trend fetch failed:", err))
      .finally(() => setIsTrendLoading(false));
  }, []);

  const analyticsData = useMemo(() => {
    if (!allHoldings.length) return null;

    // 1. Sector Allocation
    const sectors = {};
    allHoldings.forEach(stock => {
      const sector = SECTOR_MAP[stock.name] || SECTOR_MAP.default;
      const value = stock.price * stock.qty;
      sectors[sector] = (sectors[sector] || 0) + value;
    });

    // 2. Top Gainers/Losers
    const sortedPerformance = [...allHoldings].map(stock => ({
      name: stock.name,
      pnlPercent: ((stock.price - stock.avg) / stock.avg) * 100,
      pnlValue: (stock.price - stock.avg) * stock.qty
    })).sort((a, b) => b.pnlPercent - a.pnlPercent);

    return {
      sectorLabels: Object.keys(sectors),
      sectorValues: Object.values(sectors),
      topGainers: sortedPerformance.slice(0, 3),
      topLosers: sortedPerformance.slice(-3).reverse()
    };
  }, [allHoldings]);

  if (isLoading) return <div className="analytics-page" style={{ padding: "20px" }}><Skeleton variant="rectangular" height={400} /></div>;
  if (!analyticsData) return <div className="analytics-page" style={{ padding: "40px", textAlign: "center" }}><h3>No data available to analyze.</h3><p>Buy some stocks to see your portfolio breakdown!</p></div>;

  const doughnutData = {
    labels: analyticsData.sectorLabels,
    datasets: [{
      data: analyticsData.sectorValues,
      backgroundColor: ["#4184f3", "#ff5722", "#4caf50", "#ff9800", "#9c27b0", "#00bcd4", "#795548"],
      hoverOffset: 4
    }]
  };

  return (
    <div className="analytics-page" style={{ padding: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
      <div className="card" style={{ gridColumn: "span 2", padding: "20px", backgroundColor: "#fff", borderRadius: "8px", minHeight: "350px" }}>
        <h4>7-Day P&L Trend</h4>
        {isTrendLoading ? <Skeleton variant="rectangular" height={250} /> : trendData.data.length > 0 ? (
          <div style={{ height: "250px" }}>
            <LineChart data={{
              labels: trendData.labels,
              datasets: [{ label: "Total P&L", data: trendData.data, borderColor: "#4184f3", backgroundColor: "rgba(65, 132, 243, 0.1)" }]
            }} />
          </div>
        ) : (
          <div style={{ height: "250px", display: "flex", alignItems: "center", justifyContent: "center", color: "#888" }}>
            No historical data available for current holdings.
          </div>
        )}
      </div>

      <div className="card" style={{ padding: "20px", backgroundColor: "#fff", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
        <h4>Sector Allocation</h4>
        <div style={{ height: "300px", display: "flex", justifyContent: "center" }}>
          <DoughnutChart data={doughnutData} />
        </div>
      </div>

      <div className="performance-cards" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div className="card" style={{ padding: "20px", backgroundColor: "#fff", borderRadius: "8px" }}>
          <h4 style={{ color: "#4caf50" }}>Top Gainers</h4>
          {analyticsData.topGainers.map(stock => (
            <div key={stock.name} style={{ display: "flex", justifyContent: "space-between", margin: "10px 0" }}>
              <span>{stock.name}</span>
              <span className="profit">+{stock.pnlPercent.toFixed(2)}%</span>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: "20px", backgroundColor: "#fff", borderRadius: "8px" }}>
          <h4 style={{ color: "#ff5722" }}>Top Losers</h4>
          {analyticsData.topLosers.map(stock => (
            <div key={stock.name} style={{ display: "flex", justifyContent: "space-between", margin: "10px 0" }}>
              <span>{stock.name}</span>
              <span className="loss">{stock.pnlPercent.toFixed(2)}%</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="card" style={{ gridColumn: "span 2", padding: "20px", backgroundColor: "#fff", borderRadius: "8px" }}>
        <h4>Asset Concentration</h4>
        <VerticalGraph data={{
            labels: allHoldings.map(s => s.name),
            datasets: [{
                label: "Current Value (₹)",
                data: allHoldings.map(s => s.price * s.qty),
                backgroundColor: "rgba(65, 132, 243, 0.6)",
                quantities: allHoldings.map(s => s.qty),
            }]
        }} />
      </div>
    </div>
  );
};

export default PortfolioAnalytics;