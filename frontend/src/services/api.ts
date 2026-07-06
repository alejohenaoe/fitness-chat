import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
  timeout: 20000,
});

export const getAccessToken = (): string | null => localStorage.getItem("access_token");
export const getRefreshToken = (): string | null => localStorage.getItem("refresh_token");

export const setTokens = (access: string | null, refresh?: string | null) => {
  if (access) localStorage.setItem("access_token", access);
  else localStorage.removeItem("access_token");
  if (refresh !== undefined) {
    if (refresh) localStorage.setItem("refresh_token", refresh);
    else localStorage.removeItem("refresh_token");
  }
};

export const clearTokens = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
};

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const orig = error.config;
    if (error.response?.status === 401 && !orig._retried) {
      const refresh = getRefreshToken();
      if (refresh) {
        try {
          orig._retried = true;
          const { data } = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"}/auth/token/refresh/`,
            { refresh },
          );
          setTokens(data.access, data.refresh);
          orig.headers.Authorization = `Bearer ${data.access}`;
          return axios(orig);
        } catch (_) {
          clearTokens();
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;
