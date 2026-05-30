import axios from "axios";

// 1. Create an instance with default configuration
const api = axios.create({
  baseURL: "http://localhost:3002", // Centralized base URL
  timeout: 10000,                  // Kill request if it takes longer than 10 seconds
  headers: {
    "Content-Type": "application/json",
  },
});

// 2. Request Interceptor: Runs BEFORE every request leaves your app
api.interceptors.request.use(
  (config) => {
    // Dynamically grab the latest token from localStorage
    const token = localStorage.getItem("token");
    
    if (token) {
      // Automatically attach the Authorization header to EVERY request
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config; // Hand the request over to the network
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. Response Interceptor: Runs BEFORE a response reaches your .then() or try/catch
api.interceptors.response.use(
  (response) => {
    // If the request succeeded, just pass the data straight through
    return response;
  },
  (error) => {
    // Check if the server returned a specific error status code
    if (error.response) {
      const { status } = error.response;

      if (status === 401) {
        // Token is invalid, expired, or missing
        console.warn("Unauthorized! Clearing local storage and redirecting...");
        localStorage.removeItem("token");
        
        // Force redirect to login page
        window.location.href = "/login";
      }
      
      if (status === 500) {
        console.error("Server-side crash occurred.");
      }
    }

    // Pass the error along so the specific component can still display a custom alert if needed
    return Promise.reject(error);
  }
);

export default api;