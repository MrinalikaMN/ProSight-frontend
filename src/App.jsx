import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import axios from 'axios';

import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Warnings from './pages/Warnings';
import Team from './pages/Team';
import Login from './pages/Login';
import Register from './pages/Register';

// Bulletproof Interceptor - checks all common token keys
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('jwt') || localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('jwt') || localStorage.getItem('accessToken');
    if (token) setIsAuthenticated(true);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleLogout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
    window.location.href = '/login';
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading App...</div>;
  }

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
        
        {isAuthenticated && (
          <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
              <div className="flex items-center gap-8">
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">ProSight</span>
                <div className="hidden md:flex gap-6">
                  <Link to="/" className="font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors">Dashboard</Link>
                  <Link to="/projects" className="font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors">Projects</Link>
                  <Link to="/team" className="font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors">Team</Link>
                  <Link to="/warnings" className="font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors">Warnings</Link>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsDarkMode(!isDarkMode)} 
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-lg"
                >
                  {isDarkMode ? '☀️' : '🌙'}
                </button>
                <button 
                  onClick={handleLogout} 
                  className="px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 rounded-xl font-bold transition-colors shadow-sm"
                >
                  Log Out
                </button>
              </div>
            </div>
          </nav>
        )}

        <div className="p-4 md:p-8">
          <Routes>
            <Route path="/login" element={!isAuthenticated ? <Login setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/" />} />
            <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
            <Route path="/" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/projects" element={isAuthenticated ? <Projects /> : <Navigate to="/login" />} />
            <Route path="/team" element={isAuthenticated ? <Team /> : <Navigate to="/login" />} />
            <Route path="/warnings" element={isAuthenticated ? <Warnings /> : <Navigate to="/login" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}