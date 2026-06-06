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

// 2. Response Interceptor: Handle global errors like 401 Unauthorized
api.interceptors.response.use(
  (response) => {
    // Pass successful responses through
    return response;
  },
  (error) => {
    if (error.response) {
      const { status } = error.response;
      const isAuthRequest = error.config.url.includes("/login") || 
                            error.config.url.includes("/signup") || 
                            error.config.url.includes("/verify");

      if (status === 401) {
        // Only redirect if this wasn't a deliberate auth check/attempt
        // and we aren't already on the login page
        if (!isAuthRequest && !window.location.pathname.includes("/login")) {
          console.warn("Unauthorized! Redirecting to login...");
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
