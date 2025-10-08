import { ReactElement, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactElement;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, token, isLoading, initialized, checkAuth } = useAuth();

  useEffect(() => {
    if (!initialized) {
      checkAuth();
    }
  }, [initialized, checkAuth]);

  if (!initialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-700 to-indigo-800 text-white">
        読み込み中...
      </div>
    );
  }

  if (!user) {
    if (!token) {
      return <Navigate to="/login" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !user.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
