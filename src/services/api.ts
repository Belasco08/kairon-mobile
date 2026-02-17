import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "https://kairon-api.onrender.com";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

/* =========================
   ROTAS PÚBLICAS
========================= */
const AUTH_ROUTES = ["/auth/login", "/auth/register", "/auth/refresh"];


/* =========================
   REQUEST INTERCEPTOR (DEBUG MODE)
========================= */
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Log para entendermos a URL que está sendo chamada
    console.log(`[API Request] 🚀 ${config.method?.toUpperCase()} ${config.url}`);

    // Verifica se é rota pública
    if (AUTH_ROUTES.some((route) => config.url?.includes(route))) {
      console.log(`[API Auth] 🔓 Rota pública detectada. Pulando injeção de token.`);
      return config;
    }

    const token = await AsyncStorage.getItem("@Kairon:token");

    if (token) {
      // Log para ver se o token está íntegro (NÃO mostre isso em produção)
      console.log(`[API Auth] 🔑 Token encontrado (Início): ${token.substring(0, 15)}...`);
      
      // Decodificando payload básico para ver as roles (opcional, ajuda muito)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log(`[API Auth] 👮 Roles no Token:`, payload.roles || payload.authorities || "Nenhuma role encontrada");
        console.log(`[API Auth] ⏳ Expira em:`, new Date(payload.exp * 1000).toLocaleString());
      } catch (e) {
        console.log(`[API Auth] ⚠️ Erro ao decodificar token para debug.`);
      }

      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log(`[API Auth] ❌ Nenhum token encontrado no Storage!`);
    }

    return config;
  },
  (error) => {
    console.error("[API Error] 💥 Erro no Request Interceptor:", error);
    return Promise.reject(error);
  }
);

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
