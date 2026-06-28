import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { TokenStore } from "../lib/tokenStore";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);

  // ── 1. KONEKSI UTAMA SOCKET.IO ─────────────────────────────────
  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

    const socket = io(SOCKET_URL, {
      auth: { token: TokenStore.getAccessToken() },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[Socket] Terhubung:", socket.id);
      setIsConnected(true);
    });

    socket.on("disconnect", (reason) => {
      console.log("[Socket] Terputus:", reason);
      setIsConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.error("[Socket] Error koneksi:", err.message);
      setIsConnected(false);
    });

    socket.on("users:online", ({ count }) => {
      setOnlineCount(count);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  // ── 2. LISTENER UNTUK REFRESH TOKEN ────────────────────────────
  useEffect(() => {
    const handleTokenRefresh = (e) => {
      if (socketRef.current) {
        console.log("[Socket] Token diperbarui, merefresh koneksi socket...");
        // Update auth token di socket yang sudah terhubung
        socketRef.current.auth = { token: e.detail.token };
        // Reconnect agar server memverifikasi token baru
        socketRef.current.disconnect().connect();
      }
    };

    window.addEventListener("token:refreshed", handleTokenRefresh);
    
    // Cleanup event listener saat komponen unmount
    return () => window.removeEventListener("token:refreshed", handleTokenRefresh);
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected, onlineCount }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error("useSocket harus digunakan di dalam SocketProvider");
  }
  return ctx;
}