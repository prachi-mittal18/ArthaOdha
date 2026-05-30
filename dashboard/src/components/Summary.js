import React, { useContext } from "react";
import UserContext from "./UserContext";

const Summary = () => {
  const { username, balance, allHoldings } = useContext(UserContext);

  const { totalInvestment, currentTotalValue } = allHoldings.reduce(
    (acc, stock) => {
      acc.totalInvestment += stock.avg * stock.qty;
      acc.currentTotalValue += stock.price * stock.qty;
      return acc;
    },
    { totalInvestment: 0, currentTotalValue: 0 }
  );

  const totalPL = currentTotalValue - totalInvestment;
  const pnlClass = totalPL >= 0 ? "profit" : "loss";

  return (
    <>
      <div className="username">
        <h6>Hi, {username}!</h6>
        <hr className="divider" />
      </div>

      <div className="section">
        <span>
          <p>Equity</p>
        </span>

        <div className="data">
          <div className="first">
            <h3>{(balance / 1000).toFixed(2)}k</h3>
            <p>Margin available</p>
          </div>
          <hr />

          <div className="second">
            <p>
              Margins used <span>0</span>{" "}
            </p>
            <p>
              Opening balance <span>{(balance / 1000).toFixed(2)}k</span>{" "}
            </p>
          </div>
        </div>
        <hr className="divider" />
      </div>

      <div className="section">
        <span>
          <p>Holdings ({allHoldings.length})</p>
        </span>

        <div className="data">
          <div className="first">
            <h3 className={pnlClass}>
              {(totalPL / 1000).toFixed(2)}k <small>{totalInvestment > 0 ? ((totalPL / totalInvestment) * 100).toFixed(2) : "0.00"}%</small>{" "}
            </h3>
            <p>P&L</p>
          </div>
          <hr />

          <div className="second">
            <p>
              Current Value <span>{(currentTotalValue / 1000).toFixed(2)}k</span>{" "}
            </p>
            <p>
              Investment <span>{(totalInvestment / 1000).toFixed(2)}k</span>{" "}
            </p>
          </div>
        </div>
        <hr className="divider" />
      </div>
    </>
  );
};

export default Summary;