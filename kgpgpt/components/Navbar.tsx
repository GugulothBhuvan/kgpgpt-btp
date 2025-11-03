'use client';

import { useState, useEffect } from 'react';
import { User, Settings, Moon, Sun, LogOut } from 'lucide-react';

export default function Navbar() {
  const [isDark, setIsDark] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Check theme on mount and listen for changes
  useEffect(() => {
    const checkTheme = () => {
      if (typeof window !== 'undefined') {
        const isDarkMode = document.body.classList.contains('dark');
        setIsDark(isDarkMode);
      }
    };
    
    checkTheme();
    
    // Listen for theme changes
    const observer = new MutationObserver(checkTheme);
    if (document.body) {
      observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }
    
    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.body.classList.toggle('dark', newTheme);
  };

  return (
    <nav className={`sticky top-0 z-50 border-b transition-all duration-200 ${
      isDark 
        ? 'bg-gray-900 border-gray-700 text-white' 
        : 'bg-white border-gray-200 text-gray-900'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-end h-16">
          {/* Right side - Theme toggle and Profile */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-all duration-200 ${
                isDark
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
              }`}
              title={isDark ? "Switch to light theme" : "Switch to dark theme"}
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Profile Section */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className={`flex items-center space-x-3 p-2 rounded-lg transition-all duration-200 ${
                  isDark
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isDark ? 'bg-gradient-to-br from-blue-600 to-purple-600' : 'bg-gradient-to-br from-blue-500 to-purple-500'
                }`}>
                  <User size={16} className="text-white" />
                </div>
                <span className="text-sm font-medium">User</span>
                <Settings size={16} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div className={`absolute right-0 top-full mt-2 w-48 rounded-lg shadow-xl py-1 z-50 ${
                  isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                }`}>
                  <button className={`w-full flex items-center space-x-3 px-4 py-2 text-sm transition-colors ${
                    isDark 
                      ? 'text-gray-300 hover:bg-gray-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}>
                    <User size={16} />
                    <span>Edit Profile</span>
                  </button>
                  <button className={`w-full flex items-center space-x-3 px-4 py-2 text-sm transition-colors ${
                    isDark 
                      ? 'text-gray-300 hover:bg-gray-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}>
                    <Settings size={16} />
                    <span>Preferences</span>
                  </button>
                  <hr className={`my-1 ${isDark ? 'border-gray-700' : 'border-gray-200'}`} />
                  <button className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-400 hover:bg-red-900 hover:bg-opacity-20 transition-colors">
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
