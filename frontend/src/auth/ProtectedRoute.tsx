import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="p-6">Cargando…</div>;
  if (!user) return <Navigate to="/auth" replace state={{ from: loc }} />;
  return <Outlet />;
}
