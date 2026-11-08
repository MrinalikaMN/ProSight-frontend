import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Layout from './components/Layout';
import { ToastProvider } from './components/Toast';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Warnings from './pages/Warnings';
import Team from './pages/Team';
import Login from './pages/Login';
import Register from './pages/Register';
import Report from './pages/Report';
import Settings from './pages/Settings';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('token'));

  const handleLogout = () => {
    // Keep the theme choice; clear everything else.
    const theme = localStorage.getItem('prosight-theme');
    localStorage.clear();
    if (theme) localStorage.setItem('prosight-theme', theme);
    setIsAuthenticated(false);
  };

  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <Login setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/" replace />} />
          <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" replace />} />
          <Route element={isAuthenticated ? <Layout onLogout={handleLogout} /> : <Navigate to="/login" replace />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/warnings" element={<Warnings />} />
            <Route path="/team" element={<Team />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="/report" element={isAuthenticated ? <Report /> : <Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}
