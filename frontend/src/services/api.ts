import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
});

export const getAccessToken = (): string | null => localStorage.getItem("fc_access");
export const getRefreshToken = (): string | null => localStorage.getItem("fc_refresh");

export const setTokens = (access: string | null, refresh?: string | null) => {
  if (access) localStorage.setItem("fc_access", access);
  else localStorage.removeItem("fc_access");
  if (refresh !== undefined) {
    if (refresh) localStorage.setItem("fc_refresh", refresh);
    else localStorage.removeItem("fc_refresh");
  }
};

export const clearTokens = () => {
  localStorage.removeItem("fc_access");
  localStorage.removeItem("fc_refresh");
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
          setTokens(data.access, undefined);
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
