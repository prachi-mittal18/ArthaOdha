import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3002",
  withCredentials: true,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;
      if (status === 401) {
        console.warn("Unauthorized! Redirecting to login portal...");
        // Redirect dashboard to frontend auth portal
        window.location.href = "http://localhost:3001/";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
