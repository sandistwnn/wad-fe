import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../lib/axios"; // Pastikan sudah benar import 'api'
import { TokenStore } from "../lib/tokenStore";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restore = async () => {
      if (!TokenStore.isLoggedIn()) {
        setLoading(false);
        return;
      }

      try {
        const rfToken = TokenStore.getRefreshToken();
        const { data } = await api.post("/auth/refresh", { refreshToken: rfToken });
        const newToken = data.data.accessToken;
        TokenStore.setAccessToken(newToken);

        const { data: me } = await api.get("/auth/me"); // Interceptor sudah menangani token
        setUser(me.data);
      } catch {
        TokenStore.clear();
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, []);

  // PERUBAHAN: Sekarang menerima satu objek 'credentials'
  const login = useCallback(async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    const resData = response.data; // Ini adalah objek respon utama
    
    // Sesuaikan dengan struktur log yang ada di screenshot:
    // accessToken dan refreshToken ada di level atas (root)
    // user/userData biasanya ada di dalam resData.data
    const accessToken = resData.accessToken;
    const refreshToken = resData.refreshToken;
    const userData = resData.data; // Mengambil user dari resData.data

    console.log("Debug Auth:", { accessToken, userData }); // Cek apakah sudah muncul

    TokenStore.setAccessToken(accessToken);
    TokenStore.setRefreshToken(refreshToken);
    
    // Set user ke state
    setUser(userData); 
  }, []);

  const register = useCallback(async (userData) => {
    // userData berisi { name, email, password }
    await api.post("/auth/register", userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      const rfToken = TokenStore.getRefreshToken();
      // Gunakan 'api' bukan 'axios'
      await api.post("/auth/logout", { refreshToken: rfToken });
    } catch { /* abaikan error logout */ }
    TokenStore.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus digunakan di dalam AuthProvider");
  return ctx;
}