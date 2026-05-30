import React from "react";
import Dashboard from "./Dashboard";
import TopBar from "./TopBar";
import { UserProvider } from "./UserContext";

const Home = () => {
  // Auth is already verified by PrivateRoute before this component renders
  return (
    <UserProvider>
      <TopBar />
      <Dashboard />
    </UserProvider>
  );
};

export default Home;
