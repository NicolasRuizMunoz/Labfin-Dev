import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return null; // o un spinner
  return user ? <Outlet /> : <Navigate to="/auth" replace />;
};

export default ProtectedRoute;
