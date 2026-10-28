import axios from "axios";

const isLocalhost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const configuredApiBase = process.env.REACT_APP_API_URL?.replace(/\/+$/, "");
const API_BASE = configuredApiBase ||
    (isLocalhost ? `http://${window.location.hostname}:5000` : window.location.origin);

const API = axios.create({
    baseURL: `${API_BASE}/api`
});

API.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/";
        }
        return Promise.reject(error);
    }
);

export default API;
export { API_BASE };
