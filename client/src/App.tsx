import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import EventRoom from './pages/EventRoom';
import EventHistory from './pages/EventHistory';
import EventResults from './pages/EventResults';
import MySubmissions from './pages/MySubmissions';
import Admin from './pages/Admin';
import AdminLogin from './pages/AdminLogin';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';

function App() {
  const { user, initialized, checkAuth } = useAuth();

  useEffect(() => {
    if (!initialized) {
      checkAuth();
    }
  }, [initialized, checkAuth]);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-700 to-indigo-800 text-white">
        読み込み中...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <Login />}
        />
        <Route
          path="/admin/login"
          element={user && user.isAdmin ? <Navigate to="/admin" replace /> : <AdminLogin />}
        />
        <Route
          path="/register"
          element={user ? <Navigate to="/" replace /> : <Register />}
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Home />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/event/:eventId"
          element={
            <ProtectedRoute>
              <AppLayout>
                <EventRoom />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/history"
          element={
            <ProtectedRoute>
              <AppLayout>
                <EventHistory />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/:eventId/results"
          element={
            <ProtectedRoute>
              <AppLayout>
                <EventResults />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/my/submissions"
          element={
            <ProtectedRoute>
              <AppLayout>
                <MySubmissions />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <AppLayout>
                <Admin />
              </AppLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
