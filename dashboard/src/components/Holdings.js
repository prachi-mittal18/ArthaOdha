import React, { useContext } from "react";
import UserContext from "./UserContext";
import { VerticalGraph } from "./VerticalGraph";
import Skeleton from "@mui/material/Skeleton";

const Holdings = () => {
  const { allHoldings, isLoading } = useContext(UserContext);

  if (isLoading) {
    return (
      <>
        <h3 className="title"><Skeleton width={120} height={30} /></h3>

        <div className="order-table">
          <table>
            <thead>
              <tr>
                <th>Instrument</th>
                <th>Qty.</th>
                <th>Avg. cost</th>
                <th>LTP</th>
                <th>Cur. val</th>
                <th>P&L</th>
                <th>Net chg.</th>
                <th>Day chg.</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(new Array(5)).map((_, index) => (
                <tr key={index}>
                  <td><Skeleton width={80} /></td>
                  <td><Skeleton width={40} /></td>
                  <td><Skeleton width={70} /></td>
                  <td><Skeleton width={70} /></td>
                  <td><Skeleton width={80} /></td>
                  <td><Skeleton width={60} /></td>
                  <td><Skeleton width={60} /></td>
                  <td><Skeleton width={60} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="row">
          <div className="col">
            <h5><Skeleton width={80} height={25} /></h5>
            <p>Total investment</p>
          </div>
          <div className="col">
            <h5><Skeleton width={80} height={25} /></h5>
            <p>Current value</p>
          </div>
          <div className="col">
            <h5><Skeleton width={100} height={25} /></h5>
            <p>P&L</p>
          </div>
        </div>
        <div style={{ marginTop: "20px" }}>
          <Skeleton variant="rectangular" height={300} />
        </div>
      </>
    );
  }

  const totalInvestment = allHoldings.reduce((acc, stock) => acc + stock.avg * stock.qty, 0);
  const currentTotalValue = allHoldings.reduce((acc, stock) => acc + stock.price * stock.qty, 0);
  const totalPL = currentTotalValue - totalInvestment;
  const isProfit = totalPL >= 0;
  const profClass = isProfit ? "profit" : "loss";

  const labels = allHoldings.map((subArray) => subArray["name"]);

  const data = {
    labels,
    datasets: [
      {
        label: "Stock Price",
        data: allHoldings.map((stock) => stock.price),
        backgroundColor: "rgba(255, 99, 132, 0.5)",
      },
    ],
  };

  return (
    <>
      <h3 className="title">Holdings ({allHoldings.length})</h3>

      <div className="order-table">
        <table>
          <thead>
            <tr>
              <th>Instrument</th>
              <th>Qty.</th>
              <th>Avg. cost</th>
              <th>LTP</th>
              <th>Cur. val</th>
              <th>P&L</th>
              <th>Net chg.</th>
              <th>Day chg.</th>
            </tr>
          </thead>
          <tbody>
            {allHoldings.map((stock, index) => {
              const curValue = stock.price * stock.qty;
              const isProfit = curValue - stock.avg * stock.qty >= 0.0;
              const profClass = isProfit ? "profit" : "loss";
              const dayClass = stock.isLoss ? "loss" : "profit";

              return (
                <tr key={index}>
                  <td>{stock.name}</td>
                  <td>{stock.qty}</td>
                  <td>{stock.avg.toFixed(2)}</td>
                  <td>{stock.price.toFixed(2)}</td>
                  <td>{curValue.toFixed(2)}</td>
                  <td className={profClass}>
                    {(curValue - stock.avg * stock.qty).toFixed(2)}
                  </td>
                  <td className={profClass}>{stock.net}</td>
                  <td className={dayClass}>{stock.day}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="row">
        <div className="col">
          <h5>
            {totalInvestment.toFixed(2)}
          </h5>
          <p>Total investment</p>
        </div>
        <div className="col">
          <h5>
            {currentTotalValue.toFixed(2)}
          </h5>
          <p>Current value</p>
        </div>
        <div className="col">
          <h5 className={profClass}>
            {totalPL.toFixed(2)} ({((totalPL / (totalInvestment || 1)) * 100).toFixed(2)}%)
          </h5>
          <p>P&L</p>
        </div>
      </div>
      <VerticalGraph data={data} />
    </>
  );
};

export default Holdings;