import React, { createContext, useState, useEffect, useRef } from "react";
import api from "../api/api";
import { io } from "socket.io-client";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState({ 
    username: "User", 
    email: "", 
    balance: 0, 
    marginUsed: 0, 
    openingBalance: 0,
    hasTradingPin: false 
  });
  const [allHoldings, setAllHoldings] = useState([]);
  const [prices, setPrices] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const socket = useRef(null);

  const fetchUserData = async () => {
    try {
      const [verifyRes, fundsRes] = await Promise.all([
        api.post("/verify"),
        api.get("/user/funds")
      ]);

      if (verifyRes.data && verifyRes.data.status) {
        setUserData({
          username: verifyRes.data.user,
          email: verifyRes.data.email,
          balance: fundsRes.data.balance,
          marginUsed: fundsRes.data.marginUsed,
          openingBalance: fundsRes.data.openingBalance,
          hasTradingPin: verifyRes.data.hasTradingPin
        });
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
    }
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

    socket.current.on("connectionStatus", (data) => {
      setIsLive(data.isLive);
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
        isLive,
        socket: socket.current,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export default UserContext;