import React, { useState, useRef, useEffect } from 'react';

export default function Topbar({ darkMode, setDarkMode, onLogout }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch actual user details from browser memory
  const username = localStorage.getItem("username") || "User";
  const userRole = localStorage.getItem("userRole") || "MEMBER";
  
  // Create a 2-letter avatar from the username
  const userInitials = username.substring(0, 2).toUpperCase();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-24 px-8 flex justify-end items-center border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors duration-300 z-50 relative">
      
      <div className="relative" ref={dropdownRef}>
        <button 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-3 p-1.5 pr-4 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all bg-white dark:bg-slate-900 shadow-sm"
        >
          <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-inner tracking-wider">
            {userInitials}
          </div>
          <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{username}</span>
          <svg className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50 py-2 animate-in fade-in slide-in-from-top-2">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 mb-2">
              <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{username}</p>
              <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">{userRole}</p>
            </div>
            
            <button
              onClick={() => {
                setDarkMode(!darkMode);
                setIsDropdownOpen(false);
              }}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
              <span>{darkMode ? '☀️' : '🌙'}</span>
            </button>
            
            <button 
              onClick={onLogout}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors mt-1"
            >
              <span>Sign Out</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}