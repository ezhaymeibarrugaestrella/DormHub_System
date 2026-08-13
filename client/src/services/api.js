import axios from "axios";

const API_BASE =
    process.env.REACT_APP_API_URL ||
    (process.env.NODE_ENV === "production" ? "" : `http://${window.location.hostname}:5000`);

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
