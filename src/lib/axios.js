import axios from "axios";
import { TokenStore } from "./tokenStore";

// Instance utama untuk semua request API
const api = axios.create({
  // V-- UBAH BARIS INI --V
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/v1` : "http://localhost:3000/api/v1",
  
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// ── REQUEST INTERCEPTOR ──────────────────────────────────
// Sisipkan access token ke header setiap request
api.interceptors.request.use(
  (config) => {
    const token = TokenStore.getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── RESPONSE INTERCEPTOR ─────────────────────────────────
// Tangani 401 dengan refresh token otomatis
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const orig = error.config;

    if (error.response?.status === 401 && !orig._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          orig.headers.Authorization = `Bearer ${token}`;
          return api(orig);
        });
      }

      orig._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = TokenStore.getRefreshToken();
        if (!refreshToken) throw new Error("No refresh token");

        // Perhatikan ini memanggil /auth/refresh (pastikan di backend rutenya sesuai)
        const { data } = await axios.post("/auth/refresh", { refreshToken });
        const newToken = data.data.accessToken;
        
        TokenStore.setAccessToken(newToken);
        
        // ── KODE BARU DITAMBAHKAN DI SINI ─────────────────────────
        // Beri tahu Socket.IO (dan komponen lain) bahwa token baru saja diperbarui
        window.dispatchEvent(new CustomEvent("token:refreshed", {
          detail: { token: newToken }
        }));
        // ──────────────────────────────────────────────────────────

        processQueue(null, newToken);

        orig.headers.Authorization = `Bearer ${newToken}`;
        return api(orig);
      } catch (err) {
        processQueue(err, null);
        TokenStore.clear();
        window.location.href = "/login";
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;