import axios from "axios";

// 1. Create instance with environment variables
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:3002", // Centralized base URL
  withCredentials: true,           // Required for sending/receiving cookies
  timeout: 10000,                  // Kill request if it takes longer than 10 seconds
  headers: {
    "Content-Type": "application/json",
  },
});

// 2. Request Interceptor: Automatically attach tokens if using localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. Response Interceptor: Handle global errors like 401 Unauthorized
api.interceptors.response.use(
  (response) => {
    // Pass successful responses through
    return response;
  },
  (error) => {
    if (error.response) {
      const { status } = error.response;

      if (status === 401) {
        // Session expired or unauthorized
        console.warn("Unauthorized! Clearing session and redirecting...");
        localStorage.removeItem("token");

        // Only redirect if not already on an auth page to avoid loops
        if (!window.location.pathname.includes("/login") && !window.location.pathname.includes("/signup")) {
          window.location.href = "/login";
        }
      }

      if (status === 500) {
        console.error("Internal Server Error.");
      }
    }
    return Promise.reject(error);
  }
);

export default api;
