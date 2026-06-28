import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export function ProtectedRoute() {
  const { user, loading } = useAuth();

  // 1. Tampilkan loading jika status masih memuat sesi
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", marginTop: "4rem" }}>
        <p>Memuat...</p>
      </div>
    );
  }

  console.log("Cek User:", user); // Tambahkan ini
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  // 2. Jika sudah selesai loading tapi user tidak ditemukan, arahkan ke login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Jika sudah login, tampilkan komponen anak (halaman yang diakses)
  return <Outlet />;
}