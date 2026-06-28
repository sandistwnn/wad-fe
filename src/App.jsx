import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";
import { NotifProvider } from "./contexts/NotifContext"; // <-- IMPORT BARU
import { ToastContainer } from "./components/ToastContainer"; // <-- IMPORT BARU
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { TasksPage } from "./pages/TasksPage";
import { ProfilePage } from "./pages/ProfilePage";

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <NotifProvider> {/* <-- Bungkus aplikasi dengan NotifProvider */}
          
          {/* ToastContainer dipanggil di sini agar muncul di atas semua halaman */}
          <ToastContainer /> 
          
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Navigate to="/tasks" replace />} />
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
              
              <Route path="*" element={<Navigate to="/tasks" replace />} />
            </Routes>
          </BrowserRouter>
          
        </NotifProvider>
      </SocketProvider>
    </AuthProvider>
  );
}