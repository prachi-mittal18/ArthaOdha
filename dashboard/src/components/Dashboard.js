import React from "react";
import { Route, Routes } from "react-router-dom";

import Apps from "./Apps";
import Funds from "./Funds";
import Holdings from "./Holdings";

import Orders from "./Orders";
import Positions from "./Positions";
import Summary from "./Summary";
import WatchList from "./WatchList";
import PortfolioAnalytics from "./PortfolioAnalytics";
import { GeneralContextProvider } from "./GeneralContext";
import { Toaster } from "react-hot-toast";
import ErrorBoundary from "./ErrorBoundary";

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <Toaster position="bottom-right" reverseOrder={false} />
        <GeneralContextProvider>
          <ErrorBoundary>
            <WatchList />
          </ErrorBoundary>
          <div className="content">
            <ErrorBoundary>
              <Routes>
                <Route exact path="/" element={<Summary />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/holdings" element={<Holdings />} />
                <Route path="/positions" element={<Positions />} />
                <Route path="/funds" element={<Funds />} />
                <Route path="/apps" element={<Apps />} />
                <Route path="/analytics" element={<PortfolioAnalytics />} />
              </Routes>
            </ErrorBoundary>
          </div>
        </GeneralContextProvider>
    </div>
  );
};

export default Dashboard;
