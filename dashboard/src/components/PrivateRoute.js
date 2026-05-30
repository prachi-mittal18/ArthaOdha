import React, { useEffect, useState } from "react";
import api from "../api/api";
import Home from "./Home";

const PrivateRoute = () => {
  const [authStatus, setAuthStatus] = useState(() => {
    // If token exists, optimistically assume true so that Home renders and can show loading skeletons
    return localStorage.getItem("token") ? true : null;
  });

  useEffect(() => {
    // Verify JWT via backend endpoint
    api
      .post("/verify")
      .then((res) => {
        if (res.data && res.data.status) {
          setAuthStatus(true);
        } else {
          setAuthStatus(false);
        }
      })
      .catch(() => setAuthStatus(false));
  }, []);

  if (authStatus === null) {
    // Loading UI – could be a spinner or simple text
    return (
      <div style={{
        display: "flex",
        height: "100vh",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "sans-serif",
        color: "#555",
      }}>
        Verifying session…
      </div>
    );
  }

  if (authStatus) {
    return <Home />;
  }

  // Not authenticated: redirect to the landing page (signup/login) served by the frontend (port 3001)
  window.location.href = "http://localhost:3001/";
  return null;
};

export default PrivateRoute;
