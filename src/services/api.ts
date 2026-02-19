import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

//const API_URL = "https://192.169.1.4:8080";
const API_URL = "https://kairon-api.onrender.com";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 60000, // 🔥 Aumentado para 60 segundos para dar tempo do Render acordar
  headers: {
    "Content-Type": "application/json",
  },
});

/* =========================
   ROTAS PÚBLICAS
========================= */
const AUTH_ROUTES = ["/auth/login", "/auth/register", "/auth/refresh"];

/* =========================
   REQUEST INTERCEPTOR
========================= */
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // 🔒 Rotas públicas NÃO recebem token
    if (AUTH_ROUTES.some((route) => config.url?.includes(route))) {
      return config;
    }

    const token = await AsyncStorage.getItem("@Kairon:token");

    if (token && token.split(".").length === 3) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* =========================
   RESPONSE INTERCEPTOR
========================= */
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest: any = error.config;

    // ❌ Sem response (ex: timeout, rede)
    if (!error.response) {
      return Promise.reject(error);
    }

    // ❌ Não é 401
    if (error.response.status !== 401) {
      return Promise.reject(error);
    }

    // ❌ Já tentou refresh
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // ❌ Rotas públicas NÃO fazem refresh
    if (AUTH_ROUTES.some((route) => originalRequest.url?.includes(route))) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const refreshToken = await AsyncStorage.getItem("@Kairon:refreshToken");
      if (!refreshToken) {
        throw new Error("No refresh token");
      }

      const { data } = await axios.post(`${API_URL}/auth/refresh`, {
        refreshToken,
      });

      const newToken = data.token;
      const newRefreshToken = data.refreshToken;

      if (!newToken || newToken.split(".").length !== 3) {
        throw new Error("Invalid token received");
      }

      await AsyncStorage.multiSet([
        ["@Kairon:token", newToken],
        ["@Kairon:refreshToken", newRefreshToken],
      ]);

      // 🔁 Atualiza headers
      api.defaults.headers.Authorization = `Bearer ${newToken}`;
      originalRequest.headers.Authorization = `Bearer ${newToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      // 🔥 LIMPA SESSÃO DE VERDADE
      await AsyncStorage.multiRemove([
        "@Kairon:user",
        "@Kairon:token",
        "@Kairon:refreshToken",
      ]);

      return Promise.reject(refreshError);
    }
  }
);