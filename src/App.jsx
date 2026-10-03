import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Journey from './pages/Journey';
import DailySurprise from './pages/DailySurprise';
import Birthday from './pages/Birthday';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import MusicPlayer from './components/MusicPlayer';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navigate } from 'react-router-dom';

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <>
      {user && <MusicPlayer />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={user ? <Home /> : <Navigate to="/login" replace />} />
        <Route path="/journey" element={user ? <Journey /> : <Navigate to="/login" replace />} />
        <Route path="/day/:dayNumber" element={user ? <DailySurprise /> : <Navigate to="/login" replace />} />
        <Route path="/birthday" element={user ? <Birthday /> : <Navigate to="/login" replace />} />
        <Route path="/admin" element={user?.role === 'OWNER' ? <AdminDashboard /> : <Navigate to={user ? '/' : '/login'} replace />} />
        <Route path="*" element={<Navigate to={user ? (user.role === 'OWNER' ? '/admin' : '/') : '/login'} replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
