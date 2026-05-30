import React, { createContext, useState, useEffect, useRef } from "react";
import api from "../api/api";
import { io } from "socket.io-client";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState({ username: "User", balance: 0 });
  const [allHoldings, setAllHoldings] = useState([]);
  const [prices, setPrices] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const socket = useRef(null);

  const fetchUserData = () => {
    return api
      .post("/verify")
      .then((res) => {
        if (res.data && res.data.status) {
          setUserData({ username: res.data.user, balance: Number(res.data.balance) || 0 });
        }
      });
  };

  const fetchHoldings = () => {
    return api
      .get("/allHoldings")
      .then((res) => setAllHoldings(res.data))
      .catch((err) => console.error("Error fetching holdings:", err));
  };

  useEffect(() => {
    Promise.all([fetchUserData(), fetchHoldings()])
      .finally(() => setIsLoading(false));

    // Centralized socket connection
    socket.current = io("http://localhost:3002", { withCredentials: true });

    socket.current.on("priceUpdate", (updatedPrices) => {
      setPrices(updatedPrices);
    });

    return () => {
      if (socket.current) socket.current.disconnect();
    };
  }, []);

  // Sync holdings with live prices
  useEffect(() => {
    if (Object.keys(prices).length > 0) {
      setAllHoldings((prev) =>
        prev.map((s) => ({ ...s, price: Number(prices[s.name]) || s.price }))
      );
    }
  }, [prices]);

  return (
    <UserContext.Provider
      value={{
        ...userData,
        allHoldings,
        prices,
        isLoading,
        refreshUserData: fetchUserData,
        refreshHoldings: fetchHoldings,
        socket: socket.current,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export default UserContext;